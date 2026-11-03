# docs — Buckler family document library (source)

Source for **https://docs.bucklerfamily.estate/**. This branch holds reStructuredText only; Cloudflare Pages builds the HTML
for every document in every language, the navigation index (`docs.json`) and the library-style menus on each deploy.
The site is HTML only: when a document gets a new version, the outgoing version is archived as one PDF per language in the
wayback archive and linked to the right of the current version in its language (SOP: DOCS-STANDARD.md §6, `_theme-docs/release.py`).

- Rules: [DOCS-STANDARD.md](DOCS-STANDARD.md) — paths, metadata, languages, release notes, changelog.
- Changes: [CHANGELOG.md](CHANGELOG.md).
- Build kit: `_theme-docs/` (`build.py`, `release.py`, shared Sphinx `conf.py`, PDF style for the archive, menu style).
- Sister site: library.bucklerfamily.estate (branch `library`) is a separate, older library and is not built from here.

## Build locally
```
python3 -m venv .venv && . .venv/bin/activate && pip install -r requirements.txt
python3 _theme-docs/build.py --check     # rules only
python3 _theme-docs/build.py             # everything → public/
```

## New version of a document (archive the old one first)
```
pip install -r requirements.txt -r _theme-docs/requirements-release.txt
python3 _theme-docs/release.py <collection>/<document> --to X.Y.Z      # PDFs staged in _release/wayback/, doc.json updated
python3 _theme-docs/release.py <collection>/<document> --current       # the current version as PDF too (doc.json "pdf", §6.7)
```
Commit `_release/wayback/` to the `wayback` branch, then edit the source, release notes and CHANGELOG.md and commit `docs`.

## Cloudflare Pages
Project `bucklerfamily-docs` · branch `docs` · build command `python3 _theme-docs/build.py` · output `public` · `PYTHON_VERSION=3.11`.

## Layout
```
<collection>/<document>/latest/doc.json
<collection>/<document>/latest/source/*.rst
<collection>/<document>/latest/source/locales/<lang>/LC_MESSAGES/docs.po
```
