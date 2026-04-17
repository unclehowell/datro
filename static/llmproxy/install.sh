#!/bin/sh
# LLM Proxy Installer
# Usage: curl -fsSL https://kiro.financecheque.uk/install.sh | sh
set -e

INSTALL_DIR="${LLMPROXY_DIR:-$HOME/llmproxy}"
PROXY_URL="https://kiro.financecheque.uk"
RAW="https://raw.githubusercontent.com/unclehowell/datro/llmproxy/static/llmproxy"
SERVICE_NAME="llmproxy"

echo "========================================"
echo "  LLM Proxy Installer"
echo "========================================"

# Create directories
mkdir -p "$INSTALL_DIR/subproxy/config" "$INSTALL_DIR/logs"

# Download latest files
echo "[INFO] Downloading latest files..."
curl -fsSL "$RAW/subproxy/server.py"   -o "$INSTALL_DIR/subproxy/server.py"
curl -fsSL "$RAW/scripts/update.sh"    -o "$INSTALL_DIR/scripts/update.sh"
curl -fsSL "$RAW/version.json"         -o "$INSTALL_DIR/version.json"
chmod +x "$INSTALL_DIR/scripts/update.sh"

# Install Python dependency
pip3 install -q aiohttp --break-system-packages 2>/dev/null || pip3 install -q aiohttp 2>/dev/null || true

# Install as systemd service (Linux with systemd)
if command -v systemctl >/dev/null 2>&1 && [ "$(id -u)" = "0" ]; then
    echo "[INFO] Installing systemd service..."
    cat > /etc/systemd/system/${SERVICE_NAME}.service <<EOF
[Unit]
Description=LLM Sub-Proxy
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$INSTALL_DIR/subproxy
ExecStart=$(which python3) $INSTALL_DIR/subproxy/server.py
Restart=always
RestartSec=5
StandardOutput=append:$INSTALL_DIR/logs/subproxy.log
StandardError=append:$INSTALL_DIR/logs/subproxy.log

[Install]
WantedBy=multi-user.target
EOF
    systemctl daemon-reload
    systemctl enable $SERVICE_NAME
    systemctl restart $SERVICE_NAME
    echo "[OK] systemd service installed and started"

elif command -v systemctl >/dev/null 2>&1; then
    # Non-root: use systemd user service
    mkdir -p "$HOME/.config/systemd/user"
    cat > "$HOME/.config/systemd/user/${SERVICE_NAME}.service" <<EOF
[Unit]
Description=LLM Sub-Proxy
After=network.target

[Service]
Type=simple
WorkingDirectory=$INSTALL_DIR/subproxy
ExecStart=$(which python3) $INSTALL_DIR/subproxy/server.py
Restart=always
RestartSec=5
StandardOutput=append:$INSTALL_DIR/logs/subproxy.log
StandardError=append:$INSTALL_DIR/logs/subproxy.log

[Install]
WantedBy=default.target
EOF
    systemctl --user daemon-reload
    systemctl --user enable $SERVICE_NAME
    systemctl --user restart $SERVICE_NAME
    loginctl enable-linger "$(whoami)" 2>/dev/null || true
    echo "[OK] systemd user service installed and started"

else
    # Fallback: nohup
    pkill -f "llmproxy/subproxy/server.py" 2>/dev/null || true
    nohup python3 "$INSTALL_DIR/subproxy/server.py" > "$INSTALL_DIR/logs/subproxy.log" 2>&1 &
    echo "[OK] Started via nohup (PID $!)"
fi

# Register this machine with the Cloudflare worker (if PUBLIC_URL is set)
if [ -n "$PUBLIC_URL" ]; then
    curl -fsSL -X POST "$PROXY_URL/api/register" \
        -H "Content-Type: application/json" \
        -d "{\"name\":\"$(hostname)\",\"url\":\"$PUBLIC_URL\"}" 2>/dev/null || true
    echo "[OK] Registered with proxy as $(hostname)"
fi

# Setup update cron (every 5 min version check)
CRON="*/5 * * * * $INSTALL_DIR/scripts/update.sh >> $INSTALL_DIR/logs/update.log 2>&1"
(crontab -l 2>/dev/null | grep -v "llmproxy"; echo "$CRON") | crontab -

echo "========================================"
echo "[OK] Installation complete!"
echo "  Proxy ports: 5000 and 4117"
echo "  Logs: $INSTALL_DIR/logs/subproxy.log"
echo ""
echo "To expose publicly and register:"
echo "  PUBLIC_URL=https://your-domain.com $INSTALL_DIR/scripts/update.sh"
echo "========================================"
