#!/usr/bin/env python3
"""Build the 22 October 2026 meeting toolkit from content.py.

Release note: generated deliverables must be rebuilt from the latest branch tip;
do not merge generated PDF files during concurrent CI runs.

Outputs (all in this folder):
  index.html          the skim-first website
  pack.html           the printable meeting pack (source of the PDF)
  meeting-pack.pdf    the pack, for the Clerk (needs: pip install playwright; playwright install chromium)
  meeting-script.txt  the read-aloud statement as plain text

Run:  python3 build.py            (all outputs)
      python3 build.py --no-pdf   (skip the PDF)
"""
import html, os, sys
from content import *

HERE = os.path.dirname(os.path.abspath(__file__))
e = html.escape

FONT_CSS = """
@font-face{font-family:"Archivo";src:url(fonts/archivo-latin-wdth-normal.woff2) format("woff2-variations"),url(fonts/archivo-latin-wdth-normal.woff2) format("woff2");font-weight:100 900;font-stretch:62% 125%;font-display:swap;unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
@font-face{font-family:"Archivo";src:url(fonts/archivo-latin-ext-wdth-normal.woff2) format("woff2-variations"),url(fonts/archivo-latin-ext-wdth-normal.woff2) format("woff2");font-weight:100 900;font-stretch:62% 125%;font-display:swap;unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF}
"""

TOKENS = """
:root{
  --slate:#26313a;   /* Welsh slate */
  --slate-2:#34414b;
  --lime:#eef1ee;    /* limewash */
  --white:#ffffff;
  --red:#c8102e;     /* the dragon's red */
  --moss:#2f5d46;
  --stone:#a7aa9d;   /* pennant stone */
  --ink:#161c21;
  --muted:#5b6670;
  --rule:#d5dad6;
  --display:"Archivo","Arial Narrow",Arial,sans-serif;
  --text:"Archivo",Arial,sans-serif;
  --max:1160px;
}
"""


def label(kind, small=False):
    name, desc = LABELS[kind]
    return f'<span class="tag tag-{kind}" title="{e(desc)}">{e(name)}</span>'


# ------------------------------------------------------------------ website
def site_v1():
    asks = "".join(f"""
      <details class="row">
        <summary><span class="num">{i:02d}</span><span class="row-h">{e(h)}</span><span class="row-l">{e(line)}</span><span class="plus" aria-hidden="true"></span></summary>
        <div class="more">
          <p class="why">{e(why)}</p>
          <p class="resolution"><span>Draft resolution</span>{e(res)}</p>
        </div>
      </details>""" for i, (h, line, res, why) in enumerate(ASKS, 1))

    order = ""
    for i, (when, title, line, detail) in enumerate(ORDER):
        inner = "".join(f"<li>{e(d)}</li>" for d in detail)
        body = f'<div class="more"><ul>{inner}</ul></div>' if detail else ""
        tag = "details" if detail else "div"
        summ_open, summ_close = ("<summary>", "</summary>") if detail else ('<div class="static">', "</div>")
        order += f"""
      <{tag} class="step{' step-main' if when == 'Item 10' else ''}">
        {summ_open}<span class="when">{e(when)}</span><span class="step-h">{e(title)}</span><span class="step-l">{e(line)}</span>{'<span class="plus" aria-hidden="true"></span>' if detail else ''}{summ_close}
        {body}
      </{tag}>"""

    pillars = "".join(f"""
      <details class="pillar">
        <summary><span class="pillar-k">{e(k)}</span><span class="pillar-h">{e(h)}</span><span class="pillar-l">{e(line)}</span><span class="readmore">Read more</span></summary>
        <ul class="more">{''.join(f'<li>{e(x)}</li>' for x in pts)}</ul>
      </details>""" for k, h, line, pts in PILLARS)

    tiles = "".join(f"""
      <details class="tile">
        <summary><span class="tile-big">{e(big)}</span><span class="tile-h">{e(h)}</span><span class="tile-l">{e(line)}</span><span class="readmore">Read more</span></summary>
        <div class="more"><p>{e(d)}</p>{label(lab)}</div>
      </details>""" for big, h, line, d, lab in TILES)

    swaps = "".join(f"""
      <li class="swap"><s class="said">{e(a)}</s><span class="truth">{e(b)} {label(lab)}</span></li>""" for a, b, lab in SWAPS)

    court = "".join(f"<li>{e(p)}</li>" for p in COURT_POINTS)

    wall_rows = ""
    for name, rings, status in WALL:
        segs = "".join(f'<i class="{"on" if n in rings else ""}" title="{e(RINGS[n-1])}"></i>' for n in range(1, 9))
        hl = " wall-us" if name.startswith("Llandough") else ""
        wall_rows += f'<li class="wall-row{hl}"><span class="wall-name">{e(name)}</span><span class="rings" aria-label="{len(rings)} of 8 stages opened">{segs}</span><span class="wall-status">{e(status)}</span></li>'
    opened = sum(len(r) for _, r, _ in WALL)
    ring_key = "".join(f"<li><b>{n}</b> {e(r)}</li>" for n, r in enumerate(RINGS, 1))

    counts = "".join(f'<li><span class="c-big">{e(n)}</span><span class="c-l">{e(l)}</span><span class="c-src">{e(src)}</span></li>' for n, l, src in COUNTS)
    known = "".join(f"""
      <details class="row known">
        <summary><span class="num">{i:02d}</span><span class="row-h">{e(h)}</span><span class="row-l">{e(line)}</span><span class="plus" aria-hidden="true"></span></summary>
        <div class="more"><p>{e(d)}</p><p class="ref">{label(lab)} Wiki: {e(ref)}</p></div>
      </details>""" for i, (h, line, d, lab, ref) in enumerate(KNOWN, 1))
    withheld = "".join(f'<li><span class="wh-b">{e(b)}</span><span class="wh-p">{e(p)}</span></li>' for b, p, lab in WITHHELD)
    risks = "".join(f'<li><span class="risk-h">{e(h)}</span><span class="risk-l">{e(l)}</span></li>' for h, l in RISKS)
    def _li(items):
        return "".join(f"<li>{e(t)} {label(k)}</li>" for t, k in items)
    brief = ""
    for c in BRIEF:
        cols = ""
        if c["record"]:
            cols += f'<div class="cmp-col"><h4>On the record</h4><ul>{_li(c["record"])}</ul></div>'
        if c["tested"]:
            cols += f'<div class="cmp-col"><h4>Still being tested</h4><ul>{_li(c["tested"])}</ul></div>'
        if c.get("against"):
            cols += f'<div class="cmp-col cmp-against"><h4>What cuts against us</h4><ul>{_li(c["against"])}</ul></div>'
        q, a = c["if_asked"]
        brief += f"""
      <details class="cmp" id="{c['id'].lower()}">
        <summary><span class="cmp-id">{e(c['id'])}</span><span class="cmp-t">{e(c['title'])}</span><span class="cmp-say">{e(c['say'])}</span><span class="plus" aria-hidden="true"></span></summary>
        <div class="more cmp-body">{cols}
          <p class="cmp-ask"><b>If asked {e(q)}</b> {e(a)}</p>
          <p class="ref">Evidence: {e(' · '.join(c['refs']))}</p>
        </div>
      </details>"""
    council = "".join(f"<li><b>{e(d)}</b><span>{e(t)}</span></li>" for d, t in COUNCIL_CASE)
    regimes = "".join(f'<div class="regime"><span class="regime-k">{e(k)}</span><span class="regime-n">{e(n)}</span><p>{e(t)}</p></div>' for k, n, t in REGIMES)

    statement = "".join(f"<p>{e(p)}</p>" for p in STATEMENT)
    rules = "".join(f"<li><b>{e(a)}</b> {e(b)}</li>" for a, b in MIC_RULES)

    sources = "".join(
        f'<li>{"<a href=\"%s\" rel=\"noopener\">%s</a>" % (e(u), e(t)) if u else e(t)}</li>' for t, u in SOURCES)
    keys = "".join(f"<li>{label(k)} {e(d)}</li>" for k, (n, d) in LABELS.items())
    breath = "".join(f'<li><span class="b-line">{e(a)}</span><span class="b-note">{e(b)}</span></li>' for a, b in BREATH)
    commitments = "".join(f"<li>{e(c)}</li>" for c in COMMITMENTS)

    return f"""<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Tŷ Mawr at Council</title>
<meta name="description" content="Meeting toolkit for Llandough Community Council, 22 October 2026: Great House Farm / Tŷ Mawr. What to raise, in what order, and the pack for the Clerk.">
<meta property="og:title" content="Preserving our identity: Tŷ Mawr at Llandough Community Council">
<meta property="og:description" content="320 years at home. Gone before breakfast. 38 years without a voice. The meeting toolkit for 22 October 2026.">
<meta property="og:image" content="img/tymawr-29-july-1988.jpg">
<meta name="theme-color" content="#26313a">
<link rel="preload" href="fonts/archivo-latin-wdth-normal.woff2" as="font" type="font/woff2" crossorigin>
<style>{FONT_CSS}{TOKENS}{SITE_CSS}</style>
<script src="https://bucklerfamily.estate/ghf-lang/ghf-lang.js" defer></script>
<script src="https://bucklerfamily.estate/ebook/cta.js" defer></script>
</head>
<body>
<a class="skip" href="#brief">Skip to the briefing</a>
<header class="nav">
  <div class="nav-in">
    <a class="brand" href="#top">Tŷ Mawr <span>at Council</span></a>
    <nav class="links" aria-label="Sections">
      <a href="#brief">The briefing</a><a href="#ask">The ask</a><a href="#order">Running order</a><a href="#story">The story</a><a href="#wall">The wall</a><a href="#risks">The risks</a><a href="#mic">At the mic</a><a href="{WIKI}/" target="_blank" rel="noopener noreferrer">Evidence Wiki ↗</a>
    </nav>
    <button class="toggle" type="button" data-expand>Open everything</button>
    <a class="btn-red" href="meeting-pack.pdf" download>Download PDF</a>
  </div>
</header>

<main id="top">
<section class="hero">
  <div class="hero-text">
    <p class="when-line"><span>{e(MEETING['body'])}</span><span>{e(MEETING['date'])}, {e(MEETING['time'])}</span></p>
    <h1>{e(HERO['title'])}</h1>
    <p class="lede">{e(HERO['lede'])}</p>
    <div class="ctas">
      <a class="btn-red big" href="meeting-pack.pdf" download>Download the meeting pack</a>
      <a class="btn-line" href="#brief">Read the briefing</a>
      <a class="btn-line" href="{WIKI}/" target="_blank" rel="noopener noreferrer">Read the evidence Wiki ↗</a>
    </div>
  </div>
  <figure class="hero-photo">
    <img src="img/tymawr-29-july-1988.jpg" alt="Tŷ Mawr: a two-storey limewashed stone farmhouse with three chimneys behind a rubble-stone wall, under a dark sky" width="1110" height="763">
    <figcaption>{e(HERO['photo_caption'])}</figcaption>
  </figure>
</section>

<section class="breath" aria-label="The case in one breath">
  <ol>{breath}</ol>
</section>

<section class="sec" id="brief">
  <div class="sec-head">
    <h2>The briefing.</h2>
    <p>{e(BRIEF_INTRO)}</p>
  </div>
  <div class="cmps">{brief}</div>
  <div class="threshold-box">
    <p>{e(THRESHOLD)}</p>
    <ul class="counts">{counts}</ul>
  </div>
</section>

<section class="sec" id="ask">
  <div class="sec-head">
    <h2>Item 10 is too small for this.</h2>
    <p>{e(ASK_INTRO)}</p>
  </div>
  <div class="rows">{asks}</div>
  <p class="aside">Not asked: for the Council to decide ownership, fraud or whether any court was right. Those belong to courts and regulators. The Council is asked to put the matter on record and use its own powers.</p>
  <div class="mission">
    <p class="mission-q">“{e(MISSION)}.”</p>
    <p class="mission-by">The Council's mission statement, and its four commitments:</p>
    <ul>{commitments}</ul>
  </div>
</section>

<section class="sec sec-slate" id="order">
  <div class="sec-head">
    <h2>The running order.</h2>
    <p>Where each point fits on the published agenda, from now until the minutes.</p>
  </div>
  <div class="steps">{order}</div>
</section>

<section class="sec" id="story">
  <div class="sec-head">
    <h2>The story they told.</h2>
    <p>Contemporary coverage framed the dispute as an eviction. These articles show what was reported at the time; they do not prove every claim in print.</p>
  </div>
  <ul class="swaps">{swaps}</ul>
  <figure class="barn">
    <img src="img/tymawr-barn-29-july-1988.jpg" alt="The stone barn at Great House Farm, 1988" width="1109" height="763">
    <figcaption>The barn at Great House Farm, 29 July 1988 (Cadw). Peerless Jim Driscoll's first fight is recorded in a barn here.</figcaption>
  </figure>
</section>

<section class="sec sec-slate" id="wall">
  <div class="sec-head">
    <h2>The wall.</h2>
    <p>Twenty organisations asked for records over eighteen months. Eight steps each before a request is exhausted. {opened} of 160 steps taken; none has reached a tribunal.</p>
  </div>
  <h3 class="sub-h">Where disclosure stands.</h3>
  <ul class="withheld">{withheld}</ul>
  <p class="aside light">{e(WITHHELD_NOTE)}</p>
  <h3 class="sub-h">Every request, every step.</h3>
  <ol class="ring-key">{ring_key}</ol>
  <ul class="wall">{wall_rows}</ul>
  <p class="aside light">{e(WALL_NOTE)}</p>
  <details class="council">
    <summary><span class="court-h">This Council's own file.</span><span class="court-l">A cost refusal that does not add up, reviewed by the person who made it.</span><span class="readmore">Read more</span></summary>
    <div class="more"><ol class="dates">{council}</ol></div>
  </details>
  <details class="council">
    <summary><span class="court-h">Three rights, not one.</span><span class="court-l">Freedom of information, environmental information and your own data are separate laws.</span><span class="readmore">Read more</span></summary>
    <div class="more regimes">{regimes}</div>
  </details>
</section>

<section class="sec sec-lime" id="risks">
  <div class="sec-head">
    <h2>If nothing is done.</h2>
    <p>The concerns the Council should hear, whichever way the records eventually fall.</p>
  </div>
  <ol class="risks">{risks}</ol>
</section>

<section class="sec" id="mic">
  <div class="sec-head">
    <h2>At the microphone.</h2>
    <p>About three minutes in the public session. Sixty seconds if time is short.</p>
  </div>
  <ol class="rules">{rules}</ol>
  <details class="speech">
    <summary><span class="court-h">The sixty-second version</span><span class="readmore">Read it</span></summary>
    <div class="more speech-text"><p>{e(STATEMENT_60)}</p></div>
  </details>
  <details class="speech">
    <summary><span class="court-h">The three-minute statement</span><span class="readmore">Read it</span></summary>
    <div class="more speech-text">{statement}<p class="small"><a href="meeting-script.txt">Plain-text version for printing</a></p></div>
  </details>
</section>

<section class="pack" id="pack">
  <div class="pack-in">
    <h2>Send it to the Clerk.</h2>
    <p>One PDF: covering letter, the replacement wording for Item 10, draft resolutions, running order, statement, the record and the sources. Ready to email to {e(MEETING['clerk_email'])}.</p>
    <div class="ctas">
      <a class="btn-white big" href="meeting-pack.pdf" download>Download the meeting pack (PDF)</a>
      <button class="btn-line light" type="button" data-print>Print this whole page</button>
    </div>
  </div>
</section>

<section class="sec small-sec" id="cymraeg" lang="cy">
  <details class="src">
    <summary><span class="court-h">{e(CYMRAEG['title'])}</span><span class="court-l">Crynodeb yn Gymraeg</span><span class="readmore">Agor</span></summary>
    <div class="more">{''.join(f'<p>{e(x)}</p>' for x in CYMRAEG['lines'])}<p class="note">{e(CYMRAEG['note'])}</p></div>
  </details>
</section>

<section class="sec small-sec" id="provenance">
  <details class="src">
    <summary><span class="court-h">How this was prepared</span><span class="court-l">Version {e(VERSION['version'])}, {e(VERSION['date'])}. Method, corrections and right of reply.</span><span class="readmore">Open</span></summary>
    <div class="more"><p>{e(VERSION['prepared_by'])}.</p><p>{e(VERSION['method'])}</p><p>{e(VERSION['corrections'])}</p><p class="note">{e(VERSION['source_control'])}</p></div>
  </details>
</section>

<section class="sec small-sec" id="sources">
  <details class="src">
    <summary><span class="court-h">How to read the labels, and the sources</span><span class="readmore">Open</span></summary>
    <div class="more"><ul class="keys">{keys}</ul><ol class="sources">{sources}</ol></div>
  </details>
</section>
</main>

<footer class="foot">
  <p>Great House Farm / Tŷ Mawr, Llandough-juxta-Penarth. Meeting toolkit for {e(MEETING['date'])}. Version {e(VERSION['version'])}, {e(VERSION['date'])}. <a href="#provenance">How this was prepared</a> · <a href="#cymraeg" lang="cy">Cymraeg</a></p>
  <p>Not Llandough-juxta-Cowbridge, and not the Great House at Llandow or Aberthin.</p>
  <p><a href="https://bpvsbuckler.bucklerfamily.estate/">The full story</a> <a href="https://dartboard.bucklerfamily.estate/">Records tracker</a> <a href="meeting-pack.pdf" download>Meeting pack (PDF)</a></p>
</footer>

<script>
(function(){{
  var all=function(){{return Array.prototype.slice.call(document.querySelectorAll('details'));}};
  var btn=document.querySelector('[data-expand]');
  function sync(){{var open=all().every(function(d){{return d.open;}});btn.textContent=open?'Close everything':'Open everything';}}
  btn.addEventListener('click',function(){{var open=!all().every(function(d){{return d.open;}});all().forEach(function(d){{d.open=open;}});sync();}});
  all().forEach(function(d){{d.addEventListener('toggle',sync);}});
  var saved=[];
  window.addEventListener('beforeprint',function(){{saved=all().map(function(d){{return d.open;}});all().forEach(function(d){{d.open=true;}});}});
  window.addEventListener('afterprint',function(){{all().forEach(function(d,i){{d.open=!!saved[i];}});sync();}});
  var p=document.querySelector('[data-print]');if(p)p.addEventListener('click',function(){{window.print();}});
}})();
</script>
</body>
</html>
"""


SITE_CSS = r"""
*{box-sizing:border-box}
html{scroll-behavior:smooth;scroll-padding-top:64px;-webkit-text-size-adjust:100%}
@media (prefers-reduced-motion:reduce){html{scroll-behavior:auto}*{transition:none!important;animation:none!important}}
body{margin:0;background:var(--white);color:var(--ink);font-family:var(--text);font-size:17px;line-height:1.55;font-stretch:100%}
a{color:inherit;text-underline-offset:3px}
:focus-visible{outline:3px solid var(--red);outline-offset:3px}
.skip{position:absolute;left:-999px;top:0;background:var(--red);color:#fff;padding:10px 14px;z-index:99}.skip:focus{left:8px}
h1,h2,.b-line,.tile-big,.pillar-h,.court-h,.row-h,.step-h,.brand,.said,.mission-q{font-family:var(--display);font-stretch:62%;font-weight:850;text-transform:uppercase;letter-spacing:-.01em;line-height:.9}

/* nav */
.nav{position:sticky;top:0;z-index:30;background:var(--slate);color:var(--white)}
.nav-in{max-width:var(--max);margin:auto;display:flex;align-items:center;gap:18px;padding:10px 16px}
.brand{font-size:1.45rem;text-decoration:none;white-space:nowrap}.brand span{color:var(--stone)}
.links{display:flex;gap:18px;overflow-x:auto;flex:1;scrollbar-width:none}.links::-webkit-scrollbar{display:none}
.links a{text-decoration:none;font-size:.86rem;font-weight:600;white-space:nowrap;color:#dfe5e1}.links a:hover{color:#fff;text-decoration:underline}
.toggle{background:none;border:1px solid #ffffff55;color:#fff;font:600 .8rem var(--text);padding:8px 12px;cursor:pointer;white-space:nowrap}
.toggle:hover{border-color:#fff}
.btn-red,.btn-white,.btn-line{display:inline-block;font:700 .9rem var(--text);text-decoration:none;padding:10px 16px;border:2px solid transparent;cursor:pointer;white-space:nowrap}
.btn-red{background:var(--red);color:#fff}.btn-red:hover{background:#a50d26;color:#fff}
.btn-white{background:#fff;color:var(--red)}.btn-white:hover{background:var(--lime)}
.btn-line{background:none;border-color:currentColor;color:var(--white)}.btn-line.light{color:#fff}
.big{font-size:1.02rem;padding:15px 22px}

/* hero */
.hero{background:var(--slate);color:var(--white);display:grid;grid-template-columns:minmax(0,1.05fr) minmax(0,1fr);min-height:calc(100svh - 56px)}
.hero-text{padding:clamp(36px,6vw,84px) clamp(16px,4vw,56px) 48px max(16px,calc((100vw - var(--max))/2 + 16px));display:flex;flex-direction:column;justify-content:center}
.when-line{display:flex;flex-wrap:wrap;gap:6px 18px;font-size:.92rem;color:var(--stone);margin:0 0 22px}
.when-line span+span::before{content:"";display:inline-block;width:18px;height:2px;background:var(--red);vertical-align:middle;margin-right:18px}
h1{font-size:clamp(3.6rem,7.4vw,8.4rem);margin:0;color:var(--white);overflow-wrap:break-word}
.lede{font-size:clamp(1.05rem,1.6vw,1.25rem);max-width:34em;color:#d8dfda;margin:26px 0 30px}
.ctas{display:flex;flex-wrap:wrap;gap:12px}
.hero-photo{margin:0;position:relative;background:#1b232a}
.hero-photo img{width:100%;height:100%;object-fit:cover;display:block;filter:grayscale(.15) contrast(1.05)}
.hero-photo figcaption{position:absolute;left:0;right:0;bottom:0;padding:40px 18px 14px;font-size:.82rem;color:#e8ece9;background:linear-gradient(transparent,#000000b0)}

/* one breath */
.breath{background:var(--red);color:#fff}
.breath ol{list-style:none;margin:0 auto;padding:clamp(36px,6vw,72px) 16px;max-width:var(--max);display:grid;gap:22px}
.breath li{display:flex;flex-wrap:wrap;align-items:baseline;gap:6px 20px}
.b-line{font-size:clamp(2.6rem,8.4vw,7.2rem)}
.b-note{font-size:.95rem;color:#ffe3e7}

/* sections */
.sec{padding:clamp(56px,8vw,104px) 16px}
.sec>*{max-width:var(--max);margin-left:auto;margin-right:auto}
.sec-slate{background:var(--slate);color:var(--white)}
.sec-lime{background:var(--lime)}
.sec-head{margin-bottom:34px}
.sec-head h2{font-size:clamp(3rem,8vw,6.4rem);margin:0 0 14px}
.sec-head p{max-width:36em;margin:0;font-size:1.08rem;color:var(--muted)}
.sec-slate .sec-head p{color:#cdd5d0}
.sec>.aside{font-size:.95rem;color:var(--muted);max-width:var(--max);padding-right:min(40%,460px);margin-top:26px}.aside.light{color:#b9c2bd}
.readmore{font-size:.85rem;font-weight:700;color:var(--red);white-space:nowrap}
.sec-slate .readmore{color:#ff8a9b}
details>summary{list-style:none;cursor:pointer}details>summary::-webkit-details-marker{display:none}
details[open] .readmore{visibility:hidden}
.more{padding-top:14px}
.more p{margin:0 0 12px;max-width:42em}

/* asks */
.rows{border-top:3px solid var(--ink)}
.row{border-bottom:1px solid var(--rule)}
.row summary{display:grid;grid-template-columns:3.2rem minmax(0,1fr) 28px;gap:4px 14px;padding:20px 0;align-items:baseline}
.num{font:800 1rem var(--text);color:var(--red);font-variant-numeric:tabular-nums}
.row-h{font-size:clamp(1.9rem,4.4vw,3rem);grid-column:2}
.row-l{grid-column:2;color:var(--muted);font-size:1rem}
.plus{grid-column:3;grid-row:1;width:22px;height:22px;position:relative;align-self:center}
.plus::before,.plus::after{content:"";position:absolute;left:0;right:0;top:10px;height:2px;background:currentColor;transition:transform .2s}
.plus::after{transform:rotate(90deg)}details[open]>summary .plus::after{transform:rotate(0)}
.row summary:hover .row-h{color:var(--red)}
.row .more{padding:0 0 24px 3.2rem;padding-left:calc(3.2rem + 14px)}
.why{color:var(--muted)}
.resolution{border-left:4px solid var(--red);padding:12px 16px;background:var(--lime);font-size:1rem}
.resolution span{display:block;font-weight:800;font-size:.8rem;color:var(--red);margin-bottom:4px}

/* running order */
.steps{display:grid;gap:2px;background:var(--slate)}
.step{background:var(--slate-2);padding:0}
.step summary,.step .static{display:grid;grid-template-columns:minmax(120px,190px) minmax(0,1fr) 28px;gap:4px 18px;padding:18px 18px;align-items:baseline}
.when{font-weight:800;color:var(--stone);font-size:.92rem}
.step-h{font-size:clamp(1.6rem,3.4vw,2.3rem);grid-column:2}
.step-l{grid-column:2;color:#cdd5d0;font-size:.98rem}
.step .plus{grid-column:3;grid-row:1}
.step-main{background:var(--red)}.step-main .when,.step-main .step-l{color:#fff}
.step .more{padding:0 18px 20px;padding-left:calc(18px + min(190px,30vw) + 18px)}
.step .more ul{margin:0;padding-left:18px;color:#e4e9e6}.step .more li{margin-bottom:8px;max-width:42em}

/* pillars */
.pillars{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:0;border-top:3px solid var(--ink)}
.pillar{padding:22px 22px 26px 0;border-right:1px solid var(--rule)}
.pillar+.pillar{padding-left:22px}.pillar:last-child{border-right:0}
.pillar summary{display:flex;flex-direction:column;gap:10px}
.pillar-k{font-weight:800;color:var(--red);font-size:.95rem}
.pillar-h{font-size:clamp(2rem,3.6vw,2.9rem)}
.pillar-l{color:var(--muted)}
.pillar ul{margin:0;padding-left:18px}.pillar li{margin-bottom:10px}
.mission{margin-top:56px;background:var(--slate);color:#fff;padding:clamp(24px,4vw,44px)}
.mission-q{font-size:clamp(2.2rem,5.6vw,4.4rem);margin:0 0 18px}
.mission-by{color:var(--stone);margin:0 0 8px}
.mission ul{margin:0;padding:0;list-style:none;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px 24px}
.mission li::before{content:"";display:inline-block;width:10px;height:10px;background:var(--red);margin-right:10px}

/* tiles */
.tiles{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:2px;background:var(--rule);border:2px solid var(--rule)}
.tile{background:#fff;padding:22px 20px 22px}
.tile summary{display:flex;flex-direction:column;gap:8px;min-height:200px}
.tile-big{font-size:clamp(2.4rem,3.6vw,3.2rem);color:var(--red);overflow-wrap:anywhere}
.tile-h{font-weight:800;font-size:1.1rem}
.tile-l{color:var(--muted);font-size:.95rem;flex:1}
.tile[open]{grid-column:span 2}
.tile .more p{font-size:.96rem}

/* story */
.swaps{list-style:none;margin-top:0;margin-bottom:0;padding:0;border-top:3px solid var(--ink)}
.swap{display:grid;grid-template-columns:minmax(0,.85fr) minmax(0,1.15fr);gap:6px 28px;padding:22px 0;border-bottom:1px solid var(--rule);align-items:baseline}
.said{font-size:clamp(2.2rem,5vw,3.8rem);color:var(--stone);text-decoration-color:var(--red);text-decoration-thickness:5px}
.truth{font-size:clamp(1.05rem,1.8vw,1.3rem);font-weight:600}
.barn{margin:48px auto 0}
.barn img{width:100%;height:auto;display:block;max-height:520px;object-fit:cover}
.barn figcaption{font-size:.85rem;color:var(--muted);margin-top:8px}
.court,.council,.speech,.src{margin-top:36px;border-top:3px solid currentColor;padding-top:18px}
.court summary,.council summary,.speech summary,.src summary{display:flex;flex-wrap:wrap;align-items:baseline;gap:6px 18px}
.court-h{font-size:clamp(1.9rem,4vw,3rem)}
.court-l{color:var(--muted);flex:1 1 20em}
.sec-slate .court-l{color:#cdd5d0}
.court ul{padding-left:18px;margin:0 0 14px}.court li{margin-bottom:10px;max-width:46em}
.note{font-size:.95rem;color:var(--muted)}

/* labels */
.tag{display:inline-block;font:700 .72rem var(--text);padding:3px 8px;border-radius:20px;vertical-align:middle;white-space:nowrap;margin-left:4px}
.tag-rec{background:#dfe9e3;color:var(--moss)}.tag-fam{background:#f6dfe3;color:#8f0b21}.tag-open{background:#ececec;color:#444}
.keys{list-style:none;padding:0;margin:0 0 18px}.keys li{margin-bottom:6px}.keys .tag{margin:0 8px 0 0}

/* wall */
.ring-key{list-style:none;padding:0;margin:0 auto 18px;display:flex;flex-wrap:wrap;gap:6px 16px;font-size:.85rem;color:#cdd5d0}
.ring-key b{color:#fff;margin-right:2px}
.wall{list-style:none;margin:0 auto;padding:0;border-top:1px solid #ffffff30}
.wall-row{display:grid;grid-template-columns:minmax(0,1.1fr) 176px minmax(0,1.3fr);gap:6px 18px;align-items:center;padding:11px 0;border-bottom:1px solid #ffffff22}
.wall-name{font-weight:700}
.rings{display:grid;grid-template-columns:repeat(8,1fr);gap:3px}
.rings i{height:14px;background:#ffffff1c;display:block}.rings i.on{background:var(--stone)}
.wall-us .rings i.on{background:var(--red)}.wall-us .wall-name{color:#fff}.wall-us{background:#ffffff0d}
.wall-status{font-size:.9rem;color:#cdd5d0}
.dates{list-style:none;padding:0;margin:0}.dates li{display:grid;grid-template-columns:150px 1fr;gap:4px 18px;padding:10px 0;border-bottom:1px solid #ffffff22}.dates b{color:var(--stone)}
.regimes{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px}
.regime{border-top:4px solid var(--red);padding-top:12px}
.regime-k{display:block;font:850 2.6rem/1 var(--display);font-stretch:62%}
.regime-n{display:block;font-size:.85rem;color:var(--stone);margin:4px 0 8px}
.regime p{font-size:.95rem;color:#e4e9e6}

/* briefing */
.cmps{border-top:3px solid var(--ink)}
.cmp{border-bottom:1px solid var(--rule)}
.cmp summary{display:grid;grid-template-columns:3.4rem minmax(0,1fr) 28px;gap:6px 16px;padding:22px 0;align-items:baseline}
.cmp-id{font:850 1.5rem/1 var(--display);font-stretch:62%;color:var(--red);grid-row:1/3}
.cmp-t{font:850 clamp(1.5rem,3vw,2rem)/1 var(--display);font-stretch:62%;text-transform:uppercase;color:var(--muted);grid-column:2}
.cmp-say{grid-column:2;font-size:clamp(1.15rem,2.1vw,1.45rem);font-weight:700;line-height:1.35;max-width:42em}
.cmp .plus{grid-column:3;grid-row:1}
.cmp summary:hover .cmp-say{color:var(--red)}
.cmp-body{padding:0 0 24px calc(3.4rem + 16px);display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px 28px}
.cmp-col h4{margin:0 0 8px;font-size:.85rem;font-weight:800;color:var(--red)}
.cmp-col ul{margin:0;padding-left:18px}.cmp-col li{margin-bottom:8px;font-size:.98rem}
.cmp-ask,.cmp-body .ref{grid-column:1/-1;margin:4px 0 0}
.cmp-against{grid-column:1/-1;border-top:1px dashed var(--rule);padding-top:10px}
.cmp-against h4{color:var(--ink)}
.cmp-ask{background:var(--lime);border-left:4px solid var(--ink);padding:10px 14px}
.threshold-box{margin-top:40px;background:var(--slate);color:#fff;padding:clamp(20px,3vw,32px)}
.threshold-box>p{font-size:1.1rem;max-width:44em;margin:0 0 20px}
.threshold-box .counts{border-top-color:#fff;margin-bottom:0}
.threshold-box .counts li+li{border-left-color:#ffffff30}
.threshold-box .c-src{color:var(--stone)}
.rows+.aside+.mission{margin-top:40px}
/* on record */
.counts{list-style:none;margin:0 auto 34px;padding:0;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:0;border-top:3px solid var(--ink)}
.counts li{padding:18px 20px 18px 0;display:flex;flex-direction:column;gap:4px}
.counts li+li{padding-left:20px;border-left:1px solid var(--rule)}
.c-big{font:850 clamp(3.4rem,8vw,6rem)/.85 var(--display);font-stretch:62%;color:var(--red)}
.c-l{font-weight:800;font-size:1.05rem}
.c-src{font-size:.85rem;color:var(--muted)}
.known .row-h{font-size:clamp(1.6rem,3.6vw,2.5rem)}
.ref{font-size:.85rem;color:var(--muted)}.ref .tag{margin:0 8px 0 0}
.sub-h{font:850 clamp(1.7rem,3.4vw,2.4rem)/1 var(--display);font-stretch:62%;text-transform:uppercase;margin:0 auto 14px}
.sub-h+.ring-key{margin-top:0}
.withheld{list-style:none;margin:0 auto;padding:0;border-top:2px solid #fff}
.withheld li{display:grid;grid-template-columns:minmax(0,.7fr) minmax(0,1.6fr);gap:4px 18px;padding:12px 0;border-bottom:1px solid #ffffff22}
.wh-b{font-weight:800}.wh-p{color:#dfe5e1}
.withheld+.aside{margin-bottom:44px}
.risks{list-style:none;counter-reset:k;margin-top:0;margin-bottom:0;padding:0;border-top:3px solid var(--ink)}
.risks li{counter-increment:k;display:grid;grid-template-columns:3.2rem minmax(0,1fr);gap:2px 14px;padding:18px 0;border-bottom:1px solid var(--rule)}
.risks li::before{content:counter(k,decimal-leading-zero);font-weight:800;color:var(--red);grid-row:1/3}
.risk-h{font:850 clamp(1.7rem,3.8vw,2.6rem)/.95 var(--display);font-stretch:62%;text-transform:uppercase}
.risk-l{color:var(--muted);max-width:44em}
/* mic */
.rules{list-style:none;counter-reset:r;padding:0;margin-top:0;margin-bottom:0;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:22px;border-top:3px solid var(--ink);padding-top:18px}
.rules li{counter-increment:r}.rules li::before{content:counter(r);display:block;font:850 3rem/1 var(--display);font-stretch:62%;color:var(--red);margin-bottom:6px}
.rules b{display:block;font-size:1.1rem;margin-bottom:4px}
.speech-text{max-width:40em}.speech-text p{font-size:1.12rem;line-height:1.65}
.small{font-size:.9rem!important}

/* pack */
.pack{background:var(--red);color:#fff;padding:clamp(56px,8vw,104px) 16px}
.pack-in{max-width:var(--max);margin:auto}
.pack h2{font-size:clamp(3.2rem,9vw,7.4rem);margin:0 0 16px}
.pack p{max-width:36em;font-size:1.1rem;margin:0 0 28px;color:#ffe3e7}
.small-sec{padding-top:40px;padding-bottom:40px}
.sources{padding-left:20px;font-size:.92rem}.sources li{margin-bottom:6px}
.foot{background:var(--ink);color:#aeb7b2;font-size:.85rem;padding:28px 16px}
.foot p{max-width:var(--max);margin:0 auto 6px}.foot a{margin-right:16px;color:#fff}

@media (max-width:980px){
  .hero{grid-template-columns:1fr;min-height:0}.hero-photo{order:-1;aspect-ratio:16/10}
  .hero-text{padding:36px 16px 44px}
  .tiles{grid-template-columns:repeat(2,minmax(0,1fr))}
  .pillars{grid-template-columns:1fr}.pillar,.pillar+.pillar{padding:20px 0;border-right:0;border-bottom:1px solid var(--rule)}
  .regimes,.rules{grid-template-columns:1fr}
  .links{display:none}
}
@media (max-width:640px){
  body{font-size:16px}
  .nav-in{gap:10px}.toggle{display:none}.brand{font-size:1.25rem}
  .tiles{grid-template-columns:1fr}.tile[open]{grid-column:auto}.tile summary{min-height:0}
  .swap{grid-template-columns:1fr}
  .wall-row{grid-template-columns:1fr 120px}.wall-status{grid-column:1/-1}
  .step summary,.step .static{grid-template-columns:minmax(0,1fr) 28px}.when{grid-column:1}.step-h,.step-l{grid-column:1}.step .plus{grid-column:2}
  .step .more,.row .more{padding-left:18px}.row .more{padding-left:0}
  .row summary{grid-template-columns:2.4rem minmax(0,1fr) 24px}
  .mission ul{grid-template-columns:1fr}
  .dates li{grid-template-columns:1fr}
  .cmp-body{grid-template-columns:1fr;padding-left:0}.cmp summary{grid-template-columns:2.6rem minmax(0,1fr) 24px}
  .counts{grid-template-columns:1fr}.counts li+li{padding-left:0;border-left:0;border-top:1px solid var(--rule)}
  .withheld li{grid-template-columns:1fr}
  .risks li{grid-template-columns:2.4rem minmax(0,1fr)}
}
@media print{
  .nav,.skip,.ctas,.toggle,.readmore,.plus{display:none!important}
  body{font-size:11pt}
  .hero{min-height:0;display:block}.hero-photo{max-height:90mm;overflow:hidden}
  .sec,.pack,.breath ol{padding:14mm 0}
  section{break-inside:auto}.row,.tile,.wall-row,.swap,.step{break-inside:avoid}
  *{-webkit-print-color-adjust:exact;print-color-adjust:exact}
}
"""



# ------------------------------------------------------------------ website (v2: progressive disclosure)
# Sion, 00:26 BST 21 Oct 2026: a site dedicated to this one meeting; minimal landing,
# detail only on tapping a segment (each tap reveals more), all top-level options always
# visible or one tap away, and a way back at every level. pack(), meeting-script.txt and
# the PDF are unchanged; the old long page is kept as site_v1() for reference.

SITE2 = {
    "title": "Llandough Community Council meeting",
    "when": "Thursday 22 October 2026, 19:00 (remote)",
    "img": "img/tymawr-29-july-1988-white-wall.jpg",
    "img_original": "img/tymawr-29-july-1988.jpg",
    "img_caption": ("Illustration: Tŷ Mawr with its wall shown whitewashed (edited from a Cadw photograph). "
                    "Not a photograph of the house as it stands."),
    "img_credit": "Original: Cadw photograph, 29 July 1988, released to the family in May 2026.",
    "agenda_date": "13 October 2026",
    "agenda_item": "To receive a request from Mr SB in relation to the following matters:",
    "burials": ("Whether the Council would consider, in due course, whether an interpretation board or a plaque near "
                "the green would be appropriate. The excavation on the land beneath Church View Close recorded 1,026 "
                "burials, described in the published report as by far the largest early medieval burial population so "
                "far recovered from Wales, above a Roman villa and an Iron Age roundhouse. That history belongs to "
                "Llandough as much as to my family, and there is nothing on the ground that records it. I would be glad "
                "to give the Council or the community a short talk on the documentary record, without charge, if that "
                "would be useful."),
    "outreach": ("I am asking whether the Council would be willing to pass my details to any former member, former clerk "
                 "or long-standing resident who might remember the village between the 1950s and the 1990s, leaving it "
                 "entirely to them whether to contact me. I appreciate the Council may have data protection or "
                 "administrative reasons for declining, and I would not press it"),
    "questions_sent": "Sent by email to the Clerk, 21 October 2026, 00:25 BST, for the meeting papers.",
    "questions_sign": "Sion Buckler",
    "questions": [
        ("What consideration was my first approach given before the reply of 20 November 2025?",
         "Clerk's reply, 20 Nov 2025, “RE: BP vs Buckler”: “unable to assist with the matter you raise”."),
        ("Does the Council hold any Tŷ Mawr records besides the minute books deposited in 2002 (my email of 14 June)?",
         "Email of 14 Jun 2026, “Re: Great House Farm”."),
        ("Which agenda items cover the “other matters” your email of 11 October said would be considered in October?",
         "Clerk, 11 Oct 2026, FOI reply (s.12): the other matters “will be considered at the October meeting of the council”."),
        ("Who decided the meeting would be remote only, and on what date?",
         "Email of 13 Oct; the Clerk's emails of 13 Oct (agenda offering the Council Chamber) and 16 Oct (“remotely only”)."),
        ("When was the website agenda revised and republished?",
         "Email of 20 Oct, question 2: the website agenda carries the same 13 October date but reads “remotely only”."),
        ("Where are the published arrangements for multi-location meetings (s.47, LGE(W)A 2021)?",
         "Objection of 16 Oct, point 3; repeated 20 Oct."),
        ("Was a physical public venue considered?",
         "Objection of 16 Oct, points 1 and 4."),
        ("When will my internal review (13 October) and narrower request (20 October) be answered, and will the review apply the EIR?",
         "Clerk, 13 Oct: “a full response will be sent to you in due course”; emails of 13 Oct and 20 Oct."),
        ("Will my statement and briefing pack be received and minuted?",
         "Briefing site proposal 01 (sent 14 Oct); emails of 16 and 20 Oct."),
        ("If the remote-only decision stands, will its reasons be minuted?",
         "Objection of 16 Oct, last paragraph."),
        ("Which councillor is my point of contact?",
         "Email to the Chair, 21 Sep, passed to the Clerk 28 Sep; briefing site proposal 02."),
        ("How do I place the wider matters on a future agenda?",
         "Email of 20 Oct, part (c)."),
    ],
    "wdtk_user": "https://www.whatdotheyknow.com/user/sion_buckler",
    "wdtk_request": "https://www.whatdotheyknow.com/request/meeting_of_22_october_2026_remot",
    "email_site": "https://email.bucklerfamily.estate/",
    "dartboard": "https://dartboard.bucklerfamily.estate/",
    "council_site": "http://www.llandough-cc.co.uk/",
}


def _script_parts(txt):
    """Split meeting-script.txt (exactly as built) into its four parts, words untouched."""
    heads = ["SIXTY-SECOND VERSION", "THE FOUR ASKS FOR TONIGHT",
             "BRIEFING CUE CARD (say the line, move on; expand only if asked)"]
    lines = txt.split("\n")
    idx = [lines.index(h) for h in heads]
    statement = [l for l in lines[2:idx[0]] if l.strip()]
    sixty = [l for l in lines[idx[0] + 1:idx[1]] if l.strip()]
    asks = [l for l in lines[idx[1] + 1:idx[2]] if l.strip()]
    cards, cur = [], None
    for l in lines[idx[2] + 1:]:
        if not l.strip():
            continue
        if not l.startswith(" "):
            cur = [l, []]
            cards.append(cur)
        elif cur is not None:
            cur[1].append(l.strip())
    return lines[0], lines[1], statement, sixty, asks, cards, heads


def site():
    S = SITE2
    title, sub, statement, sixty, asks, cards, heads = _script_parts(script_txt())

    def seg(i, sid, h, teaser, body):
        return f"""
  <details class="seg" id="{sid}" name="seg">
    <summary><span class="seg-n">{i}</span><span class="seg-t"><span class="seg-h">{e(h)}</span><span class="seg-l">{e(teaser)}</span></span><span class="chev" aria-hidden="true"></span></summary>
    <div class="seg-body">{body}
      <button type="button" class="back" data-close>▲ Back to all options</button>
    </div>
  </details>"""

    def sub_(h, body, cls=""):
        return f"""
      <details class="sub {cls}"><summary><span>{e(h)}</span><span class="chev" aria-hidden="true"></span></summary><div class="sub-body">{body}</div></details>"""

    # 1. the two agenda points
    agenda = (f'<p class="lead">Item 10 on the Council\'s agenda of {e(S["agenda_date"])}: “{e(S["agenda_item"])}”</p>'
              + sub_("The burials · item 10(b)", f'<blockquote>{e(S["burials"])}</blockquote><p class="src">The Clerk\'s agenda, {e(S["agenda_date"])}, item 10(b), word for word.</p>')
              + sub_("Community outreach · item 10(a)", f'<blockquote>{e(S["outreach"])}</blockquote><p class="src">The Clerk\'s agenda, {e(S["agenda_date"])}, item 10(a), word for word.</p>')
              + f'<p class="src"><a href="{e(S["council_site"])}" rel="noopener">The Council\'s website</a> and noticeboards carry the published agenda.</p>')

    # 2. the statement (meeting-script.txt, unchanged)
    stmt_html = "".join(f"<p>{e(p)}</p>" for p in statement)
    sixty_html = "".join(f"<p>{e(p)}</p>" for p in sixty)
    asks_html = "<ol>" + "".join(f"<li>{e(a.split('. ', 1)[1] if a[:1].isdigit() else a)}</li>" for a in asks) + "</ol>"
    cards_html = "".join(sub_(c[0], "".join(f"<p>{e(x)}</p>" for x in c[1]), "card") for c in cards)
    statement_body = (f'<p class="lead">{e(sub)}</p>'
                      + sub_("The statement", f'<div class="speech">{stmt_html}</div>')
                      + sub_(heads[0].capitalize(), f'<div class="speech">{sixty_html}</div>')
                      + sub_(heads[1].capitalize(), asks_html)
                      + sub_("Briefing cue card", f'<p class="src">{e(heads[2])}</p>{cards_html}')
                      + '<p class="files"><a href="meeting-script.txt">Plain text</a> · <a href="meeting-pack.pdf" download>Clerk pack (PDF)</a> · <a href="pack.html">Clerk pack (HTML)</a></p>')

    # 3. questions
    qs = "".join("<li>" + sub_(q, '<p class="src">Raised before: ' + e(src) + "</p>", "q") + "</li>" for q, src in S["questions"])
    questions_body = (f'<p class="lead">{e(S["questions_sent"])} Each one rests on a point already raised in correspondence; tap a question to see where.</p>'
                      f'<ol class="qs">{qs}</ol><p class="sign">{e(S["questions_sign"])}</p>')

    # 4-6. links out
    def go(url, label, note):
        return f'<a class="go" href="{e(url)}" rel="noopener"><span>{e(label)}</span><small>{e(note)}</small></a>'
    wdtk_body = (go(S["wdtk_request"], "The request about this meeting", "WhatDoTheyKnow")
                 + go(S["wdtk_user"], "Every public request we have made", "WhatDoTheyKnow profile"))
    email_body = (go(S["email_site"], "Read the correspondence", "email.bucklerfamily.estate · public, read-only archive")
                  + '<p class="src">The Clerk writes in an official capacity. Personal contact details are left out.</p>')
    dart_body = (go(S["dartboard"], "Open the board", "dartboard.bucklerfamily.estate · opens on Llandough Community Council")
                 + '<p class="src">Every request, review and complaint it took to reach this meeting, body by body.</p>')

    segs = [
        ("agenda", "The two agenda points", "Item 10: the burials, and community outreach", agenda),
        ("statement", "My statement", "The read-aloud statement for the meeting", statement_body),
        ("questions", "Questions sent to the Council", "12 questions, sent to the Clerk on 21 October", questions_body),
        ("records", "Records requests", "Public requests on WhatDoTheyKnow", wdtk_body),
        ("clerk", "Correspondence with the Clerk", "The emails, open for all to read", email_body),
        ("road", "The road to this meeting", "Every request it took to get here", dart_body),
    ]
    seg_html = "".join(seg(i, sid, h, t, b) for i, (sid, h, t, b) in enumerate(segs, 1))
    menu = "".join(f'<li><a href="#{sid}" data-go="{sid}"><span>{i}</span>{e(h)}</a></li>' for i, (sid, h, t, b) in enumerate(segs, 1))
    full_title = f'{S["title"]}, {S["when"]}'

    return f"""<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>{e(full_title)}</title>
<meta name="description" content="{e(full_title)}. Item 10: the burials, and community outreach.">
<meta property="og:title" content="{e(full_title)}">
<meta property="og:description" content="Item 10: the burials, and community outreach.">
<meta property="og:image" content="https://2026-10-22.bucklerfamily.estate/{e(S['img'])}">
<meta name="theme-color" content="#26313a">
<link rel="preload" href="fonts/archivo-latin-wdth-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="alternate" type="application/json" href="/agent-index.json" title="Machine-readable meeting toolkit index">
<link rel="alternate" type="text/plain" href="/llms.txt" title="Agent reading guide">
<style>{FONT_CSS}{TOKENS}{SITE2_CSS}</style>
</head>
<body>
<header class="bar">
  <a class="home" href="https://bucklerfamily.estate/">← bucklerfamily.estate</a>
  <button type="button" class="burger" aria-label="Menu" aria-controls="menu" aria-expanded="false" data-menu>☰</button>
</header>
<nav id="menu" class="menu" aria-label="Sections" hidden>
  <div class="menu-head"><strong>The meeting</strong><button type="button" class="x" aria-label="Close menu" data-menu-close>✕</button></div>
  <ol>{menu}</ol>
  <p class="menu-foot"><a href="#top" data-collapse>Back to all options</a></p>
</nav>
<div class="scrim" data-menu-close hidden></div>

<main id="top">
<section class="hero">
  <figure>
    <img src="{e(S['img'])}" width="1110" height="763" alt="Tŷ Mawr, a long two-storey farmhouse, shown with its front wall whitewashed. An edited illustration.">
    <figcaption>{e(S['img_caption'])} {e(S['img_credit'])} <a href="{e(S['img_original'])}">Original photograph</a>.</figcaption>
  </figure>
  <h1>{e(S['title'])}<span>{e(S['when'])}</span></h1>
  <p class="kicker">Tŷ Mawr · Great House Farm · Item 10</p>
</section>

<section class="segs" aria-label="Choose a section">{seg_html}
</section>
</main>

<footer class="foot">
  <p class="disclaimer">Our case, prospective. Not a finding of any court.</p>
  <p id="agent-access" class="small"><a href="meeting-pack.pdf" download>Clerk pack (PDF)</a> · <a href="pack.html">Clerk pack (HTML)</a> · <a href="meeting-script.txt">Meeting script</a> · <a href="/agent-index.json">Agent index</a> · <a href="/llms.txt">llms.txt</a></p>
  <p class="sig">— Sion's Tab agent</p>
</footer>

<script>
(function(){{
  var segs=[].slice.call(document.querySelectorAll('details.seg'));
  // one top-level segment open at a time (fallback for browsers without details[name])
  segs.forEach(function(d){{d.addEventListener('toggle',function(){{if(d.open){{segs.forEach(function(o){{if(o!==d)o.open=false;}});}}}});}});
  [].forEach.call(document.querySelectorAll('[data-close]'),function(b){{b.addEventListener('click',function(){{var d=b.closest('details.seg');d.open=false;[].forEach.call(d.querySelectorAll('details'),function(x){{x.open=false;}});d.scrollIntoView({{block:'nearest'}});d.querySelector('summary').focus();}});}});
  var menu=document.getElementById('menu'),scrim=document.querySelector('.scrim'),burger=document.querySelector('[data-menu]');
  function setMenu(open){{menu.hidden=!open;scrim.hidden=!open;burger.setAttribute('aria-expanded',open?'true':'false');if(open)menu.querySelector('a').focus();}}
  burger.addEventListener('click',function(){{setMenu(menu.hidden);}});
  [].forEach.call(document.querySelectorAll('[data-menu-close]'),function(x){{x.addEventListener('click',function(){{setMenu(false);}});}});
  document.addEventListener('keydown',function(ev){{if(ev.key==='Escape')setMenu(false);}});
  [].forEach.call(document.querySelectorAll('[data-go]'),function(a){{a.addEventListener('click',function(ev){{ev.preventDefault();var d=document.getElementById(a.getAttribute('data-go'));setMenu(false);d.open=true;d.scrollIntoView({{behavior:'smooth',block:'start'}});}});}});
  var c=document.querySelector('[data-collapse]');c.addEventListener('click',function(ev){{ev.preventDefault();setMenu(false);[].forEach.call(document.querySelectorAll('details'),function(x){{x.open=false;}});window.scrollTo({{top:0,behavior:'smooth'}});}});
  function fromHash(){{var d=location.hash&&document.getElementById(location.hash.slice(1));if(d&&d.tagName==='DETAILS'){{d.open=true;}}}}
  fromHash();window.addEventListener('hashchange',fromHash);
  var saved=[];
  window.addEventListener('beforeprint',function(){{var all=[].slice.call(document.querySelectorAll('details'));saved=all.map(function(d){{return d.open;}});all.forEach(function(d){{d.removeAttribute('name');d.open=true;}});}});
  window.addEventListener('afterprint',function(){{[].slice.call(document.querySelectorAll('details')).forEach(function(d,i){{d.open=!!saved[i];if(d.classList.contains('seg'))d.setAttribute('name','seg');}});}});
}})();
</script>
<script src="/agent-tools.js" defer></script>
<script src="https://bucklerfamily.estate/basecamp.js" defer></script>
</body>
</html>
"""


SITE2_CSS = r"""
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%;scroll-padding-top:64px}
body{margin:0;background:var(--lime);color:var(--ink);font:17px/1.55 var(--text)}
a{color:var(--moss)}
.bar{position:sticky;top:0;z-index:20;display:flex;justify-content:space-between;align-items:center;height:52px;padding:0 12px;background:var(--slate);color:#fff}
.bar .home{color:#fff;text-decoration:none;font-size:14px;opacity:.9}
.burger{appearance:none;border:0;background:transparent;color:#fff;font-size:26px;line-height:1;width:44px;height:44px;cursor:pointer}
.menu{position:fixed;top:0;right:0;bottom:0;z-index:2147483000;width:min(86vw,360px);background:#fff;box-shadow:-8px 0 30px rgba(0,0,0,.25);padding:14px 16px;overflow:auto}
.menu-head{display:flex;justify-content:space-between;align-items:center;font-family:var(--display);font-size:18px;margin-bottom:8px}
.menu .x{appearance:none;border:0;background:none;font-size:22px;width:44px;height:44px;cursor:pointer}
.menu ol{list-style:none;margin:0;padding:0}
.menu li a{display:flex;gap:12px;align-items:center;padding:14px 4px;border-bottom:1px solid var(--rule);color:var(--ink);text-decoration:none;font-weight:600}
.menu li a span{display:inline-grid;place-items:center;width:28px;height:28px;border-radius:50%;background:var(--slate);color:#fff;font-size:14px;flex:none}
.menu-foot{margin-top:16px;font-size:15px}
.scrim{position:fixed;inset:0;z-index:2147482999;background:rgba(0,0,0,.35)}
[hidden]{display:none!important}
main{max-width:760px;margin:0 auto;padding:0 0 24px}
.hero figure{margin:0;background:var(--slate)}
.hero img{display:block;width:100%;height:auto}
.hero figcaption{padding:8px 16px 10px;font-size:12px;line-height:1.45;color:#dfe4e1;background:var(--slate)}
.hero figcaption a{color:#fff}
.hero h1{margin:22px 16px 4px;font-family:var(--display);font-stretch:88%;font-weight:800;font-size:clamp(30px,8vw,46px);line-height:1.05;letter-spacing:-.01em;color:var(--slate)}
.hero h1 span{display:block;margin-top:8px;font-size:clamp(18px,4.6vw,24px);font-weight:600;color:var(--red);letter-spacing:0}
.kicker{margin:6px 16px 18px;color:var(--muted);font-size:14px;letter-spacing:.06em;text-transform:uppercase}
.segs{padding:0 12px;display:flex;flex-direction:column;gap:10px}
details>summary{list-style:none;cursor:pointer}
details>summary::-webkit-details-marker{display:none}
.seg{background:#fff;border:1px solid var(--rule);border-radius:14px;overflow:hidden}
.seg>summary{display:flex;align-items:center;gap:14px;min-height:76px;padding:14px 16px}
.seg[open]>summary{background:var(--slate);color:#fff}
.seg-n{flex:none;display:grid;place-items:center;width:38px;height:38px;border-radius:50%;background:var(--red);color:#fff;font-weight:800;font-family:var(--display)}
.seg-t{flex:1;min-width:0}
.seg-h{display:block;font-family:var(--display);font-weight:800;font-size:20px;line-height:1.15}
.seg-l{display:block;margin-top:3px;font-size:14.5px;color:var(--muted)}
.seg[open] .seg-l{color:#cfd6d2}
.chev{flex:none;width:12px;height:12px;border-right:2.5px solid currentColor;border-bottom:2.5px solid currentColor;transform:rotate(45deg);margin:0 6px 4px 0;transition:transform .2s}
details[open]>summary>.chev{transform:rotate(-135deg);margin-bottom:-4px}
.seg-body{padding:14px 16px 16px}
.lead{margin:0 0 12px;font-size:16px}
.sub{border:1px solid var(--rule);border-radius:10px;margin:8px 0;background:var(--lime)}
.sub>summary{display:flex;justify-content:space-between;align-items:center;gap:12px;min-height:52px;padding:10px 14px;font-weight:700}
.sub[open]>summary{border-bottom:1px solid var(--rule)}
.sub-body{padding:6px 14px 10px;background:#fff;border-radius:0 0 10px 10px}
.sub .sub{background:#fff}
.card>summary{font-size:15px}
blockquote{margin:8px 0;padding:4px 0 4px 14px;border-left:4px solid var(--red);font-size:16.5px}
.speech p{margin:.6em 0}
.src{font-size:13.5px;color:var(--muted);margin:8px 0}
.qs{margin:0;padding-left:0;list-style:none;counter-reset:q}
.qs li{counter-increment:q}
.qs .sub>summary span:first-child::before{content:counter(q) ". ";color:var(--red)}
.qs .sub>summary{font-weight:600;font-size:15.5px;line-height:1.35}
.sign{margin:14px 0 0;font-weight:700}
.go{display:flex;flex-direction:column;gap:2px;margin:8px 0;padding:14px 16px;border-radius:12px;background:var(--slate);color:#fff;text-decoration:none;font-weight:700;font-size:17px}
.go::after{content:"Open →";font-size:13px;font-weight:600;color:#cfd6d2;margin-top:4px}
.go small{font-weight:400;font-size:13px;color:#cfd6d2}
.files{font-size:14.5px;margin:14px 0 0}
.back{appearance:none;display:block;width:100%;margin-top:14px;padding:12px;border:1px solid var(--rule);border-radius:10px;background:var(--lime);font:600 15px var(--text);color:var(--slate);cursor:pointer}
.foot{max-width:760px;margin:10px auto 0;padding:18px 16px 40px;border-top:1px solid var(--rule);font-size:14px;color:var(--muted)}
.foot .disclaimer{font-weight:700;color:var(--ink)}
.foot .sig{font-style:italic}
.small{font-size:13px}
:focus-visible{outline:3px solid var(--red);outline-offset:2px}
@media (min-width:900px){.hero img{max-height:56vh;object-fit:cover}.segs{padding:0}.hero h1,.kicker{margin-left:0;margin-right:0}main{padding:0 0 24px}.hero figure{border-radius:0 0 14px 14px;overflow:hidden}}
@media (prefers-reduced-motion:reduce){*{transition:none!important;scroll-behavior:auto!important}}
@media print{.bar,.menu,.scrim,.back{display:none!important}.seg{break-inside:auto;border:0}}
"""


# ------------------------------------------------------------------ pack
def pack():
    reqs = "".join(f"<li>{e(r)}</li>" for r in LETTER["requests"])
    body = "".join(f"<p>{e(p)}</p>" for p in LETTER["body"])
    close = "".join(f"<p>{e(p)}</p>" for p in LETTER["close"])
    add_items = "".join(f"<li>{e(x)}</li>" for x in ITEM10_ADDENDUM["items"])
    resolutions = "".join(
        f'<li><b>{e(h)}.</b> {e(res)}<span class="why">{e(why)}</span></li>' for h, line, res, why in ASKS)
    order = "".join(
        f'<tr><th>{e(w)}</th><td><b>{e(t)}.</b> {e(l)}{"<ul>" + "".join(f"<li>{e(d)}</li>" for d in det) + "</ul>" if det else ""}</td></tr>'
        for w, t, l, det in ORDER)
    statement = "".join(f"<p>{e(p)}</p>" for p in STATEMENT)
    pillars = "".join(
        f'<div class="pil"><h3>{e(k)}: {e(h)}</h3><p class="lead">{e(line)}</p><ul>{"".join(f"<li>{e(x)}</li>" for x in pts)}</ul></div>'
        for k, h, line, pts in PILLARS)
    tiles = "".join(
        f'<tr><th>{e(big)}</th><td><b>{e(h)}</b> {e(line)} {e(d) if not d.startswith("See ") else ""} {label(lab)}</td></tr>'
        for big, h, line, d, lab in TILES)
    swaps = "".join(f"<tr><th><s>{e(a)}</s></th><td>{e(b)} {label(lab)}</td></tr>" for a, b, lab in SWAPS)
    court = "".join(f"<li>{e(p)}</li>" for p in COURT_POINTS)
    wall = "".join(
        f'<tr><td>{e(n)}</td><td class="r">{"".join("■" if i in r else "□" for i in range(1, 9))}</td><td>{e(s)}</td></tr>'
        for n, r, s in WALL)
    council = "".join(f"<tr><th>{e(d)}</th><td>{e(t)}</td></tr>" for d, t in COUNCIL_CASE)
    regimes = "".join(f"<tr><th>{e(k)}</th><td><b>{e(n)}.</b> {e(t)}</td></tr>" for k, n, t in REGIMES)
    sources = "".join(f'<li>{e(t)}{"<br><span class=u>" + e(u) + "</span>" if u else ""}</li>' for t, u in SOURCES)
    keys = "".join(f"<li>{label(k)} {e(d)}</li>" for k, (n, d) in LABELS.items())
    rules = "".join(f"<li><b>{e(a)}</b> {e(b)}</li>" for a, b in MIC_RULES)
    known = "".join(f'<tr><th>{e(h)}</th><td>{e(d)} {label(lab)} <span class="wref">Wiki: {e(ref)}</span></td></tr>' for h, line, d, lab, ref in KNOWN)
    withheld = "".join(f"<tr><th>{e(b)}</th><td>{e(pz)}</td></tr>" for b, pz, lab in WITHHELD)
    risks = "".join(f"<li><b>{e(h)}</b> {e(l)}</li>" for h, l in RISKS)
    counts = " · ".join(f"<b>{e(n)}</b> {e(l)}" for n, l, src in COUNTS)
    brief_pages = ""
    for c in BRIEF:
        rec = "".join(f"<li>{e(t)} {label(k)}</li>" for t, k in c["record"])
        tst = "".join(f"<li>{e(t)} {label(k)}</li>" for t, k in c["tested"])
        agn = "".join(f"<li>{e(t)} {label(k)}</li>" for t, k in c.get("against", []))
        q, ans = c["if_asked"]
        brief_pages += f"""<div class="cmp">
  <div class="cmp-h"><span class="cmp-id">{e(c['id'])}</span> {e(c['title'])}</div>
  <p class="cmp-say">{e(c['say'])}</p>
  {('<p class="cmp-l">On the record</p><ul>' + rec + '</ul>') if rec else ''}
  {('<p class="cmp-l">Still being tested</p><ul>' + tst + '</ul>') if tst else ''}
  {('<p class="cmp-l cmp-l-against">What cuts against us</p><ul>' + agn + '</ul>') if agn else ''}
  <p class="cmp-ask"><b>If asked {e(q)}</b> {e(ans)}</p>
  <p class="wref">Evidence: {e(' · '.join(c['refs']))}</p>
</div>"""

    return f"""<!doctype html>
<html lang="en-GB"><head><meta charset="utf-8"><title>Meeting pack: Great House Farm / Tŷ Mawr, 22 October 2026</title>
<style>{FONT_CSS}{TOKENS}{PACK_CSS}</style></head>
<body>

<section class="page cover">
  <div class="band">
    <p class="kicker">{e(MEETING['body'])}. {e(MEETING['date'])}, {e(MEETING['time'])}</p>
    <h1>Preserving our identity.</h1>
    <p class="sub">Great House Farm / Tŷ Mawr, Llandough: meeting pack for Item 10</p>
  </div>
  <div class="letter">
    <p class="addr">{e(LETTER['to'])}<br>{e(LETTER['by'])}<br>{e(MEETING['updated'])}</p>
    <p class="subj">{e(LETTER['subject'])}</p>
    {body}
    <ol>{reqs}</ol>
    {close}
    <p class="sign">{e(LETTER['sign'])}</p>
  </div>
  <p class="contents">In this pack: 1 Letter. 2 Replacement wording for Item 10 and draft resolutions. 3 Running order. 4 Statement. 5 The briefing: nine compartments. 6 Disclosure and risks. 7 Records access. 8 Rights and sources.</p>
</section>

<section class="page">
  <h2><span>2</span> Replacement wording for Item 10</h2>
  <p>We ask that the heading of Item 10 is replaced with the following, so that members and the public have proper notice:</p>
  <div class="addendum"><p><b>{e(ITEM10_ADDENDUM['heading'])}</b></p><ul>{add_items}</ul></div>
  <h2 class="mt"><span>2</span> Draft resolutions</h2>
  <p>In priority order. A councillor may wish to give notice of motion in these terms.</p>
  <ol class="res">{resolutions}</ol>
</section>

<section class="flow">
  <h2><span>3</span> Running order</h2>
  <table class="t">{order}</table>
  <h2 class="mt"><span>3</span> Three rules at the microphone</h2>
  <ol class="rules">{rules}</ol>
</section>

<section class="page">
  <h2><span>4</span> Statement to the Council</h2>
  <p class="meta">About three minutes. For the public participation session (Item 4), and for the record.</p>
  <div class="statement">{statement}</div>
  <h3>Sixty-second version</h3>
  <p class="statement60">{e(STATEMENT_60)}</p>
</section>

<section class="flow">
  <h2><span>5</span> The briefing</h2>
  <p class="meta">{e(BRIEF_INTRO)}</p>
  <p class="threshold">{e(THRESHOLD)}</p>
  <p class="meta">From the family's public registers on the Great House Farm Wiki: {counts}.</p>
  {brief_pages}
</section>

<section class="page">
  <h2><span>6</span> Where disclosure stands</h2>
  <table class="t">{withheld}</table>
  <p class="meta">{e(WITHHELD_NOTE)}</p>
  <h2 class="mt"><span>6</span> If nothing is done</h2>
  <ul class="risk">{risks}</ul>
</section>

<section class="flow">
  <h2><span>7</span> Records access: eighteen months, twenty organisations</h2>
  <p class="meta">Stages: {e(', '.join(f'{i} {r}' for i, r in enumerate(RINGS, 1)))}. ■ = step taken. {e(WALL_NOTE)}</p>
  <table class="t wall">{wall}</table>
  <h3>This Council's own file</h3>
  <table class="t">{council}</table>
</section>

<section class="page">
  <h2><span>8</span> Three rights, not one</h2>
  <table class="t">{regimes}</table>
  <h2 class="mt"><span>8</span> Labels and sources</h2>
  <ul class="keys">{keys}</ul>
  <ol class="src">{sources}</ol>
  <h3>How this was prepared</h3>
  <p class="meta">Version {e(VERSION['version'])}, {e(VERSION['date'])}. {e(VERSION['prepared_by'])}. {e(VERSION['method'])} {e(VERSION['corrections'])} {e(VERSION['source_control'])}</p>
  <div lang="cy"><h3>{e(CYMRAEG['title'])}</h3>{''.join(f'<p class="meta">{e(x)}</p>' for x in CYMRAEG['lines'])}<p class="meta"><i>{e(CYMRAEG['note'])}</i></p></div>
  <p class="meta">Prepared by the Williams–Buckler family for the meeting of {e(MEETING['date'])}. Testimony is attributed to the named person, and the Buckler case's legal contentions are labelled as such. Fraud, concealment or government involvement has not been established; the family is seeking the records that would test it. This pack concerns Llandough-juxta-Penarth, not Llandough-juxta-Cowbridge or the Great House at Llandow or Aberthin. Online: 2026-10-22.bucklerfamily.estate</p>
</section>
</body></html>
"""


PACK_CSS = r"""
@page{size:A4;margin:15mm 16mm 16mm}
*{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{margin:0;font-family:var(--text);font-size:9.6pt;line-height:1.45;color:var(--ink)}
h1,h2,h3,.q,th{font-family:var(--display)}
.page{break-after:page}.flow+section{margin-top:7mm}.page:last-child{break-after:auto}
.cover .band{background:var(--slate);color:#fff;padding:9mm 9mm 8mm;margin-bottom:7mm}
.kicker{margin:0 0 3mm;color:var(--stone);font-size:9pt}
h1{font-stretch:62%;font-weight:850;text-transform:uppercase;font-size:44pt;line-height:.9;margin:0}
.sub{margin:3mm 0 0;font-size:11pt}
.cover .band{border-bottom:3mm solid var(--red)}
.letter p{margin:0 0 2.6mm}.letter ol{margin:0 0 3mm;padding-left:5mm}.letter li{margin-bottom:1.6mm}
.addr{color:var(--muted)}.subj{font-weight:800;font-size:10.5pt}
.sign{font-weight:700}
.contents{margin-top:5mm;padding-top:3mm;border-top:1px solid var(--rule);font-size:8.4pt;color:var(--muted)}
h2{font-stretch:62%;font-weight:850;text-transform:uppercase;font-size:22pt;line-height:.95;margin:0 0 4mm;padding-bottom:2mm;border-bottom:2.5pt solid var(--ink)}
h2 span{color:var(--red);margin-right:3mm}
h2.mt{margin-top:7mm}
h3{font-stretch:75%;font-weight:800;font-size:12.5pt;margin:5mm 0 2mm;text-transform:uppercase}
.addendum{border-left:2mm solid var(--red);background:var(--lime);padding:3mm 4mm}
.addendum ul{list-style:none;padding:0;margin:2mm 0 0}.addendum li{margin-bottom:1.4mm}
.res{padding-left:5mm}.res li{margin-bottom:2.4mm}.res .why{display:block;color:var(--muted);font-size:8.6pt}
.t{width:100%;border-collapse:collapse}
.t th{text-align:left;vertical-align:top;font-stretch:75%;font-weight:800;width:32mm;padding:2mm 3mm 2mm 0;font-size:10pt}
.t td{vertical-align:top;padding:2mm 0;border-bottom:.5pt solid var(--rule)}
.t th{border-bottom:.5pt solid var(--rule)}
.t ul{margin:1mm 0 0;padding-left:4mm}
.tiles th{color:var(--red);font-size:14pt;font-stretch:62%;text-transform:uppercase}
.swaps th s{font-stretch:62%;font-size:13pt;text-transform:uppercase;color:var(--stone);text-decoration-color:var(--red);text-decoration-thickness:1.5pt}
.wall td{padding:.7mm 0;font-size:8pt}.wall .r{letter-spacing:.4mm;color:var(--slate);white-space:nowrap;padding:1.3mm 3mm}
.statement p{font-size:9.4pt;line-height:1.4;margin:0 0 1.6mm}
.statement60{font-size:8.8pt}
.meta{color:var(--muted);font-size:8.6pt}
.pils .pil{margin-bottom:3mm}.pil h3{margin-top:2mm}.pil .lead{font-weight:700;margin:0 0 1mm}.pil ul{margin:0;padding-left:4mm}
.mission{background:var(--slate);color:#fff;padding:4mm 5mm;margin-top:4mm}
.mission .q{font-stretch:62%;font-weight:850;text-transform:uppercase;font-size:20pt;line-height:1;margin:0 0 2mm}
.mission p{margin:0}
.ph{margin:5mm 0 0}.ph img{width:100%;max-height:78mm;object-fit:cover;display:block}.ph figcaption{font-size:8pt;color:var(--muted);margin-top:1.5mm}
.tag{display:inline-block;font-size:7pt;font-weight:700;padding:.3mm 2mm;border-radius:3mm;white-space:nowrap}
.tag-rec{background:#dfe9e3;color:var(--moss)}.tag-fam{background:#f6dfe3;color:#8f0b21}.tag-open{background:#ececec;color:#444}
.keys{list-style:none;padding:0}.keys li{margin-bottom:1.5mm}
.src{padding-left:5mm;font-size:8.6pt}.src li{margin-bottom:1.6mm}.src .u{color:var(--muted);font-size:7.6pt;word-break:break-all}
.rules{padding-left:5mm}
.cmp{border-top:1.5pt solid var(--ink);padding:2.5mm 0 3mm}
.cmp-h,.cmp-say{break-after:avoid}.cmp ul,.cmp-ask{break-inside:avoid}
.cmp-h{font-family:var(--display);font-stretch:70%;font-weight:850;text-transform:uppercase;font-size:12pt;color:var(--muted)}
.cmp-id{color:var(--red);margin-right:2mm}
.cmp-say{font-size:11pt;font-weight:700;margin:1mm 0 2mm;line-height:1.35}
.cmp-l{font-size:8pt;font-weight:800;color:var(--red);margin:1.5mm 0 .5mm}
.cmp-l-against{color:var(--ink)}
.cmp ul{margin:0;padding-left:4.5mm}.cmp li{margin-bottom:.8mm;font-size:9pt}
.cmp-ask{background:var(--lime);border-left:1.2mm solid var(--ink);padding:1.5mm 3mm;margin:2mm 0 1mm;font-size:9pt}
.threshold{font-size:10.5pt;font-weight:600;border-left:2mm solid var(--red);padding:2mm 4mm;background:var(--lime)}
.knownt th{width:44mm;font-size:9.6pt}
.knownt td{font-size:8.7pt}
.wref{color:var(--muted);font-size:7.4pt}
.risk{padding-left:4mm}.risk li{margin-bottom:2mm}
"""


def script_txt():
    lines = ["GREAT HOUSE FARM / TŶ MAWR — STATEMENT TO LLANDOUGH COMMUNITY COUNCIL",
             f"{MEETING['date']}, {MEETING['time']}. About three minutes.", ""]
    for p in STATEMENT:
        lines += [p, ""]
    lines += ["", "SIXTY-SECOND VERSION", "", STATEMENT_60, "",
              "", "THE FOUR ASKS FOR TONIGHT",
              "1. Receive our statement and pack, and minute them.",
              "2. Make Great House Farm / Tŷ Mawr a standing item, with a named councillor.",
              "3. Recommend to the Senedd that an independent inquiry be considered.",
              "4. Write to the bodies holding the records in support of disclosure and preservation.", "",
              "", "BRIEFING CUE CARD (say the line, move on; expand only if asked)", ""]
    for c in BRIEF:
        lines += [f"{c['id']}  {c['title'].upper()}", f"    SAY: {c['say']}", f"    IF ASKED {c['if_asked'][0]} {c['if_asked'][1]}"]
        lines += [f"    AGAINST US: {t}" for t, k in c.get("against", [])] + [""]
    return "\n".join(lines)


def main():
    # Keep the agent interface durable when this generated page is rebuilt.
    index_html = site()
    if 'id="agent-access"' not in index_html:
        index_html = index_html.replace(
            "</head>",
            '<link rel="alternate" type="application/json" href="/agent-index.json" title="Machine-readable meeting toolkit index">\n'
            '<link rel="alternate" type="text/plain" href="/llms.txt" title="Agent reading guide">\\n</head>',
            1,
        )
        index_html = index_html.replace(
            "</body>",
            '<section id="agent-access" aria-label="AI-agent access" style="max-width:1160px;margin:28px auto;padding:14px 16px;border-top:1px solid #d5dad6;font:14px/1.5 system-ui,sans-serif;color:inherit">'
            '<strong>AI-agent access</strong><p id="webmcp-status">WebMCP provides read-only tools in compatible browsers. Agent index, meeting script and HTML pack are available without WebMCP.</p>'
            '<p><a href="/agent-index.json">Machine-readable resource catalogue</a> · <a href="/llms.txt">Agent reading guide</a> · <a href="/meeting-script.txt">Meeting script</a> · <a href="/pack.html">Clerk pack (HTML)</a></p>'
            '</section><script src="/agent-tools.js" defer></script></body>',
            1,
        )
    with open(os.path.join(HERE, "index.html"), "w", encoding="utf-8") as f:
        f.write(index_html)
    with open(os.path.join(HERE, "pack.html"), "w", encoding="utf-8") as f:
        f.write(pack())
    with open(os.path.join(HERE, "meeting-script.txt"), "w", encoding="utf-8") as f:
        f.write(script_txt())
    if "--no-pdf" in sys.argv:
        return
    from playwright.sync_api import sync_playwright
    with sync_playwright() as p:
        b = p.chromium.launch()
        pg = b.new_page()
        pg.goto("file://" + os.path.join(HERE, "pack.html"))
        pg.wait_for_load_state("networkidle")
        pg.evaluate("document.fonts.ready")
        pg.pdf(path=os.path.join(HERE, "meeting-pack.pdf"), format="A4", print_background=True, tagged=True, outline=True,
               display_header_footer=True, header_template="<span></span>",
               footer_template='<div style="width:100%;font:7pt Arial;color:#777;padding:0 16mm;display:flex;justify-content:space-between">'
                               '<span>Great House Farm / Tŷ Mawr. Meeting pack, Llandough Community Council, 22 October 2026</span>'
                               '<span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span></div>',
               margin={"top": "15mm", "bottom": "16mm", "left": "16mm", "right": "16mm"})
        b.close()


if __name__ == "__main__":
    main()
