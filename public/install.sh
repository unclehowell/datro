#!/bin/bash
set -e

# ── Child Proxy One-Liner Installer ────────────────────────────────────────
# Usage: curl -sL https://raw.githubusercontent.com/unclehowell/datro/financecheque/install-child-proxy.sh | bash
# Supports: Linux (x86_64/ARM64), Termux/Android, ADB-connected phones
# Install: child proxy agent + llama-server + MiniCPM-1B local LLM
# ────────────────────────────────────────────────────────────────────────────

MODE="${1:-auto}"
PARENT_URL="${PARENT_URL:-https://www.financecheque.uk}"
CHILD_ID="${CHILD_ID:-$(hostname)}"
PROXY_PORT="${PROXY_PORT:-6000}"
INSTALL_DIR="${INSTALL_DIR:-$HOME/fcuk-child-proxy}"
MODEL_QUANT="${MODEL_QUANT:-Q4_K_M}"

# ── Detect platform ──────────────────────────────────────────────────────────
detect_mode() {
  if [ "$MODE" != "auto" ]; then echo "$MODE"; return; fi
  if command -v adb &>/dev/null && adb devices -l 2>/dev/null | grep -q 'device$'; then echo "adb"
  elif [[ -n "${TERMUX_VERSION:-}" || -d "/data/data/com.termux" ]]; then echo "termux"
  elif [[ "$(uname -m)" == "aarch64" ]]; then echo "linux-arm64"
  elif [[ "$(uname -m)" == "x86_64" ]]; then echo "linux-x64"
  else echo "linux"
  fi
}

ACTUAL_MODE=$(detect_mode)
echo "[install] Mode: $ACTUAL_MODE"

# ── Step 0: Install system dependencies ──────────────────────────────────────
install_deps() {
  if [[ -n "${TERMUX_VERSION:-}" || -d "/data/data/com.termux" ]]; then
    pkg update -y 2>/dev/null || true
    pkg install -y nodejs python3 golang curl git 2>/dev/null || true
  else
    if command -v apt &>/dev/null; then
      sudo apt-get update -qq 2>/dev/null || true
      sudo apt-get install -y -qq curl nodejs python3 python3-pip git 2>/dev/null || true
    fi
  fi
}

case "$ACTUAL_MODE" in
  adb|termux|android)
    echo "[install] Phone/ADB mode"
    install_deps
    ;;
  linux-arm64)
    echo "[install] Linux ARM64 (Raspberry Pi, etc.)"
    install_deps
    ;;
  linux-x64|linux)
    echo "[install] Linux x86_64"
    install_deps
    ;;
esac

# ── Step 1: Install llama-server + MiniCPM model ────────────────────────────
echo "[install] Installing llama-server + MiniCPM-1B-Agentic-ToolUse..."

MODEL_REPO="ewinregirgojr/MiniCPM5-1B-Agentic-Tooluse-GGUF"
LLAMACPP_RELEASE="b9957"
MODEL_DIR="$INSTALL_DIR/models"
mkdir -p "$MODEL_DIR"

case "$ACTUAL_MODE" in
  adb|termux|android)
    # Phone: Android arm64 prebuilt
    if [ ! -f "$MODEL_DIR/model.gguf" ]; then
      echo "[install] Downloading MiniCPM Q4_K_M for phone..."
      curl -sL "https://huggingface.co/$MODEL_REPO/resolve/main/MiniCPM5-1B-Agentic-Tooluse-Nemotron-DPO.Q4_K_M.gguf" -o "$MODEL_DIR/model.gguf"
      echo "[install] Downloading llama-server for Android arm64..."
      curl -sL "https://github.com/ggml-org/llama.cpp/releases/download/$LLAMACPP_RELEASE/llama-$LLAMACPP_RELEASE-bin-android-arm64.tar.gz" -o /tmp/llama.tar.gz
      mkdir -p "$INSTALL_DIR/llama"
      tar xzf /tmp/llama.tar.gz -C "$INSTALL_DIR/llama" --strip-components=1
      export LD_LIBRARY_PATH="$INSTALL_DIR/llama:$LD_LIBRARY_PATH"
      LLAMA_SERVER="$INSTALL_DIR/llama/llama-server"
    fi
    ;;
  linux-arm64)
    # ARM64 Linux: Ubuntu/ARM64 prebuilt
    if [ ! -f "$MODEL_DIR/model.gguf" ]; then
      # Prefer Q8_0 on server-class ARM64, fallback to Q4_K_M
      echo "[install] Downloading MiniCPM Q8_0 for ARM64 Linux..."
      curl -sL "https://huggingface.co/$MODEL_REPO/resolve/main/MiniCPM5-1B-Agentic-Tooluse-Nemotron-DPO.Q8_0.gguf" -o "$MODEL_DIR/model.gguf" ||
        curl -sL "https://huggingface.co/$MODEL_REPO/resolve/main/MiniCPM5-1B-Agentic-Tooluse-Nemotron-DPO.Q4_K_M.gguf" -o "$MODEL_DIR/model.gguf"
      echo "[install] Downloading llama-server for Ubuntu ARM64..."
      curl -sL "https://github.com/ggml-org/llama.cpp/releases/download/$LLAMACPP_RELEASE/llama-$LLAMACPP_RELEASE-bin-ubuntu-arm64.tar.gz" -o /tmp/llama.tar.gz
      tar xzf /tmp/llama.tar.gz -C /usr/local/bin/ --strip-components=1 --wildcards '*/llama-server' '*/libllama*' '*/libggml*' 2>/dev/null || true
      LLAMA_SERVER="/usr/local/bin/llama-server"
    fi
    ;;
  linux-x64|linux)
    # x86_64 Linux: laptop/desktop
    if [ ! -f "$MODEL_DIR/model.gguf" ]; then
      echo "[install] Downloading MiniCPM Q8_0 for x86_64..."
      curl -sL "https://huggingface.co/$MODEL_REPO/resolve/main/MiniCPM5-1B-Agentic-Tooluse-Nemotron-DPO.Q8_0.gguf" -o "$MODEL_DIR/model.gguf"
    fi
    # llama-server from system package or prebuilt
    if ! command -v llama-server &>/dev/null; then
      echo "[install] Downloading llama-server for Ubuntu x86_64..."
      curl -sL "https://github.com/ggml-org/llama.cpp/releases/download/$LLAMACPP_RELEASE/llama-$LLAMACPP_RELEASE-bin-ubuntu-x64.tar.gz" -o /tmp/llama.tar.gz
      sudo tar xzf /tmp/llama.tar.gz -C /usr/local/bin/ --strip-components=1 --wildcards '*/llama-server' 2>/dev/null || true
    fi
    LLAMA_SERVER="$(command -v llama-server || echo '/usr/local/bin/llama-server')"
    ;;
esac

# ── Step 2: Install CLI/IDE tools ────────────────────────────────────────────
echo "[install] Installing CLI/IDE tools..."
export PATH="$HOME/.npm-global/bin:$HOME/.local/bin:$HOME/.opencode/bin:$PATH"

npm install -g @opencode/cli 2>/dev/null || true
npm install -g kiro-cli 2>/dev/null || true
npm install -g @kilocode/cli 2>/dev/null || true

# Install hermes agent
npm install -g hermes-agent 2>/dev/null || pip3 install --user --quiet hermes-agent 2>/dev/null || true

# Install aider (coding agent)
pip3 install --user --quiet aider-chat 2>/dev/null || true

# Install kirox (fallback)
npm install -g kirox 2>/dev/null || true

for c in opencode kiro kilo hermes aider; do
  command -v $c &>/dev/null && echo "[install] ✓ $c" || echo "[install] - $c"
done

# ── Step 3: Install child proxy agent ────────────────────────────────────────
echo "[install] Installing child proxy agent..."
mkdir -p "$INSTALL_DIR"

# Download agent.py
curl -sL "https://raw.githubusercontent.com/unclehowell/datro/financecheque/public/fcukproxy/agent.py" -o "$INSTALL_DIR/agent.py"

# Install Python deps
pip3 install --user --quiet aiohttp 2>/dev/null || true

# ── Step 4: Start llama-server (background) ─────────────────────────────────
echo "[install] Starting llama-server..."
LLAMA_PORT="${LLAMA_PORT:-8090}"

# Kill existing llama-server
pkill -f "llama-server.*$LLAMA_PORT" 2>/dev/null || true
sleep 1

# Start with limited context for CPU
nohup "$LLAMA_SERVER" \
  -m "$MODEL_DIR/model.gguf" \
  --port "$LLAMA_PORT" --host 127.0.0.1 \
  -c 2048 -ngl 0 --cont-batching \
  > "$INSTALL_DIR/llama-server.log" 2>&1 &

echo "[install] llama-server PID: $!"

# ── Step 5: Start child proxy agent (background) ──────────────────────────
echo "[install] Starting child proxy agent..."
pkill -f "python.*agent.py.*$PROXY_PORT" 2>/dev/null || true
sleep 1

nohup python3 "$INSTALL_DIR/agent.py" --port "$PROXY_PORT" \
  > "$INSTALL_DIR/agent.log" 2>&1 &

echo "[install] agent.py PID: $!"

# ── Step 6: Write Hermes config ──────────────────────────────────────────────
echo "[install] Writing Hermes config..."
mkdir -p "$HOME/.hermes"
cat > "$HOME/.hermes/config.yaml" << 'HERMESEOF'
model:
  default: minicpm-local
  provider: fcuk-proxy
  base_url: http://localhost:6000/v1
providers:
  fcuk-proxy:
    base_url: http://localhost:6000/v1
    model: minicpm-local
    api_key: ''
fallback_providers: []
auxiliary:
  curator:
    base_url: http://localhost:6000/v1
    model: minicpm-local
    api_key: ''
HERMESEOF

echo "[install] Hermes configured to use local MiniCPM only."

# ── Step 7: Verify ────────────────────────────────────────────────────────
echo "[install] Verifying services..."
sleep 5

if curl -s "http://127.0.0.1:$LLAMA_PORT/v1/chat/completions" -H 'Content-Type: application/json' -d '{"messages":[{"role":"user","content":"hi"}],"max_tokens":5}' >/dev/null 2>&1; then
  echo "[install] ✓ llama-server responding on port $LLAMA_PORT"
else
  echo "[install] ! llama-server not responding yet (check $INSTALL_DIR/llama-server.log)"
fi

if curl -s "http://127.0.0.1:$PROXY_PORT/health" >/dev/null 2>&1; then
  echo "[install] ✓ Child proxy agent running on port $PROXY_PORT"
else
  echo "[install] ! Child proxy agent not responding (check $INSTALL_DIR/agent.log)"
fi

echo ""
echo "[install] ── Done ──────────────────────────────────────────────────"
echo "[install] Child proxy:      http://127.0.0.1:$PROXY_PORT"
echo "[install] llama-server:     http://127.0.0.1:$LLAMA_PORT"
echo "[install] Model:            $MODEL_DIR/model.gguf"
echo "[install] Hermes config:    $HOME/.hermes/config.yaml"
echo "[install] Parent proxy:     $PARENT_URL"
echo "[install] Child ID:         $CHILD_ID"
echo "[install] ──────────────────────────────────────────────────────────"
echo "[install] Next: run 'hermes' to start the agent using local MiniCPM"
echo "[install] Or visit $PARENT_URL to see your node in the network"
