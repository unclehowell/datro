#!/usr/bin/env python3
"""email_posts.py — the fb2 email posts, written as the sender's own post (Sion, 17:18 BST 23 Oct 2026, m:1806dbe2):
"on posts don't say "reply:" just have posts saying what they said on email. But use hash tags in their mock social media posts
I.e. #email #to #hywelapbuckler (ensuring the post date matches the email date). Also sum up the post".

For every email on the dartboard roadmap (/data/roadmap.json lanes[].emails[]) this keeps one row in data/email_posts.json:
  dt       the email's own sent time, Europe/London (from the archived record wayback.bucklerfamily.estate/mail/gm-<id>.txt "Date:",
           else email.bucklerfamily.estate/api/message?id=gm-<id> "date"; the roadmap's UTC day only when neither answers: dt_src says which)
  summary  one or two first-person sentences, as the sender wrote it (institutions "we", the project manager "I"), summing the email up
  key      optional verbatim key words from the email body ("" when none worth showing)
build_wall.py (fb2) renders: summary, the key words in quotes, then the hashtags (#email #to #hywelapbuckler #<body> for mail received;
#email #from #hywelapbuckler #to #<body> for mail sent), dated and timed to dt. No "Reply"/"Re:" labels.
New ids are written through the model proxy (one batch of 8 per call) and gated (house word list, private patterns, no payment wording
on the family's side, no names Hywel/Sion/Mr Buckler); a row that fails the gate twice falls back to the roadmap's own note.

Usage: python3 tools/email_posts.py            # add rows for new emails (run before build_wall.py; publish_fb.py and the daily chain call it)
       python3 tools/email_posts.py --check    # report ids without a row, dates that differ, nothing written
23 Oct 2026 — Sion's Tab agent"""
import os, re, sys, json, time, datetime as dt, subprocess, urllib.request, concurrent.futures as cf
from zoneinfo import ZoneInfo
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUTP = os.path.join(ROOT, "data", "email_posts.json")
LON = ZoneInfo("Europe/London")
UA = {"User-Agent": "Mozilla/5.0 (farmbook build)"}
BANNED = re.compile(r"\b(says|claims|claimed|claiming|according to|hearsay|unverified|alleged\w*|allegation\w*|fraud\w*|stolen|thie(f|ves)|negligen\w*|incompeten\w*|criminal|tenant)\b"
                    r"|\bHywel\b|\bSion\b|Mr\.? Buckler|hywelapbuckler|Branwen|robin\s*hill|7845|\+44|\b07\d{3}|[\w.+-]+@[\w-]+\.[\w.]+|https?://|^\s*(re|reply|email|fw|fwd)\b", re.I)
PAY = re.compile(r"\b(pay|paying|payment\w*|fees?(?! simple)|invoice\w*)\b|£", re.I)   # the family's side never talks about paying
RULES = """You write short Facebook-style posts for a public family-history site ("Farmbook"). Each post IS an email, retold as the sender's own social post, in the FIRST PERSON as the sender (an institution writes as "we"; the project manager who sends the family's emails writes as "I"). Address the other side as "you" where natural.
For each email give:
- "summary": one or two plain sentences that sum up what the sender wrote (the gist: what they asked, answered, refused, held or will do; keep reference numbers, record names and dates that matter). Max 45 words.
- "key": OPTIONAL. A short verbatim phrase (6-25 words) copied exactly from the email body that carries its key words, or "" if nothing useful. Must appear character-for-character in the email.
Hard rules for both fields: never name a living private individual (no staff names, councillors, officers, solicitors; use roles like "the Clerk", "our officer"); never write the names "Hywel" or "Sion" or "Mr Buckler" (say "you" or "the family"); never use these words: says, said, claims, according to, hearsay, unverified, alleged, fraud, stolen, negligence, incompetence, tenant (use "occupier"); no disclaimers; no titles or headings; no hashtags. For emails sent BY the project manager: say nothing at all about paying, not paying, payment, fees or costs on the sender's part. Do not start with "Reply", "Re:" or "Email". Do not invent anything that is not in the email.
Return ONLY a JSON object mapping each id to {"summary": "...", "key": "..."}."""

def get(url, t=40):
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=t) as r: return r.read().decode("utf-8", "replace")
def roadmap():
    return json.loads(get("https://dartboard.bucklerfamily.estate/data/roadmap.json", 60))
def record(mid):
    """(London datetime or None, source word, header dict, body text)"""
    try:
        t = get("https://wayback.bucklerfamily.estate/mail/%s.txt" % mid)
        if not t.lstrip().startswith("<"):
            hd, _, body = t.partition("-" * 60); H = {}
            for line in hd.splitlines():
                if ":" in line: k, v = line.split(":", 1); H.setdefault(k.strip(), v.strip())
            try: return dt.datetime.strptime(H.get("Date", ""), "%a, %d %b %Y %H:%M UTC").replace(tzinfo=dt.timezone.utc).astimezone(LON), "wayback", H, body.strip()
            except ValueError: pass
    except Exception: pass
    try:
        j = json.loads(get("https://email.bucklerfamily.estate/api/message?id=%s" % mid))
        if j.get("date"): return dt.datetime.fromisoformat(j["date"].replace("Z", "+00:00")).astimezone(LON), "email", {"Subject": j.get("subject", "")}, j.get("text") or ""
    except Exception: pass
    return None, "roadmap", {}, ""
def clean_body(b):
    out = []
    for line in b.splitlines():
        s = line.strip()
        if re.match(r"^(On .{5,120} wrote:|-{2,}\s*Original Message|From:\s|Sent:\s|________________)", s): break
        if s.startswith(">"): continue
        out.append(line)
    t = re.sub(r"<https?://[^>]+>", "", "\n".join(out)); return re.sub(r"\n{3,}", "\n\n", t).strip()[:2200]
def model(prompt):
    mc = json.load(open("/home/user/tab/.model-capability.json"))
    body = json.dumps({"model": "claude-sonnet-5", "max_tokens": 4000, "messages": [{"role": "user", "content": prompt}]}).encode()
    rq = urllib.request.Request(mc["base_url"] + "/anthropic/v1/messages", data=body, headers={"x-api-key": mc["token"], "anthropic-version": "2023-06-01", "content-type": "application/json"})
    with urllib.request.urlopen(rq, timeout=110) as r: j = json.loads(r.read())
    t = "".join(c.get("text", "") for c in j["content"] if c.get("type") == "text"); return json.loads(t[t.find("{"):t.rfind("}") + 1])
# living people by role only; real names, no nicknames (fb.md). Applied after the verbatim check, so a key keeps its words but not the name.
NAME_SUBS = [(r"\bStephen Doughty MP\b|\bStephen Doughty\b", "the MP for Cardiff South and Penarth"), (r"\bJane Hutt\b", "the Member"),
             (r"\bPhilip Gale\b", "the archivist"), (r"\bMike Weatherhead\b", "your contact officer"), (r"\bMrs Nancy Buckler\b", "a family member"),
             (r"\b(?:Councillor|Cllr\.?)\s+(?:George\s+)?Carroll\b", "the ward councillor"), (r"\bGeorge Carroll\b", "the ward councillor"),
             (r"\s*\(Billy\)", ""), (r"\bBilly Buckler\b", "William Buckler"), (r"\bFred Buckler\b", "Frederick Buckler")]
def names(t):
    for a, b in NAME_SUBS: t = re.sub(a, b, t)
    return t
def gate(row, sent, body):
    r_ = _gate(row, sent, body)
    if r_: r_["summary"] = names(r_["summary"]); r_["key"] = names(r_["key"])
    return r_
def _gate(row, sent, body):
    s = (row.get("summary") or "").strip(); k = (row.get("key") or "").strip().strip("“”\"")
    if not s or BANNED.search(s) or (sent and PAY.search(s)): return None
    if k and (BANNED.search(k) or (sent and PAY.search(k)) or len(k.split()) < 6 or re.sub(r"\s+", " ", k) not in re.sub(r"\s+", " ", body)): k = ""
    return {"summary": s, "key": k}
def item(mid, M):
    who = ("the project manager, writing for the Williams / Buckler family, TO " + M["name"]) if M["dir"] == "sent" else (M["name"] + " writing TO the family")
    return "### id: %s\nSender: %s\nSubject: %s\nDate: %s\nExisting third-person note: %s\nEmail body:\n%s\n" % (mid, who, M["subject"], M["dt"], M["note"], clean_body(M["body"]) or "(body not archived; use the note)")
def main():
    check = "--check" in sys.argv
    D = json.load(open(OUTP, encoding="utf-8")) if os.path.exists(OUTP) else {"_note": __doc__.split("\n\n")[0], "posts": {}}
    P = D["posts"]; R = roadmap(); todo = {}
    for L in R["lanes"]:
        for m in L["emails"]:
            if m["id"] in P: continue
            todo[m["id"]] = {"name": L["name"], "dir": m["dir"], "subject": m.get("subject", ""), "note": m.get("summary", ""), "day": m["date"]}
    print("email posts: %d on file, %d new" % (len(P), len(todo)))
    if check or not todo: return
    with cf.ThreadPoolExecutor(8) as ex: recs = dict(zip(todo, ex.map(lambda i: record(i), todo)))
    for mid, (d, srcw, H, body) in recs.items():
        M = todo[mid]; M["body"] = body; M["dt"] = d.isoformat() if d else M["day"]; M["dt_src"] = srcw
    ids = list(todo); batches = [ids[i:i + 8] for i in range(0, len(ids), 8)]
    def run(b):
        for a in range(3):
            try: return model(RULES + "\n\n" + "\n".join(item(i, todo[i]) for i in b))
            except Exception as ex: time.sleep(5 * (a + 1))
        return {}
    with cf.ThreadPoolExecutor(6) as ex: outs = list(ex.map(run, batches))
    got = {}
    for o in outs: got.update(o)
    redo = [i for i in ids if not gate(got.get(i) or {}, todo[i]["dir"] == "sent", todo[i]["body"])]   # one stricter retry for rows the gate refused
    if redo:
        STRICT = "\n\nSTRICT: the previous attempt broke a rule. Do not use: says, said, claims, claimed, according to, alleged, fraud, stolen, tenant, any personal name, Hywel, Sion, Mr Buckler; for emails sent by the project manager do not mention pay, payment, fees or money at all."
        def run2(b):
            try: return model(RULES + STRICT + "\n\n" + "\n".join(item(i, todo[i]) for i in b))
            except Exception: return {}
        with cf.ThreadPoolExecutor(6) as ex:
            for o in ex.map(run2, [redo[i:i + 8] for i in range(0, len(redo), 8)]): got.update(o)
    for mid, M in todo.items():
        row = gate(got.get(mid) or {}, M["dir"] == "sent", M["body"])
        if not row:   # fallback: the roadmap's own note, gated the same way, else a plain line
            note = re.sub(r"^In short:\s*", "", M["note"] or "")
            row = gate({"summary": note}, M["dir"] == "sent", "") or {"summary": ("I wrote to %s." % M["name"]) if M["dir"] == "sent" else "We wrote to you.", "key": ""}
            row["fallback"] = True
        row["dt"] = M["dt"]; row["dt_src"] = M["dt_src"]; P[mid] = row
    json.dump(D, open(OUTP, "w", encoding="utf-8"), ensure_ascii=False, indent=0, sort_keys=True)
    print("email posts: wrote %d rows" % len(todo))
if __name__ == "__main__": main()
