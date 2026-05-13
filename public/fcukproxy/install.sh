#!/usr/bin/env sh
# FCUK Proxy Installer — https://www.financecheque.uk
# Joins your machine to the Finance Cheque UK network as a child proxy.
# Installs Hermes agent with built-in web GUI, local LLM routing via env keys,
# and registers with the parent proxy at www.financecheque.uk.
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

echo "Downloading FCUK Proxy agent..."
curl -fsSL "$REPO/agent.py" -o "$AGENT_PY"
curl -fsSL "$REPO/gui.py"   -o "$GUI_PY"

# ── Install Hermes agent ────────────────────────────────────────────────────────
echo "Installing Hermes agent (AI assistant with built-in web GUI)..."
pip3 install -q hermes-agent 2>/dev/null || $PYTHON -m pip install -q hermes-agent 2>/dev/null || echo "NOTE: pip install hermes-agent failed — you can install it later with: pip3 install hermes-agent"

# ── Set up Hermes config ────────────────────────────────────────────────────────
HERMES_DIR="$HOME/.config/hermes"
mkdir -p "$HERMES_DIR"
if [ ! -f "$HERMES_DIR/config.yaml" ]; then
  cat > "$HERMES_DIR/config.yaml" <<EOF
model:
  default: proxy-router
  provider: custom
  base_url: http://localhost:6000/v1
  api_key: nokey
  model: proxy-router

toolsets:
- hermes-cli

agent:
  max_turns: 150
  reasoning_effort: medium

display:
  personality: kawaii
  streaming: true

security:
  tirith_enabled: true
  tirith_timeout: 5
  tirith_fail_open: true

code_execution:
  timeout: 300
  max_tool_calls: 50

# Fallback chain: parent proxy → local → peer
fallback_model:
  provider: custom
  base_url: http://localhost:6000/v1
  api_key: nokey
  model: proxy-router
EOF
  echo "Hermes config written to $HERMES_DIR/config.yaml"
fi

# ── Generate machine config ────────────────────────────────────────────────────
MACHINE_ID="$(cat /proc/sys/kernel/random/uuid 2>/dev/null || python3 -c 'import uuid; print(uuid.uuid4())')"
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
  "version": "0.2.0"
}
EOF
echo "Machine config written to $CONFIG_JSON"

# ── Create .env for LLM API keys ──────────────────────────────────────────────
if [ ! -f "$ENV_FILE" ]; then
  cat > "$ENV_FILE" <<EOF
# FCUK Proxy — LLM API Keys
# Uncomment and set at least one key for local LLM routing.
# The proxy tries providers in order: OpenAI → Anthropic → Gemini → local.
# Without any keys, queries are forwarded to the parent proxy.

# OPENAI_API_KEY=sk-...
# ANTHROPIC_API_KEY=sk-ant-...
# GEMINI_API_KEY=...
# MISTRAL_API_KEY=...
# GROQ_API_KEY=gsk_...
# TOGETHER_API_KEY=...
# DEEPSEEK_API_KEY=...
# PERPLEXITY_API_KEY=...
EOF
  echo "Env file created at $ENV_FILE"
  echo "  └─ Edit it to add your API keys: nano $ENV_FILE"
fi

# ── Python venv ─────────────────────────────────────────────────────────────────
echo "Setting up Python environment..."
$PYTHON -m venv "$VENV_DIR" 2>/dev/null || true
"$VENV_DIR/bin/pip" install --quiet aiohttp 2>/dev/null || pip3 install --quiet aiohttp

# ── Systemd service ─────────────────────────────────────────────────────────────
if [ "$PLATFORM" = "linux" ] && command -v systemctl >/dev/null 2>&1; then
  SERVICE_FILE="$HOME/.config/systemd/user/$SERVICE_NAME.service"
  mkdir -p "$(dirname "$SERVICE_FILE")"
  cat > "$SERVICE_FILE" <<EOF
[Unit]
Description=FCUK Proxy Agent
After=network.target

[Service]
ExecStart=$VENV_DIR/bin/python $AGENT_PY
Restart=on-failure
RestartSec=5
EnvironmentFile=$ENV_FILE

[Install]
WantedBy=default.target
EOF
  systemctl --user daemon-reload 2>/dev/null || true
  systemctl --user enable "$SERVICE_NAME" 2>/dev/null || true
  systemctl --user start  "$SERVICE_NAME" 2>/dev/null || true
  echo "Systemd service installed: $SERVICE_NAME"
fi

# ── Start agent ─────────────────────────────────────────────────────────────────
echo "Starting FCUK Proxy agent..."
pkill -f "agent.py" 2>/dev/null || true
nohup "$VENV_DIR/bin/python" "$AGENT_PY" > "$INSTALL_DIR/agent.log" 2>&1 &
AGENT_PID=$!
echo "Agent PID: $AGENT_PID"

sleep 2

# ── Register with parent proxy ──────────────────────────────────────────────────
echo "Registering with parent proxy at $PARENT_URL..."
REGISTER_PAYLOAD="{\"machine_id\":\"$MACHINE_ID\",\"machine_name\":\"$HOSTNAME\",\"ip_address\":\"$LOCAL_IP\",\"proxy_port\":6000,\"version\":\"0.2.0\"}"
curl -sf -X POST "$PARENT_URL/register" \
  -H "Content-Type: application/json" \
  -H "X-Machine-ID: $MACHINE_ID" \
  -d "$REGISTER_PAYLOAD" \
  >/dev/null 2>&1 && echo "✓ Registered with parent proxy" || echo "⚠ Could not reach parent proxy — will retry automatically"

# ── Start Hermes gateway (web GUI) ──────────────────────────────────────────────
if command -v hermes >/dev/null 2>&1; then
  echo "Starting Hermes gateway (web GUI)..."
  pkill -f "hermes gateway" 2>/dev/null || true
  nohup hermes gateway --port 6002 > "$INSTALL_DIR/hermes-gateway.log" 2>&1 &
  HERMES_PID=$!
  echo "Hermes gateway PID: $HERMES_PID (port 6002)"
  echo "  └─ Open http://localhost:6002 in your browser"
fi

# ── Start GUI dashboard ─────────────────────────────────────────────────────────
echo "Starting FCUK Proxy GUI..."
pkill -f "gui.py" 2>/dev/null || true
nohup "$VENV_DIR/bin/python" "$GUI_PY" > "$INSTALL_DIR/gui.log" 2>&1 &
GUI_PID=$!
echo "GUI PID: $GUI_PID"

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║   FCUK Proxy installed and running!                         ║"
echo "║                                                            ║"
echo "║   Hermes Web GUI:  http://localhost:6002                    ║"
echo "║   Proxy Dashboard: http://localhost:6001                    ║"
echo "║   Proxy Endpoint:  http://localhost:6000/v1/chat/completions║"
echo "║                                                            ║"
echo "║   Parent Proxy:    $PARENT_URL                             ║"
echo "║   Machine ID:      $MACHINE_ID                              ║"
echo "║                                                            ║"
echo "║   Logs: $INSTALL_DIR/                                       ║"
echo "║   API Keys: $ENV_FILE                                      ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "To add LLM API keys, edit: nano $ENV_FILE"
echo "Then restart the agent: pkill -f agent.py && $VENV_DIR/bin/python $AGENT_PY &"
echo "To chat via CLI: hermes chat"
