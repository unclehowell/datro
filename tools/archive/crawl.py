import re,html,json,subprocess,urllib.parse
SITES=['fcg','dartboard','bpvsbuckler','clerk','wayback','projects','email']
def get(u):
    r=subprocess.run(['timeout','-k','3','20','curl','-sL','-A','Mozilla/5.0',u],capture_output=True)
    return r.stdout.decode('utf-8','replace')
def text(h):
    h=re.sub(r'(?is)<(script|style|noscript|svg|nav|footer|header)\b.*?</\1>','',h)
    h=re.sub(r'(?i)<br\s*/?>|</(p|div|li|h\d|tr|section|article|blockquote|dd|dt)>','\n',h)
    t=html.unescape(re.sub(r'<[^>]+>',' ',h))
    t=re.sub(r'[ \t\xa0]+',' ',t); t='\n'.join(l.strip() for l in t.split('\n') if len(l.strip())>2)
    return t
out=[]
for s in SITES:
    base=f'https://{s}.bucklerfamily.estate'
    seen=set(); q=['/']
    while q and len(seen)<40:
        p=q.pop(0)
        if p in seen: continue
        seen.add(p); h=get(base+p)
        if not h or '<html' not in h.lower()[:2000]: continue
        title=re.search(r'(?is)<title>(.*?)</title>',h); title=html.unescape(title.group(1).strip()) if title else s
        t=text(h)
        if len(t)>200: out.append({'site':s,'url':base+p,'title':title,'text':t})
        for l in re.findall(r'href="([^"#?]+)"',h):
            l=urllib.parse.urljoin(base+p,l)
            if l.startswith(base) and not re.search(r'\.(pdf|png|jpe?g|webp|gif|svg|css|js|json|xml|zip|mp4|ico|woff2?)$',l,re.I):
                pp=l[len(base):] or '/'
                if pp not in seen and pp not in q: q.append(pp)
json.dump(out,open('sites.json','w'),ensure_ascii=False)
import collections
print(len(out), collections.Counter(o['site'] for o in out), sum(len(o['text']) for o in out))
