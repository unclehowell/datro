#!/usr/bin/env bash
# pr_automation.sh - automated PR creation/updating with Cloudflare preview table
# Usage: ./pr_automation.sh
# Optional environment variables:
#   DEFAULT_BASE_BRANCH=gh-pages
#   ALLOW_EMPTY_COMMIT=no
#   AUTO_FIX_PERMISSIONS=no

set -o errexit
set -o pipefail
set -o nounset

# --- Config ---
TRIGGER_FILE=".pr_trigger"
BRANCH_PREFIX="feature/auto-"
DEFAULT_BASE_BRANCH="${DEFAULT_BASE_BRANCH:-gh-pages}"
ALLOW_EMPTY_COMMIT="${ALLOW_EMPTY_COMMIT:-no}"
AUTO_FIX_PERMISSIONS="${AUTO_FIX_PERMISSIONS:-no}"

log() { printf '\033[1;34m%s\033[0m\n' "$*"; }
success() { printf '\033[1;32m%s\033[0m\n' "$*"; }
warn() { printf '\033[1;33m%s\033[0m\n' "$*"; }
err() { printf '\033[1;31m%s\033[0m\n' "$*"; exit 1; }

# --- Sanity Checks ---
command -v git >/dev/null 2>&1 || err "git not found"
command -v gh  >/dev/null 2>&1 || err "GitHub CLI 'gh' not found. Install & authenticate."

git rev-parse --git-dir >/dev/null 2>&1 || err "Not inside a git repository"

CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
[ -z "$CURRENT_BRANCH" ] && err "Cannot detect current branch"

# --- Permission Check ---
OBJECTS_DIR="$(git rev-parse --git-path objects)"
if [ -d "$OBJECTS_DIR" ] && ! [ -w "$OBJECTS_DIR" ]; then
  warn "No write permission on $OBJECTS_DIR → git commit may fail"
  if [[ "$AUTO_FIX_PERMISSIONS" == "yes" ]] && [[ -n "${USER:-}" ]]; then
    warn "Attempting automatic chown..."
    sudo chown -R "$USER":"$(id -gn)" "$(git rev-parse --git-dir)" || err "sudo chown failed"
    success "Ownership fixed — retry the script"
    exit 0
  else
    warn "Suggestion: sudo chown -R \$USER:\$(id -gn) .git"
    exit 2
  fi
fi

# --- Branch Name Generation ---
generate_branch_name() {
  TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
  letter=$(printf "%c" $((97 + (RANDOM % 26))))
  echo "${BRANCH_PREFIX}${letter}-${TIMESTAMP}"
}

# --- Remote Base Branch ---
determine_remote_base() {
  local preferred="$1"
  if git ls-remote --heads origin "$preferred" | grep -q "refs/heads/$preferred"; then
    echo "$preferred"; return 0
  fi
  for fb in main master; do
    if git ls-remote --heads origin "$fb" | grep -q "refs/heads/$fb"; then
      warn "Using fallback base branch: origin/$fb"
      echo "$fb"; return 0
    fi
  done
  echo "$preferred"
}

# --- Interactive Menu ---
PS3="Select action: "
options=("Create New Pull Request (New Branch)" "Update Existing Pull Request (Current Branch)")
echo
select opt in "${options[@]}"; do
  case $REPLY in
    1) ACTION="CREATE"; break ;;
    2) ACTION="UPDATE"; break ;;
    *) echo "Invalid option. Choose 1 or 2." ;;
  esac
done

# --- Git Config ---
if ! git config user.email >/dev/null 2>&1 || ! git config user.name >/dev/null 2>&1; then
  warn "Git user.name or user.email not set."
fi

# --- Branch Handling ---
if [ "$ACTION" = "CREATE" ]; then
  NEW_BRANCH="$(generate_branch_name)"
  log "Creating and switching to: $NEW_BRANCH"
  git checkout -b "$NEW_BRANCH"
  BRANCH_TO_USE="$NEW_BRANCH"
else
  BRANCH_TO_USE="$CURRENT_BRANCH"
  log "Using current branch: $BRANCH_TO_USE"
fi

# --- Trigger File ---
CURRENT_TIME="$(date '+%Y-%m-%d %H:%M:%S')"
echo "Last run: $CURRENT_TIME" > "$TRIGGER_FILE"

# --- Stage & Commit ---
log "Staging all changes..."
git add -A

COMMIT_MSG="Auto-commit: $CURRENT_TIME - Automated PR update."

if git commit -m "$COMMIT_MSG" 2>/dev/null; then
  success "Commit created."
else
  if [ -z "$(git status --porcelain)" ]; then
    warn "Nothing to commit."
    if [ "$ALLOW_EMPTY_COMMIT" = "yes" ]; then
      git commit --allow-empty -m "$COMMIT_MSG (empty)"
      success "Empty commit created."
    else
      warn "Skipping commit (ALLOW_EMPTY_COMMIT=no)"
    fi
  else
    err "git commit failed (not just 'nothing to commit')."
  fi
fi

# --- Push ---
log "Pushing to origin/$BRANCH_TO_USE..."
git push -u origin "$BRANCH_TO_USE" || err "git push failed"
success "Pushed successfully."

# --- PR Creation/Update ---
BASE_BRANCH="$(determine_remote_base "$DEFAULT_BASE_BRANCH")"
PR_TITLE="[Auto] $COMMIT_MSG"
PR_BODY="**Automated update**\nTriggered: $CURRENT_TIME"

PR_URL=""

if [ "$ACTION" = "CREATE" ]; then
  log "Creating PR..."
  PR_URL=$(gh pr create --head "$BRANCH_TO_USE" --base "$BASE_BRANCH" --title "$PR_TITLE" --body "$PR_BODY" 2>/dev/null || true)
elif [ "$ACTION" = "UPDATE" ]; then
  log "Looking for existing PR..."
  PR_URL=$(gh pr list --head "$BRANCH_TO_USE" --state open --json url -q '.[0].url' 2>/dev/null || true)
  if [ -n "$PR_URL" ]; then
    success "Found PR: $PR_URL"
    gh pr comment "$PR_URL" -b "Automated update: $CURRENT_TIME" >/dev/null 2>&1 || true
  else
    log "No PR found; creating one..."
    PR_URL=$(gh pr create --head "$BRANCH_TO_USE" --base "$BASE_BRANCH" --title "$PR_TITLE" --body "$PR_BODY" 2>/dev/null || true)
  fi
fi

# --- Output ---
echo "----------------------------------------------"
if [ -n "$PR_URL" ]; then
  success "Pull Request: $PR_URL"
  echo "Branch : $BRANCH_TO_USE"
  echo "Base   : $BASE_BRANCH"
  echo "Title  : $PR_TITLE"
else
  err "Could not create/find PR"
fi
echo "----------------------------------------------"

# --- Cloudflare Preview Table ---
# This will add a comment in the PR with the classic table format
CF_APPS=( "bpvsbuckler" "datro" "_dcc" "_etrike" "ew" "forces" "gui" "hbnb" "library" "_maps" "projections" "puck" "_trailer" )
CF_DISPLAY=( "bpvsbuckler" "datro" "dcc" "etrike" "ew" "forces" "gui" "hbnb" "library" "_maps" "projections" "puck" "trailer" )

# If you have outputs from a workflow for each app, you can build the table here.
# Example: assume we exported the deploy URL per app in environment variable or via GH CLI
TABLE="## 🚀 Cloudflare Pages Preview Deployments\n\n"
TABLE+="| Application | Status | Preview URL |\n|---|---|---|\n"
TOTAL=0

for i in "${!CF_APPS[@]}"; do
  app="${CF_APPS[$i]}"
  display="${CF_DISPLAY[$i]}"
  # For demo, attempt to read env variable like DEPLOY_bpvsbuckler etc.
  url_var="DEPLOY_${app^^}"  # uppercase
  url="${!url_var:-}"        # use env if exists
  if [ -n "$url" ]; then
    TABLE+="| $display | ✅ Deployed | [Preview]($url) |\n"
    TOTAL=$((TOTAL+1))
  else
    TABLE+="| $display | 🚫 Skipped | N/A |\n"
  fi
done

TABLE+="\nTotal Deployed: $TOTAL application(s)"

# Post table comment to PR if PR exists
if [ -n "$PR_URL" ]; then
  gh pr comment "$PR_URL" -b "$TABLE" >/dev/null 2>&1 || warn "Failed to post PR table comment"
fi

