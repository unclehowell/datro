#!/usr/bin/env python3
"""Attach a source link to every scored item in events.json: the message in the
case-mail archive (email.bucklerfamily.estate) and its wayback copy, found by the
item's search words `q` and the nearest message date. Paced; cached. — Sion's Tab agent"""
import json, os, subprocess, urllib.parse, time, datetime as dt, sys
HERE=os.path.dirname(os.path.abspath(__file__))
P=os.path.join(HERE,'events.json'); D=json.load(open(P))
REG='/home/user/tab/work/disclosure-escalation/dartboard-data.json'
reg=json.load(open(REG)) if os.path.exists(REG) else {'h':[],'y':{}}
cache={}
def search(q):
    if q in cache: return cache[q]
    u='https://email.bucklerfamily.estate/api/search?q='+urllib.parse.quote(q)
    for a in range(3):
        r=subprocess.run(['timeout','-k','5','25','curl','-s','-m','20',u],capture_output=True,text=True)
        try: cache[q]=json.loads(r.stdout).get('records',[]); break
        except Exception: time.sleep(2)
    else: cache[q]=[]
    time.sleep(0.4); return cache[q]
ALIAS={'wg':['cadw'],'vale':['vale-foi','vale-scrutiny'],'dwr-cymru':['dwrcymru'],'hmlr':['hmlr','hmlr-icr']}
def pick(q,date,direction,inst=None):
    rs=search(q); d0=dt.date.fromisoformat(date); best=None
    want=ALIAS.get(inst,[inst]) if inst else None
    for x in rs:
        if not x.get('date'): continue
        ids=[i.get('id') for i in (x.get('institutions') or [])]
        if want and not set(want)&set(ids): continue
        dd=abs((dt.date.fromisoformat(x['date'][:10])-d0).days)
        if dd>4: continue
        k=(dd, 0 if x.get('direction')==direction else 1)
        if best is None or k<best[0]: best=(k,x)
    return best[1] if best else None
def apply(item,x):
    item['link']='https://email.bucklerfamily.estate/thread/'+x['threadSlug'] if x.get('threadSlug') else None
    item['wayback']=x.get('sourceUrl'); item['msg_date']=x['date'][:10]; item['msg_subject']=x.get('subject','')[:160]
force='--all' in sys.argv; n=0; miss=[]
for e in D['events']:
    if e.get('link') and not force: continue
    for k in ('link','wayback','msg_date','msg_subject'): e.pop(k,None)
    x=pick(e['q'],e['date'],'received',e['inst'])
    if x: apply(e,x); n+=1
    elif e.get('reg') is not None and reg['y'].get(str(e['reg'])):
        e['link']=reg['y'][str(e['reg'])]; n+=1
    else: miss.append(e['id'])
for q in D['requests']:
    if q.get('link') and not force: continue
    for k in ('link','wayback','msg_date','msg_subject'): q.pop(k,None)
    x=pick(q['q'],q['received'],'sent',q['inst']) or (q.get('answered') and pick(q['q'],q['answered'],'received',q['inst']))
    if x: apply(q,x); n+=1
    else: miss.append(q['id'])
json.dump(D,open(P,'w'),ensure_ascii=False,indent=1)
print('linked',n,'unlinked',len(miss),miss)
