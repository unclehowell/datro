#!/bin/bash
set -e

echo "=== Command Dashboard Installer ==="

REPO="${REPO:-unclehowell/datro}"
BRANCH="${BRANCH:-command}"
DASH_DIR="${DASH_DIR:-$HOME/command-dashboard}"
PORT="${PORT:-3456}"

while [ $# -gt 0 ]; do
  case "$1" in
    --repo) REPO="$2"; shift 2 ;;
    --branch) BRANCH="$2"; shift 2 ;;
    --dir) DASH_DIR="$2"; shift 2 ;;
    --port) PORT="$2"; shift 2 ;;
    --token) GITHUB_TOKEN="$2"; shift 2 ;;
    *) echo "Unknown: $1"; exit 1 ;;
  esac
done

REPO_URL="https://github.com/$REPO.git"
SUBDIR="static/command/dashboard"

echo "Repo: $REPO/$BRANCH"
echo "Install: $DASH_DIR"
echo "Port: $PORT"
echo ""

# 1. Check Node.js
if ! command -v node &>/dev/null; then
  echo "[1/5] Installing Node.js..."
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs 2>/dev/null || yum install -y nodejs 2>/dev/null
else
  echo "[1/5] Node.js found: $(node -v)"
fi

# 2. Clone repo or pull latest
echo "[2/5] Cloning repository..."
if [ -d "$DASH_DIR/.git" ]; then
  cd "$DASH_DIR"
  git fetch origin "$BRANCH" 2>/dev/null || true
  git reset --hard "origin/$BRANCH" 2>/dev/null || true
else
  rm -rf "$DASH_DIR"
  git clone --branch "$BRANCH" --single-branch "$REPO_URL" "$DASH_DIR"
fi

cd "$DASH_DIR"

# 3. Install dashboard deps
echo "[3/5] Installing npm dependencies..."
if [ -f "$SUBDIR/package.json" ]; then
  cd "$SUBDIR" && npm install --production 2>&1 | tail -2
  cd "$DASH_DIR"
fi

# 4. Write config
echo "[4/5] Writing config..."
OWNER="${REPO%/*}"
REPONAME="${REPO#*/}"
cat > "$SUBDIR/command.config.json" <<CONFEOF
{
  "github_owner": "$OWNER",
  "github_repo": "$REPONAME",
  "branch_ref": "$BRANCH",
  "parent_proxy_url": "https://www.financecheque.uk",
  "cf_worker_url": "https://datro-flywheel.righteous.workers.dev",
  "_last_sha": ""
}
CONFEOF

# 5. Start with pm2
echo "[5/5] Starting dashboard..."
START_CMD="PORT=$PORT node $SUBDIR/server.js"
AUTO_CMD="node $SUBDIR/auto-update.js"

if command -v pm2 &>/dev/null; then
  pm2 delete command-dashboard 2>/dev/null || true
  pm2 delete command-auto-update 2>/dev/null || true
  PORT=$PORT pm2 start "$SUBDIR/server.js" --name command-dashboard --cwd "$DASH_DIR"
  PORT=$PORT pm2 start "$SUBDIR/auto-update.js" --name command-auto-update --cwd "$DASH_DIR"
  pm2 save
  echo ""
  echo "=== Done! ==="
  echo "Dashboard: http://127.0.0.1:$PORT"
  echo "pm2 status: pm2 status"
  echo "pm2 logs: pm2 logs command-dashboard"
else
  echo "pm2 not found, starting in background..."
  PORT=$PORT nohup node "$SUBDIR/server.js" > "$SUBDIR/dashboard.log" 2>&1 &
  PORT=$PORT nohup node "$SUBDIR/auto-update.js" > "$SUBDIR/auto-update.log" 2>&1 &
  echo ""
  echo "=== Done! ==="
  echo "Dashboard: http://127.0.0.1:$PORT"
  echo "Logs: tail -f $SUBDIR/dashboard.log"
fi

echo ""
echo "To configure GitHub OAuth, set env vars:"
echo "  GITHUB_OAUTH_CLIENT_ID=..."
echo "  GITHUB_OAUTH_CLIENT_SECRET=..."
echo ""
echo "To connect to GitHub API, set:"
echo "  GITHUB_TOKEN=..."
