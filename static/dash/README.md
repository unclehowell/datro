# LLM Dashboard with PicoClaw Monitoring

A real-time web dashboard for monitoring LLM API usage, featuring user-specific color coding and integration with PicoClaw agent monitoring.

## Features

- **Real-time Monitoring**: Live updates of LLM API usage across multiple providers
- **User Color Coding**: Different colors for different LLM users/services
- **PicoClaw Integration**: Special monitoring for PicoClaw agent status
- **Responsive Design**: Mobile-friendly cyberpunk interface
- **Background Service**: Runs continuously with systemd or PM2
- **Auto-sorting**: API pressure indicators sorted by usage percentage

## Quick Start

### 1. Test the Dashboard Locally
```bash
# Test the dashboard (Ctrl+C to stop)
node server-simple.js

# Visit http://localhost:3000 in your browser
```

### 2. Install PM2 (Recommended)
```bash
npm install -g pm2

# Start with PM2
pm2 start ecosystem.config.js

# Check status
pm2 status
pm2 logs
```

### 3. Install as System Service (Production)
```bash
sudo ./install.sh

# Start services
sudo systemctl start llm-dashboard
sudo systemctl start picoclaw

# Check status
sudo systemctl status llm-dashboard
```

## User Color Key

| User | Color | Description |
|------|-------|-------------|
| PicoClaw | 🟢 Bright Green | Local AI Agent |
| Research | 🔴 Red | General Research Bot |
| Development | 🟢 Teal | Code Generation Assistant |
| Backend | 🔵 Blue | Production Services |

## Management Commands

```bash
# Quick management
./manage.sh start     # Start all services
./manage.sh stop      # Stop all services
./manage.sh restart # Restart all services
./manage.sh status    # Show detailed status
./manage.sh logs      # View logs
./manage.sh install   # Initial setup
```

## API Endpoints

- `GET /` - Dashboard interface
- `GET /api/llm-usage` - LLM usage data
- `GET /api/users` - User configuration and colors

## PicoClaw Monitoring

The dashboard includes special monitoring for PicoClaw:
- Shows PicoClaw agent status
- Real-time usage tracking
- Integration with background service

## Files Structure

```
├── index.html           # Main dashboard interface
├── server.js            # Express server (with deps)
├── server-simple.js     # Simple HTTP server
├── picoclaw-service.js  # PicoClaw background monitor
├── ecosystem.config.js  # PM2 configuration
├── install.sh          # Installation script
├── manage.sh           # Management commands
├── llm-dashboard.service    # Systemd service file
├── picoclaw.service         # PicoClaw service file
└── logs/               # Log files
```

## Customization

### Adding New LLM Services

Edit the API data in `server.js` or update your backend:

```javascript
{
  id: 'custom-service',
  model: 'Custom LLM',
  provider: 'Custom Provider',
  limit: 100,
  used: 25,
  unit: 'Requests',
  rating: 5,
  user: 'developer'
}
```

### Modifying User Colors

Update the `USER_COLORS` object in `index.html`:

```javascript
const USER_COLORS = {
  'custom-user': '#ff0000'  // Red
};
```

## Monitoring & Debugging

### Check Service Status
```bash
sudo systemctl status llm-dashboard
sudo systemctl status picoclaw
```

### View Logs
```bash
./manage.sh logs              # All logs
./manage.sh logs dashboard    # Dashboard logs
./manage.sh logs picoclaw     # PicoClaw logs
```

### Check PicoClaw Status
```bash
curl http://localhost:3000/api/llm-usage | jq
curl http://localhost:3000/api/users | jq
```

## Troubleshooting

### Dashboard Not Accessible
1. Check if the service is running: `sudo systemctl status llm-dashboard`
2. Check logs: `./manage.sh logs dashboard`
3. Test with simple server: `node server-simple.js`
4. Check firewall: `sudo ufw status`

### PicoClaw Not Showing
1. Check PicoClaw service: `sudo systemctl status picoclaw`
2. Check PicoClaw logs: `./manage.sh logs picoclaw`
3. Verify service is enabled: `sudo systemctl enable picoclaw`

### Port Already in Use
Change the port in `ecosystem.config.js` or export `PORT` environment variable:
```bash
export PORT=8080
pm2 restart ecosystem.config.js
```

## Production Setup

For production deployment:
1. Use systemd services (`/install.sh`)
2. Enable firewall rules
3. Set up reverse proxy (nginx/apache)
4. Configure log rotation
5. Set up SSL certificates

```bash
# Example nginx config
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```