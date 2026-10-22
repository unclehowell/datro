#!/usr/bin/env python3
"""Build infographic.bucklerfamily.estate: inline data/transfers.json into the template, run the public-words gate."""
import json, re, pathlib, sys
W = pathlib.Path(__file__).resolve().parent
SITE = W/'site' if (W/'site').exists() else W.parent  # work dir or repo tools/
data = json.load(open(SITE/'public/data/transfers.json'))
BANNED = ['says','claims','according to','hearsay','unverified','alleged','fraud','stolen','branwen','sion','heraldry','heraldic','coat of arms']
def human(d):
    if isinstance(d, dict): return [s for k, v in d.items() if k != 'u' for s in human(v)]
    if isinstance(d, list): return [s for v in d for s in human(v)]
    return [d] if isinstance(d, str) else []
tpl = (W/'template.html').read_text()
visible = re.sub(r'<script>.*?</script>|<style>.*?</style>|<[^>]+>', ' ', tpl, flags=re.S)
text = '\n'.join(human(data)) + '\n' + visible
bad = [w for w in BANNED if re.search(r'\b' + w + r'\b', text, re.I)]
if bad: sys.exit('banned words: %s' % bad)
ids = {p['id'] for p in data['parties']}; pids = {p['id'] for p in data['parcels']}
for t in data['transfers']:
    assert t['from'] in ids and t['to'] in ids, t['id']
    assert all(p in pids for p in t['parcels']), t['id']
    assert t['status'] in ('solid', 'dashed') and (t['status'] == 'solid' or t['reason']), t['id']
    assert str(t['year']) in t['label'], t['id']
    assert t['sources'], t['id']
html = tpl.replace('/*__DATA__*/null', json.dumps(data, ensure_ascii=False).replace('</', '<\\/'))
(SITE/'public/index.html').write_text(html)
print('built', len(data['transfers']), 'transfers', len(data['parties']), 'parties')
