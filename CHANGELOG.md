# Changelog

It's expected that developers log all changes to this branch in this CHANGELOG.md file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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