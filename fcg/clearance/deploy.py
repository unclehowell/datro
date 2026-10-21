#!/usr/bin/env python3
"""Deploy work/fcg/worker/ as a new version of the Cloudflare Worker fcg-wp (100%), through the
connected-apps proxy. Add-only: logs an undo row to work/cf-rebalance/changes.json.
Usage: python3 deploy.py "<message>"   — Sion's Tab agent"""
import json, os, sys, base64, subprocess, datetime as dt, tempfile
HERE=os.path.dirname(os.path.abspath(__file__)); W=os.path.join(HERE,'worker')
ACCT='42a4a8d7bfb96321118ada213638d050'; WID='cb95ee31d453438dbfd1788d2a961aa5'
API='https://api.cloudflare.com/client/v4/accounts/'+ACCT
def ca(req):
    import time as _t; req=dict(req); req['url']=req['url']+('&' if '?' in req['url'] else '?')+'_n=%d'%int(_t.time()*1000); req['query']={'_ts':str(_t.time())}; req['headers']={'X-Tab-Req':str(_t.time())}
    td='/home/user/tab/tasks/%s/rq'%os.environ['TAB_TASK_ID']; os.makedirs(td,exist_ok=True)
    f=tempfile.NamedTemporaryFile('w',suffix='.json',delete=False,dir=td); json.dump(req,f); f.close()
    try:
        for a in range(4):
            r=subprocess.run(['timeout','-k','5','170','/usr/bin/node','/home/user/tab/connected-apps-cli.mjs','connected_apps.request',f.name],capture_output=True,text=True)
            try: out=json.loads(r.stdout)
            except Exception: out={'ok':False,'raw':r.stdout[-500:]}
            if out.get('ok') or out.get('http_status') not in (502,503,504,None) or a==3: return out
            import time; time.sleep(8*(a+1))
        return out
    finally: os.unlink(f.name)
msg=sys.argv[1] if len(sys.argv)>1 else 'fcg clearance update'
LV=os.path.join(HERE,'last_version.txt')
cur=ca({"toolkit":"cloudflare","method":"GET","url":API+"/workers/scripts/fcg-wp/deployments"})
try: prev=cur['result']['body']['result']['deployments'][0]['versions'][0]['version_id']
except Exception:
    prev=open(LV).read().strip() if os.path.exists(LV) else 'unknown'; print('deployments read failed; previous from last_version.txt:',prev,str(cur)[:200])
def mod(name,ct):
    return {"name":name,"content_type":ct,"content_base64":base64.b64encode(open(os.path.join(W,name),'rb').read()).decode()}
mods=[mod('index.js','application/javascript+module'),mod('accountability.js','application/javascript+module'),mod('clearance.js','application/javascript+module'),
      mod('theme.css','text/plain'),mod('theme.js','text/plain'),mod('fonts/OFL.txt','text/plain')]
for fn in sorted(os.listdir(os.path.join(W,'fonts'))):
    if fn.endswith('.woff2'): mods.append(mod('fonts/'+fn,'application/octet-stream'))
body={"compatibility_date":"2025-01-01","compatibility_flags":["nodejs_compat"],"main_module":"index.js","modules":mods,
 "bindings":[{"type":"d1","name":"DB","id":"a15aedf1-a4d3-49fe-bd28-c2974c323b96"},{"type":"plain_text","name":"ENVIRONMENT","text":"production"},
  {"type":"plain_text","name":"SITE_TITLE","text":"FCG Edge CMS"},{"type":"plain_text","name":"WP_SOURCE_URL","text":"https://greathousefarmwiki.wordpress.com"}],
 "annotations":{"workers/message":(msg[:80]+" @"+dt.datetime.utcnow().strftime("%H%M%S"))}}
up=ca({"toolkit":"cloudflare","method":"POST","url":API+"/workers/workers/"+WID+"/versions","body":body})
try: vid=up['result']['body']['result']['id']
except Exception: print(json.dumps(up)[:2000]); sys.exit(1)
dep=ca({"toolkit":"cloudflare","method":"POST","url":API+"/workers/scripts/fcg-wp/deployments","body":{"strategy":"percentage","versions":[{"version_id":vid,"percentage":100}],"annotations":{"workers/message":(msg[:80]+" @"+dt.datetime.utcnow().strftime("%H%M%S"))}}})
try: did=dep['result']['body']['result']['id']
except Exception: print(json.dumps(dep)[:2000]); sys.exit(1)
P='/home/user/tab/work/cf-rebalance/changes.json'; ch=json.load(open(P))
ch.append({"at_utc":dt.datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ'),"by":"fcg clearance (work/fcg/deploy.py)","what":f"fcg-wp: version {vid} deployed 100% (deployment {did}): {msg}",
 "rollback":"POST /client/v4/accounts/%s/workers/scripts/fcg-wp/deployments {\"strategy\":\"percentage\",\"versions\":[{\"version_id\":\"%s\",\"percentage\":100}]}"%(ACCT,prev)})
json.dump(ch,open(P,'w'),ensure_ascii=False,indent=1)
open(LV,'w').write(vid+'\n')
print(json.dumps({"version":vid,"deployment":did,"previous":prev}))
