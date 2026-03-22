#!/bin/bash

# LLM Dashboard Installation Script (Fixed Version)
# Fixes port conflicts and systemd service configuration

set -e

echo "🚀 Installing LLM Dashboard..."

# Check if running as root or with sudo
if [[ $EUID -ne 0 ]]; then
   echo "This script must be run as root or with sudo" 
   exit 1
fi

# Get current directory
CURRENT_DIR="$PWD"
echo "📁 Current directory: $CURRENT_DIR"

# Create logs directory
mkdir -p logs
mkdir -p /var/log/llm-dashboard

# Create systemd service file
sudo cat > /etc/systemd/system/llm-dashboard.service << EOF
[Unit]
Description=LLM Dashboard Web Application
After=network.target

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=$CURRENT_DIR
Environment=NODE_ENV=production
Environment=PORT=8080
ExecStart=/usr/bin/node server-simple.js
ExecReload=/bin/kill -HUP \$MAINPID
Restart=on-failure
RestartSec=5
StandardOutput=append:/var/log/llm-dashboard/app.log
StandardError=append:/var/log/llm-dashboard/error.log
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ReadWritePaths=$CURRENT_DIR/logs

[Install]
WantedBy=multi-user.target
EOF

# Create PicoClaw service file
sudo cat > /etc/systemd/system/picoclaw.service << EOF
[Unit]
Description=PicoClaw AI Service Monitor
After=network.target llm-dashboard.service

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=$CURRENT_DIR
Environment=NODE_ENV=production
ExecStart=/usr/bin/node picoclaw-service.js
ExecReload=/bin/kill -HUP \$MAINPID
Restart=on-failure
RestartSec=3
StandardOutput=append:/var/log/llm-dashboard/picoclaw.log
StandardError=append:/var/log/llm-dashboard/picoclaw-error.log
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ReadWritePaths=$CURRENT_DIR/logs

[Install]
WantedBy=multi-user.target
EOF

# Fix permissions
chown -R www-data:www-data "$CURRENT_DIR"
chown -R www-data:www-data /var/log/llm-dashboard

# Reload systemd
echo "🔧 Reloading systemd..."
systemctl daemon-reload

# Enable services
echo "✅ Enabling services..."
systemctl enable llm-dashboard
systemctl enable picoclaw

echo ""
echo "🎉 Installation complete!"
echo ""
echo "📊 Dashboard will run on: http://localhost:8080 (avoiding port 3000 conflict)"
echo ""
echo "🔄 Start the services:"
echo "sudo systemctl start llm-dashboard"
echo "sudo systemctl start picoclaw"
echo ""
echo "📋 Check status:"
echo "sudo systemctl status llm-dashboard"
echo "sudo systemctl status picoclaw"
echo ""
echo "📋 View logs:"
echo "sudo journalctl -u llm-dashboard -f"
echo ""

# Create environment file for port configuration
echo "PORT=8080" > .env
chmod 644 .env

echo "✅ Setup complete!"