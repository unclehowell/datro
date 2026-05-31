# SPEC (Left) — CNEI cnei.datro.xyz

## Tier 1 (Critical — Must Work)
- [x] CF Worker `flywheel-cf/src/index.js` deploys and runs on cron `30 * * * *`
- [x] Dashboard Express server runs on port 3000 with bias slider
- [x] AI uniqueness engine calls `financecheque.uk/api/proxy` for improvement detection
- [x] `getWingFiles()` fetches left/right .md from `static/{branch}/` via GitHub API
- [x] `getPreviousReleaseNotes()` feeds last 15 releases into AI prompt
- [x] `createCommit()` applies SEARCH/REPLACE diff → `createGitTag()` → `createGitHubRelease()`
- [x] Left/right wing files feed into AI prompt as political guidance
- [x] Chat flag (`X-Chat-Only`) prevents public website from triggering agentic actions

## Tier 2 (Important)
- [x] Bias slider (1-5) mapped to 90L / 45L / CTR / 45R / 90R
- [x] Left + right tree views with independent expand/collapse
- [x] Version badge on dashboard
- [x] MEMORY.md writes after every flywheel cycle
- [ ] Bias slider feeds live into CF worker's AI prompt weighting

## Tier 3 (Enhancement)
- [ ] spec-verifier.py gate rejects regressions
- [ ] md-protocol.sh runs on master-record save
- [ ] Dashboard shows cycle history per branch
- [ ] Bias slider controls left/right MD file weighting in AI prompt
- [ ] Real-time flywheel status on dashboard

## Architecture
```
financecheque.uk (parent proxy API)
    │ POST /api/proxy?action=chat
    ├── Cloudflare Flywheel (datro-flywheel.righteous.workers.dev)
    │   ├── getWingFiles()  →  static/{branch}/*.left.md / *.right.md
    │   ├── getPreviousReleaseNotes()  →  GitHub releases
    │   ├── queryFinancechequeAPI()    →  parent proxy → child proxy → LLM
    │   ├── parseAIResponse()          →  SEARCH/REPLACE diff
    │   └── createCommit() → createGitTag() → createGitHubRelease()
    │
    ├── Child Proxy Network
    │   ├── UncleHowell Laptop (port 4001 / 6000)
    │   ├── AWS Main (44.194.23.52)
    │   └── AWS Command (13.135.142.244)
    │
    └── Dashboard (localhost:3000)
        ├── Bias slider (steers AI weighting)
        ├── Left/right file CRUD
        ├── Branch file tree
        └── Git commit + push
```
