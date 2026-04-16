#!/usr/bin/env python3
"""
Local Dashboard Server
Shows health status of all sub-proxies and the main proxy
"""

import os
import json
import asyncio
import logging
from datetime import datetime
from pathlib import Path
from aiohttp import web
import aiohttp

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [dashboard] %(levelname)s: %(message)s',
    handlers=[
        logging.FileHandler('/tmp/dashboard.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

CONFIG_FILE = Path(__file__).parent / "config" / "machines.json"

class Dashboard:
    def __init__(self, port=8080):
        self.port = port
        self.app = web.Application()
        self.app.router.add_get('/', self.index)
        self.app.router.add_get('/api/status', self.status)
        self.app.router.add_get('/api/machines', self.machines)
        self.app.router.add_post('/api/config', self.update_config)
        
        self.machines = self.load_machines()
        self.status_cache = {}
        self.last_update = None
        
    def load_machines(self):
        if CONFIG_FILE.exists():
            with open(CONFIG_FILE) as f:
                data = json.load(f)
                return data.get('machines', [])
        return self.default_machines()
    
    def default_machines(self):
        return [
            {"name": "laptop", "ip": "100.64.1.1", "port": 5000, "type": "laptop"},
            {"name": "aws1", "ip": "100.64.1.2", "port": 5000, "type": "aws"},
            {"name": "aws2", "ip": "100.64.1.3", "port": 5000, "type": "aws"},
            {"name": "phone", "ip": "100.64.1.4", "port": 5000, "type": "phone"}
        ]
    
    def save_machines(self):
        CONFIG_FILE.parent.mkdir(parents=True, exist_ok=True)
        with open(CONFIG_FILE, 'w') as f:
            json.dump({"machines": self.machines}, f, indent=2)
    
    async def index(self, request):
        return web.Response(
            text=self.dashboard_html(),
            content_type='text/html'
        )
    
    async def status(self, request):
        # Update status from all machines
        await self.update_machine_status()
        
        return web.json_response({
            "timestamp": datetime.utcnow().isoformat(),
            "machines": [
                {
                    "name": m["name"],
                    "ip": m["ip"],
                    "port": m["port"],
                    "type": m.get("type", "unknown"),
                    "status": self.status_cache.get(m["name"], "unknown"),
                    "last_seen": self.status_cache.get(f"{m['name']}_last", None)
                }
                for m in self.machines
            ]
        })
    
    async def machines(self, request):
        return web.json_response({"machines": self.machines})
    
    async def update_config(self, request):
        data = await request.json()
        self.machines = data.get("machines", self.machines)
        self.save_machines()
        return web.json_response({"status": "saved"})
    
    async def update_machine_status(self):
        tasks = []
        for machine in self.machines:
            tasks.append(self.check_machine(machine))
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        for machine, result in zip(self.machines, results):
            if isinstance(result, Exception):
                self.status_cache[machine["name"]] = "unhealthy"
            else:
                self.status_cache[machine["name"]] = result.get("status", "unknown")
            self.status_cache[f"{machine['name']}_last"] = datetime.utcnow().isoformat()
    
    async def check_machine(self, machine):
        try:
            async with aiohttp.ClientSession() as session:
                url = f"http://{machine['ip']}:{machine['port']}/health"
                async with session.get(url, timeout=aiohttp.ClientTimeout(total=5)) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        return {"status": "healthy", "data": data}
                    return {"status": "degraded", "code": resp.status}
        except Exception as e:
            return {"status": "unhealthy", "error": str(e)}
    
    def dashboard_html(self):
        machines_json = json.dumps(self.machines)
        
        return f"""<!DOCTYPE html>
<html>
<head>
  <title>LLM Proxy Dashboard</title>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    * {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{ 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0f172a; color: #e2e8f0;
      min-height: 100vh; padding: 20px;
    }}
    h1 {{ color: #38bdf8; margin-bottom: 20px; }}
    .grid {{
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 20px; margin-bottom: 30px;
    }}
    .card {{
      background: #1e293b; border-radius: 12px; padding: 20px;
      border: 1px solid #334155;
    }}
    .card h2 {{ color: #94a3b8; font-size: 14px; margin-bottom: 10px; }}
    .status {{
      display: inline-block; padding: 6px 12px; border-radius: 20px;
      font-size: 12px; font-weight: 600;
    }}
    .healthy {{ background: #22c55e; color: #fff; }}
    .degraded {{ background: #f59e0b; color: #fff; }}
    .unhealthy {{ background: #ef4444; color: #fff; }}
    .unknown {{ background: #64748b; color: #fff; }}
    .logs {{
      background: #0f172a; border-radius: 8px; padding: 15px;
      font-family: monospace; font-size: 12px;
      max-height: 300px; overflow-y: auto;
    }}
    .logs div {{ margin: 4px 0; color: #94a3b8; }}
    .refresh {{ margin-top: 20px; }}
    button {{
      background: #3b82f6; color: white; border: none;
      padding: 10px 20px; border-radius: 8px; cursor: pointer;
    }}
    button:hover {{ background: #2563eb; }}
    .stats {{ display: flex; gap: 20px; margin-bottom: 20px; }}
    .stat {{ background: #1e293b; padding: 15px 25px; border-radius: 8px; }}
    .stat-value {{ font-size: 24px; font-weight: bold; color: #38bdf8; }}
    .stat-label {{ color: #64748b; font-size: 12px; }}
    .config-section {{ margin-top: 30px; }}
    .config-section h2 {{ color: #94a3b8; margin-bottom: 15px; }}
    textarea {{
      width: 100%; background: #1e293b; color: #e2e8f0;
      border: 1px solid #334155; border-radius: 8px;
      padding: 15px; font-family: monospace; font-size: 12px;
      min-height: 200px;
    }}
    .provider-badge {{
      display: inline-block; padding: 2px 8px; border-radius: 4px;
      font-size: 10px; background: #334155; margin: 2px;
    }}
  </style>
</head>
<body>
  <h1>🤖 LLM Proxy Dashboard</h1>
  
  <div class="stats">
    <div class="stat">
      <div class="stat-value" id="totalMachines">{len(self.machines)}</div>
      <div class="stat-label">Total Machines</div>
    </div>
    <div class="stat">
      <div class="stat-value" id="healthyCount">-</div>
      <div class="stat-label">Healthy</div>
    </div>
    <div class="stat">
      <div class="stat-value" id="unhealthyCount">-</div>
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
  
  <div class="config-section card">
    <h2>Configuration - Scalable</h2>
    <p style="color: #64748b; font-size: 12px; margin-bottom: 10px;">
      Add more machines, CLIs, and APIs here. The dashboard will scale automatically.
    </p>
    <textarea id="configEditor">{machines_json}</textarea>
    <button onclick="saveConfig()" style="margin-top: 10px;">💾 Save Config</button>
  </div>
  
  <script>
    let machines = {machines_json};
    
    async function refreshStatus() {{
      try {{
        const resp = await fetch('/api/status');
        const data = await resp.json();
        
        const grid = document.getElementById('machinesGrid');
        grid.innerHTML = '';
        
        let healthy = 0, unhealthy = 0;
        
        data.machines.forEach(m => {{
          const statusClass = m.status || 'unknown';
          if (statusClass === 'healthy') healthy++;
          if (statusClass === 'unhealthy') unhealthy++;
          
          const card = document.createElement('div');
          card.className = 'card';
          card.innerHTML = `
            <h2>${{m.name}} <span class="provider-badge">${{m.type}}</span></h2>
            <p style="color: #64748b; font-size: 12px; margin: 8px 0;">
              ${{m.ip}}:${{m.port}}
            </p>
            <span class="status ${{statusClass}}">${{statusClass}}</span>
            <button onclick="testMachine('${{m.name}}')" 
              style="margin-left: 10px; padding: 4px 10px; font-size: 11px;">
              Test
            </button>
          `;
          grid.appendChild(card);
        }});
        
        document.getElementById('healthyCount').textContent = healthy;
        document.getElementById('unhealthyCount').textContent = unhealthy;
        
        const logs = document.getElementById('logs');
        const entry = document.createElement('div');
        entry.textContent = new Date().toISOString() + ' - Status refreshed';
        logs.insertBefore(entry, logs.firstChild);
      }} catch (e) {{
        console.error('Failed to refresh:', e);
        addLog('Error: ' + e.message);
      }}
    }}
    
    async function testMachine(name) {{
      addLog('Testing ' + name + '...');
      try {{
        const m = machines.find(x => x.name === name);
        const resp = await fetch('http://' + m.ip + ':' + m.port + '/health', {{
          signal: AbortSignal.timeout(5000)
        }});
        if (resp.ok) {{
          const data = await resp.json();
          addLog(name + ' healthy - Providers: ' + Object.keys(data.providers || {}).join(', '));
        }} else {{
          addLog(name + ' returned status ' + resp.status);
        }}
      }} catch (e) {{
        addLog(name + ' failed: ' + e.message);
      }}
    }}
    
    function saveConfig() {{
      try {{
        const newConfig = JSON.parse(document.getElementById('configEditor').value);
        fetch('/api/config', {{
          method: 'POST',
          headers: {{ 'Content-Type': 'application/json' }},
          body: JSON.stringify({{ machines: newConfig }})
        }}).then(() => {{
          machines = newConfig;
          addLog('Config saved and will scale with new machines');
        }});
      }} catch (e) {{
        addLog('Invalid JSON: ' + e.message);
      }}
    }}
    
    function addLog(msg) {{
      const logs = document.getElementById('logs');
      const entry = document.createElement('div');
      entry.textContent = new Date().toISOString() + ' - ' + msg;
      logs.insertBefore(entry, logs.firstChild);
    }}
    
    setInterval(refreshStatus, 10000);
    refreshStatus();
  </script>
</body>
</html>"""
    
    def run(self):
        logger.info(f"Starting dashboard on port {self.port}")
        web.run_app(self.app, host='0.0.0.0', port=self.port)

if __name__ == '__main__':
    port = int(os.environ.get('DASHBOARD_PORT', 8080))
    Dashboard(port=port).run()