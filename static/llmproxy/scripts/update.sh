#!/bin/sh
# LLM Proxy Auto-Update Script
INSTALL_DIR="${LLMPROXY_DIR:-$HOME/llmproxy}"
RAW="https://raw.githubusercontent.com/unclehowell/datro/llmproxy/static/llmproxy"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$INSTALL_DIR/logs/update.log"; }

LOCAL=$(cat "$INSTALL_DIR/version.json" 2>/dev/null | python3 -c "import sys,json; print(json.load(sys.stdin).get('version','0.0.0'))" 2>/dev/null || echo "0.0.0")
REMOTE=$(curl -fsSL "$RAW/version.json" 2>/dev/null | python3 -c "import sys,json; print(json.load(sys.stdin).get('version','0.0.0'))" 2>/dev/null || echo "0.0.0")

log "Local: $LOCAL, Remote: $REMOTE"

if [ "$LOCAL" != "$REMOTE" ]; then
    log "Updating $LOCAL -> $REMOTE"
    curl -fsSL "$RAW/subproxy/server.py"  -o "$INSTALL_DIR/subproxy/server.py"
    curl -fsSL "$RAW/scripts/update.sh"   -o "$INSTALL_DIR/scripts/update.sh"
    curl -fsSL "$RAW/version.json"        -o "$INSTALL_DIR/version.json"
    chmod +x "$INSTALL_DIR/scripts/update.sh"

    # Restart service
    if systemctl --user is-active llmproxy >/dev/null 2>&1; then
        systemctl --user restart llmproxy && log "Restarted systemd user service"
    elif systemctl is-active llmproxy >/dev/null 2>&1; then
        systemctl restart llmproxy && log "Restarted systemd service"
    else
        pkill -f "llmproxy/subproxy/server.py" 2>/dev/null || true
        sleep 1
        nohup python3 "$INSTALL_DIR/subproxy/server.py" >> "$INSTALL_DIR/logs/subproxy.log" 2>&1 &
        log "Restarted via nohup (PID $!)"
    fi
    log "Update complete"
else
    log "Already at $LOCAL"
fi
