#!/usr/bin/env python3
"""
Local Dashboard Server
Shows health status, app store, and chat interface for LLM Proxy
"""

import os
import json
import asyncio
import logging
from datetime import datetime
from pathlib import Path
from aiohttp import web

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [dashboard] %(levelname)s: %(message)s",
    handlers=[logging.FileHandler("/tmp/dashboard.log"), logging.StreamHandler()],
)
logger = logging.getLogger(__name__)

CONFIG_FILE = Path(__file__).parent.parent / "subproxy" / "config" / "machines.json"
PROVIDERS_FILE = Path(__file__).parent.parent / "subproxy" / "config" / "providers.json"

class Dashboard:
    def __init__(self, port=8080):
        self.port = port
        self.app = web.Application()
        self.app.router.add_get("/", self.index)
        self.app.router.add_get("/health", self.health)
        self.app.router.add_get("/api/status", self.status)
        self.app.router.add_get("/api/machines", self.machines)
        self.app.router.add_post("/api/machines", self.update_machines)
        self.app.router.add_post("/api/uninstall", self.uninstall)

        self.machines = self.load_machines()
        self.providers = self.load_providers()
        self.status_cache = {}

    def load_machines(self):
        if CONFIG_FILE.exists():
            with open(CONFIG_FILE) as f:
                data = json.load(f)
                return data.get("machines", [])
        return [{"name": "local", "ip": "127.0.0.1", "port": 5000, "type": "laptop"}]

    def save_machines(self):
        CONFIG_FILE.parent.mkdir(parents=True, exist_ok=True)
        with open(CONFIG_FILE, "w") as f:
            json.dump({"machines": self.machines}, f, indent=2)

    def load_providers(self):
        if PROVIDERS_FILE.exists():
            with open(PROVIDERS_FILE) as f:
                return json.load(f)
        return {}

    async def index(self, request):
        return web.Response(text=self.dashboard_html(), content_type="text/html")

    async def health(self, request):
        return web.json_response(
            {"status": "ok", "dashboard": "running", "version": "1.0.2"}
        )

    async def status(self, request):
        await self.update_machine_status()
        return web.json_response(
            {
                "timestamp": datetime.utcnow().isoformat(),
                "machines": [
                    {
                        "name": m["name"],
                        "ip": m["ip"],
                        "port": m["port"],
                        "type": m.get("type", "unknown"),
                        "status": self.status_cache.get(m["name"], "unknown"),
                    }
                    for m in self.machines
                ],
            }
        )

    async def machines(self, request):
        return web.json_response({"machines": self.machines})

    async def update_machines(self, request):
        data = await request.json()
        self.machines = data.get("machines", self.machines)
        self.save_machines()
        return web.json_response({"status": "saved"})

    async def uninstall(self, request):
        import subprocess
        import shutil

        base_dir = Path(__file__).parent.parent

        try:
            subprocess.run(["pkill", "-f", "subproxy/server.py"], check=False)
            subprocess.run(["pkill", "-f", "dashboard/server.py"], check=False)

            if base_dir.exists():
                shutil.rmtree(base_dir)

            subprocess.run(
                ["crontab", "-l"], input="", stdin=subprocess.PIPE, check=False
            )

            return web.json_response(
                {
                    "success": True,
                    "message": "LLM Proxy uninstalled. Run the one-liner to reinstall.",
                }
            )
        except Exception as e:
            return web.json_response({"success": False, "error": str(e)})

    async def update_machine_status(self):
        tasks = [self.check_machine(m) for m in self.machines]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        for machine, result in zip(self.machines, results):
            if isinstance(result, Exception):
                self.status_cache[machine["name"]] = "unhealthy"
            else:
                self.status_cache[machine["name"]] = result.get("status", "unknown")

    async def check_machine(self, machine):
        try:
            import aiohttp

            async with aiohttp.ClientSession() as session:
                url = f"http://{machine['ip']}:{machine['port']}/health"
                async with session.get(
                    url, timeout=aiohttp.ClientTimeout(total=5)
                ) as resp:
                    if resp.status == 200:
                        return {"status": "healthy"}
                    return {"status": "degraded"}
        except:
            return {"status": "unhealthy"}

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
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #e2e8f0; min-height: 100vh; padding: 20px; }}
    h1 {{ color: #38bdf8; margin-bottom: 20px; }}
    h2 {{ color: #94a3b8; font-size: 14px; margin-bottom: 10px; }}
    .tabs {{ display: flex; gap: 10px; margin-bottom: 20px; }}
    .tab {{ padding: 10px 20px; border-radius: 8px; cursor: pointer; background: #1e293b; border: 1px solid #334155; }}
    .tab.active {{ background: #3b82f6; border-color: #3b82f6; }}
    .grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }}
    .card {{ background: #1e293b; border-radius: 12px; padding: 20px; border: 1px solid #334155; }}
    .status {{ display: inline-block; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }}
    .healthy {{ background: #22c55e; color: #fff; }}
    .degraded {{ background: #f59e0b; color: #fff; }}
    .unhealthy {{ background: #ef4444; color: #fff; }}
    .unknown {{ background: #64748b; color: #fff; }}
    button {{ background: #3b82f6; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; }}
    button:hover {{ background: #2563eb; }}
    button:disabled {{ background: #22c55e; cursor: default; }}
    .stats {{ display: flex; gap: 20px; margin-bottom: 20px; }}
    .stat {{ background: #1e293b; padding: 15px 25px; border-radius: 8px; }}
    .stat-value {{ font-size: 24px; font-weight: bold; color: #38bdf8; }}
    .stat-label {{ color: #64748b; font-size: 12px; }}
    .section {{ display: none; }}
    .section.active {{ display: block; }}
    .chat-container {{ background: #1e293b; border-radius: 12px; padding: 20px; height: 400px; display: flex; flex-direction: column; }}
    .chat-messages {{ flex: 1; overflow-y: auto; margin-bottom: 15px; }}
    .chat-message {{ padding: 10px 15px; border-radius: 8px; margin-bottom: 10px; max-width: 80%; }}
    .chat-message.user {{ background: #3b82f6; margin-left: auto; }}
    .chat-message.assistant {{ background: #334155; }}
    .chat-input {{ display: flex; gap: 10px; }}
    .chat-input input {{ flex: 1; background: #0f172a; color: #e2e8f0; border: 1px solid #334155; border-radius: 8px; padding: 12px; }}
    .chat-input button {{ padding: 12px 20px; }}
    .app-card {{ text-align: center; padding: 30px; }}
    .app-icon {{ font-size: 48px; margin-bottom: 15px; }}
    .app-name {{ margin-bottom: 5px; }}
    .app-type {{ color: #64748b; font-size: 12px; margin-bottom: 15px; }}
  </style>
</head>
<body>
  <h1>🤖 LLM Proxy Dashboard <span style="font-size:14px;color:#64748b;float:right;">v1.0.1</span></h1>
  
  <div class="tabs">
    <div class="tab active" onclick="showTab('chat')">💬 Chat</div>
    <div class="tab" onclick="showTab('apps')">⬇️ Apps</div>
    <div class="tab" onclick="showTab('status')">📊 Status</div>
    <div class="tab" onclick="uninstall()" style="margin-left:auto;background:#ef4444;">🗑️ Uninstall</div>
  </div>
  
  <div id="chat" class="section active">
    <div class="card">
      <h2>Chat with OpenCode</h2>
      <p style="color:#64748b;margin-bottom:15px;">Ask anything, OpenCode will use available LLMs</p>
      <div class="chat-container">
        <div class="chat-messages" id="chatMessages"></div>
        <div class="chat-input">
          <input type="text" id="chatInput" placeholder="Type your message..." onkeypress="if(event.key==='Enter')sendMessage()">
          <button onclick="sendMessage()">Send</button>
        </div>
      </div>
    </div>
  </div>
  
  <div id="apps" class="section">
    <div class="grid" id="appsGrid"></div>
  </div>
  
  <div id="status" class="section">
    <div class="stats">
      <div class="stat"><div class="stat-value" id="totalMachines">{len(self.machines)}</div><div class="stat-label">Machines</div></div>
      <div class="stat"><div class="stat-value" id="healthyCount">-</div><div class="stat-label">Healthy</div></div>
      <div class="stat"><div class="stat-value" id="unhealthyCount">-</div><div class="stat-label">Unhealthy</div></div>
    </div>
    <div class="grid" id="machinesGrid"></div>
  </div>
  
  <script>
    let chatHistory = [];
    
    function showTab(tab) {{
      document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.getElementById(tab).classList.add('active');
      event.target.classList.add('active');
      if(tab === 'apps') loadApps();
      if(tab === 'status') refreshStatus();
    }}
    
    async function loadApps() {{
      try {{
        const resp = await fetch('https://kiro.financecheque.uk/api/apps');
        const data = await resp.json();
        const grid = document.getElementById('appsGrid');
        grid.innerHTML = '';
        data.apps.forEach(app => {{
          const card = document.createElement('div');
          card.className = 'card app-card';
          card.innerHTML = `
            <div class="app-icon">${{app.icon}}</div>
            <h2 class="app-name">${{app.name}}</h2>
            <p class="app-type">${{app.type.toUpperCase()}}</p>
            <button onclick="handleAppClick('${{app.id}}', '${{app.oauth}}')" ${{app.installed ? 'disabled' : ''}}>
              ${{app.installed ? '✅ Installed' : '⬇️ Install'}}
            </button>
          `;
          grid.appendChild(card);
        }});
      }} catch(e) {{ console.error(e); }}
    }}
    
    function handleAppClick(appId, needsOAuth) {{
      if(appId === 'aws-builder') {{
        window.open('https://aws.amazon.com/builder/', '_blank');
        alert('After creating your AWS Builder ID, return here and click Install on Kiro');
      }} else if(appId === 'kiro' && needsOAuth === 'true') {{
        alert('AWS OAuth would open here. For now, install manually:\nnpm install -g @kiro-cli/kiro\n\nThen run: kiro login');
      }} else {{
        installApp(appId);
      }}
    }}
    
    async function installApp(appId) {{
      try {{
        const resp = await fetch('https://kiro.financecheque.uk/api/install-app', {{
          method: 'POST',
          headers: {{'Content-Type': 'application/json'}},
          body: JSON.stringify({{app: appId}})
        }});
        const result = await resp.json();
        if (result.success) {{
          alert('Run this in your terminal:\\n\\n' + result.command + '\\n\\nThen refresh.');
          loadApps();
        }}
      }} catch(e) {{ alert('Error: ' + e.message); }}
    }}
    
    async function sendMessage() {{
      const input = document.getElementById('chatInput');
      const msg = input.value.trim();
      if(!msg) return;
      
      addMessage('user', msg);
      input.value = '';
      
      try {{
        const resp = await fetch('http://localhost:5000/v1/chat/completions', {{
          method: 'POST',
          headers: {{'Content-Type': 'application/json'}},
          body: JSON.stringify({{
            model: 'opencode',
            messages: [...chatHistory, {{role: 'user', content: msg}}]
          }})
        }});
        const data = await resp.json();
        const reply = data.choices?.[0]?.message?.content || 'No response';
        addMessage('assistant', reply);
      }} catch(e) {{
        addMessage('assistant', 'Error: ' + e.message + '\\n\\nMake sure OpenCode is installed and running.');
      }}
    }}
    
    function addMessage(role, content) {{
      chatHistory.push({{role, content}});
      const div = document.getElementById('chatMessages');
      const msg = document.createElement('div');
      msg.className = 'chat-message ' + role;
      msg.textContent = content;
      div.appendChild(msg);
      div.scrollTop = div.scrollHeight;
    }}
    
    async function refreshStatus() {{
      try {{
        const resp = await fetch('/api/status');
        const data = await resp.json();
        const grid = document.getElementById('machinesGrid');
        grid.innerHTML = '';
        let healthy = 0, unhealthy = 0;
        data.machines.forEach(m => {{
          const sc = m.status || 'unknown';
          if (sc === 'healthy') healthy++;
          if (sc === 'unhealthy') unhealthy++;
          const card = document.createElement('div');
          card.className = 'card';
          card.innerHTML = '<h2>' + m.name + '</h2><p style="color:#64748b;font-size:12px;">' + m.ip + ':' + m.port + '</p><span class="status ' + sc + '">' + sc + '</span>';
          grid.appendChild(card);
        }});
        document.getElementById('healthyCount').textContent = healthy;
        document.getElementById('unhealthyCount').textContent = unhealthy;
      }} catch(e) {{ console.error(e); }}
    }}
    
    async function uninstall() {{
      if(!confirm('Are you sure you want to uninstall LLM Proxy? This will remove all files.')) return;
      try {{
        const resp = await fetch('/api/uninstall', {{ method: 'POST' }});
        const result = await resp.json();
        if(result.success) {{
          alert('LLM Proxy uninstalled. To reinstall, run:\ncurl -fsSL https://kiro.financecheque.uk/install.sh | sh');
          window.close();
        }}
      }} catch(e) {{ alert('Error: ' + e.message); }}
    }}
    
    setInterval(refreshStatus, 60000);
    refreshStatus();
  </script>
</body>
</html>"""

    def run(self):
        logger.info(f"Starting dashboard on port {self.port}")
        web.run_app(self.app, host="0.0.0.0", port=self.port)

if __name__ == "__main__":
    port = int(os.environ.get("DASHBOARD_PORT", 8080))
    Dashboard(port=port).run()
