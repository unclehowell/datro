#!/usr/bin/env python3
"""Build shop.bucklerfamily.estate (static). Reads ../products.json + ../designs.json, writes public/index.html, terms/, designs/.
Rules gate: banned words + privacy grep run on every page before writing. — Sion's Tab agent"""
import json, re, html, sys, pathlib
HERE = pathlib.Path(__file__).resolve().parent; PUB = HERE/'public'; M = HERE.parent
P = json.load(open(M/'products.json')); DS = json.load(open(M/'designs.json')); CFG = json.load(open(M/'shop.json'))
e = html.escape
HEAD = """<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{title}</title><meta name="description" content="{desc}">
<meta property="og:title" content="{title}"><meta property="og:description" content="{desc}"><meta property="og:image" content="https://shop.bucklerfamily.estate/img/og.jpg"><meta property="og:url" content="https://shop.bucklerfamily.estate{path}">
<link rel="icon" href="/img/icon.png"><link rel="preload" href="/assets/fonts/barlow-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/assets/theme.css?v={v}"><link rel="stylesheet" href="/assets/shop.css?v={v}">
<script src="/assets/theme.js?v={v}" defer></script><script src="https://bucklerfamily.estate/ghf-lang/ghf-lang.js?v=2.0.3" data-site="shop" defer></script>
<script src="https://bucklerfamily.estate/ebook/cta.js" defer></script>
<script src="https://bucklerfamily.estate/ghf-lang/ghf-boot.js?v=2.0.3"></script>
</head><body class="sl-home">
<header class="sl-nav"><nav class="top" aria-label="Site"><a href="/"><strong>Cedwyn Estate shop</strong></a><a href="/#products">Collection</a><a href="https://ebooks.bucklerfamily.estate/">E-books</a><a class="sl-ghost" href="https://greathousefarmwiki.wordpress.com/">Legal Wiki</a></nav></header>
"""
FOOT = """<footer class="sl-foot"><div class="sl-foot-in"><a class="sl-foot-title" href="/">Cedwyn Estate shop · Tŷ Mawr / Great House Farm</a>
<a href="https://bucklerfamily.estate/">&#10229; Back to Cedwyn Estate</a><a href="https://ebooks.bucklerfamily.estate/">E-books</a><a href="https://bucklerfamily.estate/ebook/">The Legal Wiki book</a><a href="https://greathousefarmwiki.wordpress.com/">Legal Wiki</a><a href="/terms/">Terms, delivery and returns</a><a href="https://ty-mawr-gift-shop.printify.me/">The whole store</a>
<p class="sh-fine">Merch is sold by DATRO CONSORTIUM LIMITED, the merchant of record, pro bono and at cost, to fund the Great House Farm / Tŷ Mawr heritage story project. Printed to order and shipped by our print partner. Checkout is secure and card details never touch this site.</p>
<p class="sh-fine">— Sion's Tab agent</p></div></footer></body></html>"""
def card(p):
    buy = p.get('buy_url')
    pr = p['price_label'] if p.get('price_label') else ('from ' if (p.get('price_usd_max') or 0) > p['price_usd'] else '') + f"${p['price_usd']:.2f}"
    label = 'Buy' if (CFG.get('checkout_open') or p.get('buy_now')) else 'See it'
    btn = f'<a class="sl-btn sh-buy" href="{e(buy)}" rel="noopener">{label} · {pr}</a>' if buy else f'<span class="sl-btn sh-buy sh-off">Coming soon · {pr}</span>'
    imgs = p.get('image') or ''
    tag = '<p class="sh-draft">New · opens with checkout</p>' if p.get('draft') else ''
    return f"""<article class="sh-card" id="{e(p['id'])}"><div class="sh-img"><img src="{e(imgs)}" alt="{e(p['title'])}" loading="lazy" width="600" height="600"></div>
<div class="sh-body">{tag}<p class="sh-kind">{e(p['kind'])}</p><h3>{e(p['title'])}</h3><p>{e(p['desc'])}</p>{btn}</div></article>"""
def dcard(d):
    return f"""<figure class="sh-d"><img src="/img/{e(d['file'])}.webp?v=lockup1" alt="{e(d['title'])}" loading="lazy" width="640" height="640"><figcaption><strong>{e(d['title'])}</strong> {e(d['note'])}</figcaption></figure>"""
v = CFG.get('v','1')
# 21 Oct 2026, owner's instruction: no invented heraldry. Crest/arms products and designs are not listed (files and Printify items kept).
NOHERALDRY = lambda x: not re.search(r'crest|\barms\b', json.dumps(x), re.I)
P = [p for p in P if NOHERALDRY(p)]; DS = [d for d in DS if NOHERALDRY(d)]
live = [p for p in P if p.get('buy_url')]
NOTICE = '' if CFG.get('checkout_open') else '<p class="sh-note">Printed items open for checkout very soon; the newest (Lavernock 1897 and Peerless Jim) are marked New.</p>'
idx = HEAD.format(title="Cedwyn Estate shop · Tŷ Mawr / Great House Farm", desc="The Cedwyn Estate shop: photographs from the farm’s own album, Lavernock 1897 and Peerless Jim prints, posters, T-shirts, mugs and totes for Tŷ Mawr / Great House Farm, Llandough. Printed to order, sold at cost.", path="/", v=v) + f"""
<main>
<section class="sl-hero sh-hero"><div class="sl-hero-in"><p class="sh-k">Tŷ Mawr · Great House Farm · Llandough</p>
<h1>Cedwyn Estate</h1>
<p>The estate as the family theorises it once was, and the farm at its heart. Photographs from the farm’s own album and local history, printed when you order and sold at cost.</p>
<p><a class="sl-btn" href="#products">Shop the collection</a> <a class="sl-btn sl-ghost" href="https://ebooks.bucklerfamily.estate/">The e-books</a></p></div></section>
<section class="sh-sec" id="products"><h2>The Cedwyn Estate collection</h2><p class="sh-lead">{e(CFG['products_lead'])}</p>
{NOTICE}<div class="sh-grid">{''.join(card(p) for p in P)}</div></section>
<section class="sh-sec" id="books"><h2>Books</h2><p class="sh-lead">The story behind the designs, in full.</p>
<div class="sh-books"><a class="sh-book" href="https://bucklerfamily.estate/ebook/"><strong>The Great House Farm Legal Wiki</strong><span>The whole wiki as one e-book · from £0.00 · £9.99 – v0.02 · all four £31.99</span></a>
<a class="sh-book" href="https://ebooks.bucklerfamily.estate/"><strong>All the e-books</strong><span>Every book from £0.00 – v0.01 and £9.99 – v0.02; all four for £31.99</span></a></div></section>
<section class="sh-sec" id="designs"><h2>The designs</h2><p class="sh-lead">Every picture of the farm is a real photograph from the farm’s own album: restored and toned, never redrawn or generated. No photograph shows a person.</p>
<div class="sh-dgrid">{''.join(dcard(d) for d in DS)}</div></section>
<section class="sh-sec" id="how"><h2>How an order works</h2><ol class="sh-steps">
<li>Pick an item and press the button. It opens in our print partner's secure store, where you choose size and colour and pay.</li>
<li>The item is printed to order by a print partner near you (UK items print in the UK where available).</li>
<li>It is posted to you, with tracking. Delivery cost and time are shown at checkout before you pay.</li>
<li>If it arrives damaged or misprinted, it's reprinted or refunded. See <a href="/terms/">terms, delivery and returns</a>.</li></ol>
<p class="sh-fine">Prices are in US dollars, the store's base currency; your card converts at checkout. They cover the print, the payment fees and little else. The project runs at cost, not for profit.</p></section>
</main>""" + FOOT
terms = HEAD.format(title="Terms, delivery and returns · Cedwyn Estate shop", desc="Who sells the merch, how delivery works, and returns.", path="/terms/", v=v) + f"""
<main class="sh-page"><h1>Terms, delivery and returns</h1>
<h2>Who sells to you</h2><p>The merchant of record for every merch order is <strong>DATRO CONSORTIUM LIMITED</strong>, a company registered in England and Wales. DATRO runs this shop pro bono, on behalf of the Great House Farm / Tŷ Mawr heritage project. It sells at cost and not for profit; any surplus goes to the project.</p>
<h2>Payment</h2><p>You pay at our print partner's secure checkout ({e(CFG['partner_name'])}). Card details are handled by the payment processor and never pass through this website.</p>
<h2>Printing and delivery</h2><p>Each item is printed when you order it, usually within 2–5 working days, then posted with tracking. The delivery price and estimated time for your address are shown at checkout before you pay.</p>
<h2>Returns and faults</h2><p>Items are made to order, so we can't take returns for a change of mind (the right to cancel doesn't apply to personalised or made-to-order goods under the Consumer Contracts Regulations 2013). If an item arrives damaged, misprinted or faulty, tell us within 30 days with a photo and we'll arrange a free reprint or a full refund. Your statutory rights under the Consumer Rights Act 2015 are not affected.</p>
<h2>Contact</h2><p>Questions about an order: <a href="mailto:{e(CFG['contact_email'])}">{e(CFG['contact_email'])}</a>. Please include your order number.</p>
<h2>The designs</h2><p>All designs were made for this shop and are © DATRO CONSORTIUM LIMITED for the Great House Farm / Tŷ Mawr project. Pictures of the farm are real photographs from the farm’s own album, restored (upscaled, contrast, toning, sky removal) without changing what they show. The Peerless Jim photograph is a public-domain archive photograph (Bain News Service, Library of Congress). The other designs are typography.</p>
<p class="sh-fine">Last updated 22 October 2026. — Sion's Tab agent</p></main>""" + FOOT
# 22 Oct 2026: the map pack download was withdrawn (no licence held), so the thank-you page is gone; /thank-you/ redirects to the shop (public/_redirects).
NF_PAGE = HEAD.format(title="Not found · Cedwyn Estate shop", desc="This page is not in the Cedwyn Estate shop.", path="/404", v=v) + """
<main class="sh-page"><h1>Not found</h1><p>This item or page is not in the shop.</p>
<p><a class="sl-btn" href="/">&#10229; Back to the Cedwyn Estate shop</a></p></main>""" + FOOT
BANNED = re.compile(r"\b(says|claims|according to|hearsay|unverified|alleged|allegedly|family account|family's account|family testimony)\b", re.I)
PRIV = re.compile(r"Robin Hill|hywelapbuckler|7845 ?933 ?262|(\+44 ?7|\b07)\d{3} ?\d{3} ?\d{3}|\b[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}\b|@(gmail|hotmail|yahoo|outlook|icloud|btinternet|aol)\.|\bSion Buckler\b")
bad = []
for name, txt in (('index', idx), ('terms', terms), ('404', NF_PAGE)):
    plain = re.sub(r'<[^>]+>', ' ', txt)
    for m in BANNED.finditer(plain): bad.append((name, 'banned', m.group(0)))
    for m in PRIV.finditer(txt): bad.append((name, 'privacy', m.group(0)))
if bad: sys.exit('GATE FAILED: %r' % bad)
(PUB/'index.html').write_text(idx); (PUB/'404.html').write_text(NF_PAGE); (PUB/'terms').mkdir(exist_ok=True); (PUB/'terms'/'index.html').write_text(terms)
print('built', len(P), 'products', len(live), 'live;', len(DS), 'designs; gate ok')
