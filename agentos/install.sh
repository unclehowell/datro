#!/usr/bin/env bash
# AgentOS Child Proxy — Install Script
# Sets up: OmniRoute + Ollama + MiniCPM5-1B + Hermes-aware GUI + Voice + Task Router
# Usage: cd agentos && ./install.sh [--start] [--no-build]

set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
AGENTOS_DIR="$SCRIPT_DIR"
START_SERVICES=0
BUILD_GUI=1

for arg in "$@"; do
  case "$arg" in
    --start) START_SERVICES=1 ;;
    --no-build) BUILD_GUI=0 ;;
    -h|--help)
      echo "Usage: ./install.sh [--start] [--no-build]"
      exit 0
      ;;
    *) echo "Unknown option: $arg"; exit 2 ;;
  esac
done

log() { printf '\n[%s] %s\n' "$1" "$2"; }
need() { command -v "$1" >/dev/null 2>&1 || { echo "ERROR: $1 required. $2"; exit 1; }; }
have() { command -v "$1" >/dev/null 2>&1; }

export HERMES_URL="${HERMES_URL:-http://localhost:9119}"
export OMNIRUTE_URL="${OMNIRUTE_URL:-http://localhost:20128}"
export TASK_ROUTER_URL="${TASK_ROUTER_URL:-http://localhost:3200}"
export VOICE_SERVICE_URL="${VOICE_SERVICE_URL:-http://localhost:3101}"
export OPENCODE_BIN="${OPENCODE_BIN:-opencode}"
export KILO_BIN="${KILO_BIN:-kilo}"

cat <<BANNER
============================================
  AgentOS Child Proxy — Installer
============================================
Pipeline after install:
  WebGUI :3000 voice/text → /api/chat
  /api/chat → Task Router :3200 → Hermes :9119 if present → OmniRoute :20128
  OmniRoute → Ollama openbmb/minicpm5
  Task Router → opencode first, then kilo fallback
BANNER

log "1/9" "Checking prerequisites"
need node "Install Node.js 22+: curl -fsSL https://deb.nodesource.com/setup_22.x | sudo bash - && sudo apt-get install -y nodejs"
need npm "Install npm with your Node.js package."
need python3 "Install python3 from your OS package manager."
need curl "Install curl from your OS package manager."
echo "  Node: $(node -v), npm: $(npm -v), Python: $(python3 --version)"

log "2/9" "Installing PM2"
if have pm2; then echo "  PM2 already installed: $(pm2 -v)"; else npm install -g pm2; fi

log "3/9" "Installing Ollama"
if have ollama; then
  echo "  Ollama already installed: $(ollama --version 2>&1 | head -1)"
else
  curl -fsSL https://ollama.com/install.sh | sh
fi

log "4/9" "Ensuring Ollama server is running"
if ! curl -fsS http://localhost:11434/api/tags >/dev/null 2>&1; then
  nohup ollama serve >"$AGENTOS_DIR/ollama.log" 2>&1 &
  for _ in {1..30}; do
    curl -fsS http://localhost:11434/api/tags >/dev/null 2>&1 && break
    sleep 1
  done
fi
curl -fsS http://localhost:11434/api/tags >/dev/null 2>&1 || { echo "ERROR: Ollama API did not start on :11434"; exit 1; }

log "5/9" "Pulling MiniCPM5-1B model"
if ollama list 2>/dev/null | awk '{print $1}' | grep -qx 'openbmb/minicpm5'; then
  echo "  Model already pulled"
else
  ollama pull openbmb/minicpm5
fi

log "6/9" "Installing GUI dependencies"
cd "$AGENTOS_DIR/gui"
npm install

if [ "$BUILD_GUI" = "1" ]; then
  log "7/9" "Building GUI"
  npx next build
else
  log "7/9" "Skipping GUI build (--no-build)"
fi

log "8/9" "Installing voice service dependencies"
cd "$AGENTOS_DIR/voice-service"
python3 -m pip install --user -r requirements.txt

log "9/9" "Checking agentic backends"
if have "$OPENCODE_BIN"; then echo "  opencode found: $(command -v "$OPENCODE_BIN")"; else echo "  WARN: opencode not found; task-router will try kilo."; fi
if have "$KILO_BIN"; then echo "  kilo found: $(command -v "$KILO_BIN")"; else echo "  WARN: kilo not found; install kilo or set KILO_BIN."; fi
if ! curl -fsS "$HERMES_URL" >/dev/null 2>&1; then echo "  WARN: Hermes not reachable at $HERMES_URL; chat falls back to MiniCPM via OmniRoute."; fi

cat > "$AGENTOS_DIR/.env" <<ENV
HERMES_URL=$HERMES_URL
OMNIRUTE_URL=$OMNIRUTE_URL
TASK_ROUTER_URL=$TASK_ROUTER_URL
VOICE_SERVICE_URL=$VOICE_SERVICE_URL
OPENCODE_BIN=$OPENCODE_BIN
KILO_BIN=$KILO_BIN
ENV

if [ "$START_SERVICES" = "1" ]; then
  log "start" "Starting PM2 services"
  cd "$AGENTOS_DIR"
  pm2 start ecosystem.config.js --update-env
fi

cat <<DONE

============================================
  Installation Complete
============================================
Start services:
  cd $AGENTOS_DIR && pm2 start ecosystem.config.js --update-env

Open chat:
  http://localhost:3000

Expected path:
  voice/text → WebGUI → Task Router → Hermes (if running) → OmniRoute → Ollama MiniCPM5
  tasks → opencode → kilo fallback

Health checks:
  curl http://localhost:20128/api/health
  curl http://localhost:3200/health
  curl http://localhost:3000/api/status
DONE
