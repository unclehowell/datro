#!/usr/bin/env python3
"""PirateClaw Dashboard"""
from aiohttp import web
import aiohttp
import json
from pathlib import Path

DASH_PORT = int(__import__('os').getenv('DASH_PORT', '8080'))
PROXY_PORT = int(__import__('os').getenv('PROXY_PORT', '6000'))
ROOT = Path(__file__).resolve().parents[1]
VERSION_FILE = ROOT / 'version.json'

def get_version():
    try:
        return json.loads(VERSION_FILE.read_text(encoding='utf-8')).get('version', '0.0.1.28')
    except Exception:
        return '0.0.1.28'

async def proxy_json(method, path, payload=None):
    async with aiohttp.ClientSession() as s:
        async with s.request(method, f'http://127.0.0.1:{PROXY_PORT}{path}', json=payload, timeout=8) as r:
            data = await r.json()
            return r.status, data

async def status(req):
    try:
        _, data = await proxy_json('GET', '/status')
        data['dashboard_version'] = get_version()
        data['version'] = data.get('version') or get_version()
        return web.json_response(data)
    except Exception as e:
        return web.json_response({'ok': False, 'error': str(e), 'version': get_version()}, status=503)

async def health(req):
    try:
        code, data = await proxy_json('GET', '/health')
        return web.json_response(data, status=code)
    except Exception as e:
        return web.json_response({'ok': False, 'error': str(e), 'version': get_version()}, status=503)

async def proxies(req):
    try:
        code, data = await proxy_json('GET', '/proxies')
        return web.json_response(data, status=code)
    except Exception as e:
        return web.json_response({'ok': False, 'error': str(e), 'version': get_version()}, status=503)

async def chat(req):
    try:
        payload = await req.json()
    except Exception:
        return web.json_response({'error': 'Invalid JSON'}, status=400)
    try:
        code, data = await proxy_json('POST', '/v1/chat/completions', payload)
        return web.json_response(data, status=code)
    except Exception as e:
        return web.json_response({'error': str(e), 'via': 'dashboard-proxy'}, status=503)

async def root(req):
    return web.FileResponse(Path(__file__).parent / 'index.html')

app = web.Application()
app.router.add_get('/status', status)
app.router.add_get('/health', health)
app.router.add_get('/proxies', proxies)
app.router.add_post('/v1/chat/completions', chat)
app.router.add_get('/', root)
print(f'Dashboard on :{DASH_PORT}')
web.run_app(app, host='0.0.0.0', port=DASH_PORT, print=None)
