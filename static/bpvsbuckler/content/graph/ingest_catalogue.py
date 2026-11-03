# -*- coding: utf-8 -*-
"""Parse the wiki's word-for-word email correspondence catalogue pages
(raw/catalogue/*.html, built from Gmail) into one message record per email.

Writes corpus/catalogue.jsonl. Run from static/bpvsbuckler:
    python3 content/graph/ingest_catalogue.py
"""
import glob, html, json, os, re, hashlib

HERE = os.path.dirname(os.path.abspath(__file__))
WIKI = 'https://greathousefarmwiki.wordpress.com'
FOI_REG = WIKI + '/records-access-chronology/foi-reply-register/'

# catalogue page slug prefix -> party id (ids from api/control.json)
PARTY = {
    'amgueddfa-cymru-museum-wales': 'museum',
    'crown-prosecution-service': 'cps',
    'heneb-ggat': 'heneb',
    'hm-land-registry': 'hmlr',
    'ministry-of-defence': 'mod',
    'national-counter-terrorism-security-office-nactso': 'nctso',
    'south-wales-police': 'swp',
    'vale-of-glamorgan-council': 'vale',
    'welsh-government-and-cadw': 'cadw',
}
MONTHS = {m: i for i, m in enumerate(
    'January February March April May June July August September October November December'.split(), 1)}


def text(fragment):
    t = re.sub(r'(?i)<br\s*/?>', '\n', fragment)
    t = re.sub(r'(?i)</p>\s*<p[^>]*>', '\n\n', t)
    t = re.sub(r'<[^>]+>', '', t)
    return html.unescape(t).strip()


def iso(day_text):
    m = re.match(r'(\d{1,2}) (\w+) (\d{4}), (\d{2}):(\d{2})', day_text.strip())
    if not m:
        return None
    d, mon, y, hh, mm = m.groups()
    return f'{y}-{MONTHS[mon]:02d}-{int(d):02d}T{hh}:{mm}:00Z'


def parse(path):
    slug = os.path.basename(path)[:-5]
    base = re.sub(r'-email-correspondence-catalogue(-part-\d+)?$', '', slug)
    party = PARTY[base]
    page_url = f'{FOI_REG}{slug}/'
    t = open(path, encoding='utf-8').read()
    out = []
    # split by thread headings
    parts = re.split(r'<h2 id="(t\d+)">(.*?)</h2>', t)
    for i in range(1, len(parts), 3):
        tid, ttitle, body = parts[i], text(parts[i + 1]), parts[i + 2]
        ttitle = re.sub(r'^Thread \d+ — ', '', ttitle)
        for m in re.finditer(r'(?s)<details[^>]*><summary>(.*?)</summary>(.*?)</details>', body):
            summ, inner = text(m.group(1)), m.group(2)
            bits = [b.strip() for b in summ.split(' · ')]
            when, label = bits[0], bits[1] if len(bits) > 1 else ''
            direction = 'sent' if 'sent by the family' in label else 'received'
            head = re.search(r'(?s)<p>(<strong>From:.*?)</p>', inner)
            fields = {}
            if head:
                for line in text(head.group(1)).split('\n'):
                    if ':' in line:
                        k, v = line.split(':', 1)
                        fields[k.strip().lower()] = v.strip()
            q = re.search(r'(?s)<blockquote[^>]*>(.*?)</blockquote>', inner)
            msg = text(q.group(1)) if q else ''
            note = re.search(r'(?s)<p><em>Note:</em>(.*?)</p>', inner)
            date = iso(when)
            key = f'{party}|{slug}|{tid}|{date}|{fields.get("subject", "")}'
            out.append({
                'id': 'm-' + hashlib.sha1(key.encode()).hexdigest()[:12],
                'source': 'wiki-catalogue',
                'party': party,
                'thread': f'{slug}#{tid}',
                'thread_title': ttitle,
                'date': date,
                'direction': direction,
                'from': fields.get('from', ''),
                'to': fields.get('to', ''),
                'subject': fields.get('subject', bits[-1] if bits else ''),
                'attachments': fields.get('attachments', ''),
                'note': text(note.group(1)) if note else '',
                'body': msg,
                'url': page_url + '#' + tid,
            })
    return out


def main():
    rows = []
    for p in sorted(glob.glob(os.path.join(HERE, 'raw/catalogue/*.html'))):
        rows += parse(p)
    seen, uniq = set(), []
    for r in sorted(rows, key=lambda r: (r['date'] or '', r['id'])):
        if r['id'] in seen:
            continue
        seen.add(r['id']); uniq.append(r)
    with open(os.path.join(HERE, 'corpus/catalogue.jsonl'), 'w', encoding='utf-8') as f:
        for r in uniq:
            f.write(json.dumps(r, ensure_ascii=False) + '\n')
    by = {}
    for r in uniq:
        by.setdefault(r['party'], [0, 0])[0 if r['direction'] == 'sent' else 1] += 1
    print(f'{len(uniq)} messages from the wiki catalogue:',
          ', '.join(f'{k} {s}/{r}' for k, (s, r) in sorted(by.items())), '(sent/received)')


if __name__ == '__main__':
    main()
