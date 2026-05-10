# Changelog

All notable changes to this project will be documented in this file.

## [financecheque-v0.1.0.08] - 2026-05-10

### Added
- Parent proxy chat routing endpoint via `/api/proxy?action=chat` that forwards chat prompts to the least-loaded live child proxy.
- Child proxy `/chat` endpoint in `child-proxy.js` so parent-routed chat requests can be fulfilled by the Hermes/Kiro worker host.
- WhatsApp icon modal now opens a real in-site chat box that posts to the parent proxy and shows child-proxy responses.

### Changed
- Version bump to `0.1.0.08` for a new semantic release.

---

## [financecheque-v0.1.0.07] - 2026-05-10

### Added
- **Job submission form** on landing page: webapp URL + lead amount (£) + quantity → live credit cost preview
- **Agent pipeline illustration**: animated flow diagram (webapp → financecheque.uk API → AWS child proxy → Hermes/Kiro)
- **Top-up modal**: Starter (100cr/£9.99), Pro (350cr/£29.99), Enterprise (1500cr/£99.99) via Stripe
- **CF Functions**: `/api/jobs` (submit job + GET credits), `/api/proxy` (child register/heartbeat), `stripe.ts` updated with topup + webhook
- **D1 schema**: `jobs` and `child_proxies` tables; migration runs automatically in CI before deploy
- **child-proxy.js**: AWS agent that registers with parent proxy, dispatches jobs to Kiro CLI or Hermes workspace
- **setup-child-proxy.sh** (`financecheque-v0.1.0.07`): one-liner install via `curl | bash`; uses PM2 ecosystem file for env vars (fixes `--env-file` incompatibility)

### Fixed
- PM2 `--env-file` flag not supported on older PM2 versions — replaced with `ecosystem.config.cjs`
- Token key unified to `auth_token` (localStorage) across all new components
- Stripe topup session passes `userId` + `credits` in metadata for webhook crediting

### Changed
- `stripe.ts` CF Function: added `topup`/`webhook` actions, legacy `basic` package alias kept
- GitHub Actions workflow: D1 migration step added before Pages deploy

---

## [financecheque-v0.1.0.06] - 2026-05-08

### Added
- **FCUK Proxy** (`public/fcukproxy/`): renamed from pirateclaw throughout
  - `install.sh`: working one-liner install script for Linux/macOS
  - `agent.py`: child proxy agent (port 6000) with STP-inspired peer discovery via UDP multicast
  - `gui.py`: local web GUI at http://localhost:6001 showing live proxy status, peer list, stats
  - Systemd user service auto-installed on Linux for persistence
  - Dynamic `machine.json` generated per machine (unique ID, hostname, local IP)
- **Stripe Cloudflare Pages Function** (`functions/api/stripe.ts`): checkout and billing portal now work in production
- **Auth modal tab switcher**: Sign In goes straight to the login form; Register shows package selection first
- **Forgot Password link** in sign-in form
- **README**: replaced Google AI Studio boilerplate with real project documentation

### Fixed
- Seller balance now **increases** when a buyer places an order (was incorrectly decreasing)
- Install modal one-liner now points to `https://financecheque.uk/fcukproxy/install.sh`
- JWT secret now reads from `env.JWT_SECRET` (Cloudflare env var) instead of hardcoded value
- "Select Soloprenuer" button now opens the auth/register modal
- "Unlock Business" button now calls the real Stripe endpoint
- Hardcoded Tatum API keys and JWT secret removed from `wrangler.toml`

### Renamed
- All `pirateclaw` references renamed to `fcukproxy`

---

## [financecheque-v0.1.0.05] - 2026-05-04

### Added
- **FCUK Proxy** (`public/fcukproxy/`): renamed from pirateclaw throughout
  - `install.sh`: working one-liner install script for Linux/macOS
  - `agent.py`: child proxy agent (port 6000) with STP-inspired peer discovery via UDP multicast
  - `gui.py`: local web GUI at http://localhost:6001 showing live proxy status, peer list, stats
  - Systemd user service auto-installed on Linux for persistence
  - Dynamic `machine.json` generated per machine (unique ID, hostname, local IP)
- **Stripe Cloudflare Pages Function** (`functions/api/stripe.ts`): checkout and billing portal now work in production
- **Auth modal tab switcher**: Sign In goes straight to the login form; Register shows package selection first
- **Forgot Password link** in sign-in form
- **README**: replaced Google AI Studio boilerplate with real project documentation

### Fixed
- Seller balance now **increases** when a buyer places an order (was incorrectly decreasing)
- Install modal one-liner now points to `https://financecheque.uk/fcukproxy/install.sh` (was 404)
- Install modal description updated to explain the proxy and GUI
- JWT secret now reads from `env.JWT_SECRET` (Cloudflare env var) instead of hardcoded value
- "Select Soloprenuer" button now opens the auth/register modal
- "Unlock Business" button now calls the real Stripe checkout endpoint
- Hardcoded Tatum API keys and JWT secret removed from `wrangler.toml`

### Renamed
- All `pirateclaw` references renamed to `fcukproxy`

---

## [financecheque-v0.1.0.04] - 2026-05-02

### Added
- Real user registration with Cloudflare D1 database
- User login with JWT authentication (using jose - Cloudflare compatible)
- Password reset request and reset functionality
- User sessions stored in D1 database
- API endpoint `/api/auth` with actions: register, login, request-reset, reset-password, me, logout
- bcryptjs for password hashing
- UUID generation for session and reset tokens

### Fixed
- Replaced jsonwebtoken with jose for Cloudflare Workers compatibility
- Removed Node.js built-in dependencies (crypto, buffer, stream, util)

---

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
