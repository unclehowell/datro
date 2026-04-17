/**
 * LLM Proxy — Cloudflare Worker
 * kiro.financecheque.uk
 *
 * Routing:
 *   1. Round-robin across sub-proxies on all 4 machines (Tailscale via cloudflared tunnels)
 *   2. Fallback to 3 direct API keys: GEMINI_API_KEY, GROQ_API_KEY, MISTRAL_API_KEY
 *
 * Routes:
 *   GET  /dashboard/          → dashboard HTML
 *   GET  /health              → health JSON
 *   GET  /api/status          → per-machine health JSON
 *   GET  /api/machines        → machine list
 *   POST /api/register        → machine self-registration (stores in KV)
 *   GET  /v1/models           → model list
 *   POST /v1/chat/completions → main LLM route
 *   GET  /install.sh          → install script
 */

// Known machines — updated via /api/register or KV
// Cloudflare cannot reach Tailscale IPs directly.
// Each machine must expose its subproxy via a cloudflared tunnel and register its public URL.
// Until registered, all traffic falls through to API key fallback.
const SEED_MACHINES = [];

const FALLBACK_PROVIDERS = [
  { name: "gemini",  url: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", model: "gemini-2.0-flash",          key: "GEMINI_API_KEY"  },
  { name: "groq",    url: "https://api.groq.com/openai/v1/chat/completions",                         model: "llama-3.3-70b-versatile",    key: "GROQ_API_KEY"    },
  { name: "mistral", url: "https://api.mistral.ai/v1/chat/completions",                              model: "mistral-small-latest",       key: "MISTRAL_API_KEY" },
];

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function json(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS, ...extra },
  });
}

function html(content, status = 200) {
  return new Response(content, {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8", ...CORS },
  });
}

async function fetchTimeout(url, opts, ms = 20000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...opts, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

async function getMachines(env) {
  if (env.MACHINES_KV) {
    try {
      const stored = await env.MACHINES_KV.get("machines", "json");
      if (stored && stored.length > 0) return stored;
    } catch (_) {}
  }
  return SEED_MACHINES;
}

async function checkMachineHealth(machine) {
  try {
    const resp = await fetchTimeout(`${machine.url}/health`, { method: "GET" }, 5000);
    if (resp.ok) {
      const data = await resp.json();
      return { ...machine, status: "healthy", cli_tools: data.cli_tools || {}, available_clis: data.available_clis || [] };
    }
  } catch (_) {}
  return { ...machine, status: "unhealthy", cli_tools: {}, available_clis: [] };
}

// Round-robin index stored in KV (best-effort, falls back to random)
async function getNextMachine(machines, env) {
  if (machines.length === 0) return null;
  let idx = 0;
  if (env.MACHINES_KV) {
    try {
      const stored = await env.MACHINES_KV.get("rr_index");
      idx = stored ? (parseInt(stored) + 1) % machines.length : 0;
      await env.MACHINES_KV.put("rr_index", String(idx));
    } catch (_) {
      idx = Math.floor(Math.random() * machines.length);
    }
  }
  return machines[idx];
}

async function trySubProxies(machines, body, authHeader) {
  if (machines.length === 0) return null;
  // Try round-robin starting from a random offset for load distribution
  const start = Math.floor(Math.random() * machines.length);
  for (let i = 0; i < machines.length; i++) {
    const m = machines[(start + i) % machines.length];
    try {
      const resp = await fetchTimeout(
        `${m.url}/v1/chat/completions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": authHeader || "Bearer llmproxy-cf" },
          body: JSON.stringify(body),
        },
        18000
      );
      if (resp.ok) {
        const result = await resp.json();
        return json(result, 200, { "X-Routed-To": m.name, "X-Machine": m.name });
      }
    } catch (_) {}
  }
  return null;
}

async function apiFallback(body, env) {
  for (const p of FALLBACK_PROVIDERS) {
    const key = env[p.key];
    if (!key) continue;
    const model = body.model && !["auto", "kiro", "default", ""].includes(body.model) ? body.model : p.model;
    try {
      const resp = await fetchTimeout(p.url, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
        body: JSON.stringify({ ...body, model }),
      });
      if (resp.ok) {
        const result = await resp.json();
        return json(result, 200, { "X-Routed-To": `${p.name}-api` });
      }
    } catch (_) {}
  }
  return json({ error: "All providers failed — no machines reachable and no API keys available" }, 503);
}

function dashboardHtml(machines) {
  const machinesJson = JSON.stringify(machines);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>LLM Proxy Dashboard</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#0f172a;color:#e2e8f0;min-height:100vh;padding:20px}
    h1{color:#38bdf8;margin-bottom:20px;font-size:1.5rem}
    .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;margin-bottom:24px}
    .card{background:#1e293b;border-radius:10px;padding:18px;border:1px solid #334155}
    .card h2{font-size:.85rem;color:#94a3b8;margin-bottom:8px;text-transform:uppercase;letter-spacing:.05em}
    .card .name{font-size:1.1rem;font-weight:600;margin-bottom:4px}
    .card .ip{font-size:.75rem;color:#64748b;margin-bottom:10px}
    .badge{display:inline-block;padding:3px 10px;border-radius:12px;font-size:.7rem;font-weight:700}
    .healthy{background:#22c55e;color:#fff}.degraded{background:#f59e0b;color:#fff}
    .unhealthy{background:#ef4444;color:#fff}.unknown{background:#64748b;color:#fff}
    .cli-list{margin-top:8px;font-size:.75rem;color:#94a3b8}
    .cli-item{display:inline-block;margin:2px 4px 2px 0;padding:2px 7px;border-radius:8px;background:#0f172a}
    .cli-ok{color:#4ade80}.cli-miss{color:#f87171}
    .stats{display:flex;gap:16px;margin-bottom:20px;flex-wrap:wrap}
    .stat{background:#1e293b;padding:14px 20px;border-radius:8px;min-width:100px}
    .stat-value{font-size:1.8rem;font-weight:700;color:#38bdf8}
    .stat-label{font-size:.7rem;color:#64748b;text-transform:uppercase}
    button{background:#3b82f6;color:#fff;border:none;padding:8px 16px;border-radius:6px;cursor:pointer;font-size:.8rem}
    button:hover{background:#2563eb}
    .refresh{float:right;margin-top:-40px}
    .ts{font-size:.7rem;color:#475569;margin-bottom:16px}
  </style>
</head>
<body>
  <h1>🤖 LLM Proxy — kiro.financecheque.uk</h1>
  <div class="ts" id="ts">Loading...</div>
  <div class="stats">
    <div class="stat"><div class="stat-value" id="total">-</div><div class="stat-label">Machines</div></div>
    <div class="stat"><div class="stat-value" id="healthy">-</div><div class="stat-label">Healthy</div></div>
    <div class="stat"><div class="stat-value" id="unhealthy">-</div><div class="stat-label">Unhealthy</div></div>
  </div>
  <button onclick="refresh()" style="margin-bottom:20px">↻ Refresh</button>
  <div class="grid" id="grid"></div>
  <script>
    async function refresh() {
      try {
        const r = await fetch('/api/status');
        const d = await r.json();
        document.getElementById('ts').textContent = 'Last updated: ' + new Date(d.timestamp).toLocaleString();
        const machines = d.machines || [];
        document.getElementById('total').textContent = machines.length;
        document.getElementById('healthy').textContent = machines.filter(m=>m.status==='healthy').length;
        document.getElementById('unhealthy').textContent = machines.filter(m=>m.status!=='healthy').length;
        const grid = document.getElementById('grid');
        grid.innerHTML = '';
        machines.forEach(m => {
          const clis = m.cli_tools || {};
          const cliHtml = Object.entries(clis).map(([name, info]) =>
            '<span class="cli-item ' + (info.installed ? 'cli-ok' : 'cli-miss') + '">' +
            (info.tmux_running ? '▶' : info.installed ? '○' : '✗') + ' ' + name + '</span>'
          ).join('');
          grid.innerHTML += '<div class="card">' +
            '<h2>' + (m.type||'machine') + '</h2>' +
            '<div class="name">' + m.name + '</div>' +
            '<div class="ip">' + (m.url||m.ip||'') + '</div>' +
            '<span class="badge ' + (m.status||'unknown') + '">' + (m.status||'unknown') + '</span>' +
            (cliHtml ? '<div class="cli-list">' + cliHtml + '</div>' : '') +
            '</div>';
        });
      } catch(e) {
        document.getElementById('ts').textContent = 'Error: ' + e.message;
      }
    }
    refresh();
    setInterval(refresh, 30000);
  </script>
</body>
</html>`;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS });
    }

    // Dashboard
    if (path === "/dashboard" || path === "/dashboard/" || path === "/") {
      const machines = await getMachines(env);
      return html(dashboardHtml(machines));
    }

    // Health
    if (path === "/health" || path === "/api/health") {
      const machines = await getMachines(env);
      return json({ status: "ok", machines: machines.length, timestamp: new Date().toISOString() });
    }

    // Per-machine status (used by dashboard)
    if (path === "/api/status") {
      const machines = await getMachines(env);
      const results = await Promise.all(machines.map(checkMachineHealth));
      return json({ timestamp: new Date().toISOString(), machines: results });
    }

    // Machine list
    if (path === "/api/machines") {
      return json({ machines: await getMachines(env) });
    }

    // Machine self-registration
    if (path === "/api/register" && request.method === "POST") {
      try {
        const data = await request.json();
        if (!data.name || !data.url) return json({ error: "name and url required" }, 400);
        if (env.MACHINES_KV) {
          const machines = await getMachines(env);
          const idx = machines.findIndex(m => m.name === data.name);
          if (idx >= 0) machines[idx] = data; else machines.push(data);
          await env.MACHINES_KV.put("machines", JSON.stringify(machines));
        }
        return json({ status: "registered", name: data.name });
      } catch (e) {
        return json({ error: e.message }, 400);
      }
    }

    // Models list
    if (path === "/v1/models") {
      return json({
        object: "list",
        data: [
          { id: "auto",   object: "model", owned_by: "llmproxy" },
          { id: "kiro",   object: "model", owned_by: "llmproxy" },
          { id: "kilo",   object: "model", owned_by: "llmproxy" },
          { id: "groq",   object: "model", owned_by: "llmproxy" },
          { id: "gemini", object: "model", owned_by: "llmproxy" },
          ...FALLBACK_PROVIDERS.map(p => ({ id: p.name, object: "model", owned_by: p.name })),
        ],
      });
    }

    // Install script
    if (path === "/install.sh") {
      const script = await fetch(
        "https://raw.githubusercontent.com/unclehowell/datro/llmproxy/static/llmproxy/install.sh"
      );
      return new Response(await script.text(), { headers: { "Content-Type": "text/plain", ...CORS } });
    }

    // LLM requests
    if (path.startsWith("/v1/")) {
      let body;
      try { body = await request.json(); } catch (_) { return json({ error: "Invalid JSON" }, 400); }

      const machines = await getMachines(env);
      if (machines.length > 0) {
        const result = await trySubProxies(machines, body, request.headers.get("Authorization"));
        if (result) return result;
      }

      return apiFallback(body, env);
    }

    return json({
      error: "Not found",
      routes: ["/dashboard/", "/health", "/api/status", "/api/machines", "/api/register", "/v1/chat/completions", "/v1/models", "/install.sh"],
    }, 404);
  },
};
