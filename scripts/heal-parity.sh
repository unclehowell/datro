#!/bin/bash
set -euo pipefail

# ═══════════════════════════════════════════════════════════════════════════════
# heal-parity.sh — Auto-healing for UX parity issues
# ═══════════════════════════════════════════════════════════════════════════════
#
# Runs on the laptop (has git repo + gh CLI). Reads parity issue files
# from ~/.fcukproxy/parity-issues/ and attempts to fix them.
#
# Fix strategies:
#   version mismatch    → trigger update-checker on the device
#   gui_responding      → restart GUI service (systemd or nohup)
#   agent_service       → restart agent process
#   child_proxy         → restart child-proxy service
#   gui_errors          → check logs, rebuild if needed
#   agent_process       → restart agent
#   child_process       → restart child-proxy
#
# If a fix involves source code (not just restart), creates a hotfix release.
#
# Usage:
#   bash scripts/heal-parity.sh
# ═══════════════════════════════════════════════════════════════════════════════

ISSUE_DIR="$HOME/.fcukproxy/parity-issues"
LOG_FILE="$HOME/.fcukproxy/logs/healer.log"
DATRO_DIR="${DATRO_DIR:-$(cd "$(dirname "$0")/.." && pwd)}"
PHONE_SSH="ssh -o BatchMode=yes -o ConnectTimeout=5 -p 8022 192.168.1.59"

mkdir -p "$(dirname "$LOG_FILE")"

log() {
  echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] [healer] $*"
  echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] [healer] $*" >> "$LOG_FILE"
}

# ── Process issue files ──
if [[ ! -d "$ISSUE_DIR" ]] || [[ -z "$(ls "$ISSUE_DIR"/*.json 2>/dev/null)" ]]; then
  log "No parity issues found"
  exit 0
fi

for issue_file in "$ISSUE_DIR"/*.json; do
  [[ ! -f "$issue_file" ]] && continue

  DEVICE=$(python3 -c "import json; d=json.load(open('$issue_file')); print(d.get('device','unknown'))" 2>/dev/null || echo "unknown")
  TIMESTAMP=$(python3 -c "import json; d=json.load(open('$issue_file')); print(d.get('timestamp',''))" 2>/dev/null || echo "")

  log "Processing issues for $DEVICE (from $TIMESTAMP)"

  # Read each issue and attempt fix
  python3 -c "
import json, sys

with open('$issue_file') as f:
    data = json.load(f)

for issue in data.get('issues', []):
    check = issue.get('check', '')
    detail = issue.get('detail', '')
    print(f'{check}|{detail}')
" 2>/dev/null | while IFS='|' read -r CHECK DETAIL; do

    case "$CHECK" in
      version)
        log "FIX: version mismatch on $DEVICE — triggering update-checker"
        if [[ "$DEVICE" == "phone" ]]; then
          $PHONE_SSH '~/.fcukproxy/update-checker.sh >> ~/.fcukproxy/logs/ota-update.log 2>&1' 2>/dev/null || \
            log "WARN: Could not reach phone for version update"
        else
          SKIP_REBUILD=1 "$HOME/.fcukproxy/update-checker.sh" >> "$LOG_FILE" 2>&1 || \
            log "WARN: update-checker failed on laptop"
        fi
        ;;

      gui_responding|gui_errors)
        log "FIX: GUI issue on $DEVICE ($DETAIL)"
        if [[ "$DEVICE" == "laptop" || "$DEVICE" == "$(hostname)" ]]; then
          # Try systemd first
          if systemctl --user is-active agentos-gui >/dev/null 2>&1; then
            systemctl --user restart agentos-gui 2>/dev/null && log "  Restarted agentos-gui via systemd"
          else
            # Kill and restart via nohup
            pkill -f "next start.*3000" 2>/dev/null || true
            sleep 2
            cd "$HOME/.fcukproxy/agentos-gui"
            nohup ./node_modules/.bin/next start -p 3000 -H 0.0.0.0 >> gui.log 2>&1 &
            log "  Restarted GUI via nohup (PID: $!)"
          fi
        else
          $PHONE_SSH "pkill -f 'next start.*3000'; sleep 2; cd ~/.fcukproxy/agentos-gui && nohup ./node_modules/.bin/next start -p 3000 -H 0.0.0.0 >> gui.log 2>&1 &" 2>/dev/null || \
            log "WARN: Could not restart GUI on phone"
        fi
        ;;

      agent_service|agent_process)
        log "FIX: Agent issue on $DEVICE ($DETAIL)"
        if [[ "$DEVICE" == "laptop" || "$DEVICE" == "$(hostname)" ]]; then
          if systemctl --user is-active fcuk-proxy >/dev/null 2>&1; then
            systemctl --user restart fcuk-proxy 2>/dev/null && log "  Restarted fcuk-proxy via systemd"
          else
            pkill -f "agent.py" 2>/dev/null || true
            sleep 1
            nohup python3 "$HOME/.fcukproxy/agent.py" --port 6100 >> "$HOME/.fcukproxy/agent.log" 2>&1 &
            log "  Restarted agent.py via nohup"
          fi
        else
          $PHONE_SSH "sv restart fcuk-proxy 2>/dev/null || (pkill -f 'agent.py'; sleep 1; cd ~/.fcukproxy && nohup python3 agent.py --port 6100 >> agent.log 2>&1 &)" 2>/dev/null || \
            log "WARN: Could not restart agent on phone"
        fi
        ;;

      child_proxy|child_process)
        log "FIX: Child-proxy issue on $DEVICE ($DETAIL)"
        if [[ "$DEVICE" == "laptop" || "$DEVICE" == "$(hostname)" ]]; then
          if systemctl --user is-active fcukproxy-child >/dev/null 2>&1; then
            systemctl --user restart fcukproxy-child 2>/dev/null && log "  Restarted fcukproxy-child via systemd"
          else
            pkill -f "child-proxy.mjs" 2>/dev/null || true
            sleep 1
            nohup "$HOME/.local/node/bin/node" "$HOME/.fcukproxy/child-proxy.mjs" >> "$HOME/.fcukproxy/child-proxy.log" 2>&1 &
            log "  Restarted child-proxy.mjs via nohup"
          fi
        else
          $PHONE_SSH "sv restart fcukproxy-child 2>/dev/null || (pkill -f 'child-proxy.mjs'; sleep 1; cd ~/.fcukproxy && nohup node child-proxy.mjs >> child-proxy.log 2>&1 &)" 2>/dev/null || \
            log "WARN: Could not restart child-proxy on phone"
        fi
        ;;

      *)
        log "UNKNOWN check: $CHECK — $DETAIL"
        ;;
    esac
  done

  # Remove processed issue file
  rm -f "$issue_file"
  log "Processed and removed $issue_file"
done

log "Healer pass complete"
