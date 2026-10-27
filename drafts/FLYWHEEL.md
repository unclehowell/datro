# FLYWHEEL.md — taking turns on email drafts (any agent)

> **Effective operating rules — protocol v3.8.0 proposal (25 Oct 2026). These rules govern the workflow. Older protocol text below is historical and must not override them.**

> **Runner liveness (v3.7.0):** each active agent must maintain one real recurring check-in in its own harness, titled exactly `Hive check-in — <agent name>`. Target five minutes if that harness supports it; otherwise use the shortest interval it actually saves. ChatGPT's harness supports daily, so do not describe this seat as running every five minutes. The Watch cron monitors only; it does not invoke LLMs. `RUNNERS.json` records evidence-backed schedule observations, not seat authority. Check the live roster on every run and never claim a schedule for another seat without direct, current confirmation.
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
> **Gmail and sending:** only Tab (dealer) may create one in-thread Gmail draft, only after the frozen version is DEFINITELY READY TO SEND and every gate passes. All other seats must never create Gmail drafts. Drafting and redrafting happen only in the HubSpot task, where every seat checks and improves the email first; the Gmail draft is the last step, a copy of the final gated body. No agent sends email; Sion alone sends.
>
> **Turn completion:** append exactly one changelog line with reviewer, exact version, local time/time zone, primary sources actually checked (or “idle-skip only”), changes, rejected proposals/reasons, unresolved issues and verdict; keep earlier entries. Sync BOARD.json and the relevant BATON.md with metadata only, including `version_reviews`, `version_distinct_agents`, `version_agents`, `seat_agreements_version`, `final_three_hat_version`, `attachments_verified_version`, `sent_version`, `last_action_at`, `last_action_by`, `queue_after`, and accurate `pct`. Set verification fields only after actually checking the relevant facts. A verified Gmail draft is 100% to Gmail drafts; verified sent/archived remains 100%. HubSpot wins over stale board/baton fields.
>
> **Cadence truth:** the Hive/Watch Cloudflare cron monitors; it does not itself invoke agents. Each available run should advance one permitted turn (or perform one skip/route action), then stop.

**TRIGGER CLASSIFICATION — SETUP VS WORK (v3.8.0 proposal):** Classify the owner’s message first. SETUP is “join hive.bucklerfamily.estate” (including WhatsApp) and follows the approval-first scheduling rule below. WORK is “Hive check-in”, “hive check in”, “Hive pass”, or a prefilled link such as https://claude.ai/new?q=Hive%20check-in. WORK means execute one pass now, not configure a scheduler: read /join.json, /hive.json, /hive.md, the live ROSTER.json and BOARD.json, and the relevant BATON; do ONE material review or ONE permitted queue/skip action; then stop and report briefly. Do not ask for schedule approval, discuss cadence, or report NOT CONFIGURED for WORK. If a correct enabled recurring task already exists, run the same pass on demand without changing its schedule. For SETUP, read the live files and inspect the current harness. Reuse one correct enabled task if it exists; otherwise ask the owner to ACCEPT or REJECT the exact task, prompt and actual supported cadence before creating/changing it. Never create duplicates or claim a schedule before verification. If scheduling is unsupported, report execution seat MANUAL and cadence owner-triggered, propose https://claude.ai/new?q=Hive%20check-in as a manually triggered reminder, and log that cadence honestly without pretending a cron exists. ROSTER.json remains the sole seat authority; after a schedule is verified, update only your own RUNNERS.json observation, while other seats remain UNVERIFIED unless directly confirmed.

**Each recurring run:** fetch `/hive.json` and the live roster; identify only this agent’s active turn; re-fetch its current HubSpot task; observe the no-touch rule; execute one meaningful review or queue action; update the internal changelog and metadata board/baton. If no assigned turn exists, check the stale/queued board and take only a permitted dispatch action or wait. Never bulk-scan the entire CRM, create parallel assignments to the same agent, or fabricate a review. Honour the connected harness’s rate limits. Only Tab creates the single in-thread Gmail draft after the exact-version gate; Sion alone sends.

**Scheduling truth (v3.8.0 proposal):** Watch’s five-minute cron is only the monitor. It does not call reviewer agents. A recurring task in each agent’s own harness is what wakes that agent automatically. Report only the cadence actually saved. If the harness cannot schedule, use MANUAL / owner-triggered, suggest the prefilled reminder link, and log the cadence as owner-triggered; never fake a cron. WORK is always on-demand and needs no scheduler.

## Dispatcher action (any active seat)
When the board shows many drafts stuck on legacy `[OTHER AGENT'S TURN]` for >30 min:
1. Re-prefix 1–3 of the oldest idle drafts to distinct active seats (Claude, ChatGPT, Grok, Tab).
2. Append a single skip line: “skipped <previous> (idle) — TURN <next>”.
3. Do not change recipient-facing text on a pure routing turn.
This is how multiple bees light at once and drafts reach Gmail faster without race conditions.

## Legacy protocol sections
( retained for history; where they conflict with the effective rules above, the rules above control )

See earlier versions in git history for full three-hat, arsenal, and promotion-pyramid detail.
