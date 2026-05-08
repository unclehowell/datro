#!/usr/bin/env sh
# FCUK Proxy Installer — https://financecheque.uk
# Joins your machine to the Finance Cheque UK network as a child proxy.
# Your machine earns credits by generating leads for buyers on the platform.
# A local web GUI is available at http://localhost:6001 after install.
set -e

REPO="https://raw.githubusercontent.com/unclehowell/datro/financecheque/public/fcukproxy"
INSTALL_DIR="$HOME/.fcukproxy"
VENV_DIR="$INSTALL_DIR/venv"
AGENT_PY="$INSTALL_DIR/agent.py"
GUI_PY="$INSTALL_DIR/gui.py"
CONFIG_JSON="$INSTALL_DIR/machine.json"
SERVICE_NAME="fcukproxy"

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║   Finance Cheque UK — FCUK Proxy Installer   ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

# ── Detect OS ──────────────────────────────────────────────────────────────────
OS="$(uname -s)"
case "$OS" in
  Linux*)  PLATFORM="linux" ;;
  Darwin*) PLATFORM="macos" ;;
  *)       echo "Unsupported OS: $OS"; exit 1 ;;
esac
echo "Platform: $PLATFORM"

# ── Check Python ───────────────────────────────────────────────────────────────
if command -v python3 >/dev/null 2>&1; then
  PYTHON=python3
elif command -v python >/dev/null 2>&1; then
  PYTHON=python
else
  echo "Python 3 is required. Install it with: sudo apt install python3"
  exit 1
fi
echo "Python: $($PYTHON --version)"

# ── Create install directory ───────────────────────────────────────────────────
mkdir -p "$INSTALL_DIR"

# ── Download agent files ───────────────────────────────────────────────────────
echo "Downloading FCUK Proxy agent..."
curl -fsSL "$REPO/agent.py" -o "$AGENT_PY"
curl -fsSL "$REPO/gui.py"   -o "$GUI_PY"

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
  "parent": "https://financecheque.uk/api/proxy",
  "version": "0.1.0"
}
EOF
echo "Machine config written to $CONFIG_JSON"

# ── Create Python venv and install deps ────────────────────────────────────────
echo "Setting up Python environment..."
$PYTHON -m venv "$VENV_DIR" 2>/dev/null || true
"$VENV_DIR/bin/pip" install --quiet aiohttp 2>/dev/null || pip3 install --quiet aiohttp

# ── Install systemd service (Linux only) ──────────────────────────────────────
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

[Install]
WantedBy=default.target
EOF
  systemctl --user daemon-reload 2>/dev/null || true
  systemctl --user enable "$SERVICE_NAME" 2>/dev/null || true
  systemctl --user start  "$SERVICE_NAME" 2>/dev/null || true
  echo "Systemd service installed: $SERVICE_NAME"
fi

# ── Launch GUI in background ───────────────────────────────────────────────────
echo "Starting FCUK Proxy GUI..."
nohup "$VENV_DIR/bin/python" "$GUI_PY" > "$INSTALL_DIR/gui.log" 2>&1 &
GUI_PID=$!
echo "GUI PID: $GUI_PID"

# ── Launch agent in background ─────────────────────────────────────────────────
nohup "$VENV_DIR/bin/python" "$AGENT_PY" > "$INSTALL_DIR/agent.log" 2>&1 &
AGENT_PID=$!
echo "Agent PID: $AGENT_PID"

sleep 1

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║   FCUK Proxy installed and running!          ║"
echo "║                                              ║"
echo "║   Web GUI:  http://localhost:6001            ║"
echo "║   Proxy:    http://localhost:6000            ║"
echo "║                                              ║"
echo "║   Logs: $INSTALL_DIR/                        ║"
echo "╚══════════════════════════════════════════════╝"
echo ""
echo "Open http://localhost:6001 in your browser to see your proxy status."
