#!/usr/bin/env bash
# agent-exec.sh — Execute delegated agent tasks on this device
# Reads task JSON from stdin, executes, returns result JSON to stdout
#
# Task JSON format:
# {
#   "task": "Add a dark theme toggle to the login page",
#   "context": {
#     "repo": "unclehowell/datro",
#     "branch": "command",
#     "files": ["src/components/ThemeToggle.tsx"]
#   },
#   "machine_id": "child-localhost",
#   "timeout_sec": 300
# }

set -euo pipefail

TASK_JSON=$(cat)
TASK=$(echo "$TASK_JSON" | python3 -c "import sys,json; print(json.load(sys.stdin).get('task',''))" 2>/dev/null || echo "")
REPO_DIR=$(echo "$TASK_JSON" | python3 -c "import sys,json; print(json.load(sys.stdin).get('context',{}).get('repo_dir','${HOME}/datro'))" 2>/dev/null || echo "${HOME}/datro")
BRANCH=$(echo "$TASK_JSON" | python3 -c "import sys,json; print(json.load(sys.stdin).get('context',{}).get('branch','command'))" 2>/dev/null || echo "command")
TIMEOUT=$(echo "$TASK_JSON" | python3 -c "import sys,json; print(json.load(sys.stdin).get('timeout_sec',300))" 2>/dev/null || echo "300")
MACHINE_ID="${MACHINE_ID:-unknown}"

LOG_FILE="${HOME}/.fcukproxy/agent-exec.log"

log() {
  echo "[$(date -Iseconds 2>/dev/null || date)] $*" >> "$LOG_FILE"
  echo "[agent-exec] $*" >&2
}

result() {
  echo "$1"
  exit 0
}

fail() {
  echo "$1"
  exit 1
}

log "Starting agent execution: '$TASK'"
log "Repo: $REPO_DIR | Branch: $BRANCH | Timeout: ${TIMEOUT}s"

# Use a temp directory for each task to avoid conflicts with local working tree
TMP_DIR=$(mktemp -d /tmp/agent-exec.XXXXXX)
trap 'rm -rf "$TMP_DIR"' EXIT

# Clone or copy the repo
if [[ -d "$REPO_DIR/.git" ]]; then
  log "Copying repo to temp directory..."
  git clone --no-hardlinks "$REPO_DIR" "$TMP_DIR/repo" 2>&1 || fail '{"error":"Failed to clone repo"}'
else
  log "Cloning repo from GitHub..."
  git clone "https://github.com/unclehowell/datro.git" "$TMP_DIR/repo" 2>&1 || fail '{"error":"Failed to clone repo"}'
fi

cd "$TMP_DIR/repo"
git fetch origin 2>&1 || log "Warning: git fetch failed"

# Checkout the branch - try direct checkout first, then create from origin if needed
if git checkout "$BRANCH" 2>&1; then
  log "Checked out branch: $BRANCH"
else
  log "Branch '$BRANCH' not found locally, trying origin/$BRANCH"
  git checkout -b "$BRANCH" "origin/$BRANCH" 2>&1 || fail "{\"error\":\"Failed to checkout branch '$BRANCH'\"}"
fi

git pull origin "$BRANCH" 2>&1 || log "Warning: git pull failed"

# ── Step 2: Determine task type and execute ──────────────────────────────
TASK_LOWER=$(echo "$TASK" | tr '[:upper:]' '[:lower:]')

if echo "$TASK_LOWER" | grep -q "theme\|color\|style\|css\|toggle"; then
  log "Task type: THEME/CSS modification"
  
  # Find relevant files
  THEMED_FILES=$(grep -rl "theme\|ThemeToggle\|dark-mode\|color-scheme" src/ 2>/dev/null | head -5 || echo "")
  log "Theme-related files: $THEMED_FILES"
  
  # Try using opencode if available
  if command -v opencode >/dev/null 2>&1; then
    log "Using opencode for code changes"
    OPENCODE_RESULT=$(timeout "$TIMEOUT" opencode --non-interactive -m "$TASK" 2>&1 || echo "opencode-failed")
    log "opencode result: $OPENCODE_RESULT"
  elif command -v kilo >/dev/null 2>&1; then
    log "Using kilo for code changes"
    KILO_RESULT=$(timeout "$TIMEOUT" kilo run "$TASK" 2>&1 || echo "kilo-failed")
    log "kilo result: $KILO_RESULT"
  else
    log "No CLI/IDE found — performing manual task"
    
    # Manual theme addition as fallback
    # Create a simple theme toggle if it doesn't exist
    if [[ ! -f "src/components/ThemeToggle.tsx" ]] && [[ ! -f "src/components/ThemeToggle.jsx" ]]; then
      mkdir -p src/components 2>/dev/null || true
      cat > src/components/ThemeToggle.tsx << 'THEMEEOF'
import { useState, useEffect } from 'react';

export function ThemeToggle() {
  const [dark, setDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || 
             (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  return (
    <button
      onClick={() => setDark(!dark)}
      className="theme-toggle"
      aria-label="Toggle theme"
      style={{
        position: 'fixed', top: '1rem', right: '1rem',
        background: dark ? '#e8b84e' : '#333',
        color: dark ? '#000' : '#fff',
        border: 'none', borderRadius: '50%',
        width: '40px', height: '40px', cursor: 'pointer',
        fontSize: '1.2rem', zIndex: 9999
      }}
    >
      {dark ? '☀' : '☾'}
    </button>
  );
}
THEMEEOF
      log "Created ThemeToggle.tsx"
    fi
  fi
fi

# Handle version bump requests
if echo "$TASK_LOWER" | grep -q "version\|bump\|release\|rerelease"; then
  log "Task type: VERSION/RELEASE"
  
  # Find package.json or version files
  if [[ -f "package.json" ]]; then
    OLD_VER=$(python3 -c "import json; print(json.load(open('package.json')).get('version','0.0.0'))" 2>/dev/null || echo "0.0.0")
    log "Current version: $OLD_VER"
  fi
fi

# ── Step 3: Check for changes ────────────────────────────────────────────
CHANGES=$(git status --porcelain 2>/dev/null || echo "")
if [[ -z "$CHANGES" ]]; then
  log "No changes detected after task execution"
  result "{\"status\":\"completed\",\"no_changes\":true,\"task\":\"$(echo "$TASK" | head -c 200)\"}"
fi

# ── Step 4: Commit and push ─────────────────────────────────────────────
CHANGED_FILES=$(echo "$CHANGES" | awk '{print $2}' | head -10)
FILE_COUNT=$(echo "$CHANGES" | wc -l | tr -d ' ')

log "Changes detected: $FILE_COUNT files"
log "Files: $CHANGED_FILES"

git add -A 2>&1
COMMIT_MSG="feat(delegation): $(echo "$TASK" | head -c 72)"
git commit -m "$COMMIT_MSG" 2>&1 || log "Nothing to commit"

# Generate short hash for tracking
SHORT_HASH=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
log "Committed: $SHORT_HASH"

# Push to origin
git push origin "$BRANCH" 2>&1 || {
  log "Push failed — attempting force"
  git push origin "$BRANCH" --force-with-lease 2>&1 || fail '{"error":"Push failed"}'
}

log "Pushed to origin/$BRANCH"

# ── Step 5: Return result ───────────────────────────────────────────────
DEPLOY_URL=""
case "$BRANCH" in
  command) DEPLOY_URL="https://command.datro.xyz" ;;
  financecheque) DEPLOY_URL="https://www.financecheque.uk" ;;
  *) DEPLOY_URL="https://${BRANCH}.datro.xyz" ;;
esac

cat << RESULT
{
  "status": "completed",
  "commit": "$SHORT_HASH",
  "branch": "$BRANCH",
  "files_changed": $FILE_COUNT,
  "deploy_url": "$DEPLOY_URL",
  "task_summary": "$(echo "$TASK" | head -c 200 | sed 's/"/\\"/g')",
  "machine_id": "$MACHINE_ID",
  "timestamp": "$(date -Iseconds 2>/dev/null || date)"
}
RESULT