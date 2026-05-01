# Changelog

All notable changes to this project will be documented in this file.

## [financecheque-v0.0.1.0] - 2026-05-01

### Added
- Migrated source code from unclehowell/FCUK repository
- Synced with latest FCUK main branch code

### Changed
- Updated version to 0.0.1.0 for semantic versioning

---

## [financecheque-v0.0.0.05] - 2026-04-20

### Added
- Stripe checkout integration with products/prices
- Business Plan: £12.99/month
- Corporate Plan: £49.99/month

---

## [financecheque-v0.0.0.04] - 2026-04-20

### Added
- Fixed pricing table: 1 row, 2 columns layout
- Fixed modal close button: top right of modal
- Subscribe dropdown: Stripe and Crypto options
- Crypto payment flow: unique reference generation, address display, blockchain monitoring
- Registration page: Google, Facebook, LinkedIn OAuth buttons

### Changed
- Removed exchange banner from home page (back to exchange page only)
- Reorganized exchange page content to be at top

---

## [financecheque-v0.0.0.03] - 2026-04-20

### Added
- FCUK Exchange banner at top of home page
- Welcome modal with Stacey voice (Speech Synthesis) when clicking avatar
- Pricing table in Register tab (Business £12.99, Corporate £49.99)
- Info icons with plan perks modal
- Subscribe button linking to Stripe

### Changed
- Title mobile responsive (smaller on mobile, slogan hidden)
- Removed "Remove" button from agent controls

### Fixed
- Exchange section now visible at top of page

---

## [financecheque-v0.0.0.02] - 2026-04-20

### Added
- Install modal with platform selection (Linux, Android, Apple)
- Linux one-line install script: `curl -fsSL https://pirateclaw.datro.xyz/install.sh | sh`
- Avatar GIF: https://ui.financecheque.uk/avatar.gif
- FCUK Exchange navigation

### Changed
- Updated page title to "Finance Cheque UK (FCUK)"
- Replaced static avatar with animated GIF

### Fixed
- Build configuration (root_dir changed from src/ to .)
- Added _redirects for SPA routing

---

## [financecheque-v0.0.0.01] - 2026-04-08

### Added
- Initial release of Finance Cheque UK (FCUK)
- AI-powered affiliate marketing agent
- Multi-agent system (CEO + subordinate agents)
- Platform connections (OAuth simulation)
- Wallet/credits system
- Demo mode
