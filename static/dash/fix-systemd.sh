#!/bin/bash

# Fix systemd service for LLM Dashboard (Port 8080)

echo "🔧 Fixing systemd service for LLM Dashboard..."

# Create systemd service file with correct paths
cat > llm-dashboard-systemd.service << 'EOF'
[Unit]
Description=LLM Dashboard Web Application
After=network.target

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/home/unclehowell/datro/static/dash
Environment=NODE_ENV=production
Environment=PORT=8080
ExecStart=/usr/bin/node server-simple.js
Restart=on-failure
RestartSec=5
StandardOutput=append:/var/log/llm-dashboard/app.log
StandardError=append:/var/log/llm-dashboard/error.log

[Install]
WantedBy=multi-user.target
EOF

# Copy the fixed service file
echo "📋 Installing fixed systemd service..."
sudo cp llm-dashboard-systemd.service /etc/systemd/system/llm-dashboard.service

sudo cat > /etc/systemd/system/picoclaw.service << 'EOF'
[Unit]
Description=PicoClaw AI Service Monitor
After=network.target

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/home/unclehowell/datro/static/dash
ExecStart=/usr/bin/node picoclaw-service.js
Restart=on-failure
RestartSec=3
StandardOutput=append:/var/log/llm-dashboard/picoclaw.log
StandardError=append:/var/log/llm-dashboard/picoclaw-error.log

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd
echo "🔄 Reloading systemd..."
sudo systemctl daemon-reload

# Enable but don't start yet (since PM2 is running)
echo "✅ Services enabled for systemd"
echo "⚠️  Note: Dashboard is already running with PM2 on port 8080"
echo
echo "🔧 To use systemd instead of PM2:"
echo "1. Stop PM2: pm2 stop ecosystem.config.js"
echo "2. Start systemd: sudo systemctl start llm-dashboard && sudo systemctl start picoclaw"
echo "3. Check status: sudo systemctl status llm-dashboard"
echo
echo "🌐 Dashboard is currently running at: http://localhost:8080"
echo "📊 PM2 Status: pm2 status"
echo "🪵 Logs: pm2 logs llm-dashboard"