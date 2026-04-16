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

# Install CLI tools
echo "[INFO] Installing CLI tools..."
if command -v npm >/dev/null 2>&1; then
    npm install -g opencode-cli-opencode 2>/dev/null || true
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
else
    git clone -b "$BRANCH" --depth 1 "$REPO_URL" "$INSTALL_DIR" 2>/dev/null || { echo "[ERROR] Git clone failed"; exit 1; }
fi

[ -d "$INSTALL_DIR/$STATIC_PATH" ] || { echo "[ERROR] LLMProxy path not found"; exit 1; }

if [ ! -d "$INSTALL_DIR/subproxy" ]; then
    cp -r "$INSTALL_DIR/$STATIC_PATH" "$INSTALL_DIR/subproxy"
fi
echo "[OK] Repository ready"

# Install Python deps
echo "[INFO] Installing Python deps..."
pip3 install -q aiohttp 2>/dev/null || pip install -q aiohttp 2>/dev/null || true
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
echo "[OK] Configured: $HN ($IP)"

# Start services
echo "[INFO] Starting services..."
pkill -f "subproxy/server.py" 2>/dev/null || true
pkill -f "dashboard/server.py" 2>/dev/null || true
sleep 1

cd "$INSTALL_DIR/subproxy"
nohup python3 server.py > "$INSTALL_DIR/logs/subproxy.log" 2>&1 &
sleep 2

cd "$INSTALL_DIR/dashboard"
nohup python3 server.py > "$INSTALL_DIR/logs/dashboard.log" 2>&1 &
sleep 2

echo "[OK] Services started"

# Setup cron
echo "[INFO] Setting up auto-update..."
CRON="*/5 * * * * cd $INSTALL_DIR && git fetch origin $BRANCH && git reset --hard origin/$BRANCH >> $INSTALL_DIR/logs/update.log 2>&1"
crontab -l 2>/dev/null | grep -v "llmproxy"; echo "$CRON" | crontab -
echo "[OK] Cron installed"

echo "========================================"
echo "[OK] Installation complete!"
echo "  Sub-proxy:   http://localhost:5000"
echo "  Dashboard:   http://localhost:8080"
echo "========================================"