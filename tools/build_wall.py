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
_ts = importlib.util.spec_from_file_location("then_social", os.path.join(ROOT, "tools", "then_social.py"))
TS = importlib.util.module_from_spec(_ts); _ts.loader.exec_module(TS)   # fb. as entirely Facebook, 1877–1994 (Sion, 03:06 BST 23 Oct 2026)
e = lambda s: html.escape(str(s), quote=True)
BASE = BS.BASE
# Editions (Sion, 01:24 BST 23 Oct 2026): FB_EDITION=then → fb.bucklerfamily.estate (site/, everything before 2005);
# FB_EDITION=now → fb2.bucklerfamily.estate (site2/, 2005 onwards). One generator, one branch, two Pages projects.
SITE, NOW, EDITION, SPLIT = BS.SITE, BS.NOW, BS.EDITION, "2005"
THEN_URL, NOW_URL = BS.THEN_URL, BS.NOW_URL
os.makedirs(os.path.join(SITE, "img", "social"), exist_ok=True)
from zoneinfo import ZoneInfo
TODAY = dt.datetime.now(ZoneInfo("Europe/London")).date()   # the family's day, not the box's UTC day
BANNED = re.compile(r"\b(thief|thieves|stolen|looted|criminal|racket|lawfare|fraud\w*|says|claims|claimed|claiming|according to|alleged\w*|allegation\w*|hearsay|unverified)\b|(?<!Coed )\bSion\b" + (r"(?! Buckler\b)" if NOW else "") + r"|(?<!Coed Sion )\bHywel\b"
                    r"|family[’']?s? (account|position)|Branwen\s+Buckler|robin\s*hill|(?<!#)hywelapbuckler|7845|[\w.+-]+@[\w-]+\.[\w.]+|Not a finding|Our case|prospective", re.I)
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
LANE_ALIAS = {"serious-fraud-office": "sfo", "vale-of-glamorgan-council": "vale-of-glamorgan", "ministry-of-justice-hmcts": "ministry-of-justice", "welsh-government-cadw": "cadw",
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
    if NOW:   # source lock: fb2 reads the dartboard's own published data first
        try:
            with urllib.request.urlopen(urllib.request.Request("https://dartboard.bucklerfamily.estate/data/roadmap.json", headers={"User-Agent": "Mozilla/5.0 (farmbook build)"}), timeout=60) as r: return json.loads(r.read())
        except Exception as ex: print("dartboard roadmap not read, using the local copy it is published from:", ex)
    for src in ("/home/user/tab/work/roadmap/roadmap.json",):
        if os.path.exists(src): return json.load(open(src, encoding="utf-8"))
    with urllib.request.urlopen("https://dartboard.bucklerfamily.estate/data/roadmap.json", timeout=40) as r: return json.loads(r.read())
R = roadmap()
def badge(sl):
    p = PEO[sl]; t = p["initials"]; fs = 44 if len(t) <= 2 else 32
    open(os.path.join(SITE, p["avatar"]), "w").write(('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%s"/>'
        '<text x="50" y="50" dy=".36em" text-anchor="middle" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif" font-weight="700" font-size="%d" fill="#fff">%s</text></svg>') % (p["color"], fs, e(t)))
for i, L in enumerate(R["lanes"]):
    sl = lane_slug(L)
    if sl in OUT or sl in PEO: continue
    nm = LANE_NAME.get(L["id"], L["name"])
    PEO[sl] = {"name": nm, "kind": {"public": "Body · public authority", "private": "Body · organisation", "representative": "Office · elected representatives", "platform": "Platform"}.get(L.get("kind"), "Body"),
               "entity": True, "initials": initials(nm), "color": COLORS[i % len(COLORS)], "avatar": "img/social/av-%s.svg" % sl,
               "about": LANE_ABOUT.get(L["id"], (L.get("note") or "").strip() + (" Escalation route: %s." % L["ombudsman"] if L.get("ombudsman") else "")).strip()}
    badge(sl)
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
DAILY = json.load(open(dpath, encoding="utf-8"))["days"] if os.path.exists(dpath) and not NOW else []   # fb2: source lock, no narrator cards
for d in DAILY:
    add(id="daily-" + d["date"], date=d["date"], when=dt.date.fromisoformat(d["date"]).strftime("%-d %B %Y"), actor=NARRATOR, kind="Highlight report",
        title=d["title"], daily=d, tags=[r["lane"] and lane_slug({"id": r["lane"]}) for r in d.get("replies", []) if r.get("lane")], rank=0)
# 1b. PRINCE2 highlight-report videos (work/highlight-video/publish_fb.py → data/highlights.json): attached to that day's
#     "Today at Tŷ Mawr" card when there is one, otherwise their own Highlight report card; posted as the family page.
hpath = os.path.join(ROOT, "data", "highlights.json")
HIGH = json.load(open(hpath, encoding="utf-8"))["days"] if os.path.exists(hpath) else []
for hrow in HIGH:
    dx = next((x for x in EV if x.get("daily") and x["date"] == hrow["date"]), None)
    if dx:
        dx["hf"] = hrow; dx["tags"] = ["williams-buckler-family"] + dx["tags"]
    else:
        add(id="hr-" + hrow["date"], date=hrow["date"], when=dt.date.fromisoformat(hrow["date"]).strftime("%-d %B %Y"), actor="williams-buckler-family",
            kind="Highlight report", title=hrow["title"], hf=hrow, src=[("Full report", hrow["report_url"]), ("Video", hrow["video"])], rank=0)
# 2. the press record (social_data posts → their n/ pages)
for p in BS.POSTS:
    body = [x for x in p["body"] if ok(x)][:1]
    add(id=p["id"], date=ymd(p["date"]), when=p["when"], actor=p["outlet"], kind=BS.KIND.get(p["kind"], "Post"), title=p["headline"] if ok(p["headline"]) else "",
        text=body[0] if body else "", link="n/%s.html" % p["id"], src=[(t, BS.link(u)) for t, u in p["source"].get("links", [])][:3], cite=p["source"].get("cite", ""),
        photo=(p.get("photos") or [[None]])[0][0], tags=list(p.get("shares", [])), cm=p.get("comments") or [], rank=3)
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
# Email posts (Sion, 17:18 BST 23 Oct 2026, m:1806dbe2): each email is the sender's own post, first person, summed up, with hashtags
# (#email #to #hywelapbuckler #<body> received; #email #from #hywelapbuckler #to #<body> sent), dated and timed to the email's own sent time
# (Europe/London). No "Reply"/"Re:" labels. Rows: data/email_posts.json, written by tools/email_posts.py (run it before this build).
_epp = os.path.join(ROOT, "data", "email_posts.json")
EPOSTS = json.load(open(_epp, encoding="utf-8"))["posts"] if os.path.exists(_epp) else {}
def htag(name): return "#" + re.sub(r"[^a-z0-9]", "", name.lower())
OWNER_TAG = "#hywelapbuckler"   # the owner's own address handle; Sion asked for it (17:18 BST 23 Oct 2026); allowed only as this hashtag
def email_fields(m, L):
    ep = EPOSTS.get(m["id"]) or {}
    d_ = dt.datetime.fromisoformat(ep["dt"]) if len(ep.get("dt", "")) > 10 else None
    day = d_.date().isoformat() if d_ else m["date"]
    body_tag = htag(LANE_NAME.get(L["id"], L["name"]))
    tags = ["#email", "#to", OWNER_TAG, body_tag] if m["dir"] == "received" else ["#email", "#from", OWNER_TAG, "#to", body_tag]
    summ = (ep.get("summary") or re.sub(r"^In short:\s*", "", m.get("summary", "") or "")).strip()
    return {"date": day, "when": dt.date.fromisoformat(day).strftime("%-d %B %Y"), "at": d_.strftime("%H:%M") if d_ else "", "dtiso": d_.isoformat() if d_ else day,
            "text": summ if ok(summ) else "", "key": ep.get("key", "") if ok(ep.get("key", "")) else "", "hashtags": tags, "email": True}
for L in R["lanes"]:
    sl = lane_slug(L)
    for m in L["emails"]:
        EF = email_fields(m, L)
        when = EF["when"]
        src = [(t, u) for t, u in (("Email", m.get("url")), ("Archived text", m.get("wayback")), (m.get("ev") or "", m.get("ev") and "https://greathousefarmwiki.wordpress.com/?s=" + m["ev"])) if u and t]
        if m["dir"] == "received":
            summ = m.get("summary", "") if ok(m.get("summary", "")) else ""
            add(id="m-" + m["id"], date=EF["date"], when=when, actor=sl, kind="Reply · " + LABEL.get(m["cls"], "Reply"), title="",
                quote=QUOTES.get(m.get("wayback")), lead=("Their words, %s:" % when) if QUOTES.get(m.get("wayback")) else "",
                text=EF["text"], key=EF["key"], hashtags=EF["hashtags"], email=True, at=EF["at"], dtiso=EF["dtiso"], src=src, wall=m["cls"] in KEY_CLS, rank=2)
        else:
            what = {"request": "a request for information", "chase": "a chaser", "clarification given": "a clarification", "complaint": "a complaint",
                    "internal review request": "a request for an internal review", "preservation notice": "a preservation notice"}.get(m.get("cls"), "a letter")
            add(id="m-" + m["id"], date=EF["date"], when=when, actor="williams-buckler-family", kind="Letter sent", title="",
                text=EF["text"] or "The family sent %s to %s." % (what, prof(sl)["name"]), key=EF["key"], hashtags=EF["hashtags"], email=True, at=EF["at"], dtiso=EF["dtiso"],
                src=src[:1], tags=[sl], wall=False, rank=4, what=what)
    for x in L["missed"]:
        if "no reply" not in str(x.get("status", "")): continue
        add(id="miss-%s-%s" % (L["id"], x["date"]), date=x["date"], when=dt.date.fromisoformat(x["date"]).strftime("%-d %B %Y"), actor=sl, kind="Deadline passed",
            title="", text="The statutory deadline passed with no reply%s." % ((" (ref %s)" % x["ref"]) if x.get("ref") else ""),
            src=[("Request", x.get("url"))] if x.get("url") else [], rank=2)

# 5. the root title chain and the transfers (work/infographic/transfers.v2.6.json): each transfer is a life event,
#    "X is now friends with Y", posted by the party that took the land; the 1987 registration and judgment by their makers.
def body_profile(sl, name, kind, about, color, ini=None, wiki=None):
    if sl in OUT or sl in PEO: return
    PEO[sl] = {"name": name, "kind": kind, "entity": True, "initials": ini or initials(name), "color": color, "avatar": "img/social/av-%s.svg" % sl, "about": about}
    if wiki: PEO[sl]["wiki"] = wiki
    badge(sl)
HER = "https://archwilio.org.uk/her/chi3/report/page.php?watprn=GGAT02038s"
body_profile("herbert-family", "The Herbert family", "Family · lords of the manor of Llandough, 16th century",
             "Sir George Herbert of Swansea (d. 1570) held the manor of Llandough by 1545; the Herberts of Cogan Pill after him. The first name in the farm's root title.", "#4a148c", "HF")
body_profile("vaughan-family", "The Vaughan family of the Great House", "Family · the Great House, mid-16th to later 18th century",
             "A minor gentry family who held the Great House, the chief freehold farm of the parish, from the mid-16th century to the later 18th (Heneb HER).", "#5d4037", "VF")
body_profile("hurst-and-jones", "Hurst & Jones", "Holders of the manor by 1767",
             "William Hurst of Gabalva and Calvert Richard Jones of Swansea, holders of the manor of Llandough by 1767.", "#37474f", "HJ")
body_profile("mountjoy", "Mountjoy Ltd", "Body · the remaining Bute property from 1926", "The company that took over the remaining Bute property in Glamorgan from 1926.", "#1b5e20", "ML")
body_profile("sw-brick-tile", "South Western Brick & Tile Co.", "Body · brick and tile works", "The South Western Brick & Tile Company Ltd, a party in the farm's title chain.", "#880e4f", "SWB")
body_profile("cefn-estates", "Cefn Estates", "Body · estate company", "Cefn Estates, a party in the farm's title chain.", "#006064", "CE")
body_profile("bp-pension-trust", "BP Pension Trust", "Body · owner from 1969", "BP Pension Trust (the BP Pension Fund), which took the WGR estate in 1969 before BP Properties Ltd.", "#0d47a1", "BPT")
body_profile("court-of-appeal", "Court of Appeal (Civil Division)", "Institution · Court of Appeal, 1987", "The Court of Appeal heard BP Properties Ltd v Buckler and gave judgment on 31 July 1987 ([1987] EWCA Civ 2).", "#263238", "CA")
if not NOW:
    if "bp" in PEO: PEO["bp"]["name"] = "BP Properties Ltd"
    if "heneb" in PEO: PEO["heneb"]["name"] = "GGAT (Glamorgan-Gwent Archaeological Trust)"
TRJ = "/home/user/tab/work/infographic/transfers.v2.6.json"
TR = json.load(open(TRJ, encoding="utf-8")) if os.path.exists(TRJ) else {"transfers": [], "events": []}
PMAP = {"family": "williams-buckler-family", "swbt": "sw-brick-tile", "wgr": "wgr", "cardiff": "cardiff-corporation", "hurstjones": "hurst-and-jones",
        "cefn": "cefn-estates", "ild": "intercontinental", "law": "land-authority-wales", "sgcc": "south-glamorgan-cc", "bppt": "bp-pension-trust", "bpp": "bp",
        "gold": "goldsworthy-homes", "foc": "forest-of-cardiff", "ideal": "ideal-homes-wales", "persimmon": "persimmon", "owners": "church-view-close",
        "llcc": "llandough-community-council", "thomas": "daniel-thomas-and-son", "vaughan": "vaughan-family", "bute": "bute-estate", "mountjoy": "mountjoy",
        "herbert": "herbert-family"}
def pdate(sv, year):
    sv = str(sv or "").strip()
    for f in ("%d %b %Y", "%d %B %Y", "%b %Y", "%B %Y", "%Y-%m-%d", "%Y"):
        try:
            d = dt.datetime.strptime(sv, f).date(); return d.isoformat(), (d.strftime("%-d %B %Y") if "%d" in f else (d.strftime("%B %Y") if "%b" in f.lower() else str(d.year)))
        except ValueError: pass
    return "%04d-01-01" % int(year), str(year)
VERB_KIND = {"lease": "a lease", "sale": "a sale", "conveyance": "a conveyance", "transfer": "a transfer", "gift": "a gift", "compulsory purchase": "a compulsory purchase"}
for tr in TR.get("transfers", []):
    to, fr = PMAP.get(tr.get("to")), PMAP.get(tr.get("from"))
    if not to or not prof(to) or not tr.get("sources"): continue
    d, when = pdate(tr.get("date"), tr.get("year"))
    txt = fix(tr.get("instrument", "")); txt = txt if ok(txt) else ""
    nt = fix((tr.get("note") or "").split(". ")[0].rstrip(".") + ".") if tr.get("note") else ""
    add(id="tr-" + tr["id"], date=d, when=when, actor=to, kind="Life event · " + (tr.get("label") or "transfer"),
        title=("%s is now friends with %s" % (prof(to)["name"], prof(fr)["name"])) if fr and prof(fr) else "%s joined the story" % prof(to)["name"],
        text=txt, text2=nt if ok(nt) and nt != txt else "", src=[(x["t"], x["u"]) for x in tr["sources"]][:4], tags=[fr] if fr and prof(fr) else [],
        life=True, rank=1)
for ev in TR.get("events", []):
    d, when = pdate(ev.get("date"), ev.get("year"))
    actor, kind, title = {"registration": ("hm-land-registry", "Title updated", "HM Land Registry updated title WA231076"),
                          "court": ("court-of-appeal", "Shared a judgment", "Court of Appeal shared a judgment: BP Properties Ltd v Buckler")}.get(ev.get("kind"), (None, None, None))
    if not actor or not prof(actor): continue
    add(id="ev-" + ev["id"], date=d, when=when, actor=actor, kind=kind, title=title, text=fix(ev.get("text", "")) if ok(ev.get("text", "")) else "",
        src=[(x["t"], x["u"]) for x in ev.get("sources", [])][:3], tags=["bp", "williams-buckler-family"], rank=1)
# 6. forecast (dartboard /data/forecast.json): the next forecast step and the end date per body, on its profile (now edition)
FC = {}
if NOW:
    try:
        with urllib.request.urlopen(urllib.request.Request("https://dartboard.bucklerfamily.estate/data/forecast.json", headers={"User-Agent": "Mozilla/5.0 (farmbook build)"}), timeout=40) as r: _fj = json.loads(r.read())
        for i_ in _fj["institutions"]: FC[lane_slug({"id": i_["id"]})] = i_
    except Exception as ex: print("forecast not read:", ex)
# living people outside the family appear by their role only (Sion's rule): profile names and every visible mention
ROLE = {"paul-r-egan": ("Clerk, Llandough Community Council", ["Paul R. Egan", "Paul R Egan", "Paul Egan", "Mr Egan"]),
        "cllr-george-carroll": ("Vale of Glamorgan councillor", ["Cllr George Carroll", "George Carroll", "Cllr Carroll"]),
        "kanishka-narayan-mp": ("MP for the Vale of Glamorgan", ["Kanishka Narayan MP", "Kanishka Narayan"]),
        "stephen-doughty-mp": ("MP for Cardiff South and Penarth", ["Stephen Doughty MP", "Stephen Doughty"]),
        "alun-michael-mp": ("MP for Cardiff South and Penarth (1988)", ["Alun Michael MP", "Mr Alun Michael", "Alun Michael"]),
        "ted-rowlands-mp": ("MP for Merthyr Tydfil (1980)", ["Ted Rowlands MP", "Mr Ted Rowlands", "Ted Rowlands"]),
        "judge-norman-francis": ("Judge, Cardiff County Court (1988)", ["Judge Norman Francis", "Norman Francis"]),
        "paul-morgan-counsel": ("Counsel for BP Properties (1986–87)", ["Paul Morgan (counsel)", "Mr Paul Morgan", "Paul Morgan"]),
        "j-b-w-mcdonnell-qc-and-m-jarman": ("Counsel for the defence (1986–87)", ["J B W McDonnell QC and M Jarman", "J. B. W. McDonnell QC", "McDonnell QC", "M Jarman"]),
        "mr-knapp": ("The landlords’ agent", ["Mr Knapp"])}
ROLE_SUBS = []
for _sl, (_r, _names) in ROLE.items():
    if prof(_sl): prof(_sl)["name"] = _r
    ROLE_SUBS += [(n, _r) for n in _names]
ROLE_SUBS.sort(key=lambda x: -len(x[0]))
# one date per post (Sion, 03:06 BST 23 Oct 2026: "You have dates twice"): no year in a name, the date lives in the post header only
ROLE_SUBS = [(a, TS.strip_year(b)) for a, b in ROLE_SUBS]
for _p in list(PEO.values()) + list(OUT.values()):
    if isinstance(_p, dict) and _p.get("name"): _p["name"] = TS.strip_year(_p["name"])
if not NOW: TS.add_profiles(PEO, initials, badge); TS.freehold_profiles(PEO, OUT)
def roles(t):
    for a, b in ROLE_SUBS: t = t.replace(a, b)
    return t
MODERN_ONLY = {"tab-bot", "cllr-george-carroll", "paul-r-egan", "kanishka-narayan-mp", "stephen-doughty-mp"}
HIST_ONLY = {"herbert-family", "vaughan-family", "hurst-and-jones", "mountjoy", "sw-brick-tile", "cefn-estates", "bp-pension-trust", "court-of-appeal",
             "the-courts", "high-court-1955", "cardiff-county-court", "house-of-lords", "european-commission-of-human-rights", "glamorgan-county-council",
             "waec-war-agricultural-executive-committee", "south-glamorgan-cc"}
EV = [x for x in EV if x["date"] <= TODAY.isoformat() and prof(x["actor"])]
HAS_MODERN = {sl for x in EV if x["date"][:4] >= SPLIT for sl in [x["actor"]] + list(x["tags"]) if sl}
EV = [x for x in EV if (x["date"][:4] >= SPLIT) == NOW and not (not NOW and x["actor"] == "tab-bot")]
TS.undate(EV)
for x in EV: x["kind"] = re.sub(r"^(Life event) · (?:by |early |c\. )?\d{4}(?:[–-]\d{2,4})?s?\s*", r"\1 · ", x["kind"]).rstrip(" ·")
THEN_LOG, THEN_FOLDED = [], set()
if not NOW: EV, THEN_LOG, THEN_FOLDED = TS.apply_then(EV, prof)   # the 1877–1994 freehold chain, reactions, comment threads, wayback media

# SOURCE LOCK (Sion, 02:18 BST 23 Oct 2026: "use the data and names from email. And dartboard.bucklerfamily.estate subdomains. Only them").
# fb2 keeps only: emails (email.bucklerfamily.estate/reference/<id>) and missed deadlines (dartboard /data/roadmap.json), posted by the
# institution named in that data; profiles = the dartboard's institutions with their names as published; forecast panel from /data/forecast.json.
# One exception, ordered by Sion on Farmbook: the daily PRINCE2 highlight-report video (post + "Today" story).
# Sion, 02:19 BST: "Add me 'Sion Buckler' as the project manager doing the updates" -> PM profile authors the video and the family's sent emails.
PM = "sion-buckler-project-manager"; FAMILY = "williams-buckler-family"
SRC_OK = re.compile(r"^https://(email|dartboard)\.bucklerfamily\.estate/")
DISPLAY = {"serious-fraud-office": "SFO"}   # the house word list bars the middle word of its full name
if NOW:
    DBURL = "https://dartboard.bucklerfamily.estate/"
    FB2 = {}
    for i_, L_ in enumerate(R["lanes"]):
        sl_ = lane_slug(L_); f_ = FC.get(sl_, {})
        nm_ = DISPLAY.get(L_["id"], L_["name"])
        ab_ = " ".join(x_ for x_ in [(L_.get("note") or "").strip(),
                                    ("Escalation: %s." % L_["ombudsman"]) if L_.get("ombudsman") else "",
                                    ("Court: %s." % L_["court"]) if L_.get("court") else "",
                                    ("Correspondence: %d emails (%d sent, %d received)." % (L_["counts"]["emails"], L_["counts"]["sent"], L_["counts"]["received"])) if L_.get("counts") else ""] if x_)
        FB2[sl_] = {"name": nm_, "kind": {"public": "Public body", "private": "Organisation", "representative": "Representative (role)", "platform": "Platform"}.get(L_.get("kind"), "Body") + (" · " + L_["regime"] if L_.get("regime") else ""),
                    "entity": True, "initials": initials(nm_), "color": COLORS[i_ % len(COLORS)], "about": ab_ if ok(ab_) else nm_, "avatar": "img/social/av-fb2-%s.svg" % sl_, "lane": L_["id"]}
    FB2[PM] = {"name": "Sion Buckler, Project Manager", "kind": "Person · project manager", "entity": False, "initials": "SB", "color": "#1b356a",
               "about": "Project manager for the family’s campaign: sends the requests, chasers and complaints in the email archive and posts the daily highlight report. Manages the Williams / Buckler family page.",
               "avatar": "img/social/av-fb2-%s.svg" % PM}
    FB2[FAMILY] = {"name": "Williams / Buckler family", "kind": "Family page · managed by Sion Buckler, Project Manager", "entity": False, "initials": "WB", "color": "#5d4037",
                   "about": "The family’s page, managed by Sion Buckler, Project Manager. It carries the daily highlight report.", "avatar": "img/social/av-fb2-%s.svg" % FAMILY}
    for sl_, p_ in FB2.items():
        t_ = p_["initials"]; fs_ = 44 if len(t_) <= 2 else 32
        open(os.path.join(SITE, p_["avatar"]), "w").write(('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%s"/>'
            '<text x="50" y="50" dy=".36em" text-anchor="middle" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif" font-weight="700" font-size="%d" fill="#fff">%s</text></svg>') % (p_["color"], fs_, e(t_)))
    def prof(sl): return FB2.get(sl)
    FIRST_MAIL = {}
    for L_ in R["lanes"]:
        for m_ in sorted(L_["emails"], key=lambda m: m["date"]):
            if m_.get("cid") and m_.get("url"): FIRST_MAIL.setdefault((L_["id"], m_["cid"]), m_["url"])
    LANE_OF = {lane_slug(L_): L_ for L_ in R["lanes"]}
    _keep = []
    for x in EV:
        if x["id"].startswith("hr-"):          # the one exception (PRINCE2 highlight report video)
            x["actor"] = PM; x["tags"] = [FAMILY]; x["src"] = [(t_, u_) for t_, u_ in x.get("src", [])]; x["exception"] = True; _keep.append(x); continue
        if not (x["id"].startswith("m-") or x["id"].startswith("miss-")): continue
        x["quote"] = None; x["lead"] = ""
        if x["kind"] == "Letter sent":
            to_ = x["tags"][0] if x["tags"] else None
            if not prof(to_): continue
            x["actor"] = PM; x["tags"] = [to_, FAMILY]
            x["text"] = re.sub(r"^The family sent (.*?) to .*?(\s\(deadline [^)]*\))?\.$", lambda m: "Sent %s to %s%s." % (m.group(1), prof(to_)["name"], m.group(2) or ""), x["text"])
        if not prof(x["actor"]): continue
        if x["id"].startswith("miss-"):
            L_ = LANE_OF.get(x["actor"]); mx = next((y for y in L_["missed"] if "miss-%s-%s" % (L_["id"], y["date"]) == x["id"]), {}) if L_ else {}
            u_ = FIRST_MAIL.get((L_["id"], mx.get("cid"))) if L_ else None
            x["src"] = ([("The request (email)", u_)] if u_ else []) + [("The board: " + prof(x["actor"])["name"], DBURL)]
        x["src"] = [(t_, u_) for t_, u_ in x.get("src", []) if u_ and SRC_OK.match(u_)]
        if x["src"]: _keep.append(x)
    EV = _keep
    # MEDIA REGISTER ON fb2 (Sion, 17:52 BST 23 Oct 2026, "Publish all"): fb2 is open to press. Every public media-register item dated 1995 or
    # later (press, journals, blogs, heritage records, notices, YouTube) is a post by its outlet, from data/press_now.json; the article carries
    # data-src="media-register" data-mr="MR-xxxx" and its Source links the item, its Internet Archive copy and the register page. Emails unchanged.
    _pnp = os.path.join(ROOT, "data", "press_now.json")
    if os.path.exists(_pnp):
        PN = json.load(open(_pnp, encoding="utf-8")); _byname = {p_["name"]: sl_ for sl_, p_ in FB2.items()}; _alias = {}
        for i_, (sl_, p_) in enumerate(PN["profiles"].items()):
            if p_["name"] in _byname: _alias[sl_] = _byname[p_["name"]]; continue
            FB2[sl_] = {"name": p_["name"], "kind": p_["kind"] + " · media register", "entity": True, "initials": initials(p_["name"]), "color": COLORS[i_ % len(COLORS)],
                        "about": p_["about"] if ok(p_["about"]) else p_["name"], "avatar": "img/social/av-fb2-%s.svg" % sl_}
            t_ = FB2[sl_]["initials"]; fs_ = 44 if len(t_) <= 2 else 32
            open(os.path.join(SITE, FB2[sl_]["avatar"]), "w").write(('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%s"/>'
                '<text x="50" y="50" dy=".36em" text-anchor="middle" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif" font-weight="700" font-size="%d" fill="#fff">%s</text></svg>') % (FB2[sl_]["color"], fs_, e(t_)))
        for r_ in PN["posts"]:
            x = dict(r_); x["actor"] = _alias.get(r_["actor"], r_["actor"]); x["tags"] = []; x["wall"] = True; x["rank"] = 2; x["press"] = r_["mr"]
            x["lead"] = ""; x["quote"] = None; x["src"] = [tuple(s_) for s_ in r_["src"]]
            if prof(x["actor"]) and r_["date"][:4] >= "1995": EV.append(x)
EV.sort(key=lambda x: (x["date"], -x.get("rank", 3)), reverse=True)
REPLY_DATES = collections.defaultdict(list); LETTERS = collections.defaultdict(list)
for x in sorted(EV, key=lambda x: x["date"]):
    if x["kind"].startswith("Reply"): REPLY_DATES[x["actor"]].append(x["date"])
    if x["kind"] == "Letter sent" and x["tags"]: LETTERS[x["tags"][0]].append(x)
FR = TS.graph(EV, prof) if not NOW else {}
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

# ------------------------------------------------------------------ the social layer (23 Oct 2026): who did what, reactions, receipts, comments
PRESS_VERB = {"Article": "shared a link", "Archive extract": "shared a link", "Announcement": "posted an announcement", "Video": "shared a video",
              "Debate record": "shared a link from the Commons", "Notice": "posted a notice", "Letter to the editor": "shared a letter",
              "Record entry": "added a life event", "Update": "posted an update", "Post": "posted"}
def verb(x, up):
    k = x["kind"]
    if x.get("email"): return ""   # an email is the sender's own post: no "replied:" / "sent a message" label (Sion, 17:18 BST 23 Oct 2026)
    if x.get("life"):
        fr = [t for t in x["tags"] if t and prof(t)]
        return (' <span class="wl-verb">is now friends with</span> <a class="sp-n" href="%su/%s.html">%s</a>' % (up, fr[0], e(prof(fr[0])["name"]))) if fr else ' <span class="wl-verb">joined the story</span>'
    if k == "Letter sent":
        t = [t for t in x["tags"] if t and prof(t)]
        return (' <span class="wl-verb">sent a message to</span> <a class="sp-n" href="%su/%s.html">%s</a>' % (up, t[0], e(prof(t[0])["name"]))) if t else ' <span class="wl-verb">sent a message</span>'
    if k.startswith("Reply"):
        lab = k.split(" · ", 1)[1] if " · " in k else ""
        v = "replied" + ((": " + lab[0].lower() + lab[1:]) if lab and lab != "Reply" else "")
    else:
        v = {"Deadline passed": "left the family on Seen", "Public statement": "posted", "Highlight report": "posted a highlight report",
             "Title updated": "updated a title", "Shared a judgment": "shared a judgment"}.get(k) or PRESS_VERB.get(k, "posted")
    return ' <span class="wl-verb">%s</span>' % e(v)
def cbubble(sl, text, when, up, label=""):
    if not prof(sl): return ""
    return ('<div class="wl-cm"><a href="%su/%s.html" tabindex="-1" aria-hidden="true">%s</a><div class="wl-cb"><a class="wl-cn" href="%su/%s.html">%s</a>%s<p>%s</p>%s</div></div>'
            % (up, sl, avimg(sl, up, 32), up, sl, e(prof(sl)["name"]), (' <span class="wl-cl">%s</span>' % e(label)) if label else "", e(text), ('<span class="wl-cw">%s</span>' % e(when)) if when else ""))
def social_bits(x, up):
    out = []; k = x["kind"]; a = x["actor"]
    rx = [t for t in x["tags"] if t and prof(t) and t != a]
    if x.get("up") or x.get("down"): out.append(TS.reacts_html(x, up, prof))
    elif rx and k not in ("Letter sent", "Deadline passed", "Highlight report"):
        em = "🤝" if x.get("life") else ("⚖️" if k in ("Shared a judgment", "Title updated") else "👍❤️")
        out.append('<div class="wl-rx"><span aria-hidden="true">%s</span> %s%s</div>' % (em, e(prof(rx[0])["name"]), (" and %d other%s" % (len(rx) - 1, "" if len(rx) == 2 else "s")) if len(rx) > 1 else ""))
    cms = []
    for c in x.get("cm") or []:
        who, tx, lab = (c[0], c[1], "") if isinstance(c, (list, tuple)) else (c.get("who"), c.get("text", ""), c.get("label", ""))
        if who and ok(tx): cms.append(cbubble(who, tx, "", up, lab))
    if k == "Letter sent":
        t = x["tags"][0] if x["tags"] else None
        nxt = next((d for d in REPLY_DATES.get(t, []) if d >= x["date"]), None)
        out.append('<p class="wl-seen">%s</p>' % (("Seen ✓ · answered %s" % dt.date.fromisoformat(nxt).strftime("%-d %b %Y")) if nxt else "Delivered · no reply yet"))
    if k == "Deadline passed":
        out.append('<p class="wl-seen wl-seen-r">Seen · no reply by the deadline</p>')
    if k.startswith("Reply"):
        prev = next((l for l in reversed(LETTERS.get(a, [])) if l["date"] <= x["date"]), None)
        if prev: cms.insert(0, cbubble("williams-buckler-family", "Sent %s%s." % (prev.get("what", "a letter"), ""), prev["when"], up, "earlier"))
    if cms: out.append('<div class="wl-cms">%s</div>' % "".join(cms))
    if x.get("rcm"): out.append(TS.comments_html(x, up, prof, avimg))
    return "".join(out)

def card(x, up):
    a = x["actor"]; p = prof(a); pu = "%su/%s.html" % (up, a)
    h = ['<article class="post sp wl" id="%s"><header class="sp-h"><a class="sp-av" href="%s" tabindex="-1" aria-hidden="true">%s</a>'
         '<div class="sp-who"><a class="sp-n" href="%s">%s</a>%s<div class="sp-d"><time datetime="%s">%s</time>%s · %s</div></div></header>'
         % (e(x["id"]), pu, avimg(a, up), pu, e(p["name"]), verb(x, up) + (
            "".join(' <span class="wl-with">with <a href="%su/%s.html">%s</a></span>' % (up, t, e(prof(t)["name"])) for t in x["tags"][:2] if t and prof(t) and t != a and x["kind"] != "Highlight report") if not (x.get("life") or x["kind"] == "Letter sent") else ""),
            e(x.get("dtiso") or x["date"]), e(x["when"]), (" at %s" % e(x["at"])) if x.get("at") else "", "Email" if x.get("email") else e(x["kind"]))]
    if x.get("exception"): h[0] = h[0].replace('<article class="post sp wl" ', '<article class="post sp wl" data-src-exception="highlight-report" ', 1)
    if x.get("press"): h[0] = h[0].replace('<article class="post sp wl" ', '<article class="post sp wl" data-src="media-register" data-mr="%s" ' % e(x["press"]), 1)
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
    elif x.get("hf"):
        h.append('<h2 class="pt sp-t">%s</h2>' % e(x["hf"]["title"]))
    else:
        if x.get("title") and not x.get("life"): h.append('<h2 class="pt sp-t">%s</h2>' % e(fix(x["title"])))
        if x.get("lead"): h.append('<p class="wl-lead">%s</p>' % e(x["lead"]))
        if x.get("quote"): h.append('<blockquote class="wl-q%s">%s</blockquote>' % (" wl-sum" if x.get("summary") else "", ("“%s”" % e(x["quote"])) if not x.get("summary") else e(x["quote"])))
        if x.get("text"): h.append("<p>%s</p>" % e(fix(x["text"])))
        if x.get("key"): h.append('<blockquote class="wl-q wl-key">“%s”</blockquote>' % e(x["key"]))
        if x.get("hashtags"): h.append('<p class="wl-tags">%s</p>' % " ".join('<span class="wl-ht">%s</span>' % e(t_) for t_ in x["hashtags"]))
        if x.get("text2"): h.append('<p class="wl-lead">%s</p>' % e(x["text2"]))
        if x.get("photo") and os.path.exists(os.path.join(SITE, x["photo"])): h.append('<figure class="sp-media"><img src="%s%s" alt="" loading="lazy"></figure>' % (up, e(x["photo"])))
    if not x.get("daily") and not x.get("hf"): h.append(TS.media_html(x, up))
    if x.get("yt"): h.append(yt_html(x))
    if x.get("hf"): h.append(hf_block(x["hf"], up, bool(x.get("daily"))))
    h.append("</div>")
    h.append(social_bits(x, up))
    srcs = x.get("src") or ([("Video", x["daily"]["video"])] if x.get("daily") else [])
    if x.get("link"): srcs = [("Open the post", up + x["link"])] + list(srcs)
    h.append('<details class="sp-src"><summary>Source</summary>%s%s</details>' % (("<p>%s</p>" % e(fix(x["cite"]))) if x.get("cite") else "",
             "<p>" + " · ".join('<a href="%s" rel="noopener">%s</a>' % (e(u), e(t)) for t, u in srcs if u) + "</p>"))
    h.append("</article>")
    return "".join(h)
def yt_html(x):
    """A media-register YouTube item: the youtube-nocookie player loads only on a tap (the site's video pattern); no thumbnail from outside the site."""
    js = ("var f=document.createElement('iframe');f.src='https://www.youtube-nocookie.com/embed/'+this.dataset.yt+'?autoplay=1&amp;rel=0&amp;playsinline=1';"
          "f.allow='autoplay; encrypted-media; picture-in-picture';f.allowFullscreen=true;f.title=this.getAttribute('aria-label');f.loading='lazy';this.replaceWith(f)")
    return ('<figure class="wl-vid mr-yt"><button type="button" class="mr-ytp" data-yt="%s" aria-label="Play: %s" onclick="%s"><span class="mr-play" aria-hidden="true">▶</span>'
            '<span class="mr-ytt">%s</span></button></figure>' % (e(x["yt"]), e(x.get("key") or "Video"), js, e(x.get("key") or "Video")))
def hf_block(r, up, under_daily):
    """The highlight-report video and its post text (the caption): first two lines shown, the rest behind a tap."""
    lines = [l for l in r["caption"].split("\n") if l.strip() and not l.startswith("#") and not l.startswith("Full report:") and not (r["hr_id"] in l and r["period"] in l)]
    lead, rest = lines[:2], lines[2:]
    h = ['<section class="wl-hf" id="hf-%s">' % e(r["date"])]
    if under_daily: h.append('<p class="wl-hf-k">%s · %s</p>' % (e(r["hr_id"]), e(r["period"])))
    h.append('<figure class="wl-vid"><video controls playsinline preload="none" poster="%s%s" src="%s"></video></figure>' % (up, e(r["poster"]), e(r["video"])))
    h.append("".join("<p>%s</p>" % e(l) for l in lead))
    if rest:
        body, ul = [], []
        for l in rest:
            if l.startswith("• "): ul.append("<li>%s</li>" % e(l[2:])); continue
            if ul: body.append("<ul>%s</ul>" % "".join(ul)); ul = []
            body.append("<p><b>%s</b></p>" % e(l) if l.endswith(":") else "<p>%s</p>" % e(l))
        if ul: body.append("<ul>%s</ul>" % "".join(ul))
        h.append('<details class="wl-more"><summary>Read the highlight report</summary>%s<p><a href="%s" rel="noopener">The full report</a></p></details>' % ("".join(body), e(r["report_url"])))
    h.append("</section>")
    return "".join(h)
def years(up):
    ys = sorted({x["date"][:4] for x in EV if x["wall"]}, reverse=True)
    return '<nav class="sb-years wl-years" aria-label="Earlier years">%s</nav>' % "".join('<a href="%swall/%s.html">%s</a>' % (up, y, y) for y in ys)
TAGCSS = """
/* email posts: hashtags (Sion, 17:18 BST 23 Oct 2026) */
.wl-tags{margin:6px 0 2px;display:flex;flex-wrap:wrap;gap:2px 8px;font-size:15px;font-weight:600;color:#1a56c9;overflow-wrap:anywhere}
.wl-key{font-style:italic}
html[data-ghf-mode="night"] .wl-tags{color:#8ab4ff}
@media (prefers-color-scheme:dark){html:not([data-ghf-mode="day"]) .wl-tags{color:#8ab4ff}}
/* media-register YouTube items: tap to play (Sion, 17:52 BST 23 Oct 2026) */
.mr-yt{margin:8px 0 0}.mr-yt iframe{display:block;width:100%;aspect-ratio:16/9;border:0;border-radius:8px;background:#000}
.mr-ytp{display:flex;align-items:center;gap:12px;width:100%;aspect-ratio:16/9;max-height:60vh;padding:14px;border:0;border-radius:8px;background:linear-gradient(135deg,#2E1B6A,#111);color:#fff;font:inherit;text-align:left;cursor:pointer;box-sizing:border-box}
.mr-play{flex:0 0 52px;height:52px;border-radius:50%;background:#FF8A5B;color:#fff;display:flex;align-items:center;justify-content:center;font-size:22px}
.mr-ytt{font-size:15px;font-weight:600;line-height:1.3;overflow-wrap:anywhere}
"""
WALLCSS = """/* wall.css — the hope wall and full profiles (22 Oct 2026). — Sion's Tab agent */
.wl-hero{background:var(--card);padding:14px 14px 10px;margin:0 0 10px}
.wl-hero h1{margin:0;font-size:21px}.wl-hero p{margin:0;color:var(--muted);font-size:14px}
.wl-years{padding:8px 0 2px}
.sp-av img.wf,.pf-av.wf{object-fit:cover}
.wl-with{font-weight:400;color:var(--muted);font-size:14px}.wl-with a{color:var(--ink);font-weight:600;text-decoration:none}
.wl-hf{margin-top:10px}.wl-hf-k{margin:12px 0 0;font-size:.82rem;opacity:.75;text-transform:uppercase;letter-spacing:.04em}.wl-hf ul{margin:4px 0 8px;padding-left:20px}.wl-hf li{margin:2px 0;overflow-wrap:anywhere}.wl-hf p{overflow-wrap:anywhere}
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
.wl-verb{font-weight:400;color:var(--muted);font-size:14px}
.wl-rx{margin:4px 14px 0;font-size:13.5px;color:var(--muted)}
.wl-seen{margin:4px 14px 0;font-size:12.5px;color:var(--muted)}.wl-seen-r{color:#d93025}
.wl-cms{margin:6px 12px 2px}.wl-cm{display:flex;gap:6px;align-items:flex-start;margin:6px 0}.wl-cm img{width:32px;height:32px;border-radius:50%;object-fit:cover;flex:none}
.wl-cb{background:var(--bub);border-radius:16px;padding:6px 12px 7px;min-width:0;max-width:100%}.wl-cb p{margin:2px 0 0;font-size:14.5px;line-height:1.35;overflow-wrap:anywhere}
.wl-cn{font-weight:600;font-size:13px;color:var(--ink);text-decoration:none}.wl-cl,.wl-cw{font-size:11.5px;color:var(--muted)}.wl-cw{display:block;margin-top:2px}
.wl-eras{display:flex;gap:6px;margin:10px 0 2px}.wl-eras a{flex:1;text-align:center;padding:7px 8px;border-radius:18px;background:var(--bub);color:var(--ink);text-decoration:none;font-weight:600;font-size:14px}
.wl-eras a[aria-current]{background:var(--fbb);color:#fff!important}.wl-eras a:not([aria-current]){color:var(--ink)!important}.wl-hero .sb-years{background:transparent!important}
.rgs{display:flex;gap:8px;overflow-x:auto;overscroll-behavior-x:contain;scroll-snap-type:x proximity;padding:12px 12px 12px;margin:0 0 10px;background:var(--card);scrollbar-width:none;-webkit-overflow-scrolling:touch}.rgs::-webkit-scrollbar{display:none}
.sc{flex:none;position:relative;display:block;width:min(120px,calc((100vw - 36px)/3.3));aspect-ratio:110/190;border-radius:12px;overflow:hidden;scroll-snap-align:start;text-decoration:none;color:#fff!important;background:#242526;box-shadow:inset 0 0 0 1px rgba(127,127,127,.18);transition:opacity .2s,filter .2s}
.sc-pv{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;transition:transform .25s}.sc:hover .sc-pv{transform:scale(1.04)}
.sc-t{background:linear-gradient(165deg,var(--sc1) 0%,var(--sc1) 38%,var(--sc2) 135%)}.sc-alt{background:linear-gradient(200deg,var(--sc1) 0%,var(--sc1) 34%,var(--sc2) 140%)}
.sc-tx{position:absolute;left:8px;right:8px;top:52px;bottom:50px;display:flex;flex-direction:column;gap:4px;overflow:hidden}
.sc-tx b{font-size:14px;line-height:1.2;font-weight:800;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.sc-tx span{font-size:11.5px;line-height:1.3;opacity:.86;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.sc::after{content:"";position:absolute;left:0;right:0;bottom:0;height:46%;background:linear-gradient(transparent,rgba(0,0,0,.72));pointer-events:none}
.sc-av{position:absolute;top:8px;left:8px;z-index:2;width:40px;height:40px;border-radius:50%;padding:2px;background:var(--fbb,#1877f2);box-sizing:border-box}
.sc-av img{width:100%;height:100%;border-radius:50%;object-fit:cover;border:2px solid #fff;background:#fff;display:block;box-sizing:border-box}
.sc-nm{position:absolute;left:8px;right:8px;bottom:8px;z-index:2;font-weight:700;font-size:12.5px;line-height:1.2;color:#fff;text-shadow:0 1px 2px rgba(0,0,0,.6);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.sc.rg-seen{opacity:.55;filter:saturate(.6)}.sc.rg-seen .sc-av{background:#8a8d91}
.sc:focus-visible{outline:3px solid var(--fbb,#1877f2);outline-offset:2px}
html.rg-open{overflow:hidden}
.rgv{position:fixed;inset:0;z-index:2147483000;background:#000;color:#fff;display:flex;flex-direction:column;outline:0;touch-action:pan-y}
.rgv-bars{display:flex;gap:3px;padding:8px 8px 0;position:relative;z-index:3}.rgv-bars i{flex:1;height:3px;background:rgba(255,255,255,.35);border-radius:2px;overflow:hidden}.rgv-bars b{display:block;height:100%;width:0;background:#fff}
.rgv-hd{display:flex;align-items:center;gap:8px;padding:8px 10px;position:relative;z-index:3}.rgv-hd img{width:36px;height:36px;border-radius:50%;object-fit:cover;background:#fff}
.rgv-nm{flex:1;min-width:0;display:flex;flex-direction:column;font-size:14px}.rgv-nm span{font-size:12px;opacity:.8}
.rgv-x{width:44px;height:44px;border:0;border-radius:50%;background:rgba(255,255,255,.12);color:#fff;display:grid;place-items:center;cursor:pointer}.rgv-x svg{width:24px;height:24px}
.rgv-st{flex:1;min-height:0;position:relative;display:flex;flex-direction:column;justify-content:center}
.rgv-st img,.rgv-st video{width:100%;flex:1;min-height:0;object-fit:contain;background:#000}
.rgv-txt{background:linear-gradient(160deg,var(--c),#000);padding:0 22px}
.rgv-cap{padding:10px 16px 22px;position:relative;z-index:3;pointer-events:none;background:linear-gradient(transparent,rgba(0,0,0,.75) 30%)}.rgv-txt .rgv-cap{background:none}
.rgv-cap strong{display:block;font-size:17px;line-height:1.3}.rgv-txt .rgv-cap strong{font-size:22px}.rgv-cap p{margin:6px 0 0;font-size:14.5px;line-height:1.4;max-height:30vh;overflow:auto}
.rgv-open{display:inline-block;margin-top:10px;color:#fff;font-weight:600;font-size:14px;padding:6px 12px;border:1px solid rgba(255,255,255,.6);border-radius:16px;text-decoration:none;position:relative;z-index:4;pointer-events:auto}
.rgv-tap{position:absolute;top:110px;bottom:120px;width:40%;border:0;background:transparent;z-index:2;cursor:pointer}.rgv-l{left:0}.rgv-r{right:0;width:60%}
.cast-g{background:var(--card);margin:0 8px 10px;border-radius:8px;padding:6px 14px}.cast-g h2{font-size:13px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);margin:8px 0 4px}
.cast-g .fr-a{display:flex;gap:10px;align-items:center;padding:7px 0;border-bottom:1px solid var(--line);text-decoration:none;color:var(--ink)}.cast-g .fr-a:last-child{border-bottom:0}
.cast-g .fr-a img{width:44px;height:44px;border-radius:50%;object-fit:cover;flex:none}.cast-g .fr-a span{display:flex;flex-direction:column;font-size:12.5px;color:var(--muted);min-width:0}.cast-g .fr-a strong{font-size:15px;color:var(--ink)}
.wl-fc{padding:10px 14px}.wl-fc p{margin:4px 0;font-size:14.5px}
/* night: the family's real dark (black ground), day stays white/light — 23 Oct 2026 */
html[data-ghf-mode="night"]{--bg:#000;--card:#18191a;--ink:#e4e6eb;--muted:#b0b3b8;--line:#3e4042;--bub:#3a3b3c;--fbb2:#263951;color-scheme:dark}
html[data-ghf-mode="night"] .pf-av{border-color:#18191a}
html[data-ghf-mode="night"] .sp-src a,html[data-ghf-mode="night"] .sb-main a:not(.sp-n):not(.wl-cn):not(.fr-a):not(.rg):not(.sc):not(.wl-more-link){color:#8ab4f8}
html[data-ghf-mode="night"] .wl-q{border-color:#d4b25a}
"""

# ------------------------------------------------------------------ editions: stories, cast, links between Then and Now (23 Oct 2026)
def eras(up):
    return ('<nav class="wl-eras" aria-label="Then and now"><a href="%s/"%s>Then · %s</a><a href="%s/"%s>Now · 2005 on</a></nav>'
            % (THEN_URL, "" if NOW else ' aria-current="page"', "to 2004" if NOW else "1877–1994", NOW_URL, ' aria-current="page"' if NOW else ""))
def short(t, n=220):
    t = re.sub(r"\s+", " ", fix(t or "")).strip()
    return t if len(t) <= n else t[:n - 1].rsplit(" ", 1)[0] + "…"
def slide(x, up):
    a = x["actor"]; img = x.get("photo") if x.get("photo") and os.path.exists(os.path.join(SITE, x["photo"])) else None
    t = fix(x.get("title") or "") or (verb(x, up).replace('<span class="wl-verb">', "").replace("</span>", "").strip() if not x.get("life") else "")
    t = re.sub(r"<[^>]+>", "", t).strip()
    tx = x.get("quote") or x.get("text") or ""
    if x.get("hf"):
        return {"by": prof(a)["name"], "d": x["when"], "t": x["hf"]["title"], "x": short(x["hf"]["caption"].split("\n\n", 1)[-1], 200),
                "video": x["hf"]["video"], "poster": up + x["hf"]["poster"], "u": "%sindex.html#%s" % (up, x["id"])}
    # Shorts carry pictures, video and hyperframes only (Sion, 17:18 BST 23 Oct 2026): the slide shows the media with its headline, never body text.
    sl = {"by": prof(a)["name"], "av": up + av(a), "d": x["when"], "t": t if ok(t) and not x.get("email") else "", "x": "", "u": "%su/%s.html#%s" % (up, a, x["id"])}
    v = x.get("video") or {}
    if img: sl["img"] = up + img
    elif x.get("wbimg"): sl["img"] = x["wbimg"]
    if v.get("mp4") and (v.get("poster") or sl.get("img")): sl["video"] = v["mp4"]; sl["poster"] = v.get("poster") or sl["img"]
    return sl
def has_media(x):
    v = x.get("video") or {}
    return bool(x.get("hf") or (x.get("photo") and os.path.exists(os.path.join(SITE, x["photo"]))) or x.get("wbimg") or (v.get("mp4") and (v.get("poster") or x.get("wbimg") or x.get("photo"))))
def ring(rid, name, av_slug, items, up, color=None, cap=8):
    """A story card: its slides are the media posts (photo, wayback picture, mp4, highlight hyperframe) of that group, newest first on fb2.
    Text-only posts and emails never go in a story (Sion, 17:18 BST 23 Oct 2026: "Shorts are for video and images and hyperframes but not raw text");
    a group with no media keeps its card as one picture (its wayback cover from data/story_covers.json, added in rings())."""
    pick = sorted([x for x in items if has_media(x)][:cap], key=lambda x: x["date"], reverse=NOW)
    return {"id": rid, "name": name, "av": up + av(av_slug), "c": color or prof(av_slug).get("color", "#1c2e5c"), "slides": [slide(x, up) for x in pick],
            "u": "%su/%s.html" % (up, av_slug)}
def rings(up):
    R_ = []
    if not NOW:
        A = lambda *sls: [x for x in EV if x["actor"] in sls]
        R_ += [ring("roots", "The roots", "herbert-family", [x for x in EV if x["date"] < "1877-12-31" and (x.get("life") or x["actor"] in ("bute-estate", "cedwyn-estate"))], up),
               ring("bute", "Bute Estate", "bute-estate", A("bute-estate", "mountjoy", "daniel-thomas-and-son"), up),
               ring("family", "The family", "williams-buckler-family", A("mary-williams", "frederick-buckler", "william-buckler", "john-williams-senior", "john-williams-junior", "amy-williams", "esther-williams"), up),
               ring("wgr", "WGR & Cardiff", "wgr", A("wgr", "cardiff-corporation", "glamorgan-county-council"), up),
               ring("bp", "BP", "bp", A("bp", "bp-pension-trust"), up),
               ring("courts", "The courts", "court-of-appeal", A("the-courts", "court-of-appeal", "house-of-lords", "high-court-1955", "cardiff-county-court", "hollis-j-high-court", "dillon-lj", "mustill-lj", "sir-edward-eveleigh", "european-commission-of-human-rights", "hm-land-registry"), up),
               ring("dec-1988", "December 1988", "great-house-farm", [x for x in EV if x["date"][:7] in ("1988-10", "1988-11", "1988-12", "1989-01")], up),
               ring("y1994", "1994: the burial ground", "heneb", [x for x in EV if x["date"][:4] in ("1994", "1995")], up),
               ring("papers", "The papers", "south-wales-echo", [x for x in EV if x["actor"] in OUT and x.get("photo")], up, cap=10)]
    else:
        R_.append(ring("today", "Today", PM, [x for x in EV if x.get("hf")][:3], up, "#1b356a", cap=3))
        top = collections.Counter(x["actor"] for x in EV if x["actor"] not in (PM, FAMILY, NARRATOR, "tab-bot") and x["kind"] != "Letter sent").most_common(12)
        for sl, _ in top:
            R_.append(ring("b-" + sl, prof(sl)["name"], sl, [x for x in EV if x["actor"] == sl and x["kind"] != "Letter sent"][:6], up))
        R_.append(ring("missed", "Missed deadlines", PM, [x for x in EV if x["kind"] == "Deadline passed"][:8], up, "#7f1d1d"))
    R_ = [r for r in R_ if r]
    for r in R_:
        for s_ in r["slides"]:
            for k_ in ("t", "x", "by"): s_[k_] = roles(s_.get(k_, ""))
    # Story covers (Sion, 03:14 BST 23 Oct 2026): every card's first slide and preview is a wayback.bucklerfamily.estate image (data/story_covers.json); "Today" keeps its highlight-video poster.
    COV = json.load(open(os.path.join(ROOT, "data", "story_covers.json"), encoding="utf-8")); ed = "now" if NOW else "then"; pool = COV["pool_" + ed]; pi = 0
    for r in R_:
        s0 = r["slides"][0] if r["slides"] else {}
        if s0.get("video") and s0.get("poster"): continue
        c = COV[ed].get(r["id"])
        if not c: c = pool[pi % len(pool)]; pi += 1
        # the cover is its own picture slide in front (never laid over a post's text)
        r["slides"].insert(0, {"by": r["name"], "av": r["av"], "d": "", "t": c["alt"], "x": "", "u": r["u"], "img": c["img"], "alt": c["alt"]})
    R_ = [r for r in R_ if r["slides"]]
    for r in R_:
        txt = [s_ for s_ in r["slides"] if not (s_.get("img") or s_.get("poster") or s_.get("video"))]
        if txt: raise SystemExit("SHORTS GATE: text-only story slide in %s" % r["id"])
    bad = [r["id"] for r in R_ if not (r["slides"][0].get("img") or r["slides"][0].get("poster"))]
    if bad: raise SystemExit("STORY IMAGE GATE: story cards without an image: " + ", ".join(bad))
    PAIR = ("#2E1B6A", "#FF8A5B") if NOW else ("#6A1B50", "#F55CC2")   # the site's colour pair (palette.md)
    def card_(i, r):
        sl = r["slides"]; pv = sl[0] if (sl[0].get("poster") or sl[0].get("img")) else next((x for x in sl if x.get("poster") or x.get("img")), None)
        lz = "" if i < 4 else ' loading="lazy"'
        if pv:
            bg = '<img class="sc-pv" src="%s" alt="%s"%s>' % (e(pv.get("poster") or pv["img"]), e(pv.get("alt", "")), lz)
        else:
            s0 = sl[0]; t0 = (s0.get("t") or "").strip(); x0 = (s0.get("x") or "").strip()
            if len(t0) < 10 and x0: t0, x0 = re.sub(r"^In short:\s*", "", x0), ""
            x0 = re.sub(r"^In short:\s*", "", x0)
            bg = '<span class="sc-tx"><b>%s</b>%s</span>' % (e(short(t0, 70)), ('<span>%s</span>' % e(short(x0, 90))) if x0 else "")
        return ('<a class="rg sc%s" href="#" data-ring="%s" data-i="%d" aria-label="%s: story">%s<span class="sc-av"><img src="%s" alt="" width="36" height="36"%s></span>'
                '<span class="sc-nm">%s</span></a>' % ("" if pv else " sc-t" + (" sc-alt" if i % 2 else ""), e(r["id"]), i, e(r["name"]), bg, e(r["av"]), lz, e(r["name"])))
    rail = "".join(card_(i, r) for i, r in enumerate(R_))
    return ('<div class="rgs" aria-label="Stories" style="--sc1:%s;--sc2:%s">%s</div><script type="application/json" id="fb-rings-data">%s</script><script src="%sstories.js?v=%s" defer></script>'
            % (PAIR[0], PAIR[1], rail, json.dumps(R_, ensure_ascii=False).replace("</", "<\\/"), up, ver("stories.js")))
CAST_GROUPS = [("Title chain and owners", lambda sl, p: sl in ("herbert-family", "vaughan-family", "hurst-and-jones", "bute-estate", "mountjoy", "daniel-thomas-and-son", "sw-brick-tile", "cefn-estates", "wgr", "bp-pension-trust", "bp", "cardiff-corporation", "intercontinental", "land-authority-wales", "goldsworthy-homes", "ideal-homes-wales", "forest-of-cardiff", "persimmon")),
               ("Courts and the land register", lambda sl, p: any(w in (p.get("kind", "") + p["name"]).lower() for w in ("court", "judge", "justice", " lj", "counsel", "land registry", "house of lords", "commission of human", "tribunal", "ombudsman", "coroner"))),
               ("Councils and public bodies", lambda sl, p: p.get("entity") and sl not in OUT and any(w in (p.get("kind", "") + p["name"]).lower() for w in ("council", "public authority", "government", "office", "ministry", "police", "cadw", "heneb", "ggat", "museum", "archive", "library", "senedd", "parliament", "commission", "department", "agency", "service", "survey", "mp"))),
               ("Press, broadcasters and records", lambda sl, p: sl in OUT),
               ("Family", lambda sl, p: sl in ("williams-buckler-family",) or (not p.get("entity") and "Person" in p.get("kind", "") and any(n in p["name"] for n in ("Williams", "Buckler")))),
               ("Places", lambda sl, p: p.get("kind", "").startswith("Place")),
               ("Everyone else", lambda sl, p: True)]
def cast_page(CAST, rel, title):
    groups = collections.OrderedDict((g, []) for g, _ in CAST_GROUPS); done = set()
    for g, f in CAST_GROUPS:
        for sl in CAST:
            if sl in done: continue
            if f(sl, prof(sl)): groups[g].append(sl); done.add(sl)
    up = ""
    secs = "".join('<section class="cast-g"><h2>%s · %d</h2>%s</section>' % (e(g), len(v), "".join(
        '<a class="fr-a" href="u/%s.html">%s<span><strong>%s</strong>%s</span></a>' % (sl, avimg(sl, up, 44), e(prof(sl)["name"]), e(prof(sl).get("kind", ""))) for sl in v)) for g, v in groups.items() if v)
    desc = ("Everyone in the farm’s story, 1877 to 1994: the title chain, the courts, the councils, the press of the day and the family." if not NOW
            else "Every body in the campaign since 2005: councils, the land register, police, regulators, archives, museums, ministries and offices.")
    write(rel, head("%s · farmbook" % title, desc, rel) + "<body>" + BS.top("people") + '<main id="main" class="sb-main"><h1 class="sb-h1">%s <span class="muted">%d</span></h1>%s%s</main>'
          % (e(title), len(CAST), '<div class="pf-card"><p class="muted">%s</p>%s</div>' % (e(desc), eras("")), secs) + page_end("", "people"))
def fc_panel(sl):
    f = FC.get(sl)
    if not f: return ""
    today = TODAY.isoformat(); nxt = next((r for r in f.get("fc", []) if r[0] >= today), None)
    rn = {r_["n"]: r_["l"] for r_ in f.get("rungs", [])}
    line = ("<p><b>Next step (forecast):</b> %s, %s</p>" % (e(nxt[4]), dt.date.fromisoformat(nxt[0]).strftime("%-d %b %Y"))) if nxt else ""
    return ('<section class="pf-card wl-fc" id="forecast"><p>📍 <b>Checked in at:</b> %s</p>%s<p><b>Every option used up (forecast):</b> %s</p>'
            '<p class="pf-n"><a href="https://dartboard.bucklerfamily.estate/">The board and its forecast</a></p></section>'
            % (e(rn.get(max([t_["rung"] for t_ in f.get("threads", [])] or [1]), "the first rung")), line, dt.date.fromisoformat(f["exhaust"]).strftime("%-d %B %Y") if f.get("exhaust") else "not set"))

def split_static():
    """then build: the hand-made timeline, photos and Facebook pages keep their pre-2005 items on fb; the rest moves to site2 (fb2)."""
    S1, S2 = os.path.join(ROOT, "site"), os.path.join(ROOT, "site2"); os.makedirs(S2, exist_ok=True)
    def keep(t, modern):
        inn = lambda y: (y >= SPLIT) == modern and (modern or y <= "1994")   # fb. ends with 1994 (Sion, 03:06 BST 23 Oct 2026)
        t = re.sub(r'<article class="post" id="p-[^"]*" data-y0="(\d{4})"[\s\S]*?</article>', lambda m: m.group(0) if inn(m.group(1)) else "", t)
        t = re.sub(r'<figure id="ph-\d+" data-y0="(\d{4})"[\s\S]*?</figure>', lambda m: m.group(0) if inn(m.group(1)) else "", t)
        return t
    for f in ("timeline.html", "photos.html"):
        a = os.path.join(S1, f)
        if not os.path.exists(a): continue
        t = open(a, encoding="utf-8").read()
        if re.search(r'data-y0="(199[5-9]|20\d\d)"', t):
            t2 = keep(t, True).replace('href="/"', 'href="%s/"' % NOW_URL) if not os.path.exists(os.path.join(S2, f)) else None
            if t2:
                t2 = re.sub(r"<strong>\d+ posts</strong> from c\. 650 to 2026", "<strong>%d posts</strong> from 2005 to 2026" % len(re.findall(r'<article class="post"', t2)), t2)
                open(os.path.join(S2, f), "w", encoding="utf-8").write(t2)
            t1 = keep(t, False)
            t1 = re.sub(r'<h2 class="era" id="era-20[12]0s">[^<]*</h2>', "", t1)
            t1 = re.sub(r'<a href="#p-20(0[5-9]|[12]\d)[^"]*">[^<]*</a>', "", t1)
            n = len(re.findall(r'<article class="post"', t1))
            t1 = re.sub(r"<strong>\d+ posts</strong> from c\. 650 to 2026", "<strong>%d posts</strong> from c. 650 to 1994" % n, t1)
            open(a, "w", encoding="utf-8").write(t1)
    a = os.path.join(S1, "facebook.html")
    if os.path.exists(a): os.remove(a)   # 'Preserved from Facebook' is retired on both editions (Sion, 02:18 BST 23 Oct 2026); git history keeps it
    for sub, pat in (("n", r"^n-(199[5-9]|200[0-4])"), ("wall", r"^\d{4}\.html$"), ("p", r"^p-(ph-)?(199[5-9]|200[0-4])")):
        dd_ = os.path.join(S1, sub)
        if os.path.isdir(dd_):
            for f in os.listdir(dd_):
                if re.match(pat, f): os.remove(os.path.join(dd_, f))   # 1995–2004 is in neither edition: fb. ends with 1994, fb2. is email./dartboard. only
    pd = os.path.join(S1, "p")
    if os.path.isdir(pd):
        for f in os.listdir(pd):
            if re.match(r"p-(ph-)?20(0[5-9]|[12]\d)", f): os.makedirs(os.path.join(S2, "p"), exist_ok=True); shutil.move(os.path.join(pd, f), os.path.join(S2, "p", f))

def copy_assets():
    """site2 gets the shared CSS/JS and only the images its pages use, copied from site/."""
    src_root = os.path.join(ROOT, "site")
    for f in ("social.css", "social.js", "comments.js", "stories.js", "_headers", "fb.css", "styles.css", "script.js"):
        if os.path.exists(os.path.join(src_root, f)): shutil.copy(os.path.join(src_root, f), os.path.join(SITE, f))
    need = set()
    for root, _, files in os.walk(SITE):
        for f in files:
            if not f.endswith(".html"): continue
            t = open(os.path.join(root, f), encoding="utf-8").read(); rel_dir = os.path.relpath(root, SITE)
            for m in re.finditer(r'(?:src|href|poster)="([^"#?:]+\.(?:webp|jpg|jpeg|png|svg|gif))"', t):
                pth = os.path.normpath(os.path.join(rel_dir, m.group(1)))
                if not pth.startswith(".."): need.add(pth)
            for m in re.finditer(r'"(?:av|img|poster)": "([^"]+)"', t):
                pth = os.path.normpath(os.path.join(rel_dir, m.group(1)))
                if not pth.startswith("..") and not pth.startswith("http"): need.add(pth)
    n = 0
    for pth in need:
        a, b = os.path.join(src_root, pth), os.path.join(SITE, pth)
        if os.path.exists(a) and not os.path.exists(b): os.makedirs(os.path.dirname(b), exist_ok=True); shutil.copy(a, b); n += 1
    return n

def write(rel, s):
    p = os.path.join(SITE, rel); os.makedirs(os.path.dirname(p), exist_ok=True); open(p, "w", encoding="utf-8").write(s)
def page_end(up, active="feed"): return BS.tabs(active, up) + "</body></html>"

def build():
    if NOW: os.makedirs(SITE, exist_ok=True); copy_assets()
    else: split_static()
    write("wall.css", WALLCSS + ("" if NOW else TS.CSS) + TAGCSS)
    # keep the press feed as papers.html
    idx = os.path.join(SITE, "index.html")
    pass   # papers.html (the old press feed) is retired on fb.: it ran to 1995 and the wall carries the press as shared links
    wall = [x for x in EV if x["wall"]]
    first = wall[:45]
    cards = []; lasty = None
    for x in first:
        y = x["date"][:4]
        if y != lasty and lasty is not None: cards.append('<h2 class="wl-yhead">%s</h2>' % y)
        lasty = y; cards.append(card(x, ""))
    nxt = first[-1]["date"][:4] if first else str(TODAY.year)
    if NOW:
        hero = ('<section class="wl-hero"><p>The campaign since 2005, posted by the bodies that acted: requests, replies, refusals, '
                'missed deadlines and the daily highlight report, with the press, heritage and video coverage since 1995, newest first. Every post links to its record.</p>%s%s</section>' % (eras(""), years("")))
    else:
        hero = ('<section class="wl-hero"><p>The freehold title chain, 1877 to 1994, retold as if it all happened on Facebook: each post is by the party '
                'that acted, and each one links to its record.</p>%s%s</section>' % (eras(""), years("")))
    hero = rings("") + hero
    write("index.html", head(("farmbook 2 · Today at Tŷ Mawr" if NOW else "farmbook · Tŷ Mawr, then"), ("The campaign for Great House Farm (Tŷ Mawr), Llandough, since 2005, retold as a social feed: each request, reply, refusal and missed deadline posted by the body that acted, with the daily highlight report." if NOW else "Great House Farm (Tŷ Mawr), Llandough: the freehold title chain 1877–1994, retold as a social feed: the title chain, the courts, the press and the family, each post by the party that acted, each linked to its record."), "index.html")
          + "<body>" + BS.top("feed") + '<main id="main" class="sb-main">' + hero + "".join(cards)
          + '<a class="wl-more-link" href="wall/%s.html">Earlier: %s and before →</a></main>' % (nxt, nxt) + page_end(""))
    ys = sorted({x["date"][:4] for x in wall}, reverse=True)
    wd = os.path.join(SITE, "wall")
    if os.path.isdir(wd):
        for f in os.listdir(wd):
            if f.endswith(".html") and f[:-5] not in ys: os.remove(os.path.join(wd, f))
    for i, y in enumerate(ys):
        items = [x for x in wall if x["date"][:4] == y]
        older = ys[i + 1] if i + 1 < len(ys) else None
        write("wall/%s.html" % y, head("%s · farmbook wall" % y, "Key events of %s on the Great House Farm (Tŷ Mawr) wall, newest first." % y, "wall/%s.html" % y)
              + "<body>" + BS.top("feed", "../") + '<main id="main" class="sb-main"><section class="wl-hero"><p>%s · %d key events, newest first.</p>%s</section>' % (y, len(items), years("../"))
              + "".join(card(x, "../") for x in items)
              + ('<a class="wl-more-link" href="%s.html">Earlier: %s →</a>' % (older, older) if older else '<a class="wl-more-link" href="../index.html">Back to today</a>')
              + "</main>" + page_end("../"))
    # profiles: this edition's cast only
    keep_always = {"williams-buckler-family", NARRATOR} | ({"tab-bot"} if NOW else set())
    CAST = [sl for sl in list(OUT) + list(PEO) if sl in keep_always or BYP.get(sl) or
            (not NOW and not BYP.get(sl) and sl not in MODERN_ONLY and sl not in HAS_MODERN and not prof(sl).get("fictional")) or (NOW and sl in MODERN_ONLY)]
    if NOW: CAST = [PM, FAMILY] + [sl for sl in FB2 if sl not in (PM, FAMILY)]   # source lock: the dartboard's institutions + the project manager
    else: CAST = [sl for sl in CAST if sl not in MODERN_ONLY]
    ud = os.path.join(SITE, "u"); moved = []
    if os.path.isdir(ud):
        for f in os.listdir(ud):
            if f.endswith(".html") and f[:-5] not in CAST: os.remove(os.path.join(ud, f)); moved.append(f[:-5])
    n_prof = 0
    for sl in CAST:
        p = prof(sl); evs = BYP.get(sl, []); up = "../"; n_prof += 1
        cover = ('<figure class="pf-cover"><img src="%s%s" alt=""></figure>' % (up, p["cover"])) if p.get("cover") else ('<figure class="pf-cover pf-cover-t" style="--c:%s"><span>%s</span></figure>' % (p.get("color", "#455a64"), e(p["name"])))
        fk = p.get("face_kind")
        yrs = sorted({x["date"][:4] for x in evs})
        cnt = ("%d post%s · %s" % (len(evs), "" if len(evs) == 1 else "s", (yrs[0] + "–" + yrs[-1]) if len(yrs) > 1 else yrs[0])) if evs else "No posts yet"
        ab = fix(p.get("about", "")); first = re.split(r"(?<=[.!?”])\s+", ab, 1)[0] if ab else ""
        if len(first) > 150: first = first[:147].rsplit(" ", 1)[0] + "…"
        about = '<section class="pf-card wl-about" id="about"><details><summary><b>About</b> %s</summary><p>%s</p>%s%s</details></section>' % (
            e(first), e(ab), ('<p class="pf-n">Portrait: %s.</p>' % e(fk)) if fk else "",
            ('<p class="pf-n"><a href="%s">On the Legal Wiki</a></p>' % e(p["wiki"])) if p.get("wiki") else "")
        stm = [x for x in evs if x["kind"] in ("Public statement",) or x["kind"].startswith("Reply") and x["actor"] == sl and x.get("quote")]
        sec = ('<section id="statements" class="wl-sec-wrap"><h2 class="wl-sec">Their posts, newest first</h2>%s</section>' %
               ("".join(card(x, up) for x in evs) if evs else '<div class="wl-empty"><span class="st"></span>No public statements found yet.</div>'))
        if evs and not stm and not p.get("fictional") and sl not in ("hope-desk", "sion-buckler-project-manager", "williams-buckler-family"): sec = sec.replace('<h2 class="wl-sec">', '<p class="wl-empty" style="margin-bottom:6px">No public statements found yet; the record below involves them.</p><h2 class="wl-sec">', 1)
        if evs: sec = sec.replace('</h2>', '</h2><span class="st" hidden></span>', 1)
        body = ('<main id="main" class="sb-main sb-prof">%s<div class="pf-id"><img class="pf-av%s" src="%s%s" alt="" width="120" height="120"><div><h1>%s</h1><p class="muted">%s</p><p class="pf-counts">%s</p></div></div>'
                '<nav class="pf-tabs"><a class="ln" href="#statements">Posts</a><a class="ln" href="#about">About</a>%s</nav>%s%s%s%s</main>'
                % (cover, " wf" if (p.get("face") or not p.get("entity")) else "", up, av(sl), e(p["name"]), e(p.get("kind", "")), e(cnt + ((" · %d friends" % len(FR.get(sl, ()))) if not NOW else "")),
                   '<a class="ln" href="#friends">Friends</a>' if not NOW else "", about, TS.friends_html(sl, FR, up, prof, avimg) if not NOW else "", fc_panel(sl) if NOW else "", sec))
        write("u/%s.html" % sl, head("%s · farmbook" % p["name"], fix(p.get("about") or p["name"])[:300], "u/%s.html" % sl, av(sl)) + "<body>" + BS.top("people", up) + body + page_end(up, "people"))
    # contacts: the whole cast of this edition, grouped (profiles.html and friends.html)
    cast_page(CAST, "profiles.html", "Contacts")
    cast_page(CAST, "friends.html", "Friends")
    if NOW:
        # the modern press posts' own pages move here from fb (site/n → site2/n)
        # source lock: no press pages, archive photos, family timeline or the old Facebook copy on fb2
        for d_ in ("n", "p"): shutil.rmtree(os.path.join(SITE, d_), ignore_errors=True)
        for f_ in ("facebook.html", "timeline.html", "photos.html"):
            if os.path.exists(os.path.join(SITE, f_)): os.remove(os.path.join(SITE, f_))
        write("404.html", head("Not found · farmbook 2", "This page is not on farmbook 2.", "404.html") + "<body>" + BS.top("feed") + '<main id="main" class="sb-main"><section class="wl-hero"><h1>Not found</h1><p>This page is not on farmbook 2. <a href="/">Back to the wall</a>.</p></section></main>' + page_end(""))
        vids = [dict(s_, by=PM) for s_ in BS.STORIES if s_["id"].startswith("s-hr-")]   # the highlight-report videos only (the exception)
        vc = "".join('<article class="post sp wl" id="v-%s" data-src-exception="highlight-report"><header class="sp-h"><span class="sp-av">%s</span><div class="sp-who"><a class="sp-n" href="u/%s.html">%s</a> <span class="wl-verb">shared a video</span><div class="sp-d">%s</div></div></header>'
                     '<div class="sp-b"><h2 class="pt sp-t">%s</h2><figure class="wl-vid"><video controls playsinline preload="metadata" poster="%s" src="%s"></video></figure></div>'
                     '<details class="sp-src"><summary>Source</summary><p>%s</p></details></article>'
                     % (e(v_["id"]), avimg(v_["by"], "", 40), v_["by"], e(prof(v_["by"])["name"]), e(v_.get("credit", "")[:80]), e(v_["title"]), e(v_["thumb"]), e(v_["src"]), e(v_.get("credit", "")))
                     for v_ in vids if v_.get("kind") == "video" and v_.get("src"))
        vc = re.sub(r'id="v-(s-hr-[^"]+)"', r'id="v-\1" data-story="\1"', vc)   # verify_fb.js finds the day's card by data-story
        # tapping a video card opens it full-screen in social.js's story player, which reads #fb-stories-data
        vdata = [{"id": v_["id"], "by": prof(v_["by"])["name"], "av": prof(v_["by"])["avatar"], "title": v_["title"], "kind": "video", "src": v_["src"], "thumb": v_["thumb"],
                  "seconds": v_.get("seconds"), "credit": v_.get("credit", ""), "link": "index.html#hf-" + v_["id"][5:]} for v_ in vids if v_.get("kind") == "video" and v_.get("src")]
        vc += '<script type="application/json" id="fb-stories-data">%s</script>' % json.dumps(vdata, ensure_ascii=False).replace("</", "<\\/")
        write("videos.html", head("Videos · farmbook 2", "The daily highlight-report videos, posted by the project manager.", "videos.html")
              + "<body>" + BS.top("video") + '<main id="main" class="sb-main"><h1 class="sb-h1">Videos</h1>' + vc + "</main>" + page_end("", "video"))
    else:
        # anything that moved to the now edition answers with a redirect to fb2
        rd = os.path.join(SITE, "_redirects"); old = open(rd, encoding="utf-8").read() if os.path.exists(rd) else ""
        old = re.sub(r"\n# fb2 moves \(generated\)[\s\S]*?# end fb2 moves\n", "\n", old)
        lines = ["/u/%s.html %s/u/%s.html 301" % (m, NOW_URL, m) for m in sorted(set(moved) | MODERN_ONLY)]
        lines += ["/wall/%d.html %s/wall/%d.html 301" % (y_, NOW_URL, y_) for y_ in range(2005, TODAY.year + 1)]
        lines += ["/n/%s* %s/n/%s:splat 301" % (pre, NOW_URL, pre) for pre in ("n-20", "d-20", "r-20")]
        lines += ["/p/p-20* %s/p/p-20:splat 301" % NOW_URL]
        open(rd, "w", encoding="utf-8").write(old.rstrip("\n") + "\n# fb2 moves (generated)\n" + "\n".join(lines) + "\n# end fb2 moves\n")
        for f in os.listdir(os.path.join(SITE, "n")):
            if re.match(r"[ndr]-20[0-9][0-9]", f) and f[2:6] >= SPLIT: os.remove(os.path.join(SITE, "n", f))
    for root, _, files in os.walk(SITE):
        for f in files:
            if f.endswith(".html"):
                fp = os.path.join(root, f); t = open(fp, encoding="utf-8").read(); t2 = t.replace("ghf-boot.js?v=2.0.3", "ghf-boot.js?v=2.1.2")
                if t2 != t: open(fp, "w", encoding="utf-8").write(t2)
    # living people outside the family by role only, on every page we write
    for root, _, files in os.walk(SITE):
        for f in files:
            if f.endswith(".html"):
                fp = os.path.join(root, f); t = open(fp, encoding="utf-8").read(); t2 = roles(t)
                if t2 != t: open(fp, "w", encoding="utf-8").write(t2)
    if NOW:
        print("site2 images copied:", copy_assets())
        # source lock: images no fb2 page uses any more (old portraits, archive photos) leave site2
        need = set(); gone = 0
        for root, _, files in os.walk(SITE):
            for f in files:
                if f.endswith((".html", ".js", ".css", ".json")):
                    t = open(os.path.join(root, f), encoding="utf-8", errors="ignore").read(); rel_dir = os.path.relpath(root, SITE)
                    for m in re.finditer(r'([\w./-]+\.(?:webp|jpg|jpeg|png|svg|gif))', t):
                        need.add(os.path.normpath(os.path.join(rel_dir, m.group(1).lstrip("/")))); need.add(os.path.normpath(m.group(1).lstrip("/")))
        for d_ in ("img", "daily"):
            for root, _, files in os.walk(os.path.join(SITE, d_)):
                for f in files:
                    rp = os.path.relpath(os.path.join(root, f), SITE)
                    if rp not in need: os.remove(os.path.join(root, f)); gone += 1
        print("site2 unused images removed:", gone)
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
    if not NOW:   # living family by role only on fb.: the 1988 cutting's names of the living become their roles; the superseded press feed (unlinked, ran to 1995) goes
        for root, _, files in os.walk(SITE):
            for f in files:
                if not f.endswith(".html"): continue
                fp = os.path.join(root, f); t = open(fp, encoding="utf-8").read()
                t2 = re.sub(r"his wife Branwen and their three children Hywel, Rhys and Amy", "his wife and their three children", t)
                if t2 != t: open(fp, "w", encoding="utf-8").write(t2)
        if os.path.exists(os.path.join(SITE, "papers.html")): os.remove(os.path.join(SITE, "papers.html"))
    dd = TS.check(SITE)   # one date per post, no year in a name (both editions)
    if dd: raise SystemExit("DATE GATE: " + json.dumps(dd[:12], ensure_ascii=False))
    if not NOW:
        json.dump({"schema": "fb friends v1", "edges": sorted([a, b] for a in FR for b in FR[a] if a < b), "left_out": THEN_LOG, "folded_into_comments": sorted(THEN_FOLDED)},
                  open(os.path.join(SITE, "api", "graph.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=0)
    print("wall built: %d events (%d on the wall, %d daily reports), %d profiles, %d with faces, years %s" % (len(EV), len(wall), len(DAILY), n_prof, sum(1 for s in FACES if prof(s)), ",".join(ys[:3]) + "…"))

if __name__ == "__main__":
    build()
