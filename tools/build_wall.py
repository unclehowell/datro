#!/usr/bin/env python3
"""build_wall.py — fb.bucklerfamily.estate as the family's "hope" wall (22 Oct 2026). Run AFTER tools/build_social.py.

Writes
  site/index.html      the WALL: the newest "Today at Tŷ Mawr" highlight-report video on top, then highlights and key events
                       in reverse chronology from today (daily reports, authority replies that matter, missed deadlines, public
                       statements, the press record). Year chips lead to site/wall/<year>.html for everything earlier.
  site/u/<slug>.html   a PROFILE per actor: cover, face (illustrated portrait / family archive photo) or initials badge for a body,
                       bio from the public role, and THEIR whole chronology newest first (every dated event or statement involving
                       them, with source links); "No public statements found yet" where there are none.
  site/papers.html     the previous press feed (build_social.py's index.html), kept.
  site/api/wall.json   every event, machine-readable.
Data: tools/social_data.py + data/friends.json + data/statements.json (through build_social), data/daily.json (make_daily.py),
data/faces.json (portraits), the dartboard roadmap (work/roadmap/roadmap.json or the public JSON).
Rules: real names, no nicknames on real people; the one fictional character is the narrator "Morgan Gecko Hope"; never the
owner's name; never Branwen's surname; no disclaimers; house banned words never in our own text. — Sion's Tab agent"""
import os, re, json, html, hashlib, datetime as dt, importlib.util, urllib.request, collections, shutil
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = os.path.join(ROOT, "site")
spec = importlib.util.spec_from_file_location("build_social", os.path.join(ROOT, "tools", "build_social.py"))
BS = importlib.util.module_from_spec(spec); spec.loader.exec_module(BS)
e = lambda s: html.escape(str(s), quote=True)
BASE = BS.BASE
from zoneinfo import ZoneInfo
TODAY = dt.datetime.now(ZoneInfo("Europe/London")).date()   # the family's day, not the box's UTC day
BANNED = re.compile(r"\b(thief|thieves|stolen|looted|criminal|racket|lawfare|fraud\w*|says|claims|claimed|claiming|according to|alleged\w*|allegation\w*|hearsay|unverified)\b|(?<!Coed )\bSion\b"
                    r"|family[’']?s? (account|position)|Branwen\s+Buckler|robin\s*hill|hywelapbuckler|7845|[\w.+-]+@[\w-]+\.[\w.]+|Not a finding|Our case|prospective", re.I)
def ok(s): return bool(s) and not BANNED.search(s)
FIX = [(r"\s*Where the family['’]s position goes beyond a document, it is written as “our position”\.", ""), (r"\s*Every post names its source; where the family['’]s position goes beyond a document, it is written as “our position”\.", " Every post names its source."),
       (r"\bOur case film\b", "Film"), (r"\bOur case:\s*", "The family’s case: "), (r"\bIn our case\b", "In the family’s case"), (r"\bour case\b", "the family’s case"), (r"\bOur case\b", "The family’s case")]
def fix(s):
    for a, b in FIX: s = re.sub(a, b, s or "")
    return s

# ------------------------------------------------------------------ actors
OUT, PEO = BS.OUT, BS.PEO
FACES = json.load(open(os.path.join(ROOT, "data", "faces.json"), encoding="utf-8"))["faces"]
NARRATOR = "hope-desk"
PEO[NARRATOR] = {"name": "Morgan Gecko Hope", "kind": "Project manager · the wall’s narrator (a fictional character)", "avatar": FACES[NARRATOR]["img"],
                 "about": "A made-up project manager, the one fictional character on this wall. Every morning Morgan reads the replies, the deadlines and "
                          "the new finds and posts “Today at Tŷ Mawr”, a short highlight report in the PRINCE2 style: status, what the authorities wrote, "
                          "new evidence, new routes to reopening the case, and one line of hope. Every figure in a report comes from the record linked under it.",
                 "color": "#7b5ea7", "entity": True}
LANE_ALIAS = {"vale-of-glamorgan-council": "vale-of-glamorgan", "ministry-of-justice-hmcts": "ministry-of-justice", "welsh-government-cadw": "cadw",
              "heneb-formerly-ggat-historic-environment-record": "heneb", "cotswold-archaeology": "cotswold-archaeological-trust",
              "linklaters": "linklaters-paines", "persimmon-homes": "persimmon"}
LANE_NAME = {"serious-fraud-office": "SFO", "whatdotheyknow-unconfirmed": "WhatDoTheyKnow"}
LANE_ABOUT = {"serious-fraud-office": "The UK prosecutor for serious and complex financial crime (SFO).",
              "member-of-parliament": "Members of Parliament and their offices, written to about the farm and the case.",
              "member-of-parliament-vale-of-glamorgan": "The Member of Parliament for the Vale of Glamorgan and the constituency office."}
COLORS = ["#37474f", "#5d4037", "#1b5e20", "#0d47a1", "#4a148c", "#880e4f", "#006064", "#3e2723", "#263238", "#33691e"]
def initials(name):
    w = [x for x in re.split(r"[\s/()\-–,]+", name) if x and x[0].isalpha() and x.lower() not in ("of", "and", "the", "for", "&")]
    return ("".join(x[0] for x in w[:3]) or name[:2]).upper()
def lane_slug(L): return LANE_ALIAS.get(L["id"], L["id"])
def roadmap():
    for src in ("/home/user/tab/work/roadmap/roadmap.json",):
        if os.path.exists(src): return json.load(open(src, encoding="utf-8"))
    with urllib.request.urlopen("https://dartboard.bucklerfamily.estate/data/roadmap.json", timeout=40) as r: return json.loads(r.read())
R = roadmap()
for i, L in enumerate(R["lanes"]):
    sl = lane_slug(L)
    if sl in OUT or sl in PEO: continue
    nm = LANE_NAME.get(L["id"], L["name"])
    PEO[sl] = {"name": nm, "kind": {"public": "Body · public authority", "private": "Body · organisation", "representative": "Office · elected representatives", "platform": "Platform"}.get(L.get("kind"), "Body"),
               "entity": True, "initials": initials(nm), "color": COLORS[i % len(COLORS)], "avatar": "img/social/av-%s.svg" % sl,
               "about": LANE_ABOUT.get(L["id"], (L.get("note") or "").strip() + (" Escalation route: %s." % L["ombudsman"] if L.get("ombudsman") else "")).strip()}
    p = PEO[sl]; t = p["initials"]; fs = 44 if len(t) <= 2 else 32
    open(os.path.join(SITE, p["avatar"]), "w").write(('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%s"/>'
        '<text x="50" y="50" dy=".36em" text-anchor="middle" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif" font-weight="700" font-size="%d" fill="#fff">%s</text></svg>') % (p["color"], fs, e(t)))
for sl, f in FACES.items():
    if sl in PEO: PEO[sl]["face"] = f["img"]; PEO[sl]["face_kind"] = f["kind"]
def prof(sl): return OUT.get(sl) or PEO.get(sl)
def av(sl): p = prof(sl); return p.get("face") or p["avatar"]
def is_person(sl):
    p = prof(sl); return bool(p and (p.get("face") or (not p.get("entity") and sl in PEO and not p.get("ai") and sl != "williams-buckler-family")))

# ------------------------------------------------------------------ events
EV = []
def add(**k):
    k.setdefault("tags", []); k.setdefault("wall", True); EV.append(k)
def ymd(s): return (s + "-01-01")[:10] if len(s) == 4 else ((s + "-01")[:10] if len(s) == 7 else s[:10])
# 1. daily highlight reports
dpath = os.path.join(ROOT, "data", "daily.json")
DAILY = json.load(open(dpath, encoding="utf-8"))["days"] if os.path.exists(dpath) else []
for d in DAILY:
    add(id="daily-" + d["date"], date=d["date"], when=dt.date.fromisoformat(d["date"]).strftime("%-d %B %Y"), actor=NARRATOR, kind="Highlight report",
        title=d["title"], daily=d, tags=[r["lane"] and lane_slug({"id": r["lane"]}) for r in d.get("replies", []) if r.get("lane")], rank=0)
# 2. the press record (social_data posts → their n/ pages)
for p in BS.POSTS:
    body = [x for x in p["body"] if ok(x)][:1]
    add(id=p["id"], date=ymd(p["date"]), when=p["when"], actor=p["outlet"], kind=BS.KIND.get(p["kind"], "Post"), title=p["headline"] if ok(p["headline"]) else "",
        text=body[0] if body else "", link="n/%s.html" % p["id"], src=[(t, BS.link(u)) for t, u in p["source"].get("links", [])][:3], cite=p["source"].get("cite", ""),
        photo=(p.get("photos") or [[None]])[0][0], tags=list(p.get("shares", [])), rank=3)
# 3. public statements
for s in BS.STJ["statements"]:
    if not ok(s.get("quote", "")): continue
    add(id=s["id"], date=s["date"], when=s.get("when", s["date"]), actor=s["profiles"][0], kind="Public statement", lead=s.get("lead", ""), quote=s["quote"],
        summary=bool(s.get("summary")), src=[(s.get("source_title") or "Source", s["url"])], tags=s["profiles"][1:], rank=1)
# 4. the correspondence trail (roadmap): replies, missed deadlines, requests
KEY_CLS = {"complaint outcome", "substantive disclosure", "refusal", "partial", "not held", "subject-access response"}
LABEL = {"complaint outcome": "Complaint outcome", "substantive disclosure": "Records disclosed", "refusal": "Refusal", "partial": "Part answer",
         "not held": "“Not held”", "subject-access response": "Subject access reply", "redirected elsewhere": "Sent elsewhere",
         "fee or clarification demand": "Asked for a fee or clarification", "correspondence (no disclosure)": "Letter", "other": "Reply", "acknowledgement only": "Acknowledged"}
QUOTES = {}
for d in DAILY:
    for r in d.get("replies", []):
        if r.get("quote") and r.get("wayback"): QUOTES[r["wayback"]] = r["quote"]
for L in R["lanes"]:
    sl = lane_slug(L)
    for m in L["emails"]:
        when = dt.date.fromisoformat(m["date"]).strftime("%-d %B %Y")
        src = [(t, u) for t, u in (("Email", m.get("url")), ("Archived text", m.get("wayback")), (m.get("ev") or "", m.get("ev") and "https://greathousefarmwiki.wordpress.com/?s=" + m["ev"])) if u and t]
        if m["dir"] == "received":
            summ = m.get("summary", "") if ok(m.get("summary", "")) else ""
            add(id="m-" + m["id"], date=m["date"], when=when, actor=sl, kind="Reply · " + LABEL.get(m["cls"], "Reply"), title="",
                quote=QUOTES.get(m.get("wayback")), lead=("Their words, %s:" % when) if QUOTES.get(m.get("wayback")) else "",
                text=("In short: " + summ) if summ else "", src=src, wall=m["cls"] in KEY_CLS, rank=2)
        else:
            what = {"request": "a request for information", "chase": "a chaser", "clarification given": "a clarification", "complaint": "a complaint",
                    "internal review request": "a request for an internal review", "preservation notice": "a preservation notice"}.get(m.get("cls"), "a letter")
            add(id="m-" + m["id"], date=m["date"], when=when, actor="williams-buckler-family", kind="Letter sent", title="",
                text="The family sent %s to %s%s." % (what, prof(sl)["name"], (" (deadline %s)" % dt.date.fromisoformat(m["deadline"]).strftime("%-d %b %Y")) if (m.get("deadline") or "")[:4].isdigit() else ""),
                src=src[:1], tags=[sl], wall=False, rank=4)
    for x in L["missed"]:
        if "no reply" not in str(x.get("status", "")): continue
        add(id="miss-%s-%s" % (L["id"], x["date"]), date=x["date"], when=dt.date.fromisoformat(x["date"]).strftime("%-d %B %Y"), actor=sl, kind="Deadline passed",
            title="", text="The statutory deadline passed with no reply%s." % ((" (ref %s)" % x["ref"]) if x.get("ref") else ""),
            src=[("Request", x.get("url"))] if x.get("url") else [], rank=2)
EV = [x for x in EV if x["date"] <= TODAY.isoformat() and prof(x["actor"])]
EV.sort(key=lambda x: (x["date"], -x.get("rank", 3)), reverse=True)
BYP = collections.defaultdict(list)
for x in EV:
    for sl in [x["actor"]] + [t for t in x["tags"] if t and t != x["actor"]]:
        if prof(sl): BYP[sl].append(x)

# ------------------------------------------------------------------ rendering
def ver(path): return hashlib.sha1(open(os.path.join(SITE, path), "rb").read()).hexdigest()[:10]
def head(title, desc, rel, og="img/social/william-cover-tractor.webp"):
    h = BS.head(title, desc, rel, og, rel)
    return h.replace("</head>", "").rstrip().replace(BS.BOOT, '<link rel="stylesheet" href="/wall.css?v=%s">%s\n</head>' % (ver("wall.css"), BS.BOOT))
def avimg(sl, up, size=40, cls=""):
    p = prof(sl); src = av(sl)
    return '<img src="%s%s" alt="" width="%d" height="%d" loading="lazy" class="%s%s">' % (up, src, size, size, cls, " wf" if p.get("face") or not p.get("entity") else "")
def card(x, up):
    a = x["actor"]; p = prof(a); pu = "%su/%s.html" % (up, a)
    h = ['<article class="post sp wl" id="%s"><header class="sp-h"><a class="sp-av" href="%s" tabindex="-1" aria-hidden="true">%s</a>'
         '<div class="sp-who"><a class="sp-n" href="%s">%s</a>%s<div class="sp-d"><time datetime="%s">%s</time> · %s</div></div></header>'
         % (e(x["id"]), pu, avimg(a, up), pu, e(p["name"]),
            "".join(' <span class="wl-with">with <a href="%su/%s.html">%s</a></span>' % (up, t, e(prof(t)["name"])) for t in x["tags"][:2] if t and prof(t) and t != a and x["kind"] != "Highlight report"),
            x["date"], e(x["when"]), e(x["kind"]))]
    h.append('<div class="sp-b">')
    if x.get("daily"):
        d = x["daily"]; st = d["status"]
        h.append('<h2 class="pt sp-t">%s</h2>' % e(d["title"]))
        h.append('<figure class="wl-vid"><video controls playsinline preload="none" poster="%s%s" src="%s"></video></figure>' % (up, e(d["poster"]), e(d["video"])))
        h.append('<div class="wl-rag"><span class="g"><b>%d</b> answered</span><span class="r"><b>%d</b> overdue</span><span class="a"><b>%d</b> due</span></div>' % (st["answered"], st["overdue"], st["due"]))
        h.append('<details class="wl-more"><summary>Read the report</summary>')
        if d.get("next"): h.append("<p><b>Next replies due:</b> " + "; ".join("%s, %s" % (e(n["who"]), dt.date.fromisoformat(n["date"]).strftime("%-d %b")) for n in d["next"]) + "</p>")
        for r in d.get("replies", []):
            q = (" “%s”" % e(r["quote"])) if r.get("quote") else ""
            lk = (' <a href="%s">source</a>' % e(r["wayback"])) if r.get("wayback") else ""
            h.append("<p><b>%s</b> (%s):%s%s</p>" % (e(r["short"]), e(r["label"].lower()), q or (" " + e(r["summary"]) if ok(r.get("summary", "")) else ""), lk))
        for v in d.get("evidence", []): h.append("<p><b>New evidence:</b> %s (%s)</p>" % (e(v["text"]), e(v["find"])))
        op = d.get("routes", {}).get("opened") or {}
        if op: h.append("<p><b>Routes now open:</b> " + "; ".join("%s: %s" % (e(k), ", ".join(e(i["who"]) for i in v)) for k, v in op.items()) + "</p>")
        g = d.get("routes", {}).get("ground")
        if g: h.append("<p><b>Closest reopening route:</b> %s, %d points to the court-ready bar (%d routes under test).</p>" % (e(g["label"]), g["short"], g["tested"]))
        h.append('<p class="wl-hope">%s</p></details>' % e(d["hope"]))
    else:
        if x.get("title"): h.append('<h2 class="pt sp-t">%s</h2>' % e(fix(x["title"])))
        if x.get("lead"): h.append('<p class="wl-lead">%s</p>' % e(x["lead"]))
        if x.get("quote"): h.append('<blockquote class="wl-q%s">%s</blockquote>' % (" wl-sum" if x.get("summary") else "", ("“%s”" % e(x["quote"])) if not x.get("summary") else e(x["quote"])))
        if x.get("text"): h.append("<p>%s</p>" % e(fix(x["text"])))
        if x.get("photo") and os.path.exists(os.path.join(SITE, x["photo"])): h.append('<figure class="sp-media"><img src="%s%s" alt="" loading="lazy"></figure>' % (up, e(x["photo"])))
    h.append("</div>")
    srcs = x.get("src") or ([("Video", x["daily"]["video"])] if x.get("daily") else [])
    if x.get("link"): srcs = [("Open the post", up + x["link"])] + list(srcs)
    h.append('<details class="sp-src"><summary>Source</summary>%s%s</details>' % (("<p>%s</p>" % e(fix(x["cite"]))) if x.get("cite") else "",
             "<p>" + " · ".join('<a href="%s" rel="noopener">%s</a>' % (e(u), e(t)) for t, u in srcs if u) + "</p>"))
    h.append("</article>")
    return "".join(h)
def years(up):
    ys = sorted({x["date"][:4] for x in EV if x["wall"]}, reverse=True)
    return '<nav class="sb-years wl-years" aria-label="Earlier years">%s</nav>' % "".join('<a href="%swall/%s.html">%s</a>' % (up, y, y) for y in ys)
WALLCSS = """/* wall.css — the hope wall and full profiles (22 Oct 2026). — Sion's Tab agent */
.wl-hero{background:var(--card);padding:14px 14px 10px;margin:0 0 10px}
.wl-hero h1{margin:0;font-size:21px}.wl-hero p{margin:4px 0 0;color:var(--muted);font-size:14px}
.wl-years{padding:8px 0 2px}
.sp-av img.wf,.pf-av.wf{object-fit:cover}
.wl-with{font-weight:400;color:var(--muted);font-size:14px}.wl-with a{color:var(--ink);font-weight:600;text-decoration:none}
.wl-vid{margin:6px -14px 8px}.wl-vid video{width:100%;max-height:78vh;background:#000;aspect-ratio:9/16;object-fit:contain}
.wl-rag{display:flex;gap:8px;flex-wrap:wrap;margin:4px 0 8px}.wl-rag span{padding:4px 10px;border-radius:14px;font-size:13px;background:var(--bub)}
.wl-rag b{font-size:15px;margin-right:3px}.wl-rag .g b{color:#1e8e3e}.wl-rag .r b{color:#d93025}.wl-rag .a b{color:#b06000}
.wl-more summary{cursor:pointer;color:var(--fbb);font-weight:600;list-style:none;padding:2px 0 6px}.wl-more summary::-webkit-details-marker{display:none}
.wl-more p{margin:6px 0;font-size:14.5px}.wl-hope{font-style:italic;color:var(--muted)}
.wl-q{margin:4px 0 8px;padding:6px 0 6px 12px;border-left:4px solid #d4b25a;font-size:16px;line-height:1.4}
.wl-q.wl-sum{font-style:normal}.wl-lead{margin:0 0 2px;color:var(--muted);font-size:13.5px}
.wl-more-link{display:block;text-align:center;background:var(--card);padding:14px;margin:0 0 10px;font-weight:600;text-decoration:none}
.pf-av.wf{border-radius:50%}
.wl-about{padding:10px 14px;margin:0 0 10px}.wl-about summary{cursor:pointer;list-style:none;font-size:14.5px;line-height:1.4}.wl-about summary::-webkit-details-marker{display:none}
.wl-about summary b{margin-right:4px}.wl-about summary::after{content:" See more";color:var(--muted);font-weight:600}.wl-about details[open] summary::after{content:""}
.wl-about p{margin:8px 0 0;font-size:14.5px}
.pf-n{font-size:12.5px;color:var(--muted);margin:2px 0 0}
.pf-counts{color:var(--muted);font-size:14px;margin:2px 0 0}
.wl-empty{background:var(--card);padding:16px 14px;color:var(--muted);margin:0 0 10px}
.wl-sec{margin:14px 14px 8px;font-size:13px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted)}
.wl-yhead{margin:16px 14px 8px;font-size:13px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted)}
@media(prefers-color-scheme:dark){html:not([data-ghf-native="light"]) .wl-q{border-color:#d4b25a}}
"""
def write(rel, s):
    p = os.path.join(SITE, rel); os.makedirs(os.path.dirname(p), exist_ok=True); open(p, "w", encoding="utf-8").write(s)
def page_end(up, active="feed"): return BS.tabs(active, up) + "</body></html>"

def build():
    write("wall.css", WALLCSS)
    # keep the press feed as papers.html
    idx = os.path.join(SITE, "index.html")
    if os.path.exists(idx) and "wl-hero" not in open(idx, encoding="utf-8").read(): shutil.copy(idx, os.path.join(SITE, "papers.html"))
    wall = [x for x in EV if x["wall"]]
    first = wall[:45]
    cards = []; lasty = None
    for x in first:
        y = x["date"][:4]
        if y != lasty and lasty is not None: cards.append('<h2 class="wl-yhead">%s</h2>' % y)
        lasty = y; cards.append(card(x, ""))
    nxt = first[-1]["date"][:4] if first else str(TODAY.year)
    hero = ('<section class="wl-hero"><h1>Today at Tŷ Mawr</h1><p>The family’s wall: a daily highlight report, then every key event, newest first. '
            'Tap a name for their whole story.</p>%s</section>' % years(""))
    write("index.html", head("farmbook · Today at Tŷ Mawr", "The Williams / Buckler family’s wall for Great House Farm (Tŷ Mawr), Llandough: a daily video highlight report on every request and reply, then the key events of the case, newest first.", "index.html")
          + "<body>" + BS.top("feed") + '<main id="main" class="sb-main">' + hero + "".join(cards)
          + '<a class="wl-more-link" href="wall/%s.html">Earlier: %s and before →</a></main>' % (nxt, nxt) + page_end(""))
    ys = sorted({x["date"][:4] for x in wall}, reverse=True)
    for i, y in enumerate(ys):
        items = [x for x in wall if x["date"][:4] == y]
        older = ys[i + 1] if i + 1 < len(ys) else None
        write("wall/%s.html" % y, head("%s · farmbook wall" % y, "Key events of %s on the Great House Farm (Tŷ Mawr) wall, newest first." % y, "wall/%s.html" % y)
              + "<body>" + BS.top("feed", "../") + '<main id="main" class="sb-main"><section class="wl-hero"><h1>%s</h1><p>%d key events, newest first.</p>%s</section>' % (y, len(items), years("../"))
              + "".join(card(x, "../") for x in items)
              + ('<a class="wl-more-link" href="%s.html">Earlier: %s →</a>' % (older, older) if older else '<a class="wl-more-link" href="../index.html">Back to today</a>')
              + "</main>" + page_end("../"))
    # profiles
    n_prof = 0
    for sl in list(OUT) + list(PEO):
        p = prof(sl); evs = BYP.get(sl, []); up = "../"; n_prof += 1
        cover = ('<figure class="pf-cover"><img src="%s%s" alt=""></figure>' % (up, p["cover"])) if p.get("cover") else ('<figure class="pf-cover pf-cover-t" style="--c:%s"><span>%s</span></figure>' % (p.get("color", "#455a64"), e(p["name"])))
        fk = p.get("face_kind")
        yrs = sorted({x["date"][:4] for x in evs})
        cnt = ("%d posts · %s" % (len(evs), (yrs[0] + "–" + yrs[-1]) if len(yrs) > 1 else yrs[0])) if evs else "No posts yet"
        ab = fix(p.get("about", "")); first = re.split(r"(?<=[.!?”])\s+", ab, 1)[0] if ab else ""
        if len(first) > 150: first = first[:147].rsplit(" ", 1)[0] + "…"
        about = '<section class="pf-card wl-about" id="about"><details><summary><b>About</b> %s</summary><p>%s</p>%s%s</details></section>' % (
            e(first), e(ab), ('<p class="pf-n">Portrait: %s.</p>' % e(fk)) if fk else "",
            ('<p class="pf-n"><a href="%s">On the Legal Wiki</a></p>' % e(p["wiki"])) if p.get("wiki") else "")
        stm = [x for x in evs if x["kind"] in ("Public statement",) or x["kind"].startswith("Reply") and x["actor"] == sl and x.get("quote")]
        sec = ('<section id="statements" class="wl-sec-wrap"><h2 class="wl-sec">Their posts, newest first</h2>%s</section>' %
               ("".join(card(x, up) for x in evs) if evs else '<div class="wl-empty"><span class="st"></span>No public statements found yet.</div>'))
        if evs and not stm: sec = sec.replace('<h2 class="wl-sec">', '<p class="wl-empty" style="margin-bottom:6px">No public statements found yet; the record below involves them.</p><h2 class="wl-sec">', 1)
        if evs: sec = sec.replace('</h2>', '</h2><span class="st" hidden></span>', 1)
        body = ('<main id="main" class="sb-main sb-prof">%s<div class="pf-id"><img class="pf-av%s" src="%s%s" alt="" width="120" height="120"><div><h1>%s</h1><p class="muted">%s</p><p class="pf-counts">%s</p></div></div>'
                '<nav class="pf-tabs"><a class="ln" href="#statements">Posts</a><a class="ln" href="#about">About</a></nav>%s%s</main>'
                % (cover, " wf" if (p.get("face") or not p.get("entity")) else "", up, av(sl), e(p["name"]), e(p.get("kind", "")), e(cnt), about, sec))
        write("u/%s.html" % sl, head("%s · farmbook" % p["name"], fix(p.get("about") or p["name"])[:300], "u/%s.html" % sl, av(sl)) + "<body>" + BS.top("people", up) + body + page_end(up, "people"))
    # faces everywhere a person's initials badge was used (profiles list, friends, n/ pages)
    for root, _, files in os.walk(SITE):
        if "/u" in root[len(SITE):][:2] or "/wall" in root[len(SITE):]: continue
        for f in files:
            if not f.endswith(".html"): continue
            fp = os.path.join(root, f); t = open(fp, encoding="utf-8").read(); t2 = t
            for sl, fc in FACES.items():
                if sl == NARRATOR: continue
                t2 = t2.replace("img/social/av-%s.svg" % sl, fc["img"])
            if t2 != t: open(fp, "w", encoding="utf-8").write(t2)
    os.makedirs(os.path.join(SITE, "api"), exist_ok=True)
    json.dump({"schema": "fb wall v1", "generated": dt.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"), "count": len(EV),
               "events": [{k: v for k, v in x.items() if k in ("id", "date", "when", "actor", "kind", "title", "quote", "text", "src", "tags", "wall", "link")} for x in EV]},
              open(os.path.join(SITE, "api", "wall.json"), "w", encoding="utf-8"), ensure_ascii=False)
    # every visible line we wrote passes the house list
    bad = []
    for root, _, files in os.walk(SITE):
        for f in files:
            if f.endswith(".html") and (root.endswith("/u") or root.endswith("/wall") or (root == SITE and f == "index.html")):
                vis = re.sub(r"<script[\s\S]*?</script>|<style[\s\S]*?</style>|<svg[\s\S]*?</svg>", "", open(os.path.join(root, f), encoding="utf-8").read())
                vis = html.unescape(re.sub(r"<[^>]+>", " ", vis)); m = BANNED.search(vis)
                if m: bad.append((f, m.group(0), vis[max(0, m.start() - 60):m.end() + 40]))
    if bad: raise SystemExit("WALL GATE: " + json.dumps(bad[:12], ensure_ascii=False))
    print("wall built: %d events (%d on the wall, %d daily reports), %d profiles, %d with faces, years %s" % (len(EV), len(wall), len(DAILY), n_prof, sum(1 for s in FACES if prof(s)), ",".join(ys[:3]) + "…"))

if __name__ == "__main__":
    build()
