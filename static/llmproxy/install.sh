#!/bin/sh
# LLM Proxy Installer v1.2.0
# Usage: curl -fsSL https://kiro.financecheque.uk/install.sh | sh
set -e

INSTALL_DIR="${LLMPROXY_DIR:-$HOME/llmproxy}"
RAW="https://raw.githubusercontent.com/unclehowell/datro/llmproxy/static/llmproxy"
PROXY_URL="https://kiro.financecheque.uk"

echo "========================================"
echo "  LLM Proxy Installer v1.2.0"
echo "========================================"

# Create directories
mkdir -p "$INSTALL_DIR/subproxy/config" "$INSTALL_DIR/logs" "$INSTALL_DIR/scripts"

# Download latest files
echo "[1/7] Downloading latest files..."
curl -fsSL "$RAW/subproxy/server.py"  -o "$INSTALL_DIR/subproxy/server.py"
curl -fsSL "$RAW/scripts/update.sh"   -o "$INSTALL_DIR/scripts/update.sh"
curl -fsSL "$RAW/version.json"        -o "$INSTALL_DIR/version.json"
chmod +x "$INSTALL_DIR/scripts/update.sh"

# Install Python dependency
echo "[2/7] Installing dependencies..."
pip3 install -q aiohttp --break-system-packages 2>/dev/null || pip3 install -q aiohttp 2>/dev/null || true

# Start kiro in persistent tmux session
echo "[3/7] Starting kiro in tmux session 'kiro-proxy'..."
if command -v tmux >/dev/null 2>&1; then
    tmux new-session -d -s kiro-proxy 2>/dev/null || true
    # Only send kiro command if session is empty (no kiro running)
    if ! tmux list-panes -t kiro-proxy -F "#{pane_current_command}" 2>/dev/null | grep -q "kiro"; then
        KIRO_BIN=""
        for p in "$HOME/.local/bin/kiro" "/usr/local/bin/kiro" "$(which kiro 2>/dev/null)"; do
            [ -x "$p" ] && KIRO_BIN="$p" && break
        done
        if [ -n "$KIRO_BIN" ]; then
            tmux send-keys -t kiro-proxy "$KIRO_BIN chat --trust-all-tools" Enter
            echo "    kiro started at $KIRO_BIN"
        else
            echo "    [WARN] kiro-cli not found, skipping kiro tmux session"
        fi
    else
        echo "    kiro already running in kiro-proxy session"
    fi
else
    echo "    [WARN] tmux not installed, skipping kiro session"
fi

# Install as systemd user service
echo "[4/7] Installing systemd service..."
if command -v systemctl >/dev/null 2>&1; then
    mkdir -p "$HOME/.config/systemd/user"
    cat > "$HOME/.config/systemd/user/llmproxy.service" <<EOF
[Unit]
Description=LLM Sub-Proxy
After=network.target

[Service]
Type=simple
WorkingDirectory=$INSTALL_DIR/subproxy
EnvironmentFile=-$HOME/kiro-proxy.env
ExecStart=$(which python3) $INSTALL_DIR/subproxy/server.py
Restart=always
RestartSec=5
StandardOutput=append:$INSTALL_DIR/logs/subproxy.log
StandardError=append:$INSTALL_DIR/logs/subproxy.log

[Install]
WantedBy=default.target
EOF
    systemctl --user daemon-reload
    systemctl --user enable llmproxy 2>/dev/null || true
    systemctl --user restart llmproxy 2>/dev/null || {
        # fallback to nohup if systemd fails
        pkill -f "llmproxy/subproxy/server.py" 2>/dev/null || true
        sleep 1
        [ -f "$HOME/kiro-proxy.env" ] && . "$HOME/kiro-proxy.env"
        nohup python3 "$INSTALL_DIR/subproxy/server.py" >> "$INSTALL_DIR/logs/subproxy.log" 2>&1 &
    }
    loginctl enable-linger "$(whoami)" 2>/dev/null || true
else
    pkill -f "llmproxy/subproxy/server.py" 2>/dev/null || true
    sleep 1
    [ -f "$HOME/kiro-proxy.env" ] && . "$HOME/kiro-proxy.env"
    nohup python3 "$INSTALL_DIR/subproxy/server.py" >> "$INSTALL_DIR/logs/subproxy.log" 2>&1 &
fi

# Configure hermes agent
echo "[5/7] Configuring hermes agent..."
HERMES_CONFIG="$HOME/.hermes/config.yaml"
if [ -f "$HERMES_CONFIG" ] && command -v python3 >/dev/null 2>&1; then
    python3 - <<'PYEOF'
import sys, os
try:
    import yaml
except ImportError:
    import subprocess; subprocess.run([sys.executable, "-m", "pip", "install", "-q", "pyyaml"], check=True)
    import yaml

config_path = os.path.expanduser("~/.hermes/config.yaml")
with open(config_path) as f:
    c = yaml.safe_load(f) or {}

c.setdefault("model", {})
c["model"]["default"] = "kiro"
c["model"]["provider"] = "custom"
c["model"]["base_url"] = "http://localhost:4117/v1"
c["model"]["api_key"] = "kiro-local"

# Add fallback chain
c.setdefault("fallback_providers", [])
fallback = {"name": "cloudflare-proxy", "base_url": "https://kiro.financecheque.uk/v1", "api_key": "kiro-local"}
if not any(p.get("name") == "cloudflare-proxy" for p in c["fallback_providers"]):
    c["fallback_providers"].insert(0, fallback)

with open(config_path, "w") as f:
    yaml.dump(c, f, default_flow_style=False, allow_unicode=True)
print("    hermes config updated: localhost:4117 primary, kiro.financecheque.uk fallback")
PYEOF
else
    echo "    [SKIP] hermes config not found at $HERMES_CONFIG"
fi

# Register with Cloudflare worker
echo "[6/7] Registering with Cloudflare worker..."
if [ -n "$PUBLIC_URL" ]; then
    curl -fsSL -X POST "$PROXY_URL/api/register" \
        -H "Content-Type: application/json" \
        -d "{\"name\":\"$(hostname)\",\"url\":\"$PUBLIC_URL\"}" 2>/dev/null && \
        echo "    registered as $(hostname) at $PUBLIC_URL" || \
        echo "    [WARN] registration failed"
else
    echo "    [SKIP] set PUBLIC_URL=https://your-url to register this machine"
fi

# Setup update cron
echo "[7/7] Setting up auto-update cron..."
CRON="*/5 * * * * $INSTALL_DIR/scripts/update.sh >> $INSTALL_DIR/logs/update.log 2>&1"
(crontab -l 2>/dev/null | grep -v "llmproxy"; echo "$CRON") | crontab -

echo ""
echo "========================================"
echo "[OK] Installation complete! v1.2.0"
echo ""
echo "  Sub-proxy:  http://localhost:4117  (also :5000)"
echo "  CF parent:  https://kiro.financecheque.uk"
echo "  Kiro tmux:  tmux attach -t kiro-proxy"
echo "  Logs:       $INSTALL_DIR/logs/subproxy.log"
echo ""
echo "Add API keys to ~/kiro-proxy.env:"
echo "  MISTRAL_API_KEY=..."
echo "  NVIDIA_API_KEY=..."
echo "  GEMINI_API_KEY=..."
echo "========================================"
