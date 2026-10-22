# Changelog
All changes to this branch are logged here, newest first.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and [Semantic Versioning](https://semver.org/spec/v2.0.0.html). Rules: DOCS-STANDARD.md §9.

## [Unreleased]

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
