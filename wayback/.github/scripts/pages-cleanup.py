#!/usr/bin/env python3
"""Purge old Cloudflare Pages deployments: keep only last 10 production-success, delete rest."""

import json, os, subprocess, sys

token = os.environ['CLOUDFLARE_API_TOKEN']
account = os.environ['CF_ACCOUNT_ID']
project = os.environ['CF_PROJECT']
auth = 'Authorization: Bearer ' + token
base = f'https://api.cloudflare.com/client/v4/accounts/{account}/pages/projects/{project}/deployments'

def cf_get(url):
    r = subprocess.run(['curl', '-s', '-H', auth, url], capture_output=True, text=True)
    return json.loads(r.stdout)

def cf_delete(url):
    r = subprocess.run(['curl', '-s', '-X', 'DELETE', '-H', auth, url], capture_output=True, text=True)
    return json.loads(r.stdout)

# Try wrangler JSON output first, fall back to direct API
deployments_file = '/tmp/deployments.json'

if os.path.exists(deployments_file):
    with open(deployments_file) as f:
        raw = json.load(f)
    if isinstance(raw, dict):
        if not raw.get('success'):
            print('API error:', json.dumps(raw.get('errors', [])))
            sys.exit(1)
        deploys = raw.get('result', [])
    else:
        deploys = raw
else:
    data = cf_get(base)
    if not data.get('success'):
        print('Failed to list deploys:', json.dumps(data.get('errors')))
        sys.exit(1)
    deploys = data.get('result', [])

deploys.sort(key=lambda d: d.get('created_on', ''), reverse=True)

prod_success = [d for d in deploys if d.get('environment') == 'production' and d.get('latest_stage', {}).get('status') == 'success']
others = [d for d in deploys if d.get('environment') != 'production' or d.get('latest_stage', {}).get('status') != 'success']

to_delete = [d['id'] for d in prod_success[10:]] + [d['id'] for d in others]
kept = len(prod_success[:10])

print(f'Total: {len(deploys)}, Prod success: {len(prod_success)} (keep {kept}), Delete: {len(to_delete)}')

if not to_delete:
    print('Nothing to delete')
    sys.exit(0)

for did in to_delete:
    result = cf_delete(f'{base}/{did}')
    ok = result.get('success', False)
    print(f'  [{"OK" if ok else "FAIL"}] {did}')

print(f'Done: deleted {len(to_delete)} deploys')
