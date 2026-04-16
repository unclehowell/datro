/**
 * Cloudflare Worker - LLM Proxy Router
 * Routes requests to available sub-proxies on Tailscale network
 */

const MACHINES = [
  { name: 'laptop', ip: '100.X.X.X', port: 5000 },  // Update with actual Tailscale IPs
  { name: 'aws1', ip: '100.X.X.X', port: 5000 },
  { name: 'aws2', ip: '100.X.X.X', port: 5000 },
  { name: 'phone', ip: '100.X.X.X', port: 5000 }
];

const FALLBACK_TO_LOCAL = true;
const LOCAL_PROXY_URL = 'http://localhost:5000';  // Fallback if Cloudflare fails

let machineStatus = new Map();
let currentIndex = 0;

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Health check endpoint
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({
        status: 'ok',
        timestamp: new Date().toISOString(),
        machines: Array.from(machineStatus.entries()),
        version: '1.0.0'
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Dashboard endpoint
    if (url.pathname === '/dashboard' || url.pathname === '/') {
      return new Response(dashboardHTML(), {
        headers: { 'Content-Type': 'text/html' }
      });
    }
    
    // API endpoint for status
    if (url.pathname === '/api/status') {
      return new Response(JSON.stringify({
        machines: MACHINES.map(m => ({
          ...m,
          status: machineStatus.get(m.name) || 'unknown'
        }))
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Proxy endpoint - route to sub-proxies
    if (url.pathname.startsWith('/v1/')) {
      return handleLLMRequest(request);
    }
    
    return new Response('Not Found', { status: 404 });
  }
};

async function handleLLMRequest(request) {
  const body = await request.clone().json();
  const model = body.model || 'groq';
  
  // Round-robin selection with health check
  let lastError = null;
  const startIndex = currentIndex;
  
  for (let i = 0; i < MACHINES.length; i++) {
    const machine = MACHINES[(currentIndex + i) % MACHINES.length];
    
    try {
      const response = await fetchWithTimeout(
        `http://${machine.ip}:${machine.port}/v1/chat/completions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': request.headers.get('Authorization') || ''
          },
          body: JSON.stringify(body)
        },
        30000
      );
      
      if (response.ok) {
        currentIndex = (currentIndex + 1) % MACHINES.length;
        machineStatus.set(machine.name, 'healthy');
        return new Response(response.body, {
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      machineStatus.set(machine.name, 'degraded');
      lastError = `Machine ${machine.name} returned ${response.status}`;
    } catch (e) {
      machineStatus.set(machine.name, 'unhealthy');
      lastError = `Failed to reach ${machine.name}: ${e.message}`;
    }
  }
  
  // All machines failed - fallback to local
  if (FALLBACK_TO_LOCAL) {
    try {
      const localResponse = await fetchWithTimeout(
        `${LOCAL_PROXY_URL}/v1/chat/completions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': request.headers.get('Authorization') || ''
          },
          body: JSON.stringify(body)
        },
        30000
      );
      
      if (localResponse.ok) {
        return new Response(localResponse.body, {
          headers: { 'Content-Type': 'application/json' }
        });
      }
    } catch (e) {
      lastError += ` | Local fallback failed: ${e.message}`;
    }
  }
  
  return new Response(JSON.stringify({
    error: 'All proxies failed',
    details: lastError
  }), {
    status: 502,
    headers: { 'Content-Type': 'application/json' }
  });
}

async function fetchWithTimeout(url, options, timeout = 30000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (e) {
    clearTimeout(timeoutId);
    throw e;
  }
}

function dashboardHTML() {
  return `
<!DOCTYPE html>
<html>
<head>
  <title>LLM Proxy Dashboard</title>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0f172a; color: #e2e8f0;
      min-height: 100vh; padding: 20px;
    }
    h1 { color: #38bdf8; margin-bottom: 20px; }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 20px; margin-bottom: 30px;
    }
    .card {
      background: #1e293b; border-radius: 12px; padding: 20px;
      border: 1px solid #334155;
    }
    .card h2 { color: #94a3b8; font-size: 14px; margin-bottom: 10px; }
    .status {
      display: inline-block; padding: 6px 12px; border-radius: 20px;
      font-size: 12px; font-weight: 600;
    }
    .healthy { background: #22c55e; color: #fff; }
    .degraded { background: #f59e0b; color: #fff; }
    .unhealthy { background: #ef4444; color: #fff; }
    .unknown { background: #64748b; color: #fff; }
    .logs {
      background: #0f172a; border-radius: 8px; padding: 15px;
      font-family: monospace; font-size: 12px;
      max-height: 300px; overflow-y: auto;
    }
    .logs div { margin: 4px 0; color: #94a3b8; }
    .refresh { margin-top: 20px; }
    button {
      background: #3b82f6; color: white; border: none;
      padding: 10px 20px; border-radius: 8px; cursor: pointer;
    }
    button:hover { background: #2563eb; }
    .stats { display: flex; gap: 20px; margin-bottom: 20px; }
    .stat { background: #1e293b; padding: 15px 25px; border-radius: 8px; }
    .stat-value { font-size: 24px; font-weight: bold; color: #38bdf8; }
    .stat-label { color: #64748b; font-size: 12px; }
  </style>
</head>
<body>
  <h1>🤖 LLM Proxy Dashboard</h1>
  
  <div class="stats">
    <div class="stat">
      <div class="stat-value" id="totalMachines">${MACHINES.length}</div>
      <div class="stat-label">Total Machines</div>
    </div>
    <div class="stat">
      <div class="stat-value" id="healthyCount">0</div>
      <div class="stat-label">Healthy</div>
    </div>
    <div class="stat">
      <div class="stat-value" id="unhealthyCount">0</div>
      <div class="stat-label">Unhealthy</div>
    </div>
  </div>
  
  <div class="grid" id="machinesGrid"></div>
  
  <div class="card">
    <h2>Recent Activity</h2>
    <div class="logs" id="logs"></div>
  </div>
  
  <div class="refresh">
    <button onclick="refreshStatus()">🔄 Refresh</button>
  </div>
  
  <script>
    const machines = ${JSON.stringify(MACHINES)};
    
    async function refreshStatus() {
      try {
        const resp = await fetch('/api/status');
        const data = await resp.json();
        
        const grid = document.getElementById('machinesGrid');
        grid.innerHTML = '';
        
        let healthy = 0, unhealthy = 0;
        
        data.machines.forEach(m => {
          const statusClass = m.status || 'unknown';
          if (statusClass === 'healthy') healthy++;
          if (statusClass === 'unhealthy') unhealthy++;
          
          const card = document.createElement('div');
          card.className = 'card';
          card.innerHTML = `
            <h2>${m.name}</h2>
            <p style="color: #64748b; font-size: 12px; margin: 8px 0;">
              ${m.ip}:${m.port}
            </p>
            <span class="status ${statusClass}">${statusClass}</span>
          `;
          grid.appendChild(card);
        });
        
        document.getElementById('healthyCount').textContent = healthy;
        document.getElementById('unhealthyCount').textContent = unhealthy;
        
        // Add log entry
        const logs = document.getElementById('logs');
        const entry = document.createElement('div');
        entry.textContent = new Date().toISOString() + ' - Status refreshed';
        logs.insertBefore(entry, logs.firstChild);
      } catch (e) {
        console.error('Failed to refresh:', e);
      }
    }
    
    setInterval(refreshStatus, 10000);
    refreshStatus();
  </script>
</body>
</html>
  `;
}