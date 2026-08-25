#!/bin/bash
set -euo pipefail

# ═══════════════════════════════════════════════════════════════════════════════
# verify-parity.sh — UX parity verification
# ═══════════════════════════════════════════════════════════════════════════════
#
# Runs on each device. Checks:
#   1. Version matches expected (from GitHub .version file)
#   2. GUI is responding on port 3000
#   3. API returns valid JSON with expected keys
#   4. Services are alive (agent, child-proxy, GUI)
#   5. No recent errors in GUI log
#
# Exit 0 = all checks pass
# Exit 1 = one or more checks failed (issue file written for healer)
#
# Usage:
#   bash scripts/verify-parity.sh [laptop|phone]
# ═══════════════════════════════════════════════════════════════════════════════

DEVICE="${1:-$(hostname)}"
ISSUE_DIR="$HOME/.fcukproxy/parity-issues"
ISSUE_FILE="$ISSUE_DIR/$DEVICE-$(date +%Y%m%d-%H%M%S).json"
LOG_FILE="$HOME/.fcukproxy/logs/parity.log"
GUI_PORT=3000
AGENT_PORT=6100
CHILD_PORT=4001

mkdir -p "$(dirname "$LOG_FILE")" "$ISSUE_DIR"

ISSUES=()

log() {
  echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] [$DEVICE] $*" | tee -a "$LOG_FILE"
}

issue() {
  local check="$1" detail="$2"
  ISSUES+=("{\"check\":\"$check\",\"detail\":\"$detail\"}")
  log "FAIL: $check — $detail"
}

# ── Check 1: Version ──
EXPECTED_VERSION=$(curl -sf --max-time 10 "https://raw.githubusercontent.com/unclehowell/datro/financecheque/.version" 2>/dev/null | tr -d '[:space:]' || echo "unknown")
LOCAL_VERSION=$(cat "$HOME/.fcukproxy/.local-version" 2>/dev/null | tr -d '[:space:]' || echo "none")

if [[ "$LOCAL_VERSION" == "unknown" || "$LOCAL_VERSION" == "none" ]]; then
  issue "version" "local-version file missing or empty"
elif [[ "$EXPECTED_VERSION" != "unknown" && "$LOCAL_VERSION" != "$EXPECTED_VERSION" ]]; then
  issue "version" "local=$LOCAL_VERSION expected=$EXPECTED_VERSION"
else
  log "OK: version $LOCAL_VERSION"
fi

# ── Check 2: GUI responding ──
GUI_HTML=$(curl -sf --max-time 5 "http://127.0.0.1:$GUI_PORT/" 2>/dev/null || echo "")
if [[ -z "$GUI_HTML" ]]; then
  issue "gui_responding" "port $GUI_PORT not responding"
elif ! echo "$GUI_HTML" | grep -q "AgentOS"; then
  issue "gui_responding" "port $GUI_PORT responding but no AgentOS content"
else
  log "OK: GUI responding on :$GUI_PORT"
fi

# ── Check 3: API returns valid JSON ──
API_JSON=$(curl -sf --max-time 5 "http://127.0.0.1:$GUI_PORT/api/version" 2>/dev/null || echo "")
if [[ -z "$API_JSON" ]]; then
  issue "api_health" "/api/version not responding"
elif ! echo "$API_JSON" | python3 -c "import sys,json; d=json.load(sys.stdin); assert 'local' in d and 'remote' in d" 2>/dev/null; then
  issue "api_health" "/api/version returned invalid JSON: ${API_JSON:0:100}"
else
  log "OK: /api/version healthy"
fi

# ── Check 4: Agent service ──
if curl -sf --max-time 3 "http://127.0.0.1:$AGENT_PORT/health" >/dev/null 2>&1; then
  log "OK: agent on :$AGENT_PORT"
elif curl -sf --max-time 3 "http://127.0.0.1:$AGENT_PORT/v1/models" >/dev/null 2>&1; then
  log "OK: agent on :$AGENT_PORT"
else
  issue "agent_service" "agent not responding on port $AGENT_PORT"
fi

# ── Check 5: Child proxy ──
if curl -sf --max-time 3 "http://127.0.0.1:$CHILD_PORT/health" >/dev/null 2>&1; then
  log "OK: child-proxy on :$CHILD_PORT"
else
  issue "child_proxy" "child-proxy not responding on port $CHILD_PORT"
fi

# ── Check 6: Recent errors in GUI log ──
GUI_LOG="$HOME/.fcukproxy/agentos-gui/gui.log"
if [[ -f "$GUI_LOG" ]]; then
  RECENT_ERRORS=$(tail -50 "$GUI_LOG" 2>/dev/null | grep -ic "error" || echo 0)
  if [[ "$RECENT_ERRORS" -gt 10 ]]; then
    issue "gui_errors" "high error count in gui.log: $RECENT_ERRORS errors in last 50 lines"
  else
    log "OK: gui.log error count normal ($RECENT_ERRORS in last 50 lines)"
  fi
fi

# ── Check 7: Service processes ──
PROCS_OK=true
if command -v pgrep >/dev/null 2>&1; then
  if ! pgrep -f "agent.py.*$AGENT_PORT" >/dev/null 2>&1 && \
     ! pgrep -f "fcuk-proxy" >/dev/null 2>&1; then
    issue "agent_process" "no agent.py process found"
    PROCS_OK=false
  fi
  if ! pgrep -f "child-proxy.mjs" >/dev/null 2>&1; then
    issue "child_process" "no child-proxy.mjs process found"
    PROCS_OK=false
  fi
  if $PROCS_OK; then
    log "OK: critical processes running"
  fi
fi

# ── Write issues file if any ──
if [[ ${#ISSUES[@]} -gt 0 ]]; then
  ISSUES_JSON=$(printf '%s\n' "${ISSUES[@]}" | python3 -c "
import sys, json
items = [json.loads(line) for line in sys.stdin if line.strip()]
print(json.dumps({'device': '$DEVICE', 'timestamp': '$(date -u +%Y-%m-%dT%H:%M:%SZ)', 'issues': items}))
")
  echo "$ISSUES_JSON" > "$ISSUE_FILE"
  log "Wrote issue file: $ISSUE_FILE"
  exit 1
else
  log "All checks passed"
  # Clean old issue files (older than 1 hour)
  find "$ISSUE_DIR" -name "$DEVICE-*.json" -mmin +60 -delete 2>/dev/null || true
  exit 0
fi
