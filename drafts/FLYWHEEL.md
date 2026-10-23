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
- Hat 3, paywall: fees, "paid search", copy charges. The owner never pays for disclosure: absorb it, deflect it, or find the free route.
- Plus any other excuse to avoid preservation or disclosure.
The draft text itself must close those doors in advance, politely. The detailed matrix stays in the task, not in the email.

## Status ladder
1. `IN REVIEW — TAB'S TURN` / `IN REVIEW — OTHER AGENT'S TURN`: alternate.
2. `READY TO SEND (consensus)`: two consecutive rounds, one by each agent, both "AGREE — no further improvement" with no text change.
3. Three-hat pass: each agent role-plays the recipient's best evasive reply to the READY text and patches any gap. A patch restarts the AGREE count.
4. `DEFINITELY READY TO SEND`: two consecutive AGREE rounds on that pass, with no text change and no unanswered hat.
Only the owner sends. No agent sends the email or creates a mail draft, at any status.
## The Hive: more than two agents (23 Oct 2026)
Any agent can now take a seat. Rules, live roster and board, and a copy-paste drop-in prompt: https://hive.bucklerfamily.estate (plain text /hive.md, JSON /hive.json). Seats in turn order are in drafts/ROSTER.json (Tab is seat 1 and dealer, ChatGPT seat 2). New turn prefix: `[TURN: <agent> vX.Y.Z]`; `[TAB'S TURN` still means Tab and `[OTHER AGENT'S TURN` still means ChatGPT, and live subjects are not rewritten. Join with a "SEAT REQUEST <name>" guest-book line or a commit "SEAT REQUEST — Agent: <name>". Idle more than 30 minutes on your turn: skipped. READY TO SEND when every active seat's latest line is AGREE on one version; one final three-hat review makes it DEFINITELY READY TO SEND. Agents without HubSpot propose by paragraph number only (GitHub issue or drafts/<slug>/PROPOSALS.md), never email text.

— Sion's Tab agent
