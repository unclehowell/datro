#!/usr/bin/env python3
"""
PirateClaw Sub-Proxy Server
Forwards LLM requests to parent proxy with fallback to local LLM
"""
import os
import sys
import json
import asyncio
import logging
from pathlib import Path
from aiohttp import web
import yaml

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("pirateclaw-subproxy")

PROXY_PORT = int(os.getenv("PROXY_PORT", "5000"))
PARENT_PROXY = os.getenv("PARENT_PROXY", "https://pirateclaw.datro.xyz")
LOCAL_PROXY = "http://localhost:5001"
HERMES_BIN = os.getenv("HERMES_BIN_PATH", "")

MACHINE_CONFIG = Path(__file__).parent / "config" / "machine.json"
CONFIG_DIR = Path(__file__).parent / "config"
CONFIG_DIR.mkdir(exist_ok=True)


def load_config():
    if MACHINE_CONFIG.exists():
        return json.loads(MACHINE_CONFIG.read_text())
    return {"machine_id": "unknown"}


async def proxy_handler(request):
    """Handle LLM proxy requests with round-robin fallback"""
    try:
        body = await request.json()
    except json.JSONDecodeError:
        return web.json_response({"error": "Invalid JSON"}, status=400)

    headers = dict(request.headers)
    headers.pop("Host", None)

    machine_config = load_config()

    async def try_request(url, retries=2):
        for _ in range(retries):
            try:
                async with request.app["client_session"].post(
                    url,
                    json=body,
                    headers=headers,
                    timeout=web.Application["timeout"]
                ) as resp:
                    if resp.status == 200:
                        return await resp.json()
                    elif resp.status == 404:
                        return await resp.json()
            except Exception as e:
                logger.warning(f"Request to {url} failed: {e}")
                await asyncio.sleep(0.5)
        return None

    urls_to_try = [
        f"{PARENT_PROXY}/v1/chat/completions",
        f"{LOCAL_PROXY}/v1/chat/completions"
    ]

    for url in urls_to_try:
        result = await try_request(url)
        if result:
            return web.json_response(result)

    return web.json_response(
        {"error": "All proxies failed", "detail": "No LLM provider available"},
        status=503
    )


async def health_handler(request):
    """Health check endpoint"""
    return web.json_response({
        "status": "ok",
        "machine": load_config(),
        "parent": PARENT_PROXY,
        "local": LOCAL_PROXY
    })


async def local_llm_handler(request):
    """Local LLM endpoint using Hermes"""
    try:
        body = await request.json()
    except json.JSONDecodeError:
        return web.json_response({"error": "Invalid JSON"}, status=400)

    if not HERMES_BIN or not Path(HERMES_BIN).exists():
        return web.json_response(
            {"error": "Hermes not configured or not found"},
            status=503
        )

    try:
        proc = await asyncio.create_subprocess_exec(
            HERMES_BIN, "run", "--json",
            stdin=asyncio.subprocess.PIPE,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        stdout, stderr = await proc.communicate(
            input=json.dumps(body).encode(),
            timeout=120
        )
        if proc.returncode == 0:
            return web.json_response(json.loads(stdout))
        else:
            logger.error(f"Hermes error: {stderr.decode()}")
            return web.json_response({"error": "Hermes failed"}, status=500)
    except Exception as e:
        logger.error(f"Local LLM error: {e}")
        return web.json_response({"error": str(e)}, status=500)


def create_app():
    app = web.Application()
    app["client_session"] = None
    app["timeout"] = aiohttp.ClientTimeout(total=120)

    app.router.add_post("/v1/chat/completions", proxy_handler)
    app.router.add_post("/v1/chat/completions/local", local_llm_handler)
    app.router.add_get("/health", health_handler)
    app.router.add_get("/", health_handler)

    return app


def main():
    app = create_app()
    logger.info(f"Starting PirateClaw sub-proxy on port {PROXY_PORT}")
    logger.info(f"Parent proxy: {PARENT_PROXY}")
    logger.info(f"Local proxy: {LOCAL_PROXY}")
    web.run_app(app, host="0.0.0.0", port=PROXY_PORT)

if __name__ == "__main__":
    main()