# Clearance Standard — fcg.bucklerfamily.estate

Version 1.0.0 · 21 October 2026 · Sion's Tab agent


## What "clearance" means here
Clearance is a measure of how an institution has dealt with requests for records and information about Great House Farm (Tŷ Mawr), Llandough. It rewards prompt, full, free and straight answers. It deducts for delay, partial answers, "not held" without a record of what happened, cost and repeat refusals, fees, diversion, contradiction and silence. It scores conduct in the correspondence only. It is not a view of any person, and it scores institutions, never individuals.

## The scale
- Every institution starts at **500 of 1000**. Scores are held between 0 and 1000.
- **Cleared / Ally: 900 and above.** To reach it from 500 an institution needs a net +400, for example ten replies that are on time and fully disclosed with nothing deducted.
- **Provisional: 700–899.**
- **Under review: 500–699.**
- **Quarantine: below 500.**

## Point rules (fixed)
Points move only on a dated email or letter in the record. Every point change on the site shows its date, what happened, and a link to the message in the case-mail archive (email.bucklerfamily.estate) and its copy in wayback.bucklerfamily.estate where one exists.

| Code | Icon | Points | Rule |
|---|---|---|---|
| ON_TIME | ✔️ | +20 | Replied within the statutory period |
| PROMPT | ⚡ | +10 | Replied within half the statutory period |
| FULL | 📂 | +40 | Full disclosure of what was asked, nothing withheld |
| VOLUNTARY | 🎁 | +25 | Records released or published without being forced to |
| LOCATION | 🧭 | +10 | Free, helpful answer on where a record is held |
| SUBSTANTIVE | ✉️ | +10 | Substantive written answer where no statutory clock applies |
| FEE_WAIVED | 🆓 | +5 | Fee waived |
| OVERDUE | ⏰ | -3 per working day (max −150 per request) | Overdue: per working day past the statutory deadline (max −150 per request) |
| PARTIAL | ⚠️ | -15 | Partial: part of what was asked still outstanding after the reply |
| NOT_HELD | 🗑️ | -40 | "Not held" with no destruction record and no search described |
| LOST | 🔥 | -50 | Records said to be destroyed, lost or not surviving, with no destruction record produced |
| COST_REFUSAL | 💲 | -50 | Refused on cost (FOIA s.12) |
| FEE | 💲 | -10 each (max −50 per institution) | Fee demanded for access (each quote; max −50 per institution) |
| REPEAT_REFUSAL | 🔁 | -50 | Refused as a repeated request (FOIA s.14(2)) |
| REDUNDANT_Q | 🌀 | -10 | Asked us to clarify something the record had already answered |
| WRONG_REGIME | 🚧 | -25 | Handled under the wrong regime, or the applicable law not accepted |
| RAILROAD | 🚧 | -25 | Reply did not answer the question asked, or diverted it elsewhere |
| DEAD_END | 🚧 | -15 | Dead-end mailbox: automated "no longer supported", no action taken |
| CONTRADICTION | 💣 | -40 | The body's own statements disagree, not reconciled in writing |
| UNANSWERED_LETTER | 📭 | -30 | Letter or preservation notice with no reply after 20 working days |
| EXEMPTION | 🔒 | -20 | Withheld under an exemption or closed to access |
| PRIVACY | ☣️ | -20 | Privacy given as the reason to withhold historic records |

### 10/10 reply 🫶🤝✌️
A reply earns the 10/10 mark when it is on time, within half the statutory period, gives full disclosure, and draws no deduction on the same day or the same request.

## Statutory clocks used
- FOI (FOIA s.10) and EIR (reg. 5(2)): 20 working days.
- FOI internal review: 20 working days (ICO guidance; 40 only in exceptional cases).
- EIR internal review (reg. 11(4)): 40 working days.
- Subject access (UK GDPR art. 12(3)): one calendar month.
- Letters and preservation notices with no statutory clock: 20 working days for a reply.
- Working days exclude weekends and bank holidays in England and Wales. Day 1 is the first working day after receipt; a request sent at a weekend is counted from the next working day.
- Where an institution has asked a fair clarification, the clock is paused until we reply.
- Overdue points are counted afresh each day, so a score falls every working day a reply is late.

## Method
1. Source of the record: the per-institution forensic assessments of 21 Oct 2026 (drawn from the case mailbox and the evidence catalogue), the correspondence register (fee notes), and the clarification ledger. Automated mailbox categories are context only and are never scored on their own.
2. Each scored item is a dated message. If the date or the meaning of a message is uncertain, it is not scored, or it is marked "to confirm".
3. One deduction per reply per rule: a reply that answers 39 questions "not held" draws one 🗑️, not 39.
4. Pending requests inside their deadline score nothing until they are answered or overdue.
5. The data (events.json) and the scorer (rescore.py) are kept in the site's repository so anyone can recompute every score.
6. The scores are re-run every day at midday from new case mail.

## Wording
Wording on the site is limited to what the record shows ("did not reply by the statutory deadline").

