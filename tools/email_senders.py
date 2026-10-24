#!/usr/bin/env python3
"""email_senders.py — keep data/email_senders.json: the From / Institution / Subject header of every received email in the
dartboard roadmap, read from its archived text at https://wayback.bucklerfamily.estate/mail/<id>.txt. tools/publishers.py posts
each email from its real sender with it (Sion, 17:00 BST 24 Oct 2026). Fetches only ids not yet in the file. — Sion's Tab agent"""
import json, os, sys, time, urllib.request
from concurrent.futures import ThreadPoolExecutor
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUTP = os.path.join(ROOT, "data", "email_senders.json")
UA = {"User-Agent": "Mozilla/5.0 (farmbook build)"}
def get(u, t=30):
    with urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=t) as r: return r.read().decode("utf-8", "replace")
def header(mid):
    for i in range(3):
        try:
            tx = get("https://wayback.bucklerfamily.estate/mail/%s.txt" % mid); hd = {}
            for l in tx.splitlines()[:12]:
                if l.startswith("---"): break
                if ":" in l: k, v = l.split(":", 1); hd[k.strip()] = v.strip()
            return {k: hd.get(k, "") for k in ("From", "Institution", "Subject", "Date")}
        except Exception: time.sleep(1 + i)
    return None
def load():
    return json.load(open(OUTP, encoding="utf-8")) if os.path.exists(OUTP) else {"_note": __doc__.split("\n")[0], "senders": {}}
def ensure(pairs, quiet=True):
    """pairs: [(mid, lane_id)] of received emails. Fetches missing headers, saves, returns the senders dict."""
    D = load(); S = D["senders"]; todo = [(m, l) for m, l in pairs if m not in S]
    if todo:
        with ThreadPoolExecutor(6) as ex:
            for (m, l), h in zip(todo, ex.map(lambda t: header(t[0]), todo)):
                if h: h["lane"] = l; S[m] = h
        json.dump(D, open(OUTP, "w", encoding="utf-8"), ensure_ascii=False, indent=0, sort_keys=True)
    if not quiet: print("email senders: %d known, %d fetched now, %d still unknown" % (len(S), len([1 for m, _ in todo if m in S]), len([1 for m, _ in pairs if m not in S])))
    return S
if __name__ == "__main__":
    R = json.loads(get("https://dartboard.bucklerfamily.estate/data/roadmap.json", 60))
    ensure([(m["id"], L["id"]) for L in R["lanes"] for m in L["emails"] if m["dir"] == "received"], quiet=False)
