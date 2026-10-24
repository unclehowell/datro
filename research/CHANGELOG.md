# Changelog — research mirror

## [0.1.1] - 2026-10-24

### Fixed
- Reject GraphQL `pages`, `posts` and `contentItems` list queries that request any status other than `publish`. Previously a public request could select draft/private/pending/future rows by setting `status:`.
- Keep single-page and JSON endpoints restricted to published content.

### Tests
- Add regression assertions for the GraphQL status guard and published-only filters; run `npm test` from `research/`.

### Deployment note
- This commit updates source code only. The Cloudflare Worker `research-wp` was not redeployed or live-smoke-tested here, and the mirror migration remains incomplete. Keep the original WordPress source online until the published-page and media inventories are reconciled.
