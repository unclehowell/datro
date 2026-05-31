# CNEI — Production Notes

## Dependencies
- Node.js 18+
- Cloudflare Workers account (for flywheel deployment)
- Cloudflare Pages (for financecheque.uk website)
- Cloudflare D1 database (proxy_nodes, proxy_logs, proxy_pending)
- PM2 process manager (for dashboard)
- Git + GitHub CLI (`gh`)
- Financecheque parent proxy (cloudflare functions)

## Monitoring
- Flywheel logs: `wrangler tail datro-flywheel --format=json`
- Dashboard logs: `pm2 logs flywheel-master-dashboard`
- Child proxy logs: `~/.fcukproxy/child-proxy.log`
- Release visibility: `curl -s https://api.github.com/repos/unclehowell/datro/releases?per_page=5`
- Proxy nodes: `curl -s https://www.financecheque.uk/api/proxy/nodes`
- Flywheel state: `curl -s https://datro-flywheel.righteous.workers.dev/__state`

## Recovery
- Dashboard fails: `pm2 restart flywheel-master-dashboard`
- CF worker fails: `cd flywheel-cf && npx wrangler deploy src/index.js`
- Child proxy fails: `node ~/.fcukproxy/child-proxy.mjs`
- Agent fails: `systemctl --user restart fcukproxy`
- Lock stuck: `curl -X POST https://datro-flywheel.righteous.workers.dev/__reset`

## Env Vars (Cloudflare Worker: datro-flywheel)
- `GITHUB_TOKEN` — GitHub API auth (releases, commits, tags)
- `FLYWHEEL_STATE` — KV namespace binding (rotation state, lock)

## Env Vars (Cloudflare Functions: financecheque.uk)
- `OPENROUTER_API_KEY` — Primary LLM fallback
- `GEMINI_API_KEY` — Secondary LLM fallback
- `DB` — D1 database binding (proxy_nodes, proxy_logs)

## Env Vars (child proxy)
- `PARENT_URL` — Default: `https://www.financecheque.uk`
- `CHILD_ID` / `MACHINE_ID` — Unique machine identifier
- `MACHINE_NAME` — Display name on financecheque.uk
- `PORT` — Default: 4001
- `SELF_URL` — Public URL for parent proxy to reach back

## Secrets (set via Cloudflare Dashboard)
- `JWT_SECRET` — Auth token signing
- `STRIPE_SECRET_KEY` — Payment processing

## Networking
- Laptop child proxy: `http://192.168.1.118:4001`
- AWS Main: `44.194.23.52` (unreachable)
- AWS Command: `13.135.142.244` (unreachable)
- Public parent: `https://www.financecheque.uk/api/proxy`

## Loop Prevention
- `X-Forwarded: true` → skip child proxy routing → direct LLM
- `X-Chat-Only: true` → required for child proxy routing
- Parent proxy never forwards to same child proxy twice
- Child proxy never routes back to parent when forwarded
