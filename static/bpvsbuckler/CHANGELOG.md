# Changelog

## [bpvsbuckler-v0.0.0.52] - 2026-10-06

The story retold as a narrated film.

### Content
- Narration rewritten as a film script: present tense, the most plausible account the evidence supports, told plainly instead of in the wiki's catalogue voice. The theme is the title chain, the family, and how the house was taken: the 1877 split, the 1928 last rent, the "whole farm" wording, the papers taken from the blanket box, the possession orders, BP's registration of the house while Mary lived in it, the courts deciding possession but never ownership, the demolition, the thousand graves, and the silence since
- "The family's case" notes folded into the narration
- Acts retitled: The Great House, The Bargain, The House Is Theirs, The Papers Vanish, BP, Possession Not Ownership, Bulldozed Before Breakfast, Built Over, The Silence, Today
- 129 scenes tightened to 99: administrative and side-site scenes merged into the scenes they belong to, keeping every evidence link; every old scene id still redirects. Scene references after VI.2 change as a result (e.g. "Bulldozed before breakfast" is now VI.11)
- Epilogue rebuilt as a build-up to today: who holds the land, the register and the dead; the village history that leaves the Great House out; no inquiry, no apology, no reparation; what the family ask for
- Opening page, Storyboard and Cast introductions rewritten to match

## [bpvsbuckler-v0.0.0.51] - 2026-10-06

Evidence-link repair. Story wording, scene order, scene ids, evidence titles and catalogue references are unchanged.

### Fixed
- Cadw survey photographs of the farmhouse and barn, 29 July 1988 (ATISN 27021), in VI.5 and VIII.6: `archaeology/#cadw-1988` no longer exists; now link to the ATISN 27021 response entry (GHF-E106-R37) in the FOI & Public-Authority Reply Register, `records-access-chronology/foi-reply-register/#R37`
- Mary Williams — 1965 offer (III.11): `mary-williams/#offer-1965` no longer exists; now links to the Chronology section of the Mary Williams page, `mary-williams/#chronology`, which holds the 2 March 1965 entry
- The Williams / Buckler Family (P.5, II.10, III.12, III.14, IV.17, VII.14): the page's sections no longer carry anchors, so `#origins`, `#william` and `#rumoured-sale` are removed and these entries link to `williams-buckler-family/`

## [bpvsbuckler-v0.0.0.50] - 2026-10-06

Re-release as a documentary storyboard.

### Content
- Rebuilt the story as 129 scenes in a prologue, eight acts and an epilogue, each with a scene reference (e.g. VI.12), a short title, place, parcel (A, B, both, unknown), basis (document, court record, newspaper, Mary's statement, family account…) and the family's case
- Every scene in the wiki's Master Timeline is covered; added the 13 February 2026 Land Registry holding reply, the 18–19 September 2026 letters to Stephen Doughty MP and the 20 September 2026 Heneb records request
- Newspaper cuttings (N07–N16 and the South Wales Echo extracts N15-01 to N15-16) are now evidence on the scene they report, instead of 23 separate scenes that retold the same events; duplicate scenes on the medieval pottery, the armour find and the HER record merged
- Removed events that belong to Llandough near Cowbridge (Walsh 1100, Herbert 1444, Carne 1536, Talbot 1677) or to Piercefield (Morris 1770, Wood 1794), and others with no source (Tewkesbury 1215, Dissolution 1539, Bute–Pembroke 1552, Lambert Williams, Bute–Plymouth exchange, 1880 names); replaced with sourced entries (NLW Bute D 219 leases 1552–1829, Bute rentals R1 1818–21)
- Narration rewritten in the present tense without drafting notes; contested points moved into "The family's case"; the 1876 note no longer calls the quarry bargain "oral"
- Every scene now has at least one specific evidence link (previously 17 had none)
- Old event ids redirect to the merged scene

### Design
- New player: photo or cutting beside the scene, readable evidence list with thumbnails, cast and parcel tags, "Copy reference" for citing, act-segmented scene bar, keyboard controls, narration that highlights as it reads
- New Storyboard and Cast views; new printable script at /story/ (/script.html now redirects there)
- Splash with the 1988 Cadw photograph of the farmhouse; correct release label
- Cadw photographs and press cuttings added under /media/
- Removed the development Tailwind CDN and placeholder social links; donation buttons moved to the opening page

## [bpvsbuckler-v0.0.0.49] - 2026-10-06

### Added
- 149 chronological events taken from the Great House Farm Wiki evidence catalogue, in strict date order; the player starts at the first event (c. AD 650) and stops at the end
- `?event=<id>` and `?year=<year>` deep links
- New `/story/` page with schema.org JSON-LD
- New `/story/transcript.txt` narration transcript
- Regenerated `/api/timeline.json`, `/llms.txt` and `sitemap.xml`
- Deploy workflow now builds the exports and ships `story/`
- Editorial/forensic chronology expanded from 149 to 172 events, including the 1949 and 1965 tenancy strands as explicit evidential pivots
- Added discrete dated entries for the South Wales Echo N15-01 to N15-16 search extracts and the 17 April 1980 Neath Guardian context report
- Narrator slides now expose small links back to the Great House Farm Wiki Evidence Library, Press Articles Index, and event-specific Wiki evidence pages

## [bpvsbuckler-v0.0.0.48] - 2026-10-05

### Added
- Every dated event in the Great House Farm Wiki's Master Timeline (greathousefarmwiki.wordpress.com/timeline/) is now in the site timeline: 111 -> 132 scenes. New: c.650 St Dochdwy's early monastery (family account); 11 Nov 1891 geese theft court report; 23 Feb 1905 Bute conveyance; Frederick Buckler's birth (1910-11); 15 May 1924 agreement; eldest son's birth (c.1937-40); the c.1940 limitation contention (marked as a family contention); William (Billy) Buckler's birth (c.1948-49); 10 Oct 1952 agents' letter; 29 Mar 1961 deed; eldest son's household leaving (1968-69); 16 Jun 1970 village green VG41; 25 Jul 1972 housing permission; 13 Mar 1983 GGAT warehouse fire (Roman villa finds, separate site); 10 Oct 1989 Oakview sale (WA513690); 8 Feb 1990 GGAT Appendix B missing from the planning file; 10 Nov 1994 woodland to Forest of Cardiff (WA735527); 1995-96 South Wales Electricity rights and Persimmon correspondence; 22 Dec 2005 woodland division; 2025-26 records requests; 3 Oct 2026 press transcription
- Each new scene cites the Master Timeline and the wiki page it links to; existing scenes are unchanged
- scripts/build-timeline-exports.mjs rebuilds api/timeline.json and llms.txt from the timeline data

### Fixed
- The opening slide is found by year (1897) instead of a fixed index, so added events no longer shift it

### Note
- Release numbered 0.0.0.48 to follow the latest published tag (bpvsbuckler-v0.0.0.47); the 0.0.0.10-0.0.0.11 changelog entries of 3 Oct were not tagged


## [bpvsbuckler-v0.0.0.11] - 2026-10-03

### Fixed
- Dates corrected from the transcribed press cuttings (Press Archive, GHF-E090-N01 to N15, on the Great House Farm Wiki): the chainsaw stand-off was on 29 April 1988, not 29 November; the "1977" open day was 15 April 1974 (Daily Telegraph, 16 April 1974); the Rees "Grievous loss" letter is marked year-unclear
- 1988: the April stand-off, Alun Michael MP (12 May), the forced entry of 30 November, the interim injunction, the 5 December hearing before Judge Norman Francis and the 4am demolition of 6 December now follow the press reports; each scene cites its transcript
- 1989: charges, bail, guilty plea (23 March), site clearance (20 March) and "From farm to a bus" dated and sourced; duplicate clearance scene removed (112 -> 111 scenes)
- Splash events, llms.txt and api/timeline.json regenerated


## [bpvsbuckler-v0.0.0.10] - 2026-10-03

### Changed
- Timeline brought in line with the Great House Farm Wiki (greathousefarmwiki.wordpress.com): 99 -> 112 scenes
- Corrected: Mary Williams born 10 Aug 1913 and married 1936; 1938 Bute reversion to WGR replaces the unrecorded 1926 "Penarth Estate Company" sale; 1955 High Court order and 1962 Cardiff County Court order; 1986 High Court judgment dated 10 July (Hollis J); 1978-79 Roman villa marked as a separate site; 1994 excavation is an early-medieval cemetery (1,026 burials); "armour" find given its Museum Wales provenance (Church Farm, 1858)
- Added: 1877 Daniel Thomas sale and the two parcels, 1877 Bute lease, 1908, 1928, 1944, 1950-52 papers taken, 1963 committal, 1965 offer, 1967, 1977 open day, 1982 GGAT warning, 1987 amalgamation, 1988 House of Lords and first eviction attempt, 1989 ECHR decision and planning, 1990 evaluation, 1992, 1993, 2019, 2026 campaign
- Removed scenes with no supporting record: 1978 and 1980 hearings, 1986 demolition application, Roman villa scenes, 2024 duplicate
- Challenges reworded as family contentions, per the Wiki's evidence standard
- Splash key events, llms.txt and api/timeline.json regenerated

### Added
- GitHub Actions deploy to the bpvsbuckler Cloudflare Pages project on every push


## [bpvsbuckler-v0.0.0.09] - 2026-06-01

### Added
- **Slide Media Icons** — Every timeline slide now has 5 tiny icon buttons (Docs, Video, Audio, URL, Info) beneath the narration text, ready for future WayBack file-explorer modal integration sourced from wayback.datro.xyz

### Removed
- **Social Media Login** — Removed Google, Facebook, and X (Twitter) login modal ("Access Evidence" / "Please login") and all related social authentication code
- **Padlock Icon** — Removed the padlock/lock icon from the footer evidence section
- **Social Media Links** — Removed Facebook, Instagram, and X icon links from the copyright footer

### Changed
- Version bumped to bpvsbuckler-v0.0.0.09

## [bpvsbuckler-v0.0.0.05] - 2026-05-22

### Fixed
- - fix: remove console.log from 3 files
- - fix: remove console.log from 3 files
- - fix: remove console.log from 3 files
-

## [bpvsbuckler-v0.0.0.04] - 2026-05-22

### Fixed
- fix: 3 bugs [fix 1: fix: remove console.log from 3 files] [fix 2: fix: remove console.log from 3 files] [fix 3: fix: remove console.log from 3 files]

## [bpvsbuckler-v0.0.0.05] - 2026-05-21

### Fixed
- fix: remove console.log from ./static/archives/canvas/assets/js/app-iframesafe.js

It's expected that developers log all changes to this branch in this CHANGELOG.md file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [bpvsbuckler-v0.0.0.08] - 2026-05-30

### Added
- **HER Facts Distributed Chronologically** — 8 new standalone timeline slides drawn from GGAT02038s, each at its correct year:
  - 1215: Medieval pottery sherds and ironwork confirming early occupation
  - 1560: Vaughan family tenure begins (chief freehold farmers mid C16th)
  - 1800: Bute Estate acquires freehold; manorial courts held at Great House
  - 1880: Medieval ironwork ("armour") found under rear wing floor
  - 1974: House surveyed in unusual circumstances by H.J.T. (access blocked by ownership dispute)
  - 1988: HER independently confirms demolition "suddenly and completely" on 6 December
  - 1988: Post-demolition findings (fireplace jamb, lost stone capital, ogee-stopped beam)
  - 1990: HER record PRN 02038s compiled with 7 related archaeological events (1990–2013)
- **Agent-Friendly API** — `/api/timeline.json` endpoint returns all 87 entries as structured JSON with metadata, summary, and key events for AI/LLM consumption
- **LLMs.txt** — `/llms.txt` serves the full timeline in plain text following the llms.txt standard, optimized for ChatGPT and similar agents
- **Robots.txt + Sitemap** — `/robots.txt` allows all agents; `/sitemap.xml` lists every timeline year for search engine crawling
- **Auto-generation Pipeline** — `content/generate-api.js` regenerates all agent files from data.json; integrated into `content/rebuild.py` so API/LLM/sitemap update automatically on rebuild

### Changed
- Version bumped to bpvsbuckler-v0.0.0.08
- Removed standalone 2023 HER dump entry (facts now distributed to their correct years)
- Existing timeline entries unchanged — no facts appended to existing slides

## [bpvsbuckler-v0.2.0.07] - 2026-05-29

### Added
- **HER Record Integrated into Timeline** — GGAT02038s HER record entry (2023) added directly to the React SPA's slide chronology (`a1` array), covering:
  - Confirmed demolition by BP Properties Ltd on 6 Dec 1988
  - C12th-C14th pottery sherds confirming medieval occupation
  - Medieval ironwork at National Museum of Wales (Vaughan tenure from mid C16th)
  - Bute Estate acquisition early C19th
  - RCAHMW Inventory and 7 related archaeological events (1990–2013)
- **Content Extraction System** — `content/data.json` + `content/rebuild.py`: all timeline, splash, and claim content externalised from the JS bundle. Future updates: edit `data.json`, run `python3 content/rebuild.py`.
- **Beurcracy Nav Link** — Reliable MutationObserver injects Beurcracy into the React nav alongside Home, Script, Reparations.

### Changed
- Version bumped to bpvsbuckler-v0.2.0.07.
- `index.html`: consolidated MutationObserver scripts, removed stale HER Record nav link (content now integrated).

## [bpvsbuckler-v0.2.0.06] - 2026-05-29

### Added
- **HER Record GGAT02038s** — Official Glamorgan-Gwent HER record for Great House Farm retrieved from Heneb (Archwilio). Independently confirms demolition by BP Properties Ltd on 6 December 1988, medieval origins (C12th-C14th pottery), Vaughan family tenure from mid C16th, Bute Estate acquisition early C19th, and medieval ironwork at National Museum of Wales.
- **HER Research File** — `research/her-record-ggat02038s.txt` with full HER record transcription, related events table, and significance analysis for the BP vs Buckler case.
- **Timeline Slide: 6 Dec 1988 — HER Record** — `static/timeline/1988-her-record-demolition.html` self-contained timeline entry documenting the HER record with full narrative, timeline, and significance analysis.
- **Evidence Entry** — HER record added to `evidence/data.json` under 1988 with links to original Archwilio record and research analysis.
- **Cards added to index.html and research/index.html** linking to the new HER research file and timeline slide.

### Changed
- Version bumped to bpvsbuckler-v0.2.0.06.

---

## [bpvsbuckler-v0.2.0.05] - 2026-05-17

### Added
- **Evidence Data Hub** — Comprehensive evidence data spanning 1667–2026 with detailed entries for key events (Marconi experiments, forced tenancy, identity fraud, Land Registry circular logic, state-sanctioned deed erasure, court judgment contradictions, armed eviction/demolition).
- **Evidence Modal System** — JavaScript modal overlay for browsing evidence entries by year, with gallery display for linked evidence (emails, documents, images).
- **Senedd Email Correspondence** — 30 email .eml files documenting 2026 communications with Senedd members (Heledd Fychan MS, Leticia Gonzalez MS, Joe Martin MS, Eleri Griffiths) regarding the Great House Farm dispossession case.
- **Email Fetch Script** — `fetch-emails.py` utility to pull BP vs Buckler / Great House Farm emails from Gmail and update data.json with evidence references to wayback.datro.xyz.

### Changed
- `evidence/data.json` expanded from a single 1987 entry to 15 year-groupings (1667–2026) with full subject, content, and evidence reference arrays.
- Evidence modal dark/gold theme integrated with existing site design.

---

## [bpvsbuckler-v0.2.0.03] - 2026-05-16

### Changed
- Homepage UI: Added the timeline video as the first element (hero section) for immediate visibility.
- Timeline Narrative: Extensively corrected the Great House Farm timeline to accurately reflect the Williams/Buckler family's superior title claim, their refusal to pay rent, and the systematic "Death of a Thousand Cuts" (DoaTC) lawfare used against them.
- Version bumped to bpvsbuckler-v0.2.0.03.

---

## [bpvsbuckler-v0.2.0.02] - 2026-05-15

### Added
- **Timeline XMB experience** — Full PS3 XMB-style interactive timeline with video background, narration audio (startup.mp3, nav.mp3), play button, animated clock, and 19 menu entries (Home, Games, Music, Photos, Videos, Settings + submenus)
- **Static timeline entries** — 34 chronological HTML entries from 1100s medieval monastery through 1994 cemetery excavation, with data-driven launch page
- **Great House Farm Research section**:
  - BP v Buckler Rundown (333 lines) — full chronological title history with 10 discrepancy notes
  - Estate Gap Analysis (140 lines) — documentation gaps by record series, two-Llandoughs problem, fee simple question, research to-do list
  - FOI Requests — 6 letters to NLW, Glamorgan RO, National Archives, Vale Council, Cadw, HM Land Registry
  - Research Hub — HTML navigation portal with links to all documents
- **Reparations section** — Land Registry WA231076, Senedd engagement, legal strategy, highlight report
- **Scripts section** — Build/deploy documentation for website, library, Cloudflare Pages, and image processing
- Wayback archive (20+ documents, multiple video files)

### Changed
- Version bumped to bpvsbuckler-v0.2.0.01
- Custom domain: bpvsbuckler.datro.xyz
- Site served from Cloudflare Pages at `https://*.bpvsbuckler.pages.dev`

### Fixed
- CSS path in timeline/index.html (scss/main.css → main.css)
- Large video files (>25MB) excluded from Cloudflare Pages build
- All timeline assets (images, audio, SCSS, JS) properly linked

---

## [financecheque-v0.1.0.05] - 2026-05-04

### Added
- Migrated UI files from ui branch to static/financecheque/ui and public/ui
- Updated iframe references from ui.financecheque.uk to /ui
- Migrated PirateClaw files to static/financecheque/pirateclaw/ and public/pirateclaw/
- Updated PirateClaw install script to point to financecheque.uk/pirateclaw/website/
- curl -fsSL https://financecheque.uk/pirateclaw/website/install.sh | sh now works

### Changed
- PirateClaw branch changed from pirateclaw to financecheque for installation

---

## [financecheque-v0.1.0.04] - 2026-05-02

### Added
- Real user registration with Cloudflare D1 database
- User login with JWT authentication (using jose - Cloudflare compatible)
- Password reset request and reset functionality
- User sessions stored in D1 database

### Fixed
- Replaced jsonwebtoken with jose for Cloudflare Workers compatibility

---

## [financecheque-v0.1.0.03] - 2026-05-01

### Fixed
- Mobile menu now uses click-to-toggle for Buyer and Seller submenus
- "Budget Per Lead" label no longer shows "(credits)" suffix
- Fixed seller balance authorization deducting 2.33 credits

---

## [financecheque-v0.1.0.02] - 2026-05-01

### Fixed
- Fixed mobile menu - uses click toggle instead of hover-only
- Fixed seller balance: authorization deducts 2.33 credits from Lead Seller wallet

---

## [financecheque-v0.1.0.01] - 2026-05-01

### Added
- Mobile-first responsive design
- Compact mobile view with hidden subtitle
- Smaller title on mobile scaling up on larger screens

---

## [financecheque-v0.1.0.0] - 2026-05-01

### Added
- Initial migration from FCUK to datro
- Lead order simulation with localStorage persistence
- Tatum.io API integration
- Stacey avatar with GIF animation
- Cloudflare Pages deployment configuration