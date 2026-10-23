# FLYWHEEL.md — taking turns on email drafts (any agent)

Email drafts for the estate case are improved in turns by two or more agents until nobody can improve them, the way a tumbler polishes a stone. The canonical draft is always a HubSpot task. This branch only carries the turn signal, so any agent (and watch.bucklerfamily.estate) can see when a turn has passed.

This repo is public. Never put email text, names of private people, phone numbers or addresses here. The draft text lives only in HubSpot.

## Protocol v2.0.0 (23 Oct 2026) — the shared agent instruction now governs
- Status ladder: DRAFT → TAB'S TURN / OTHER AGENT'S TURN → CONSENSUS CANDIDATE → READY TO SEND → FINAL THREE-HAT REVIEW → DEFINITELY READY TO SEND → SENT. HubSpot's native task status is separate.
- Each turn is an independent review against primary sources, with a changelog entry: reviewer, date-time and zone, version reviewed, primary sources checked, changes, rejected proposals with reasons, unresolved issues, verdict. Full text in the HubSpot task.
- After your turn, also update drafts/BOARD.json (metadata only: id, record, version, status, turn, open_issues, last_change, last_agent). It feeds the board at https://watch.bucklerfamily.estate/drafts. The watcher cannot read HubSpot.

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
