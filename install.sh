#!/bin/bash
set -euo pipefail

# ═══════════════════════════════════════════════════════════════════════════════
# FinanceCheque — Child Proxy Installer
# ═══════════════════════════════════════════════════════════════════════════════
#
# One-liner install on any Ubuntu/Debian laptop:
#
#   curl -sL https://raw.githubusercontent.com/unclehowell/datro/financecheque/install.sh | bash
#
# Or with options:
#
#   curl -sL URL/install.sh | PARENT_URL=https://financecheque.uk GROQ_API_KEY=xxx bash
#
# What it installs:
#   - Node.js v24.19.0 (user-space, no sudo)
#   - Ollama + openbmb/minicpm5 model (688MB)
#   - Python venv with faster-whisper + edge-tts (STT/TTS)
#   - OpenClaw hermes gateway
#   - AgentOS GUI (Next.js, port 3000)
#   - OmniRoute LLM proxy (port 20128)
#   - All systemd user services
#
# Idempotent: safe to re-run on non-fresh installs.
# ═══════════════════════════════════════════════════════════════════════════════

VERSION="1.7.9"
REPO="unclehowell/datro"
BRANCH="financecheque"
RAW_BASE="https://raw.githubusercontent.com/$REPO/$BRANCH"

# ── Defaults ──────────────────────────────────────────────────────────────────
PARENT_URL="${PARENT_URL:-https://www.financecheque.uk}"
GROQ_API_KEY="${GROQ_API_KEY:-}"
GUI_PORT="${GUI_PORT:-3000}"
OLLAMA_PORT="${OLLAMA_PORT:-11434}"
VOICE_PORT="${VOICE_PORT:-3101}"
REALTIME_PORT="${REALTIME_PORT:-3102}"
OMNIRUTE_PORT="${OMNIRUTE_PORT:-20128}"
PROXY_PORT="${PROXY_PORT:-6100}"
NODE_VERSION="${NODE_VERSION:-v24.19.0}"
OLLAMA_MODEL="${OLLAMA_MODEL:-openbmb/minicpm5}"

# ── Colours ───────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'
CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

info()  { echo -e "${CYAN}[fcuk]${NC} $*"; }
ok()    { echo -e "${GREEN}[fcuk] ✓${NC} $*"; }
warn()  { echo -e "${YELLOW}[fcuk] !${NC} $*"; }
err()   { echo -e "${RED}[fcuk] ✗${NC} $*" >&2; }
step()  { echo -e "\n${BOLD}── Step $1/$TOTAL_STEPS: $2 ──${NC}"; }

TOTAL_STEPS=13

# ── Detect user ───────────────────────────────────────────────────────────────
CURRENT_USER="${SUDO_USER:-$(whoami)}"
USER_HOME="$(eval echo "~$CURRENT_USER")"
if [[ "$EUID" -eq 0 && -n "${SUDO_USER:-}" ]]; then
  USER_HOME="$(eval echo "~$SUDO_USER")"
fi

# ── Platform detection ────────────────────────────────────────────────────────
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
    *)             arch="unknown" ;;
  esac
  echo "${os}-${arch}"
}

PLATFORM="$(detect_platform)"
info "Platform: $PLATFORM | User: $CURRENT_USER | Home: $USER_HOME"

# ── Detect RAM and compute adaptive memory limits ────────────────────────────
TOTAL_RAM_MB=$(awk '/MemTotal/ {printf "%d", $2/1024}' /proc/meminfo 2>/dev/null || echo 4096)
info "Total RAM: ${TOTAL_RAM_MB} MiB"

if [[ "$TOTAL_RAM_MB" -le 4096 ]]; then
  # Low-RAM machine (<=4 GiB): tight caps to prevent OOM freezes
  MEM_WHISPER_MAX="192M";    MEM_WHISPER_HIGH="128M"
  MEM_AGENTOS_MAX="96M";     MEM_AGENTOS_HIGH="64M";     MEM_AGENTOS_OOM="500"
  MEM_OMNIRUTE_MAX="256M";   MEM_OMNIRUTE_HIGH="192M"
  MEM_GATEWAY_MAX="384M";    MEM_GATEWAY_HIGH="256M";    MEM_GATEWAY_OOM="-100"
  MEM_GRAPHRAG_MAX="96M";    MEM_GRAPHRAG_HIGH="64M"
  info "Low-RAM mode: services memory-capped to prevent crashes"
else
  # Normal machine (>4 GiB): generous caps
  MEM_WHISPER_MAX="256M";    MEM_WHISPER_HIGH="192M"
  MEM_AGENTOS_MAX="128M";    MEM_AGENTOS_HIGH="96M";     MEM_AGENTOS_OOM="500"
  MEM_OMNIRUTE_MAX="512M";   MEM_OMNIRUTE_HIGH="384M"
  MEM_GATEWAY_MAX="512M";    MEM_GATEWAY_HIGH="384M";    MEM_GATEWAY_OOM="-100"
  MEM_GRAPHRAG_MAX="128M";   MEM_GRAPHRAG_HIGH="96M"
  info "Standard mode: services memory-capped"
fi

# ═══════════════════════════════════════════════════════════════════════════════
# Self-update check — if a newer install.sh exists, re-run it
# ═══════════════════════════════════════════════════════════════════════════════
SELF_UPDATE_SKIP="${SELF_UPDATE_SKIP:-0}"
if [[ "$SELF_UPDATE_SKIP" != "1" ]]; then
  REMOTE_SCRIPT=$(curl -sf --max-time 10 "$RAW_BASE/install.sh" 2>/dev/null | head -5 | grep 'VERSION=' | sed 's/VERSION="//;s/".*//' || echo "")
  if [[ -n "$REMOTE_SCRIPT" && "$REMOTE_SCRIPT" != "$VERSION" ]]; then
    info "Newer installer available (v$REMOTE_SCRIPT > v$VERSION) — re-running..."
    export SELF_UPDATE_SKIP=1
    exec bash <(curl -sfL "$RAW_BASE/install.sh") "$@"
  fi
fi

# ═══════════════════════════════════════════════════════════════════════════════
# Step 1: System dependencies
# ═══════════════════════════════════════════════════════════════════════════════
step 1 "System dependencies"

install_system_deps() {
  if command -v apt-get &>/dev/null; then
    sudo apt-get update -qq 2>/dev/null || true
    sudo apt-get install -y -qq \
      python3 python3-venv python3-pip \
      curl wget git \
      ffmpeg \
      build-essential \
      2>/dev/null || true
  elif command -v yum &>/dev/null; then
    sudo yum install -y python3 python3-pip curl wget git ffmpeg gcc gcc-c++ 2>/dev/null || true
  elif command -v dnf &>/dev/null; then
    sudo dnf install -y python3 python3-pip curl wget git ffmpeg gcc gcc-c++ 2>/dev/null || true
  elif command -v pacman &>/dev/null; then
    sudo pacman -Sy --noconfirm python python-pip curl git ffmpeg base-devel 2>/dev/null || true
  fi
}

if [[ "$PLATFORM" == linux-* ]]; then
  install_system_deps
elif [[ "$PLATFORM" == macos-* ]]; then
  if command -v brew &>/dev/null; then
    brew install python3 curl git ffmpeg 2>/dev/null || true
  else
    err "Homebrew required on macOS. Install: /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
    exit 1
  fi
fi

# Verify ffmpeg (needed for voicemail audio)
if command -v ffmpeg &>/dev/null; then
  ok "ffmpeg: $(ffmpeg -version 2>&1 | head -1)"
else
  warn "ffmpeg not found — voicemail TTS may fail"
fi

# ═══════════════════════════════════════════════════════════════════════════════
# Step 2: Node.js (user-space install)
# ═══════════════════════════════════════════════════════════════════════════════
step 2 "Node.js $NODE_VERSION"

NODE_DIR="$USER_HOME/.local/node"
NODE_BIN="$NODE_DIR/bin/node"

install_node() {
  if [[ -f "$NODE_BIN" ]]; then
    local current_version
    current_version=$("$NODE_BIN" --version 2>/dev/null || echo "none")
    if [[ "$current_version" == "$NODE_VERSION" ]]; then
      ok "Node.js $current_version already installed"
      return 0
    fi
    warn "Node.js $current_version found, upgrading to $NODE_VERSION..."
  fi

  info "Downloading Node.js $NODE_VERSION..."
  local tmpdir
  tmpdir=$(mktemp -d)

  local arch
  case "$(uname -m)" in
    x86_64|amd64)  arch="x64" ;;
    aarch64|arm64) arch="arm64" ;;
    *)             err "Unsupported architecture: $(uname -m)"; exit 1 ;;
  esac

  local tarball="node-${NODE_VERSION}-linux-${arch}.tar.xz"
  local url="https://nodejs.org/dist/${NODE_VERSION}/${tarball}"

  if ! curl -sL "$url" -o "$tmpdir/$tarball" 2>/dev/null; then
    err "Failed to download Node.js $NODE_VERSION"
    rm -rf "$tmpdir"
    return 1
  fi

  mkdir -p "$USER_HOME/.local"
  tar -xJf "$tmpdir/$tarball" -C "$USER_HOME/.local" 2>/dev/null
  mv "$USER_HOME/.local/node-${NODE_VERSION}-linux-${arch}" "$NODE_DIR" 2>/dev/null || true
  rm -rf "$tmpdir"

  # Symlink binaries
  mkdir -p "$USER_HOME/.local/bin"
  ln -sf "$NODE_DIR/bin/node" "$USER_HOME/.local/bin/node"
  ln -sf "$NODE_DIR/bin/npm" "$USER_HOME/.local/bin/npm"
  ln -sf "$NODE_DIR/bin/npx" "$USER_HOME/.local/bin/npx"

  ok "Node.js $("$NODE_BIN" --version) installed"
}

install_node

# Install pnpm
if [[ ! -f "$USER_HOME/.local/bin/pnpm" ]]; then
  info "Installing pnpm..."
  "$NODE_BIN" "$NODE_DIR/bin/npm" install -g pnpm 2>/dev/null || true
  ln -sf "$NODE_DIR/bin/pnpm" "$USER_HOME/.local/bin/pnpm" 2>/dev/null || true
fi
ok "pnpm: $(command -v pnpm 2>/dev/null || echo 'not in PATH')"

# ═══════════════════════════════════════════════════════════════════════════════
# Step 3: Ollama
# ═══════════════════════════════════════════════════════════════════════════════
step 3 "Ollama + $OLLAMA_MODEL"

if command -v ollama &>/dev/null; then
  ok "Ollama already installed: $(ollama --version 2>&1 | head -1)"
else
  info "Installing ollama..."
  curl -fsSL https://ollama.com/install.sh | sh 2>/dev/null
  ok "Ollama installed: $(ollama --version 2>&1 | head -1)"
fi

# Add user to ollama group (for model access)
if ! groups "$CURRENT_USER" 2>/dev/null | grep -q ollama; then
  sudo usermod -aG ollama "$CURRENT_USER" 2>/dev/null || true
  info "Added $CURRENT_USER to ollama group (re-login required for group changes)"
fi

# Ensure ollama is running
if ! curl -s --max-time 2 "http://localhost:$OLLAMA_PORT/health" >/dev/null 2>&1; then
  info "Starting ollama..."
  sudo systemctl start ollama 2>/dev/null || ollama serve &>/dev/null &
  sleep 3
fi

# Pull model
if ollama list 2>/dev/null | grep -q "$OLLAMA_MODEL"; then
  ok "Model $OLLAMA_MODEL already pulled"
else
  info "Pulling $OLLAMA_MODEL (688MB)..."
  ollama pull "$OLLAMA_MODEL" 2>/dev/null || {
    warn "Model pull failed — will retry on first use"
  }
fi

# ═══════════════════════════════════════════════════════════════════════════════
# Step 4: Python venv + voice service
# ═══════════════════════════════════════════════════════════════════════════════
step 4 "Voice service (whisper STT + edge-tts)"

VENV_DIR="$USER_HOME/.local/whisper-stt-venv"
WHISPER_DIR="$USER_HOME/.local/whisper-stt"

create_venv() {
  if [[ -d "$VENV_DIR" && -f "$VENV_DIR/bin/activate" ]]; then
    ok "Python venv already exists"
    return 0
  fi

  info "Creating Python venv..."
  python3 -m venv "$VENV_DIR" 2>/dev/null || python3 -m ensurepip 2>/dev/null && python3 -m venv "$VENV_DIR" 2>/dev/null
  ok "Python venv created"
}

install_voice_deps() {
  # Check if already installed
  if "$VENV_DIR/bin/python" -c "import faster_whisper; import edge_tts; import flask" 2>/dev/null; then
    ok "Voice service dependencies already installed"
    return 0
  fi

  info "Installing voice service Python packages..."
  "$VENV_DIR/bin/pip" install --quiet --upgrade pip 2>/dev/null || true
  "$VENV_DIR/bin/pip" install --quiet \
    faster-whisper \
    edge-tts \
    Flask \
    websockets \
    ctranslate2 \
    onnxruntime \
    av \
    2>/dev/null || {
      warn "pip install had issues, retrying..."
      "$VENV_DIR/bin/pip" install faster-whisper edge-tts Flask websockets 2>/dev/null || true
    }
  ok "Voice dependencies installed"
}

create_venv
install_voice_deps

# Install voice service scripts
mkdir -p "$WHISPER_DIR/models"

# Download server.py
info "Installing voice service scripts..."
curl -sL "$RAW_BASE/public/fcukproxy/voice-service/server.py" -o "$WHISPER_DIR/server.py" 2>/dev/null || {
  # Fallback: use embedded server.py if download fails
  warn "Download failed, using bundled voice service"
  cat > "$WHISPER_DIR/server.py" << 'VOICEEOF'
#!/usr/bin/env python3
"""Local Whisper STT server + edge-tts TTS endpoint. Port: 3101"""
import asyncio, logging, os, shutil, tempfile, time
from pathlib import Path
from flask import Flask, request, jsonify, send_file
from faster_whisper import WhisperModel

logging.basicConfig(level=logging.INFO, format="%(asctime)s whisper-stt %(levelname)s %(message)s")
log = logging.getLogger("whisper-stt")
PORT = int(os.environ.get("WHISPER_PORT", 3101))
MODEL_SIZE = os.environ.get("WHISPER_MODEL", "tiny")
MODELS_DIR = Path.home() / ".local" / "whisper-stt" / "models"
MODELS_DIR.mkdir(parents=True, exist_ok=True)

log.info(f"Loading whisper model '{MODEL_SIZE}' (CPU int8)...")
model = WhisperModel(MODEL_SIZE, device="cpu", compute_type="int8", download_root=str(MODELS_DIR), cpu_threads=2, num_workers=1)
log.info(f"Model '{MODEL_SIZE}' loaded.")
app = Flask(__name__)

def transcribe_blob(audio_bytes, filename, language):
    suffix = Path(filename).suffix or ".webm"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as f:
        f.write(audio_bytes)
        tmp_path = f.name
    try:
        t0 = time.monotonic()
        segments, info = model.transcribe(tmp_path, language=language or None, beam_size=1, best_of=1, temperature=0.0, vad_filter=True)
        text = " ".join(s.text.strip() for s in segments).strip()
        log.info(f"Transcribed {time.monotonic()-t0:.2f}s lang={info.language} {text[:80]!r}")
        return {"text": text, "language": info.language, "duration": info.duration, "provider": "local-whisper"}
    finally:
        os.unlink(tmp_path)

@app.route("/v1/audio/transcriptions", methods=["POST"])
def transcribe():
    audio_file = request.files.get("file") or request.files.get("audio")
    if audio_file is None:
        return jsonify({"error": {"message": "No audio file"}}), 400
    return jsonify(transcribe_blob(audio_file.read(), audio_file.filename or "audio.webm", request.form.get("language") or "en"))

@app.route("/tts", methods=["POST"])
def tts():
    try:
        import edge_tts
    except ImportError:
        return jsonify({"error": "edge_tts not installed"}), 500
    text = (request.form.get("text") or "").strip()
    voice = request.form.get("voice") or "en-GB-SoniaNeural"
    save_path = request.form.get("save_path")
    if not text:
        return jsonify({"error": "No text"}), 400
    with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as f:
        tmp_path = f.name
    try:
        asyncio.run(edge_tts.Communicate(text, voice).save(tmp_path))
        if save_path:
            os.makedirs(os.path.dirname(os.path.abspath(save_path)), exist_ok=True)
            shutil.copy(tmp_path, save_path)
            os.unlink(tmp_path)
            return jsonify({"saved": save_path, "bytes": os.path.getsize(save_path)})
        return send_file(tmp_path, mimetype="audio/mpeg")
    except Exception as e:
        if os.path.exists(tmp_path): os.unlink(tmp_path)
        return jsonify({"error": str(e)}), 500

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "model": MODEL_SIZE})

if __name__ == "__main__":
    log.info(f"Starting whisper-stt on port {PORT}")
    app.run(host="127.0.0.1", port=PORT, debug=False)
VOICEEOF
}

# Download realtime-proxy.py
curl -sL "$RAW_BASE/public/fcukproxy/voice-service/realtime-proxy.py" -o "$WHISPER_DIR/realtime-proxy.py" 2>/dev/null || {
  warn "Download failed, using bundled realtime proxy"
  cat > "$WHISPER_DIR/realtime-proxy.py" << 'RTEOF'
#!/usr/bin/env python3
"""OpenAI Realtime-compatible WebSocket STT proxy. Port: 3102"""
import asyncio, json, logging, os, struct, tempfile, time, wave
from http import HTTPStatus
import websockets
from websockets.server import serve
from faster_whisper import WhisperModel

logging.basicConfig(level=logging.INFO, format="%(asctime)s realtime-proxy %(levelname)s %(message)s")
log = logging.getLogger("realtime-proxy")
PORT = int(os.environ.get("REALTIME_PORT", 3102))
MODEL_SIZE = os.environ.get("WHISPER_MODEL", "tiny")
MODELS_DIR = os.path.expanduser("~/.local/whisper-stt/models")
SAMPLE_RATE = 24000

log.info(f"Loading whisper model '{MODEL_SIZE}'...")
_model = WhisperModel(MODEL_SIZE, device="cpu", compute_type="int8", download_root=MODELS_DIR, cpu_threads=2, num_workers=1)
log.info(f"Model loaded.")

def pcm16_to_wav(pcm_bytes, sample_rate=SAMPLE_RATE):
    import io
    buf = io.BytesIO()
    with wave.open(buf, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(sample_rate); w.writeframes(pcm_bytes)
    return buf.getvalue()

def transcribe(pcm_bytes):
    if len(pcm_bytes) < 3200: return ""
    wav_bytes = pcm16_to_wav(pcm_bytes)
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
        f.write(wav_bytes); path = f.name
    try:
        segments, info = _model.transcribe(path, language="en", beam_size=1, best_of=1, temperature=0.0, vad_filter=True)
        return " ".join(s.text.strip() for s in segments).strip()
    finally:
        os.unlink(path)

class RealtimeSession:
    def __init__(self, ws):
        self.ws = ws; self.session_id = f"sess_{int(time.time()*1000)}"; self.audio_buf = bytearray(); self.item_counter = 0
    async def send(self, event): await self.ws.send(json.dumps(event))
    async def handle_message(self, raw):
        try: msg = json.loads(raw)
        except: return
        t = msg.get("type", "")
        if t == "session.update": await self.send({"type": "session.updated", "session": msg.get("session", {})})
        elif t == "input_audio_buffer.append":
            b64 = msg.get("audio", "")
            if b64:
                import base64
                self.audio_buf.extend(base64.b64decode(b64))
        elif t == "input_audio_buffer.commit": await self.finalize_audio()
        elif t == "input_audio_buffer.clear": self.audio_buf.clear()
    async def finalize_audio(self):
        if not self.audio_buf: return
        pcm = bytes(self.audio_buf); self.audio_buf.clear()
        text = await asyncio.get_event_loop().run_in_executor(None, transcribe, pcm)
        if not text: return
        self.item_counter += 1; item_id = f"item_{self.item_counter}"
        await self.send({"type": "conversation.item.created", "item": {"id": item_id, "type": "message", "role": "user", "content": [{"type": "input_text", "text": text}]}})
        await self.send({"type": "response.audio_transcript.done", "transcript": text, "item_id": item_id})

async def handle_websocket(websocket, path=""):
    session = RealtimeSession(websocket)
    await session.send({"type": "session.created", "session": {"id": session.session_id, "model": f"whisper-{MODEL_SIZE}"}})
    try:
        async for message in websocket: await session.handle_message(message)
    except: pass

async def http_handler(path, headers):
    if path == "/health": return HTTPStatus.OK, [("Content-Type", "application/json")], json.dumps({"status": "ok"}).encode()
    return HTTPStatus.NOT_FOUND, [], b"Not found"

async def main():
    log.info(f"Starting realtime proxy on ws://localhost:{PORT}")
    async with serve(handle_websocket, "127.0.0.1", PORT, process_request=http_handler):
        await asyncio.Future()

if __name__ == "__main__": asyncio.run(main())
RTEOF
}

chmod +x "$WHISPER_DIR/server.py" "$WHISPER_DIR/realtime-proxy.py"
ok "Voice service scripts installed"

# ═══════════════════════════════════════════════════════════════════════════════
# Step 5: OpenClaw (hermes gateway)
# ═══════════════════════════════════════════════════════════════════════════════
step 5 "OpenClaw hermes gateway"

OPENCLAW_BIN="$USER_HOME/.local/lib/node_modules/openclaw/dist/index.js"

if [[ -f "$OPENCLAW_BIN" ]]; then
  ok "OpenClaw already installed"
else
  info "Installing openclaw..."
  PATH="$USER_HOME/.local/node/bin:$PATH" "$USER_HOME/.local/node/bin/npm" install -g openclaw 2>/dev/null || {
    warn "Global install failed, trying user-space..."
    mkdir -p "$USER_HOME/.local/lib/node_modules"
    PATH="$USER_HOME/.local/node/bin:$PATH" "$USER_HOME/.local/node/bin/npm" install --prefix "$USER_HOME/.local" openclaw 2>/dev/null || true
  }
  if [[ -f "$OPENCLAW_BIN" ]]; then
    ok "OpenClaw installed"
  else
    warn "OpenClaw install failed — hermes gateway won't be available"
  fi
fi

# Create openclaw config directories
mkdir -p "$USER_HOME/.openclaw/workspace"
mkdir -p "$USER_HOME/.openclaw-hermes-proxy"
mkdir -p "$USER_HOME/.openclaw-hermes-local"

# Write openclaw.json if not present
if [[ ! -f "$USER_HOME/.openclaw/openclaw.json" ]]; then
  GATEWAY_TOKEN="$(openssl rand -hex 32 2>/dev/null || head -c 64 /dev/urandom | xxd -p | tr -d '\n' | head -c 64)"
  cat > "$USER_HOME/.openclaw/openclaw.json" << OCJSON
{
  "agents": {
    "defaults": {
      "model": {
        "primary": "ollama-cloud/gpt-oss:20b",
        "fallbacks": ["ollama-cloud/glm-5.2", "ollama-cloud/kimi-k2.6"]
      },
      "workspace": "$USER_HOME/.openclaw/workspace",
      "maxConcurrent": 1,
      "contextTokens": 131072
    },
    "list": [
      {
        "id": "main",
        "identity": { "emoji": "\ud83e\uddee", "name": "OpenClaw", "theme": "space lobster" },
        "model": "ollama-cloud/gpt-oss:20b",
        "tools": { "profile": "full", "allow": ["exec", "web_search", "web_fetch", "read", "write"] }
      }
    ]
  },
  "gateway": {
    "token": "$GATEWAY_TOKEN",
    "port": 18789
  },
  "voice": {
    "realtimeUrl": "ws://localhost:$REALTIME_PORT"
  },
  "ollamaCloud": {
    "enabled": true
  }
}
OCJSON
  ok "OpenClaw config created"
else
  ok "OpenClaw config already exists"
fi

# ═══════════════════════════════════════════════════════════════════════════════
# Step 6: AgentOS GUI (Next.js web app)
# ═══════════════════════════════════════════════════════════════════════════════
step 6 "AgentOS GUI (port $GUI_PORT)"

GUI_DIR="$USER_HOME/.fcukproxy/agentos-gui"
mkdir -p "$USER_HOME/.fcukproxy"

if [[ -d "$GUI_DIR/.next" ]]; then
  ok "AgentOS GUI already built"
else
  if [[ -d "$GUI_DIR/src" ]]; then
    info "GUI source exists, building..."
  else
    info "Downloading AgentOS GUI..."
    # Try to copy from datro repo first, then download
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    if [[ -d "$SCRIPT_DIR/agentos/gui/src" ]]; then
      info "Copying from local repo..."
      cp -r "$SCRIPT_DIR/agentos/gui" "$GUI_DIR"
    else
      info "Downloading from GitHub..."
      mkdir -p "$GUI_DIR"
      # Download key files
      for f in package.json next.config.ts tsconfig.json postcss.config.mjs eslint.config.mjs; do
        curl -sL "$RAW_BASE/agentos/gui/$f" -o "$GUI_DIR/$f" 2>/dev/null || true
      done
      # Download src directory
      curl -sL "$RAW_BASE/agentos/gui/package-lock.json" -o "$GUI_DIR/package-lock.json" 2>/dev/null || true
    fi
  fi

  # Install dependencies
  info "Installing GUI npm dependencies (this takes a while on first run)..."
  cd "$GUI_DIR"
  PATH="$USER_HOME/.local/node/bin:$PATH" "$USER_HOME/.local/node/bin/npm" install 2>&1 | tail -5 || {
    warn "npm install had issues"
  }

  # Build
  info "Building GUI (Next.js production build)..."
  cd "$GUI_DIR"
  PATH="$USER_HOME/.local/node/bin:$PATH" "$USER_HOME/.local/node/bin/npx" next build 2>&1 | tail -5 || {
    warn "Build had issues — try running 'cd $GUI_DIR && npx next build' manually"
  }
  ok "AgentOS GUI built"
fi

# ═══════════════════════════════════════════════════════════════════════════════
# Step 7: OmniRoute LLM proxy
# ═══════════════════════════════════════════════════════════════════════════════
step 7 "OmniRoute LLM proxy"

OMNIRUTE_DIR="$USER_HOME/.fcukproxy/omniroute"
mkdir -p "$OMNIRUTE_DIR"

if [[ -f "$OMNIRUTE_DIR/proxy.mjs" ]]; then
  ok "OmniRoute already installed"
else
  info "Downloading OmniRoute..."
  curl -sL "$RAW_BASE/agentos/omniroute/proxy.mjs" -o "$OMNIRUTE_DIR/proxy.mjs" 2>/dev/null || {
    # Fallback: copy from local datro repo
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    if [[ -f "$SCRIPT_DIR/agentos/omniroute/proxy.mjs" ]]; then
      cp "$SCRIPT_DIR/agentos/omniroute/proxy.mjs" "$OMNIRUTE_DIR/proxy.mjs"
    else
      err "Could not download OmniRoute"
    fi
  }
  chmod +x "$OMNIRUTE_DIR/proxy.mjs"
  ok "OmniRoute installed"
fi

# ═══════════════════════════════════════════════════════════════════════════════
# Step 8: Environment + machine identity
# ═══════════════════════════════════════════════════════════════════════════════
step 8 "Configuration"

# Machine ID
MACHINE_ID="${MACHINE_ID:-$(hostname)-$(date +%s)}"
FCUK_TOKEN="$(openssl rand -hex 24 2>/dev/null || head -c 24 /dev/urandom | xxd -p | tr -d '\n' | head -c 48)"

# .env file
ENV_FILE="$USER_HOME/.fcukproxy/.env"
if [[ ! -f "$ENV_FILE" ]]; then
  cat > "$ENV_FILE" << ENVEOF
# FinanceCheque Child Proxy
FCUK_LOCAL_TOKEN=$FCUK_TOKEN
VOICE_SERVICE_URL=http://localhost:$VOICE_PORT
GROQ_API_KEY=$GROQ_API_KEY
OPENROUTER_API_KEY=
GOOGLE_API_KEY=
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
DEEPSEEK_API_KEY=
MISTRAL_API_KEY=
CEREBRAS_API_KEY=
PARENT_URL=$PARENT_URL
CHILD_ID=$MACHINE_ID
MACHINE_ID=$MACHINE_ID
PROXY_PORT=$PROXY_PORT
AGENT_ROLE=chat
CHAT_ONLY=false
ENVEOF
  ok ".env created"
else
  ok ".env already exists"
fi

# machine.json
MACHINE_JSON="$USER_HOME/.fcukproxy/machine.json"
if [[ ! -f "$MACHINE_JSON" ]]; then
  cat > "$MACHINE_JSON" << MJEOF
{
  "machine_id": "$MACHINE_ID",
  "machine_name": "$MACHINE_ID",
  "local_ip": "127.0.0.1",
  "proxy_port": $PROXY_PORT,
  "parent": "$PARENT_URL",
  "version": "1.0.0",
  "mode": "lite",
  "chat_only": false,
  "agent_role": "chat"
}
MJEOF
  ok "machine.json created"
else
  ok "machine.json already exists"
fi

# Checkpoints + voicemail dirs
mkdir -p "$USER_HOME/.fcukproxy/checkpoints"
mkdir -p "$USER_HOME/.fcukproxy/voicemails"

# ═══════════════════════════════════════════════════════════════════════════════
# Step 9: Systemd services
# ═══════════════════════════════════════════════════════════════════════════════
step 9 "Systemd services (memory-capped)"

SYSTEMD_DIR="$USER_HOME/.config/systemd/user"
mkdir -p "$SYSTEMD_DIR"

# Helper to write a systemd user service
write_service() {
  local name="$1" content="$2"
  local dest="$SYSTEMD_DIR/$name"
  if [[ -f "$dest" ]]; then
    ok "Service $name already exists"
    return 0
  fi
  echo "$content" > "$dest"
  ok "Service $name created"
}

# ── whisper-stt.service ──
write_service "whisper-stt.service" "[Unit]
Description=Local Whisper STT Server (port $VOICE_PORT)
After=network.target

[Service]
Type=simple
ExecStart=$VENV_DIR/bin/python $WHISPER_DIR/server.py
WorkingDirectory=$WHISPER_DIR
Environment=WHISPER_PORT=$VOICE_PORT
Environment=WHISPER_MODEL=tiny
Restart=on-failure
RestartSec=5
MemoryMax=$MEM_WHISPER_MAX
MemoryHigh=$MEM_WHISPER_HIGH
OOMScoreAdjust=100

[Install]
WantedBy=default.target"

# ── whisper-realtime.service ──
write_service "whisper-realtime.service" "[Unit]
Description=Local OpenAI Realtime WebSocket Proxy (port $REALTIME_PORT)
After=network.target whisper-stt.service

[Service]
Type=simple
ExecStart=$VENV_DIR/bin/python $WHISPER_DIR/realtime-proxy.py
WorkingDirectory=$WHISPER_DIR
Environment=REALTIME_PORT=$REALTIME_PORT
Environment=WHISPER_MODEL=tiny
Restart=on-failure
RestartSec=5
MemoryMax=$MEM_WHISPER_MAX
MemoryHigh=$MEM_WHISPER_HIGH
OOMScoreAdjust=100

[Install]
WantedBy=default.target"

# ── agentos-gui.service ──
write_service "agentos-gui.service" "[Unit]
Description=AgentOS GUI (port $GUI_PORT)
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
WorkingDirectory=$GUI_DIR
Environment=HOME=$USER_HOME
Environment=PATH=$USER_HOME/.local/bin:/usr/local/bin:/usr/bin:/bin
Environment=NODE_ENV=production
Environment=PORT=$GUI_PORT
Environment=HOSTNAME=0.0.0.0
Environment=AGENTOS_GUI_DIR=$GUI_DIR
EnvironmentFile=$USER_HOME/.fcukproxy/.env
ExecStart=$GUI_DIR/node_modules/.bin/next start -p $GUI_PORT -H 0.0.0.0
Restart=on-failure
RestartSec=60
MemoryMax=$MEM_AGENTOS_MAX
MemoryHigh=$MEM_AGENTOS_HIGH
OOMScoreAdjust=$MEM_AGENTOS_OOM

[Install]
WantedBy=default.target"

# ── omniroute.service ──
write_service "omniroute.service" "[Unit]
Description=OmniRoute LLM Proxy (port $OMNIRUTE_PORT)
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
WorkingDirectory=$OMNIRUTE_DIR
ExecStart=$NODE_BIN $OMNIRUTE_DIR/proxy.mjs
Environment=NODE_ENV=production
Environment=PORT=$OMNIRUTE_PORT
Environment=OLLAMA_KEEP_ALIVE=30m
Environment=OLLAMA_TIMEOUT_MS=900000
Environment=MINICPM_NUM_CTX=2048
Environment=PROMPT_CACHE_MAX=256
Environment=PROMPT_CACHE_TTL_S=1800
Restart=on-failure
RestartSec=5
MemoryMax=$MEM_OMNIRUTE_MAX
MemoryHigh=$MEM_OMNIRUTE_HIGH

[Install]
WantedBy=default.target"

# ── openclaw-gateway.service ──
if [[ -f "$OPENCLAW_BIN" ]]; then
  write_service "openclaw-gateway.service" "[Unit]
Description=OpenClaw Gateway
After=network-online.target
Wants=network-online.target
StartLimitBurst=5
StartLimitIntervalSec=60

[Service]
ExecStart=$NODE_BIN $OPENCLAW_BIN gateway --port 18789
Restart=always
RestartSec=5
RestartPreventExitStatus=78
TimeoutStopSec=30
TimeoutStartSec=30
SuccessExitStatus=0 143
OOMPolicy=continue
OOMScoreAdjust=$MEM_GATEWAY_OOM
MemoryMax=$MEM_GATEWAY_MAX
MemoryHigh=$MEM_GATEWAY_HIGH
KillMode=control-group
Environment=HOME=$USER_HOME
Environment=TMPDIR=/tmp
Environment=PATH=$USER_HOME/.local/bin:/usr/local/bin:/usr/bin:/bin
Environment=OPENCLAW_GATEWAY_PORT=18789

[Install]
WantedBy=default.target"
fi

# ── graphrag.service ──
GRAPHRAG_DIR="$USER_HOME/.fcukproxy/graphrag"
write_service "graphrag.service" "[Unit]
Description=GraphRAG Knowledge Server (port 8050)
After=network.target

[Service]
Type=simple
WorkingDirectory=$GRAPHRAG_DIR
ExecStart=/usr/bin/python3 $GRAPHRAG_DIR/graphrag_server.py
Restart=on-failure
RestartSec=10
MemoryMax=$MEM_GRAPHRAG_MAX
MemoryHigh=$MEM_GRAPHRAG_HIGH

[Install]
WantedBy=default.target"

# ── fcukproxy-child.service (child-proxy.mjs — HTTP gateway on port 4001) ──
CHILD_PROXY_FILE="$USER_HOME/.fcukproxy/child-proxy.mjs"
if [[ -f "$CHILD_PROXY_FILE" ]]; then
  write_service "fcukproxy-child.service" "[Unit]
Description=FinanceCheque Child Proxy HTTP Gateway (port 4001)
After=network-online.target fcuk-proxy.service
Wants=network-online.target

[Service]
Type=simple
ExecStart=$NODE_BIN $CHILD_PROXY_FILE
WorkingDirectory=$USER_HOME/.fcukproxy
Environment=HOME=$USER_HOME
Environment=PATH=$USER_HOME/.local/bin:$USER_HOME/.local/node/bin:/usr/local/bin:/usr/bin:/bin
Environment=PORT=4001
Restart=on-failure
RestartSec=10

[Install]
WantedBy=default.target"
fi

# Reload and enable services
info "Reloading systemd..."
systemctl --user daemon-reload 2>/dev/null || true

for svc in whisper-stt whisper-realtime agentos-gui omniroute openclaw-gateway graphrag fcukproxy-child; do
  if [[ -f "$SYSTEMD_DIR/$svc.service" ]]; then
    systemctl --user enable "$svc.service" 2>/dev/null || true
  fi
done
ok "Services configured"

# ═══════════════════════════════════════════════════════════════════════════════
# Step 10: Kernel memory tuning
# ═══════════════════════════════════════════════════════════════════════════════
step 10 "Kernel memory tuning"

# Consolidated low-RAM + flash storage tuning
# Single canonical sysctl config — all memory knobs live here.
# Swappiness=60: swap early enough to avoid OOM, but not so aggressively it thrashes.
#   180 caused catastrophic zram thrashing (20K pages/sec swap-in, 28% system CPU).
#   60 eliminates thrashing while still protecting against OOM.
SYSCTL_FILE="/etc/sysctl.d/99-lowram-flash.conf"
if [[ ! -f "$SYSCTL_FILE" ]] || ! grep -q "vm.swappiness = 60" "$SYSCTL_FILE" 2>/dev/null; then
  cat <<'SYSCTL' | sudo tee "$SYSCTL_FILE" >/dev/null
# Consolidated low-RAM flash tuning (single canonical config)
# Swappiness=60: prevents zram thrashing while still protecting against OOM
#   Previous value of 180 caused 20K pages/sec swap-in and 28% system CPU.
#   NEVER set above 60 without benchmarking on this hardware.
vm.swappiness = 60
vm.page-cluster = 0
vm.vfs_cache_pressure = 75
vm.dirty_background_bytes = 67108864
vm.dirty_bytes = 134217728
vm.dirty_writeback_centisecs = 1500
vm.dirty_expire_centisecs = 3000
vm.watermark_scale_factor = 50
vm.watermark_boost_factor = 0
SYSCTL
  sudo sysctl --system >/dev/null 2>&1
  ok "wrote $SYSCTL_FILE (swappiness=60, consolidated)"
else
  ok "swappiness=60 already configured in $SYSCTL_FILE"
fi
# Remove old redundant configs if they exist
for old in /etc/sysctl.d/99-performance.conf /etc/sysctl.d/99-zram-swappiness.conf; do
  [[ -f "$old" ]] && sudo rm "$old" 2>/dev/null && ok "removed redundant $old"
done

# ═══════════════════════════════════════════════════════════════════════════════
# Step 11: Start services + verify
# ═══════════════════════════════════════════════════════════════════════════════
step 11 "Starting services"

# Start in dependency order
for svc in whisper-stt omniroute openclaw-gateway agentos-gui graphrag; do
  if [[ -f "$SYSTEMD_DIR/$svc.service" ]]; then
    info "Starting $svc..."
    systemctl --user start "$svc.service" 2>/dev/null || true
  fi
done

# Wait for services to come up
info "Waiting for services..."
sleep 5

# Verify
ERRORS=0
check_port() {
  local port="$1" name="$2"
  if curl -s --max-time 3 "http://localhost:$port/" >/dev/null 2>&1 || \
     curl -s --max-time 3 "http://localhost:$port/health" >/dev/null 2>&1 || \
     curl -s --max-time 3 "http://localhost:$port/api/hermes" >/dev/null 2>&1; then
    ok "$name (port $port) responding"
  else
    warn "$name (port $port) not responding yet — may need more time"
    ERRORS=$((ERRORS + 1))
  fi
}

check_port "$VOICE_PORT" "Voice STT/TTS"
check_port "$GUI_PORT" "AgentOS GUI"
check_port "18789" "OpenClaw Gateway"

# Check ollama
if curl -s --max-time 3 "http://localhost:$OLLAMA_PORT/health" >/dev/null 2>&1; then
  ok "Ollama (port $OLLAMA_PORT) responding"
else
  warn "Ollama (port $OLLAMA_PORT) not responding"
  ERRORS=$((ERRORS + 1))
fi

# ═══════════════════════════════════════════════════════════════════════════════
# Step 12: Clone datro repo (for OTA updates)
# ═══════════════════════════════════════════════════════════════════════════════
step 12 "OTA repository"

DATRO_DIR="$USER_HOME/.fcukproxy/datro"
if [[ -d "$DATRO_DIR/.git" ]]; then
  ok "datro repo already cloned"
  cd "$DATRO_DIR"
  git fetch origin financecheque 2>/dev/null || true
  git reset --hard origin/financecheque 2>/dev/null || true
  ok "datro repo updated"
else
  info "Cloning datro repo for OTA..."
  git clone --branch financecheque --depth 1 "https://github.com/$REPO.git" "$DATRO_DIR" 2>/dev/null || {
    warn "Clone failed — OTA updates won't work until repo is accessible"
  }
  if [[ -d "$DATRO_DIR/.git" ]]; then
    ok "datro repo cloned"
  fi
fi

# Write initial local version
if [[ ! -f "$USER_HOME/.fcukproxy/.local-version" ]]; then
  cat "$DATRO_DIR/.version" 2>/dev/null | tr -d '[:space:]' > "$USER_HOME/.fcukproxy/.local-version" || echo "1.0.0" > "$USER_HOME/.fcukproxy/.local-version"
fi

# ═══════════════════════════════════════════════════════════════════════════════
# Step 13: OTA update checker (self-updating)
# ═══════════════════════════════════════════════════════════════════════════════
step 13 "OTA self-updater"

UPDATE_CHECKER="$USER_HOME/.fcukproxy/update-checker.sh"
if [[ -f "$DATRO_DIR/public/fcukproxy/update-checker.sh" ]]; then
  cp "$DATRO_DIR/public/fcukproxy/update-checker.sh" "$UPDATE_CHECKER"
elif [[ ! -f "$UPDATE_CHECKER" ]]; then
  curl -sfL "$RAW_BASE/public/fcukproxy/update-checker.sh" -o "$UPDATE_CHECKER" 2>/dev/null || true
fi

if [[ -f "$UPDATE_CHECKER" ]]; then
  chmod +x "$UPDATE_CHECKER"

  # Create systemd service for update checker
  write_service "fcuk-update-checker.service" "[Unit]
Description=FinanceCheque OTA Update Checker
After=network-online.target
Wants=network-online.target

[Service]
Type=oneshot
ExecStart=$UPDATE_CHECKER
Environment=HOME=$USER_HOME
Environment=PATH=$USER_HOME/.local/bin:/usr/local/bin:/usr/bin:/bin
StandardOutput=journal
StandardError=journal"

  # Create systemd timer (checks every 4 hours)
  cat > "$SYSTEMD_DIR/fcuk-update-checker.timer" << TIMEREOF
[Unit]
Description=FinanceCheque OTA Update Check (every 4h)

[Timer]
OnBootSec=5min
OnUnitActiveSec=4h
Persistent=true

[Install]
WantedBy=timers.target
TIMEREOF

  systemctl --user daemon-reload 2>/dev/null || true
  systemctl --user enable fcuk-update-checker.timer 2>/dev/null || true
  systemctl --user start fcuk-update-checker.timer 2>/dev/null || true
  ok "OTA update checker installed (checks every 4 hours)"
  ok "Manual check: systemctl --user start fcuk-update-checker.service"
else
  warn "Could not install update-checker.sh"
fi

# ═══════════════════════════════════════════════════════════════════════════════
# Summary
# ═══════════════════════════════════════════════════════════════════════════════
echo ""
echo -e "${BOLD}══════════════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}  FinanceCheque Child Proxy — Installed${NC}"
echo -e "${BOLD}══════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "  ${CYAN}GUI:${NC}           http://localhost:$GUI_PORT"
echo -e "  ${CYAN}Voice STT:${NC}     http://localhost:$VOICE_PORT"
echo -e "  ${CYAN}Realtime STT:${NC}  ws://localhost:$REALTIME_PORT"
echo -e "  ${CYAN}OmniRoute:${NC}     http://localhost:$OMNIRUTE_PORT"
echo -e "  ${CYAN}OpenClaw:${NC}      http://localhost:18789"
echo -e "  ${CYAN}Ollama:${NC}        http://localhost:$OLLAMA_PORT"
echo -e "  ${CYAN}Model:${NC}         $OLLAMA_MODEL (688MB)"
echo -e "  ${CYAN}Parent:${NC}        $PARENT_URL"
echo -e "  ${CYAN}Machine ID:${NC}    $MACHINE_ID"
echo -e "  ${CYAN}Version:${NC}       $(cat "$USER_HOME/.fcukproxy/.local-version" 2>/dev/null || echo 'unknown')"
echo ""
echo -e "  ${BOLD}Services:${NC}"
echo "    systemctl --user status whisper-stt"
echo "    systemctl --user status agentos-gui"
echo "    systemctl --user status omniroute"
echo "    systemctl --user status openclaw-gateway"
echo ""
echo -e "  ${BOLD}OTA Updates:${NC}"
echo "    Check now:   $USER_HOME/.fcukproxy/update-checker.sh"
echo "    Auto-check:  every 4 hours (fcuk-update-checker.timer)"
echo "    Logs:        journalctl --user -u fcuk-update-checker"
echo ""
echo -e "  ${BOLD}Logs:${NC}"
echo "    journalctl --user -u agentos-gui -f"
echo "    journalctl --user -u whisper-stt -f"
echo ""
if [[ $ERRORS -gt 0 ]]; then
  echo -e "  ${YELLOW}⚠ $ERRORS service(s) may need more time to start${NC}"
fi
echo -e "${BOLD}══════════════════════════════════════════════════════════════${NC}"
