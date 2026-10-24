# Changelog

## [0.1.0] - 2026-10-24

### Fixed
- Add a visible, accessible stale-data warning when the embedded calendar forecast is more than 36 hours old.
- Update both the published static HTML and the source template so a future forecast rebuild preserves the warning.

### Validated
- Current embedded forecast and `forecast.json` are dated 22 October 2026 16:21 BST (51 threads / 479 events); as of 24 October, they are stale. The page now tells readers to rebuild from current request data before relying on due dates.
- No deadline dates were manually changed or represented as recalculated. The rebuild script consumes the hand-checked seed, policy table, queue and optional Gmail verification.
