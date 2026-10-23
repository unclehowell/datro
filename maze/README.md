# The Disclosure Labyrinth — maze.bucklerfamily.estate

A genuine date-scaled branching maze for the Great House Farm disclosure case. The route progresses down a calendar axis; branches extend to either side. Month boundaries are horizontal rules and faint dotted horizontal rules mark weeks.

## Snapshot
- Source roadmap snapshot: **2026-10-20**.
- **47** institutional roadmaps; **474** route steps; **776** indexed correspondence entries; **39** attachment/artifact markers.

## Route model
- Historic message nodes follow their source dates. The gap between dates determines the vertical distance. Where possible, a reply branches to the later outgoing email matched by thread; unmatched responses stay visibly unresolved to the present frontier.
- Each institution has its own options from the source roadmap. Its open, queued, pending and overdue routes fork beyond today's line; estimated future lengths are visual aids rather than asserted deadlines.
- The conditional gate at the future horizon separates possible outcomes: artifact/document located, authoritative link found, in-person viewing, documented destruction, or still missing.
- CSV export records messages and applicable future route steps. Review checkmarks are local to the browser and are not sent to HubSpot or a central service.

## Symbols and evidence discipline
📜 indexed attachment/document marker; 🔗 answered-item marker; 🧐 in-person inspection; 💨 “not held” / missing lead; 🔥 affirmative destruction documentation only; ⛔ refusal; £ paid route; ↗ referral/alternate custodian.

The Leckwith in-person inspection marker is based on the requester's statement but has no verified visit date or linked catalogue/item reference in this email index. It is kept as an undated checkpoint at the present frontier, not assigned an invented historic date. An attachment marker is not proof the item is the sought deed. “Not held” is not “destroyed”; absence never automatically produces a fire icon. The current snapshot does not pre-classify any historical record as definitively destroyed.

This is a research/completeness aid, not legal advice, a finding of fraud, or a rule that every conceivable process must be exhausted before a claim. Institutions have different duties and remedies; routes may be alternatives, time-limited, costly, subject to standing or unavailable. Verify original records and current deadlines independently.

## Deploy
The dedicated Cloudflare Worker serves `maze.bucklerfamily.estate/*`. `/health` exposes only source dates/counts. Refresh `roadmaps.json`, run `node build.mjs`, and deploy via `npx wrangler deploy --config wrangler.toml`.
