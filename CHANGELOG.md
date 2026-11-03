# Changelog — Great House Farm e-book catalogue

## [0.1.0] - 2026-10-24

### Fixed
- Correct all nine cover-image alt labels that padded the patch component (for example, `v1.0.00`) instead of matching the SemVer values in `public/books.json` (`v1.0.0`).

### Validated
- Checked the nine generated book cards against the nine `books.json` records; cover alt versions now match their catalogue entry.
- The private catalogue/build-box source is not present in this branch. This is a correction to the published HTML and needs to be mirrored into the external generator before the next regeneration.
