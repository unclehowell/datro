# Changelog — Great House Farm Q&A

## [0.1.1] - 2026-10-24

### Improved
- Display a clear, accessible warning when the static `kb.json` snapshot is older than 72 hours.
- Keep the recorded generation date intact; do not imply the snapshot was refreshed merely because the UI was rereleased.

### Validated
- The 19 October 2026 knowledge base contains 362 records with unique IDs, all required question/answer/status fields and at least one source reference each. Status counts sum to 362.
- Deployment still generates `/api/qa.json` from the shared `bpvsbuckler` export and retains its UID, syntax and live smoke checks.
