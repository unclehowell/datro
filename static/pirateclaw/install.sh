#!/usr/bin/env sh
# PirateClaw — Install Script v0.0.1.28
# curl -fsSL https://pirateclaw.datro.xyz/install.sh | sh
set -e

ACTION="${PIRATECLAW_ACTION:-${PIRATECLAW_CMD:-}}"
for arg in "$@"; do
  case $arg in
    uninstall|remove|u) ACTION="uninstall" ;;
    reinstall|r) ACTION="reinstall" ;;
    install|i|"") ACTION="install" ;;
  esac
done

VERSION=$(curl -fsSL "https://api.github.com/repos/unclehowell/datro/tags?per_page=50" 2>/dev/null \
  | grep -oE 'pirateclaw-v0\.0\.1\.[0-9]+' | sort -t. -k4 -n | tail -1 | sed 's/pirateclaw-v//')
VERSION="${VERSION:-0.0.1.28}"

REPO_URL="https://github.com/unclehowell/datro.git"
BRANCH="pirateclaw"
INSTALL_DIR="$HOME/pirateclaw"
SUBDIR="static/pirateclaw"
LOG_DIR="$INSTALL_DIR/logs"
PROXY_PORT=6000
DASH_PORT=8080
DISCOVERY_PORT=6001
PARENT="https://pirateclaw.datro.xyz"

info() { printf "[pirateclaw-stp] %s\n" "$*"; }
ok()   { printf "[ok] %s\n" "$*"; }
warn() { printf "[warn] %s\n" "$*"; }
die()  { printf "[error] %s\n" "$*"; exit 1; }

cat <<DISC

  PirateClaw v${VERSION} - The Galaxy's Most Resilient LLM Index

  Features:
    - Download takeouts (ptor files) from the web index
    - Execute prompts directly from the dashboard
    - Connect to pirateclaw.datro.xyz parent proxy
    - Fallback to local Qwen2.5-0.5B LLM

DISC

REPLY=""
[ -n "$ACTION" ] && REPLY="$ACTION"

if [ -z "$REPLY" ]; then
  if [ -d "$INSTALL_DIR" ]; then
    printf "  [R]einstall  [U]ninstall  [Q]uit ? "
    [ ! -t 0 ] && REPLY="R" || read -r REPLY </dev/tty
  else
    curl -fsSL "https://i.postimg.cc/br5dCrjB/agent.gif" -o /tmp/pc-banner.gif
  if command -v chafa >/dev/null 2>&1 && [ -f /tmp/pc-banner.gif ]; then
    chafa --size 40x20 --color-space rgb /tmp/pc-banner.gif 2>/dev/null || cat /tmp/pc-banner.gif 2>/dev/null
    rm -f /tmp/pc-banner.gif
  fi

  printf "  [I]nstall  [U]ninstall  [Q]uit ? "
    [ ! -t 0 ] && REPLY="I" || read -r REPLY </dev/tty
  fi
fi

[ "$REPLY" = "Q" ] || [ "$REPLY" = "q" ] && exit 0
[ "$REPLY" = "U" ] || [ "$REPLY" = "u" ] && {
  info "Uninstalling..."
  pkill -f "pirateclaw.*server.py" 2>/dev/null || true
  pkill -f "pirateclaw-stp" 2>/dev/null || true
  rm -rf "$INSTALL_DIR"
  ok "Uninstalled."
  exit 0
}
[ "$REPLY" = "R" ] || [ "$REPLY" = "r" ] && {
  info "Purging..."
  pkill -f "pirateclaw.*server.py" 2>/dev/null || true
  pkill -f "pirateclaw-stp" 2>/dev/null || true
  rm -rf "$INSTALL_DIR"
}

info "Checking prerequisites..."
FREE_KB=$(df "$HOME" | awk 'NR==2{print $4}')
[ "${FREE_KB:-0}" -lt 512000 ] && die "Less than 500 MB free."
for cmd in git python3 curl; do
  command -v "$cmd" >/dev/null 2>&1 || die "$cmd required."
done
ok "Prerequisites OK"

info "Fetching v$VERSION..."
if [ -d "$INSTALL_DIR/.git" ]; then
  git -C "$INSTALL_DIR" fetch origin "$BRANCH" --quiet
  git -C "$INSTALL_DIR" reset --hard "origin/$BRANCH" --quiet
  ok "Updated"
else
  git clone --branch "$BRANCH" --depth 1 "$REPO_URL" "$INSTALL_DIR" --quiet
  ok "Cloned"
fi

mkdir -p "$LOG_DIR" "$INSTALL_DIR/subproxy/config"

info "Installing Python dependencies..."
pip install -q aiohttp pyyaml requests 2>/dev/null || warn "pip issues"
ok "Python deps OK"

LOCAL_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || echo "127.0.0.1")
MACHINE_ID=$(python3 -c "import uuid; print(str(uuid.uuid4()))" 2>/dev/null || echo "$(date +%s)")
cat > "$INSTALL_DIR/subproxy/config/machine.json" <<EOF
{
  "machine_id": "$MACHINE_ID",
  "machine_name": "$(hostname)",
  "local_ip": "$LOCAL_IP",
  "proxy_port": $PROXY_PORT,
  "discovery_port": $DISCOVERY_PORT,
  "version": "$VERSION",
  "capabilities": ["chat", "execute"],
  "stp_mode": true
}
EOF
ok "Config written"

PROXY_SRC="$INSTALL_DIR/$SUBDIR/subproxy/server.py"
DASH_SRC="$INSTALL_DIR/$SUBDIR/dashboard/server.py"
[ -f "$PROXY_SRC" ] || die "server.py not found"
[ -f "$DASH_SRC" ] || die "dashboard server.py not found"

nohup python3 "$PROXY_SRC" > "$LOG_DIR/proxy.log" 2>&1 &
nohup python3 "$DASH_SRC" > "$LOG_DIR/dashboard.log" 2>&1 &

sleep 3
curl -sf "http://localhost:${PROXY_PORT}/health" >/dev/null 2>&1 && ok "Proxy on :${PROXY_PORT}" || warn "Proxy failed"
curl -sf "http://localhost:${DASH_PORT}/" >/dev/null 2>&1 && ok "Dashboard on :${DASH_PORT}" || warn "Dashboard failed"

cat <<DONE

  PirateClaw v${VERSION} installed!

  WebUI:   http://localhost:${DASH_PORT}
  Proxy:   http://localhost:${PROXY_PORT}
  Parent:  ${PARENT}
  Logs:    ${LOG_DIR}/

DONE