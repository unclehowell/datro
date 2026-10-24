#!/usr/bin/env python3
"""Hive context packs: one metadata-only "context" object per draft in datro@drafts drafts/BOARD.json.
Reads the dartboard roadmap (stage, next deadline, markers, rungs spent), the email archive API (thread link)
and qa kb.json (item count per body). No email text. Run: TAB_TASK_ID=$TAB_TASK_ID timeout -k 5 300 python3 work/watch/hive_context.py [--dry]
Re-run whenever BOARD.json gains a draft or the dartboard refreshes.
Public text on fees always reads: fee requests are noted (£), a written quote or estimate may be requested and considered, nothing is agreed, contracted or committed to, and every free route is pursued in parallel. — Sion's Tab agent"""
import json, sys, re, time, hashlib, urllib.request, urllib.parse
sys.path.insert(0, '/home/user/tab/work/site-flywheels/tools'); import gh
REPO, BR, PATH = 'unclehowell/datro', 'drafts', 'drafts/BOARD.json'
DART, EMAIL, QA = 'https://bucklerfamily.estate', 'https://email.bucklerfamily.estate', 'https://qa.bucklerfamily.estate'
def get(u):
    with urllib.request.urlopen(urllib.request.Request(u, headers={'User-Agent': 'ghf-hive-context'}), timeout=90) as r: return json.loads(r.read().decode())
# draft id -> (roadmap lane id or None, body name, subject keywords for the thread being answered, kb body name)
MAP = [
  (r'^bp-', 'bp', 'BP', r'preservation', None),
  (r'^cardiff-central-library', 'cardiff-central-library', 'Cardiff Central Library', r'Bute X\.6', None),
  (r'^cardiff-', None, 'Cardiff Council', r'1961|deed', None),
  (r'^hmcts-cardiff-1955-1962-records', 'moj', 'Ministry of Justice / HMCTS', r'preservation notice|1955|1962|Cardiff County Court', 'Ministry of Justice / HMCTS'),
  (r'^rics-022900001630-clarification', None, 'RICS', r'022900001630|preservation notice', None),
  (r'^hmlr-sar-d260928', 'hm-land-registry', 'HM Land Registry', r'D260928|WA231076|WA240304', 'HM Land Registry'),
  (r'^hmlr-sar', 'hm-land-registry', 'HM Land Registry', r'WA735527|735527|WA513690', 'HM Land Registry'),
  (r'^hmlr-eir-20-oct', 'hm-land-registry', 'HM Land Registry', r'20 October|WA231076|WA240304', 'HM Land Registry'),
  (r'^hmlr-wales-office', 'hm-land-registry', 'HM Land Registry (Wales Office)', r'Z084NQV|Wales Office', 'HM Land Registry'),
  (r'^hmlr-customer-support', 'hm-land-registry', 'HM Land Registry', r'customer support|titles held|title list', 'HM Land Registry'),
  (r'^hmlr-.*vg41', 'hm-land-registry', 'HM Land Registry', r'VG41|VG 41', 'HM Land Registry'),
  (r'^hmlr-', 'hm-land-registry', 'HM Land Registry', r'1961', 'HM Land Registry'),
  (r'^vale-', 'vale-of-glamorgan-council', 'Vale of Glamorgan Council', r'VG41|VG 41', 'Vale of Glamorgan Council'),
  (r'^glamorgan-', 'glamorgan-archives', 'Glamorgan Archives', r'VG41|catalogue|1961|1970', 'Glamorgan Archives'),
  (r'^tna-internal-review-cas-347296', 'the-national-archives', 'The National Archives', r'CAS-347296|internal review', 'The National Archives'),
  (r'^tna-foi-resend-22-oct', 'the-national-archives', 'The National Archives', r'location request|resend|22 Oct', 'The National Archives'),
  (r'^tna-', 'the-national-archives', 'The National Archives', r'commons|1960|LAR', 'The National Archives'),
  (r'^nlw-research-enquiry', 'nlw', 'National Library of Wales', r'Bute Estate|Research enquiry|ITV Wales database', 'National Library of Wales'),
  (r'^cadw-ticket-628912926', 'cadw', 'Cadw / Welsh Government', r'628912926|Llandough Roman villa|1983 fire', 'Cadw / Welsh Government'),
  (r'^heneb-her-villa-foi', 'her', 'Heneb (former GGAT)', r'Llandough Roman villa|1983 fire|628912926', 'Heneb (former GGAT)'),
  (r'^heneb-complaint-outcome', 'heneb', 'Heneb (former GGAT)', r'complaint|outcome|formal complaint', 'Heneb (former GGAT)'),
  (r'^swp-internal-review-1188-26', 'swp', 'South Wales Police', r'1188/26|internal review', 'South Wales Police'),
  (r'^swp-foi-1264-26', 'swp', 'South Wales Police', r'1264/26|FOI 1264', 'South Wales Police'),
  (r'^llandough-cc-internal-review', 'llandough', 'Llandough Community Council', r'internal review|section 12|11 October', 'Llandough Community Council'),
  (r'^itv-foi-archive-footage', 'itv', 'ITV Archive', r'BP vs Buckler 1987|Great House Farm|archive footage', None),
  (r'^ico-s50-museum-wales', None, "Information Commissioner's Office", r'FOI 2026-024|Museum Wales|s50', "Information Commissioner's Office"),
  (r'^defra-foi-eir-20-oct', None, 'Defra (Information Rights)', r'FOI/EIR|20 Oct|Defra', None),
  (r'^church-in-wales-rb-property', None, 'Church in Wales', r'Representative Body|property', None),
]
def pack(d, lanes, wheel, darts, kb, source_versions):
    built_at = time.strftime('%Y-%m-%dT%H:%MZ', time.gmtime())
    hit = next((m for m in MAP if re.search(m[0], d['id'])), None)
    if not hit:
        return {
            'body': None, 'as_of': built_at, 'source_versions': source_versions,
            'archive': {'lookup_status': 'SEARCH_REQUIRED', 'note': 'recipient mapping missing; search archive before review'},
            'dartboard': {'url': DART + '/#roadmap', 'lane': None, 'note': 'recipient mapping missing; no lane verified'},
            'stage': None, 'next_deadline': None, 'markers': {'red_fish': 0, 'red_house': 0, 'fee': False},
            'open_questions': None, 'rungs_spent': [], 'kb_items': 0,
            'note': 'no recipient mapping yet; add a mapping before review'
        }
    _, lid, body, kw, kbname = hit
    L = lanes.get(lid) if lid else None
    c = {'body': body, 'as_of': built_at, 'source_versions': source_versions}
    c['archive'] = {
        'search': f'{EMAIL}/api/search?q=' + urllib.parse.quote(body.split(' (')[0]),
        'lookup_status': 'SEARCH_REQUIRED'
    }
    c['kb_items'] = kb.get(kbname, 0) if kbname else 0
    if not L:
        c['dartboard'] = {'url': DART + '/#roadmap', 'lane': None, 'note': 'no matching lane in the current roadmap; confirm the escalation route before review'}
        c['stage'] = 'not yet on the dartboard'
        c['next_deadline'] = None
        c['markers'] = {'red_fish': 0, 'red_house': 0, 'fee': False}
        c['open_questions'] = None
        c['rungs_spent'] = []
        c['note'] = 'no matching dartboard lane; keep IN REVIEW until the route is identified or the exception is explicitly resolved'
        return c

    ems = L.get('emails') or []
    th = [e for e in ems if re.search(kw, e.get('subject') or '', re.I)]
    last = th[-1] if th else None
    if not last:
        c['archive']['thread'] = None
        c['archive']['note'] = 'no matching thread in lane metadata; complete the archive search before review'
        c['archive']['lookup_status'] = 'SEARCH_REQUIRED'
    elif str(last.get('id', '')).startswith('gm-'):
        gid = last['id'][3:]
        c['archive']['thread'] = f'{EMAIL}/reference/{gid}'
        try:
            m = get(f'{EMAIL}/api/message?id={last["id"]}')
            if m.get('threadSlug'):
                c['archive']['api_thread'] = f'{EMAIL}/api/thread?slug=' + m['threadSlug']
                c['archive']['lookup_status'] = 'MESSAGE_LOOKUP_OK'
            else:
                c['archive']['lookup_status'] = 'MESSAGE_LOOKUP_NO_THREADSLUG'
        except Exception:
            c['archive']['lookup_status'] = 'MESSAGE_LOOKUP_FAILED'
        c['archive']['thread_last'] = {'date': last.get('date'), 'dir': last.get('dir'), 'class': last.get('cls')}
    else:
        c['archive']['thread'] = None
        c['archive']['note'] = 'lane email id format unsupported; complete the archive search before review'
        c['archive']['lookup_status'] = 'UNSUPPORTED_MESSAGE_ID'

    lin = [e for e in ems if e.get('dir') == 'received']
    lout = [e for e in ems if e.get('dir') == 'sent']
    c['last_in'] = lin[-1]['date'] if lin else None
    c['last_out'] = lout[-1]['date'] if lout else None
    n = next((wheel[i] for i in darts.get(lid, []) if i in wheel), None)
    c['dartboard'] = {'url': f'{DART}/?r={n}#roadmap' if n else f'{DART}/#roadmap', 'lane': lid, 'wheel_number': n}
    today = time.strftime('%Y-%m-%d', time.gmtime())
    steps = L.get('steps') or []
    done = sorted([s for s in steps if s.get('status') == 'done'], key=lambda s: s.get('date') or '')
    c['stage'] = (done[-1]['label'] + (' (' + done[-1]['date'] + ')' if done[-1].get('date') else '')) if done else 'no rung reached yet'
    cand = [(s['date'], s.get('label')) for s in steps if s.get('status') == 'pending' and (s.get('date') or '') > today]
    cand += [(f['date'], (f.get('ref') or f.get('id') or '') + ' (red ' + str(f.get('icon')) + ')') for f in (L.get('fails') or []) if (f.get('date') or '') >= today]
    cand += [(x.get('d'), 'expected reply: ' + str(x.get('k') or x.get('t') or '')) for x in (L.get('expected') or []) if isinstance(x, dict) and (x.get('d') or '') >= today]
    cand = sorted(c2 for c2 in cand if c2[0])
    nx = L.get('next') or {}
    c['next_deadline'] = {'date': cand[0][0], 'what': cand[0][1]} if cand else ({'date': nx.get('date'), 'what': nx.get('label')} if nx.get('date') else None)
    c['rungs_spent'] = list(dict.fromkeys(s.get('label') for s in done if s.get('label')))[:12]
    fails = L.get('fails') or []
    cnt = L.get('counts') or {}
    c['markers'] = {'red_fish': cnt.get('red_fish', sum(f.get('icon') == 'fish' for f in fails)), 'red_house': cnt.get('red_house', sum(f.get('icon') == 'house' for f in fails)), 'fee': any(e.get('fee') and not str(e['fee']).lower().startswith('waived') for e in ems)}
    oq = [f.get('unanswered') for f in fails if isinstance(f.get('unanswered'), int)]
    c['open_questions'] = sum(oq) if oq else None
    c['route'] = L.get('route')
    c['regime'] = L.get('regime')
    return c

def context_fingerprint(c):
    payload = {k: v for k, v in c.items() if k not in ('as_of', 'fingerprint', 'verification')}
    return hashlib.sha256(json.dumps(payload, ensure_ascii=False, sort_keys=True, separators=(',', ':')).encode('utf-8')).hexdigest()[:24]

def main(dry):
    rm = get(DART + '/data/roadmap.json')
    lanes = {l['id']: l for l in rm['lanes']}
    wheel = {w['id']: i + 1 for i, w in enumerate(get('https://raw.githubusercontent.com/unclehowell/datro/dartboard/src/data/ramps.json')['institutions'])}
    src = open('/home/user/tab/work/roadmap/build_snakes_ladders.py').read()
    darts = {k: v for k, v in re.findall(r'"([a-z0-9-]+)":\s*\[([^\]]*)\]', src)}
    darts = {k: re.findall(r'"([^"]+)"', v) for k, v in darts.items()}
    kb_doc = get(QA + '/kb.json')
    kb = kb_doc.get('meta', {}).get('by_body', {})
    source_versions = {'roadmap_as_of': rm.get('asOf') or rm.get('generated'), 'qa_generated': kb_doc.get('meta', {}).get('generated')}
    for rnd in range(4):
        st, ref = gh.gh('GET', f'/repos/{REPO}/git/ref/heads/{BR}')
        head = ref['object']['sha']
        txt = gh.raw(REPO, head, PATH)
        B = json.loads(txt)
        for d in B['drafts']:
            old_context = d.get('context') if isinstance(d.get('context'), dict) else {}
            c = pack(d, lanes, wheel, darts, kb, source_versions)
            fp = context_fingerprint(c)
            c['fingerprint'] = fp
            old_verification = old_context.get('verification')
            if (old_context.get('fingerprint') == fp and isinstance(old_verification, dict)
                    and old_verification.get('version') == d.get('version')
                    and old_verification.get('fingerprint') == fp):
                c['as_of'] = old_context.get('as_of') or c['as_of']
                c['verification'] = old_verification
            else:
                c['verification'] = {'version': d.get('version'), 'fingerprint': fp, 'status': 'UNVERIFIED',
                                     'checked_at': None, 'reviewer': None, 'thread_result': None, 'checks': {}}
            d['context'] = c
        B['context_note'] = 'drafts[].context is metadata only. Each pack carries source version stamps and a fingerprint. The builder never marks a source sweep verified; the reviewing agent must set context.verification for the exact version and fingerprint after checking the whole thread, dartboard, QA KB, research, wayback, projects and escalation rung. A changed fingerprint or draft version resets verification. Hive protocol v3.4.0.'
        new = json.dumps(B, ensure_ascii=False, indent=2) + '\n'
        if dry:
            print(json.dumps([{'id': d['id'], **d['context']} for d in B['drafts']], ensure_ascii=False, indent=1))
            return
        if new == txt:
            print('nothing to change')
            return
        st, hc = gh.gh('GET', f'/repos/{REPO}/git/commits/{head}')
        st, t = gh.gh('POST', f'/repos/{REPO}/git/trees', {'base_tree': hc['tree']['sha'], 'tree': [{'path': PATH, 'mode': '100644', 'type': 'blob', 'content': new}]})
        st, c = gh.gh('POST', f'/repos/{REPO}/git/commits', {'message': "drafts: per-draft context packs (Hive v3.4.0; metadata only) — Sion's Tab agent", 'tree': t['sha'], 'parents': [head]})
        st, u = gh.gh('PATCH', f'/repos/{REPO}/git/refs/heads/{BR}', {'sha': c['sha'], 'force': False})
        if st == 200:
            print('pushed', c['sha'][:7])
            return
        time.sleep(5)
    raise SystemExit('could not fast-forward')
if __name__ == '__main__': main('--dry' in sys.argv)
