## [0.5.1.92] - 2026-08-06

Bugfix rerelease after a fresh `curl -fsSL https://www.financecheque.uk/fcukproxy/install.sh | bash` install: the agent started twice (nohup background + systemd) fought over port 6100 and left `fcuk-proxy.service` crash-looping. The installer now prefers systemd for the agent and only falls back to a background/pm2 start when systemd is unavailable or fails — one agent, one owner.

### Fixed
- `install.sh` 1.2.0 → **1.2.1**: no double-start of the child proxy agent. `install_service` returns success only when `fcuk-proxy.service` is actually active, and the nohup/pm2 fallback runs only if systemd is missing or the unit fails to start. llama-server (full mode) is started separately before this decision.
- `install_gui_service` also verifies `agentos-gui.service` is active before claiming success (falls back to nohup otherwise).
- `install_node` now re-validates the version of a previously bundled Node.js (>= 20) instead of blindly reusing it.

### Changed
- `GUI_VERSION` bumped to `financecheque-v0.5.1.92` so the installer always ships the GUI from this release tag.
- Termux/Android installs print a `termux-wake-lock` hint so the proxy + GUI survive backgrounding.

## [0.5.1.91] - 2026-08-06

Rerelease: the one-liner installer now deploys the AgentOS chat GUI on port 3000 — the web chat interface wired straight to the child proxy agent (the parent's LLMs answer). This replaces the status-only dashboards, and the legacy `gui.py` status webgui is removed so there are no false webguis.

### Added
- `install.sh` 1.1.0 → **1.2.0**: installs a bundled Node.js LTS (v22.23.2) when the host's Node is < 20, downloads the `financecheque-v0.5.1.91` release tarball, builds the AgentOS chat GUI, and serves it on **port 3000** with chat wired to the child proxy via `FCUK_AGENT_URL` (default `http://127.0.0.1:6100/v1`).
- `agentos-gui.service` systemd user unit (nohup background fallback when systemd is unavailable), plus an end-of-install GUI health check on port 3000.
- Machine-agnostic path resolution: new `src/lib/agentos-dir.ts` (`AGENTOS_GUI_DIR`, `REMOTION_DIR`, `REMOTION_OUT_DIR`) replaces every hardcoded `/mnt/sd/...` and `/home/unclehowell/...` path across the GUI (remotion/ai-video tools, video API routes, chat/loop/worker cwd defaults, tool registry defaults, code-intel index dir, scheduler/session/procedure stores) so the same release builds and runs on any machine.

### Changed
- `cloud-router.ts`: added the local **fcuk-agent** provider (no API key needed) and made its base URL env-configurable via `FCUK_AGENT_URL`.
- Removed `public/fcukproxy/gui.py` (the old status-dashboard "webgui"). The chat GUI is the only web interface.
- README: proxy port corrected to 6100; the local web interface is now documented as the chat GUI on 3000.

## [0.5.1.90] - 2026-08-05

Child-proxy installer hardening for piped one-liner installs (`curl -fsSL https://www.financecheque.uk/fcukproxy/install.sh | bash`), plus the local_ip crash-loop fix and an OTA sequence bump so every live node self-updates to the hardened agent.

### Fixed
- `prompt_config` now detects a non-TTY stdin and falls back to defaults/env — `curl … | bash` no longer aborts on `read` EOF via `set -e`.
- Literal ANSI escape codes in the mode menu (`echo -e`) and `FCUK_LOCAL_TOKEN` defaulted to satisfy `set -u`.
- pip bootstrap on PEP 668 distros via `get-pip.py` + `--break-system-packages`, with a `--break-system-packages` fallback for `aiohttp`/`Pillow`.
- Installer writes `local_ip` into `machine.json` and `agent.py` reads it defensively (`CONFIG.get('local_ip', '127.0.0.1')`) — fixes the agent KeyError crash loop on reinstalled nodes.

### Changed
- `agent.py` 0.7.0 → 0.8.0, `install.sh` 1.0.0 → 1.1.0; `ota-manifest.json` `release_sequence` 3 → 4 (`updated` 2026-08-05) so all nodes OTA-update to the hardened agent.

## [0.5.1.89] - 2026-08-04

Security hardening release responding to the Fugu quality review (v0.5.1.88 was a canary; this release implements the top blockers).

### Added
- **OTA v2 anti-downgrade**: manifests carry a monotonic `release_sequence`; `child-proxy.mjs` and `agent.py` persist the highest applied sequence in `~/.fcukproxy/.ota-sequence` and reject any manifest at an equal or lower sequence (blocks replay/downgrade).
- **Manifest signature-ready schema v2** with strict size caps (manifest ≤ 64 KiB, artifacts ≤ 4 MiB) and a **host allowlist** (only `raw.githubusercontent.com` and `financecheque.uk`, HTTPS-only, redirects refused).
- **Path-traversal guard**: OTA destinations/validators now come from a hard-coded internal component spec (`COMPONENT_SPEC`) — never from the (untrusted) manifest.
- **Atomic component staging**: all changed components are downloaded + validated into staging first; only after every artifact passes is the swap performed, the version markers written, and the restart signalled once.
- **Byte-identical parent manifest**: `/api/proxy/ota/manifest` now re-fetches and re-serves the canonical `ota-manifest.json` from the branch instead of generating an inline copy (no drift between sources).
- **Double-entry ledger** (`ledger` table): every wallet balance change is an append-only entry with a `UNIQUE (source, source_id)` idempotency key so replays cannot double-credit.
- **Server-side lead verification** (`POST /api/proxy/lead/verify`): nodes can only file `pending` leads; only the admin-gated verify endpoint marks a lead verified, decrements escrow (guarded to never go negative), and credits the node wallet through the ledger.

### Changed
- `POST /api/proxy/wallet` now **rejects `credit`/`payout` actions from the node route** — nodes could previously credit their own wallets arbitrarily (self-funded accounts). Balance changes are server-side only.
- `handleOrderAccept` is now an **atomic conditional UPDATE** (`WHERE status='escrowed'`) — no read-then-write race for claiming orders.
- `campaign-exec.sh` reports leads as `pending` (payout arrives via server verification) and `skills/leadgen-strategy.md` documents the new flow.
- Orders gain `escrow_remaining`, `accepted_node_id`, `leads_paid`, `lead_quota`, `expires_at`, `updated_at` columns (auto-migrated by `ensureTable`).
- `agent.py` OTA hardened: manifest content-length cap, host allowlist, urlopen size bound, sequence persistence, and only the hard-coded agent spec path used.

### Fixed
- `agent.py` OTA accepted the manifest based on content-type; now parses JSON regardless of header (raw GitHub serves `text/plain`).

## [0.5.1.88] - 2026-08-04

Release candidates live-tested across the FCUK swarm: this laptop + connected phone (child-proxy nodes) OTA-update from this branch.

### Added
- **OTC/OTA first-class**: `ota-manifest.json` + parent-served `/api/proxy/ota/manifest` — branch-level manifest carries per-component versions; `child-proxy.mjs` and `agent.py` compare their local `LOCAL_VERSIONS` against it and self-swap on mismatch (validated, then restart under pm2/systemd). Future releases need only a branch rerelease — no bespoke webapp/GUI/child-proxy edits per node.
- The `/v1/ota/update` endpoint on child-proxy.mjs lets the GUI trigger a manual OTA check (`X-FCUK-Token` guarded when `FCUK_LOCAL_TOKEN` set).
- **Lead-gen campaign executor** (`public/fcukproxy/campaign-exec.sh`): long-horizon multi-step campaigns via opencode/kilo + local/cloud LLMs, filesystem-as-context-store, agent-editable `memory.md`, reusable `skills/*.md`, `trace.jsonl` source-of-truth.
- **Sleep-time compute / reflection** (`public/fcukproxy/reflect.sh`): nightly review of the day's `trace.jsonl` distills durable lessons into `memory.md` (nodes learn offline instead of re-deriving from the LLM).
- **Node wallets + escrow + lead payout** (`node_wallets`, `orders`, `leads`, `disbursements`, `oauth_tokens` D1 tables + indexes): `POST /api/proxy/wallet`, `GET /api/proxy/wallet`, `GET /api/proxy/orders`, `POST /api/proxy/order/accept`, `POST /api/proxy/lead`. Buyer credits escrowed per order; verified leads credited to the node wallet.
- **Skills library** (`public/fcukproxy/skills/{leadgen-strategy,local-agent-discharge}.md`) — reusable procedure snippets loaded into every agent prompt.
- **Free-tier LLM provider keys** wired into `install.sh` (NVIDIA, Ollama Cloud, Cerebras, Mistral, DeepInfra, Fireworks, Cohere, HuggingFace) — paste via the port-3000 GUI → **Connect** page (new `/api/oauth` + `/api/settings` routes).
- **GUI additions**: new **Jobs** page (lead orders + node wallet) and **Connect** page (OAuth + LLM keys); Dashboard "Child Node" card shows proxy/agent version + role; Dock adds Jobs ⚡ + Connect 🔗.
- **Agentic CLIs as swarm compute**: `install.sh` now installs `opencode` + `kilo`; child-proxy reports `capabilities` (agent_exec, campaign_exec, agent_py, video, local_llm, opencode, kilo) and `pressure` (cpu/mem/jobs) to the parent.

### Changed
- Default agent/proxy port migrated **6000 → 6100** across `install.sh`, `child-proxy.mjs`, `agent.py`, `phone-proxy.go`, `phone-agentos.go`, and D1 `proxy_nodes.proxy_port` default.
- `child-proxy.mjs` now uses an **adaptive poll schedule** (fast after work, backs off to idle) and reports version + capabilities on registration.
- `phone-proxy.go` / `phone-agentos.go`: added wallet ensure-on-register, campaign executor with graceful fallback report, port 6100.
- Harness modernized for yolo mode, long-running tasks, and subagent spawning (`dca8633c9`).
- Video scene/object library versioned into branch (`/v1/video` + `/v1/video/library` + `phone_video.py` thin engine) with `video-update.sh` for rerelease sync (`93a11abff`, `807a93c30`); library URL fallback to raw GitHub when primary serves SPA/garbage (`62d70e249`).

### Fixed
- `agentos-gui` production build repaired — 5 syntax/type errors from the yolo merge (`5d2515fc5`).
- `AnimatePresence` closed inside the payment modal conditional / logout warning (`ba04cb445`, `2355d5a56`).
- `datro.xyz` → `datro.financecheque.uk` across all assets (`152d29148`).
- `__pycache__` / `.pyc` git-ignored (`9b17dbc4d`).

## [0.5.1.87] - 2026-08-02

- feat: add **clients page** to financecheque.uk website — modal popup + footer link (`c13442d76`, `fdbe2c839`), nav loads clients page in an iframe (`06d8460ed`).

## [0.5.1.86] - 2026-08-01

- test: add **DELEGATE route** to the ROUTER_SYSTEM prompt (`b70c2e762`).

## [0.5.1.85] - 2026-08-01

- feat(fcukproxy): installer deploys **child-proxy.mjs + agent.py executor clone** (`2e14f18e2`).
- fix(child-proxy): **Termux phone execution** — writable tmp, shallow clone, clean JSON stdout, disabled agent.py double-polling (`05c564ced`).
- Release: add agentos-gui deployment to install.sh, update version numbers (`47900c5f3`).

## [0.5.1.84] - 2026-07-30

### Added
- Chat conversation history sidebar: left slide-out panel with past conversations, auto-save, new session on page refresh

### Fixed
- Lead Value starts blank (—) until a URL is entered, then auto-assigns random £20-45
- Agent network iframe URL changed from absolute `https://www.financecheque.uk/ui/` to relative `/ui/` fixing cross-origin modal issues
- Wallet balances relabelled from "FCUK" to "credits" next to Generate Leads & Agent Network headings

## [0.5.1.83] - 2026-07-29

## [0.5.1.81] - 2026-07-27

## [0.5.1.77] - 2026-07-27

## [0.5.1.76] - 2026-07-27

## [0.5.1.64] - 2026-07-26

### Added
- feat: video pipeline — LLM outputs `VIDEO: {json}` for video requests, child proxy renders via ffmpeg, `<video>` plays in chat
- feat: phone `/api/status` endpoint — checks OmniRoute, Hermes, local ollama health
- feat: phone status cards — tap status dot to show OmniRoute/Hermes/Models indicators
- feat: chat fullscreen toggle — Maximize2/Minimize2 icon in chat modal header
- feat: VIDEO: system prompt — teaches LLM to output `VIDEO: {"composition":"TextAnimation",...}` format
- feat: `/api/video/render` endpoint — accepts video spec JSON, renders via Remotion or ffmpeg fallback
- feat: `/api/video/:id` endpoint — serves rendered MP4 files

### Changed
- refactor: breadcrumb shows full chain `🌐 financecheque-uk > 🖥️ child > provider (model)` (4 routing points)
- refactor: stale node TTL reduced from 2 hours to 30 minutes (both `[[catchall]].ts` and `health.ts`)
- refactor: OmniRoute Groq provider enabled as cloud fallback (was disabled)
- refactor: Hermes systemd — fixed `WorkingDirectory` and `HERMES_HOME` env var
- refactor: `hermes.ts` health check accepts any HTTP response as "online" (even 500 = running but unconfigured)

### Fixed
- fix: Guacamole iframe replaced with AgentOS chat widget in ui.financecheque.uk
- fix: breadcrumb parent name now shown (was missing, only showed child name)
- fix: Hermes systemd service no longer fails on boot (exit code 200/CHDIR)

## [0.5.1.63] - 2026-07-25

## [0.5.1.61] - 2026-07-25

## [0.5.1.52] - 2026-07-25

## [0.5.1.50] - 2026-07-24

## [0.5.1.35] - 2026-07-23

## [0.5.1.34] - 2026-07-23

## [0.5.1.34] - 2026-07-23

### Added
- feat: unified install.sh — works on laptops (Linux/macOS) AND phones (Termux/Android)
- feat: phone-agentos binary with embedded WebGUI, local MiniCPM, Groq fallback
- feat: boot persistence via Termux:Boot — auto-starts on reboot regardless of screen lock
- feat: ADB deployment mode — push full stack from laptop to phone
- feat: WebGUI identical on phones and laptops (dark theme, chat, pipeline breadcrumb)
- feat: Termux:Boot APK auto-installed for boot persistence

### Changed
- refactor: install.sh replaces install-phone-proxy.sh and install-child-proxy.sh
- refactor: phone binary uses 120s timeout for MiniCPM CPU inference
- refactor: startup script handles both llama-server and phone-agentos lifecycle

## [0.5.1.33] - 2026-07-23

## [0.5.1.16] - 2026-07-22

## [0.5.1.14] - 2026-07-22

## [0.5.0.71] - 2026-07-18

## [0.5.0.01] - 2026-07-08

# Changelog

## [financecheque-v0.0.1.52] - 2026-06-15

### Fixed
- - fix: remove console.log from 3 files
- fix: remove console.log from 3 files
- fix: remove console.log from 3 files

## [financecheque-v0.0.1.57] - 2026-06-01

### Fixed
- fix(financecheque): Remove excessive blank lines

### Changed
- ux(financecheque): Improve viewport meta with user-scalable=yes for accessibility

## [financecheque-v0.0.1.56] - 2026-05-30

### Fixed
- fix(financecheque): Create Privacy Policy page for legal compliance
- fix(financecheque): Remove excessive blank lines

### Changed
- ux(financecheque): Add button press interaction feedback for UX

## [financecheque-v0.0.1.55] - 2026-05-29

### Fixed
- fix(financecheque): Create Terms of Service page for legal compliance
- fix(financecheque): Create Contact page with form and contact details
- fix(financecheque): Launch blog with welcome post and index page

### Changed
- ux(financecheque): Add touch-action CSS for mobile responsiveness

## [financecheque-v0.0.1.50] - 2026-05-22

### Fixed
- fix: remove console.log from ./child-proxy.js

## [financecheque-v0.0.0.04] - 2026-05-22

### Fixed
- fix: remove console.log from ./child-proxy.js

## [financecheque-v0.1.1.45] - 2026-05-21

### Added
- feat: How It Works page explaining one-line install child proxy setup
- feat: polling workaround for closed-port machines — agent.py polls parent every 2s
- feat: Cloudflare poll/result endpoints with D1 work queue for unreachable nodes
- feat: install.sh updated for polling-only mode (no open ports required)

### Fixed
- fix: agent registration payload version inconsistency (0.3.0 → 0.4.0)
- fix: missing .bind(machineId) in handlePoll D1 query

## [financecheque-v0.1.1.44] - 2026-05-21

### Fixed
- fix: remove console.log from ./child-proxy.js

## [financecheque-v0.1.1.42] - 2026-05-19

### Fixed
- refactor: clean up unused imports in src/main.tsx

## [financecheque-v0.1.1.41] - 2026-05-19

### Fixed
- refactor: clean up unused imports in src/main.tsx

## [financecheque-v0.1.1.40] - 2026-05-18

### Fixed
- refactor: clean up unused imports in src/main.tsx

## [financecheque-v0.1.1.39] - 2026-05-18

### Fixed
- refactor: clean up unused imports in src/main.tsx

## [financecheque-v0.1.1.38] - 2026-05-18

### Fixed
- refactor: clean up unused imports in src/App.tsx

## [financecheque-v0.1.1.37] - 2026-05-18

### Fixed
- refactor: clean up unused imports in src/main.tsx

## [financecheque-v0.1.1.36] - 2026-05-18

### Fixed
- refactor: clean up unused imports in src/main.tsx

## [financecheque-v0.1.1.35] - 2026-05-18

### Fixed
- refactor: clean up unused imports in src/main.tsx

## [financecheque-v0.1.1.34] - 2026-05-18

### Fixed
- refactor: clean up unused imports in src/main.tsx

## [financecheque-v0.1.1.33] - 2026-05-18

### Fixed
- refactor: clean up unused imports in src/main.tsx

## [financecheque-v0.1.1.32] - 2026-05-18

### Fixed
- refactor: clean up unused imports in src/main.tsx

## [financecheque-v0.1.1.31] - 2026-05-18

### Fixed
- refactor: clean up unused imports in src/main.tsx

## [financecheque-v0.1.1.30] - 2026-05-18

### Fixed
- refactor: clean up unused imports in src/main.tsx

## [financecheque-v0.1.1.29] - 2026-05-18

### Fixed
- refactor: clean up unused imports in src/main.tsx

## [financecheque-v0.1.1.28] - 2026-05-18

### Fixed
- refactor: clean up unused imports in src/main.tsx

## [financecheque-v0.1.1.27] - 2026-05-18

### Fixed
- refactor: clean up unused imports in src/main.tsx

## [financecheque-v0.1.1.26] - 2026-05-18

### Fixed
- refactor: clean up unused imports in src/main.tsx

## [financecheque-v0.1.1.25] - 2026-05-18

### Fixed
- refactor: clean up unused imports in src/main.tsx

## [financecheque-v0.1.1.24] - 2026-05-18

### Fixed
- refactor: clean up unused imports in src/main.tsx

## [financecheque-v0.1.1.23] - 2026-05-18

### Fixed
- refactor: clean up unused imports in src/App.tsx

## [financecheque-v0.1.1.22] - 2026-05-18

### Fixed
- refactor: clean up unused imports in src/main.tsx

## [financecheque-v0.1.1.21] - 2026-05-18

### Fixed
- refactor: clean up unused imports in src/main.tsx

## [financecheque-v0.1.1.20] - 2026-05-18

### Fixed
- refactor: clean up unused imports in src/main.tsx

## [financecheque-v0.1.1.19] - 2026-05-18

### Fixed
- refactor: clean up unused imports in src/App.tsx

## [financecheque-v0.1.1.18] - 2026-05-18

### Fixed
- refactor: clean up unused imports in src/main.tsx

## [financecheque-v0.1.1.17] - 2026-05-18

### Fixed
- refactor: clean up unused imports in src/main.tsx

## [financecheque-v0.1.1.16] - 2026-05-17

### Fixed
- refactor: clean up unused imports in src/App.tsx

## [financecheque-v0.1.1.15] - 2026-05-17

### Fixed
- refactor: clean up unused imports in src/main.tsx

## [financecheque-v0.1.1.14] - 2026-05-17

### Fixed
- refactor: clean up unused imports in src/main.tsx

## [financecheque-v0.1.1.13] - 2026-05-17

### Fixed
- refactor: clean up unused imports in src/main.tsx

## [financecheque-v0.1.1.12] - 2026-05-17

### Fixed
- refactor: clean up unused imports in src/main.tsx

## [financecheque-v0.1.1.11] - 2026-05-17

### Fixed
- refactor: clean up unused imports in src/main.tsx

## [financecheque-v0.1.1.10] - 2026-05-17

### Fixed
- refactor: clean up unused imports in src/main.tsx

## [financecheque-v0.1.1.09] - 2026-05-17

### Fixed
- refactor: clean up unused imports in src/main.tsx

## [financecheque-v0.1.1.08] - 2026-05-17

### Fixed
- refactor: clean up unused imports in src/main.tsx

## [financecheque-v0.1.1.07] - 2026-05-17

### Fixed
- refactor: clean up unused imports in src/main.tsx

## [financecheque-v0.1.1.06] - 2026-05-17

### Fixed
- refactor: clean up unused imports in src/main.tsx

## [financecheque-v0.1.1.05] - 2026-05-17

### Fixed
- refactor: clean up unused imports in src/main.tsx

## [financecheque-v0.1.1.04] - 2026-05-17

### Fixed
- refactor: clean up unused imports in src/main.tsx

## [financecheque-v0.1.1.03] - 2026-05-17

### Fixed
- refactor: clean up unused imports in src/main.tsx

## [financecheque-v0.1.1.02] - 2026-05-17

### Fixed
- refactor: clean up unused imports in src/main.tsx

## [financecheque-v0.1.1.01] - 2026-05-17

### Fixed
- refactor: clean up unused imports in src/main.tsx

## [financecheque-v0.1.1.00] - 2026-05-17

### Fixed
- refactor: clean up unused imports in src/main.tsx

## [financecheque-v0.1.0.99] - 2026-05-17

### Fixed
- refactor: clean up unused imports in src/main.tsx

## [financecheque-v0.1.0.98] - 2026-05-17

### Fixed
- refactor: clean up unused imports in src/main.tsx

## [financecheque-v0.1.0.97] - 2026-05-17

### Fixed
- refactor: clean up unused imports in src/App.tsx

## [financecheque-v0.1.0.96] - 2026-05-17

### Fixed
- refactor: clean up unused imports in src/main.tsx

## [financecheque-v0.1.0.95] - 2026-05-17

### Fixed
- refactor: clean up unused imports in src/main.tsx

## [financecheque-v0.1.0.94] - 2026-05-17

### Fixed
- refactor: clean up unused imports in src/main.tsx

## [financecheque-v0.1.0.93] - 2026-05-16

### Fixed
- refactor: clean up unused imports in src/main.tsx

## [financecheque-v0.1.0.92] - 2026-05-16

### Fixed
- refactor: clean up unused imports in src/main.tsx

## [financecheque-v0.1.0.91] - 2026-05-16

### Fixed
- refactor: clean up unused imports in src/main.tsx

## [financecheque-v0.1.0.90] - 2026-05-16

### Fixed
- refactor: clean up unused imports in src/main.tsx

## [financecheque-v0.1.0.89] - 2026-05-16

### Fixed
- refactor: clean up unused imports in src/main.tsx

## [financecheque-v0.1.0.88] - 2026-05-16

### Fixed
- refactor: clean up unused imports in src/main.tsx

## [financecheque-v0.1.0.87] - 2026-05-16

### Fixed
- refactor: clean up unused imports in src/main.tsx

## [financecheque-v0.1.0.86] - 2026-05-16

### Fixed
- refactor: clean up unused imports in src/main.tsx

## [financecheque-v0.1.0.85] - 2026-05-16

### Fixed
- refactor: clean up unused imports in src/main.tsx

## [financecheque-v0.1.0.84] - 2026-05-16

### Fixed
- refactor: clean up unused imports in src/main.tsx

## [financecheque-v0.1.0.83] - 2026-05-16

### Fixed
- refactor: clean up unused imports in src/main.tsx

## [financecheque-v0.1.0.82] - 2026-05-16

### Fixed
- refactor: clean up unused imports in src/main.tsx

## [financecheque-v0.1.0.81] - 2026-05-16

### Fixed
- refactor: clean up unused imports in src/main.tsx

## [financecheque-v0.1.0.80] - 2026-05-16

### Fixed
- refactor: clean up unused imports in src/main.tsx

## [financecheque-v0.1.0.79] - 2026-05-16

### Fixed
- refactor: clean up unused imports in src/main.tsx

## [financecheque-v0.1.0.78] - 2026-05-16

### Fixed
- refactor: clean up unused imports in src/main.tsx

## [financecheque-v0.1.0.77] - 2026-05-16

### Fixed
- refactor: clean up unused imports in src/main.tsx

## [financecheque-v0.1.0.76] - 2026-05-16

### Fixed
- refactor: clean up unused imports in src/main.tsx

## [financecheque-v0.1.0.75] - 2026-05-16

### Fixed
- refactor: clean up unused imports in src/main.tsx

## [financecheque-v0.1.0.74] - 2026-05-16

### Fixed
- refactor: clean up unused imports in src/App.tsx

## [financecheque-v0.1.0.71] - 2026-05-16

### Fixed
- refactor: clean up unused imports in src/App.tsx

## [financecheque-v0.1.0.68] - 2026-05-16

### Fixed
- refactor: clean up unused imports in src/App.tsx

## [financecheque-v0.1.0.66] - 2026-05-16

### Fixed
- refactor: clean up unused imports in src/main.tsx

## [financecheque-v0.1.0.65] - 2026-05-16

### Fixed
- refactor: clean up unused imports in src/main.tsx

## [financecheque-v0.1.0.64] - 2026-05-15

### Fixed
- refactor: clean up unused imports in src/main.tsx

## [financecheque-v0.1.0.63] - 2026-05-15

### Fixed
- refactor: clean up unused imports in src/main.tsx

## [financecheque-v0.1.0.62] - 2026-05-15

### Fixed
- refactor: clean up unused imports in src/main.tsx

## [financecheque-v0.1.0.59] - 2026-05-15

### Fixed
- refactor: clean up unused imports in src/main.tsx

## [financecheque-v0.1.0.61] - 2026-05-15

### Fixed
- fix: wallet API endpoints now exist as Cloudflare Pages Functions (wallet/[[catchall]].ts)
- fix: wallets and balances display inline next to segment titles on the landing page
- feat: Tatum wallet function with D1 persistence — create, credit, transfer, balance
- feat: wallet table added to schema.sql

## [financecheque-v0.1.0.60] - 2026-05-15

### Fixed
- fix: landing page layout — 1-row 2-column grid with wallet balances next to section titles
- fix: removed orphaned closing div that broke the vite build
- fix: wallet balances moved inline next to Generate Leads (Your Wallet) and Agent Network (Agent Wallet)
- feat: Tatum wallet system — per-session visitor wallet with 50 FCUK credit and agent network token transfers
- feat: real Tatum.io API integration when TATUM_API_KEY is set; local in-memory fallback otherwise

## [financecheque-v0.1.0.58] - 2026-05-15

### Added
- feat: Tatum wallet system — per-session visitor wallet created on page load with 50 FCUK sign-up credit
- feat: agent network wallet for receiving token transfers on order submission
- feat: wallet balance overlay on landing page (Visitor Wallet + Agent Network Wallet)
- feat: token transfer from session wallet to agent wallet on each lead generation order
- feat: wallet display in menu dropdown for unauthenticated visitors
- feat: real Tatum.io API integration (virtual accounts + ledger transactions) when TATUM_API_KEY is set; local in-memory fallback otherwise

## [financecheque-v0.1.0.57] - 2026-05-15

### Fixed
- refactor: clean up unused imports in src/main.tsx

## [financecheque-v0.1.0.56] - 2026-05-15

### Fixed
- refactor: clean up unused imports in src/main.tsx

## [financecheque-v0.1.0.55] - 2026-05-15

### Fixed
- refactor: clean up unused imports in src/main.tsx

## [financecheque-v0.1.0.54] - 2026-05-15

### Fixed
- refactor: clean up unused imports in src/main.tsx

## [financecheque-v0.1.0.53] - 2026-05-15

### Fixed
- refactor: clean up unused imports in src/main.tsx

## [financecheque-v0.1.0.52] - 2026-05-15

### Fixed
- refactor: clean up unused imports in src/main.tsx

## [financecheque-v0.1.0.51] - 2026-05-15

### Fixed
- refactor: clean up unused imports in src/App.tsx

## [financecheque-v0.1.0.50] - 2026-05-15

### Fixed
- refactor: clean up unused imports in src/main.tsx

## [financecheque-v0.1.0.49] - 2026-05-15

### Fixed
- refactor: clean up unused imports in src/main.tsx

## [financecheque-v0.1.0.48] - 2026-05-15

### Fixed
- refactor: clean up unused imports in src/main.tsx

## [financecheque-v0.1.0.47] - 2026-05-15

### Fixed
- refactor: clean up unused imports in src/main.tsx

## [financecheque-v0.1.0.46] - 2026-05-15

### Fixed
- refactor: clean up unused imports in src/main.tsx

## [financecheque-v0.1.0.42] - 2026-05-15

### Fixed
- refactor: clean up unused imports in src/main.tsx

## [financecheque-v0.1.0.41] - 2026-05-15

### Changed
- Renamed "Launch a Lead Campaign" to "Generate Leads" with auto-detect lead value from URL
- Renamed "Sign In to Submit Job" to "Submit Order"
- Replaced "Credit Cost" display with two-column Wallet Balance + Order Total layout
- Replaced "How It Works" section with live Agent Network showing child proxy nodes from /api/health
- Wallet credits now move to an Agent Network wallet balance on order submission
- Submit Order button only active when wallet balance >= order total; otherwise shows Top Up
- Top Up button shows exact additional credits needed

## [financecheque-v0.1.0.40] - 2026-05-14

### Added
- **Streaming support**: agent.py now handles `stream: true` requests with SSE server-sent events for opencode/kilo/kiro compatibility
- **`GET /v1/models` endpoint**: returns available models list for OpenAI-compatible tool discovery
- **Round-robin parent proxy**: child proxy tries `www.financecheque.uk` then `financecheque.uk` for registration and chat routing
- **Round-robin LLM providers**: local provider chain now rotates through OpenRouter → OpenAI → Anthropic → Gemini → DeepSeek → Groq
- **CLI tool configs**: install.sh creates config files for opencode, kilo, and kiro pointing to `localhost:6000/v1`
- **OpenAI-compatible env vars**: install.sh sets `OPENAI_BASE_URL`, `OPENAI_API_KEY`, `FCUK_PROXY_URL` in shell profile
- **Preserve machine identity**: install.sh no longer overwrites existing `machine.json` — reinstall keeps the same machine_id
- **Root endpoint**: `GET /` returns service info with available endpoints
- **OpenRouter support**: agent.py now reads `OPENROUTER_API_KEY` and routes to OpenRouter API

### Fixed
- Install script double-start conflict: no longer runs both systemd and nohup — uses systemd on Linux, nohup fallback on macOS
- Machine identity preserved across reinstalls
- Public IP used for parent registration instead of private `127.0.0.1`

## [financecheque-v0.1.0.36] - 2026-05-14

### Added
- Health dashboard at `/health` showing all registered child proxies with last_seen timestamps and recent parent proxy call logs
- `GET /api/health` endpoint returning child proxy nodes, call logs, and summary stats
- Parent proxy now logs every `/api/proxy/v1/chat/completions` request to D1 `proxy_logs` table including origin machine, routing decision (direct vs child-proxy), and response status
- `proxy_logs` table added to `schema.sql` and auto-created via `ensureTable` in the parent proxy
- Routing decision (`routing_decision`) exposed in `_proxy` diagnostics response field

## [financecheque-v0.1.0.35] - 2026-05-14

### Fixed
- fix: upgrade server logging from log to error for production visibility

## [financecheque-v0.1.0.34] - 2026-05-14

### Fixed
- fix: remove debugging console.log from functions/api/auth.ts

All notable changes to this project will be documented in this file.

## [financecheque-v0.1.0.08] - 2026-05-10

### Added
- Parent proxy chat routing endpoint via `/api/proxy?action=chat` that forwards chat prompts to the least-loaded live child proxy.
- Child proxy `/chat` endpoint in `child-proxy.js` so parent-routed chat requests can be fulfilled by the Hermes/Kiro worker host.
- WhatsApp icon modal now opens a real in-site chat box that posts to the parent proxy and shows child-proxy responses.

### Changed
- Version bump to `0.1.0.08` for a new semantic release.

---

## [financecheque-v0.1.0.07] - 2026-05-13

### Added
- **Parent Proxy API** (`functions/api/proxy/`): Cloudflare Pages Function for child proxy coordination
  - `POST /api/proxy/register`: child proxy registration with D1 persistence
  - `GET /api/proxy/nodes`: list active child proxies (seen within last hour)
  - `POST /api/proxy/v1/chat/completions`: OpenAI-compatible endpoint with cross-machine chat-only enforcement
  - `X-Chat-Only` header set automatically when multiple nodes are registered, preventing command execution on foreign machines
- **Child proxy agent** (`public/fcukproxy/agent.py`): rewritten for parent proxy architecture
  - Auto-registers with parent proxy on startup (periodic re-registration every 60s)
  - Local LLM routing via env API keys (OpenAI, Anthropic, Gemini, etc.)
  - Fallback chain: local LLM → parent proxy → multicast peers
  - `POST /execute` endpoint blocked by `X-Chat-Only` header (returns 403)
  - `GET /env` endpoint shows configured providers
  - `GET /status` now reports `has_api_keys` and configured provider list
- **Hermes agent integration** in `install.sh`
  - Installs `hermes-agent` via pip (AI assistant with built-in web GUI)
  - Auto-configures Hermes to use local proxy (`localhost:6000/v1`) as LLM backend
  - Starts Hermes gateway on port 6002
  - Creates `~/.fcukproxy/.env` with commented API key templates
- **D1 database** (`schema.sql`): added `proxy_nodes` table for child proxy registry

### Fixed
- Install script URL changed to `https://www.financecheque.uk/fcukproxy/install.sh` (root domain 301 redirects to www without path preservation)
- `_redirects` file moved to `public/` so Vite copies it to `dist/` for Cloudflare Pages deployment
- Functions restructured to `[[catchall]].ts` pattern for proper sub-path routing

---

## [financecheque-v0.1.0.07] - 2026-05-10

### Added
- **Job submission form** on landing page: webapp URL + lead amount (£) + quantity → live credit cost preview
- **Agent pipeline illustration**: animated flow diagram (webapp → financecheque.uk API → AWS child proxy → Hermes/Kiro)
- **Top-up modal**: Starter (100cr/£9.99), Pro (350cr/£29.99), Enterprise (1500cr/£99.99) via Stripe
- **CF Functions**: `/api/jobs` (submit job + GET credits), `/api/proxy` (child register/heartbeat), `stripe.ts` updated with topup + webhook
- **D1 schema**: `jobs` and `child_proxies` tables; migration runs automatically in CI before deploy
- **child-proxy.js**: AWS agent that registers with parent proxy, dispatches jobs to Kiro CLI or Hermes workspace
- **setup-child-proxy.sh** (`financecheque-v0.1.0.07`): one-liner install via `curl | bash`; uses PM2 ecosystem file for env vars (fixes `--env-file` incompatibility)

### Fixed
- PM2 `--env-file` flag not supported on older PM2 versions — replaced with `ecosystem.config.cjs`
- Token key unified to `auth_token` (localStorage) across all new components
- Stripe topup session passes `userId` + `credits` in metadata for webhook crediting

### Changed
- `stripe.ts` CF Function: added `topup`/`webhook` actions, legacy `basic` package alias kept
- GitHub Actions workflow: D1 migration step added before Pages deploy

---

## [financecheque-v0.1.0.06] - 2026-05-08

### Added
- **Stripe Cloudflare Pages Function** (`functions/api/stripe.ts`): checkout and billing portal now work in production
- **Auth modal tab switcher**: Sign In goes straight to the login form; Register shows package selection first
- **Forgot Password link** in sign-in form
- **README**: replaced Google AI Studio boilerplate with real project documentation

### Fixed
- Seller balance now **increases** when a buyer places an order (was incorrectly decreasing)
- JWT secret now reads from `env.JWT_SECRET` (Cloudflare env var) instead of hardcoded value
- "Select Soloprenuer" button now opens the auth/register modal
- "Unlock Business" button now calls the real Stripe endpoint
- Hardcoded Tatum API keys and JWT secret removed from `wrangler.toml`

---## [financecheque-v0.1.0.04] - 2026-05-02

### Added
- Real user registration with Cloudflare D1 database
- User login with JWT authentication (using jose - Cloudflare compatible)
- Password reset request and reset functionality
- User sessions stored in D1 database
- API endpoint `/api/auth` with actions: register, login, request-reset, reset-password, me, logout
- bcryptjs for password hashing
- UUID generation for session and reset tokens

### Fixed
- Replaced jsonwebtoken with jose for Cloudflare Workers compatibility
- Removed Node.js built-in dependencies (crypto, buffer, stream, util)

---

## [financecheque-v0.1.0.03] - 2026-05-01

### Fixed
- Mobile menu now uses click-to-toggle for Buyer and Seller submenus (not hover-based)
- "Budget Per Lead" label no longer shows "(credits)" suffix
- Fixed handleAgentAuthorize: buyer wallet decreases, seller balance increases correctly
- Seller submenu items now close mobile menu when clicked

---

## [financecheque-v0.1.0.02] - 2026-05-01

### Fixed
- Removed "(credits)" from "Budget Per Lead" label
- Fixed mobile menu - now uses click toggle instead of hover-only
- Fixed seller balance: authorization now deducts 2.33 credits from Lead Seller wallet
- Authorization credits (2.33) properly deducted from seller balance

---

## [financecheque-v0.1.0.01] - 2026-05-01

### Added
- Mobile-first responsive design for landing page
- Compact mobile view with hidden subtitle ("Universal Agentic A.I Lead Generation")
- Smaller title on mobile (text-lg) scaling up on larger screens

### Changed
- Reduced title size: text-lg (mobile) → sm:text-xl → md:text-3xl
- Hidden extended subtitle on mobile (shows "A.I Lead Gen")
- Reduced padding throughout: px-4 py-2 on mobile instead of px-8 py-8
- Compact Lead Buyer and Lead Seller sections

### Fixed
- Exchange page compacted for mobile view
- AvatarSection shows Stacey GIF animation properly

---

## [financecheque-v0.1.0.00] - 2026-05-01

### Added
- Initial migration from FCUK to datro (financecheque)
- Lead order simulation with localStorage persistence
- Tatum.io API integration (keys in wrangler.toml)
- Stacey avatar with GIF animation in agent circle
- Cloudflare Pages deployment configuration
- £ symbol replaced with "credits" throughout
- "Lead Buyer" and "Lead Seller(s)" labels updated
