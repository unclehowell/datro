#!/usr/bin/env sh
# PirateClaw — Install Script v0.0.1.29
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
VERSION="${VERSION:-0.0.1.29}"

REPO_URL="https://github.com/unclehowell/datro.git"
BRANCH="pirateclaw"
INSTALL_DIR="$HOME/pirateclaw"
SUBDIR="static/pirateclaw"
LOG_DIR="$INSTALL_DIR/logs"
PROXY_PORT=6000
DASH_PORT=8080
PARENT="https://pirateclaw.datro.xyz"

info() { printf "[pirateclaw] %s\n" "$*"; }
ok()   { printf "[ok] %s\n" "$*"; }
warn() { printf "[warn] %s\n" "$*"; }
die()  { printf "[error] %s\n" "$*"; exit 1; }

AVATAR_URL="https://i.postimg.cc/br5dCrjB/agent.gif"
AVATAR_TMP="/tmp/pc-agent.gif"

info "Downloading PirateClaw v${VERSION}..."
if command -v chafa >/dev/null 2>&1; then
  if curl -fsSL "$AVATAR_URL" -o "$AVATAR_TMP" 2>/dev/null; then
    chafa --size 40x20 --color-space rgb --symbols all+extra --dither ordered "$AVATAR_TMP" 2>/dev/null || true
    rm -f "$AVATAR_TMP"
  fi
fi

cat <<DISC

  PirateClaw v${VERSION} - The Galaxy's Most Resilient LLM Index

  FEATURES:
    - Download takeouts (ptor's) from pirateclaw.datro.xyz
    - Execute prompts directly from the dashboard
    - Connect to parent proxy at pirateclaw.datro.xyz
    - Fallback to local Qwen2.5-0.5B LLM

  INSTALL will:
    - Set up local LLM proxy on :${PROXY_PORT}
    - Launch WebUI on :${DASH_PORT}
    - Connect to pirateclaw.datro.xyz parent

DISC

REPLY=""
[ -n "$ACTION" ] && REPLY="$ACTION"

if [ -z "$REPLY" ]; then
  if [ -d "$INSTALL_DIR" ]; then
    INSTALLED_VER=$(cat "$INSTALL_DIR/$SUBDIR/version.json" 2>/dev/null | python3 -c "import json,sys; print(json.load(sys.stdin).get('version','unknown'))" 2>/dev/null || echo "unknown")
    printf "  Existing install detected (v%s)\n\n" "$INSTALLED_VER"
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
  pkill -f "pirateclaw-stp" 2>/dev/null || true
  rm -rf "$INSTALL_DIR"
  ok "Uninstalled."
  exit 0
}
[ "$REPLY" = "R" ] || [ "$REPLY" = "r" ] && {
  info "Reinstalling..."
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
{"machine_id":"$MACHINE_ID","machine_name":"$(hostname)","local_ip":"$LOCAL_IP","port":$PROXY_PORT,"version":"$VERSION"}
EOF
ok "Config written"

PROXY_SRC="$INSTALL_DIR/$SUBDIR/subproxy/server.py"
DASH_SRC="$INSTALL_DIR/$SUBDIR/dashboard/server.py"
[ -f "$PROXY_SRC" ] || die "server.py not found"
[ -f "$DASH_SRC" ] || die "dashboard not found"

nohup python3 "$PROXY_SRC" > "$LOG_DIR/proxy.log" 2>&1 &
nohup python3 "$DASH_SRC" > "$LOG_DIR/dashboard.log" 2>&1 &

sleep 3
curl -sf "http://localhost:${PROXY_PORT}/health" >/dev/null 2>&1 && ok "Proxy on :${PROXY_PORT}" || warn "Proxy failed"
curl -sf "http://localhost:${DASH_PORT}/" >/dev/null 2>&1 && ok "WebUI on :${DASH_PORT}" || warn "WebUI failed"

echo ""
echo "  ==============================================="
echo "  PirateClaw v${VERSION} installed!"
echo "  ==============================================="
echo ""
echo "  WebUI:    http://localhost:${DASH_PORT}"
echo "  Proxy:   http://localhost:${PROXY_PORT}"
echo "  Parent:  ${PARENT}"
echo "  Logs:    ${LOG_DIR}/"
echo ""
echo "  ==============================================="
echo ""

HERMES_UPDATE=""
printf "  Update Hermes Agent to latest? [Y/n] ? "
[ ! -t 0 ] && HERMES_UPDATE="Y" || read -r HERMES_UPDATE </dev/tty
if [ "$HERMES_UPDATE" != "n" ] && [ "$HERMES_UPDATE" != "N" ]; then
  info "Updating Hermes Agent..."
  curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash 2>/dev/null || warn "Hermes update failed"
  ok "Hermes updated"
  printf "  Configure Hermes endpoint? [Y/n] ? "
  [ ! -t 0 ] && READ="Y" || read -r READ </dev/tty
  if [ "$READ" != "n" ] && [ "$READ" != "N" ]; then
    hermes setup
  fi
fi

( xdg-open "http://localhost:${DASH_PORT}" 2>/dev/null || open "http://localhost:${DASH_PORT}" 2>/dev/null ) &