#!/usr/bin/env python3
"""PirateClaw Dashboard"""
from aiohttp import web
import aiohttp
import json
from pathlib import Path
import os
import shutil

DASH_PORT = int(__import__('os').getenv('DASH_PORT', '8080'))
PROXY_PORT = int(__import__('os').getenv('PROXY_PORT', '6000'))
PARENT_PROXY = os.getenv('PARENT_PROXY', 'https://pirateclaw.datro.xyz')
ROOT = Path(__file__).resolve().parents[1]
VERSION_FILE = ROOT / 'version.json'

def get_version():
    try:
        return json.loads(VERSION_FILE.read_text(encoding='utf-8')).get('version', '0.0.1.29')
    except Exception:
        return '0.0.1.29'

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

async def network_health(req):
    status_code = 503
    proxy_data = {}
    try:
        status_code, proxy_data = await proxy_json('GET', '/status')
    except Exception as e:
        proxy_data = {'error': str(e)}

    def env_state(name):
        return {'name': name, 'configured': bool(os.getenv(name))}

    def cmd_state(name):
        return {'name': name, 'available': bool(shutil.which(name))}

    checks = {
        'parent_proxy': {'url': PARENT_PROXY, 'reachable': False},
        'local_proxy': {'url': f'http://127.0.0.1:{PROXY_PORT}/health', 'reachable': status_code == 200},
        'dashboard': {'url': f'http://127.0.0.1:{DASH_PORT}/status', 'reachable': True},
    }

    try:
        async with aiohttp.ClientSession() as s:
            async with s.get(f'{PARENT_PROXY}/health', timeout=5):
                checks['parent_proxy']['reachable'] = True
    except Exception:
        checks['parent_proxy']['reachable'] = False

    payload = {
        'version': get_version(),
        'parent': checks['parent_proxy'],
        'checks': checks,
        'machine': {
            'node_id': proxy_data.get('node_id'),
            'local_ip': proxy_data.get('local_ip'),
            'proxies': proxy_data.get('proxies', []),
        },
        'agents': [cmd_state('hermes'), cmd_state('archon'), cmd_state('kiro')],
        'ides': [cmd_state('code'), cmd_state('cursor'), cmd_state('windsurf')],
        'api_keys': [
            env_state('OPENAI_API_KEY'),
            env_state('ANTHROPIC_API_KEY'),
            env_state('OPENROUTER_API_KEY'),
            env_state('NOUS_API_KEY'),
            env_state('CLOUDFLARE_API_TOKEN'),
        ],
    }
    return web.json_response(payload)

app = web.Application()
app.router.add_get('/status', status)
app.router.add_get('/health', health)
app.router.add_get('/proxies', proxies)
app.router.add_post('/v1/chat/completions', chat)
app.router.add_get('/network-health', network_health)
app.router.add_get('/', root)
print(f'Dashboard on :{DASH_PORT}')
web.run_app(app, host='0.0.0.0', port=DASH_PORT, print=None)
