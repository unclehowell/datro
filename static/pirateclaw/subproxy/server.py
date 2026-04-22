#!/usr/bin/env python3
"""PirateClaw Sub-Proxy"""
from aiohttp import web
import requests

PROXY_PORT = int(__import__('os').getenv('PROXY_PORT', '6000'))
PARENT = __import__('os').getenv('PARENT_PROXY', 'https://pirateclaw.datro.xyz')

async def health(req):
    return web.json_response({'status': 'ok', 'parent': PARENT, 'version': '0.0.1.25'})

async def proxy(req):
    try:
        body = await req.json()
        resp = requests.post(f"{PARENT}/v1/chat/completions", json=body, timeout=30)
        return web.json_response(resp.json())
    except Exception as e:
        return web.json_response({'error': f'Parent proxy failed: {e}'}, status=503)

app = web.Application()
app.router.add_get('/health', health)
app.router.add_get('/', health)
app.router.add_post('/v1/chat/completions', proxy)

print(f'PirateClaw proxy on :{PROXY_PORT}')
web.run_app(app, host='0.0.0.0', port=PROXY_PORT, print=None)