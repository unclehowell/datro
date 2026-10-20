
import json,gzip,re,pathlib,sys
P=pathlib.Path('/home/user/tab/work/chess/site/public')
texts={}
for f in sorted((P/'data/archive').glob('a-*.json.gz')): texts[str(f)]=gzip.decompress(f.read_bytes()).decode()
for f in ['data/archive/index.json','data/sudoku.json','index.html','assets/chess.js']: texts[f]=(P/f).read_text()
BAN=[r'\bsays\b',r'\bclaims\b',r'according to',r'hearsay',r'unverified',r'\balleged',r"family\W{0,3}s? account",r'family testimony']
PRIV=[r'Robin Hill',r'hywelapbuckler',r'7845\s?933262',r'(\+44\s?7|\b07)\d{3}\s?\d{3}\s?\d{3}',r'\b[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}\b',r'[\w.+-]+@(gmail|hotmail|yahoo|outlook|icloud|btinternet|aol|live)\.',r'Oath of Allegiance',r'Royal Signals']
bad=[]
for k,t in texts.items():
    for p in BAN+PRIV:
        for m in re.finditer(p,t,0 if p.startswith(r'\b[A-Z]') else re.I): bad.append((k[-30:],p,t[max(0,m.start()-40):m.end()+20].replace('\n',' ')))
    # Sion: allowed only in the mandated sign-off
    for m in re.finditer(r'\bSion\b',t,re.I):
        ctx=t[m.start():m.start()+20]
        if not ctx.startswith("Sion's Tab agent"): bad.append((k[-30:],'Sion',t[max(0,m.start()-40):m.end()+20]))
    for m in re.finditer(r'Branwen\s+[A-Z][a-z]+',t):
        if m.group(0).split()[1] not in ('Does','The','Open','Testimony'): bad.append((k[-30:],'Branwen',m.group(0)))
# emails present at all (non-official check list)
em=set()
for t in texts.values(): em|=set(re.findall(r'[\w.+…\[\]-]+@[\w-]+\.[\w.-]+',t))
print('HITS',len(bad)); [print(b) for b in bad[:40]]
print('emails',len(em),sorted(em)[:15])
