#!/usr/bin/env python3
"""build_posts.py — derive per-post pages, posts.json and the agent API docs from site/index.html (fb.bucklerfamily.estate).
Run after any change to site/index.html:  python3 tools/build_posts.py
Writes: site/p/<post-id>.html, photo ids (data-ph) + posts.json "photos", shared page chrome (fb.css, menu), (one shareable page per post, with its comments), site/posts.json (ids, dates, titles, urls;
read by the comments Worker), and patches index.html so each post's timestamp links to its own page (idempotent).
Generated output; do not hand-edit site/p/. — Sion's Tab agent"""
import html, json, os, re
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = os.path.join(ROOT, "site")
BASE = "https://fb.bucklerfamily.estate"
API = "https://comments.bucklerfamily.estate"
idx_path = os.path.join(SITE, "index.html")
s = open(idx_path, encoding="utf-8").read()


# ---- 4. photos: every archive photo gets a stable id (data-ph) so people and AI agents can like and comment on it ----
# Photo ids look like p-ph-<file-name-slug>; they are listed in posts.json under "photos" and accepted by the comments API
# exactly like post ids. comments.js opens a photo viewer (photo + likes + comments) when one is clicked.
import hashlib, glob
PH_SRC = re.compile(r'^(?:\.\./)*(?:/)?img/(?!cover\.|crest\.)[^"]+\.(?:jpe?g|png|webp|gif)$|^https://wayback\.bucklerfamily\.estate/images/[^"]+\.(?:jpe?g|png|webp)$', re.I)
def phid(src):
    base = os.path.basename(src.split("?")[0]).lower()
    base = re.sub(r"\.[a-z0-9]+$", "", base)
    slug = re.sub(r"[^a-z0-9]+", "-", base).strip("-")
    if len(slug) > 48:
        slug = slug[:40].rstrip("-") + "-" + hashlib.sha1(base.encode()).hexdigest()[:7]
    return "p-ph-" + slug
def tag_imgs(doc):
    def one(m):
        tag = m.group(0)
        src = re.search(r'\ssrc="([^"]+)"', tag)
        if not src or not PH_SRC.match(src.group(1)):
            return tag
        tag = re.sub(r'\sdata-ph="[^"]*"', "", tag)
        return tag[:4] + ' data-ph="%s"' % phid(src.group(1)) + tag[4:]
    return re.sub(r"<img\b[^>]*>", one, doc)
def absu(src, page_rel):
    if src.startswith("http"):
        return src
    return BASE + "/" + os.path.normpath(os.path.join(os.path.dirname(page_rel), src)).lstrip("./")

ICONS = {
 "home": '<path d="M4 11.5 12 4l8 7.5V20h-5.5v-5h-5v5H4z" fill="currentColor"/>',
 "about": '<circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 10.5V17M12 7v.2" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>',
 "friends": '<circle cx="9" cy="8.5" r="3.5" fill="currentColor"/><path d="M2.5 19c.6-3.6 3.2-5.5 6.5-5.5s5.9 1.9 6.5 5.5z" fill="currentColor"/><circle cx="17" cy="9.5" r="2.7" fill="currentColor" opacity=".7"/><path d="M16.5 14c2.6.1 4.5 1.7 5 5h-4.4" fill="currentColor" opacity=".7"/>',
 "photos": '<rect x="3" y="5" width="18" height="14" rx="2.5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="9" cy="10" r="1.8" fill="currentColor"/><path d="m4 18 5.5-5 3.5 3 3-2.5 4.5 4.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
 "threads": '<path d="M4 5.5h16v10H9.5L5.5 19v-3.5H4z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M8 9.3h8M8 12h5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
 "host": '<path d="M5 6 8 9.5h8L19 6l.5 7.5A7.5 7.5 0 0 1 4.5 13.5z" fill="currentColor"/><circle cx="9.5" cy="13" r="1.1" fill="#fff"/><circle cx="14.5" cy="13" r="1.1" fill="#fff"/>',
 "api": '<path d="m8.5 7-5 5 5 5M15.5 7l5 5-5 5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>',
 "privacy": '<path d="M12 3.5 19 6v5.5c0 4.3-3 7.6-7 9-4-1.4-7-4.7-7-9V6z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
}
def ico(k):
    return '<svg viewBox="0 0 24 24" aria-hidden="true" class="fx-i">%s</svg>' % ICONS[k]
NAV = [("home", "/index.html", "Timeline"), ("friends", "/friends.html", "Friends"), ("photos", "/photos.html", "Photos"), ("threads", "/facebook.html", "Facebook")]
RAIL = NAV[:1] + [("about", "/about.html", "About")] + NAV[1:] + [("host", "/profile/paul/", "Paul Smith · AI host"), ("api", "/api/", "API for AI agents"), ("privacy", "https://bucklerfamily.estate/privacy/", "Privacy")]

ASSET_V = {}
def asset_v(name):
    if name not in ASSET_V:
        fn = os.path.join(SITE, name)
        ASSET_V[name] = hashlib.sha1(open(fn, "rb").read()).hexdigest()[:10] if os.path.exists(fn) else "0"
    return ASSET_V[name]
def version_assets(doc):
    """comments.js?v=<content hash> etc., so phones never keep an old copy after a change."""
    return re.sub(r'((?:src|href)=")((?:\.\./)*|/)?(comments\.js|script\.js|styles\.css|fb\.css)(?:\?v=[0-9a-z]+)?(")',
                  lambda m: m.group(1) + (m.group(2) or "") + m.group(3) + "?v=" + asset_v(m.group(3)) + m.group(4), doc)

SEARCH = ('<form class="fx-search" action="/index.html" method="get" role="search"><label><span class="fx-sr">Search farmbook</span>'
          '<svg viewBox="0 0 24 24" aria-hidden="true" class="fx-si"><circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" stroke-width="2.2"/>'
          '<path d="m15.5 15.5 5 5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>'
          '<input type="search" name="q" placeholder="Search farmbook" autocomplete="off" enterkeyhint="search"></label></form>')
MENU = [("Home", "/index.html", "home"), ("Photos", "/photos.html", "photo"), ("Maps", "https://maps.bucklerfamily.estate/", "map"),
        ("Archive / Legal Wiki", "https://greathousefarmwiki.wordpress.com/", "book"), ("Privacy", "https://bucklerfamily.estate/privacy/", "lock"), ("Sign in / Sign up", "/m/login", "user")]
MICO = {"home": '<path d="M4 11.5 12 4l8 7.5V20h-5.5v-5h-5v5H4z" fill="currentColor"/>',
        "photo": '<rect x="3" y="5" width="18" height="14" rx="2.5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="9" cy="10" r="1.8" fill="currentColor"/><path d="m5 17 5-5 3 3 2.5-2.5L19 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
        "map": '<path d="M9 4 3 6.5v13.5L9 17.5l6 2.5 6-2.5V4l-6 2.5z M9 4v13.5 M15 6.5V20" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
        "book": '<path d="M5 4.5h9.5A3.5 3.5 0 0 1 18 8v11.5H8.5A3.5 3.5 0 0 1 5 16z M5 16a2.5 2.5 0 0 1 2.5-2.5H18" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
        "lock": '<rect x="5" y="10.5" width="14" height="10" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" fill="none" stroke="currentColor" stroke-width="2"/>',
        "user": '<circle cx="12" cy="8.5" r="4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M4.5 20.5a7.5 7.5 0 0 1 15 0" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'}
def menu_html():
    items = "".join('<a href="%s"%s%s><span class="fx-mi"><svg viewBox="0 0 24 24" aria-hidden="true">%s</svg></span><span>%s</span></a>'
                    % (u, ' data-fx-auth=""' if ic == "user" else "", ' rel="noopener"' if u.startswith("https://greathouse") else "", MICO[ic], l) for l, u, ic in MENU)
    return ('<details class="fx-menu"><summary aria-label="Menu" title="Menu"><svg viewBox="0 0 24 24" aria-hidden="true" class="fx-i">'
            '<path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg></summary>'
            '<nav class="fx-mp" aria-label="Menu">' + items + '</nav></details>')
def chrome(doc, page_rel):
    """Shared page chrome: top-bar icon nav, desktop left-hand menu, fb.css, the members script. Idempotent (marked blocks)."""
    doc = re.sub(r"<!--fx-[a-z]+-->.*?<!--/fx-[a-z]+-->", "", doc, flags=re.S)
    here = "/" + page_rel.replace("index.html", "") if page_rel != "index.html" else "/index.html"
    cur = {"index.html": "/index.html", "friends.html": "/friends.html", "photos.html": "/photos.html", "facebook.html": "/facebook.html", "about.html": "/about.html",
           "profile/paul/index.html": "/profile/paul/", "api/index.html": "/api/"}.get(page_rel, "/index.html" if page_rel.startswith("p/") else "")
    head = '<!--fx-head--><link rel="stylesheet" href="/fb.css"><script src="/m/social.js" defer></script><!--/fx-head-->'
    doc = doc.replace("</head>", head + "</head>", 1)
    nav = "".join('<a href="%s" aria-label="%s"%s>%s</a>' % (u, l, ' aria-current="page"' if u == cur else "", ico(k)) for k, u, l in NAV)
    doc = re.sub(r'(<header class="topbar"><div class="tb-in">.*?)(</div></header>)', lambda m: m.group(1) + '<!--fx-nav-->' + SEARCH + '<nav class="fx-nav" aria-label="Main">' + nav + "</nav>" + menu_html() + "<!--/fx-nav-->" + m.group(2), doc, count=1, flags=re.S)
    rail = "".join('<a href="%s"%s><span class="fx-ri">%s</span><span>%s</span></a>' % (u, ' aria-current="page"' if u == cur else "", ico(k), l) for k, u, l in RAIL)
    rail = ('<!--fx-rail--><nav class="fx-rail" aria-label="Menu"><a href="/index.html" class="fx-me"><img src="/img/crest.svg" alt="" width="36" height="36"><span>Williams / Buckler family</span></a>'
            + rail + '<p class="fx-rf">farmbook · a family archive. Not affiliated with any social network.</p></nav><!--/fx-rail-->')
    doc = doc.replace("</header>", "</header>" + rail, 1)
    if "data-ph=" in doc and "comments.js" not in doc:
        doc = doc.replace("</body>", '<script src="/comments.js" defer></script>\n</body>', 1)
    return doc


s = tag_imgs(s)

# 1. timestamps link to the post's own page (permalink)
s2 = re.sub(r'(<div class="pd"><a href=")#(p-[a-z0-9-]+)(")', r'\1p/\2.html\3', s)
# 2. discovery links for crawlers and AI agents in the head
DISC = ('<link rel="alternate" type="application/json" title="Posts and comments API" href="%s/api/posts">'
        '<link rel="help" href="%s/api/" title="Comments API for people and AI agents">' % (API, BASE))
if 'rel="alternate" type="application/json"' not in s2:
    s2 = s2.replace('<link rel="stylesheet" href="styles.css">', '<link rel="stylesheet" href="styles.css">' + DISC, 1)
if s2 != s:
    open(idx_path, "w", encoding="utf-8").write(s2)
s = s2

head_end = s.find("</head>")
topbar = re.search(r'<header class="topbar">.*?</header>', s, re.S).group(0).replace('href="index.html"', 'href="../index.html"')
foot = re.search(r'<footer class="foot">.*?</footer>', s, re.S).group(0)

def rel(m):
    attr, q, url = m.group(1), m.group(2), m.group(3)
    if re.match(r'^(https?:|mailto:|tel:|data:|#|/)', url):
        return m.group(0)
    return '%s=%s../%s%s' % (attr, q, url, q)

def plain(x):
    return html.unescape(re.sub(r"<[^>]+>", "", x)).strip()

arts = re.findall(r'(<article class="post" id="(p-[a-z0-9-]+)"[^>]*>.*?</article>)', s, re.S)
os.makedirs(os.path.join(SITE, "p"), exist_ok=True)
posts, keep = [], set()
for a, pid in arts:
    t = re.search(r'<p class="pt">(.*?)</p>', a, re.S)
    title = plain(t.group(1)) if t else pid
    d = re.search(r"<time>(.*?)</time>", a)
    date = plain(d.group(1)) if d else ""
    url = "%s/p/%s.html" % (BASE, pid)
    posts.append({"id": pid, "date": date, "title": title[:160] + ("…" if len(title) > 160 else ""), "url": url})
    img = re.search(r'<img src="(img/[^"]+)"', a)
    og = BASE + "/" + (img.group(1) if img and "crest" not in img.group(1) else "img/cover.jpg")
    body = re.sub(r'\b(src|href)=(["\'])([^"\']*)\2', rel, a)
    body = body.replace('href="../p/%s.html"' % pid, 'href="%s.html"' % pid)
    short = title if len(title) <= 70 else title[:68].rsplit(" ", 1)[0] + "…"
    esc = html.escape
    page = ('<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
            '<title>%s · farmbook</title><meta name="description" content="%s">'
            '<link rel="canonical" href="%s"><meta property="og:type" content="article"><meta property="og:title" content="%s">'
            '<meta property="og:description" content="%s · Williams / Buckler family, Great House Farm (Tŷ Mawr)"><meta property="og:image" content="%s"><meta property="og:url" content="%s">'
            '<meta name="theme-color" content="#3b5998"><link rel="stylesheet" href="../styles.css">'
            '<link rel="alternate" type="application/json" title="Comments on this post (JSON API)" href="%s/api/comments?post=%s">'
            '<link rel="help" href="%s/api/" title="Comments API for people and AI agents">'
            '<style>.single{max-width:680px;margin:12px auto;padding:0 8px}.back{display:inline-block;margin:4px 4px 10px;font-weight:600;font-size:14px}</style></head>'
            '<body data-post="%s"><a class="skip" href="#main">Skip to content</a>%s<main class="single" id="main">'
            '<a class="back" href="../index.html#%s">← All posts on the timeline</a>%s</main>%s'
            '<script src="../script.js"></script><script src="../comments.js" defer></script>\n'
            '<script src="https://bucklerfamily.estate/basecamp.js" defer></script>\n</body></html>\n') % (
        esc(short), esc(date + " · " + title), url, esc(short), esc(date), og, url, API, pid, BASE, pid, topbar, pid, body, foot)
    fn = os.path.join(SITE, "p", pid + ".html"); keep.add(pid + ".html")
    if not os.path.exists(fn) or open(fn, encoding="utf-8").read() != page:
        open(fn, "w", encoding="utf-8").write(page)
for f in os.listdir(os.path.join(SITE, "p")):
    if f.endswith(".html") and f not in keep:
        os.remove(os.path.join(SITE, "p", f))  # a post removed from the timeline loses its generated page
json.dump({"site": BASE, "api": API + "/api/comments", "docs": BASE + "/api/", "count": len(posts), "posts": posts},
          open(os.path.join(SITE, "posts.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("posts:", len(posts))

# ---- 5. photo list + shared chrome on every page ----
photos, seen = [], {}
post_of = {}
for a, pid in arts:
    for src in re.findall(r'<img\b[^>]*\ssrc="([^"]+)"', a):
        if PH_SRC.match(src):
            post_of.setdefault(phid(src), pid)
pages = ["index.html", "photos.html", "facebook.html", "about.html", "friends.html", "api/index.html", "profile/paul/index.html"] + sorted("p/" + f for f in os.listdir(os.path.join(SITE, "p")) if f.endswith(".html"))
for rel_ in pages:
    fn = os.path.join(SITE, rel_)
    if not os.path.exists(fn):
        continue
    doc = open(fn, encoding="utf-8").read()
    new = version_assets(chrome(tag_imgs(doc), rel_))
    for tag in re.findall(r"<img\b[^>]*data-ph=[^>]*>", new):
        i_ = re.search(r'data-ph="([^"]+)"', tag).group(1)
        if i_ in seen:
            continue
        src = re.search(r'\ssrc="([^"]+)"', tag).group(1)
        alt = re.search(r'\salt="([^"]*)"', tag)
        p_ = post_of.get(i_)
        page_url = BASE + ("/p/%s.html" % p_ if p_ else "/" + rel_.replace("index.html", "")) + "#photo=" + i_
        seen[i_] = 1
        photos.append({"id": i_, "src": absu(src, rel_), "alt": html.unescape(alt.group(1)) if alt else "", "url": page_url, "post": p_})
    if new != doc:
        open(fn, "w", encoding="utf-8").write(new)
json.dump({"site": BASE, "api": API + "/api/comments", "docs": BASE + "/api/", "count": len(posts), "posts": posts,
           "photo_count": len(photos), "photos": photos},
          open(os.path.join(SITE, "posts.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("photos:", len(photos))
