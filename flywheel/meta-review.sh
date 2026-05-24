#!/usr/bin/env bash
set -euo pipefail
# meta-review.sh — Daily supervisor for the AWS flywheel.
# Runs every 24h: fetches AWS state, analyzes release health,
# pushes improvements to the flywheel code on GitHub cnei branch.
# The AWS pulls these improvements on its next hourly run.

export PATH="$HOME/bin:$HOME/.npm-global/bin:/usr/local/bin:/usr/bin:/bin"
export HOME="$HOME"

LOCKFILE="/tmp/meta-review.lock"
LOGDIR="$HOME/logs"
LOGFILE="$LOGDIR/meta-review.log"
STATE_FILE="$HOME/.fcukproxy/release-state.json"
INTEL="$HOME/.fcukproxy/intelligence.py"
FCUK_DIR="$HOME/.fcukproxy"
AGENT_DIR="$FCUK_DIR/agent"
GATHER="$FCUK_DIR/gather_review_data.py"
AWS_SSH="ssh -o StrictHostKeyChecking=no -i $HOME/Desktop/aws-recovery-key ubuntu@13.135.142.244"
GITHUB_REPO="unclehowell/datro"
CNEI_BRANCH="cnei"

mkdir -p "$LOGDIR"
exec >> "$LOGFILE" 2>&1

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }

# ── Lock ──

if [ -f "$LOCKFILE" ]; then
  pid=$(cat "$LOCKFILE" 2>/dev/null)
  if kill -0 "$pid" 2>/dev/null; then
    log "SKIP: previous meta-review (PID $pid) still running"
    exit 0
  fi
  log "WARN: stale lockfile removed"
fi
echo $$ > "$LOCKFILE"
trap 'rm -f "$LOCKFILE"' EXIT

log "=== META-REVIEW START ==="

# ── 1. Fetch AWS state ────────────────────────────────────────────────────────

log "Fetching AWS state..."
AWS_LOG=$($AWS_SSH "tail -200 ~/logs/multi-branch-release.log" 2>/dev/null || echo "SSH FAILED")
AWS_STATE_JSON=$($AWS_SSH "cat ~/.fcukproxy/release-state.json" 2>/dev/null || echo "{}")
AWS_PROFILES_JSON=$($AWS_SSH "cat ~/.fcukproxy/agent/profiles.json" 2>/dev/null || echo "{}")

log "AWS log lines: $(echo "$AWS_LOG" | wc -l)"

# ── 2. Build review data ──────────────────────────────────────────────────────

REVIEW_DATA=$(python3 "$GATHER" "$AWS_STATE_JSON" "$AWS_PROFILES_JSON" "$AWS_LOG" 2>/dev/null)
log "Review: $(echo "$REVIEW_DATA" | python3 -c "import json,sys; d=json.load(sys.stdin); print(f'releases={d[\"total_releases\"]}, branches={d[\"unique_branches_released\"]}')")"

# ── 3. AI analysis via intelligence.py ────────────────────────────────────────

log "Calling intelligence.py for meta analysis..."
RESULT=$(timeout 120 python3 "$INTEL" --branch "aws" --type "meta" --pass-number 1 2>/dev/null) || true
EXIT_CODE=$?

if [ "$EXIT_CODE" = "42" ] || [ -z "$RESULT" ]; then
  log "AI produced no meta-suggestion. Skipping."
  log "=== META-REVIEW END (no changes) ==="
  exit 0
fi

log "AI meta-suggestion received."

# ── 4. Apply suggestion ───────────────────────────────────────────────────────

TOOL=$(echo "$RESULT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('tool','sed'))" 2>/dev/null || echo "sed")
FP=$(echo "$RESULT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('file_path',''))" 2>/dev/null || echo "")
DESC=$(echo "$RESULT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('bug_description',''))" 2>/dev/null || echo "")

if [ -z "$FP" ]; then
  log "AI suggestion missing file_path. Skipping."
  log "=== META-REVIEW END (no suggestion) ==="
  exit 0
fi

log "Applying: $TOOL on $FP - $DESC"
APPLY_OUTPUT=$(timeout 30 python3 "$INTEL" --branch "aws" --type "meta" --apply "$RESULT" 2>/dev/null) || true
if [ -z "$APPLY_OUTPUT" ]; then
  log "Apply failed. Skipping."
  log "=== META-REVIEW END (apply failed) ==="
  exit 0
fi

log "Applied. Learned from fix."

# ── 5. Push to GitHub cnei branch ─────────────────────────────────────────────

push_file() {
  local repo_path="$1" local_path="$2" msg="$3"
  python3 -c "
import json, base64, subprocess
with open('$local_path') as f:
    content = f.read()
r = subprocess.run(['gh','api','repos/$GITHUB_REPO/contents/$repo_path?ref=$CNEI_BRANCH'],
    capture_output=True, text=True)
sha = json.loads(r.stdout).get('sha') if r.returncode == 0 else None
enc = base64.b64encode(content.encode()).decode()
p = json.dumps({'message':'$msg','content':enc,'sha':sha,'branch':'$CNEI_BRANCH'})
subprocess.run(['gh','api','repos/$GITHUB_REPO/contents/$repo_path',
    '--method','PUT','--input','-'], input=p, capture_output=True, text=True, timeout=30)
print('Pushed $repo_path')
" 2>/dev/null || log "WARN: push failed for $repo_path"
}

push_file "flywheel/multi-branch-release.sh" "$FCUK_DIR/multi-branch-release.sh" "meta: $DESC"
push_file "flywheel/agent/profiles.json" "$FCUK_DIR/agent/profiles.json" "meta: update AWS supervisor profile"
push_file "flywheel/meta-review.sh" "$FCUK_DIR/meta-review.sh" "meta: update self-review script"
push_file "flywheel/gather_review_data.py" "$FCUK_DIR/gather_review_data.py" "meta: review data gatherer"
push_file "flywheel/agent/branches/aws.md" "$FCUK_DIR/agent/branches/aws.md" "meta: update AWS supervisor context"
push_file "flywheel/agent/aws-supervisor.md" "$FCUK_DIR/agent/aws-supervisor.md" "meta: update AWS supervisor soul"

log "=== META-REVIEW END ==="
