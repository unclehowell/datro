#!/usr/bin/env python3
"""Render fcg.bucklerfamily.estate /first-seen from work/first-seen/register.csv into work/fcg/worker/firstseen.js. — Sion's Tab agent
Neutral wording only: dates and links. Banned-word gate before writing."""
import csv, json, re, html, os, subprocess, datetime as dt, sys
from urllib.parse import urlparse
FS='/home/user/tab/work/first-seen'; OUTJS='/home/user/tab/work/fcg/worker/firstseen.js'
BANNED=re.compile(r'\b(says|claims?|according to|hearsay|unverified|alleged|fraud|stolen|conceal\w*|cover[- ]?up|sion)\b',re.I)
def e(s): return html.escape(str(s or ''),quote=True)
def fd(iso):
    d=dt.date.fromisoformat(iso[:10]); return f"{d.day} {d.strftime('%b %Y')}"
def live(u):
    r=subprocess.run(['timeout','-k','5','30','curl','-4','-s','-o','/dev/null','-w','%{http_code}',u],capture_output=True,text=True); return r.stdout.strip()=='200'
IA02038='https://web.archive.org/web/20261006195117/https://archwilio.org.uk/her/chi3/report/page.php?watprn=GGAT02038s'
OUR0529='https://wayback-html.bucklerfamily.estate/archwilio.org.uk/heneb-her-ggat02038s.v1.0.0.html'
our_ok=live(OUR0529)
HERMAIL=[('6 Oct 2026','https://email.bucklerfamily.estate/reference/1a1103d9d380a3b6'),('14 Oct 2026','https://email.bucklerfamily.estate/reference/1a13aff7c0c5d8b4'),('16 Oct 2026','https://email.bucklerfamily.estate/reference/1a145570b9618f41')]
ITEMS=[
 dict(title='HER record GGAT02038s (Great House Farmhouse, Llandough): source file scans added',inst='Heneb Historic Environment Record (Archwilio)',
  absent='29 May 2026 (text copy of the record dated that day): the Sources section lists four entries and no scanned files; “Last updated 13-10-2023”.',absent_link=(OUR0529 if our_ok else ''),
  first='6 Oct 2026: the earliest independent capture of the record page lists five named sources and four scanned files; “Last updated 29-09-2026”.',first_link=IA02038,
  asked='First enquiry 22 May 2026; request for the HER source file 8 Sep 2026; schedule of records 19 Sep 2026.',
  note='The HER’s reply of 6 Oct 2026: “Following its digitisation, it is now freely available online via the Archwilio website via record 02038s.” Reply of 14 Oct 2026: “The information held in the HER source file has now been digitised and uploaded to Archwilio and is accessible via record 02038s as PDF files shown in the Sources section of the record.”',
  files=[('02038s_70255 — record card, Great House Farm (copy of Suggett 1988), 5 pages','https://www.walesher1974.org/her/app/php/herumd.php?group=GGAT&level=3&docid=301368873','created 16 Sep 2026 15:40 UTC; last modified 5 Oct 2026'),
         ('02038s_70256 — Sites and Monuments Record card, site 2038, 1 page','https://www.walesher1974.org/her/app/php/herumd.php?group=GGAT&level=3&docid=301368874','created 16 Sep 2026 15:29 UTC; last modified 5 Oct 2026'),
         ('02038s_70257 — South Wales Echo, 11 Feb 1989, “Battle of the rubble”, 1 page','https://www.walesher1974.org/her/app/php/herumd.php?group=GGAT&level=3&docid=301368875','created 16 Sep 2026 15:36 UTC; last modified 5 Oct 2026'),
         ('Archive number 6524751 scan, 16 pages (created 2012; online before 28 May 2026)','https://www.walesher1974.org/her/app/php/herumd.php?group=GGAT&level=3&docid=301361628','created 23 Nov 2012')],
  line='Not in the record’s sources on 29 May 2026; first appears 6 Oct 2026; files created 16 Sep 2026; requested 8 Sep 2026.'),
]
rows=list(csv.DictReader(open(FS+'/register.csv')))
base=[r for r in rows if r['source'].startswith('cited on') and not re.search(r'sion',r['url'],re.I)]
byinst={}
for r in base: byinst.setdefault(r['institution'],[]).append(r)
def first_req(r):
    m=re.search(r'first request (\d{4}-\d{2}-\d{2})',r['enquiry_dates']); return m.group(1) if m else ''
def ia_first(r):
    m=re.match(r'(\d{4}-\d{2}-\d{2}) \(earliest',r['first_seen_online']); return m.group(1) if m else ''
def label(r):
    u=r['url']; s=re.sub(r'[?#].*','',u.rstrip('/')).split('/')[-1] or u
    s=re.sub(r'[-_]+',' ',re.sub(r'\.(html?|aspx|php|pdf)$','',s))[:80]
    q=re.search(r'(watprn|id|ref|query|q)=([^&]+)',u)
    if q: s=(s+' '+q.group(2))[:90]
    if re.search(r'buckler|sion',s,re.I): s=urlparse(u).netloc+' record'
    return s
CSS="""<style>
.fs-wrap{max-width:54rem;margin:0 auto;padding:0 1rem}
.fs-hero{padding:7rem 0 1.2rem}.fs-kick{font-size:.72rem;letter-spacing:.22em;text-transform:uppercase;color:var(--muted,#9a9a9a);margin:0 0 .6rem}
.fs-hero h1{margin:0 0 .7rem;font-weight:300;letter-spacing:.08em;text-transform:uppercase}.fs-lead{color:var(--body,#cfcfcf);margin:0;max-width:40rem}
.fs-h{font-size:.72rem;letter-spacing:.18em;text-transform:uppercase;color:var(--muted,#9a9a9a);margin:2rem 0 .5rem;font-weight:500}
.fs-list{list-style:none;margin:0 0 1.5rem;padding:0;border-top:1px solid var(--line,#2a2a2a)}
.fs-list>li{border-bottom:1px solid var(--line,#2a2a2a)}
.fs-list summary{list-style:none;cursor:pointer;padding:.9rem .1rem;display:grid;grid-template-columns:1fr auto;gap:.2rem .8rem;align-items:baseline}
.fs-list summary::-webkit-details-marker{display:none}
.fs-t{color:#fff;font-weight:500;line-height:1.35;min-width:0}.fs-d{color:var(--muted,#9a9a9a);font-size:.82rem;white-space:nowrap}
.fs-line{grid-column:1/3;font-size:.86rem;color:var(--body,#d6d6d6)}
.fs-body{padding:.1rem .1rem 1.2rem;font-size:.9rem;color:var(--body,#d6d6d6);line-height:1.5}
.fs-body dl{display:grid;grid-template-columns:8.5rem 1fr;gap:.35rem .8rem;margin:.3rem 0 .8rem}.fs-body dt{color:var(--muted,#9a9a9a);font-size:.78rem;text-transform:uppercase;letter-spacing:.08em}
.fs-body dd{margin:0;min-width:0;overflow-wrap:anywhere}.fs-body a{color:#fff}
.fs-files{list-style:none;padding:0;margin:.3rem 0}.fs-files li{padding:.35rem 0;border-top:1px dashed var(--line,#2a2a2a)}.fs-files small{display:block;color:var(--muted,#9a9a9a)}
.fs-tbl{width:100%;border-collapse:collapse;font-size:.84rem}.fs-tbl th,.fs-tbl td{text-align:left;padding:.4rem .3rem;border-bottom:1px dashed var(--line,#2a2a2a);vertical-align:top}
.fs-tbl th{color:var(--muted,#9a9a9a);font-weight:500;font-size:.72rem;letter-spacing:.08em;text-transform:uppercase}.fs-tbl td a{color:#fff;overflow-wrap:anywhere}
.fs-note{font-size:.82rem;color:var(--muted,#9a9a9a);margin:1.2rem 0 3rem}.fs-note a{color:#fff}
@media(max-width:560px){.fs-body dl{grid-template-columns:1fr}.fs-tbl .hide-s{display:none}}
</style>"""
now=dt.datetime.utcnow()
P=[CSS,'<div class="fs-wrap"><header class="fs-hero"><p class="fs-kick">FCG · Record</p><h1>First appeared online</h1>',
 '<p class="fs-lead">When records about Great House Farm (Tŷ Mawr), Llandough first became publicly available online, beside dated evidence that they were not online earlier and the date each was first requested.</p></header>']
P.append('<h2 class="fs-h">First online after a request</h2><ul class="fs-list">')
for it in ITEMS:
    P.append(f'<li><details><summary><span class="fs-t">{e(it["title"])}</span><span class="fs-d">first online 6 Oct 2026</span><span class="fs-line">{e(it["line"])}</span></summary><div class="fs-body"><dl>')
    P.append(f'<dt>Holder</dt><dd>{e(it["inst"])}</dd>')
    al=f' <a href="{e(it["absent_link"])}" rel="noopener">archived copy</a>' if it['absent_link'] else ''
    P.append(f'<dt>Not online</dt><dd>{e(it["absent"])}{al}</dd>')
    P.append(f'<dt>First online</dt><dd>{e(it["first"])} <a href="{e(it["first_link"])}" rel="noopener">Internet Archive capture</a></dd>')
    P.append(f'<dt>Requested</dt><dd>{e(it["asked"])}</dd>')
    P.append('<dt>Replies</dt><dd>'+' · '.join(f'<a href="{e(u)}" rel="noopener">{e(d)}</a>' for d,u in HERMAIL)+f'<br>{e(it["note"])}</dd></dl>')
    P.append('<p class="fs-h" style="margin-top:.6rem">Files on the record</p><ul class="fs-files">')
    for t,u,m in it['files']: P.append(f'<li><a href="{e(u)}" rel="noopener">{e(t)}</a><small>File metadata: {e(m)}</small></li>')
    P.append('</ul></div></details></li>')
P.append('</ul>')
P.append(f'<h2 class="fs-h">Baseline · {len(base)} cited records, earliest independent copy</h2>')
P.append('<p class="fs-note" style="margin:.2rem 0 .8rem">The earliest Internet Archive capture is the oldest independent copy of a page found on the date shown. It is not the date the page was first published. A record with no capture has no independent copy yet; the archive at <a href="https://internetarchive.bucklerfamily.estate/">internetarchive.bucklerfamily.estate</a> keeps dated copies from now on.</p><ul class="fs-list">')
for inst in sorted(byinst):
    rs=sorted(byinst[inst],key=lambda r:(ia_first(r) or '9999',r['url']))
    fr=first_req(rs[0]); nn=sum(1 for r in rs if r['first_seen_online'].startswith('no Internet')); npend=sum(1 for r in rs if 'unavailable' in r['first_seen_online'])
    P.append(f'<li><details><summary><span class="fs-t">{e(inst)}</span><span class="fs-d">{len(rs)} records</span><span class="fs-line">'+(f'First requested {fd(fr)}. ' if fr else 'No request on file. ')+f'{nn} with no independent capture.</span></summary><div class="fs-body">')
    P.append('<table class="fs-tbl"><thead><tr><th>Record</th><th>Earliest capture</th><th class="hide-s">Latest capture</th></tr></thead><tbody>')
    for r in rs:
        f1=ia_first(r); m2=re.search(r'latest (\d{4}-\d{2}-\d{2})',r['first_seen_online'])
        cap=f'<a href="https://web.archive.org/web/{f1.replace("-","")}000000*/{e(r["url"])}" rel="noopener">{fd(f1)}</a>' if f1 else ('not yet read' if 'unavailable' in r['first_seen_online'] else 'none')
        P.append(f'<tr><td><a href="{e(r["url"])}" rel="noopener">{e(label(r))}</a></td><td>{cap}</td><td class="hide-s">{fd(m2.group(1)) if m2 and m2.group(1) else ""}</td></tr>')
    P.append('</tbody></table></div></details></li>')
P.append('</ul>')
P.append('<h2 class="fs-h">How this is checked</h2><div class="fs-body"><p>Every six hours a plain check reads the catalogues and publication pages of the bodies in this record (HER record pages on Archwilio, Coflein site 20182 and its archive list, The National Archives catalogue, GOV.UK search, Welsh Government FOI responses, Museum Wales collections, and the disclosure logs of councils, police and utilities where they are open to a plain fetch). New items are compared with this register and added here with the date first seen. Pages that a site’s robots.txt closes to automated reading are not fetched.</p>'
 f'<p>Data: <a href="/first-seen.json">first-seen.json</a>. Register built {now.day} {now.strftime("%b %Y")}. Version 1.0.0.</p></div>')
P.append('<p class="fs-note">Related: <a href="/">Clearance ranking</a> · <a href="/standard">Clearance standard</a> · <a href="https://internetarchive.bucklerfamily.estate/">Dated web archive</a> · <a href="https://watchtower.bucklerfamily.estate/">Watchtower</a></p></div>')
HOME=''.join(P)
DATA=json.dumps({'built':now.strftime('%Y-%m-%dT%H:%M:%SZ'),'first_online_after_request':[{k:v for k,v in it.items() if k!='absent_link' or v} for it in ITEMS],
  'baseline':[{'institution':r['institution'],'url':r['url'],'earliest_ia_capture':ia_first(r) or ('not yet read' if 'unavailable' in r['first_seen_online'] else 'none'),'first_request':first_req(r)} for r in base]},ensure_ascii=False)
vis=re.sub(r'<[^>]+>',' ',re.sub(r'(?s)<style>.*?</style>','',HOME))
bad=sorted({m.group(0) for m in BANNED.finditer(vis)}|{m.group(0) for m in BANNED.finditer(DATA)})
if bad: print('BANNED WORDS:',bad); sys.exit(2)
open(OUTJS,'w').write('// First appeared online — built by work/first-seen/build_fcg.py. — Sion\'s Tab agent\nexport const HOME = '+json.dumps(HOME,ensure_ascii=False)+';\nexport const DATA = '+json.dumps(DATA,ensure_ascii=False)+';\n')
print('ok', len(HOME), 'baseline', len(base), 'institutions', len(byinst), 'our0529_live', our_ok)
