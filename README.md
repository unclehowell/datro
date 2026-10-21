# oldbill.bucklerfamily.estate — the Tŷ Mawr Ticket Desk

A playful scoreboard and double-entry cost ledger for Great House Farm (Tŷ Mawr). Two chalkboards (Team Williams, Team Regime),
one ticket per sourced event, one pair of ledger entries per cost, and a "What if the case reopens?" switch that quashes the
orders resting on the title question and posts the contingent costs across to Team Regime.

Static site: `public/` (Cloudflare Pages project `bucklerfamily-oldbill`, datro branch `oldbill`). Built by `tools/build.py`
from the tables inside it plus `tools/template.html`. Every ticket and every cost line carries a Legal Wiki source URL.

## Rebuild
    python3 tools/build.py            # writes public/index.html, public/data/tickets.json, public/data/ledger.json
The build fails if a banned word or a withheld name appears in public text, or if debits and credits do not balance.

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
- `entries[]`: `id, date, head, account, amount (GBP), estimate, nil (no £ on the record yet), basis, sources[]`,
  `status` (`borne` | `contingent`; shown as "Shifted" when the switch is on), `borne_by`, `liable_now`, `liable_if_reopened`,
  `postings[]` (`{account, dr}` / `{account, cr}`: Dr `Borne:Team-Williams:<head>`, Cr `Caused:<head>`),
  `reopen_postings[]` (Dr `Liable:Team-Regime:<party>` by share, Cr `Borne:Team-Williams:<head>`).
- `apportionment[]`: `party, account, share, basis, source` (shares from the Reparations Schedule, page 5475).
- `memo[]`: value realised on the land, for scale; outside the balance.
- Debits equal credits in both states; the page shows "Books balance ✓".

## Adding a ticket
Append a dict to `R` (Team Regime) or `ORDERS` (orders against the family) in `tools/build.py` with `date, date_label, desk,
issued_to, what, detail, base, mult, sources`. Tickets go to institutions and roles only. Rebuild, then publish.

© the Williams-Buckler family of Tŷ Mawr. Licence: https://bucklerfamily.estate/licence/
