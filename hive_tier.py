#!/usr/bin/env python3
"""hive_tier.py: set the promotion tier of every draft in drafts/BOARD.json (datro@drafts), metadata only.
Tiers (Hive protocol v3.4.2; readiness is exact-version gated):
  working          drafting rounds (no label row; the cone's base)
  ready            row 1  READY TO SEND             (consensus reached; HubSpot subject starts [READY TO SEND)
  definitely_ready row 2  DEFINITELY READY TO SEND  (final three-hat; subject starts [DEFINITELY READY)
  gmail_draft      row 3  GMAIL DRAFT               (Tab made the in-thread Gmail draft; owner reviews and sends)
  sent_archived    row 4  WAYBACK                   (owner sent it; copy in the email archive / wayback)
gmail_draft_id, sent_at and archive_url are kept once set (set them with --set <draft-id> key=value).
Tiers fail closed: current HubSpot subject + exact-version counters and gate flags must agree; stale higher tiers are demoted when a turn/queue/status change appears. Reads HubSpot subject (hs_task_subject) and exact-version gate metadata in BOARD.json. Never reads or writes email text.
Usage: TAB_TASK_ID=<task> timeout -k 5 300 python3 hive_tier.py [--dry] [--set <draft-id> key=value ...]  — Sion's Tab agent"""
import json, os, sys, time, re, subprocess
sys.path.insert(0, '/home/user/tab/work/site-flywheels/tools')
import gh as G
REPO = 'unclehowell/datro'; BR = 'drafts'; PATH = 'drafts/BOARD.json'
ORDER = ['working', 'ready', 'definitely_ready', 'gmail_draft', 'sent_archived']
LABEL = {'working': 'IN REVIEW', 'ready': 'READY TO SEND', 'definitely_ready': 'DEFINITELY READY TO SEND',
         'gmail_draft': 'GMAIL DRAFT', 'sent_archived': 'WAYBACK'}
TD = f"/home/user/tab/tasks/{os.environ.get('TAB_TASK_ID', 'hive-tier')}"; os.makedirs(TD, exist_ok=True)
def J(x):
    if isinstance(x, str):
        try: return json.loads(x)
        except Exception: return x
    return x
def hubspot_subjects(ids):
    p = f"{TD}/rq_tier_{time.time()}.json"
    json.dump({"toolkit": "hubspot", "method": "POST", "url": "https://api.hubapi.com/crm/v3/objects/tasks/batch/read",
               "body": {"properties": ["hs_task_subject"], "inputs": [{"id": i} for i in ids]}}, open(p, 'w'))
    o = subprocess.run(['timeout', '-k', '5', '110', '/usr/bin/node', '/home/user/tab/connected-apps-cli.mjs', 'connected_apps.request', p], capture_output=True, text=True)
    os.remove(p); r = json.loads(o.stdout).get('result', {}); b = J(r.get('body') or r.get('body_head'))
    return {x['id']: x['properties'].get('hs_task_subject') or '' for x in b['results']}
def same_version(d, field):
    return bool(d.get('version')) and d.get(field) == d.get('version')
def gate_ok(d):
    try:
        reviews = int(d.get('version_reviews'))
        agents = int(d.get('version_distinct_agents'))
    except (TypeError, ValueError):
        return False
    return (reviews >= 10 and agents >= 4 and int(d.get('open_issues') if d.get('open_issues') is not None else 1) == 0
            and same_version(d, 'seat_agreements_version'))
def final_ok(d):
    return gate_ok(d) and same_version(d, 'final_three_hat_version') and same_version(d, 'attachments_verified_version')
def tier_from_subject(s, d):
    # Current HubSpot prefix is a claim, not proof; every higher tier must pass its current-version gate.
    labels = [lab.strip().upper() for lab in re.findall(r"\[([^\]]+)\]", s or '')]
    if any(lab.startswith('SENT') for lab in labels):
        return 'sent_archived' if (d.get('sent_at') and d.get('archive_url') and same_version(d, 'sent_version')) else 'working'
    if any(lab.startswith('GMAIL DRAFT') for lab in labels):
        return 'gmail_draft' if (d.get('gmail_draft_id') and final_ok(d)) else 'working'
    if any(lab.startswith('DEFINITELY READY') for lab in labels):
        return 'definitely_ready' if final_ok(d) else 'working'
    if any(lab.startswith('READY TO SEND') for lab in labels):
        return 'ready' if gate_ok(d) else 'working'
    return 'working'
def head():
    st, x = G.gh('GET', f'/repos/{REPO}/git/ref/heads/{BR}'); x = J(x)
    return x['object']['sha'] if isinstance(x, dict) else re.search(r'"sha":\s*"([0-9a-f]{40})"', x).group(1)
def main():
    dry = '--dry' in sys.argv; sets = {}
    if '--set' in sys.argv:
        a = sys.argv[sys.argv.index('--set') + 1:]; did = a[0]
        sets[did] = dict(kv.split('=', 1) for kv in a[1:] if '=' in kv)
    for rnd in range(4):
        h = head(); board = json.loads(G.raw(REPO, h, PATH))
        ids = [d['record'].split()[-1] for d in board['drafts'] if d.get('record', '').startswith('HubSpot task')]
        subj = hubspot_subjects(ids); now = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()); changed = []
        for d in board['drafts']:
            rid = d.get('record', '').split()[-1]
            for k, v in sets.get(d['id'], {}).items(): d[k] = v
            t = tier_from_subject(subj.get(rid, ''), d)
            old = d.get('tier')
            requested = sets.get(d['id'], {}).get('tier')
            if requested in ORDER:
                if requested == 'working': t = 'working'
                elif requested == 'ready' and gate_ok(d): t = 'ready'
                elif requested == 'definitely_ready' and final_ok(d): t = 'definitely_ready'
                elif requested == 'gmail_draft' and d.get('gmail_draft_id') and final_ok(d): t = 'gmail_draft'
                elif requested == 'sent_archived' and d.get('sent_at') and d.get('archive_url') and same_version(d, 'sent_version'): t = 'sent_archived'
                else: t = 'working'
            if old != t: d['tier_since'] = now; changed.append((d['id'], old, t))
            d['tier'] = t; d['tier_label'] = LABEL[t]
            d.setdefault('tier_since', now); d.setdefault('gmail_draft_id', None); d.setdefault('sent_at', None); d.setdefault('archive_url', None)
            d.setdefault('version_reviews', None); d.setdefault('version_distinct_agents', None); d.setdefault('version_agents', [])
            d.setdefault('seat_agreements_version', None); d.setdefault('final_three_hat_version', None)
            d.setdefault('attachments_verified_version', None); d.setdefault('sent_version', None)
        board['tiers'] = [{'tier': k, 'label': LABEL[k], 'row': i} for i, k in enumerate(ORDER)]
        board['tier_note'] = ('Promotion pyramid (Hive protocol v3.2.0): working (drafting rounds) -> row 1 READY TO SEND (consensus) -> '
                              'row 2 DEFINITELY READY TO SEND (final three-hat) -> row 3 GMAIL DRAFT (Tab creates the in-thread Gmail draft only after '
                              'DEFINITELY READY TO SEND; the project owner reviews and sends) -> row 4 WAYBACK (sent, archived on email. and wayback.). '
                              'Set by work/watch/hive_tier.py from the HubSpot subject only when exact-version review/seat/final/attachment gates pass. Historical counters never qualify the current version; flags and IDs are metadata-only proofs of completed checks.')
        new = json.dumps(board, ensure_ascii=False, indent=1) + '\n'
        old_txt = G.raw(REPO, h, PATH)
        if new.strip() == old_txt.strip(): print(json.dumps({'status': 'unchanged', 'head': h[:7]})); return
        if dry: print(json.dumps({'status': 'dry', 'changed': changed})); return
        st, hc = G.gh('GET', f'/repos/{REPO}/git/commits/{h}'); hc = J(hc)
        bt = hc['tree']['sha'] if isinstance(hc, dict) else re.search(r'"tree":\{"sha":"([0-9a-f]{40})"', hc).group(1)
        st, t = G.gh('POST', f'/repos/{REPO}/git/trees', {'base_tree': bt, 'tree': [{'path': PATH, 'mode': '100644', 'type': 'blob', 'content': new}]}); t = J(t)
        tsha = t['sha'] if isinstance(t, dict) else re.search(r'"sha":"([0-9a-f]{40})"', t).group(1)
        msg = 'drafts: BOARD.json promotion tiers (' + (', '.join(f'{a}: {c}' for a, b, c in changed) or 'labels') + ') — Sion\'s Tab agent'
        st, c = G.gh('POST', f'/repos/{REPO}/git/commits', {'message': msg[:300], 'tree': tsha, 'parents': [h]}); c = J(c)
        csha = c['sha'] if isinstance(c, dict) else re.search(r'"sha":"([0-9a-f]{40})"', c).group(1)
        st, u = G.gh('PATCH', f'/repos/{REPO}/git/refs/heads/{BR}', {'sha': csha, 'force': False})
        if st == 200: print(json.dumps({'status': 'pushed', 'commit': csha[:7], 'changed': changed})); return
        time.sleep(5)
    raise SystemExit('could not fast-forward')
if __name__ == '__main__': main()
