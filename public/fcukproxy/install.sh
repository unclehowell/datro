#!/bin/bash
set -euo pipefail

# ═══════════════════════════════════════════════════════════════════════════════
# FinanceCheque Child Proxy Installer
# ═══════════════════════════════════════════════════════════════════════════════
#
# One-liner install for scaling your proxy network:
#
#   LITE (recommended for most devices):
#     curl -sL https://raw.githubusercontent.com/unclehowell/datro/financecheque/install.sh | PARENT_URL=https://YOUR-HOST bash
#
#   FULL (with local LLM — Raspberry Pi, spare laptop):
#     curl -sL https://raw.githubusercontent.com/unclehowell/datro/financecheque/install.sh | MODE=full bash
#
#   INTERACTIVE (prompts for everything):
#     curl -sL https://raw.githubusercontent.com/unclehowell/datro/financecheque/install.sh | bash
#
# Supports: Linux x86_64, Linux ARM64, macOS (Intel/Apple Silicon), Termux/Android
# ═══════════════════════════════════════════════════════════════════════════════

VERSION="1.1.0"
REPO="unclehowell/datro"
BRANCH="financecheque"
RAW_BASE="https://raw.githubusercontent.com/$REPO/$BRANCH"

# ── Defaults (override via env vars or interactive prompt) ────────────────────
MODE="${MODE:-}"                     # lite | full | auto (detect)
PARENT_URL="${PARENT_URL:-}"         # https://your-parent-host.com
CHILD_ID="${CHILD_ID:-}"             # unique name for this node
PROXY_PORT="${PROXY_PORT:-6100}"     # port for the child proxy agent
LLAMA_PORT="${LLAMA_PORT:-8090}"     # port for llama-server (full mode only)
INSTALL_DIR="${INSTALL_DIR:-$HOME/.fcukproxy}"
CHAT_ONLY="${CHAT_ONLY:-false}"      # true = no command execution allowed
AGENT_ROLE="${AGENT_ROLE:-chat}"     # chat | code | both
FCUK_LOCAL_TOKEN="${FCUK_LOCAL_TOKEN:-}"  # local auth token (auto-generated)

# ── Colors ───────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'
CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

info()  { echo -e "${CYAN}[install]${NC} $*"; }
ok()    { echo -e "${GREEN}[install] ✓${NC} $*"; }
warn()  { echo -e "${YELLOW}[install] !${NC} $*"; }
err()   { echo -e "${RED}[install] ✗${NC} $*" >&2; }
step()  { echo -e "\n${BOLD}── Step $1: $2 ──${NC}"; }

# ── Detect platform ──────────────────────────────────────────────────────────
detect_platform() {
  local os arch

  case "$(uname -s)" in
    Linux*)  os="linux" ;;
    Darwin*) os="macos" ;;
    *)       os="unknown" ;;
  esac

  case "$(uname -m)" in
    x86_64|amd64)  arch="x64" ;;
    aarch64|arm64) arch="arm64" ;;
    armv7l|armhf)  arch="armv7" ;;
    *)             arch="unknown" ;;
  esac

  # Termux override
  if [[ -n "${TERMUX_VERSION:-}" || -d "/data/data/com.termux" ]]; then
    os="termux"
    arch="arm64"
  fi

  echo "${os}-${arch}"
}

# ── Interactive prompts (only when values not set via env) ────────────────────
prompt_config() {
  # When piped in (curl ... | bash), stdin is not a TTY: `read` would hit EOF
  # and `set -e` would abort the installer. Fall back to defaults / env vars.
  if [[ ! -t 0 ]]; then
    MODE="${MODE:-lite}"
    PARENT_URL="${PARENT_URL:-https://www.financecheque.uk}"
    CHILD_ID="${CHILD_ID:-$(hostname)-$(date +%s | tail -c 5)}"
    return 0
  fi

  if [[ -z "$MODE" ]]; then
    echo ""
    echo -e "${BOLD}Install mode:${NC}"
    echo -e "  ${GREEN}lite${NC}   — Python agent only, uses parent's cloud LLMs (recommended)"
    echo -e "  ${GREEN}full${NC}   — + llama-server + MiniCPM-1B local LLM (for Raspberry Pi, spare machines)"
    echo ""
    read -rp "Mode [lite]: " input
    MODE="${input:-lite}"
  fi

  if [[ -z "$PARENT_URL" ]]; then
    echo ""
    read -rp "Parent proxy URL [https://www.financecheque.uk]: " input
    PARENT_URL="${input:-https://www.financecheque.uk}"
  fi

  if [[ -z "$CHILD_ID" ]]; then
    local default_id
    default_id="$(hostname)-$(date +%s | tail -c 5)"
    echo ""
    read -rp "Child node ID [$default_id]: " input
    CHILD_ID="${input:-$default_id}"
  fi

  if [[ "$CHAT_ONLY" == "false" ]]; then
    echo ""
    read -rp "Allow command execution? (y/n) [n]: " input
    if [[ "${input,,}" == "y" ]]; then
      CHAT_ONLY="false"
    else
      CHAT_ONLY="true"
    fi
  fi
}

# ── Install system dependencies ──────────────────────────────────────────────
install_deps() {
  local platform="$1"

  case "$platform" in
    termux-*)
      pkg update -y 2>/dev/null || true
      pkg install -y python curl git 2>/dev/null || true
      ;;
    linux-*)
      if command -v apt-get &>/dev/null; then
        sudo apt-get update -qq 2>/dev/null || true
        sudo apt-get install -y -qq python3 python3-pip curl git 2>/dev/null || true
      elif command -v yum &>/dev/null; then
        sudo yum install -y python3 python3-pip curl git 2>/dev/null || true
      elif command -v dnf &>/dev/null; then
        sudo dnf install -y python3 python3-pip curl git 2>/dev/null || true
      elif command -v pacman &>/dev/null; then
        sudo pacman -Sy --noconfirm python python-pip curl git 2>/dev/null || true
      fi
      ;;
    macos-*)
      if command -v brew &>/dev/null; then
        brew install python3 curl git 2>/dev/null || true
      else
        err "Homebrew not found. Install: /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
        exit 1
      fi
      ;;
  esac

  # Ensure pip
  python3 -m pip --version &>/dev/null || {
    warn "pip not found, trying to install..."
    python3 -m ensurepip --upgrade 2>/dev/null || true
    if ! python3 -m pip --version &>/dev/null; then
      info "Bootstrapping pip via get-pip.py..."
      curl -fsSL https://bootstrap.pypa.io/get-pip.py -o /tmp/fcukproxy-get-pip.py \
        && python3 /tmp/fcukproxy-get-pip.py --user --break-system-packages >/dev/null 2>&1 || true
    fi
  }
}

# ── Install llama-server + MiniCPM (full mode only) ──────────────────────────
install_llm() {
  local platform="$1"
  local os arch

  IFS='-' read -r os arch <<< "$platform"

  local model_repo="ewinregirgojr/MiniCPM5-1B-Agentic-Tooluse-GGUF"
  local llamacpp_release="b5541"
  local model_dir="$INSTALL_DIR/models"
  mkdir -p "$model_dir"

  local llm_server=""

  case "$platform" in
    termux-arm64|linux-arm64)
      # ARM64 (Phone or Raspberry Pi)
      if [[ ! -f "$model_dir/model.gguf" ]]; then
        info "Downloading MiniCPM Q4_K_M for ARM64..."
        curl -sL "https://huggingface.co/$model_repo/resolve/main/MiniCPM5-1B-Agentic-Tooluse-Nemotron-DPO.Q4_K_M.gguf" \
          -o "$model_dir/model.gguf"
      fi
      if ! command -v llama-server &>/dev/null; then
        local url
        if [[ "$os" == "termux" ]]; then
          url="https://github.com/ggml-org/llama.cpp/releases/download/$llamacpp_release/llama-$llamacpp_release-bin-android-arm64.tar.gz"
          mkdir -p "$INSTALL_DIR/llama"
          curl -sL "$url" -o /tmp/llama.tar.gz
          tar xzf /tmp/llama.tar.gz -C "$INSTALL_DIR/llama" --strip-components=1
          llm_server="$INSTALL_DIR/llama/llama-server"
          chmod +x "$llm_server" 2>/dev/null || true
        else
          url="https://github.com/ggml-org/llama.cpp/releases/download/$llamacpp_release/llama-$llamacpp_release-bin-ubuntu-arm64.tar.gz"
          curl -sL "$url" -o /tmp/llama.tar.gz
          sudo tar xzf /tmp/llama.tar.gz -C /usr/local/bin/ --strip-components=1 \
            --wildcards '*/llama-server' '*/libllama*' '*/libggml*' 2>/dev/null || true
          llm_server="$(command -v llama-server || echo /usr/local/bin/llama-server)"
        fi
      else
        llm_server="$(command -v llama-server)"
      fi
      ;;
    linux-x64|macos-x64)
      if [[ ! -f "$model_dir/model.gguf" ]]; then
        info "Downloading MiniCPM Q8_0 for x64..."
        curl -sL "https://huggingface.co/$model_repo/resolve/main/MiniCPM5-1B-Agentic-Tooluse-Nemotron-DPO.Q8_0.gguf" \
          -o "$model_dir/model.gguf"
      fi
      if ! command -v llama-server &>/dev/null; then
        local url="https://github.com/ggml-org/llama.cpp/releases/download/$llamacpp_release/llama-$llamacpp_release-bin-ubuntu-x64.tar.gz"
        curl -sL "$url" -o /tmp/llama.tar.gz
        sudo tar xzf /tmp/llama.tar.gz -C /usr/local/bin/ --strip-components=1 \
          --wildcards '*/llama-server' 2>/dev/null || true
        llm_server="$(command -v llama-server || echo /usr/local/bin/llama-server)"
      else
        llm_server="$(command -v llama-server)"
      fi
      ;;
    macos-arm64)
      if [[ ! -f "$model_dir/model.gguf" ]]; then
        info "Downloading MiniCPM Q8_0 for ARM64..."
        curl -sL "https://huggingface.co/$model_repo/resolve/main/MiniCPM5-1B-Agentic-Tooluse-Nemotron-DPO.Q8_0.gguf" \
          -o "$model_dir/model.gguf"
      fi
      if ! command -v llama-server &>/dev/null; then
        local url="https://github.com/ggml-org/llama.cpp/releases/download/$llamacpp_release/llama-$llamacpp_release-bin-macos-arm64.tar.gz"
        curl -sL "$url" -o /tmp/llama.tar.gz
        sudo tar xzf /tmp/llama.tar.gz -C /usr/local/bin/ --strip-components=1 \
          --wildcards '*/llama-server' 2>/dev/null || true
        llm_server="$(command -v llama-server || echo /usr/local/bin/llama-server)"
      else
        llm_server="$(command -v llama-server)"
      fi
      ;;
    *)
      err "Unsupported platform for full mode: $platform"
      exit 1
      ;;
  esac

  echo "$llm_server"
}

# ── Download child proxy agent ───────────────────────────────────────────────
install_agent() {
  mkdir -p "$INSTALL_DIR"

  info "Downloading child proxy agent..."
  curl -sL "$RAW_BASE/public/fcukproxy/agent.py" -o "$INSTALL_DIR/agent.py"

  info "Downloading campaign executor..."
  curl -sL "$RAW_BASE/public/fcukproxy/campaign-exec.sh" -o "$INSTALL_DIR/campaign-exec.sh" 2>/dev/null
  chmod +x "$INSTALL_DIR/campaign-exec.sh" 2>/dev/null || true

  info "Downloading sleep-time reflect + skills..."
  curl -sL "$RAW_BASE/public/fcukproxy/reflect.sh" -o "$INSTALL_DIR/reflect.sh" 2>/dev/null || true
  chmod +x "$INSTALL_DIR/reflect.sh" 2>/dev/null || true
  mkdir -p "$INSTALL_DIR/skills" 2>/dev/null || true
  curl -sL "$RAW_BASE/public/fcukproxy/skills/leadgen-strategy.md" -o "$INSTALL_DIR/skills/leadgen-strategy.md" 2>/dev/null || true
  curl -sL "$RAW_BASE/public/fcukproxy/skills/local-agent-discharge.md" -o "$INSTALL_DIR/skills/local-agent-discharge.md" 2>/dev/null || true

  # Nightly sleep-time compute: node reviews today's traces → distills memory.md
  if command -v crontab >/dev/null 2>&1; then
    ( crontab -l 2>/dev/null | grep -v 'fcukproxy/reflect.sh'; \
      echo "17 3 * * * ${HOME}/.fcukproxy/reflect.sh" ) | crontab - 2>/dev/null || true
  fi

  info "Installing Python dependencies..."
  python3 -m pip install --quiet --user aiohttp 2>/dev/null || \
    python3 -m pip install --quiet aiohttp 2>/dev/null || \
    python3 -m pip install --quiet --break-system-packages aiohttp 2>/dev/null || true
}

# ── Download video engine (thin client) + pre-fetch scene/object library ─────
# The engine (phone_video.py) is a THIN Pillow+ffmpeg renderer. Scenes/objects
# are NOT bundled: they live in the financecheque branch at
# public/fcukproxy/library/ and are fetched on demand into ~/.fcukproxy/library,
# then cached. A branch rerelease + `phone_video.py --update` syncs all child
# proxies simultaneously — keeping install.sh small and local storage minimal.
VIDEO_LIB_VERSION="0.2.0"
install_video_lib() {
  mkdir -p "$INSTALL_DIR"

  info "Downloading video engine (thin client, scenes/objects fetched on demand)..."
  curl -sL "$RAW_BASE/public/fcukproxy/phone_video.py" -o "$INSTALL_DIR/phone_video.py"

  info "Installing video dependencies (Pillow)..."
  python3 -m pip install --quiet --user Pillow 2>/dev/null || \
    python3 -m pip install --quiet Pillow 2>/dev/null || \
    python3 -m pip install --quiet --break-system-packages Pillow 2>/dev/null || true

  # Ensure ffmpeg is present (used to encode MP4). Optional — chat-only nodes skip.
  if ! command -v ffmpeg >/dev/null 2>&1 && [[ ! -x "/data/data/com.termux/files/usr/bin/ffmpeg" ]]; then
    info "ffmpeg not found — installing (video rendering needs it)..."
    if [[ "$PLATFORM" == termux* ]]; then
      pkg install -y ffmpeg 2>/dev/null || true
    elif command -v apt-get >/dev/null 2>&1; then
      sudo apt-get install -y -qq ffmpeg 2>/dev/null || true
    elif command -v brew >/dev/null 2>&1; then
      brew install ffmpeg 2>/dev/null || true
    else
      warn "Could not auto-install ffmpeg. Video rendering will be unavailable until it is installed."
    fi
  fi

  if [[ -f "$INSTALL_DIR/phone_video.py" ]]; then
    # Pre-fetch the manifest + all scenes/objects into the local library cache
    # so first render is fast and works offline afterwards.
    info "Pre-fetching scene/object library from financecheque branch..."
    python3 "$INSTALL_DIR/phone_video.py" --update 2>/dev/null \
      || warn "Library pre-fetch failed (will be fetched on first render instead)"
    ok "Video engine installed ($VIDEO_LIB_VERSION) — library: scenes+objects from branch, cached in $INSTALL_DIR/library"
  fi
}

# ── Write config files ───────────────────────────────────────────────────────
write_config() {
  mkdir -p "$INSTALL_DIR"

  # Shared local auth token (agent.py ⇄ child-proxy.mjs on 4001)
  if [[ -z "$FCUK_LOCAL_TOKEN" && -f "$INSTALL_DIR/.env" ]]; then
    FCUK_LOCAL_TOKEN=$(grep -E '^FCUK_LOCAL_TOKEN=' "$INSTALL_DIR/.env" | head -1 | cut -d= -f2-)
  fi
  if [[ -z "$FCUK_LOCAL_TOKEN" ]]; then
    FCUK_LOCAL_TOKEN=$(python3 -c "import secrets; print(secrets.token_hex(24))" 2>/dev/null || \
      (tr -dc 'a-zA-Z0-9' </dev/urandom | head -c 48))
  fi

  # machine.json
  cat > "$INSTALL_DIR/machine.json" << JSONEOF
{
  "machine_id": "$CHILD_ID",
  "machine_name": "$CHILD_ID",
  "local_ip": "127.0.0.1",
  "proxy_port": $PROXY_PORT,
  "parent": "$PARENT_URL",
  "version": "$VERSION",
  "mode": "$MODE",
  "chat_only": $CHAT_ONLY,
  "agent_role": "$AGENT_ROLE"
}
JSONEOF

  # .env template (only if not exists)
  if [[ ! -f "$INSTALL_DIR/.env" ]]; then
    cat > "$INSTALL_DIR/.env" << ENVEOF
# FinanceCheque Child Proxy — API Keys
# Add your keys here. The agent hot-reloads every 60s.
# At minimum, add one provider key (Groq is free):
#   https://console.groq.com/keys

# Local shared auth token (agent.py ⇄ child-proxy.mjs) — auto-generated
FCUK_LOCAL_TOKEN=$FCUK_LOCAL_TOKEN

GROQ_API_KEY=
OPENROUTER_API_KEY=
GOOGLE_API_KEY=
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
DEEPSEEK_API_KEY=
MISTRAL_API_KEY=
CEREBRAS_API_KEY=

# Parent proxy (where this node registers)
PARENT_URL=$PARENT_URL

# Node identity
CHILD_ID=$CHILD_ID
MACHINE_ID=$CHILD_ID
PROXY_PORT=$PROXY_PORT

# Role: chat (LLM only), code (agentic), or both
AGENT_ROLE=$AGENT_ROLE

# Set to true to block command execution
CHAT_ONLY=$CHAT_ONLY
ENVEOF
    info "Created $INSTALL_DIR/.env — add at least one API key"
  fi
}

# ── Start services ───────────────────────────────────────────────────────────
start_services() {
  local llm_server="${1:-}"

  # Kill existing processes
  pkill -f "python.*agent.py.*$PROXY_PORT" 2>/dev/null || true

  if [[ "$MODE" == "full" && -n "$llm_server" ]]; then
    pkill -f "llama-server.*$LLAMA_PORT" 2>/dev/null || true
    sleep 1

    info "Starting llama-server on port $LLAMA_PORT..."
    nohup "$llm_server" \
      -m "$INSTALL_DIR/models/model.gguf" \
      --port "$LLAMA_PORT" --host 127.0.0.1 \
      -c 2048 -ngl 0 --cont-batching \
      > "$INSTALL_DIR/llama-server.log" 2>&1 &
    echo $! > "$INSTALL_DIR/llama-server.pid"
    ok "llama-server PID: $!"
  fi

  sleep 1
  info "Starting child proxy agent on port $PROXY_PORT..."
  nohup python3 "$INSTALL_DIR/agent.py" --port "$PROXY_PORT" \
    > "$INSTALL_DIR/agent.log" 2>&1 &
  echo $! > "$INSTALL_DIR/agent.pid"
  ok "agent.py PID: $!"
}

# ── Create systemd service (optional) ────────────────────────────────────────
install_service() {
  if [[ ! -d /etc/systemd/system ]] || [[ "$(id -u)" -eq 0 ]]; then
    return 0  # skip if no systemd or running as root
  fi

  local service_dir="$HOME/.config/systemd/user"
  mkdir -p "$service_dir"

  cat > "$service_dir/fcuk-proxy.service" << SVCEOF
[Unit]
Description=FinanceCheque Child Proxy
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
WorkingDirectory=$INSTALL_DIR
ExecStart=$(command -v python3) $INSTALL_DIR/agent.py --port $PROXY_PORT
Restart=on-failure
RestartSec=10
Environment=HOME=$HOME
Environment=PATH=$HOME/.local/bin:$HOME/.npm-global/bin:/usr/local/bin:/usr/bin:/bin
EnvironmentFile=$INSTALL_DIR/.env

[Install]
WantedBy=default.target
SVCEOF

  # Enable and start
  systemctl --user daemon-reload 2>/dev/null || true
  systemctl --user enable fcuk-proxy 2>/dev/null || true
  systemctl --user start fcuk-proxy 2>/dev/null || true

  ok "systemd service installed and started"
  info "Manage: systemctl --user status fcuk-proxy"
  info "Logs:   journalctl --user -u fcuk-proxy -f"
}

# ── Create pm2 process (alternative to systemd) ──────────────────────────────
install_pm2() {
  if command -v pm2 &>/dev/null; then
    pm2 delete fcuk-proxy 2>/dev/null || true
    pm2 start "$INSTALL_DIR/agent.py" --name fcuk-proxy --interpreter python3 -- --port "$PROXY_PORT"
    pm2 save 2>/dev/null || true
    ok "pm2 process started"
    info "Logs: pm2 logs fcuk-proxy"
  fi
}

# ── Register with parent and verify ──────────────────────────────────────────
verify_and_register() {
  sleep 3

  info "Verifying child proxy..."
  if curl -sf "http://127.0.0.1:$PROXY_PORT/health" >/dev/null 2>&1; then
    ok "Child proxy responding on port $PROXY_PORT"
  else
    warn "Child proxy not responding yet (may need a few seconds)"
    warn "Check: tail -f $INSTALL_DIR/agent.log"
  fi

  if [[ "$MODE" == "full" ]]; then
    if curl -sf "http://127.0.0.1:$LLAMA_PORT/health" >/dev/null 2>&1 || \
       curl -sf "http://127.0.0.1:$LLAMA_PORT/v1/models" >/dev/null 2>&1; then
      ok "llama-server responding on port $LLAMA_PORT"
    else
      warn "llama-server not responding yet"
      warn "Check: tail -f $INSTALL_DIR/llama-server.log"
    fi
  fi

  # Try to register with parent
  info "Registering with parent: $PARENT_URL"
  local payload
  payload=$(cat << JSONEOF
{
  "machine_id": "$CHILD_ID",
  "machine_name": "$CHILD_ID",
  "proxy_port": $PROXY_PORT,
  "version": "$VERSION",
  "mode": "$MODE",
  "chat_only": $CHAT_ONLY,
  "agent_role": "$AGENT_ROLE"
}
JSONEOF
)
  if curl -sf -X POST "$PARENT_URL/api/proxy?action=register" \
    -H "Content-Type: application/json" \
    -d "$payload" >/dev/null 2>&1; then
    ok "Registered with parent proxy"
  else
    warn "Could not register with parent (parent may not be reachable from this network)"
    info "The agent will retry registration every 60s"
  fi
}

# ── Print summary ────────────────────────────────────────────────────────────
print_summary() {
  echo ""
  echo -e "${BOLD}══════════════════════════════════════════════════════════════${NC}"
  echo -e "${BOLD}  FinanceCheque Child Proxy — Installed${NC}"
  echo -e "${BOLD}══════════════════════════════════════════════════════════════${NC}"
  echo ""
  echo -e "  ${CYAN}Mode:${NC}          $MODE"
  echo -e "  ${CYAN}Node ID:${NC}       $CHILD_ID"
  echo -e "  ${CYAN}Parent:${NC}        $PARENT_URL"
  echo -e "  ${CYAN}Proxy port:${NC}    $PROXY_PORT"
  if [[ "$MODE" == "full" ]]; then
    echo -e "  ${CYAN}LLM port:${NC}      $LLAMA_PORT"
    echo -e "  ${CYAN}Model:${NC}         $INSTALL_DIR/models/model.gguf"
  fi
  echo -e "  ${CYAN}Config:${NC}        $INSTALL_DIR/"
  echo -e "  ${CYAN}Logs:${NC}          $INSTALL_DIR/agent.log"
  echo ""
  echo -e "  ${YELLOW}Next steps:${NC}"
  echo "  1. Add at least one API key to $INSTALL_DIR/.env"
  echo "     (Groq is free: https://console.groq.com/keys)"
  echo ""
  echo "  2. Restart the agent:"
  echo "     systemctl --user restart fcuk-proxy"
  echo "     # or: pm2 restart fcuk-proxy"
  echo "     # or: python3 $INSTALL_DIR/agent.py --port $PROXY_PORT"
  echo ""
  echo "  3. Verify it's visible on the parent:"
  echo "     curl -s $PARENT_URL/api/proxy?action=health | python3 -m json.tool"
  echo ""
  echo -e "  ${YELLOW}Video engine (local compute):${NC}"
  echo "  Render videos on this device (Pillow + ffmpeg). Scenes/objects are"
  echo "  fetched on demand from the financecheque branch and cached locally:"
  echo "     curl -s -X POST http://127.0.0.1:$PROXY_PORT/v1/video -H 'Content-Type: application/json' \\"
  echo "       -d '{\"prompt\":\"a cat in a hat\"}'"
  echo "  Poll:  curl -s http://127.0.0.1:$PROXY_PORT/v1/video/<job_id>"
  echo "  File:  curl -s http://127.0.0.1:$PROXY_PORT/v1/video/file/<name>.mp4 -o out.mp4"
  echo "  Catalog (scenes/objects from branch): curl -s http://127.0.0.1:$PROXY_PORT/v1/video/library"
  echo "  Update the scene/object library (after a financecheque rerelease):"
  echo "     python3 $INSTALL_DIR/phone_video.py --update"
  echo "  A rerelease of the financecheque branch updates ALL child proxies at once."
  echo ""
  echo -e "  ${YELLOW}Scaling:${NC}"
  echo "  Run this same script on other machines with the same PARENT_URL"
  echo "  to add more child proxies to your network."
  echo ""
  echo -e "${BOLD}══════════════════════════════════════════════════════════════${NC}"
}

# ═══════════════════════════════════════════════════════════════════════════════
# Main
# ═══════════════════════════════════════════════════════════════════════════════
main() {
  echo -e "${BOLD}FinanceCheque Child Proxy Installer v$VERSION${NC}"

  PLATFORM=$(detect_platform)
  info "Platform: $PLATFORM"

  # Interactive prompts if values not set
  prompt_config

  # Validate
  if [[ -z "$PARENT_URL" ]]; then
    err "PARENT_URL is required"
    echo "  Usage: PARENT_URL=https://your-host.com bash install.sh"
    exit 1
  fi

  if [[ -z "$CHILD_ID" ]]; then
    CHILD_ID="$(hostname)-$(date +%s | tail -c 5)"
  fi

  # Normalize mode
  case "${MODE,,}" in
    full|heavy|local)  MODE="full" ;;
    *)                 MODE="lite" ;;
  esac

  info "Mode: $MODE | Node: $CHILD_ID | Parent: $PARENT_URL"

  step 1 "System dependencies"
  install_deps "$PLATFORM"

  step 2 "Child proxy agent"
  install_agent

  step 3 "Video library (scenes/objects engine)"
  install_video_lib

  step 4 "Configuration"
  write_config

  LLM_SERVER=""
  if [[ "$MODE" == "full" ]]; then
    step 5 "Local LLM (llama-server + MiniCPM)"
    LLM_SERVER=$(install_llm "$PLATFORM")
  fi

  step 6 "Starting services"
  start_services "$LLM_SERVER"

  step 6 "Service persistence"
  install_service || install_pm2 || warn "No service manager found — agent runs in background only"

  step 7 "Verification"
  verify_and_register

  print_summary
}

main "$@"
