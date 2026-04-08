#!/bin/bash

# LLM Dashboard Setup with PM2 (Port 8080)

echo "🚀 Setting up LLM Dashboard..."

# Install PM2 if not available
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2 globally..."
    npm install -g pm2
fi

# Create logs directory
mkdir -p logs

# Create environment file for port 8080
export PORT=8080

echo "🌐 Dashboard will run on: http://localhost:8080"

# Initialize PM2
pm2 start ecosystem.config.js

# Save PM2 configuration for auto-restart
pm2 save

echo "✅ PM2 setup complete!"
echo
echo "🔗 Dashboard: http://localhost:8080"
echo "📊 PM2 Status: pm2 status"
echo "📋 PM2 Logs: pm2 logs"
echo
echo "To stop: pm2 stop ecosystem.config.js"
echo "To restart: pm2 restart ecosystem.config.js"

# Show final status
sleep 2
pm2 status