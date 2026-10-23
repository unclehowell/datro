#!/usr/bin/env python3
"""build_social.py — builds fb.bucklerfamily.estate as a mock social network from tools/social_data.py.
Writes: site/index.html (feed), site/u/<profile>.html, site/n/<post>.html, site/profiles.html, site/social.css, site/social.js,
and merges the new posts and photos into site/posts.json (read by the comments Worker). Keeps the header standard v2 loader
(ghf-boot.js) as the last line of every <head>. The older family timeline lives on at site/timeline.html (+ site/p/).
Run: python3 tools/build_social.py  — Sion's Tab agent"""
import html, json, os, re, hashlib, shutil
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = os.path.join(ROOT, "site")
BASE = "https://fb.bucklerfamily.estate"
BOOT = '<script src="https://bucklerfamily.estate/ghf-lang/ghf-boot.js?v=2.0.3"></script>'
HONEST = "A reconstruction: these outlets’ real articles shown as if posted online. Not their own accounts."
FOOT = " "
RECON = "A reconstruction: this announcement is written for this archive from the record in “Source”; the profile shown did not post it."
RECON_E = "A reconstruction: this entry is written for this archive from the record in “Source”; the place, body or person shown did not post it."
WORDING = "Words in [square brackets] are the archive’s: neutral words in place of the original’s, or gaps filled. Quotes from named people appear as their comments, word for word."
ns = {}
exec(open(os.path.join(ROOT, "tools", "social_data.py"), encoding="utf-8").read(), ns)
OUT, PEO, POSTS, STORIES = ns["OUTLETS"], ns["PEOPLE"], sorted(ns["POSTS"], key=lambda p: (p["date"], p["id"])), ns["STORIES"]

# PRINCE2 highlight-report videos (data/highlights.json, work/highlight-video/publish_fb.py): newest 7 lead the Videos page and the Stories rail.
_hp = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "highlights.json")
if os.path.exists(_hp):
    STORIES = [{"id": "s-hr-" + r["date"], "by": "williams-buckler-family", "poster_name": "Williams / Buckler family", "title": r["title"], "kind": "video",
                "src": r["video"], "thumb": r["poster"], "seconds": int(round(r.get("duration", 40))),
                "credit": "%s · %s. Highlight report video, made for the family archive (Wayback Vault)." % (r["hr_id"], r["period"]),
                "link": "index.html#hf-%s" % r["date"]} for r in json.load(open(_hp, encoding="utf-8"))["days"][:7]] + list(STORIES)
EVL = json.load(open(os.path.join(ROOT, "tools", "ev_links.json"), encoding="utf-8"))
PA = "https://greathousefarmwiki.wordpress.com/press-archive-transcripts/"
e = lambda s: html.escape(s, quote=True)

# ---------- Friends and public statements (data/friends.json, data/statements.json) ----------
# The Friends page links every card to its farmbook profile; each profile opens on "Public statements":
# dated, verbatim (or marked summary) with a source link. A profile with none says so in one line.
FRIENDS = json.load(open(os.path.join(ROOT, "data", "friends.json"), encoding="utf-8"))["friends"]
STJ = json.load(open(os.path.join(ROOT, "data", "statements.json"), encoding="utf-8"))
for _f in FRIENDS:
    if _f["slug"] not in OUT and _f["slug"] not in PEO:
        PEO[_f["slug"]] = {"name": _f["name"], "kind": _f.get("kind", "Body"), "entity": True, "initials": _f.get("initials", ""),
                           "color": _f.get("color", "#65676b"), "about": _f["role"], "avatar": "img/social/av-%s.svg" % _f["slug"]}
STM = {}
for _s in STJ["statements"]:
    for _sl in _s["profiles"]:
        STM.setdefault(_sl, []).append(_s)
for _v in STM.values():
    _v.sort(key=lambda s: s["date"])

def ver(path):
    return hashlib.sha1(open(os.path.join(SITE, path), "rb").read()).hexdigest()[:10]

# ---------- avatars for outlets without a picture: small SVG lettering ----------
os.makedirs(os.path.join(SITE, "img", "social"), exist_ok=True)
for slug, o in OUT.items():
    if not o.get("avatar"):
        t = o["initials"]; fs = 46 if len(t) <= 2 else (34 if len(t) == 3 else 28)
        svg = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%s"/>'
               '<text x="50" y="50" dy=".35em" text-anchor="middle" font-family="Georgia,Times New Roman,serif" font-weight="700" font-size="%d" fill="#fff">%s</text></svg>') % (o["color"], fs, e(t))
        open(os.path.join(SITE, "img", "social", "av-%s.svg" % slug), "w").write(svg)
        o["avatar"] = "img/social/av-%s.svg" % slug
for slug, p in PEO.items():
    p.setdefault("kind", "Person")
    if p.get("entity") and not os.path.exists(os.path.join(SITE, p["avatar"])):
        t = p.get("initials") or "".join(w[0] for w in p["name"].split()[:2]).upper(); fs = 44 if len(t) <= 2 else 32
        svg = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%s"/>'
               '<text x="50" y="50" dy=".36em" text-anchor="middle" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif" font-weight="700" font-size="%d" fill="#fff">%s</text></svg>') % (p.get("color", "#65676b"), fs, e(t))
        open(os.path.join(SITE, p["avatar"]), "w").write(svg)

def prof(slug):
    return OUT.get(slug) or PEO.get(slug)

ICON = {
 "feed": '<path d="M4 11.5 12 4l8 7.5V20h-5.5v-5h-5v5H4z" fill="currentColor"/>',
 "pages": '<rect x="3.5" y="4" width="7" height="7" rx="1.6" fill="currentColor"/><rect x="13.5" y="4" width="7" height="7" rx="1.6" fill="currentColor" opacity=".75"/><rect x="3.5" y="13" width="7" height="7" rx="1.6" fill="currentColor" opacity=".75"/><rect x="13.5" y="13" width="7" height="7" rx="1.6" fill="currentColor"/>',
 "time": '<circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 7.5V12l3.2 2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
 "menu": '<path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>',
 "globe": '<circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" stroke-width="1.3"/><path d="M1.5 8h13M8 1.5c2.5 2.5 2.5 10.5 0 13M8 1.5c-2.5 2.5-2.5 10.5 0 13" fill="none" stroke="currentColor" stroke-width="1.1"/>',
 "play": '<circle cx="12" cy="12" r="11" fill="rgba(0,0,0,.55)"/><path d="M9.5 7.5v9l7-4.5z" fill="#fff"/>',
 "plus": '<circle cx="12" cy="12" r="10" fill="currentColor"/><path d="M12 7v10M7 12h10" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>',
 "search": '<circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M15.5 15.5 21 21" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>',
 "chat": '<path d="M12 2.5C6.5 2.5 2.5 6.4 2.5 11.3c0 2.8 1.4 5.3 3.6 6.9v3.3l3.3-1.8c.8.2 1.7.3 2.6.3 5.5 0 9.5-3.9 9.5-8.8S17.5 2.5 12 2.5zm1 11.8-2.4-2.6-4.7 2.6 5.2-5.5 2.5 2.6 4.6-2.6z" fill="currentColor"/>',
 "photo": '<rect x="3" y="5" width="18" height="14" rx="2.5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="9" cy="10" r="1.8" fill="currentColor"/><path d="M5 17l5-4.5 3 2.6 3-2.6 3 4.5z" fill="currentColor"/>',
 "video": '<rect x="2.5" y="6" width="13.5" height="12" rx="2.5" fill="currentColor"/><path d="M17 10.5 21.5 8v8L17 13.5z" fill="currentColor"/>',
 "people": '<circle cx="9" cy="8.5" r="3.6" fill="currentColor"/><circle cx="16.5" cy="9.5" r="2.8" fill="currentColor" opacity=".8"/><path d="M2.5 19c.5-4 3.3-6.3 6.5-6.3s6 2.3 6.5 6.3z" fill="currentColor"/><path d="M15.5 19c-.1-2.6-1-4.6-2.6-6 1-.6 2.2-.9 3.6-.9 2.6 0 4.6 1.9 5 6.9z" fill="currentColor" opacity=".8"/>',
 "shop": '<path d="M3 9.5 5 4h14l2 5.5v2a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0z" fill="currentColor"/><path d="M4.5 13.5V20h15v-6.5" fill="none" stroke="currentColor" stroke-width="2"/><rect x="9.5" y="14.5" width="5" height="5.5" fill="#fff"/>',
 "bell": '<path d="M12 3a6 6 0 0 0-6 6v3.5L4.2 15.6c-.4.6 0 1.4.8 1.4h14c.8 0 1.2-.8.8-1.4L18 12.5V9a6 6 0 0 0-6-6z" fill="currentColor"/><path d="M9.5 19a2.5 2.5 0 0 0 5 0z" fill="currentColor"/>',
 "x": '<path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>',
}
def ico(k, vb="0 0 24 24", cls="si"):
    return '<svg viewBox="%s" aria-hidden="true" class="%s">%s</svg>' % (vb, cls, ICON[k])

def head(title, desc, rel, og_img="img/social/william-cover-tractor.webp", canon=""):
    up = "../" * rel.count("/")
    return ('<!doctype html><html lang="en-GB" data-ghf-native="light"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
            '<title>%s</title><meta name="description" content="%s"><meta property="og:title" content="%s"><meta property="og:description" content="%s">'
            '<meta property="og:image" content="%s/%s"><meta property="og:url" content="%s/%s"><meta name="theme-color" content="#1877f2">'
            '<link rel="stylesheet" href="/social.css?v=%s"><script src="/social.js?v=%s" defer></script><script src="/comments.js?v=%s" defer></script>'
            '<link rel="alternate" type="application/json" title="Posts and comments API" href="https://comments.bucklerfamily.estate/api/posts">%s\n</head>'
            ) % (e(title), e(desc), e(title), e(desc), BASE, og_img, BASE, canon, ver("social.css"), ver("social.js"), ver("comments.js"), BOOT)

def top(active, up=""):
    menu = ''.join('<a href="%s">%s</a>' % (h, e(t)) for h, t in [
        ("/", "Feed: the story as the papers told it"), ("/videos.html", "Videos and stories"), ("/profiles.html", "All profiles"), ("/friends", "Friends: public statements"), ("/u/tab-bot.html", "Tab.bot (AI agent)"),
        ("/timeline.html", "Family archive timeline"), ("/photos.html", "Archive photos"), ("/facebook.html", "Preserved from Facebook"),
        ("https://maps.bucklerfamily.estate/", "The Map Room"), ("https://greathousefarmwiki.wordpress.com/", "The Legal Wiki"), ("https://shop.bucklerfamily.estate/", "Gift Shop & Marketplace"),
        ("/m/login", "Family members: sign in"), ("/api/", "API for AI agents")])
    return ('<a class="skip" href="#main">Skip to content</a><header class="fb-top"><button type="button" class="fb-ic fb-menu-btn" aria-label="Menu" aria-expanded="false" aria-controls="fb-menu">%s</button>'
            '<a class="fb-brand" href="/" aria-label="farmbook home">farmbook</a><div class="fb-acts">'
            '<a class="fb-ic" href="/m/login" aria-label="Create: family members sign in">%s</a>'
            '<button type="button" class="fb-ic fb-search-btn" aria-label="Search the feed" aria-expanded="false">%s</button>'
            '<a class="fb-ic fb-ic-round" href="https://chat.bucklerfamily.estate/" aria-label="Chat: Ask the Archive">%s</a></div></header>'
            '<div class="fb-menu" id="fb-menu" hidden><nav aria-label="Main">%s</nav></div>'
            '<form class="fb-search" role="search" action="/" hidden><input type="search" name="q" placeholder="Search the feed" aria-label="Search the feed" autocomplete="off"><button type="button" class="fb-ic fb-search-x" aria-label="Close search">%s</button></form>'
            ) % (ico("menu"), ico("plus"), ico("search"), ico("chat"), menu, ico("x"))

def tabs(active, up=""):
    n_latest = len([p for p in POSTS if p["outlet"] == "tab-bot"])
    items = [("/", "feed", "Home", ""), ("/videos.html", "video", "Videos", ""), ("/profiles.html", "people", "Profiles", ""), ("https://shop.bucklerfamily.estate/", "shop", "Gift Shop & Marketplace", ""),
             ("/#latest", "bell", "Latest posts", '<span class="fb-badge">%d</span>' % n_latest)]
    out = ''.join('<a href="%s" aria-label="%s"%s>%s%s</a>' % (h, l, ' aria-current="page"' if active == k else "", ico(k), bd) for h, k, l, bd in items)
    out += '<button type="button" class="fb-menu-btn fb-tab-me" aria-label="Menu" aria-expanded="false" aria-controls="fb-menu"><img src="%simg/social/you.svg" alt="" width="28" height="28"><span class="fb-tab-mini">%s</span></button>' % (up, ico("menu"))
    return '<nav class="fb-tabs" aria-label="Sections">%s</nav>' % out

def stories_rail(up=""):
    cards = ['<a class="fb-st fb-st-new" href="/m/login"><img src="%simg/social/william-cover-tractor.webp" alt="" loading="lazy"><span class="fb-st-plus">%s</span><span class="fb-st-n">Create story</span></a>' % (up, ico("plus"))]
    for s in STORIES:
        who = prof(s["by"])
        cards.append('<a class="fb-st" href="%s" data-story="%s"><img src="%s%s" alt="%s" loading="lazy"><span class="fb-st-av"><img src="%s%s" alt="" width="36" height="36"></span><span class="fb-st-n">%s</span></a>'
                     % (e(up + s["link"] if not s["link"].startswith("http") else s["link"]), s["id"], up, s["thumb"], e(s["title"]), up, who["avatar"], e(s["poster_name"])))
    data = [{"id": s["id"], "by": s["poster_name"], "av": up + prof(s["by"])["avatar"], "title": s["title"], "kind": s["kind"], "yt": s.get("yt"), "start": s.get("start", 0), "src": s.get("src"), "thumb": up + s["thumb"], "seconds": s.get("seconds"), "credit": s["credit"], "link": (up + s["link"]) if not s["link"].startswith("http") else s["link"]} for s in STORIES]
    return ('<div class="fb-stories" aria-label="Stories">%s</div><script type="application/json" id="fb-stories-data">%s</script>'
            % ("".join(cards), json.dumps(data, ensure_ascii=False).replace("</", "<\\/")))

def composer(up=""):
    return ('<div class="fb-compose"><img src="%simg/social/you.svg" alt="" width="40" height="40"><a class="fb-pill" href="/m/login">What’s on your mind?</a><a class="fb-ic fb-ic-photo" href="/photos.html" aria-label="Photos">%s</a></div>' % (up, ico("photo")))

def foot():
    return ('<footer class="sb-foot"><p><strong>%s</strong></p><p>%s The profiles here are characters in a retelling, written from the record; none is the person’s, place’s or body’s own account. farmbook is the Williams / Buckler family archive’s own site. It is not affiliated with Meta or with any newspaper or broadcaster shown; their names, mastheads and logos identify the source of each article. Each post’s “Source” gives the citation. Tab.bot is an AI agent, labelled as such.</p></footer>'
            '</body></html>') % (e(FOOT), e(HONEST))

def link(u):
    if u == "@PA": return PA
    if u.startswith("@"): return EVL.get(u[1:], PA)
    return u

KIND = {"update": "Update", "entry": "Record entry", "announcement": "Announcement", "article": "Article", "extract": "Archive extract", "notice": "Notice", "letter": "Letter to the editor", "video": "Video", "record": "Debate record"}
def phid(src):
    return "p-ph-" + re.sub(r"[^a-z0-9]+", "-", os.path.basename(src).rsplit(".", 1)[0].lower()).strip("-")

def card(p, up, single=False):
    o = prof(p["outlet"]); pu = "%su/%s.html" % (up, p["outlet"])
    h = ['<article class="post sp" id="%s" data-outlet="%s"><header class="sp-h"><a class="sp-av" href="%s" tabindex="-1" aria-hidden="true"><img src="%s%s" alt="" width="40" height="40" loading="lazy"></a>'
         '<div class="sp-who"><a class="sp-n" href="%s">%s</a>%s<div class="sp-d"><a href="%sn/%s.html"><time datetime="%s">%s</time></a> · %s · %s</div></div></header>'
         % (p["id"] + ('" data-kind="announcement' if p["kind"] == "announcement" else ""), p["outlet"], pu, up, o["avatar"], pu, e(o["name"]), ('<span class="sp-ai" title="AI agent">AI</span>' if o.get("ai") else ""), up, p["id"], p.get("dt", p["date"]), e(p["when"]), KIND[p["kind"]], ico("globe", "0 0 16 16", "gi"))]
    h.append('<div class="sp-b%s"><h2 class="pt sp-t">%s</h2>' % ("" if single else " clamp", e(p["headline"])))
    if p.get("byline"): h.append('<p class="sp-by">%s</p>' % e(p["byline"]))
    for para in p["body"]: h.append("<p>%s</p>" % e(para))
    h.append('</div><button type="button" class="sp-more" hidden>See more</button>')
    if p.get("video"):
        v = p["video"]
        h.append('<figure class="sp-media sp-video"><video controls playsinline preload="none" poster="%s%s" src="%s"></video>'
                 '<figcaption>A %d-second excerpt · <a href="%s" rel="noopener">Watch the full report</a></figcaption></figure>' % (up, v["poster"], v["src"], v["seconds"], v["full"]))
    if p.get("film"):
        f = p["film"]
        h.append('<figure class="sp-media sp-film"><video controls playsinline preload="none" poster="%s%s" src="%s"></video><figcaption>%s</figcaption></figure>' % (up, f["poster"], f["src"], e(f["label"])))
    for src, cap in p.get("photos", []):
        h.append('<figure class="sp-media"><a href="%s%s"><img src="%s%s" alt="%s" loading="lazy" data-ph="%s"></a><figcaption>%s</figcaption></figure>' % (up, src, up, src, e(cap), phid(src), e(cap)))
    s = p["source"]
    links = " · ".join('<a href="%s" rel="noopener">%s</a>' % (e(link(u)), e(t)) for t, u in s["links"])
    h.append('<details class="sp-src"><summary>Source</summary><p>%s</p><p>%s</p>%s%s</details>' % (e(s["cite"]), links,
             ('<p class="sp-note">Archive note: %s</p>' % e(p["note"])) if p.get("note") else "",
             ('<p class="sp-note">%s</p>' % e(WORDING)) if (p.get("subs") or any(isinstance(c, dict) and c.get("subs") for c in p.get("comments", []))) else ""))
    if p.get("recon"):
        h.append('<p class="sp-recon">%s</p>' % e(RECON_E if p["kind"] == "entry" else RECON))
    if p.get("shares"):
        h.append('<div class="sp-shares"><p class="sp-sc">%d share%s</p>' % (len(p["shares"]), "" if len(p["shares"]) == 1 else "s"))
        for s in p["shares"]:
            x = prof(s)
            h.append('<a class="sh" href="%su/%s.html"><img src="%s%s" alt="" width="28" height="28" loading="lazy"><span><strong>%s</strong> shared this post</span></a>' % (up, s, up, x["avatar"], e(x["name"])))
        h.append("</div>")
    h.append('<div class="acts"></div>')
    if p.get("comments"):
        lab = "Comments: the papers’ items and people’s words about this death, word for word" if p["kind"] == "announcement" else "Comments from people quoted in the article"
        h.append('<div class="sp-qc" aria-label="%s">' % e(lab))
        for c in p["comments"]:
            if not isinstance(c, dict): c = dict(who=c[0], text=c[1])
            pp = prof(c["who"]); meta = c.get("label") or "Quoted in this article"
            if c.get("when"): meta = "%s · %s" % (c["when"], meta)
            extra = ('<p class="sq-flag">%s</p>' % e(c["flag"])) if c.get("flag") else ""
            if c.get("cite"):
                cl = " · ".join('<a href="%s" rel="noopener">%s</a>' % (e(up + u if u.startswith("n/") else link(u)), e(t)) for t, u in c.get("links", []))
                extra += '<details class="sq-src"><summary>Source</summary><p>%s</p><p>%s</p></details>' % (e(c["cite"]), cl)
            h.append('<div class="sq"><a href="%su/%s.html" class="sq-av" tabindex="-1" aria-hidden="true"><img src="%s%s" alt="" width="32" height="32" loading="lazy"></a><div class="sq-b"><div class="sq-bub"><a class="sq-n" href="%su/%s.html">%s</a><p>%s</p></div><div class="sq-m">%s</div>%s</div></div>'
                     % (up, c["who"], up, pp["avatar"], up, c["who"], e(pp["name"]), e(c["text"]), e(meta), extra))
        h.append("</div>")
    h.append("</article>")
    return "".join(h)

DECADES = [("1820s", "1820"), ("1860s", "1860"), ("1880s", "1880"), ("1890s", "1890"), ("1900s", "1900"), ("1930s", "1930"), ("1950s", "1950"), ("1960s", "1960"), ("1970s", "1970"), ("1980–87", "1980"), ("1988", "1988"), ("1989", "1989"), ("1990s", "1990"), ("2000s", "2000"), ("2020s", "2020")]
def anchor_for(p):
    y = int(p["date"][:4]); best = None
    for lab, start in DECADES:
        if y >= int(start): best = start
    return best

def strip_people():
    out = []
    for slug in list(PEO) + list(OUT):
        x = prof(slug)
        out.append('<a class="st" href="u/%s.html"><img src="%s" alt="" width="56" height="56" loading="lazy"><span>%s</span></a>' % (slug, x["avatar"], e(x["name"].split(" · ")[0].replace("Press cuttings (paper not identified)", "Cuttings"))))
    return '<nav class="sb-strip" aria-label="Profiles">%s</nav>' % "".join(out)

def write(rel, s):
    path = os.path.join(SITE, rel); os.makedirs(os.path.dirname(path), exist_ok=True)
    s = re.sub(r'<a (?![^>]*\bclass=)', '<a class="ln" ', s)  # classed links keep farmbook's own blue under the shared estate shell
    open(path, "w", encoding="utf-8").write(s)

def statements_of(slug):
    """Public statements for a profile: rows from data/statements.json; for a newspaper or broadcaster, its reports on farmbook."""
    rows = list(STM.get(slug, []))
    if slug in OUT:
        rows += [{"lead": p["when"] + ":", "quote": p["headline"], "summary": False, "source_title": "The report on farmbook, with its source",
                  "url": "../n/%s.html" % p["id"], "date": p["date"]} for p in POSTS if p["outlet"] == slug and p.get("headline")]
        rows.sort(key=lambda s: s["date"])
    return rows

def statements_html(slug):
    rows = statements_of(slug)
    h = '<section class="pf-card st-card" id="statements"><h2 class="pf-h">Public statements</h2>'
    if not rows:
        return h + '<p class="st-none">No public statements found yet</p></section>', 0
    items = []
    for s in rows:
        ext = s["url"].startswith("http")
        q = ('<p class="st-sum"><span class="st-tag">Summary</span> %s</p>' % e(s["quote"])) if s.get("summary") else ('<blockquote class="st-q">“%s”</blockquote>' % e(s["quote"]))
        items.append('<article class="st"><p class="st-when">%s</p>%s<p class="st-src"><a href="%s"%s>Source: %s</a></p></article>'
                     % (e(s["lead"]), q, e(s["url"]), ' rel="noopener" target="_blank"' if ext else "", e(s["source_title"])))
    return h + "".join(items) + "</section>", len(rows)

def build_friends():
    tags = []
    for f in FRIENDS:
        if f["tag"] not in tags: tags.append(f["tag"])
    btn = '<button type="button" data-f="all" aria-pressed="true">All</button>' + "".join('<button type="button" data-f="%s" aria-pressed="false">%s</button>' % (e(t), e(t.replace("-", " "))) for t in tags)
    cards = []
    for f in FRIENDS:
        x = prof(f["slug"]); n = len(statements_of(f["slug"]))
        av = (f.get("img") or "/" + x["avatar"]).lstrip("/")
        cards.append('<article class="fr" id="%s" data-tag="%s"><a class="fr-a" href="u/%s.html#statements"><img class="fr-av" src="%s" alt="" width="56" height="56" loading="lazy">'
                     '<span class="fr-t"><strong>%s</strong><span class="fr-role">%s</span><span class="fr-n%s">%s</span></span></a></article>'
                     % (e(f["id"]), e(f["tag"]), e(f["slug"]), e(av), e(f["name"]), e(f["role"]), "" if n else " fr-n0",
                        ("%d public statement%s" % (n, "" if n == 1 else "s")) if n else "No public statements found yet"))
    body = ('<main id="main" class="sb-main"><h1 class="sb-h1">Friends <span class="muted">%d</span></h1><div class="pf-card"><p class="muted">Everyone in the story, from landlords to judges. A “friend” here is a person or body in the record; it implies nothing about the relationship. Tap a friend to open their profile at their public statements about the farm, the case, the 1994 cemetery and the council meetings, each with its date and source.</p>'
            '<div class="fr-filters" role="group" aria-label="Filter friends">%s</div><div class="fr-list">%s</div></div></main>') % (len(FRIENDS), btn, "".join(cards))
    write("friends.html", head("Friends · farmbook", "Everyone in the Great House Farm story, each with their public statements about the farm, the 1987 case, the 1994 cemetery and council meetings.", "friends.html") + "<body>" + top("pages") + body + tabs("people") + foot())
    # the data, for agents and the flywheel
    os.makedirs(os.path.join(SITE, "api"), exist_ok=True)
    json.dump(STJ, open(os.path.join(SITE, "api", "statements.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    json.dump({"friends": FRIENDS}, open(os.path.join(SITE, "api", "friends.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)


def build():
    n_out = len(OUT); n_posts = len(POSTS); nq = sum(len(p.get("comments", [])) for p in POSTS); ns_ = sum(len(p.get("shares", [])) for p in POSTS)
    # feed: the newest posts (2026, Tab.bot) pinned at the top, then the story as the papers told it, oldest first
    seen, cards = set(), []
    latest = [p for p in POSTS if p["outlet"] == "tab-bot"]
    if latest:
        cards.append('<h2 class="sb-era" id="latest">Latest</h2>')
        cards += [card(p, "") for p in sorted(latest, key=lambda p: p["date"], reverse=True)]
        cards.append('<h2 class="sb-era" id="story">The story as the papers told it, 1864–1995</h2>')
    for p in POSTS:
        if p["outlet"] == "tab-bot": continue
        a = anchor_for(p)
        if a not in seen:
            seen.add(a); cards.append('<h2 class="sb-era" id="y%s">%s</h2>' % (a, dict((s, l) for l, s in DECADES)[a]))
        cards.append(card(p, ""))
    chips = "".join('<a href="#y%s">%s</a>' % (s, l) for l, s in DECADES)
    intro = (composer() + stories_rail() + '<p class="sb-honest" role="note">%s</p><nav class="sb-years" aria-label="Jump to">%s</nav>') % (e(HONEST), chips)
    write("index.html", head("farmbook · Great House Farm, as the papers told it", "The Great House Farm (Tŷ Mawr), Llandough story retold as a social feed: real newspaper and TV reports, 1864–1995, shown as if posted online.", "index.html")
          + '<body class="fb-home">' + top("feed") + '<main id="main" class="sb-main">' + intro + '<p class="fb-noresults" hidden>No posts match that search.</p><div class="sb-feed">' + "".join(cards) + "</div></main>" + tabs("feed") + foot())
    # videos page: every story as a tappable card
    vcards = "".join('<a class="fb-vc" href="%s" data-story="%s"><img src="%s" alt="" loading="lazy"><span class="fb-vc-t"><img src="%s" alt="" width="28" height="28"><span><b>%s</b><br>%s</span></span><span class="fb-vc-c">%s</span></a>'
                     % (e(s["link"]), s["id"], s["thumb"], prof(s["by"])["avatar"], e(s["poster_name"]), e(s["title"]), e(s["credit"])) for s in STORIES)
    write("videos.html", head("Videos · farmbook", "Video stories from the Great House Farm archive: the 1988 ITV Wales report, our case film and the short films, each with its source.", "videos.html")
          + "<body>" + top("video") + '<main id="main" class="sb-main"><h1 class="skip">Videos</h1><p class="sb-lede">Tap a card to watch it as a story. ITV Wales’s report plays from the public viewing copy; the archive’s own films play from the Wayback Vault.</p><div class="fb-vgrid">%s</div>%s</main>' % (vcards, stories_rail().split("</div>", 1)[1]) + tabs("video") + foot())
    # post pages
    for i, p in enumerate(POSTS):
        prev = POSTS[i - 1] if i else None; nxt = POSTS[i + 1] if i + 1 < len(POSTS) else None
        nav = '<nav class="sb-pn">%s%s</nav>' % (('<a href="%s.html">‹ Earlier</a>' % prev["id"]) if prev else "<span></span>", ('<a href="%s.html">Later ›</a>' % nxt["id"]) if nxt else "<span></span>")
        o = prof(p["outlet"])
        write("n/%s.html" % p["id"], head("%s · %s · %s" % (p["headline"], o["name"], p["when"]), p["source"]["cite"], "n/x.html", (p.get("photos") or [[o.get("cover") or "img/social/william-cover-tractor.webp"]])[0][0], "n/%s.html" % p["id"])
              .replace("<body>", "") + '<body data-post="%s">' % p["id"] + top("", "../") + '<main id="main" class="sb-main"><p class="sb-back"><a href="../#%s">‹ Back to the feed</a></p>' % p["id"] + card(p, "../", True) + nav + "</main>" + tabs("", "../") + foot())
    # profiles
    for slug in list(OUT) + list(PEO):
        x = prof(slug); is_person = slug in PEO
        mine = [p for p in POSTS if p["outlet"] == slug]
        if x.get("cover"):
            cover = '<figure class="pf-cover"><img src="../%s" alt="%s"></figure>' % (x["cover"], e(x.get("cover_credit", "")))
        else:
            cover = '<figure class="pf-cover pf-cover-t" style="--c:%s"><span>%s</span></figure>' % (x["color"], e(x["name"]))
        photos = []
        for p in mine:
            for src, cap in p.get("photos", []): photos.append((src, cap, p["id"]))
            if p.get("video"): photos.append((p["video"]["poster"], "Still from the video post", p["id"]))
        if x.get("cover") and not is_person: photos.append((x["cover"], x.get("cover_credit", ""), None))
        if is_person:
            photos = [(x["avatar"], x.get("avatar_credit", ""), None)] + ([(x["avatar_original"], "Original of the profile picture, before restoration", None)] if x.get("avatar_original") else []) + ([(x["cover"], x.get("cover_credit", ""), None)] if x.get("cover") else [])
            for p in POSTS:
                for src, cap in p.get("photos", []):
                    if (slug == "william-buckler" and any(1 for c in p.get("comments", []) if (c["who"] if isinstance(c, dict) else c[0]) == slug)):
                        photos.append((src, cap, p["id"]))
        _s = set(); photos = [x for x in photos if not (x[0] in _s or _s.add(x[0]))]
        grid = "".join('<a href="%s"><img src="../%s" alt="%s" loading="lazy"></a>' % (("../n/%s.html" % pid) if pid else "../" + src, src, e(cap)) for src, cap, pid in photos) or "<p class=\"muted\">No photos yet.</p>"
        about = ''
        if x.get("plaque"):
            pq = x["plaque"]
            about += ('<div class="plaque" role="note"><span class="plaque-ring">%s</span><strong>%s</strong><p>%s</p><p class="plaque-dates">%s</p><p class="plaque-now"><b>Now:</b> %s</p>'
                      '<p class="plaque-foot">A virtual plaque. There is none on the ground. Sources: each entry below.</p></div>') % (e(x.get("initials", "")), e(x["name"]), e(pq["stood"]), e(pq["dates"]), e(pq["now"]))
        about += '<p>%s</p>' % e(x["about"])
        if x.get("entity"): about += '<p class="muted">A profile written for this archive from the records named under each entry’s “Source”; this place, body or person did not post here.</p>'
        if x.get("ai"): about += '<p class="muted">Tab.bot is an AI agent. Its posts are written by it and checked against the record before they go up.</p>'
        if x.get("cover_credit"): about += '<p class="muted">Cover: %s</p>' % e(x["cover_credit"])
        if is_person and x.get("avatar_credit"): about += '<p class="muted">Profile picture: %s</p>' % e(x["avatar_credit"])
        if x.get("avatar_original"): about += '<p class="muted">Restored photo: print grain, dust and colour cast removed, light and sharpness corrected; fine face detail filled in by an AI face-restoration tool at its most faithful setting, checked side by side against the original. <a href="../%s">See the original</a></p>' % x["avatar_original"]
        if is_person:
            cm = [(p, c[1]) for p in POSTS for c in [((x0["who"], x0["text"]) if isinstance(x0, dict) else x0) for x0 in p.get("comments", [])] if c[0] == slug]
            body = '<h2 class="pf-h" id="comments">Comments (%d)</h2>' % len(cm) + "".join(
                '<a class="pf-c" href="../n/%s.html"><span class="pf-cq">“%s”</span><span class="muted">on %s · %s · %s</span></a>' % (p["id"], e(t), e(prof(p["outlet"])["name"]), e(p["headline"]), e(p["when"])) for p, t in cm)
            count = "%d comments" % len(cm)
            if mine:
                body = '<h2 class="pf-h" id="posts">Posts</h2>' + "".join(card(p, "../") for p in mine) + (body if cm else "")
                count = "%d post%s" % (len(mine), "" if len(mine) == 1 else "s") + (" · " + count if cm else "")
        else:
            body = '<h2 class="pf-h" id="posts">Posts</h2>' + "".join(card(p, "../") for p in mine)
            count = "%d post%s" % (len(mine), "" if len(mine) == 1 else "s")
        shared = [p for p in POSTS if slug in p.get("shares", [])]
        if x.get("entity"):
            count = "%d %s" % (len(mine), "entry" if len(mine) == 1 else "entries") + (" · %d shared" % len(shared) if shared else "")
            body = body.replace('<h2 class="pf-h" id="posts">Posts</h2>', '<h2 class="pf-h" id="posts">In the record</h2>', 1) if mine else ""
        if shared:
            body += '<h2 class="pf-h" id="shared">Shared</h2>' + "".join(
                '<a class="pf-c" href="../n/%s.html"><span><strong>%s</strong> shared %s’s post</span><span class="muted">%s · %s</span></a>' % (p["id"], e(x["name"]), e(prof(p["outlet"])["name"]), e(p["headline"]), e(p["when"])) for p in shared)
        st_sec, n_st = statements_html(slug)
        count = ("%d statement%s · " % (n_st, "" if n_st == 1 else "s") if n_st else "") + count
        ptabs = '<nav class="pf-tabs"><a href="#statements">Statements</a>%s<a href="#about">About</a><a href="#photos">Photos</a></nav>' % ("".join('<a href="#%s">%s</a>' % (a, l) for a, l, ok in [("posts", "In the record" if x.get("entity") else "Posts", bool(mine)), ("comments", "Comments", is_person and not (mine and not any(1 for q in POSTS for c in q.get("comments", []) if (c["who"] if isinstance(c, dict) else c[0]) == slug)))] if ok) or '<a href="#posts">Posts</a>')
        prov = ('<p class="pf-prov"><a href="../%s">Restored photo · original</a></p>' % x["avatar_original"]) if x.get("avatar_original") else ""
        page = (cover + '<div class="pf-id"><img class="pf-av" src="../%s" alt="" width="120" height="120"><div><h1>%s%s</h1><p class="muted">%s · %s</p>%s</div></div>' % (x["avatar"], e(x["name"]), ('<span class="sp-ai" title="AI agent">AI</span>' if x.get("ai") else ""), e(x["kind"]), count, prov)
                + ptabs + st_sec + '<section class="pf-card" id="about"><h2 class="pf-h">About</h2>%s%s</section>' % (about, "" if is_person else '<p class="muted">A reconstruction of this outlet’s reports, not its own account.</p>')
                + '<section class="pf-card" id="photos"><h2 class="pf-h">Photos</h2><div class="pf-grid">%s</div></section>' % grid + body)
        write("u/%s.html" % slug, head("%s · farmbook" % x["name"], x["about"], "u/x.html", x.get("cover") or x["avatar"], "u/%s.html" % slug) + "<body>" + top("", "../") + '<main id="main" class="sb-main sb-prof">' + page + "</main>" + tabs("", "../") + foot())
    # profiles index: the cast, grouped
    def _row(slug):
        x = prof(slug); n = len([p for p in POSTS if p["outlet"] == slug]) if slug in OUT else len([1 for p in POSTS for c in p.get("comments", []) if (c["who"] if isinstance(c, dict) else c[0]) == slug]) + len([p for p in POSTS if p["outlet"] == slug])
        if x.get("entity"): n += len([p for p in POSTS if slug in p.get("shares", [])])
        return '<a class="pl" href="u/%s.html"><img src="%s" alt="" width="48" height="48" loading="lazy"><span><strong>%s</strong><span class="muted">%s · %d %s</span></span></a>' % (slug, x["avatar"], e(x["name"]), e(x["kind"]), n, ("entry" if n == 1 else "entries") if x.get("entity") else ("posts and comments" if slug in PEO else "posts"))
    groups = [("The family", [s for s in PEO if not PEO[s].get("entity") and not PEO[s].get("ai")]),
              ("People in the record", [s for s in PEO if PEO[s].get("entity") and PEO[s]["kind"].startswith("Person")]),
              ("Places", [s for s in PEO if PEO[s].get("entity") and PEO[s]["kind"].startswith("Place")]),
              ("Bodies and institutions", [s for s in PEO if PEO[s].get("entity") and not PEO[s]["kind"].startswith(("Person", "Place"))]),
              ("Tab.bot", [s for s in PEO if PEO[s].get("ai")]),
              ("Newspapers and broadcasters", list(OUT))]
    rows = []
    for title, slugs in groups:
        if slugs: rows.append('<h2 class="pf-h">%s</h2>' % e(title)); rows += [_row(s) for s in slugs]
    write("profiles.html", head("Profiles · farmbook", "The cast: the family, the people, places and bodies in the record, and every newspaper and broadcaster on farmbook.", "profiles.html") + "<body>" + top("pages") + '<main id="main" class="sb-main"><h1 class="sb-h1">Profiles</h1><div class="pf-card">%s</div></main>' % "".join(rows) + tabs("people") + foot())
    # posts.json merge (old timeline posts keep their entries; social posts added)
    pjp = os.path.join(SITE, "posts.json"); pj = json.load(open(pjp, encoding="utf-8"))
    old = [x for x in pj["posts"] if not x["id"].startswith(("n-", "d-", "r-"))]
    new = [{"id": p["id"], "date": p["when"], "title": "%s — %s" % (prof(p["outlet"])["name"], p["headline"]), "url": "%s/n/%s.html" % (BASE, p["id"]), "profile": "%s/u/%s.html" % (BASE, p["outlet"])} for p in POSTS]
    pj["posts"] = new + old; pj["count"] = len(pj["posts"])
    ph_old = [x for x in pj.get("photos", []) if not x["id"].startswith("p-ph-") or os.path.exists(os.path.join(SITE, x["src"].replace(BASE + "/", "")))]
    ph_old = [x for x in ph_old if not x.get("social")]
    ph_new = [{"id": phid(src), "src": "%s/%s" % (BASE, src), "alt": cap, "url": "%s/n/%s.html#photo=%s" % (BASE, p["id"], phid(src)), "post": p["id"], "social": True} for p in POSTS for src, cap in p.get("photos", [])]
    pj["photos"] = ph_new + ph_old; pj["photo_count"] = len(pj["photos"])
    json.dump(pj, open(pjp, "w", encoding="utf-8"), ensure_ascii=False, indent=0)
    build_friends()
    print("built: %d profiles (%d outlets, %d people/family), %d posts, %d comments, %d shares" % (n_out + len(PEO), n_out, len(PEO), n_posts, nq, ns_))

if __name__ == "__main__":
    build()
