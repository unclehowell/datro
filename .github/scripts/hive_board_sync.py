#!/usr/bin/env python3
"""Hive board auto-sync: refresh drafts/BOARD.json (branch drafts) from the HubSpot hive tasks, every 4 hours.
Metadata only: reads each HubSpot task's subject and hs_lastmodifieddate, and its body only to count changelog reviews of the
current version for % complete (no body text is ever written); never writes to HubSpot.
Refreshes status / version / whose turn / last change of every board draft, adds hive-format draft tasks created in
the last SYNC_DAYS days that are missing from the board, stamps synced_at, validates the JSON before writing and
refuses to touch a board file that does not parse. Writes only when something changed (the workflow commits only then).
Ported from work/watch/board_sync.py (27 Oct 2026). Env: HUBSPOT_TOKEN (repo secret), BOARD (path), SYNC_DAYS (3),
DRY=1 for a dry run. Exit 0 = written or unchanged; exit 0 with a warning = no token yet; exit 1 = refused (board unreadable, HubSpot error).
"""
import json, os, re, sys, time, unicodedata, urllib.request, urllib.error

BOARD = os.environ.get('BOARD', 'board/drafts/BOARD.json')
DAYS = float(os.environ.get('SYNC_DAYS', '3'))
HIVE = re.compile(r"^\[(TURN|OTHER AGENT|READY|DEFINITELY|GMAIL DRAFT|SENT|TAB'S TURN)", re.I)
API = 'https://api.hubapi.com'
BATCH = int(os.environ.get('SYNC_BATCH', '100'))   # tasks per HubSpot call (HubSpot allows 100)


def hs(method, path, body=None):
    """One HubSpot call with the private-app token. The token never leaves this function and is never printed."""
    tok = os.environ.get('HUBSPOT_TOKEN', '').strip()
    data = json.dumps(body).encode() if body is not None else None
    for attempt in range(4):
        req = urllib.request.Request(API + path, data=data, method=method,
                                     headers={'Authorization': 'Bearer ' + tok, 'Content-Type': 'application/json'})
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                return r.status, json.loads(r.read().decode() or '{}')
        except urllib.error.HTTPError as e:
            if e.code in (429, 500, 502, 503, 504) and attempt < 3:
                time.sleep(5 * (attempt + 1)); continue
            raise SystemExit(f'HubSpot answered {e.code} on {method} {path.split("?")[0]}; nothing written')
        except urllib.error.URLError as e:
            if attempt < 3: time.sleep(5 * (attempt + 1)); continue
            raise SystemExit(f'HubSpot unreachable ({e.reason}); nothing written')


def read(ids):
    out = {}
    ids = list(ids)
    for k in range(0, len(ids), BATCH):
        st, b = hs('POST', '/crm/v3/objects/tasks/batch/read',
                   {'properties': ['hs_task_subject', 'hs_lastmodifieddate', 'hs_task_body'], 'inputs': [{'id': i} for i in ids[k:k + BATCH]]})
        for x in (b or {}).get('results', []):
            out[str(x['id'])] = x.get('properties') or {}
    return out


def recent(days):
    ms = str(int((time.time() - days * 86400) * 1000)); found = {}; after = None
    for _ in range(50):
        body = {'filterGroups': [{'filters': [{'propertyName': 'hs_createdate', 'operator': 'GTE', 'value': ms}]}],
                'properties': ['hs_task_subject', 'hs_lastmodifieddate'], 'limit': BATCH,
                'sorts': [{'propertyName': 'hs_createdate', 'direction': 'DESCENDING'}]}
        if after: body['after'] = after
        st, b = hs('POST', '/crm/v3/objects/tasks/search', body); b = b or {}
        for x in b.get('results', []):
            found[str(x['id'])] = x.get('properties') or {}
        after = ((b.get('paging') or {}).get('next') or {}).get('after')
        if not after: break
        time.sleep(0.3)
    return found


def scrub(s):
    """Public-page hygiene for anything this job writes: no email addresses, no phone-like numbers, no owner's name."""
    s = str(s or '')
    s = re.sub(r'[\w.+-]+@[\w-]+(\.[\w-]+)+', '[address]', s)
    s = re.sub(r'\+?\d[\d \-()]{8,}\d', '[number]', s)
    s = re.sub(r"\bSion(?: Hywel)?(?: Buckler)?('s)?\b", lambda m: 'the owner' + (m.group(1) or ''), s)
    return s


# ---- hive % complete (shared by board_sync / hive_board_sync / pct.py; keep the copies identical) ----
# pct = round(100*(0.7*min(reviews,10)/10 + 0.3*min(agents,4)/4)) on the exact current frozen version; capped at 95
# until the task is READY (or later) AND its Gmail draft exists (gmail_draft_id), then 100; SENT rows are 100 and show "Sent".
# reviews/agents are counted from the task's append-only changelog, read only; no body text is ever returned or stored.
PCT_AGENTS = ['ChatGPT', 'Grok', 'Claude', 'SpaceXSI', 'Gemini', 'Tab']
PCT_RULE = ("% complete = progress through the review gate on the exact current frozen version: "
            "pct = round(100 x (0.7 x min(version_reviews,10)/10 + 0.3 x min(version_distinct_agents,4)/4)). "
            "version_reviews / version_distinct_agents / version_agents are counted from each HubSpot task's signed changelog "
            "(material reviews of the current version only; creation, skips, routes and restores are not reviews; a signed "
            "version_reviews=N tally in the changelog is honoured when higher). Capped at 95 until the task is READY TO SEND or later "
            "AND its Gmail draft exists (gmail_draft_id); then 100 = in the owner's Gmail, ready to send or schedule. SENT rows show Sent. "
            "Historical reviews/distinct_agents/agents are informational only. Promotion gates beyond IN REVIEW (open_issues=0, "
            "seat_agreements_version, final_three_hat_version, attachments_verified_version equal to version) still fail closed.")
_PCT_EXCL = re.compile(r"not a review|no review counted|\bskip(?:ped)?\b|^\W*restore|imported from|baseline|proposal \(not a review\)|seat request", re.I)

def _pct_canon(name):
    n = (name or '').strip().lower()
    if n.startswith("sion's tab"): return 'Tab'
    for a in PCT_AGENTS:
        if n.startswith(a.lower()): return a
    return None

def version_gate(body, version):
    """(reviews, distinct_agents, agents) for `version` from the task body's changelog. Returns None if no changelog."""
    b = body or ''; v = (version or '').strip()
    if not v: return None
    i = -1
    for h in ('CHANGELOG / GUEST BOOK', 'CHANGELOG (append', 'CHANGELOG'):
        i = b.find(h)
        if i >= 0: break
    if i < 0: return None
    ve = re.escape(v) + r"(?![\d.])"
    rev_re = re.compile(r"(?:review(?:ed|s|ing)?|agree(?:s|d)?)\W{0,3}(?:(?:of|on|with|the|exact|frozen|current|version)\W+|[A-Za-z][\w-]*\s+(?=v\d)){0,4}" + ve, re.I)
    tally_re = re.compile(r"version_reviews\s*[=:]\s*(\d+)", re.I)
    n = 0; agents = set(); tally = 0; tally_agents = set()
    for line in b[i:].split('\n'):
        s = line.strip()
        if not s.startswith(('-', '[', '\u2022')) or '|' not in s or not re.search(ve, s): continue
        fields = [f.strip() for f in s.lstrip('-\u2022 ').split('|')]
        who = next((_pct_canon(f) for f in fields[1:4] if _pct_canon(f)), None)
        if who is None and "sion's tab agent" in s.lower(): who = 'Tab'
        if _PCT_EXCL.search(s): continue
        first_is_v = bool(re.match(ve + r"\s*$", fields[0]))
        no_change = re.search(r"no recipient-facing text change|changes?:\s*none|changed:\s*none|text unchanged|no text change", s, re.I)
        if first_is_v:   # this entry wrote `version`: it reviews it only if it changed no recipient-facing text
            is_rev = bool(no_change and (re.search(r"material review|independent review|\bAGREE\b", s, re.I) or rev_re.search(s)))
        else:            # an entry on another version (or a bracket entry) reviews `version` if it says so, not as a "next" ask
            is_rev = any(not re.search(r"(?:next|to (?:independently )?|will|should|pending|awaiting|asks?|request(?:ed)?)\W[^|]{0,40}$", s[max(0, m.start() - 45):m.start()], re.I)
                         for m in rev_re.finditer(s))
        if is_rev:
            n += 1
            if who: agents.add(who)
        m = tally_re.search(s)
        if m and int(m.group(1)) > tally:
            tally = int(m.group(1))
            am = re.search(r"version_agents\s*[=:]\s*\[([^\]]*)\]", s)
            tally_agents = {a for a in (_pct_canon(x.strip(' "\'')) for x in (am.group(1).split(',') if am else [])) if a}
    reviews = max(n, tally); ag = sorted(agents | tally_agents)
    return reviews, len(ag), ag

def pct_of(reviews, distinct, status, tier=None, gmail_draft_id=None):
    st = (status or '').upper()
    if st.startswith('SENT') or tier == 'sent_archived': return 100
    raw = int(100 * (0.7 * min(reviews or 0, 10) / 10 + 0.3 * min(distinct or 0, 4) / 4) + 0.5)
    ready = st.startswith(('READY', 'DEFINITELY', 'GMAIL DRAFT')) or tier in ('ready', 'definitely_ready', 'gmail_draft')
    if ready and gmail_draft_id: return 100
    return min(raw, 95)

def apply_progress(d, body, now):
    """Set version_reviews / version_distinct_agents / version_agents / pct / pct_at on one board row. True if changed."""
    before = (d.get('version_reviews'), d.get('version_distinct_agents'), d.get('version_agents'), d.get('pct'))
    g = version_gate(body, d.get('version'))
    r, a, ag = g if g else (0, 0, [])
    d['version_reviews'], d['version_distinct_agents'], d['version_agents'] = r, a, ag
    d['pct'] = pct_of(r, a, d.get('status'), d.get('tier'), d.get('gmail_draft_id'))
    changed = before != (r, a, ag, d['pct'])
    if changed or not d.get('pct_at'): d['pct_at'] = now
    return changed
# ---- end hive % complete ----


def parse(subj):
    labs = re.findall(r"\[([^\]]+)\]", subj or ''); first = labs[0] if labs else ''
    vm = re.search(r"\bv(\d+\.\d+\.\d+)\b", ' '.join(labs)); ver = ('v' + vm.group(1)) if vm else None
    if any(l.upper().startswith('SENT') for l in labs): return 'SENT', ver, None
    m = re.match(r"TURN:\s*([A-Za-z0-9]+)", first)
    if m: return f"TURN: {m.group(1)}", ver, m.group(1)
    if first.upper().startswith("TAB'S TURN"): return 'TURN: Tab', ver, 'Tab'
    if first.upper().startswith("OTHER AGENT'S TURN"): return "OTHER AGENT'S TURN", ver, 'any other agent'
    return scrub(first.split(' v')[0].strip()), ver, None


def slug(s):
    return re.sub(r'[^a-z0-9]+', '-', unicodedata.normalize('NFKD', s).encode('ascii', 'ignore').decode().lower()).strip('-')[:48].strip('-')


def org_of(subj):
    rest = re.sub(r"^GHF · Send:\s*", "", re.sub(r"^(\[[^\]]+\]\s*)+", "", subj)); seg = re.split(r"\s+—\s+", rest)
    org = re.split(r"\s+[—:]\s+|:\s", rest)[0].strip()
    if org.upper() == 'WDTK' and len(seg) > 1: org = 'WDTK — ' + re.split(r":\s", seg[1])[0].strip()
    return scrub(org)[:100]


def sync(board, now):
    stamp = f' (per HubSpot subject, read {now[:16]}Z)'
    rec = lambda d: (d.get('record') or '').split()[-1] if (d.get('record') or '').startswith('HubSpot task') else None
    on = {rec(d): d for d in board['drafts'] if isinstance(d, dict) and rec(d)}
    purged = {rec(p) for p in board.get('purged', []) if isinstance(p, dict) and rec(p)}
    cur = read(on); changed = []
    for rid, d in on.items():
        p = cur.get(rid)
        if not p or not p.get('hs_task_subject'): continue
        stt, ver, turn = parse(p['hs_task_subject']); before = (d.get('status'), d.get('version'))
        if ver: d['version'] = ver
        d['status'] = stt
        if turn and not (d.get('turn') or '').startswith(turn): d['turn'] = turn + stamp
        lm = (p.get('hs_lastmodifieddate') or '')[:19] + 'Z'
        if len(lm) > 1 and lm > (d.get('last_change') or ''):
            d['last_change'] = lm
            if before == (d['status'], d['version']): changed.append(f"{d.get('id')}: edited")
        if before != (d['status'], d['version']): changed.append(f"{d.get('id')}: {before[0]} {before[1]} -> {d['status']} {d['version']}")
        if p.get('hs_task_body') and apply_progress(d, p.get('hs_task_body'), now):   # body read for counting only; never stored
            changed.append(f"{d.get('id')}: {d['pct']}% ({d['version_reviews']} reviews, {d['version_distinct_agents']} agents on {d.get('version')})")
    if board.get('pct_rule') != PCT_RULE:
        board['pct_rule'] = PCT_RULE; changed.append('pct rule')
    rec_new = recent(DAYS)
    new = {i: p for i, p in rec_new.items() if HIVE.match(p.get('hs_task_subject') or '') and i not in on and i not in purged
           and 'CEDWYN MOVIE' not in (p.get('hs_task_subject') or '')}
    ids = {d.get('id') for d in board['drafts'] if isinstance(d, dict)}
    for i, p in sorted(new.items()):
        s = p['hs_task_subject']; stt, ver, turn = parse(s); org = org_of(s)
        did = f"{slug(org)}-{i[-6:]}"
        if did in ids: continue
        board['drafts'].append({'id': did, 'record': f'HubSpot task {i}', 'version': ver or 'v0.1.0', 'status': stt,
            'turn': (turn or 'see HubSpot') + stamp, 'open_issues': None,
            'last_change': ((p.get('hs_lastmodifieddate') or now)[:19] + 'Z').replace('ZZ', 'Z'), 'last_agent': None,
            'rounds': None, 'tier_since': now, 'tier': 'working', 'tier_label': 'IN REVIEW', 'gmail_draft_id': None,
            'sent_at': None, 'archive_url': None, 'version_reviews': None, 'version_distinct_agents': None,
            'version_agents': [], 'seat_agreements_version': None, 'final_three_hat_version': None,
            'attachments_verified_version': None, 'sent_version': None,
            'context': {'body': org, 'as_of': now, 'note': 'Board entry added from the HubSpot subject by the 4-hourly board sync; no context pack yet. Metadata only.'}})
        ids.add(did); changed.append(f'added {did}')
    return changed


def main():
    if not os.environ.get('HUBSPOT_TOKEN', '').strip():
        # A warning, not a failure: a failed scheduled run would email the repo owner every 4 hours.
        print('::warning::HUBSPOT_TOKEN secret is not set on this repository; nothing read, nothing written'); sys.exit(0)
    with open(BOARD, encoding='utf-8') as f: old_txt = f.read()
    try: board = json.loads(old_txt)
    except Exception as e: raise SystemExit(f'BOARD.json is not valid JSON ({str(e)[:120]}); refusing to sync. Restore it from the last valid commit first.')
    if not isinstance(board, dict) or not isinstance(board.get('drafts'), list): raise SystemExit('BOARD.json has no drafts list; refusing to sync')
    n0 = len(board['drafts'])
    now = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
    changed = sync(board, now)
    if not changed:
        print(json.dumps({'status': 'unchanged', 'drafts': n0})); return
    board['updated'] = now
    board['synced_at'] = now
    board['sync'] = {'by': 'GitHub Actions workflow hive-board-sync (cron 0 */4 * * *)', 'source': 'HubSpot task subjects and hs_lastmodifieddate (metadata); changelog review counts for % complete (no body text stored)', 'last_changes': len(changed)}
    board.setdefault('events', []).append({'at': now, 'draft': None, 'version': None, 'agent': 'board-sync',
        'event': 'Board sync from HubSpot subjects: ' + scrub('; '.join(changed))[:900] + '. Metadata only.'})
    txt = json.dumps(board, ensure_ascii=False, indent=2) + '\n'
    chk = json.loads(txt)   # never write a file that fails to parse
    assert isinstance(chk.get('drafts'), list) and len(chk['drafts']) >= n0, 'sync would drop drafts; refusing'
    if os.environ.get('DRY'):
        print(json.dumps({'status': 'dry', 'changes': changed[:40], 'n': len(changed), 'drafts': len(chk['drafts'])})); return
    tmp = BOARD + '.tmp'
    with open(tmp, 'w', encoding='utf-8') as f: f.write(txt)
    with open(tmp, encoding='utf-8') as f: json.loads(f.read())
    os.replace(tmp, BOARD)
    print(json.dumps({'status': 'written', 'changes': len(changed), 'drafts': len(chk['drafts'])}))


if __name__ == '__main__':
    main()
