#!/bin/bash
set -e

echo "=== Command Dashboard Installer ==="
echo ""

# ── Config ──
REPO="${REPO:-unclehowell/datro}"
BRANCH="${BRANCH:-command}"
INSTALL_DIR="${INSTALL_DIR:-$HOME/command-dashboard}"
PORT="${PORT:-3456}"

# ── Parse args ──
while [ $# -gt 0 ]; do
  case "$1" in
    --repo) REPO="$2"; shift 2 ;;
    --branch) BRANCH="$2"; shift 2 ;;
    --dir) INSTALL_DIR="$2"; shift 2 ;;
    --port) PORT="$2"; shift 2 ;;
    --token) GITHUB_TOKEN="$2"; shift 2 ;;
    *) echo "Unknown: $1"; exit 1 ;;
  esac
done

echo "Target: $REPO/$BRANCH"
echo "Install: $INSTALL_DIR"
echo "Port: $PORT"
echo ""

# ── 1. Check Node.js ──
if ! command -v node &>/dev/null; then
  echo "[1/5] Installing Node.js..."
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs 2>/dev/null || yum install -y nodejs 2>/dev/null
else
  echo "[1/5] Node.js found: $(node -v)"
fi

# ── 2. Clone / pull repo ──
echo "[2/5] Setting up repository..."
if [ -d "$INSTALL_DIR" ]; then
  cd "$INSTALL_DIR"
  git fetch origin "$BRANCH" 2>/dev/null || true
  git reset --hard "origin/$BRANCH" 2>/dev/null || true
else
  git clone --branch "$BRANCH" --single-branch "https://github.com/$REPO.git" "$INSTALL_DIR"
  cd "$INSTALL_DIR"
fi

# ── 3. Install dependencies ──
echo "[3/5] Installing npm dependencies..."
cd "$INSTALL_DIR"
if [ -f package.json ]; then
  npm install --production 2>&1 | tail -2
fi

# ── 4. Write config ──
echo "[4/5] Writing config..."
OWNER="${REPO%/*}"
REPONAME="${REPO#*/}"
cat > "$INSTALL_DIR/command.config.json" <<CONFEOF
{
  "github_owner": "$OWNER",
  "github_repo": "$REPONAME",
  "branch_ref": "$BRANCH",
  "parent_proxy_url": "https://www.financecheque.uk",
  "cf_worker_url": "https://datro-flywheel.righteous.workers.dev",
  "_last_sha": ""
}
CONFEOF
echo "Config written to $INSTALL_DIR/command.config.json"

# ── 5. Start with pm2 ──
echo "[5/5] Starting dashboard..."
if command -v pm2 &>/dev/null; then
  pm2 delete command-dashboard 2>/dev/null || true
  pm2 delete command-auto-update 2>/dev/null || true
  PORT=$PORT pm2 start "$INSTALL_DIR/server.js" --name command-dashboard
  PORT=$PORT pm2 start "$INSTALL_DIR/auto-update.js" --name command-auto-update
  pm2 save
  echo ""
  echo "=== Done! ==="
  echo "Dashboard: http://127.0.0.1:$PORT"
  echo "pm2 status: pm2 status"
  echo "pm2 logs: pm2 logs command-dashboard"
else
  echo "pm2 not found, starting in background..."
  PORT=$PORT nohup node "$INSTALL_DIR/server.js" > "$INSTALL_DIR/dashboard.log" 2>&1 &
  PORT=$PORT nohup node "$INSTALL_DIR/auto-update.js" > "$INSTALL_DIR/auto-update.log" 2>&1 &
  echo ""
  echo "=== Done! ==="
  echo "Dashboard: http://127.0.0.1:$PORT"
  echo "Logs: tail -f $INSTALL_DIR/dashboard.log"
fi

echo ""
echo "To configure GitHub OAuth, set these env vars when starting:"
echo "  GITHUB_OAUTH_CLIENT_ID=your_client_id"
echo "  GITHUB_OAUTH_CLIENT_SECRET=your_client_secret"
echo ""
echo "Or set a personal GITHUB_TOKEN env var for API access."