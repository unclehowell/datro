# Changelog

## [0.1.1] - 2026-10-24

### Fixed
- Reject public `posts` queries requesting any status other than `publish`; unpublished drafts are no longer exposed by status selection.
- Constrain single `page(slug)` and `post(slug)` lookups to published records of the requested content type.

### Tests
- Add source-level regression assertions for the public publication boundary and lookup filters. Run `npm test` from `fcg/`.

### Deployment note
- Source changes are committed to the `fcg` branch. The Worker runtime was not independently redeployed or smoke-tested as part of this branch edit.
