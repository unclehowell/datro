# Changelog

## [0.3.0] - 2026-11-02

### Changed
- New address: the Dartboard now lives at https://bucklerfamily.estate/dartboard/ (the site's one-address-per-webapp rule: bucklerfamily.estate/<webapp>/). dartboard.bucklerfamily.estate no longer shows the app; every page on it answers 301 to the same path under bucklerfamily.estate/dartboard/, so old links keep working. The app itself is unchanged; the site build still reads it from this branch.

## [0.2.0] - 2026-11-02

### Added
- Disclosures stand out in the Disclosure record: every request whose outcome is Disclosed or Partly disclosed shows a 😮 on its square, and its detail panel opens with a large 😮 and the request title in bold on a bright pink highlight. Data-driven from the outcome class (`disc: true` in `CLASS`), so new disclosures get it automatically; the site's inverted day view keeps the same pink.

## [0.1.0] - 2026-10-24

### Improved
- Add a consistent, high-contrast `:focus-visible` outline for links, buttons and form controls to make keyboard navigation easier to track.
- Respect the existing dark/brass design tokens; no case data or FOI statuses changed.

### Reviewed
- Read the static styles and public-record workflow documentation. Dynamic data correctness requires running the app and its existing tests in the deployment environment; this CSS-only change was not represented as a full runtime test.
