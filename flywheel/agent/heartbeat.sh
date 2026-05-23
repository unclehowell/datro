#!/usr/bin/env bash
set -euo pipefail

# Flywheel Heartbeat — monitors health of all websites and the flywheel itself

AGENT_DIR="$(cd "$(dirname "$0")" && pwd)"
STATE_FILE="$(dirname "$AGENT_DIR")/release-state.json"
LOG_DIR="/home/ubuntu/logs"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S UTC')

check_url() {
    local url=$1 name=$2
    local code
    code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "https://$url" 2>/dev/null || echo "000")
    if [ "$code" = "000" ]; then
        echo "  DOWN  $name (https://$url) — unreachable"
        return 1
    elif [ "$code" -ge 200 ] && [ "$code" -lt 400 ]; then
        echo "  OK    $name (https://$url) — HTTP $code"
        return 0
    else
        echo "  WARN  $name (https://$url) — HTTP $code"
        return 1
    fi
}

echo "========================================"
echo " HEARTBEAT: $TIMESTAMP"
echo "========================================"
echo ""

# 1. Check flywheel state file
echo "[STATE] release-state.json"
if [ -f "$STATE_FILE" ]; then
    state=$(cat "$STATE_FILE")
    rotation=$(echo "$state" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('rotation_index','?'))" 2>/dev/null)
    echo "  rotation_index=$rotation"
else
    echo "  MISSING — no state file"
fi

# 2. Check flywheel cron
echo ""
echo "[CRON] Flywheel schedule"
if crontab -l 2>/dev/null | grep -q "multi-branch-release"; then
    echo "  Cron entry found"
    crontab -l | grep "multi-branch-release"
else
    echo "  MISSING — no cron entry"
fi

# 3. Check log freshness
echo ""
echo "[LOG] Last activity"
if [ -f "$LOG_DIR/multi-branch-release.log" ]; then
    last_line=$(tail -1 "$LOG_DIR/multi-branch-release.log" 2>/dev/null || echo "empty")
    echo "  $last_line"
else
    echo "  No log file"
fi

# 4. Check websites
echo ""
echo "[WEBSITES]"
echo "--- Primary domains ---"
check_url "datro.xyz" "DATRO Hub"
check_url "financecheque.uk" "Finance Cheque"
check_url "carfinancecheque.uk" "Car Finance"

echo "--- Subdomains ---"
check_url "bpvsbuckler.datro.xyz" "BPvBuckler"
check_url "ccan.datro.xyz" "CCAN"
check_url "ceo.datro.xyz" "CEO"
check_url "dcc.datro.xyz" "DCC"
check_url "gui.datro.xyz" "GUI"
check_url "hbnb.datro.xyz" "HBnB"
check_url "library.datro.xyz" "Library"
check_url "wave.datro.xyz" "Wave"
check_url "wayback.datro.xyz" "Wayback"
check_url "dash.financecheque.uk" "Dash"
check_url "whitepaper.financecheque.uk" "Whitepaper"
check_url "pirateclaw.pages.dev" "PirateClaw"

# 5. Check disk space
echo ""
echo "[DISK]"
df -h / | tail -1 | awk '{print "  " $4 " free on " $6}'

# 6. Check memory
echo ""
echo "[MEMORY]"
free -h | grep Mem | awk '{print "  " $4 " free"}'

echo ""
echo "========================================"
echo " HEARTBEAT COMPLETE"
echo "========================================"