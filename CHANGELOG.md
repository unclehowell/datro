# Changelog

## [0.5.0] - 2026-11-02

### Changed
- **Rungs & dates is one tab, and the default:** the old Rungs and Dates tabs are merged into a single tab, "Rungs & dates", which is now the view a visitor lands on. It shows the chosen recipient's rungs (the climb, with its legend) and, below it, the same recipient's dated steps to court; both follow the recipient picked on the dartboard or in either picker. Nothing was removed from either view. Tabs are now Rungs & dates · Route map. Old links `#ladder`, `#roadmap`, `#rungs` and `#dates` open the merged tab; `#route` opens the route map.

## [0.4.0] - 2026-11-02

### Added
- **Route map (now the first view):** one Donkey Kong ladder per recipient (55 recipients, 900 rungs), bottom rung first, from the preservation notice to court disclosure, with full disclosure at the top. Each ladder is the complete worst-case sequence of routes the law and the body's own published policies allow, insisted on whatever the body tells us our options are. It is not limited to the options named in their replies.
- Each rung shows its status (used, waiting on them, overdue, next, still to climb, not available), dates, due dates and day gaps, and why the rung exists. It also gives the legal source with a link, the statutory clock (and whose clock it is), who decides, when to climb on, what to cite, the evidence the rung leaves, and the body's own policy page.
- Markers from the correspondence (240 substantive replies read): 🌰 old chestnut (122: not held, out of scope, refused, sent elsewhere, found later; linked to That Old Chestnut where it holds the record), 📜 pointer to the body's own policy or "if you are not satisfied" (47), 😮 disclosure (47), and 🛢 obstacles (exemptions, fees, late or missing answers).
- Per recipient: where it stands, the next rung and the next step up with dates, and the routes their replies have never mentioned.
- Rights reserved: disclosure received at any stage is accepted without prejudice and is not accepted as settlement of any question of earlier concealment; all rights are reserved.
- Works with no JavaScript (server-rendered rung list for the chosen recipient, and every recipient's list in a no-script block). Readable at 390 px.
- Machine-readable: /data/ladders.json (index, phases and clocks) with /data/ladders-part-1.json and -2.json, and WebMCP tools `dartboard_route(recipient)` and `dartboard_recipients()` (fallback `window.__dartboardMCP.run`).

### Changed
- View tabs are now Route map · Rungs · Dates. `#ladder` and `#roadmap` still open the older views.

## [0.3.0] - 2026-11-02

### Changed
- New address: the Dartboard now lives at https://bucklerfamily.estate/dartboard/ (the site's one-address-per-webapp rule: bucklerfamily.estate/<webapp>/). dartboard.bucklerfamily.estate no longer shows the app; every page on it answers 301 to the same path under bucklerfamily.estate/dartboard/, so old links keep working. The app itself is unchanged; the site build still reads it from this branch.

## [0.2.0] - 2026-11-02

### Added
- Disclosures stand out in the Disclosure record: every request whose outcome is Disclosed or Partly disclosed shows a 😮 on its square, and its detail panel opens with a large 😮 and the request title in bold on a bright pink highlight. Data-driven from the outcome class (`disc: true` in `CLASS`), so new disclosures get it automatically; the site's inverted day view keeps the same pink.

## [0.1.0] - 2026-10-24

### Improved
- Add a consistent, high-contrast `:focus-visible` outline for links, buttons and form controls to make keyboard navigation easier to track.
- Respect the existing dark/brass design tokens; no case data or FOI statuses changed.

### Reviewed
- Read the static styles and public-record workflow documentation. Dynamic data correctness requires running the app and its existing tests in the deployment environment; this CSS-only change was not represented as a full runtime test.
