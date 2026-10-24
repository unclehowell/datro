# Changelog

## [0.1.3] - 2026-10-24

### Fixed
- Keep the browser theme script as a text literal so the Worker does not evaluate browser-only `document` APIs at startup.
- Update the FCG third-row navigation counter to the shared 64-stop circular website tour.
- Preserve the full-width third-row layout and previous/next links.

## [0.1.2] - 2026-10-24

### Fixed
- Add the estate-wide previous/next tour row to every FCG HTML page through the shared HTML response helper.
- Force the navigation row to use the full header width so it remains a distinct third row instead of sitting beside the logo.

### Deployment
- Add a guarded Wrangler deployment workflow for the FCG Worker. It runs the source tests and a dry-run build before deploying `fcg-wp`.

## [0.1.1] - 2026-10-24

### Fixed
- Reject public `posts` queries requesting any status other than `publish`; unpublished drafts are no longer exposed by status selection.
- Constrain single `page(slug)` and `post(slug)` lookups to published records of the requested content type.

### Tests
- Add source-level regression assertions for the public publication boundary and lookup filters. Run `npm test` from `fcg/`.

### Deployment note
- Source changes are committed to the `fcg` branch. The Worker runtime was not independently redeployed or smoke-tested as part of this branch edit.
