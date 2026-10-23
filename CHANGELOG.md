# Changelog
All changes to this branch are logged here, newest first.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and [Semantic Versioning](https://semver.org/spec/v2.0.0.html). Rules: DOCS-STANDARD.md §9.

## [Unreleased]

## [docs-0.4.1] - 2026-10-23

### Fixed
- Collection menus: a document title longer than 48 characters (the evidence records) wraps inside the screen in a smaller
  size instead of running off it (the Evidence menu scrolled sideways at 390 px); every menu button now wraps
  inside the screen when it has to.

## [docs-0.4.0] - 2026-10-23

### Added
- `ghf_evidence` — the Evidence collection: one document per catalogue number of the Great House Farm evidence register
  (`ghf_evidence/ev_NNNN`, e.g. `ev_0031` = EV-0031), v1.0.0 (en), each carried over from its Legal Wiki evidence page.
  The record is kept as published; wiki links point to the same path on research.bucklerfamily.estate; images are links to
  their files on the wiki. Each version is also a PDF in wayback (`pdf/docs-archive/ghf_evidence/…`).
- `doc.json` `"record"` (catalogue, source, verbatim chapters) and `"pdf"` (the current version as PDF), both checked.
  DOCS-STANDARD.md v1.3.0 §5.6, §6.7, §10.6.
- `release.py --current` — the current version as one PDF per language at its wayback path; when the version is replaced
  that file becomes the archived edition instead of a rebuild.

### Changed
- Document menu: the current version's PDF is a red button right of the green **Latest**; HTML sidebar: "This version (PDF)".
- `build.py` builds documents side by side (one per CPU) and drops theme source maps from the output.

## [docs-0.3.1] - 2026-10-22

### Changed
- Day and night like every bucklerfamily.estate site: white ground by day, black by night, following the family toggle.
  Pages carry `<html data-ghf-native="auto">`, so they are no longer colour-inverted by day (the menus were a lavender
  inversion of the navy page). `library.css` draws both schemes with the same bands and buttons; Furo's light and dark
  variables use the family grounds; `docs.js` follows `data-ghf-mode` (it read the wrong attribute) and Furo's own toggle is
  hidden. DOCS-STANDARD.md v1.2.0 §10.5.
- The docs. accent pair (navy `#1C2E5C` / apricot `#FFB27A`) is the brand colour and a hint on band edges and focus rings.

## [docs-0.3.0] - 2026-10-22

### Changed
- The site is HTML only and follows the library's journey and look: home (categories) → collection (documents) → document
  (one row per language: green **Latest** = HTML, red older versions = PDF to its right). Menus are built from `docs.json`.
- Older versions are PDFs in the wayback archive (`wayback/pdf/docs-archive/…`); the deploy no longer builds PDFs, and old PDF
  addresses on docs redirect to the document's menu. `DOCS-STANDARD.md` v1.1.0 (§2.5–2.8, §6 archive SOP, §7.3 menus, §10).
- HTML sidebar: "Older versions (PDF)" in the page's language replaces the PDF link.
- `requirements.txt` drops rinohtype; `_theme-docs/requirements-release.txt` carries it for archiving.

### Added
- `_theme-docs/release.py` — archives the outgoing version of a document to wayback as one PDF per language and bumps `doc.json`.
- `doc.json` `"archive"` (checked by `build.py --check`); `collection.json` `subsidiary_title` and `groups` (menu band labels).
- `ghf_legalwiki/guide_readthedocs` — v1.0.1 (en) archived from the wiki page revision of 2026-10-18 23:45 UTC; current stays v1.1.0.
- `ghf_tests/specimen_loremipsum` — v0.0.1 (en, cy, es) archived; current stays v0.1.0; release notes list the older version.

### Removed
- Landing page `index.html`, `landing.js`, `landing.css` (replaced by the generated menus and `library.css`).

## [docs-0.2.0] - 2026-10-22

### Added
- `ghf_legalwiki/guide_readthedocs` v1.1.0 (en) — the Legal Wiki's "Read the Docs" guide, moved from the WordPress wiki as a document; every wiki link now points to the same page on research.bucklerfamily.estate.
- `ghf_legalwiki/collection.json` — the Legal Wiki collection (listed first on the homepage).

## [docs-0.1.1] - 2026-10-22

### Fixed
- Landing page: the version shows as `v0.1.0` in every language (the Welsh list read `f0.1.0`).

## [docs-0.1.0] - 2026-10-22

### Added
- `DOCS-STANDARD.md` v1.0.0 — the publishing rules, drawn from the library branch's paths, gettext languages and release notes.
- `_theme-docs/` build kit — Sphinx + Furo HTML, rinohtype PDF (no TeX), generated `docs.json`, landing page, `--check` rules.
- `ghf_tests/specimen_loremipsum` v0.1.0 (en, cy, es) — lorem ipsum specimen with headings, a table, a figure, a footnote and cross-references.
- `requirements.txt` with pinned build dependencies; `README.md`; this changelog.
