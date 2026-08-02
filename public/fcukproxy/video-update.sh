#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# FinanceCheque Child Proxy — Video Library Updater
#
# Pulls the latest scene/object video engine from the financecheque branch and
# restarts the local agent so new scenes benefit this device immediately.
# A rerelease of the financecheque branch means every child proxy can run this
# (or re-run the installer) to receive the updated library simultaneously.
#
#   curl -fsSL https://www.financecheque.uk/fcukproxy/video-update.sh | bash
#   # or run on the device:  bash ~/.fcukproxy/video-update.sh
# ═══════════════════════════════════════════════════════════════════════════════
set -euo pipefail

INSTALL_DIR="${INSTALL_DIR:-$HOME/.fcukproxy}"
REPO="unclehowell/datro"
BRANCH="${BRANCH:-financecheque}"
RAW="https://raw.githubusercontent.com/$REPO/$BRANCH"
PROXY_PORT="${PROXY_PORT:-6000}"

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; CYAN='\033[0;36m'; NC='\033[0m'
info() { echo -e "${CYAN}[video-update]${NC} $*"; }
ok()   { echo -e "${GREEN}[video-update] ✓${NC} $*"; }
warn() { echo -e "${YELLOW}[video-update] !${NC} $*"; }

if [[ -f "$INSTALL_DIR/phone_video.py" ]]; then
  OLD_VER=$(md5sum "$INSTALL_DIR/phone_video.py" 2>/dev/null | awk '{print $1}' || echo "?")
else
  OLD_VER="none"
  info "No existing library found — downloading first copy."
fi

info "Downloading video library from $BRANCH branch..."
curl -fsSL "$RAW/public/fcukproxy/phone_video.py" -o "$INSTALL_DIR/phone_video.py.new"

NEW_VER=$(md5sum "$INSTALL_DIR/phone_video.py.new" | awk '{print $1}')

if [[ "$OLD_VER" == "$NEW_VER" ]]; then
  rm -f "$INSTALL_DIR/phone_video.py.new"
  ok "Video library is already up to date."
else
  mv "$INSTALL_DIR/phone_video.py.new" "$INSTALL_DIR/phone_video.py"
  ok "Video library updated (md5 $OLD_VER → $NEW_VER)."

  info "Restarting local agent to load the new engine..."
  pkill -f "python.*agent.py.*$PROXY_PORT" 2>/dev/null || true
  sleep 1
  if command -v pm2 >/dev/null 2>&1 && pm2 jlist >/dev/null 2>&1 && pm2 describe fcuk-proxy >/dev/null 2>&1; then
    nohup pm2 start "$INSTALL_DIR/agent.py" --name fcuk-proxy --interpreter python3 -- --port "$PROXY_PORT" >/dev/null 2>&1 &
    pm2 save >/dev/null 2>&1 || true
  elif command -v systemctl >/dev/null 2>&1 && systemctl --user list-units fcuk-proxy >/dev/null 2>&1; then
    systemctl --user restart fcuk-proxy 2>/dev/null || true
  else
    nohup python3 "$INSTALL_DIR/agent.py" --port "$PROXY_PORT" \
      > "$INSTALL_DIR/agent.log" 2>&1 &
    echo $! > "$INSTALL_DIR/agent.pid"
  fi
  warn "Agent restarted — wait ~5s, then verify: curl -s http://127.0.0.1:$PROXY_PORT/health"
fi

echo ""
info "New scenes ship with each financecheque release. To update ALL child proxies,"
info "run this updater on each device (or re-run the installer)."
