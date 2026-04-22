#!/usr/bin/env python3
"""PirateClaw Dashboard - STP Topology View"""
import os
import asyncio
import aiohttp
from aiohttp import web

DASH_PORT = int(os.getenv("DASH_PORT", "8080"))
PROXY_PORT = int(os.getenv("PROXY_PORT", "6000"))
PARENT = os.getenv("PARENT_PROXY", "https://pirateclaw.datro.xyz")

async def get_proxy_status():
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(f"http://localhost:{PROXY_PORT}/status", timeout=3) as resp:
                if resp.status == 200:
                    return await resp.json()
    except:
        pass
    return None

async def status_handler(request):
    data = await get_proxy_status()
    return web.json_response({
        "service": "pirateclaw-dashboard",
        "version": "0.0.1.26",
        "stp_mode": True,
        "proxy_status": data,
        "ports": {"proxy": PROXY_PORT, "dashboard": DASH_PORT}
    })

async def topology_handler(request):
    data = await get_proxy_status()
    if data:
        return web.json_response({
            "topology": data,
            "chart": "stp"
        })
    return web.json_response({"error": "Proxy not reachable"}, status=503)

async def health_handler(request):
    return web.json_response({
        "status": "ok",
        "service": "pirateclaw-dashboard",
        "version": "0.0.1.26"
    })

app = web.Application()
app.router.add_get("/status", status_handler)
app.router.add_get("/topology", topology_handler)
app.router.add_get("/health", health_handler)
app.router.add_get("/", status_handler)

print(f"PirateClaw Dashboard on :{DASH_PORT}")
web.run_app(app, host="0.0.0.0", port=DASH_PORT, print=None)