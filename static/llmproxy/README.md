# LLM Proxy System

A universal LLM proxy system with parent/child architecture for routing LLM requests across multiple machines via Tailscale, with Cloudflare as the parent proxy.

## Architecture

```
                    ┌─────────────────┐
                    │   Cloudflare    │
                    │  (Parent Mode)  │
                    │  - Worker       │
                    │  - Pages (GUI)  │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
   ┌─────────┐         ┌─────────┐         ┌─────────┐
   │ Laptop  │         │  AWS 1  │         │  AWS 2  │
   │ (Child) │         │ (Child) │         │ (Child) │
   │ - Proxy │         │ - Proxy │         │ - Proxy │
   │ - CLI   │         │ - CLI   │         │ - CLI   │
   └─────────┘         └─────────┘         └─────────┘
        │
        ▼
   ┌─────────┐
   │  Phone  │
   │ (Child) │
   │ - Proxy │
   │ - Ollama│
   └─────────┘
```

## Features

- **Universal Proxy**: Routes requests to CLIs (groq, kilo, kiro, opencode) and direct APIs (OpenAI, Anthropic, Gemini, xAI, etc.)
- **Round-Robin**: Distributes load across all available machines
- **Fallback**: If Cloudflare fails → local proxy. If local proxy fails → Cloudflare proxy
- **Web GUI**: Real-time health monitoring, onboarding, and configuration
- **OTA Updates**: Automatic updates via cronjob
- **Scalable**: Add more machines, CLIs, and APIs via JSON config

## Quick Install

### Child Mode (Machines)
```bash
curl -fsSL https://financecheque.uk/install.sh | sh
```

### Parent Mode (Cloudflare)
See [INSTALL.md](INSTALL.md) for Cloudflare deployment.

## Web GUI

- **Local**: http://localhost:8080
- **Cloudflare**: https://kiro.financecheque.uk

## Endpoints

| Endpoint | Mode | Description |
|----------|------|-------------|
| `/v1/chat/completions` | Both | OpenAI-compatible chat endpoint |
| `/health` | Both | Health check |
| `/api/status` | Dashboard | Machine status |
| `/api/onboarding` | Dashboard | CLI/API key setup |

## Configuration

- `subproxy/config/machines.json` - Machine list (scalable)
- `subproxy/config/providers.json` - CLI and API providers
- `subproxy/config/hermes.json` - Hermes round-robin config

## Hermes Integration

Configure Hermes default LLM to use round-robin:
```json
{
  "default_llm": "financecheque-uk",
  "llm_endpoint": "https://kiro.financecheque.uk/v1/chat/completions/"
}
```

## License

MIT