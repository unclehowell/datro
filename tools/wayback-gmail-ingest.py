#!/usr/bin/env python3
"""
Wayback case-mail ingest: one clean, redacted plain-text file per case email, plus a static
JSON API, written under wayback/ (served by the "wayback" Cloudflare Pages project).

Input: a JSON list (or {id: message} map) of Gmail messages, each with
  id (Gmail message id), thread (Gmail thread id), ts (ISO UTC), sent (bool),
  orgs (institution ids), subject, sender ("Name <addr>"), text (plain body), refs (list).
Messages flagged incase == False are skipped (not verified as case correspondence).

Output (all paths relative to the wayback/ directory):
  mail/<id>.txt              redacted text with a short header
  api/message/<id>.json      the same record + text, as JSON
  api/index.json             every record (no text), newest first
  api/threads.json           records grouped by Gmail thread
  api/corpus.json            lists api/corpus-N.json shards holding every redacted text (id -> text), for full-text search
Ids are "gm-" + the Gmail message id, so re-running is idempotent: an existing id is rewritten
in place (same content -> same bytes), new mail is added, nothing is deleted.

Privacy: email addresses, phone numbers, the family's private address, residential street
addresses (e.g. in signatures), postcodes and meeting joining
details (video-call links, meeting IDs, passcodes) are
redacted in everything published. Officials keep their names; addresses never leave Gmail.
Usage: python3 gmail_ingest.py messages.json path/to/wayback [--generated 2026-10-19T00:00:00Z]
"""
import json, os, re, sys, unicodedata
from collections import Counter, defaultdict
from email.utils import parseaddr
from datetime import datetime

INSTITUTIONS = {
  # added 21 Oct 2026 (email-site sync, Sion's Tab agent)
  "ads": "Archaeology Data Service",
  "audit-wales": "Audit Wales",
  "blake-morgan": "Blake Morgan LLP",
  "bona-vacantia": "Government Legal Department (Bona Vacantia)",
  "bt-archives": "BT Archives",
  "cardiff": "Cardiff Council",
  "church-of-england": "Church of England archives (Lambeth Palace Library)",
  "defra": "Defra",
  "historic-england": "Historic England",
  "lga": "Local Government Association / WLGA",
  "mount-stuart": "Mount Stuart (Bute archive)",
  "natural-england": "Natural England",
  "nrw": "Natural Resources Wales",
  "penarth-tc": "Penarth Town Council",
  "voa": "Valuation Office Agency / HMRC",
  "hmlr": "HM Land Registry", "hmlr-icr": "HM Land Registry (Independent Complaints Reviewer)",
  "vale-foi": "Vale of Glamorgan Council", "vale-scrutiny": "Vale of Glamorgan Council (Scrutiny)",
  "llandough": "Llandough Community Council", "cadw": "Welsh Government / Cadw",
  "moj": "Ministry of Justice / HMCTS", "swp": "South Wales Police", "cps": "Crown Prosecution Service",
  "tna": "The National Archives", "glamorgan": "Glamorgan Archives", "museum": "Amgueddfa Cymru - Museum Wales",
  "nlw": "National Library of Wales", "rcahmw": "RCAHMW (Royal Commission)", "dwrcymru": "Dwr Cymru Welsh Water",
  "heneb": "Heneb (formerly GGAT) / Historic Environment Record", "bp": "BP", "persimmon": "Persimmon Homes",
  "mod": "Ministry of Defence", "nactso": "Counter Terrorism Policing (NaCTSO)", "wales-office": "Wales Office",
  "nio": "Northern Ireland Office", "pmo": "Prime Minister's Office / Cabinet Office", "os": "Ordnance Survey",
  "nhs-cav": "Cardiff and Vale University Health Board", "rct": "Coroner's Service (RCT Council)",
  "cardiff-reg": "Cardiff / Vale Register Office", "tfw": "Transport for Wales", "itv": "ITV Archive",
  "linklaters": "Linklaters", "cotswold": "Cotswold Archaeology", "postal-museum": "The Postal Museum",
  "mp": "Member of Parliament", "mp-vale": "Member of Parliament (Vale of Glamorgan)", "senedd": "Senedd",
  "pacac": "Public Administration and Constitutional Affairs Committee", "phso": "Parliamentary and Health Service Ombudsman",
  "psow": "Public Services Ombudsman for Wales", "ico": "Information Commissioner's Office",
  "legal-regulators": "Legal regulators", "wdtk?": "WhatDoTheyKnow (unconfirmed)",
}

EMAIL_RE = re.compile(r"[A-Za-z0-9._%+\-]+[ \t*]{0,3}@[ \t*]{0,3}[A-Za-z0-9\-]+(?:\.[A-Za-z0-9\-]+)*\.[A-Za-z]{2,}")
MAILTO_RE = re.compile(r"mailto:[^\s>\]]+", re.I)
PHONE_CAND = re.compile(r"(?<![\w/])(\+?\(?\d(?:[\d()\-]|[ \t]{1,3}(?=[\d(+])|\.(?=\d))*\d)(?!\w)")
MAPS_RE = re.compile(r"<?https?://(?:www\.)?google\.[a-z.]+/maps/search/[^\s>]*>?", re.I)
ADDR_RE = re.compile(r"(?:\b\d+\s*)?Robin[\s+]+Hill\b", re.I)
# Residential street addresses count as home addresses and never go public (21 Oct 2026): the
# clerk's signature carries one. The street, its number and the town line after it (across quote
# markers, blank lines and stripped map links) become "[address removed]".
RES_ADDR_RE = re.compile(r"(?<!\d)(?:\d{1,4}[ \t]*)?Woodham[\s+]+Park\b(?:(?:\s|>|,|\[\d+\]|\[map link redacted\])*Barry\b,?)?", re.I)
PCODE_RE = re.compile(r"\b(?:[A-Z]{1,2}\d[A-Z\d]?)\s*\d[A-Z]{2}\b")

def is_phone(s):
    d = re.sub(r"\D", "", s); st = s.lstrip("(")
    if st.startswith("+"):
        return (d.startswith("44") and 11 <= len(d) <= 14) or (not d.startswith("44") and 10 <= len(d) <= 15)
    if d.startswith("0") and not d.startswith("00"):
        return 10 <= len(d) <= 11 and not re.search(r"\d{4}-\d{2}-\d{2}", s)
    return False

MEET_REPL = "[meeting joining details removed — available from the Clerk]"
# Meeting joining details (video-call links, meeting IDs, passcodes, one-tap dial strings) never
# go public: anyone holding them could join or disrupt a council meeting (21 Oct 2026).
MEET_BLOCK_RE = re.compile(r"^((?:>[ \t]?)*)[ \t]*Topic:[^\n]*\n(?:.*\n){0,40}?.*zoom\.us/meetings/\S*[^\n]*$", re.M | re.I)
MEET_URL_RE = re.compile(r"<?https?://(?:[\w-]+\.)*(?:zoom\.us|zoom\.com|zoomgov\.com|meet\.google\.com|teams\.microsoft\.com/l/meetup-join|teams\.live\.com/meet|[\w-]+\.webex\.com)/[^\s>]*>?", re.I)
MEET_LINE_RE = re.compile(r"(?im)^((?:>[ \t]?)*)[ \t]*(?:Meeting ID|Webinar ID|Conference ID|Passcode|Password|Pass code|PIN)\s*[:#][^\n]*$")
MEET_DIAL_RE = re.compile(r"[^\n]*,,\d{6,}#[^\n]*")

def redact_meeting(t, c):
    t, n1 = MEET_BLOCK_RE.subn(lambda m: m.group(1) + MEET_REPL, t)
    t, n2 = MEET_URL_RE.subn(MEET_REPL, t)
    t, n3 = MEET_LINE_RE.subn(lambda m: m.group(1) + MEET_REPL, t)
    t, n4 = MEET_DIAL_RE.subn(MEET_REPL, t)
    c["meeting"] += n1 + n2 + n3 + n4
    return t

def redact(t, c):
    t = redact_meeting(t, c)
    t = MAILTO_RE.sub(lambda m: (c.update(["email"]) or "[email redacted]"), t)
    t = EMAIL_RE.sub(lambda m: (c.update(["email"]) or "[email redacted]"), t)
    def ph(m):
        if is_phone(m.group(1)):
            c["phone"] += 1; return "[phone redacted]"
        return m.group(1)
    t = PHONE_CAND.sub(ph, t)
    t, n = MAPS_RE.subn("[map link redacted]", t); c["address"] += n
    t, n = ADDR_RE.subn("[address redacted]", t); c["address"] += n
    t, n = RES_ADDR_RE.subn("[address removed]", t); c["address"] += n
    t, n = PCODE_RE.subn("[postcode redacted]", t); c["postcode"] += n
    return t

def sender_name(s, sent):
    if sent: return "Sion Buckler"
    nm, addr = parseaddr(s or "")
    nm = nm.strip().strip('"')
    if nm and "@" not in nm: return nm
    dom = addr.split("@")[-1].lower() if "@" in addr else ""
    return "(name not shown; %s)" % dom if dom and not dom.endswith(("gmail.com", "hotmail.com", "outlook.com", "yahoo.com", "icloud.com")) else "(name not shown)"

def slug(s, n=80):
    s = unicodedata.normalize("NFKD", s or "").encode("ascii", "ignore").decode().lower()
    s = re.sub(r"^\s*((re|fw|fwd|aw)\s*:\s*|\[external\]\s*|allanol/external\s*-\s*)+", "", s)
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")[:n].strip("-") or "no-subject"

def write_if_changed(path, data):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    b = data.encode("utf-8")
    if os.path.exists(path) and open(path, "rb").read() == b: return False
    open(path, "wb").write(b); return True

def main(src, root, generated):
    raw = json.load(open(src))
    msgs = list(raw.values()) if isinstance(raw, dict) else raw
    c = Counter(); written = Counter(); skipped = Counter()
    idx_path = os.path.join(root, "api", "index.json")
    old = {}
    if os.path.exists(idx_path):
        for r in json.load(open(idx_path)).get("records", []): old[r["id"]] = r
    recs = dict(old)
    for m in msgs:
        if m.get("incase") is False: skipped["not_verified_case"] += 1; continue
        if not (m.get("text") or "").strip(): skipped["empty"] += 1; continue
        rid = "gm-" + m["id"]
        ts = m.get("ts") or ""
        orgs = [o for o in (m.get("orgs") or []) if o]
        subj = redact(m.get("subject") or "", c)
        body = redact((m.get("text") or "").replace("\r\n", "\n").strip(), c)
        direction = "sent" if m.get("sent") else "received"
        inst = [{"id": o, "name": INSTITUTIONS.get(o, o)} for o in orgs]
        refs = [redact(str(x), c) for x in (m.get("refs") or [])]
        try: shown = datetime.strptime(ts, "%Y-%m-%dT%H:%M:%SZ").strftime("%a, %d %b %Y %H:%M UTC")
        except Exception: shown = ts or "date not recorded"
        rec = {
          "id": rid, "gmailMessageId": m["id"], "threadId": "gt-" + str(m.get("thread") or m["id"]),
          "date": ts or None, "direction": direction,
          "from": sender_name(m.get("sender"), m.get("sent")),
          "institutions": inst, "subject": subj, "threadSlug": slug(subj), "refs": refs,
          "textUrl": "/mail/%s.txt" % rid, "jsonUrl": "/api/message/%s.json" % rid,
          "source": "Original email in the family's Gmail (read-only export); contact details redacted.",
        }
        header = ("Subject: %s\nFrom: %s\nDirection: %s\nDate: %s\nInstitution: %s\nRefs: %s\nArchive id: %s\n" % (
          subj, rec["from"], direction, shown, "; ".join(i["name"] for i in inst) or "not classified",
          ", ".join(refs) or "none", rid)) + "-" * 60 + "\n\n"
        written["txt"] += write_if_changed(os.path.join(root, "mail", rid + ".txt"), header + body + "\n")
        written["json"] += write_if_changed(os.path.join(root, "api", "message", rid + ".json"),
                                            json.dumps(dict(rec, text=body), ensure_ascii=False, indent=1) + "\n")
        recs[rid] = rec
    ordered = sorted(recs.values(), key=lambda r: (r.get("date") or "", r["id"]), reverse=True)
    threads = defaultdict(list)
    for r in ordered: threads[r["threadId"]].append(r["id"])
    tlist = []
    for tid, ids in threads.items():
        rs = [recs[i] for i in ids]
        tlist.append({"threadId": tid, "subject": rs[-1]["subject"], "threadSlug": rs[-1]["threadSlug"],
                      "institutions": sorted({i["id"] for r in rs for i in r["institutions"]}),
                      "first": rs[-1]["date"], "last": rs[0]["date"], "count": len(rs), "messageIds": list(reversed(ids))})
    tlist.sort(key=lambda t: t["last"] or "", reverse=True)
    meta = {"title": "Great House Farm / Ty Mawr case correspondence (Wayback)", "apiVersion": "1.0.0",
            "generated": generated, "count": len(ordered), "threadCount": len(tlist),
            "privacy": "Email addresses, phone numbers, the family's private address, postcodes and meeting joining details are redacted. Officials appear by name or role.",
            "endpoints": {"index": "/api/index.json", "threads": "/api/threads.json", "corpus": "/api/corpus.json", "message": "/api/message/<id>.json", "text": "/mail/<id>.txt"}}
    write_if_changed(idx_path, json.dumps(dict(meta, records=ordered), ensure_ascii=False, indent=1) + "\n")
    corpus = {}
    for r in ordered:
        p = os.path.join(root, "api", "message", r["id"] + ".json")
        if os.path.exists(p): corpus[r["id"]] = json.load(open(p)).get("text", "")
    shards, cur, size = [], {}, 0
    for rid, txt in corpus.items():
        if cur and size + len(txt) > 900000:
            shards.append(cur); cur, size = {}, 0
        cur[rid] = txt; size += len(txt)
    if cur: shards.append(cur)
    names = []
    for n, sh in enumerate(shards, 1):
        names.append("/api/corpus-%d.json" % n)
        write_if_changed(os.path.join(root, "api", "corpus-%d.json" % n), json.dumps({"part": n, "of": len(shards), "texts": sh}, ensure_ascii=False) + "\n")
    write_if_changed(os.path.join(root, "api", "corpus.json"), json.dumps(dict(meta, shards=names), ensure_ascii=False, indent=1) + "\n")
    write_if_changed(os.path.join(root, "api", "threads.json"), json.dumps(dict(meta, threads=tlist), ensure_ascii=False, indent=1) + "\n")
    print(json.dumps({"records": len(ordered), "threads": len(tlist), "written": written, "skipped": skipped, "redactions": c}))

if __name__ == "__main__":
    a = sys.argv[1:]
    gen = a[a.index("--generated") + 1] if "--generated" in a else datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
    main(a[0], a[1], gen)
