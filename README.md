# Dartboard — public-records escalation board (Great House Farm / Tŷ Mawr, Llandough)

Live at dartboard.bucklerfamily.estate. The page is visual: a dartboard on top and, under it, an arcade-style climb ("Avenues"). Text only appears in a sheet when you tap something.

**The dartboard.** Each slice of the wheel is an institution. Each ring, from the outside in, is the next route used to get a record: opening enquiry → substantive reply → clarification and chase → internal review → formal complaint → independent regulator → democratic pressure → tribunal or court.

**Avenues (the climb).** Pick an institution from the dropdown. The ape at the top is that institution, and each barrel it throws is one of its replies. The climber is Sion. Each girder is one avenue on that institution's own escalation roadmap, from the first enquiry at the bottom to court-ordered disclosure at the top. Crates are emails Sion sent on that avenue, and small barrels resting there are the replies. Girder colours: green = used up (answered or escalated past), amber = in progress, red = overdue (hand-checked only), blue dashed = available but not used yet, grey hatched = not available for that body (e.g. FOI for a private company or for Heneb). Roadmaps differ by type of body: UK and Welsh public authorities, HM Land Registry, courts/MoJ, police, CPS, NHS Wales, coroner, water company (EIR only), Heneb (charity), private companies, law firm, charities, and MPs/Senedd/watchdogs. Sources are cited in `src/data/avenues.ts`.

## Data

| File | What it holds |
|---|---|
| `src/data/disclosure.ts` | The wheel: institutions (parties), rings and one cell per step taken. Mailbox sampled through 18 October 2026. |
| `src/data/response-assessments.ts` | Response-friction (RFS) scoring of individual replies, with method notes and limits. |
| `src/data/foi-tracker.ts` | **New.** Every FOI / EIR / SAR / complaint conversation from the mailbox, by institution, with dates, references, computed deadlines and status. |
| `public/data/foi-tracker.csv` | **New.** The same tracker as a CSV. |
| `foi-tracker-2026-10-19.md` | **New.** A readable summary of the tracker, plus the hand-checked overdue and refused items. |
| `src/data/avenues.ts` | **New.** Each institution's escalation roadmap (with legal sources) and every case email (date, scrubbed subject, official refs, outcome) placed on its avenue. Statuses as of 19 October 2026. |
| `draft-review-2026-10-18.md` | The review of the drafts as of 18 October. |

## Conventions

- Institutions and official reference numbers only. Individual officials are referred to by role.
- No email addresses, phone numbers or other contact details anywhere in this repository.
- Contested history is stated as the family’s account. Nothing on the board is a finding of fact or of wrongdoing, and a status colour describes how a reply was handled, not anyone’s motive.
- Deadlines are computed (20 working days for FOI/EIR, one month for SAR) unless the authority’s own date is noted.

## Development

`npm install`, then `npm run dev`. See `package.json` for build and test scripts.
