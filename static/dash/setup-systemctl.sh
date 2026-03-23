#!/bin/bash

# Final systemd service fix - using your actual installation path

echo "🔧 Setting up systemd services for LLM Dashboard..."

# Check if running as root or with sudo
if [[ $EUID -ne 0 ]]; then
   echo "This script must be run as root or with sudo"
   exit 1
fi

# Current working directory
DASHBOARD_DIR=$(pwd)
CURRENT_USER=$(whoami)
CURRENT_GROUP=$(id -gn)

cat > /etc/systemd/system/llm-dashboard.service << EOF
[Unit]
Description=LLM Supply and Demand Dashboard
After=network.target

[Service]
Type=simple
User=$CURRENT_USER
Group=$CURRENT_GROUP
WorkingDirectory=$DASHBOARD_DIR
Environment=NODE_ENV=production
Environment=PORT=8080
ExecStart=$(which node) $DASHBOARD_DIR/server.js
Restart=on-failure
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd and enable services
systemctl daemon-reload
systemctl enable llm-dashboard

echo "✅ Systemd services created for dashboard!"
echo
echo "🔗 Dashboard: http://localhost:8080"
echo
echo "📋 Management commands:"
echo "Start:     sudo systemctl start llm-dashboard"
echo "Stop:      sudo systemctl stop llm-dashboard"
echo "Status:    sudo systemctl status llm-dashboard"
echo "Logs:      sudo journalctl -u llm-dashboard -f"

echo "Current status: $(systemctl is-enabled llm-dashboard 2>/dev/null || echo 'not enabled')"