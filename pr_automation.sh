#!/usr/bin/env bash
# pr_automation.sh - safer automated PR creation/updating
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
DEFAULT_BASE_BRANCH="${DEFAULT_BRANCH:-gh-pages}"
ALLOW_EMPTY_COMMIT="${ALLOW_EMPTY_COMMIT:-no}"  # set to "yes" to allow empty commits automatically

log() { printf '\033[1;34m%s\033[0m\n' "$*"; }   # blue
success() { printf '\033[1;32m%s\033[0m\n' "$*"; } # green
warn() { printf '\033[1;33m%s\033[0m\n' "$*"; }    # yellow
err() { printf '\033[1;31m%s\033[0m\n' "$*"; }     # red

# --- sanity checks ---
command -v git >/dev/null 2>&1 || { err "git not found in PATH. Install git."; exit 1; }
command -v gh  >/dev/null 2>&1 || { err "GitHub CLI 'gh' not found in PATH. Install and authenticate."; exit 1; }

# Ensure we're in a git repo
if ! git rev-parse --git-dir >/dev/null 2>&1; then
  err "Not a git repository (or no .git found). cd into a repo and retry."
  exit 1
fi

# Get current branch
CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || true)"
if [ -z "$CURRENT_BRANCH" ]; then
  err "Couldn't detect current git branch."
  exit 1
fi

# generate branch name
generate_branch_name() {
  TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
  # randomized letter suffix (a..z)
  letter=$(printf "%c" $((97 + (RANDOM % 26))))
  echo "${BRANCH_PREFIX}${letter}-${TIMESTAMP}"
}

# determine sensible remote base branch (fall back if DEFAULT_BASE_BRANCH not present remote)
determine_remote_base() {
  local preferred="$1"
  # check remote branch existence
  if git ls-remote --heads origin "refs/heads/${preferred}" | grep -q 'refs/heads/' ; then
    echo "$preferred"
    return 0
  fi
  # try main/master
  for fallback in main master; do
    if git ls-remote --heads origin "refs/heads/${fallback}" | grep -q 'refs/heads/'; then
      warn "Preferred base branch 'origin/${preferred}' not found; using 'origin/${fallback}' instead."
      echo "$fallback"
      return 0
    fi
  done
  warn "Preferred base branch 'origin/${preferred}' not found and no 'main'/'master' found. Using '$preferred' locally (may fail if remote missing)."
  echo "$preferred"
  return 0
}

# interactive menu
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

# ensure git user config exists (helpful failure point)
if ! git config user.email >/dev/null 2>&1 || ! git config user.name >/dev/null 2>&1; then
  warn "Git user.name or user.email not set. Commits may fail. Set with 'git config user.name \"Your Name\"' and 'git config user.email you@example.com'."
fi

# create/update branch if requested
if [ "$ACTION" = "CREATE" ]; then
  NEW_BRANCH_NAME="$(generate_branch_name)"
  log "Creating and switching to new branch: $NEW_BRANCH_NAME"
  git checkout -b "$NEW_BRANCH_NAME"
  BRANCH_TO_USE="$NEW_BRANCH_NAME"
else
  BRANCH_TO_USE="$CURRENT_BRANCH"
  log "Using current branch: $BRANCH_TO_USE"
fi

# 1) update trigger file so there's always something to commit if desired
CURRENT_TIME="$(date +'%Y-%m-%d %H:%M:%S')"
echo "Last run: $CURRENT_TIME" > "$TRIGGER_FILE"

# 2) Stage all changes
log "Staging changes..."
git add -A

# 3) Try commit; if nothing to commit and ALLOW_EMPTY_COMMIT=yes, create empty commit
COMMIT_MESSAGE="Auto-commit: $CURRENT_TIME - Automated PR update."
if git commit -m "$COMMIT_MESSAGE"; then
  success "Commit created."
else
  # commit failed; check if it's because nothing to commit
  if git status --porcelain | grep -q '^'; then
    warn "Warning: commit returned non-zero. Check hooks or configuration."
  fi
  # detect "nothing to commit" case by checking status
  if [ -z "$(git status --porcelain)" ]; then
    warn "Nothing to commit."
    if [ "${ALLOW_EMPTY_COMMIT}" = "yes" ]; then
      log "Creating an empty commit because ALLOW_EMPTY_COMMIT=yes..."
      git commit --allow-empty -m "${COMMIT_MESSAGE} (empty)"
      success "Empty commit created."
    else
      warn "No commit created and ALLOW_EMPTY_COMMIT is not enabled. Continuing without new commit."
    fi
  else
    # There are staged/unstaged changes but commit failed (likely hook): show last commit error and exit
    err "git commit failed. Hooks may have rejected the commit. Aborting."
    # give hint and show git status
    git status --short || true
    exit 1
  fi
fi

# 4) Push
log "Pushing to remote branch 'origin/${BRANCH_TO_USE}'..."
if ! git push -u origin "$BRANCH_TO_USE"; then
  err "git push failed. Make sure remote 'origin' is reachable and you have permission."
  exit 1
fi
success "Pushed branch to origin/${BRANCH_TO_USE}."

# 5) Prepare PR creation/update
BASE_BRANCH="$(determine_remote_base "$DEFAULT_BASE_BRANCH")"
PR_TITLE="[Auto-PR] ${COMMIT_MESSAGE}"
PR_BODY="**Automated Pull Request**\n\nTriggered: ${CURRENT_TIME}"

PR_URL=""

if [ "$ACTION" = "CREATE" ]; then
  log "Creating Pull Request (head: ${BRANCH_TO_USE} -> base: ${BASE_BRANCH})..."
  # Use explicit title/body to avoid relying on gh --fill
  PR_URL="$(gh pr create --head "${BRANCH_TO_USE}" --base "${BASE_BRANCH}" --title "$PR_TITLE" --body "$PR_BODY" 2>/dev/null || true)"
  if [ -z "$PR_URL" ]; then
    # Try verbose mode to show gh error
    warn "gh pr create failed; showing gh diagnostics:"
    gh pr create --head "${BRANCH_TO_USE}" --base "${BASE_BRANCH}" --title "$PR_TITLE" --body "$PR_BODY" || true
    # After printing diagnostics, attempt to find an existing PR or fail
    PR_URL="$(gh pr view --head "${BRANCH_TO_USE}" --json url -q .url 2>/dev/null || true)"
  fi

elif [ "$ACTION" = "UPDATE" ]; then
  log "Looking for an existing PR for branch '${BRANCH_TO_USE}'..."
  PR_URL="$(gh pr view --head "${BRANCH_TO_USE}" --json url -q .url 2>/dev/null || true)"
  if [ -n "$PR_URL" ]; then
    success "Found PR: $PR_URL"
    # Optionally add a comment to indicate update
    gh pr comment --body "Automated update: ${CURRENT_TIME}" "${PR_URL}" >/dev/null 2>&1 || true
  else
    log "No existing PR found; creating one..."
    PR_URL="$(gh pr create --head "${BRANCH_TO_USE}" --base "${BASE_BRANCH}" --title "$PR_TITLE" --body "$PR_BODY" 2>/dev/null || true)"
    if [ -z "$PR_URL" ]; then
      warn "gh pr create failed; showing gh diagnostics:"
      gh pr create --head "${BRANCH_TO_USE}" --base "${BASE_BRANCH}" --title "$PR_TITLE" --body "$PR_BODY" || true
      PR_URL="$(gh pr view --head "${BRANCH_TO_USE}" --json url -q .url 2>/dev/null || true)"
    fi
  fi
fi

# 6) Output result
echo "----------------------------------------------"
if [ -n "$PR_URL" ]; then
  success "🔗 Pull Request URL: $PR_URL"
  echo
  # print short helpful info
  echo "Branch: ${BRANCH_TO_USE}"
  echo "Base:   ${BASE_BRANCH}"
  echo "Title:  ${PR_TITLE}"
else
  err "❌ Action Failed. Could not determine or create the Pull Request URL."
  warn "Useful diagnostics:"
  git status --short || true
  git log --oneline "origin/${BASE_BRANCH}..${BRANCH_TO_USE}" || true
fi
echo "----------------------------------------------"
