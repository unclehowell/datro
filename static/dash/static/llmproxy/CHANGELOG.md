# Changelog

All notable changes to the LLM Proxy System will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-04-16

### Added
- **One-liner installer**: `curl -fsSL https://kiro.financecheque.uk/install.sh | sh`
- **Child Dashboard** (`http://localhost:8080`):
  - 💬 Chat tab - Direct chat with OpenCode
  - ⬇️ Apps tab - App store with install buttons
  - 📊 Status tab - Machine health monitoring
- **App Store flow**:
  1. OpenCode (pre-installed)
  2. AWS Builder ID (oauth)
  3. Kiro IDE/CLI (requires AWS Builder ID)
  4. Kilo CLI
  5. Hermes Agent
- **Parent Dashboard** (`https://kiro.financecheque.uk/dashboard`):
  - Network health overview only
  - No onboarding, no apps
- **OTA auto-updates** via cron (every 5 minutes)
- **Semantic versioning** on all endpoints

### Security
- API keys stored in Cloudflare Secrets, never in code
- No secrets committed to repository

### Fixed
- Routing loop bug in worker.js
- API fallback not triggering properly

## [0.1.0] - 2026-04-15

### Added
- Initial Cloudflare Worker deployment
- Sub-proxy deployment to AWS instances
- Basic dashboard with health status

---

## Migration Guide

### From 0.x to 1.0

1. Run the new one-liner to get latest installer
2. Dashboard URLs changed:
   - Parent: `https://kiro.financecheque.uk/dashboard`
   - Child: `http://localhost:8080`
3. Apps now installed via web UI, not CLI
