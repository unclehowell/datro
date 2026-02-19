#!/usr/bin/env bash
# pr_automation.sh - safer automated PR creation/updating, compatible with _dcc workflow
# Usage: ./pr_automation.sh   (interactive)
# Optional env:
#   DEFAULT_BASE_BRANCH (default: gh-pages)
#   ALLOW_EMPTY_COMMIT (default: "no") -> set to "yes" to auto-create empty commits when nothing changed

set -o errexit
set -o pipefail
set -o nounset

# --- Configuration ---
TRIGGER_FILE=".pr_trigger"
BRANCH_PREFIX="feature/auto-"
DEFAULT_BASE_BRANCH="${DEFAULT_BASE_BRANCH:-gh-pages}"
ALLOW_EMPTY_COMMIT="${ALLOW_EMPTY_COMMIT:-no}"

log() { printf '\033[1;34m%s\033[0m\n' "$*"; }
success() { printf '\033[1;32m%s\033[0m\n' "$*"; }
warn() { printf '\033[1;33m%s\033[0m\n' "$*"; }
err() { printf '\033[1;31m%s\033[0m\n' "$*"; }

# --- Sanity checks ---
command -v git >/dev/null 2>&1 || { err "git not found in PATH"; exit 1; }
command -v gh  >/dev/null 2>&1 || { err "GitHub CLI 'gh' not found"; exit 1; }

if ! git rev-parse --git-dir >/dev/null 2>&1; then
  err "Not a git repository."
  exit 1
fi

CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || true)"
if [ -z "$CURRENT_BRANCH" ]; then
  err "Couldn't detect current branch."
  exit 1
fi

# --- Generate branch name ---
generate_branch_name() {
  TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
  letter=$(printf "%c" $((97 + (RANDOM % 26))))
  echo "${BRANCH_PREFIX}${letter}-${TIMESTAMP}"
}

# --- Determine remote base branch ---
determine_remote_base() {
  local preferred="$1"
  if git ls-remote --heads origin "refs/heads/${preferred}" | grep -q 'refs/heads/' ; then
    echo "$preferred"
    return 0
  fi
  for fallback in main master; do
    if git ls-remote --heads origin "refs/heads/${fallback}" | grep -q 'refs/heads/'; then
      warn "Preferred base branch '$preferred' not found; using '$fallback'"
      echo "$fallback"
      return 0
    fi
  done
  warn "Using local '$preferred' as base branch"
  echo "$preferred"
}

# --- Interactive menu ---
PS3="Select action: "
options=("Create New Pull Request (New Branch)" "Update Existing Pull Request (Current Branch)")
echo
select opt in "${options[@]}"; do
  case $REPLY in
    1) ACTION="CREATE"; break;;
    2) ACTION="UPDATE"; break;;
    *) echo "Invalid option. Choose 1 or 2.";;
  esac
done

# --- Ensure git user config exists ---
if ! git config user.email >/dev/null 2>&1 || ! git config user.name >/dev/null 2>&1; then
  warn "Git user.name or user.email not set. Commits may fail."
fi

# --- Create or use branch ---
if [ "$ACTION" = "CREATE" ]; then
  NEW_BRANCH_NAME="$(generate_branch_name)"
  log "Creating and switching to new branch: $NEW_BRANCH_NAME"
  git checkout -b "$NEW_BRANCH_NAME"
  BRANCH_TO_USE="$NEW_BRANCH_NAME"
else
  BRANCH_TO_USE="$CURRENT_BRANCH"
  log "Using current branch: $BRANCH_TO_USE"
fi

# --- Update trigger file to ensure something to commit ---
CURRENT_TIME="$(date +'%Y-%m-%d %H:%M:%S')"
echo "Last run: $CURRENT_TIME" > "$TRIGGER_FILE"

# --- Stage all changes ---
log "Staging changes..."
git add -A

# --- Commit changes ---
COMMIT_MESSAGE="Auto-commit: $CURRENT_TIME - Automated PR update."
if git commit -m "$COMMIT_MESSAGE"; then
  success "Commit created."
else
  if [ -z "$(git status --porcelain)" ]; then
    warn "Nothing to commit."
    if [ "$ALLOW_EMPTY_COMMIT" = "yes" ]; then
      log "Creating empty commit..."
      git commit --allow-empty -m "${COMMIT_MESSAGE} (empty)"
      success "Empty commit created."
    else
      warn "No commit created and ALLOW_EMPTY_COMMIT not enabled."
    fi
  else
    err "Commit failed. Check hooks/config."
    git status --short || true
    exit 1
  fi
fi

# --- Push branch ---
log "Pushing to remote branch 'origin/${BRANCH_TO_USE}'..."
git push -u origin "$BRANCH_TO_USE"
success "Pushed branch to origin/${BRANCH_TO_USE}."

# --- Prepare PR ---
BASE_BRANCH="$(determine_remote_base "$DEFAULT_BASE_BRANCH")"
PR_TITLE="[Auto-PR] ${COMMIT_MESSAGE}"
PR_BODY="**Automated Pull Request**\n\nTriggered: ${CURRENT_TIME}"

PR_URL=""
if [ "$ACTION" = "CREATE" ]; then
  log "Creating Pull Request (head: ${BRANCH_TO_USE} -> base: ${BASE_BRANCH})..."
  PR_URL="$(gh pr create --head "${BRANCH_TO_USE}" --base "${BASE_BRANCH}" --title "$PR_TITLE" --body "$PR_BODY" 2>/dev/null || true)"
  if [ -z "$PR_URL" ]; then
    warn "gh pr create failed, trying to detect existing PR..."
    PR_URL="$(gh pr view --head "${BRANCH_TO_USE}" --json url -q .url 2>/dev/null || true)"
  fi
elif [ "$ACTION" = "UPDATE" ]; then
  log "Looking for existing PR for branch '${BRANCH_TO_USE}'..."
  PR_URL="$(gh pr view --head "${BRANCH_TO_USE}" --json url -q .url 2>/dev/null || true)"
  if [ -n "$PR_URL" ]; then
    success "Found PR: $PR_URL"
    gh pr comment --body "Automated update: ${CURRENT_TIME}" "${PR_URL}" >/dev/null 2>&1 || true
  else
    log "No existing PR found; creating..."
    PR_URL="$(gh pr create --head "${BRANCH_TO_USE}" --base "${BASE_BRANCH}" --title "$PR_TITLE" --body "$PR_BODY" 2>/dev/null || true)"
  fi
fi

# --- Output ---
echo "----------------------------------------------"
if [ -n "$PR_URL" ]; then
  success "🔗 Pull Request URL: $PR_URL"
  echo
  echo "Branch: ${BRANCH_TO_USE}"
  echo "Base:   ${BASE_BRANCH}"
  echo "Title:  ${PR_TITLE}"
else
  err "❌ Action Failed. Could not determine or create PR URL."
  git status --short || true
fi
echo "----------------------------------------------"

