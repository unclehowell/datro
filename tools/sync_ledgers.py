#!/usr/bin/env python3
"""Gated sync of the two Beancount ledgers: accounts.bucklerfamily.estate (branch `accounts`) and oldbill.bucklerfamily.estate
(branch `oldbill`), both on unclehowell/datro. See SYNC.md.

Gate: the reopen trigger. `tools/loop.py alert` in the reopen-loop (exit 0 = a ground has every Takhar limb >= 4, the
court-ready bar on projects.bucklerfamily.estate/reopen-triggers/); grounds.json is read as the fallback and for the log line.
Until the bar is met this exits 0 having changed nothing and logs "trigger not met".

When met (once; idempotent on the source hashes):
  accounts  <- ledger/claimed.beancount = the held ledger/redress.beancount entries (set "redress")
                                        + oldbill's loss heads summed per liable party (set "oldbill"), Claimed/Prospective roots;
               ledger/sync.json; public/ rebuilt with tools/build.py; Pages deployment requested.
  oldbill   <- ledger/synced/accounts-cash.beancount (accounts' cash ledger, for the L-COST reconciliation)
               + ledger/synced/redress.beancount (the held memo); ledger/sync.json. Its pages are not changed.

Usage:  python3 tools/sync_ledgers.py [--dry-run] [--force-gate] [--local-accounts DIR --local-oldbill DIR]
  --dry-run       read everything, print the plan, write nothing.
  --local-*       work on local checkouts instead of GitHub (testing); with --force-gate it runs the merge locally.
Log: /home/user/tab/work/reopen-loop/state/ledger-sync.log (one line per run).
— Sion's Tab agent"""
import argparse, datetime, hashlib, json, os, pathlib, re, shutil, subprocess, sys, tempfile, time
LOOP = pathlib.Path(os.environ.get('REOPEN_LOOP', '/home/user/tab/work/reopen-loop'))
GH_TOOLS = '/home/user/tab/work/site-flywheels/tools'
REPO = 'unclehowell/datro'
LOG = LOOP / 'state' / 'ledger-sync.log'
CF_ACCT = '42a4a8d7bfb96321118ada213638d050'

def log(msg):
    line = '%s %s' % (datetime.datetime.utcnow().strftime('%Y-%m-%dT%H:%MZ'), msg)
    print(line)
    try:
        LOG.parent.mkdir(parents=True, exist_ok=True)
        with open(LOG, 'a') as f: f.write(line + '\n')
    except OSError: pass

def gate():
    """(met, detail). loop.py alert decides; grounds.json names the scores."""
    g = json.loads((LOOP / 'grounds.json').read_text())
    def limbs(x): return x.get('scores') or {}
    ready = [x['id'] for x in g.get('grounds', []) if limbs(x) and all(v >= 4 for v in limbs(x).values())]
    top = sorted(g.get('grounds', []), key=lambda x: -sum(limbs(x).values()))[:3]
    detail = 'run %s; ' % g.get('run') + ', '.join('%s %s' % (x['id'], ' '.join('%s%s' % kv for kv in sorted(limbs(x).items()))) for x in top)
    code = None
    try:
        r = subprocess.run(['timeout', '-k', '5', '60', sys.executable, str(LOOP / 'tools' / 'loop.py'), 'alert'], cwd=str(LOOP), capture_output=True, text=True)
        code = r.returncode
    except Exception as e:
        detail += '; loop.py not run (%s), grounds.json used' % e
    met = (code == 0) if code in (0, 1) else bool(ready)
    if code in (0, 1) and met != bool(ready): detail += '; loop.py alert=%s and grounds.json disagree, loop.py used' % code
    return met, detail + ('; court-ready: ' + ', '.join(ready) if ready else '') + '; loop.py alert exit %s' % code

# ---------- sources: GitHub branch heads or local checkouts ----------
class Branch:
    def __init__(self, name, local=None):
        self.name, self.local = name, (pathlib.Path(local) if local else None)
        if not self.local:
            sys.path.insert(0, GH_TOOLS); import gh as G; self.G = G
            st, ref = G.gh('GET', f'/repos/{REPO}/git/ref/heads/{name}')
            if st != 200: raise SystemExit(f'cannot read {name} head: {st}')
            self.head = ref['object']['sha']
        else: self.head = 'local'
    def read(self, path):
        if self.local:
            p = self.local / path; return p.read_text() if p.exists() else None
        try: return self.G.raw(REPO, self.head, path)
        except Exception: return None

def sha(s): return hashlib.sha256((s or '').encode()).hexdigest()[:16]

def parse_txns(text):
    """Very small Beancount block splitter: returns the transaction blocks (header line + indented lines)."""
    blocks, cur = [], None
    for line in text.splitlines():
        if re.match(r'^\d{4}-\d\d-\d\d [*!] ', line): cur = [line]; blocks.append(cur)
        elif cur is not None and line.startswith('  '): cur.append(line)
        else: cur = None
    return ['\n'.join(b) for b in blocks]

def meta(block, key):
    m = re.search(r'^  %s: "((?:[^"\\]|\\.)*)"' % re.escape(key), block, re.M); return m.group(1) if m else None

def q(s): return '"' + str(s).replace('\\', '\\\\').replace('"', '\\"') + '"'

def oldbill_by_party(ob_text):
    """Sum oldbill's #reopen postings per liable party (mid) and the heads' low/high by the same allocation."""
    names = {m.group(1): (m.group(2), m.group(3)) for m in re.finditer(r'custom "party" "Liable:Team-Regime:([A-Z]+)" ("(?:[^"\\]|\\.)*") ("(?:[^"\\]|\\.)*")', ob_text)}
    heads = {meta(b, 'id'): b for b in parse_txns(ob_text) if '#reopen' not in b.splitlines()[0]}
    party = {}
    for b in parse_txns(ob_text):
        if '#reopen' not in b.splitlines()[0]: continue
        h = heads[meta(b, 'id')]; alloc = dict((k, int(v)) for k, v in (x.split() for x in meta(h, 'alloc').split(', ')))
        lo, hi = float(meta(h, 'low') or 0), float(meta(h, 'high') or 0)
        for m in re.finditer(r'^  Liable:Team-Regime:([A-Z]+)\s+(-?[\d.]+) GBP', b, re.M):
            k = m.group(1); p = party.setdefault(k, {'mid': 0.0, 'low': 0.0, 'high': 0.0, 'heads': []})
            p['mid'] += float(m.group(2)); p['low'] += lo * alloc[k] / 100; p['high'] += hi * alloc[k] / 100; p['heads'].append(meta(h, 'id'))
    total = sum(p['mid'] for p in party.values())
    return party, names, total

def claimed_text(redress, ob_text, stamp):
    rd = '\n\n'.join(b for b in parse_txns(redress))
    party, names, total = oldbill_by_party(ob_text)
    out = ['; Costs claimed — memorandum ledger written by tools/sync_ledgers.py on %s, after the reopen trigger was met.' % stamp,
           '; set "redress": the held reparations schedule (ledger/redress.beancount). set "oldbill": Old Bill loss heads summed per party.',
           'option "title" "Great House Farm (Tŷ Mawr) — costs claimed"', 'option "operating_currency" "GBP"',
           'option "name_assets" "Claimed"', 'option "name_equity" "Prospective"', '']
    accts = set(re.findall(r'^  (Claimed:[^\s]+|Prospective:[^\s]+)', rd, re.M)) | {'Prospective:Old-Bill'}
    ob = []
    for k, p in sorted(party.items(), key=lambda kv: -kv[1]['mid']):
        nm = json.loads(names.get(k, ('"%s"' % k, '""'))[0]); route = json.loads(names.get(k, ('""', '""'))[1])
        acc = 'Claimed:Old-Bill:' + k; accts.add(acc)
        ob.append('\n'.join(['%s * %s "Old Bill loss heads carried if reopened (mid)"' % (stamp[:10], q(nm)), '  set: "oldbill"', '  body: %s' % q(nm),
            '  share: "%.1f"' % (p['mid'] / total * 100 if total else 0), '  low: "%.2f"' % p['low'], '  high: "%.2f"' % p['high'],
            '  basis: %s' % q('Loss heads ' + ', '.join(p['heads'])), '  route: %s' % q(route), '  source: "oldbill.bucklerfamily.estate ledger/main.beancount"',
            '  %s   %.2f GBP' % (acc, p['mid']), '  Prospective:Old-Bill']))
    rd = re.sub(r'^(\d{4}-\d\d-\d\d [*!] .*)$', r'\1\n  set: "redress"', rd, flags=re.M)
    opens = ['2026-10-20 open %s GBP' % a for a in sorted(accts)]
    return '\n'.join(out + opens + ['', rd, '', '\n\n'.join(ob), '']), party, total

def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--dry-run', action='store_true'); ap.add_argument('--force-gate', action='store_true')
    ap.add_argument('--local-accounts'); ap.add_argument('--local-oldbill'); a = ap.parse_args()
    met, detail = gate()
    if not met and not a.force_gate:
        log('trigger not met — nothing synced (%s)' % detail); return 0
    if a.force_gate and not (a.local_accounts and a.local_oldbill) and not a.dry_run:
        raise SystemExit('--force-gate is for local tests or --dry-run only; the live merge needs the real trigger')
    acc, ob = Branch('accounts', a.local_accounts), Branch('oldbill', a.local_oldbill)
    redress, ob_led, cash = acc.read('ledger/redress.beancount'), ob.read('ledger/main.beancount'), acc.read('ledger/main.beancount')
    if not (redress and ob_led and cash): raise SystemExit('missing a source ledger (redress %s, oldbill %s, cash %s)' % tuple(bool(x) for x in (redress, ob_led, cash)))
    src = {'redress': sha(redress), 'oldbill': sha(ob_led), 'cash': sha(cash)}
    prev = acc.read('ledger/sync.json')
    if prev and json.loads(prev).get('sources') == src:
        log('trigger met, already in sync (%s)' % detail); return 0
    stamp = datetime.datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')
    claimed, party, total = claimed_text(redress, ob_led, stamp)
    state = json.dumps({'merged_at': stamp, 'trigger': detail, 'sources': src, 'heads': {'accounts': acc.head, 'oldbill': ob.head},
                        'oldbill_parties_mid': {k: round(v['mid'], 2) for k, v in party.items()}, 'oldbill_total_mid': round(total, 2)}, indent=1)
    cash_spend = sum(float(m.group(1)) for m in re.finditer(r'^  Expenses:\S+\s+(-?[\d.]+) GBP', cash, re.M))
    m = re.search(r'£([\d,.]+) of receipted cash', ob.read('tools/damages.py') or '')
    recon = 'accounts cash out £%.2f vs oldbill L-COST cash £%s' % (cash_spend, m.group(1) if m else '?')
    plan = {'accounts': ['ledger/claimed.beancount (%d redress + %d oldbill entries)' % (len(parse_txns(redress)), len(party)), 'ledger/sync.json', 'public/ (rebuilt)'],
            'oldbill': ['ledger/synced/accounts-cash.beancount', 'ledger/synced/redress.beancount', 'ledger/sync.json'], 'reconcile': recon}
    if a.dry_run:
        log('trigger %s — DRY RUN, would write %s (%s)' % ('met' if met else 'forced', json.dumps(plan), detail)); return 0
    files_acc = {'ledger/claimed.beancount': claimed, 'ledger/sync.json': state}
    files_ob = {'ledger/synced/accounts-cash.beancount': cash, 'ledger/synced/redress.beancount': redress, 'ledger/sync.json': state}
    # rebuild accounts public/ in a scratch copy with Beancount (temp venv if beancount is not importable)
    work = pathlib.Path(tempfile.mkdtemp(prefix='ledsync-'))
    try:
        for p in ('tools/build.py', 'tools/template.html', 'ledger/main.beancount'):
            d = work / p; d.parent.mkdir(parents=True, exist_ok=True); d.write_text(acc.read(p))
        for p, s in files_acc.items(): (work / p).write_text(s)
        py = sys.executable
        if subprocess.run([py, '-c', 'import beancount, beanquery']).returncode:
            subprocess.run(['timeout', '-k', '5', '300', sys.executable, '-m', 'venv', str(work / 'venv')], check=True)
            subprocess.run(['timeout', '-k', '5', '300', str(work / 'venv/bin/pip'), '-q', 'install', 'beancount==3.1.0', 'beanquery'], check=True)
            py = str(work / 'venv/bin/python')
        r = subprocess.run(['timeout', '-k', '5', '120', py, 'tools/build.py'], cwd=str(work), capture_output=True, text=True)
        if r.returncode: raise SystemExit('accounts build failed after merge: ' + r.stderr[-800:])
        for p in (work / 'public').rglob('*'):
            if p.is_file(): files_acc[str(p.relative_to(work))] = p.read_text()
    finally: shutil.rmtree(work, ignore_errors=True)
    msg = 'ledger sync: reopen trigger met (%s) — redress memo and Old Bill loss heads into the claimed memo; cash ledger to oldbill — Sion\'s Tab agent' % detail[:120]
    for br, files in ((acc, files_acc), (ob, files_ob)):
        if br.local:
            for p, s in files.items(): d = br.local / p; d.parent.mkdir(parents=True, exist_ok=True); d.write_text(s)
            continue
        commit_files(br, files, msg)
    if not acc.local: pages_deploy('bucklerfamily-accounts')
    log('%s — SYNCED (%s; %s)' % ('trigger met' if met else 'TEST, gate forced, local only', detail, recon)); return 0

def commit_files(br, files, msg):
    G = br.G
    for _ in range(4):
        st, ref = G.gh('GET', f'/repos/{REPO}/git/ref/heads/{br.name}'); head = ref['object']['sha']
        st, hc = G.gh('GET', f'/repos/{REPO}/git/commits/{head}')
        st, t = G.gh('POST', f'/repos/{REPO}/git/trees', {'base_tree': hc['tree']['sha'], 'tree': [{'path': p, 'mode': '100644', 'type': 'blob', 'content': s} for p, s in files.items()]})
        st, c = G.gh('POST', f'/repos/{REPO}/git/commits', {'message': msg, 'tree': t['sha'], 'parents': [head]})
        st, u = G.gh('PATCH', f'/repos/{REPO}/git/refs/heads/{br.name}', {'sha': c['sha'], 'force': False})
        if st == 200: log('committed %s %s' % (br.name, c['sha'][:7])); return
        time.sleep(5)
    raise SystemExit('could not fast-forward ' + br.name)

def pages_deploy(project):
    tid = os.environ.get('TAB_TASK_ID', 'ledger-sync'); rq = pathlib.Path(f'/home/user/tab/tasks/{tid}/rq-sync'); rq.mkdir(parents=True, exist_ok=True)
    p = rq / 'cf.json'; p.write_text(json.dumps({'toolkit': 'cloudflare', 'method': 'POST', 'body': {}, 'query': {'_ts': str(time.time())},
        'url': f'https://api.cloudflare.com/client/v4/accounts/{CF_ACCT}/pages/projects/{project}/deployments'}))
    subprocess.run(['timeout', '-k', '5', '100', '/usr/bin/node', '/home/user/tab/connected-apps-cli.mjs', 'connected_apps.request', str(p)], capture_output=True, text=True)

if __name__ == '__main__': sys.exit(main())
