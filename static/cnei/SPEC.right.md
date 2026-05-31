# SPEC (Right) — CNEI cnei.datro.xyz

## Stability
- [x] No regression in existing API endpoints
- [x] File saves go to correct .left.md / .right.md paths
- [x] Git push does not break remote
- [x] PM2 restart after dashboard update
- [x] `node --check` validation before flywheel deploy

## Loop Prevention
- [x] `X-Forwarded: true` header detected → skip child proxy routing → direct LLM
- [x] `X-Chat-Only: true` gates access to child proxy network
- [x] Public website chat cannot trigger agentic actions on monorepo

## Observability
- [x] `/api/version` returns current version
- [x] `/api/branches` returns all branches with left/right file status
- [x] `/__state` on flywheel returns rotation state + last release
- [x] `/__sync_cron` returns full flywheel result with `aiError` debug field
- [ ] Dashboard shows release history for each branch
- [ ] Dashboard shows AI engine status (success/failure/reason)

## Response-Time Routing
- [x] `avg_response_ms` + `total_requests` columns track per-node latency
- [x] Fastest known child proxy tried first for chat routing
- [x] Failed proxy gets penalized (30s default) in average calculation

## Emergency Procedures
- If AI engine fails: falls back to best-practice engine, then audit-only release
- If parent proxy unreachable: child proxy uses local LLM fallback
- If all LLMs fail: echo fallback ensures chat always responds
- Flywheel lock released on completion or error
