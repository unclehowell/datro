#!/usr/bin/env bash
# pr_automation.sh — automated PR creation/updating (backwards-compatible GH CLI)

set -euo pipefail

# ─── Colors & Logging ────────────────────────────────────────────────────────
log()     { printf '\033[1;34m%s\033[0m\n' "$*"; }
success() { printf '\033[1;32m%s\033[0m\n' "$*"; }
warn()    { printf '\033[1;33m%s\033[0m\n' "$*"; }
err()     { printf '\033[1;31m%s\033[0m\n' "$*"; exit 1; }

# ─── Config ──────────────────────────────────────────────────────────────────
TRIGGER_FILE=".pr_trigger"
BRANCH_PREFIX="feature/auto-"
DEFAULT_BASE_BRANCH="${DEFAULT_BASE_BRANCH:-gh-pages}"
ALLOW_EMPTY_COMMIT="${ALLOW_EMPTY_COMMIT:-no}"
AUTO_FIX_PERMISSIONS="${AUTO_FIX_PERMISSIONS:-no}"

# ─── Sanity Checks ───────────────────────────────────────────────────────────
command -v git >/dev/null || err "git not found"
command -v gh  >/dev/null || err "GitHub CLI (gh) not found"
git rev-parse --git-dir >/dev/null || err "Not inside a git repo"
CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"

# ─── Permissions Check ───────────────────────────────────────────────────────
OBJECTS_DIR="$(git rev-parse --git-path objects)"
if [ -d "$OBJECTS_DIR" ] && ! [ -w "$OBJECTS_DIR" ]; then
  warn "No write permission on $OBJECTS_DIR"
  if [[ "$AUTO_FIX_PERMISSIONS" == "yes" ]]; then
    sudo chown -R "$USER":"$(id -gn)" "$(git rev-parse --git-dir)"
    success "Permissions fixed — rerun script"
    exit 0
  else
    err "Fix ownership of .git before continuing"
  fi
fi

# ─── Helpers ────────────────────────────────────────────────────────────────
generate_branch_name() {
  echo "${BRANCH_PREFIX}$(printf "%c" $((97 + RANDOM % 26)))-$(date +%Y%m%d-%H%M%S)"
}

determine_remote_base() {
  local preferred="$1"
  if git ls-remote --heads origin "$preferred" | grep -q "$preferred"; then
    echo "$preferred"; return
  fi
  for fb in main master; do
    if git ls-remote --heads origin "$fb" | grep -q "$fb"; then
      warn "Fallback base branch used: $fb"
      echo "$fb"; return
    fi
  done
  echo "$preferred"
}

# ─── Menu ───────────────────────────────────────────────────────────────────
PS3="Select action: "
select opt in \
  "Create New Pull Request (new branch)" \
  "Update Existing Pull Request (current branch)"; do
  case $REPLY in
    1) ACTION="CREATE"; break ;;
    2) ACTION="UPDATE"; break ;;
    *) echo "Choose 1 or 2" ;;
  esac
done

# ─── Branch Handling ─────────────────────────────────────────────────────────
if [ "$ACTION" = "CREATE" ]; then
  BRANCH_TO_USE="$(generate_branch_name)"
  log "Creating branch: $BRANCH_TO_USE"
  git checkout -b "$BRANCH_TO_USE"
else
  BRANCH_TO_USE="$CURRENT_BRANCH"
  log "Using current branch: $BRANCH_TO_USE"
fi

# ─── Trigger Change ──────────────────────────────────────────────────────────
NOW="$(date '+%Y-%m-%d %H:%M:%S')"
echo "Last run: $NOW" > "$TRIGGER_FILE"

# ─── Commit ──────────────────────────────────────────────────────────────────
git add -A
COMMIT_MSG="Auto-commit: $NOW"

if ! git commit -m "$COMMIT_MSG" 2>/dev/null; then
  if [ -z "$(git status --porcelain)" ]; then
    warn "Nothing to commit"
    if [ "$ALLOW_EMPTY_COMMIT" = "yes" ]; then
      git commit --allow-empty -m "$COMMIT_MSG (empty)"
      success "Empty commit created"
    fi
  else
    err "Commit failed"
  fi
else
  success "Commit created"
fi

# ─── Push ────────────────────────────────────────────────────────────────────
log "Pushing branch to origin"
git push -u origin "$BRANCH_TO_USE"
success "Push complete"

# ─── PR Handling ─────────────────────────────────────────────────────────────
BASE_BRANCH="$(determine_remote_base "$DEFAULT_BASE_BRANCH")"
log "Base branch: origin/$BASE_BRANCH"

PR_TITLE="[Auto] $COMMIT_MSG"
PR_BODY="**Automated update**\nTriggered: $NOW"

# Try to detect existing PR
PR_URL="$(gh pr view "$BRANCH_TO_USE" 2>/dev/null | grep -Eo 'https://github.com/[^ ]+/pull/[0-9]+')"

if [ -z "$PR_URL" ]; then
    log "Creating pull request (may open interactive prompt)"
    gh pr create --head "$BRANCH_TO_USE" --base "$BASE_BRANCH" --title "$PR_TITLE" --body "$PR_BODY" --fill
    echo "PR created. Visit:"
    echo "https://github.com/$(git remote get-url origin | sed -E 's#.*/(.*)\.git#\1#')/pull/new/$BRANCH_TO_USE"
else
    success "Existing PR found: $PR_URL"
    gh pr comment "$PR_URL" -b "Automated update: $NOW" >/dev/null || true
fi

# ─── Final Output ────────────────────────────────────────────────────────────
echo "──────────────────────────────────────────────"
echo "Branch : $BRANCH_TO_USE"
echo "Base   : $BASE_BRANCH"
echo "Title  : $PR_TITLE"
[ -n "${PR_URL:-}" ] && echo "PR URL : $PR_URL"
