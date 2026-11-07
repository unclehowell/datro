# Changelog

## [0.7.0] - 2026-11-07

### Changed
- **£ on the board:** the fee mark on the dartboard cells is now the pound symbol (£), as on the Ladder · rungs view; it was drawn as "$". Same cells as before: every board cell whose replies quoted a fee or would only search or copy on payment already carried the mark (checked 7 Nov 2026 against each reply's own text). The cell details read "£ Fees sought or mentioned".

### Added
- **🌰 That Old Chestnut links:** a 🌰 on a cell whose matter has an entry in That Old Chestnut (bucklerfamily.estate/that-old-chestnut/); it links to that exact entry, and the cell details list every matching entry. A later disclosure is shown with 😮, bold, in a vibrant colour. Matches are by the entry's own evidence id, reply date or question thread only (src/data/chestnuts.json); entries with no matching cell get no 🌰. Where a cell has both marks, £ sits on the inner half and 🌰 on the outer half.

## [0.6.0] - 2026-11-03

### Added
- **Institution from the address:** `?inst=<id>` or `#inst=<id>` preselects that institution in the institution dropdown (`#avenue-inst`) and the views that follow it, then scrolls to the dropdown; names like `museum-wales`, `glamorgan-archives`, `vale-of-glamorgan-council`, `worldcat` and `archive-org` are accepted too. Without JavaScript the same link lands on the dropdown (`#avenue-inst`). Used by the #dartboard links on Peekaboo, e.g. `/dartboard/?inst=cadw#avenue-inst`.
- **Three institutions** added to the list in its own format, for the Peekaboo records they concern: Internet Archive (the catalogue description of its copy of Newman, Glamorgan, 1995), OCLC / WorldCat (record 33858574 carries the same description) and Historic England (reply of 21 Oct 2026, then the 2018 transfer letter on 27 Oct 2026).

## [0.5.2] - 2026-11-02

### Fixed
- **Every recipient's climb checked against the case mail to 2 Nov 2026:** 91 exchanges missing from the Rungs & dates climb are now on their rungs. 60 are drawn (requests, replies, refusals, not-held answers, and receipts that log a request under a reference); 31 automatic replies and delivery notices are kept in the record and not drawn. Seven replies that had been hidden as bare receipts are shown again because they carry substance.
- **Heneb (formerly GGAT):** the climb now shows 32 exchanges from 20 May to 2 Nov 2026 (it showed 20): the first request of 20 May; the 22 May answer that Heneb does not treat itself as subject to FOI, as a limited company; the preservation notices of 29 May and 28 Sep; the 24 Oct question about the Archwilio record pages; the 24 and 29 Oct follow-ups; the complaint receipts of 29 and 30 Sep; and the 28 Oct response to the complaint outcome. HER access and the complaint are now marked answered. The EIR rung records the 2 Nov answers (not held; the further names and the 1983 fire / Roman villa searches not rerun). A new rung, Reconsideration (EIR reg 11), was asked on 2 Nov 2026 (answer due 30 Dec 2026), together with a request for the PRN 02038s file and the three Archwilio files. The Archwilio rung notes that three record files for PRN 02038s downloaded on 24 Oct and return "No such file" on 2 Nov. The Route map's Heneb ladder carries the same rung states.
- **Mail after the 0.5.1 refresh:** the Vale scrutiny reply, the Northern Ireland Office receipt for 26FOI 135 (answer due 30 Nov), the Land Registry subject access exchange (D260928) and an Archaeology Data Service reply are on their rungs.
- **Kept current:** each daily refresh now places new case mail on the right rung of the climb, so it no longer stops at the last hand update.

## [0.5.1] - 2026-11-02

### Changed
- **Mail brought up to 2 November 2026:** the Rungs & dates tab and the Route map now include the case mail received up to 2 Nov 2026 (it stopped at 31 Oct). New replies: three from the Heneb Historic Environment Record (2 Nov: not held in the HER; requests to search further names declined as research), one from the Northern Ireland Office on 26FOI 103 (2 Nov: points to its review of 26 Oct), and new recipients Historic Buildings & Places (2 Nov: no records held), the Health and Safety Executive (request of 2 Nov, receipt the same day) and SPAB (enquiry of 2 Nov). Automatic receipts are kept in the record and not shown. Rungs & dates is still the default tab.

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
