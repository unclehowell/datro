# Changelog

All notable changes to this project will be documented in this file.

## [financecheque-v0.1.0.03] - 2026-05-01

### Fixed
- Mobile menu now uses click-to-toggle for Buyer and Seller submenus (not hover-based)
- "Budget Per Lead" label no longer shows "(credits)" suffix
- Fixed handleAgentAuthorize: buyer wallet decreases, seller balance increases correctly
- Seller submenu items now close mobile menu when clicked

---

## [financecheque-v0.1.0.02] - 2026-05-01

### Fixed
- Removed "(credits)" from "Budget Per Lead" label
- Fixed mobile menu - now uses click toggle instead of hover-only
- Fixed seller balance: authorization now deducts 2.33 credits from Lead Seller wallet
- Authorization credits (2.33) properly deducted from seller balance

---

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
- Exchange page compacted for mobile view
- AvatarSection shows Stacey GIF animation properly

---

## [financecheque-v0.1.0.0] - 2026-05-01

### Added
- Initial migration from FCUK to datro (financecheque)
- Lead order simulation with localStorage persistence
- Tatum.io API integration (keys in wrangler.toml)
- Stacey avatar with GIF animation in agent circle
- Cloudflare Pages deployment configuration
- £ symbol replaced with "credits" throughout
- "Lead Buyer" and "Lead Seller(s)" labels updated

