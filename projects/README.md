# Great House Farm / Tŷ Mawr Programme — PRINCE2 7

Branch `projects` of `unclehowell/datro`. Published at https://projects.bucklerfamily.estate/ by Cloudflare Pages project `bucklerfamily-projects` (build command: `node projects/check.mjs`; output directory: `projects/public`).

## Programme structure — 22 October 2026

The current planning structure has **three active projects** and **one conditional standby project**:

- **P1 — Tŷ Mawr replica museum in Argentina:** source-led interpretation, reconstruction design and feasibility/business case. No Argentine site has been selected, acquired or approved; construction/opening is not underway.
- **P2 — Wales records, evidence and witness recovery:** urgent preservation, FOI/EIR and archive routes, land/planning/heritage/court records, witness accounts, verification and reconciliation.
- **P3 — Llandough Parcel A augmented-reality heritage tour:** spatial/source-confidence model, guided route, historic wireframes and an AR-capable prototype. No accepted AR model, working prototype or field pilot is recorded.
- **P4 — Case reopening / legal remedy:** conditional standby only. It is not initiated unless preserved primary-source material, material relevance, independent written legal advice and written Executive authorisation pass a defined gate.

P1 and P3 may start bounded research/concept work from existing material while P2 proceeds. P2 supports both through controlled source changes; it is not a blanket precondition. Artefact/object census is a P1 work package with P2 provenance interfaces, not a fourth active project.

## Canonical programme products

- `/` — master PID and live dashboard.
- `/programme-mandate/` — master mandate and brief.
- `/programme-plan/` — master stage, milestone, dependency and work-package plan.
- `/programme-highlight-report/` — current master highlight report.
- `/portfolio-directory/` — reader-facing directory of the public estate sites.
- `/p1-argentina-museum/` — P1 mandate, milestone → work-package → task plan and highlight report.
- `/workstreams/evidence-recovery/` — P2 recovery brief, task hierarchy and highlight report.
- `/p3-ar-heritage-tour/` — P3 mandate, milestone → work-package → task plan and highlight report.
- `/p4-case-reopening-gate/` — P4 standby conditions and activation gate.
- `/data/programme.json` — machine-readable project, milestone, work-package, task and status baseline.
- `/data/site-directory.json` — machine-readable reader-facing site directory.
- `/data/pm-dashboard.json` — detailed inherited disclosure/correspondence task snapshot.

## Progress-measure rules

P1/P3 display 17% as 2/12 completed tasks in small, provisional start-up baselines. This is **not** an end-to-end museum or AR delivery percentage: museum construction/opening and working AR delivery remain 0% at this stage. P2 displays 19% (169/893) from the inherited task ledger snapshot at 22 October 2026 15:42 UTC (44 in progress, 645 not started, 35 blocked); the denominator covers disclosure/correspondence and is not a percentage of all evidence recovered. Preservation and witness tasks need reconciliation into an approved full-scope denominator. No overall programme percentage is calculated until baseline scope and weighting are approved. P4 is N/A, not 0%, because it has not been initiated.

## PRINCE2 approach and deployment safeguards

The master layer coordinates but does not replace project-specific PRINCE2 7 controls: business cases, product descriptions, stage plans, risk/issue/quality/lessons/decision/change registers, highlight and end-stage reports, explicit gate decisions and acceptance evidence. Work is structured as milestone → work package → task. Each work package must state owner, product, task IDs, acceptance tests, tolerances and dependencies. Publishing this plan is not spending, land, construction, disclosure or legal-filing authority. Independent Project Assurance is currently an identified gap.

The site build runs `projects/estate/build.mjs` and `projects/theme/apply.mjs`; `projects/check.mjs` runs the build transformations and checks required pages, personal details and restricted public wording. Keep historic snapshots and source records versioned; do not silently replace the older single-project PID pack.

## Rights and status

© Williams–Buckler family. All rights reserved. This content and original code are not open source. You may read, link to and quote it fairly with credit. Other copying, adaptation or commercial use needs a written licence. Terms: https://bucklerfamily.estate/licence/ · Enquiries: https://bucklerfamily.estate/enquire/. Third-party components retain their own licences.

The case remains prospective. No court finding is implied and the site is not legal advice.
