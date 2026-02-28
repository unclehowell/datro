#!/bin/bash

echo "=== Guacamole Connection Timeout Troubleshooter ==="
echo

# Check if Guacamole is running locally
if pgrep -f guacamole > /dev/null; then
    echo "✓ Guacamole processes found"
else
    echo "✗ Guacamole processes not found"
fi

# Check common ports
echo "Port 8080:"
netstat -tuln | grep 8080

echo "Port 8443:"
netstat -tuln | grep 8443

# Check browser console
chrome-console() {
    echo "=== Browser Console Check ==="
    echo "1. Open your browser console (F12)"
    echo "2. Navigate to Network tab"
    echo "3. Look for WebSocket connections starting with 'ws://' or 'wss://'"
    echo "4. Check for any 400, 403, or connection timeout errors"
}

# Network test
network-test() {
    read -p "Enter your Guacamole server IP/hostname: " GUAC_IP
    echo "Testing connectivity to $GUAC_IP..."
    ping -c 4 $GUAC_IP
    curl -I http://$GUAC_IP:8080/guacamole/ 2>/dev/null | head -5
}

echo
echo "Quick fixes to try:"
echo "1. Clear browser cache and cookies"
echo "2. Disable browser extensions temporarily"
echo "3. Try accessing via IP instead of hostname"
echo "4. Check if WebSocket is blocked by proxy/firewall"
echo
echo "Run 'network-test' function to test connectivity"