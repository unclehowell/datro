#!/usr/bin/env sh
# FCUK Proxy Installer — https://www.financecheque.uk
# Joins your machine to the Finance Cheque UK network as a child proxy.
# Installs the FCUK Proxy agent with:
#   - Round-robin parent proxy routing (www.financecheque.uk + financecheque.uk)
#   - Fallback LLM providers (OpenRouter, Groq, DeepSeek, etc.)
#   - OpenAI-compatible endpoint at localhost:6000 for kiro, kilo, opencode, groq
#   - Hermes agent with web GUI
set -e

REPO="https://raw.githubusercontent.com/unclehowell/datro/financecheque/public/fcukproxy"
INSTALL_DIR="$HOME/.fcukproxy"
VENV_DIR="$INSTALL_DIR/venv"
AGENT_PY="$INSTALL_DIR/agent.py"
GUI_PY="$INSTALL_DIR/gui.py"
ENV_FILE="$INSTALL_DIR/.env"
CONFIG_JSON="$INSTALL_DIR/machine.json"
SERVICE_NAME="fcukproxy"
PARENT_URL="https://www.financecheque.uk/api/proxy"

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║   Finance Cheque UK — FCUK Proxy Installer   ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

OS="$(uname -s)"
case "$OS" in
  Linux*)  PLATFORM="linux" ;;
  Darwin*) PLATFORM="macos" ;;
  *)       echo "Unsupported OS: $OS"; exit 1 ;;
esac
echo "Platform: $PLATFORM"

if command -v python3 >/dev/null 2>&1; then
  PYTHON=python3
elif command -v python >/dev/null 2>&1; then
  PYTHON=python
else
  echo "Python 3 is required. Install it with: sudo apt install python3"
  exit 1
fi
echo "Python: $($PYTHON --version)"

mkdir -p "$INSTALL_DIR"

# ── Preserve existing machine identity ──────────────────────────────────
if [ -f "$CONFIG_JSON" ]; then
  echo "Existing machine config found — preserving machine identity"
  EXISTING_MACHINE_ID="$(python3 -c "import json; print(json.load(open('$CONFIG_JSON')).get('machine_id',''))" 2>/dev/null || true)"
fi

echo "Downloading FCUK Proxy agent..."
curl -fsSL "$REPO/agent.py" -o "$AGENT_PY"
curl -fsSL "$REPO/gui.py"   -o "$GUI_PY"

# ── Python venv ─────────────────────────────────────────────────────────
echo "Setting up Python environment..."
$PYTHON -m venv "$VENV_DIR" 2>/dev/null || true
"$VENV_DIR/bin/pip" install --quiet aiohttp 2>/dev/null || pip3 install --quiet aiohttp 2>/dev/null || true

# ── Generate machine config ─────────────────────────────────────────────
if [ -n "$EXISTING_MACHINE_ID" ]; then
  echo "Reusing existing machine ID: $EXISTING_MACHINE_ID"
  MACHINE_ID="$EXISTING_MACHINE_ID"
else
  MACHINE_ID="$(python3 -c 'import uuid; print(uuid.uuid4())')"
fi
LOCAL_IP="$(hostname -I 2>/dev/null | awk '{print $1}' || echo '127.0.0.1')"
HOSTNAME="$(hostname)"

cat > "$CONFIG_JSON" <<EOF
{
  "machine_id": "$MACHINE_ID",
  "machine_name": "$HOSTNAME",
  "local_ip": "$LOCAL_IP",
  "proxy_port": 6000,
  "gui_port": 6001,
  "parent": "$PARENT_URL",
  "version": "0.4.0",
  "polling": true
}
EOF
echo "Machine config written to $CONFIG_JSON"

# ── Create .env for LLM API keys ──────────────────────────────────────
if [ ! -f "$ENV_FILE" ]; then
  cat > "$ENV_FILE" <<EOF
# FCUK Proxy — LLM API Keys
# Set keys here or export them as environment variables.
# The proxy tries providers in round-robin order: OpenRouter → OpenAI → Anthropic → Gemini → DeepSeek → Groq
# Without any keys, queries are forwarded to the parent proxy.

# OPENAI_API_KEY=sk-...
# ANTHROPIC_API_KEY=sk-ant-...
# GEMINI_API_KEY=...
# DEEPSEEK_API_KEY=...
# GROQ_API_KEY=gsk_...
# OPENROUTER_API_KEY=...
# MISTRAL_API_KEY=...
# TOGETHER_API_KEY=...
# PERPLEXITY_API_KEY=...
EOF
  echo "Env file created at $ENV_FILE"
  echo "  └─ Edit it to add your API keys: nano $ENV_FILE"
fi

# ── Tool configs: opencode, kilo, kiro ──────────────────────────────────
# Point these CLI tools to the local proxy at localhost:6000
echo "Configuring CLI tools to use local proxy..."

# opencode
if command -v opencode >/dev/null 2>&1; then
  OPENCODE_CONFIG_DIR="$HOME/.config/opencode"
  mkdir -p "$OPENCODE_CONFIG_DIR"
  if [ ! -f "$OPENCODE_CONFIG_DIR/opencode.json" ]; then
    cat > "$OPENCODE_CONFIG_DIR/opencode.json" <<EOF
{
  "\$schema": "https://opencode.ai/config.json",
  "model": {
    "provider": "openai",
    "base_url": "http://localhost:6000/v1",
    "api_key": "fcuk-proxy",
    "model": "proxy-router"
  }
}
EOF
    echo "  ✓ opencode configured → http://localhost:6000/v1"
  else
    echo "  - opencode config exists, skipping"
  fi
fi

# kilo
if command -v kilo >/dev/null 2>&1; then
  KILO_CONFIG_DIR="$HOME/.config/kilo"
  mkdir -p "$KILO_CONFIG_DIR"
  if [ ! -f "$KILO_CONFIG_DIR/kilo.jsonc" ]; then
    cat > "$KILO_CONFIG_DIR/kilo.jsonc" <<EOF
{
  "\$schema": "https://app.kilo.ai/config.json",
  "model": {
    "provider": "openai-compatible",
    "base_url": "http://localhost:6000/v1",
    "api_key": "fcuk-proxy",
    "model": "proxy-router"
  }
}
EOF
    echo "  ✓ kilo configured → http://localhost:6000/v1"
  else
    echo "  - kilo config exists, skipping"
  fi
fi

# kiro — install if not present
if command -v kiro >/dev/null 2>&1; then
  KIRO_CONFIG_DIR="$HOME/.config/kiro"
  mkdir -p "$KIRO_CONFIG_DIR"
  cat > "$KIRO_CONFIG_DIR/config.json" <<EOF
{
  "provider": "openai",
  "base_url": "http://localhost:6000/v1",
  "api_key": "fcuk-proxy",
  "model": "proxy-router"
}
EOF
  echo "  ✓ kiro configured → http://localhost:6000/v1"
fi

# Export env vars so tools without config files can discover the proxy
PROFILE_FILE="$HOME/.profile"
if [ -f "$HOME/.bashrc" ]; then PROFILE_FILE="$HOME/.bashrc"; fi
if ! grep -q "FCUK_PROXY_URL" "$PROFILE_FILE" 2>/dev/null; then
  cat >> "$PROFILE_FILE" <<EOF

# FCUK Proxy — local LLM endpoint for CLI tools
export FCUK_PROXY_URL="http://localhost:6000"
export OPENAI_BASE_URL="http://localhost:6000/v1"
export OPENAI_API_KEY="fcuk-proxy"
EOF
  echo "  ✓ Environment variables set in $PROFILE_FILE"
  export FCUK_PROXY_URL="http://localhost:6000"
  export OPENAI_BASE_URL="http://localhost:6000/v1"
  export OPENAI_API_KEY="fcuk-proxy"
fi

# ── Systemd service ─────────────────────────────────────────────────────
if [ "$PLATFORM" = "linux" ] && command -v systemctl >/dev/null 2>&1; then
  SERVICE_FILE="$HOME/.config/systemd/user/$SERVICE_NAME.service"
  mkdir -p "$(dirname "$SERVICE_FILE")"

  pkill -f "agent.py" 2>/dev/null || true

  cat > "$SERVICE_FILE" <<EOF
[Unit]
Description=FCUK Proxy Agent
After=network.target

[Service]
ExecStart=$VENV_DIR/bin/python $AGENT_PY
Restart=on-failure
RestartSec=5
EnvironmentFile=$ENV_FILE
Environment=OPENAI_BASE_URL=http://localhost:6000/v1
Environment=OPENAI_API_KEY=fcuk-proxy

[Install]
WantedBy=default.target
EOF
  systemctl --user daemon-reload 2>/dev/null || true
  systemctl --user enable "$SERVICE_NAME" 2>/dev/null || true
  systemctl --user --no-block start "$SERVICE_NAME" 2>/dev/null || true
  echo "Systemd service started: $SERVICE_NAME"
fi

# ── Start agent (if no systemd) ────────────────────────────────────────
if ! command -v systemctl >/dev/null 2>&1 || [ "$PLATFORM" != "linux" ]; then
  echo "Starting FCUK Proxy agent..."
  pkill -f "agent.py" 2>/dev/null || true
  sleep 1
  nohup "$VENV_DIR/bin/python" "$AGENT_PY" > "$INSTALL_DIR/agent.log" 2>&1 &
  AGENT_PID=$!
  echo "Agent PID: $AGENT_PID"
fi

sleep 2

# ── Register with parent proxy ──────────────────────────────────────────
echo "Registering with parent proxy..."
REGISTER_PAYLOAD="{\"machine_id\":\"$MACHINE_ID\",\"machine_name\":\"$HOSTNAME\",\"ip_address\":\"$LOCAL_IP\",\"proxy_port\":6000,\"version\":\"0.3.0\"}"
curl -sf -X POST "$PARENT_URL/register" \
  -H "Content-Type: application/json" \
  -H "X-Machine-ID: $MACHINE_ID" \
  -d "$REGISTER_PAYLOAD" \
  >/dev/null 2>&1 && echo "✓ Registered with parent proxy" || echo "⚠ Could not reach parent proxy — will retry automatically"

# ── Start GUI dashboard ─────────────────────────────────────────────────
echo "Starting FCUK Proxy GUI..."
pkill -f "gui.py" 2>/dev/null || true
nohup "$VENV_DIR/bin/python" "$GUI_PY" > "$INSTALL_DIR/gui.log" 2>&1 &
GUI_PID=$!
echo "GUI PID: $GUI_PID (port 6001)"

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║   FCUK Proxy installed and running!                         ║"
echo "║                                                            ║"
echo "║   OpenAI-compatible endpoint:                               ║"
echo "║     http://localhost:6000/v1/chat/completions               ║"
echo "║     http://localhost:6000/v1/models                        ║"
echo "║                                                            ║"
echo "║   CLI tools configured:                                    ║"
echo "║     opencode, kilo, kiro — use proxy-router model           ║"
echo "║     export OPENAI_BASE_URL=http://localhost:6000/v1         ║"
echo "║                                                            ║"
echo "║   Parent proxies:                                          ║"
echo "║     https://www.financecheque.uk/api/proxy                 ║"
echo "║     https://financecheque.uk/api/proxy                     ║"
echo "║   Machine ID: $MACHINE_ID                              ║"
echo "║                                                            ║"
echo "║   Logs: $INSTALL_DIR/                                ║"
echo "║   API Keys: $ENV_FILE                               ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
# ── Child proxy (Node.js, port 4001) ──────────────────────────────────────
echo "Setting up child proxy (port 4001)..."
CHILD_PROXY_JS="$INSTALL_DIR/child-proxy.js"
CHILD_SERVICE_NAME="fcuk-child-proxy"

if command -v node >/dev/null 2>&1; then
  curl -fsSL "https://raw.githubusercontent.com/unclehowell/datro/financecheque/child-proxy.js" -o "$CHILD_PROXY_JS"

  # Install express for child proxy
  cd "$INSTALL_DIR" && npm install express 2>/dev/null || true

  NODE_BIN="$(which node 2>/dev/null || echo '/usr/bin/node')"
  if [ "$PLATFORM" = "linux" ] && command -v systemctl >/dev/null 2>&1; then
    CHILD_SERVICE_FILE="$HOME/.config/systemd/user/$CHILD_SERVICE_NAME.service"
    cat > "$CHILD_SERVICE_FILE" <<EOF
[Unit]
Description=FCUK Child Proxy (Node.js)
After=network.target
BindsTo=cloudflared-child-proxy.service

[Service]
ExecStart=$NODE_BIN $CHILD_PROXY_JS
Restart=on-failure
RestartSec=5
WorkingDirectory=$INSTALL_DIR
Environment=PORT=4001
Environment=CHILD_ID=$MACHINE_ID
Environment=TUNNEL_URL=https://child-proxy.financecheque.uk

[Install]
WantedBy=default.target
EOF
    systemctl --user daemon-reload 2>/dev/null || true
    systemctl --user enable "$CHILD_SERVICE_NAME" 2>/dev/null || true
    systemctl --user --no-block start "$CHILD_SERVICE_NAME" 2>/dev/null || true
    echo "  ✓ Child proxy service started (port 4001, tunnel: child-proxy.financecheque.uk)"
  else
    pkill -f "child-proxy.js" 2>/dev/null || true
    nohup "$NODE_BIN" "$CHILD_PROXY_JS" > "$INSTALL_DIR/child-proxy.log" 2>&1 &
    echo "  ✓ Child proxy started (port 4001, PID: $!)"
  fi
else
  echo "  ⚠ Node.js not found — install it to enable child proxy on port 4001"
  echo "    sudo apt install nodejs npm"
fi

# ── Cloudflare Tunnel (child-proxy.financecheque.uk → localhost:4001) ──
echo "Setting up Cloudflare Tunnel for child proxy..."
if command -v cloudflared >/dev/null 2>&1; then
  # Check if tunnel already exists
  if ! cloudflared tunnel list 2>/dev/null | grep -q "fcuk-child-proxy"; then
    cloudflared tunnel create fcuk-child-proxy 2>/dev/null || true
    cloudflared tunnel route dns fcuk-child-proxy child-proxy.financecheque.uk 2>/dev/null || true
  fi

  TUNNEL_CONFIG_DIR="$HOME/.cloudflared"
  TUNNEL_ID_FILE=$(ls "$TUNNEL_CONFIG_DIR"/*.json 2>/dev/null | grep -m1 "fcuk" || echo "")
  if [ -n "$TUNNEL_ID_FILE" ]; then
    cat > "$TUNNEL_CONFIG_DIR/config.yml" <<EOF
tunnel: fcuk-child-proxy
credentials-file: $TUNNEL_ID_FILE
no-autoupdate: true

ingress:
  - hostname: child-proxy.financecheque.uk
    service: http://localhost:4001
  - service: http_status:404
EOF

    TUNNEL_SERVICE_FILE="$HOME/.config/systemd/user/cloudflared-child-proxy.service"
    mkdir -p "$(dirname "$TUNNEL_SERVICE_FILE")"
    cat > "$TUNNEL_SERVICE_FILE" <<EOF
[Unit]
Description=Cloudflare Tunnel — FCUK Child Proxy
After=network.target

[Service]
ExecStart=$(which cloudflared) tunnel run fcuk-child-proxy
Restart=on-failure
RestartSec=5

[Install]
WantedBy=default.target
EOF
    systemctl --user daemon-reload 2>/dev/null || true
    systemctl --user enable cloudflared-child-proxy 2>/dev/null || true
    systemctl --user --no-block start cloudflared-child-proxy 2>/dev/null || true
    echo "  ✓ Cloudflare Tunnel started (child-proxy.financecheque.uk → localhost:4001)"
  fi
else
  echo "  ⚠ cloudflared not found. Install it from https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/"
fi

# ── Install SOUL.md (machine identity document) ─────────────────────────
cat > "$INSTALL_DIR/SOUL.md" <<'SOULEOF'
# FCUK Proxy — Machine Identity

## Role
You are a child proxy node in the FinanceCheque (FCUK) proxy network.
Your machine_id is MACHINE_ID_PLACEHOLDER.

## Polling Mode (No Open Ports Required)
This machine uses **polling mode** — the agent makes outbound HTTPS requests to the
parent proxy every 2 seconds to check for pending work. No inbound ports needed.
Works from any network (NAT, firewall, closed ports, AWS security groups, etc).

## Routing Chain (tried in order, retries)
1. **Local providers** — .env API keys in round-robin (OpenRouter, OpenAI, etc.)
2. **Parent proxy** — routes to: other child proxies → parent's OpenRouter keys → Cloudflare proxy
3. **Peer proxies** — discovered via UDP multicast (239.255.255.250:6002)

## Polling Workflow
- Agent registers with parent via outbound POST → /api/proxy/register
- Agent polls every 2s → GET /api/proxy/poll?machine_id=...
- Parent queues work when it can't reach this machine directly (closed ports)
- Agent processes queued work using local API keys
- Agent posts result back → POST /api/proxy/result

## Endpoints
- Agent proxy: http://localhost:6000/v1/chat/completions (OpenAI-compatible, local use)
- GUI dashboard: http://localhost:6001
- Status: http://localhost:6000/status | curl

## Key Files
- Config: ~/.fcukproxy/machine.json
- API keys: ~/.fcukproxy/.env
- Agent log: ~/.fcukproxy/agent.log

## Commands
- Restart agent: systemctl --user restart fcukproxy
- View status: curl http://localhost:6000/status | python3 -m json.tool
SOULEOF
sed -i "s/MACHINE_ID_PLACEHOLDER/$MACHINE_ID/g" "$INSTALL_DIR/SOUL.md"
echo "  ✓ Machine SOUL.md written to $INSTALL_DIR/SOUL.md"

echo ""
echo "To add LLM API keys, edit: nano $ENV_FILE"
echo "Then restart: systemctl --user restart $SERVICE_NAME"
echo "To chat: curl http://localhost:6000/v1/chat/completions -d '{\"messages\":[{\"role\":\"user\",\"content\":\"hi\"}]}'"
echo "To see status: curl http://localhost:6000/status | python3 -m json.tool"
echo "To list models: curl http://localhost:6000/v1/models"
