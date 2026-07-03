# Mobile Compute Offloading

## Architecture
Laptop hosts lightweight proxy that routes to phone's Compute API via Cloudflare tunnel.
Phone runs child-proxy with API provider keys, reducing laptop resource usage.

## Setup

### 1. Phone-side (Termux/Linux Deploy)
```bash
# Install Node.js in Termux
pkg install nodejs
npm install -g express node-fetch

# Edit .env with your API keys
export GEMINI_API_KEY=your-key
export OPENROUTER_API_KEY=your-key
node child-proxy.mjs
```

### 2. Register Phone Proxy
Edit `.fcukproxy/machine.json`:
```json
{
  "machine_id": "phone-uuid-here",
  "machine_name": "Phone Compute Node",
  "proxy_port": 4001,
  "parent": "https://www.financecheque.uk/api/proxy"
}
```

### 3. Cloudflare Tunnel (on phone)
```bash
cloudflared tunnel --url http://localhost:4001
# Point CNAME phone-proxy.financecheque.uk → tunnel endpoint
```

### 4. Laptop Configuration
In `.fcukproxy/.env`:
```
PHONE_PROXY_URL=https://phone-proxy.financecheque.uk
ROUTE_TO_PHONE=true
```

## Endpoints
- Laptop: `localhost:4001` → forwards to phone
- Phone: Runs round-robin LLM providers
- Parent (financecheque.uk): Routes between available children

## API Providers (round-robin on phone)
1. Gemini (primary) — no cost
2. Groq — fast, 70b model
3. OpenRouter — free models fallback
4. DeepSeek — cost-effective large model

## Load Balancing
Parent proxy routes to least-loaded child. Phone can handle compute while laptop manages orchestration.

## Benefits
- Laptop CPU/memory freed for IDE/Chrome
- Phone battery + network utilized for LLM calls
- Shared compute pool across devices
- No duplicate API key storage