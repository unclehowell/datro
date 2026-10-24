# FLYWHEEL.md — taking turns on email drafts (any agent)

> **Effective operating rules — protocol v3.5.0 (24 Oct 2026). These rules govern the workflow. Older protocol text below is historical and must not override them.**
>
> **One canonical record:** each outgoing email draft is a HubSpot TASK. HubSpot's current subject, first STATUS block, append-only changelog and last-modified timestamp are authoritative. The public GitHub branch carries metadata only. Never put email text, private names, email addresses, phone numbers or private addresses in this repository.
>
> **Live roster:** read drafts/ROSTER.json every time; do not hard-code active or pending agents. Check whether the agent is already active before requesting a seat; an active agent must reuse its seat and must not append a duplicate request.
>
> **Parallelism (v3.4.1):** One writer per *draft*, many drafts in parallel. Idle >30 min on any `[OTHER AGENT'S TURN]` or named turn → any active seat may record “skipped <agent> (idle)” and re-prefix that one draft to the next active seat in roster order (or the least-loaded seat). Do this deliberately so that at any moment 3–5 drafts have distinct live turns (one per active seat). Do not route every stale task to the same reviewer. Do not review content on a pure skip/routing turn; leave material review to the newly named seat.
>
> **Turn and idle rules:** re-read the complete HubSpot task before acting and verify hs_lastmodifieddate immediately before a write. Enforce the 4-minute no-touch rule. A skipped turn is not a material review and must not alter recipient-facing text.
>
> **Source fallback:** before any *content* change, read the whole source thread and attachments, the relevant Dartboard lane, QA knowledge base, research/Wayback/projects records, and applicable current primary law/policy. Mark each source VERIFIED, REPORTED BY ANOTHER AGENT, INFERENCE or UNRESOLVED.
>
> **One readiness gate:** readiness is per exact frozen version. Require at least 10 material reviews by 4 distinct actual reviewer identities, `open_issues=0`, and `seat_agreements_version` exactly equal to `version`. DEFINITELY READY additionally requires `final_three_hat_version` and `attachments_verified_version` exactly equal to `version` after the final three-hat plus fourth-excuse review and attachment verification. GMAIL DRAFT requires a verified `gmail_draft_id`; WAYBACK requires verified `sent_at`, `archive_url`, and `sent_version` equal to `version`. Missing or mismatched fields fail closed. Historical `reviews` and `distinct_agents` are informational only and never satisfy the current-version gate. Never lower the threshold.
>
> **Gmail and sending:** only Tab (dealer) may create one in-thread Gmail draft, only after the frozen version is DEFINITELY READY TO SEND and every gate passes. All other seats must never create Gmail drafts. No agent sends email; Sion alone sends.
>
> **Turn completion:** append exactly one changelog line with reviewer, exact version, local time/time zone, primary sources actually checked (or “idle-skip only”), changes, rejected proposals/reasons, unresolved issues and verdict; keep earlier entries. Sync BOARD.json and the relevant BATON.md with metadata only, including `version_reviews`, `version_distinct_agents`, `version_agents`, `seat_agreements_version`, `final_three_hat_version`, `attachments_verified_version`, `sent_version`, `last_action_at`, `last_action_by`, `queue_after`, and accurate `pct`. Set verification fields only after actually checking the relevant facts. A verified Gmail draft is 100% to Gmail drafts; verified sent/archived remains 100%. HubSpot wins over stale board/baton fields.
>
> **Cadence truth:** the Hive/Watch Cloudflare cron monitors; it does not itself invoke agents. Each available run should advance one permitted turn (or perform one skip/route action), then stop.

**JOIN TRIGGER — REQUIRED, NOT A GREETING (v3.5.1):** When the owner says “join hive.bucklerfamily.estate” (including in WhatsApp), treat it as an instruction to onboard the agent and establish recurring work. Immediately read `https://hive.bucklerfamily.estate/join.json`, `/hive.json` and `/hive.md`. In the agent’s own harness, create or update one recurring task called `Hive check-in — <agent name>`; target every 5 minutes (`*/5 * * * *`) if supported, otherwise use the shortest supported recurring interval. If creating a schedule requires owner approval, present the actual task/schedule/prompt and ask for that approval now. If this harness exposes no scheduler, say it cannot be saved here and give the owner the exact task spec rather than claiming success. Check for an existing schedule first and update it; do not create duplicates. Before requesting a seat, read the live ROSTER.json; if the agent is already active, do not append another request. If it is not active and HubSpot is connected, append the standard SEAT REQUEST line to an existing task's guest book; otherwise request owner approval for access. Do not claim joined until the schedule is actually saved and the agent is active in ROSTER.json. A seat request alone does not prove schedule creation.

**Each recurring run:** fetch `/hive.json` and the live roster; identify only this agent’s active turn; re-fetch its current HubSpot task; observe the no-touch rule; execute one meaningful review or queue action; update the internal changelog and metadata board/baton. If no assigned turn exists, check the stale/queued board and take only a permitted dispatch action or wait. Never bulk-scan the entire CRM, create parallel assignments to the same agent, or fabricate a review. Honour the connected harness’s rate limits. Only Tab creates the single in-thread Gmail draft after the exact-version gate; Sion alone sends.

**Scheduling truth:** Watch’s five-minute cron is only the monitor. It does not call reviewer agents. The recurring task in each agent’s own harness is what causes that agent to wake up and check Hive. The target interval is best-effort; report the interval actually saved.

## Dispatcher action (any active seat)
When the board shows many drafts stuck on legacy `[OTHER AGENT'S TURN]` for >30 min:
1. Re-prefix 1–3 of the oldest idle drafts to distinct active seats (Claude, ChatGPT, Grok, Tab).
2. Append a single skip line: “skipped <previous> (idle) — TURN <next>”.
3. Do not change recipient-facing text on a pure routing turn.
This is how multiple bees light at once and drafts reach Gmail faster without race conditions.

## Legacy protocol sections
( retained for history; where they conflict with the effective rules above, the rules above control )

See earlier versions in git history for full three-hat, arsenal, and promotion-pyramid detail.
