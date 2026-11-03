# Changelog

## [1.1.1] - 2026-10-24

### Improved
- Display an accessible stale-catalogue warning when `entities.json` was generated more than 72 hours ago.
- Refresh the stylesheet cache key and keep the existing category totals unchanged; they match the 307 records in the current JSON catalogue.

### Validated
- All 307 entities have a source list and `last_checked` value; 40 entries do not have an `area` field, so regional precision is incomplete for those listings.
- The data set was generated 21 October 2026. This release warns about age rather than fabricating an update timestamp or modifying source details.
