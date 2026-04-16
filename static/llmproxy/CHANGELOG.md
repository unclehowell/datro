# Changelog

All notable changes to the LLM Proxy System will be documented in this file.

## [1.0.0] - 2026-04-16

### Added
- Initial release of LLM Proxy System
- Sub-proxy for local machine routing to CLIs and APIs
- Cloudflare Worker for parent proxy routing
- Web GUI dashboard for health monitoring
- Round-robin load distribution
- Fallback chain (Cloudflare → local → Cloudflare)
- OTA auto-update via cronjob
- Support for multiple CLIs: groq, kilo, kiro, opencode, ollama
- Support for multiple APIs: OpenAI, Anthropic, Gemini, xAI
- Hermes integration with round-robin configuration

### Components
- `subproxy/server.py` - Python aiohttp proxy server
- `cloudflare/worker.js` - Cloudflare Worker for routing
- `dashboard/server.py` - Local dashboard server
- `dashboard/index.html` - Web GUI with onboarding
- `scripts/install.sh` - Installation helper
- `scripts/update.sh` - OTA update script

### Configuration
- `subproxy/config/machines.json` - Scalable machine registry
- `subproxy/config/providers.json` - CLI/API provider config
- `subproxy/config/hermes.json` - Hermes round-robin config
- `subproxy/config/machine.json` - Local machine info