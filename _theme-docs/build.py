#!/usr/bin/env python3
"""Build docs.bucklerfamily.estate from RST source (DOCS-STANDARD.md).

Cloudflare Pages runs:  python3 _theme-docs/build.py      (output directory: public)
Locally:                python3 _theme-docs/build.py [--only <collection>/<document>]
Translations:           python3 _theme-docs/build.py --update-po <collection>/<document>
Checks only:            python3 _theme-docs/build.py --check

For every document (<collection>/<document>/latest/doc.json) and every language it lists:
  HTML -> public/<collection>/<document>/latest/html/<lang>/            (Sphinx, Furo theme)
  PDF  -> public/<collection>/<document>/latest/pdf/<lang>/<collection>-<document>.pdf   (rinohtype, no TeX)
then public/docs.json (the navigation index), public/sitemap.xml and the landing page.
— Sion's Tab agent
"""
import json, os, re, shutil, subprocess, sys, tempfile, datetime, pathlib, html as _html

ROOT = pathlib.Path(__file__).resolve().parent.parent
KIT = ROOT / '_theme-docs'
CONF = KIT / 'sphinx'
OUT = ROOT / 'public'
SITE = os.environ.get('DOCS_SITE_URL', 'https://docs.bucklerfamily.estate')
GHF_BOOT = '<script src="https://bucklerfamily.estate/ghf-lang/ghf-boot.js?v=2.1.2"></script>'
ID_RE = re.compile(r'^[a-z0-9]+_[a-z0-9]+$')
VER_RE = re.compile(r'^\d+\.\d+\.\d+$')
DATE_RE = re.compile(r'^\d{4}-\d{2}-\d{2}$')
REQUIRED = ['id', 'title', 'summary', 'version', 'date', 'updated', 'languages', 'source_language', 'author', 'status']
LANG_NAMES = {'en': 'English', 'cy': 'Cymraeg', 'es': 'Español', 'de': 'Deutsch', 'fr': 'Français', 'it': 'Italiano', 'pt': 'Português'}
WORD_HOME = {'en': 'All documents', 'cy': 'Pob dogfen', 'es': 'Todos los documentos', 'de': 'Alle Dokumente', 'fr': 'Tous les documents'}
WORD_VERSION = {'en': 'Version', 'cy': 'Fersiwn', 'es': 'Versión', 'de': 'Version', 'fr': 'Version'}
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
    if not VER_RE.match(str(d.get('version', ''))):
        errs.append('version must be MAJOR.MINOR.PATCH')
    for k in ('date', 'updated'):
        if not DATE_RE.match(str(d.get(k, ''))):
            errs.append(f'{k} must be YYYY-MM-DD')
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
    text = ' '.join(p.read_text(encoding='utf-8').lower() for p in list(src.rglob('*.rst')) + list(src.rglob('*.po')))
    for word in BANNED:
        if re.search(r'\b' + re.escape(word) + r'\b', text):
            errs.append(f'banned word "{word}" in the text')
    return d, errs


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
        t = t.replace('</head>', GHF_BOOT + '\n</head>', 1)
        f.write_text(t, encoding='utf-8')


def redirect_page(path, target_js, fallback, title='docs'):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(f"""<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>{_html.escape(title)}</title><meta name="robots" content="noindex"><link rel="canonical" href="{fallback}">
<script>{target_js}</script>
{GHF_BOOT}
</head><body><p><a href="{fallback}">{_html.escape(title)}</a></p></body></html>
""", encoding='utf-8')


def build_doc(coll, slug, meta, d):
    src = meta.parent / 'source'
    base = OUT / coll / slug / 'latest'
    langs = d['languages']
    pdf_name = f'{coll}-{slug}.pdf'
    entry = {'id': d['id'], 'collection': coll, 'document': slug, 'version': d['version'], 'date': d['date'],
             'updated': d['updated'], 'author': d['author'], 'status': d['status'], 'source_language': d['source_language'],
             'languages': []}
    with tempfile.TemporaryDirectory(prefix='docs-') as tmp:
        tmp = pathlib.Path(tmp)
        for lang in langs:
            title = po_lookup(src, lang, d['title']) if lang != d['source_language'] else d['title']
            summary = po_lookup(src, lang, d['summary']) if lang != d['source_language'] else d['summary']
            html_out = base / 'html' / lang
            pdf_out = base / 'pdf' / lang
            env = dict(os.environ,
                       DOCS_DOC_JSON=str(meta), DOCS_LANG=lang, DOCS_TITLE=title,
                       DOCS_SUBTITLE=f"{WORD_VERSION.get(lang, 'Version')} {d['version']} · {d['updated']}",
                       DOCS_LANG_LINKS=json.dumps([{'code': l, 'name': LANG_NAMES.get(l, l), 'href': f'../{l}/',
                                                    'current': l == lang} for l in langs]),
                       DOCS_PDF_HREF=f'../../pdf/{lang}/{pdf_name}',
                       DOCS_HOME_HREF='../../../../../', DOCS_HOME_LABEL=WORD_HOME.get(lang, 'All documents'),
                       DOCS_BASEURL=f'{SITE}/{coll}/{slug}/latest/html/{lang}/')
            log(f'{d["id"]} [{lang}] html')
            sphinx('html', src, html_out, env, tmp / f'dt-html-{lang}')
            for junk in ('.buildinfo', 'objects.inv'):
                (html_out / junk).unlink(missing_ok=True)
            inject_boot(html_out)
            log(f'{d["id"]} [{lang}] pdf')
            sphinx('rinoh', src, tmp / f'pdf-{lang}', env, tmp / f'dt-pdf-{lang}')
            pdf_out.mkdir(parents=True, exist_ok=True)
            shutil.copy2(tmp / f'pdf-{lang}' / pdf_name, pdf_out / pdf_name)
            rel = f'{coll}/{slug}/latest'
            entry['languages'].append({
                'code': lang, 'name': LANG_NAMES.get(lang, lang), 'title': title, 'summary': summary,
                'html': f'/{rel}/html/{lang}/', 'pdf': f'/{rel}/pdf/{lang}/{pdf_name}',
                'pdf_bytes': (pdf_out / pdf_name).stat().st_size})
    codes = json.dumps(langs)
    redirect_page(base / 'html' / 'index.html',
                  f"var L={codes},n=(navigator.language||'').slice(0,2);location.replace('./'+(L.indexOf(n)>-1?n:'{d['source_language']}')+'/');",
                  f'./{d["source_language"]}/', d['title'])
    redirect_page(OUT / coll / slug / 'index.html', "location.replace('./latest/html/'+location.hash);",
                  './latest/html/', d['title'])
    for mo in src.rglob('*.mo'):
        mo.unlink()                                   # compiled catalogues are build output, never committed
    entry['title'] = entry['languages'][0]['title'] if entry['languages'] else d['title']
    return entry


LANDING_WORDS = {'en': ('Read online', 'Download PDF', 'Also in', 'v')}


def render_langs(index):
    codes = []
    for e in index['documents']:
        for l in e['languages']:
            if l['code'] not in codes:
                codes.append(l['code'])
    return ''.join(f'<button type="button" value="{c}" lang="{c}" aria-pressed="{str(c == "en").lower()}" title="{LANG_NAMES.get(c, c)}">'
                   f'{c.upper()}</button>' for c in codes)


def render_list(index, lang):
    """The landing list, pre-rendered for no-JS readers and agents; landing.js renders the same markup per language."""
    esc = _html.escape
    html_w, pdf_w, also_w, v = LANDING_WORDS['en']
    out = []
    for c in index['collections']:
        docs = [d for d in index['documents'] if d['collection'] == c['id']]
        if not docs:
            continue
        out.append(f'<details class="coll" open><summary>{esc(c["title"].get(lang) or c["title"].get("en") or c["id"])}</summary><ul class="docs">')
        for d in docs:
            L = next((l for l in d['languages'] if l['code'] == lang), d['languages'][0])
            others = [l for l in d['languages'] if l['code'] != L['code']]
            size = f"{round(L['pdf_bytes'] / 1024)} KB" if L['pdf_bytes'] < 1048576 else f"{L['pdf_bytes'] / 1048576:.1f} MB"
            codes = ' '.join(l['code'].upper() for l in d['languages'])
            out.append(f'<li><details class="doc" id="{esc(d["collection"] + "-" + d["document"])}"><summary><span class="t" lang="{L["code"]}">{esc(L["title"])}</span>'
                       f'<span class="m">{v}{esc(d["version"])} · {esc(d["updated"])} · {codes}</span></summary><div class="body">'
                       f'<p lang="{L["code"]}">{esc(L["summary"])}</p><div class="acts"><a class="html" href="{esc(L["html"])}">{html_w}</a>'
                       f'<a class="pdf" href="{esc(L["pdf"])}" download>{pdf_w} · {size}</a></div>')
            if others:
                out.append(f'<div class="other">{also_w}: ' + ' · '.join(
                    f'<a href="{esc(o["html"])}" lang="{o["code"]}">{esc(o["name"])}</a><a href="{esc(o["pdf"])}" download>PDF</a>' for o in others) + '</div>')
            out.append('</div></details></li>')
        out.append('</ul></details>')
    return ''.join(out)


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
    entries = [build_doc(*c) for c in checked]
    collections = {}
    for c in sorted({e['collection'] for e in entries}):
        cj = json.loads((ROOT / c / 'collection.json').read_text(encoding='utf-8'))
        collections[c] = {'id': c, 'title': cj['title'], 'order': cj.get('order', 50)}
    index = {
        'site': SITE, 'generated': datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'),
        'commit': os.environ.get('CF_PAGES_COMMIT_SHA', '')[:7], 'branch': os.environ.get('CF_PAGES_BRANCH', ''),
        'standard': 'DOCS-STANDARD.md', 'count': len(entries),
        'collections': sorted(collections.values(), key=lambda c: (c['order'], c['id'])),
        'documents': sorted(entries, key=lambda e: (collections[e['collection']]['order'], e['id'])),
    }
    (OUT / 'docs.json').write_text(json.dumps(index, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    # landing page + headers
    for f in (KIT / 'landing').iterdir():
        shutil.copy2(f, OUT / f.name)
    landing = (OUT / 'index.html').read_text(encoding='utf-8')
    landing = landing.replace('<!--DOCS-LANGS-->', render_langs(index)).replace('<!--DOCS-LIST-->', render_list(index, 'en'))
    (OUT / 'index.html').write_text(landing, encoding='utf-8')
    urls = [f'{SITE}/'] + [SITE + l['html'] for e in entries for l in e['languages']] + [SITE + l['pdf'] for e in entries for l in e['languages']]
    (OUT / 'sitemap.xml').write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
                                     + ''.join(f'  <url><loc>{_html.escape(u)}</loc></url>\n' for u in urls) + '</urlset>\n', encoding='utf-8')
    log(f'done: {len(entries)} document(s), {sum(len(e["languages"]) for e in entries)} language build(s) -> {OUT}')


if __name__ == '__main__':
    main()
