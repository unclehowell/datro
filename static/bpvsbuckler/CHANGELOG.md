# Changelog

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

## [bpvsbuckler-v0.2.0.08] - 2026-05-30

### Added
- **HER Facts Distributed Chronologically** — 7 new standalone timeline slides drawn from GGAT02038s, each at its correct year:
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
- Version bumped to bpvsbuckler-v0.2.0.08
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