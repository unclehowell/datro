#!/usr/bin/env python3
"""PirateClaw Sub-Proxy - Simplified Version"""
import os, json, logging
from pathlib import Path
from aiohttp import web
import aiohttp

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("pirateclaw-subproxy")

PROXY_PORT = int(os.getenv("PROXY_PORT", "5000"))
PARENT_PROXY = os.getenv("PARENT_PROXY", "https://pirateclaw.datro.xyz")

MACHINE_CONFIG = Path("/home/unclehowell/pirateclaw/subproxy/config/machine.json")

def load_config():
    return json.loads(MACHINE_CONFIG.read_text()) if MACHINE_CONFIG.exists() else {"machine_id": "unknown"}

async def proxy_handler(request):
    try:
        body = await request.json()
    except:
        return web.json_response({"error": "Invalid JSON"}, status=400)
    
    headers = {k: v for k, v in request.headers.items() if k != "Host"}
    
    try:
        async with request.app["session"].post(
            f"{PARENT_PROXY}/v1/chat/completions",
            json=body,
            headers=headers,
            timeout=aiohttp.ClientTimeout(total=30)
        ) as resp:
            result = await resp.json()
            return web.json_response(result)
    except Exception as e:
        logger.warning(f"Parent failed: {e}")
        return web.json_response({"error": "Parent proxy unavailable"}, status=503)

async def health_handler(request):
    return web.json_response({"status": "ok", "parent": PARENT_PROXY, "machine": load_config()})

async def init_session(app):
    app["session"] = aiohttp.ClientSession()

async def close_session(app):
    if app["session"]:
        await app["session"].close()

def create_app():
    app = web.Application()
    app.on_startup.append(init_session)
    app.on_cleanup.append(close_session)
    app.router.add_post("/v1/chat/completions", proxy_handler)
    app.router.add_get("/health", health_handler)
    app.router.add_get("/", health_handler)
    return app

if __name__ == "__main__":
    logger.info(f"PirateClaw sub-proxy on :{PROXY_PORT}")
    web.run_app(create_app(), host="0.0.0.0", port=PROXY_PORT)