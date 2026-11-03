# Changelog

## [2.0.1] - 2026-10-24

### Fixed
- Remove the Open Graph image URL pointing to `/og.png`, which is not present in the deployed `public/` output or source assets. This avoids publishing a known-broken social-preview URL.

### Validated
- All 782 source items have at least one source reference and all referenced URLs use HTTP(S).
- The generated board has 782 squares matching the source dataset. This is a reference-integrity check, not independent validation of every cited document.
