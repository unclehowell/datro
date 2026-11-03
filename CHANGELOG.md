# Changelog

## [0.1.0] - 2026-10-24

### Fixed
- Remove stray trailing `&gt` / `&gt;` HTML-entity fragments from 148 malformed source URL fields in the published catalogue. Capture-status columns are preserved; the cleaned URLs are still subject to the stated robots.txt and retrieval limitations.
- Announce the dynamic archive index status to screen readers and add visible keyboard focus indicators to search, summary and link controls.

### Validated
- Compared root and published `sources.csv` before the cleanup; both were identical. No capture status was upgraded as a result of URL normalization.
