#!/bin/bash
# sync-ui.sh - Automated sync between ~/datro/static/ui and github.com/unclehowell/datro
#
# Behaviors:
#   - If local behind remote: auto-pull, sync to web root, telegram alert
#   - If local ahead/dirty: push to auto-sync branch, create/update PR, telegram alert with PR link
#   - If equal: silent sync to web root
#
# Required env vars (in /home/ubuntu/.hermes/gateway.env):
#   TELEGRAM_BOT_TOKEN  - Telegram bot token
#   TELEGRAM_CHAT_ID    - Telegram user chat ID
#   GITHUB_TOKEN        - GitHub PAT with repo scope (for PR creation)

set -euo pipefail

REPO_DIR="/home/ubuntu/datro"
UI_SOURCE="$REPO_DIR/static/ui"
WEBROOT="/var/www/datro-ui"
PR_BRANCH="auto-sync-ui"
GITHUB_REPO="unclehowell/datro"
GITHUB_TOKEN="${GITHUB_TOKEN:-}"
TG_TOKEN="${TELEGRAM_BOT_TOKEN:-}"
TG_CHAT="${TELEGRAM_CHAT_ID:-}"

cd "$REPO_DIR"

# ── Helpers ──
notify_telegram() {
  local msg="$1"
  [ -z "$TG_TOKEN" ] || [ -z "$TG_CHAT" ] && { echo "$msg"; return; }
  curl -s -X POST "https://api.telegram.org/bot${TG_TOKEN}/sendMessage" \
    -H 'Content-Type: application/json' \
    -d "{\"chat_id\":\"${TG_CHAT}\",\"text\":\"$(echo "$msg" | sed 's/"/\\"/g' | tr '\n' '|')\",\"parse_mode\":\"HTML\"}" >/dev/null 2>&1
}

send_notification() {
  local msg="$1"
  [ -z "$TG_TOKEN" ] || [ -z "$TG_CHAT" ] && { echo "$msg"; return; }
  # Use python to properly format the message for telegram
  python3 << PYEOF
import requests, sys
try:
    r = requests.post(
        "https://api.telegram.org/bot${TG_TOKEN}/sendMessage",
        json={"chat_id": "${TG_CHAT}", "text": """$msg""", "parse_mode": "HTML"},
        timeout=10
    )
    print(f"Telegram: {r.status_code}")
except Exception as e:
    print(f"Telegram failed: {e}")
PYEOF
}

sync_to_webroot() {
  rm -rf "$WEBROOT"
  cp -a "$UI_SOURCE" "$WEBROOT"
  systemctl reload nginx >/dev/null 2>&1 || true
  echo "✅ UI synced to web root"
}

github_pr_exists() {
  [ -z "$GITHUB_TOKEN" ] && return 1
  local result
  result=$(curl -s "https://api.github.com/repos/${GITHUB_REPO}/pulls?head=unclehowell:${PR_BRANCH}&state=open" \
    -H "Authorization: Bearer ${GITHUB_TOKEN}" 2>/dev/null)
  local num
  num=$(echo "$result" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d[0]['number'] if d else '')" 2>/dev/null)
  [ -n "$num" ] && echo "$num" || return 1
}

create_github_pr() {
  [ -z "$GITHUB_TOKEN" ] && return 1
  local result
  result=$(curl -s -X POST "https://api.github.com/repos/${GITHUB_REPO}/pulls" \
    -H "Authorization: Bearer ${GITHUB_TOKEN}" \
    -H "Accept: application/vnd.github.v3+json" \
    -d '{
      "title": "🔄 Auto-sync: UI updates from local",
      "head": "'"${PR_BRANCH}"'",
      "base": "main",
      "body": "Auto-generated PR from local UI changes.\n\n**Preview**: https://command.financecheque.uk\n\nReview and merge if satisfactory."
    }' 2>/dev/null)
  local url
  url=$(echo "$result" | python3 -c "import sys,json; print(json.load(sys.stdin).get('html_url',''))" 2>/dev/null)
  [ -n "$url" ] && echo "$url" || return 1
}

# ── Main Logic ──
git fetch origin 2>/dev/null || { echo "❌ Fetch failed"; exit 1; }

ahead=$(git rev-list --count origin/main..HEAD 2>/dev/null || echo 0)
behind=$(git rev-list --count HEAD..origin/main 2>/dev/null || echo 0)
dirty=$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')

echo "State: ahead=${ahead}, behind=${behind}, dirty=${dirty}"

action_taken=false
report_lines=()

# Scenario 1: behind → auto-pull
if [ "$behind" -gt 0 ]; then
  if git pull origin main --ff-only 2>/dev/null; then
    report_lines+=("✅ Pulled ${behind} commit(s) from remote")
    action_taken=true
  else
    # FF-only failed, try regular pull
    if git pull origin main 2>/dev/null; then
      report_lines+=("✅ Pulled ${behind} commit(s) from remote (non-ff)")
      action_taken=true
    else
      report_lines+=("❌ Pull failed")
    fi
  fi
fi

# Scenario 2: ahead or dirty → push + PR
if [ "$ahead" -gt 0 ] || [ "$dirty" -gt 0 ]; then
  if [ "$dirty" -gt 0 ]; then
    git add -A
    git commit -m "ui: local changes" || true
  fi

  # Push to PR branch
  git checkout -B "$PR_BRANCH" >/dev/null 2>&1
  # Rebase PR branch onto origin/main to include any sync commits
  git fetch origin main 2>/dev/null
  git rebase origin/main 2>/dev/null && \
    git push -f origin "$PR_BRANCH" >/dev/null 2>&1 || \
    git push -f origin "$PR_BRANCH" 2>/dev/null || true

  git checkout main >/dev/null 2>&1

  report_lines+=("📤 Pushed to branch ${PR_BRANCH}")
  action_taken=true

  # Find or create PR
  pr_num=$(github_pr_exists 2>/dev/null) || pr_num=""
  if [ -n "$pr_num" ]; then
    pr_url="https://github.com/${GITHUB_REPO}/pull/${pr_num}"
    report_lines+=("🔗 PR updated: ${pr_url}")
  else
    pr_url=$(create_github_pr 2>/dev/null) || pr_url=""
    if [ -n "$pr_url" ]; then
      report_lines+=("🆕 New PR: ${pr_url}")
    else
      report_lines+=("⚠️ PR creation skipped (no GITHUB_TOKEN)")
    fi
  fi
fi

# Always sync to web root
sync_to_webroot

# Telegram notification if action taken
if [ "$action_taken" = true ]; then
  msg="<b>🔄 Datro UI Sync Report</b>\n\n"
  msg+=$(printf '%s\n' "${report_lines[@]}")
  msg+="\n\nState: ahead=${ahead}, behind=${behind}, dirty=${dirty}"
  msg+="\n\n💡 <a href='https://command.financecheque.uk'>Live preview</a>"
  send_notification "$msg"
else
  echo "✅ UI in sync with remote (${ahead} ahead, ${behind} behind, ${dirty} dirty)"
fi
