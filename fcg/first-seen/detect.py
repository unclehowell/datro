#!/usr/bin/env python3
"""First-seen detector: cheap per-institution checks for NEW farm-related items online. — Sion's Tab agent
Plain fetch only (curl -4), robots.txt respected, no logins, no CAPTCHA. Runs unattended in < 10 min.
Writes: work/first-seen/new_items.json (this run's new items), state.json (all ids seen so far), detect_runs.csv (one line per run).
First run on a fresh state records a baseline (items marked baseline, not new).
Usage: python3 detect.py [--only NAME] [--quiet]"""
import json, os, re, subprocess, sys, time, hashlib, csv, datetime as dt, html as H
from urllib.parse import quote, urlparse, urljoin
from urllib import robotparser
FS=os.path.dirname(os.path.abspath(__file__))
STATE=os.path.join(FS,'state.json'); NEW=os.path.join(FS,'new_items.json'); RUNS=os.path.join(FS,'detect_runs.csv')
UA='Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36 first-seen-check'
FARM=re.compile(r"great\s*house\s*farm|t[yŷ][\s-]*mawr|llandough|buckler|bp\s*properties|coflein\s*20182|\b20182\b|02038s?|2179s|\bWA231076\b|\bWA735527\b",re.I)
DEADLINE=time.time()+540  # stop starting checks after 9 min
T0=dt.datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ')
def fetch(url,accept=None,timeout=40):
    cmd=['timeout','-k','5',str(timeout+5),'curl','-4','-sL','--compressed','-m',str(timeout),'-A',UA,'-w','\n__HTTP__%{http_code}',url]
    if accept: cmd[6:6]=['-H','Accept: '+accept]
    r=subprocess.run(cmd,capture_output=True)
    out=r.stdout.decode('utf-8','replace'); m=re.search(r'\n__HTTP__(\d+)$',out)
    code=int(m.group(1)) if m else 0
    return code,(out[:m.start()] if m else out)
_rp={}
def allowed(url):
    p=urlparse(url); base=f'{p.scheme}://{p.netloc}'
    if base not in _rp:
        rp=robotparser.RobotFileParser(); c,t=fetch(base+'/robots.txt',timeout=20)
        if c==200 and t: rp.parse(t.splitlines())
        else: rp.parse([])  # no robots file -> allowed
        _rp[base]=rp; time.sleep(1)
    return _rp[base].can_fetch(UA,url)
def text_of(h):
    h=re.sub(r'(?is)<(script|style|noscript).*?</\1>',' ',h); return re.sub(r'\s+',' ',H.unescape(re.sub(r'<[^>]+>',' ',h))).strip()
# ---- check types -------------------------------------------------------------
def tna(q):
    def run():
        u='https://discovery.nationalarchives.gov.uk/API/search/records?sps.searchQuery='+quote(q)+'&sps.resultsPageSize=1000'
        c,t=fetch(u,accept='application/json'); j=json.loads(t)
        recs=j.get('records',[])
        return c,{r['id']:{'title':(r.get('title') or r.get('description') or '')[:200],'ref':r.get('reference',''),'url':'https://discovery.nationalarchives.gov.uk/details/r/'+r['id'],'date':r.get('coveringDates','')} for r in recs},{'count':j.get('count')}
    return run
def govuk(q):
    def run():
        u='https://www.gov.uk/api/search.json?q='+quote(q)+'&count=100&fields=title,link,public_timestamp,organisations'
        c,t=fetch(u,accept='application/json'); j=json.loads(t)
        items={}
        for r in j.get('results',[]):
            ttl=r.get('title','')
            items[r['link']]={'title':ttl[:200],'url':'https://www.gov.uk'+r['link'],'date':r.get('public_timestamp',''),'farm':bool(FARM.search(ttl))}
        return c,items,{'count':j.get('total')}
    return run
def page_links(url,link_rx=None,need_farm=True):
    """Fetch a page; items = links (href) whose text or href matches the farm terms (or link_rx). Also a text hash."""
    def run():
        c,t=fetch(url)
        items={}
        for m in re.finditer(r'(?is)<a\b[^>]*href=["\']([^"\']+)["\'][^>]*>(.*?)</a>',t):
            href=urljoin(url,H.unescape(m.group(1))); lt=text_of(m.group(2))[:200]
            if (link_rx and re.search(link_rx,href+' '+lt,re.I)) or (need_farm and FARM.search(href+' '+lt)):
                items[href]={'title':lt,'url':href}
        tx=text_of(t)
        meta={'text_sha256':hashlib.sha256(tx.encode()).hexdigest(),'chars':len(tx)}
        lu=re.search(r'Last updated\s*:?\s*([0-9]{2}-[0-9]{2}-[0-9]{4})',tx)
        if lu: meta['last_updated']=lu.group(1)
        return c,items,meta
    return run
def her_record(prn):
    u='https://archwilio.org.uk/her/chi3/report/page.php?watprn='+prn
    def run():
        c,items,meta=page_links(u,link_rx=r'herumd\.php|\.pdf',need_farm=False)()
        if c==200:
            c2,t=fetch(u); tx=text_of(t)
            s=re.search(r'Sources\s*:(.*?)(Events\s*:|Related records|Compiled date)',tx,re.S)
            if s:
                for src in re.split(r'\)\s+(?=[A-Z][^,]{1,40}\s*,\s*\d{4})',s.group(1)):
                    src=src.strip()[:160]
                    if re.search(r'\d{4}',src): items['source:'+hashlib.md5(src.encode()).hexdigest()[:10]]={'title':src,'url':u}
        return c,items,meta
    return run
def coflein_archives(nprn):
    def run():
        u=f'https://coflein.gov.uk/en/sites/{nprn}/archives?size=100'
        c,t=fetch(u,timeout=60); items={}
        for m in re.finditer(r'href="/en/archives/(\d+)[^"]*"[^>]*>.*?</a><span class="label">Title</span><span[^>]*>(.*?)</span>',t,re.S):
            items[m.group(1)]={'title':text_of(m.group(2))[:200],'url':'https://coflein.gov.uk/en/archives/'+m.group(1)}
        tx=text_of(t); n=re.search(r'(\d+)\s+(?:results|archives|items)',tx)
        return c,items,{'count_text':n.group(0) if n else '','text_sha256':hashlib.sha256(tx.encode()).hexdigest()}
    return run
def wdtk(q):
    def run():
        u='https://www.whatdotheyknow.com/feed/search/'+quote(q)
        c,t=fetch(u,accept='application/atom+xml'); items={}
        for e in re.findall(r'(?s)<entry>(.*?)</entry>',t):
            l=re.search(r'<link[^>]*href="([^"]+)"',e); ti=re.search(r'<title[^>]*>(.*?)</title>',e,re.S); up=re.search(r'<updated>(.*?)</updated>',e)
            if l: items[l.group(1).split('#')[0]]={'title':text_of(ti.group(1)) if ti else '','url':l.group(1),'date':up.group(1) if up else ''}
        return c,items,{}
    return run
CHECKS=[
 ('HER Archwilio GGAT02038s', her_record('GGAT02038s')),
 ('HER Archwilio GGAT2179S', her_record('GGAT2179S')),
 ('HER Archwilio GGATE000877', her_record('GGATE000877')),
 ('HER Archwilio GGATE003872', her_record('GGATE003872')),
 ('HER Archwilio GGATE003875', her_record('GGATE003875')),
 ('Coflein 20182 archives', coflein_archives(20182)),
 ('Coflein 20182 site page', page_links('https://coflein.gov.uk/en/sites/20182',link_rx=r'/en/archives/|\.pdf',need_farm=False)),
 ('TNA Discovery Llandough (all records)', tna('Llandough')),
 ('TNA Discovery Buckler (all records)', tna('Buckler')),
 ('TNA Discovery Cogan', tna('Cogan')),
 ('GOV.UK search "Great House Farm" Llandough', govuk('"Great House Farm" Llandough')),
 ('GOV.UK search Llandough Penarth', govuk('Llandough Penarth')),
 ('GOV.UK search "BP Properties"', govuk('"BP Properties"')),
 ('WhatDoTheyKnow "Great House Farm"', wdtk('"Great House Farm"')),
 ('WhatDoTheyKnow Llandough', wdtk('Llandough')),
 ('NLW Newspapers "Great House Farm" Llandough', page_links('https://newspapers.library.wales/search?alt=full&query=%22Great+House+Farm%22+Llandough',link_rx=r'/view/\d+',need_farm=False)),
 ('NLW Archives "Great House Farm"', page_links('https://archives.library.wales/index.php/informationobject/browse?topLod=0&query=%22Great+House+Farm%22',link_rx=r'/index\.php/[a-z0-9-]+$',need_farm=True)),
 ('Welsh Government FOI responses (index page)', page_links('https://www.gov.wales/about/open-government/freedom-of-information/responses',link_rx=r'/atisn|freedom-of-information/responses/',need_farm=True)),
 ('Cadw listed buildings search Llandough', page_links('https://cadwpublic-api.azurewebsites.net/reports/listedbuilding/FullResults?lang=en&term=Llandough',link_rx=r'FullReport|ListedBuilding',need_farm=True)),
 ('Vale of Glamorgan FOI disclosure log', page_links('https://www.valeofglamorgan.gov.uk/en/our_council/Access-to-Information/Freedom-of-Information/Disclosure-Log.aspx',link_rx=r'\.pdf|disclosure',need_farm=True)),
 ('Cardiff Council FOI disclosure log', page_links('https://www.cardiff.gov.uk/ENG/Your-Council/Have-your-say/Freedom-of-Information/Pages/default.aspx',link_rx=r'disclosure',need_farm=True)),
 ('South Wales Police FOI disclosure log', page_links('https://www.south-wales.police.uk/foi-ai/af/accessing-information/published-items/?q=Llandough',link_rx=r'published-items/',need_farm=True)),
 ('Historic England archive search Llandough', page_links('https://historicengland.org.uk/images-books/archive/collections/photographs/results/?searchType=HE+Archive+New&search=Llandough',link_rx=r'/archive/collections/photographs/item/',need_farm=False)),
 ('Dwr Cymru FOI disclosure log', page_links('https://corporate.dwrcymru.com/en/about-us/our-policies/freedom-of-information',link_rx=r'\.pdf|disclosure',need_farm=True)),
 ('Museum Wales collections Llandough', page_links('https://museum.wales/collections/online/?terms=Llandough',link_rx=r'/collections/online/object/',need_farm=False)),
 ('Glamorgan Archives (epexio) Llandough', page_links('https://glamorgan.epexio.com/search?query=Great%20House%20Farm%20Llandough',link_rx=r'/records/',need_farm=False)),
]
def main():
    only=None
    if '--only' in sys.argv: only=sys.argv[sys.argv.index('--only')+1]
    st=json.load(open(STATE)) if os.path.exists(STATE) else {}
    regurls=set()
    try:
        for r in csv.DictReader(open(os.path.join(FS,'register.csv'))): regurls.add(r['url'])
    except Exception: pass
    new=[]; summary=[]
    for name,fn in CHECKS:
        if only and only.lower() not in name.lower(): continue
        if time.time()>DEADLINE: summary.append((name,'skipped: time budget')); continue
        prev=st.get(name)
        fake={'https://coflein.gov.uk/x':1}
        try:
            # robots check on the check's main URL (closure introspection: fetch URL is first arg in cell)
            urls=[c.cell_contents for c in (fn.__closure__ or []) if isinstance(c.cell_contents,str) and c.cell_contents.startswith('http')]
            if urls and not allowed(urls[0]):
                summary.append((name,'robots.txt disallows; not fetched')); continue
            code,items,meta=fn()
        except Exception as e:
            summary.append((name,f'error {type(e).__name__}: {str(e)[:80]}')); continue
        if code!=200:
            summary.append((name,f'http {code}; kept previous state')); continue
        rec={'checked':T0,'meta':meta,'ids':sorted(items)}
        if prev is None:
            rec['baseline']=T0; rec['first_seen']={k:T0 for k in items}
            summary.append((name,f'baseline {len(items)} items'))
        else:
            fs=prev.get('first_seen',{}); added=[k for k in items if k not in fs]; gone=[k for k in prev.get('ids',[]) if k not in items]
            for k in added:
                fs[k]=T0; it=items[k]
                new.append({'check':name,'id':k,'title':it.get('title',''),'url':it.get('url',''),'item_date':it.get('date',''),
                            'first_seen':T0,'previous_check':prev.get('checked'),'in_register':it.get('url','') in regurls,
                            'farm_terms':bool(FARM.search(json.dumps(it,ensure_ascii=False)))})
            changed=[k for k in ('text_sha256','last_updated','count','count_text') if k in meta and prev.get('meta',{}).get(k)!=meta.get(k) and prev.get('meta',{}).get(k) is not None]
            if changed and name.startswith(('HER','Coflein')):
                new.append({'check':name,'id':'page-change','title':'page changed: '+', '.join(f"{k} {prev['meta'].get(k)} -> {meta.get(k)}" for k in changed),
                            'url':'','first_seen':T0,'previous_check':prev.get('checked'),'in_register':True,'farm_terms':True})
            rec['first_seen']=fs; rec['baseline']=prev.get('baseline'); rec['gone']=gone[:50]
            summary.append((name,f'{len(items)} items, {len(added)} new, {len(gone)} gone'+(f', changed {changed}' if changed else '')))
        st[name]=rec; time.sleep(2)
    json.dump(st,open(STATE,'w'),ensure_ascii=False,indent=1)
    json.dump({'run':T0,'new_count':len(new),'new':new,'checks':[{'check':a,'result':b} for a,b in summary]},open(NEW,'w'),ensure_ascii=False,indent=1)
    first=not os.path.exists(RUNS)
    with open(RUNS,'a',newline='') as f:
        w=csv.writer(f)
        if first: w.writerow(['run_utc','checks','new_items','errors'])
        w.writerow([T0,len(summary),len(new),sum(1 for _,b in summary if b.startswith(('error','http','robots','skipped')))])
    if '--quiet' not in sys.argv:
        for a,b in summary: print(f'{a}: {b}')
    print(f'NEW_ITEMS {len(new)}')
if __name__=='__main__': main()
