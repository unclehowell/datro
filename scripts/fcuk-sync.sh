#!/bin/bash
# fcuk-sync.sh - Monitors unclehowell/fcuk for changes and syncs to datro/static/fcuk

DATRO_DIR="/home/ubuntu/datro"
FCUK_REPO="https://github.com/unclehowell/FCUK.git"
LOCK_FILE="/tmp/fcuk-sync.lock"
LOG_FILE="/tmp/fcuk-sync.log"
RATE_LIMIT_FILE="/home/ubuntu/datro/.fcuk-rate-limit"
RATE_LIMIT_SECONDS=7200
DEDUP_FILE="/home/ubuntu/datro/.fcuk-last-commit"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

if [ -f "$RATE_LIMIT_FILE" ]; then
    LAST_SYNC=$(cat "$RATE_LIMIT_FILE")
    NOW=$(date +%s)
    ELAPSED=$((NOW - LAST_SYNC))
    if [ "$ELAPSED" -lt "$RATE_LIMIT_SECONDS" ]; then
        log "Rate limit active. Last sync $ELAPSED seconds ago. Waiting 2 hours between syncs. Exiting."
        exit 0
    fi
fi

if [ -f "$LOCK_FILE" ]; then
    LOGFILEPID=$(cat "$LOCK_FILE" 2>/dev/null)
    if [ -n "$LOGFILEPID" ] && [ -d "/proc/$LOGFILEPID" ]; then
        log "Lock file exists, another instance (PID $LOGFILEPID) may be running. Exiting."
        exit 0
    fi
fi

echo $$ > "$LOCK_FILE"
trap "rm -f $LOCK_FILE" EXIT

log "Starting fcuk sync..."

cd "$DATRO_DIR"
git remote set-url origin https://github.com/unclehowell/datro.git 2>/dev/null || true
git fetch origin gh-pages -q 2>/dev/null || {
    log "ERROR: Could not fetch origin gh-pages"
    date +%s > "$RATE_LIMIT_FILE"
    exit 1
}
git checkout gh-pages -f -q 2>/dev/null || git checkout -b gh-pages -q
git reset --hard origin/gh-pages -q 2>/dev/null || true

FCUK_COMMIT=$(git ls-remote "$FCUK_REPO" HEAD 2>/dev/null | awk '{print $1}')

if [ -z "$FCUK_COMMIT" ]; then
    log "ERROR: Could not fetch fcuk remote commit"
    date +%s > "$RATE_LIMIT_FILE"
    exit 1
fi

LAST_COMMIT_FILE="$DEDUP_FILE"
LAST_COMMIT=""
[ -f "$LAST_COMMIT_FILE" ] && LAST_COMMIT=$(cat "$LAST_COMMIT_FILE")

if [ "$FCUK_COMMIT" = "$LAST_COMMIT" ]; then
    log "No changes detected in fcuk repo (commit: $FCUK_COMMIT)"
    date +%s > "$RATE_LIMIT_FILE"
    exit 0
fi

log "New fcuk commit detected: $FCUK_COMMIT (was: $LAST_COMMIT)"

TEMP_FCUK_DIR="/tmp/fcuk-temp"
if [ ! -d "$TEMP_FCUK_DIR" ]; then
    log "Cloning fcuk repo..."
    git clone --depth 1 "$FCUK_REPO" "$TEMP_FCUK_DIR" 2>/dev/null
else
    cd "$TEMP_FCUK_DIR"
    git fetch origin -q
    git checkout main -q
fi

cd "$TEMP_FCUK_DIR"
git pull origin main -q

cd "$DATRO_DIR"
rm -rf "$DATRO_DIR/static/fcuk"
cp -r "$TEMP_FCUK_DIR" "$DATRO_DIR/static/fcuk"
rm -rf "$DATRO_DIR/static/fcuk/.git"

git add "static/fcuk"
git commit -m "Sync fcuk from unclehowell/fcuk@${FCUK_COMMIT:0:7}" -q 2>/dev/null || {
    log "No changes to commit (already at same commit)"
    date +%s > "$RATE_LIMIT_FILE"
    exit 0
}

git pull --rebase origin gh-pages -q 2>&1 || {
    log "Pull rebase failed, aborting and setting rate limit"
    git rebase --abort 2>/dev/null || true
    date +%s > "$RATE_LIMIT_FILE"
    exit 0
}

git push origin gh-pages -q 2>&1 | tee -a "$LOG_FILE"

if [ ${PIPESTATUS[0]} -eq 0 ]; then
    log "Pushed to gh-pages successfully"
    echo "$FCUK_COMMIT" > "$LAST_COMMIT_FILE"
    date +%s > "$RATE_LIMIT_FILE"
    log "Sync complete."
else
    log "ERROR: Failed to push to gh-pages"
    date +%s > "$RATE_LIMIT_FILE"
    exit 1
fi
