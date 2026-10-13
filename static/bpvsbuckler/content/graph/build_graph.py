# -*- coding: utf-8 -*-
"""Build the Great House Farm Q&A knowledge graph, and the storyboard from it.

    python3 content/graph/build_graph.py

Reads
  content/graph/seed/story.seed.json   the curated scenes (written by content/story_source.py)
  content/graph/corpus/*.jsonl         every email, sent and received (ingest_catalogue.py, ingest_gmail.py)
  content/graph/case_questions.json    the open questions of the case, with current best answers
  ../../evidence-catalogue/*.md        structured notes on each reply (holder, reference, given, withheld)
  api/control.json                     the records-request register (party names)

Writes
  api/graph.json      nodes and edges: scenes, case questions, Q&A pairs, messages, parties, references
  api/qa.json         every question asked and the answer given, paired where possible
  api/graph.sql       the same, as SQL for the Cloudflare D1 database (with full-text search)
  src/data/story.json the storyboard the player renders, now carrying per-scene evidence grade,
                      the case questions it turns on, and the Q&A that bear on it

The slides therefore come from the graph: change the correspondence, the case
questions or the scenes, rebuild, and the storyboard changes with them.
"""
import glob, hashlib, json, os, re
from collections import Counter, defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.dirname(os.path.dirname(HERE))           # static/bpvsbuckler
REPO = os.path.dirname(os.path.dirname(SITE))           # repo root
J = lambda *p: os.path.join(*p)

# ------------------------------------------------------------------ load
seed = json.load(open(J(HERE, 'seed/story.seed.json'), encoding='utf-8'))
scenes = seed['scenes']
cqs = json.load(open(J(HERE, 'case_questions.json'), encoding='utf-8'))['questions']
control = json.load(open(J(SITE, 'api/control.json'), encoding='utf-8'))
PARTY_NAME = {p['id']: p['name'] for p in control['parties']}
PARTY_NAME.update({'cardifflib': 'Cardiff Library (Cathays Heritage Library)', 'coroner': 'Coroner (South Wales Central)',
                   'sciencemuseum': 'Science Museum Group', 'wdtk': 'WhatDoTheyKnow', 'mountstuart': 'Mount Stuart (Bute Archive)'})

msgs = []
for p in sorted(glob.glob(J(HERE, 'corpus/*.jsonl'))):
    for line in open(p, encoding='utf-8'):
        msgs.append(json.loads(line))
# the same email can arrive from both the wiki catalogue and Gmail: keep one
seen, uniq = {}, []
for m in sorted(msgs, key=lambda m: (0 if m['source'] == 'wiki-catalogue' else 1)):
    key = (m['party'], (m['date'] or '')[:16], m['direction'])
    if key in seen:
        continue
    seen[key] = m['id']; uniq.append(m)
msgs = sorted(uniq, key=lambda m: m['date'] or '')

docs = []
for p in sorted(glob.glob(J(REPO, 'evidence-catalogue/*.md'))):
    t = open(p, encoding='utf-8').read()
    fm, body = {}, t
    m = re.match(r'(?s)---\n(.*?)\n---\n(.*)', t)
    if m:
        for line in m.group(1).split('\n'):
            if ':' in line:
                k, v = line.split(':', 1); fm[k.strip()] = v.strip()
        body = m.group(2)
    docs.append({'id': 'doc-' + os.path.basename(p)[:-3], 'holder': fm.get('holder', ''),
                 'reference': fm.get('reference', ''), 'date': fm.get('date', ''),
                 'title': (re.search(r'(?m)^# (.+)', body) or [None, os.path.basename(p)])[1],
                 'body': body.strip(), 'fm': fm})

# ------------------------------------------------------------------ references
REF_PATTERNS = [
    r'\bWA\d{6}\b', r'\bN610CGV\b', r'\bATISN \d{4,6}\b', r'\b(?:FOI|EIR)[ -]?\d{4}[-/]\d{2,4}\b',
    r'\bFOI ?\d{3,4}/\d{2}\b', r'\b\d{3,4}/\d{2}\b(?= ?(?:\)|,|\.| |$))', r'\bRC26-\d{4}\b',
    r'\bCAS-\d{6}-\w{6}\b', r'\bICR/\d{3}/\d{2}\b', r'\b2026[/ ]?\d{4}b?\b', r'\bD\d{3}/\d(?:[–-]\d)?\b',
    r'\bDBDT/?\d{1,3}/\d{1,3}\b', r'\bD696(?:/\d(?:-\d)?)?\b', r'\bX\.6\(\d+\)', r'\bArchive (?:Number )?\d{7}\b',
    r'\bGGAT\d{5}s\b', r'\bYHL/PO/JO/\d+/\d+/\d+\b', r'\bE 179/\d+/\d+\b', r'\b8\d/0\d{4}/\w{3}\b',
    r'\b9\d/0\d{4}/\w{3}\b', r'\b00211\d{3}\b', r'\bDPR2026/\d+\b', r'\bFOI2026/\d+\b', r'\bIR/26/\d+\b',
    r'\b26FOI \d+\b', r'\bXLVII\.6\b', r'\bDVAL/\d/\d+\b', r'\bNA/GL/\d\d/\d+\b', r'\b14464/88\b',
]
REF_RE = re.compile('|'.join(REF_PATTERNS))
YEAR_RE = re.compile(r'\b(1[5-9]\d\d)\b')


def norm_ref(r):
    r = r.replace('–', '-').replace('Archive Number ', 'Archive ').strip()
    r = re.sub(r'^(DBDT)/?', 'DBDT/', r)
    return r


def refs(text):
    return sorted({norm_ref(x) for x in REF_RE.findall(text or '') if not re.fullmatch(r'\d{3,4}/\d{2}', x) or '/26' in x})


def years(text):
    return sorted({int(y) for y in YEAR_RE.findall(text or '') if 1540 <= int(y) <= 1999})

# ------------------------------------------------------------------ question / answer pairing
ITEM = re.compile(r'(?m)^\s{0,6}(?:\*\*)?(?:\d{1,2}[.)]|\(\w\)|\d{1,2}\)\s)\s+(?!\d)')


def split_items(text):
    """Numbered / lettered items in order. Returns [] when the text isn't itemised."""
    starts = [m.start() for m in ITEM.finditer(text)]
    if len(starts) < 2:
        return []
    items = []
    for i, s in enumerate(starts):
        seg = text[s:starts[i + 1] if i + 1 < len(starts) else len(text)].strip()
        seg = re.sub(r'^\s*(?:\*\*)?(?:\d{1,2}[.)]|\(\w\))\s*', '', seg)
        if len(seg) > 12:
            items.append(seg[:1500])
    return items


ASK = re.compile(r'\?|\bplease\b|\bconfirm|\bprovide|\bwhether\b|\bcop(?:y|ies)\b|\bsupply|\bdisclose|'
                 r'\bidentify|\bstate\b|\bexplain|\brequest|\bany (?:record|document|correspondence|information)|'
                 r'\bdo you hold|\bis there|\bare there|\bwhat |\bwhen |\bwho |\bwhy |\bhow ', re.I)


def questions_in(text):
    """The asks in a sent message: numbered items that ask for something, else
    sentences ending in '?', else the opening of the message as one request."""
    items = [i for i in split_items(text) if ASK.search(i[:400])]
    if items:
        return items[:30]
    qs = [q.strip() for q in re.findall(r'(?s)(?:^|(?<=[.!?\n]))\s*([^.!?\n][^?]{15,400}\?)', text)]
    if qs:
        return qs[:12]
    return [text[:600]] if text else []


STOP = set('the a an of and or to in on for by with at from is are was were be been this that these those any all '
           'please confirm whether your you my our we i it its as not no if which what when who how there their '
           'has have had do does did can could would should may will shall'.split())


def words(s):
    return {w for w in re.findall(r"[a-z0-9'/.-]{3,}", s.lower()) if w not in STOP}


def sim(a, b):
    a, b = words(a[:600]), words(b[:600])
    return len(a & b) / max(1, min(len(a), len(b))) if a and b else 0.0


KINDS = [
    ('refused', r'section 1[24]\b|s\.? ?1[24]\b|exempt|neither confirm nor deny|section 23|23\(5\)|section 40|vexatious|refus'),
    ('not-held', r'not (?:been )?(?:found|held|located)|no (?:record|records|mention|information|deeds?|letters?)\b|do(?:es)? not hold|hold no|nothing (?:further|of any relevance)|unable to locate|no further information|cannot be located'),
    ('redirected', r'held (?:at|by) the|contact (?:them|the)|you should contact|please contact|is held at|directed to|refer to'),
    ('reasonably-accessible', r'section 21|accessible (?:to the applicant )?by other means|publicly accessible'),
    ('pending', r'acknowledg|in due course|within 20 working days|will (?:respond|reply|be in touch)|passed (?:over|to)|clarif(?:y|ication)'),
    ('provided', r'attached|please find|we can confirm|i can confirm|the document is|holds some information|enclosed|copy (?:of|is)'),
]


AUTO = re.compile(r'automated response|automatic reply|out of (?:the )?office|address not found|delivery status notification|'
                  r'message (?:wasn.t delivered|blocked)|this mailbox is not monitored|no longer (?:supported|monitored)|'
                  r'not the correct method of contact|submission .{0,20}was received|your question was submitted|'
                  r'my next working day|i am (?:currently )?(?:away|out of|on leave)|away from (?:chambers|the office)', re.I)


def kind_of(text, question=''):
    """What kind of answer a reply is. Order matters: an automated bounce or a bare
    acknowledgement is not an answer, and a reply that both supplies records and
    says others are not held is 'partial', not 'not-held'."""
    t = (text or '').lower()
    if not t:
        return 'unanswered'
    if AUTO.search(t):
        return 'auto'
    if question and sim(question, text) > 0.8 and len(text) < len(question) * 1.6:
        return 'pending'                      # the reply only echoes the ask back
    hit = {k for k, pat in KINDS if re.search(pat, t)}
    if 'refused' in hit:
        return 'refused'
    if 'provided' in hit and 'not-held' in hit:
        return 'partial'
    for k in ('provided', 'not-held', 'reasonably-accessible', 'redirected'):
        if k in hit:
            return k
    if 'pending' in hit and len(t) < 2500:
        return 'pending'
    return 'reply'


def qa_id(*parts):
    return 'qa-' + hashlib.sha1('|'.join(parts).encode()).hexdigest()[:12]


by_thread = defaultdict(list)
for m in msgs:
    by_thread[(m['party'], m['thread'])].append(m)

qa = []
for (party, thread), ms in by_thread.items():
    ms.sort(key=lambda m: m['date'] or '')
    for i, m in enumerate(ms):
        if m['direction'] != 'sent':
            continue
        reply = next((r for r in ms[i + 1:] if r['direction'] == 'received'), None)
        qs = questions_in(m['body'])
        base = {'party': party, 'party_name': PARTY_NAME.get(party, party), 'thread': thread,
                'thread_title': m.get('thread_title') or m.get('subject', ''), 'asked': (m['date'] or '')[:10],
                'asked_msg': m['id'], 'answered': (reply['date'] or '')[:10] if reply else '',
                'answer_msg': reply['id'] if reply else '', 'ref': m.get('ref') or (reply or {}).get('ref', ''),
                'url': (reply or m).get('url', '')}
        if reply is None:
            qa.append(base | {'id': qa_id(m['id'], 'open'), 'question': '\n'.join(qs)[:2000], 'answer': '',
                              'kind': 'unanswered', 'pairing': 'unanswered', 'n_asks': len(qs)})
            continue
        # pair each ask with the reply item that echoes it most closely
        a_items, used, rest = split_items(reply['body']), set(), []
        for n, q in enumerate(qs):
            best = max(((sim(q, a), j) for j, a in enumerate(a_items) if j not in used), default=(0, None))
            if best[1] is not None and best[0] >= 0.3:
                used.add(best[1])
                ans = a_items[best[1]]
                qa.append(base | {'id': qa_id(m['id'], str(n)), 'question': q.strip(), 'answer': ans.strip(),
                                  'kind': kind_of(ans, q), 'pairing': 'item', 'n_asks': 1})
            else:
                rest.append(q)
        if rest:
            qa.append(base | {'id': qa_id(m['id'], 'thread'), 'question': '\n'.join(rest)[:2000],
                              'answer': reply['body'][:2500].strip(), 'kind': kind_of(reply['body']),
                              'pairing': 'thread', 'n_asks': len(rest)})
    # replies with no preceding request in the corpus still carry answers
    asked_replies = {q['answer_msg'] for q in qa}
    for r in ms:
        if r['direction'] == 'received' and r['id'] not in asked_replies:
            qa.append({
                'id': qa_id(r['id'], 'unsolicited'), 'party': party, 'party_name': PARTY_NAME.get(party, party),
                'thread': thread, 'thread_title': r.get('thread_title') or r.get('subject', ''),
                'asked': '', 'asked_msg': '', 'question': 'Reply received: ' + (r.get('subject') or r.get('thread_title') or ''),
                'answered': (r['date'] or '')[:10], 'answer_msg': r['id'], 'answer': r['body'][:1800],
                'kind': kind_of(r['body']), 'pairing': 'reply-only', 'ref': r.get('ref', ''), 'url': r.get('url', ''),
                'n_asks': 0,
            })

for q in qa:
    text = q['question'] + '\n' + q['answer']
    q['refs'] = refs(text)
    q['years'] = years(text)
    # what the answer is actually about: references in the answer, plus the
    # question's own references when it is a single, specific ask
    q_refs = refs(q['question'])
    q['link_refs'] = sorted(set(refs(q['answer'])) | (set(q_refs) if q['pairing'] == 'item' and len(q_refs) <= 4 else set()))

# ------------------------------------------------------------------ link Q&A to case questions and scenes
def terms_hit(text, terms):
    t = text.lower()
    return [x for x in terms if x.lower() in t]


for c in cqs:
    c['qa'] = []
for q in qa:
    text = q['question'] + '\n' + q['answer']
    q['case_questions'] = []
    for c in cqs:
        hits = terms_hit(text, c['match'])
        if hits:
            q['case_questions'].append(c['id'])
            c['qa'].append((len(hits), q['id']))
for c in cqs:
    c['qa'] = [i for _, i in sorted(c['qa'], key=lambda x: -x[0])][:40]

scene_by_id = {s['id']: s for s in scenes}
cq_by_scene = defaultdict(list)
for c in cqs:
    for sid in c['scenes']:
        assert sid in scene_by_id, (c['id'], sid)
        cq_by_scene[sid].append(c['id'])


def scene_text(s):
    return ' '.join([s['title'], s['narration'], s.get('known') or '', s.get('case') or '',
                     ' '.join(e['title'] for e in s['evidence'])])


def scene_year(s):
    y = s['date'][:4]
    return int(y) if y.lstrip('-').isdigit() and 1000 < int(y) < 2100 else None


qa_by_id = {q['id']: q for q in qa}
for s in scenes:
    st = scene_text(s)
    s_refs, y = set(refs(st)), scene_year(s)
    scored = []
    for q in qa:
        if not q['answer'] or q['kind'] in ('auto', 'pending'):
            continue
        shared = len(s_refs & set(q['link_refs']))
        cq_shared = len(set(cq_by_scene[s['id']]) & set(q['case_questions']))
        score = 4 * shared + 2 * cq_shared + (1 if y and y < 1990 and y in years(q['answer']) else 0)
        score += {'provided': 2, 'partial': 1, 'not-held': 1, 'refused': 1}.get(q['kind'], 0)
        if shared or (cq_shared and score >= 3):
            scored.append((score, q['answered'] or q['asked'], q['id']))
    scored.sort(key=lambda x: (-x[0], x[1]))
    s['_qa'] = [i for _, _, i in scored[:6]]

# ------------------------------------------------------------------ evidence grade per scene
DOCUMENTARY = {'Court record', 'Land Registry record', 'Photograph', 'Official correspondence', 'Newspaper',
               'Heritage record', 'Planning file', 'Estate papers', 'National monument record', 'Public record',
               'Publication', 'Parliament', 'Document', 'Museum record', 'Archaeological record'}
FAMILY = {"Mary's statement", 'Family account', 'Family case'}
CQ = {c['id']: c for c in cqs}
GRADE_TEXT = {
    'documented': 'Documented: two or more primary records.',
    'single-source': 'Single source: one primary record so far.',
    'family-account': "Family account: rests on the family's own account so far; no independent record yet.",
    'contested': 'Contested: the sources disagree. See the open question.',
    'argument': "The family's argument from the record, not an event.",
}


def grade(s):
    if s['act'] in ('O', 'E') and s['basis'] in ('Analysis', 'Family case'):
        return 'argument'
    if any(CQ[c]['status'] == 'contested' for c in cq_by_scene[s['id']]):
        return 'contested'
    types = [e['type'] for e in s['evidence']]
    doc = [t for t in types if t in DOCUMENTARY]
    if s['basis'] in FAMILY and not doc:
        return 'family-account'
    if len(doc) >= 2:
        return 'documented'
    if len(doc) == 1:
        return 'single-source'
    return 'family-account' if any(t in FAMILY for t in types) or s['basis'] in FAMILY else 'single-source'


for s in scenes:
    g = grade(s)
    s['grade'] = g
    s['grade_text'] = GRADE_TEXT[g]
    s['questions'] = [{'id': c, 'question': CQ[c]['question'], 'status': CQ[c]['status'],
                       'answer': CQ[c]['answer'], 'next': CQ[c]['next']} for c in cq_by_scene[s['id']]]
    s['qa'] = [{k: qa_by_id[i][k] for k in ('id', 'party_name', 'asked', 'answered', 'kind', 'pairing', 'url', 'ref')}
               | {'question': qa_by_id[i]['question'][:400], 'answer': qa_by_id[i]['answer'][:700]} for i in s.pop('_qa')]

# ------------------------------------------------------------------ graph
nodes, edges = [], []
def node(id, type, label, **data):
    nodes.append({'id': id, 'type': type, 'label': label, **data})
def edge(s, t, type):
    edges.append({'s': s, 't': t, 'type': type})

for pid, name in sorted(PARTY_NAME.items()):
    node('party:' + pid, 'party', name)
for s in scenes:
    node('scene:' + s['id'], 'scene', f"{s['ref']} {s['title']}", date=s['date'], act=s['act'], grade=s['grade'])
    for r in refs(scene_text(s)):
        edge('scene:' + s['id'], 'ref:' + r, 'cites')
    for c in cast_ids if (cast_ids := s.get('cast')) else []:
        edge('scene:' + s['id'], 'person:' + c, 'features')
for c in seed['cast']:
    node('person:' + c['id'], 'person', c['name'], years=c['years'])
for c in cqs:
    node('cq:' + c['id'], 'case_question', c['question'], status=c['status'])
    for sid in c['scenes']:
        edge('cq:' + c['id'], 'scene:' + sid, 'about')
    for qid in c['qa']:
        edge('qa:' + qid, 'cq:' + c['id'], 'bears_on')
for m in msgs:
    node('msg:' + m['id'], 'message', m.get('subject') or m.get('thread_title', ''), date=m['date'],
         direction=m['direction'], party=m['party'], url=m.get('url', ''))
    edge('msg:' + m['id'], 'party:' + m['party'], 'sent_to' if m['direction'] == 'sent' else 'sent_by')
for q in qa:
    node('qa:' + q['id'], 'qa', q['question'][:140], kind=q['kind'], pairing=q['pairing'], party=q['party'])
    if q['asked_msg']:
        edge('qa:' + q['id'], 'msg:' + q['asked_msg'], 'asked_in')
    if q['answer_msg']:
        edge('qa:' + q['id'], 'msg:' + q['answer_msg'], 'answered_in')
    for r in q['refs']:
        edge('qa:' + q['id'], 'ref:' + r, 'cites')
for s in scenes:
    for x in s['qa']:
        edge('qa:' + x['id'], 'scene:' + s['id'], 'bears_on')
for d in docs:
    node(d['id'], 'document', d['title'], holder=d['holder'], reference=d['reference'], date=d['date'])
    for r in refs(d['body'] + ' ' + d['reference']):
        edge(d['id'], 'ref:' + r, 'cites')
all_refs = sorted({e['t'][4:] for e in edges if e['t'].startswith('ref:')})
for r in all_refs:
    node('ref:' + r, 'reference', r)

graph = {'built_from': {'messages': len(msgs), 'parties': len({m['party'] for m in msgs}), 'scenes': len(scenes),
                        'case_questions': len(cqs), 'documents': len(docs)},
         'nodes': nodes, 'edges': edges}

# ------------------------------------------------------------------ write
os.makedirs(J(SITE, 'api'), exist_ok=True)
json.dump(graph, open(J(SITE, 'api/graph.json'), 'w', encoding='utf-8'), ensure_ascii=False)
json.dump({'qa': qa, 'case_questions': [{k: v for k, v in c.items()} for c in cqs]},
          open(J(SITE, 'api/qa.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=0)

story = dict(seed)
story['scenes'] = scenes
story['case_questions'] = [{'id': c['id'], 'question': c['question'], 'status': c['status'], 'answer': c['answer'],
                            'for': c['for'], 'against': c['against'], 'next': c['next'],
                            'scenes': c['scenes'], 'qa_count': len(c['qa'])} for c in cqs]
story['graph'] = graph['built_from'] | {'qa': len(qa), 'answered': sum(1 for q in qa if q['answer'])}
json.dump(story, open(J(SITE, 'src/data/story.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)


def sql_str(v):
    return "'" + str(v).replace("'", "''") + "'" if v is not None else 'NULL'


sql = ['DROP TABLE IF EXISTS nodes;', 'DROP TABLE IF EXISTS edges;', 'DROP TABLE IF EXISTS qa;',
       'DROP TABLE IF EXISTS messages;', 'DROP TABLE IF EXISTS qa_fts;', 'DROP TABLE IF EXISTS messages_fts;',
       'CREATE TABLE nodes (id TEXT PRIMARY KEY, type TEXT, label TEXT, data TEXT);',
       'CREATE TABLE edges (src TEXT, dst TEXT, type TEXT);',
       'CREATE INDEX edges_src ON edges(src); CREATE INDEX edges_dst ON edges(dst);',
       'CREATE TABLE qa (id TEXT PRIMARY KEY, party TEXT, party_name TEXT, thread TEXT, asked TEXT, question TEXT, '
       'answered TEXT, answer TEXT, kind TEXT, pairing TEXT, ref TEXT, url TEXT, case_questions TEXT);',
       'CREATE TABLE messages (id TEXT PRIMARY KEY, party TEXT, date TEXT, direction TEXT, subject TEXT, body TEXT, url TEXT);',
       'CREATE VIRTUAL TABLE qa_fts USING fts5(id UNINDEXED, question, answer, party_name);',
       'CREATE VIRTUAL TABLE messages_fts USING fts5(id UNINDEXED, subject, body);']
for n in nodes:
    data = {k: v for k, v in n.items() if k not in ('id', 'type', 'label')}
    sql.append(f"INSERT INTO nodes VALUES ({sql_str(n['id'])},{sql_str(n['type'])},{sql_str(n['label'])},{sql_str(json.dumps(data, ensure_ascii=False))});")
for e in edges:
    sql.append(f"INSERT INTO edges VALUES ({sql_str(e['s'])},{sql_str(e['t'])},{sql_str(e['type'])});")
for q in qa:
    sql.append('INSERT INTO qa VALUES (' + ','.join(sql_str(q[k]) for k in (
        'id', 'party', 'party_name', 'thread', 'asked', 'question', 'answered', 'answer', 'kind', 'pairing', 'ref', 'url'))
        + ',' + sql_str(','.join(q['case_questions'])) + ');')
    sql.append(f"INSERT INTO qa_fts VALUES ({sql_str(q['id'])},{sql_str(q['question'])},{sql_str(q['answer'])},{sql_str(q['party_name'])});")
for m in msgs:
    body = m['body'][:30000]
    sql.append('INSERT INTO messages VALUES (' + ','.join(sql_str(x) for x in (
        m['id'], m['party'], m['date'], m['direction'], m.get('subject', ''), body, m.get('url', ''))) + ');')
    sql.append(f"INSERT INTO messages_fts VALUES ({sql_str(m['id'])},{sql_str(m.get('subject', ''))},{sql_str(body)});")
open(J(SITE, 'api/graph.sql'), 'w', encoding='utf-8').write('\n'.join(sql) + '\n')

gc = Counter(s['grade'] for s in scenes)
kc = Counter(q['kind'] for q in qa)
print(f"{len(msgs)} messages, {len(qa)} Q&A ({sum(1 for q in qa if q['pairing']=='item')} item-paired, "
      f"{sum(1 for q in qa if q['pairing']=='unanswered')} unanswered), {len(cqs)} case questions, {len(docs)} documents")
print('answers:', dict(kc))
print('scene grades:', dict(gc))
print(f"graph: {len(nodes)} nodes, {len(edges)} edges; scenes with Q&A: {sum(1 for s in scenes if s['qa'])}/{len(scenes)}")
