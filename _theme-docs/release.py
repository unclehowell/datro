#!/usr/bin/env python3
"""Release a new version of one document and archive the outgoing version to wayback as PDF (DOCS-STANDARD.md §6).

Run it BEFORE you change the document's source for the new version, from the docs branch root:

    pip install -r requirements.txt -r _theme-docs/requirements-release.txt      # Sphinx + rinohtype (no TeX)
    python3 _theme-docs/release.py <collection>/<document> --to X.Y.Z [--date YYYY-MM-DD] [--wayback-checkout PATH]

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


def main():
    ap = argparse.ArgumentParser(description='Archive the outgoing version of a document to wayback as PDF and bump its version.')
    ap.add_argument('doc', help='<collection>/<document>')
    ap.add_argument('--to', required=True, help='the new version, MAJOR.MINOR.PATCH, higher than the current one')
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
    if not a.keep_version and (not B.VER_RE.match(a.to) or B.SEMVER(a.to) <= B.SEMVER(old)):
        raise SystemExit(f'--to {a.to} must be MAJOR.MINOR.PATCH and higher than the current {old}')
    if any(x['version'] == old for x in d.get('archive', [])):
        raise SystemExit(f'{old} is already archived')

    rel_dir = pathlib.Path('wayback') / B.ARCHIVE_DIR / coll / slug
    staged, entry = [], {'version': old, 'date': old_date, 'pdf': {}}
    for lang in d['languages']:
        B.log(f'{d["id"]} v{old} [{lang}] pdf')
        built = B.build_pdf(coll, slug, meta, d, lang, STAGE / 'tmp' / lang)
        name = B.archive_name(coll, slug, lang, old, old_date)
        dest = STAGE / rel_dir / lang / name
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.move(str(built), dest)
        staged.append(dest)
        entry['pdf'][lang] = B.archive_url(coll, slug, lang, old, old_date)
    shutil.rmtree(STAGE / 'tmp', ignore_errors=True)

    # the archive's own list on wayback: every archived edition of every document
    idx_path = STAGE / 'wayback' / B.ARCHIVE_DIR / 'index.json'
    idx = (json.loads(idx_path.read_text(encoding='utf-8')) if idx_path.exists() else None) or live_index() or {
        'schema': 'ghf-docs-archive/1', 'about': 'Older versions of documents on docs.bucklerfamily.estate, one PDF per language. '
        'Written by _theme-docs/release.py in the docs branch.', 'items': []}
    idx['items'] = [i for i in idx['items'] if not (i['id'] == d['id'] and i['version'] == old)]
    idx['items'].append({'id': d['id'], 'title': d['title'], 'version': old, 'date': old_date, 'replaced_by': None if a.keep_version else a.to,
                         'archived': a.date, 'docs_url': f'{B.SITE}/{coll}/{slug}/',
                         'files': [{'lang': l, 'url': u, 'bytes': (STAGE / rel_dir / l / B.archive_name(coll, slug, l, old, old_date)).stat().st_size}
                                   for l, u in entry['pdf'].items()]})
    idx['items'].sort(key=lambda i: (i['id'], [-int(x) for x in i['version'].split('.')]))
    idx['updated'] = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
    idx['count'] = len(idx['items'])
    idx_path.parent.mkdir(parents=True, exist_ok=True)
    idx_path.write_text(json.dumps(idx, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

    # doc.json: archive list (newest first) and the new version
    raw = json.loads(meta.read_text(encoding='utf-8'))
    raw['archive'] = [entry] + raw.get('archive', [])
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
