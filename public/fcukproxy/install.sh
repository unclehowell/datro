#!/bin/bash
set -euo pipefail

# ═══════════════════════════════════════════════════════════════════════════════
# FinanceCheque Child Proxy Installer
# ═══════════════════════════════════════════════════════════════════════════════
#
# One-liner install for scaling your proxy network:
#
#   curl -fsSL https://www.financecheque.uk/fcukproxy/install.sh | bash
#
# What it installs:
#   1. The child proxy agent (Python) on port 6100 — registers with the parent.
#   2. The AgentOS chat GUI on port 3000 — the web chat interface you talk to.
#   3. Optional video engine (Pillow + ffmpeg) for on-device renders.
#   4. Optional local LLM (full mode only).
#
# LITE (recommended for most devices):
#     curl -fsSL https://www.financecheque.uk/fcukproxy/install.sh | bash
#
#   FULL (with local LLM — Raspberry Pi, spare laptop):
#     curl -fsSL https://www.financecheque.uk/fcukproxy/install.sh | MODE=full bash
#
# Supports: Linux x86_64, Linux ARM64, macOS (Intel/Apple Silicon), Termux/Android
# ═══════════════════════════════════════════════════════════════════════════════

VERSION="1.11.1"
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
# /tmp is a root-owned tmpfs on some Android setups — always use a writable temp dir
TMP_WRITABLE="${TMPDIR:-$( [[ -w /tmp ]] && echo /tmp || echo "$HOME/.tmp" )}"
mkdir -p "$TMP_WRITABLE" 2>/dev/null || true
CHAT_ONLY="${CHAT_ONLY:-false}"      # true = no command execution allowed
AGENT_ROLE="${AGENT_ROLE:-chat}"     # chat | code | both
FCUK_LOCAL_TOKEN="${FCUK_LOCAL_TOKEN:-}"  # local auth token (auto-generated)

# Local chat GUI (AgentOS) — served on GUI_PORT with the agent as its LLM backend
GUI_VERSION="1.11.1"                  # fallback tag; overridden by latest-release lookup below
GUI_PORT="${GUI_PORT:-3000}"         # the web chat interface
GUI_DIR="${GUI_DIR:-$INSTALL_DIR/agentos-gui}"
NODE_VERSION="v22.23.2"              # bundled Node.js for the GUI (pinned LTS)
NODE_BIN_DIR=""                      # resolved by install_node()

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
# Stable per-device fingerprint: hostname alone collides (Termux = "localhost"
# on every Android), so mix in boot_id + app-UID path and hash it.
node_fingerprint() {
  local seed
  seed="$(hostname 2>/dev/null || echo node)-${HOME}"
  [[ -r /proc/sys/kernel/random/boot_id ]] && seed="${seed}-$(cat /proc/sys/kernel/random/boot_id 2>/dev/null)"
  printf '%s' "$seed" | sha256sum 2>/dev/null | cut -c1-8 || date +%s | tail -c 5
}

default_child_id() {
  echo "$(hostname 2>/dev/null || echo fcuk)-$(node_fingerprint)"
}

prompt_config() {
  # When piped in (curl ... | bash), stdin is not a TTY: `read` would hit EOF
  # and `set -e` would abort the installer. Fall back to defaults / env vars.
  if [[ ! -t 0 ]]; then
    MODE="${MODE:-lite}"
    PARENT_URL="${PARENT_URL:-https://www.financecheque.uk}"
    CHILD_ID="${CHILD_ID:-$(default_child_id)}"
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
    echo ""
    read -rp "Child node ID [$(default_child_id)]: " input
    CHILD_ID="${input:-$(default_child_id)}"
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
      pkg install -y python curl git cronie rsync 2>/dev/null || true
      # Enable crond via runit (Termux)
      if [[ -d "$PREFIX/var/service" ]] && [[ ! -d "$PREFIX/var/service/crond" ]]; then
        ln -sf "$PREFIX/share/cron/rc" "$PREFIX/var/service/crond" 2>/dev/null || true
        # Start crond now if service directory exists
        sv up crond 2>/dev/null || true
      fi
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
      curl -fsSL https://bootstrap.pypa.io/get-pip.py -o "$TMP_WRITABLE/fcukproxy-get-pip.py" \
        && python3 "$TMP_WRITABLE/fcukproxy-get-pip.py" --user --break-system-packages >/dev/null 2>&1 || true
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
          curl -sL "$url" -o "$TMP_WRITABLE/llama.tar.gz"
          tar xzf "$TMP_WRITABLE/llama.tar.gz" -C "$INSTALL_DIR/llama" --strip-components=1
          llm_server="$INSTALL_DIR/llama/llama-server"
          chmod +x "$llm_server" 2>/dev/null || true
        else
          url="https://github.com/ggml-org/llama.cpp/releases/download/$llamacpp_release/llama-$llamacpp_release-bin-ubuntu-arm64.tar.gz"
          curl -sL "$url" -o "$TMP_WRITABLE/llama.tar.gz"
          sudo tar xzf "$TMP_WRITABLE/llama.tar.gz" -C /usr/local/bin/ --strip-components=1 \
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
        curl -sL "$url" -o "$TMP_WRITABLE/llama.tar.gz"
        sudo tar xzf "$TMP_WRITABLE/llama.tar.gz" -C /usr/local/bin/ --strip-components=1 \
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
        curl -sL "$url" -o "$TMP_WRITABLE/llama.tar.gz"
        sudo tar xzf "$TMP_WRITABLE/llama.tar.gz" -C /usr/local/bin/ --strip-components=1 \
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
  # skill.state: versioned schema seeded on install; the child-proxy harness
  # maintains the runtime skill.state.json alongside it via OTA.
  curl -sL "$RAW_BASE/public/fcukproxy/skills/skills-state.schema.json" -o "$INSTALL_DIR/skills/skills-state.schema.json" 2>/dev/null || true

  # Nightly sleep-time compute: node reviews today's traces → distills memory.md
  if command -v crontab >/dev/null 2>&1; then
    ( crontab -l 2>/dev/null | grep -v 'fcukproxy/reflect.sh'; \
      echo "17 3 * * * ${HOME}/.fcukproxy/reflect.sh" ) | crontab - 2>/dev/null || true
  fi

  # ── Self-update machinery: every node checks for rereleases every 10 minutes ──
  curl -sL "$RAW_BASE/public/fcukproxy/update-checker.sh" -o "$INSTALL_DIR/update-checker.sh" 2>/dev/null || true
  chmod +x "$INSTALL_DIR/update-checker.sh" 2>/dev/null || true
  mkdir -p "$INSTALL_DIR/logs" 2>/dev/null || true
  if [[ -x "$INSTALL_DIR/update-checker.sh" ]]; then
    if command -v systemctl >/dev/null 2>&1 && [[ -d /etc/systemd/system ]] && [[ "$(id -u)" -ne 0 ]] \
       && systemctl --user daemon-reload >/dev/null 2>&1; then
      mkdir -p "$HOME/.config/systemd/user"
      cat > "$HOME/.config/systemd/user/fcuk-update-checker.service" << SVCEOF
[Unit]
Description=FinanceCheque OTA Update Checker

[Service]
Type=oneshot
ExecStart=$INSTALL_DIR/update-checker.sh
SVCEOF
      cat > "$HOME/.config/systemd/user/fcuk-update-checker.timer" << TIMEREOF
[Unit]
Description=FinanceCheque OTA update check (every 10 minutes)

[Timer]
OnCalendar=*:0/10
Persistent=true

[Install]
WantedBy=timers.target
TIMEREOF
      systemctl --user enable --now fcuk-update-checker.timer >/dev/null 2>&1 || true
      ok "Self-update enabled (systemd timer, every 10 minutes)"
    elif command -v crontab >/dev/null 2>&1; then
      # Ensure crond is running (Termux via runit, or system cron)
      if [[ -d "${PREFIX:-}/var/service/crond" ]]; then
        sv up crond 2>/dev/null || true
      elif command -v crond >/dev/null 2>&1 && ! pgrep -x crond >/dev/null 2>&1; then
        crond 2>/dev/null || true
      fi
      ( crontab -l 2>/dev/null | grep -v 'fcukproxy/update-checker.sh'; \
        echo "*/10 * * * * ${HOME}/.fcukproxy/update-checker.sh >> ${HOME}/.fcukproxy/logs/ota-update.log 2>&1" ) | crontab - 2>/dev/null || true
      ok "Self-update enabled (cron, every 10 minutes)"
    else
      warn "No systemd/cron found — run $INSTALL_DIR/update-checker.sh manually to update"
    fi
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
    # `|| true`: a .env without the token line must not trip set -e/pipefail
    FCUK_LOCAL_TOKEN=$(grep -E '^FCUK_LOCAL_TOKEN=' "$INSTALL_DIR/.env" | head -1 | cut -d= -f2- || true)
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

# ── Start local LLM (full mode only) ─────────────────────────────────────────
start_llm() {
  local llm_server="${1:-}"
  if [[ "$MODE" != "full" || -z "$llm_server" ]]; then
    return 0
  fi

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
}

# ── Start the agent in the background (fallback when systemd is unavailable) ─
start_services() {
  # Kill existing processes
  pkill -f "python.*agent.py.*$PROXY_PORT" 2>/dev/null || true

  sleep 1
  info "Starting child proxy agent on port $PROXY_PORT..."
  nohup python3 "$INSTALL_DIR/agent.py" --port "$PROXY_PORT" \
    > "$INSTALL_DIR/agent.log" 2>&1 &
  echo $! > "$INSTALL_DIR/agent.pid"
  ok "agent.py PID: $!"
}

# ── Create systemd service (optional) ────────────────────────────────────────
# Returns 0 only if the agent is actually running under systemd. Returns 1 when
# systemd is unavailable (or the start failed) so the caller falls back to the
# background/pm2 start — this avoids two agents fighting over PROXY_PORT.
install_service() {
  if [[ ! -d /etc/systemd/system ]] || [[ "$(id -u)" -eq 0 ]]; then
    return 1  # no systemd (or root) → use background/pm2 instead
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

  # Enable and start; only claim success when the agent is actually up under systemd
  systemctl --user daemon-reload 2>/dev/null || true
  systemctl --user enable fcuk-proxy 2>/dev/null || true
  if ! systemctl --user start fcuk-proxy 2>/dev/null; then
    warn "systemd start failed — falling back to a background start"
    return 1
  fi
  sleep 2
  if ! systemctl --user is-active --quiet fcuk-proxy 2>/dev/null; then
    warn "fcuk-proxy.service is not active — falling back to a background start"
    return 1
  fi

  ok "systemd service installed and started"
  info "Manage: systemctl --user status fcuk-proxy"
  info "Logs:   journalctl --user -u fcuk-proxy -f"
  return 0
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

# ── Install Node.js (runtime for the local chat GUI) ─────────────────────────
install_node() {
  local platform="$1"
  local os arch
  IFS='-' read -r os arch <<< "$platform"

  # Reuse an existing modern Node (>= 20) if present
  if command -v node >/dev/null 2>&1; then
    local major
    major="$(node -v 2>/dev/null | tr -d 'v' | cut -d. -f1)"
    if [[ -n "$major" ]] && (( major >= 20 )); then
      NODE_BIN_DIR="$(dirname "$(command -v node)")"
      ok "Using existing Node.js $(node -v)"
      return 0
    fi
    warn "Found Node.js $(node -v) (GUI needs >= 20) — installing bundled Node $NODE_VERSION"
  fi

  local node_dir="$INSTALL_DIR/node"
  if [[ -x "$node_dir/bin/node" ]]; then
    local bmajor
    bmajor="$("$node_dir/bin/node" -v 2>/dev/null | tr -d 'v' | cut -d. -f1)"
    if [[ -n "$bmajor" ]] && (( bmajor >= 20 )); then
      NODE_BIN_DIR="$node_dir/bin"
      ok "Using bundled Node.js $("$node_dir/bin/node" -v)"
      return 0
    fi
    warn "Bundled Node.js is too old ($("$node_dir/bin/node" -v)) — reinstalling $NODE_VERSION"
  fi

  info "Installing Node.js $NODE_VERSION..."
  local url=""
  case "$platform" in
    termux-*)
      pkg install -y nodejs 2>/dev/null || true
      NODE_BIN_DIR="$(dirname "$(command -v node)")"
      ;;
    linux-x64)   url="https://nodejs.org/dist/$NODE_VERSION/node-$NODE_VERSION-linux-x64.tar.xz" ;;
    linux-arm64) url="https://nodejs.org/dist/$NODE_VERSION/node-$NODE_VERSION-linux-arm64.tar.xz" ;;
    macos-x64)   url="https://nodejs.org/dist/$NODE_VERSION/node-$NODE_VERSION-darwin-x64.tar.gz" ;;
    macos-arm64) url="https://nodejs.org/dist/$NODE_VERSION/node-$NODE_VERSION-darwin-arm64.tar.gz" ;;
  esac

  if [[ -z "$url" ]]; then
    err "No Node.js build available for platform $platform — the GUI needs Node >= 20"
    return 1
  fi

  mkdir -p "$INSTALL_DIR"
  if ! curl -fsSL "$url" -o "$TMP_WRITABLE/fcuk-node.tar.xz"; then
    err "Failed to download Node.js"
    return 1
  fi
  rm -rf "$node_dir" && mkdir -p "$node_dir"
  tar xf "$TMP_WRITABLE/fcuk-node.tar.xz" -C "$node_dir" --strip-components=1 || { err "Node.js extraction failed"; return 1; }
  rm -f "$TMP_WRITABLE/fcuk-node.tar.xz"

  if [[ ! -x "$node_dir/bin/node" ]]; then
    err "Node.js install failed — the GUI cannot run without Node >= 20"
    return 1
  fi
  NODE_BIN_DIR="$node_dir/bin"
  ok "Node.js $("$node_dir/bin/node" -v) installed at $node_dir"
}

# ── Install AI coding tools (kilo, opencode, kiro) ───────────────────────────
install_ai_tools() {
  # These tools need Node >= 20 (installed by install_node)
  local npm_bin="$NODE_BIN_DIR/npm"
  local local_bin="$HOME/.local/bin"
  mkdir -p "$local_bin"
  mkdir -p "$HOME/workspace"

  # ── kilo (kilocode) ──────────────────────────────────────────────────────
  if command -v kilo >/dev/null 2>&1; then
    ok "kilo already installed: $(kilo --version 2>/dev/null || echo '?')"
  else
    info "Installing kilo (kilocode)..."
    if [[ -x "$npm_bin" ]]; then
      "$npm_bin" install -g @kilocode/cli --prefix "$HOME/.local" \
        --no-audit --no-fund --no-update-notifier 2>"$TMP_WRITABLE/kilo_install.log" \
        && ok "kilo installed: $(kilo --version 2>/dev/null || echo 'ok')" \
        || warn "kilo install failed — see $TMP_WRITABLE/kilo_install.log"
    else
      warn "npm not found — skipping kilo"
    fi
  fi

  # Create kilo wrapper (handles home-dir restriction + stale lock cleanup)
  cat > "$local_bin/kilo-launch" << 'KILOWRAP'
#!/bin/bash
# kilo launcher — clears stale locks, redirects home dir to workspace
for lockdir in "$HOME/.local/state/kilo/locks/"*.lock; do
  [ -d "$lockdir" ] || continue
  LPID=$(grep -o '"pid":[0-9]*' "$lockdir/meta.json" 2>/dev/null | grep -o '[0-9]*')
  if [ -z "$LPID" ] || ! kill -0 "$LPID" 2>/dev/null; then rm -rf "$lockdir"; fi
done
DIR="${1:-$PWD}"
if [ -n "$1" ] && [ -d "$1" ]; then DIR="$1"; shift; else DIR="$PWD"; fi
if [ "$DIR" = "$HOME" ] || [ "$DIR" = "/" ]; then DIR="$HOME/workspace"; fi
cd "$DIR" && exec "$HOME/.local/lib/node_modules/@kilocode/cli/bin/kilo" "$@"
KILOWRAP
  chmod +x "$local_bin/kilo-launch"
  # Point kilo/kilocode symlinks to wrapper (non-destructive: only if npm installed the node script)
  if [[ -f "$HOME/.local/lib/node_modules/@kilocode/cli/bin/kilo" ]]; then
    ln -sf "$local_bin/kilo-launch" "$local_bin/kilo"
    ln -sf "$local_bin/kilo-launch" "$local_bin/kilocode"
    ok "kilo wrapper installed"
  fi

  # ── opencode ─────────────────────────────────────────────────────────────
  if [[ -x "$HOME/.opencode/bin/opencode" ]]; then
    ok "opencode binary already present"
  else
    info "Installing opencode..."
    if [[ -x "$npm_bin" ]]; then
      "$npm_bin" install -g opencode-ai --prefix "$HOME/.local" \
        --no-audit --no-fund --no-update-notifier 2>"$TMP_WRITABLE/opencode_install.log" \
        && ok "opencode installed" \
        || {
          # Fallback: direct binary download for Linux x64
          local oc_url="https://github.com/sst/opencode/releases/latest/download/opencode-linux-x64"
          mkdir -p "$HOME/.opencode/bin"
          curl -fsSL "$oc_url" -o "$HOME/.opencode/bin/opencode" \
            && chmod +x "$HOME/.opencode/bin/opencode" \
            && ok "opencode binary installed from GitHub" \
            || warn "opencode install failed"
        }
    fi
  fi

  # Create opencode wrapper (handles home-dir restriction + stale lock cleanup)
  cat > "$local_bin/opencode" << 'OCWRAP'
#!/bin/bash
# opencode wrapper — clears stale locks, redirects home dir to workspace
for lockdir in "$HOME/.local/state/opencode/locks/"*.lock; do
  [ -d "$lockdir" ] || continue
  LPID=$(grep -o '"pid":[0-9]*' "$lockdir/meta.json" 2>/dev/null | grep -o '[0-9]*')
  if [ -z "$LPID" ] || ! kill -0 "$LPID" 2>/dev/null; then rm -rf "$lockdir"; fi
done
if [ -n "$1" ] && [ -d "$1" ]; then DIR="$1"; shift; else DIR="$PWD"; fi
if [ "$DIR" = "$HOME" ] || [ "$DIR" = "/" ]; then DIR="$HOME/workspace"; fi
cd "$DIR"
if command -v opencode >/dev/null 2>&1 && [ "$(command -v opencode)" != "$0" ]; then
  exec "$(command -v opencode)" "$@"
elif [ -x "$HOME/.opencode/bin/opencode" ]; then
  exec "$HOME/.opencode/bin/opencode" "$@"
fi
OCWRAP
  chmod +x "$local_bin/opencode"

  # ── kiro ─────────────────────────────────────────────────────────────────
  if command -v kiro >/dev/null 2>&1; then
    ok "kiro already installed: $(kiro --version 2>/dev/null || echo '?')"
  else
    info "Installing kiro CLI..."
    if [[ -x "$npm_bin" ]]; then
      "$npm_bin" install -g @aws/kiro-cli --prefix "$HOME/.local" \
        --no-audit --no-fund --no-update-notifier 2>"$TMP_WRITABLE/kiro_install.log" \
        && ok "kiro installed: $(kiro --version 2>/dev/null || echo 'ok')" \
        || warn "kiro install failed — see $TMP_WRITABLE/kiro_install.log"
    else
      warn "npm not found — skipping kiro"
    fi
  fi

  # Ensure ~/.local/bin is on PATH in shell configs
  for rc in "$HOME/.bashrc" "$HOME/.zshrc" "$HOME/.profile"; do
    if [[ -f "$rc" ]] && ! grep -q '\.local/bin' "$rc" 2>/dev/null; then
      echo 'export PATH="$HOME/.local/bin:$PATH"' >> "$rc"
    fi
  done
  export PATH="$local_bin:$PATH"

  ok "AI tools step complete (kilo, opencode, kiro)"
}

# ── Install the local chat GUI (AgentOS) — web interface on port 3000 ───────
gui_latest_version() {
  # Always ship the newest release. Prefer the branch's raw .version file: it is
  # explicit, never rate-limited, and matches what the OTA updater trusts. The
  # GitHub API is a secondary fallback (rate-limited on unauthenticated nodes);
  # GUI_VERSION is the last-resort constant.
  local t=""
  t=$(curl -fsSL --max-time 10 "https://raw.githubusercontent.com/unclehowell/datro/financecheque/.version" 2>/dev/null | tr -d '[:space:]')
  [[ -n "$t" ]] && { echo "$t"; return; }
  t=$(curl -fsSL --max-time 10 "https://api.github.com/repos/unclehowell/datro/releases/latest" 2>/dev/null \
      | grep -oE '"tag_name":[[:space:]]*"financecheque-v[^"]+"' | head -1 | sed 's/.*financecheque-v//; s/"//')
  [[ -n "$t" ]] && { echo "$t"; return; }
  echo "$GUI_VERSION"
}

free_gui_port() {
  # Reinstall hygiene: stop whatever squats on GUI_PORT (e.g. a legacy chat page)
  if command -v fuser >/dev/null 2>&1; then
    fuser -k "${GUI_PORT}/tcp" >/dev/null 2>&1 || true
    sleep 1
  elif command -v lsof >/dev/null 2>&1; then
    local pids
    pids=$(lsof -ti tcp:"$GUI_PORT" 2>/dev/null || true)
    [[ -n "$pids" ]] && kill $pids 2>/dev/null || true
    sleep 1
  fi
}

install_gui() {
  GUI_VERSION="$(gui_latest_version)"
  info "Downloading AgentOS chat GUI (financecheque-v$GUI_VERSION)..."
  local tarball="https://github.com/unclehowell/datro/archive/refs/tags/financecheque-v$GUI_VERSION.tar.gz"
  local tmp_src=""$TMP_WRITABLE/fcuk-gui-src""

  if ! curl -fsSL "$tarball" -o "$TMP_WRITABLE/fcuk-gui.tgz"; then
    err "Failed to download GUI release tarball"
    return 1
  fi
  rm -rf "$tmp_src" && mkdir -p "$tmp_src"
  if ! tar xzf "$TMP_WRITABLE/fcuk-gui.tgz" -C "$tmp_src"; then
    err "Failed to extract GUI release tarball"
    return 1
  fi

  rm -rf "$GUI_DIR"
  mkdir -p "$(dirname "$GUI_DIR")"
  if ! cp -a "$tmp_src/datro-financecheque-v$GUI_VERSION/agentos/gui" "$GUI_DIR"; then
    err "agentos/gui not found in the release tarball"
    rm -rf "$tmp_src" "$TMP_WRITABLE/fcuk-gui.tgz"
    return 1
  fi
  rm -rf "$tmp_src" "$TMP_WRITABLE/fcuk-gui.tgz"
  ok "GUI source at $GUI_DIR"

  info "Installing GUI dependencies (npm install — can take a few minutes)..."
  ( cd "$GUI_DIR"
    "$NPM_BIN" install --no-audit --no-fund --no-update-notifier >> "$GUI_DIR/install.log" 2>&1
  ) || { err "npm install failed — see $GUI_DIR/install.log"; return 1; }
  # npm 11 blocks postinstall scripts until approved — run them so esbuild/sharp work
  ( cd "$GUI_DIR"
    "$NPM_BIN" approve-scripts --allow-scripts-pending >> "$GUI_DIR/install.log" 2>&1 || true
    "$NPM_BIN" rebuild >> "$GUI_DIR/install.log" 2>&1 || true
  )
  if [[ ! -x "$GUI_DIR/node_modules/.bin/next" ]]; then
    err "GUI dependency install failed (next binary missing) — see $GUI_DIR/install.log"
    return 1
  fi

  info "Building the GUI (next build — first run is slow on small machines)..."
  local build_args=()
  # Turbopack has no native bindings for Android/arm64 — use Webpack instead
  if [[ "$PLATFORM" == termux* ]]; then
    build_args=(--webpack)
  fi
  ( cd "$GUI_DIR"
    NODE_OPTIONS="--max-old-space-size=1400" "$NPX_BIN" next build "${build_args[@]}" >> "$GUI_DIR/gui-build.log" 2>&1
  ) || { err "GUI build failed — see $GUI_DIR/gui-build.log"; return 1; }
  if [[ ! -d "$GUI_DIR/.next" ]]; then
    err "GUI build failed (.next missing) — see $GUI_DIR/gui-build.log"
    return 1
  fi
  ok "GUI built (web chat at http://localhost:$GUI_PORT)"
}

# ── Create systemd service for the GUI (optional) ────────────────────────────
install_gui_service() {
  free_gui_port
  if [[ ! -d /etc/systemd/system ]] || [[ "$(id -u)" -eq 0 ]]; then
    return 1  # no systemd → caller uses nohup fallback
  fi

  local service_dir="$HOME/.config/systemd/user"
  mkdir -p "$service_dir"

  cat > "$service_dir/agentos-gui.service" << SVCEOF
[Unit]
Description=AgentOS Child Proxy GUI (port $GUI_PORT)
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
WorkingDirectory=$GUI_DIR
Environment=HOME=$HOME
Environment=PATH=$NODE_BIN_DIR:$HOME/.local/bin:/usr/local/bin:/usr/bin:/bin
Environment=NODE_ENV=production
Environment=PORT=$GUI_PORT
Environment=HOSTNAME=0.0.0.0
Environment=AGENTOS_GUI_DIR=$GUI_DIR
Environment=FCUK_AGENT_URL=http://127.0.0.1:$PROXY_PORT/v1
EnvironmentFile=$INSTALL_DIR/.env
ExecStart=$GUI_DIR/node_modules/.bin/next start -p $GUI_PORT -H 0.0.0.0
Restart=on-failure
RestartSec=5

[Install]
WantedBy=default.target
SVCEOF

  # ── Hermes profile engines (on-demand Support + Main agents) ──
  if [[ -d "$INSTALL_DIR/public/fcukproxy/hermes" ]]; then
    mkdir -p "$HOME/.fcukproxy/hermes"
    cp -f "$INSTALL_DIR/public/fcukproxy/hermes/"*.sh "$HOME/.fcukproxy/hermes/" 2>/dev/null || true
    cp -f "$INSTALL_DIR/public/fcukproxy/hermes/"*.mjs "$HOME/.fcukproxy/hermes/" 2>/dev/null || true
    chmod +x "$HOME/.fcukproxy/hermes/"*.sh 2>/dev/null || true
  fi

  # ── Task Router (chat pipeline: task-router :3200 → omniroute :20128) ──
  if [[ -f "$INSTALL_DIR/agentos/task-router.mjs" ]]; then
    mkdir -p "$HOME/.fcukproxy/omniroute"
    cp -f "$INSTALL_DIR/agentos/task-router.mjs" "$HOME/.fcukproxy/omniroute/task-router.mjs"
    chmod +x "$HOME/.fcukproxy/omniroute/task-router.mjs" 2>/dev/null || true
  fi

  # ── Utility services (all DISABLED by default — on-demand only; the GUI
  #    is the only service enabled at boot) ──
  local _NODE="" $_SUB="" _OBIN=""
  _NODE="$NODE_BIN_DIR/node"
  [[ -x "$_NODE" ]] || _NODE="$(command -v node || true)"
  _SUB="$(command -v systemctl || true)"
  if [[ -n "$_NODE" ]]; then
    cat > "$service_dir/task-router.service" << TSEOF
[Unit]
Description=AgentOS Task Router (port 3200)
After=network-online.target

[Service]
Type=simple
WorkingDirectory=$HOME/.fcukproxy/omniroute
ExecStart=$_NODE $HOME/.fcukproxy/omniroute/task-router.mjs
Environment=NODE_ENV=production
Environment=PORT=3200
Environment=OMNIRUTE_URL=http://localhost:20128
Restart=on-failure
RestartSec=5
MemoryMax=256M
MemoryHigh=192M

[Install]
WantedBy=default.target
TSEOF

    cat > "$service_dir/hermes-local.service" << HLEOF
[Unit]
Description=Hermes Support Agent (ollama-cloud, port 18789)
After=network-online.target

[Service]
Type=simple
ExecStart=$HOME/.fcukproxy/hermes/hermes-support.sh start
ExecStop=$HOME/.fcukproxy/hermes/hermes-support.sh stop
Environment=HOME=$HOME
Environment=PATH=$NODE_BIN_DIR:$HOME/.local/bin:/usr/local/bin:/usr/bin:/bin
Restart=on-failure
RestartSec=5
TimeoutStopSec=30
MemoryMax=512M
MemoryHigh=384M

[Install]
WantedBy=default.target
HLEOF

    cat > "$service_dir/hermes-proxy.service" << HPEOF
[Unit]
Description=Hermes Main Agent (local MiniCPM via Ollama + OmniRoute)
After=network-online.target

[Service]
Type=oneshot
RemainAfterExit=yes
ExecStart=$HOME/.fcukproxy/hermes/hermes-main.sh start
ExecStop=$HOME/.fcukproxy/hermes/hermes-main.sh stop
Environment=HOME=$HOME
Environment=PATH=$NODE_BIN_DIR:$HOME/.local/bin:/usr/local/bin:/usr/bin:/bin
TimeoutStartSec=300
TimeoutStopSec=30

[Install]
WantedBy=default.target
HPEOF
  fi

  send "Disabling non-GUI services by default (on-demand only)..." 2>/dev/null || true
  for _svc in whisper-stt whisper-realtime omniroute task-router hermes-local hermes-proxy openclaw-gateway graphrag fcukproxy-child; do
    systemctl --user disable "$_svc.service" 2>/dev/null || true
  done

  systemctl --user daemon-reload 2>/dev/null || true
  systemctl --user enable agentos-gui 2>/dev/null || true
  if ! systemctl --user start agentos-gui 2>/dev/null; then
    warn "GUI systemd start failed — falling back to a background start"
    return 1
  fi
  sleep 2
  if ! systemctl --user is-active --quiet agentos-gui 2>/dev/null; then
    warn "agentos-gui.service is not active — falling back to a background start"
    return 1
  fi
  ok "GUI systemd service installed and started"
  return 0
}

# ── Start the GUI in the background (no systemd) ─────────────────────────────
start_gui_nohup() {
  free_gui_port
  info "Starting GUI in the background (no systemd)..."
  ( cd "$GUI_DIR"
    env HOME="$HOME" PATH="$NODE_BIN_DIR:$HOME/.local/bin:/usr/local/bin:/usr/bin:/bin" \
        NODE_ENV=production PORT="$GUI_PORT" HOSTNAME="0.0.0.0" \
        AGENTOS_GUI_DIR="$GUI_DIR" FCUK_AGENT_URL="http://127.0.0.1:$PROXY_PORT/v1" \
        nohup ./node_modules/.bin/next start -p "$GUI_PORT" -H 0.0.0.0 >> "$GUI_DIR/gui.log" 2>&1 &
    echo $! > "$GUI_DIR/gui.pid"
  )
  ok "GUI started (PID: $(cat "$GUI_DIR/gui.pid"))"

  # Ensure GUI restarts on Termux boot (no systemd — write a termux-boot script)
  if [[ "$PLATFORM" == termux* && -d "$HOME/.termux/boot" ]]; then
    local boot_script="$HOME/.termux/boot/start-fcukproxy.sh"
    if ! grep -q "AGENTOS_GUI_DIR" "$boot_script" 2>/dev/null; then
      info "Adding GUI startup to $boot_script..."
      cat >> "$boot_script" << BOOTEOF

# Start the AgentOS GUI (not managed by runit — started via nohup)
sleep 10
GUI_DIR=$HOME/.fcukproxy/agentos-gui
if [[ -d "\$GUI_DIR/.next" ]] && ! kill -0 \$(cat "\$GUI_DIR/gui.pid" 2>/dev/null) 2>/dev/null; then
  echo "[boot \$(date +%H:%M:%S)] starting GUI on :$GUI_PORT" >> "\$LOG" 2>&1
  cd "\$GUI_DIR"
  env HOME=\$HOME PATH=$NODE_BIN_DIR:\$HOME/.local/bin:\$PREFIX/bin:\$PATH \\
      NODE_ENV=production PORT=$GUI_PORT HOSTNAME=0.0.0.0 \\
      AGENTOS_GUI_DIR=\$GUI_DIR FCUK_AGENT_URL=http://127.0.0.1:$PROXY_PORT/v1 \\
      nohup ./node_modules/.bin/next start -p $GUI_PORT -H 0.0.0.0 >> gui.log 2>&1 &
  echo \$! > gui.pid
  echo "[boot \$(date +%H:%M:%S)] GUI PID: \$!" >> "\$LOG" 2>&1
fi
BOOTEOF
      ok "GUI will auto-start on Termux boot"
    fi
  fi
}

# ── Verify the GUI is serving ────────────────────────────────────────────────
verify_gui() {
  info "Waiting for the GUI on port $GUI_PORT..."
  local tries=0
  until curl -sf "http://127.0.0.1:$GUI_PORT/" >/dev/null 2>&1; do
    tries=$((tries + 1))
    [[ $tries -ge 60 ]] && break
    sleep 1
  done
  if curl -sf "http://127.0.0.1:$GUI_PORT/" >/dev/null 2>&1; then
    ok "Chat GUI responding at http://localhost:$GUI_PORT"
  else
    warn "GUI not responding yet — check: journalctl --user -u agentos-gui -f"
    warn "or tail -f $GUI_DIR/gui.log"
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
  echo -e "  ${CYAN}Chat GUI:${NC}      http://localhost:$GUI_PORT"
  if [[ "$MODE" == "full" ]]; then
    echo -e "  ${CYAN}LLM port:${NC}      $LLAMA_PORT"
    echo -e "  ${CYAN}Model:${NC}         $INSTALL_DIR/models/model.gguf"
  fi
  echo -e "  ${CYAN}Config:${NC}        $INSTALL_DIR/"
  echo -e "  ${CYAN}Logs:${NC}          $INSTALL_DIR/agent.log"
  echo ""
  echo -e "  ${YELLOW}Next steps:${NC}"
  echo "  1. Open the chat GUI:   http://localhost:$GUI_PORT"
  echo "     (Chat is wired to the child proxy — the parent's LLMs answer.)"
  echo ""
  echo "  2. (Optional) Add at least one API key to $INSTALL_DIR/.env"
  echo "     (Groq is free: https://console.groq.com/keys) and restart:"
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
  if [[ "$PLATFORM" == termux* ]]; then
    echo -e "  ${YELLOW}Android/Termux:${NC}"
    echo "  Keep the proxy + GUI alive in the background with:"
    echo "     termux-wake-lock"
    echo "  (No systemd on Termux — the GUI runs via nohup and logs to"
    echo "  $GUI_DIR/gui.log)"
    echo ""
  fi
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

  step 6 "Local chat GUI (AgentOS, port $GUI_PORT)"
  install_node "$PLATFORM" || warn "Node.js install failed — GUI will be skipped"
  NPM_BIN="$NODE_BIN_DIR/npm"
  NPX_BIN="$NODE_BIN_DIR/npx"
  install_gui || warn "GUI install failed — chat still works via the proxy API"

  step 7 "AI coding tools (kilo, opencode, kiro)"
  install_ai_tools || warn "Some AI tools failed to install — proxy still works without them"

  step 8 "Starting services"
  start_llm "$LLM_SERVER"

  if install_service; then
    info "Child proxy agent managed by systemd (fcuk-proxy.service)"
  else
    start_services
    install_pm2 || warn "No service manager found — agent runs in background only"
  fi

  if [[ -d "$GUI_DIR/.next" ]]; then
    install_gui_service || start_gui_nohup
  fi

  step 9 "Verification"
  verify_and_register
  verify_gui

  print_summary
}

main "$@"
