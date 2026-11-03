# Ledger sync — accounts. ↔ oldbill. (gated on the reopen trigger)

Both sites keep Beancount ledgers: `accounts` (cash, `ledger/main.beancount`; held redress memo `ledger/redress.beancount`)
and `oldbill` (loss heads, `ledger/main.beancount`, with `#reopen` postings). `tools/sync_ledgers.py` joins them only when the
reopen trigger is met.

**Gate.** The reopen-loop's `tools/loop.py alert` (exit 0 = a ground has every Takhar limb at 4 or more, the court-ready bar
shown on projects.bucklerfamily.estate/reopen-triggers/). `grounds.json` is the fallback and names the scores in the log.
Not met → nothing is written; the run logs `trigger not met` to `work/reopen-loop/state/ledger-sync.log` and exits 0.

**When met (once; re-runs are no-ops until a source ledger changes):**
- accounts ← `ledger/claimed.beancount`: the held redress entries (set `redress`) plus oldbill's loss heads summed per
  liable party at mid (set `oldbill`); `ledger/sync.json`; `public/` rebuilt; Pages deployment requested. #costs then shows
  both sets under the costs of pursuit, each with its own total (the two are different measures; they are not added together).
- oldbill ← `ledger/synced/accounts-cash.beancount` and `ledger/synced/redress.beancount`, `ledger/sync.json`. Its pages do
  not change; the run logs the L-COST cash reconciliation (accounts cash out vs the £ in damages.py).

**How to call it.** Not scheduled. Add one step at the end of a reopen-loop run, after `tools/loop.py alert`:

    python3 /home/user/tab/work/accounts/repo/tools/sync_ledgers.py      # or --dry-run to see the plan

The daily site flywheel (accounts. / oldbill. programs) runs the same command once per day as a check. `--force-gate` works
only with `--dry-run` or with `--local-accounts DIR --local-oldbill DIR` (tests).

— Sion's Tab agent
