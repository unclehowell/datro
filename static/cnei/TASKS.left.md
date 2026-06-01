# TASKS (Left) — CNEI Flywheel Implementation Checklist

## Completed
- [x] CF worker deploys and runs on cron `30 * * * *`
- [x] AI uniqueness engine calls financecheque parent proxy API
- [x] `getWingFiles()` fetches left/right .md for any branch
- [x] `getPreviousReleaseNotes()` feeds release history to AI
- [x] `parseAIResponse()` extracts SEARCH/REPLACE/NOTES from AI output
- [x] SEARCH/REPLACE applied to `index.html` via `createCommit()`
- [x] AI release → createGitTag → createGitHubRelease
- [x] Falls back to best-practice engine if AI fails
- [x] Falls back to audit-only release if both fail
- [x] Left/right file variations in API
- [x] Dashboard dual-tree navigation
- [x] Bias slider (1-5) with labels (90L/45L/CTR/45R/90R)
- [x] Git commit+push on file save
- [x] Version badge on dashboard
- [x] Child proxy network: laptop (port 4001), AWS servers
- [x] Loop prevention: X-Forwarded header skips child proxy routing
- [x] Chat flag: X-Chat-Only prevents public website agentic access
- [x] Response-time routing: avg_response_ms per node
- [x] Multi-provider LLM fallback: OpenRouter → Gemini → Echo
- [x] Termux-compatible one-liner install script

## Pending
- [ ] Bias slider feeds live into AI prompt weighting
- [ ] Dashboard shows flywheel status (last cycle result, AI error)
- [ ] Self-improvement: cnei release improves its own CF worker code
- [ ] Auto-update: dashboard detects cnei SHA change and self-updates
- [ ] Dashboard shows release history per branch
- [ ] Rate limiting on flywheel API endpoints
- [ ] HTTPS enforcement on dashboard

## BACKLOG (Priority Queue for AI)
- [ ] P0: Bias slider feeds live into AI prompt weighting
- [ ] P0: Dashboard shows flywheel status (last cycle result, AI error)
- [ ] P1: Auto-update: dashboard detects cnei SHA change and self-updates
- [ ] P1: Dashboard shows release history per branch
- [ ] P2: Rate limiting on flywheel API endpoints
- [ ] P2: HTTPS enforcement on dashboard
- [ ] P2: spec-verifier.py gate rejects regressions

## Known Issues
- If AI returns SEARCH text that doesn't match HTML, falls back silently
- `socket.gethostname()` returns "na" on this machine — override with MACHINE_NAME env
- Cloudflare Pages deploy takes ~2 min after git push
