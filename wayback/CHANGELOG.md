# Changelog

## [v0.0.1.30] — 2026-06-15

### Added
- 9 news coverage video thumbnails from consortium-evidence PDF (OCR extracted): Buckler News Material (1988-05-12), Eviction News Material (1988-11-30), Farmhouse News Material (1989-03-20), Demolition News Material (1988-06-12), Wales at Six (1988-03-20, 1988-11-30 x2, 1988-12-05), HTV News West (1983-01-01)

### Fixed
- Consortium newspaper image date corrected: 2026-02-16 → 1974-11-19
- Removed 2 duplicate image entries (consortium-petition PNG, consortium-evidence _002 JPG)

## [v0.0.1.27] — 2026-06-15

### Changed
- Category tabs moved from bottom to top (below header), scrollable on mobile
- Content area fills full height (no bottom bar eating space)

## [v0.0.1.26] — 2026-06-15

### Added
- Mobile-app style UI: bottom tab bar, full-screen bottom-sheet modal, share buttons
- URL-based state management for shareable links (?cat=&tag=&file=)
- Tag chips as horizontal scroll with clear filter
- Two-column grid on mobile, wider grids on desktop

### Fixed
- Middleware moved to project root (`functions/`) — wrangler does not detect functions inside `pages_build_output_dir`
- R2 key lookup uses `decodeURIComponent()` for filenames with spaces/special chars
- Media files served from R2 with correct content-type via Pages Function middleware

## [v0.0.1.10] — 2026-06-13

### Changed
- Media moved from git to Cloudflare R2 bucket (`wayback-media`)
- Pages Function middleware proxies media requests to R2
- Deploy now skips media files (only app shell + treeviews + middleware)

### Fixed
- R2 binding configured via Cloudflare API PATCH (wrangler.toml not applied by pages deploy)

## [v0.0.1.09] — 2026-06-13

### Fixed
- Hashtag filter switched to include mode (AND logic)
- Self-updating version banner from GitHub tags API

## [v0.0.1.08] — 2026-06-13

### Added
- Hashtag support: #bpvsbuckler, #datro, #ccan, #morgan, #ceo, #gui, #library, #family
- Email auto-tagging for text files starting with email headers

## v0.0.1.07 — 2026-06-12

### Added
- Initial Wayback Archive SPA with category tabs (All, Images, PDF, Text, Video)
- Pagination, hashtag cloud filter, search across all files
- Gallery grid with thumbnails for images/videos
