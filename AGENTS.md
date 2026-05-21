# Agent Memory File

## Version Format
`v{major}.{minor}.{patch}.{build}`
- Build is always exactly 2 digits: 00-99
- When build reaches 99, increment patch and reset build to 00
- When patch reaches 9, increment minor and reset patch to 0
- When minor reaches 9, increment major and reset minor to 0
- Never skip to a higher segment until the current segment maxes out
- Example: 0.0.0.99 → 0.0.1.00, 0.0.9.99 → 0.1.0.00, 0.9.9.99 → 1.0.0.00

## Release Tag Format
`{branchID}-v{major}.{minor}.{patch}.{build}`

## Auto-Release Script
- Located at `~/.fcukproxy/multi-branch-release.sh`
- Runs hourly via cron: `0 * * * *`
- Rotates through 20 branches (24h cooldown per branch)
- Version math: TOTAL=NEXT_NUM-1, BUILD=(TOTAL%99)+1, PATCH=((TOTAL/99)%10), MINOR=((TOTAL/99)/10)%10, MAJOR=((TOTAL/99)/10)/10
- Keeps last 3 releases per branch, prunes older ones

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
