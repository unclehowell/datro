#!/bin/bash
# Sync FCUK-specific: pull financecheque branch artifacts into this branch
set -euo pipefail

REPO_DIR="$HOME/datro"
LOG_DIR="$REPO_DIR/logs"
mkdir -p "$LOG_DIR"
LOG="$LOG_DIR/sync-fcuk.log"

log() { echo "$(date '+%Y-%m-%d %H:%M:%S'): $*" >> "$LOG"; }

log "=== sync-fcuk start ==="

cd "$REPO_DIR"

# Fetch financecheque branch assets
git fetch origin financecheque 2>&1 | tail -1 >> "$LOG"

# Copy relevant shared assets
for item in static/ui static/archives; do
  if git show origin/financecheque:"$item" >/dev/null 2>&1; then
    log "Financecheque $item available"
  fi
done

log "=== sync-fcuk complete ==="
