#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="/home/ubuntu/datro"
LOG_FILE="/var/log/datro-auto-sync.log"
STATE_DIR="/var/lib/datro-auto-sync"
mkdir -p "$STATE_DIR"

exec >>"$LOG_FILE" 2>&1

echo "[datro-auto-sync] $(date -Is) start"

cd "$REPO_DIR"

UPSTREAM_BRANCH="$(git remote show origin | awk -F": " "/HEAD branch/ {print \$2; exit}")"
[ -z "${UPSTREAM_BRANCH:-}" ] && UPSTREAM_BRANCH="gh-pages"

WORK_BRANCH="auto-sync-ui"
if ! git show-ref --verify --quiet "refs/heads/${WORK_BRANCH}"; then
  WORK_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
fi

git config pull.rebase true
git config rebase.autoStash true

STASHED="no"
if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "[datro-auto-sync] working tree dirty: stashing"
  git stash push -u -m "datro-auto-sync pre-sync" >/dev/null 2>&1 || true
  STASHED="yes"
fi

GIT_TERMINAL_PROMPT=0 git fetch origin --prune >/dev/null 2>&1 || true
GIT_TERMINAL_PROMPT=0 git checkout "$WORK_BRANCH" >/dev/null 2>&1 || true

if git show-ref --verify --quiet "refs/remotes/origin/${UPSTREAM_BRANCH}"; then
  echo "[datro-auto-sync] rebasing ${WORK_BRANCH} onto origin/${UPSTREAM_BRANCH}"
  GIT_TERMINAL_PROMPT=0 git pull --rebase --autostash origin "$UPSTREAM_BRANCH" >/dev/null 2>&1 || true
fi

git add -A
if git diff --cached --quiet; then
  echo "[datro-auto-sync] no local changes to commit"
else
  MSG="Datro auto-sync: $(date -Is)"
  echo "[datro-auto-sync] committing: $MSG"
  git commit -m "$MSG" >/dev/null 2>&1 || true
fi

AHEAD=0
BEHIND=0
if git show-ref --verify --quiet "refs/remotes/origin/${UPSTREAM_BRANCH}"; then
  read -r BEHIND AHEAD < <(git rev-list --left-right --count "origin/${UPSTREAM_BRANCH}...HEAD" | awk "{print \$1, \$2}")
fi

echo "[datro-auto-sync] status vs origin/${UPSTREAM_BRANCH}: behind=${BEHIND} ahead=${AHEAD}"

if [ "$BEHIND" -gt 0 ]; then
  echo "[datro-auto-sync] remote ahead; rebasing again"
  GIT_TERMINAL_PROMPT=0 git pull --rebase --autostash origin "$UPSTREAM_BRANCH" >/dev/null 2>&1 || true
fi

if [ "$AHEAD" -gt 0 ]; then
  echo "[datro-auto-sync] local ahead; creating/updating PR from ${WORK_BRANCH} -> ${UPSTREAM_BRANCH}"

  PR_OUT_FILE="$STATE_DIR/pr_last_output.txt"
  PR_URL_FILE="$STATE_DIR/pr_latest_url.txt"

  set +e
  printf "2\n" | DEFAULT_BASE_BRANCH="$UPSTREAM_BRANCH" /usr/bin/env bash ./pr_automation.sh >"$PR_OUT_FILE" 2>&1
  RC=$?
  set -e

  PR_URL="$(grep -Eo "https://github.com/[^ ]+/pull/[0-9]+" "$PR_OUT_FILE" | tail -n 1 || true)"
  if [ -n "$PR_URL" ]; then
    echo "$PR_URL" > "$PR_URL_FILE"
    echo "[datro-auto-sync] PR: $PR_URL"
  else
    echo "[datro-auto-sync] PR creation did not return a URL (rc=$RC)"
  fi
fi

if [ "$STASHED" = "yes" ]; then
  echo "[datro-auto-sync] restoring stash"
  git stash pop >/dev/null 2>&1 || true
fi

echo "[datro-auto-sync] $(date -Is) done"
