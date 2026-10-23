#!/usr/bin/env python3
"""Release a new version of one document and archive the outgoing version to wayback as PDF (DOCS-STANDARD.md §6).

Run it BEFORE you change the document's source for the new version, from the docs branch root:

    pip install -r requirements.txt -r _theme-docs/requirements-release.txt      # Sphinx + rinohtype (no TeX)
    python3 _theme-docs/release.py <collection>/<document> --to X.Y.Z [--date YYYY-MM-DD] [--wayback-checkout PATH]
    python3 _theme-docs/release.py <collection>/<document> --current     # the current version as PDF too (§6.7)

What it does, in order:
  1. reads <collection>/<document>/latest/doc.json: the outgoing version and its date ("updated");
  2. builds the outgoing version to PDF once per language in doc.json "languages";
  3. stages each PDF at the wayback branch path
        wayback/pdf/docs-archive/<collection>/<document>/<lang>/YYYY-MM-DD_<collection>-<document>_<lang>_vX-Y-Z.pdf
     under _release/ (git-ignored), and writes _release/wayback/pdf/docs-archive/index.json (the archive's own list,
     merged with the live one), so the folder can be committed to the wayback branch as it is;
  4. adds the outgoing version to the top of doc.json "archive" with its wayback URL per language, and sets
     "version" to X.Y.Z and "updated" to --date (default today, UTC);
  5. with --wayback-checkout PATH (a checkout of the wayback branch): copies the staged files into it and commits them
     (message ends "— Sion's Tab agent"). Push it yourself after `git pull --rebase`; never force-push.
Then edit the source, the release notes and CHANGELOG.md for X.Y.Z, run build.py --check and commit the docs branch
(source only: the PDFs live in wayback). The PDF URL answers once the wayback deployment has run.
— Sion's Tab agent
"""
import argparse, datetime, json, pathlib, shutil, subprocess, sys, urllib.request

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import build as B  # noqa: E402

STAGE = B.ROOT / '_release'


def live_index():
    url = f'{B.WAYBACK}/{B.ARCHIVE_DIR}/index.json'
    try:
        with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'docs-release'}), timeout=30) as r:
            return json.loads(r.read().decode('utf-8'))
    except Exception:
        return None


def _bytes(path, idx, doc_id, version, lang):
    """Size of a staged PDF, or the size recorded in the archive list for a PDF published earlier (not staged now)."""
    if path.exists():
        return path.stat().st_size
    for i in idx.get('items', []):
        if i['id'] == doc_id and i['version'] == version:
            for f in i.get('files', []):
                if f['lang'] == lang:
                    return f.get('bytes')
    return None


def load_index():
    idx_path = STAGE / 'wayback' / B.ARCHIVE_DIR / 'index.json'
    return idx_path, (json.loads(idx_path.read_text(encoding='utf-8')) if idx_path.exists() else None) or live_index() or {
        'schema': 'ghf-docs-archive/1', 'about': 'Older versions of documents on docs.bucklerfamily.estate, one PDF per language. '
        'Written by _theme-docs/release.py in the docs branch.', 'items': []}


def current_pdf(coll, slug, meta, d, a, index=None):
    """--current (DOCS-STANDARD.md §6.7): the current version as one PDF per language, staged at its wayback path under the same
    archive name (§2.7, date = "updated"); doc.json "pdf" gets the URLs and the archive list marks the edition current.
    When the version is later replaced, release.py keeps that file as the archived edition (§6.5: never rebuilt).
    index: an archive list to update in memory (bulk runs write it once); otherwise the staged one is read and written."""
    ver, dt = d['version'], d['updated']
    rel_dir = pathlib.Path('wayback') / B.ARCHIVE_DIR / coll / slug
    pdf, files = {}, []
    for lang in d['languages']:
        B.log(f'{d["id"]} v{ver} [{lang}] pdf (current)')
        tmpd = STAGE / 'tmp' / f'{coll}-{slug}-{lang}'
        built = B.build_pdf(coll, slug, meta, d, lang, tmpd)
        name = B.archive_name(coll, slug, lang, ver, dt, d.get('catalogue'))
        dest = STAGE / rel_dir / lang / name
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.move(str(built), dest)
        shutil.rmtree(tmpd, ignore_errors=True)
        pdf[lang] = B.archive_url(coll, slug, lang, ver, dt, d.get('catalogue'))
        files.append({'lang': lang, 'url': pdf[lang], 'bytes': dest.stat().st_size})
    idx_path, idx = (None, index) if index is not None else load_index()
    idx['items'] = [i for i in idx['items'] if not (i['id'] == d['id'] and i['version'] == ver)]
    idx['items'].append({'id': d['id'], 'title': d['title'], 'version': ver, 'date': dt, 'replaced_by': None, 'current': True,
                         'archived': a.date, 'docs_url': f'{B.SITE}/{coll}/{slug}/', 'files': files})
    idx['items'].sort(key=lambda i: (i['id'], [-int(x) for x in i['version'].split('.')]))
    idx['updated'] = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
    idx['count'] = len(idx['items'])
    if idx_path is not None:
        idx_path.parent.mkdir(parents=True, exist_ok=True)
        idx_path.write_text(json.dumps(idx, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    raw = json.loads(meta.read_text(encoding='utf-8'))
    raw['pdf'] = pdf
    meta.write_text(json.dumps(raw, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    B.log(f'{d["id"]} v{ver} current PDF staged: ' + ', '.join(f'{l} {u}' for l, u in pdf.items()))
    return pdf


def main():
    ap = argparse.ArgumentParser(description='Archive the outgoing version of a document to wayback as PDF and bump its version.')
    ap.add_argument('doc', help='<collection>/<document>')
    ap.add_argument('--to', help='the new version, MAJOR.MINOR.PATCH, higher than the current one')
    ap.add_argument('--current', action='store_true', help='publish the CURRENT version as PDF (doc.json "pdf"); no version change')
    ap.add_argument('--date', default=datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%d'), help='date of the new version')
    ap.add_argument('--wayback-checkout', help='path of a checkout of the wayback branch to copy and commit the PDFs into')
    ap.add_argument('--keep-version', action='store_true', help='archive only; leave "version" and "updated" as they are')
    a = ap.parse_args()

    found = B.find_docs(a.doc)
    if not found:
        raise SystemExit(f'no document {a.doc} (expected {a.doc}/latest/doc.json)')
    coll, slug, meta = found[0]
    d, errs = B.validate(coll, slug, meta)
    if errs:
        raise SystemExit('fix these first (DOCS-STANDARD.md):\n  ' + '\n  '.join(errs))
    old, old_date = d['version'], d['updated']
    if a.current:
        return current_pdf(coll, slug, meta, d, a)
    if not a.to:
        raise SystemExit('--to X.Y.Z is required (or --current)')
    if not a.keep_version and (not B.VER_RE.match(a.to) or B.SEMVER(a.to) <= B.SEMVER(old)):
        raise SystemExit(f'--to {a.to} must be MAJOR.MINOR.PATCH and higher than the current {old}')
    if any(x['version'] == old for x in d.get('archive', [])):
        raise SystemExit(f'{old} is already archived')

    rel_dir = pathlib.Path('wayback') / B.ARCHIVE_DIR / coll / slug
    staged, entry = [], {'version': old, 'date': old_date, 'pdf': {}}
    # a version already published as PDF (doc.json "pdf", §6.7) has its file in wayback under the archive name: it becomes the
    # archived edition as it is (never rebuilt); only languages without one are built now
    published = d.get('pdf') or {}
    for lang in [l for l in d['languages'] if l in published]:
        entry['pdf'][lang] = published[lang]
    for lang in [l for l in d['languages'] if l not in published]:
        B.log(f'{d["id"]} v{old} [{lang}] pdf')
        built = B.build_pdf(coll, slug, meta, d, lang, STAGE / 'tmp' / lang)
        name = B.archive_name(coll, slug, lang, old, old_date, d.get('catalogue'))
        dest = STAGE / rel_dir / lang / name
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.move(str(built), dest)
        staged.append(dest)
        entry['pdf'][lang] = B.archive_url(coll, slug, lang, old, old_date, d.get('catalogue'))
    shutil.rmtree(STAGE / 'tmp', ignore_errors=True)

    # the archive's own list on wayback: every archived edition of every document
    idx_path, idx = load_index()
    before = {'items': list(idx['items'])}
    idx['items'] = [i for i in idx['items'] if not (i['id'] == d['id'] and i['version'] == old)]
    idx['items'].append({'id': d['id'], 'title': d['title'], 'version': old, 'date': old_date, 'replaced_by': None if a.keep_version else a.to,
                         'archived': a.date, 'docs_url': f'{B.SITE}/{coll}/{slug}/',
                         'files': [{'lang': l, 'url': u, 'bytes': _bytes(STAGE / rel_dir / l / u.rsplit('/', 1)[-1], before, d['id'], old, l)}
                                   for l, u in entry['pdf'].items()]})
    idx['items'].sort(key=lambda i: (i['id'], [-int(x) for x in i['version'].split('.')]))
    idx['updated'] = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
    idx['count'] = len(idx['items'])
    idx_path.parent.mkdir(parents=True, exist_ok=True)
    idx_path.write_text(json.dumps(idx, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

    # doc.json: archive list (newest first) and the new version
    raw = json.loads(meta.read_text(encoding='utf-8'))
    raw['archive'] = [entry] + raw.get('archive', [])
    raw.pop('pdf', None)                                   # the outgoing version's PDF is now an archived edition
    if not a.keep_version:
        raw['version'], raw['updated'] = a.to, a.date
    meta.write_text(json.dumps(raw, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

    if a.wayback_checkout:
        wb = pathlib.Path(a.wayback_checkout)
        for f in staged + [idx_path]:
            t = wb / f.relative_to(STAGE)
            t.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(f, t)
        subprocess.run(['git', '-C', str(wb), 'add', str(pathlib.Path('wayback') / B.ARCHIVE_DIR)], check=True)
        subprocess.run(['git', '-C', str(wb), 'commit', '-m', f'docs-archive: {d["id"]} v{old} as PDF ({", ".join(entry["pdf"])}), replaced by v{a.to}\n\n— Sion\'s Tab agent'], check=True)
        B.log('committed in the wayback checkout; now: git pull --rebase && git push (never --force)')
    B.log(f'archived {d["id"]} v{old}: ' + ', '.join(f'{l} {u}' for l, u in entry['pdf'].items()))
    B.log(f'staged for the wayback branch: {STAGE / "wayback"}')
    if not a.keep_version:
        B.log(f'doc.json is now v{a.to} ({a.date}); edit the source, release notes and CHANGELOG.md, then build.py --check and commit')


if __name__ == '__main__':
    main()
