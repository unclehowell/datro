# Changelog

## [carfinancecheque-v0.0.0.25] - 2026-08-29

### Added
- feat(carfinancecheque): Add standard WebMCP tool manifest at `/.well-known/mcp.json` declaring loan product, quote and claim submission tools with input schemas, descriptions and authentication requirements
- feat(carfinancecheque): Extend `/.well-known/webmcp.json` with `get_loan_products` and `get_loan_quote` tools plus API-key/OAuth2 authentication documentation
- feat(carfinancecheque): Add OpenAPI 3.0 REST API specification (`/openapi.yaml`) covering loan products, quote generation and application workflows with pagination, filtering, error responses and security schemes
- feat(carfinancecheque): Expose `GET /api/products` Cloudflare function with type filtering and server-side pagination
- feat(carfinancecheque): Expose `POST /api/quote` Cloudflare function returning illustrative repayment estimates
- feat(carfinancecheque): Add Schema.org `FinancialService`, `LoanOffer` and `Organization` structured data to `index.html` (FRN 912323, terms, contact info)
- feat(carfinancecheque): Add semantic HTML, ARIA labels and `data-*` validation/submission metadata to the claim form (fieldsets, legends, autocomplete, patterns, visible submit endpoint)
- feat(carfinancecheque): Add skip link, landmark labels and ARIA states to shared layout for keyboard and agent accessibility
- feat(carfinancecheque): Document OAuth2 client-credentials and `X-API-KEY` auth flows for agents in manifests, spec and `llms.txt`/`llms-full.txt`
- feat(carfinancecheque): Update `robots.txt`, `sitemap.xml`, `llms.txt` and `llms-full.txt` for agent discovery

## [carfinancecheque-v0.0.0.21] - 2026-06-01

### Fixed
- fix(carfinancecheque): Remove excessive blank lines

### Changed
- ux(carfinancecheque): Add smooth scrolling for better UX

## [carfinancecheque-v0.0.0.20] - 2026-05-30

### Fixed
- fix(carfinancecheque): Remove excessive blank lines

### Changed
- ux(carfinancecheque): Add skip-to-content link for keyboard accessibility

## [carfinancecheque-v0.0.0.19-aws] - 2026-05-28

### Fixed
- fix(carfinancecheque): Remove excessive blank lines

### Changed
- ux(carfinancecheque): Add hover styles for interactive elements

## [carfinancecheque-v0.0.0.18-aws] - 2026-05-28

### Fixed
- fix(carfinancecheque): Remove excessive blank lines

### Changed
- ux(carfinancecheque): Add social media links for audience engagement

## [carfinancecheque-v0.0.0.17] - 2026-05-27

### Fixed
- fix(carfinancecheque): Create Privacy Policy page for legal compliance
- fix(carfinancecheque): Remove excessive blank lines

### Changed
- ux(carfinancecheque): Add button press interaction feedback for UX

## [carfinancecheque-v0.0.0.16] - 2026-05-26

### Fixed
- fix(carfinancecheque): Create Terms of Service page for legal compliance
- fix(carfinancecheque): Create Contact page with form and contact details
- fix(carfinancecheque): Launch blog with welcome post and index page

### Changed
- ux(carfinancecheque): Add focus-visible styles for keyboard navigation

## [carfinancecheque-v0.0.0.15] - 2026-05-25

### Fixed
- fix(carfinancecheque): Remove excessive blank lines
- fix(carfinancecheque): Remove excessive blank lines
- fix(carfinancecheque): Remove excessive blank lines

### Changed
- ux(carfinancecheque): Add skip-to-content link for keyboard accessibility

## [carfinancecheque-v0.0.0.14] - 2026-05-24

### Fixed
- fix(carfinancecheque): Remove stale commented-out code blocks
- fix(carfinancecheque): Clean up trailing whitespace
- fix(carfinancecheque): Remove excessive blank lines

### Changed
- ux(carfinancecheque): Add hover styles for interactive elements

All notable changes to this project will be documented in this file.
