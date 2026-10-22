#!/usr/bin/env python3
"""Write the draft damages schedule for offline lawyer review:
/home/user/tab/files/oldbill/damages-schedule-draft.md and .pdf, from the same data the site uses (damages.py).
Usage: python3 export.py   (after build.py)"""
import json, pathlib, subprocess, html, re, datetime, os
import damages as DMG
OUT = pathlib.Path('/home/user/tab/files/oldbill'); OUT.mkdir(parents=True, exist_ok=True)
D = DMG.schedule()
def m(v): return '£{:,.0f}'.format(v)
def tri(v): return '%s / **%s** / %s' % (m(v['low']), m(v['mid']), m(v['high']))
def srcs(ss): return '; '.join(('[%s](%s)' % (s['title'], s['url'])) if s.get('url') else s['title'] for s in ss)
L = []
w = L.append
w('# Great House Farm (Tŷ Mawr): draft damages schedule')
w('')
w('*Draft for legal review — a starting schedule for negotiation, not an assessment by a court.*')
w('')
w('Prepared %s. Live version with the double-comb chart: https://oldbill.bucklerfamily.estate/' % datetime.date.today().strftime('%-d %B %Y'))
w('')
w('## 1. Summary')
w('')
w('| Measure | Low | Mid | High |'); w('|---|--:|--:|--:|')
w('| Gains of the parties (disgorgement / account of profits) | %s | %s | %s |' % (m(D['totals']['gains']['low']), m(D['totals']['gains']['mid']), m(D['totals']['gains']['high'])))
w('| Losses of the family (compensation) | %s | %s | %s |' % (m(D['totals']['losses']['low']), m(D['totals']['losses']['mid']), m(D['totals']['losses']['high'])))
w('| Restitutionary Brief v3, IV.A (mid-case) | %s | %s | %s |' % (m(D['brief']['range']['lo']), m(D['brief']['range']['mid']), m(D['brief']['range']['hi'])))
w('')
w('The two measures are alternatives and are never added together: the family elects the higher one against each party (section 5). Interest: %s.' % D['interest_rate'])
w('')
w('## 2. Who gained (upper comb)')
w('')
for g in D['gains']:
    w('### %s — %s' % (g['party_name'], g['what']))
    w('')
    w('- Low / mid / high: %s%s' % (tri(g['v']), ' (estimate)' if g.get('estimate') else ''))
    w('- Method: %s' % g['method'])
    w('- Inputs: ' + '; '.join('%s: %s' % (a, b) for a, b in g['inputs']))
    for f, s in g['facts']: w('- Fact: %s (%s)' % (f, srcs([s])))
    w('')
w('## 3. What the family lost (lower comb)')
w('')
for l in D['losses']:
    w('### %s' % l['head'])
    w('')
    w('- Low / mid / high: %s%s' % (tri(l['v']), ' (estimate)' if l.get('estimate') else ''))
    if l.get('causation'): w('- Causation: %s' % l['causation'])
    w('- Method: %s' % l['method'])
    w('- Inputs: ' + '; '.join('%s: %s' % (a, b) for a, b in l['inputs']))
    for f, s in l['facts']: w('- Fact: %s (%s)' % (f, srcs([s])))
    w('- Claim against: ' + ', '.join('%s %d%%' % (D['parties'][k]['name'], v) for k, v in l['alloc'].items()))
    w('- Legal basis: %s' % l['legal'])
    w('')
w('## 4. Two scenarios and the reconciliation')
w('')
w('| Brief v3 head | Brief v3 basis | Brief v3 £ | Analyst mid £ |'); w('|---|---|--:|--:|')
for h in D['brief']['heads']: w('| %s | %s | %s | %s |' % (h['head'], h['basis'], m(h['amount']), m(h['analyst_mid'])))
w('')
for p in D['reconciliation']: w(p); w('')
for h in D['brief']['heads']: w('- **%s:** %s' % (h['head'], h['gap_note']))
w('')
w('## 5. Negotiation schedule')
w('')
w('| Claim against | For what | Share | Low / mid / high £ | Legal basis | Evidence |'); w('|---|---|--:|--:|---|---|')
for k, p in D['parties'].items():
    rs = [r for r in D['rows'] if r['party'] == k]
    if not rs: continue
    c = p['compensation']; dg = p['disgorgement']
    w('| **%s** | **Compensation share%s** | | **%s** | %s | |' % (p['name'], (', gain %s mid' % m(dg['mid'])) if dg else '', tri(c).replace('**', ''), p['route']))
    for r in rs:
        w('| %s | %s%s | %d%% | %s | %s | %s |' % (p['short'], r['what'], ' (causation %s)' % r['causation'] if r['causation'] else '', r['share'], tri(r['v']).replace('**', ''), r['legal'], srcs(r['evidence'])))
w('')
w('Opening figure against each party: the higher of its compensation share and its gain.')
w('')
for k, p in D['parties'].items():
    dg = p['disgorgement']; c = p['compensation']
    if c['mid'] or dg: w('- %s: %s' % (p['name'], m(max(c['mid'], dg['mid'] if dg else 0))))
w('')
w('## 6. The legal test for setting aside the 1987 judgment (verbatim)')
w('')
w('> “In my view, it ought now to be recognised that where it can be shown that a judgment has been obtained by fraud, and where no allegation of fraud had been raised at the trial which led to that judgment, a requirement of reasonable diligence should not be imposed on the party seeking to set aside the judgment.” — Takhar v Gracefield Developments Ltd [2019] UKSC 13, para 54')
w('')
w('> “The principles are, briefly: first, there has to be a ‘conscious and deliberate dishonesty’ in relation to the relevant evidence given, or action taken, statement made or matter concealed, which is relevant to the judgment now sought to be impugned. Secondly, the relevant evidence, action, statement or concealment (performed with conscious and deliberate dishonesty) must be ‘material’. ‘Material’ means that the fresh evidence that is adduced after the first judgment has been given is such that it demonstrates that the previous relevant evidence, action, statement or concealment was an operative cause of the court’s decision to give judgment in the way it did. Put another way, it must be shown that the fresh evidence would have entirely changed the way in which the first court approached and came to its decision. Thus the relevant conscious and deliberate dishonesty must be causative of the impugned judgment being obtained in the terms it was. Thirdly, the question of materiality of the fresh evidence is to be assessed by reference to its impact on the evidence supporting the original decision, not by reference to its impact on what decision might be made if the claim were to be retried on honest evidence.” — RBS v Highland Financial Partners [2013] EWCA Civ 328, para 106, adopted in Takhar, para 56')
w('')
w('Limitation Act 1980 s.32(1)(b): time runs from discovery where a fact relevant to the right of action was deliberately concealed. Human Rights Act 1998 claims reach only acts after 2 October 2000.')
w('')
w('## 7. Index values used (read 22 Oct 2026)')
w('')
I = D['indices']
w('- ONS composite price index CDKO: 1938 %s, 1969 %s, Sep 2026 %s' % (I['cdko_1938'], I['cdko_1969'], I['cdko_2026']))
w('- ONS CPI D7BT: 1989 %s, 1991 %s, Dec 1993 %s, 1996 %s, 2011 %s, Sep 2026 %s' % (I['cpi_1989'], I['cpi_1991'], I['cpi_dec1993'], I['cpi_1996'], I['cpi_2011'], I['cpi_now']))
w('- UK HPI, Vale of Glamorgan: Jan 1995 %s, Jul 2026 %s' % (I['hpi_vale_jan1995'], I['hpi_vale_jul2026']))
w('- Mean Bank Rate Dec 1988 – Oct 2026: %s%% (estimate from annual averages)' % D['bank_mean'])
w('- Judicial College Guidelines, 17th ed.: psychiatric damage generally; leg amputation brackets from the 16th ed. uplifted 22%')
w('')
w('---')
w('© the Williams-Buckler family of Tŷ Mawr · Licence: https://bucklerfamily.estate/licence/')
md = '\n'.join(L) + '\n'
(OUT / 'damages-schedule-draft.md').write_text(md)
import markdown
body = markdown.markdown(md, extensions=['tables'])
css = """body{font-family:Georgia,'Times New Roman',serif;font-size:10.5pt;line-height:1.38;color:#111;margin:0}
h1{font-size:19pt;margin:0 0 6pt}h2{font-size:14pt;margin:16pt 0 6pt;border-bottom:1px solid #999}h3{font-size:11.5pt;margin:11pt 0 3pt}
table{border-collapse:collapse;width:100%;font-size:8.6pt;margin:6pt 0}td,th{border:1px solid #bbb;padding:3pt 4pt;vertical-align:top}th{background:#eee}
ul{margin:2pt 0 4pt 14pt;padding:0}li{margin:1pt 0}blockquote{margin:6pt 12pt;font-size:9.5pt;color:#333;border-left:2px solid #999;padding-left:8pt}a{color:#1b4f9c;word-break:break-word}
p em{background:#fff6c2;padding:2pt 4pt}"""
hp = OUT / '_schedule.html'
hp.write_text('<!doctype html><meta charset="utf-8"><style>%s</style>%s' % (css, body))
js = """const {chromium}=require('/home/user/node_modules/playwright-core');(async()=>{const b=await chromium.launch({executablePath:process.env.HOME+'/.cache/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-linux64/chrome-headless-shell'});const p=await b.newPage();await p.goto('file://%s');await p.pdf({path:'%s',format:'A4',margin:{top:'16mm',bottom:'16mm',left:'14mm',right:'14mm'},displayHeaderFooter:true,headerTemplate:'<span></span>',footerTemplate:'<div style="font-size:7pt;width:100%%;text-align:center;color:#666">Draft for legal review · page <span class=pageNumber></span> of <span class=totalPages></span></div>'});await b.close()})();""" % (hp, OUT / 'damages-schedule-draft.pdf')
jp = OUT / '_pdf.cjs'; jp.write_text(js)
r = subprocess.run(['timeout', '-k', '5', '110', 'node', str(jp)], capture_output=True, text=True)
os.remove(jp); os.remove(hp)
print(r.returncode, r.stderr[-300:], (OUT / 'damages-schedule-draft.pdf').stat().st_size, len(md))
