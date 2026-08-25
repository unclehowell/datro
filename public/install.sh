#!/bin/bash
set -euo pipefail

# ═══════════════════════════════════════════════════════════════════════════════
# FinanceCheque — Child Proxy Installer
# ═══════════════════════════════════════════════════════════════════════════════
#
# Installs the full child proxy stack:
#   • child-proxy.mjs        — OpenAI-compatible proxy agent (registers with parent)
#   • agentos-gui             — Next.js WebGUI at localhost:3000/chat
#   • llama-server + MiniCPM-1B — local LLM for offline/fallback inference
#   • Hermes, kiro-cli, kilo  — agent CLI tools
#   • STT/TTS voice service   — Whisper STT + Piper TTS
#   • pm2                     — process manager (auto-restart on boot)
#
# One-liner:
#   curl -fsSL https://www.financecheque.uk/fcukproxy/install.sh | bash
#
# Options (env vars):
#   PARENT_URL=https://www.financecheque.uk  (default)
#   PROXY_PORT=4001                           child-proxy.mjs listener port
#   GUI_PORT=3000                             WebGUI port
#   LLAMA_PORT=8090                           llama-server port
#   INSTALL_DIR=$HOME/fcuk-child-proxy
#   GROQ_API_KEY=gsk_...                      optional cloud LLM key
#   STT_PROVIDER=groq|whisper-local           speech-to-text backend
#
# Supports: Linux x86_64, Linux ARM64, macOS, Termux/Android
# ═══════════════════════════════════════════════════════════════════════════════

VERSION="1.7.17"
REPO="unclehowell/datro"
BRANCH="financecheque"
RAW_BASE="https://raw.githubusercontent.com/$REPO/$BRANCH"

PARENT_URL="${PARENT_URL:-https://www.financecheque.uk}"
PROXY_PORT="${PROXY_PORT:-4001}"
AGENT_PORT="${AGENT_PORT:-6100}"
GUI_PORT="${GUI_PORT:-3000}"
LLAMA_PORT="${LLAMA_PORT:-8090}"
INSTALL_DIR="${INSTALL_DIR:-$HOME/fcuk-child-proxy}"
GROQ_API_KEY="${GROQ_API_KEY:-}"
STT_PROVIDER="${STT_PROVIDER:-groq}"
DRY_RUN="${DRY_RUN:-0}"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'
info()  { echo -e "${CYAN}[install]${NC} $*"; }
ok()    { echo -e "${GREEN}[install] ✓${NC} $*"; }
warn()  { echo -e "${YELLOW}[install] !${NC} $*"; }
err()   { echo -e "${RED}[install] ✗${NC} $*" >&2; }
step()  { echo -e "\n${BOLD}── $1 ──${NC}"; }

# ── Detect platform ──────────────────────────────────────────────────────────
case "$(uname -m)" in
  x86_64|amd64) ARCH="x64" ;;
  aarch64|arm64) ARCH="arm64" ;;
  *) ARCH="x64" ;;
esac

if [[ -n "${TERMUX_VERSION:-}" || -d "/data/data/com.termux" ]]; then
  PLATFORM="termux"
elif [[ "$(uname -s)" == "Darwin" ]]; then
  PLATFORM="macos"
else
  PLATFORM="linux"
fi

info "Platform: $PLATFORM/$ARCH  Version: $VERSION"
mkdir -p "$INSTALL_DIR/models"

# ── Step 1: System dependencies ──────────────────────────────────────────────
step "Step 1: System dependencies"
if [[ "$PLATFORM" == "termux" ]]; then
  pkg update -y 2>/dev/null || true
  pkg install -y nodejs python3 curl git 2>/dev/null || true
elif [[ "$PLATFORM" == "linux" ]]; then
  if command -v apt &>/dev/null; then
    sudo apt-get update -qq 2>/dev/null || true
    sudo apt-get install -y -qq curl git python3 python3-pip nodejs npm ffmpeg 2>/dev/null || true
  fi
fi
ok "System dependencies ready"

# ── Step 2: Node.js / npm ────────────────────────────────────────────────────
step "Step 2: Node.js / npm"
if ! command -v node &>/dev/null; then
  warn "node not found — installing via nvm"
  export NVM_DIR="$HOME/.nvm"
  curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash 2>/dev/null
  # shellcheck disable=SC1090
  source "$NVM_DIR/nvm.sh" 2>/dev/null || true
  nvm install --lts 2>/dev/null || true
fi
NODE_VERSION=$(node --version 2>/dev/null || echo "missing")
ok "Node: $NODE_VERSION"

# ── Step 3: llama-server + MiniCPM-1B model ─────────────────────────────────
step "Step 3: Local LLM (MiniCPM-1B)"
MODEL_REPO="ewinregirgojr/MiniCPM5-1B-Agentic-Tooluse-GGUF"
LLAMACPP_REL="b9957"

if [ ! -f "$INSTALL_DIR/models/model.gguf" ]; then
  info "Downloading MiniCPM-1B Q4_K_M (~650MB)..."
  curl -fL "https://huggingface.co/$MODEL_REPO/resolve/main/MiniCPM5-1B-Agentic-Tooluse-Nemotron-DPO.Q4_K_M.gguf" \
    -o "$INSTALL_DIR/models/model.gguf"
  ok "Model downloaded"
else
  ok "Model already present"
fi

if ! command -v llama-server &>/dev/null; then
  info "Installing llama-server..."
  if [[ "$PLATFORM" == "linux" && "$ARCH" == "x64" ]]; then
    curl -fL "https://github.com/ggml-org/llama.cpp/releases/download/$LLAMACPP_REL/llama-$LLAMACPP_REL-bin-ubuntu-x64.tar.gz" \
      -o /tmp/llama.tar.gz
    sudo tar xzf /tmp/llama.tar.gz -C /usr/local/bin/ --strip-components=1 --wildcards '*/llama-server' 2>/dev/null || true
  elif [[ "$PLATFORM" == "linux" && "$ARCH" == "arm64" ]]; then
    curl -fL "https://github.com/ggml-org/llama.cpp/releases/download/$LLAMACPP_REL/llama-$LLAMACPP_REL-bin-ubuntu-arm64.tar.gz" \
      -o /tmp/llama.tar.gz
    sudo tar xzf /tmp/llama.tar.gz -C /usr/local/bin/ --strip-components=1 --wildcards '*/llama-server' 2>/dev/null || true
  elif [[ "$PLATFORM" == "macos" ]]; then
    brew install llama.cpp 2>/dev/null || warn "brew install failed — try: brew install llama.cpp"
  fi
fi
command -v llama-server &>/dev/null && ok "llama-server ready" || warn "llama-server not found — voice/local-LLM features may be limited"

# ── Step 4: child-proxy.mjs ──────────────────────────────────────────────────
step "Step 4: Child proxy agent"
curl -fsSL "$RAW_BASE/public/fcukproxy/child-proxy.mjs" -o "$INSTALL_DIR/child-proxy.mjs"
chmod +x "$INSTALL_DIR/child-proxy.mjs"
ok "child-proxy.mjs downloaded"

# ── Step 5: AgentOS GUI (WebGUI at localhost:GUI_PORT) ───────────────────────
step "Step 5: AgentOS WebGUI (localhost:$GUI_PORT)"
GUI_DIR="$INSTALL_DIR/agentos-gui"

if [ -d "$GUI_DIR/.git" ]; then
  info "Updating existing agentos-gui..."
  git -C "$GUI_DIR" pull --ff-only 2>/dev/null || true
else
  info "Cloning agentos-gui from $BRANCH branch..."
  git clone --depth 1 --branch "$BRANCH" \
    "https://github.com/$REPO.git" "$GUI_DIR/repo" 2>/dev/null || \
  git clone --depth 1 "https://github.com/$REPO.git" "$GUI_DIR/repo" 2>/dev/null
  # The GUI lives at agentos/gui inside the repo
  cp -r "$GUI_DIR/repo/agentos/gui/." "$GUI_DIR/"
  rm -rf "$GUI_DIR/repo"
fi

cd "$GUI_DIR"
info "Installing npm dependencies..."
npm install --prefer-offline 2>/dev/null || npm install

# Write .env.local with local LLM config pointing at our llama-server + child proxy
cat > "$GUI_DIR/.env.local" << ENVEOF
# Child proxy WebGUI environment
# Local LLM via llama-server
LOCAL_LLM_URL=http://127.0.0.1:${LLAMA_PORT}
LOCAL_LLM_MODEL=minicpm-1b

# Child proxy routes through parent for cloud LLM fallback
PROXY_URL=http://127.0.0.1:${PROXY_PORT}
PARENT_PROXY_URL=${PARENT_URL}

# STT/TTS
STT_PROVIDER=${STT_PROVIDER}
GROQ_API_KEY=${GROQ_API_KEY}

# Ports
GUI_PORT=${GUI_PORT}
LLAMA_PORT=${LLAMA_PORT}
PROXY_PORT=${PROXY_PORT}
ENVEOF

info "Building WebGUI..."
npm run build 2>/dev/null
ok "WebGUI built"
cd - > /dev/null

# ── Step 6: Agent CLI tools ──────────────────────────────────────────────────
step "Step 6: Agent CLI tools"
export PATH="$HOME/.npm-global/bin:$HOME/.local/bin:$PATH"
mkdir -p "$HOME/.npm-global"
npm config set prefix "$HOME/.npm-global" 2>/dev/null || true

# kiro-cli — Kiro AI coding agent
npm install -g kiro-cli 2>/dev/null && ok "kiro-cli" || warn "kiro-cli install failed (optional)"

# kilocode — Kilo coding agent
npm install -g @kilocode/cli 2>/dev/null && ok "kilo" || warn "kilo install failed (optional)"

# Hermes agent
npm install -g hermes-agent 2>/dev/null && ok "hermes" || \
  pip3 install --user --quiet hermes-agent 2>/dev/null && ok "hermes (pip)" || \
  warn "hermes install failed (optional)"

# Write Hermes config pointing at local LLM through child proxy
mkdir -p "$HOME/.hermes"
cat > "$HOME/.hermes/config.yaml" << HERMESEOF
model:
  default: minicpm-local
  provider: fcuk-local
providers:
  fcuk-local:
    base_url: http://127.0.0.1:${PROXY_PORT}/v1
    model: minicpm-local
    api_key: ''
  fcuk-parent:
    base_url: ${PARENT_URL}/api/proxy/v1
    model: default
    api_key: ''
HERMESEOF
ok "Hermes configured (local-first, parent fallback)"

# ── Step 7: Voice service (STT/TTS) ─────────────────────────────────────────
step "Step 7: Voice service (STT/TTS)"
pip3 install --user --quiet openai-whisper 2>/dev/null && ok "whisper STT" || warn "whisper install failed"

# Piper TTS (Linux only)
if [[ "$PLATFORM" == "linux" ]]; then
  if ! command -v piper &>/dev/null; then
    PIPER_URL="https://github.com/rhasspy/piper/releases/latest/download/piper_${ARCH}.tar.gz"
    curl -fL "$PIPER_URL" -o /tmp/piper.tar.gz 2>/dev/null && \
      sudo tar xzf /tmp/piper.tar.gz -C /usr/local/bin/ 2>/dev/null && \
      ok "piper TTS" || warn "piper TTS install failed (optional)"
  else
    ok "piper TTS already installed"
  fi
fi

# ── Step 8: pm2 process manager ─────────────────────────────────────────────
step "Step 8: pm2 (process manager)"
if ! command -v pm2 &>/dev/null; then
  npm install -g pm2 2>/dev/null || sudo npm install -g pm2 2>/dev/null
fi
ok "pm2 ready"

# ── Step 9: Write pm2 ecosystem config ──────────────────────────────────────
step "Step 9: Writing pm2 ecosystem config"
cat > "$INSTALL_DIR/ecosystem.config.js" << ECOSYSTEMEOF
module.exports = {
  apps: [
    {
      name: 'child-proxy',
      script: '${INSTALL_DIR}/child-proxy.mjs',
      interpreter: 'node',
      env: {
        PORT: '${PROXY_PORT}',
        AGENT_PORT: '${AGENT_PORT}',
        PARENT_URL: '${PARENT_URL}',
        LLAMA_URL: 'http://127.0.0.1:${LLAMA_PORT}/v1',
        CHILD_ID: '$(hostname)',
      },
      autorestart: true,
      max_restarts: 10,
    },
    {
      name: 'agentos-gui',
      script: 'node_modules/.bin/next',
      args: 'start -p ${GUI_PORT}',
      cwd: '${GUI_DIR}',
      env: {
        NODE_ENV: 'production',
        PORT: '${GUI_PORT}',
      },
      autorestart: true,
      max_restarts: 10,
    },
    {
      name: 'llama-server',
      script: '$(command -v llama-server || echo "/usr/local/bin/llama-server")',
      interpreter: 'none',
      args: '-m ${INSTALL_DIR}/models/model.gguf --port ${LLAMA_PORT} --host 127.0.0.1 -c 2048 -ngl 0',
      autorestart: true,
      max_restarts: 5,
    },
  ],
};
ECOSYSTEMEOF
ok "pm2 ecosystem config written"

# ── Step 10: Start all services ──────────────────────────────────────────────
step "Step 10: Starting services"
cd "$INSTALL_DIR"

# Start llama-server first (GUI depends on it)
pm2 start ecosystem.config.js --only llama-server 2>/dev/null || true
sleep 5

# Start child proxy (clean up stale process/port first)
pm2 stop child-proxy 2>/dev/null || true
pm2 delete child-proxy 2>/dev/null || true
pkill -f "child-proxy.mjs" 2>/dev/null || true
sleep 1
pm2 start ecosystem.config.js --only child-proxy 2>/dev/null || true

# Start WebGUI (clean up stale process/port first)
pm2 stop agentos-gui 2>/dev/null || true
pm2 delete agentos-gui 2>/dev/null || true
pkill -f "next start -p ${GUI_PORT}" 2>/dev/null || true
sleep 1
pm2 start ecosystem.config.js --only agentos-gui 2>/dev/null || true

pm2 save 2>/dev/null || true

# Enable pm2 on boot
pm2 startup 2>/dev/null | grep "sudo" | bash 2>/dev/null || \
  warn "Could not set pm2 startup (run 'pm2 startup' manually)"

# ── Step 11: Verify ──────────────────────────────────────────────────────────
step "Step 11: Verification"
sleep 8

llama_ok=0
proxy_ok=0
gui_ok=0

curl -sf "http://127.0.0.1:${LLAMA_PORT}/health" >/dev/null 2>&1 && llama_ok=1
curl -sf "http://127.0.0.1:${PROXY_PORT}/health" >/dev/null 2>&1 && proxy_ok=1
curl -sf "http://127.0.0.1:${GUI_PORT}/" >/dev/null 2>&1 && gui_ok=1

[[ $llama_ok -eq 1 ]] && ok "llama-server :$LLAMA_PORT" || warn "llama-server not yet ready (check: pm2 logs llama-server)"
[[ $proxy_ok -eq 1 ]] && ok "child-proxy :$PROXY_PORT"   || warn "child-proxy not yet ready (check: pm2 logs child-proxy)"
[[ $gui_ok   -eq 1 ]] && ok "WebGUI :$GUI_PORT"          || warn "WebGUI not yet ready (check: pm2 logs agentos-gui)"

echo ""
echo -e "${BOLD}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  FinanceCheque Child Proxy — Installation Complete${NC}"
echo -e "${BOLD}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo "  WebGUI (chat):       http://localhost:$GUI_PORT/chat"
echo "  WebGUI (dashboard):  http://localhost:$GUI_PORT"
echo "  Child proxy:         http://localhost:$PROXY_PORT"
echo "  Local LLM:           http://localhost:$LLAMA_PORT"
echo "  Parent proxy:        $PARENT_URL"
echo ""
echo "  Process manager:     pm2 list"
echo "  Logs:                pm2 logs"
echo ""
echo "  Kiro CLI:            kiro chat"
echo "  Kilo CLI:            kilo"
echo "  Hermes:              hermes"
echo ""
echo "  Install dir:         $INSTALL_DIR"
echo "  Version:             $VERSION"
echo -e "${BOLD}═══════════════════════════════════════════════════════════${NC}"
