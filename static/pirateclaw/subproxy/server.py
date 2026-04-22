#!/usr/bin/env python3
"""PirateClaw Sub-Proxy - Using sync requests"""
import os
from aiohttp import web
import requests

PROXY_PORT = int(os.getenv("PROXY_PORT", "5000"))
PARENT = os.getenv("PARENT_PROXY", "https://pirateclaw.datro.xyz")

async def proxy_handler(request):
    body = await request.json()
    try:
        resp = requests.post(
            f"{PARENT}/v1/chat/completions",
            json=body,
            timeout=15
        )
        return web.json_response(resp.json())
    except Exception as e:
        return web.json_response({"error": str(e)}, status=503)

async def health_handler(request):
    return web.json_response({"status": "ok", "parent": PARENT})

app = web.Application()
app.router.add_post("/v1/chat/completions", proxy_handler)
app.router.add_get("/health", health_handler)
app.router.add_get("/", health_handler)

print(f"PirateClaw proxy on :{PROXY_PORT}")
web.run_app(app, host="0.0.0.0", port=PROXY_PORT, print=None, shutdown_timeout=1)