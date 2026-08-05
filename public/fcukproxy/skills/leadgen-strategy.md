# Skill: Lead-Gen Campaign Chain
A reusable procedure that produces qualified leads without asking the LLM to
invent the whole pipeline each time. Follow these steps in order.

1. **Audience build** — identify the target persona from the Target URL and 2–3
   concrete segments (age, role, pain point, platform).
2. **Asset** — draft one original asset per iteration: short-form post, DM
   opener, landing copy, or referral ask. Anchor every claim to the target's
   homepage value prop; never invent numbers.
3. **Captured lead** — the qualifying event: a form fill, a reply, a referral,
   or a documented engagement. Record `source` as the platform + format
   (e.g. `x-post-dm`).
4. **Report** — call `/api/proxy/lead` with order_id, source, and the node's
   machine_id. Leads land as `pending`; payout is credited by the server-side
   verify step. One lead per captured event, not per asset.
5. **Save output** — write the full asset to the iteration file; keep only a
   one-line summary + a `what worked` line for node memory.