import json,re,collections,statistics,sys,gzip,pathlib
sys.path.insert(0,'.')
P=json.load(open('pdf.json'));pages=P['pages'];toc=P['toc']
B=json.load(open('/home/user/tab/work/chess/site/public/data/board.json'))
MON={m:i for i,m in enumerate('jan feb mar apr may jun jul aug sep oct nov dec'.split())}
def year_of(d):
    if not d: return None
    m=re.search(r'(\d{1,2})?\s*(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+(\d{4})',d,re.I)
    if m: return int(m.group(3))+MON[m.group(2).lower()[:3]]/12
    m=re.search(r'\b(1[0-9]\d\d|20[0-2]\d)\b',d)
    return float(m.group(1)) if m else None
# ---------- segments from TOC (levels 2/3), skipping cover/about/title/contents/index
ents=[(lvl,t,p) for lvl,t,p in toc if lvl>=2 or t in ('Appendix: Master Change Log',)]
ents=[e for e in ents if 17<=e[2]<2022]
ents.sort(key=lambda e:e[2])
def norm(s): return re.sub(r'\s+',' ',s).strip().lower()
# locate each entry's offset within its page
segs=[]
for i,(lvl,t,p) in enumerate(ents):
    txt=pages[p-1]; key=t[:30]
    k=norm(txt).find(norm(key)); off=0
    if k>=0:
        # map normalised offset approx by searching first word sequence in raw
        m=re.search(re.escape(t.split()[0]),txt); off=m.start() if m else 0
        # refine: find exact first line of title
        j=txt.find(t[:20]); off=j if j>=0 else off
    segs.append({'title':t,'p':p,'off':off})
for i,s in enumerate(segs):
    e=segs[i+1] if i+1<len(segs) else {'p':2022,'off':0}
    parts=[]
    for pg in range(s['p'],e['p']+1):
        if pg>2021: break
        txt=pages[pg-1]
        a=s['off'] if pg==s['p'] else 0
        b=e['off'] if pg==e['p'] else len(txt)
        if pg==e['p'] and e['p']!=s['p'] and b==0: break
        if pg==e['p']==s['p'] and b<=a: b=len(txt) if i+1==len(segs) else b
        parts.append((pg,txt[a:b]))
    s['parts']=parts
# ---------- cleaning
META=[r'^\s*[.·]?\s*$',r'^\s*\d{1,4}\s*$',r'^Wiki page \d+ · last updated',r'^Page ID: \d+',r'^greathousefarmwiki\.wordpress\.com/\S*$',r'^\S+/$',r'^[\w-]+/[\w/-]*/$']
META=[re.compile(m) for m in META]
def clean(raw):
    out=[]
    for l in raw.split('\n'):
        ls=l.strip()
        if any(m.search(ls) for m in META): continue
        out.append(ls)
    t='\n'.join(out)
    t=re.sub(r'(\w)[-‐]\n([a-z])',r'\1\2',t)       # typeset hyphenation
    t=re.sub(r'(?<![.:;!?•\n])\n(?=[a-z(“"‘\'])',' ',t)  # soft line wraps
    t=re.sub(r'\n•\n','\n• ',t)
    t=re.sub(r'[ \t]+',' ',t)
    t=re.sub(r'\n{2,}','\n',t)
    # drop the per-page change-log table (wiki housekeeping)
    t=re.split(r'\nPage version & change log\n',t)[0]
    return t.strip()
NAME=[(r'(?i)\bSion\s*\(Hywel\)\s*Buckler(\s+Esq\.?)?','a family member'),(r'(?i)\bSion\s+Hywel\s+Buckler(\s+Esq\.?)?','a family member'),
      (r'(?i)\bSion\s+Buckler(\s+Esq\.?)?','a family member'),(r'\bHywel\s+Buckler\b','a family member'),
      (r'\bSion[’\']s\b','the family’s'),(r'(?i)\bSion\b','the family'),(r'hywelapbuckler\S*','[address withheld]'),(r'Robin Hill','[name withheld]')]
WORD=[(r'\baccording to\b','per'),(r'\bAccording to\b','Per'),(r'\bhearsay\b','second-hand evidence'),(r'\bHearsay\b','Second-hand evidence'),
      (r'\bUNVERIFIED\b','NOT YET CHECKED'),(r'\bUnverified\b','Not yet checked'),(r'\bunverified\b','not yet checked'),
      (r'\ballegedly\b','reportedly'),(r'\bAllegedly\b','Reportedly'),(r'\bALLEGED\b','ASSERTED'),(r'\bAlleged\b','Asserted'),(r'\balleged\b','asserted'),
      (r"\bfamily(['’]s)? account\b",r'family\1 record'),(r"\bfamily testimony\b",'family evidence'),(r'\bsays\b','states'),(r'\bSays\b','States'),(r'\bSAYS\b','STATES')]
VERBPRE=re.compile(r'(?:\b(?:he|she|it|which|that|who|also|BP|Council|wiki|page|letter|report|document|Registry|HMLR|WGR|now|still|one|this|plaintiff|defendant|[A-Z][a-z]+)\s+)$')
def fix_claims(t):
    out=[];last=0
    for m in re.finditer(r'\b([Cc])laims\b|\bCLAIMS\b',t):
        pre=t[max(0,m.start()-40):m.start()]
        verb=bool(VERBPRE.search(pre)) and not re.search(r'\b(the|its|his|her|their|these|those|such|any|no|of|and|or|competing|title|land|legal|possessory|ownership|adverse|statutory|compensation|other|both|two|three|all|Small|small)\s+$',pre,re.I)
        if m.group(0)=='CLAIMS': rep='ASSERTIONS'
        else: rep=('asserts' if verb else 'assertions'); rep=rep.capitalize() if m.group(0)[0]=='C' else rep
        out.append(t[last:m.start()]);out.append(rep);last=m.end()
    out.append(t[last:]);return ''.join(out)
PRIV=[(r'(?:\+44\s?\(?0?\)?\s?7|\b07)\d{3}\s?\d{3}\s?\d{3}','[number withheld]'),(r'7845\s?933262','[number withheld]'),
      (r'\b[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}\b','[postcode]'),(r'[\w.+-]+@([\w-]+\.[\w.-]*\w)',r'[…]@\1'),
      (r'\b(Branwen)\s+Buckler\b',r'\1')]
NONOFF=re.compile(r'@(gmail|hotmail|yahoo|outlook|icloud|btinternet|aol|live|me)\.',re.I)
def scrub(t):
    for a,b in NAME: t=re.sub(a,b,t)
    t=re.sub(r'(^|[.!?]\s+|\n)(the family|a family member)',lambda m:m.group(1)+m.group(2)[0].upper()+m.group(2)[1:],t)
    for a,b in WORD: t=re.sub(a,b,t)
    t=fix_claims(t)
    for a,b in PRIV: t=re.sub(a,b,t)
    t=re.sub(r'\s*\(?Ret[\'’]?d\.? (Serge\w*|Sgt)\.?\)?','',t)
    t=re.sub(r'Oath of Allegiance','[personal document withheld]',t)
    t=re.sub(r'Royal Signals Association(\s+Benevolent\s+Fund)?(\s+(card|letter))?','[personal record withheld]',t)
    t=re.sub(r'(?m)^[^\n]*Royal Signals[^\n]*$\n?','',t)
    t=re.sub(r'unverified','not yet checked',t,flags=re.I)
    return t
# ---------- url per segment
def seg_url(parts):
    txt='\n'.join(x for _,x in parts[:2]); txt=re.sub(r'[‐\u00ad]\n','',txt)
    m=re.search(r'(greathousefarmwiki\.wordpress\.com/\S*)(?:\n(\S+/))?',txt)
    if not m: return None
    u='https://'+m.group(1)+(m.group(2) or '')
    return None if re.search(r'sion',u.split('wordpress.com',1)[1],re.I) and re.search(r'(?i)(?<![a-z])sion(?![a-z])|sion-buckler',u) else u
def path(u): return re.sub(r'^https?://[^/]+','',u.split('#')[0]).rstrip('/').lower()
aff=collections.defaultdict(list)
for q in B['sq']:
    col='b' if q['k'] in 'ALCK' else 'w'
    for s in q['src']:
        if 'greathousefarmwiki' in s[1]: aff[path(s[1])].append((col,year_of(q['d'])))
BK=['BP Properties','BP Pension','plaintiff','possession order','licence','licensee','Western Ground Rents','WGR','Land Registry','HMLR','registered proprietor','title absolute','eviction','evicted','demoli','injunction','bailiff','Council','Police','Ministry','MoD','refus','withheld','exempt','not held','no record','FOI','EIR','Court of Appeal','judgment','Slade','trespass','proprietor','possessor','redevelop','Persimmon','Church View Close','permission','concealed','missing','destroyed']
WK=['Williams','Nancy','Tŷ Mawr','Ty Mawr','tenancy','planted','trees','orchard','heritage','listed','lineage','Vaughan','Herbert','Cedwyn','Cydfin','census','baptis','born','married','grandfather','grandmother','family','ownership','owner','freehold','occupation','occupied','grazing','rent book','receipt','farmhouse','museum','Patagonia','archaeolog','medieval','church','St Dochdwy','memorial']
def kscore(t):
    b=sum(len(re.findall(re.escape(k),t,re.I)) for k in BK); w=sum(len(re.findall(re.escape(k),t,re.I)) for k in WK)
    return b,w
WM=re.compile(r"\bmy (family|grandmother|grandfather|mother|father|great|late)|\bI (am|have|write|would|was|want|ask|request|look)\b|\bour (family|home|farm|land)\b|\bA family member\b|\bthe family’s\b")
BM=re.compile(r"Dear Mr Buckler|Dear Sir|we (have|are|do|cannot|will|can|hold|received)\b|\bthe Council\b|exempt|section \d+|Freedom of Information|not hold|unable to|refus|our records|Information Rights|Customer Services|Yours sincerely",re.I)
THEO=re.compile(r'\btheor|\bour case\b|\bprospective\b|\bhypothes|\bworking reconstruction',re.I)
chunks=[];segout=[]
for si,s in enumerate(segs):
    u=seg_url(s['parts']); s['url']=u
    body=[(pg,scrub(clean(x))) for pg,x in s['parts']]
    full=' '.join(x for _,x in body)
    if len(full)<40: continue
    a=aff.get(path(u),[]) if u else []
    b,w=kscore(full)
    if a:
        nb=sum(1 for c,_ in a if c=='b'); nw=len(a)-nb
        col='b' if nb>nw else 'w' if nw>nb else ('b' if b>w else 'w'); how='squares'
    else:
        col='b' if b>w*1.15 else 'w'; how='rubric'
    ys=[y for _,y in a if y]
    if ys: tk=statistics.median(ys)
    else:
        ty=year_of(s['title'])
        if ty: tk=ty
        else:
            yrs=[int(y) for y in re.findall(r'\b(1[5-9]\d\d|20[0-2]\d)\b',full)]
            tk=collections.Counter(yrs).most_common(1)[0][0] if yrs else 9999
    th=1 if THEO.search(s['title']) or len(THEO.findall(full))>=3 else 0
    segout.append({'t':scrub(s['title']),'u':u,'p':s['p'],'c':col,'how':how,'tk':tk,'th':th})
    sidx=len(segout)-1
    # paragraphs -> chunks of ~700 chars, chunk colour may flip only on a strong rubric signal
    for pg,x in body:
        paras=[p for p in x.split('\n') if p.strip()]
        buf=''
        corr=815<=s['p']<1691
        def flush(buf,pg):
            bb,ww=kscore(buf); c=col
            if corr:
                wm=len(WM.findall(buf)); bm=len(BM.findall(buf)); sc=3*wm-3*bm+(ww-bb)
                c='w' if sc>0 else 'b' if sc<0 else (chunks[-1]['c'] if chunks and chunks[-1]['s']==sidx else col)
            else:
                if col=='w' and bb>=ww+4: c='b'
                if col=='b' and ww>=bb+4: c='w'
            chunks.append({'s':sidx,'p':pg,'c':c,'t':buf.strip(),'tk':tk,'th':th})
        for para in paras:
            while len(para)>1100:
                cut=para.rfind('. ',0,900); cut=cut+1 if cut>300 else 900
                if buf: flush(buf,pg); buf=''
                flush(para[:cut],pg); para=para[cut:].strip()
            if len(buf)+len(para)>800 and buf: flush(buf,pg); buf=''
            buf+=('\n' if buf else '')+para
        if buf: flush(buf,pg)
# ---------- public GHF sites (research. is the wiki mirror, already covered by the archive text)
seenp=set(re.sub(r'\W+','',x['t'].lower())[:120] for x in chunks)
for pgx in json.load(open('sites.json')):
    paras=[]
    for para in scrub(pgx['text']).split('\n'):
        k=re.sub(r'\W+','',para.lower())[:120]
        if len(para)<25 or k in seenp: continue
        seenp.add(k); paras.append(para)
    full='\n'.join(paras)
    if len(full)<150: continue
    b,w=kscore(full); col='b' if b>w*1.15 else 'w'
    yrs=[int(y) for y in re.findall(r'\b(1[5-9]\d\d|20[0-2]\d)\b',full)]
    tk=collections.Counter(yrs).most_common(1)[0][0] if yrs else 9999
    th=1 if pgx['site']=='fcg' or THEO.search(full) else 0
    segout.append({'t':scrub(pgx['title']),'u':pgx['url'],'p':None,'c':col,'how':'rubric-site','tk':tk,'th':th}); sidx=len(segout)-1
    buf=''
    def fl(buf):
        bb,ww=kscore(buf); c=col
        if col=='w' and bb>=ww+4: c='b'
        if col=='b' and ww>=bb+4: c='w'
        chunks.append({'s':sidx,'p':None,'c':c,'t':buf.strip(),'tk':tk,'th':th})
    for para in paras:
        while len(para)>1100:
            cut=para.rfind('. ',0,900); cut=cut+1 if cut>300 else 900
            if buf: fl(buf); buf=''
            fl(para[:cut]); para=para[cut:].strip()
        if len(buf)+len(para)>800 and buf: fl(buf); buf=''
        buf+=('\n' if buf else '')+para
    if buf: fl(buf)
json.dump({'segs':segout,'chunks':chunks},open('chunks.json','w'),ensure_ascii=False)
c=collections.Counter(x['c'] for x in chunks); ch=collections.Counter(); 
for x in chunks: ch[x['c']]+=len(x['t'])
print(len(segout),'segs',len(chunks),'chunks',c,dict(ch),collections.Counter(s['how'] for s in segout),collections.Counter(s['c'] for s in segout))
