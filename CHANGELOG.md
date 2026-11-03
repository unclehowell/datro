# Changelog

## [0.1.0] - 2026-10-24

### Fixed
- Clarify that the “Then” feed includes an 1824 survey as historical context, while the title-chain story is framed as 1877–1994. The page summary no longer gives the impression that all displayed posts fall inside the title-chain period.
- Update both the published `site/index.html` metadata and the `build_wall.py` generator, so rebuilding the feed preserves the correction.

### Validated
- `site/posts.json` contains 224 indexed items, each with an ID, date, title and URL.
- `site2/api/wall.json` contains 952 dated events and every event has a `src` reference array. These are internal completeness checks, not independent validation of the statements themselves.
- Keyboard-focus styling already exists in the shared CSS; no source posts or quoted statements were rewritten.
