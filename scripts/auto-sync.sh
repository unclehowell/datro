#!/usr/bin/env bash
set -euo pipefail


REPO_DIR="${REPO_DIR:-/home/unclehowell/datro}"
LOG_FILE="/var/log/datro-auto-sync.log"
STATE_DIR="/var/lib/datro-auto-sync"
mkdir -p "$STATE_DIR"

exec >>"$LOG_FILE" 2>&1

echo "[datro-auto-sync] $(date -Is) start"

cd "$REPO_DIR"

# Determine primary upstream branch (repo HEAD)
UPSTREAM_BRANCH="$(git remote show origin | awk -F': ' '/HEAD branch/ {print $2; exit}')"
if [ -z "${UPSTREAM_BRANCH:-}" ]; then
  UPSTREAM_BRANCH="gh-pages"
fi

# Ensure we are on our working branch
WORK_BRANCH="auto-sync-ui"
if ! git show-ref --verify --quiet "refs/heads/${WORK_BRANCH}"; then
  # fallback to current branch
  WORK_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
fi

# Stash any dirty state so pulls/rebases are safe
STASHED="no"
if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "[datro-auto-sync] working tree dirty: stashing"
  git stash push -u -m "datro-auto-sync pre-sync" >/dev/null 2>&1 || true
  STASHED="yes"
fi

# Make sure we have the latest remote
# (also picks up new branches used by PR automation)
git fetch origin --prune >/dev/null 2>&1 || true

# If upstream branch exists, update work branch with it
if git show-ref --verify --quiet "refs/remotes/origin/${UPSTREAM_BRANCH}"; then
  # check out work branch
  git checkout "$WORK_BRANCH" >/dev/null 2>&1 || true

  # rebase onto origin/UPSTREAM_BRANCH to incorporate remote changes
  echo "[datro-auto-sync] rebasing ${WORK_BRANCH} onto origin/${UPSTREAM_BRANCH}"
  git pull --rebase --autostash origin "$UPSTREAM_BRANCH" >/dev/null 2>&1 || true
fi

# Auto-commit local changes if any (after rebase)
# We do NOT force-add untracked if .gitignore excludes them.
# (git add -A respects .gitignore)
git add -A
if git diff --cached --quiet; then
  echo "[datro-auto-sync] no local changes to commit"
else
  MSG="Datro auto-sync: $(date -Is)"
  echo "[datro-auto-sync] committing: $MSG"
  git commit -m "$MSG" >/dev/null 2>&1 || true
fi

# Compute ahead/behind vs origin/UPSTREAM_BRANCH
AHEAD=0
BEHIND=0
if git show-ref --verify --quiet "refs/remotes/origin/${UPSTREAM_BRANCH}"; then
  read -r BEHIND AHEAD < <(git rev-list --left-right --count "origin/${UPSTREAM_BRANCH}...HEAD" | awk '{print $1, $2}')
fi

echo "[datro-auto-sync] status vs origin/${UPSTREAM_BRANCH}: behind=${BEHIND} ahead=${AHEAD}"

# If behind (remote moved after our fetch/rebase), try another rebase
if [ "$BEHIND" -gt 0 ]; then
  echo "[datro-auto-sync] remote ahead; rebasing again"
  git pull --rebase --autostash origin "$UPSTREAM_BRANCH" >/dev/null 2>&1 || true
fi

# If ahead, create/update PR using the repo's PR script.
# Non-interactive: choose UPDATE (2) so we update a stable PR for the current work branch (auto-sync-ui).
if [ "$AHEAD" -gt 0 ]; then
  echo "[datro-auto-sync] local ahead; creating/updating PR"

  # The PR script itself will create a feature/auto-* branch rooted at origin/gh-pages
  # and will add a tiny .pr_trigger commit to ensure a PR exists.
  PR_OUT_FILE="$STATE_DIR/pr_last_output.txt"
  PR_URL_FILE="$STATE_DIR/pr_latest_url.txt"

  # Throttle PR automation: no more than once per 10 minutes.
  NOW_EPOCH="$(date +%s)"
  LAST_FILE="$STATE_DIR/last_pr_epoch"
  LAST_EPOCH="0"
  if [ -f "$LAST_FILE" ]; then
    LAST_EPOCH="$(cat "$LAST_FILE" 2>/dev/null || echo 0)"
  fi

  if [ $((NOW_EPOCH - LAST_EPOCH)) -lt 600 ]; then
    echo "[datro-auto-sync] PR throttled (last run ${LAST_EPOCH}, now ${NOW_EPOCH})"
  else
    echo "$NOW_EPOCH" > "$LAST_FILE"

    set +e
    # Non-interactive: choose UPDATE (2). Uses the current branch (auto-sync-ui) and updates/creates a PR for it.
    printf "2\n" | DEFAULT_BASE_BRANCH="$UPSTREAM_BRANCH" /usr/bin/env bash ./pr_automation.sh >"$PR_OUT_FILE" 2>&1
    RC=$?
    set -e

    # Extract PR URL (if any)
    PR_URL="$(grep -Eo 'https://github.com/[^ ]+/pull/[0-9]+' "$PR_OUT_FILE" | tail -n 1 || true)"
    if [ -n "$PR_URL" ]; then
      echo "$PR_URL" > "$PR_URL_FILE"
      echo "[datro-auto-sync] PR: $PR_URL"
    else
      echo "[datro-auto-sync] PR automation did not return a URL (rc=$RC)"
    fi
  fi

fi

# Restore stash if we stashed
if [ "$STASHED" = "yes" ]; then
  echo "[datro-auto-sync] restoring stash"
  git stash pop >/dev/null 2>&1 || true
fi

echo "[datro-auto-sync] $(date -Is) done"
exit 0
-Is) done"
exit 0
