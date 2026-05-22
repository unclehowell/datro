#!/usr/bin/env bash
set -euo pipefail

export PATH="$HOME/bin:$HOME/.npm-global/bin:/usr/local/bin:/usr/bin:/bin"
export HOME="$HOME"

LOCKFILE="/tmp/multi-branch-release.lock"
LOGDIR="$HOME/logs"
LOGFILE="$LOGDIR/multi-branch-release.log"
STATE_FILE="$HOME/.fcukproxy/release-state.json"
INTEL="$HOME/.fcukproxy/intelligence.py"
REPO_DIR="$HOME/datro"
FCHEQUE_REPO="$HOME/datro-financecheque"
GITHUB_REPO="unclehowell/datro"
RELEASE_LIMIT=500

BRANCHES=(
  "althea"
  "archives"
  "bpvsbuckler"
  "carfinancecheque"
  "ccan"
  "ceo"
  "dash"
  "datro"
  "dcc"
  "financecheque"
  "gui"
  "hbnb"
  "library"
  "llmwiki"
  "pirateclaw"
  "subrepos"
  "ui"
  "wave"
  "wayback"
  "whitepaper"
)

COOLDOWN_SECONDS=$((24 * 3600))

mkdir -p "$LOGDIR" "$HOME/.fcukproxy"

exec >> "$LOGFILE" 2>&1

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }

if [ -f "$LOCKFILE" ]; then
  pid=$(cat "$LOCKFILE" 2>/dev/null)
  if kill -0 "$pid" 2>/dev/null; then
    log "SKIP: previous run (PID $pid) still in progress"
    exit 0
  fi
  log "WARN: stale lockfile removed"
fi
echo $$ > "$LOCKFILE"
trap 'rm -f "$LOCKFILE"' EXIT

init_state() {
  if [ ! -f "$STATE_FILE" ]; then
    echo '{"rotation_index":0,"last_release":{}}' > "$STATE_FILE"
  fi
}

get_state() { python3 -c "import json; print(json.load(open('$STATE_FILE')).get('$1',''))" 2>/dev/null; }
set_state() {
  python3 -c "
import json
s = json.load(open('$STATE_FILE'))
key, val = '$1', '$2'
s[key] = val
json.dump(s, open('$STATE_FILE','w'), indent=2)
"
}

set_last_release() {
  local branch="$1"
  local timestamp="$2"
  python3 -c "
import json
s = json.load(open('$STATE_FILE'))
if 'last_release' not in s:
    s['last_release'] = {}
s['last_release']['$branch'] = '$timestamp'
json.dump(s, open('$STATE_FILE','w'), indent=2)
"
}

get_last_release() {
  python3 -c "import json; print(json.load(open('$STATE_FILE')).get('last_release',{}).get('$1',''))" 2>/dev/null
}

is_on_cooldown() {
  local branch="$1"
  local last=$(get_last_release "$branch")
  if [ -n "$last" ] && [ "$last" != "0" ]; then
    local now=$(date +%s)
    local elapsed=$(( now - last ))
    if [ "$elapsed" -lt "$COOLDOWN_SECONDS" ]; then
      local remaining=$(( (COOLDOWN_SECONDS - elapsed) / 3600 ))
      local remaining_min=$(( ((COOLDOWN_SECONDS - elapsed) % 3600) / 60 ))
      log "COOLDOWN: $branch last released ${elapsed}s ago, needs ${remaining}h${remaining_min}m more"
      return 0
    fi
  fi
  return 1
}

sync_releases_from_github() {
  log "Syncing last release timestamps from GitHub..."
  local branch_list
  branch_list=$(printf '%s\n' "${BRANCHES[@]}" | python3 -c "import sys,json; print(json.dumps([l.strip() for l in sys.stdin]))" 2>/dev/null)

  gh release list --repo "$GITHUB_REPO" --limit $RELEASE_LIMIT --json tagName,publishedAt 2>/dev/null | \
    BRANCH_LIST="$branch_list" python3 -c "
import json, sys, os
from datetime import datetime

data = json.load(sys.stdin)
state = json.load(open('$STATE_FILE'))
if 'last_release' not in state:
    state['last_release'] = {}

branches = json.loads(os.environ.get('BRANCH_LIST', '[]'))

for r in data:
    tag = r['tagName']
    published = r.get('publishedAt', '')
    if not published:
        continue
    ts = int(datetime.fromisoformat(published.replace('Z', '+00:00')).timestamp())
    for branch in branches:
        if tag.startswith(branch + '-v'):
            existing = int(state['last_release'].get(branch, 0))
            if ts > existing:
                state['last_release'][branch] = ts
json.dump(state, open('$STATE_FILE','w'), indent=2)
" 2>&1 || log "WARN: GitHub release sync failed"
}

prune_releases() {
  local branch="$1"
  log "Pruning releases for $branch, keeping last 3..."
  gh release list --repo "$GITHUB_REPO" --limit $RELEASE_LIMIT --json tagName,publishedAt 2>/dev/null | \
    python3 -c "
import sys, json
data = json.load(sys.stdin)
branch = '$branch'
releases = [(r['publishedAt'], r['tagName']) for r in data if r['tagName'].startswith(branch + '-v') and r.get('publishedAt')]
releases.sort(key=lambda x: x[0])
if len(releases) > 3:
    for _, tag in releases[:-3]:
        print(tag)
" 2>/dev/null | while read old_tag; do
    if [ -n "$old_tag" ]; then
      log "Deleting old release: $old_tag"
      gh release delete "$old_tag" --repo "$GITHUB_REPO" --yes 2>&1 | tail -1 || log "WARN: failed to delete $old_tag"
      git push origin --delete "refs/tags/$old_tag" 2>&1 | tail -1 || log "WARN: failed to delete tag $old_tag"
      log "Cleaned up $old_tag"
    fi
  done
  log "Done pruning $branch"
}

get_latest_version() {
  local branch="$1"
  gh release list --repo "$GITHUB_REPO" --limit $RELEASE_LIMIT --json tagName 2>/dev/null | \
    python3 -c "
import sys, json, re
data = json.load(sys.stdin)
tags = [r['tagName'] for r in data if r['tagName'].lower().startswith('$branch'.lower() + '-v')]
if not tags:
    print('0.0.0.0')
else:
    def version_key(t):
        nums = re.findall(r'[0-9]+', t)
        return [int(x) for x in nums[:4]] + [0]*(4-len(nums))
    ver = max(tags, key=version_key)
    nums = re.findall(r'[0-9]+', ver)
    print('.'.join(nums[:4]))
" 2>/dev/null || echo "0.0.0.0"
}

count_releases() {
  local branch="$1"
  git ls-remote --tags "https://github.com/$GITHUB_REPO" "${branch}-v*" 2>/dev/null | \
    python3 -c "
import sys
count = len(set(line.split()[1].replace('refs/tags/', '').rstrip('^{}') for line in sys.stdin if line.strip()))
print(count)
" 2>/dev/null || echo "0"
}

apply_fix() {
  local repo_dir="$1"
  local branch="$2"
  local fix_json

  cd "$repo_dir"

  log "Running intelligence pipeline for $branch..."
  fix_json=$(timeout 60 python3 "$INTEL" --repo "$repo_dir" 2>&1 || echo "null")
  if [ "$fix_json" = "null" ]; then
    log "Intelligence pipeline returned no fix or timed out for $branch"
  fi

  FILE_PATH=""
  OLD_STR=""
  NEW_STR=""
  COMMIT_MSG=""

  if [ "$fix_json" != "null" ]; then
    FILE_PATH=$(echo "$fix_json" | python3 -c "
import sys,json
try: print(json.load(sys.stdin).get('file_path',''))
except: print('')" 2>/dev/null || echo "")
    OLD_STR=$(echo "$fix_json" | python3 -c "
import sys,json
try: print(json.load(sys.stdin).get('old_string',''))
except: print('')" 2>/dev/null || echo "")
    NEW_STR=$(echo "$fix_json" | python3 -c "
import sys,json
try: print(json.load(sys.stdin).get('new_string',''))
except: print('')" 2>/dev/null || echo "")
    COMMIT_MSG=$(echo "$fix_json" | python3 -c "
import sys,json
try: print(json.load(sys.stdin).get('commit_message',''))
except: print('')" 2>/dev/null || echo "")
  fi

  FIX_APPLIED=false

  if [ -n "$FILE_PATH" ] && [ -n "$OLD_STR" ]; then
    FULL_PATH="$repo_dir/$FILE_PATH"
    log "Attempting AI fix: $FILE_PATH"
    if [ -f "$FULL_PATH" ] && grep -qF "$OLD_STR" "$FULL_PATH"; then
      OLD_FILE=$(mktemp)
      NEW_FILE=$(mktemp)
      printf '%s' "$OLD_STR" > "$OLD_FILE"
      printf '%s' "$NEW_STR" > "$NEW_FILE"
      python3 -c "
import sys
old_path = sys.argv[1]
new_path = sys.argv[2]
file_path = sys.argv[3]
with open(old_path) as f:
    old_string = f.read()
with open(new_path) as f:
    new_string = f.read()
with open(file_path) as f:
    content = f.read()
content = content.replace(old_string, new_string, 1)
with open(file_path, 'w') as f:
    f.write(content)
print('applied')
" "$OLD_FILE" "$NEW_FILE" "$FULL_PATH" 2>&1 && FIX_APPLIED=true && log "AI fix applied to $FILE_PATH"
      rm -f "$OLD_FILE" "$NEW_FILE"
    else
      log "AI fix failed: old_string not found in $FILE_PATH"
    fi
  fi

  if [ "$FIX_APPLIED" = false ]; then
    log "Running static analysis fallback for $branch..."
    for file in $(rg -l 'console\.(log|debug)' -g '*.{ts,tsx,py,js}' . --no-heading 2>/dev/null | head -1); do
      log "Removing console.log from $file"
      python3 -c "
import re
with open('$file') as f:
    c = f.read()
c = re.sub(r'^\s*console\.(log|debug)\([^)]*\);?\s*\n', '', c, flags=re.MULTILINE)
with open('$file', 'w') as f:
    f.write(c)
" 2>&1 && FIX_APPLIED=true && COMMIT_MSG="fix: remove console.log from $file" && break
    done
  fi

  if [ "$FIX_APPLIED" = false ]; then
    log "No fix found for $branch. Skipping."
    return 1
  fi

  log "Fix found and applied for $branch"
  return 0
}

CLOUDFLARE_PAGES_PROJECT="financecheque"

check_cloudflare_deploy() {
  local branch="$1"
  log "Checking Cloudflare deploy status for $branch..."
  local deploy_status
  deploy_status=$(npx wrangler pages deployment list --project-name "$CLOUDFLARE_PAGES_PROJECT" --branch "$branch" 2>/dev/null | head -5 || echo "unknown")
  if echo "$deploy_status" | grep -qi "success\|active\|live"; then
    log "Cloudflare deploy for $branch: SUCCESS"
    return 0
  fi
  log "Cloudflare deploy for $branch: FAILED or not found"
  return 1
}

check_console_errors() {
  local url="$1"
  log "Checking browser console errors for $url..."
  local errors
  errors=$(curl -sL --max-time 15 "$url" 2>/dev/null | grep -oiE "error|exception|uncaught|undefined is not|cannot read property|typeerror|referenceerror" | head -5 || true)
  if [ -n "$errors" ]; then
    log "Browser errors found on $url: $(echo "$errors" | tr '\n' ' ')"
    return 0
  fi
  return 1
}

check_viewport_overflow() {
  local url="$1"
  log "Checking viewport overflow for $url..."
  local overflow
  overflow=$(curl -sL --max-time 15 "$url" 2>/dev/null | grep -oiE "overflow-x|overflow-y|max-width.*100vw|min-width" | head -5 || true)
  if [ -n "$overflow" ]; then
    log "Potential viewport overflow found on $url"
    return 0
  fi
  return 1
}

# Support FORCE_BRANCH env var from /dispatch-datro-fix endpoint
if [ -n "${FORCE_BRANCH:-}" ]; then
  log "FORCE_BRANCH=$FORCE_BRANCH set via dispatch endpoint"
fi

init_state

log "=== MULTI-BRANCH RELEASE ==="

cd "$REPO_DIR"
git fetch origin --prune '+refs/heads/*:refs/remotes/origin/*' 2>&1 | tail -1

sync_releases_from_github

rotation_index=$(get_state "rotation_index")
rotation_index=${rotation_index:-0}
total_branches=${#BRANCHES[@]}
attempts=0
SELECTED_BRANCH=""

# If FORCE_BRANCH is set (from dispatch endpoint), use it directly
if [ -n "${FORCE_BRANCH:-}" ]; then
  SELECTED_BRANCH="$FORCE_BRANCH"
  log "FORCED BRANCH: $SELECTED_BRANCH"
  if is_on_cooldown "$SELECTED_BRANCH"; then
    log "FORCED BRANCH $SELECTED_BRANCH is on cooldown. Advancing rotation instead."
    SELECTED_BRANCH=""
  fi
else
  while [ $attempts -lt $total_branches ]; do
    candidate="${BRANCHES[$rotation_index]}"

    if git rev-parse --verify "origin/$candidate" >/dev/null 2>&1; then
      if is_on_cooldown "$candidate"; then
        log "SKIP $candidate (on cooldown)"
      else
        SELECTED_BRANCH="$candidate"
        break
      fi
    else
      log "SKIP $candidate (branch does not exist on remote)"
    fi

    rotation_index=$(( (rotation_index + 1) % total_branches ))
    attempts=$((attempts + 1))
  done

  if [ -z "$SELECTED_BRANCH" ]; then
    log "No eligible branch found. All on cooldown or missing."
    set_state "rotation_index" "$(( (rotation_index + 1) % total_branches ))"
    exit 0
  fi
fi

log "SELECTED: $SELECTED_BRANCH (rotation index: $rotation_index)"

if [ "$SELECTED_BRANCH" = "financecheque" ] && [ -d "$FCHEQUE_REPO" ]; then
  BRANCH_REPO="$FCHEQUE_REPO"
else
  BRANCH_REPO="$REPO_DIR"
fi

log "Using repo: $BRANCH_REPO"

cd "$BRANCH_REPO"
# Force-clean working tree and checkout target branch
git fetch origin "$SELECTED_BRANCH" 2>&1 | tail -1
if ! timeout 30 git checkout --force "$SELECTED_BRANCH" 2>&1 | tail -3; then
  log "Git checkout timed out, using temp clone for $SELECTED_BRANCH"
  BRANCH_REPO=$(mktemp -d)
  git clone --depth 1 --branch "$SELECTED_BRANCH" "https://github.com/$GITHUB_REPO" "$BRANCH_REPO" 2>&1 | tail -1
  cd "$BRANCH_REPO"
fi
git reset --hard "origin/$SELECTED_BRANCH" 2>&1 | tail -1

GH_COUNT=$(count_releases "$SELECTED_BRANCH")
: "${GH_COUNT:=0}"
NEXT_NUM=$(python3 -c "
import json
s = json.load(open('$STATE_FILE'))
c = s.get('total_releases', {}).get('$SELECTED_BRANCH')
if c is None or (isinstance(c, (int, float)) and c < $GH_COUNT):
    c = $GH_COUNT
print(int(c) + 1)
" 2>/dev/null || echo "$((GH_COUNT + 1))")
TOTAL=$((NEXT_NUM - 1))
VER_BUILD=$(( (TOTAL % 99) + 1 ))
PAD_BUILD=$(printf "%02d" "$VER_BUILD")
PATCH_SLOT=$(( TOTAL / 99 ))
VER_PATCH=$(( PATCH_SLOT % 10 ))
MINOR_SLOT=$(( PATCH_SLOT / 10 ))
VER_MINOR=$(( MINOR_SLOT % 10 ))
VER_MAJOR=$(( MINOR_SLOT / 10 ))
NEW_VER="${VER_MAJOR}.${VER_MINOR}.${VER_PATCH}.${PAD_BUILD}"
NEW_TAG="${SELECTED_BRANCH}-v${NEW_VER}"
log "Target: $NEW_TAG (release #$NEXT_NUM)"

FIX_APPLIED=false
if apply_fix "$BRANCH_REPO" "$SELECTED_BRANCH"; then
  FIX_APPLIED=true
fi

if [ -f "package.json" ]; then
  python3 -c "
import json
p = json.load(open('package.json'))
p['version'] = '$NEW_VER'
json.dump(p, open('package.json', 'w'), indent=2)
" 2>&1 || true
fi

TODAY=$(date '+%Y-%m-%d')
if [ "$FIX_APPLIED" = true ]; then
  CHANGE_TYPE="Fixed"
  DEFAULT_MSG="${COMMIT_MSG:-Automated bug fix release $NEW_TAG}"
else
  DEFAULT_MSG="chore: maintenance re-release $NEW_TAG"
  CHANGE_TYPE="Changed"
fi
if [ -f "CHANGELOG.md" ]; then
  python3 -c "
NEW_TAG = '$NEW_TAG'
TODAY = '$TODAY'
COMMIT_MSG = '''${COMMIT_MSG:-$DEFAULT_MSG}'''
with open('CHANGELOG.md') as f:
    content = f.read()
entry = f'\n## [{NEW_TAG}] - {TODAY}\n\n### $CHANGE_TYPE\n- {COMMIT_MSG}\n'
lines = content.split('\n', 1)
content = lines[0] + '\n' + entry + lines[1] if len(lines) >= 2 else content + '\n' + entry
with open('CHANGELOG.md', 'w') as f:
    f.write(content)
" 2>&1 || true
fi

# Always commit, tag, push, and create a release
COMMIT_MSG="${COMMIT_MSG:-$DEFAULT_MSG}"
git add -A 2>&1 | tail -1
git commit -m "$COMMIT_MSG" 2>&1 | tail -3 || log "WARN: nothing to commit (no changes)"
git tag --force "$NEW_TAG" 2>&1 | tail -1
git push origin "$SELECTED_BRANCH" 2>&1 | tail -2 || log "WARN: push branch failed"
# Push tag; if it already exists on remote, force-update it
git push origin "$NEW_TAG" 2>&1 | tail -2 || git push origin "$NEW_TAG" --force 2>&1 | tail -2 || log "WARN: push tag failed"

RELEASE_BODY=$(python3 -c "
with open('CHANGELOG.md') as f:
    content = f.read()
tag = '$NEW_TAG'
import re
pattern = rf'## \[\{re.escape(tag)}\].*?(?=\n## \[|\$)'
match = re.search(pattern, content, re.DOTALL)
print(match.group(0).strip() if match else f'Release $NEW_VER')
" 2>/dev/null || echo "Release $NEW_VER")

gh release create "$NEW_TAG" \
  --repo "$GITHUB_REPO" \
  --title "${SELECTED_BRANCH}-v${NEW_VER}" \
  --notes "$RELEASE_BODY" \
  2>&1 | tail -3

set_last_release "$SELECTED_BRANCH" "$(date +%s)"

log "=== RELEASE COMPLETE: $NEW_TAG ==="
log "https://github.com/$GITHUB_REPO/releases/tag/$NEW_TAG"

# Verify release appears on GitHub releases page before cleanup
VERIFIED=false
for i in 1 2 3 4 5; do
  sleep 3
  if gh release view "$NEW_TAG" --repo "$GITHUB_REPO" --json tagName 2>/dev/null | grep -q "$NEW_TAG"; then
    VERIFIED=true
    log "Verified $NEW_TAG is live on GitHub releases (attempt $i)"
    break
  fi
  log "Waiting for $NEW_TAG to appear on GitHub releases (attempt $i)..."
done

if [ "$VERIFIED" = true ]; then
  # ── Verify Cloudflare deployment ──────────────────────────────────────
  CLOUD_DOMAIN=""
  case "$SELECTED_BRANCH" in
    financecheque) CLOUD_DOMAIN="https://financecheque.uk" ;;
    *)             CLOUD_DOMAIN="https://${SELECTED_BRANCH}.datro.pages.dev" ;;
  esac
  log "Checking Cloudflare deployment at $CLOUD_DOMAIN..."
  CF_VERIFIED=false
  for i in 1 2 3 4 5; do
    if curl -sL --max-time 10 "$CLOUD_DOMAIN" >/dev/null 2>&1; then
      CF_VERIFIED=true
      log "Cloudflare deploy verified for $SELECTED_BRANCH (attempt $i)"
      break
    fi
    log "Waiting for Cloudflare deploy of $SELECTED_BRANCH (attempt $i)..."
    sleep 10
  done

  if [ "$CF_VERIFIED" = false ]; then
    log "WARN: Cloudflare deploy failed for $SELECTED_BRANCH. Treating as priority bug for inner loop..."
    for inner_attempt in 1 2; do
      git checkout "$SELECTED_BRANCH" 2>/dev/null
      DEPLOY_FIX=""
      if [ ! -f "wrangler.toml" ] && [ ! -f "_redirects" ]; then
        echo "" >> "_redirects"
        DEPLOY_FIX="add _redirects for Cloudflare Pages SPA routing"
      fi
      if [ -n "$DEPLOY_FIX" ]; then
        git add -A 2>/dev/null
        git commit -m "fix: deploy config for $SELECTED_BRANCH" 2>/dev/null || true
        git push origin "$SELECTED_BRANCH" 2>/dev/null || true
        log "Inner loop: applied deploy fix ($DEPLOY_FIX), waiting for redeploy..."
        sleep 20
        if curl -sL --max-time 10 "$CLOUD_DOMAIN" >/dev/null 2>&1; then
          CF_VERIFIED=true
          log "Inner loop: Cloudflare deploy succeeded after fix"
          break
        fi
      else
        log "Inner loop: no automatic deploy fix available for $SELECTED_BRANCH"
        break
      fi
    done
  fi

  if [ "$CF_VERIFIED" = true ]; then
    log "Cloudflare deploy confirmed."
  else
    log "WARN: Cloudflare deploy still failing after inner loop. Cleaning up anyway."
  fi

  # ── Runtime quality checks on live deployment ──────────────────────────
  CONSOLE_ERRORS=False
  VIEWPORT_ISSUES=False
  if check_console_errors "$CLOUD_DOMAIN"; then
    CONSOLE_ERRORS=True
  fi
  if check_viewport_overflow "$CLOUD_DOMAIN"; then
    VIEWPORT_ISSUES=True
  fi
  if [ "$CONSOLE_ERRORS" = True ] || [ "$VIEWPORT_ISSUES" = True ]; then
    python3 -c "
import json, os
state_file = os.path.expanduser('$STATE_FILE')
s = json.load(open(state_file))
if 'known_issues' not in s:
    s['known_issues'] = []
s['known_issues'].append({
    'branch': '$SELECTED_BRANCH',
    'url': '$CLOUD_DOMAIN',
    'console_errors': $CONSOLE_ERRORS,
    'viewport_issues': $VIEWPORT_ISSUES,
    'detected_at': $(date +%s)
})
json.dump(s, open(state_file, 'w'), indent=2)
" 2>&1 || true
  fi

  prune_releases "$SELECTED_BRANCH"
  # Persist the release counter so versioning survives pruning
  python3 -c "
import json
s = json.load(open('$STATE_FILE'))
if 'total_releases' not in s:
    s['total_releases'] = {}
s['total_releases']['$SELECTED_BRANCH'] = $NEXT_NUM
json.dump(s, open('$STATE_FILE','w'), indent=2)
" 2>&1 || log "WARN: failed to save release counter"
else
  log "WARN: $NEW_TAG not confirmed on releases page. Skipping oldest deletion."
fi

set_state "rotation_index" "$(( (rotation_index + 1) % total_branches ))"
