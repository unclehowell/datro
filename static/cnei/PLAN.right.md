# PLAN (Right) — Stability & Fortification Master Plan

## Phase 1: Reliability ✅
- [x] Tag existence checked before creation (422 handled)
- [x] Releases verified after creation (10 retries, 5s delay)
- [x] Cache cleared before pruning (new release always included)
- [x] Tags fetched from correct endpoint (/git/refs/tags)
- [x] Subrequest limit increased to 5000

## Phase 2: Loop Prevention ✅
- [x] X-Forwarded header logic implemented
- [x] X-Chat-Only header enforced
- [x] Child proxy never routes back to parent when forwarded
- [x] Parent proxy tracks routing decisions in proxy_logs
- [x] Fastest child proxy tried first (avg_response_ms sort)

## Phase 3: Fallback Chain ✅
- [x] AI engine failure → best-practice engine → audit-only
- [x] Parent proxy failure → local LLM → echo
- [x] Child proxy unreachable → polling queue → skip
- [x] OpenRouter failure → Gemini → Echo
- [x] Tag already exists → skip gracefully (race condition)

## Phase 4: Fortification (In Progress)
- [ ] Dashboard error boundary on editor panel
- [ ] Confirmation dialog before destructive saves
- [ ] Last 3 backups per wing file
- [ ] Per-branch cooldown status on dashboard
- [ ] Request timeout for all API calls

## Phase 5: War Games (Future)
- [ ] Spec-verifier.py gate rejects regressions
- [ ] Simulate all failure modes and verify routing
- [ ] Load test child proxy network under concurrent requests
- [ ] Automatic recovery: detect unhealthy node, route around it
- [ ] Encrypted machine-to-machine communication
