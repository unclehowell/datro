# Changelog

## [1.7.1] - 2026-10-24

### Fixed
- Correct the page metadata from 50 to 60 steps, matching `story.json`.
- Refresh the stylesheet cache key and align visible data/source version markers.

### Validated
- Parsed all 60 steps: 211 source references resolve against the 93-entry source catalogue; no missing source IDs were found.
- All four parcel GeoJSON features include a confidence property. Geometry and ownership interpretations were not independently re-surveyed in this release.
