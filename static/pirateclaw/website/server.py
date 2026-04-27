#!/usr/bin/env python3
"""PirateClaw Dashboard"""
import os
import asyncio
from aiohttp import web
import aiohttp

DASH_PORT = int(os.getenv("DASH_PORT", "8080"))
PROXY_PORT = int(os.getenv("PROXY_PORT", "6000"))

async def get_proxy_status():
    try:
        async with aiohttp.ClientSession() as s:
            async with s.get(f'http://localhost:{PROXY_PORT}/status', timeout=3) as r:
                return await r.json()
    except:
        return None

async def status_handler(request):
    proxy_data = await get_proxy_status()
    return web.json_response({'ok': True, 'proxy': proxy_data, 'version': '0.0.1.39'})

async def health_handler(request):
    return web.json_response({'status': 'ok'})

async def root_handler(request):
    html_path = os.path.join(os.path.dirname(__file__), 'index.html')
    if os.path.exists(html_path):
        return web.FileResponse(html_path)
    return web.Response(text="Dashboard not found", status=404)

app = web.Application()
app.router.add_get('/status', status_handler)
app.router.add_get('/health', health_handler)
app.router.add_get('/', root_handler)

print(f'PirateClaw Dashboard on :{DASH_PORT}')
web.run_app(app, host='0.0.0.0', port=DASH_PORT, print=None)