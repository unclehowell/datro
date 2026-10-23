# oldbill.bucklerfamily.estate — Who gained, who lost (draft damages schedule) and the Tŷ Mawr Ticket Desk

v3 (22 Oct 2026): the page leads with a draft damages schedule built the way a loss analyst would build it.

1. **The double comb** (hero, plain SVG drawn by the page's JS from `data/damages.json`): the upper comb's teeth point up, one per
   party that gained (height = £ mid, whiskers = low/high); the lower comb's teeth point down, one per head of the family's loss.
   Coloured connectors run from each loss to the gainer(s) it is claimed from (stroke width = share). Hatched teeth are estimates;
   pale-red loss teeth carry "causation to be proven". Tap a tooth: method, inputs, facts with source links, low/mid/high.
   Totals sit at each comb's end. Gains (disgorgement) and losses (compensation) are alternatives and are never added.
2. **Two scenarios**: the analyst build-up (low/mid/high) beside the Restitutionary Brief v3 mid-case (£195.5m, Section IV.A
   heads and one-line bases only), with a written reconciliation and a per-head gap table.
3. **The negotiation schedule**: one row per (party, loss head) from each head's allocation, grouped by party, with the party's
   compensation share, its gain, the higher of the two as the opening figure, the legal basis and evidence links. The legal test
   for setting the 1987 judgment aside is quoted verbatim inside `<section data-verbatim="legal-test">` (the one place the gate
   stands aside).
4. **The ticket desk** (below): chalkboards, tickets, the "What if the case reopens?" switch and the double-entry ledger, whose
   lines are now the ten analyst loss heads at mid (re-tallied; books balance both ways).

One disclaimer line at the top only: "Draft for legal review — a starting schedule for negotiation, not an assessment by a court."

Static site: `public/` (Cloudflare Pages project `bucklerfamily-oldbill`, datro branch `oldbill`). Built by `tools/build.py`
(tickets, ledger, gate) which imports `tools/damages.py` (gains, losses, allocations, brief scenario, reconciliation; every
figure computed from stated inputs and index values) plus `tools/template.html`. `tools/export.py` writes the lawyers' copy
(Markdown + PDF) from the same data.

## Rebuild
    python3 tools/build.py      # public/index.html + data/tickets.json, ledger.json, damages.json
    python3 tools/export.py     # damages-schedule-draft.md / .pdf (offline copy; not published)
The build fails on a banned word, a hedge phrase or a withheld name in public text (outside the legal-test section), if debits and
credits do not balance in either state, if the ledger does not equal the losses comb mid total, if anything priced fails to move
across when the case reopens, if a low/mid/high is out of order, or if a loss head's allocation does not total 100%.

## data/damages.json (schema oldbill-damages/1)
- `parties{key}`: `name, short, colour, gainer` (true = a tooth on the upper comb), `route` (legal route), `compensation{low,mid,high}`
  (sum of its allocated shares), `disgorgement{low,mid,high}` (its gain tooth, or null).
- `gains[]`: `id` (G-…), `party, party_name, label, what, v{low,mid,high}, estimate, method, inputs[[label,value]], facts[[text,source]], sources[]`.
- `losses[]`: `id` (L-…), `label, head, v{low,mid,high}, estimate, causation` (null or "to be proven"), `method, inputs, facts,
  alloc{party: % }` (totals 100), `maps_to[]` (the gainers among alloc = the connectors), `legal, sources[]`.
- `rows[]`: the negotiation schedule, one per (party, loss head): `party, party_name, head, what, share, v{}, legal, route, causation, evidence[]`.
- `totals.gains / totals.losses`: `{low, mid, high}`. `brief.heads[]`: `head, amount, basis, analyst[], analyst_mid, gap_note`; `brief.range`.
- `reconciliation[]` (paragraphs), `indices` (CDKO, CPI, Vale HPI values used), `bank_mean`, `interest_rate`, `sources{}`.

## data/tickets.json (schema oldbill-tickets/1)
- `rubric.bands[]`: `key, name, lo, hi, colour, example` — fixed point bands from 1 to 1,000,000.
- `rubric.multipliers[]`: `key, x, why`; `cap` 1,000,000.
- `tickets[]`: `id` (T-000 original ticket, W-nn orders against the family, R-nn Team Regime), `team`, `date`, `date_label`, `desk`,
  `desk_name`, `band`, `issued_to` (institution or role), `what`, `detail`, `base`, `multipliers[]`, `points`, `cancelled`,
  `reversible` + `reissue_to`, `sources[]`; the original ticket also has `fine` and `calibration`.
- `summary`: board totals `now` and `reopened`, books totals, counts.

## data/ledger.json (schema oldbill-ledger/1)
- `entries[]`: `id, group` (`heads` = the ten analyst loss heads at mid | `nil` = orders with no £ yet), `head, account, amount`
  (GBP, mid), `low, high, estimate, causation, nil, basis` (the method), `sources[]`, `alloc{}`, `status` (`borne` | `contingent`),
  `borne_by`, `liable_now`, `liable_if_reopened` (the parties and shares), `postings[]` (Dr `Borne:Team-Williams:<head>`,
  Cr `Caused:<head>`), `reopen_postings[]` (Dr `Liable:Team-Regime:<party>` by the head's allocation, Cr `Borne:Team-Williams:<head>`).
- `parties[]`: `party, account, route`. `summary`: `books` (Dr, Cr per state), `heads_total`, `priced_total`.

## Adding or changing a figure
Change the inputs in `tools/damages.py` (never a total by hand), rebuild, export, publish. A new gainer needs a record source;
gains are for institutions and companies only. Tickets: append to `R` or `ORDERS` in `tools/build.py`.

© the Williams-Buckler family of Tŷ Mawr. Licence: https://bucklerfamily.estate/licence/

## Ledger (Beancount, 23 Oct 2026)
The ledger section renders from `ledger/main.beancount`: plain-text Beancount, the same engine and conventions as
accounts.bucklerfamily.estate (GBP; renamed roots `Borne` / `Caused` / `Liable` so it never mixes with cash; one transaction per
loss head with its basis, low/high, allocation and sources as metadata; reopen postings as separate `#reopen` transactions
linked `^L-xxx`). `tools/build.py` loads it with Beancount and takes the books totals from bean-query; a copy is served at
`/ledger/main.beancount`. After a figure change in `tools/damages.py`:
`python3 tools/to_beancount.py && bean-check ledger/main.beancount && python3 tools/build.py` (requirements.txt).
The build stops if the ledger's heads no longer match the damages schedule. Sync with accounts.: see SYNC.md on the accounts branch.
