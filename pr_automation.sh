#!/usr/bin/env bash
# pr_automation.sh - automated PR creation/updating (GH CLI compatible)
# Usage: ./pr_automation.sh (interactive)
# Optional env:
#   DEFAULT_BASE_BRANCH (default: gh-pages)
#   ALLOW_EMPTY_COMMIT (default: "no") -> set to "yes" to allow empty commits when nothing changed

set -o errexit
set -o pipefail
set -o nounset

# --- Config ---
TRIGGER_FILE=".pr_trigger"
BRANCH_PREFIX="feature/auto-"
DEFAULT_BASE_BRANCH="${DEFAULT_BASE_BRANCH:-gh-pages}"
ALLOW_EMPTY_COMMIT="${ALLOW_EMPTY_COMMIT:-no}"

# --- Logging ---
log()     { printf '\033[1;34m%s\033[0m\n' "$*"; }   # blue
success() { printf '\033[1;32m%s\033[0m\n' "$*"; } # green
warn()    { printf '\033[1;33m%s\033[0m\n' "$*"; } # yellow
err()     { printf '\033[1;31m%s\033[0m\n' "$*"; exit 1; } # red + exit

# --- Sanity checks ---
command -v git >/dev/null 2>&1 || err "git not found in PATH"
command -v gh  >/dev/null 2>&1 || err "GitHub CLI 'gh' not found in PATH"

git rev-parse --git-dir >/dev/null 2>&1 || err "Not inside a git repository"

CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || true)"
[ -z "$CURRENT_BRANCH" ] && err "Could not detect current branch"

# --- Helpers ---
generate_branch_name() {
    TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
    letter=$(printf "%c" $((97 + RANDOM % 26)))
    echo "${BRANCH_PREFIX}${letter}-${TIMESTAMP}"
}

determine_remote_base() {
    local preferred="$1"
    if git ls-remote --heads origin "refs/heads/${preferred}" | grep -q 'refs/heads/'; then
        echo "$preferred"
        return
    fi
    for fallback in main master; do
        if git ls-remote --heads origin "refs/heads/${fallback}" | grep -q 'refs/heads/'; then
            warn "Preferred base branch 'origin/${preferred}' not found; using '${fallback}'"
            echo "$fallback"
            return
        fi
    done
    warn "Preferred base branch 'origin/${preferred}' not found; using '${preferred}' (may fail)"
    echo "$preferred"
}

# --- Menu ---
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

# --- Git user config warning ---
if ! git config user.name >/dev/null 2>&1 || ! git config user.email >/dev/null 2>&1; then
    warn "Git user.name or user.email not set. Commits may fail."
fi

# --- Branch handling ---
if [ "$ACTION" = "CREATE" ]; then
    BRANCH_TO_USE="$(generate_branch_name)"
    log "Creating and switching to branch: $BRANCH_TO_USE"
    git checkout -b "$BRANCH_TO_USE"
else
    BRANCH_TO_USE="$CURRENT_BRANCH"
    log "Using current branch: $BRANCH_TO_USE"
fi

# --- Trigger file ---
NOW="$(date +'%Y-%m-%d %H:%M:%S')"
echo "Last run: $NOW" > "$TRIGGER_FILE"

# --- Stage all changes ---
log "Staging all changes..."
git add -A

# --- Commit ---
COMMIT_MSG="Auto-commit: $NOW - Automated PR update."
if git commit -m "$COMMIT_MSG" 2>/dev/null; then
    success "Commit created."
else
    if [ -z "$(git status --porcelain)" ]; then
        warn "Nothing to commit."
        if [ "$ALLOW_EMPTY_COMMIT" = "yes" ]; then
            log "Creating empty commit..."
            git commit --allow-empty -m "${COMMIT_MSG} (empty)"
            success "Empty commit created."
        else
            warn "No commit created and ALLOW_EMPTY_COMMIT=no. Continuing."
        fi
    else
        err "git commit failed. Hooks may have rejected it."
    fi
fi

# --- Push ---
log "Pushing branch '$BRANCH_TO_USE' to origin..."
git push -u origin "$BRANCH_TO_USE"
success "Branch pushed."

# --- Pull Request Handling ---
BASE_BRANCH="$(determine_remote_base "$DEFAULT_BASE_BRANCH")"
PR_TITLE="[Auto-PR] $COMMIT_MSG"
PR_BODY="**Automated Pull Request**\n\nTriggered: $NOW"

PR_URL=""

if [ "$ACTION" = "CREATE" ]; then
    log "Creating Pull Request: $BRANCH_TO_USE -> $BASE_BRANCH"
    PR_URL="$(gh pr create --head "$BRANCH_TO_USE" --base "$BASE_BRANCH" --title "$PR_TITLE" --body "$PR_BODY" 2>&1 | grep -Eo 'https://github.com/[^ ]+/pull/[0-9]+')"
elif [ "$ACTION" = "UPDATE" ]; then
    log "Looking for existing PR for branch '$BRANCH_TO_USE'..."
    PR_URL="$(gh pr view "$BRANCH_TO_USE" 2>&1 | grep -Eo 'https://github.com/[^ ]+/pull/[0-9]+')"
    if [ -n "$PR_URL" ]; then
        success "Found PR: $PR_URL"
        gh pr comment --body "Automated update: $NOW" "$PR_URL" >/dev/null 2>&1 || true
    else
        log "No PR found; creating one..."
        PR_URL="$(gh pr create --head "$BRANCH_TO_USE" --base "$BASE_BRANCH" --title "$PR_TITLE" --body "$PR_BODY" 2>&1 | grep -Eo 'https://github.com/[^ ]+/pull/[0-9]+')"
    fi
fi

# --- Output ---
echo "----------------------------------------------"
if [ -n "$PR_URL" ]; then
    success "🔗 Pull Request URL: $PR_URL"
    echo "Branch: $BRANCH_TO_USE"
    echo "Base:   $BASE_BRANCH"
    echo "Title:  $PR_TITLE"
else
    err "❌ Could not determine or create Pull Request URL."
    warn "Diagnostics:"
    git status --short || true
    git log --oneline "origin/$BASE_BRANCH..$BRANCH_TO_USE" || true
fi
echo "----------------------------------------------"
