#!/usr/bin/env bash
# AgentOS Setup Script
# Run this to install all dependencies and build services
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

info() { echo -e "${GREEN}[INFO]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
err() { echo -e "${RED}[ERROR]${NC} $1"; }

echo "=========================================="
echo "  AgentOS Setup — UncleHowell"
echo "=========================================="
echo ""

# 1. OmniRoute
info "Step 1: Building OmniRoute..."
if [ -d ~/omniroute ]; then
  cd ~/omniroute
  if [ ! -d node_modules ] || [ ! -f dist/server/index.js ]; then
    npm install --legacy-peer-deps 2>&1 | tail -5
    npm run build 2>&1 | tail -5
  fi
  info "OmniRoute ready at localhost:20128"
else
  warn "OmniRoute not found. Cloning..."
  git clone --depth 1 https://github.com/kdclan/omniroute.git ~/omniroute
  cd ~/omniroute
  npm install --legacy-peer-deps 2>&1 | tail -5
  npm run build 2>&1 | tail -5
fi
echo ""

# 2. llama.cpp
info "Step 2: Setting up llama.cpp..."
if [ ! -d ~/llama.cpp ]; then
  git clone --depth 1 https://github.com/ggerganov/llama.cpp.git ~/llama.cpp
fi
if [ ! -f ~/llama.cpp/build/bin/llama-server ]; then
  cd ~/llama.cpp
  cmake -B build -DGGML_CPU=ON -DLLAMA_CURL=OFF 2>&1 | tail -3
  cmake --build build --config Release -j2 2>&1 | tail -3
fi

# Download 1B model if not present
MODEL_DIR="$HOME/.agentos/models"
mkdir -p "$MODEL_DIR"
if [ ! -f "$MODEL_DIR"/qwen3-1.8b-q4_k_m.gguf ]; then
  info "Downloading Qwen3 1.8B Q4_K_M..."
  wget -q --show-progress -O "$MODEL_DIR/qwen3-1.8b-q4_k_m.gguf" \
    "https://huggingface.co/unsloth/Qwen3-1.8B-GGUF/resolve/main/Qwen3-1.8B-Q4_K_M.gguf"
fi
info "llama.cpp + 1B model ready at localhost:8080"
echo ""

# 3. AgentOS GUI
info "Step 3: Installing AgentOS GUI..."
cd ~/agentos-gui
if [ ! -d node_modules ]; then
  npm install 2>&1 | tail -5
fi

# Copy env if not exists
if [ ! -f .env.local ]; then
  cp .env.example .env.local
  info "Created .env.local from template — edit with your API keys"
fi
info "AgentOS GUI ready at localhost:3000"
echo ""

# 4. Code Intelligence Service
info "Step 4: Installing Code Intelligence Service..."
cd ~/code-intel
if [ ! -f package.json ]; then
  npm init -y 2>/dev/null
fi
npm install tree-sitter tree-sitter-javascript tree-sitter-typescript tree-sitter-python tree-sitter-bash tree-sitter-json tree-sitter-html tree-sitter-css 2>&1 | tail -5
info "Code Intelligence Service ready"
echo ""

# 5. Create systemd/pm2 services
info "Step 5: Creating PM2 services..."

pm2 delete omniroute 2>/dev/null || true
pm2 delete llama-server 2>/dev/null || true
pm2 delete agentos-gui 2>/dev/null || true
pm2 delete code-intel 2>/dev/null || true

pm2 start "node ~/omniroute/dist/server/index.js" --name omniroute --cwd ~/omniroute 2>/dev/null || \
  pm2 start "npm run start" --name omniroute --cwd ~/omniroute 2>/dev/null || \
  warn "OmniRoute PM2 start failed — run manually"

pm2 start "$HOME/llama.cpp/build/bin/llama-server -m $HOME/.agentos/models/qwen3-1.8b-q4_k_m.gguf --host 0.0.0.0 --port 8080 -c 2048" \
  --name llama-server 2>/dev/null || warn "llama.cpp PM2 start failed — run manually"

cd ~/agentos-gui
pm2 start "npm run dev -- -p 3000" --name agentos-gui 2>/dev/null || warn "GUI PM2 start failed"

echo ""
info "All services started! Check with: pm2 list"
echo ""
echo "=========================================="
echo "  Services:"
echo "    OmniRoute:    http://localhost:20128"
echo "    llama.cpp:    http://localhost:8080"
echo "    AgentOS GUI:  http://localhost:3000"
echo "    Hermes:       http://localhost:3001"
echo "=========================================="
echo ""
info "Next steps:"
echo "  1. Edit ~/agentos-gui/.env.local with your API keys"
echo "  2. Start Hermes if not running: cd ~/.hermes/hermes-agent && npm start"
echo "  3. Open http://localhost:3000"
