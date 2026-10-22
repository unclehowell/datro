# oldbill.bucklerfamily.estate — the Tŷ Mawr Ticket Desk

A playful scoreboard and double-entry cost ledger for Great House Farm (Tŷ Mawr). Two chalkboards (Team Williams, Team Regime),
one ticket per sourced event, one pair of ledger entries per cost, and a "What if the case reopens?" switch that quashes the
orders resting on the title question and posts the contingent costs across to Team Regime.

Ledger v2 (22 Oct 2026): the seven heads of loss from the Restitutionary Brief v3 (12 Feb 2026), Section IV.A, are the main
ledger lines at their mid-case figures (£195,500,000 in all; range £180m–£200m). The earlier Legal Wiki lines (Damages page 5298)
sit inside the head they belong to as detail (`inside[]`), shown but never added again.

Static site: `public/` (Cloudflare Pages project `bucklerfamily-oldbill`, datro branch `oldbill`). Built by `tools/build.py`
from the tables inside it plus `tools/template.html`. Every ticket and every wiki cost line carries a Legal Wiki source URL; the seven heads cite the Restitutionary Brief v3, IV.A (a source with no URL).

## Rebuild
    python3 tools/build.py            # writes public/index.html, public/data/tickets.json, public/data/ledger.json
The build fails if a banned word, a hedge phrase or a withheld name appears in public text, if debits and credits do not balance,
or if the seven heads do not total the brief's mid-case £195,500,000.

## data/tickets.json (schema oldbill-tickets/1)
- `rubric.bands[]`: `key, name, lo, hi, colour, example` — fixed point bands from 1 to 1,000,000.
- `rubric.multipliers[]`: `key, x, why` (child or pregnant person ×2; done while a court/Strasbourg process was running ×2); `cap` 1,000,000.
- `tickets[]`:
  - `id` (T-000 = the original ticket, W-nn = orders against the family, R-nn = tickets to Team Regime), `team` (`williams` | `regime`)
  - `date` (ISO, for sorting), `date_label`, `desk` (paper, silence, fair, over, court, orders, property, harm, home), `desk_name`, `band`
  - `issued_to` (an institution or role; family members are the only people named), `what` (one line), `detail`
  - `base`, `multipliers[]`, `points` = min(cap, base × multipliers); `cancelled` true scores 0
  - `reversible` + `reissue_to`: quashed and re-issued to that party when the switch is on
  - `sources[]`: `title, url`; the original ticket also has `fine` and `calibration`
- `summary`: board totals `now` and `reopened`, books totals, counts.

## data/ledger.json (schema oldbill-ledger/1)
- `entries[]`: `id, group` (`heads` = the seven brief heads H-1…H-7 | `small` = lines outside the heads | `nil` = orders with no £ yet),
  `date, head, account, amount (GBP), midcase` (brief mid-case figure), `estimate, nil (no £ on the record yet), basis` (one line), `sources[]`,
  `inside[]` (heads only: the folded wiki lines `{id, head, amount, basis, sources[]}`; detail, never added to any total),
  `status` (`borne` | `contingent`; shown as "Shifted" when the switch is on), `borne_by`, `liable_now`, `liable_if_reopened`,
  `postings[]` (`{account, dr}` / `{account, cr}`: Dr `Borne:Team-Williams:<head>`, Cr `Caused:<head>`),
  `reopen_postings[]` (Dr `Liable:Team-Regime:<party>` by share, Cr `Borne:Team-Williams:<head>`).
- `apportionment[]`: `party, account, share, basis, source` (shares from the Reparations Schedule, page 5475).
- `range`: `{lo, hi, mid, label, source}`, the brief's range, shown once beside the total.
- `memo[]`: empty since v2 (the value-on-the-land lines are inside H-2).
- `summary`: `books` (Dr, Cr per state), `heads_total`, `priced_total`.
- Debits equal credits in both states; the page shows "Books balance ✓".

## Adding a ticket
Append a dict to `R` (Team Regime) or `ORDERS` (orders against the family) in `tools/build.py` with `date, date_label, desk,
issued_to, what, detail, base, mult, sources`. Tickets go to institutions and roles only. Rebuild, then publish.

© the Williams-Buckler family of Tŷ Mawr. Licence: https://bucklerfamily.estate/licence/
