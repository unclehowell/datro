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
PROJECTS_TSV="static/projects.tsv"

log()     { printf '\033[1;34m%s\033[0m\n' "$*"; }
success() { printf '\033[1;32m%s\033[0m\n' "$*"; }
warn()    { printf '\033[1;33m%s\033[0m\n' "$*"; }
err()     { printf '\033[1;31m%s\033[0m\n' "$*"; }

# --- Preview table helpers ---
build_preview_table() {
  local changed_projects=""

  # Always compare against origin/gh-pages (main) for preview eligibility
  if git ls-remote --heads origin "refs/heads/gh-pages" >/dev/null 2>&1; then
    git fetch origin gh-pages --depth=1 >/dev/null 2>&1 || true
    if git rev-parse "origin/gh-pages" >/dev/null 2>&1; then
      changed_projects="$(git diff --name-only "origin/gh-pages...HEAD" 2>/dev/null | sed -n 's#^static/\\([^/][^/]*\\)/.*#\\1#p' | sort -u)" || true
    fi
  else
    warn "origin/gh-pages not available; preview links will be omitted."
  fi

  if [ ! -f "$PROJECTS_TSV" ]; then
    warn "Missing ${PROJECTS_TSV}; preview table will list changed static projects only."
    if [ -n "$changed_projects" ]; then
      printf "| Project | Preview |\n|:--|:--|\n"
      while IFS= read -r project; do
        [ -z "$project" ] && continue
        printf "| %s | %s |\n" "$project" "https://datro.xyz/static/${project}/"
      done <<< "$changed_projects"
    else
      printf "| Project | Preview |\n|:--|:--|\n| (none) | — |\n"
    fi
    return 0
  fi

  printf "| Project | Preview |\n|:--|:--|\n"
  tail -n +2 "$PROJECTS_TSV" | while IFS=$'\t' read -r project preview repo cf_project cname; do
    [ -z "$project" ] && continue
    preview_cell="—"
    if echo "$changed_projects" | grep -qx "$project"; then
      preview_cell="$preview"
    fi
    printf "| %s | %s |\n" "$project" "$preview_cell"
  done
}

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

# --- Fix HTTP/2 issues with git fetch/push ---
git config http.version HTTP/1.1

# --- Generate branch name ---
generate_branch_name() {
  TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
  NUM=$((RANDOM % 100))
  echo "${BRANCH_PREFIX}${NUM}-${TIMESTAMP}"
}

# --- Determine remote base branch ---
determine_remote_base() {
  local preferred="$1"
  if git ls-remote --heads origin "refs/heads/${preferred}" | grep -q 'refs/heads/'; then
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

# --- Fetch latest remote state ---
log "Fetching latest remote state..."
BASE_BRANCH="$(determine_remote_base "$DEFAULT_BASE_BRANCH")"
git fetch origin "$BASE_BRANCH" || { err "Failed to fetch origin/$BASE_BRANCH. Check your connection."; exit 1; }

# --- Create or use branch ---
if [ "$ACTION" = "CREATE" ]; then
  NEW_BRANCH_NAME="$(generate_branch_name)"
  log "Creating new branch '$NEW_BRANCH_NAME' rooted at origin/${BASE_BRANCH}..."
  git checkout -b "$NEW_BRANCH_NAME" "origin/${BASE_BRANCH}"
  BRANCH_TO_USE="$NEW_BRANCH_NAME"
else
  BRANCH_TO_USE="$CURRENT_BRANCH"
  log "Using current branch: $BRANCH_TO_USE"

  # Warn if current branch has no history in common with base
  if ! git merge-base --is-ancestor "$(git merge-base HEAD "origin/${BASE_BRANCH}" 2>/dev/null || true)" HEAD 2>/dev/null; then
    warn "Current branch may not share history with origin/${BASE_BRANCH}. PR creation could fail."
  fi
fi

# --- Update trigger file to ensure something to commit ---
CURRENT_TIME="$(date +'%Y-%m-%d %H:%M:%S')"
echo "Last run: $CURRENT_TIME" > "$TRIGGER_FILE"

# --- Stage all changes ---
log "Staging changes..."
git add -A

# --- Commit changes ---
COMMIT_MESSAGE="Auto-commit: $CURRENT_TIME - Automated PR update."
if git diff --cached --quiet; then
  warn "Nothing staged to commit."
  if [ "$ALLOW_EMPTY_COMMIT" = "yes" ]; then
    log "Creating empty commit..."
    git commit --allow-empty -m "${COMMIT_MESSAGE} (empty)"
    success "Empty commit created."
  else
    warn "No commit created. Set ALLOW_EMPTY_COMMIT=yes to force an empty commit."
  fi
else
  if git commit -m "$COMMIT_MESSAGE"; then
    success "Commit created."
  else
    err "Commit failed. Check hooks/config."
    git status --short || true
    exit 1
  fi
fi

# --- Push branch ---
log "Pushing to remote branch 'origin/${BRANCH_TO_USE}'..."
git push -u origin "$BRANCH_TO_USE" || { err "Push failed. Check your connection or permissions."; exit 1; }
success "Pushed branch to origin/${BRANCH_TO_USE}."

# --- Prepare PR metadata ---
PR_TITLE="[Auto-PR] ${COMMIT_MESSAGE}"
PREVIEW_TABLE="$(build_preview_table)"
PR_BODY="**Automated Pull Request**

Triggered: ${CURRENT_TIME}
Branch: ${BRANCH_TO_USE}
Base: ${BASE_BRANCH}

**Project Previews (static/ changes)**

${PREVIEW_TABLE}"

PR_URL=""

if [ "$ACTION" = "CREATE" ]; then
  log "Creating Pull Request (head: ${BRANCH_TO_USE} -> base: ${BASE_BRANCH})..."
  PR_URL="$(gh pr create --head "${BRANCH_TO_USE}" --base "${BASE_BRANCH}" --title "$PR_TITLE" --body "$PR_BODY" 2>&1)" && true
  # Check if output looks like a URL
  if echo "$PR_URL" | grep -q 'https://github.com'; then
    PR_URL="$(echo "$PR_URL" | grep 'https://github.com' | tail -1)"
  else
    err "gh pr create output: $PR_URL"
    warn "Trying to find existing PR..."
    PR_URL="$(gh pr view "${BRANCH_TO_USE}" --json url -q .url 2>/dev/null || true)"
  fi

elif [ "$ACTION" = "UPDATE" ]; then
  log "Looking for existing PR for branch '${BRANCH_TO_USE}'..."
  PR_URL="$(gh pr view "${BRANCH_TO_USE}" --json url -q .url 2>/dev/null || true)"
  if [ -n "$PR_URL" ]; then
    success "Found PR: $PR_URL"
    gh pr edit "${BRANCH_TO_USE}" --title "$PR_TITLE" --body "$PR_BODY" >/dev/null 2>&1 || true
    gh pr comment "${BRANCH_TO_USE}" --body "Automated update: ${CURRENT_TIME}" >/dev/null 2>&1 || true
  else
    log "No existing PR found; creating new PR..."
    PR_URL="$(gh pr create --head "${BRANCH_TO_USE}" --base "${BASE_BRANCH}" --title "$PR_TITLE" --body "$PR_BODY" 2>&1)" && true
    if echo "$PR_URL" | grep -q 'https://github.com'; then
      PR_URL="$(echo "$PR_URL" | grep 'https://github.com' | tail -1)"
    else
      err "gh pr create output: $PR_URL"
      PR_URL=""
    fi
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
  warn "Run manually to see full error:"
  warn "  gh pr create --head ${BRANCH_TO_USE} --base ${BASE_BRANCH} --title \"test\" --body \"test\""
  git status --short || true
fi
echo "----------------------------------------------"
