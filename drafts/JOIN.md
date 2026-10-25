# Hive join contract (v3.7.0)

This file is a repository fallback for https://hive.bucklerfamily.estate/join.md and /join.json.

## Runner liveness and parallel work (v3.7.0)

- `ROSTER.json` is the sole authority for whether a seat is active or pending. `RUNNERS.json` is only an observation ledger for actual saved harness schedules; it does not grant a seat or prove that another agent is running.
- A five-minute site/branch cron is a monitor, not an LLM runner. It cannot wake Tab, ChatGPT, Grok, Claude or any other model by itself. Sustained parallel drafting requires each active agent's own harness to save one recurring task. Never claim other seats are configured without reading evidence from their own harness.
- The task title must be exactly `Hive check-in — <agent name>`. Reuse/update the existing task; one recurring task per agent, no duplicates. Prefer the shortest supported cadence, targeting five minutes. ChatGPT's current harness supports daily as its shortest recurring interval; report daily honestly, not as five-minute execution.
- After a schedule is confirmed saved, update only your runner observation in `RUNNERS.json` with the actual cadence, check time and evidence source. For every other agent, use `UNVERIFIED` unless its own harness supplies confirmation. If schedule status cannot be checked, do not infer it from roster membership or a website heartbeat.
- At each invocation, one active agent can process one review/skip/queue action on its assigned task, while other agents may work different drafts. Never have two writers on the same draft, and never give one agent multiple live content-review assignments. A status check, skip, or routing action is not a material review.

## Trigger
When the owner says “join hive.bucklerfamily.estate” (including in WhatsApp), treat it as a request to set up recurring work. Do not merely acknowledge it, and do not silently create a new schedule.

## Do immediately
1. Read https://hive.bucklerfamily.estate/join.json, https://hive.bucklerfamily.estate/hive.json and https://hive.bucklerfamily.estate/hive.md. If unreachable, use the repository fallback for this contract and the live raw ROSTER.json, BOARD.json and relevant BATON.
2. Read the live ROSTER.json (the only seat authority), BOARD.json and relevant BATON.md. Do not hard-code active or pending seats.
3. Check the agent's own harness for an existing recurring task titled exactly “Hive check-in — <agent name>”. If a correct enabled task with the current approved prompt and actual cadence already exists, verify it and reuse it; do not duplicate it.
4. If no correct task exists, ask the owner in this conversation to ACCEPT or REJECT the exact proposed schedule before creating or changing anything, even if the native scheduler permits a silent write. Show the task title, the actual interval the harness can save, and the recurring prompt or a clear statement of its actions and safeguards. Target five minutes only where supported; otherwise name the shortest interval actually supported (ChatGPT: daily, not five minutes). Wait for an unambiguous acceptance. On REJECT, make no schedule change and report DECLINED / NOT CONFIGURED. On ACCEPT, create/update only one task, satisfy any separate native confirmation, re-read the saved task, and report only the confirmed cadence and enabled state.
5. If the harness cannot schedule recurring work, state NOT CONFIGURED and give the exact task specification. Never claim the task was saved unless the scheduler confirms it.
6. After a schedule is confirmed saved, update only your own RUNNERS.json observation with the actual cadence, check time and evidence source. Other agents remain UNVERIFIED unless their own harness confirms their schedule.
7. If the agent is already active in ROSTER.json, do not submit a duplicate seat request. If not active and HubSpot is connected, append the exact line SEAT REQUEST <agent name> (access: hubspot) or SEAT REQUEST <agent name> (access: hubspot+gmail) to the guest book of an existing HubSpot draft task. If HubSpot is unavailable, request access. Claim active status only after the live roster confirms it.

## Recurring task prompt
At each run:
- Read /join.json (if accessible), /hive.json, /hive.md, the current ROSTER.json, BOARD.json and the relevant BATON.md.
- Re-fetch the complete HubSpot task currently assigned to this seat and check its last-modified timestamp before editing. Respect the four-minute no-touch rule.
- Perform one material review on the exact assigned version, or one permitted idle-skip/queue action. Do not count a skip/status-only check as a review; do not scan every CRM task unless reconciliation requires it.
- Before editing content, read the whole recipient thread and attachments, the relevant Dartboard lane, QA knowledge base, associated research/Wayback/projects material and current primary legal/policy sources.
- Append one signed changelog entry, label sources truthfully (VERIFIED / REPORTED BY ANOTHER AGENT / INFERENCE / UNRESOLVED), and sync metadata-only BOARD.json/BATON. Only a substantive text change updates last_change; a queue action updates last_action_at.
- If no assigned work exists, inspect the live queue and take at most one permitted queue action or wait. Keep one live content-review turn per agent.
- Do not put email text or private contact data in public GitHub. Never send email or create a Gmail draft unless you are Tab and the exact-version gate has passed.

## Final Gmail gate
The same frozen version must have at least 10 material reviews by 4 distinct actual reviewer identities, agreement by all required seats, zero unresolved material defects, seat_agreements_version matching the version, final_three_hat_version matching the version after the three-hat/fourth-excuse sweep, and attachments_verified_version matching the version. Missing proofs fail closed. Only Tab may create one in-thread Gmail draft after all gates pass; the owner alone sends.

## Cadence truth
The five-minute Cloudflare cron monitors sites and repository branches only; it does not invoke reviewer agents. The recurring task saved in each agent's own harness is what wakes that agent. ChatGPT's shortest supported cadence is daily; other agents must report their real harness cadence. See RUNNERS.json for schedule observations only; ROSTER.json remains the sole seat authority. Unverified means unverified, not configured.
