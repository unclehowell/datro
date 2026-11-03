# Gate for chess.bucklerfamily.estate v2: banned wording + privacy grep over EVERYTHING public (decoded). — Sion's Tab agent
import json,gzip,re,pathlib,sys,urllib.parse
P=pathlib.Path(__file__).resolve().parents[2]/'public'
texts={}
for f in sorted(P.rglob('*')):
    if f.is_dir() or f.suffix in ('.woff2','.png','.jpg','.webp','.txt'): continue
    b=f.read_bytes()
    t=gzip.decompress(b).decode() if f.suffix=='.gz' else b.decode('utf-8','replace')
    texts[str(f.relative_to(P))]=urllib.parse.unquote(t)
BAN=[r'\bsays\b',r'\bclaims\b',r'according to',r'hearsay',r'unverified',r'\balleged',r"family\W{0,3}s? account",r'family testimony']
PRIV=[r'Robin Hill',r'hywelapbuckler',r'7845\s?933262',r'(\+44\s?7|\b07)\d{3}\s?\d{3}\s?\d{3}',r'\b[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}\b',r'[\w.+-]+@(gmail|hotmail|yahoo|outlook|icloud|btinternet|aol|live)\.',r'Oath of Allegiance',r'Royal Signals',r'branwen']
SLUG_OK=re.compile(r'https?://\S+')   # wiki URL slugs cannot be changed; words inside a URL are not prose
bad=[]
for k,t in texts.items():
    for p in BAN+PRIV:
        for m in re.finditer(p,t,0 if p.startswith(r'\b[A-Z]') else re.I):
            # skip matches that sit inside a URL (slug), except privacy patterns
            s=t.rfind(' ',0,m.start()); s=t.rfind('"',0,m.start()) if t.rfind('"',0,m.start())>s else s
            seg=t[s+1:m.end()+1]
            if p in BAN and ('://' in seg and ' ' not in seg): continue
            bad.append((k,p,t[max(0,m.start()-50):m.end()+30].replace('\n',' ')))
    for m in re.finditer(r'\bSion\b',t,re.I):
        bad.append((k,'Sion',t[max(0,m.start()-40):m.end()+20]))   # v3: no allowance, the owner is never named in public files
print('files',len(texts),'HITS',len(bad))
for x in bad[:40]: print(x)
sys.exit(1 if bad else 0)
