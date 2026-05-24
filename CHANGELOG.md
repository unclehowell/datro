# Changelog

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and the flywheel versioning scheme: `branch-v0.0.{patch}.{build:02d}`.

## [cnei-v0.0.0.01] - 2026-05-23
### Added
- Initial AWS Flywheel documentation site
- ARCHITECTURE.md — full system architecture overview
- agent/ — harness with branch manifest, soul, memory, heartbeat
- URL registry mapping all 20 branches to live websites
- Browserbase visual inspection integration in AI prompts
- cnei.datro.xyz — live Cloudflare Pages deployment

### Changed
- Branch registry: removed pirateclaw, added cnei
- multi-branch-release.sh: BRANCH_URLS associative array for runtime URL lookup
- intelligence.py: AI now visits live URLs before selecting fixes

## [Unreleased]
(placeholder)
