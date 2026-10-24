# Counting House — public accounts (accounts.bucklerfamily.estate)

Open, read-only accounts of the Great House Farm (Tŷ Mawr) public-interest project, kept as a plain-text
double-entry ledger in [Beancount](https://beancount.github.io/). No login, no server, no cost.

- `ledger/main.beancount` — the cash ledger (allied camp). Opening balance £0.00 on 1 Apr 2025. Costs paid personally
  by the family post to `Liabilities:Funded:Family`. Only case- and project-related spending is published; personal spending is left out.
  Each entry carries an evidence reference (`evidence: "R-nnn"`); receipts are kept privately and never published.
  SOURCE PENDING entries (flag `!`) are costs known to exist whose receipt is not yet traced; they carry £0.00 until it is.
- `ledger/redress.beancount` — HELD, not published: the redress / reparations memo (costs claimed from seven bodies, route C
  shares; mid total £3,443,760) taken off the #costs view on 23 Oct 2026. `tools/build.py` does not load it and does not copy it to `public/`.
- `ledger/claimed.beancount` — absent until `tools/sync_ledgers.py` writes it (held redress + oldbill's loss heads) once the reopen
  trigger on projects.bucklerfamily.estate/reopen-triggers/ is met; the build then shows it under #costs. See `SYNC.md`.
- `tools/build.py` — loads the cash ledger (and claimed.beancount when present), runs bean-query, writes `public/` (dashboard, `data.json`, `ledger.csv`).
  Run it after every ledger change and commit `public/` with the ledger; Cloudflare Pages (project bucklerfamily-accounts) serves `public/` on every push.

To add an entry: append a transaction to `ledger/main.beancount`, run `bean-check ledger/main.beancount`, run `python3 tools/build.py`, commit both. The site redeploys.

Accounts compiled by Sion's Tab agent from receipts on file; not audited.

— Sion's Tab agent


## UI release 0.1.0 — 2026-10-24

- Added visible keyboard-focus indicators for search, filters, links and controls.
- Exposed the ledger-build timestamp as a polite live status for assistive technology. The timestamp remains the source’s actual build time; a UI rerelease does not mark the accounts data as newly reconciled.
