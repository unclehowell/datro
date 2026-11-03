#!/usr/bin/env python3
"""Distribute the archive text into the chessboard squares and build the sudoku story.
In:  chunks.json (from chunk.py), site/public/data/board.json
Out: site/public/data/archive/index.json + a-NN.json.gz shards, site/public/data/sudoku.json"""
import json,re,gzip,random,collections,pathlib,math,sys
SITE=pathlib.Path(sys.argv[1] if len(sys.argv)>1 else '/home/user/tab/work/chess/site')
OUT=SITE/'public/data/archive'; OUT.mkdir(parents=True,exist_ok=True)
for f in OUT.glob('a-*.json.gz'): f.unlink()
B=json.load(open(SITE/'public/data/board.json')); SQ=B['sq']
J=json.load(open('chunks.json')); C=J['chunks']; SEGS=J['segs']
col=lambda q:'b' if q['k'] in 'ALCK' else 'w'
MON={m:i for i,m in enumerate('jan feb mar apr may jun jul aug sep oct nov dec'.split())}
def year_of(d):
    m=re.search(r'\b(1[0-9]\d\d|20[0-2]\d)\b',d or ''); return float(m.group(1)) if m else 9999.0
# ---- balanced, order-preserving distribution per colour (equal text per square, within one chunk)
assign=collections.defaultdict(list); stats={}
for c in 'bw':
    sqs=sorted([i for i,q in enumerate(SQ) if col(q)==c],key=lambda i:(SQ[i]['e'],SQ[i]['r'],SQ[i]['c']))
    ch=sorted([k for k,x in enumerate(C) if x['c']==c],key=lambda k:(C[k]['tk'],k))
    tot=sum(len(C[k]['t']) for k in ch); cum=0; S=len(sqs)
    for k in ch:
        mid=cum+len(C[k]['t'])/2; cum+=len(C[k]['t'])
        assign[sqs[min(S-1,int(mid/tot*S))]].append(k)
    loads=[sum(len(C[k]['t']) for k in assign[i]) for i in sqs]
    stats[c]={'squares':S,'chunks':len(ch),'chars':tot,'min':min(loads),'max':max(loads),'mean':round(tot/S)}
    assert all(assign[i] for i in sqs)
SH=24; shards=math.ceil(len(SQ)/SH); raw=0; gz=0
for s in range(shards):
    d={}
    for i in range(s*SH,min(len(SQ),(s+1)*SH)):
        d[SQ[i]['id']]=[[C[k]['s'],C[k]['p'],C[k]['th'],C[k]['t']] for k in assign[i]]
        for k in assign[i]: assert C[k]['c']==col(SQ[i])
    b=json.dumps({'v':1,'sq':d},ensure_ascii=False,separators=(',',':')).encode()
    z=gzip.compress(b,9,mtime=0); raw+=len(b); gz+=len(z)
    (OUT/f'a-{s:02d}.json.gz').write_bytes(z)
idx={'v':1,'shard':SH,'n':len(SQ),'segs':[[x['t'],x['u'],x['p'],x['th']] for x in SEGS],
     'cnt':[len(assign[i]) for i in range(len(SQ))],'chars':[sum(len(C[k]['t']) for k in assign[i]) for i in range(len(SQ))],
     'stats':stats,'source':'Great House Farm Legal Wiki, free archive edition v0.1.0 (2,033 pages) + public GHF sites','built':B['built']}
(OUT/'index.json').write_text(json.dumps(idx,ensure_ascii=False,separators=(',',':')))
# ---- sudoku: 10 puzzles; the 808 squares in story order split evenly across them
def solve_count(g,limit=2):
    g=g[:]; cnt=[0]
    rows=[set() for _ in range(9)]; cols=[set() for _ in range(9)]; box=[set() for _ in range(9)]
    for i,v in enumerate(g):
        if v: rows[i//9].add(v); cols[i%9].add(v); box[(i//27)*3+(i%9)//3].add(v)
    def rec():
        best=None;bc=None
        for i in range(81):
            if not g[i]:
                cand=[v for v in range(1,10) if v not in rows[i//9] and v not in cols[i%9] and v not in box[(i//27)*3+(i%9)//3]]
                if best is None or len(cand)<len(bc): best,bc=i,cand
                if not cand: return
        if best is None: cnt[0]+=1; return
        i=best
        for v in bc:
            g[i]=v; rows[i//9].add(v); cols[i%9].add(v); box[(i//27)*3+(i%9)//3].add(v)
            rec()
            g[i]=0; rows[i//9].discard(v); cols[i%9].discard(v); box[(i//27)*3+(i%9)//3].discard(v)
            if cnt[0]>=limit: return
    rec(); return cnt[0]
def full(rng):
    base=[[(3*(r%3)+r//3+c)%9+1 for c in range(9)] for r in range(9)]
    digs=list(range(1,10)); rng.shuffle(digs)
    bands=[0,1,2]; rng.shuffle(bands); rows=[b*3+r for b in bands for r in rng.sample(range(3),3)]
    stks=[0,1,2]; rng.shuffle(stks); cols=[s*3+c for s in stks for c in rng.sample(range(3),3)]
    return [digs[base[r][c]-1] for r in rows for c in cols]
def make(seed,target):
    rng=random.Random(seed); sol=full(rng); g=sol[:]
    order=list(range(81)); rng.shuffle(order)
    for i in order:
        if sum(1 for v in g if v)<=target: break
        j=80-i; keep=(g[i],g[j]); g[i]=0; g[j]=0
        if solve_count(g)!=1: g[i],g[j]=keep
    return g,sol
story=sorted(range(len(SQ)),key=lambda i:(SQ[i]['e'],SQ[i]['r'],SQ[i]['c']))
NP=10; puzzles=[]; eras=B['eras']
for p in range(NP):
    g,sol=make(1877+p*37,32)
    assert solve_count(g)==1 and all(g[i] in (0,sol[i]) for i in range(81))
    recs=story[p*len(story)//NP:(p+1)*len(story)//NP]
    blanks=sum(1 for v in g if v==0)
    groups=[[SQ[i]['id'] for i in recs[k*len(recs)//blanks:(k+1)*len(recs)//blanks]] for k in range(blanks)]
    assert all(groups) and sum(map(len,groups))==len(recs)
    e0=eras[SQ[recs[0]]['e']]['label']; e1=eras[SQ[recs[-1]]['e']]['label']
    puzzles.append({'n':p+1,'title':e0 if e0==e1 else f'{e0} → {e1}','g':''.join(map(str,g)),'s':''.join(map(str,sol)),'x':groups,'squares':len(recs)})
json.dump({'v':1,'puzzles':puzzles,'note':'Each correct number opens the next story extract in time order; the 808 squares are split evenly across the 10 puzzles.'},open(SITE/'public/data/sudoku.json','w'),ensure_ascii=False,separators=(',',':'))
print(json.dumps(stats),'shards',shards,'raw',raw,'gz',gz)
print([(p['n'],p['title'],p['g'].count('0'),p['squares']) for p in puzzles])
