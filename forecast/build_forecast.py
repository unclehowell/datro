#!/usr/bin/env python3
"""Forecast of the "exhaust every option" game, one institution at a time, for the dartboard and email. sites.
Reads institutions.json (each body's own ladder), events.json (hand-kept sends), the dartboard roadmap (every email to
and from each body + red fish / red house markers), the post-office seed (each open thread's stage and clock start) and
the failures ledger (historical lateness). Writes forecast.json: per institution, actual emails (solid), forecast emails
and replies (hollow), missed deadlines, and the date the last option is exhausted.
Assumptions (stated on the page): their reply lands on the deadline (worst case: no early answers), with a band to the
deadline + the body's median working days late on record; every reply is treated as a refusal or non-answer, so every rung
is played; our next email goes the working day after their reply or lapse, never in the past; a body's complaint ladder
opens the working day after its first review rung closes (or tomorrow when there is no information thread).
Run:  python3 work/forecast/build_forecast.py [--out PATH ...]   (default: work/forecast/forecast.json) — Sion's Tab agent"""
import json, os, sys, re, statistics, datetime as dt
from zoneinfo import ZoneInfo
W = os.path.dirname(os.path.abspath(__file__))
ROADMAP_SRC = ['/home/user/tab/work/roadmap/roadmap.json']
SEED = '/home/user/tab/work/emails-site/seed.json'
LEDGER = '/home/user/tab/work/failures-ledger/ledger.json'
BHF = '/home/user/tab/work/emails-site/bank-holidays.json'
TODAY = dt.datetime.now(ZoneInfo('Europe/London')).date()
D = dt.date.fromisoformat
FALLBACK_BH = ['2026-01-01','2026-01-02','2026-03-17','2026-04-03','2026-04-06','2026-05-04','2026-05-25','2026-07-13','2026-08-03','2026-08-31','2026-11-30','2026-12-25','2026-12-28','2027-01-01','2027-01-04','2027-03-17','2027-03-26','2027-03-29','2027-05-03','2027-05-31','2027-07-12','2027-08-02','2027-08-30','2027-11-30','2027-12-27','2027-12-28','2028-01-03','2028-01-04','2028-03-17','2028-04-14','2028-04-17','2028-05-01','2028-05-29','2028-07-12','2028-08-07','2028-08-28','2028-11-30','2028-12-25','2028-12-26','2029-01-01','2029-01-02','2029-03-19','2029-03-30','2029-04-02','2029-05-07','2029-05-28','2029-07-12','2029-08-06','2029-08-27','2029-11-30','2029-12-25','2029-12-26']
def bank_holidays():
    s = set(FALLBACK_BH)
    try:
        b = json.load(open(BHF)); s |= set(b if isinstance(b, list) else [])
    except Exception: pass
    return s
BH = bank_holidays()
def is_wd(d): return d.weekday() < 5 and d.isoformat() not in BH
def add_wd(d, n):
    while n > 0:
        d += dt.timedelta(days=1)
        if is_wd(d): n -= 1
    return d
def next_wd(d): return add_wd(d, 1)
def add_months(d, m):
    y, mo = divmod(d.month - 1 + m, 12); y += d.year; mo += 1
    import calendar
    return dt.date(y, mo, min(d.day, calendar.monthrange(y, mo)[1]))
def due_from(start, clock):
    u, n = clock.get('u'), clock.get('n', 0)
    if u == 'wd': return add_wd(start, n)
    if u == 'cm': return add_months(start, n)
    if u == 'cd': return start + dt.timedelta(days=n)
    return add_wd(start, 20)
def wd_between(a, b):
    n, d = 0, a
    while d < b:
        d += dt.timedelta(days=1)
        if is_wd(d): n += 1
    return n
def clock_text(c):
    u, n = c.get('u'), c.get('n')
    return {'wd': f'{n} working days', 'cm': f'{n} month' + ('s' if n != 1 else ''), 'cd': f'{n} days'}.get(u, 'no clock')

SEED2LANE = {'hmlr-sar': ['hm-land-registry'], 'hmlr-eir': ['hm-land-registry'], 'icr-090': ['hm-land-registry-independent-complaints-reviewer', 'hm-land-registry'],
  'tfw': ['transport-for-wales'], 'wo-nio': ['wales-office', 'northern-ireland-office'], 'hmcts': ['ministry-of-justice-hmcts'], 'museum': ['amgueddfa-cymru-museum-wales'],
  'ico-museum': ['amgueddfa-cymru-museum-wales'], 'dwr': ['dwr-cymru-welsh-water'], 'bp-archive': ['bp'], 'gld-bv': ['government-legal-department-bona-vacantia'],
  'he-04323': ['historic-england'], 'audit-wales': ['audit-wales'], 'os-2646': ['ordnance-survey'], 'rct-coroner': ['coroner-s-service-rct-council'], 'natural-england': ['defra'],
  'npcc': ['counter-terrorism-policing-nactso'], 'defra-23886': ['defra'], 'nlw': ['national-library-of-wales'], 'hmrc': ['valuation-office-agency-hmrc'], 'rcahmw': ['rcahmw-royal-commission'],
  'ico-546505': ['information-commissioner-s-office'], 'blake-morgan': ['blake-morgan-llp']}
PREFIX2LANE = {'swp-': 'south-wales-police', 'vale-': 'vale-of-glamorgan-council', 'cadw-': 'welsh-government-cadw', 'wg-': 'welsh-government-cadw', 'mod-': 'ministry-of-defence',
  'moj-': 'ministry-of-justice-hmcts', 'cps-': 'crown-prosecution-service', 'tna-': 'the-national-archives', 'heneb-': 'heneb-formerly-ggat-historic-environment-record',
  'glam-': 'glamorgan-archives', 'lcc-': 'llandough-community-council'}
def seed_lanes(t):
    if t['id'] in SEED2LANE: return SEED2LANE[t['id']]
    for p, l in PREFIX2LANE.items():
        if t['id'].startswith(p): return [l]
    return []
FIRST_KEYS = ('enquiry', 'letter', 'platform', 'gro', 'cpr', 'coroner')

def chain_of(rungs, track):
    if track == 'info': return [r for r in rungs if r['track'] == 'info']
    if track == 'sar': return [r for r in rungs if r['track'] == 'sar' or r['key'] == 's167']
    return [r for r in rungs if r['track'] in ('complaint', 'court') and r['key'] != 's167']
def info_variant(chain, fam):
    # keep one regime family: drop the other regime's request/review rungs
    drop = {'foi', 'foi_ir'} if fam == 'eir' else {'eir', 'eir_ir'}
    return [r for r in chain if r['key'] not in drop]
def by_key(rungs, k):
    return next((r for r in rungs if r['key'] == k), None)

def thread_state(t, inst):
    """-> (track, family, rung key, state, date, due) for a seed thread. state open = our email sent, reply awaited; closed = reply in."""
    rg, st, start = t.get('regime'), t.get('stage'), D(t['start'])
    due = D(t['due_body']) if t.get('due_body') else None
    keys = {r['key'] for r in inst['rungs']}
    fam = 'eir' if rg == 'eir' or (inst.get('regime') == 'EIR' and rg not in ('foi',)) else 'foi'
    if rg in ('foi', 'eir'):
        req, rev = (rg, rg + '_ir') if rg in keys else (('eir', 'eir_ir') if 'eir' in keys else ('foi', 'foi_ir'))
        if rg == 'foi' and 'foi' not in keys and 'ico_case' in keys: return ('info', fam, 'ico_case', 'open', start, due)
        if st == 'awaiting_reply': return ('info', fam, req, 'open', start, due)
        if st == 'awaiting_review': return ('info', fam, rev, 'open', start, due)
        if st == 'review_answered': return ('info', fam, rev, 'closed', start, due)
        if st == 'answered': return ('info', fam, req, 'closed', start, due)
        return ('info', fam, req, 'open', start, due)
    if rg == 'sar': return ('sar', fam, 'sar', 'closed' if st == 'answered' else 'open', start, due)
    if rg == 'ico':
        if 'foi_ir' in keys: return ('info', 'foi', 'foi_ir', 'closed', start, due)
        return ('info', fam, 'ico_case', 'open', start, due)
    if rg == 'icr':
        if 'cmp2' in keys: return ('cmp', fam, 'cmp2', 'closed', start, due)
        return ('cmp', fam, 'icr', 'plan', start, due)
    if rg == 'complaint': return ('cmp', fam, 'cmp1', 'open', start, due)
    # no statutory clock (enquiry, preservation notice, records enquiry)
    first = next((r['key'] for r in inst['rungs'] if r['key'] in FIRST_KEYS), None) or inst['rungs'][0]['key']
    if 'ico_case' in keys: first = 'ico_case'
    return ('info' if by_key(inst['rungs'], first)['track'] == 'info' else ('sar' if by_key(inst['rungs'], first)['track'] == 'sar' else 'cmp'), fam, first, 'closed' if st == 'replied' else 'open', start, due)

def email_rung(e, inst):
    rungs = inst['rungs']; keys = [r['key'] for r in rungs]
    txt = f"{e.get('subject','')} {e.get('summary','')}".lower(); cls = (e.get('cls') or '').lower()
    def first_of(*ks):
        for k in ks:
            if k in keys: return k
        return None
    k = None
    if cls == 'internal review request' or 'internal review' in txt or 'reconsideration' in txt or 'regulation 11' in txt:
        k = first_of('eir_ir' if inst.get('regime') == 'EIR' else 'foi_ir', 'foi_ir', 'eir_ir', 'phso_rev', 'psow_rev')
    if not k and (cls.startswith('complaint') or ' complaint' in f' {txt}'):
        k = first_of('icr' if 'independent complaints' in txt or 'icr' in txt.split() else 'x', 'cmp1', 'ptr', 'pcmp', 'ico_svc', 'olc_svc', 'std', 'icr', 'phso_rev', 'psow_rev', 'letter')
    if not k and cls.startswith('escalation'):
        k = first_of('ico' if 'ico' in txt or 'commissioner' in txt else 'x', 'psow', 'mp', 'icr', 'ccw', 'leo', 'ico', 'ico_dp')
    if not k and ('subject access' in txt or ' sar' in f' {txt}' or 'personal data' in txt):
        k = first_of('sar')
    if not k and re.search(r'\b(foi|freedom of information|eir|environmental information)\b', txt):
        k = first_of('eir' if 'environmental' in txt or re.search(r'\beir\b', txt) else 'foi', 'foi', 'eir', 'ico_case')
    if not k: k = keys[0]
    return keys.index(k) + 1

def main(outs):
    inst_doc = json.load(open(os.path.join(W, 'institutions.json')))
    events = json.load(open(os.path.join(W, 'events.json')))['events']
    import shutil, subprocess, tempfile
    tmp = tempfile.mkdtemp(prefix='fc-'); rp = os.path.join(tmp, 'roadmap.json'); shutil.copy(ROADMAP_SRC[0], rp)
    if not any(l.get('fails') for l in json.load(open(rp))['lanes']):  # red fish / red house markers live in apply_routes' output
        subprocess.run(['timeout', '-k', '5', '120', sys.executable, '/home/user/tab/work/failures-ledger/apply_routes.py', rp], capture_output=True, text=True)
    rm = json.load(open(rp)); shutil.rmtree(tmp, ignore_errors=True)
    seed = json.load(open(SEED)); led = json.load(open(LEDGER))
    lanes = {l['id']: l for l in rm['lanes']}
    late = {}
    for body, items in led['bodies'].items():
        vals = []
        for it in items:
            try:
                if it.get('replied') and it.get('due') and D(it['replied'][:10]) > D(it['due'][:10]): vals.append(wd_between(D(it['due'][:10]), D(it['replied'][:10])))
            except Exception: pass
        late[re.sub(r'[^a-z]', '', body.lower())] = vals
    out = []
    for inst in inst_doc['institutions']:
        lane = lanes.get(inst['id'], {}); rungs = inst['rungs']; keys = [r['key'] for r in rungs]
        n_of = {r['key']: r['n'] for r in rungs}
        nm = re.sub(r'[^a-z]', '', inst['name'].lower())
        lv = next((v for k, v in late.items() if k and (k in nm or nm in k)), [])
        late_wd = int(statistics.median(lv)) if lv else 0
        pts, marks = [], []
        # actual emails
        for e in lane.get('emails', []):
            try: d = D(e['date'][:10])
            except Exception: continue
            pts.append([d.isoformat(), 0 if e['dir'] == 'sent' else 1, email_rung(e, inst), 0, (e.get('cls') or '')[:40]])
        # threads: seed + hand-kept events
        threads = []
        for t in seed:
            if inst['id'] in seed_lanes(t):
                threads.append(dict(zip(('track', 'fam', 'key', 'state', 'date', 'due'), thread_state(t, inst)), ref=t.get('ref', '')[:40], sid=t['id']))
        for ev in events:
            if ev['lane'] != inst['id'] or ev['rung'] not in keys: continue
            if ev['side'] == 'due':
                for x in threads:
                    if x.get('sid') == ev.get('seed'): x['due'] = D(ev['due'])
                continue
            r = next(r for r in rungs if r['key'] == ev['rung'])
            tr = 'info' if r['track'] == 'info' else ('sar' if r['track'] == 'sar' or r['key'] == 's167' else 'cmp')
            fam = 'eir' if ev['rung'].startswith('eir') else 'foi'
            if ev['side'] == 'us': pts.append([ev['date'], 0, n_of[ev['rung']], 0, 'bounced' if ev.get('bounced') else 'sent'])
            if ev.get('bounced'): continue
            same = [x for x in threads if x['track'] == tr]
            row = {'track': tr, 'fam': fam, 'key': ev['rung'], 'state': 'plan' if ev['side'] == 'plan' else 'open', 'date': D(ev['date']), 'due': D(ev['due']) if ev.get('due') else None, 'ref': ev.get('ref', '')}
            # an event supersedes an older thread in the same track at or below its rung
            threads = [x for x in threads if not (ev.get('seed') and x.get('sid') == ev['seed'])]
            threads.append(row)
        # pseudo-thread from the email record when no seed thread exists
        main_track = 'sar' if rungs[0]['track'] == 'sar' else ('cmp' if rungs[0]['track'] == 'complaint' else 'info')
        if not threads and lane.get('emails'):
            ems = sorted(lane['emails'], key=lambda e: e['date'])
            last = ems[-1]; first_k = rungs[0]['key']
            exp = sorted(lane.get('expected', []), key=lambda x: x['date'])
            sent = [e for e in ems if e['dir'] == 'sent']
            ld = D((sent[-1] if sent else last)['date'][:10])
            threads.append({'track': main_track, 'fam': 'eir' if inst.get('regime') == 'EIR' else 'foi', 'key': first_k,
                            'state': 'open' if last['dir'] == 'sent' or exp else 'closed', 'date': ld if last['dir'] == 'sent' or exp else D(last['date'][:10]),
                            'due': D(exp[0]['date']) if exp else None, 'ref': 'from the email record'})
        if not threads:
            threads.append({'track': main_track, 'fam': 'foi', 'key': rungs[0]['key'], 'state': 'new', 'date': TODAY, 'due': None, 'ref': 'not yet started'})
        # complaint ladder for every body that has one and no thread on it
        has_cmp = any(r['track'] == 'complaint' for r in rungs)
        fc = []  # forecast points
        board = {r['key']: {'us': None, 'them': None, 'done': False} for r in rungs}
        for p in pts:
            k = keys[p[2] - 1]; b = board[k]
            if p[1] == 0: b['us'] = min(b['us'] or p[0], p[0]); b['done'] = b['done'] or False
            else: b['them'] = max(b['them'] or p[0], p[0])
        ends = []; walked = set()
        def walk(th):
            tr = th['track']; ch = chain_of(rungs, tr)
            if tr == 'info': ch = info_variant(ch, th['fam'])
            if th['key'] in FIRST_KEYS:
                r0 = by_key(rungs, th['key'])
                rest = [r for r in info_variant(chain_of(rungs, 'info'), th['fam']) if r['key'] not in FIRST_KEYS] or chain_of(rungs, 'sar') or [r for r in chain_of(rungs, 'cmp') if r['key'] != th['key']]
                ch = [r0] + rest
            walked.update(r['track'] for r in ch)
            ck = [r['key'] for r in ch]
            if th['key'] not in ck:
                ch = chain_of(rungs, tr); ck = [r['key'] for r in ch]
                if th['key'] not in ck: return None
            i = ck.index(th['key'])
            cur = th['date']; state = th['state']
            first_close = None
            for j in range(i, len(ch)):
                r = ch[j]; n = r['n']
                if j == i and state in ('open',):
                    us = cur
                elif j == i and state == 'closed':
                    them = cur
                    board[r['key']]['them'] = max(board[r['key']]['them'] or them.isoformat(), them.isoformat()); board[r['key']]['done'] = True
                    first_close = first_close or them
                    cur = max(next_wd(them), next_wd(TODAY)) if them <= TODAY else next_wd(them)
                    continue
                elif j == i and state in ('plan', 'new'):
                    us = max(cur, next_wd(TODAY)) if state == 'new' else max(cur, TODAY)
                    fc.append([us.isoformat(), 0, n, 1, ('planned ' if state == 'plan' else '') + r['us']])
                    board[r['key']]['us'] = board[r['key']]['us'] or us.isoformat()
                else:
                    us = max(cur, next_wd(TODAY))
                    fc.append([us.isoformat(), 0, n, 1, r['us']])
                    board[r['key']]['us'] = board[r['key']]['us'] or us.isoformat()
                due = th['due'] if (j == i and th.get('due')) else due_from(us, r['clock'])
                if due < TODAY and j == i and state == 'open':
                    marks.append([due.isoformat(), n, 'house', f"no reply by {due.isoformat()} ({clock_text(r['clock'])})"])
                    board[r['key']]['missed'] = due.isoformat()
                    cur = next_wd(TODAY); first_close = first_close or due
                    continue
                hi = add_wd(due, late_wd) if late_wd else due
                fc.append([due.isoformat(), 1, n, 1, r['them'], hi.isoformat() if hi != due else None])
                board[r['key']]['them'] = max(board[r['key']]['them'] or '', due.isoformat()) or due.isoformat()
                first_close = first_close or due
                cur = next_wd(due)
            ends.append(cur)
            return first_close
        info_close = None
        for th in sorted(threads, key=lambda x: x['date']):
            fcl = walk(th)
            if th['track'] == 'info' and fcl: info_close = min(info_close or fcl, fcl)
        info_rest = [r for r in chain_of(rungs, 'info') if r['key'] not in FIRST_KEYS]
        if info_rest and 'info' not in walked:
            walk({'track': 'info', 'fam': 'eir' if inst.get('regime') == 'EIR' or info_rest[0]['key'] == 'eir' else 'foi', 'key': info_rest[0]['key'], 'state': 'new', 'date': next_wd(info_close) if info_close else next_wd(TODAY), 'due': None, 'ref': 'information ladder (forecast)'})
        if has_cmp and 'complaint' not in walked and not any(t['track'] == 'cmp' for t in threads):
            ck = [r for r in chain_of(rungs, 'cmp')]
            if ck:
                start = next_wd(info_close) if info_close else next_wd(TODAY)
                walk({'track': 'cmp', 'fam': 'foi', 'key': ck[0]['key'], 'state': 'new', 'date': start, 'due': None, 'ref': 'complaint ladder (forecast)'})
        # red fish / red house markers from the failures ledger, on the rung their rule names
        for f in lane.get('fails', []):
            rule = f"{f.get('rule','')} {f.get('title','')}".lower()
            if 'code' in rule or 'review' in rule: k = next((x for x in ('eir_ir' if 'eir' in rule else 'foi_ir', 'foi_ir', 'eir_ir') if x in keys), None)
            elif 'art 12' in rule or 'subject access' in rule: k = 'sar' if 'sar' in keys else None
            elif 'eir' in rule: k = 'eir' if 'eir' in keys else None
            elif 'foia' in rule: k = 'foi' if 'foi' in keys else None
            else: k = next((x for x in FIRST_KEYS if x in keys), None) or ('cmp1' if 'cmp1' in keys else None)
            k = k or keys[0]
            txt = (f"{'reply after' if f['icon'] == 'fish' else 'no reply by'} the due date {f.get('date')}" + (f", {f.get('days')} working days late" if f.get('days') else '') +
                   (f", {f.get('unanswered')} question(s) unanswered" if f.get('unanswered') else '') + f" · {f.get('rule','')}")
            marks.append([f['date'], n_of[k], f['icon'], txt[:180]])
        allfc = [p[0] for p in fc] + [e.isoformat() for e in ends]
        exhaust = max(allfc) if allfc else None
        # the last point is the last reply on the latest-finishing ladder
        last_reply = max([p[0] for p in fc if p[1] == 1] or [exhaust or TODAY.isoformat()])
        for k, b in board.items():
            if b.get('them') == '': b['them'] = None
        pts.sort(key=lambda p: p[0]); fc.sort(key=lambda p: p[0])
        out.append({'id': inst['id'], 'name': inst['name'], 'late_wd': late_wd, 'late_n': len(lv), 'exhaust': last_reply,
                    'rungs': [{'n': r['n'], 'k': r['key'], 'l': r['label'], 't': r['track'], 'c': clock_text(r['clock']), 'law': r['law'], 'src': r['src'], 'inf': 1 if r.get('inferred') else 0, 'note': r.get('note')} for r in rungs],
                    'pts': pts, 'fc': fc, 'marks': marks, 'board': [dict(n=n_of[k], **v) for k, v in board.items()],
                    'threads': [{'track': t['track'], 'rung': n_of.get(t['key']), 'state': t['state'], 'date': t['date'].isoformat(), 'ref': t['ref']} for t in threads]})
    doc = {'schema': 'ghf-forecast/1', 'label': 'forecast', 'generated': dt.datetime.now(dt.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'), 'today': TODAY.isoformat(),
           'assumptions': ['Their reply lands on the deadline; the band runs to the deadline plus the body\'s median working days late on record.',
                           'Every reply is treated as a refusal or a non-answer, so every rung is played.',
                           'Our next email goes the working day after their reply or lapse.',
                           'A complaint ladder opens the working day after the first review rung closes.',
                           'Working days exclude bank holidays in any part of the UK (FOIA s.10(6), EIR reg 2).',
                           'Rungs marked * are our reading, not a published rule.'],
           'institutions': out}
    gate(doc)
    for o in outs:
        os.makedirs(os.path.dirname(o), exist_ok=True)
        json.dump(doc, open(o, 'w'), ensure_ascii=False, separators=(',', ':'))
    print(f"{len(out)} institutions; {sum(len(i['pts']) for i in out)} actual points; {sum(len(i['fc']) for i in out)} forecast points; written {outs}")
    return doc

BANNED = ['says', 'claims', 'according to', 'hearsay', 'unverified', 'alleged', 'fraud', 'stolen', 'negligen', 'incompeten', 'sion', 'buckler', 'hywel', 'branwen', 'disclaimer']
ALLOW = ['serious fraud office', 'claims to', 'serious-fraud-office']
def gate(doc):
    s = json.dumps(doc, ensure_ascii=False).lower()
    for a in ALLOW: s = s.replace(a, '')
    hits = [w for w in BANNED if re.search(r'\b' + re.escape(w), s)]
    if hits: raise SystemExit(f'public-words gate failed: {hits}')

if __name__ == '__main__':
    a = sys.argv[1:]; outs = []
    while a:
        x = a.pop(0)
        if x == '--out': outs.append(a.pop(0))
        elif x == '--roadmap': ROADMAP_SRC[0] = a.pop(0)
    main(outs or [os.path.join(W, 'forecast.json')])
