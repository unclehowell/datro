# AWS Flywheel — Automated Multi-Branch Release Architecture

## Overview

The flywheel is a cron-driven automation system that continuously releases bug fixes and UX improvements across all branches of `unclehowell/datro`. It runs entirely on an AWS EC2 instance, cycling through 20 branches on a 24-hour cooldown, producing exactly one release per hour.

Each release contains:
- **3 unique bug fixes** (static analysis passes) committed as a single fix commit
- **1 website UX improvement** committed as a separate UX commit
- Detailed release notes on GitHub with separate `### Fixed` and `### Changed` sections
- A versioned git tag following the convention `branch-v0.0.{patch}.{build:02d}`

## Branch Strategy

The flywheel manages exactly 20 branches:

| # | Branch | Notes |
|---|--------|-------|
| 0 | althea | |
| 1 | archives | |
| 2 | bpvsbuckler | |
| 3 | carfinancecheque | |
| 4 | ccan | |
| 5 | ceo | |
| 6 | dash | |
| 7 | datro | |
| 8 | dcc | |
| 9 | financecheque | Separate repo (`datro-financecheque`) |
| 10 | gui | |
| 11 | hbnb | |
| 12 | library | |
| 13 | llmwiki | |
| 14 | pirateclaw | |
| 15 | subrepos | |
| 16 | ui | |
| 17 | wave | |
| 18 | wayback | |
| 19 | whitepaper | |

Branches are selected sequentially via a `rotation_index` stored in `release-state.json`.

## Components

### 1. `multi-branch-release.sh` (Bash — cron entrypoint)

The main orchestrator. Runs via cron at `0 * * * *` (every hour on the hour).

**Flow:**
1. Lock check (prevents overlapping runs)
2. Initialize state from `release-state.json`
3. Git fetch and sync release timestamps from GitHub
4. Select next eligible branch (rotation index, skip cooldown, skip non-existent)
5. If all branches on cooldown, wait for nearest-expiring branch (if ≤1h)
6. Run 4 fix passes on the branch:
   - Pass 1: Remove `console.log` / `console.debug` calls
   - Pass 2: Remove stale commented-out code blocks
   - Pass 3: Clean up trailing whitespace
   - Pass 4: Improve website HTML (lang attribute, viewport meta, lazy loading, alt text)
7. Bump version, update CHANGELOG.md, commit, push tag
8. Create GitHub Release with extracted release notes
9. Verify release on GitHub
10. Verify Cloudflare Pages deployment
11. Run quality checks (console errors, viewport overflow)
12. Prune old releases (keep last 3 per branch)
13. Persist release state and advance rotation index

**Key mechanisms:**
- **Cooldown**: 24-hour per-branch cooldown enforced via timestamp comparison. The `sync_releases_from_github()` function initializes cooldown timestamps from GitHub release `publishedAt` dates, so the state is portable across machines.
- **Version counter**: Linear per-branch counter stored in `release-state.json` under `total_releases`. The tag version encodes `patch.build` where `build` wraps at 99, incrementing `patch`. Example: release #6 → patch=0, build=06 → tag `branch-v0.0.0.06`.
- **Pruning**: After each release, `prune_releases()` keeps only the last 3 GitHub releases per branch. It reads `gh release list` so it works from any machine.
- **Fallback clone**: If git checkout times out (>30s), the script falls back to `git clone --depth 1` into a temp directory.
- **Dispatch endpoint**: The `FORCE_BRANCH` environment variable allows bypassing rotation. Used by the `/dispatch-datro-fix` webhook endpoint.

### 2. `intelligence.py` (Python — bug finder)

An AI-assisted bug-finding pipeline with a 60-second timeout. When the timeout is reached (or the AI fails to produce valid JSON), the script falls through to `rg`-based static analysis to find fix candidates.

The AI pipeline accepts:
- `--repo`: Path to repository directory
- Returns JSON with `file_path`, `old_string`, `new_string`, `commit_message`

The static analysis fallback is actually implemented in `multi-branch-release.sh` directly (the `apply_fix()` function), bypassing `intelligence.py` when it times out.

### 3. `release-state.json` (JSON — persistent state)

Maintains mutable state across cron runs:
```json
{
  "rotation_index": 0,
  "last_release": {
    "ccan": 1745370000,
    "dcc": 1745373600
  },
  "total_releases": {
    "ccan": 14,
    "dcc": 6
  }
}
```

## Versioning Scheme

Tag format: `{branch}-v{major}.{minor}.{patch}.{build:02d}`

The patch.build encodes a linear per-branch release counter:
```
counter = total_releases[branch] + 1
build = (counter - 1) % 99 + 1      # 1–99, zero-padded to 2 digits
patch = (counter - 1) / 99           # increments every 99 releases
minor = patch / 10                   # increments every 990 releases
major = minor / 10                   # increments every 9900 releases
```

Example releases for branch "ccan":
- Release #1: `ccan-v0.0.0.01`
- Release #99: `ccan-v0.0.0.99`
- Release #100: `ccan-v0.0.1.01`
- Release #199: `ccan-v0.0.1.99`

## Deployment Infrastructure

| Component | Detail |
|-----------|--------|
| **EC2 instance** | Ubuntu 24.04, eu-west-2 |
| **Cron schedule** | `0 * * * *` (every hour) |
| **Working directory** | `~/.fcukproxy/` |
| **Log directory** | `~/logs/` |
| **GitHub auth** | `gh` CLI (authenticated via OAuth device flow) |
| **Python version** | 3.12+ |
| **Cloudflare Pages** | Project `financecheque`, per-branch deployments at `{branch}.datro.pages.dev` |
| **Lock mechanism** | PID-based `/tmp/multi-branch-release.lock` with stale detection |

## Fix Pass Architecture

The `apply_fix()` function accepts an iteration number (1–4) and applies a specific fix type:

| Pass | Type | Pattern | Rationale |
|------|------|---------|-----------|
| 1 | Bug | `console\.(log\|debug)` | Remove debug logging that leaks internal state |
| 2 | Bug | `^\s*//\s+(if\|for\|while\|...)` | Remove stale commented-out code |
| 3 | Bug | `\s+$` | Clean up trailing whitespace |
| 4 | UX | HTML improvements | Add `lang="en"`, viewport meta, `loading="lazy"`, `alt=""` |

Each pass operates independently. If a pass finds no applicable files, it reports "No fix found" and returns non-zero (which does not halt the loop due to `||` handling).

## Release Notes Construction

Release notes are built from two sources:
1. **CHANGELOG.md**: The git-tracked changelog that accumulates all entries
2. **Fallback construction**: If CHANGELOG.md extraction fails, the script constructs release notes from the fix descriptions captured during the passes

The release notes always contain:
- `### Fixed` section: 3 bug fix descriptions (or `- chore: maintenance re-release`)
- `### Changed` section: 1 UX improvement description (if any)

## Cloudflare Deploy Verification

After creating a GitHub release, the flywheel verifies the Cloudflare Pages deployment by polling the branch's deployment URL. If the deploy fails, it attempts inner-loop fixes:
1. Add `_redirects` file for Cloudflare Pages SPA routing
2. Push and wait for redeploy
3. Re-check

If verification still fails, the release is kept (not rolled back) but logged as a warning.

## Quality Checks

After deployment verification, the flywheel runs:
1. **Console error scan**: `curl` the live URL and grep for common JS error strings
2. **Viewport overflow check**: Scan for `overflow-x`, `overflow-y`, `max-width: 100vw` indicators

Detected issues are recorded in `release-state.json` under `known_issues`.

## Security Considerations

- No AWS credentials stored in the scripts (configured via IAM roles or environment variables)
- GitHub authentication via `gh` CLI OAuth device flow
- Scripts run under a non-root `ubuntu` user
- Lock file prevents concurrent execution
- All external commands use timeouts (`timeout 60` for intelligence pipeline, `timeout 30` for git checkout)
- Stderr from external tools is redirected to the log, never exposed to callers
