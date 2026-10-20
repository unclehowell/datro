#!/usr/bin/env python3
"""build.py — rebuild chess.bucklerfamily.estate from data/items.json (+ optional theory squares).
Usage: python3 tools/build.py [--theory path/to/squares.json]
Writes public/data/board.json, public/list/index.html and public/index.html; fails on any wording/privacy hit."""
import json, re, sys, math, html, hashlib, datetime, pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
items = json.load(open(ROOT/'data/items.json'))
KMAP = {'action': 'A', 'legalese': 'L', 'concealment': 'C', 'omission': 'C', 'counter': 'K', 'evidence': 'E', 'heritage': 'H', 'trees': 'T', 'tree': 'T'}
COLOUR = {'A': 'b', 'L': 'b', 'C': 'b', 'K': 'b', 'E': 'w', 'H': 'w', 'T': 'w'}
MON = {m: i for i, m in enumerate('jan feb mar apr may jun jul aug sep oct nov dec'.split())}

def year_of(d):
    if not d: return None
    m = re.search(r'(\d{1,2})?\s*(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+(\d{4})', d, re.I)
    if m: return int(m.group(3)) + MON[m.group(2).lower()[:3]] / 12 + (int(m.group(1)) / 400 if m.group(1) else 0)
    m = re.search(r'(\d{4})-(\d{2})-(\d{2})', d)
    if m: return int(m.group(1)) + (int(m.group(2)) - 1) / 12 + int(m.group(3)) / 400
    m = re.search(r'\b(\d{3,4})\b', d)
    return float(m.group(1)) if m else None

# ---- merge theory squares (from the theory revisit), dedupe by source ----
args = sys.argv[1:]; theory_path = None
if '--theory' in args: theory_path = args[args.index('--theory') + 1]
merged_theory = 0; skipped_theory = 0
if theory_path and pathlib.Path(theory_path).exists():
    raw = json.load(open(theory_path)); raw = raw.get('squares', raw) if isinstance(raw, dict) else raw
    have = {}
    for it in items:
        for s in it['src']: have.setdefault(s[1].split('#')[0].rstrip('/'), []).append(it)
    for n, t in enumerate(raw):
        code = KMAP.get(str(t.get('kind', '')).lower())
        if not code: code = 'A' if t.get('colour') == 'black' else 'E'
        if COLOUR[code] != ('b' if t.get('colour') == 'black' else 'w'):
            code = 'A' if t.get('colour') == 'black' else 'E'
        src = t.get('source') or ''
        urls = re.findall(r'https?://[^\s,;)\]]+', src)
        dup = False
        for u in urls:
            for it in have.get(u.split('#')[0].rstrip('/'), []):
                a = set(re.findall(r'[a-z]{4,}', (it['t'] + ' ' + it['x']).lower())); b = set(re.findall(r'[a-z]{4,}', (t.get('title', '') + ' ' + t.get('text', '')).lower()))
                if a and b and len(a & b) / max(1, min(len(a), len(b))) > 0.5: dup = True
        if dup: skipped_theory += 1; continue
        label = re.sub(r'https?://\S+', '', src).strip(' ;,·—-') or 'Theory review, 20 Oct 2026'
        s = [[label[:120], urls[0]]] if urls else [[label[:120], 'https://greathousefarmwiki.wordpress.com/']]
        for u in urls[1:3]: s.append([re.sub(r'^https?://(www\.)?', '', u).split('/')[0], u])
        items.append({'id': 'tr-' + str(t.get('id') or n), 'code': code, 'th': t.get('theory', True) is not False,
                      't': t.get('title', '').strip(), 'x': t.get('text', '').strip(), 'd': str(t.get('date') or '').strip(),
                      'y': year_of(str(t.get('date') or '')), 'src': s, 'origin': 'theory'})
        merged_theory += 1

# ---- wording & privacy gate ----
FIX = [(r'\(family research note;\s*', '('), (r'family research note[;,]?\s*', ''), (r'\((document not yet held|verification pending)\)', '(source pending)'), (r'\bMary Williams\b', 'Mary (Nancy) Williams'), (r'\(Nancy\) \(Nancy\)', '(Nancy)'), (r'\breportedly\s+', ''), (r'\ballegedly\s+', '')]
BAN = [r'\bsays?\b', r'\bsaid\b', r'\bclaim(s|ed|ing)?\b', r'according to', r'hearsay', r'unverified', r'\balleg', r'family\W{0,3}s? account', r'family testimony',
       r'\bSion\b', r'Robin Hill', r'hywelapbuckler', r'7845', r'933262', r'\b0?7\d{3}\s?\d{6}\b', r'\+44', r'[\w.+-]+@[\w-]+\.[\w.]+',
       r'Oath of Allegiance', r'Royal Signals', r"family\W{0,3}s? (case|view|belief|research|recollection|memory|tradition)", r'family research', r'\bTab\b', r'\bwiki editor', r'this page']
ALLOW = ['Clynton and Say', 'The claim that a unilateral licence can stop time running']  # proper names / verbatim court quotes  # proper names that contain a banned token
CASED = [r'\bBranwen\s+[A-Z][a-z]+', r'\b[A-Z]{1,2}\d{1,2}[A-Z]?\s\d[A-Z]{2}\b']
bad = []
for it in items:
    for f in ('t', 'x'):
        v = it[f]
        for a, b in FIX: v = re.sub(a, b, v)
        it[f] = v
        chk = v
        for ok in ALLOW: chk = chk.replace(ok, '')
        for p in BAN:
            if re.search(p, chk, re.I): bad.append((it['id'], f, p, v[:160]))
        for p in CASED:
            if re.search(p, v): bad.append((it['id'], f, p, v[:160]))
    if not it['t'] or not it['x']: bad.append((it['id'], 'empty', '', ''))
if bad:
    open(ROOT/'gate-report.txt', 'w').write('\n'.join(map(str, bad)))
    if '--allow-gate' not in args:
        print('GATE FAILED:', len(bad), 'hits; see gate-report.txt'); sys.exit(2)
    bad_ids = {b[0] for b in bad}; items = [it for it in items if it['id'] not in bad_ids]
    print('gate: dropped', len(bad_ids), 'items with hits (--allow-gate)')

# ---- layout ----
ERAS = [('Origins', 'before 1800', -1e9, 1800), ('Bute tenancy', '1800–1876', 1800, 1877), ('The 1877 agreement', '1877–1915', 1877, 1916),
        ('1916 tenancy and 1928', '1916–1937', 1916, 1938), ('Western Ground Rents and the war years', '1938–1954', 1938, 1955),
        ('Possession orders', '1955–1968', 1955, 1969), ('BP conveyances and licence letters', '1969–1981', 1969, 1982),
        ('Registration and litigation', '1982–1987', 1982, 1988), ('Eviction and demolition', '1988', 1988, 1989),
        ('Aftermath and redevelopment', '1989–1999', 1989, 2000), ('Later years', '2000–2025', 2000, 2026),
        ('Records sought and answered', '2026', 2026, 3000), ('Undated', 'no date', None, None)]
def era_of(y):
    if y is None: return len(ERAS) - 1
    for i, e in enumerate(ERAS[:-1]):
        if e[2] <= y < e[3]: return i
    return len(ERAS) - 2
buckets = [{'b': [], 'w': []} for _ in ERAS]
for it in items:
    if it.get('y') is None: it['y'] = year_of(it['d'])
    buckets[era_of(it['y'])][COLOUR[it['code']]].append(it)
for b in buckets:
    for k in 'bw': b[k].sort(key=lambda it: (it['y'] if it['y'] is not None else 9999, it['t']))
def rows_for(cols):
    return [max(1, math.ceil(2 * max(len(b['b']), len(b['w'])) / cols)) for b in buckets]
best = None
for cols in range(12, 121):
    rs = sum(rows_for(cols)); score = abs(rs / cols - 1.0)
    if best is None or score < best[0]: best = (score, cols)
COLS = best[1]; R = rows_for(COLS)
sq = []; eras = []; r0 = 0
def place(lst, cells, allsorted):
    """Spread one colour's items over that colour's cells so both colours keep roughly in step with time."""
    N, M = len(lst), len(cells); out = []; prev = -1
    rank = {id(it): k for k, it in enumerate(allsorted)}; T = max(1, len(allsorted))
    for i, it in enumerate(lst):
        target = int(rank[id(it)] / T * M)
        j = max(prev + 1, min(target, M - (N - i))); out.append((cells[j], it)); prev = j
    return out
for ei, (b, nr) in enumerate(zip(buckets, R)):
    if not b['b'] and not b['w']: continue
    allsorted = sorted(b['b'] + b['w'], key=lambda it: (it['y'] if it['y'] is not None else 9999, it['t']))
    darkc = [(r, c) for r in range(r0, r0 + nr) for c in range(COLS) if (r + c) % 2 == 1]
    lightc = [(r, c) for r in range(r0, r0 + nr) for c in range(COLS) if (r + c) % 2 == 0]
    for (r, c), it in place(b['b'], darkc, allsorted) + place(b['w'], lightc, allsorted):
        sq.append({'id': it['id'], 'r': r, 'c': c, 'e': len(eras), 'k': it['code'], 'th': 1 if it['th'] else 0, 't': it['t'], 'd': it['d'], 'x': it['x'], 'src': it['src']})
    eras.append({'label': ERAS[ei][0], 'years': ERAS[ei][1], 'r0': r0, 'r1': r0 + nr, 'nb': len(b['b']), 'nw': len(b['w'])})
    r0 += nr
built = datetime.datetime.utcnow().strftime('%d %b %Y %H:%M UTC')
board = {'v': 1, 'built': built, 'cols': COLS, 'rows': r0, 'eras': eras, 'sq': sq}
(ROOT/'public/data').mkdir(parents=True, exist_ok=True)
js = json.dumps(board, ensure_ascii=False, separators=(',', ':'))
(ROOT/'public/data/board.json').write_text(js)
ver = hashlib.sha1(js.encode()).hexdigest()[:8]
tpl = (ROOT/'index.tpl.html').read_text(); (ROOT/'public/index.html').write_text(tpl.replace('__V__', ver))

# ---- list view (text version of the whole board) ----
KN = {'A': 'Action', 'L': 'Legal framing', 'C': 'Omission', 'K': 'Cuts against', 'E': 'Evidence', 'H': 'Heritage', 'T': 'Trees and land'}
out = []
for e in eras:
    out.append(f'<h2 id="era-{e["r0"]}">{html.escape(e["label"])} <small>{html.escape(e["years"])} · {e["nb"]} black · {e["nw"]} white</small></h2><ol>')
    for q in sorted([q for q in sq if eras[q['e']] is e], key=lambda q: (q['r'], q['c'])):
        col = 'b' if COLOUR[q['k']] == 'b' else 'w'
        src = ' · '.join(f'<a href="{html.escape(s[1])}" rel="noopener">{html.escape(s[0])}</a>' for s in q['src'])
        th = '<em class="th">Our case, prospective. Not a finding of any court.</em>' if q['th'] else ''
        out.append(f'<li class="{col} k{q["k"]}" id="{q["id"]}"><span class="tag">{"Black" if col=="b" else "White"} · {KN[q["k"]]}</span> <span class="dt">{html.escape(q["d"] or "Undated")}</span><h3>{html.escape(q["t"])}</h3><p>{html.escape(q["x"])}</p>{th}<p class="src">{src} · <a href="/#s={q["id"]}">on the board</a></p></li>')
    out.append('</ol>')
listhtml = f"""<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>The Chessboard, as a list — Great House Farm / Tŷ Mawr</title><meta name="description" content="The Great House Farm chessboard as a plain list, era by era, each record with its source."/>
<link rel="stylesheet" href="/assets/chess.css?v={ver}"/><link rel="stylesheet" href="/assets/list.css?v={ver}"/>
<script src="https://bucklerfamily.estate/ghf-lang/ghf-lang.js" data-site="chess" data-dict="/lang/chess.json" defer></script>
<script src="https://bucklerfamily.estate/ebook/cta.js" defer></script></head>
<body class="listview"><header class="top"><div class="bar"><a class="brand" href="/">The Chessboard<small>Great House Farm / Tŷ Mawr</small></a><a class="btn" href="/" style="text-decoration:none">Board</a><nav class="langmount" aria-label="Language"></nav></div></header>
<main class="lv"><h1>The board as a list</h1><p class="note">Every square of the board in time order, era by era. Black: actions, legal framings and omissions against Williams/Buckler ownership. White: evidence of ownership, occupation, heritage and the trees. {sum(1 for q in sq if COLOUR[q['k']]=='b')} black and {sum(1 for q in sq if COLOUR[q['k']]=='w')} white squares. Built {built}.</p>
<nav class="eras">{' · '.join(f'<a href="#era-{e["r0"]}">{html.escape(e["label"])}</a>' for e in eras)}</nav>
{''.join(out)}
<footer><p><strong>Our case, prospective. Not a finding of any court.</strong> Cited historic record from the Great House Farm Legal Wiki (greathousefarmwiki.wordpress.com).</p></footer></main></body></html>"""
(ROOT/'public/list').mkdir(parents=True, exist_ok=True); (ROOT/'public/list/index.html').write_text(listhtml)
nb = sum(1 for q in sq if COLOUR[q['k']] == 'b'); nw = len(sq) - nb
kinds = {}
for q in sq: kinds[q['k']] = kinds.get(q['k'], 0) + 1
stats = {'built': built, 'cols': COLS, 'rows': r0, 'squares': len(sq), 'black': nb, 'white': nw, 'by_kind': kinds, 'theory_squares': sum(q['th'] for q in sq),
         'merged_theory': merged_theory, 'skipped_theory_dupes': skipped_theory, 'eras': [(e['label'], e['nb'], e['nw']) for e in eras]}
(ROOT/'public/data/stats.json').write_text(json.dumps(stats, ensure_ascii=False, indent=1))
print(json.dumps(stats, ensure_ascii=False))
