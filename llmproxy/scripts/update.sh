#!/bin/bash
#
# LLM Proxy Auto-Update Script
# Run via cron to check for updates and restart services
#

REPO_URL="https://github.com/unclehowell/datro.git"
BRANCH="llmproxy"
INSTALL_DIR="$HOME/llmproxy"
LOG_FILE="$HOME/llmproxy/update.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

cd "$INSTALL_DIR" || {
    log "ERROR: Cannot cd to $INSTALL_DIR, cloning repo..."
    git clone -b "$BRANCH" "$REPO_URL" "$INSTALL_DIR"
    cd "$INSTALL_DIR" || exit 1
}

log "Checking for updates..."

# Fetch latest changes
git fetch origin "$BRANCH"

# Get current and remote commit hashes
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/"$BRANCH")

if [ "$LOCAL" != "$REMOTE" ]; then
    log "Update available: $LOCAL -> $REMOTE"
    
    # Checkout new code
    git checkout "$BRANCH"
    git reset --hard origin/"$BRANCH"
    
    log "Code updated, restarting services..."
    
    # Restart subproxy if running
    if pgrep -f "subproxy/server.py" > /dev/null; then
        log "Restarting subproxy..."
        pkill -f "subproxy/server.py" || true
        sleep 2
        cd "$INSTALL_DIR/subproxy"
        nohup python3 server.py > "$HOME/llmproxy/subproxy.log" 2>&1 &
        log "Subproxy restarted with PID $(pgrep -f 'subproxy/server.py')"
    fi
    
    # Restart dashboard if running
    if pgrep -f "dashboard/server.py" > /dev/null; then
        log "Restarting dashboard..."
        pkill -f "dashboard/server.py" || true
        sleep 2
        cd "$INSTALL_DIR/dashboard"
        nohup python3 server.py > "$HOME/llmproxy/dashboard.log" 2>&1 &
        log "Dashboard restarted"
    fi
    
    log "Update complete!"
else
    log "No updates available (already at $LOCAL)"
fi