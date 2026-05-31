# CNEI — Autonomous Flywheel Core

The `cnei` branch commands the DATRO flywheel: an autonomous AI-driven release engine running on Cloudflare Workers.

## What it does
- Runs a CF Worker every hour (`30 * * * *`) at `datro-flywheel.righteous.workers.dev`
- For each branch, calls the financecheque parent proxy API with:
  - Left/right wing MD files as political/policy guidance
  - Previous release notes (last 15) to ensure uniqueness
  - Current `index.html` content for analysis
- AI identifies ONE unique improvement → applies SEARCH/REPLACE diff → commits → tags → releases
- Falls back to best-practice engine → audit-only release if AI fails
- Dashboard at port 3000 provides web GUI to steer the flywheel

## Getting Started
1. Clone: `git clone https://github.com/unclehowell/datro -b cnei`
2. Dashboard: `cd dashboard && npm install && node server.js`
3. Open http://localhost:3000
4. Flies itself: CF Worker on cron, no manual trigger needed

## Architecture
```
flywheel-cf/src/index.js       CF Worker (AI uniqueness engine + release pipeline)
dashboard/server.js            Express web GUI (bias slider, file CRUD)
dashboard/public/              React frontend (tree views, editor)
static/{branch}/*.left.md      Left wing policy files (per branch)
static/{branch}/*.right.md     Right wing policy files (per branch)
public/fcukproxy/install.sh    One-liner child proxy installer (Termux/Linux)
public/fcukproxy/child-proxy.mjs  Zero-dep child proxy (port 4001)
functions/api/proxy/[[catchall]].ts  Parent proxy API (routing, loop prevention)
```

## AI Release Pipeline (processBranch)
1. Collect context: wing files + previous release notes + index.html + _headers
2. Call `queryFinancechequeAPI()` → parent proxy → child proxy LLM
3. Parse AI response: `parseAIResponse()` extracts SEARCH/REPLACE/NOTES
4. If valid: `createCommit()` → `createGitTag()` → `createGitHubRelease()`
5. If AI fails: fall back to best-practice engine (18 curated checks)
6. If both fail: audit-only release (no code change, version bump)
7. Prune old releases (keep last 3 per branch)

## Key Endpoints
| Endpoint | Function |
|---|---|
| `datro-flywheel.righteous.workers.dev/__cron` | Trigger flywheel (async) |
| `datro-flywheel.righteous.workers.dev/__sync_cron` | Trigger flywheel (sync, returns result) |
| `datro-flywheel.righteous.workers.dev/__state` | Rotation state + last release |
| `datro-flywheel.righteous.workers.dev/__reset` | Clear lock + reset state |
| `datro-flywheel.righteous.workers.dev/__status` | Health check |
| `financecheque.uk/api/proxy?action=chat` | Parent proxy chat (X-Chat-Only required) |
| `financecheque.uk/api/proxy/nodes` | List active child proxies |
