#!/bin/bash
# AgentOS Child Proxy — Install Script
# Sets up: OmniRoute + ollama + MiniCPM5-1B + GUI + Voice + Task Router
# Usage: curl -fsSL <url>/install-agentos.sh | bash

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
AGENTOS_DIR="$SCRIPT_DIR"
HOME="${HOME:-/home/$(whoami)}"

echo "============================================"
echo "  AgentOS Child Proxy — Installer"
echo "============================================"
echo ""

# 1. Check prerequisites
echo "[1/7] Checking prerequisites..."
command -v node >/dev/null 2>&1 || { echo "ERROR: Node.js required. Install with: curl -fsSL https://deb.nodesource.com/setup_22.x | sudo bash -"; exit 1; }
command -v python3 >/dev/null 2>&1 || { echo "ERROR: Python3 required."; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "ERROR: npm required."; exit 1; }
echo "  Node: $(node -v), Python: $(python3 --version), npm: $(npm -v)"

# 2. Install ollama
echo ""
echo "[2/7] Installing ollama..."
if command -v ollama >/dev/null 2>&1; then
  echo "  ollama already installed: $(ollama --version 2>&1 | head -1)"
else
  curl -fsSL https://ollama.com/install.sh | sh
  echo "  ollama installed: $(ollama --version 2>&1 | head -1)"
fi

# 3. Pull MiniCPM5-1B model
echo ""
echo "[3/7] Pulling MiniCPM5-1B model (688MB)..."
if ollama list 2>/dev/null | grep -q minicpm5; then
  echo "  Model already pulled"
else
  ollama pull openbmb/minicpm5
  echo "  Model pulled"
fi

# 4. Install GUI dependencies
echo ""
echo "[4/7] Installing GUI dependencies..."
cd "$AGENTOS_DIR/gui"
npm install 2>&1 | tail -3

# 5. Build GUI
echo ""
echo "[5/7] Building GUI..."
npx next build 2>&1 | tail -5

# 6. Install voice service dependencies
echo ""
echo "[6/7] Installing voice service dependencies..."
cd "$AGENTOS_DIR/voice-service"
pip3 install -r requirements.txt 2>&1 | tail -3

# 7. Install PM2 globally
echo ""
echo "[7/7] Installing PM2..."
if command -v pm2 >/dev/null 2>&1; then
  echo "  PM2 already installed"
else
  npm install -g pm2
fi

echo ""
echo "============================================"
echo "  Installation Complete!"
echo "============================================"
echo ""
echo "To start all services:"
echo "  cd $AGENTOS_DIR && pm2 start ecosystem.config.js"
echo ""
echo "To save PM2 config for auto-restart:"
echo "  pm2 save"
echo "  pm2 startup"
echo ""
echo "Services:"
echo "  GUI:        http://localhost:3000"
echo "  OmniRoute:  http://localhost:20128"
echo "  Voice:      http://localhost:3101"
echo "  Task Router: http://localhost:3200"
echo ""
echo "Model: openbmb/minicpm5 (MiniCPM5-1B, 688MB Q4_K_M)"
echo "Voice: edge-tts (local, free neural voices)"
echo "Tasks: Routes to opencode/kilo (agentic harness with MCP tools)"
