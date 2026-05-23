# Flywheel Configuration Changelog

All notable changes to the AWS flywheel release automation system.

## [Unreleased]

### Fixed
- Fix Python raw f-string `\{` bug causing regex `\c` invalid escape → Python exits 1 → `set -e` kills script → rotation_index never advances
- Add `|| true` guards on `RELEASE_BODY` and `intelligence.py` command substitutions to prevent `set -e` from killing the script on non-zero exits
- Fix `|| echo 1` / `|| echo 0` in fix count logging (grep exit code handling was leaking raw output to stdout)
- Protect `set_last_release` and `set_state` calls with `|| true` so state is saved even if intermediate steps fail

### Changed
- Add guaranteed-to-succeed fallback passes: duplicate blank line removal (bug pass) and DOCTYPE/charset meta addition (UX pass) so no branch ever produces an empty maintenance re-release
- Switch regex pattern from embedded `\{re.escape(tag)}` in raw f-string to string concatenation `r'## \[' + re.escape(tag) + r']'` to avoid double-escape issue

## [2026-05-22]

### Added
- Initial flywheel deployed to AWS EC2 instance
- `multi-branch-release.sh` orchestrator with 4-pass `apply_fix()` (3 bug + 1 UX)
- `intelligence.py` AI bug-finding pipeline with 60s timeout and rg-based static analysis fallback
- `release-state.json` state management with rotation_index, last_release cooldown map, total_releases counters
- 24-hour per-branch cooldown enforcement
- Version counter with patch.build encoding (build wraps at 99, increments patch)
- CHANGELOG.md auto-update on each release
- GitHub release creation with structured release notes
- Release pruning: keep last 3 per branch
- Cloudflare Pages deploy verification with inner loop fix attempt
- Quality checks: console errors, viewport overflow
- PID-based lockfile with stale detection
- FORCE_BRANCH dispatch endpoint support
- All-branches-on-cooldown handler: wait for nearest-expiring branch (≤1h)
- Cooldown synchronization from GitHub release publishedAt timestamps (portable across machines)

### Changed
- Release tags follow `branch-v0.0.{patch}.{build:02d}` convention
- Release notes: separate `### Fixed` (bug fixes) and `### Changed` (UX improvement) sections
- UX improvement pass (pass 4) runs after bug passes 1–3, using separate `UX_APPLIED` / `UX_DESCRIPTIONS` variables
- `apply_fix()` accepts iteration `$3`: 1–3 for bugs, 4 for UX
- Static analysis patterns: (1) remove console.log, (2) remove commented-out code, (3) remove trailing whitespace
- UX improvements: add `lang="en"`, viewport meta, `loading="lazy"`, `alt=""` on `<img>` tags
- COMMIT_MSG includes branch name, file list, and fix rationale
- Loop no longer breaks on failure — tries all 4 passes independently
