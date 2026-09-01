# Agent Memory File

## GOLDEN RULE — Never Patch a Single Machine

**Never modify an agent on only one machine.** Every change to any agent (GUI, child-proxy, agent.py, wake.sh, skills, OTA manifest, docs) **must** be shipped as a release of the `financecheque` branch:

1. Commit the change to `financecheque`.
2. Bump to the **next semantic version** (e.g. v1.9.0 → v1.10.0) in `.version`, `CHANGELOG.md`, and the OTA `release_sequence` in `public/fcukproxy/ota-manifest.json`.
3. Tag `financecheque-v{N}` and publish a GitHub release on the `financecheque` branch.
4. Every child-proxy node/agent on every machine detects the new source and auto-updates itself.

Rationale: a hand patch on one laptop goes stale and is lost; a release propagates to **all** machines so they converge on identical code. If a single machine has a problem, first check whether the source of truth (the `financecheque` branch) should change — if so, release it; do not hand-edit that one machine.

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

## AgentOS Child Proxy (Local AI Stack)
- Located at `agentos/` — full local AI agent stack
- **Chat mode**: Voice/Text → ollama MiniCPM5-1B (free, local)
- **Task mode**: Task Router detects intent → routes to opencode/kilo (agentic, MCP tools)
- Services: GUI (3000), OmniRoute (20128), Voice (3101), Task Router (3200)
- Model: openbmb/minicpm5 (688MB Q4_K_M via ollama)
- Voice: edge-tts (local, free neural voices) + Groq Whisper (STT)
- Install: `cd agentos && ./install.sh`
- Start: `pm2 start ecosystem.config.js`
- Scaling: Each laptop runs its own AgentOS stack, connects to parent proxy

## Key Endpoints
- `POST /api/proxy/register` — node registration
- `GET /api/proxy/poll?machine_id=...` — polling work queue
- `POST /api/proxy/result` — submit polling result
- `GET /api/proxy/health` — network health status

## Shared Skills (openclaw/agent-skills)
- Installed at `~/src/openclaw-agent-skills/skills/`
- Symlinked to `~/.agents/skills/`, `~/.claude/skills/`, `~/.hermes/skills/`, `~/.openclaw/skills/`
- Skills: `agent-transcript`, `autoreview`, `behavior-validator`, `crabbox`, `handoff-openclaw`, `session-viewer`
- `handoff-openclaw` is the clipboard-friendly variant (avoids name collision with existing `handoff`)

## D1 Tables
- `proxy_nodes` — registered nodes
- `proxy_logs` — request logs
- `proxy_pending` — queued work for polling nodes
