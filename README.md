# Counting House — public accounts (accounts.bucklerfamily.estate)

Open, read-only accounts of the Great House Farm (Tŷ Mawr) public-interest project, kept as a plain-text
double-entry ledger in [Beancount](https://beancount.github.io/). No login, no server, no cost.

- `ledger/main.beancount` — the cash ledger (allied camp). Opening balance £0.00 on 1 Apr 2025. Costs paid personally
  by the family post to `Liabilities:Funded:Family`. Only case- and project-related spending is published; personal spending is left out.
  Each entry carries an evidence reference (`evidence: "R-nnn"`); receipts are kept privately and never published.
  SOURCE PENDING entries (flag `!`) are costs known to exist whose receipt is not yet traced; they carry £0.00 until it is.
- `ledger/claimed.beancount` — a separate memorandum of costs claimed by the family (prospective). Its roots are renamed
  (`Claimed`, `Prospective`) so it can never be mixed with cash. Our case, prospective. Not a finding of any court.
- `tools/build.py` — loads both ledgers, runs bean-query, writes `public/` (dashboard, `data.json`, `ledger.csv`).
  Run it after every ledger change and commit `public/` with the ledger; Cloudflare Pages (project bucklerfamily-accounts) serves `public/` on every push.

To add an entry: append a transaction to `ledger/main.beancount`, run `bean-check ledger/main.beancount`, run `python3 tools/build.py`, commit both. The site redeploys.

Accounts compiled by Sion's Tab agent from receipts on file; not audited.

— Sion's Tab agent
