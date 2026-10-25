# Changelog — research mirror

## [0.2.0] - 2026-10-25

### Added
- Interpretation layer on catalogued evidence pages (`src/interpretation.js`): 36 entries (inference, theory, readings that cut against the case, and discarded theories with the reason) shown in a separate "Interpretation" section after the record text on 137 pages (86 EV pages, 51 evidence-library pages). The imported record text is not changed. Each entry names what it rests on and what would confirm or refute it.
- `src/interpretation.test.mjs`: guard that every entry is labelled, sourced and testable and that the public wording rules hold.

## [0.1.1] - 2026-10-24

### Fixed
- Reject GraphQL `pages`, `posts` and `contentItems` list queries that request any status other than `publish`. Previously a public request could select draft/private/pending/future rows by setting `status:`.
- Keep single-page and JSON endpoints restricted to published content.

### Tests
- Add regression assertions for the GraphQL status guard and published-only filters; run `npm test` from `research/`.

### Deployment note
- This commit updates source code only. The Cloudflare Worker `research-wp` was not redeployed or live-smoke-tested here, and the mirror migration remains incomplete. Keep the original WordPress source online until the published-page and media inventories are reconciled.
