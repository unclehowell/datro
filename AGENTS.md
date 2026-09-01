# Agent Memory File

## GOLDEN RULE — Never Patch a Single Machine

**Never modify an agent on only one machine.** Every change to any agent (GUI,
child-proxy, agent.py, wake.sh, task-router, skills, OTA manifest, installer,
docs) **must** be shipped as a release of the `financecheque` branch:

1. Commit the change to `financecheque`.
2. Bump to the **next semantic version** (v1.x.y) and record it in:
   - `.version` at the repo root
   - `.github/` + `CHANGELOG.md` (with full release notes)
   - the OTA `release_sequence` in `public/fcukproxy/ota-manifest.json`
3. Tag `financecheque-v{N}` and publish a GitHub release on the `financecheque`
   branch.
4. Every child-proxy node/agent on every machine detects the new source and
   auto-updates itself (via `public/fcukproxy/update-checker.sh`).

Rationale: a hand patch on one laptop goes stale and is lost; a release
propagates to **all** machines so they converge on identical code. If a single
machine has a problem, first check whether the source of truth (the
`financecheque` branch) should change — if so, release it; do not hand-edit that
one machine.

## Version Format (semantic — the canonical one)

Releases use **semantic versioning** `v{major}.{minor}.{patch}` and are tagged
`financecheque-v{major}.{minor}.{patch}`.

- Patch releases (`v1.11.1`) = bug fixes + small, backwards-compatible changes.
- Minor releases (`v1.12.0`) = backwards-compatible features.
- Major releases (`v2.0.0`) = breaking changes.

The legacy `v{major}.{minor}.{patch}.{build}` 4-segment scheme and its rollover
rules are **obsolete** and must not be used for new financecheque releases.
`/api/version` and the OTA updater select the newest release by **semantic
comparison**, not by list order or string sort.

## Canonical Installer Entrypoints

There are several installer scripts. Use the following table to decide which one
is canonical for a given deployment mode. Anything not listed here is either
deprecated or a thin redirect.

| Mode | Canonical installer | Purpose |
|------|--------------------|---------|
| Direct / network (recommended) | `public/fcukproxy/install.sh` (1194 lines) | Full child-proxy + AgentOS GUI + optional local LLM; the one advertised on the website and in the README. |
| Repo-local (dev / CI) | `agentos/install.sh` (123 lines) | Installs just the AgentOS local stack (ollama, omniroute, GUI, voice, task-router) from a checkout. |
| Phone / ADB | `install-phone-proxy.sh` (111 lines) | Thin child-proxy install for phones. |
| Child-proxy only | `install-child-proxy.sh` (217 lines), `setup-child-proxy.sh` (86 lines) | Setup/install of the child proxy alone. |
| Web redirect | `static/financecheque/fcukproxy/install.sh` (15 lines) | Thin redirect that execs `public/install.sh` on the website. |

Rule: prefer the canonical entrypoints above. Keep one installer per deployment
mode; treat the others as legacy unless they fill a distinct role.

## Resource Contract (idle-by-default)

The financecheque child-proxy stack runs on 2–8 GB machines and is
**idle-by-default**.

- **Always on:** only the port-3000 AgentOS GUI (`agentos-gui.service`). It is
  continuous and cheap.
- **Gated (started on prompt, released after deliverable):** child-proxy
  (:4001), the Main Agent stack (ollama :11434, omniroute :20128,
  task-router :3200).
- `agentos/gui/src/lib/llm-gate.ts` (`ensureLLMStack` / `releaseAfterAnswer`) is
  the on-demand gate. A prompt wakes the stack; `releaseAfterAnswer()` stops it
  ~15s after the answer is delivered; the idle watchdog stops it after 30
  minutes with no prompt.
- `agentos/gui/src/app/api/chat/route.ts` gate-starts task-router on a detected
  task (WS0 Bug B fix).
- Never leave a heavy process running after a deliverable. If a node keeps the
  stack up, it is a bug, not the expected behaviour.

## Storage Contract

- Checkpoints: `~/.fcukproxy/checkpoints/`. Bounded per session — keep the
  newest `MAX_CHECKPOINTS_PER_SESSION` (50) and evict anything older than 7 days
  (`agentos/gui/src/lib/harness.ts`, WS3).
- Skills state: `~/.fcukproxy/skills/skill.state.json` (durable per-node skill
  state).
- Budget roughly: model size + ~50 MB state. Check `du -sh ~/.fcukproxy`.

## Known-Issues Ledger

- **GUI can serve a stale bundle after an update if the build is not re-run
  post-pull.** Fixed in v1.11.1 via `update-checker.sh`: it now re-syncs and
  rebuilds the GUI AFTER the git pull / tarball apply, then restarts — so a
  node never serves old `/api/version` code (the `latest: v1.9.0` symptom).
- **Task prompts could silently degrade to chat** when task-router was stopped
  by the thin-client policy. Fixed in v1.11.1: `chat/route.ts` gate-starts
  task-router on demand and reports `agent_unavailable` instead of swallowing
  the task.
- **`/route` had no auth and a brittle intent matcher** (e.g. "help me…" could
  misroute). Fixed in v1.11.1: loopback-only bind, optional shared-secret, and
  politeness-aware `isTask()`.
- **GUI could show a spurious "Update failed — will retry"** from a stale
  `~/.fcukproxy/.update-status` error left behind by the systemd-timer update
  path after a failed attempt. Fixed in v1.11.2: `update-checker.sh` now
  reconciles `.update-status` at every terminal exit, and `/api/version` clears
  stale (>30 min) `error`/`done` states on read. A related bug where
  `fetch_latest_version`'s `log()` polluted stdout (corrupting the detected
  latest version when GitHub was strictly newer than the parent) was also fixed
  in v1.11.2 by routing `log()` to stderr.
- **Auto-update only ran once daily** (systemd `OnCalendar=*-*-* 04:00:00`, cron
  `42 */4 * * *`), so a node could sit on an old version for up to 24h. Fixed
  in v1.11.3: the cadence is now `OnCalendar=*:0/10` (every 10 minutes, cron
  `*/10 * * * *`), and `update-checker.sh` self-heals an already-installed
  node's timer on its next run via `ensure_update_cadence()`.

## Auto-Release Script (legacy)

`multi-branch-release.sh` and the hourly cron release rotation are from an older
pipeline. financecheque releases are now made explicitly (see the golden rule) —
bump version, tag `financecheque-v{N}`, publish a GitHub release.

## Branch

- Primary branch: `financecheque`. All work lands here.
- `carfinancecheque` (and its broken blank page) is a **separate project** — do
  not mix changes with `financecheque`.

## Code Conventions

- GUI: Next.js (React 19, TypeScript), Tailwind CSS v4 — under `agentos/gui/`.
- Backend: Cloudflare Pages Functions (Workers) + D1 database.
- Local AI stack: under `agentos/` (omniroute, task-router, voice-service, GUI).
- Shell installers are bash with `set -euo pipefail` where practical.

## AgentOS Child Proxy (Local AI Stack)

- Located at `agentos/` — the full local AI agent stack.
- **Chat mode:** Voice/Text → ollama MiniCPM5-1B via OmniRoute (free, local).
- **Task mode:** Task Router (`agentos/task-router.mjs` on :3200) classifies
  intent → routes to opencode/kilo (agentic, MCP tools).
- Services: GUI (:3000), OmniRoute (:20128), Voice (:3101), Task Router (:3200).
- Model: `openbmb/minicpm5` (688 MB Q4_K_M via ollama).
- Start on demand (see Resource Contract). Explicit wake/sleep:
  `public/fcukproxy/wake.sh`.

## Key Endpoints

- `POST /api/chat` — the AgentOS chat route (routes to task-router / hermes /
  omniroute).
- `POST /agentos/task-router.mjs /route` — task classification/execution
  (loopback-only; optional shared-secret).
- `GET /api/version` — version + update state (semver-aware `latestRelease`).
- `POST /api/update` — trigger OTA update.

## Shared Skills (openclaw/agent-skills)

- Installed at `~/src/openclaw-agent-skills/skills/`, symlinked into
  `~/.claude/skills/`, `~/.hermes/skills/`, `~/.openclaw/skills/`, etc.
- Tracked per-node in `~/.fcukproxy/skills/skill.state.json` and OTA-managed via
  the manifest.