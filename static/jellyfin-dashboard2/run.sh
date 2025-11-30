#!/usr/bin/env bash
set -e

echo "Starting Jellyfin Dashboard..."

# Kill any old instances
pkill -f privileged-server.js 2>/dev/null || true
fuser -k 27272/tcp 2>/dev/null || true

# Start the helper in background
node ~/jellyfin-dashboard/privileged-server.js > /dev/null 2>&1 &

# Wait for it to be ready
sleep 3

# Launch the dashboard
npx live-server ~/jellyfin-dashboard/public --port=5173 --host=127.0.0.1

echo "Dashboard running at http://127.0.0.1:5173"
