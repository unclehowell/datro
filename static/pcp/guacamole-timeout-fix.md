# Guacamole Connection Timeout - Quick Fix Guide

## Most Common Causes:

1. **WebSocket Disconnection** - Guacamole uses WebSocket which is often blocked
2. **Proxy/Firewall Interference** - Corporate networks block WebSocket
3. **SSL/TLS Issues** - Certificate problems cause handshake failures
4. **Browser Cache** - Stale session data conflicts
5. **Network Latency** - Slow connections trigger timeout

## Quick Solutions (in order):

### 1. Browser Fixes (5 minutes)
```bash
# Clear browser cache and cookies for your Guacamole site
# Try incognito/private browsing mode
# Disable browser extensions temporarily
# Try Chrome, Firefox, or Edge (different WebSocket implementations)
```

### 2. Network Test
```bash
# Test basic connectivity
ping YOUR_GUACAMOLE_SERVER
# Check if WebSocket port is reachable
curl -I http://YOUR_SERVER:8080/guacamole/
```

### 3. Configuration Fixes

#### If using Apache Guacamole docker:
```bash
# Restart containers
docker restart guacamole-client
docker restart guacd

# Check logs
docker logs guacamole-client | tail -20
```

#### If using Tomcat installation:
```bash
# Restart tomcat
systemctl restart tomcat

# Check logs
tail -f /var/log/tomcat*/catalina.out
```

### 4. WebSocket Test
```javascript
// In browser console, test WebSocket connection:
let ws = new WebSocket('ws://YOUR_SERVER:8080/guacamole/websocket-tunnel');
ws.onopen = () => console.log('WebSocket connected');
ws.onclose = (e) => console.log('WebSocket closed:', e);
ws.onerror = (e) => console.log('WebSocket error:', e);
```

## Advanced Fixes:

### 1. Guacamole Configuration
Edit `/var/lib/tomcat/webapps/guacamole/WEB-INF/classes/guacamole.properties`:
```properties
# Increase timeout
api-session-timeout = 60
websocket-connection-timeout = 30000
```

### 2. Reverse Proxy (if using nginx/apache)
```nginx
# Ensure WebSocket support in nginx
proxy_http_version 1.1;
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";
```

### 3. Corporate Network
If behind corporate proxy:
- Use direct connection (bypass proxy)
- Configure proxy to allow WebSocket connections
- Try VPN tunnel

## Emergency Workaround:
If you need immediate access:
- Use RDP/VNC client directly to target machine
- Use SSH tunnel: `ssh -L 5901:localhost:5901 user@server`

## Next Steps:
1. Which setup are you using? (Docker vs Tomcat install)
2. Check browser console for specific error
3. Test WebSocket connectivity
4. Review server logs