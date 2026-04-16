#!/bin/bash
#
# LLM Proxy Installation Script
# Run this on each machine to install and configure the sub-proxy
#

set -e

INSTALL_DIR="$HOME/llmproxy"
REPO_URL="https://github.com/unclehowell/datro.git"
BRANCH="llmproxy"

echo "Installing LLM Proxy..."

# Create install directory
mkdir -p "$INSTALL_DIR"

# Clone or update repo
if [ -d "$INSTALL_DIR/.git" ]; then
    cd "$INSTALL_DIR"
    git fetch origin "$BRANCH"
    git checkout "$BRANCH"
    git pull origin "$BRANCH"
else
    git clone -b "$BRANCH" "$REPO_URL" "$INSTALL_DIR"
fi

# Install Python dependencies
cd "$INSTALL_DIR/subproxy"
pip3 install -q aiohttp

cd "$INSTALL_DIR/dashboard"
pip3 install -q aiohttp

# Update machine config with local info
MACHINE_NAME=$(hostname)
TAILSCALE_IP=$(hostname -I | awk '{print $1}' || echo "127.0.0.1")

cat > "$INSTALL_DIR/config/machine.json" <<EOF
{
  "machine_id": "$(uuidgen 2>/dev/null || echo $(date +%s))",
  "machine_name": "$MACHINE_NAME",
  "tailscale_ip": "$TAILSCALE_IP",
  "port": 5000,
  "capabilities": ["cli", "api", "local"],
  "priority": 1
}
EOF

echo "Machine config created for: $MACHINE_NAME"

# Create log directory
mkdir -p "$INSTALL_DIR/logs"

# Start services
echo "Starting services..."

# Start sub-proxy
cd "$INSTALL_DIR/subproxy"
nohup python3 server.py > "$INSTALL_DIR/logs/subproxy.log" 2>&1 &
echo "Sub-proxy started (PID: $!)"

# Start dashboard
cd "$INSTALL_DIR/dashboard"
nohup python3 server.py > "$INSTALL_DIR/logs/dashboard.log" 2>&1 &
echo "Dashboard started (PID: $!)"

# Setup cron for auto-update
CRON_FILE="/tmp/llmproxy_cron"
cat > "$CRON_FILE" <<EOF
# LLM Proxy auto-update - runs every 5 minutes
*/5 * * * * cd $INSTALL_DIR && git pull origin $BRANCH >> $INSTALL_DIR/logs/update.log 2>&1
EOF

crontab "$CRON_FILE"
echo "Cron job installed for auto-update"

echo ""
echo "Installation complete!"
echo "  - Sub-proxy: http://localhost:5000"
echo "  - Dashboard: http://localhost:8080"
echo "  - Logs: $INSTALL_DIR/logs/"
echo ""
echo "To check status, run: curl http://localhost:5000/health"