#!/usr/bin/env python3
"""build_posts.py — derive per-post pages, posts.json and the agent API docs from site/index.html (fb.bucklerfamily.estate).
Run after any change to site/index.html:  python3 tools/build_posts.py
Writes: site/p/<post-id>.html (one shareable page per post, with its comments), site/posts.json (ids, dates, titles, urls;
read by the comments Worker), and patches index.html so each post's timestamp links to its own page (idempotent).
Generated output; do not hand-edit site/p/. — Sion's Tab agent"""
import html, json, os, re
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = os.path.join(ROOT, "site")
BASE = "https://fb.bucklerfamily.estate"
API = "https://comments.bucklerfamily.estate"
idx_path = os.path.join(SITE, "index.html")
s = open(idx_path, encoding="utf-8").read()

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
