# Changelog — research mirror

## [0.3.3] - 2026-10-25

### Changed
- Site-wide "ingredients, not conclusions" wording at source: interpretation entries I-01 (now dated steps with evidence ids), W-01 (the two records side by side, then the hypothesis) and S-01 (records on the land's later use, then the hypothesis) reworded; "Our reading:" lines are now labelled "Working hypothesis:"; the theme "Three synthetic Parcel A versions" is now "Three versions of Parcel A" with "synthetic" credited to the family's frame. Landing transit-map labels "REJECTED permissive occupancy ploy" and "clandestine registration" now read "permissive-occupancy step, rejected by the family" and "registration (source pending)" (same wording as Cedwyn's ingredients.json). Record text unchanged. — Sion's Tab agent

## [0.3.2] - 2026-10-25

### Added
- `/timeline/thousand-cuts/` v2.1.0: "Competing theories, most plausible first" after the four closing lists: five theories, each labelled as a theory with evidence for, evidence against and what would confirm or refute it; the courts' view is ranked with the rest. — Sion's Tab agent

## [0.3.1] - 2026-10-25

### Changed
- `/timeline/thousand-cuts/` v2.0.0 under the editorial rule "ingredients, not conclusions": the drawn pyramid map, the fill-in layer icons, the apex/layer framing, the spine and the closing verdict are removed. Each entry now gives date, event, a neutral cited line on what it changed in law or in fact, label, evidence links, depends-on/enabled cross-links and any open question. The closing lists what the record shows was decided, what was never decided, what the courts found against the family, and open questions. The /timeline/ link text is neutral.
- Interpretation sections are headed "Interpretation: working hypotheses"; the intro states none is a finding. Entries unchanged. — Sion's Tab agent


## [0.3.0] - 2026-10-25

### Added
- `/timeline/thousand-cuts/` (`src/thousand-cuts.js`, served from STATIC_PAGES): "1000 Cuts", a dated chronology of 39 events (plus one background step) that lowered the Williams family's standing in law from 1916 to the 7 Dec 1988 demolition, opening with the family's peak (7 items). Each cut links to its evidence page, states the blow, carries a label (record, family testimony, our reading, not yet confirmed) and its dependencies, in 9 layers (the pyramid). Closes with our reading (rights diminished, ownership never decided or extinguished), what would confirm it and what cuts against it. Linked from `/timeline/`. The same data is a layer in the Cedwyn catalogue database. — Sion's Tab agent

## [0.2.0] - 2026-10-25

### Added
- Interpretation layer on catalogued evidence pages (`src/interpretation.js`): 36 entries (inference, theory, readings that cut against the case, and discarded theories with the reason) shown in a separate "Interpretation" section after the record text on 137 pages (86 EV pages, 51 evidence-library pages). The imported record text is not changed. Each entry names what it rests on and what would confirm or refute it.
- `src/interpretation.test.mjs`: guard that every entry is labelled, sourced and testable and that the public wording rules hold.

## [0.1.1] - 2026-10-24

### Fixed
- Reject GraphQL `pages`, `posts` and `contentItems` list queries that request any status other than `publish`. Previously a public request could select draft/private/pending/future rows by setting `status:`.
- Keep single-page and JSON endpoints restricted to published content.

### Tests
- Add regression assertions for the GraphQL status guard and published-only filters; run `npm test` from `research/`.

### Deployment note
- This commit updates source code only. The Cloudflare Worker `research-wp` was not redeployed or live-smoke-tested here, and the mirror migration remains incomplete. Keep the original WordPress source online until the published-page and media inventories are reconciled.
