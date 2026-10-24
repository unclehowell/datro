#!/usr/bin/env python3
"""Build the first-seen baseline register.csv for the case institutions. Read-only. — Sion's Tab agent
Inputs: internetarchive/branch/sources.csv (read-only), dartboard disclosure-record.json, foi-deadlines/deadlines.csv,
Internet Archive CDX (earliest 200 capture per URL). Output: work/first-seen/register.csv (+ cdx_cache.json)."""
import csv, json, os, re, subprocess, time, datetime as dt
from urllib.parse import urlparse, quote
FS='/home/user/tab/work/first-seen'; W='/home/user/tab/work'
TODAY=dt.date.today().isoformat()
INST=[  # (institution, host/path regex)
 ('HM Land Registry', r'landregistry|land-registry|search-property-information|eservices\.landregistry'),
 ('The National Archives (Discovery)', r'nationalarchives\.gov\.uk'),
 ('National Library of Wales', r'library\.wales|llgc\.org\.uk'),
 ('Glamorgan Archives', r'glamarchives\.gov\.uk|glamorgan\.epexio\.com'),
 ('Cardiff Libraries', r'cardiff\.gov\.uk/.*librar|cardiffcouncillibraries|cardiff\.spydus|cardifflibraries'),
 ('Cadw / Welsh Government', r'cadw\.gov\.wales|cadwpublic-api|(^|\.)gov\.wales|llyw\.cymru|datamap\.gov\.wales'),
 ('RCAHMW / Coflein', r'coflein\.gov\.uk|rcahmw\.gov\.uk'),
 ('Heneb HER / Archwilio (formerly GGAT)', r'archwilio\.org\.uk|heneb\.org\.uk|ggat\.org\.uk|walesher1974\.org'),
 ('Vale of Glamorgan Council', r'valeofglamorgan\.gov\.uk|vogonline|vale-of-glamorgan'),
 ('Cardiff Council', r'cardiff\.gov\.uk'),
 ('South Wales Police', r'south-wales\.police\.uk|southwales\.police'),
 ('Ministry of Defence', r'ministry-of-defence|\.mod\.uk|defence'),
 ('BP Archive', r'(^|\.)bp\.com|bparchive'),
 ('Historic England', r'historicengland\.org\.uk'),
 ('Dwr Cymru Welsh Water', r'dwrcymru'),
 ('Amgueddfa Cymru - Museum Wales', r'museum\.wales'),
 ('Archaeology Data Service', r'archaeologydataservice'),
 ('Llandough Community Council', r'llandough-cc'),
]
SKIP=r'youtube|youtu\.be|facebook|fb\.me|instagram|wikipedia|wikimedia|legislation\.gov\.uk|echr|twitter|x\.com|tiktok|google\.|bucklerfamily|wordpress\.com|github'
def inst_of(url):
    u=url.lower()
    if 'whatdotheyknow' in u: return 'WhatDoTheyKnow (published request)'
    if re.search(r'gov\.uk/government/organisations/land-registry',u): return 'HM Land Registry'
    for name,rx in INST:
        if re.search(rx,u): return name
    return None
REG_ALIAS={'HM Land Registry':['HM Land Registry','HM Land Registry (Independent Complaints Reviewer)'],
 'The National Archives (Discovery)':['The National Archives'],'National Library of Wales':['National Library of Wales'],
 'Glamorgan Archives':['Glamorgan Archives'],'Cardiff Libraries':['Cardiff Libraries','Cardiff Council'],
 'Cadw / Welsh Government':['Welsh Government / Cadw'],'RCAHMW / Coflein':['RCAHMW (Royal Commission)'],
 'Heneb HER / Archwilio (formerly GGAT)':['Heneb (formerly GGAT) / Historic Environment Record'],
 'Vale of Glamorgan Council':['Vale of Glamorgan Council','Vale of Glamorgan Council (Scrutiny)'],'Cardiff Council':['Cardiff Council'],
 'South Wales Police':['South Wales Police'],'Ministry of Defence':['Ministry of Defence'],'BP Archive':['BP'],
 'Historic England':['Historic England'],'Dwr Cymru Welsh Water':['Dwr Cymru Welsh Water'],
 'Amgueddfa Cymru - Museum Wales':['Amgueddfa Cymru - Museum Wales'],'Archaeology Data Service':['Archaeology Data Service'],
 'Llandough Community Council':['Llandough Community Council']}
def enquiry_map():
    d=json.load(open(FS+'/disclosure-record.json')); m={}
    for ins in d['institutions']:
        ds=sorted({c['fr'] for c in ins['convs'] if c.get('fr')}); 
        m[ins['name']]={'first':ds[0] if ds else '','n':len(ins['convs']),'dates':ds}
    return m
EM=enquiry_map()
def enquiry_for(inst):
    out=[]
    for a in REG_ALIAS.get(inst,[]):
        if a in EM and EM[a]['first']:
            ds=EM[a]['dates']; out.append(f"{a}: first request {ds[0]}; {EM[a]['n']} threads; latest request {ds[-1]}")
    return ' | '.join(out) or 'no request in the disclosure register'
_fails=[0]
CC=FS+'/cdx_cache.json'; cache=json.load(open(CC)) if os.path.exists(CC) else {}
def cdx(url):
    if url in cache: return cache[url]
    q='https://web.archive.org/cdx/search/cdx?url='+quote(url,safe='')+'&output=json&fl=timestamp,statuscode&filter=statuscode:200&limit=-1'
    first=None; n=None; err=''
    if _fails[0]>=5: return {'first':'','last':'','err':'cdx unavailable','queried':dt.datetime.utcnow().strftime('%Y-%m-%dT%H:%MZ')}
    for attempt in range(2):
        r=subprocess.run(['timeout','-k','5','60','curl','-4','-s','-m','55',q.replace('&limit=-1','&limit=1')],capture_output=True,text=True)
        try:
            if not r.stdout.strip(): raise ValueError('empty')
            j=json.loads(r.stdout); first=j[1][0] if len(j)>1 else ''; err=''; break
        except Exception: err='cdx unavailable'; time.sleep(3)
    last=''  # one CDX call per URL (keeps the load on the index low)
    _fails[0]=_fails[0]+1 if err else 0
    res={'first':first,'last':last,'err':err,'queried':dt.datetime.utcnow().strftime('%Y-%m-%dT%H:%MZ')}
    if not err:
        cache[url]=res
        try: json.dump(dict(cache),open(CC,'w'))
        except Exception: pass
    time.sleep(1.5); return res
def fmt(ts):
    return f'{ts[:4]}-{ts[4:6]}-{ts[6:8]}' if ts else ''
src=list(csv.DictReader(open(W+'/internetarchive/branch/sources.csv')))
cands=[]
for r in src:
    u=r['url'].replace('&gt','').strip()
    if r['status'].startswith('not relevant') or re.search(SKIP,u.lower()): continue
    ins=inst_of(u)
    if not ins: continue
    cands.append((ins,u,r))
cands.sort(key=lambda x:(x[0],x[1]))
print('candidates',len(cands),flush=True)
from concurrent.futures import ThreadPoolExecutor
import threading
_lk=threading.Lock()
_orig_cdx=cdx
def _pre(u):
    if u in cache: return
    _orig_cdx(u)
todo=[u for _,u,_ in cands if u not in cache]
print('cdx to fetch',len(todo),flush=True)
with ThreadPoolExecutor(2) as ex:
    for i,_ in enumerate(ex.map(_pre,todo)):
        if i%50==0: print('cdx',i,flush=True)
OUT=FS+'/register.csv'
cols=['item','institution','url','first_seen_online','absent_evidence','enquiry_dates','source']
# Manual, evidenced items first
manual=[]
her_enq='Heneb (formerly GGAT) / Historic Environment Record: first request 2026-05-22; HER source-file request 2026-09-08; 48-item schedule 2026-09-19'
for doc,title,cd in [('301368873','HER GGAT02038s source PDF 02038s_70255: RCAHMW/NMR record card, Great House Farm (copy of Suggett 1988), 5 pp','2026-09-16T15:40Z'),
                     ('301368874','HER GGAT02038s source PDF 02038s_70256: South Glamorgan SMR record card, site 2038, 1 p','2026-09-16T15:29Z'),
                     ('301368875','HER GGAT02038s source PDF 02038s_70257: South Wales Echo, 11 Feb 1989, "Battle of the rubble", 1 p','2026-09-16T15:36Z')]:
    manual.append({'item':title,'institution':'Heneb HER / Archwilio (formerly GGAT)',
     'url':f'https://www.walesher1974.org/her/app/php/herumd.php?group=GGAT&level=3&docid={doc}',
     'first_seen_online':'2026-10-06 (Internet Archive capture 20261006195117 of the GGAT02038s record page lists the PDF; file metadata: scanned '+cd+', finalised 2026-10-05T11:47Z; HER email 2026-10-06 08:03Z: "Following its digitisation, it is now freely available online")',
     'absent_evidence':'Record text as accessed 2026-05-29 (our copy, text only) lists 4 sources and no PDF, "Last updated 13-10-2023"; no Internet Archive capture of the record page or of this file before 2026-10-06',
     'enquiry_dates':her_enq,'source':'work/first-seen/her_mail/; work/ghf-flywheel/artifacts/wiki_reread_1018/heneb/'+doc+'.pdf; https://web.archive.org/web/20261006195117/https://archwilio.org.uk/her/chi3/report/page.php?watprn=GGAT02038s'})
manual.append({'item':'HER record GGAT02038s (Great House Farmhouse, Llandough): Sources section expanded from 4 to 5 named sources plus 4 PDF links','institution':'Heneb HER / Archwilio (formerly GGAT)',
 'url':'https://archwilio.org.uk/her/chi3/report/page.php?watprn=GGAT02038s','first_seen_online':'record page: first Internet Archive capture 2026-10-06; expanded Sources first seen 2026-10-06 ("Last updated 29-09-2026")',
 'absent_evidence':'Our copy accessed 2026-05-29: 4 sources, no PDF, "Last updated 13-10-2023"','enquiry_dates':her_enq,'source':'work/internetarchive/box/stage/public/20260529000000/...GGAT02038s/text.txt; IA 20261006195117'})
manual.append({'item':'HER GGAT02038s source PDF docid 301361628 (16-page scan, file created 2012-11-23)','institution':'Heneb HER / Archwilio (formerly GGAT)',
 'url':'https://www.walesher1974.org/her/app/php/herumd.php?group=GGAT&level=3&docid=301361628','first_seen_online':'online by 2026-05-28 (link sent by RCAHMW in reply RC26-0205, 28 May 2026); file metadata 2012-11-23 / 2013-02-27',
 'absent_evidence':'none found (pre-existing)','enquiry_dates':'RCAHMW (Royal Commission): first request 2025-11-26','source':'RCAHMW email RC26-0205 (28 May 2026)'})
with open(OUT,'w',newline='') as f:
    w=csv.DictWriter(f,fieldnames=cols); w.writeheader()
    for m in manual: w.writerow(m)
    for i,(ins,u,r) in enumerate(cands):
        c=cdx(u)
        own=r.get('latest_capture') or ''
        own_d=re.match(r'/(\d{14})/',own); own_d=fmt(own_d.group(1)) if own_d else ''
        if c['err']: fs=f"Internet Archive index unavailable at {c['queried']}"; ab=''
        elif c['first']: fs=f"{fmt(c['first'])} (earliest Internet Archive capture)"; ab=f"no Internet Archive capture before {fmt(c['first'])} (CDX queried {c['queried']})"
        else: fs='no Internet Archive capture'+(f'; our capture {own_d}' if own_d else ''); ab=f"not in the Internet Archive at {c['queried']}"
        if own_d and c.get('first'): fs+=f'; our capture {own_d}'
        title=(r.get('matched_terms') or '').replace('|',',')[:80]
        w.writerow({'item':(urlparse(u).path.strip('/').split('/')[-1] or urlparse(u).netloc)[:90]+(f' [{title}]' if title else ''),
          'institution':ins,'url':u,'first_seen_online':fs,'absent_evidence':ab,'enquiry_dates':enquiry_for(ins),
          'source':'cited on: '+r['cited_on'].split(' | ')[0]+' ; status: '+r['status'][:60]})
        f.flush()
        if i%25==0: print('done',i,flush=True)
print('register rows',len(manual)+len(cands),flush=True)
