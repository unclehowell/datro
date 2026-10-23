#!/usr/bin/env python3
"""Deploy work/watch/worker/ as the Cloudflare Worker ghf-watch (watch.bucklerfamily.estate) through the connected
Cloudflare account: KV namespace, Worker, version (100%), cron trigger, custom domain. Each step is logged with its
undo in work/cf-rebalance/changes.json. Usage: timeout -k 5 900 python3 deploy.py "<message>" [--setup]   — Sion's Tab agent"""
import json, os, sys, base64, datetime as dt
sys.path.insert(0, '/home/user/tab/work/agent-ready')
import deploy as AR   # reuse its paced connected-apps caller
HERE = os.path.dirname(os.path.abspath(__file__)); W = os.path.join(HERE, 'worker')
ACCT, ZONE, CF = AR.ACCT, AR.ZONE, AR.CF
NAME = 'ghf-watch'; HOST = 'watch.bucklerfamily.estate'; CRON = '*/5 * * * *'
SP = os.path.join(HERE, 'state.json'); ST = json.load(open(SP)) if os.path.exists(SP) else {}
def save(): json.dump(ST, open(SP, 'w'), indent=1)
def call(method, path, body=None):
    req = {"toolkit": "cloudflare", "method": method, "url": CF + path}
    if body is not None: req["body"] = body
    r = AR.ca(req); res = r.get('result') or {}; b = res.get('body')
    if b is None and res.get('body_head'):
        try: b = json.loads(res['body_head'])
        except Exception: b = {'raw': res['body_head'][:500]}
    if isinstance(b, str):
        try: b = json.loads(b)
        except Exception: b = {'raw': b[:500]}
    return int(res.get('status') or 0), (b or {'raw': json.dumps(r)[:500]})
def log(what, rollback):
    P = '/home/user/tab/work/cf-rebalance/changes.json'; ch = json.load(open(P))
    ch.append({"at_utc": dt.datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ'), "by": "ghf-watch (work/watch/deploy.py)", "what": what, "rollback": rollback})
    json.dump(ch, open(P, 'w'), ensure_ascii=False, indent=1)
def setup():
    if not ST.get('kv_id'):
        s, b = call('POST', f'/accounts/{ACCT}/storage/kv/namespaces', {"title": "ghf-watch"})
        print('kv', s, json.dumps(b)[:300]); ST['kv_id'] = b['result']['id']; save()
        log(f"KV namespace ghf-watch created ({ST['kv_id']})", f"DELETE /accounts/{ACCT}/storage/kv/namespaces/{ST['kv_id']}")
    if not ST.get('worker_id'):
        s, b = call('POST', f'/accounts/{ACCT}/workers/workers', {"name": NAME, "subdomain": {"enabled": False}, "observability": {"enabled": True}})
        print('worker', s, json.dumps(b)[:300]); ST['worker_id'] = b['result']['id']; save()
        log(f"Worker {NAME} created ({ST['worker_id']})", f"DELETE /accounts/{ACCT}/workers/scripts/{NAME} (removes it, its cron and custom domain)")
def deploy(msg):
    def mod(name, ct): return {"name": name, "content_type": ct, "content_base64": base64.b64encode(open(os.path.join(W, name), 'rb').read()).decode()}
    b = {"compatibility_date": "2025-01-01", "main_module": "index.js",
         "modules": [mod('index.js', 'application/javascript+module'), mod('seed.txt', 'text/plain')],
         "bindings": [{"type": "kv_namespace", "name": "WATCH", "namespace_id": ST['kv_id']}], "annotations": {"workers/message": msg[:80]}}
    s, up = call('POST', f"/accounts/{ACCT}/workers/workers/{ST['worker_id']}/versions", b)
    if s not in (200, 201): print('version failed', s, json.dumps(up)[:1500]); sys.exit(1)
    vid = up['result']['id']
    s, dep = call('POST', f"/accounts/{ACCT}/workers/scripts/{NAME}/deployments", {"strategy": "percentage", "versions": [{"version_id": vid, "percentage": 100}], "annotations": {"workers/message": msg[:80]}})
    if s not in (200, 201): print('deploy failed', s, json.dumps(dep)[:1500]); sys.exit(1)
    prev = ST.get('version'); ST['previous'] = prev; ST['version'] = vid; save()
    log(f"{NAME}: version {vid} deployed 100% (deployment {dep['result']['id']}): {msg}", f"POST /accounts/{ACCT}/workers/scripts/{NAME}/deployments with version {prev}" if prev else f"DELETE /accounts/{ACCT}/workers/scripts/{NAME}")
    print(json.dumps({"version": vid, "previous": prev}))
def triggers():
    if not ST.get('cron'):
        s, b = call('PUT', f'/accounts/{ACCT}/workers/scripts/{NAME}/schedules', [{"cron": CRON}])
        print('cron', s, json.dumps(b)[:400])
        if s == 200: ST['cron'] = CRON; save(); log(f"{NAME}: cron trigger {CRON}", f"PUT /accounts/{ACCT}/workers/scripts/{NAME}/schedules body []")
    if not ST.get('domain_id'):
        s, b = call('PUT', f'/accounts/{ACCT}/workers/domains', {"hostname": HOST, "service": NAME, "zone_id": ZONE, "environment": "production"})
        print('domain', s, json.dumps(b)[:400])
        if s == 200: ST['domain_id'] = b['result']['id']; save(); log(f"{NAME}: custom domain {HOST} ({ST['domain_id']})", f"DELETE /accounts/{ACCT}/workers/domains/{ST['domain_id']} (also removes the DNS record)")
if __name__ == '__main__':
    if '--setup' in sys.argv: setup()
    deploy(sys.argv[1] if len(sys.argv) > 1 and not sys.argv[1].startswith('--') else 'ghf-watch update')
    if '--setup' in sys.argv: triggers()
