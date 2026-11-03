# docs-archive

Older versions of the documents published on https://docs.bucklerfamily.estate/, kept here as PDF, one file per language.
The docs site itself is HTML only; each document's menu links these files to the right of the current version in the same language.

- Path: `pdf/docs-archive/<collection>/<document>/<lang>/YYYY-MM-DD_<collection>-<document>_<lang>_vX-Y-Z.pdf`
  (the date of that edition, language before version, as in the owner's library).
- List: `index.json` in this folder (every archived edition with its files and sizes).
- Written by `_theme-docs/release.py` in the `docs` branch when a new version is released (DOCS-STANDARD.md §6).
- Current editions too (DOCS-STANDARD.md §6.7, `release.py --current`): a document's current version can be published here as PDF
  under the same name pattern; `index.json` marks it `"current": true` and the docs menu shows it right of **Latest**. When the
  version is replaced, the same file becomes its archived edition.
- Files are never replaced or deleted; a correction is a new version.
