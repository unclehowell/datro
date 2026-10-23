#!/usr/bin/env python3
"""Hive context packs: one metadata-only "context" object per draft in datro@drafts drafts/BOARD.json.
Reads the dartboard roadmap (stage, next deadline, markers, rungs spent), the email archive API (thread link)
and qa kb.json (item count per body). No email text. Run: TAB_TASK_ID=$TAB_TASK_ID timeout -k 5 300 python3 work/watch/hive_context.py [--dry]
Re-run whenever BOARD.json gains a draft or the dartboard refreshes.
Public text on fees always reads: fee requests are noted (£), a written quote or estimate may be requested and considered, nothing is agreed, contracted or committed to, and every free route is pursued in parallel. — Sion's Tab agent"""
import json, sys, re, time, urllib.request, urllib.parse
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
  (r'^hmlr-sar', 'hm-land-registry', 'HM Land Registry', r'WA735527|735527|WA513690', 'HM Land Registry'),
  (r'^hmlr-wales-office', 'hm-land-registry', 'HM Land Registry (Wales Office)', r'Z084NQV|Wales Office', 'HM Land Registry'),
  (r'^hmlr-customer-support', 'hm-land-registry', 'HM Land Registry', r'customer support|titles held|title list', 'HM Land Registry'),
  (r'^hmlr-.*vg41', 'hm-land-registry', 'HM Land Registry', r'VG41|VG 41', 'HM Land Registry'),
  (r'^hmlr-', 'hm-land-registry', 'HM Land Registry', r'1961', 'HM Land Registry'),
  (r'^vale-', 'vale-of-glamorgan-council', 'Vale of Glamorgan Council', r'VG41|VG 41', 'Vale of Glamorgan Council'),
  (r'^glamorgan-', 'glamorgan-archives', 'Glamorgan Archives', r'VG41|catalogue|1961|1970', 'Glamorgan Archives'),
  (r'^tna-', 'the-national-archives', 'The National Archives', r'commons|1960|LAR', 'The National Archives'),
]
def pack(d, lanes, wheel, darts, kb):
    hit = next((m for m in MAP if re.search(m[0], d['id'])), None)
    if not hit: return {'body': None, 'note': 'no recipient mapping yet; add one to work/watch/hive_context.py MAP'}
    _, lid, body, kw, kbname = hit; L = lanes.get(lid) if lid else None
    c = {'body': body, 'as_of': time.strftime('%Y-%m-%dT%H:%MZ', time.gmtime())}
    c['archive'] = {'search': f'{EMAIL}/api/search?q=' + urllib.parse.quote(body.split(' (')[0])}
    if not L:
        c['dartboard'] = {'url': DART + '/#roadmap', 'lane': None, 'note': 'no lane on the dartboard yet'}
        c['stage'] = 'not yet on the dartboard'; c['next_deadline'] = None
        c['markers'] = {'red_fish': 0, 'red_house': 0, 'fee': False}; c['open_questions'] = None; c['rungs_spent'] = []
        return c
    ems = L.get('emails') or []
    th = [e for e in ems if re.search(kw, e.get('subject') or '', re.I)]
    last = th[-1] if th else None
    if not last: c['archive']['thread'] = None; c['archive']['note'] = 'no matching thread yet (new request): read the body search and the dartboard lane'
    if last and str(last.get('id', '')).startswith('gm-'):
        gid = last['id'][3:]; c['archive']['thread'] = f'{EMAIL}/reference/{gid}'
        try:
            m = get(f'{EMAIL}/api/message?id={last["id"]}')
            if m.get('threadSlug'): c['archive']['api_thread'] = f'{EMAIL}/api/thread?slug=' + m['threadSlug']
        except Exception: pass
        c['archive']['thread_last'] = {'date': last.get('date'), 'dir': last.get('dir'), 'class': last.get('cls')}
    lin = [e for e in ems if e.get('dir') == 'received']; lout = [e for e in ems if e.get('dir') == 'sent']
    c['last_in'] = lin[-1]['date'] if lin else None; c['last_out'] = lout[-1]['date'] if lout else None
    n = next((wheel[i] for i in darts.get(lid, []) if i in wheel), None)
    c['dartboard'] = {'url': f'{DART}/?r={n}#roadmap' if n else f'{DART}/#roadmap', 'lane': lid, 'wheel_number': n}
    today = time.strftime('%Y-%m-%d', time.gmtime())
    steps = L.get('steps') or []; done = sorted([s for s in steps if s.get('status') == 'done'], key=lambda s: s.get('date') or '')
    c['stage'] = (done[-1]['label'] + (' (' + done[-1]['date'] + ')' if done[-1].get('date') else '')) if done else 'no rung reached yet'
    cand = [(s['date'], s.get('label')) for s in steps if s.get('status') == 'pending' and (s.get('date') or '') > today]
    cand += [(f['date'], (f.get('ref') or f.get('id') or '') + ' (red ' + str(f.get('icon')) + ')') for f in (L.get('fails') or []) if (f.get('date') or '') >= today]
    cand += [(x.get('d'), 'expected reply: ' + str(x.get('k') or x.get('t') or '')) for x in (L.get('expected') or []) if isinstance(x, dict) and (x.get('d') or '') >= today]
    cand = sorted(c2 for c2 in cand if c2[0])
    nx = L.get('next') or {}
    c['next_deadline'] = {'date': cand[0][0], 'what': cand[0][1]} if cand else ({'date': nx.get('date'), 'what': nx.get('label')} if nx.get('date') else None)
    c['rungs_spent'] = list(dict.fromkeys(s.get('label') for s in done if s.get('label')))[:12]
    fails = L.get('fails') or []; cnt = L.get('counts') or {}
    c['markers'] = {'red_fish': cnt.get('red_fish', sum(f.get('icon') == 'fish' for f in fails)), 'red_house': cnt.get('red_house', sum(f.get('icon') == 'house' for f in fails)), 'fee': any(e.get('fee') and not str(e['fee']).lower().startswith('waived') for e in ems)}
    oq = [f.get('unanswered') for f in fails if isinstance(f.get('unanswered'), int)]
    c['open_questions'] = sum(oq) if oq else None
    c['route'] = L.get('route'); c['regime'] = L.get('regime')
    if kbname: c['kb_items'] = kb.get(kbname)
    return c
def main(dry):
    rm = get(DART + '/data/roadmap.json'); lanes = {l['id']: l for l in rm['lanes']}
    wheel = {w['id']: i + 1 for i, w in enumerate(get('https://raw.githubusercontent.com/unclehowell/datro/dartboard/src/data/ramps.json')['institutions'])}
    src = open('/home/user/tab/work/roadmap/build_snakes_ladders.py').read()
    darts = {k: v for k, v in re.findall(r'"([a-z0-9-]+)":\s*\[([^\]]*)\]', src)}; darts = {k: re.findall(r'"([^"]+)"', v) for k, v in darts.items()}
    kb = get(QA + '/kb.json').get('meta', {}).get('by_body', {})
    for rnd in range(4):
        st, ref = gh.gh('GET', f'/repos/{REPO}/git/ref/heads/{BR}'); head = ref['object']['sha']
        txt = gh.raw(REPO, head, PATH); B = json.loads(txt)
        for d in B['drafts']: d['context'] = pack(d, lanes, wheel, darts, kb)
        B['context_note'] = 'drafts[].context = metadata-only context pack (recipient body, archive thread link, dartboard link, stage, next deadline, markers, open questions, rungs spent); built by hive_context.py from the dartboard roadmap, the email archive API and qa kb.json. Hive protocol v3.1.0 context sweep.'
        new = json.dumps(B, ensure_ascii=False, indent=2) + '\n'
        if dry: print(json.dumps([{'id': d['id'], **d['context']} for d in B['drafts']], ensure_ascii=False, indent=1)); return
        if new == txt: print('nothing to change'); return
        st, hc = gh.gh('GET', f'/repos/{REPO}/git/commits/{head}')
        st, t = gh.gh('POST', f'/repos/{REPO}/git/trees', {'base_tree': hc['tree']['sha'], 'tree': [{'path': PATH, 'mode': '100644', 'type': 'blob', 'content': new}]})
        st, c = gh.gh('POST', f'/repos/{REPO}/git/commits', {'message': "drafts: per-draft context packs (Hive v3.1.0 context sweep; metadata only) — Sion's Tab agent", 'tree': t['sha'], 'parents': [head]})
        st, u = gh.gh('PATCH', f'/repos/{REPO}/git/refs/heads/{BR}', {'sha': c['sha'], 'force': False})
        if st == 200: print('pushed', c['sha'][:7]); return
        time.sleep(5)
    raise SystemExit('could not fast-forward')
if __name__ == '__main__': main('--dry' in sys.argv)
