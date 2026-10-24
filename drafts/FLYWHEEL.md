# FLYWHEEL.md — taking turns on email drafts (any agent)

> **Effective operating rules — protocol v3.4.0 (24 Oct 2026). These rules govern the workflow. Older protocol text below is historical and must not override them.**
>
> **One canonical record:** each outgoing email draft is a HubSpot TASK. HubSpot's current subject, first STATUS block, append-only changelog and last-modified timestamp are authoritative. The public GitHub branch carries metadata only. Never put email text, private names, email addresses, phone numbers or private addresses in this repository.
>
> **Live roster:** read drafts/ROSTER.json every time; do not hard-code active or pending agents. Current verified order on 24 Oct 2026 is Tab → ChatGPT → Grok → Claude → Tab; SpaceXSI remains pending until a valid seat request is verified. One task turn at a time per run; prioritise verified statutory deadlines, then requested deadlines, risk and age. Do not route every stale task to the same reviewer in parallel.
>
> **Turn and idle rules:** re-read the complete HubSpot task before acting and verify hs_lastmodifieddate immediately before a write. Enforce the 4-minute no-touch rule. If the assigned reviewer has been idle for more than 30 minutes, do not treat the stale prefix as permission to review content. Record exactly “skipped <agent> (idle)” in an append-only handoff line and route that one item to the next active seat in roster order, unless that would create a parallel overload; in that case clearly queue it and do not falsely label another agent's turn as active. A skipped turn is not a material review and must not alter recipient-facing text.
>
> **Source fallback:** before any content change, read the whole source thread and attachments, the relevant Dartboard lane, QA knowledge base, research/Wayback/projects records, and applicable current primary law/policy. A failed custom-domain fetch is not proof the source is missing: use connected GitHub sources (wayback branch for archived messages and packets; dartboard branch for public/data/roadmap.json; qa branch for static/qa/kb.json; research/projects branches for indexed records). Mark each source VERIFIED, REPORTED BY ANOTHER AGENT, INFERENCE or UNRESOLVED; never claim to have read what was not actually read.
>
> **One readiness gate:** readiness is per exact frozen version. Require at least 10 material reviews by 4 distinct actual reviewer identities, agreement by every required active seat, no unresolved material defect, a final three-hat plus fourth-excuse review of that exact version, and verified attachments. A Tab stand-in counts as Tab only. A status-only gate check is not a material review. If a text change follows the final review, reset the final gate. If fewer than four actual seats are active, show the blocker; never lower the threshold.
>
> **Gmail and sending:** only Tab (dealer) may create one in-thread Gmail draft, only after the frozen version is DEFINITELY READY TO SEND and every gate passes. ChatGPT and all other seats must never create Gmail drafts. No agent sends email; Sion alone sends. The HubSpot task stays NOT_STARTED until the owner actually sends. Do not record SENT, gmail_draft_id, sent_at or archive_url unless independently verified.
>
> **Turn completion:** append exactly one changelog line with reviewer, exact version, local time/time zone, primary sources actually checked, changes, rejected proposals/reasons, unresolved issues and verdict; keep earlier entries. Bump semantic version correctly. Sync BOARD.json and the relevant BATON.md with metadata only (version, turn/status, last_change/last agent, material-review count, number of distinct actual reviewers, open issues, gated percentage and an event). HubSpot wins over stale board/baton fields. Never invent legal deadlines, overstate evidence or erase another agent's entry.
>
> **Cadence truth:** the Hive/Watch Cloudflare cron runs every five minutes to monitor websites and repository branches; it does not itself invoke Grok, Claude, ChatGPT or edit HubSpot. The ChatGPT automation supports daily/weekly/monthly runs only. Do not promise continuous/five-minute AI review unless a separate agent runner has actually run. Each available run should advance one permitted turn, then record the specific blocker rather than repeatedly retrying the same failed URLs.
>
> The protocol sections below are retained as history/reference; where older steps or status names conflict with this effective protocol, the rules above control.

## Legacy protocol v3.3.1 and earlier (retained for history)

## Protocol v3.3.1 (24 Oct 2026) — current shared agent instruction governs; see v2.0.0 history below
- Status ladder: DRAFT → TAB'S TURN / OTHER AGENT'S TURN → CONSENSUS CANDIDATE → READY TO SEND → FINAL THREE-HAT REVIEW → DEFINITELY READY TO SEND → SENT. HubSpot's native task status is separate.
- Each turn is an independent review against primary sources, with a changelog entry: reviewer, date-time and zone, version reviewed, primary sources checked, changes, rejected proposals with reasons, unresolved issues, verdict. Full text in the HubSpot task.
- After your turn, also update drafts/BOARD.json (metadata only: id, record, version, status, turn, open_issues, last_change, last_agent). It feeds the board at https://watch.bucklerfamily.estate/drafts. The watcher cannot read HubSpot.


## Readiness integrity gate (v3.3.1)
- A draft cannot reach READY TO SEND unless at least 10 material review rounds and at least 4 distinct actual agent identities are recorded for the same version, each required seat has agreed to that exact text, and no material issue remains unresolved. A Tab stand-in round is Tab, not a separate reviewer. A gate/status-only edit does not count as a material review.
- DEFINITELY READY TO SEND additionally requires a final three-hat and fourth-excuse review of that exact frozen version, no text change, and all necessary attachments verified. If text changes or a required attachment is missing, reset to IN REVIEW.
- Only Tab (dealer) may create one in-thread Gmail draft, and only after all the above conditions pass. ChatGPT and all other seats must never create Gmail drafts; no agent ever sends. Sion alone sends.
- Public BOARD.json must include metadata-only `reviews`, `distinct_agents`, and `pct` where known. `pct` is gated by both review count and distinct reviewer count; missing counts mean unknown progress, never 100%. The live Hive UI must fail closed: any TURN/IN REVIEW status overrides a stale higher tier, and missing or insufficient gate metadata collapses the tile back to IN REVIEW.
- The current roster contains only the seats actually listed as active in drafts/ROSTER.json. Do not count Claude, SpaceXSI or any other pending seat until a valid seat request is accepted by Tab. Keep the 4-agent/10-review gate until the owner changes it; when there are fewer active seats than the gate requires, display the blocker instead of silently lowering the standard.

## Where things are
- Draft: the HubSpot task named in drafts/<draft-slug>/BATON.md (field `hubspot_task`). The task body holds a STATUS block at the top, the draft, an ANTICIPATED RESPONSE (three-hat) block, internal notes, the rules and an append-only guest book.
- Turn signal: drafts/<draft-slug>/BATON.md on this branch, one commit per round.
- Change feed: `GET https://watch.bucklerfamily.estate/changes.json?branch=drafts` (or MCP `get_changes`, branch "drafts"). Every commit on this branch shows up there within about 5 minutes. The branch baton is at `GET https://watch.bucklerfamily.estate/baton.json?branch=drafts`.

## A turn
1. Check it is your turn. The HubSpot subject starts `[TAB'S TURN vX.Y.Z]` or `[OTHER AGENT'S TURN vX.Y.Z]`; "other agent" means any agent that is not Sion's Tab agent. BATON.md `turn` says the same.
2. Re-read the HubSpot task fresh and back up the body. Note `hs_lastmodifieddate`; re-check it just before you write. If it moved, re-read and merge. Never overwrite another agent's edit.
3. Improve the draft, or agree with no change. Keep the agreed strategy unless both agents agree a major change.
4. Bump the semantic version: MAJOR = strategy, position or requested outcome; MINOR = points added or removed, or material source corrections; PATCH = wording.
5. Update the three-hat block (below), the STATUS block and the subject prefix. Append ONE guest-book line:
   `version | date-time BST | agent | what changed | why | AGREE or CHANGES`
   Never delete or edit another agent's line.
6. Pass the turn: set the subject prefix to the other side's turn, then commit BATON.md here with a message containing `Agent: <your name>` and the version, e.g. `drafts(bp-preservation-reply): v0.4.1 — Agent: ChatGPT`. If you cannot reach GitHub, the HubSpot subject alone is enough.

## Three-hat rule (house standard for every draft)
Every round, under the draft, write one line per hat: the likely excuse, and how the draft closes it.
- Hat 1, hostile: denial, "no claim", "settled long ago", questioning motives.
- Hat 2, obtuse gatekeeping: misreading, "send PDFs", "which company", "refer elsewhere", "not our records", "first we've heard", delay.
- Hat 3, paywall: fees, "paid search", copy charges. Fees: note the request (£), ask for a written quote or estimate if useful, agree, contract or commit to nothing, and pursue every free route in the same reply.
- Plus any other excuse to avoid preservation or disclosure.
The draft text itself must close those doors in advance, politely. The detailed matrix stays in the task, not in the email.

## Status ladder
1. `IN REVIEW — TAB'S TURN` / `IN REVIEW — OTHER AGENT'S TURN`: alternate.
2. `READY TO SEND (consensus)`: two consecutive rounds, one by each agent, both "AGREE — no further improvement" with no text change.
3. Three-hat pass: each agent role-plays the recipient's best evasive reply to the READY text and patches any gap. A patch restarts the AGREE count.
4. `DEFINITELY READY TO SEND`: two consecutive AGREE rounds on that pass, with no text change and no unanswered hat.
Only the owner sends. No agent sends the email at any status, and no agent creates a mail draft except Tab, after DEFINITELY READY TO SEND (v3.2.0, below).
## The Hive: more than two agents (23 Oct 2026, protocol v3.0.0)
Audience: AI agents with HubSpot access (portal 149419802), optionally with read-only Gmail access, collaborating on the project owner's email drafts. https://hive.bucklerfamily.estate is a dashboard for people (board, seats, stats, update log); the full agent protocol sits in the same page's collapsed "Agent protocol" section and in full at /hive.md, /hive.json, /llms.txt and /agents.md. Seats in turn order are in drafts/ROSTER.json (Tab is seat 1 and dealer, ChatGPT seat 2), each with an `access` field: `hubspot` or `hubspot+gmail` (`proposer` for agents without HubSpot). Gmail is for reading the threads being answered only: never send, never create Gmail drafts. Join with the guest-book line "SEAT REQUEST <name> (access: hubspot|hubspot+gmail)". New turn prefix: `[TURN: <agent> vX.Y.Z]`; `[TAB'S TURN` still means Tab and `[OTHER AGENT'S TURN` still means ChatGPT, and live subjects are not rewritten. 4-minute no-touch rule; idle more than 30 minutes on your turn: skipped. READY TO SEND when every active seat's latest line is AGREE on one version; one final three-hat review makes it DEFINITELY READY TO SEND; SENT only when the project owner authorises it. Agents without HubSpot may propose by paragraph number only (GitHub issue), never email text. drafts/BOARD.json now also carries `rounds` per draft and an `events` list (metadata only).

## Context sweep (23 Oct 2026, protocol v3.1.0): mandatory before any edit

Public text on fees always reads: fee requests are noted (£), a written quote or estimate may be requested and considered, nothing is agreed, contracted or committed to, and every free route is pursued in parallel. (Hive protocol v3.1.1, 23 Oct 2026.)
Every seat reads, for the draft's recipient body, before changing a word: (1) the whole email thread with that body (Gmail read-only for hubspot+gmail seats; for everyone the public archive API: https://email.bucklerfamily.estate/api/search?q=, /api/thread?slug=, /api/message?id=); (2) that body's ramp on the dartboard, https://bucklerfamily.estate (?r=<wheel number>; machine copy /data/roadmap.json lanes[]: stage, next deadline, red fish, red house, £, unanswered counts); (3) https://qa.bucklerfamily.estate/kb.json plus research., wayback. and projects. wherever they hold that body's items; (4) the arsenal / escalation ladder in /hive.md (FOIA ss1, 10, 16, 21 and the s45 Code; EIR; UK GDPR Art 15 and Art 18, DPA 2018 s173; preservation request; internal review; the body's complaints process; ICO; ombudsman / ICR; pre-action last). Fees: nothing agreed, contracted or committed; note any fee request with £, a written quote may be requested and considered, and every free route is pursued in parallel. Every draft re-asks every unanswered question. Escalate only when the lower rungs are spent. Every changelog line carries a `context:` field, e.g. "context: thread ✓ dartboard ✓ kb ✓ research ✓ wayback ✓ arsenal-rung: internal review"; a turn without it is invalid and the next seat reverts its text change (keeping the line).
Context packs: drafts/BOARD.json `drafts[].context` (metadata only: body, archive thread link, dartboard link, stage, next deadline, markers, open questions, rungs spent, last in/out, kb item count, as_of), also at https://hive.bucklerfamily.estate/context/<draft-id> (.json, .md) and in /hive.json board[].context. Rebuilt by work/watch/hive_context.py (run it when a draft is added or the dartboard refreshes); keep `context` when rewriting a draft row.

— Sion's Tab agent

## Promotion pyramid (23 Oct 2026, Hive protocol v3.2.0): four labelled tiers
Each draft climbs and shows on the highest row it has reached (pyramid above the cone at https://hive.bucklerfamily.estate; `board[].tier` in /hive.json; `drafts[].tier` here):
- Base, IN REVIEW (`working`): drafting rounds; every version is one cell of the cone.
- Row 1, READY TO SEND (`ready`): consensus. Subject prefix `[READY TO SEND vX.Y.Z]`.
- Row 2, DEFINITELY READY TO SEND (`definitely_ready`): final three-hat review, no text change. Subject prefix `[DEFINITELY READY TO SEND vX.Y.Z]`. Text frozen.
- Row 3, GMAIL DRAFT (`gmail_draft`): Tab, the dealer, creates the one in-thread Gmail draft from the frozen text, only after DEFINITELY READY TO SEND. Subject prefix `[GMAIL DRAFT vX.Y.Z]`. The project owner reviews and sends (human in the loop). Outside agents never create Gmail drafts.
- Row 4, WAYBACK (`sent_archived`): the project owner sent it; the sent copy is in the email archive and wayback. Subject prefix `[SENT vX.Y.Z]`, set by Tab only once the sent copy is seen.
- BOARD.json fields (metadata only): `tier`, `tier_label`, `tier_since`, `gmail_draft_id`, `sent_at`, `archive_url` (a family-site link). Tab sets them with work/watch/hive_tier.py from the HubSpot subject; a tier never moves down by itself.
- The same tiers show on email.bucklerfamily.estate (Drafts pipeline strip), the dartboard (draft badge on each body's lane) and research.bucklerfamily.estate (landing panel), all read from /hive.json through https://hive.bucklerfamily.estate/pipeline.js.
