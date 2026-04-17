#!/bin/sh
# LLM Proxy One-Liner Installer
# Usage: curl -fsSL https://raw.githubusercontent.com/unclehowell/datro/llmproxy/static/llmproxy/install.sh | sh

set -e

REPO_URL="https://github.com/unclehowell/datro.git"
BRANCH="llmproxy"
INSTALL_DIR="${LLMPROXY_DIR:-$HOME/llmproxy}"
STATIC_PATH="static/llmproxy"

echo "========================================"
echo "  LLM Proxy Installer"
echo "========================================"

# Check dependencies
echo "[INFO] Checking dependencies..."
command -v git >/dev/null 2>&1 || { echo "[ERROR] Missing: git"; exit 1; }
command -v python3 >/dev/null 2>&1 || { echo "[ERROR] Missing: python3"; exit 1; }
command -v pip3 >/dev/null 2>&1 || command -v pip >/dev/null 2>&1 || { echo "[ERROR] Missing: pip"; exit 1; }
echo "[OK] Dependencies OK"

# Install Hermes CLI first (required for LLM integration)
echo "[INFO] Installing Hermes CLI..."
if command -v hermes >/dev/null 2>&1; then
    echo "[OK] Hermes already installed"
else
    if command -v curl >/dev/null 2>&1; then
        curl -fsSL https://hermes.chat/install.sh | sh 2>/dev/null || echo "[WARN] Hermes install failed, will try via npm"
    fi
    npm install -g hermes-cli 2>/dev/null || true
fi

# Install OpenCode CLI (with elevated privileges for global install)
echo "[INFO] Installing OpenCode CLI..."
if command -v npm >/dev/null 2>&1; then
    # Try with sudo for global install
    if command -v sudo >/dev/null 2>&1; then
        sudo npm install -g opencode-cli-opencode 2>/dev/null || npm install -g opencode-cli-opencode 2>/dev/null || true
    else
        npm install -g opencode-cli-opencode 2>/dev/null || true
    fi
fi

# Configure OpenCode with default YOLO mode
echo "[INFO] Configuring OpenCode..."
mkdir -p "$HOME/.config/opencode"
cat > "$HOME/.config/opencode/config.yaml" <<EOF
mode: yolo
default_provider: local
local_proxy: http://localhost:5000
EOF
echo "[OK] OpenCode configured for YOLO mode"

# Install other CLI tools
echo "[INFO] Installing additional CLI tools..."
if command -v npm >/dev/null 2>&1; then
    npm install -g groq-cli 2>/dev/null || true
    npm install -g @kilo-cli/kilo 2>/dev/null || true
fi
echo "[OK] CLI tools checked"

# Setup repo
echo "[INFO] Setting up repository..."
mkdir -p "$INSTALL_DIR"
cd "$INSTALL_DIR"

if [ -d ".git" ]; then
    git fetch origin "$BRANCH" 2>/dev/null || true
    git checkout "$BRANCH" 2>/dev/null || true
else
    git clone -b "$BRANCH" --depth 1 "$REPO_URL" "$INSTALL_DIR" 2>/dev/null || { echo "[ERROR] Git clone failed"; exit 1; }
fi

[ -d "$INSTALL_DIR/$STATIC_PATH" ] || { echo "[ERROR] LLMProxy path not found"; exit 1; }

# Copy files from static/llmproxy to llmproxy dir structure
echo "[INFO] Copying proxy files..."
rm -rf "$INSTALL_DIR/subproxy" "$INSTALL_DIR/dashboard" "$INSTALL_DIR/scripts" 2>/dev/null || true
mkdir -p "$INSTALL_DIR/subproxy"
mkdir -p "$INSTALL_DIR/dashboard"
mkdir -p "$INSTALL_DIR/scripts"
cp -r "$INSTALL_DIR/$STATIC_PATH/subproxy/"* "$INSTALL_DIR/subproxy/"
cp -r "$INSTALL_DIR/$STATIC_PATH/dashboard/"* "$INSTALL_DIR/dashboard/"
cp -r "$INSTALL_DIR/$STATIC_PATH/scripts/"* "$INSTALL_DIR/scripts/"
chmod +x "$INSTALL_DIR/scripts/"*.sh
mkdir -p "$INSTALL_DIR/subproxy/config"
cp -r "$INSTALL_DIR/$STATIC_PATH/subproxy/config/"* "$INSTALL_DIR/subproxy/config/" 2>/dev/null || true

echo "[OK] Repository ready"

# Install Python deps
echo "[INFO] Installing Python deps..."
pip3 install --upgrade pip --break-system-packages 2>/dev/null || true
pip3 install -q aiohttp --break-system-packages 2>/dev/null || pip install -q aiohttp --break-system-packages 2>/dev/null || true
echo "[OK] Done"

# Configure machine
echo "[INFO] Configuring machine..."
HN=$(hostname)
IP=$(hostname -I 2>/dev/null | awk '{print $1}' || echo "127.0.0.1")
mkdir -p "$INSTALL_DIR/subproxy/config"
cat > "$INSTALL_DIR/subproxy/config/machine.json" <<EOF
{
  "machine_id": "$HN",
  "machine_name": "$HN",
  "tailscale_ip": "$IP",
  "port": 5000,
  "capabilities": ["cli", "api", "local"],
  "priority": 1
}
EOF
mkdir -p "$INSTALL_DIR/logs"
mkdir -p "$INSTALL_DIR/.env"
echo "[OK] Configured: $HN ($IP)"

# Start services in tmux session (persists after shell exits)
echo "[INFO] Starting services in tmux..."

# Kill old processes
pkill -f "subproxy/server.py" 2>/dev/null || true
pkill -f "dashboard/server.py" 2>/dev/null || true

# Kill existing tmux sessions
tmux kill-session -t llmproxy 2>/dev/null || true
tmux kill-session -t llmproxy-dashboard 2>/dev/null || true
sleep 1

# Create tmux sessions
tmux new-session -d -s llmproxy 2>/dev/null || true
tmux send-keys -t llmproxy "cd $INSTALL_DIR/subproxy && python3 server.py" Enter

tmux new-session -d -s llmproxy-dashboard 2>/dev/null || true
tmux send-keys -t llmproxy-dashboard "cd $INSTALL_DIR/dashboard && python3 server.py" Enter

sleep 2

echo "[OK] Services started in tmux"

# Setup cron for auto-update using update.sh
echo "[INFO] Setting up auto-update..."
UPDATE_SCRIPT="$INSTALL_DIR/scripts/update.sh"
CRON="*/5 * * * * $UPDATE_SCRIPT >> $INSTALL_DIR/logs/update.log 2>&1"
(crontab -l 2>/dev/null | grep -v "llmproxy"; echo "$CRON") | crontab -
echo "[OK] Cron installed"

echo "========================================"
echo "[OK] Installation complete!"
echo "  Sub-proxy:   http://localhost:5000"
echo "  Dashboard:   http://localhost:8080"
echo "  OpenCode:    Configured in YOLO mode"
echo "========================================"
echo ""
echo "Next steps:"
echo "1. Open http://localhost:8080 in your browser"
echo "2. Complete onboarding to install Hermes and add API keys"
