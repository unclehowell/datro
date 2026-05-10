#!/bin/bash
# setup-child-proxy.sh
# One-liner install for AWS 172.31.29.216:
#   curl -fsSL https://raw.githubusercontent.com/unclehowell/datro/financecheque/setup-child-proxy.sh | bash
set -e

PARENT_URL="${PARENT_URL:-https://financecheque.uk}"
CHILD_ID="${CHILD_ID:-aws-$(hostname -I | awk '{print $1}' | tr '.' '-')}"
PORT="${PORT:-4001}"
SELF_URL="${SELF_URL:-http://$(hostname -I | awk '{print $1}'):$PORT}"
PROXY_DIR="/home/ubuntu/fcuk-child-proxy"

echo "=== financecheque.uk Child Proxy Setup ==="
echo "Parent : $PARENT_URL"
echo "Child  : $CHILD_ID"
echo "Self   : $SELF_URL"

# Node.js
if ! command -v node &>/dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi

# PM2
if ! command -v pm2 &>/dev/null; then
  sudo npm install -g pm2
fi

mkdir -p "$PROXY_DIR"

# Download child-proxy.js from GitHub
curl -fsSL "https://raw.githubusercontent.com/unclehowell/datro/financecheque/child-proxy.js" \
  -o "$PROXY_DIR/child-proxy.js"

cat > "$PROXY_DIR/package.json" <<'EOF'
{"name":"fcuk-child-proxy","version":"1.0.0","type":"module"}
EOF

cat > "$PROXY_DIR/.env" <<EOF
PARENT_URL=$PARENT_URL
CHILD_ID=$CHILD_ID
PORT=$PORT
SELF_URL=$SELF_URL
KIRO_PATH=/home/ubuntu/kiro-cli-temp
EOF

cd "$PROXY_DIR"
pm2 delete fcuk-child-proxy 2>/dev/null || true
pm2 start child-proxy.js --name fcuk-child-proxy --env-file .env
pm2 save

echo ""
echo "=== Done. Child proxy running. ==="
echo "Logs: pm2 logs fcuk-child-proxy"
echo "Test: curl http://localhost:$PORT/health"
