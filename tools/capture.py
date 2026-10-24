#!/usr/bin/env python3
"""internetarchive.bucklerfamily.estate capture runner (runs inside GitHub Actions, never on a person's box).
Reads sources.csv, checks robots.txt, fetches each cited third-party page, keeps it only if it concerns the farm/case
(or is a cited record page), and stores a new dated capture only when its normalised text changed.
Each capture: public/<YYYYMMDDhhmmss>/<key>/{index.html (banner wrapper), raw.html|raw.pdf (unaltered single file), text.txt, meta.json}.
Unchanged pages get a "checked <date>, unchanged" line in public/manifest.jsonl. — Sion's Tab agent"""
import csv, json, os, re, sys, time, hashlib, html, subprocess, threading, unicodedata, collections, datetime as dt
from urllib.parse import urlsplit, quote
import urllib.robotparser as robotparser
import concurrent.futures as cf
import requests
from bs4 import BeautifulSoup
sys.path.insert(0, os.path.dirname(__file__))
from terms import match_terms, is_record, privacy_block
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
PUB = os.path.join(ROOT, 'public')
SRC = os.path.join(ROOT, 'sources.csv')
CAPS = os.path.join(PUB, 'captures.json')
MAN = os.path.join(PUB, 'manifest.jsonl')
RUNS = os.path.join(PUB, 'runs.json')
UA_ID = 'bucklerfamily-internetarchive'
UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36 (compatible; %s/1.0; +https://internetarchive.bucklerfamily.estate/)' % UA_ID
MAXB = 24 * 1024 * 1024          # Pages limit is 25 MiB per file
DEADLINE = time.time() + 60 * float(os.environ.get('MAX_MINUTES', '150'))
FORCE_RECHECK = os.environ.get('RECHECK_IRRELEVANT') == '1'
FIELDS = ['url', 'cited_on', 'matched_terms', 'status', 'record_type', 'last_checked', 'last_changed', 'latest_capture']
S = requests.Session(); S.headers.update({'User-Agent': UA, 'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8', 'Accept-Language': 'en-GB,en;q=0.9'})
lock = threading.Lock()
def now(): return dt.datetime.now(dt.timezone.utc)
def ts14(d): return d.strftime('%Y%m%d%H%M%S')
def human(d): return d.strftime('%d %b %Y %H:%M UTC')
def log(*a): print(time.strftime('%H:%M:%S'), *a, flush=True)
def key_of(url):
    p = urlsplit(url); k = p.netloc.lower() + (p.path or '/')
    if p.query:
        q = re.sub(r'[^A-Za-z0-9._~=-]', '_', p.query)
        k += '/_q/' + (q if len(q) <= 60 else hashlib.sha1(p.query.encode()).hexdigest()[:12])
    k = re.sub(r'[^A-Za-z0-9._~/=-]', '_', k); k = re.sub(r'/+', '/', k).strip('/')
    k = '/'.join(s if s not in ('.', '..') else '_' for s in k.split('/'))
    if len(k) > 180: k = k[:160] + '_' + hashlib.sha1(url.encode()).hexdigest()[:12]
    return k
def norm_text(s):
    s = unicodedata.normalize('NFC', s); s = re.sub(r'[ \t\r\f\v\u00a0]+', ' ', s)
    return '\n'.join(l.strip() for l in s.split('\n') if l.strip())
def html_text(b, enc=None):
    soup = BeautifulSoup(b, 'lxml')
    for t in soup(['script', 'style', 'noscript', 'template', 'svg']): t.decompose()
    title = (soup.title.get_text(' ', strip=True) if soup.title else '')[:300]
    return title, norm_text(soup.get_text('\n'))
def pdf_text(path):
    try: return norm_text(subprocess.run(['pdftotext', '-q', '-layout', path, '-'], capture_output=True, text=True, timeout=120).stdout)
    except Exception: return ''
# ---------- robots
_robots = {}; _rlock = collections.defaultdict(threading.Lock)
def robots_ok(url):
    p = urlsplit(url); base = f'{p.scheme}://{p.netloc}'
    with _rlock[base]:
        if base not in _robots:
            rp = None
            try:
                r = S.get(base + '/robots.txt', timeout=20)
                if r.status_code < 400 and 'html' not in r.headers.get('content-type', ''):
                    rp = robotparser.RobotFileParser(); rp.parse(r.text.splitlines())
            except Exception: rp = None   # unreachable: decided by the page fetch itself
            _robots[base] = rp
    rp = _robots[base]
    if rp is None: return True
    return rp.can_fetch(UA_ID, url) and rp.can_fetch('ia_archiver', url)
# ---------- pacing per host
_last = {}; _plock = collections.defaultdict(threading.Lock)
def pace(h, gap=2.0):
    with _plock[h]:
        w = _last.get(h, 0) + gap - time.time()
        if w > 0: time.sleep(w)
        _last[h] = time.time()
def fetch(url):
    pace(urlsplit(url).netloc)
    r = S.get(url, timeout=(15, 45), allow_redirects=True, stream=True)
    b = b''; t0 = time.time()
    for ch in r.iter_content(262144):
        b += ch
        if len(b) > 200 * 1024 * 1024 or time.time() - t0 > 120: break
    r.close(); return r, b
def monolith(url, out, extra=()):
    try:
        p = subprocess.run(['monolith', url, '-o', out, '-t', '60', '-u', UA, '-q', '-e'] + list(extra), capture_output=True, timeout=240)
        return os.path.exists(out) and os.path.getsize(out) > 200
    except Exception: return False
def sha(b): return hashlib.sha256(b).hexdigest()
def wrapper(meta, raw_name):
    url = html.escape(meta['url']); d = html.escape(meta['captured_human'])
    src_note = ''
    if meta['source'] == 'internet-archive':
        src_note = (' &middot; <b>Internet Archive copy</b>, originally captured %s at <a href="%s">web.archive.org</a>; seeded here %s'
                    % (html.escape(meta['ia_human']), html.escape(meta['ia_url']), html.escape(meta['seeded_human'])))
    banner_date = html.escape(meta['ia_human']) if meta['source'] == 'internet-archive' else d
    return f"""<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex"><title>Archived {banner_date}: {html.escape(meta.get('title') or meta['url'])}</title>
<link rel="stylesheet" href="/assets/snap.css"></head><body class="snap">
<header class="ia-banner"><span>Archived {banner_date} from <a href="{url}" rel="nofollow noopener">{url}</a>{src_note}</span>
<nav><a href="/?q={html.escape(quote(meta['url'], safe=''))}">all captures</a> <a href="{raw_name}">full page</a> <a href="text.txt">text</a> <a href="meta.json">SHA-256 {meta['sha256'][:12]}&hellip;</a></nav></header>
<iframe class="ia-frame" src="{raw_name}" sandbox="allow-popups allow-popups-to-escape-sandbox" referrerpolicy="no-referrer" title="Archived page"></iframe>
</body></html>"""
def write_capture(url, title, text, rawbytes, rawext, d, source, http_status, ctype, mode, extra=None):
    k = key_of(url); rel = f'{ts14(d)}/{k}'; folder = os.path.join(PUB, rel); os.makedirs(folder, exist_ok=True)
    raw_name = 'raw.' + rawext
    with open(os.path.join(folder, raw_name), 'wb') as f: f.write(rawbytes)
    with open(os.path.join(folder, 'text.txt'), 'w', encoding='utf-8') as f: f.write(text + '\n')
    meta = {'url': url, 'key': k, 'path': '/' + rel + '/', 'captured_utc': d.strftime('%Y-%m-%dT%H:%M:%SZ'), 'captured_human': human(d),
            'source': source, 'http_status': http_status, 'content_type': ctype, 'mode': mode, 'title': title,
            'sha256': sha(rawbytes), 'text_sha256': sha(text.encode('utf-8')), 'bytes': len(rawbytes), 'file': raw_name}
    if extra: meta.update(extra)
    with open(os.path.join(folder, 'meta.json'), 'w') as f: json.dump(meta, f, indent=1, ensure_ascii=False)
    with open(os.path.join(folder, 'index.html'), 'w', encoding='utf-8') as f: f.write(wrapper(meta, raw_name))
    return meta
def ia_lookup(url):
    """(timestamp, url) of the closest 2xx Internet Archive capture; (None, None) when there is none; ('ERR', None) when IA did not answer."""
    failed = False
    for v in ([url, url + '/'] if not url.endswith('/') and '?' not in url else [url]):
        ans = None
        for wait in (0, 15, 45):
            time.sleep(wait); pace('archive.org', 3.0)
            try:
                r = S.get('https://archive.org/wayback/available', params={'url': v}, timeout=40)
                if r.status_code == 200: ans = r.json(); break
            except Exception: pass
        if ans is None: failed = True; continue
        c = (ans.get('archived_snapshots') or {}).get('closest')
        if c and c.get('available') and str(c.get('status', '200')).startswith('2'): return c['timestamp'], c['url']
    return ('ERR', None) if failed else (None, None)
def ia_seed(url, d):
    ts, ia_url = ia_lookup(url)
    if ts == 'ERR': return {'lookup_failed': True}
    if not ts: return None
    orig = re.sub(r'^https?://web\.archive\.org/web/\d+[a-z_]*/', '', ia_url)
    ia_d = dt.datetime.strptime(ts, '%Y%m%d%H%M%S').replace(tzinfo=dt.timezone.utc)
    tmp = f'/tmp/ia_{hashlib.sha1(url.encode()).hexdigest()}.html'
    r = None
    for wait in (0, 20, 60):
        time.sleep(wait); pace('web.archive.org', 6.0)
        try: r = S.get(f'https://web.archive.org/web/{ts}id_/{orig}', timeout=(20, 90))
        except Exception: r = None; continue
        if r.status_code not in (429, 500, 502, 503, 504): break
    if r is None or r.status_code >= 400 or not r.content: return {'lookup_failed': True}
    body = r.content
    ct = r.headers.get('content-type', '')
    if 'pdf' in ct or body[:4] == b'%PDF':
        if len(body) > MAXB: return {'oversize': True, 'ia_url': f'https://web.archive.org/web/{ts}/{orig}'}
        p = tmp + '.pdf'; open(p, 'wb').write(body); text = pdf_text(p); os.remove(p); title = ''; rawb = body; ext = 'pdf'; mode = 'pdf'
    else:
        title, text = html_text(body)
        if monolith(f'https://web.archive.org/web/{ts}if_/{orig}', tmp) and os.path.getsize(tmp) <= MAXB:
            rawb = open(tmp, 'rb').read(); mode = 'single-file (monolith) of the Internet Archive copy'
        else: rawb = body; mode = 'Internet Archive raw HTML'
        ext = 'html'
        if os.path.exists(tmp): os.remove(tmp)
    if privacy_block(text): return None
    meta = write_capture(url, title, text, rawb, ext, ia_d, 'internet-archive', r.status_code, ct, mode,
                         {'ia_url': f'https://web.archive.org/web/{ts}/{orig}', 'ia_human': human(ia_d), 'seeded_utc': d.strftime('%Y-%m-%dT%H:%M:%SZ'), 'seeded_human': human(d)})
    return meta
# ---------- one URL
def process(row, caps, man):
    url = row['url']; d = now(); day = d.strftime('%Y-%m-%d'); k = key_of(url)
    st = row.get('status', '') or ''
    entry = caps.setdefault(k, {'url': url, 'captures': []})
    def note(result, **kw):
        rec = {'t': d.strftime('%Y-%m-%dT%H:%M:%SZ'), 'url': url, 'result': result}; rec.update(kw)
        with lock: man.append(rec)
        entry['last_check'] = rec
    if (st.startswith('not relevant') and not FORCE_RECHECK) or st.startswith('excluded'):
        return
    if time.time() > DEADLINE: return
    row['last_checked'] = day
    if not robots_ok(url):
        row['status'] = 'not captured: robots'; entry['status'] = row['status']; note('not captured: robots'); return
    try:
        r, body = fetch(url); code = r.status_code; ct = r.headers.get('content-type', '').split(';')[0].strip().lower()
    except requests.exceptions.Timeout: code, body, ct = 'timeout', b'', ''
    except requests.exceptions.SSLError: code, body, ct = 'ssl error', b'', ''
    except requests.exceptions.ConnectionError: code, body, ct = 'connection error', b'', ''
    except Exception as e: code, body, ct = 'error ' + type(e).__name__, b'', ''
    if code != 200 or not body:
        row['status'] = f'capture failed {day} {code}'; entry['status'] = row['status']; note(row['status'])
        if not entry['captures']:
            m = ia_seed(url, d)
            if m and m.get('lookup_failed'):
                row['status'] += '; Internet Archive not answering this run, retried next run'
            elif m and m.get('oversize'):
                entry['oversize'] = m['ia_url']; row['status'] += '; oversize, linked to Internet Archive'
            elif m:
                entry['captures'].append({k2: m[k2] for k2 in ('path', 'captured_utc', 'sha256', 'text_sha256', 'source', 'ia_url', 'title')})
                row['status'] += '; seeded from Internet Archive ' + m['captured_utc'][:10]; row['latest_capture'] = m['path']
                row['matched_terms'] = row['matched_terms'] or ';'.join(match_terms(url, m.get('title', '') + '\n' + open(os.path.join(PUB, m['path'].strip('/'), 'text.txt'), encoding='utf-8').read()))
                note('seeded from Internet Archive', capture=m['path'])
            else: row['status'] += '; no Internet Archive copy'
        entry['status'] = row['status']; return
    is_pdf = 'pdf' in ct or body[:4] == b'%PDF'
    if is_pdf:
        tmp = f'/tmp/p_{hashlib.sha1(url.encode()).hexdigest()}.pdf'; open(tmp, 'wb').write(body); text = pdf_text(tmp); os.remove(tmp); title = ''
    elif 'html' in ct or 'xml' in ct or ct == '':
        title, text = html_text(body)
    else:
        title, text = '', ''
    terms = match_terms(url, title + '\n' + text); rec_type = is_record(url)
    row['matched_terms'] = ';'.join(terms); row['record_type'] = rec_type or ''
    if not terms and not rec_type:
        row['status'] = 'not relevant: no farm or case terms'; entry['status'] = row['status']; note(row['status']); return
    if privacy_block(text):
        row['status'] = 'excluded: privacy'; entry['status'] = row['status']; note(row['status']); return
    tsha = sha(text.encode('utf-8'))
    prev = [c for c in entry['captures'] if c.get('source') == 'live']
    if prev and prev[-1].get('text_sha256') == tsha:
        row['status'] = 'ok: unchanged'; entry['status'] = row['status']; note(f'checked {day}, unchanged', capture=prev[-1]['path']); return
    if len(body) > MAXB:
        ts, ia = ia_lookup(url)
        if ts == 'ERR': ts = None
        entry['oversize'] = f'https://web.archive.org/web/{ts}/{url}' if ts else ''
        row['status'] = 'oversize: ' + ('linked to Internet Archive copy' if ts else 'no Internet Archive copy yet'); entry['status'] = row['status']; note(row['status']); return
    if is_pdf: rawb, ext, mode = body, 'pdf', 'pdf'
    elif 'html' in ct or ct == '':
        tmp = f'/tmp/m_{hashlib.sha1(url.encode()).hexdigest()}.html'; rawb = None; mode = ''
        for extra, md in (((), 'single-file (monolith)'), (('-v',), 'single-file (monolith, no video)'), (('-v', '-i'), 'single-file (monolith, no images: page too large)')):
            if monolith(url, tmp, extra) and os.path.getsize(tmp) <= MAXB:
                rawb = open(tmp, 'rb').read(); mode = md; break
        if os.path.exists(tmp): os.remove(tmp)
        if rawb is None: rawb, mode = body, 'raw HTML (single-file render failed)'
        ext = 'html'
    else: rawb, ext, mode = body, 'html' if 'xml' in ct else 'bin', 'as served'
    m = write_capture(url, title, text, rawb, ext, d, 'live', code, ct, mode)
    entry['captures'].append({k2: m[k2] for k2 in ('path', 'captured_utc', 'sha256', 'text_sha256', 'source', 'title')})
    row['status'] = 'ok: captured' if not prev else 'ok: changed, new capture'; row['last_changed'] = day; row['latest_capture'] = m['path']
    entry['status'] = row['status']; note(row['status'], capture=m['path'])
def main():
    os.makedirs(PUB, exist_ok=True)
    rows = list(csv.DictReader(open(SRC, encoding='utf-8')))
    caps = json.load(open(CAPS)) if os.path.exists(CAPS) else {}
    man = []; started = now()
    groups = collections.defaultdict(list)
    for r in rows:
        for f in FIELDS: r.setdefault(f, '')
        groups[urlsplit(r['url']).netloc].append(r)
    jobs = []
    for h, rs in groups.items():
        for i in range(0, len(rs), 40): jobs.append(rs[i:i + 40])
    def run(rs):
        for r in rs:
            try: process(r, caps, man)
            except Exception as e:
                r['status'] = f'capture failed {now():%Y-%m-%d} error {type(e).__name__}'; log('ERR', r['url'], e)
    with cf.ThreadPoolExecutor(int(os.environ.get('WORKERS', '16'))) as ex: list(ex.map(run, jobs))
    pending = sum(1 for r in rows if r['last_checked'] != started.strftime('%Y-%m-%d') and not r['status'].startswith(('not relevant', 'excluded')))
    with open(SRC, 'w', newline='', encoding='utf-8') as f:
        w = csv.DictWriter(f, FIELDS, extrasaction='ignore'); w.writeheader(); w.writerows(sorted(rows, key=lambda r: r['url']))
    json.dump(caps, open(CAPS, 'w'), ensure_ascii=False, separators=(',', ':'))
    with open(MAN, 'a', encoding='utf-8') as f:
        for rec in man: f.write(json.dumps(rec, ensure_ascii=False) + '\n')
    runs = json.load(open(RUNS)) if os.path.exists(RUNS) else {'runs': []}
    cnt = collections.Counter(re.sub(r' \d{4}-\d\d-\d\d.*', '', r['status']) for r in rows)
    run = {'started_utc': started.strftime('%Y-%m-%dT%H:%M:%SZ'), 'finished_utc': now().strftime('%Y-%m-%dT%H:%M:%SZ'), 'checked': len(man), 'pending': pending, 'complete': pending == 0, 'status_counts': dict(cnt),
           'new_captures': sum(1 for m in man if m['result'].startswith(('ok: captured', 'ok: changed', 'seeded')))}
    runs['runs'].append(run); runs['runs'] = runs['runs'][-200:]
    if run['complete']: runs['last_complete_utc'] = run['started_utc']
    json.dump(runs, open(RUNS, 'w'), indent=1)
    import shutil; shutil.copy(SRC, os.path.join(PUB, 'sources.csv'))
    log('RUN', json.dumps(run))
if __name__ == '__main__': main()
