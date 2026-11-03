#!/bin/bash
# Auto-sync: triggered by flywheel cron to pull latest fixes and rebuild
# Also prunes old releases (keeps last 3 per branch)

set -euo pipefail

REPO_DIR="$HOME/datro"
BRANCH="bpvsbuckler"
LOG_DIR="$REPO_DIR/logs"
mkdir -p "$LOG_DIR"
LOG="$LOG_DIR/auto-sync.log"

log() { echo "$(date '+%Y-%m-%d %H:%M:%S'): $*" >> "$LOG"; }

log "=== auto-sync start ==="

cd "$REPO_DIR"

# Fetch latest from origin
git fetch origin "$BRANCH" 2>&1 | tail -1 >> "$LOG"
git reset --hard "origin/$BRANCH" 2>&1 | tail -1 >> "$LOG"

# Prune old releases: keep last 3
log "Pruning releases older than last 3..."
gh release list --repo "unclehowell/datro" --limit 50 --json tagName,publishedAt 2>/dev/null | \
  python3 -c "
import sys, json
data = json.load(sys.stdin)
releases = [(r['publishedAt'], r['tagName']) for r in data if r['tagName'].startswith('${BRANCH}-v') and r.get('publishedAt')]
releases.sort(key=lambda x: x[0])
if len(releases) > 3:
    for _, tag in releases[:-3]:
        print(tag)
" 2>/dev/null | while read old_tag; do
  if [ -n "$old_tag" ]; then
    log "Deleting old release: $old_tag"
    gh release delete "$old_tag" --repo "unclehowell/datro" --yes 2>&1 | tail -1 >> "$LOG" || true
    git push origin --delete "refs/tags/$old_tag" 2>&1 | tail -1 >> "$LOG" || true
    log "Cleaned up $old_tag"
  fi
done

# Rebuild content from data.json
if [ -f "content/rebuild.py" ]; then
  log "Rebuilding content..."
  python3 content/rebuild.py 2>&1 >> "$LOG" || log "WARN: rebuild failed"
fi

log "=== auto-sync complete ==="
