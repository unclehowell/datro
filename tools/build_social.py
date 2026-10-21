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
FOOT = "Our case, prospective. Not a finding of any court."
RECON = "A reconstruction: this announcement is written for this archive from the record in “Source”; the profile shown did not post it."
WORDING = "Words in [square brackets] are the archive’s: neutral words in place of the original’s, or gaps filled. Quotes from named people appear as their comments, word for word."
ns = {}
exec(open(os.path.join(ROOT, "tools", "social_data.py"), encoding="utf-8").read(), ns)
OUT, PEO, POSTS = ns["OUTLETS"], ns["PEOPLE"], sorted(ns["POSTS"], key=lambda p: (p["date"], p["id"]))
EVL = json.load(open(os.path.join(ROOT, "tools", "ev_links.json"), encoding="utf-8"))
PA = "https://greathousefarmwiki.wordpress.com/press-archive-transcripts/"
e = lambda s: html.escape(s, quote=True)

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

def prof(slug):
    return OUT.get(slug) or PEO.get(slug)

ICON = {
 "feed": '<path d="M4 11.5 12 4l8 7.5V20h-5.5v-5h-5v5H4z" fill="currentColor"/>',
 "pages": '<rect x="3.5" y="4" width="7" height="7" rx="1.6" fill="currentColor"/><rect x="13.5" y="4" width="7" height="7" rx="1.6" fill="currentColor" opacity=".75"/><rect x="3.5" y="13" width="7" height="7" rx="1.6" fill="currentColor" opacity=".75"/><rect x="13.5" y="13" width="7" height="7" rx="1.6" fill="currentColor"/>',
 "time": '<circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 7.5V12l3.2 2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
 "menu": '<path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>',
 "globe": '<circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" stroke-width="1.3"/><path d="M1.5 8h13M8 1.5c2.5 2.5 2.5 10.5 0 13M8 1.5c-2.5 2.5-2.5 10.5 0 13" fill="none" stroke="currentColor" stroke-width="1.1"/>',
 "play": '<circle cx="12" cy="12" r="11" fill="rgba(0,0,0,.55)"/><path d="M9.5 7.5v9l7-4.5z" fill="#fff"/>',
}
def ico(k, vb="0 0 24 24", cls="si"):
    return '<svg viewBox="%s" aria-hidden="true" class="%s">%s</svg>' % (vb, cls, ICON[k])

def head(title, desc, rel, og_img="img/social/william-cover-tractor.webp", canon=""):
    up = "../" * rel.count("/")
    return ('<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
            '<title>%s</title><meta name="description" content="%s"><meta property="og:title" content="%s"><meta property="og:description" content="%s">'
            '<meta property="og:image" content="%s/%s"><meta property="og:url" content="%s/%s"><meta name="theme-color" content="#1877f2">'
            '<link rel="stylesheet" href="/social.css?v=%s"><script src="/social.js?v=%s" defer></script><script src="/comments.js?v=%s" defer></script>'
            '<link rel="alternate" type="application/json" title="Posts and comments API" href="https://comments.bucklerfamily.estate/api/posts">%s\n</head>'
            ) % (e(title), e(desc), e(title), e(desc), BASE, og_img, BASE, canon, ver("social.css"), ver("social.js"), ver("comments.js"), BOOT)

def top(active):
    def nv(href, k, label):
        cur = ' aria-current="page"' if active == k else ""
        return '<a href="%s" aria-label="%s"%s>%s</a>' % (href, label, cur, ico(k))
    menu = ''.join('<a href="%s">%s</a>' % (h, e(t)) for h, t in [
        ("/", "Feed: the story as the papers told it"), ("/profiles.html", "All profiles"), ("/timeline.html", "Family archive timeline"),
        ("/photos.html", "Archive photos"), ("/facebook.html", "Preserved from Facebook"), ("https://maps.bucklerfamily.estate/", "The Map Room"),
        ("https://greathousefarmwiki.wordpress.com/", "The Legal Wiki"), ("/m/login", "Family members: sign in"), ("/api/", "API for AI agents")])
    return ('<a class="skip" href="#main">Skip to content</a><div class="sb-sticky"><header class="sb-top"><a class="sb-brand" href="/">farmbook</a>'
            '<nav class="sb-nav" aria-label="Main">%s%s%s<details class="sb-menu"><summary aria-label="Menu">%s</summary><div class="sb-menu-in">%s</div></details></nav></header>'
            '<p class="sb-honest" role="note">%s</p></div>') % (nv("/", "feed", "Feed"), nv("/profiles.html", "pages", "Profiles"), nv("/timeline.html", "time", "Family timeline"), ico("menu"), menu, e(HONEST))

def foot():
    return ('<footer class="sb-foot"><p><strong>%s</strong></p><p>%s farmbook is the Williams / Buckler family archive’s own site. It is not affiliated with Meta or with any newspaper or broadcaster shown; their names, mastheads and logos identify the source of each article. Each post’s “Source” gives the citation.</p></footer>'
            '</body></html>') % (e(FOOT), e(HONEST))

def link(u):
    if u == "@PA": return PA
    if u.startswith("@"): return EVL.get(u[1:], PA)
    return u

KIND = {"announcement": "Announcement", "article": "Article", "extract": "Archive extract", "notice": "Notice", "letter": "Letter to the editor", "video": "Video", "record": "Debate record"}
def phid(src):
    return "p-ph-" + re.sub(r"[^a-z0-9]+", "-", os.path.basename(src).rsplit(".", 1)[0].lower()).strip("-")

def card(p, up, single=False):
    o = prof(p["outlet"]); pu = "%su/%s.html" % (up, p["outlet"])
    h = ['<article class="post sp" id="%s" data-outlet="%s"><header class="sp-h"><a class="sp-av" href="%s" tabindex="-1" aria-hidden="true"><img src="%s%s" alt="" width="40" height="40" loading="lazy"></a>'
         '<div class="sp-who"><a class="sp-n" href="%s">%s</a><div class="sp-d"><a href="%sn/%s.html"><time datetime="%s">%s</time></a> · %s · %s</div></div></header>'
         % (p["id"] + ('" data-kind="announcement' if p["kind"] == "announcement" else ""), p["outlet"], pu, up, o["avatar"], pu, e(o["name"]), up, p["id"], p.get("dt", p["date"]), e(p["when"]), KIND[p["kind"]], ico("globe", "0 0 16 16", "gi"))]
    h.append('<div class="sp-b%s"><h2 class="pt sp-t">%s</h2>' % ("" if single else " clamp", e(p["headline"])))
    if p.get("byline"): h.append('<p class="sp-by">%s</p>' % e(p["byline"]))
    for para in p["body"]: h.append("<p>%s</p>" % e(para))
    h.append('</div><button type="button" class="sp-more" hidden>See more</button>')
    if p.get("video"):
        v = p["video"]
        h.append('<figure class="sp-media sp-video"><video controls playsinline preload="none" poster="%s%s" src="%s"></video>'
                 '<figcaption>A %d-second excerpt · <a href="%s" rel="noopener">Watch the full report</a></figcaption></figure>' % (up, v["poster"], v["src"], v["seconds"], v["full"]))
    for src, cap in p.get("photos", []):
        h.append('<figure class="sp-media"><a href="%s%s"><img src="%s%s" alt="%s" loading="lazy" data-ph="%s"></a><figcaption>%s</figcaption></figure>' % (up, src, up, src, e(cap), phid(src), e(cap)))
    s = p["source"]
    links = " · ".join('<a href="%s" rel="noopener">%s</a>' % (e(link(u)), e(t)) for t, u in s["links"])
    h.append('<details class="sp-src"><summary>Source</summary><p>%s</p><p>%s</p>%s%s</details>' % (e(s["cite"]), links,
             ('<p class="sp-note">Archive note: %s</p>' % e(p["note"])) if p.get("note") else "",
             ('<p class="sp-note">%s</p>' % e(WORDING)) if (p.get("subs") or any(isinstance(c, dict) and c.get("subs") for c in p.get("comments", []))) else ""))
    if p.get("recon"):
        h.append('<p class="sp-recon">%s</p>' % e(RECON))
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

DECADES = [("1860s", "1860"), ("1880s", "1880"), ("1890s", "1890"), ("1900s", "1900"), ("1930s", "1930"), ("1950s", "1950"), ("1960s", "1960"), ("1970s", "1970"), ("1980–87", "1980"), ("1988", "1988"), ("1989", "1989"), ("1990s", "1990")]
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

def build():
    n_out = len(OUT); n_posts = len(POSTS); nq = sum(len(p.get("comments", [])) for p in POSTS); ns_ = sum(len(p.get("shares", [])) for p in POSTS)
    # feed
    seen, cards = set(), []
    for p in POSTS:
        a = anchor_for(p)
        if a not in seen:
            seen.add(a); cards.append('<h2 class="sb-era" id="y%s">%s</h2>' % (a, dict((s, l) for l, s in DECADES)[a]))
        cards.append(card(p, ""))
    chips = "".join('<a href="#y%s">%s</a>' % (s, l) for l, s in DECADES)
    intro = ('<section class="sb-intro"><h1>Great House Farm, Llandough</h1><p>The story as the papers told it, 1864–1995: %d posts from %d profiles. Tap a name for the profile, tap “Source” for the original.</p>%s'
             '<nav class="sb-years" aria-label="Jump to">%s</nav></section>') % (n_posts, n_out + len(PEO), strip_people(), chips)
    write("index.html", head("farmbook · Great House Farm, as the papers told it", "The Great House Farm (Tŷ Mawr), Llandough story retold as a social feed: real newspaper and TV reports, 1864–1995, shown as if posted online.", "index.html")
          + "<body>" + top("feed") + '<main id="main" class="sb-main">' + intro + '<div class="sb-feed">' + "".join(cards) + "</div></main>" + foot())
    # post pages
    for i, p in enumerate(POSTS):
        prev = POSTS[i - 1] if i else None; nxt = POSTS[i + 1] if i + 1 < len(POSTS) else None
        nav = '<nav class="sb-pn">%s%s</nav>' % (('<a href="%s.html">‹ Earlier</a>' % prev["id"]) if prev else "<span></span>", ('<a href="%s.html">Later ›</a>' % nxt["id"]) if nxt else "<span></span>")
        o = prof(p["outlet"])
        write("n/%s.html" % p["id"], head("%s · %s · %s" % (p["headline"], o["name"], p["when"]), p["source"]["cite"], "n/x.html", (p.get("photos") or [[o.get("cover") or "img/social/william-cover-tractor.webp"]])[0][0], "n/%s.html" % p["id"])
              .replace("<body>", "") + '<body data-post="%s">' % p["id"] + top("") + '<main id="main" class="sb-main"><p class="sb-back"><a href="../#%s">‹ Back to the feed</a></p>' % p["id"] + card(p, "../", True) + nav + "</main>" + foot())
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
        about = '<p>%s</p>' % e(x["about"])
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
        if shared:
            body += '<h2 class="pf-h" id="shared">Shared</h2>' + "".join(
                '<a class="pf-c" href="../n/%s.html"><span><strong>%s</strong> shared %s’s post</span><span class="muted">%s · %s</span></a>' % (p["id"], e(x["name"]), e(prof(p["outlet"])["name"]), e(p["headline"]), e(p["when"])) for p in shared)
        tabs = '<nav class="pf-tabs">%s<a href="#about">About</a><a href="#photos">Photos</a></nav>' % ("".join('<a href="#%s">%s</a>' % (a, l) for a, l, ok in [("posts", "Posts", bool(mine)), ("comments", "Comments", is_person and not (mine and not any(1 for q in POSTS for c in q.get("comments", []) if (c["who"] if isinstance(c, dict) else c[0]) == slug)))] if ok) or '<a href="#posts">Posts</a>')
        prov = ('<p class="pf-prov"><a href="../%s">Restored photo · original</a></p>' % x["avatar_original"]) if x.get("avatar_original") else ""
        page = (cover + '<div class="pf-id"><img class="pf-av" src="../%s" alt="" width="120" height="120"><div><h1>%s</h1><p class="muted">%s · %s</p>%s</div></div>' % (x["avatar"], e(x["name"]), e(x["kind"]), count, prov)
                + tabs + '<section class="pf-card" id="about"><h2 class="pf-h">About</h2>%s%s</section>' % (about, "" if is_person else '<p class="muted">A reconstruction of this outlet’s reports, not its own account.</p>')
                + '<section class="pf-card" id="photos"><h2 class="pf-h">Photos</h2><div class="pf-grid">%s</div></section>' % grid + body)
        write("u/%s.html" % slug, head("%s · farmbook" % x["name"], x["about"], "u/x.html", x.get("cover") or x["avatar"], "u/%s.html" % slug) + "<body>" + top("") + '<main id="main" class="sb-main sb-prof">' + page + "</main>" + foot())
    # profiles index
    rows = []
    for slug in list(PEO) + list(OUT):
        x = prof(slug); n = len([p for p in POSTS if p["outlet"] == slug]) if slug in OUT else len([1 for p in POSTS for c in p.get("comments", []) if (c["who"] if isinstance(c, dict) else c[0]) == slug]) + len([p for p in POSTS if p["outlet"] == slug])
        rows.append('<a class="pl" href="u/%s.html"><img src="%s" alt="" width="48" height="48" loading="lazy"><span><strong>%s</strong><span class="muted">%s · %d %s</span></span></a>' % (slug, x["avatar"], e(x["name"]), e(x["kind"]), n, "posts and comments" if slug in PEO else "posts"))
    write("profiles.html", head("Profiles · farmbook", "Every newspaper, broadcaster and person on farmbook.", "profiles.html") + "<body>" + top("pages") + '<main id="main" class="sb-main"><h1 class="sb-h1">Profiles</h1><div class="pf-card">%s</div></main>' % "".join(rows) + foot())
    # posts.json merge (old timeline posts keep their entries; social posts added)
    pjp = os.path.join(SITE, "posts.json"); pj = json.load(open(pjp, encoding="utf-8"))
    old = [x for x in pj["posts"] if not x["id"].startswith(("n-", "d-"))]
    new = [{"id": p["id"], "date": p["when"], "title": "%s — %s" % (prof(p["outlet"])["name"], p["headline"]), "url": "%s/n/%s.html" % (BASE, p["id"]), "profile": "%s/u/%s.html" % (BASE, p["outlet"])} for p in POSTS]
    pj["posts"] = new + old; pj["count"] = len(pj["posts"])
    ph_old = [x for x in pj.get("photos", []) if not x["id"].startswith("p-ph-") or os.path.exists(os.path.join(SITE, x["src"].replace(BASE + "/", "")))]
    ph_old = [x for x in ph_old if not x.get("social")]
    ph_new = [{"id": phid(src), "src": "%s/%s" % (BASE, src), "alt": cap, "url": "%s/n/%s.html#photo=%s" % (BASE, p["id"], phid(src)), "post": p["id"], "social": True} for p in POSTS for src, cap in p.get("photos", [])]
    pj["photos"] = ph_new + ph_old; pj["photo_count"] = len(pj["photos"])
    json.dump(pj, open(pjp, "w", encoding="utf-8"), ensure_ascii=False, indent=0)
    print("built: %d profiles (%d outlets, %d people/family), %d posts, %d comments, %d shares" % (n_out + len(PEO), n_out, len(PEO), n_posts, nq, ns_))

if __name__ == "__main__":
    build()
