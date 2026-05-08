#!/usr/bin/env python3
"""
FCUK Proxy Agent — Finance Cheque UK
Child proxy node. Receives lead generation tasks from the parent proxy
(financecheque.uk), routes LLM calls, and reports status.
Port: 6000
"""
import asyncio
import json
import logging
import os
import socket
import struct
import time
import uuid
from pathlib import Path

try:
    from aiohttp import web, ClientSession, ClientTimeout
except ImportError:
    import subprocess, sys
    subprocess.check_call([sys.executable, "-m", "pip", "install", "aiohttp", "-q"])
    from aiohttp import web, ClientSession, ClientTimeout

logging.basicConfig(level=logging.INFO, format="%(asctime)s [FCUK-PROXY] %(message)s")
log = logging.getLogger(__name__)

INSTALL_DIR = Path.home() / ".fcukproxy"
CONFIG_FILE = INSTALL_DIR / "machine.json"
PROXY_PORT  = 6000
MCAST_GRP   = "239.255.255.250"
MCAST_PORT  = 6002
PARENT_URL  = "https://financecheque.uk/api/proxy"
VERSION     = "0.1.0"

# ── Load config ────────────────────────────────────────────────────────────────
def load_config() -> dict:
    if CONFIG_FILE.exists():
        with open(CONFIG_FILE) as f:
            return json.load(f)
    cfg = {
        "machine_id":   str(uuid.uuid4()),
        "machine_name": socket.gethostname(),
        "local_ip":     "127.0.0.1",
        "proxy_port":   PROXY_PORT,
        "gui_port":     6001,
        "parent":       PARENT_URL,
        "version":      VERSION,
    }
    INSTALL_DIR.mkdir(parents=True, exist_ok=True)
    with open(CONFIG_FILE, "w") as f:
        json.dump(cfg, f, indent=2)
    return cfg

CONFIG = load_config()

# ── Peer registry ──────────────────────────────────────────────────────────────
peers: dict[str, dict] = {}   # machine_id → {ip, port, last_seen, latency_ms}
stats = {"requests": 0, "routed_to_parent": 0, "routed_to_peer": 0, "errors": 0}
start_time = time.time()

# ── Multicast peer discovery ───────────────────────────────────────────────────
async def bpdu_sender():
    """Broadcast our presence every 5 seconds."""
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM, socket.IPPROTO_UDP)
    sock.setsockopt(socket.IPPROTO_IP, socket.IP_MULTICAST_TTL, 2)
    payload = json.dumps({
        "machine_id":   CONFIG["machine_id"],
        "machine_name": CONFIG["machine_name"],
        "ip":           CONFIG["local_ip"],
        "port":         PROXY_PORT,
        "version":      VERSION,
    }).encode()
    while True:
        try:
            sock.sendto(payload, (MCAST_GRP, MCAST_PORT))
        except Exception:
            pass
        await asyncio.sleep(5)

async def bpdu_listener():
    """Listen for peer announcements."""
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM, socket.IPPROTO_UDP)
    sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    try:
        sock.bind(("", MCAST_PORT))
        mreq = struct.pack("4sL", socket.inet_aton(MCAST_GRP), socket.INADDR_ANY)
        sock.setsockopt(socket.IPPROTO_IP, socket.IP_ADD_MEMBERSHIP, mreq)
    except Exception as e:
        log.warning(f"Multicast listener failed: {e}")
        return
    sock.setblocking(False)
    loop = asyncio.get_event_loop()
    while True:
        try:
            data = await loop.sock_recv(sock, 1024)
            peer = json.loads(data)
            mid = peer.get("machine_id")
            if mid and mid != CONFIG["machine_id"]:
                peers[mid] = {**peer, "last_seen": time.time()}
        except Exception:
            pass
        await asyncio.sleep(0.1)

async def peer_reaper():
    """Remove peers not seen in 30 seconds."""
    while True:
        cutoff = time.time() - 30
        stale = [k for k, v in peers.items() if v["last_seen"] < cutoff]
        for k in stale:
            del peers[k]
        await asyncio.sleep(10)

# ── LLM routing ────────────────────────────────────────────────────────────────
async def route_llm(payload: dict) -> dict:
    """Try parent first, then peers, then return error."""
    stats["requests"] += 1
    timeout = ClientTimeout(total=30)

    # 1. Try parent
    try:
        async with ClientSession(timeout=timeout) as s:
            async with s.post(
                f"{CONFIG['parent']}/v1/chat/completions",
                json=payload,
                headers={"X-Machine-ID": CONFIG["machine_id"]},
            ) as r:
                if r.status == 200:
                    stats["routed_to_parent"] += 1
                    return await r.json()
    except Exception as e:
        log.debug(f"Parent unreachable: {e}")

    # 2. Try peers
    for mid, peer in list(peers.items()):
        try:
            async with ClientSession(timeout=ClientTimeout(total=10)) as s:
                async with s.post(
                    f"http://{peer['ip']}:{peer['port']}/v1/chat/completions",
                    json=payload,
                ) as r:
                    if r.status == 200:
                        stats["routed_to_peer"] += 1
                        return await r.json()
        except Exception:
            pass

    stats["errors"] += 1
    return {"error": "No available LLM endpoint", "choices": []}

# ── HTTP handlers ──────────────────────────────────────────────────────────────
async def handle_chat(request: web.Request) -> web.Response:
    try:
        payload = await request.json()
    except Exception:
        return web.json_response({"error": "Invalid JSON"}, status=400)
    result = await route_llm(payload)
    return web.json_response(result)

async def handle_status(request: web.Request) -> web.Response:
    return web.json_response({
        "machine_id":   CONFIG["machine_id"],
        "machine_name": CONFIG["machine_name"],
        "local_ip":     CONFIG["local_ip"],
        "version":      VERSION,
        "uptime_s":     int(time.time() - start_time),
        "peers":        len(peers),
        "peer_list":    [
            {"name": p["machine_name"], "ip": p["ip"], "port": p["port"]}
            for p in peers.values()
        ],
        "stats":        stats,
        "parent":       CONFIG["parent"],
    })

async def handle_health(request: web.Request) -> web.Response:
    return web.json_response({"status": "ok"})

# ── App ────────────────────────────────────────────────────────────────────────
async def main():
    app = web.Application()
    app.router.add_post("/v1/chat/completions", handle_chat)
    app.router.add_get("/status",  handle_status)
    app.router.add_get("/health",  handle_health)

    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, "0.0.0.0", PROXY_PORT)
    await site.start()
    log.info(f"FCUK Proxy running on port {PROXY_PORT}")
    log.info(f"Machine ID: {CONFIG['machine_id']}")
    log.info(f"Parent: {CONFIG['parent']}")

    await asyncio.gather(
        bpdu_sender(),
        bpdu_listener(),
        peer_reaper(),
    )

if __name__ == "__main__":
    asyncio.run(main())
