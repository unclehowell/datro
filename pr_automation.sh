#!/usr/bin/env bash
# pr_automation.sh - safer automated PR creation/updating (hardened version)
# Usage: ./pr_automation.sh
# Env vars:
#   DEFAULT_BASE_BRANCH=gh-pages
#   ALLOW_EMPTY_COMMIT=no     (set to "yes" to allow empty commits)
#   AUTO_FIX_PERMISSIONS=no   (set to "yes" to auto-chown .git/objects when possible)

set -o errexit
set -o pipefail
set -o nounset

# ─── Colors & Logging ────────────────────────────────────────────────────────
log()    { printf '\033[1;34m%s\033[0m\n' "$*"; }
success(){ printf '\033[1;32m%s\033[0m\n' "$*"; }
warn()   { printf '\033[1;33m%s\033[0m\n' "$*"; }
err()    { printf '\033[1;31m%s\033[0m\n' "$*"; exit 1; }

# ─── Config ──────────────────────────────────────────────────────────────────
TRIGGER_FILE=".pr_trigger"
BRANCH_PREFIX="feature/auto-"
DEFAULT_BASE_BRANCH="${DEFAULT_BASE_BRANCH:-gh-pages}"
ALLOW_EMPTY_COMMIT="${ALLOW_EMPTY_COMMIT:-no}"
AUTO_FIX_PERMISSIONS="${AUTO_FIX_PERMISSIONS:-no}"

# ─── Sanity Checks ───────────────────────────────────────────────────────────
command -v git >/dev/null 2>&1 || err "git not found"
command -v gh  >/dev/null 2>&1 || err "GitHub CLI 'gh' not found. Install & authenticate."

git rev-parse --git-dir >/dev/null 2>&1 || err "Not inside a git repository"

CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
[ -z "$CURRENT_BRANCH" ] && err "Cannot detect current branch"

# ─── Permission Check for .git/objects ───────────────────────────────────────
OBJECTS_DIR="$(git rev-parse --git-path objects)"
if [ -d "$OBJECTS_DIR" ] && ! [ -w "$OBJECTS_DIR" ]; then
  err "No write permission on $OBJECTS_DIR → git commit will fail"
  warn "Likely cause: repo cloned/operated on with sudo/root"
  ls -ld "$OBJECTS_DIR" || true
  if [[ "$AUTO_FIX_PERMISSIONS" == "yes" ]] && [[ -n "${USER:-}" ]]; then
    warn "Attempting automatic ownership fix (may ask for password)..."
    sudo chown -R "$USER":"$(id -gn)" "$(git rev-parse --git-dir)" || err "sudo chown failed"
    success "Ownership fixed — retry the script"
  else
    warn "Fix suggestion:"
    warn "  sudo chown -R \$USER:\$(id -gn) .git"
    warn "  # or run the whole script without sudo in the future"
    exit 2
  fi
fi

# ─── Branch Name Generation ──────────────────────────────────────────────────
generate_branch_name() {
  TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
  letter=$(printf "%c" $((97 + (RANDOM % 26))))
  echo "${BRANCH_PREFIX}${letter}-${TIMESTAMP}"
}

# ─── Remote Base Branch Detection ────────────────────────────────────────────
determine_remote_base() {
  local preferred="$1"
  if git ls-remote --heads origin "${preferred}" | grep -q "refs/heads/${preferred}"; then
    echo "$preferred"; return 0
  fi
  for fb in main master; do
    if git ls-remote --heads origin "$fb" | grep -q "refs/heads/$fb"; then
      warn "Using fallback base branch: origin/$fb"
      echo "$fb"; return 0
    fi
  done
  echo "$preferred"  # last resort
}

# ─── Interactive Menu ────────────────────────────────────────────────────────
PS3="Select action: "
select opt in "Create New Pull Request (New Branch)" "Update Existing Pull Request (Current Branch)"; do
  case $REPLY in
    1) ACTION="CREATE"; break ;;
    2) ACTION="UPDATE"; break ;;
    *) echo "Choose 1 or 2." ;;
  esac
done

# ─── Branch Handling ─────────────────────────────────────────────────────────
if [ "$ACTION" = "CREATE" ]; then
  NEW_BRANCH="$(generate_branch_name)"
  log "Creating and switching to: $NEW_BRANCH"
  git checkout -b "$NEW_BRANCH" || err "git checkout -b failed"
  BRANCH_TO_USE="$NEW_BRANCH"
else
  BRANCH_TO_USE="$CURRENT_BRANCH"
  log "Using current branch: $BRANCH_TO_USE"
fi

# ─── Always create a change (trigger file) ───────────────────────────────────
CURRENT_TIME="$(date '+%Y-%m-%d %H:%M:%S')"
echo "Last run: $CURRENT_TIME" > "$TRIGGER_FILE"

# ─── Stage everything ────────────────────────────────────────────────────────
log "Staging all changes..."
git add -A

# ─── Commit ──────────────────────────────────────────────────────────────────
COMMIT_MSG="Auto-commit: $CURRENT_TIME - Automated PR update."

if git commit -m "$COMMIT_MSG" 2>/dev/null; then
  success "Commit created."
else
  if [ -z "$(git status --porcelain)" ]; then
    warn "Nothing new to commit."
    if [ "$ALLOW_EMPTY_COMMIT" = "yes" ]; then
      log "Creating empty commit (ALLOW_EMPTY_COMMIT=yes)..."
      git commit --allow-empty -m "${COMMIT_MSG} (empty)" || err "Empty commit failed"
      success "Empty commit done."
    else
      warn "Skipping commit (ALLOW_EMPTY_COMMIT=no) → pushing current state only."
    fi
  else
    err "git commit failed (not just 'nothing to commit'). See above."
    git status --short
    exit 1
  fi
fi

# ─── Push ────────────────────────────────────────────────────────────────────
log "Pushing to origin/${BRANCH_TO_USE}..."
git push -u origin "$BRANCH_TO_USE" || err "git push failed"

success "Pushed successfully."

# ─── PR Handling ─────────────────────────────────────────────────────────────
BASE_BRANCH="$(determine_remote_base "$DEFAULT_BASE_BRANCH")"
PR_TITLE="[Auto] $COMMIT_MSG"
PR_BODY="**Automated update**\nTriggered: $CURRENT_TIME"

PR_URL=""

if [ "$ACTION" = "CREATE" ]; then
  log "Creating PR → $BRANCH_TO_USE → $BASE_BRANCH"
  PR_URL=$(gh pr create --head "$BRANCH_TO_USE" --base "$BASE_BRANCH" --title "$PR_TITLE" --body "$PR_BODY" --fill-verbose 2>/dev/null || true)
else
  PR_URL=$(gh pr view --head "$BRANCH_TO_USE" --json url -q .url 2>/dev/null || true)
  if [ -n "$PR_URL" ]; then
    success "Existing PR found: $PR_URL"
    gh pr comment "$PR_URL" -b "Automated update: $CURRENT_TIME" >/dev/null 2>&1 || true
  else
    log "No PR found → creating one"
    PR_URL=$(gh pr create --head "$BRANCH_TO_USE" --base "$BASE_BRANCH" --title "$PR_TITLE" --body "$PR_BODY" --fill-verbose 2>/dev/null || true)
  fi
fi

# ─── Final Output ────────────────────────────────────────────────────────────
echo "──────────────────────────────────────────────"
if [ -n "$PR_URL" ]; then
  success "Pull Request: $PR_URL"
  echo "Branch : $BRANCH_TO_USE"
  echo "Base   : $BASE_BRANCH"
  echo "Title  : $PR_TITLE"
else
  err "Could not create/find PR"
  warn "Diagnostics:"
  git status --short
  git log --oneline "origin/$BASE_BRANCH..$BRANCH_TO_USE" || true
fi
