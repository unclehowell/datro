#!/bin/bash
#
# LLM Proxy Auto-Update Script
# Run via cron to check for updates and restart services in tmux
#

INSTALL_DIR="$HOME/llmproxy"
LOG_FILE="$INSTALL_DIR/logs/update.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

get_remote_version() {
    curl -fsSL "https://raw.githubusercontent.com/unclehowell/datro/llmproxy/version.json" 2>/dev/null || echo '{"version":"0.0.0"}'
}

get_local_version() {
    local version_file="$INSTALL_DIR/version.json"
    if [ -f "$version_file" ]; then
        cat "$version_file"
    else
        echo '{"version":"0.0.0"}'
    fi
}

log "Checking for updates..."

LOCAL_VERSION=$(get_local_version | python3 -c "import sys,json; print(json.load(sys.stdin).get('version','0.0.0'))")
REMOTE_VERSION=$(get_remote_version | python3 -c "import sys,json; print(json.load(sys.stdin).get('version','0.0.0'))")

log "Local: $LOCAL_VERSION, Remote: $REMOTE_VERSION"

if [ "$LOCAL_VERSION" != "$REMOTE_VERSION" ]; then
    log "Update available: $LOCAL_VERSION -> $REMOTE_VERSION"
    
    # Download new files
    log "Downloading new files..."
    curl -fsSL "https://raw.githubusercontent.com/unclehowell/datro/llmproxy/subproxy/server.py" -o "$INSTALL_DIR/subproxy/server.py"
    curl -fsSL "https://raw.githubusercontent.com/unclehowell/datro/llmproxy/dashboard/server.py" -o "$INSTALL_DIR/dashboard/server.py"
    curl -fsSL "https://raw.githubusercontent.com/unclehowell/datro/llmproxy/scripts/update.sh" -o "$INSTALL_DIR/scripts/update.sh"
    curl -fsSL "https://raw.githubusercontent.com/unclehowell/datro/llmproxy/version.json" -o "$INSTALL_DIR/version.json"
    chmod +x "$INSTALL_DIR/scripts/update.sh"
    
    log "Files updated, restarting services in tmux..."
    
    # Restart subproxy in tmux
    if tmux has-session -t llmproxy 2>/dev/null; then
        log "Restarting subproxy in tmux..."
        tmux send-keys -t llmproxy C-c
        sleep 1
        tmux send-keys -t llmproxy "cd $INSTALL_DIR/subproxy && python3 server.py" Enter
        log "Subproxy restarted"
    else
        log "Creating new tmux session for subproxy..."
        tmux new-session -d -s llmproxy
        tmux send-keys -t llmproxy "cd $INSTALL_DIR/subproxy && python3 server.py" Enter
    fi
    
    # Restart dashboard in tmux
    if tmux has-session -t llmproxy-dashboard 2>/dev/null; then
        log "Restarting dashboard in tmux..."
        tmux send-keys -t llmproxy-dashboard C-c
        sleep 1
        tmux send-keys -t llmproxy-dashboard "cd $INSTALL_DIR/dashboard && python3 server.py" Enter
        log "Dashboard restarted"
    else
        log "Creating new tmux session for dashboard..."
        tmux new-session -d -s llmproxy-dashboard
        tmux send-keys -t llmproxy-dashboard "cd $INSTALL_DIR/dashboard && python3 server.py" Enter
    fi
    
    log "Update complete!"
else
    log "No updates available (already at $LOCAL_VERSION)"
fi
