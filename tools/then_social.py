"""then_social.py — fb.bucklerfamily.estate (the Then edition) as an entirely-Facebook retelling of the freehold title chain, 1877–1994.
Sion, 03:06 BST 23 Oct 2026: "the website fb.bucklerfamily.estate has to be a recreation of the whole story 1877 - 1994 to do with title chain
(freehold) as if entirely Facebook. Anyones association with another part of the story must make them a friend of the other ... If people
disagree have them thumbs down the post. Like the 87 ruling would be thumbs up like from bp and their press statements in the comments under.
And buckler thumbs down and comments under". Also: images from wayback, the two Legal Wiki videos in the feed, and one date per post.
Data: data/then_social.json (drops, folds of statements into comment threads, 👍/👎 reactions, wayback images, videos, two added posts).
Used by tools/build_wall.py. — Sion's Tab agent"""
import os, re, json, html, datetime as dt, collections
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
D = json.load(open(os.path.join(ROOT, "data", "then_social.json"), encoding="utf-8"))
e = lambda s: html.escape(str(s), quote=True)
LEGAL = {"dillon-lj", "mustill-lj", "sir-edward-eveleigh", "the-courts", "court-of-appeal", "hollis-j-high-court", "judge-norman-francis",
         "house-of-lords", "european-commission-of-human-rights", "high-court-1955", "cardiff-county-court"}
PRESS = r"(?:the )?(South Wales Echo|Western Mail|Daily Telegraph|Evening Express|Cardiff Times|Barry Dock News|South Wales Star|Neath Guardian|Estates Gazette|Hansard|press)"
MONTHS = r"(?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\.?"
DATE_RE = re.compile(r"(?:c\.\s*)?(?:\d{1,2}(?:\s*(?:and|&|–|-)\s*\d{1,2})?\s+%s\s+\d{4}|%s\s+\d{4}|(?<=, )(?:1[5-9]|20)\d{2}\b(?=\s*(?:[,:)]|$))|(?<=of )(?:1[5-9]|20)\d{2}\b(?=\s*(?:[,:(]|$)))" % (MONTHS, MONTHS))

def strip_year(name):
    """'Judge, Cardiff County Court (1988)' -> 'Judge, Cardiff County Court' (the date lives in the post header only)."""
    return re.sub(r"\s*\((?:c\.\s*)?\d{4}(?:\s*[–-]\s*\d{2,4})?\)", "", name or "").strip()

def via(lead):
    """A statement's lead line without its dateline: the date lives in the post header; the paper stays as a small 'via …' line."""
    if not lead: return ""
    s = lead.strip().rstrip(":").strip()
    m = re.search(r"(?:as )?reported by %s" % PRESS, s, re.I) or re.search(r"^To %s" % PRESS, s, re.I)
    if m:
        paper = m.group(1); paper = "The Daily Telegraph" if paper.lower() == "daily telegraph" else paper
        if paper.lower() == "press": return "to the press"
        return ("via " if "reported" in m.group(0).lower() else "to the ") + paper if not paper.startswith("The ") else ("via " if "reported" in m.group(0).lower() else "to ") + paper
    s = re.sub(r"\(([^)]*)\)", lambda m: "(" + m.group(1) + ")" if not DATE_RE.search(m.group(1)) else "", s)
    s = DATE_RE.sub("", s)
    s = re.sub(r"\b(next day|that day|the same day|of|on|in|after the eviction attempt of)\s*(?=[,:]|$)", "", s)
    s = re.sub(r"\s*,\s*,", ",", s); s = re.sub(r"\s+", " ", s).strip(" ,;·–-")
    s = re.sub(r"\s+,", ",", s); s = re.sub(r",\s*\(", " (", s); s = re.sub(r"\b(of|on|in)\s+\(", "(", s)
    return s if len(s) > 3 else ""

def body_dated(text, when):
    """True when a post body repeats the header date (the check behind 'date once only')."""
    if not text or not when: return False
    w = when.strip()
    return bool(re.match(r"^\W*(?:[A-Z][\w’' ]+,\s*)?" + re.escape(w), text.strip())) if re.search(r"\d", w) else False

def fmt(d):
    try: return dt.date.fromisoformat(d).strftime("%-d %b %Y")
    except Exception: return d[:4]

def add_profiles(PEO, initials, badge):
    for i, (sl, p) in enumerate(D.get("profiles", {}).items()):
        if sl in PEO: continue
        PEO[sl] = {"name": p["name"], "kind": p["kind"], "about": p["about"], "entity": True, "initials": initials(p["name"]),
                   "color": ["#37474f", "#1b5e20", "#0d47a1", "#4a148c"][i % 4], "avatar": "img/social/av-%s.svg" % sl}
        badge(sl)

def apply_then(EV, prof):
    """Then edition: the 1877–1994 freehold chain. Returns the new event list and a log of what was left out."""
    end = D["end"]; out_log = []
    byid = {x["id"]: x for x in EV}
    for a in D.get("add", []):
        x = dict(a); x.setdefault("wall", True); x.setdefault("rank", 2); x.setdefault("tags", [])
        cms = x.pop("cm", [])
        x["rcm"] = [{"who": c["who"], "text": c["text"], "src": c["src"], "src_t": "source", "when": c.get("when", ""), "legal": False} for c in cms]
        EV.append(x); byid[x["id"]] = x
    keep = []
    for x in EV:
        if x["date"] > end: out_log.append((x["id"], "after 1994")); continue
        if x["id"] in D["drop"]: out_log.append((x["id"], D["drop"][x["id"]])); continue
        keep.append(x)
    EV = keep; byid = {x["id"]: x for x in EV}
    folded = set()
    for sid, tid in D["fold"].items():
        s, t = byid.get(sid), byid.get(tid)
        if not (s and t): continue
        q = D.get("trim", {}).get(sid) or s.get("quote") or s.get("text") or ""
        if any(c["text"] == q for c in t.get("rcm", [])): folded.add(sid); continue   # one comment per statement (two judges, one sentence)
        src = (s.get("src") or [("source", "")])[0]
        t.setdefault("rcm", []).append({"who": s["actor"], "text": q, "src": src[1], "src_t": src[0], "when": fmt(s["date"]),
                                        "via": via(s.get("lead", "")), "legal": s["actor"] in LEGAL})
        for tg in [s["actor"]] + list(s.get("tags", [])):
            if tg and tg != t["actor"] and tg not in t["tags"]: t["tags"].append(tg)
        folded.add(sid)
    EV = [x for x in EV if x["id"] not in folded]
    TEN = re.compile(r"\b(lease|leases|leased|tenan\w*|rent|rents|rental|landlord\w*)\b", re.I)   # freehold only (Sion's infographic rule)
    for x in EV:
        cm2 = []
        for c in x.get("cm") or []:
            tx = c[1] if isinstance(c, (list, tuple)) else c.get("text", "")
            if TEN.search(tx or ""): continue
            cm2.append(c)
        if x.get("cm"): x["cm"] = cm2
        for k in ("text", "text2", "lead"):
            if x.get(k) and TEN.search(x[k]):
                x[k] = " ".join(z for z in re.split(r"(?<=[.!?])\s+", x[k]) if not TEN.search(z)).strip()
        if TEN.search(x.get("kind", "")): x["kind"] = "Life event" if x.get("life") else re.sub(r"\s*·.*$", "", x["kind"])
        if x.get("src"):
            x["src"] = [((re.match(r"^(EV-\d+|GHF-[\w-]+)", t).group(1) + " · the record") if TEN.search(t) and re.match(r"^(EV-\d+|GHF-[\w-]+)", t) else ("The record" if TEN.search(t) else t), u) for t, u in x["src"]]
        r = D["reacts"].get(x["id"])
        if r:
            x["up"] = [s for s in r.get("up", []) if prof(s)]; x["down"] = [s for s in r.get("down", []) if prof(s)]
        if x["id"] in D["images"]:
            x["wbimg"] = D["images"][x["id"]]; x.pop("photo", None)
        if x["id"] in D["videos"]: x["video"] = D["videos"][x["id"]]
        for c in x.get("rcm", []):   # comments are reactions too: whoever comments is in the thread
            pass
    return EV, out_log, folded

def _forms(x):
    f = {x.get("when", "")}
    try:
        d = dt.date.fromisoformat(x["date"]); f |= {d.strftime("%-d %B %Y"), d.strftime("%-d %b %Y")} if x.get("when", "")[:1].isdigit() else set()
    except Exception: pass
    return [w for w in f if w and re.search(r"\d{1,2} \w+ \d{4}", w)]
def dedate(text, x):
    """Drop the header's own date where a body repeats it near the start ("Deed of 29 March 1961 between …" → "Deed between …")."""
    if not text: return text
    for w in _forms(x):
        i = text.find(w)
        if 0 <= i <= 60:
            text = re.sub(r"(?:,\s*|\s+(?:of|on|dated)\s+|\s+)?" + re.escape(w) + r"(?:\s*,)?", "", text, count=1).strip()
            text = re.sub(r"^[,;:\s]+", "", text); text = text[:1].upper() + text[1:]
    return text
TENW = re.compile(r"\b(lease\w*|tenan\w*|rent|rents|rental|rent-free)\b", re.I)
def freehold_profiles(PEO, OUT):
    """Then edition: profile names, kinds and bios carry no tenancy, rent or lease lines (freehold only)."""
    for p in list(PEO.values()) + list(OUT.values()):
        if not isinstance(p, dict): continue
        for k in ("name", "kind", "about"):
            v = p.get(k)
            if not v: continue
            v = re.sub(r"landlords[’']", "freeholders’", v); v = re.sub(r"\blandlord\b", "freeholder", v); v = re.sub(r"\bLandlords[’'] agent", "Freeholders’ agent", v)
            if TENW.search(v): v = " ".join(z for z in re.split(r"(?<=[.!?])\s+", v) if not TENW.search(z)).strip() or (p.get("name") if k != "name" else v)
            p[k] = v
def undate(EV):
    for x in EV:
        if x.get("lead"): x["lead"] = via(x["lead"])
        for k in ("text", "text2", "lead"):
            if x.get(k): x[k] = dedate(x[k], x)

def graph(EV, prof):
    """Association graph: everyone named on the same record (a conveyance, a case, a letter, a report) is friends."""
    FR = collections.defaultdict(set)
    for x in EV:
        ps = {x["actor"]} | set(t for t in x.get("tags", []) if t) | set(x.get("up", [])) | set(x.get("down", [])) | {c["who"] for c in x.get("rcm", [])}
        ps = {p for p in ps if prof(p)}
        for a in ps:
            for b in ps:
                if a != b: FR[a].add(b)
    return FR

def reacts_html(x, up, prof):
    U, Dn = x.get("up", []), x.get("down", [])
    if not (U or Dn): return ""
    names = U + [d for d in Dn if d not in U]
    first = prof(names[0])["name"]; n = len(names)
    who = first + ((" and %d other%s" % (n - 1, "" if n == 2 else "s")) if n > 1 else "")
    cm = len(x.get("rcm", []))
    bar = ('<div class="fb-rx" data-up="%d" data-down="%d"><span class="fb-ic">%s%s</span><span class="fb-who">%s</span>%s</div>'
           % (len(U), len(Dn), ('<i class="fb-u">👍</i>' if U else ""), ('<i class="fb-d">👎</i>' if Dn else ""), e(who),
              ('<span class="fb-cc">%d comment%s</span>' % (cm, "" if cm == 1 else "s")) if cm else ""))
    lst = lambda L: ", ".join('<a href="%su/%s.html">%s</a>' % (up, s, e(prof(s)["name"])) for s in L)
    det = '<details class="fb-rxw"><summary>See who reacted</summary>%s%s</details>' % (
        ('<p><span class="fb-u">👍 %d</span> %s</p>' % (len(U), lst(U))) if U else "", ('<p><span class="fb-d">👎 %d</span> %s</p>' % (len(Dn), lst(Dn))) if Dn else "")
    act = '<div class="fb-act"><span>👍 Like</span><span>💬 Comment</span><span>↗ Share</span></div>'
    return bar + det + act

def comments_html(x, up, prof, avimg):
    out = []
    U, Dn = set(x.get("up", [])), set(x.get("down", []))
    for c in x.get("rcm", []):
        sl = c["who"]; p = prof(sl)
        if not p: continue
        mark = "👍 " if sl in U else ("👎 " if sl in Dn else "")
        q = '<p class="fb-q">“%s”</p>' % e(c["text"])
        if c.get("legal"): q = '<section data-verbatim="legal-test">%s</section>' % q
        meta = " · ".join(t for t in [e(c.get("when", "")), e(c["via"]) if c.get("via") else "", '<a href="%s" rel="noopener">source</a>' % e(c["src"]) if c.get("src") else ""] if t)
        out.append('<div class="wl-cm fb-cm"><a href="%su/%s.html" tabindex="-1" aria-hidden="true">%s</a><div class="wl-cb"><a class="wl-cn" href="%su/%s.html">%s</a>'
                   '%s<span class="wl-cw">%s%s</span></div></div>' % (up, sl, avimg(sl, up, 32), up, sl, e(p["name"]), q, (mark + "· ") if mark else "", meta))
    return '<div class="wl-cms fb-cms">%s</div>' % "".join(out) if out else ""

def media_html(x, up):
    h = []
    v = x.get("video")
    if v and v.get("yt"):
        h.append('<figure class="wl-vid fb-yt"><iframe src="https://www.youtube-nocookie.com/embed/%s?rel=0&amp;playsinline=1" title="%s" loading="lazy" '
                 'allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen data-yt="%s"></iframe></figure>'
                 % (e(v["yt"]), e(v.get("title", "Video")), e(v["yt"])))
    elif v and v.get("mp4"):
        h.append('<figure class="wl-vid fb-mp4"><video controls playsinline preload="metadata" src="%s#t=0.5"></video></figure>' % e(v["mp4"]))
    if x.get("wbimg"):
        h.append('<figure class="sp-media fb-wb"><img src="%s" alt="" loading="lazy" data-wayback="1"></figure>' % e(x["wbimg"]))
    return "".join(h)

def friends_html(sl, FR, up, prof, avimg):
    fr = sorted(FR.get(sl, ()), key=lambda s: (-len(FR[s] & FR[sl]), prof(s)["name"]))
    if not fr: return '<section class="fb-fr" id="friends"><h2>Friends</h2><p class="fb-none">No friends on the record yet.</p></section>'
    cards = "".join('<a class="fb-f" href="%su/%s.html">%s<b>%s</b><small>%d mutual friend%s</small></a>'
                    % (up, s, avimg(s, up, 64), e(prof(s)["name"]), len(FR[s] & FR[sl]), "" if len(FR[s] & FR[sl]) == 1 else "s") for s in fr)
    return '<section class="fb-fr" id="friends"><h2>Friends <span>%d</span></h2><div class="fb-fg">%s</div></section>' % (len(fr), cards)

CSS = """
.fb-rx{display:flex;align-items:center;gap:6px;padding:8px 14px 4px;font-size:.88rem;color:var(--wl-mut,#65676b)}
.fb-ic i{font-style:normal;display:inline-grid;place-items:center;width:20px;height:20px;border-radius:50%;font-size:12px;margin-right:-4px;border:2px solid var(--wl-card,#fff)}
.fb-ic .fb-u{background:#1877f2}.fb-ic .fb-d{background:#e4e6eb}
.fb-who{margin-left:6px;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.fb-cc{white-space:nowrap}
.fb-rxw{padding:0 14px;font-size:.85rem}.fb-rxw summary{cursor:pointer;color:var(--wl-mut,#65676b)}.fb-rxw p{margin:.3em 0}
.fb-act{display:flex;justify-content:space-around;border-top:1px solid var(--wl-line,#e4e6eb);margin:6px 14px 0;padding:6px 0;color:var(--wl-mut,#65676b);font-weight:600;font-size:.9rem}
.fb-q{margin:.2em 0}.fb-cm .wl-cw a{color:inherit;text-decoration:underline}
.fb-yt{position:relative;aspect-ratio:16/9;margin:8px 0;background:#000}.fb-yt iframe{position:absolute;inset:0;width:100%;height:100%;border:0}
.fb-mp4 video{display:block;width:100%;max-height:75vh;background:#000}
.fb-wb img{display:block;width:100%;height:auto;max-height:520px;object-fit:contain;background:var(--wl-line,#e4e6eb)}
.fb-fr{margin:12px 0;padding:12px 14px;background:var(--wl-card,#fff);border-radius:10px}
.fb-fr h2{font-size:1.1rem;margin:0 0 8px}.fb-fr h2 span{color:var(--wl-mut,#65676b);font-weight:400}
.fb-fg{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.fb-f{display:flex;flex-direction:column;gap:2px;text-decoration:none;color:inherit;min-width:0}
.fb-f img{width:100%;height:auto;aspect-ratio:1;border-radius:8px;object-fit:cover}
.fb-f b{font-size:.82rem;line-height:1.2;overflow-wrap:anywhere}.fb-f small{font-size:.74rem;color:var(--wl-mut,#65676b)}
"""

def check(site):
    """Build gate: one date per post (header only) and no year in an actor's name. Returns a list of problems."""
    errs = []
    for root, _, files in os.walk(site):
        for f in files:
            if not f.endswith(".html"): continue
            t = open(os.path.join(root, f), encoding="utf-8").read()
            for a in t.split('<article class="post sp')[1:]:
                pid = (re.search(r'id="([^"]+)"', a) or [None, "?"])[1]
                tm = re.search(r'<time datetime="[^"]*">([^<]+)</time>', a)
                n = re.search(r'<a class="sp-n" href="[^"]*">([^<]+)</a>', a)
                if n and re.search(r"\(\s*(?:c\.\s*)?\d{4}", n.group(1)): errs.append("%s %s: year in name %s" % (f, pid, n.group(1)))
                b = a.split('<div class="sp-b">', 1)[1].split("</div>", 1)[0] if '<div class="sp-b">' in a else ""
                lead = re.search(r'<p class="wl-lead">([^<]*)</p>', b)
                if lead and re.match(r"^(?:[A-Z][\w’' ]{0,30},\s*)?(?:c\.\s*)?\d{1,2} \w+ \d{4}", lead.group(1)): errs.append("%s %s: dateline in lead: %s" % (f, pid, lead.group(1)[:60]))
                if tm:
                    w = html.unescape(tm.group(1)).strip()
                    first = html.unescape(re.sub(r"<[^>]+>", " ", b)).strip()[:80]
                    if re.search(r"\d{1,2} \w+ \d{4}", w) and re.search(r"(?<![–\-\d])" + re.escape(w), first[:60]): errs.append("%s %s: date repeated in body" % (f, pid))
    return errs
