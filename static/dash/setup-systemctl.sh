#!/bin/bash

# Final systemd service fix - using your actual installation path

echo "🔧 Setting up systemd services for LLM Bubble Dashboard..."

# Check if running as root or with sudo
if [[ $EUID -ne 0 ]]; then
   echo "This script must be run as root or with sudo"
   exit 1
fi

# Current working directory
DASHBOARD_DIR="/home/unclehowell/datro/static/dash"

cat > /etc/systemd/system/llm-dashboard-bubble.service << 'EOF'
[Unit]
Description=LLM Bubble Dashboard - Accessibility Version
After=network.target

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/home/unclehowell/datro/static/dash
Environment=NODE_ENV=production
Environment=PORT=8080
ExecStart=/usr/bin/node server-bubble.js
Restart=on-failure
RestartSec=5
StandardOutput=append:/var/log/dashboard/bubble.log
StandardError=append:/var/log/dashboard/bubble-error.log

[Install]
WantedBy=multi-user.target
EOF

cat > /etc/systemd/system/picoclaw-bubble.service << 'EOF'
[Unit]
Description=PicoClaw Bubble Service Monitor
After=network.target

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/home/unclehowell/datro/static/dash
ExecStart=/usr/bin/node picoclaw-service.js
Restart=on-failure
RestartSec=3
StandardOutput=append:/var/log/dashboard/picoclaw.log
StandardError=append:/var/log/dashboard/picoclaw-error.log

[Install]
WantedBy=multi-user.target
EOF

# Create log directory
mkdir -p /var/log/dashboard
chown -R www-data:www-data /var/log/dashboard
chown -R www-data:www-data /home/unclehowell/datro/static/dash

# Create environment file for port configuration
cd "$DASHBOARD_DIR"
echo "PORT=8080" > .env
chmod 644 .env

# Reload systemd and enable services
systemctl daemon-reload

echo "✅ Systemd services created for bubble dashboard!"
echo
echo "🔗 Dashboard: http://localhost:8080"
echo "🎯 Features: Large text, bubble visualization, real-time updates"
echo
echo "📋 To switch from PM2 to systemd:"
echo "1. Stop PM2: pm2 stop ecosystem.config.js"
echo "2. Start systemd: sudo systemctl start llm-dashboard-bubble"
echo "3. Check status: sudo systemctl status llm-dashboard-bubble"
echo
echo "📋 Management commands:"
echo "Start:     sudo systemctl start llm-dashboard-bubble"
echo "Stop:      sudo systemctl stop llm-dashboard-bubble"
echo "Status:    sudo systemctl status llm-dashboard-bubble"
echo "Logs:      sudo journalctl -u llm-dashboard-bubble -f"

echo
echo "🎉 Your accessible LLM Bubble Dashboard is ready!"
echo "💡 Use TV remote to control volume (Radio Monte Carlo will auto-play)"

echo "Current status: $(systemctl is-enabled llm-dashboard-bubble 2>/dev/null || echo 'not enabled')"