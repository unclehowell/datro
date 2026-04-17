# Changelog

## [2.0.0] - 2026-04-17
### Added
- Version bump to v2.0.0 for consistency with financecheque branches
- Unified version system across all DATRO branches

### Changed
- Semantic versioning aligned across carfinancecheque, financecheque, llmproxy

---

## [1.2.0] - 2026-04-17
### Added
- Kiro CLI integration via persistent tmux session (`kiro-proxy`) — subproxy routes `model=kiro` requests to a live kiro-cli session and relays the response
- Multi-provider API fallback chain: Mistral → NVIDIA → Gemini (all configured as Cloudflare Worker secrets)
- Hermes agent auto-configuration in install.sh — sets `localhost:4117` as primary LLM endpoint with `kiro.financecheque.uk` as remote fallback
- Dual port binding: subproxy listens on both 5000 and 4117 (kiro tools expect 4117)
- Machine self-registration with CF worker via `POST /api/register`

### Changed
- install.sh now configures hermes config.yaml automatically on install
- install.sh starts kiro in a persistent `kiro-proxy` tmux session
- Cloudflare worker fallback now tries Mistral, NVIDIA, Gemini in order instead of Groq only
- Provider list updated: Groq/Kilocode replaced with Mistral/NVIDIA as primary providers

### Fixed
- CLI routing replaced with direct API calls (groq-cli/kiro-cli one-shot mode was broken)
- Model name passthrough — provider's default model used when alias like `kiro` is passed
- Port 4117 now always bound (was only 5000 before)

## [1.1.0] - 2026-04-17
### Added
- Direct API routing replacing broken CLI subprocess routing
- Dual port support (5000 + 4117)
- systemd user service for always-on operation
- Provider fallback chain

### Fixed
- groq-cli crash on uv_cwd error
- kiro/kilo CLI one-shot mode not working

## [1.0.0] - 2026-04-16
### Added
- Initial release
- Cloudflare Worker parent proxy at kiro.financecheque.uk
- Sub-proxy server with CLI and API provider routing
- Dashboard UI
- One-liner installer
- Auto-update via cron
