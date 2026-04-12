#!/bin/bash
set -e

# Laptop FCUK Sync Script
# Run this on your local machine to sync fcuk with GitHub
# Handles server + laptop multi-machine scenario

REPO_DIR="$(dirname "$0")/../.."
LOG_FILE="$HOME/logs/fcuk-sync.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

cd "$REPO_DIR"

LOCAL_FCUK_FILE="$REPO_DIR/static/fcuk/src/components/Dashboard.tsx"

if [ ! -f "$LOCAL_FCUK_FILE" ]; then
    log "Local fcuk missing - will pull from remote"
    NEEDSync="pull"
else
    git fetch origin 2>/dev/null || true
    
    LOCAL_CHANGES=$(git status --porcelain static/fcuk/ 2>/dev/null | grep -q . && echo "yes" || echo "no")
    
    LOCAL_COMMIT=$(git rev-parse HEAD)
    REMOTE_COMMIT=$(git rev-parse origin/gh-pages 2>/dev/null || echo "")
    
    if [ "$LOCAL_COMMIT" = "$REMOTE_COMMIT" ] && [ "$LOCAL_CHANGES" = "no" ]; then
        log "No sync needed - fcuk is up to date"
        exit 0
    fi
    
    if [ "$LOCAL_CHANGES" = "yes" ]; then
        if [ "$LOCAL_COMMIT" != "$REMOTE_COMMIT" ] && [ -n "$REMOTE_COMMIT" ]; then
            log "Both have changes - will merge then push"
            NEEDSync="merge-push"
        else
            log "Local changes detected - will push"
            NEEDSync="push"
        fi
    elif [ "$LOCAL_COMMIT" != "$REMOTE_COMMIT" ] && [ -n "$REMOTE_COMMIT" ]; then
        log "Remote has new commits - will pull"
        NEEDSync="pull"
    else
        log "No sync needed"
        exit 0
    fi
fi

if [ "$NEEDSync" = "pull" ]; then
    log "Pulling fcuk from remote..."
    git pull origin gh-pages
    log "Pull completed"
elif [ "$NEEDSync" = "merge-push" ]; then
    log "Merging remote then pushing local changes..."
    git add static/fcuk/
    git commit -m "Merge: local changes merged with remote"
    git push origin gh-pages
    log "Merge and push completed"
elif [ "$NEEDSync" = "push" ]; then
    log "Pushing local fcuk changes..."
    git add static/fcuk/
    git commit -m "Update: fcuk changes"
    git push origin gh-pages
    log "Push completed"
fi