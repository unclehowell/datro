#!/bin/bash
set -euo pipefail

# ═══════════════════════════════════════════════════════════════════════════════
# FinanceCheque — Universal Installer
# ═══════════════════════════════════════════════════════════════════════════════
#
# One-liner install that works on laptops AND phones:
#
#   LAPTOPS (Linux/macOS):
#     curl -sL https://raw.githubusercontent.com/unclehowell/datro/financecheque/install.sh | PARENT_URL=https://financecheque.uk bash
#
#   PHONES (Android/Termux):
#     curl -sL https://raw.githubusercontent.com/unclehowell/datro/financecheque/install.sh | bash
#
#   FROM LAPTOP TO PHONE (ADB):
#     bash install.sh --adb
#
# Supports: Linux x86_64, Linux ARM64, macOS (Intel/Apple Silicon), Termux/Android
# Features: Child proxy agent, local LLM (MiniCPM), WebGUI, boot persistence
# ═══════════════════════════════════════════════════════════════════════════════

VERSION="0.6.1"
REPO="unclehowell/datro"
BRANCH="financecheque"
RAW_BASE="https://raw.githubusercontent.com/$REPO/$BRANCH"
GITHUB_RELEASES="https://github.com/$REPO/releases/download"

# ── Defaults ──────────────────────────────────────────────────────────────────
MODE="${MODE:-auto}"                     # auto | lite | full
PARENT_URL="${PARENT_URL:-https://www.financecheque.uk}"
CHILD_ID="${CHILD_ID:-}"
PROXY_PORT="${PROXY_PORT:-6000}"
GUI_PORT="${GUI_PORT:-3000}"
LLAMA_PORT="${LLAMA_PORT:-8090}"
INSTALL_DIR="${INSTALL_DIR:-}"
GROQ_API_KEY="${GROQ_API_KEY:-}"
ADB_MODE="${ADB_MODE:-0}"
DRY_RUN="${DRY_RUN:-0}"

# ── Colors ───────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'
CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

info()  { echo -e "${CYAN}[install]${NC} $*"; }
ok()    { echo -e "${GREEN}[install] ✓${NC} $*"; }
warn()  { echo -e "${YELLOW}[install] !${NC} $*"; }
err()   { echo -e "${RED}[install] ✗${NC} $*" >&2; }
step()  { echo -e "\n${BOLD}── Step $1: $2 ──${NC}"; }

# ── Parse args ────────────────────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case "$1" in
    --adb)        ADB_MODE=1; shift ;;
    --dry-run)    DRY_RUN=1; shift ;;
    --mode)       MODE="$2"; shift 2 ;;
    --parent)     PARENT_URL="$2"; shift 2 ;;
    --id)         CHILD_ID="$2"; shift 2 ;;
    --port)       PROXY_PORT="$2"; shift 2 ;;
    --groq-key)   GROQ_API_KEY="$2"; shift 2 ;;
    *)            shift ;;
  esac
done

# ── Detect platform ──────────────────────────────────────────────────────────
detect_platform() {
  local os arch

  # Check ADB first
  if [[ "$ADB_MODE" == "1" ]]; then
    echo "adb-arm64"
    return
  fi

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

# ── Detect if phone (reboot test) ────────────────────────────────────────────
is_phone() {
  local platform="$1"
  [[ "$platform" == termux-* || "$platform" == adb-* ]]
}

# ── Install system dependencies ──────────────────────────────────────────────
install_deps() {
  local platform="$1"

  case "$platform" in
    termux-*)
      pkg update -y 2>/dev/null || true
      pkg install -y python curl git 2>/dev/null || true
      ;;
    adb-*)
      info "ADB mode — dependencies will be installed on phone via Termux"
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
  if [[ "$platform" != adb-* ]]; then
    python3 -m pip --version &>/dev/null || {
      warn "pip not found, trying to install..."
      python3 -m ensurepip --upgrade 2>/dev/null || true
    }
  fi
}

# ═══════════════════════════════════════════════════════════════════════════════
# PHONE INSTALLATION (Termux or ADB)
# ═══════════════════════════════════════════════════════════════════════════════

install_phone_termux() {
  local platform="$1"

  step 1 "Installing Termux dependencies"
  pkg update -y 2>/dev/null || true
  pkg install -y python curl git 2>/dev/null || true

  step 2 "Installing phone-agentos binary"
  install_phone_binary "$platform"

  step 3 "Installing llama-server + MiniCPM model"
  install_phone_llm

  step 4 "Creating startup script"
  create_start_script

  step 5 "Installing Termux:Boot for auto-start"
  install_termux_boot

  step 6 "Starting services"
  start_phone_services

  step 7 "Boot persistence setup"
  setup_boot_persistence

  print_phone_summary
}

install_phone_binary() {
  local platform="$1"
  local bin_dir="/data/local/tmp"
  local binary_url="$RAW_BASE/phone-agentos.go"

  mkdir -p "$INSTALL_DIR"

  # Check if we have a pre-built binary in the release
  local release_url="$GITHUB_RELEASES/financecheque-v$(cat /home/unclehowell/.codex-worktrees/datro-financecheque/.version 2>/dev/null || echo '0.5.1.33')/phone-agentos-arm64"

  if [[ "$platform" == adb-* ]]; then
    # ADB mode: push from laptop
    info "ADB mode: building and pushing phone-agentos to phone..."

    local tmpdir
    tmpdir=$(mktemp -d)
    cd "$tmpdir"

    # Download source
    curl -sL "$binary_url" -o phone-agentos.go

    # Build for arm64
    info "Building Go binary for arm64..."
    CGO_ENABLED=0 GOOS=linux GOARCH=arm64 go build -ldflags="-s -w" -o phone-agentos phone-agentos.go

    # Push to phone
    adb push phone-agentos "$bin_dir/phone-agentos"
    adb shell "chmod +x $bin_dir/phone-agentos"

    # Push phone-gui files (for embedding reference — they're compiled in)
    cd /home/unclehowell/.codex-worktrees/datro-financecheque
    rm -rf "$tmpdir"

    ok "phone-agentos pushed to $bin_dir/phone-agentos"
  else
    # Termux mode: download pre-built or build from source
    if [[ ! -f "$bin_dir/phone-agentos" ]]; then
      info "Downloading phone-agentos source..."
      curl -sL "$binary_url" -o "$INSTALL_DIR/phone-agentos.go"

      # Check if Go is available
      if command -v go &>/dev/null; then
        info "Building phone-agentos from source..."
        cd "$INSTALL_DIR"
        CGO_ENABLED=0 GOOS=linux GOARCH=arm64 go build -ldflags="-s -w" -o "$bin_dir/phone-agentos" phone-agentos.go
      else
        warn "Go not found. Install: pkg install golang"
        warn "Then build: cd $INSTALL_DIR && CGO_ENABLED=0 GOOS=linux GOARCH=arm64 go build -o /data/local/tmp/phone-agentos phone-agentos.go"
      fi
    fi

    if [[ -f "$bin_dir/phone-agentos" ]]; then
      chmod +x "$bin_dir/phone-agentos"
      ok "phone-agentos ready at $bin_dir/phone-agentos"
    else
      err "phone-agentos binary not found. Install Go and rebuild."
    fi
  fi
}

install_phone_llm() {
  local bin_dir="/data/local/tmp"
  local model_dir="/sdcard/Download"
  local llama_dir="$bin_dir/llama-runtime"
  local model_file="$model_dir/model.gguf"
  local model_repo="ewinregirgojr/MiniCPM5-1B-Agentic-Tooluse-GGUF"
  local llamacpp_release="b9957"

  mkdir -p "$llama_dir"

  # Download model if not present
  if [[ ! -f "$model_file" ]]; then
    info "Downloading MiniCPM Q4_K_M model (657MB)..."
    curl -sL "https://huggingface.co/$model_repo/resolve/main/MiniCPM5-1B-Agentic-Tooluse-Nemotron-DPO.Q4_K_M.gguf" \
      -o "$model_file"
    ok "Model downloaded to $model_file"
  else
    ok "Model already present at $model_file"
  fi

  # Download llama-server for Android arm64
  if [[ ! -f "$llama_dir/llama-server" ]]; then
    info "Downloading llama-server for Android arm64..."
    curl -sL "https://github.com/ggml-org/llama.cpp/releases/download/$llamacpp_release/llama-$llamacpp_release-bin-android-arm64.tar.gz" \
      -o /tmp/llama.tar.gz
    tar xzf /tmp/llama.tar.gz -C "$llama_dir" --strip-components=1
    rm -f /tmp/llama.tar.gz
    chmod +x "$llama_dir/llama-server" 2>/dev/null || true
    ok "llama-server installed to $llama_dir"
  else
    ok "llama-server already present"
  fi
}

create_start_script() {
  local termux_home="/data/data/com.termux/files/home"
  local start_script="$termux_home/start-agentos.sh"

  cat > "$start_script" << 'STARTEOF'
#!/data/data/com.termux/files/usr/bin/sh
# AgentOS Phone — Startup Script

TERMUX_HOME="/data/data/com.termux/files/home"
LLAMA_DIR="/data/local/tmp/llama-runtime"
MODEL="/sdcard/Download/model.gguf"
LOG_DIR="/sdcard/Download"

LLAMA_BIN="$TERMUX_HOME/llama-server"
AGENT_BIN="$TERMUX_HOME/phone-agentos"
[[ ! -f "$LLAMA_BIN" ]] && LLAMA_BIN="$LLAMA_DIR/llama-server"
[[ ! -f "$AGENT_BIN" ]] && AGENT_BIN="/data/local/tmp/phone-agentos"

pkill -f "llama-server" 2>/dev/null || true
pkill -f "phone-agentos" 2>/dev/null || true
sleep 2

export LD_LIBRARY_PATH="$LLAMA_DIR:$TERMUX_HOME:$LD_LIBRARY_PATH"
chmod 755 "$LLAMA_BIN" 2>/dev/null || true
nohup "$LLAMA_BIN" \
  --model "$MODEL" \
  --port 8090 --host 127.0.0.1 \
  --ctx-size 2048 --n-gpu-layers 0 \
  > "$LOG_DIR/llama-server.log" 2>&1 &

echo "Waiting for llama-server..."
for i in $(seq 1 60); do
  if curl -s http://127.0.0.1:8090/health >/dev/null 2>&1; then
    echo "llama-server ready"
    break
  fi
  sleep 1
done

export GROQ_API_KEY="${GROQ_API_KEY:-}"
export PARENT_URL="${PARENT_URL:-https://www.financecheque.uk}"
export MACHINE_ID="${MACHINE_ID:-phone-$(date +%s)}"
export MACHINE_NAME="${MACHINE_NAME:-$MACHINE_ID}"
export PROXY_PORT="${PROXY_PORT:-6000}"
export GUI_PORT="${GUI_PORT:-3000}"
export MINICPM_PORT="${MINICPM_PORT:-8090}"
export DNS_SERVER="${DNS_SERVER:-8.8.8.8:53}"

chmod 755 "$AGENT_BIN" 2>/dev/null || true
nohup "$AGENT_BIN" > "$LOG_DIR/agentos-output.log" 2>&1 &
echo "phone-agentos started (PID: $!)"

sleep 3
if curl -s http://127.0.0.1:3000/api/health >/dev/null 2>&1; then
  echo "AgentOS phone: OK"
else
  echo "AgentOS phone: check logs at $LOG_DIR/agentos-output.log"
fi
STARTEOF

  chmod 755 "$start_script"
  ok "Startup script created at $start_script"
}

install_termux_boot() {
  local boot_apk_url="https://f-droid.org/repo/com.termux.boot_1000.apk"
  local boot_apk="/data/local/tmp/termux-boot.apk"

  # Check if Termux:Boot is already installed
  if pm list packages 2>/dev/null | grep -q "com.termux.boot"; then
    ok "Termux:Boot already installed"
    return
  fi

  info "Downloading Termux:Boot APK..."
  curl -sL "$boot_apk_url" -o "$boot_apk"

  if [[ -f "$boot_apk" && -s "$boot_apk" ]]; then
    info "Installing Termux:Boot..."
    if pm install -r "$boot_apk" 2>/dev/null; then
      ok "Termux:Boot installed"
      # Launch it once to enable the boot receiver
      am start -n com.termux.boot/.BootActivity 2>/dev/null || true
    else
      warn "Termux:Boot install failed — boot persistence requires manual setup"
      warn "Install Termux:Boot from F-Droid or use: am start-foreground-service"
    fi
  else
    warn "Termux:Boot download failed"
  fi
}

setup_boot_persistence() {
  local termux_home="/data/data/com.termux/files/home"
  local boot_script_dir="$termux_home/.termux/boot"
  local boot_script="$boot_script_dir/start-agentos.sh"

  mkdir -p "$boot_script_dir"

  cat > "$boot_script" << 'BOOLEOF'
#!/data/data/com.termux/files/usr/bin/sh
# Auto-start AgentOS on device boot
# Installed by FinanceCheque installer
sleep 15
sh /data/data/com.termux/files/home/start-agentos.sh > /dev/null 2>&1 &
BOOLEOF

  chmod 755 "$boot_script"
  ok "Boot persistence configured at $boot_script"
  info "AgentOS will auto-start after next reboot"
}

start_phone_services() {
  local termux_home="/data/data/com.termux/files/home"
  info "Starting services..."
  sh "$termux_home/start-agentos.sh"
}

print_phone_summary() {
  echo ""
  echo -e "${BOLD}══════════════════════════════════════════════════════════════${NC}"
  echo -e "${BOLD}  FinanceCheque AgentOS — Phone Installed${NC}"
  echo -e "${BOLD}══════════════════════════════════════════════════════════════${NC}"
  echo ""
  echo -e "  ${CYAN}WebGUI:${NC}        http://localhost:$GUI_PORT"
  echo -e "  ${CYAN}Child Proxy:${NC}   port $PROXY_PORT"
  echo -e "  ${CYAN}Local LLM:${NC}     port $LLAMA_PORT (MiniCPM5-1B)"
  echo -e "  ${CYAN}Parent:${NC}        $PARENT_URL"
  echo -e "  ${CYAN}Model:${NC}         /sdcard/Download/model.gguf"
  echo -e "  ${CYAN}Binary:${NC}        /data/local/tmp/phone-agentos"
  echo -e "  ${CYAN}Boot:${NC}          Termux:Boot → auto-start on reboot"
  echo ""
  echo -e "  ${YELLOW}Works regardless of screen lock — Termux runs in background${NC}"
  echo ""
  echo -e "  ${YELLOW}Next steps:${NC}"
  echo "  1. Open http://localhost:$GUI_PORT on your phone"
  echo "  2. Or access from laptop: http://$(hostname -I 2>/dev/null | awk '{print $1}':$GUI_PORT)"
  echo "  3. Chat uses local MiniCPM → Groq fallback"
  echo ""
  echo -e "${BOLD}══════════════════════════════════════════════════════════════${NC}"
}

# ═══════════════════════════════════════════════════════════════════════════════
# LAPTOP INSTALLATION (Linux/macOS)
# ═══════════════════════════════════════════════════════════════════════════════

install_laptop() {
  local platform="$1"

  step 1 "System dependencies"
  install_deps "$platform"

  step 2 "Child proxy agent"
  install_agent

  step 3 "Configuration"
  write_config

  LLM_SERVER=""
  if [[ "$MODE" == "full" ]]; then
    step 4 "Local LLM (llama-server + MiniCPM)"
    LLM_SERVER=$(install_llm "$platform")
  fi

  step 5 "Starting services"
  start_services "$LLM_SERVER"

  step 6 "Service persistence"
  install_service || install_pm2 || warn "No service manager found — agent runs in background only"

  step 7 "Verification"
  verify_and_register

  print_laptop_summary
}

# ── Download child proxy agent ───────────────────────────────────────────────
install_agent() {
  mkdir -p "$INSTALL_DIR"
  info "Downloading child proxy agent..."
  curl -sL "$RAW_BASE/public/fcukproxy/agent.py" -o "$INSTALL_DIR/agent.py"
  info "Installing Python dependencies..."
  python3 -m pip install --quiet --user aiohttp 2>/dev/null || \
    python3 -m pip install --quiet aiohttp 2>/dev/null || true
}

# ── Install llama-server + MiniCPM (full mode only) ──────────────────────────
install_llm() {
  local platform="$1"
  local model_repo="ewinregirgojr/MiniCPM5-1B-Agentic-Tooluse-GGUF"
  local llamacpp_release="b5541"
  local model_dir="$INSTALL_DIR/models"
  mkdir -p "$model_dir"

  local llm_server=""

  case "$platform" in
    linux-arm64)
      if [[ ! -f "$model_dir/model.gguf" ]]; then
        info "Downloading MiniCPM Q4_K_M for ARM64..."
        curl -sL "https://huggingface.co/$model_repo/resolve/main/MiniCPM5-1B-Agentic-Tooluse-Nemotron-DPO.Q4_K_M.gguf" \
          -o "$model_dir/model.gguf"
      fi
      if ! command -v llama-server &>/dev/null; then
        curl -sL "https://github.com/ggml-org/llama.cpp/releases/download/$llamacpp_release/llama-$llamacpp_release-bin-ubuntu-arm64.tar.gz" \
          -o /tmp/llama.tar.gz
        sudo tar xzf /tmp/llama.tar.gz -C /usr/local/bin/ --strip-components=1 \
          --wildcards '*/llama-server' '*/libllama*' '*/libggml*' 2>/dev/null || true
        llm_server="$(command -v llama-server || echo /usr/local/bin/llama-server)"
      else
        llm_server="$(command -v llama-server)"
      fi
      ;;
    linux-x64|macos-*)
      if [[ ! -f "$model_dir/model.gguf" ]]; then
        info "Downloading MiniCPM Q8_0 for x64..."
        curl -sL "https://huggingface.co/$model_repo/resolve/main/MiniCPM5-1B-Agentic-Tooluse-Nemotron-DPO.Q8_0.gguf" \
          -o "$model_dir/model.gguf"
      fi
      if ! command -v llama-server &>/dev/null; then
        curl -sL "https://github.com/ggml-org/llama.cpp/releases/download/$llamacpp_release/llama-$llamacpp_release-bin-ubuntu-x64.tar.gz" \
          -o /tmp/llama.tar.gz
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

# ── Write config files ───────────────────────────────────────────────────────
write_config() {
  mkdir -p "$INSTALL_DIR"

  cat > "$INSTALL_DIR/machine.json" << JSONEOF
{
  "machine_id": "$CHILD_ID",
  "machine_name": "$CHILD_ID",
  "proxy_port": $PROXY_PORT,
  "parent": "$PARENT_URL",
  "version": "$VERSION",
  "mode": "$MODE"
}
JSONEOF

  if [[ ! -f "$INSTALL_DIR/.env" ]]; then
    cat > "$INSTALL_DIR/.env" << ENVEOF
# FinanceCheque Child Proxy — API Keys
# Add at least one provider key (Groq is free: https://console.groq.com/keys)

GROQ_API_KEY=$GROQ_API_KEY
OPENROUTER_API_KEY=
GOOGLE_API_KEY=
OPENAI_API_KEY=
ANTHROPIC_API_KEY=

# Node identity
PARENT_URL=$PARENT_URL
CHILD_ID=$CHILD_ID
MACHINE_ID=$CHILD_ID
PROXY_PORT=$PROXY_PORT
ENVEOF
    info "Created $INSTALL_DIR/.env"
  fi
}

# ── Start services ───────────────────────────────────────────────────────────
start_services() {
  local llm_server="${1:-}"
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

# ── Create systemd service ──────────────────────────────────────────────────
install_service() {
  if [[ ! -d /etc/systemd/system ]] || [[ "$(id -u)" -eq 0 ]]; then
    return 0
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

  systemctl --user daemon-reload 2>/dev/null || true
  systemctl --user enable fcuk-proxy 2>/dev/null || true
  systemctl --user start fcuk-proxy 2>/dev/null || true
  ok "systemd service installed and started"
}

# ── Create pm2 process ──────────────────────────────────────────────────────
install_pm2() {
  if command -v pm2 &>/dev/null; then
    pm2 delete fcuk-proxy 2>/dev/null || true
    pm2 start "$INSTALL_DIR/agent.py" --name fcuk-proxy --interpreter python3 -- --port "$PROXY_PORT"
    pm2 save 2>/dev/null || true
    ok "pm2 process started"
  fi
}

# ── Register with parent and verify ──────────────────────────────────────────
verify_and_register() {
  sleep 3
  info "Verifying child proxy..."
  if curl -sf "http://127.0.0.1:$PROXY_PORT/health" >/dev/null 2>&1; then
    ok "Child proxy responding on port $PROXY_PORT"
  else
    warn "Child proxy not responding yet — check: tail -f $INSTALL_DIR/agent.log"
  fi

  if [[ "$MODE" == "full" ]]; then
    if curl -sf "http://127.0.0.1:$LLAMA_PORT/health" >/dev/null 2>&1; then
      ok "llama-server responding on port $LLAMA_PORT"
    else
      warn "llama-server not responding yet — check: tail -f $INSTALL_DIR/llama-server.log"
    fi
  fi

  info "Registering with parent: $PARENT_URL"
  local payload
  payload=$(cat << JSONEOF
{
  "machine_id": "$CHILD_ID",
  "machine_name": "$CHILD_ID",
  "proxy_port": $PROXY_PORT,
  "version": "$VERSION",
  "mode": "$MODE"
}
JSONEOF
)
  if curl -sf -X POST "$PARENT_URL/api/proxy?action=register" \
    -H "Content-Type: application/json" \
    -d "$payload" >/dev/null 2>&1; then
    ok "Registered with parent proxy"
  else
    warn "Could not register with parent — agent will retry every 60s"
  fi
}

print_laptop_summary() {
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
  echo ""
  echo -e "  ${YELLOW}Next steps:${NC}"
  echo "  1. Add API keys to $INSTALL_DIR/.env"
  echo "  2. Restart: systemctl --user restart fcuk-proxy"
  echo "  3. Verify: curl -s $PARENT_URL/api/proxy?action=health"
  echo ""
  echo -e "  ${YELLOW}Scale:${NC} Run this script on other machines with same PARENT_URL"
  echo ""
  echo -e "${BOLD}══════════════════════════════════════════════════════════════${NC}"
}

# ═══════════════════════════════════════════════════════════════════════════════
# ADB INSTALLATION (from laptop to phone)
# ═══════════════════════════════════════════════════════════════════════════════

install_via_adb() {
  step 1 "Checking ADB connection"
  if ! command -v adb &>/dev/null; then
    err "ADB not found. Install Android platform-tools."
    exit 1
  fi

  local device
  device=$(adb devices -l 2>/dev/null | grep -E 'device$' | head -1 | awk '{print $1}')
  if [[ -z "$device" ]]; then
    err "No ADB device connected"
    exit 1
  fi
  ok "ADB device: $device"

  step 2 "Installing Termux on phone (if needed)"
  # Check if Termux is installed
  if ! adb shell "pm list packages | grep com.termux" 2>/dev/null | grep -q com.termux; then
    info "Termux not found on phone. Installing..."
    # Download Termux APK
    local termux_apk="/tmp/termux.apk"
    curl -sL "https://f-droid.org/repo/com.termux_1000.apk" -o "$termux_apk"
    adb install "$termux_apk" 2>/dev/null || {
      warn "Termux install failed — please install Termux from F-Droid manually"
    }
  fi

  step 3 "Building and pushing phone-agentos"
  install_phone_binary "adb-arm64"

  step 4 "Pushing llama-server + model"
  install_phone_llm_adb

  step 5 "Creating startup script on phone"
  create_start_script_adb

  step 6 "Installing Termux:Boot"
  install_termux_boot_adb

  step 7 "Starting services on phone"
  start_services_adb

  print_adb_summary
}

install_phone_llm_adb() {
  local bin_dir="/data/local/tmp"
  local model_file="/sdcard/Download/model.gguf"
  local llama_dir="$bin_dir/llama-runtime"
  local model_repo="ewinregirgojr/MiniCPM5-1B-Agentic-Tooluse-GGUF"
  local llamacpp_release="b9957"

  # Download model locally if not present
  if [[ ! -f "$HOME/phone-ai-stack/model.gguf" ]]; then
    info "Downloading MiniCPM model locally..."
    mkdir -p "$HOME/phone-ai-stack"
    curl -sL "https://huggingface.co/$model_repo/resolve/main/MiniCPM5-1B-Agentic-Tooluse-Nemotron-DPO.Q4_K_M.gguf" \
      -o "$HOME/phone-ai-stack/model.gguf"
  fi

  # Push model to phone
  info "Pushing model to phone (657MB, may take a few minutes)..."
  adb push "$HOME/phone-ai-stack/model.gguf" "$model_file"

  # Download and push llama-server
  if [[ ! -d "$HOME/phone-ai-stack/llama" ]]; then
    info "Downloading llama-server for Android arm64..."
    mkdir -p "$HOME/phone-ai-stack"
    curl -sL "https://github.com/ggml-org/llama.cpp/releases/download/$llamacpp_release/llama-$llamacpp_release-bin-android-arm64.tar.gz" \
      -o /tmp/llama.tar.gz
    tar xzf /tmp/llama.tar.gz -C "$HOME/phone-ai-stack/llama" --strip-components=1
    rm -f /tmp/llama.tar.gz
  fi

  # Push llama-server and libs to phone
  info "Pushing llama-server to phone..."
  adb shell "mkdir -p $llama_dir"
  adb push "$HOME/phone-ai-stack/llama/llama-server" "$llama_dir/llama-server"
  adb shell "chmod +x $llama_dir/llama-server"

  # Push shared libraries
  for lib in "$HOME/phone-ai-stack/llama/"*.so*; do
    if [[ -f "$lib" ]]; then
      adb push "$lib" "$llama_dir/"
    fi
  done

  ok "LLM stack pushed to phone"
}

create_start_script_adb() {
  local script="/tmp/start-agentos.sh"

  cat > "$script" << 'STARTEOF'
#!/data/data/com.termux/files/usr/bin/sh
# AgentOS Phone — Startup Script
BIN_DIR="/data/local/tmp"
LLAMA_DIR="$BIN_DIR/llama-runtime"
MODEL="/sdcard/Download/model.gguf"
LOG_DIR="/sdcard/Download"

pkill -f "llama-server" 2>/dev/null || true
pkill -f "phone-agentos" 2>/dev/null || true
sleep 2

export LD_LIBRARY_PATH="$LLAMA_DIR:$LD_LIBRARY_PATH"
nohup "$LLAMA_DIR/llama-server" \
  --model "$MODEL" \
  --port 8090 --host 127.0.0.1 \
  --ctx-size 2048 --n-gpu-layers 0 \
  > "$LOG_DIR/llama-server.log" 2>&1 &

for i in $(seq 1 30); do
  if curl -s http://127.0.0.1:8090/health >/dev/null 2>&1; then break; fi
  sleep 2
done

export GROQ_API_KEY="${GROQ_API_KEY:-}"
export PARENT_URL="${PARENT_URL:-https://www.financecheque.uk}"
export MACHINE_ID="${MACHINE_ID:-phone-$(date +%s)}"
export MACHINE_NAME="${MACHINE_NAME:-$MACHINE_ID}"
export PROXY_PORT="${PROXY_PORT:-6000}"
export GUI_PORT="${GUI_PORT:-3000}"
export MINICPM_PORT="${MINICPM_PORT:-8090}"
export DNS_SERVER="${DNS_SERVER:-8.8.8.8:53}"

nohup "$BIN_DIR/phone-agentos" > "$LOG_DIR/agentos-output.log" 2>&1 &
echo "phone-agentos started (PID: $!)"
STARTEOF

  adb push "$script" "/data/local/tmp/start-agentos.sh"
  adb shell "chmod 755 /data/local/tmp/start-agentos.sh"
  ok "Startup script pushed to phone"
}

install_termux_boot_adb() {
  local boot_apk="/tmp/termux-boot.apk"

  # Check if already installed
  if adb shell "pm list packages | grep com.termux.boot" 2>/dev/null | grep -q com.termux.boot; then
    ok "Termux:Boot already installed"
    return
  fi

  info "Downloading Termux:Boot APK..."
  curl -sL "https://f-droid.org/repo/com.termux.boot_1000.apk" -o "$boot_apk"

  adb push "$boot_apk" "/data/local/tmp/termux-boot.apk"
  if adb shell "pm install -r /data/local/tmp/termux-boot.apk" 2>/dev/null; then
    ok "Termux:Boot installed"
    adb shell "am start -n com.termux.boot/.BootActivity" 2>/dev/null || true
  else
    warn "Termux:Boot install failed"
  fi
}

start_services_adb() {
  info "Starting services on phone via ADB..."
  adb shell "sh /data/local/tmp/start-agentos.sh" 2>&1 || {
    warn "Could not start via ADB shell — services may need to be started from Termux"
  }
}

print_adb_summary() {
  echo ""
  echo -e "${BOLD}══════════════════════════════════════════════════════════════${NC}"
  echo -e "${BOLD}  FinanceCheque AgentOS — Phone Deployed via ADB${NC}"
  echo -e "${BOLD}══════════════════════════════════════════════════════════════${NC}"
  echo ""
  echo -e "  ${CYAN}WebGUI:${NC}        http://$(adb shell ip route 2>/dev/null | grep 'src' | awk '{print $9}' | head -1):$GUI_PORT"
  echo -e "  ${CYAN}Child Proxy:${NC}   port $PROXY_PORT"
  echo -e "  ${CYAN}Local LLM:${NC}     port $LLAMA_PORT"
  echo -e "  ${CYAN}Parent:${NC}        $PARENT_URL"
  echo ""
  echo -e "  ${YELLOW}Works regardless of screen lock — Termux runs in background${NC}"
  echo ""
  echo -e "  ${YELLOW}Boot persistence:${NC} Open Termux once, then run:"
  echo "    sh /sdcard/Download/setup-boot.sh"
  echo ""
  echo -e "${BOLD}══════════════════════════════════════════════════════════════${NC}"
}

# ═══════════════════════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════════════════════

main() {
  echo -e "${BOLD}FinanceCheque Universal Installer v$VERSION${NC}"

  PLATFORM=$(detect_platform)
  info "Platform: $PLATFORM"

  # Set INSTALL_DIR based on platform
  if [[ -z "$INSTALL_DIR" ]]; then
    case "$PLATFORM" in
      termux-*|adb-*)
        INSTALL_DIR="$HOME/fcuk-agentos"
        ;;
      *)
        INSTALL_DIR="$HOME/.fcukproxy"
        ;;
    esac
  fi

  # Set CHILD_ID if not provided
  if [[ -z "$CHILD_ID" ]]; then
    case "$PLATFORM" in
      termux-*)
        CHILD_ID="phone-$(getprop ro.product.model 2>/dev/null || echo 'android')"
        ;;
      adb-*)
        CHILD_ID="phone-$(adb shell getprop ro.product.model 2>/dev/null | tr -d '\r' || echo 'android')"
        ;;
      *)
        CHILD_ID="$(hostname)-$(date +%s | tail -c 5)"
        ;;
    esac
  fi

  # Normalize mode
  case "${MODE,,}" in
    full|heavy|local)  MODE="full" ;;
    lite|quick)        MODE="lite" ;;
    auto)
      # Auto-detect: phones default to full (local LLM), laptops default to lite
      if is_phone "$PLATFORM"; then
        MODE="full"
      else
        MODE="lite"
      fi
      ;;
    *)                 MODE="lite" ;;
  esac

  info "Mode: $MODE | Node: $CHILD_ID | Parent: $PARENT_URL"

  # Route to appropriate installer
  case "$PLATFORM" in
    adb-*)
      install_via_adb
      ;;
    termux-*)
      install_deps "$PLATFORM"
      install_phone_termux "$PLATFORM"
      ;;
    linux-*|macos-*)
      install_laptop "$PLATFORM"
      ;;
    *)
      err "Unsupported platform: $PLATFORM"
      exit 1
      ;;
  esac
}

main "$@"
