#!/usr/bin/env python3
"""Static generator for accounts.bucklerfamily.estate.
Reads ledger/main.beancount (cash) and ledger/claimed.beancount (prospective memo) with Beancount,
runs bean-query for the category totals, and writes public/ (index.html, data.json, ledger.csv, the ledger sources).
Free to run: no server, no login. Compiled by Sion's Tab agent."""
import json, csv, os, shutil, datetime, html
from collections import defaultdict
from beancount import loader
from beancount.core import data
from beanquery import query as bq

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUB = os.path.join(ROOT, "public"); os.makedirs(PUB, exist_ok=True)
MAIN = os.path.join(ROOT, "ledger", "main.beancount"); MEMO = os.path.join(ROOT, "ledger", "claimed.beancount")

PROVIDER = {"OpenAI": "OpenAI", "Anthropic": "Anthropic", "ElevenLabs": "ElevenLabs", "Groq": "Groq", "XAI": "xAI (Grok)"}
CATEGORY = [("Expenses:AI:Tokens", "AI tokens"), ("Expenses:Disclosure:HMLR", "Disclosure: HM Land Registry"),
            ("Expenses:Disclosure", "Disclosure: other"), ("Expenses:Hosting", "Hosting and domains"),
            ("Expenses:Postage", "Postage")]

def cat_of(acct):
    for pre, name in CATEGORY:
        if acct.startswith(pre): return name
    return acct.split(":")[1] if ":" in acct else acct

def main():
    entries, errors, options = loader.load_file(MAIN)
    if errors: raise SystemExit("ledger errors: %r" % errors[:3])
    rows = []
    for e in entries:
        if not isinstance(e, data.Transaction): continue
        for p in e.postings:
            a = p.account
            if not (a.startswith("Expenses:") or a.startswith("Income:")): continue
            amt = float(p.units.number)
            rows.append({"ref": e.meta.get("evidence", ""), "date": e.date.isoformat(), "payee": e.payee or "",
                "narration": e.narration, "account": a, "category": cat_of(a) if a.startswith("Expenses") else "Income",
                "provider": PROVIDER.get(a.split(":")[-1], "") if a.startswith("Expenses:AI") else "",
                "gbp": round(amt, 2), "original": e.meta.get("original", ""), "fx": e.meta.get("fx", ""),
                "status": e.meta.get("status", ""), "class": e.meta.get("class", ""), "pending": e.flag == "!"})
    rows.sort(key=lambda r: (r["date"], r["ref"]))
    # bean-query: totals by account (the same numbers the dashboard shows)
    rtypes, rrows = bq.run_query(entries, options,
        "SELECT account, sum(number) AS total WHERE account ~ '^(Expenses|Income|Assets:Allied|Assets:Receivable|Liabilities)' GROUP BY account ORDER BY account")
    by_account = {r[0]: float(r[1] or 0) for r in rrows}
    spend = sum(r["gbp"] for r in rows if r["account"].startswith("Expenses"))
    income = -sum(r["gbp"] for r in rows if r["account"].startswith("Income"))
    month = defaultdict(lambda: {"in": 0.0, "out": 0.0})
    d = datetime.date(2025, 4, 1)
    while d <= datetime.date.today():
        month[d.strftime("%Y-%m")]; d = (d.replace(day=28) + datetime.timedelta(days=4)).replace(day=1)
    bycat, byprov = defaultdict(float), defaultdict(float)
    for r in rows:
        m = r["date"][:7]
        if r["account"].startswith("Expenses"):
            month[m]["out"] += r["gbp"]; bycat[r["category"]] += r["gbp"]
            if r["provider"]: byprov[r["provider"]] += r["gbp"]
        else: month[m]["in"] += -r["gbp"]
    memo_entries, merr, _ = loader.load_file(MEMO)
    if merr: raise SystemExit("memo errors: %r" % merr[:3])
    claimed = []
    for e in memo_entries:
        if not isinstance(e, data.Transaction): continue
        p = [x for x in e.postings if x.account.startswith("Claimed:")][0]
        claimed.append({"body": e.meta["body"], "share": float(e.meta["share"]), "low": float(e.meta["low"]),
            "mid": float(p.units.number), "high": float(e.meta["high"]), "basis": e.meta["basis"], "route": e.meta["route"]})
    claimed.sort(key=lambda c: -c["share"])
    case_costs = round(sum(r["gbp"] for r in rows if r["account"].startswith("Expenses")), 2)
    out = {"generated": datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC"), "period": "1 Apr 2025 – today",
        "balance": by_account.get("Assets:Allied:Balance", 0.0), "income": round(income, 2), "spend": round(spend, 2),
        "ai": round(bycat.get("AI tokens", 0), 2), "hmlr": round(bycat.get("Disclosure: HM Land Registry", 0), 2),
        "pending": sum(1 for r in rows if r["pending"]), "count": len(rows),
        "months": [{"m": k, **{kk: round(vv, 2) for kk, vv in v.items()}} for k, v in sorted(month.items())],
        "bycat": sorted([[k, round(v, 2)] for k, v in bycat.items()], key=lambda x: -x[1]),
        "byprov": sorted([[k, round(v, 2)] for k, v in byprov.items()], key=lambda x: -x[1]),
        "funded": round(-by_account.get("Liabilities:Funded:Family", 0.0), 2), "payable": round(-sum(v for k, v in by_account.items() if k.startswith("Liabilities:Payable")), 2),
        "coins_liability": round(-by_account.get("Liabilities:Coins:Unspent", 0.0), 2), "coins_income": round(-by_account.get("Income:Coins:Stripe", 0.0), 2),
        "rows": rows, "claimed": claimed, "case_costs": case_costs, "by_account": by_account}
    json.dump(out, open(os.path.join(PUB, "data.json"), "w"), indent=1, ensure_ascii=False)
    with open(os.path.join(PUB, "ledger.csv"), "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f); w.writerow(["ref", "date", "payee", "description", "account", "category", "provider", "amount_gbp", "original", "fx", "status", "class"])
        for r in rows: w.writerow([r["ref"], r["date"], r["payee"], r["narration"], r["account"], r["category"], r["provider"], f'{r["gbp"]:.2f}', r["original"], r["fx"], r["status"], r["class"]])
    os.makedirs(os.path.join(PUB, "ledger"), exist_ok=True)
    for fn in ("main.beancount", "claimed.beancount"): shutil.copy(os.path.join(ROOT, "ledger", fn), os.path.join(PUB, "ledger", fn))
    tpl = open(os.path.join(ROOT, "tools", "template.html"), encoding="utf-8").read()
    open(os.path.join(PUB, "index.html"), "w", encoding="utf-8").write(tpl.replace("/*__DATA__*/null", json.dumps(out, ensure_ascii=False)))
    print("built", len(rows), "rows; spend", out["spend"], "AI", out["ai"], "pending", out["pending"])

if __name__ == "__main__":
    main()
