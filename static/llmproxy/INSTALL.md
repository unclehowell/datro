# Installation Guide

## Table of Contents
- [Child Mode (Machine Installation)](#child-mode-machine-installation)
- [Parent Mode (Cloudflare)](#parent-mode-cloudflare)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)

---

## Child Mode (Machine Installation)

### Prerequisites
- Python 3.8+
- Git
- Tailscale (for network access)
- Internet connection

### Quick Install (One-Liner)
```bash
curl -fsSL https://financecheque.uk/install.sh | sh
```

### Manual Installation

1. **Clone the repository**
```bash
mkdir -p ~/llmproxy
cd ~/llmproxy
git clone -b llmproxy https://github.com/unclehowell/datro.git .
```

2. **Install dependencies**
```bash
cd ~/llmproxy/subproxy
pip3 install -q aiohttp
```

3. **Configure machine info**
```bash
cat > ~/llmproxy/subproxy/config/machine.json <<EOF
{
  "machine_id": "$(hostname)",
  "machine_name": "$(hostname)",
  "tailscale_ip": "$(hostname -I | awk '{print $1}')",
  "port": 5000,
  "capabilities": ["cli", "api", "local"],
  "priority": 1
}
EOF
```

4. **Start services**
```bash
# Start sub-proxy
cd ~/llmproxy/subproxy
nohup python3 server.py > ~/llmproxy/logs/subproxy.log 2>&1 &

# Start dashboard
cd ~/llmproxy/dashboard
nohup python3 server.py > ~/llmproxy/logs/dashboard.log 2>&1 &
```

5. **Setup OTA updates**
```bash
# Add to crontab
echo "*/5 * * * * cd ~/llmproxy && git fetch origin llmproxy && git reset --hard origin/llmproxy >> ~/llmproxy/logs/update.log 2>&1" | crontab -
```

### Free CLI Tools

The installer attempts to install these free CLI tools:
- **opencode** - No API key required
- **kilo** - CLI tool (check npm global)
- **kiro** - CLI tool (check ~/.kiro)
- **groq** - CLI tool (check npm global)
- **ollama** - Local LLM (optional)

### API Keys Setup

After installation, configure API keys:

**Option 1: Via Web GUI**
1. Open http://localhost:8080
2. Go to Configuration section
3. Enter API keys in providers.json
4. Save and restart

**Option 2: Via Environment Variables**
```bash
export GROQ_API_KEY="your-groq-key"
export GOOGLE_API_KEY="your-google-key"
export ANTHROPIC_API_KEY="your-anthropic-key"
export OPENAI_API_KEY="your-openai-key"
export XAI_API_KEY="your-xai-key"
```

Add to `~/.bashrc` for persistence.

---

## Parent Mode (Cloudflare)

### Prerequisites
- Cloudflare account
- Domain configured (kiro.financecheque.uk)
- Wrangler CLI installed (`npm install -g wrangler`)

### Deployment Steps

1. **Clone and navigate**
```bash
git clone -b llmproxy https://github.com/unclehowell/datro.git ~/llmproxy
cd ~/llmproxy/cloudflare
```

2. **Configure wrangler.toml**
```toml
name = "llmproxy-worker"
compatibility_date = "2023-12-01"

[vars]
ENVIRONMENT = "production"
```

3. **Deploy Worker**
```bash
wrangler deploy
```

4. **Deploy Pages (GUI)**
- Create a Cloudflare Pages project
- Connect to GitHub or upload `dashboard/index.html`
- Set domain to `kiro.financecheque.uk`

### Routes Configuration

| Route | Handler |
|-------|---------|
| `kiro.financecheque.uk/v1/*` | Worker (proxy) |
| `kiro.financecheque.uk/*` | Pages (GUI) |

---

## Configuration

### machines.json (Scalable)
```json
{
  "machines": [
    {
      "name": "laptop",
      "ip": "100.64.1.1",
      "port": 5000,
      "type": "laptop",
      "providers": ["groq", "kilo", "kiro", "gemini"]
    }
  ]
}
```

### providers.json (CLIs and APIs)
```json
{
  "groq": {
    "type": "cli",
    "command": "groq",
    "api_key_env": "GROQ_API_KEY",
    "enabled": true
  },
  "gemini": {
    "type": "api",
    "endpoint": "https://generativelanguage.googleapis.com/v1/...",
    "api_key_env": "GOOGLE_API_KEY",
    "enabled": true
  }
}
```

### hermes.json (Round-Robin)
```json
{
  "default_llm": "financecheque-uk",
  "fallback_chain": [
    {"name": "cloudflare-proxy", "endpoint": "https://kiro.financecheque.uk/v1/chat/completions/", "priority": 1},
    {"name": "local-proxy", "endpoint": "http://localhost:5000/v1/chat/completions", "priority": 2}
  ],
  "round_robin": true
}
```

---

## Troubleshooting

### Port Already in Use
```bash
# Find and kill process on port 5000
lsof -i :5000
kill -9 <PID>
```

### Git Authentication Error
```bash
# Use personal access token
git remote set-url origin https://YOUR_TOKEN@github.com/unclehowell/datro.git
```

### Cloudflare Worker Error
```bash
# Check logs
wrangler tail
```

### Check Service Status
```bash
# Sub-proxy
curl http://localhost:5000/health

# Dashboard
curl http://localhost:8080/api/status

# Cloudflare
curl https://kiro.financecheque.uk/health
```

---

## Support

- GitHub Issues: https://github.com/unclehowell/datro/issues
- Documentation: https://financecheque.uk/docs