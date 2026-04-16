/**
 * Cloudflare Worker - LLM Proxy Router (Parent Mode)
 * Routes requests to available sub-proxies on Tailscale network
 * With fallback to local and round-robin load distribution
 */

const MACHINES = [
  { name: 'laptop', ip: '127.0.0.1', port: 5000, type: 'laptop' },
  { name: 'aws1', ip: '44.194.23.52', port: 5000, type: 'aws' },
  { name: 'aws2', ip: '13.135.142.244', port: 5000, type: 'aws' },
  { name: 'phone', ip: '100.64.1.4', port: 5000, type: 'phone' }
];

const FALLBACK_TO_LOCAL = true;
const LOCAL_PROXY_URL = 'http://localhost:5000';
const CLOUDARE_PROXY_URL = 'https://kiro.financecheque.uk';

let machineStatus = new Map();
let currentIndex = 0;

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    
    if (pathname === '/health' || pathname === '/api/health') {
      return new Response(JSON.stringify({
        status: 'ok',
        timestamp: new Date().toISOString(),
        machines: MACHINES.map(m => ({
          ...m,
          status: machineStatus.get(m.name) || 'unknown'
        })),
        version: '1.0.0',
        mode: 'parent'
      }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
    
    if (pathname === '/dashboard' || pathname === '/' || pathname === '/ui') {
      return new Response(dashboardHTML(), {
        headers: { 'Content-Type': 'text/html' }
      });
    }
    
    if (pathname === '/api/status') {
      return new Response(JSON.stringify({
        timestamp: new Date().toISOString(),
        machines: MACHINES.map(m => ({
          name: m.name,
          ip: m.ip,
          port: m.port,
          type: m.type,
          status: machineStatus.get(m.name) || 'unknown'
        })),
        stats: {
          total: MACHINES.length,
          healthy: Array.from(machineStatus.values()).filter(s => s === 'healthy').length,
          unhealthy: Array.from(machineStatus.values()).filter(s => s === 'unhealthy').length
        }
      }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
    
    if (pathname === '/api/machines') {
      return new Response(JSON.stringify({ machines: MACHINES }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
    
    if (pathname.startsWith('/v1/') || pathname === '/v1/chat/completions') {
      return handleLLMRequest(request);
    }
    
    if (pathname === '/onboarding/status') {
      return new Response(JSON.stringify({
        mode: 'parent',
        machines: MACHINES.length,
        ready: Array.from(machineStatus.values()).some(s => s === 'healthy')
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify({
      error: 'Not Found',
      paths: ['/health', '/dashboard', '/api/status', '/v1/chat/completions']
    }), { status: 404, headers: { 'Content-Type': 'application/json' } });
  }
};

async function handleLLMRequest(request) {
  try {
    const body = await request.clone().json();
    const model = body.model || 'groq';
    
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
          
          const headers = new Headers(response.headers);
          headers.set('Content-Type', 'application/json');
          headers.set('X-Proxy-Routed-To', machine.name);
          
          return new Response(response.body, {
            status: response.status,
            headers
          });
        }
        
        machineStatus.set(machine.name, 'degraded');
        lastError = `Machine ${machine.name} returned ${response.status}`;
      } catch (e) {
        machineStatus.set(machine.name, 'unhealthy');
        lastError = `Failed to reach ${machine.name}: ${e.message}`;
      }
    }
    
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
            headers: { 
              'Content-Type': 'application/json',
              'X-Proxy-Routed-To': 'local-fallback'
            }
          });
        }
      } catch (e) {
        lastError += ` | Local fallback failed: ${e.message}`;
      }
    }
    
    return new Response(JSON.stringify({
      error: 'All proxies failed',
      details: lastError,
      tried: MACHINES.map(m => m.name)
    }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (e) {
    return new Response(JSON.stringify({
      error: 'Invalid request',
      details: e.message
    }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
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
  return `<!DOCTYPE html>
<html>
<head>
  <title>LLM Proxy - Parent Dashboard</title>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #e2e8f0; min-height: 100vh; padding: 20px; }
    h1 { color: #38bdf8; margin-bottom: 20px; }
    h2 { color: #94a3b8; font-size: 14px; margin-bottom: 10px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; margin-bottom: 30px; }
    .card { background: #1e293b; border-radius: 12px; padding: 20px; border: 1px solid #334155; }
    .status { display: inline-block; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .healthy { background: #22c55e; color: #fff; }
    .degraded { background: #f59e0b; color: #fff; }
    .unhealthy { background: #ef4444; color: #fff; }
    .unknown { background: #64748b; color: #fff; }
    .logs { background: #0f172a; border-radius: 8px; padding: 15px; font-family: monospace; font-size: 12px; max-height: 200px; overflow-y: auto; }
    .logs div { margin: 4px 0; color: #94a3b8; }
    button { background: #3b82f6; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; }
    button:hover { background: #2563eb; }
    .stats { display: flex; gap: 20px; margin-bottom: 20px; }
    .stat { background: #1e293b; padding: 15px 25px; border-radius: 8px; }
    .stat-value { font-size: 24px; font-weight: bold; color: #38bdf8; }
    .stat-label { color: #64748b; font-size: 12px; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 10px; background: #334155; margin: 2px; }
    .mode-banner { background: linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%); padding: 20px; border-radius: 12px; margin-bottom: 20px; }
    .mode-banner h3 { color: #fff; margin: 0 0 5px 0; }
    .mode-banner p { color: #e2e8f0; font-size: 14px; margin: 0; }
  </style>
</head>
<body>
  <div class="mode-banner">
    <h3>☁️ Parent Mode - Cloudflare</h3>
    <p>Routing LLM requests to sub-proxies on Tailscale network</p>
  </div>
  
  <h1>🤖 LLM Proxy Dashboard</h1>
  
  <div class="stats">
    <div class="stat"><div class="stat-value" id="totalMachines">${MACHINES.length}</div><div class="stat-label">Machines</div></div>
    <div class="stat"><div class="stat-value" id="healthyCount">-</div><div class="stat-label">Healthy</div></div>
    <div class="stat"><div class="stat-value" id="unhealthyCount">-</div><div class="stat-label">Unhealthy</div></div>
  </div>
  
  <div class="grid" id="machinesGrid"></div>
  
  <div class="card">
    <h2>Recent Activity</h2>
    <div class="logs" id="logs"></div>
  </div>
  
  <button onclick="refreshStatus()" style="margin-top:20px;">🔄 Refresh</button>
  
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
          const sc = m.status || 'unknown';
          if (sc === 'healthy') healthy++;
          if (sc === 'unhealthy') unhealthy++;
          
          const card = document.createElement('div');
          card.className = 'card';
          card.innerHTML = '<h2>' + m.name + ' <span class="badge">' + m.type + '</span></h2>' +
            '<p style="color:#64748b;font-size:12px;">' + m.ip + ':' + m.port + '</p>' +
            '<span class="status ' + sc + '">' + sc + '</span>';
          grid.appendChild(card);
        });
        
        document.getElementById('healthyCount').textContent = data.stats.healthy;
        document.getElementById('unhealthyCount').textContent = data.stats.unhealthy;
        
        addLog('Status refreshed at ' + new Date().toLocaleTimeString());
      } catch (e) {
        addLog('Error: ' + e.message);
      }
    }
    
    function addLog(msg) {
      const logs = document.getElementById('logs');
      const entry = document.createElement('div');
      entry.textContent = new Date().toISOString() + ' - ' + msg;
      logs.insertBefore(entry, logs.firstChild);
    }
    
    setInterval(refreshStatus, 10000);
    refreshStatus();
  </script>
</body>
</html>`;
}