#!/usr/bin/env sh
# PirateClaw — Unified Agent Stack Installer
# curl -fsSL https://pirateclaw.datro.xyz/install.sh | sh
set -eu

ACTION="${PIRATECLAW_ACTION:-${PIRATECLAW_CMD:-}}"
for arg in "$@"; do
  case "$arg" in
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
PROXY_PORT="${PROXY_PORT:-6000}"
DASH_PORT="${DASH_PORT:-8080}"
ARCHON_PORT="${ARCHON_PORT:-3090}"
DISCOVERY_PORT="${DISCOVERY_PORT:-6001}"
PARENT="${PARENT_PROXY:-https://pirateclaw.datro.xyz}"

info() { printf "[pirateclaw] %s\n" "$*"; }
ok()   { printf "[ok] %s\n" "$*"; }
warn() { printf "[warn] %s\n" "$*"; }
die()  { printf "[error] %s\n" "$*"; exit 1; }

has_cmd() { command -v "$1" >/dev/null 2>&1; }

run_remote_installer() {
  name="$1"
  url="$2"
  if curl -fsSL "$url" | bash >/dev/null 2>&1; then
    ok "$name installed"
  else
    warn "$name installer failed from $url"
    return 1
  fi
}

ensure_path_line() {
  profile="$1"
  line="$2"
  [ -f "$profile" ] || touch "$profile"
  grep -F "$line" "$profile" >/dev/null 2>&1 || printf "\n%s\n" "$line" >> "$profile"
}

stop_services() {
  pkill -f "pirateclaw.*/subproxy/server.py" 2>/dev/null || true
  pkill -f "pirateclaw.*/dashboard/server.py" 2>/dev/null || true
  pkill -f "^archon serve" 2>/dev/null || true
}

print_banner() {
cat <<DISC

  ╔═══════════════════════════════════════════════════════╗
  ║  PirateClaw v${VERSION} Unified Installer              ║
  ║  Includes: Proxy + Web UI + Kiro + Hermes + Archon   ║
  ╚═══════════════════════════════════════════════════════╝

  This installer will:
    ✓ Install PirateClaw localhost proxy
    ✓ Install PirateClaw dashboard web UI
    ✓ Install Kiro CLI
    ✓ Install Hermes Agent
    ✓ Install Archon CLI + Archon Web UI service
    ✓ Configure Hermes MCP to include Archon

DISC
}

print_banner

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
  info "Uninstalling PirateClaw services and local config..."
  stop_services
  rm -rf "$INSTALL_DIR"
  ok "Uninstalled PirateClaw local files from $INSTALL_DIR"
  cat <<TXT

Other globally-installed tools were left in place:
  - Kiro CLI
  - Hermes Agent
  - Archon CLI

TXT
  exit 0
}
[ "$REPLY" = "R" ] || [ "$REPLY" = "r" ] && {
  info "Reinstall requested - purging local install dir"
  stop_services
  rm -rf "$INSTALL_DIR"
}

info "Checking prerequisites..."
FREE_KB=$(df "$HOME" | awk 'NR==2{print $4}')
[ "${FREE_KB:-0}" -lt 512000 ] && die "Less than 500 MB free."
for cmd in git python3 curl bash; do
  has_cmd "$cmd" || die "$cmd required."
done
ok "Prerequisites OK"

info "Fetching PirateClaw v$VERSION..."
if [ -d "$INSTALL_DIR/.git" ]; then
  git -C "$INSTALL_DIR" fetch origin "$BRANCH" --quiet
  git -C "$INSTALL_DIR" reset --hard "origin/$BRANCH" --quiet
  ok "Updated PirateClaw repo"
else
  git clone --branch "$BRANCH" --depth 1 "$REPO_URL" "$INSTALL_DIR" --quiet
  ok "Cloned PirateClaw repo"
fi

mkdir -p "$LOG_DIR" "$INSTALL_DIR/subproxy/config" "$INSTALL_DIR/bin"

info "Installing Python dependencies for PirateClaw..."
python3 -m pip install --user -q aiohttp pyyaml requests >/dev/null 2>&1 || warn "python deps install had issues"
ok "Python deps attempted"

# Install external tools (best-effort, idempotent)
info "Installing Kiro CLI..."
if has_cmd kiro || has_cmd kiro-cli; then
  ok "Kiro already installed"
else
  run_remote_installer "Kiro" "https://cli.kiro.dev/install" || true
fi

info "Installing Hermes Agent..."
if has_cmd hermes; then
  ok "Hermes already installed"
else
  run_remote_installer "Hermes" "https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh" || true
fi

info "Installing Archon..."
if has_cmd archon; then
  ok "Archon already installed"
else
  run_remote_installer "Archon" "https://archon.diy/install" || true
fi

# Ensure common CLI install paths are exported for future shells
ensure_path_line "$HOME/.profile" 'export PATH="$HOME/.local/bin:$PATH"'
ensure_path_line "$HOME/.bashrc" 'export PATH="$HOME/.local/bin:$PATH"'
export PATH="$HOME/.local/bin:$PATH"

LOCAL_IP=$(hostname -I 2>/dev/null | awk '{print $1}')
LOCAL_IP="${LOCAL_IP:-127.0.0.1}"
MACHINE_ID=$(python3 -c "import uuid; print(str(uuid.uuid4()))" 2>/dev/null || date +%s)
cat > "$INSTALL_DIR/subproxy/config/machine.json" <<JSON
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
JSON
ok "PirateClaw machine config written"

PROXY_SRC="$INSTALL_DIR/$SUBDIR/subproxy/server.py"
DASH_SRC="$INSTALL_DIR/$SUBDIR/dashboard/server.py"
[ -f "$PROXY_SRC" ] || die "subproxy/server.py not found"
[ -f "$DASH_SRC" ] || die "dashboard/server.py not found"

# Launch local services
stop_services

info "Starting PirateClaw proxy..."
nohup env PROXY_PORT="$PROXY_PORT" DASH_PORT="$DASH_PORT" PARENT_PROXY="$PARENT" python3 "$PROXY_SRC" > "$LOG_DIR/proxy.log" 2>&1 &
PROXY_PID=$!
sleep 2
if curl -sf "http://127.0.0.1:${PROXY_PORT}/health" >/dev/null 2>&1; then
  ok "Proxy running on :${PROXY_PORT} (PID: $PROXY_PID)"
else
  warn "Proxy health check failed. See $LOG_DIR/proxy.log"
fi

info "Starting PirateClaw dashboard web UI..."
nohup env PROXY_PORT="$PROXY_PORT" DASH_PORT="$DASH_PORT" python3 "$DASH_SRC" > "$LOG_DIR/dashboard.log" 2>&1 &
DASH_PID=$!
sleep 2
if curl -sf "http://127.0.0.1:${DASH_PORT}/status" >/dev/null 2>&1; then
  ok "Dashboard running on :${DASH_PORT} (PID: $DASH_PID)"
else
  warn "Dashboard status check failed. See $LOG_DIR/dashboard.log"
fi
echo "Started PirateClaw + Dashboard + Archon"
SH
chmod +x "$INSTALL_DIR/bin/start-all.sh"

cat > "$INSTALL_DIR/bin/stop-all.sh" <<SH
#!/usr/bin/env sh
set -eu
if command -v systemctl >/dev/null 2>&1 && systemctl --user show-environment >/dev/null 2>&1; then
  systemctl --user stop pirateclaw-archon.service pirateclaw-dashboard.service pirateclaw-proxy.service || true
elif command -v pm2 >/dev/null 2>&1; then
  pm2 stop pirateclaw-proxy pirateclaw-dashboard pirateclaw-archon >/dev/null 2>&1 || true
else
  pkill -f "pirateclaw.*/subproxy/server.py" 2>/dev/null || true
  pkill -f "pirateclaw.*/dashboard/server.py" 2>/dev/null || true
  pkill -f "^archon serve" 2>/dev/null || true
fi
echo "Stopped PirateClaw + Dashboard + Archon"
SH
chmod +x "$INSTALL_DIR/bin/stop-all.sh"

info "Starting Archon web UI service..."
if has_cmd archon; then
  nohup archon serve --port "$ARCHON_PORT" > "$LOG_DIR/archon.log" 2>&1 &
  ARCHON_PID=$!
  sleep 3
  if curl -sf "http://127.0.0.1:${ARCHON_PORT}" >/dev/null 2>&1; then
    ok "Archon service running on :${ARCHON_PORT} (PID: $ARCHON_PID)"
  else
    warn "Archon service health check failed. See $LOG_DIR/archon.log"
  fi
else
  warn "archon command not found - skipped Archon service startup"
fi

# Hermes MCP configuration for Archon
HERMES_DIR="${HERMES_HOME:-$HOME/.hermes}"
HERMES_CFG="$HERMES_DIR/config.yaml"
mkdir -p "$HERMES_DIR"

if [ -d "$HERMES_DIR/hermes-agent" ] && has_cmd uv; then
  info "Ensuring Hermes MCP extras are installed..."
  (cd "$HERMES_DIR/hermes-agent" && uv pip install -e ".[mcp]" >/dev/null 2>&1) || warn "Could not install Hermes MCP extras"
fi

if [ ! -f "$HERMES_CFG" ]; then
  cat > "$HERMES_CFG" <<YAML
mcp_servers: {}
YAML
fi

if python3 - "$HERMES_CFG" "$ARCHON_PORT" "$PROXY_PORT" "$PARENT" <<'PY'
import sys
from pathlib import Path
import yaml

cfg_path = Path(sys.argv[1])
archon_port = sys.argv[2]
proxy_port = sys.argv[3]
parent = sys.argv[4].rstrip("/")
data = {}

try:
    raw = cfg_path.read_text(encoding="utf-8")
    if raw.strip():
        loaded = yaml.safe_load(raw)
        if isinstance(loaded, dict):
            data = loaded
except Exception:
    data = {}

mcp = data.get("mcp_servers")
if not isinstance(mcp, dict):
    mcp = {}

mcp["archon"] = {
    "url": f"http://127.0.0.1:{archon_port}/mcp",
    "enabled": True,
}
data["mcp_servers"] = mcp

# Primary Hermes routing: always use parent PirateClaw first.
model = data.get("model")
if not isinstance(model, dict):
    model = {}
model["provider"] = "custom"
model["base_url"] = f"{parent}/v1"
data["model"] = model

# Emergency fallback: direct local PirateClaw child proxy.
fallback = data.get("fallback_model")
if not isinstance(fallback, dict):
    fallback = {}
fallback["provider"] = "custom"
fallback["base_url"] = f"http://127.0.0.1:{proxy_port}/v1"
if "model" not in fallback:
    fallback["model"] = ""
data["fallback_model"] = fallback

# Route MCP helper-model calls through the same parent path.
aux = data.get("auxiliary")
if not isinstance(aux, dict):
    aux = {}
aux_mcp = aux.get("mcp")
if not isinstance(aux_mcp, dict):
    aux_mcp = {}
aux_mcp["provider"] = "custom"
aux_mcp["base_url"] = f"{parent}/v1"
aux["mcp"] = aux_mcp
data["auxiliary"] = aux

cfg_path.write_text(yaml.safe_dump(data, sort_keys=False), encoding="utf-8")
PY
then
  ok "Hermes config updated (Archon MCP + parent-first PirateClaw routing + local fallback)"
else
  warn "Failed to update Hermes MCP config automatically"
fi

cat > "$INSTALL_DIR/bin/start-all.sh" <<SH
#!/usr/bin/env sh
set -eu
nohup env PROXY_PORT="$PROXY_PORT" DASH_PORT="$DASH_PORT" PARENT_PROXY="$PARENT" python3 "$PROXY_SRC" >> "$LOG_DIR/proxy.log" 2>&1 &
nohup env PROXY_PORT="$PROXY_PORT" DASH_PORT="$DASH_PORT" python3 "$DASH_SRC" >> "$LOG_DIR/dashboard.log" 2>&1 &
if command -v archon >/dev/null 2>&1; then
  nohup archon serve --port "$ARCHON_PORT" >> "$LOG_DIR/archon.log" 2>&1 &
fi
echo "Started PirateClaw + Dashboard + Archon"
SH
chmod +x "$INSTALL_DIR/bin/start-all.sh"

cat > "$INSTALL_DIR/bin/stop-all.sh" <<SH
#!/usr/bin/env sh
set -eu
pkill -f "pirateclaw.*/subproxy/server.py" 2>/dev/null || true
pkill -f "pirateclaw.*/dashboard/server.py" 2>/dev/null || true
pkill -f "^archon serve" 2>/dev/null || true
echo "Stopped PirateClaw + Dashboard + Archon"
SH
chmod +x "$INSTALL_DIR/bin/stop-all.sh"

cat <<DONE

  ╔═══════════════════════════════════════════════════════╗
  ║  PirateClaw v${VERSION} installed + configured         ║
  ╚═══════════════════════════════════════════════════════╝

  Installed / configured:
    - PirateClaw proxy:      http://127.0.0.1:${PROXY_PORT}
    - PirateClaw dashboard:  http://127.0.0.1:${DASH_PORT}
    - Archon web UI/service: http://127.0.0.1:${ARCHON_PORT}
    - Hermes Agent + MCP config for Archon
    - Kiro CLI

  Local helper scripts:
    $INSTALL_DIR/bin/start-all.sh
    $INSTALL_DIR/bin/stop-all.sh

  Hermes MCP target:
    archon -> http://127.0.0.1:${ARCHON_PORT}/mcp

  Hermes routing:
    primary  -> ${PARENT}/v1
    fallback -> http://127.0.0.1:${PROXY_PORT}/v1

  Next step:
    1) Start Hermes: hermes chat
    2) Ask Hermes to use Archon-backed tooling/workflows.

DONE
