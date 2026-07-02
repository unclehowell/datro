# CONTEXT — COMMAND Cockpit

## Architecture
- Static site served by Cloudflare Pages
- API backend: Cloudflare Worker (_worker.js) proxying to datro-flywheel
- KV namespaces: DATRO_STATE, BRAIN_FILES (with in-memory fallback)
- D3.js force-directed graph in graph-container
- Racetrack.js for road view (hidden by default, graph is default)

## Dependencies
- d3.v7.min.js (CDN)
- Cloudflare Pages + Workers (free tier)
- GitHub API for file editing and release management
