# TASKS — Right Wing (Stability / Validation Tasks)

## Completed
- [x] Dashboard error handling for malformed wing files
- [x] Flywheel rollback on audit failure
- [x] WebSocket origin header validation
- [x] Structured JSON error logging

## In Progress
- [ ] Wing file schema validation (automated before each flywheel cycle)
- [ ] Rate-limiting: max 1 cycle per branch per 5 minutes
- [ ] Atomic backup of wing files before any edit

## Pending (Stability)
- [ ] GPG signing for all release tags
- [ ] Dashboard read-only mode when Cloudflare worker is unreachable
- [ ] MEMORY.md integrity check — detect and repair corruption
- [ ] Audit tier cross-references proposed changes against ALL wing files
- [ ] Graceful degradation: dashboard works offline with cached wing data
- [ ] Unit tests for every audit rule (target: 90%+ coverage)
- [ ] Wing file change journal with human-readable diff output
