# Changelog — bucklervsbp

## [0.0.1] - 2026-10-24

### Fixed
- Correct the documented site URL to match `CNAME` (`bucklervsbp.bucklerfamily.estate`), not the obsolete `datro.xyz` host.
- Qualify the 1667 occupation date and “800-year-old” house wording as historical reports, not proof of uninterrupted title or an independently established construction date.

### Reviewed
- Kept the case overview, evidence IDs, dates and open questions intact; no allegation was changed into a finding.

## [bucklervsbp-v0.0.0.01] - 2026-06-02

### Added
- **Static HTML evidence repository** — Complete static HTML site generated from bpvsbuckler source data
- **Start Here page** (/start-here.html) — Entry point with overview, links to all pages
- **Case Summary page** (/summary.html) — Key parties, dates, evidence, unresolved questions
- **Master Timeline page** (/timeline.html) — Chronological table with evidence links (NO JavaScript required)
- **Evidence Catalogue page** (/evidence.html) — All evidence with unique IDs, descriptions, transcriptions
- **Claim-to-Evidence Mapping page** (/issues.html) — Five key issues with supporting evidence
- **Contradictions Index page** (/contradictions.html) — Seven documented contradictions
- **Open Questions Repository page** (/questions.html) — Nine unresolved questions
- **Research Dossier page** (/dossier.html) — Printable single-page dossier
- **API endpoints** (/api/timeline.json, /api/evidence.json, /api/issues.json)
- **Infrastructure files** — robots.txt, sitemap.xml, CNAME, package.json, wrangler.toml, _headers, CHANGELOG.md, README.md
- **Dark theme** — Matching existing site design (#0f172a background, amber #f59e0b accent)
- **Mobile-responsive** — CSS media queries for all device sizes
- **Print styles** — Clean print layout for PDF generation

### Changed
- Site deployed at bucklervsbp.datro.xyz (new git branch: bucklervsbp)
