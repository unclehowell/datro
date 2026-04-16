#!/usr/bin/env python3
"""
Local Dashboard Server
Shows health status of all sub-proxies and the main proxy
With full onboarding flow
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
        self.app.router.add_get("/api/providers", self.providers)
        self.app.router.add_post("/api/providers", self.update_providers)
        self.app.router.add_post("/api/install-cli", self.install_cli)
        self.app.router.add_get("/api/onboarding", self.onboarding_status)
        self.app.router.add_post("/api/hermes", self.update_hermes)

        self.machines = self.load_machines()
        self.providers = self.load_providers()
        self.status_cache = {}

    def load_machines(self):
        if CONFIG_FILE.exists():
            with open(CONFIG_FILE) as f:
                data = json.load(f)
                return data.get("machines", [])
        return self.default_machines()

    def default_machines(self):
        return [
            {"name": "laptop", "ip": "127.0.0.1", "port": 5000, "type": "laptop"},
            {"name": "aws1", "ip": "100.64.1.2", "port": 5000, "type": "aws"},
            {"name": "aws2", "ip": "100.64.1.3", "port": 5000, "type": "aws"},
            {"name": "phone", "ip": "100.64.1.4", "port": 5000, "type": "phone"},
        ]

    def save_machines(self):
        CONFIG_FILE.parent.mkdir(parents=True, exist_ok=True)
        with open(CONFIG_FILE, "w") as f:
            json.dump({"machines": self.machines}, f, indent=2)

    def load_providers(self):
        if PROVIDERS_FILE.exists():
            with open(PROVIDERS_FILE) as f:
                return json.load(f)
        return {}

    def save_providers(self):
        PROVIDERS_FILE.parent.mkdir(parents=True, exist_ok=True)
        with open(PROVIDERS_FILE, "w") as f:
            json.dump(self.providers, f, indent=2)

    async def index(self, request):
        return web.Response(text=self.dashboard_html(), content_type="text/html")

    async def health(self, request):
        return web.json_response(
            {"status": "ok", "dashboard": "running", "version": "1.0.0"}
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
                        "last_seen": self.status_cache.get(f"{m['name']}_last", None),
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

    async def providers(self, request):
        return web.json_response(self.providers)

    async def update_providers(self, request):
        data = await request.json()
        self.providers = data
        self.save_providers()
        return web.json_response({"status": "saved"})

    async def install_cli(self, request):
        data = await request.json()
        cli_name = data.get("cli", "")

        try:
            proc = await asyncio.create_subprocess_exec(
                "npm",
                "install",
                "-g",
                cli_name,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            stdout, stderr = await proc.communicate()

            if proc.returncode == 0:
                return web.json_response(
                    {"success": True, "message": f"{cli_name} installed"}
                )
            return web.json_response({"success": False, "error": stderr.decode()})
        except Exception as e:
            return web.json_response({"success": False, "error": str(e)})

    async def onboarding_status(self, request):
        installed = {}
        for name, prov in self.providers.items():
            if prov.get("type") == "cli":
                try:
                    result = await asyncio.create_subprocess_exec(
                        "which", prov.get("command", ""), stdout=asyncio.subprocess.PIPE
                    )
                    installed[name] = result.returncode == 0
                except:
                    installed[name] = False

        available_providers = []
        for name, prov in self.providers.items():
            if prov.get("enabled"):
                api_key = os.environ.get(prov.get("api_key_env", ""), "")
                available_providers.append(
                    {
                        "name": name,
                        "type": prov.get("type"),
                        "free": prov.get("free", False),
                        "cli_installed": installed.get(name, False),
                        "api_key_configured": bool(api_key),
                    }
                )

        return web.json_response(
            {
                "machine": {"name": "local", "ip": "127.0.0.1"},
                "providers": available_providers,
                "ready": len(
                    [
                        p
                        for p in available_providers
                        if p.get("cli_installed") or p.get("api_key_configured")
                    ]
                )
                > 0,
            }
        )

    async def update_hermes(self, request):
        data = await request.json()
        hermes_file = (
            Path(__file__).parent.parent / "subproxy" / "config" / "hermes.json"
        )
        hermes_file.parent.mkdir(parents=True, exist_ok=True)
        with open(hermes_file, "w") as f:
            json.dump(data, f, indent=2)
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
                async with session.get(
                    url, timeout=aiohttp.ClientTimeout(total=5)
                ) as resp:
                    if resp.status == 200:
                        return {"status": "healthy", "data": await resp.json()}
                    return {"status": "degraded", "code": resp.status}
        except Exception as e:
            return {"status": "unhealthy", "error": str(e)}

    def dashboard_html(self):
        machines_json = json.dumps(self.machines)
        providers_json = json.dumps(self.providers)

        return (
            """<!DOCTYPE html>
<html>
<head>
  <title>LLM Proxy Dashboard</title>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0f172a; color: #e2e8f0; min-height: 100vh; padding: 20px;
    }
    h1 { color: #38bdf8; margin-bottom: 20px; }
    h2 { color: #94a3b8; font-size: 14px; margin-bottom: 10px; }
    .tabs { display: flex; gap: 10px; margin-bottom: 20px; }
    .tab { 
      padding: 10px 20px; border-radius: 8px; cursor: pointer;
      background: #1e293b; border: 1px solid #334155;
    }
    .tab.active { background: #3b82f6; border-color: #3b82f6; }
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
    button.secondary { background: #475569; }
    button.success { background: #22c55e; }
    button.danger { background: #ef4444; }
    .stats { display: flex; gap: 20px; margin-bottom: 20px; }
    .stat { background: #1e293b; padding: 15px 25px; border-radius: 8px; }
    .stat-value { font-size: 24px; font-weight: bold; color: #38bdf8; }
    .stat-label { color: #64748b; font-size: 12px; }
    textarea { width: 100%; background: #1e293b; color: #e2e8f0; border: 1px solid #334155; border-radius: 8px; padding: 15px; font-family: monospace; font-size: 12px; min-height: 200px; }
    .provider-row { display: flex; align-items: center; gap: 10px; padding: 10px; border-bottom: 1px solid #334155; }
    .provider-row:last-child { border-bottom: none; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 10px; }
    .badge-free { background: #22c55e; }
    .badge-paid { background: #f59e0b; }
    .badge-cli { background: #8b5cf6; }
    .badge-api { background: #06b6d4; }
    input { background: #1e293b; color: #e2e8f0; border: 1px solid #334155; border-radius: 6px; padding: 8px 12px; }
    .section { display: none; }
    .section.active { display: block; }
    .onboarding-banner { background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); padding: 20px; border-radius: 12px; margin-bottom: 20px; }
    .onboarding-banner h3 { color: #fff; margin-bottom: 10px; }
    .onboarding-banner p { color: #e2e8f0; font-size: 14px; }
  </style>
</head>
<body>
  <h1>🤖 LLM Proxy Dashboard</h1>
  
  <div class="onboarding-banner" id="onboardingBanner">
    <h3>🎉 Welcome to LLM Proxy!</h3>
    <p>Complete onboarding to configure your CLI tools and API keys.</p>
    <button onclick="showSection('onboarding')" style="margin-top:10px;">Start Onboarding</button>
  </div>
  
  <div class="tabs">
    <div class="tab active" onclick="showTab('status')">Status</div>
    <div class="tab" onclick="showTab('providers')">Providers</div>
    <div class="tab" onclick="showTab('machines')">Machines</div>
    <div class="tab" onclick="showTab('onboarding')">Onboarding</div>
    <div class="tab" onclick="showTab('config')">Config</div>
  </div>
  
  <div id="status" class="section active">
    <div class="stats">
      <div class="stat"><div class="stat-value" id="totalMachines">"""
            + str(len(self.machines))
            + """</div><div class="stat-label">Machines</div></div>
      <div class="stat"><div class="stat-value" id="healthyCount">-</div><div class="stat-label">Healthy</div></div>
      <div class="stat"><div class="stat-value" id="unhealthyCount">-</div><div class="stat-label">Unhealthy</div></div>
    </div>
    <div class="grid" id="machinesGrid"></div>
    <div class="card"><h2>Recent Activity</h2><div class="logs" id="logs"></div></div>
    <button onclick="refreshStatus()" style="margin-top:20px;">🔄 Refresh</button>
  </div>
  
  <div id="providers" class="section">
    <div class="card">
      <h2>LLM Providers</h2>
      <p style="color:#64748b;margin-bottom:15px;">Configure your CLI tools and API keys</p>
      <div id="providersList"></div>
    </div>
  </div>
  
  <div id="machines" class="section">
    <div class="card">
      <h2>Scalable Machine Registry</h2>
      <p style="color:#64748b;margin-bottom:15px;">Add or remove machines. The dashboard scales automatically.</p>
      <textarea id="machinesEditor">"""
            + machines_json
            + """</textarea>
      <button onclick="saveMachines()" style="margin-top:10px;">💾 Save Machines</button>
    </div>
  </div>
  
  <div id="onboarding" class="section">
    <div class="card">
      <h2>Onboarding - CLI & API Setup</h2>
      <div id="onboardingStatus"></div>
    </div>
    <div class="card" style="margin-top:20px;">
      <h2>Hermes Configuration</h2>
      <p style="color:#64748b;margin-bottom:15px;">Configure round-robin between Cloudflare proxy and local proxy</p>
      <textarea id="hermesConfig">{
  "default_llm": "financecheque-uk",
  "llm_endpoint": "https://kiro.financecheque.uk/v1/chat/completions/",
  "fallback_chain": [
    {"name": "cloudflare-proxy", "endpoint": "https://kiro.financecheque.uk/v1/chat/completions/", "priority": 1},
    {"name": "local-proxy", "endpoint": "http://localhost:5000/v1/chat/completions", "priority": 2}
  ],
  "round_robin": true
}</textarea>
      <button onclick="saveHermes()" style="margin-top:10px;">💾 Save Hermes Config</button>
    </div>
  </div>
  
  <div id="config" class="section">
    <div class="card">
      <h2>Raw Configuration</h2>
      <textarea id="configEditor">"""
            + providers_json
            + """</textarea>
      <button onclick="saveConfig()" style="margin-top:10px;">💾 Save Providers</button>
    </div>
  </div>
  
  <script>
    let machines = """
            + machines_json
            + """;
    let providers = """
            + providers_json
            + """;
    
    function showTab(tab) {
      document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.getElementById(tab).classList.add('active');
      event.target.classList.add('active');
    }
    
    function showSection(s) { showTab(s); }
    
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
          card.innerHTML = '<h2>' + m.name + ' <span class="badge" style="background:#334155">' + m.type + '</span></h2><p style="color:#64748b;font-size:12px;">' + m.ip + ':' + m.port + '</p><span class="status ' + sc + '">' + sc + '</span>';
          grid.appendChild(card);
        });
        document.getElementById('healthyCount').textContent = healthy;
        document.getElementById('unhealthyCount').textContent = unhealthy;
      } catch (e) { console.error(e); }
    }
    
    function renderProviders() {
      const list = document.getElementById('providersList');
      list.innerHTML = '';
      Object.entries(providers).forEach(([name, prov]) => {
        const div = document.createElement('div');
        div.className = 'provider-row';
        const badge = prov.type === 'cli' ? 'badge-cli' : 'badge-api';
        const freeBadge = prov.free ? '<span class="badge badge-free">FREE</span>' : '<span class="badge badge-paid">PAID</span>';
        div.innerHTML = '<span class="badge ' + badge + '">' + prov.type + '</span><strong>' + name + '</strong>' + freeBadge + '<input type="password" placeholder="API Key" id="key-' + name + '"><button class="success" onclick="saveApiKey(\'' + name + '\')">Save</button>';
        list.appendChild(div);
      });
    }
    
    async function saveApiKey(name) {
      const key = document.getElementById('key-' + name).value;
      addLog('Setting ' + name + ' API key...');
      localStorage.setItem('llmproxy_apikey_' + name, key);
      addLog(name + ' API key saved to localStorage (set env var for persistence)');
    }
    
    async function saveMachines() {
      try {
        const newConfig = JSON.parse(document.getElementById('machinesEditor').value);
        await fetch('/api/machines', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({machines:newConfig}) });
        machines = newConfig;
        addLog('Machines config saved');
      } catch(e) { addLog('Error: ' + e.message); }
    }
    
    async function saveConfig() {
      try {
        const newConfig = JSON.parse(document.getElementById('configEditor').value);
        await fetch('/api/providers', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(newConfig) });
        providers = newConfig;
        addLog('Providers config saved');
      } catch(e) { addLog('Error: ' + e.message); }
    }
    
    async function saveHermes() {
      try {
        const config = JSON.parse(document.getElementById('hermesConfig').value);
        await fetch('/api/hermes', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(config) });
        addLog('Hermes config saved');
      } catch(e) { addLog('Error: ' + e.message); }
    }
    
    async function loadOnboarding() {
      try {
        const resp = await fetch('/api/onboarding');
        const data = await resp.json();
        const div = document.getElementById('onboardingStatus');
        div.innerHTML = '<p>Machine: <strong>' + data.machine.name + '</strong></p>';
        data.providers.forEach(p => {
          const status = p.cli_installed ? '✅ Installed' : (p.api_key_configured ? '✅ Key configured' : '❌ Not ready');
          div.innerHTML += '<p><span class="badge ' + (p.type === 'cli' ? 'badge-cli' : 'badge-api') + '">' + p.type + '</span> ' + p.name + ' (' + (p.free ? 'FREE' : 'PAID') + '): ' + status + '</p>';
        });
        if (data.ready) document.getElementById('onboardingBanner').style.display = 'none';
      } catch(e) { console.error(e); }
    }
    
    function addLog(msg) {
      const logs = document.getElementById('logs');
      const entry = document.createElement('div');
      entry.textContent = new Date().toISOString() + ' - ' + msg;
      logs.insertBefore(entry, logs.firstChild);
    }
    
    setInterval(refreshStatus, 10000);
    refreshStatus();
    renderProviders();
    loadOnboarding();
  </script>
</body>
</html>"""
        )

    def run(self):
        logger.info(f"Starting dashboard on port {self.port}")
        web.run_app(self.app, host="0.0.0.0", port=self.port)


if __name__ == "__main__":
    port = int(os.environ.get("DASHBOARD_PORT", 8080))
    Dashboard(port=port).run()
