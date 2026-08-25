## [1.7.13] - 2026-08-25T21:43

Automated flywheel iteration 9/18: new color theme `monochrome`.

## [1.7.12] - 2026-08-25T21:20

Automated flywheel iteration 8/18: new color theme `ocean`.

## [1.7.11] - 2026-08-25T21:00

Automated flywheel iteration 7/18: new color theme `amber`.

## [1.7.10] - 2026-08-25T20:40

Automated flywheel iteration 6/18: new color theme `rose`.

## [1.7.9] - 2026-08-25T20:20

Automated flywheel iteration 5/18: new color theme `forest`.

## [1.7.8] - 2026-08-25T20:00

Automated flywheel iteration 4/18: new color theme `midnight`.

## [1.7.7] - 2026-08-25T19:40

Automated flywheel iteration 3/18: new color theme `carbon`.

## [1.7.6] - 2026-08-25T19:20

Automated flywheel iteration 2/18: new color theme `slate`.

## [1.7.5] - 2026-08-25T19:17

Automated flywheel iteration 1/18: new color theme `obsidian`.

## [1.7.4] - 2026-08-25

OTA infrastructure hardening — the flywheel foundation.

### Fixed
- **update-checker.sh: npm/node paths broken on Termux**: hardcoded `~/.local/node/bin/npm` path fails on Termux which installs npm at `$PREFIX/bin/npm`. Now dynamically detects node/npm/npx from bundled path, `command -v`, or `$PREFIX/bin`
- **update-checker.sh: no git repo = no update**: phones installed via `curl | bash` tarball had no `.git` directory, so `git pull` silently skipped. Added tarball download fallback: when `.git` is missing, fetches the release tarball from GitHub and rsyncs files into place
- **update-checker.sh: unnecessary rebuilds**: stale `turbopack` marker in `.next` was wiping the build cache on every run, forcing a full `next build` even when source hadn't changed. Now only cleans on source-hash mismatch
- **update-checker.sh: OOM on low-RAM machines**: `next build` on a 4GB laptop with `MemoryMax=384M` and no heap cap crashes the process. Added `NODE_OPTIONS=--max-old-space-size=512` (384 for <=2GB RAM) and increased systemd service memory limits
- **update-checker.sh: child-proxy.mjs had no service**: `child-proxy.mjs` file existed but no systemd unit ran it. Added `fcukproxy-child.service` to `regenerate_services()`, enabled by default
- **/api/version route: `gh: not found` on Termux**: the route called `execSync("gh release list ...")` which requires the GitHub CLI — not present on Android. Replaced with unauthenticated GitHub API `fetch()` calls, no external CLI needed
- **public/install.sh: cronie missing on Termux**: cron-based OTA scheduling silently failed because no cron daemon existed. Installer now installs `cronie` via `pkg install` and starts `crond` via runit on Termux
- **All installers: VERSION bumped to 1.7.4**

## [1.7.3] - 2026-08-25

Installer hotfix #3 — Turbopack can't build on Android.

### Fixed
- **GUI build fails on Android/Termux**: Next.js 16 defaults to Turbopack, which has no native bindings for `android/arm64`. Both `install.sh` and `update-checker.sh` now pass `--webpack` on Termux so the production build succeeds
- **GUI doesn't survive Termux reboot**: the GUI runs via `nohup` (no systemd on Termux) but the boot script didn't start it. Added GUI auto-start to `~/.termux/boot/start-fcukproxy.sh` and to the installer's `start_gui_nohup()` for future installs

## [1.7.2] - 2026-08-25

Installer hotfix #2 from the same Termux phone.

### Fixed
- **Hardcoded `/tmp` breaks on Android**: some devices mount `/tmp` as a root-owned tmpfs (Termux uid can't write — `curl` died with exit 23 mid-GUI-download). Every temp path (GUI tarball + extraction, Node/llama archives, pip bootstrap, AI-tool logs) now honors `$TMPDIR` and falls back to `~/.tmp` when `/tmp` isn't writable

## [1.7.1] - 2026-08-25

Installer hotfix from a live Termux install.

### Fixed
- **Silent abort in `write_config`**: a pre-existing `.env` without a `FCUK_LOCAL_TOKEN` line made `grep` exit 1 inside a command substitution, and `set -euo pipefail` killed the installer with no message (caught via `bash -x` on an SM-A075M phone). The grep is now failure-tolerant
- **Child-node ID collisions**: IDs were `$(hostname)-<epoch-tail>` — every Termux device has hostname `localhost`, so nodes could collide (phone and laptop both claimed `localhost-6630`). IDs now mix hostname + `boot_id` + app path through sha256 → stable, unique 8-hex suffix

## [1.7.0] - 2026-08-25

Installer parity: every Linux device gets the current GUI + self-updates.

### Fixed
- **Stale GUI on fresh installs**: the one-liner installer (`financecheque.uk/fcukproxy/install.sh`) hardcoded `GUI_VERSION=0.5.1.93`, so phones/Termux and any new node installed a museum-era GUI snapshot (or fell back to the legacy Python chat page). The installer now resolves the **latest financecheque release** dynamically (GitHub API → raw `.version` → fallback), so `localhost:3000` is always identical to the newest rerelease
- **Port squatting**: before starting the GUI, the installer frees port 3000 from legacy listeners (`fuser`/`lsof`), fixing silent bind failures on devices with an old chat server

### Added
- **Self-update on every device**: the installer now ships `update-checker.sh` to all installs and schedules it — systemd timer (daily 04:00, persistent) where systemd is available, cron (`42 */4 * * *`) otherwise, with a manual-run hint as last resort. Previously only nodes installed from a datro clone had OTA; Termux phones never self-updated

## [1.6.0] - 2026-08-24

Voicemail modal experience + LLM stack auto-start.

### Added
- **Voicemail modal on hang-up**: ending a diverted call now opens a modal automatically — animated `stt > think > tts` breadcrumb shows live pipeline progress (polled from `?action=status`), then swaps to the reply transcript + playback bar when ready; error state included
- **LLM stack auto-start**: the voicemail pipeline now wakes Hermes (`hermes-local`) and Ollama/OmniRoute (`ensureLLMStack`) before generating the reply, so voicemails work even when the stack is dormant
- **Live step highlighting**: breadcrumb steps pulse while active, stay green once complete

### Changed
- Processing breadcrumb moved out of the voicemail list panel and onto the modal (list stays clean)
- Voicemail submission no longer flashes a placeholder card in the list

## [1.5.7] - 2026-08-24

OTA auto-update fixes for child nodes.

### Added
- **OTA manifest trigger**: bumped `release_sequence` to `7` and component versions in `public/fcukproxy/ota-manifest.json` so child proxies detect and apply updates automatically
- **Dynamic agent version detection**: `child-proxy.mjs` now parses `VERSION` from local `agent.py` instead of using a hardcoded fallback, preventing false-positive re-downloads

### Fixed
- Phone child proxy no longer skips OTA because of stale `0.7.0` fallback when `agent.py` is already newer
- Laptop child proxy OTA checks now use GitHub manifest directly via `OTA_URL` override

### Changed
- Repo version bumped to `1.5.7`
- GitHub release tagged as `v1.5.7`

---

## [1.5.6] - 2026-08-24

Voicemail list panel + voice-call voicemail save + cross-device scaling fixes.

### Added
- **Voicemail list panel**: bell icon now opens a slide-out voicemail list with play/replay, delete, unread badge, and timestamps
- **Voice-call voicemail save**: `sendCallReply` now persists every voice exchange as a playable voicemail via new `POST /api/voicemail?action=save-text`, so users can replay call replies later
- **GraphRAG knowledge base**: already integrated in chat route; 29 chunks from legal/research documents queried on every prompt

### Fixed
- **install.sh version strings**: bumped installer VERSION from `0.5.1.93` / `1.5.2` to `1.5.6` across `install.sh`, `public/install.sh`, `public/fcukproxy/install.sh`
- **Child proxy restart hygiene**: `public/install.sh` now stops/deletes stale pm2 child-proxy and agentos-gui processes and kills bound ports before restarting, preventing `EADDRINUSE` on reinstall
- **Voicemail modal**: bell icon now reliably opens the voicemail list panel on all screen sizes

### Changed
- Repo version bumped to `1.5.6`
- GitHub release tagged as `v1.5.6`

---

## [1.5.4] - 2026-08-23

GraphRAG knowledge base + voicemail UX fixes.

### Added
- **GraphRAG knowledge base**: Python keyword RAG server (port 8050) that provides document context to all LLM calls. 33 legal/research documents indexed, retrieved via TF-IDF scoring.
- **GraphRAG systemd service**: auto-deployed via OTA with RAM-adaptive memory caps (64-96M)
- **Voicemail modal overlay**: hang-up now opens a centered modal with processing breadcrumb, which transitions to the PlaybackBar when processing completes — replaces the old bottom panel

### Fixed
- **`playBeep` import crash**: `playBeep()` was called in `divertToVoicemail` but never imported, causing `ReferenceError` right after the greeting played — recording never started
- **`PlaybackBar` scope crash**: component was pasted inside a video-result IIFE closure, making it inaccessible at the usage site — page crashed when clicking play on any voicemail
- **Orphaned IIFE closure**: `return null; })()}` left dangling after PlaybackBar was misplaced inside the video IIFE

### Changed
- Phone button goes straight to voicemail (greeting → beep → record) instead of starting a full duplex call with 40s warm-up
- Chat API now queries GraphRAG for relevant context before routing to Hermes/OmniRoute/cloud — injected as system message
- Stream teardown deferred in `stopDuplex` so recorder `onstop` fires before tracks die

---

## [1.5.2] - 2026-08-21

Voicemail diversion for unanswered calls + live processing indicator.

### Added
- **Voicemail diversion**: unanswered calls now behave like a real phone. After 40s of dial tone the agent answers with a greeting ("…please leave a message after the beep"), plays the beep, records continuously, and on hang-up submits the recording to the voicemail pipeline (STT → LLM → TTS mp3). Previously unanswered calls rang dial tone for 5 minutes and silently gave up — nothing was ever wired to the voicemail backend.
- **Processing breadcrumb in voicemail list**: between hanging up and the reply landing in the panel, each pending message shows an animated `stt > think > tts` breadcrumb card (with received time) instead of nothing. Cards clear when the processed voicemail arrives (or after 10 min).

---

## [1.5.1] - 2026-08-21

Hotfix release — critical security patches + call/settings UX fixes.

### Security
- **Settings key allow-list**: `POST/DELETE /api/settings` now reject any key outside the known provider list — env-var injection via `~/.llm_keys` (e.g. `PATH`, `HOME`) returns 400.
- **Math eval shell injection removed** (`/api/chat`): expressions are piped to python3 via stdin instead of being interpolated into a shell command; backtick payloads no longer execute.
- **Voicemail math**: replaced `new Function()` evaluation with the same stdin-python subprocess (sandbox-escape risk gone).

### Fixed
- **Uninstall confirmation is visible**: tile button turns solid pulsing red with a live "Tap again (3…)" countdown, so the first tap clearly registered.
- **Proxy-lock clarity**: input field is visually disabled (dimmed + not-allowed cursor) while a parent proxy holds the session lock.
- **Call error recovery**: three consecutive STT failures or an assistant failure now drop the call cleanly — hang-up tone + non-blocking toast ("Call dropped — …") instead of silent dead air.
- **Chat empty state**: first visit shows a hint (green handset = voice call, current act/plan mode) instead of a blank page.

---

## [1.5.0] - 2026-08-20

Phone-call UX restored + act/plan mode options in chat.

### Added
- **Mode options (act / plan)**: segmented toggle in the chat input bar. Plan mode instructs the brain to analyse and propose a step-by-step plan without executing; Act mode behaves as before. Sent with every request and honoured by both the local stack (Hermes/MiniCPM) and the cloud fallback.
- **Phone call flow**: the voice-mode button is now a proper phone icon — green handset to start a call, red end-call handset while connected. Click red to hang up.
- **Call etiquette**: spoken ack line on answer ("Hello? Finance Cheque UK speaking…"), connecting tone while the stack warms, answer chime, hold tone + "one moment" ack while a reply is generated, hang-up tone on disconnect.
- **Hang-up safety**: hanging up mid-sentence never submits the pending draft; replies that land after hang-up are dropped.
- **Separate voice agent**: calls run in their own session (`agentos-voice-session-id`) with their own message history (`agentos-voice-call-messages`), so call transcripts never pollute the text conversation. `voiceCall: true` requests short spoken-style replies.
- **Quiet during calls**: text-message auto-speak narration is muted while on a call; no HUD changes mid-call other than the phone button itself.

### Changed
- `/api/chat` accepts optional `mode` ("act"|"plan"), `voiceCall` (bool) and `sessionId`; persona adjustments appended to system prompts on all routes.

---

## [1.4.1] - 2026-08-20

Fixes for GUI rebuild reliability and version API rate limiting.

### Fixed
- Version API uses `gh` CLI for authenticated GitHub release lookups (avoids unauthenticated rate limit)
- Version display now correctly shows release URL
- `ensure_gui_build()` runs on every OTA invocation — catches missing `.next/BUILD_ID` and source changes regardless of version update status
- Removed duplicate rebuild logic from `apply_update()`

---

## [1.4.0] - 2026-08-20

Voicemail management in chat + live version display from GitHub releases.

### Added
- **Delete voicemail**: new `POST /api/voicemail?action=delete` endpoint removes voicemail record and audio file from disk.
- **Voicemail panel in chat**: collapsible panel (phone icon in header) lists voicemails with play, timestamp, and delete buttons. Unread count badge on the icon.
- **Version display in chat header**: shows current installed version (`v1.4.0`) and latest release version fetched from GitHub releases API. Green "up to date" badge when current matches latest; amber badge when an update is available.
- **`/api/version` now fetches GitHub releases**: `latestRelease` and `releaseUrl` fields added. Falls back to raw `.version` file if no GitHub releases exist.

### Changed
- `install.sh` 1.3.0 → **1.4.0**
- Voicemail API: added `unlinkSync` import for audio file deletion.

## [1.3.0] - 2026-08-19

Memory safety hardening — prevents OOM crashes on low-RAM machines (<=4 GiB). Every systemd service now has cgroup memory caps so no single process can consume all RAM and freeze the box. Adaptive limits scale with detected RAM.

### Added
- **RAM detection**: installer reads `/proc/meminfo` and computes adaptive `MemoryMax`/`MemoryHigh` limits per service (low-RAM mode for <=4 GiB, standard mode for >4 GiB).
- **`vm.swappiness=100`**: kernel tuned to swap early instead of OOM-killing; persisted via `/etc/sysctl.d/99-financecheque.conf`.
- **`OOMScoreAdjust`**: gateway protected (-100), whisper/omniroute sacrificial (+100), agentos-gui killed first (+500) to break OOM death spirals.
- **`agentos-gui.service` `RestartSec=60`**: prevents rapid kill→restart→kill loop that wastes memory on each cycle.

### Changed
- `install.sh` 1.2.4 → **1.3.0**: 13 steps (was 12), new step 10 for kernel memory tuning.
- All 5 systemd services now ship with `MemoryMax` + `MemoryHigh` cgroup caps.
- `whisper-stt.service`: capped at 192M/128M (low-RAM) or 256M/192M (standard).
- `whisper-realtime.service`: same caps as whisper-stt.
- `agentos-gui.service`: capped at 96M/64M (low-RAM) or 128M/96M (standard).
- `omniroute.service`: capped at 256M/192M (low-RAM) or 512M/384M (standard).
- `openclaw-gateway.service`: capped at 384M/256M (low-RAM) or 512M/384M (standard).

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
