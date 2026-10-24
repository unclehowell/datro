#!/usr/bin/env python3
"""publishers.py — the farmbook AUTHORSHIP RULE, applied on every build of fb. and fb2. (Sion, WhatsApp 17:00 BST 24 Oct 2026:
"If the mp actually said something then have his profile post it. If the newspaper published something have them post it. Other
profiles should share or tag if it concerns them.").
A post's author is the party that published, said or sent the item: an email by its sender (data/email_senders.json, the archived
From header), an article by its newspaper, a speech by the MP, a judgment by the court. Everyone else is @mentioned or shares.
data/publishers.json holds the sender rules, the per-post corrections and the new profiles; validate() fails the build when an
institution authors an item whose source is not theirs. — Sion's Tab agent"""
import json, os, re, importlib.util
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = json.load(open(os.path.join(ROOT, "data", "publishers.json"), encoding="utf-8"))
_s = importlib.util.spec_from_file_location("email_senders", os.path.join(ROOT, "tools", "email_senders.py"))
ES = importlib.util.module_from_spec(_s); _s.loader.exec_module(ES)
S = {}
STATS = {"reauthored": 0, "mentions": 0, "shares": 0, "profiles_created": 0, "by_rule": {}}
NEWS_KIND = re.compile(P["newspaper_kinds"])
JOURNAL_HOST = re.compile(P["journal_hosts"], re.I)
EXEMPT_KIND = re.compile(r"^(Life event|Record entry|Title updated|Letter sent|Highlight report|Deadline passed|Share)")

def setup_now(FB2, make_avatar, lanes, lane_slug):
    """fb2: real names for the MP lanes and the platform, the new publisher profiles; call before any post text is written."""
    for sl, nm in P["display_now"].items():
        if sl in FB2:
            FB2[sl]["name"] = nm; FB2[sl]["initials"] = _ini(nm)
            if sl in P.get("about_now", {}): FB2[sl]["about"] = P["about_now"][sl]
            make_avatar(sl)
    for sl, spec in P["profiles_now"].items():
        if sl in FB2: continue
        FB2[sl] = {"name": spec["name"], "kind": spec["kind"], "entity": not spec["kind"].startswith("Person"), "initials": _ini(spec["name"]),
                   "color": "#455a64", "about": spec["about"], "avatar": "img/social/av-fb2-%s.svg" % sl, "publisher": True}
        make_avatar(sl); STATS["profiles_created"] += 1
    global S
    S = ES.ensure([(m["id"], L["id"]) for L in lanes for m in L["emails"] if m["dir"] == "received"])

def setup_then(body_profile):
    for sl, spec in P["profiles_then"].items():
        body_profile(sl, spec["name"], spec["kind"], spec["about"], "#455a64"); STATS["profiles_created"] += 1

def _ini(name):
    w = [x for x in re.split(r"[\s/()\-–—,.]+", name) if x and x[0].isalnum() and x.lower() not in ("of", "and", "the", "for", "in")]
    return ("".join(x[0] for x in w[:3]) or name[:2]).upper()

def sender_author(mid):
    s = S.get(mid)
    if not s: return None, None
    for r in P["sender_rules"]:
        if re.search(r["from"], s.get("From", ""), re.I) and (not r.get("institution") or r["institution"] in s.get("Institution", "")):
            return r["author"], r["why"]
    return None, None

def _key(x, table):
    for k, v in table.items():
        if x["id"] == k or x["id"].startswith(k + "-") or x["id"].startswith(k): return v
    return None

def apply(EV, prof, now):
    """Re-author every post to its true publisher; the old author becomes an @mention (and, for a person, a share)."""
    if os.environ.get("FB_AUTHORSHIP_SKIP_APPLY"): return EV   # test hook: proves validate() catches the old authorship
    table = P["posts_now" if now else "posts_then"]; arch = P["archive_profile"]["now" if now else "then"]; extra = []
    for x in EV:
        x.setdefault("tags", []); old = x["actor"]; new = None; why = None; spec = None
        if now and x["id"].startswith("m-gm-") and x["kind"].startswith("Reply"):
            new, why = sender_author(x["id"][2:])
            if new: spec = {"mentions": [old]}
        if not new:
            spec = _key(x, table)
            if spec: new = arch if spec["author"] == "archive" else spec["author"]; why = spec["why"]
        if not new or not prof(new): continue
        if new != old:
            x["actor"] = new; x["lane_actor"] = old; x["why"] = why; STATS["reauthored"] += 1
            STATS["by_rule"][why] = STATS["by_rule"].get(why, 0) + 1
        ments = [m for m in (spec.get("mentions") or []) if prof(m) and m != new]
        if ments:
            x["mentions"] = ments; STATS["mentions"] += len(ments)
            x["tags"] = ments + [t for t in x["tags"] if t not in ments and t != new]
        for a, b in spec.get("text_sub", []):
            if x.get("text"): x["text"] = re.sub(a, b, x["text"])
        if spec.get("verb"): x["verb"] = spec["verb"]
        if spec.get("kind"): x["kind"] = spec["kind"]
        if spec.get("lead"): x["lead"] = spec["lead"]
        for sh in spec.get("share_by", []):
            if not prof(sh): continue
            extra.append({"id": "sh-%s-%s" % (x["id"], sh), "date": x["date"], "when": x["when"], "actor": sh, "kind": "Share", "title": "",
                          "text": "", "shared": x["id"], "shared_author": new, "tags": [new], "wall": x.get("wall", True), "rank": x.get("rank", 3) + 1,
                          "src": list(x.get("src") or []), "shared_title": x.get("title") or x.get("quote") or x.get("text") or ""})
            STATS["shares"] += 1
    EV.extend(extra)
    return EV

def validate(EV, prof, now, profiles):
    """Fail the build if an institution authors an item whose source is not theirs."""
    news = {p["name"]: sl for sl, p in profiles.items() if NEWS_KIND.search(p.get("kind", "") or "")}
    def institution(sl):
        p = prof(sl) or {}
        return bool(p.get("entity")) and not NEWS_KIND.search(p.get("kind", "") or "") and "Platform" not in (p.get("kind") or "") and not sl.startswith("mr-")
    bad = []; unknown = 0
    for x in EV:
        if x.get("shared"): continue
        a = x["actor"]; srcs = x.get("src") or []
        if now and x["id"].startswith("m-gm-") and x["kind"].startswith("Reply"):
            s = S.get(x["id"][2:])
            if not s: unknown += 1
            else:
                exp, _ = sender_author(x["id"][2:]); lane = x.get("lane_actor", a)
                if (exp or lane) != a: bad.append((x["id"], "email sent by %r posted by %s" % (s.get("From"), a)))
        if x.get("press") and (prof(a) or {}).get("lane") and (prof(a) or {}).get("name") != x.get("press_outlet"): bad.append((x["id"], "media-register item posted by institution %s" % a))
        if institution(a) and not EXEMPT_KIND.search(x.get("kind", "")) and not x.get("life"):
            st = " ".join(str(t) for t, u in srcs)
            for nm in news:
                if nm and len(nm) > 5 and nm in st and nm != (prof(a) or {}).get("name"):
                    bad.append((x["id"], "%s item (source names %s) posted by institution %s" % (x.get("kind"), nm, a))); break
            if any(JOURNAL_HOST.search(str(u or "")) for t, u in srcs): bad.append((x["id"], "journal item posted by institution %s" % a))
    if unknown: print("authorship check: %d email posts with no archived sender header yet (posted by the thread's body)" % unknown)
    if bad:
        for b in bad[:12]: print("AUTHORSHIP RULE BROKEN:", b[0], "-", b[1])
        raise SystemExit("authorship check failed: %d posts authored by a party that did not publish them (data/publishers.json)" % len(bad))
    print("authorship check: OK (%d posts; %d re-authored to their publisher, %d @mentions, %d shares, %d new publisher profiles)"
          % (len(EV), STATS["reauthored"], STATS["mentions"], STATS["shares"], STATS["profiles_created"]))

def write_redirects(site, now):
    """fb2: old profile URLs of re-authored or merged profiles answer with a 301 to the profile that now carries the posts."""
    if not now or not P.get("redirects_now"): return
    open(os.path.join(site, "_redirects"), "w", encoding="utf-8").write("# publisher profiles merged by the authorship rule (24 Oct 2026)\n" + "".join("%s %s 301\n" % kv for kv in P["redirects_now"].items()))
