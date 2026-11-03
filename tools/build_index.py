#!/usr/bin/env python3
"""Builds the static parts of internetarchive.bucklerfamily.estate from public/captures.json:
latest/<key>/ redirects, a compact index.json for the search page, and stats. — Sion's Tab agent"""
import json, os, html, shutil
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..')); PUB = os.path.join(ROOT, 'public')
caps = json.load(open(os.path.join(PUB, 'captures.json')))
for k in [k for k, e in caps.items() if not e.get('captures') and str(e.get('status', '')).startswith(('not relevant', 'excluded'))]: del caps[k]
json.dump(caps, open(os.path.join(PUB, 'captures.json'), 'w'), ensure_ascii=False, separators=(',', ':'))
lat = os.path.join(PUB, 'latest')
if os.path.isdir(lat): shutil.rmtree(lat)
idx = []
for k, e in sorted(caps.items(), key=lambda kv: kv[1]['url']):
    cs = sorted(e.get('captures', []), key=lambda c: c['captured_utc'])
    lc = e.get('last_check') or {}
    idx.append({'u': e['url'], 'k': k, 's': e.get('status', ''), 'o': e.get('oversize', ''), 'lc': lc.get('t', ''), 'lr': lc.get('result', ''),
                'c': [[c['captured_utc'], c['path'], c.get('source', 'live'), c.get('sha256', '')[:16], c.get('title', '')[:120]] for c in cs]})
    if cs:
        d = os.path.join(lat, k); os.makedirs(d, exist_ok=True); tgt = cs[-1]['path']
        open(os.path.join(d, 'index.html'), 'w').write(f'<!doctype html><meta charset="utf-8"><meta name="robots" content="noindex"><meta http-equiv="refresh" content="0;url={html.escape(tgt)}"><link rel="canonical" href="{html.escape(tgt)}"><title>Latest capture</title><a href="{html.escape(tgt)}">Latest capture</a>')
json.dump({'built': __import__('datetime').datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ'), 'items': idx}, open(os.path.join(PUB, 'index.json'), 'w'), ensure_ascii=False, separators=(',', ':'))
print('index items', len(idx), 'with captures', sum(1 for i in idx if i['c']))
