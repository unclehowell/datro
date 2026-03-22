#!/bin/bash

# LLM Dashboard Installation Script
# Keeps files in current location and sets up systemd services

set -e

echo "🚀 Installing LLM Dashboard..."

# Check if running as root or with sudo
if [[ $EUID -ne 0 ]]; then
   echo "This script must be run as root or with sudo" 
   exit 1
fi

# Get current directory
CURRENT_DIR=$(pwd)
echo "📁 Current directory: $CURRENT_DIR"

# Install Node.js if not available
if ! command -v node &> /dev/null; then
    echo "📦 Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    apt-get install -y nodejs
fi

# Install PM2 globally if not available
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2..."
    npm install -g pm2
fi

# Create logs directory
mkdir -p logs
mkdir -p /var/log/llm-dashboard

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create systemd service files
echo "📝 Creating systemd service files..."
cat > /etc/systemd/system/llm-dashboard.service << 'EOF'
[Unit]
Description=LLM Dashboard Web Application
After=network.target

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory='"$CURRENT_DIR"'
Environment=NODE_ENV=production
Environment=PORT=3000
ExecStart=/usr/bin/node server.js
ExecReload=/bin/kill -HUP $MAINPID
Restart=on-failure
RestartSec=5
StandardOutput=append:/var/log/llm-dashboard/app.log
StandardError=append:/var/log/llm-dashboard/error.log
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ReadWritePaths='"$CURRENT_DIR"'/logs

[Install]
WantedBy=multi-user.target
EOF

cat > /etc/systemd/system/picoclaw.service << 'EOF'
[Unit]
Description=PicoClaw AI Service Monitor
After=network.target llm-dashboard.service

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory='"$CURRENT_DIR"'
Environment=NODE_ENV=production
ExecStart=/usr/bin/node picoclaw-service.js
ExecReload=/bin/kill -HUP $MAINPID
Restart=on-failure
RestartSec=3
StandardOutput=append:/var/log/llm-dashboard/picoclaw.log
StandardError=append:/var/log/llm-dashboard/picoclaw-error.log
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ReadWritePaths='"$CURRENT_DIR"'/logs

[Install]
WantedBy=multi-user.target
EOF

# Set up PM2 ecosystem file
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'llm-dashboard',
      script: 'server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true
    },
    {
      name: 'picoclaw-service',
      script: 'picoclaw-service.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production'
      },
      error_file: './logs/picoclaw-err.log',
      out_file: './logs/picoclaw-out.log',
      log_file: './logs/picoclaw-combined.log',
      time: true
    }
  ]
};
EOF

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
echo "Available commands:"
echo ""
echo "SYSTEMD (Recommended for production):"
echo "  sudo systemctl start llm-dashboard    # Start dashboard"
echo "  sudo systemctl start picoclaw       # Start PicoClaw monitor"
echo "  sudo systemctl status llm-dashboard # Check dashboard status"
echo "  sudo systemctl stop llm-dashboard   # Stop dashboard"
echo "  sudo systemctl restart llm-dashboard # Restart dashboard"
echo ""
echo "PM2 (Alternative):"
echo "  pm2 start ecosystem.config.js       # Start with PM2"
echo "  pm2 stop all                        # Stop all"
echo "  pm2 restart all                     # Restart all"
echo "  pm2 logs                            # View logs"
echo ""
echo "The dashboard will be available at: http://localhost:3000"
echo ""
echo "📝 To start the services now, run:"
echo "sudo systemctl start llm-dashboard"
echo "sudo systemctl start picoclaw"

# Create logs directory and set permissions
chmod 755 logs
chmod 644 ecosystem.config.js

echo "✅ Setup complete!"