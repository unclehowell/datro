#!/usr/bin/env python3
"""Render the FCG clearance pages from scores.json into worker/clearance.js. — Sion's Tab agent"""
import json, os, html, datetime as dt
HERE=os.path.dirname(os.path.abspath(__file__))
S=json.load(open(os.path.join(HERE,'scores.json')))
E=json.load(open(os.path.join(HERE,'events.json')))
R=S['rules']
def e(s): return html.escape(str(s or ''),quote=True)
def fd(iso): 
    d=dt.date.fromisoformat(iso); return f"{d.day} {d.strftime('%b %Y')}"
BANDCLS={"Cleared / Ally":"ok","Provisional":"pv","Under review":"ur","Quarantine":"qt"}
def pts(p): return ('+%d'%p) if p>0 else ('−%d'%abs(p) if p<0 else '0')
def src(x):
    a=[]
    if x.get('link'): a.append(f'<a href="{e(x["link"])}" rel="noopener">email</a>')
    if x.get('wayback'): a.append(f'<a href="{e(x["wayback"])}" rel="noopener">wayback</a>')
    if x.get('ev'): a.append(e(x['ev']))
    if x.get('ref') and not a: a.append(e(x['ref']))
    return ' · '.join(a) or 'record'
CSS="""<style>
.cl-wrap{max-width:54rem;margin:0 auto;padding:0 1rem}
.cl-hero{padding:7rem 0 1.4rem}
.cl-kick{font-size:.72rem;letter-spacing:.22em;text-transform:uppercase;color:var(--muted,#9a9a9a);margin:0 0 .6rem}
.cl-hero h1{margin:0 0 .7rem;font-weight:300;letter-spacing:.08em;text-transform:uppercase}
.cl-lead{color:var(--body,#cfcfcf);margin:0;max-width:40rem}
.cl-key{display:flex;flex-wrap:wrap;gap:.4rem .9rem;margin:1rem 0 0;font-size:.82rem;color:var(--muted,#9a9a9a)}
.cl-key b{font-weight:500;color:#fff}
.cl-list{list-style:none;margin:1.2rem 0 2rem;padding:0;border-top:1px solid var(--line,#2a2a2a)}
.cl-item{border-bottom:1px solid var(--line,#2a2a2a)}
.cl-item>details>summary{list-style:none;cursor:pointer;display:grid;grid-template-columns:2rem 1fr auto;gap:.2rem .7rem;align-items:center;padding:.95rem .1rem}
.cl-item>details>summary::-webkit-details-marker{display:none}
.cl-rank{color:var(--muted,#9a9a9a);font-size:.9rem}
.cl-name{color:#fff;font-weight:500;line-height:1.3;min-width:0}
.cl-score{font-size:1.55rem;font-weight:300;color:#fff;text-align:right;font-variant-numeric:tabular-nums;line-height:1}
.cl-score small{font-size:.7rem;color:var(--muted,#9a9a9a);margin-left:.15rem}
.cl-sub{grid-column:2/4;display:flex;flex-wrap:wrap;gap:.35rem .6rem;align-items:center}
.cl-band{font-size:.66rem;letter-spacing:.16em;text-transform:uppercase;padding:.18rem .45rem;border:1px solid}
.cl-band.ok{color:#5bd68a;border-color:#5bd68a}.cl-band.pv{color:#f2c94c;border-color:#f2c94c}.cl-band.ur{color:#8fb3ff;border-color:#8fb3ff}.cl-band.qt{color:#ff6b6b;border-color:#ff6b6b}
.cl-ic{font-size:.95rem;letter-spacing:.05em;white-space:normal}
.cl-ic span{margin-right:.35rem;white-space:nowrap}
.cl-ic sub{font-size:.62rem;color:var(--muted,#9a9a9a);vertical-align:baseline;margin-left:.05rem}
.cl-ten{font-size:1rem}
.cl-body{padding:.2rem .1rem 1.3rem}
.cl-bar{position:relative;height:6px;background:#1c1c1c;margin:.4rem 0 .35rem}
.cl-bar i{position:absolute;left:0;top:0;bottom:0;background:#fff}
.cl-bar b{position:absolute;top:-3px;bottom:-3px;width:1px;background:#666}
.cl-scale{display:flex;justify-content:space-between;font-size:.66rem;color:var(--muted,#9a9a9a);margin-bottom:.9rem}
.cl-sum{font-size:.88rem;color:var(--body,#cfcfcf);margin:.2rem 0 .8rem}
.cl-h{font-size:.7rem;letter-spacing:.18em;text-transform:uppercase;color:var(--muted,#9a9a9a);margin:1rem 0 .4rem;font-weight:500}
.cl-led{list-style:none;margin:0;padding:0}
.cl-led li{display:grid;grid-template-columns:4.6rem 2.6rem 1fr;gap:.15rem .5rem;padding:.55rem 0;border-top:1px dashed var(--line,#2a2a2a);font-size:.9rem;line-height:1.45}
.cl-led .d{color:var(--muted,#9a9a9a);font-size:.8rem}
.cl-led .p{text-align:right;font-variant-numeric:tabular-nums;color:#fff}
.cl-led .p.m{color:#ff8a8a}.cl-led .p.g{color:#7fe0a3}
.cl-led .t{color:var(--body,#d6d6d6);min-width:0;overflow-wrap:anywhere}
.cl-led .s{display:block;font-size:.78rem;color:var(--muted,#9a9a9a);margin-top:.15rem}
.cl-led .s a{color:#fff}
.cl-req{list-style:none;margin:0;padding:0}
.cl-req li{padding:.45rem 0;border-top:1px dashed var(--line,#2a2a2a);font-size:.88rem;color:var(--body,#d6d6d6)}
.cl-req .st{font-size:.66rem;letter-spacing:.12em;text-transform:uppercase;padding:.1rem .35rem;border:1px solid var(--line,#444);margin-right:.35rem;color:#fff}
.cl-req .st.overdue,.cl-req .st.late,.cl-req .st.unanswered{border-color:#ff6b6b;color:#ff8a8a}
.cl-note{font-size:.82rem;color:var(--muted,#9a9a9a);margin:1.5rem 0 3rem}
.cl-note a{color:#fff}
.cl-tbl{width:100%;border-collapse:collapse;font-size:.9rem}.cl-tbl td,.cl-tbl th{border-bottom:1px solid var(--line,#2a2a2a);padding:.5rem .3rem;text-align:left;vertical-align:top;color:var(--body,#d6d6d6)}
.cl-tbl th{font-size:.68rem;letter-spacing:.14em;text-transform:uppercase;color:var(--muted,#9a9a9a);font-weight:500}
.cl-tbl td.n{text-align:right;white-space:nowrap;color:#fff}
.cl-prose p,.cl-prose li{color:var(--body,#d6d6d6);line-height:1.6}.cl-prose h2{font-weight:300;letter-spacing:.06em;text-transform:uppercase;font-size:1.15rem;margin:2rem 0 .7rem;color:#fff}
@media (max-width:480px){.cl-hero{padding-top:8.4rem}.cl-led li{grid-template-columns:3.9rem 2.4rem 1fr;font-size:.86rem}.cl-score{font-size:1.35rem}}
</style>"""
FOOTNOTE='<p class="cl-note">Scores institutions only, from dated correspondence; never individuals. <a href="/standard">How scores are worked out →</a></p>'
def icons(ic, ten):
    order=[v['icon'] for v in R.values() if v['kind']=='minus']
    seen=[]; out=[]
    for k in order:
        if k in ic and k not in seen:
            seen.append(k); n=ic[k]
            out.append(f'<span data-ghf-keep title="{e(", ".join(v["label"] for v in R.values() if v["icon"]==k))}">{k}{"<sub>×%d</sub>"%n if n>1 else ""}</span>')
    t='<span class="cl-ten" data-ghf-keep title="10/10 reply">🫶🤝✌️</span>' if ten else ''
    return f'<span class="cl-ic">{"".join(out)}{t}</span>'
def card(x):
    b=BANDCLS[x['band']]; pct=x['score']/10
    led=[]
    for l in sorted(x['ledger'],key=lambda l:l['date']):
        p=l['pts']; cls='m' if p<0 else ('g' if p>0 else '')
        note=f' <em>({e(l["note"])})</em>' if l.get('note') else ''
        amb=' <em>(to confirm)</em>' if l.get('ambiguous') else ''
        led.append(f'<li><span class="d">{fd(l["date"])}</span><span class="p {cls}">{pts(p)}</span><span class="t"><span data-ghf-keep>{R[l["rule"]]["icon"]}</span> {e(l["text"])}{note}{amb}<span class="s">{e(R[l["rule"]]["label"])} · {src(l)}</span></span></li>')
    reqs=[]
    for q in sorted(x['requests'],key=lambda q:q['due']):
        if q['status'] in ('within deadline','open','clock paused'):
            reqs.append(f'<li><span class="st">{e(q["status"])}</span>{e(q["ref"])}: {e(q["text"])}. Due {fd(q["due"])}.'+(f' <a href="{e(q["link"])}" rel="noopener">email</a>' if q.get('link') else '')+'</li>')
    reqhtml=(f'<p class="cl-h">Clocks still running</p><ul class="cl-req">{"".join(reqs)}</ul>' if reqs else '')
    return f"""<li class="cl-item" id="{e(x['id'])}"><details><summary><span class="cl-rank">{x['rank']}</span><span class="cl-name">{e(x['name'])}</span><span class="cl-score">{x['score']}<small>/1000</small></span><span class="cl-sub"><span class="cl-band {b}">{e(x['band'])}</span>{icons(x['icons'],x['ten_out_of_ten'])}</span></summary>
<div class="cl-body"><div class="cl-bar" aria-hidden="true"><i style="width:{pct:.1f}%"></i><b style="left:50%"></b><b style="left:70%"></b><b style="left:90%"></b></div><div class="cl-scale"><span>0</span><span>500 start</span><span>700</span><span>900 cleared</span><span>1000</span></div>
<p class="cl-sum">Started at 500. Points added {pts(x['plus'])}; points deducted {pts(x['minus'])}. {len(x['ledger'])} dated item{'s' if len(x['ledger'])!=1 else ''}.</p>
<p class="cl-h">Every point change</p><ul class="cl-led">{''.join(led) or '<li><span class="d">—</span><span class="p">0</span><span class="t">No scored item yet.</span></li>'}</ul>{reqhtml}</div></details></li>"""
inst=S['institutions']
cleared=sum(1 for x in inst if x['score']>=900)
home=CSS+f"""<div class="cl-wrap"><header class="cl-hero"><p class="cl-kick">FCG · Security clearance</p><h1>Clearance</h1>
<p class="cl-lead">Institutions ranked on how they answered requests for the Great House Farm record. All start at 500 of 1000. Cleared at 900. Tap a name for every point and its source.</p>
<p class="cl-key"><span><b>{cleared}</b> of {len(inst)} cleared</span><span>Scored {fd(S['scored_on'])}</span><span><span data-ghf-keep>⏰</span> late · <span data-ghf-keep>🗑️</span> not held · <span data-ghf-keep>🔥</span> lost · <span data-ghf-keep>💲</span> cost/fee · <span data-ghf-keep>🔁</span> repeat refusal · <span data-ghf-keep>⚠️</span> partial · <span data-ghf-keep>💣</span> contradiction · <span data-ghf-keep>🚧</span> diverted · <span data-ghf-keep>📭</span> no reply · <span data-ghf-keep>🔒</span> exemption · <span data-ghf-keep>🌀</span> asked again · <span data-ghf-keep>🫶🤝✌️</span> 10/10 reply</span></p></header>
<ol class="cl-list">{''.join(card(x) for x in inst)}</ol>{FOOTNOTE}</div>"""
rows=''.join(f'<tr><td data-ghf-keep>{v["icon"]}</td><td>{e(v["label"])}</td><td class="n">{pts(v["pts"])}{" /day" if v.get("per_day") else ""}</td></tr>' for v in R.values())
bands=''.join(f'<tr><td>{e(b)}</td><td class="n">{t}+</td></tr>' if t>0 else f'<tr><td>{e(b)}</td><td class="n">below 500</td></tr>' for t,b in S['bands'])
standard=CSS+f"""<div class="cl-wrap cl-prose"><header class="cl-hero"><p class="cl-kick">FCG · Security clearance</p><h1>The standard</h1>
<p class="cl-lead">Clearance measures how an institution has handled requests for records about Great House Farm (Tŷ Mawr), Llandough: prompt, full, free and straight answers score; delay, partial answers, “not held” with no record, cost and repeat refusals, fees, diversion, contradiction and silence cost points.</p></header>
<h2>Scale</h2><p>Every institution starts at 500 of 1000 (held between 0 and 1000). The bar is high: from 500, clearance needs a net +400, for example ten on-time, fully disclosed replies with nothing deducted.</p>
<table class="cl-tbl"><tr><th>Band</th><th>Score</th></tr>{bands}</table>
<h2>Point rules</h2><p>Fixed rules. Points move only on a dated email or letter; each change on the ranking shows its date and a link to the message in the case-mail archive and its wayback copy where one exists. No points are given for opinion.</p>
<table class="cl-tbl"><tr><th></th><th>Rule</th><th>Points</th></tr>{rows}</table>
<p>Overdue points stop at −150 per request. Fee quotes stop at −50 per institution. A reply draws at most one deduction per rule (39 “not held” answers in one reply count once).</p>
<h2>10/10 reply <span data-ghf-keep>🫶🤝✌️</span></h2><p>On time, within half the statutory period, full disclosure, and nothing deducted on the same request or day.</p>
<h2>Statutory clocks</h2><ul><li>FOI (FOIA s.10) and EIR (reg. 5(2)): 20 working days.</li><li>FOI internal review: 20 working days (ICO guidance; 40 only in exceptional cases).</li><li>EIR internal review (reg. 11(4)): 40 working days.</li><li>Subject access (UK GDPR art. 12(3)): one calendar month.</li><li>Letters and preservation notices: 20 working days for a reply.</li><li>Working days exclude weekends and bank holidays in England and Wales; day 1 is the first working day after receipt. A fair clarification pauses the clock. Overdue points grow each working day a reply is late.</li></ul>
<h2>Method</h2><ul><li>Record: the per-institution forensic assessments of 21 Oct 2026, the correspondence register (fee notes) and the clarification ledger. Automated mailbox categories are context only and never scored on their own.</li><li>An item whose date or meaning is uncertain is not scored, or is marked “to confirm”.</li><li>Requests still inside their deadline score nothing until answered or overdue.</li><li>Re-scored every day at midday from new case mail. Data and scorer: <a href="/clearance.json">clearance.json</a>.</li></ul>
{FOOTNOTE}</div>"""
data=json.dumps(S,ensure_ascii=False)
os.makedirs(os.path.join(HERE,'worker'),exist_ok=True)
js="// FCG clearance pages, generated by work/fcg/build_site.py from scores.json — Sion's Tab agent\n"
js+="export const HOME = "+json.dumps(home,ensure_ascii=False)+";\nexport const STANDARD = "+json.dumps(standard,ensure_ascii=False)+";\nexport const DATA = JSON.stringify("+json.dumps(S,ensure_ascii=False,separators=(',',':'))+");\nexport const SCORED_ON = "+json.dumps(S['scored_on'])+";\n"
open(os.path.join(HERE,'worker','clearance.js'),'w').write(js)
print('clearance.js',len(js))
