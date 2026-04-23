#!/usr/bin/env sh
# PirateClaw — Install Script v0.0.1.24
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
VERSION="${VERSION:-0.0.1.24}"

REPO_URL="https://github.com/unclehowell/datro.git"
BRANCH="pirateclaw"
INSTALL_DIR="$HOME/pirateclaw"
SUBDIR="static/pirateclaw"
LOG_DIR="$INSTALL_DIR/logs"
PROXY_PORT=5000
DASH_PORT=8080
PARENT="https://pirateclaw.datro.xyz"

info() { printf "[pirateclaw] %s\n" "$*"; }
ok()   { printf "[ok] %s\n" "$*"; }
warn() { printf "[warn] %s\n" "$*"; }
die()  { printf "[error] %s\n" "$*"; exit 1; }

cat <<DISC

  PirateClaw v${VERSION} - Agentic A.I Hive Mind Worker

  INSTALL will:
    - Set up a local LLM proxy on port ${PROXY_PORT}
    - Launch a WebUI on port ${DASH_PORT}
    - Connect to pirateclaw.datro.xyz parent proxy
    - Fallback to local Qwen2.5-0.5B LLM if parent fails

DISC

REPLY=""
[ -n "$ACTION" ] && REPLY="$ACTION"

if [ -z "$REPLY" ]; then
  if [ -d "$INSTALL_DIR" ]; then
    printf "  [R]einstall  [U]ninstall  [Q]uit ? "
    [ ! -t 0 ] && REPLY="R" || read -r REPLY </dev/tty
  else
    printf "  [I]nstall  [Q]uit ? "
    [ ! -t 0 ] && REPLY="I" || read -r REPLY </dev/tty
  fi
fi

[ "$REPLY" = "Q" ] || [ "$REPLY" = "q" ] && exit 0
[ "$REPLY" = "U" ] || [ "$REPLY" = "u" ] && {
  info "Uninstalling..."
  pkill -f "pirateclaw.*server.py" 2>/dev/null || true
  pkill -f "llmproxy.*server.py" 2>/dev/null || true
  rm -rf "$INSTALL_DIR"
  ok "Uninstalled."
  exit 0
}
[ "$REPLY" = "R" ] || [ "$REPLY" = "r" ] && {
  info "Purging..."
  pkill -f "pirateclaw.*server.py" 2>/dev/null || true
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
else
  git clone --branch "$BRANCH" --depth 1 "$REPO_URL" "$INSTALL_DIR" --quiet
fi
ok "Installed"

mkdir -p "$LOG_DIR" "$INSTALL_DIR/subproxy/config"

info "Installing Python dependencies..."
pip install -q aiohttp pyyaml 2>/dev/null || warn "pip warnings"
ok "Python deps OK"

MACHINE_ID=$(python3 -c "import uuid; print(str(uuid.uuid4()))" 2>/dev/null || date +%s)
LOCAL_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || echo "127.0.0.1")
cat > "$INSTALL_DIR/subproxy/config/machine.json" <<EOF
{"machine_id":"$MACHINE_ID","machine_name":"$(hostname)","local_ip":"$LOCAL_IP","port":$PROXY_PORT,"version":"$VERSION"}
EOF
ok "Config written"

PROXY_SRC="$INSTALL_DIR/$SUBDIR/subproxy/server.py"
DASH_SRC="$INSTALL_DIR/$SUBDIR/dashboard/server.py"
[ -f "$PROXY_SRC" ] || die "server.py not found"
[ -f "$DASH_SRC" ] || die "dashboard not found"

nohup python3 "$PROXY_SRC" > "$LOG_DIR/subproxy.log" 2>&1 &
nohup python3 "$DASH_SRC" > "$LOG_DIR/dashboard.log" 2>&1 &

sleep 2
curl -s "http://localhost:${PROXY_PORT}/health" >/dev/null 2>&1 && ok "Proxy started on :${PROXY_PORT}" || warn "Proxy failed"
curl -s "http://localhost:${DASH_PORT}/status" >/dev/null 2>&1 && ok "Dashboard on :${DASH_PORT}" || warn "Dashboard failed"

cat <<DONE

  PirateClaw v${VERSION} installed!

  Proxy:     http://localhost:${PROXY_PORT}
  Dashboard: http://localhost:${DASH_PORT}
  Parent:    ${PARENT}

  Endpoints:
    - POST /v1/chat/completions (with fallback to local)
    - GET  /health

DONE