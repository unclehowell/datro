#!/usr/bin/env python3
"""PirateClaw Dashboard"""
from aiohttp import web
import aiohttp

DASH_PORT = int(__import__('os').getenv('DASH_PORT', '8080'))
PROXY_PORT = int(__import__('os').getenv('PROXY_PORT', '6000'))

async def status(req):
    try:
        async with aiohttp.ClientSession() as s:
            r = await s.get(f'http://localhost:{PROXY_PORT}/status', timeout=3)
            data = await r.json()
    except:
        data = None
    return web.json_response({'ok': True, 'proxy': data, 'version': '0.0.1.26'})

async def root(req):
    return web.FileResponse(__import__('pathlib').Path(__file__).parent / 'index.html')

app = web.Application()
app.router.add_get('/status', status)
app.router.add_get('/', root)
print(f'Dashboard on :{DASH_PORT}')
web.run_app(app, host='0.0.0.0', port=DASH_PORT, print=None)