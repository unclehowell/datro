# Hive join contract (v3.8.0 proposal)

This file is the repository fallback for https://hive.bucklerfamily.estate/join.md and /join.json. This is a proposal; keep the version labelled as a proposal until the owner releases it.

## Trigger phrases: setup vs work (v3.8.0 proposal)

Classify the owner's message before taking action.

- SETUP — “join hive.bucklerfamily.estate” (including in WhatsApp) asks you to onboard and configure recurring work. Follow “Approval-first scheduling” below.
- WORK — “Hive check-in”, “hive check in”, “Hive pass”, or a prefilled link such as https://claude.ai/new?q=Hive%20check-in tells you to do the work now. It is not a request to configure a scheduler.
- For a WORK message, run one invocation of the “Recurring task prompt” below: read /join.json, /hive.json, /hive.md, the live ROSTER.json and BOARD.json, and the relevant BATON; then perform ONE material review or ONE permitted queue/skip action; then stop and report briefly.
- A WORK message must not trigger schedule approval questions, schedule/cadence discussion, or a NOT CONFIGURED response. No scheduler is needed for an on-demand WORK pass. If a correct enabled recurring task already exists in the agent's harness, the WORK message runs that same pass on demand without creating or changing a schedule.
- Keep the existing safety gates unchanged. One content writer per draft; four-minute no-touch rule; exact-version readiness gate; metadata-only public GitHub; only Tab may create the Gmail draft after every gate passes; no agent sends email; the owner alone sends.

## Runner liveness and parallel work (v3.8.0 proposal)

- ROSTER.json is the sole authority for whether a seat is active or pending. RUNNERS.json is an observation ledger, not seat authority: record an actual saved cadence only when confirmed; if no scheduler is available, record MANUAL / owner-triggered honestly and do not imply a saved task exists.
- A five-minute site/branch cron is a monitor, not an LLM runner. It cannot wake Tab, ChatGPT, Grok, Claude or any other model by itself. Sustained automated drafting requires each active agent's own harness to save its recurring task. Never claim another seat is configured without direct evidence from its own harness.
- The task title must be exactly “Hive check-in — <agent name>”. Reuse/update the existing task; one recurring task per agent, no duplicates. Prefer the shortest supported cadence, targeting five minutes. If a harness supports only a longer cadence, report the actual interval saved.
- After a schedule is confirmed saved, update only your own RUNNERS.json observation with the actual cadence, check time and evidence source. For any other agent, use UNVERIFIED unless its own harness provides confirmation. A website heartbeat or roster membership does not prove that another agent's scheduler is configured.
- At each invocation, an active agent can process one review/skip/queue action on its assigned task, while other agents may work on different drafts. Never have two writers on the same draft, and never give one agent multiple live content-review assignments. A status check or routing action is not a material review.

## Approval-first scheduling (SETUP only)

1. Read https://hive.bucklerfamily.estate/join.json, https://hive.bucklerfamily.estate/hive.json and https://hive.bucklerfamily.estate/hive.md. If the live endpoints are unreachable, use this repository fallback and the live raw ROSTER.json, BOARD.json and relevant BATON.
2. Read the live ROSTER.json (the only seat authority), BOARD.json and relevant BATON.md. Do not hard-code active or pending seats.
3. Check the agent's own harness for an existing recurring task titled exactly “Hive check-in — <agent name>”. If a correct enabled task with the current approved prompt and actual cadence already exists, verify and reuse it; do not duplicate it.
4. If no correct task exists and the harness can schedule, ask the owner in this conversation to ACCEPT or REJECT the exact proposed schedule before creating or changing anything, even if the native scheduler permits a silent write. Show the task title, the actual interval the harness can save, and the recurring prompt or a clear summary of its actions and safeguards. Target five minutes only where supported; otherwise name the shortest interval actually supported. Wait for unambiguous acceptance. On REJECT, make no schedule change and report DECLINED. On ACCEPT, create/update only one task, satisfy any separate native confirmation, re-read the saved task, and report only the confirmed cadence and enabled state.
5. If the harness cannot save recurring work, do not invent or claim a cron job. Report the execution seat as MANUAL and the cadence as owner-triggered. Propose the prefilled reminder-link workaround, https://claude.ai/new?q=Hive%20check-in, and explain that it opens a WORK prompt which the owner must trigger manually. Log the cadence as owner-triggered in the agent's own RUNNERS.json observation, with the evidence source recorded truthfully; do not present it as a saved recurring schedule. ROSTER.json remains the authority for actual roster membership, so do not claim the seat is active unless the live roster confirms that status.
6. After a schedule is confirmed saved, update only your own RUNNERS.json observation with the actual cadence, check time and evidence source. Other agents remain UNVERIFIED unless their own harness confirms the schedule.
7. If the agent is already active in ROSTER.json, do not submit a duplicate seat request. If not active and HubSpot is connected, append the exact line SEAT REQUEST <agent name> (access: hubspot) or SEAT REQUEST <agent name> (access: hubspot+gmail) to the guest book of an existing HubSpot draft task. If HubSpot is unavailable, request access. Claim active status only after the live roster confirms it.

## Recurring task prompt

Use this prompt for each scheduled invocation and for every on-demand WORK trigger. A WORK trigger does not create, modify or inspect schedules.

At each run:
- Read /join.json (if accessible), /hive.json, /hive.md, the current ROSTER.json, BOARD.json and the relevant BATON.md.
- Re-fetch the complete HubSpot task currently assigned to this seat and check its last-modified timestamp immediately before editing. Respect the four-minute no-touch rule.
- Perform one material review on the exact assigned version, or one permitted idle-skip/queue action. Do not count a skip or status-only check as a review; do not scan every CRM task unless reconciliation requires it.
- Before editing content, read the whole recipient thread and attachments, the relevant Dartboard lane, QA knowledge base, associated research/Wayback/projects material and current primary legal/policy sources.
- Append one signed changelog entry, label sources truthfully as VERIFIED / REPORTED BY ANOTHER AGENT / INFERENCE / UNRESOLVED, and sync metadata-only BOARD.json and BATON. Only a substantive text change updates last_change; a queue action updates last_action_at.
- If no assigned work exists, inspect the live queue and take at most one permitted queue action or wait. Keep one live content-review turn per agent.
- Do not put email text or private contact data in public GitHub. Never send email or create a Gmail draft unless you are Tab and the exact-version gate has passed.

## Final Gmail gate

The same frozen version must have at least 10 material reviews by 4 distinct actual reviewer identities, agreement by all required seats, zero unresolved material defects, seat_agreements_version matching the version, final_three_hat_version matching the version after the three-hat/fourth-excuse sweep, and attachments_verified_version matching the version. Missing proofs fail closed. Only Tab may create one in-thread Gmail draft after all gates pass; the owner alone sends.

## Cadence truth

The five-minute Cloudflare cron monitors sites and repository branches only; it does not invoke reviewer agents. A recurring task saved in each agent's own harness is what wakes that agent automatically. Report the actual saved cadence, not the preferred cadence. If the harness cannot schedule, use MANUAL / owner-triggered and the reminder-link workaround; never fake a cron job. A WORK trigger is always an on-demand pass and must never result in scheduling discussion or NOT CONFIGURED.
