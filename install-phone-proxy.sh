#!/usr/bin/env bash
# Phone Child Proxy Installer — Go binary approach
# Works on: Termux/Android, or pushed via ADB from a laptop
# Usage:
#   curl -sL https://raw.githubusercontent.com/unclehowell/datro/financecheque/install-phone-proxy.sh | bash
#   ADB_MODE=1 bash <(curl -sL ...)   # push via ADB from laptop

set -euo pipefail

PARENT_URL="${PARENT_URL:-https://www.financecheque.uk}"
CHILD_ID="${CHILD_ID:-phone-$(date +%s)}"
PROXY_PORT="${PROXY_PORT:-6000}"
INSTALL_DIR="${INSTALL_DIR:-$HOME/fcuk-phone-proxy}"
ADB_MODE="${ADB_MODE:-auto}"  # auto|1|0

echo "[install] Installing phone child proxy"
echo "[install] PARENT_URL=$PARENT_URL"
echo "[install] CHILD_ID=$CHILD_ID"
echo "[install] PORT=$PROXY_PORT"

# ── Detect ADB mode ───────────────────────────────────────────────────────────
if [ "$ADB_MODE" = "auto" ]; then
  if command -v adb &>/dev/null && adb devices -l 2>/dev/null | grep -q 'device$'; then
    ADB_MODE=1
  else
    ADB_MODE=0
  fi
fi

if [ "$ADB_MODE" = "1" ]; then
  echo "[install] ADB mode — pushing binary from laptop to phone"
  # Get the Go source from GitHub
  TMPDIR=$(mktemp -d)
  cd "$TMPDIR"
  echo "[install] Downloading phone proxy source..."
  curl -sL "https://raw.githubusercontent.com/unclehowell/datro/financecheque/phone-proxy.go" -o phone-proxy.go
  echo "[install] Building Go binary for arm64..."
  GOOS=linux GOARCH=arm64 CGO_ENABLED=0 go build -ldflags="-s -w" -o phone-proxy phone-proxy.go
  echo "[install] Pushing binary to phone..."
  adb push phone-proxy /data/local/tmp/phone-proxy
  adb shell "chmod +x /data/local/tmp/phone-proxy"
  # Write env file
  cat > /tmp/phone-env.txt << ENVEOF
GROQ_API_KEY=
OPENROUTER_API_KEY=
GOOGLE_API_KEY=
OPENAI_API_KEY=
ENVEOF
  echo "[install] Created env template at /tmp/phone-env.txt"
  echo "[install] Edit it with your API keys, then: adb push /tmp/phone-env.txt /data/local/tmp/phone-proxy.env"
  rm -rf "$TMPDIR"
  echo "[install] Done. Run '~/bin/phone-proxy.sh start' to start."
  exit 0
fi

# ── Termux/Android mode (build Go directly) ──────────────────────────────────
echo "[install] Termux/Android mode"
if ! command -v go &>/dev/null; then
  echo "[install] Go not found, installing..."
  pkg update -y 2>/dev/null || true
  pkg install -y golang 2>/dev/null || true
fi

mkdir -p "$INSTALL_DIR"
cd "$INSTALL_DIR"

echo "[install] Downloading and building phone proxy..."
curl -sL "https://raw.githubusercontent.com/unclehowell/datro/financecheque/phone-proxy.go" -o phone-proxy.go
GOOS=linux GOARCH=arm64 CGO_ENABLED=0 go build -ldflags="-s -w" -o phone-proxy phone-proxy.go

# ── Write start script ────────────────────────────────────────────────────────
cat > "$INSTALL_DIR/start.sh" << SHTEOF
#!/data/data/com.termux/files/usr/bin/bash
cd "$INSTALL_DIR"
export GROQ_API_KEY="\${GROQ_API_KEY}"
export OPENROUTER_API_KEY="\${OPENROUTER_API_KEY}"
export GOOGLE_API_KEY="\${GOOGLE_API_KEY}"
export MACHINE_ID="$CHILD_ID"
export MACHINE_NAME="$CHILD_ID"
export DNS_SERVER="8.8.8.8:53"
./phone-proxy
SHTEOF
chmod +x "$INSTALL_DIR/start.sh"

# ── Write .env template ───────────────────────────────────────────────────────
cat > "$INSTALL_DIR/.env" << ENVEOF
GROQ_API_KEY=your-groq-key
OPENROUTER_API_KEY=your-openrouter-key
GOOGLE_API_KEY=your-google-key
OPENAI_API_KEY=your-openai-key
PARENT_URL=$PARENT_URL
CHILD_ID=$CHILD_ID
PORT=$PROXY_PORT
ENVEOF

# ── Start ─────────────────────────────────────────────────────────────────────
echo "[install] Starting proxy..."
cd "$INSTALL_DIR"
pkill -f "$INSTALL_DIR/phone-proxy" 2>/dev/null || true
nohup "$INSTALL_DIR/start.sh" > "$INSTALL_DIR/proxy.log" 2>&1 &
echo $! > "$INSTALL_DIR/proxy.pid"

sleep 3

# ── Verify ─────────────────────────────────────────────────────────────────────
if curl -s http://localhost:$PROXY_PORT/health >/dev/null 2>&1; then
  echo "[install] SUCCESS: Proxy running on port $PROXY_PORT"
else
  echo "[install] WARNING: Check logs: tail -f $INSTALL_DIR/proxy.log"
fi

echo "[install] Done. Edit $INSTALL_DIR/.env to add your API keys."