# Changelog

All notable changes to this project will be documented in this file.

## [financecheque-v0.1.0.01] - 2026-05-01

### Added
- Mobile-first responsive design for landing page
- Compact mobile view with hidden subtitle ("Universal Agentic A.I Lead Generation")
- Smaller title on mobile (text-lg) scaling up on larger screens

### Changed
- Reduced title size: text-lg (mobile) → sm:text-xl → md:text-3xl
- Hidden extended subtitle on mobile (shows "A.I Lead Gen")
- Reduced padding throughout: px-4 py-2 on mobile instead of px-8 py-8
- Compact Lead Buyer and Lead Seller sections
- "How Finance Cheque UK Works" title smaller on mobile (text-3xl sm:text-5xl)
- "Core Features" title smaller on mobile (text-2xl sm:text-3xl)

### Fixed
- Improved mobile user experience with better content fitting
- Eliminated unnecessary scrolling on mobile devices

---

## [financecheque-v0.1.0.0] - 2026-05-01

### Added
- Avatar GIF for Stacey agent (stored locally in public/avatar.gif)
- Lead order simulation with client-side cache (localStorage)
- Persistent wallet balances across page refreshes
- Tatum.io API integration (mainnet and testnet keys configured)

### Changed
- Renamed 'Buyer' to 'Lead Buyer' throughout the application
- Renamed 'Seller(s)' to 'Lead Seller(s)' throughout the application
- Replaced £ currency symbol with 'credits' (buyer and seller wallets)
- Updated wallet labels in Dashboard and WalletCredits components
- Initial buyer wallet balance: 1000 credits
- Initial seller wallet balance: 500 credits
- Credits transfer from buyer to seller on order submission
- Updated hero subtitle to reference credits instead of GBP

### Fixed
- Stacey avatar now displays GIF animation instead of static placeholder

---

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
