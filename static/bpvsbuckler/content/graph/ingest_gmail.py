# -*- coding: utf-8 -*-
"""Normalise Gmail material into one message record per email.

Inputs in raw/gmail/:
  <threadId>.json     a Gmail thread exactly as returned by the Gmail API /
                      connector (get_thread, PLAIN_TEXT): {"id", "messages": [...]}
  extracts-*.json     hand-made records for threads that were read but not
                      dumped: a list of {gmail_id, thread_id, party, date,
                      direction, from, to, subject, body, [ref, attachments, note]}

Writes corpus/gmail.jsonl. Run from static/bpvsbuckler:
    python3 content/graph/ingest_gmail.py

To add new FOI correspondence: drop the thread JSON (or an extracts file) into
raw/gmail/ and rebuild. Nothing else needs changing.
"""
import glob, json, os, re

HERE = os.path.dirname(os.path.abspath(__file__))
FAMILY = '[redacted]'

# email domain / address fragment -> party id (ids from api/control.json)
DOMAINS = [
    ('landregistry.gov.uk', 'hmlr'), ('icrev.org.uk', 'hmlr'),
    ('forestofcardiff', 'forest'), ('companieshouse.gov.uk', 'companies'),
    ('persimmon', 'persimmon'), ('gov.wales', 'cadw'), ('rcahmw.gov.uk', 'rcahmw'),
    ('museumwales.ac.uk', 'museum'), ('heneb.org.uk', 'heneb'), ('ggat.org.uk', 'heneb'),
    ('nationalarchives.gov.uk', 'tna'), ('glamro@cardiff.gov.uk', 'glamarch'),
    ('alexis.brito@cardiff.gov.uk', 'glamarch'), ('library.wales', 'nlw'), ('llgc.org.uk', 'nlw'),
    ('archaeologydataservice', 'ads'), ('cotswoldarchaeology', 'cotswold'),
    ('dwrcymru', 'dwr'), ('defra.gov.uk', 'dwr'), ('valeofglamorgan.gov.uk', 'vale'),
    ('kdenham@cardiff.gov.uk', 'cardiff'), ('registrars@cardiff.gov.uk', 'cardiff'),
    ('centrallibrary@cardiff.gov.uk', 'cardifflib'), ('llandough-cc.co.uk', 'llcc'),
    ('ukgovwales.gov.uk', 'walesoffice'), ('nio.gov.uk', 'walesoffice'),
    ('south-wales.police.uk', 'swp'), ('mod.gov.uk', 'mod'), ('justice.gov.uk', 'hmcts'),
    ('cps.gov.uk', 'cps'), ('parliament.uk', 'doughty'), ('senedd', 'senedd'),
    ('warwick.ac.uk', 'bp'), ('linklaters', 'linklaters'), ('darwingray', 'lawfirms'),
    ('blakemorgan', 'lawfirms'), ('landmarkchambers', 'landmark'), ('itv.com', 'itv'),
    ('terry-harris', 'harris'), ('sciencemuseum', 'sciencemuseum'), ('rctcbc.gov.uk', 'coroner'),
    ('whatdotheyknow', 'wdtk'), ('mountstuart', 'mountstuart'),
]

QUOTE_START = re.compile(
    r'(?m)^(On .{0,120}wrote:\s*$|From: .+\n(Sent|Date): |-{2,} ?Original Message|> ?\S)')
BOILER = [
    r'\*{20,}.*?\*{20,}.*?\*{20,}',            # Cardiff Council bilingual disclaimer
    r'(?s)EXTERNAL: This email originated.*?ddolenni\.',
    r'(?s)Please don.t print this e-mail.*$',
    r'(?s)National Archives Disclaimer.*$',
]


def party_of(addresses):
    for a in addresses:
        a = (a or '').lower()
        if FAMILY in a:
            continue
        for frag, pid in DOMAINS:
            if frag in a:
                return pid
    return None


def clean(body):
    body = body or ''
    for pat in BOILER:
        body = re.sub(pat, '', body, flags=re.S)
    m = QUOTE_START.search(body)
    if m and m.start() > 200:      # keep short bodies that are all quote
        body = body[:m.start()]
    body = re.sub(r'<(https?://[^>]+)>', '', body)
    body = re.sub(r'\n{3,}', '\n\n', body)
    return body.strip()


def from_thread(path):
    d = json.load(open(path, encoding='utf-8'))
    tid = d.get('id') or os.path.basename(path)[:-5]
    out = []
    party_hint = None
    for m in d.get('messages', []):
        sender = m.get('sender', '')
        to = m.get('toRecipients', []) + m.get('ccRecipients', [])
        sent = FAMILY in sender.lower()
        p = party_of(to if sent else [sender]) or party_of(to + [sender])
        party_hint = party_hint or p
        out.append({
            'id': 'g-' + m['id'], 'source': 'gmail', 'party': p,
            'thread': 'gmail:' + tid, 'thread_title': (d['messages'][0].get('subject') or ''),
            'date': m.get('date'), 'direction': 'sent' if sent else 'received',
            'from': 'Sion Buckler' if sent else sender, 'to': ', '.join(to),
            'subject': m.get('subject', ''),
            'attachments': '; '.join(a.get('filename', '') for a in m.get('attachments', []) or []),
            'note': '', 'body': clean(m.get('plaintextBody', '')),
            'url': m.get('viewUrl', ''),
        })
    for r in out:
        r['party'] = r['party'] or party_hint
    return out


def from_extracts(path):
    out = []
    for e in json.load(open(path, encoding='utf-8')):
        out.append({
            'id': 'g-' + e['gmail_id'], 'source': 'gmail-extract', 'party': e['party'],
            'thread': 'gmail:' + e['thread_id'], 'thread_title': e.get('subject', ''),
            'date': e['date'], 'direction': e['direction'], 'from': e.get('from', ''),
            'to': e.get('to', ''), 'subject': e.get('subject', ''),
            'attachments': e.get('attachments', ''), 'note': e.get('note', ''),
            'ref': e.get('ref', ''), 'body': e['body'].strip(),
            'url': f"https://mail.google.com/mail/u/0/#all/{e['thread_id']}",
        })
    return out


def main():
    rows = {}
    for p in sorted(glob.glob(os.path.join(HERE, 'raw/gmail/*.json'))):
        recs = from_extracts(p) if os.path.basename(p).startswith('extracts-') else from_thread(p)
        for r in recs:
            # a full dump wins over an extract of the same message
            if r['id'] in rows and r['source'] == 'gmail-extract':
                continue
            rows[r['id']] = r
    keep = [r for r in rows.values() if r['party'] and r['body']]
    keep.sort(key=lambda r: (r['date'] or '', r['id']))
    with open(os.path.join(HERE, 'corpus/gmail.jsonl'), 'w', encoding='utf-8') as f:
        for r in keep:
            f.write(json.dumps(r, ensure_ascii=False) + '\n')
    by = {}
    for r in keep:
        by[r['party']] = by.get(r['party'], 0) + 1
    print(f'{len(keep)} Gmail messages:', ', '.join(f'{k} {v}' for k, v in sorted(by.items())))


if __name__ == '__main__':
    main()
