# Dartboard — public-records escalation board (Great House Farm / Tŷ Mawr, Llandough)

Live at dartboard.bucklerfamily.estate. Each slice of the wheel is an institution. Each ring, from the outside in, is the next route used to get a record: opening enquiry → substantive reply → clarification and chase → internal review → formal complaint → independent regulator → democratic pressure → tribunal or court.

## Data

| File | What it holds |
|---|---|
| `src/data/disclosure.ts` | The wheel: institutions (parties), rings and one cell per step taken. Mailbox sampled through 18 October 2026. |
| `src/data/response-assessments.ts` | Response-friction (RFS) scoring of individual replies, with method notes and limits. |
| `src/data/foi-tracker.ts` | **New.** Every FOI / EIR / SAR / complaint conversation from the mailbox, by institution, with dates, references, computed deadlines and status. |
| `public/data/foi-tracker.csv` | **New.** The same tracker as a CSV. |
| `foi-tracker-2026-10-19.md` | **New.** A readable summary of the tracker, plus the hand-checked overdue and refused items. |
| `draft-review-2026-10-18.md` | The review of the drafts as of 18 October. |

## Conventions

- Institutions and official reference numbers only. Individual officials are referred to by role.
- No email addresses, phone numbers or other contact details anywhere in this repository.
- Contested history is stated as the family’s account. Nothing on the board is a finding of fact or of wrongdoing, and a status colour describes how a reply was handled, not anyone’s motive.
- Deadlines are computed (20 working days for FOI/EIR, one month for SAR) unless the authority’s own date is noted.

## Development

`npm install`, then `npm run dev`. See `package.json` for build and test scripts.
