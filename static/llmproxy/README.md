# LLM Proxy

OpenAI-compatible LLM proxy with a Cloudflare Worker parent and per-machine sub-proxies.

## Architecture

```
Your app / Hermes agent
        │
        ▼
http://localhost:4117  (sub-proxy, always-on)
        │  fallback if local fails
        ▼
https://kiro.financecheque.uk  (Cloudflare Worker)
        │  tries registered sub-proxies first
        │  fallback chain: Mistral → NVIDIA → Gemini
        ▼
  LLM response
```

Each machine runs a sub-proxy that:
1. Routes `model=kiro` to a persistent kiro-cli tmux session
2. Falls back through Mistral → NVIDIA → Gemini API if kiro is unavailable

## One-liner Install

```sh
curl -fsSL https://kiro.financecheque.uk/install.sh | sh
```

This will:
- Install the sub-proxy on ports 5000 and 4117
- Start kiro-cli in a persistent tmux session (`kiro-proxy`)
- Configure hermes agent to use `localhost:4117` with `kiro.financecheque.uk` as fallback
- Register this machine with the Cloudflare worker
- Set up a systemd user service for always-on operation
- Set up auto-update cron (checks every 5 min)

## API Keys

Add to `~/kiro-proxy.env`:
```
MISTRAL_API_KEY=...
NVIDIA_API_KEY=...
GEMINI_API_KEY=...
```

## Endpoints

| Endpoint | Description |
|----------|-------------|
| `POST /v1/chat/completions` | OpenAI-compatible chat |
| `GET /health` | Health check + provider status |
| `POST /api/register` | Register machine with CF worker |
| `GET /api/machines` | List registered machines |
| `GET /install.sh` | One-liner installer |

## Version

See [CHANGELOG.md](CHANGELOG.md) for release history.
