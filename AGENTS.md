# Agent Memory File

## Version Format
`v{major}.{minor}.{patch}.{build}`
- Build is always exactly 2 digits: 00-99
- When build would exceed 99, increment patch and reset build to 00
- Example: v0.1.0.99 → next is v0.1.1.00, not v0.1.0.100

## Release Tag Format
`financecheque-v{major}.{minor}.{patch}.{build}`

## Branch
- Primary branch: `financecheque`
- No other active branches — all work lands here

## Code Conventions
- React SPA with Vite, TypeScript, Tailwind CSS
- Cloudflare Pages + Functions with D1 database
- Python agent in `public/fcukproxy/agent.py`
- Shell installer in `public/fcukproxy/install.sh`
- Node.js child proxy in `child-proxy.js`

## Architecture
- Parent proxy: Cloudflare Functions handling `/api/proxy/*`
- Child proxy agent: Python agent on user machines, polls parent via HTTPS
- Polling mode: For closed-port machines (e.g. AWS), agent polls `GET /api/proxy/poll` every 2s
- Direct mode: For open-port machines, `child-proxy.js` listens on port 4001

## Key Endpoints
- `POST /api/proxy/register` — node registration
- `GET /api/proxy/poll?machine_id=...` — polling work queue
- `POST /api/proxy/result` — submit polling result
- `GET /api/proxy/health` — network health status

## D1 Tables
- `proxy_nodes` — registered nodes
- `proxy_logs` — request logs
- `proxy_pending` — queued work for polling nodes
