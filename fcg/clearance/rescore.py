#!/usr/bin/env python3
"""FCG clearance scorer. Reads work/fcg/events.json (curated record) and writes
work/fcg/scores.json. Deterministic: same record + same date = same scores.
Usage: python3 rescore.py [--today YYYY-MM-DD]
— Sion's Tab agent"""
import json, sys, os, datetime as dt, calendar
HERE=os.path.dirname(os.path.abspath(__file__))
D=json.load(open(os.path.join(HERE,'events.json')))
today=dt.date.today()
if '--today' in sys.argv: today=dt.date.fromisoformat(sys.argv[sys.argv.index('--today')+1])
BH={dt.date.fromisoformat(x) for x in D['bank_holidays']}
R=D['rules']
def wd(d): return d.weekday()<5 and d not in BH
def add_wd(d,n):
    # day 1 = first working day after receipt (ICO/FOIA s.10 practice)
    while n>0:
        d+=dt.timedelta(days=1)
        if wd(d): n-=1
    return d
def wd_between(a,b):  # working days after a up to and including b
    n=0; d=a
    while d<b:
        d+=dt.timedelta(days=1)
        if wd(d): n+=1
    return n
def add_month(d):
    y,m=(d.year+1,1) if d.month==12 else (d.year,d.month+1)
    return dt.date(y,m,min(d.day,calendar.monthrange(y,m)[1]))
def due_of(q):
    rec=dt.date.fromisoformat(q['received'])
    p=D['clocks'][q['regime']]
    return add_month(rec) if p=='1m' else add_wd(rec,p), p
def fmt(d): return d.strftime('%-d %b %Y')
lines={i['id']:[] for i in D['institutions']}
reqview={i['id']:[] for i in D['institutions']}
for q in D['requests']:
    due,p=due_of(q); rec=dt.date.fromisoformat(q['received'])
    ans=dt.date.fromisoformat(q['answered']) if q.get('answered') else None
    base=dict(req=q['id'],ref=q['ref'],link=q.get('link'),wayback=q.get('wayback'),ambiguous=q.get('ambiguous',False))
    st='open'
    if q['regime']=='LETTER':
        if ans: st='answered'
        elif today>due:
            st='unanswered'
            lines[q['inst']].append(dict(base,date=due.isoformat(),rule='UNANSWERED_LETTER',pts=R['UNANSWERED_LETTER']['pts'],
              text=f"{q['ref']}: {q['text']}. No reply by {fmt(due)} (20 working days)."))
    else:
        if ans and ans<=due:
            st='on time'
            lines[q['inst']].append(dict(base,date=ans.isoformat(),rule='ON_TIME',pts=R['ON_TIME']['pts'],
              text=f"{q['ref']}: replied {fmt(ans)}, deadline {fmt(due)}."))
            span=(wd_between(rec,ans), p if p!='1m' else 20)
            if p!='1m' and span[0]<=p//2:
                lines[q['inst']].append(dict(base,date=ans.isoformat(),rule='PROMPT',pts=R['PROMPT']['pts'],
                  text=f"{q['ref']}: replied in {span[0]} working day{'s' if span[0]!=1 else ''} of {p}."))
        elif q.get('paused') and not ans:
            st='clock paused'
        else:
            end=ans or today
            if end>due:
                late=wd_between(due,end)
                pts=max(R['OVERDUE']['pts']*late,R['OVERDUE']['cap'])
                st=('late' if ans else 'overdue')
                lines[q['inst']].append(dict(base,date=(ans or due).isoformat(),rule='OVERDUE',pts=pts,
                  text=(f"{q['ref']}: replied {fmt(ans)}, {late} working day{'s' if late!=1 else ''} after the {fmt(due)} deadline." if ans else
                        f"{q['ref']}: no reply; deadline {fmt(due)}; {late} working day{'s' if late!=1 else ''} overdue at {fmt(today)}.")))
            else:
                st='within deadline'
    reqview[q['inst']].append(dict(id=q['id'],ref=q['ref'],regime=q['regime'],received=q['received'],due=due.isoformat(),
        answered=q.get('answered'),status=st,text=q['text'],link=q.get('link'),wayback=q.get('wayback'),ambiguous=q.get('ambiguous',False)))
for e in D['events']:
    lines[e['inst']].append(dict(id=e['id'],date=e['date'],rule=e['rule'],pts=R[e['rule']]['pts'],text=e['text'],ref=e.get('ref'),
        ev=e.get('ev'),link=e.get('link'),wayback=e.get('wayback')))
out=[]
for i in D['institutions']:
    L=sorted(lines[i['id']],key=lambda x:x['date'])
    # per-institution caps
    for rk,rv in R.items():
        if 'body_cap' in rv:
            tot=0
            for x in L:
                if x['rule']==rk:
                    room=rv['body_cap']-tot
                    x['pts']=max(x['pts'],room) if room<0 else 0
                    if x['pts']==0: x['note']='cap reached (max %d per institution)'%rv['body_cap']
                    tot+=x['pts']
    s=D['start']; 
    for x in L: s+=x['pts']; x['running']=s
    score=max(D['min'],min(D['max'],s))
    band=next(b for t,b in D['bands'] if score>=t)
    icons={}
    for x in L:
        if x['pts']<0: icons[R[x['rule']]['icon']]=icons.get(R[x['rule']]['icon'],0)+1
    # 10/10 reply: a request answered on time, within half the period, with no deduction on the same request or same day
    tens=[]
    for q in reqview[i['id']]:
        if q['status']!='on time': continue
        rl=[x for x in L if x.get('req')==q['id']]
        if not any(x['rule']=='PROMPT' for x in rl): continue
        neg=[x for x in L if x['pts']<0 and (x.get('req')==q['id'] or x['date']==q['answered'])]
        full=[x for x in L if x['rule']=='FULL' and x['date']==q['answered']]
        if not neg and full: tens.append(q['ref'])
    out.append(dict(id=i['id'],name=i['name'],forensic=i['forensic'],score=score,band=band,
        plus=sum(x['pts'] for x in L if x['pts']>0),minus=sum(x['pts'] for x in L if x['pts']<0),
        icons=icons,ten_out_of_ten=tens,ledger=L,requests=reqview[i['id']]))
out.sort(key=lambda x:(-x['score'],x['name']))
for n,x in enumerate(out,1): x['rank']=n
res=dict(version=D['version'],scored_on=today.isoformat(),start=D['start'],bands=D['bands'],rules=R,institutions=out)
json.dump(res,open(os.path.join(HERE,'scores.json'),'w'),ensure_ascii=False,indent=1)
for x in out: print(f"{x['rank']:>2} {x['score']:>4} {x['band']:<15} {x['name']}  {''.join(k*v for k,v in x['icons'].items())}")
