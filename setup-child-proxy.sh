#!/bin/bash
# setup-child-proxy.sh — Bootstrap any device as a FinanceCheque child proxy
# One-liner: curl -fsSL https://raw.githubusercontent.com/unclehowell/datro/financecheque/setup-child-proxy.sh | bash
#
# Modes (auto-detected):
#   linux   — standard Linux with pm2
#   termux  — Termux/Android (Go binary)
#   adb     — ADB-connected phone (push Go binary from laptop)
#   docker  — Docker container
#
set -euo pipefail

PARENT_URL="${PARENT_URL:-https://www.financecheque.uk}"
CHILD_ID="${CHILD_ID:-$(hostname)}"
PORT="${PORT:-4001}"
MODE="${MODE:-auto}"

detect_mode() {
  [ "$MODE" != "auto" ] && { echo "$MODE"; return; }
  command -v adb &>/dev/null && adb devices -l 2>/dev/null | grep -q 'device$' && { echo "adb"; return; }
  [[ -n "${TERMUX_VERSION:-}" || -d "/data/data/com.termux" ]] && { echo "termux"; return; }
  command -v docker &>/dev/null && [ -f /.dockerenv ] 2>/dev/null && { echo "docker"; return; }
  echo "linux"
}

case "$(detect_mode)" in
  adb)
    exec bash <(curl -sL "https://raw.githubusercontent.com/unclehowell/datro/financecheque/install-phone-proxy.sh")
    ;;
  termux)
    exec bash <(curl -sL "https://raw.githubusercontent.com/unclehowell/datro/financecheque/install-phone-proxy.sh")
    ;;
  linux)
    echo "=== Setup Child Proxy (Linux) ==="
    echo "Parent: $PARENT_URL  Child: $CHILD_ID  Port: $PORT"

    if ! command -v node &>/dev/null; then
      curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
      sudo apt-get install -y nodejs
    fi

    if ! command -v pm2 &>/dev/null; then
      sudo npm install -g pm2
    fi

    PROXY_DIR="${PROXY_DIR:-$HOME/fcuk-child-proxy}"
    mkdir -p "$PROXY_DIR"

    curl -fsSL "https://raw.githubusercontent.com/unclehowell/datro/financecheque/child-proxy.js" \
      -o "$PROXY_DIR/child-proxy.js"

    cat > "$PROXY_DIR/package.json" <<'PKGEOF'
{"name":"fcuk-child-proxy","version":"1.0.0","type":"module","dependencies":{"express":"^4.18.2"}}
PKGEOF

    cat > "$PROXY_DIR/ecosystem.config.cjs" <<EOF
module.exports = {
  apps: [{
    name: 'fcuk-child-proxy',
    script: 'child-proxy.js',
    cwd: '$PROXY_DIR',
    env: { PARENT_URL: '$PARENT_URL', CHILD_ID: '$CHILD_ID', PORT: '$PORT',
           SELF_URL: 'http://\$(hostname -I | awk \'{print \$1}\'):$PORT' }
  }]
};
EOF

    cd "$PROXY_DIR"
    npm install
    pm2 delete fcuk-child-proxy 2>/dev/null || true
    pm2 start ecosystem.config.cjs
    pm2 save

    echo "=== Done. Test: curl http://localhost:$PORT/health ==="
    ;;
  docker)
    echo "=== Setup Child Proxy (Docker) ==="
    docker run -d --name fcuk-child-proxy \
      -e PARENT_URL="$PARENT_URL" \
      -e CHILD_ID="$CHILD_ID" \
      -e PORT="$PORT" \
      -p "$PORT:$PORT" \
      node:22-alpine sh -c "apk add --no-cache curl && cd /tmp && curl -sL https://raw.githubusercontent.com/unclehowell/datro/financecheque/child-proxy.js -o proxy.js && npm install express && node proxy.js"
    echo "=== Done ==="
    ;;
esac
