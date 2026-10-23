# Disclosure Labyrinth — maze.bucklerfamily.estate

An animated institutional disclosure-route map based on the Dartboard branch data.

## Snapshot
- Source roadmap snapshot: **2026-10-20** (coverage varies by feed).
- **47** institution-specific roadmaps; **474** tailored route steps; **776** indexed correspondence entries; **39** attachment/artifact markers.

## Contents
- `roadmaps.json`: scrubbed, self-contained source-data export built from `src/data/ramps.json`, `src/data/avenues.ts` and `src/data/correspondence.json` in the Dartboard branch.
- `worker.template.js`: app template with a replaceable data marker.
- `worker.js`: generated Worker bundle served on the subdomain.
- `build.mjs`: regenerate the bundle after refreshing `roadmaps.json`.
- `wrangler.toml`: Cloudflare route configuration.

## Meaning of the map
The global overview contains one mini-map per institution; each individual map includes the body-specific road-map steps and the messages mapped to those steps. The animated explorer traverses main routes and side branches. Green means a response or artifact marker is available to inspect. Amber means sent/acknowledged/indexed correspondence without an artifact marker. Red means refusal, “not held”, or institution-specific unresolved/overdue thread and creates an investigation spur. Blue indicates a route not recorded as used; purple a queued/drafted path; grey a route recorded as unavailable/not applicable.

**Red is not proof of destruction, deceit or concealment.** “Not held” is not the same as “destroyed”. Follow up by checking the precise question, search scope, repositories, custodians, transfer history, retention schedule and disposal authority. Green is not a judicial finding that a disputed proposition is true. Subjects are scrubbed and individual contact details are not copied into this app; messages link to the Email Archive or reference lookup.

This is a casework completeness aid, not legal advice and not a rule that every route is mandatory, cumulative or a prerequisite to a fraud claim. Routes differ by body; some are alternatives, costly, time-limited or unavailable. Verify current law, deadlines, standing and procedure against the original records before acting.

Review marks are stored in local browser storage only. Export produces a CSV working checklist; marks are not synced to the server.

## Deploy
Run `node build.mjs`, then `npx wrangler deploy --config wrangler.toml`. The live Worker has a privacy-minimal `/health` endpoint that reports snapshot/counts only.
