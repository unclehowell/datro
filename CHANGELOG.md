# Changelog
All changes to this branch are logged here, newest first.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and [Semantic Versioning](https://semver.org/spec/v2.0.0.html). Rules: DOCS-STANDARD.md §9.

## [Unreleased]

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
