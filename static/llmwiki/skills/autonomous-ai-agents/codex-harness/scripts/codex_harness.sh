#!/usr/bin/env bash
set -euo pipefail

# Codex Harness
# - runs Codex in an isolated git worktree
# - optionally runs a verification command
# - optionally pushes + opens a PR via gh
#
# Usage:
#   TASK=foo BASE=main VERIFY_CMD='npm test' CREATE_PR=1 \
#     ./codex_harness.sh -- "Do X; run tests; commit when done"

if [ "${1:-}" != "--" ]; then
  echo "usage: $0 -- <codex prompt>" >&2
  exit 2
fi
shift
PROMPT="$*"

: "${TASK:?set TASK (branch slug, e.g. fix-login)}"
BASE="${BASE:-main}"
VERIFY_CMD="${VERIFY_CMD:-}"
CREATE_PR="${CREATE_PR:-0}"
PR_TITLE="${PR_TITLE:-[codex] ${TASK}}"
PR_BODY="${PR_BODY:-Automated by codex_harness.sh}"

REPO_DIR="$(git rev-parse --show-toplevel 2>/dev/null || true)"
if [ -z "$REPO_DIR" ]; then
  echo "not in a git repo" >&2
  exit 2
fi

TS="$(date +%Y%m%d-%H%M%S)"
BRANCH="codex/${TASK}"
WT="/tmp/codex-${TASK}-${TS}"
LOG_DIR="${LOG_DIR:-$REPO_DIR/.hermes/codex-harness}"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/${TASK}-${TS}.log"

{
  echo "[codex-harness] start $(date -Is)"
  echo "repo: $REPO_DIR"
  echo "base: $BASE"
  echo "branch: $BRANCH"
  echo "worktree: $WT"
  echo "verify: ${VERIFY_CMD:-<none>}"
  echo "create_pr: $CREATE_PR"

  cd "$REPO_DIR"
  git fetch origin --prune

  # Remove any stale worktree path if re-run
  if [ -d "$WT" ]; then
    git worktree remove -f "$WT" || true
    rm -rf "$WT" || true
  fi

  # Create branch from origin/base
  git worktree add -b "$BRANCH" "$WT" "origin/$BASE"

  cd "$WT"
  echo "[codex-harness] running codex..."
  codex exec "$PROMPT"

  echo "[codex-harness] codex finished"

  if [ -n "$VERIFY_CMD" ]; then
    echo "[codex-harness] verify: $VERIFY_CMD"
    bash -lc "$VERIFY_CMD"
  fi

  echo "[codex-harness] git status"
  git status -sb

  echo "[codex-harness] pushing branch"
  git push -u origin "$BRANCH"

  if [ "$CREATE_PR" = "1" ]; then
    if command -v gh >/dev/null 2>&1; then
      echo "[codex-harness] creating PR"
      PR_URL=$(gh pr create --base "$BASE" --head "$BRANCH" --title "$PR_TITLE" --body "$PR_BODY" 2>/dev/null || true)
      if [ -n "${PR_URL:-}" ]; then
        echo "[codex-harness] PR: $PR_URL"
      else
        echo "[codex-harness] PR create: no url returned (maybe PR already exists)"
        # try to find existing
        gh pr view "$BRANCH" --json url -q .url 2>/dev/null || true
      fi
    else
      echo "[codex-harness] gh not installed; skipping PR creation" >&2
    fi
  fi

  echo "[codex-harness] done $(date -Is)"
} | tee "$LOG_FILE"

# Cleanup worktree directory only (keep branch + logs)
cd "$REPO_DIR"
git worktree remove -f "$WT" >/dev/null 2>&1 || true
rm -rf "$WT" >/dev/null 2>&1 || true
