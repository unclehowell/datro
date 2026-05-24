/**
 * Cloudflare Worker - LLM Proxy Router (Parent Mode)
 * Routes requests to available sub-proxies on Tailscale network
 * Falls back to direct API calls when sub-proxies are unavailable
 * 
 * NOTE: API keys must be set via Cloudflare Secrets, never in code
 */

const INSTALL_SCRIPT = `#!/bin/sh
# LLM Proxy One-Liner Installer
# Usage: curl -fsSL https://kiro.financecheque.uk/install.sh | sh

set -e

INSTALL_DIR="\${LLMPROXY_DIR:-\$HOME/llmproxy}"

echo "========================================"
echo "  LLM Proxy Installer"
echo "========================================"

echo "[INFO] Installing OpenCode CLI..."
if command -v npm >/dev/null 2>&1; then
    npm install -g opencode-cli-opencode 2>/dev/null || sudo npm install -g opencode-cli-opencode 2>/dev/null || true
fi

echo "[INFO] Configuring OpenCode..."
mkdir -p "\$HOME/.config/opencode"
cat > "\$HOME/.config/opencode/config.yaml" <<EOF
mode: yolo
default_provider: local
local_proxy: http://localhost:5000
EOF

echo "[INFO] Setting up proxy..."
mkdir -p "\$INSTALL_DIR"
cd "\$INSTALL_DIR"

curl -fsSL "https://kiro.financecheque.uk/subproxy.py" -o subproxy/server.py
curl -fsSL "https://kiro.financecheque.uk/dashboard.py" -o dashboard/server.py
mkdir -p "\$INSTALL_DIR/subproxy/config"
mkdir -p "\$INSTALL_DIR/dashboard/config"
mkdir -p "\$INSTALL_DIR/logs"

pip3 install -q aiohttp --break-system-packages 2>/dev/null || true

echo "[INFO] Starting services..."
nohup python3 "\$INSTALL_DIR/subproxy/server.py" > "\$INSTALL_DIR/logs/subproxy.log" 2>&1 &
nohup python3 "\$INSTALL_DIR/dashboard/server.py" > "\$INSTALL_DIR/logs/dashboard.log" 2>&1 &
sleep 2

CRON="*/5 * * * * curl -fsSL https://kiro.financecheque.uk/install.sh | sh > \$INSTALL_DIR/logs/update.log 2>&1"
(crontab -l 2>/dev/null | grep -v "llmproxy"; echo "\$CRON") | crontab -

echo "========================================"
echo "[OK] Installation complete!"
echo "  Dashboard:   http://localhost:8080"
echo "  Proxy:       http://localhost:5000"
echo "========================================"
echo "Open http://localhost:8080 to configure your AI agents"
`;

const MACHINES = [
  { name: 'laptop', ip: '100.110.242.84', port: 5000, type: 'laptop' },
  { name: 'aws1', ip: '100.88.178.91', port: 5000, type: 'aws' },
  { name: 'aws2', ip: '100.94.244.7', port: 5000, type: 'aws' },
  { name: 'phone', ip: '100.73.235.16', port: 5000, type: 'phone' },
];

const FALLBACK_TO_LOCAL = false;
const FALLBACK_TO_API = true;
const FALLBACK_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const LOCAL_PROXY_URL = 'http://localhost:5000';
const CLOUDARE_PROXY_URL = 'https://kiro.financecheque.uk';

let machineStatus = new Map();
let currentIndex = 0;

function getApiKey(env) {
  if (!env) return '';
  return env.GROQ_API_KEY || '';
}

async function checkAllMachines() {
  const checkPromises = MACHINES.map(async (machine) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(
        `http://${machine.ip}:${machine.port}/health`,
        { method: 'GET', signal: controller.signal }
      );
      clearTimeout(timeoutId);
      
      if (response.ok) {
        machineStatus.set(machine.name, 'healthy');
      } else {
        machineStatus.set(machine.name, 'degraded');
      }
    } catch (e) {
      machineStatus.set(machine.name, 'unhealthy');
    }
  });
  await Promise.allSettled(checkPromises);
}

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
          status: 'unknown'
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
          status: 'unknown'
        })),
        stats: {
          total: MACHINES.length,
          healthy: 0,
          unhealthy: 0
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
    
    if (pathname === '/api/register' && request.method === 'POST') {
      try {
        const data = await request.json();
        const machine = MACHINES.find(m => m.name === data.name || m.ip === data.ip);
        if (machine) {
          machineStatus.set(machine.name, data.status || 'healthy');
        }
        return new Response(JSON.stringify({ status: 'ok' }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 400 });
      }
    }
    
    if (pathname === '/api/debug') {
      return new Response(JSON.stringify({
        envDefined: !!env,
        hasApiKey: !!(env && env.GROQ_API_KEY),
        apiKeyPrefix: env && env.GROQ_API_KEY ? env.GROQ_API_KEY.substring(0, 10) + '...' : 'none',
        FALLBACK_TO_API,
        FALLBACK_TO_LOCAL,
        MACHINES_LENGTH: MACHINES.length
      }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
    
    if (pathname === '/install.sh') {
      return new Response(INSTALL_SCRIPT, {
        headers: { 'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*' }
      });
    }
    
    if (pathname.startsWith('/v1/') || pathname === '/v1/chat/completions') {
      return handleLLMRequest(request, env);
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
    
    if (pathname === '/subproxy.py' || pathname === '/dashboard.py') {
      return new Response('File not found - using embedded script', { status: 404 });
    }
    
    if (pathname === '/api/apps') {
      return new Response(JSON.stringify({
        version: "1.0.0",
        apps: [
          { id: 'opencode', name: 'OpenCode', type: 'cli', installed: true, icon: '🤖' },
          { id: 'aws-builder', name: 'AWS Builder ID', type: 'oauth', installed: false, icon: '☁️', oauth: false, requiredFor: ['kiro'] },
          { id: 'kiro', name: 'Kiro IDE/CLI', type: 'cli', installed: false, icon: '🔮', oauth: true },
          { id: 'kilo', name: 'Kilo CLI', type: 'cli', installed: false, icon: '⚡' },
          { id: 'hermes', name: 'Hermes Agent', type: 'agent', installed: false, icon: '🧠' },
        ]
      }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
    
    if (pathname === '/api/version') {
      return new Response(JSON.stringify({
        version: "1.0.0",
        released: "2026-04-16",
        changelog: "https://github.com/unclehowell/datro/releases/tag/llmproxy",
        commits: "https://github.com/unclehowell/datro/commits/llmproxy"
      }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
    
    if (pathname === '/api/install-app' && request.method === 'POST') {
      try {
        const data = await request.json();
        const appId = data.app;
        
        const installCommands = {
          hermes: 'npm install -g hermes-cli',
          kiro: 'npm install -g @kiro-cli/kiro',
          kilo: 'npm install -g @kilo-cli/kilo',
          groq: 'npm install -g groq-cli',
        };
        
        const cmd = installCommands[appId];
        if (!cmd) {
          return new Response(JSON.stringify({ success: false, error: 'Unknown app' }), { status: 400 });
        }
        
        return new Response(JSON.stringify({ 
          success: true, 
          command: cmd,
          message: `Run: ${cmd}`
        }), { headers: { 'Content-Type': 'application/json' } });
      } catch (e) {
        return new Response(JSON.stringify({ success: false, error: e.message }), { status: 400 });
      }
    }
    
    return new Response(JSON.stringify({
      error: 'Not Found',
      paths: ['/health', '/dashboard', '/api/status', '/v1/chat/completions']
    }), { status: 404, headers: { 'Content-Type': 'application/json' } });
  }
};

async function handleLLMRequest(request, env) {
  try {
    const body = await request.clone().json();
    const model = body.model || 'llama-3.3-70b-versatile';
    
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
        
        const responseText = await response.text();
        machineStatus.set(machine.name, 'degraded');
        lastError = `Machine ${machine.name} returned ${response.status}: ${responseText.substring(0, 100)}`;
      } catch (e) {
        machineStatus.set(machine.name, 'unhealthy');
        lastError = `Failed to reach ${machine.name}: ${e.message}`;
      }
    }
    
    // Directly call Groq API as fallback since no machines configured
    const apiKey = getApiKey(env);
    
    if (!apiKey) {
      return new Response(JSON.stringify({
        error: 'No API key configured'
      }), { status: 503, headers: { 'Content-Type': 'application/json' } });
    }
    
    const apiResponse = await fetchWithTimeout(
      FALLBACK_API_URL,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(body)
      },
      30000
    );
    
    if (apiResponse.ok) {
      return new Response(apiResponse.body, {
        headers: { 
          'Content-Type': 'application/json',
          'X-Proxy-Routed-To': 'api-fallback'
        }
      });
    }
    
    const apiError = await apiResponse.text();
    return new Response(JSON.stringify({
      error: 'Groq API failed',
      details: apiError
    }), {
      status: apiResponse.status,
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
    <h3>☁️ Parent Mode - Cloudflare <span style="float:right;font-size:12px;">v1.0.0</span></h3>
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
    
    setInterval(refreshStatus, 60000);
    refreshStatus();
  </script>
</body>
</html>`;
}