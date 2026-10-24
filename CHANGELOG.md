# Changelog

## [0.1.0] - 2026-10-24

### Improved
- Add a consistent high-contrast keyboard focus ring for links, buttons and form controls in the testimony/disclosure view.
- Leave the disclosure states and their status labels unchanged; this patch is UI-only.

### Reviewed
- Confirmed the disclosure model has explicit status categories (`dormant`, `evidence`, `nuisance`, `closed`, `suspicious`) and optional dates/references/URLs. Optional references were not rewritten as if they were source-backed.
- This is a source-branch release; no Cloudflare runtime deployment was verified.
