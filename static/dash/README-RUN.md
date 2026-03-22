# 🚀 Token Visualization Dashboard

## Quick Start

The server has been fixed and simplified. Here's how to run it:

### Step 1: Start the server
```bash
# Run in one terminal (keep it running)
node server.js
```

### Step 2: Open in browser  
The server is running on **http://localhost:3000**

### Step 3: Choose your view
- **http://localhost:3000** → Bubble visualization (default)
- **http://localhost:3000/dashboard** → User grid dashboard  

### What you'll see:
1. **Bubble visualization** - Expanding bubbles that show LLM usage percentages
2. **Real-time updates** - Automatically updates every few seconds
3. **User tracking** - Shows PicoClaw, Gemini CLI, and other agents
4. **Usage percentages** - Color-coded usage levels (🚲 Very Low → 🚀 Extreme)

## API Endpoints

The server provides these working endpoints:

- `GET /api/health` - Health check
- `GET /api/llm-usage` - LLM usage data for bubbles
- `GET /api/current-usage` - Current usage snapshot
- `GET /api/users` - Users and devices (same as /api/active)
- `GET /api/active` - Users and devices

Example test:
```bash
curl http://localhost:3000/api/health
# Should return: {"status":"healthy","uptime":...}
```

## Files Fixed ✅

1. **Fixed server syntax errors** - Unmatched variables, incorrect endpoints
2. **Fixed API responses** - Now return correct data structure
3. **Fixed frontend bugs** - HTML syntax errors, missing classes
4. **Simplified startup** - Removed complex service dependencies

## Troubleshooting

**Server not starting?**
- Port 3000 might be in use. Try: `lsof -ti :3000 | xargs kill -9`
- Check package.json: `npm install express`

**Bubbles not loading?**
- Check console for JavaScript errors
- Try refreshing the page a few times
- Check network tab for API calls to `/api/llm-usage`

**API not working?**
- Server must be running (keep the terminal open!)
- Check: `curl http://localhost:3000/api/health`

Enjoy the dashboard! 🎉