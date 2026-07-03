#!/usr/bin/env python3
"""
FCUK Proxy Web GUI — Finance Cheque UK
Local dashboard at http://localhost:6001
Shows proxy status, peer list, and live stats.
"""
import asyncio
import json
import logging
import time
from pathlib import Path

try:
    from aiohttp import web, ClientSession, ClientTimeout
except ImportError:
    import subprocess, sys
    subprocess.check_call([sys.executable, "-m", "pip", "install", "aiohttp", "-q"])
    from aiohttp import web, ClientSession, ClientTimeout

log = logging.getLogger(__name__)
GUI_PORT   = 6001
PROXY_PORT = 6000

HTML = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>FCUK Proxy — Local Dashboard</title>
<style>
  :root { --accent: #e63946; --bg: #0a0a0a; --card: #111; --border: #222; --text: #f0f0f0; --muted: #666; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: var(--bg); color: var(--text); font-family: 'Courier New', monospace; min-height: 100vh; }
  header { border-bottom: 1px solid var(--border); padding: 1.5rem 2rem; display: flex; align-items: center; justify-content: space-between; }
  header h1 { font-size: 1.1rem; letter-spacing: 0.2em; text-transform: uppercase; }
  header h1 span { color: var(--accent); }
  .badge { background: var(--accent); color: #fff; font-size: 0.6rem; padding: 0.2rem 0.6rem; letter-spacing: 0.15em; text-transform: uppercase; border-radius: 2px; }
  .badge.offline { background: #333; color: var(--muted); }
  main { max-width: 1000px; margin: 0 auto; padding: 2rem; display: grid; gap: 1.5rem; }
  .card { background: var(--card); border: 1px solid var(--border); padding: 1.5rem; }
  .card h2 { font-size: 0.65rem; letter-spacing: 0.3em; text-transform: uppercase; color: var(--muted); margin-bottom: 1rem; }
  .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
  .grid4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
  .stat { background: var(--bg); border: 1px solid var(--border); padding: 1rem; }
  .stat .val { font-size: 2rem; font-weight: bold; color: var(--accent); }
  .stat .lbl { font-size: 0.6rem; letter-spacing: 0.2em; text-transform: uppercase; color: var(--muted); margin-top: 0.25rem; }
  .kv { display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid var(--border); font-size: 0.8rem; }
  .kv:last-child { border-bottom: none; }
  .kv .k { color: var(--muted); }
  .kv .v { font-weight: bold; word-break: break-all; text-align: right; max-width: 60%; }
  .peer { display: flex; align-items: center; gap: 1rem; padding: 0.75rem; background: var(--bg); border: 1px solid var(--border); margin-bottom: 0.5rem; font-size: 0.8rem; }
  .peer .dot { width: 8px; height: 8px; background: #22c55e; border-radius: 50%; flex-shrink: 0; }
  .peer .name { font-weight: bold; }
  .peer .addr { color: var(--muted); font-size: 0.7rem; }
  .no-peers { color: var(--muted); font-size: 0.8rem; padding: 1rem 0; }
  .cmd { background: var(--bg); border: 1px solid var(--border); padding: 1rem 1.5rem; font-size: 0.85rem; display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
  .cmd code { color: var(--accent); word-break: break-all; }
  .copy-btn { background: var(--border); border: none; color: var(--text); padding: 0.4rem 0.8rem; cursor: pointer; font-size: 0.65rem; letter-spacing: 0.1em; text-transform: uppercase; white-space: nowrap; }
  .copy-btn:hover { background: var(--accent); }
  footer { text-align: center; padding: 2rem; color: var(--muted); font-size: 0.7rem; letter-spacing: 0.1em; }
  a { color: var(--accent); text-decoration: none; }
  a:hover { text-decoration: underline; }
  #status-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #22c55e; margin-right: 0.5rem; animation: pulse 2s infinite; }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
</style>
</head>
<body>
<header>
  <h1><span>FCUK</span> Proxy — Local Dashboard</h1>
  <span id="online-badge" class="badge offline">Connecting...</span>
</header>
<main>
  <div class="grid4" id="stats-grid">
    <div class="stat"><div class="val" id="s-uptime">—</div><div class="lbl">Uptime</div></div>
    <div class="stat"><div class="val" id="s-peers">—</div><div class="lbl">Peers</div></div>
    <div class="stat"><div class="val" id="s-requests">—</div><div class="lbl">Requests</div></div>
    <div class="stat"><div class="val" id="s-errors">—</div><div class="lbl">Errors</div></div>
  </div>

  <div class="card">
    <h2>Machine Info</h2>
    <div id="machine-info"></div>
  </div>

  <div class="card">
    <h2>Peer Nodes</h2>
    <div id="peers-list"><div class="no-peers">Scanning for peers...</div></div>
  </div>

  <div class="card">
    <h2>Invite Another Machine</h2>
    <p style="font-size:0.8rem;color:var(--muted);margin-bottom:1rem;">Run this on any Linux/macOS machine to join the network:</p>
    <div class="cmd">
      <code>curl -fsSL https://www.financecheque.uk/fcukproxy/install.sh | sh</code>
      <button class="copy-btn" onclick="copy(this,'curl -fsSL https://www.financecheque.uk/fcukproxy/install.sh | sh')">Copy</button>
    </div>
  </div>

  <div class="card">
    <h2>Platform</h2>
    <p style="font-size:0.8rem;color:var(--muted);margin-bottom:1rem;">Manage your account, order leads, and exchange credits at:</p>
    <a href="https://financecheque.uk" target="_blank" style="font-size:1rem;font-weight:bold;">financecheque.uk ↗</a>
  </div>
</main>
<footer>FCUK Proxy v0.1.0 — <span id="machine-id-footer">—</span></footer>

<script>
function fmt(s) {
  if (s < 60) return s + 's';
  if (s < 3600) return Math.floor(s/60) + 'm ' + (s%60) + 's';
  return Math.floor(s/3600) + 'h ' + Math.floor((s%3600)/60) + 'm';
}
function copy(btn, text) {
  navigator.clipboard.writeText(text).then(() => {
    btn.textContent = 'Copied!';
    setTimeout(() => btn.textContent = 'Copy', 2000);
  });
}
async function refresh() {
  try {
    const r = await fetch('/proxy-status');
    if (!r.ok) throw new Error();
    const d = await r.json();
    document.getElementById('online-badge').textContent = 'Online';
    document.getElementById('online-badge').className = 'badge';
    document.getElementById('s-uptime').textContent = fmt(d.uptime_s);
    document.getElementById('s-peers').textContent = d.peers;
    document.getElementById('s-requests').textContent = d.stats.requests;
    document.getElementById('s-errors').textContent = d.stats.errors;
    document.getElementById('machine-id-footer').textContent = d.machine_id;
    document.getElementById('machine-info').innerHTML = [
      ['Machine ID', d.machine_id],
      ['Hostname',   d.machine_name],
      ['Local IP',   d.local_ip],
      ['Proxy Port', '6000'],
      ['GUI Port',   '6001'],
      ['Parent',     d.parent],
      ['Version',    d.version],
    ].map(([k,v]) => `<div class="kv"><span class="k">${k}</span><span class="v">${v}</span></div>`).join('');
    const pl = d.peer_list || [];
    document.getElementById('peers-list').innerHTML = pl.length
      ? pl.map(p => `<div class="peer"><div class="dot"></div><div><div class="name">${p.name}</div><div class="addr">${p.ip}:${p.port}</div></div></div>`).join('')
      : '<div class="no-peers">No peers discovered yet. Run the install script on another machine.</div>';
  } catch(e) {
    document.getElementById('online-badge').textContent = 'Proxy Offline';
    document.getElementById('online-badge').className = 'badge offline';
  }
}
refresh();
setInterval(refresh, 3000);
</script>
</body>
</html>
"""

async def handle_index(request: web.Request) -> web.Response:
    return web.Response(text=HTML, content_type="text/html")

async def handle_proxy_status(request: web.Request) -> web.Response:
    """Fetch status from the proxy agent and relay it."""
    try:
        timeout = ClientTimeout(total=3)
        async with ClientSession(timeout=timeout) as s:
            async with s.get(f"http://127.0.0.1:{PROXY_PORT}/status") as r:
                data = await r.json()
                return web.json_response(data)
    except Exception as e:
        return web.json_response({"error": str(e)}, status=503)

async def handle_health(request: web.Request) -> web.Response:
    return web.json_response({"status": "ok"})

async def main():
    logging.basicConfig(level=logging.INFO, format="%(asctime)s [FCUK-GUI] %(message)s")
    app = web.Application()
    app.router.add_get("/",              handle_index)
    app.router.add_get("/proxy-status",  handle_proxy_status)
    app.router.add_get("/health",        handle_health)

    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, "127.0.0.1", GUI_PORT)
    await site.start()
    log.info(f"FCUK Proxy GUI running at http://localhost:{GUI_PORT}")
    await asyncio.Event().wait()

if __name__ == "__main__":
    asyncio.run(main())
