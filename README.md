# docs — Buckler family document library (source)

Source for **https://docs.bucklerfamily.estate/**. This branch holds reStructuredText only; Cloudflare Pages builds the HTML and PDF
for every document in every language, and the homepage navigation (`docs.json`), on each deploy.

- Rules: [DOCS-STANDARD.md](DOCS-STANDARD.md) — paths, metadata, languages, release notes, changelog.
- Changes: [CHANGELOG.md](CHANGELOG.md).
- Build kit: `_theme-docs/` (`build.py`, shared Sphinx `conf.py`, PDF style, landing page).
- Sister site: library.bucklerfamily.estate (branch `library`) is a separate, older library and is not built from here.

## Build locally
```
python3 -m venv .venv && . .venv/bin/activate && pip install -r requirements.txt
python3 _theme-docs/build.py --check     # rules only
python3 _theme-docs/build.py             # everything → public/
```

## Cloudflare Pages
Project `bucklerfamily-docs` · branch `docs` · build command `python3 _theme-docs/build.py` · output `public` · `PYTHON_VERSION=3.11`.

## Layout
```
<collection>/<document>/latest/doc.json
<collection>/<document>/latest/source/*.rst
<collection>/<document>/latest/source/locales/<lang>/LC_MESSAGES/docs.po
```
