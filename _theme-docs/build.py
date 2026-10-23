#!/usr/bin/env python3
"""Build docs.bucklerfamily.estate from RST source (DOCS-STANDARD.md).

Cloudflare Pages runs:  python3 _theme-docs/build.py      (output directory: public)
Locally:                python3 _theme-docs/build.py [--only <collection>/<document>]
Translations:           python3 _theme-docs/build.py --update-po <collection>/<document>
Checks only:            python3 _theme-docs/build.py --check

For every document (<collection>/<document>/latest/doc.json) and every language it lists:
  HTML -> public/<collection>/<document>/latest/html/<lang>/            (Sphinx, Furo theme)
then public/docs.json (the navigation index), the library-style menus (home -> collection -> document)
and public/sitemap.xml. The site is HTML only: older versions are PDFs in the wayback archive, made by
_theme-docs/release.py when a version is replaced and listed in each doc.json "archive" (DOCS-STANDARD.md §6).
— Sion's Tab agent
"""
import json, os, re, shutil, subprocess, sys, tempfile, datetime, pathlib, threading, html as _html

ROOT = pathlib.Path(__file__).resolve().parent.parent
KIT = ROOT / '_theme-docs'
CONF = KIT / 'sphinx'
OUT = ROOT / 'public'
SITE = os.environ.get('DOCS_SITE_URL', 'https://docs.bucklerfamily.estate')
GHF_BOOT = '<script src="https://bucklerfamily.estate/ghf-lang/ghf-boot.js?v=2.1.2"></script>'
ID_RE = re.compile(r'^[a-z0-9]+_[a-z0-9]+$')
VER_RE = re.compile(r'^\d+\.\d+\.\d+$')
DATE_RE = re.compile(r'^\d{4}-\d{2}-\d{2}$')
SEMVER = lambda v: tuple(int(x) for x in v.split('.'))
CAT_RE = re.compile(r'^[A-Z]{2,5}-\d{4}$')   # catalogue ID ref (§3.2)
REQUIRED = ['id', 'catalogue', 'title', 'summary', 'version', 'date', 'updated', 'languages', 'source_language', 'author', 'status']
LANG_NAMES = {'en': 'English', 'cy': 'Cymraeg', 'es': 'Español', 'de': 'Deutsch', 'fr': 'Français', 'it': 'Italiano', 'pt': 'Português'}
WORD_HOME = {'en': 'All documents', 'cy': 'Pob dogfen', 'es': 'Todos los documentos', 'de': 'Alle Dokumente', 'fr': 'Tous les documents'}
WORD_VERSION = {'en': 'Version', 'cy': 'Fersiwn', 'es': 'Versión', 'de': 'Version', 'fr': 'Version'}
WAYBACK = os.environ.get('DOCS_WAYBACK_URL', 'https://wayback.bucklerfamily.estate')
ARCHIVE_DIR = 'pdf/docs-archive'                       # wayback branch: wayback/pdf/docs-archive/..., served at /pdf/docs-archive/...
WORD_LATEST = {'en': 'Latest', 'cy': 'Diweddaraf', 'es': 'Reciente', 'de': 'Neueste', 'fr': 'Dernier'}
WORD_OLDER = {'en': 'Older versions (PDF)', 'cy': 'Fersiynau hŷn (PDF)', 'es': 'Versiones anteriores (PDF)',
              'de': 'Ältere Versionen (PDF)', 'fr': 'Versions précédentes (PDF)'}
WORD_THIS_PDF = {'en': 'This version (PDF)', 'cy': 'Y fersiwn hon (PDF)', 'es': 'Esta versión (PDF)',
                 'de': 'Diese Version (PDF)', 'fr': 'Cette version (PDF)'}
BANNED = ['says', 'claims', 'according to', 'hearsay', 'unverified', 'alleged', 'fraud', 'stolen']


def log(*a):
    print('[docs]', *a, flush=True)


def find_docs(only=None):
    docs = []
    for meta in sorted(ROOT.glob('*_*/*_*/latest/doc.json')):
        coll, slug = meta.parts[-4], meta.parts[-3]
        if only and f'{coll}/{slug}' != only:
            continue
        docs.append((coll, slug, meta))
    return docs


def validate(coll, slug, meta):
    errs = []
    d = json.loads(meta.read_text(encoding='utf-8'))
    for k in REQUIRED:
        if k not in d or d[k] in ('', None, []):
            errs.append(f'missing field "{k}"')
    if not ID_RE.match(coll) or not ID_RE.match(slug):
        errs.append('folder names must be <id>_<id> in lowercase letters and digits')
    if d.get('id') != f'{coll}/{slug}':
        errs.append(f'id "{d.get("id")}" does not match its folder {coll}/{slug}')
    cat = str(d.get('catalogue', ''))
    if cat and not CAT_RE.match(cat):
        errs.append('catalogue must be a catalogue ID like EV-0031 (2 to 5 capital letters, a hyphen, 4 digits)')
    elif cat and not str(d.get('title', '')).startswith(cat + ' — '):
        errs.append(f'title must start with its catalogue ID: "{cat} — …"')
    if not VER_RE.match(str(d.get('version', ''))):
        errs.append('version must be MAJOR.MINOR.PATCH')
    for k in ('date', 'updated'):
        if not DATE_RE.match(str(d.get(k, ''))):
            errs.append(f'{k} must be YYYY-MM-DD')
    errs += check_archive(coll, slug, d)
    src = meta.parent / 'source'
    if not (src / 'index.rst').exists():
        errs.append('source/index.rst is missing')
    if d.get('source_language') not in d.get('languages', []):
        errs.append('source_language must be listed in languages')
    for lang in d.get('languages', []):
        if lang != d.get('source_language') and not (src / 'locales' / lang / 'LC_MESSAGES' / 'docs.po').exists():
            errs.append(f'no catalogue for "{lang}" (source/locales/{lang}/LC_MESSAGES/docs.po)')
    tracked = subprocess.run(['git', 'ls-files', '--', str(meta.parent)], cwd=ROOT, capture_output=True, text=True).stdout.split()
    if any(f.endswith(('.mo', '.html', '.pdf')) or '/build/' in f for f in tracked):
        errs.append('build output (html, pdf, .mo or build/) is committed; the branch holds source only')
    for mo in src.rglob('*.mo'):
        mo.unlink()                                       # stale local compile; Sphinx makes a fresh one
    if (ROOT / coll / 'collection.json').exists() is False:
        errs.append(f'{coll}/collection.json is missing')
    rec = d.get('record')
    verbatim = set()
    if rec is not None:                                   # a record carried over unchanged from its source (§5.6)
        if not isinstance(rec, dict) or not rec.get('catalogue') or not str(rec.get('source', '')).startswith('https://'):
            errs.append('record needs "catalogue" and an https "source"')
        else:
            verbatim = {src / f for f in rec.get('verbatim', [])}
            for f in verbatim:
                if not f.exists():
                    errs.append(f'record verbatim file {f.name} is missing')
    def _authored(p):
        t = p.read_text(encoding='utf-8')
        if rec is not None and p == src / 'index.rst':
            t = '\n'.join(t.split('\n')[2:])                 # the H1 is the record's own title (= doc.json title)
            t = re.sub(r'<https?://[^>\s]+>', '', t)           # link targets to the record's own addresses are not wording
        return t.lower()
    text = ' '.join(_authored(p) for p in list(src.rglob('*.rst')) + list(src.rglob('*.po')) if p not in verbatim)
    text += ' ' + str(d.get('summary', '')).lower()
    for word in BANNED:
        if re.search(r'\b' + re.escape(word) + r'\b', text):
            errs.append(f'banned word "{word}" in the text')
    return d, errs


def archive_name(coll, slug, lang, version, date, cat=None):
    """Library naming for an edition as PDF: YYYY-MM-DD_<CATALOGUE>_<collection>-<document>_<lang>_vX-Y-Z.pdf (§2.7; language
    before version). Without a catalogue ID: the name editions had before DOCS-STANDARD 1.5.0 (kept for those files)."""
    c = f"{cat}_" if cat else ''
    return f"{date}_{c}{coll}-{slug}_{lang}_v{version.replace('.', '-')}.pdf"


def archive_url(coll, slug, lang, version, date, cat=None):
    return f"{WAYBACK}/{ARCHIVE_DIR}/{coll}/{slug}/{lang}/{archive_name(coll, slug, lang, version, date, cat)}"


def check_archive(coll, slug, d):
    """doc.json "archive": [{"version", "date", "pdf": {"<lang>": "<wayback url>"}}], newest first, every version older than the current one."""
    errs, seen = [], []
    cur_pdf = d.get('pdf')                                # the current version as PDF in wayback (§6.7), optional
    if cur_pdf is not None:
        if not isinstance(cur_pdf, dict) or not cur_pdf:
            errs.append('pdf must be {lang: url}')
        else:
            for lang, url in cur_pdf.items():
                want = archive_url(coll, slug, lang, str(d.get('version', '')), str(d.get('updated', '')), d.get('catalogue'))
                if lang not in d.get('languages', []):
                    errs.append(f'pdf [{lang}] is not one of the languages')
                elif url != want:
                    errs.append(f'pdf [{lang}] url must be {want}')
    arc = d.get('archive', [])
    if not isinstance(arc, list):
        return ['archive must be a list']
    cur = d.get('version', '0.0.0')
    for a in arc:
        v, dt, pdf = str(a.get('version', '')), str(a.get('date', '')), a.get('pdf') or {}
        if not VER_RE.match(v) or not DATE_RE.match(dt) or not isinstance(pdf, dict) or not pdf:
            errs.append(f'archive entry {a} needs version (x.y.z), date (YYYY-MM-DD) and pdf {{lang: url}}')
            continue
        if VER_RE.match(cur) and SEMVER(v) >= SEMVER(cur):
            errs.append(f'archive version {v} is not older than the current version {cur}')
        if seen and SEMVER(v) >= SEMVER(seen[-1]):
            errs.append('archive entries must be newest first')
        seen.append(v)
        for lang, url in pdf.items():
            if url not in (archive_url(coll, slug, lang, v, dt, d.get('catalogue')), archive_url(coll, slug, lang, v, dt)):
                errs.append(f'archive {v} [{lang}] url must be {archive_url(coll, slug, lang, v, dt, d.get("catalogue"))}')
    return errs


def po_lookup(src, lang, msgid):
    """The translated string for msgid in source/locales/<lang>/LC_MESSAGES/docs.po (or msgid)."""
    po = src / 'locales' / lang / 'LC_MESSAGES' / 'docs.po'
    if not po.exists():
        return msgid
    from babel.messages.pofile import read_po
    with open(po, 'rb') as f:
        cat = read_po(f)
    m = cat.get(msgid)
    return m.string if m is not None and m.string and not m.fuzzy else msgid


def sphinx(builder, src, out, env, doctrees):
    cmd = [sys.executable, '-m', 'sphinx', '-b', builder, '-q', '-c', str(CONF), '-d', str(doctrees), str(src), str(out)]
    r = subprocess.run(cmd, env=env, capture_output=True, text=True)
    if r.returncode != 0:
        log(r.stdout[-3000:], r.stderr[-3000:])
        raise SystemExit(f'sphinx -b {builder} failed for {src}')
    for line in (r.stderr or '').splitlines():
        if 'WARNING' in line or 'ERROR' in line:
            log('  ', line.strip()[:300])


def inject_boot(folder):
    """ghf-boot.js is the last element of <head> on every generated page (family-site header rule)."""
    for f in folder.rglob('*.html'):
        t = f.read_text(encoding='utf-8')
        if 'ghf-boot.js' in t:
            continue
        if 'data-ghf-native' not in t:   # drawn in both schemes (Furo light/dark follows the family mode): never colour-inverted
            t = re.sub(r'<html\b', '<html data-ghf-native="auto"', t, count=1)
        t = t.replace('</head>', GHF_BOOT + '\n</head>', 1)
        f.write_text(t, encoding='utf-8')


def redirect_page(path, target_js, fallback, title='docs'):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(f"""<!DOCTYPE html>
<html lang="en" data-ghf-native="auto"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>{_html.escape(title)}</title><meta name="robots" content="noindex"><link rel="canonical" href="{fallback}">
<script>{target_js}</script>
{GHF_BOOT}
</head><body><p><a href="{fallback}">{_html.escape(title)}</a></p></body></html>
""", encoding='utf-8')


def doc_env(coll, slug, meta, d, lang, extra=None):
    """Environment for one Sphinx run of one document in one language (shared by the HTML build and release.py)."""
    src = meta.parent / 'source'
    title = po_lookup(src, lang, d['title']) if lang != d['source_language'] else d['title']
    env = dict(os.environ, DOCS_DOC_JSON=str(meta), DOCS_LANG=lang, DOCS_TITLE=title,
               DOCS_SUBTITLE=f"{WORD_VERSION.get(lang, 'Version')} {d['version']} · {d['updated']}")
    env.update(extra or {})
    return title, env


def build_pdf(coll, slug, meta, d, lang, out_dir):
    """One PDF of the document as it stands in the working tree (rinohtype, no TeX). Used by release.py only:
    the site itself serves no PDFs; replaced editions are archived to wayback (DOCS-STANDARD.md §6)."""
    src = meta.parent / 'source'
    pdf_name = f'{coll}-{slug}.pdf'
    _, env = doc_env(coll, slug, meta, d, lang)
    out_dir = pathlib.Path(out_dir)
    with tempfile.TemporaryDirectory(prefix='docs-pdf-') as tmp:
        tmp = pathlib.Path(tmp)
        sphinx('rinoh', src, tmp / 'pdf', env, tmp / 'dt')
        out_dir.mkdir(parents=True, exist_ok=True)
        shutil.copy2(tmp / 'pdf' / pdf_name, out_dir / pdf_name)
    for mo in src.rglob('*.mo'):
        mo.unlink()
    return out_dir / pdf_name


_SHARED_LOCK = threading.Lock()
SHARED_STATIC = OUT / '_static'
KEEP_LOCAL = {'documentation_options.js'}            # carries the document's own version and language


def share_static(html_out):
    """One shared copy of the theme files for the whole site (DOCS-STANDARD.md §10.7): every file of a document's _static that is
    byte-identical to the shared copy at /_static/<same path> is dropped from the document and its pages point at /_static/.
    A file that differs (another language's search data, a newer theme) stays with its document. Keeps the deploy far under
    Cloudflare Pages' 20,000-file cap (about 10 files per one-language document instead of 27)."""
    st = html_out / '_static'
    if not st.is_dir():
        return
    moved = set()
    for f in sorted(st.rglob('*')):
        if not f.is_file():
            continue
        rel = f.relative_to(st).as_posix()
        if rel in KEEP_LOCAL:
            continue
        data = f.read_bytes()
        dest = SHARED_STATIC / rel
        with _SHARED_LOCK:
            if not dest.exists():
                dest.parent.mkdir(parents=True, exist_ok=True)
                dest.write_bytes(data)
            elif dest.read_bytes() != data:
                continue
        f.unlink()
        moved.add(rel)
    for sub in sorted(st.rglob('*'), reverse=True):
        if sub.is_dir() and not any(sub.iterdir()):
            sub.rmdir()
    if not moved:
        return
    pat = re.compile(r'((?:href|src)=")((?:\.\./)*)_static/([^"?#]+)')
    for h in html_out.rglob('*.html'):
        t = h.read_text(encoding='utf-8')
        t2 = pat.sub(lambda m: m.group(1) + '/_static/' + m.group(3) if m.group(3) in moved else m.group(0), t)
        if t2 != t:
            h.write_text(t2, encoding='utf-8')


def build_doc(coll, slug, meta, d):
    src = meta.parent / 'source'
    base = OUT / coll / slug / 'latest'
    langs = d['languages']
    entry = {'id': d['id'], 'collection': coll, 'document': slug, 'version': d['version'], 'date': d['date'],
             'updated': d['updated'], 'author': d['author'], 'status': d['status'], 'source_language': d['source_language'],
             'archive': [{'version': a['version'], 'date': a['date'], 'languages': sorted(a['pdf'])} for a in d.get('archive', [])],
             'pdf_languages': sorted(d.get('pdf') or {}),
             'languages': []}
    with tempfile.TemporaryDirectory(prefix='docs-') as tmp:
        tmp = pathlib.Path(tmp)
        for lang in langs:
            older = [{'version': a['version'], 'date': a['date'], 'pdf': a['pdf'][lang]}
                     for a in d.get('archive', []) if lang in a['pdf']]
            title, env = doc_env(coll, slug, meta, d, lang, {
                'DOCS_LANG_LINKS': json.dumps([{'code': l, 'name': LANG_NAMES.get(l, l), 'href': f'../{l}/',
                                                'current': l == lang} for l in langs]),
                'DOCS_ARCHIVE': json.dumps(older), 'DOCS_ARCHIVE_LABEL': WORD_OLDER.get(lang, WORD_OLDER['en']),
                'DOCS_PDF': (d.get('pdf') or {}).get(lang, ''), 'DOCS_PDF_LABEL': WORD_THIS_PDF.get(lang, WORD_THIS_PDF['en']),
                'DOCS_HOME_HREF': '/', 'DOCS_HOME_LABEL': WORD_HOME.get(lang, 'All documents'),
                'DOCS_BASEURL': f'{SITE}/{coll}/{slug}/latest/html/{lang}/'})
            summary = po_lookup(src, lang, d['summary']) if lang != d['source_language'] else d['summary']
            html_out = base / 'html' / lang
            log(f'{d["id"]} [{lang}] html')
            sphinx('html', src, html_out, env, tmp / f'dt-html-{lang}')
            for junk in ('.buildinfo', 'objects.inv'):
                (html_out / junk).unlink(missing_ok=True)
            for m in html_out.rglob('*.map'):          # theme source maps: never requested by readers; keeps the deploy under Pages' file cap
                m.unlink()
            share_static(html_out)
            inject_boot(html_out)
            entry['languages'].append({
                'code': lang, 'name': LANG_NAMES.get(lang, lang), 'title': title, 'summary': summary,
                'html': f'/{coll}/{slug}/latest/html/{lang}/', 'pdf': (d.get('pdf') or {}).get(lang), 'archive': older})
    codes = json.dumps(langs)
    redirect_page(base / 'html' / 'index.html',
                  f"var L={codes},n=(navigator.language||'').slice(0,2);location.replace('./'+(L.indexOf(n)>-1?n:'{d['source_language']}')+'/');",
                  f'./{d["source_language"]}/', d['title'])
    for mo in src.rglob('*.mo'):
        mo.unlink()                                   # compiled catalogues are build output, never committed
    entry['title'] = entry['languages'][0]['title'] if entry['languages'] else d['title']
    entry['summary'] = entry['languages'][0]['summary'] if entry['languages'] else d['summary']
    return entry


# ---- Library-style menus: home (collections) -> collection (documents) -> document (languages: HTML, older PDFs) ----

def _t(obj, lang='en'):
    return obj.get(lang) or obj.get('en') or next(iter(obj.values()), '') if isinstance(obj, dict) else str(obj)


def menu_page(path, title, body, depth, desc=''):
    """One static menu page in the library's explorer layout (translucent bands, rounded buttons), no JS needed; family day/night colours."""
    esc = _html.escape
    up = '' if depth == 0 else '<a class="up" href="../" aria-label="Back">&laquo;</a>'
    rel = '../' * depth
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(f"""<!DOCTYPE html>
<html lang="en" data-ghf-native="auto">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{esc(title)}</title>
<meta name="description" content="{esc(desc or title)}">
<meta name="theme-color" content="#000000">
<link rel="alternate" type="application/json" href="/docs.json" title="Document index">
<link rel="stylesheet" href="{rel}library.css">
<script src="/_static/docs-modal.js" defer></script>
{GHF_BOOT}
</head>
<body>
<main class="lib">
{up}{body}
</main>
</body>
</html>
""", encoding='utf-8')


def band(label, buttons, cls=''):
    return f'<section class="band {cls}"><h2 class="title-line">{label}</h2><div class="btns">{"".join(buttons)}</div></section>'


def render_menus(index, entries):
    esc = _html.escape
    colls = index['collections']
    # home: one band per subsidiary (the part of the collection id before "_"), one button per collection
    groups = {}
    for c in colls:
        groups.setdefault(c['subsidiary'], []).append(c)
    body = ''
    for sub, cs in groups.items():
        body += band(esc(_t(cs[0]['subsidiary_title'])),
                     [f'<a class="btn" href="/{c["id"]}/">{esc(_t(c["title"]))}</a>' for c in cs])
    menu_page(OUT / 'index.html', 'Docs · bucklerfamily.estate', body, 0,
              'Documents of the Buckler family estate: pick a category, then a document; each language reads online, older versions are PDFs.')
    # collection: one band per document group (the part of the document id before "_"), one button per document
    for c in colls:
        docs = [e for e in entries if e['collection'] == c['id']]
        groups = {}
        for e in docs:
            groups.setdefault(e['document'].split('_')[0], []).append(e)
        order = list(c.get('groups', {}))              # bands follow the order of collection.json "groups"; unknown groups after them
        body = ''
        for g, es in sorted(groups.items(), key=lambda kv: (order.index(kv[0]) if kv[0] in order else len(order), kv[0])):
            es = sorted(es, key=lambda e: (e['title'].lower(), e['id']))
            label = _t(c.get('groups', {}).get(g, {'en': g.capitalize()}))
            body += band(esc(label), [f'<a class="btn{" long" if len(e["title"]) > 48 else ""}" href="/{e["id"]}/">{esc(e["title"])}</a>'
                                      for e in es])
        menu_page(OUT / c['id'] / 'index.html', f'{_t(c["title"])} · docs', body, 1)
    # document: the document's title, then one band per language: Latest (HTML, green) and older versions (PDF, red) to its right
    for e in entries:
        rows = ''
        for l in e['languages']:
            btns = [f'<a class="btn html" href="{esc(l["html"])}" lang="{l["code"]}" title="HTML · v{esc(e["version"])}">'
                    f'{esc(WORD_LATEST.get(l["code"], "Latest"))}</a>']
            if l.get('pdf'):
                btns.append(f'<a class="btn pdf" href="{esc(l["pdf"])}" title="PDF · v{esc(e["version"])} · {esc(e["updated"])}">'
                            f'{esc(e["version"].replace(".", "-"))}</a>')
            btns += [f'<a class="btn pdf" href="{esc(a["pdf"])}" title="PDF · v{esc(a["version"])} · {esc(a["date"])}">'
                     f'{esc(a["version"].replace(".", "-"))}</a>' for a in l['archive']]
            rows += band(f'<span class="code">{l["code"].upper()}</span>{esc(l["name"])}', btns, 'lang')
        head = (f'<h1 class="doc-title">{esc(e["title"])}</h1>'
                f'<details class="about"><summary><span class="key"><b class="g">HTML</b> | <b class="r">PDF</b></span>'
                f'v{esc(e["version"])} · {esc(e["updated"])}</summary><p>{esc(e["summary"])}</p><p>{esc(e["author"])}</p></details>')
        menu_page(OUT / e['collection'] / e['document'] / 'index.html', e['title'], head + rows, 2, e['summary'])


def update_po(only):
    found = find_docs(only)
    if not found:
        raise SystemExit(f'no document {only}')
    coll, slug, meta = found[0]
    d = json.loads(meta.read_text(encoding='utf-8'))
    src = meta.parent / 'source'
    with tempfile.TemporaryDirectory(prefix='pot-') as tmp:
        env = dict(os.environ, DOCS_DOC_JSON=str(meta), DOCS_LANG=d['source_language'])
        sphinx('gettext', src, pathlib.Path(tmp) / 'pot', env, pathlib.Path(tmp) / 'dt')
        # the title and summary from doc.json are translated in the same catalogue
        pot = pathlib.Path(tmp) / 'pot' / 'docs.pot'
        extra = ''.join(f'\n#: doc.json:{k}\nmsgid {json.dumps(d[k], ensure_ascii=False)}\nmsgstr ""\n' for k in ('title', 'summary')
                        if f'msgid {json.dumps(d[k], ensure_ascii=False)}' not in pot.read_text(encoding='utf-8'))
        pot.write_text(pot.read_text(encoding='utf-8') + extra, encoding='utf-8')
        langs = [l for l in d['languages'] if l != d['source_language']]
        cmd = [sys.executable, '-m', 'sphinx_intl', 'update', '-p', str(pathlib.Path(tmp) / 'pot'), '-d', str(src / 'locales')]
        for l in langs:
            cmd += ['-l', l]
        subprocess.run(cmd, check=True)
    log('catalogues updated:', ', '.join(langs))


def main():
    args = sys.argv[1:]
    only = args[args.index('--only') + 1] if '--only' in args else None
    if '--update-po' in args:
        return update_po(args[args.index('--update-po') + 1])
    docs = find_docs(only)
    problems = []
    checked = []
    for coll, slug, meta in docs:
        d, errs = validate(coll, slug, meta)
        problems += [f'{coll}/{slug}: {e}' for e in errs]
        checked.append((coll, slug, meta, d))
    if not only:                                       # a catalogue ID belongs to one document (§3.2)
        seen_cat = {}
        for coll, slug, meta, d in checked:
            c = d.get('catalogue')
            if c and c in seen_cat:
                problems.append(f'{coll}/{slug}: catalogue {c} is already used by {seen_cat[c]}')
            seen_cat.setdefault(c, f'{coll}/{slug}')
    if problems:
        for p in problems:
            log('RULE', p)
        raise SystemExit(f'{len(problems)} rule problem(s); see DOCS-STANDARD.md')
    log(f'{len(checked)} document(s) pass the rules')
    if '--check' in args:
        return
    if OUT.exists() and not only:
        shutil.rmtree(OUT)
    OUT.mkdir(exist_ok=True)
    # documents are independent Sphinx runs: build them side by side (one per CPU); the order of entries is kept
    from concurrent.futures import ThreadPoolExecutor
    with ThreadPoolExecutor(max_workers=int(os.environ.get('DOCS_JOBS', 0)) or os.cpu_count() or 2) as pool:
        entries = list(pool.map(lambda c: build_doc(*c), checked))
    collections = {}
    for c in sorted({e['collection'] for e in entries}):
        cj = json.loads((ROOT / c / 'collection.json').read_text(encoding='utf-8'))
        sub = c.split('_')[0]
        collections[c] = {'id': c, 'title': cj['title'], 'order': cj.get('order', 50), 'subsidiary': sub,
                          'subsidiary_title': cj.get('subsidiary_title', {'en': sub.upper()}), 'groups': cj.get('groups', {})}
    index = {
        'site': SITE, 'generated': datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'),
        'commit': os.environ.get('CF_PAGES_COMMIT_SHA', '')[:7], 'branch': os.environ.get('CF_PAGES_BRANCH', ''),
        'standard': 'DOCS-STANDARD.md', 'archive_base': f'{WAYBACK}/{ARCHIVE_DIR}/', 'count': len(entries),
        'collections': sorted(collections.values(), key=lambda c: (c['order'], c['id'])),
        'documents': sorted(entries, key=lambda e: (collections[e['collection']]['order'], e['id'])),
    }
    (OUT / 'docs.json').write_text(json.dumps(index, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    for f in (KIT / 'landing').iterdir():          # library.css and _headers
        shutil.copy2(f, OUT / f.name)
    render_menus(index, index['documents'])
    # no PDFs on this site: old PDF addresses go to the document's menu (its older versions are there); anything else is a 404
    (OUT / '_redirects').write_text('/:coll/:doc/latest/pdf/* /:coll/:doc/ 301\n', encoding='utf-8')
    menu_page(OUT / '404.html', 'Not found · docs', '<section class="band"><h2 class="title-line">404</h2>'
              '<div class="btns"><a class="btn" href="/">docs.bucklerfamily.estate</a></div></section>', 0)
    urls = ([f'{SITE}/'] + [f'{SITE}/{c["id"]}/' for c in index['collections']] + [f'{SITE}/{e["id"]}/' for e in entries]
            + [SITE + l['html'] for e in entries for l in e['languages']])
    (OUT / 'sitemap.xml').write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
                                     + ''.join(f'  <url><loc>{_html.escape(u)}</loc></url>\n' for u in urls) + '</urlset>\n', encoding='utf-8')
    log(f'done: {len(entries)} document(s), {sum(len(e["languages"]) for e in entries)} HTML language build(s), '
        f'{sum(len(l["archive"]) for e in entries for l in e["languages"])} archived PDF link(s), '
        f'{sum(1 for e in entries for l in e["languages"] if l.get("pdf"))} current PDF link(s) -> {OUT}')


if __name__ == '__main__':
    main()
