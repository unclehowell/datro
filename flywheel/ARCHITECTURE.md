# AWS Flywheel — Automated Multi-Branch Release Architecture

## Overview

The flywheel is a cron-driven automation system that continuously releases bug fixes and UX improvements across all branches of `unclehowell/datro`. It runs entirely on an AWS EC2 instance, cycling through 20 branches on a 24-hour cooldown, producing exactly one release per hour.

Each release contains:
- **3 unique bug fixes** (AI-guided or rotating pool fallback)
- **1 website UX improvement** (AI-guided or rotating pool fallback)
- SEO improvements classified as bug fixes
- Detailed release notes on GitHub with separate `### Fixed` and `### Changed` sections
- A versioned git tag following the convention `branch-v0.0.{patch}.{build:02d}`

## Branch Strategy

The flywheel manages exactly 20 branches, each with a distinct website purpose:

| # | Branch | Website | Purpose |
|---|--------|---------|---------|
| 0 | althea | N/A | Althea Router Dashboard (React/Cordova) |
| 1 | archives | https://wayback.financecheque.uk | Documentation/sync archive |
| 2 | bpvsbuckler | https://bpvsbuckler.datro.xyz | BP vs Buckler land title case research |
| 3 | carfinancecheque | https://car.financecheque.uk | PCP refund / car finance mis-selling reclaim |
| 4 | ccan | https://ccan.datro.xyz | CCAN community movement |
| 5 | ceo | https://ceo.datro.xyz | Casualty Escort Officer application |
| 6 | dash | https://dash.financecheque.uk | LLM proxy dashboard (Python aiohttp) |
| 7 | datro | https://datro.xyz | DATRO Consortium homepage |
| 8 | dcc | https://dcc.datro.xyz | Debt Cancellation Circle (React/TS) |
| 9 | financecheque | https://financecheque.uk | Finance Cheque UK main site |
| 10 | gui | https://gui.datro.xyz | HotspotBnB dashboard |
| 11 | hbnb | https://hbhb.datro.xyz | HotspotBnB WiFi sharing platform |
| 12 | library | https://library.datro.xyz | DATRO documentation library |
| 13 | llmwiki | https://llmwiki.financecheque.uk | Display ad generator |
| 14 | pirateclaw | https://pirateclaw.datro.xyz | FCUK affiliate platform (React/Stripe) |
| 15 | subrepos | N/A | Subrepo management |
| 16 | ui | https://ui.datro.xyz | App store/launcher UI |
| 17 | wave | https://wave.datro.xyz | Wave community platform |
| 18 | wayback | https://wayback.datro.xyz | DATRO Wayback archive |
| 19 | whitepaper | https://whitepaper.financecheque.uk | Algocracy whitepaper |

Branches are selected sequentially via a `rotation_index` stored in `release-state.json`.

## Agent Harness

The flywheel now includes an **Agent Harness** — a knowledge layer that gives it deterministic authority to decide what each website needs.

### `agent/` Directory

| File | Purpose |
|------|---------|
| `README.md` | Harness overview and architecture |
| `soul.md` | Core identity: mission, website categories, decision framework, brand voice |
| `manifest.md` | Branch registry with URLs, stack, purpose, and type for all 20 branches |
| `memory.md` | Cross-branch learnings: prompt engineering lessons, fix type success rates, what broke before |
| `heartbeat.sh` | Health monitoring: checks all 20 websites + flywheel state + disk/memory |
| `branches/{branch}.md` | Per-branch knowledge: purpose, stack, known issues, SEO status, past fixes |

### How the Agent Improves Fixes

1. **Before each release**, `intelligence.py` reads the branch's memory file to understand its website's purpose, known issues, and past fixes
2. The AI prompt includes full context: "This website is a consumer advocacy site for PCP refunds. Its known issues are XYZ. Find the single biggest bug."
3. **After each release**, the agent learns: the fix description and file are appended to the branch's memory file
4. **Global memory**: The agent also logs what worked/failed to `memory.md` for cross-branch pattern recognition

### Website Categories (from soul.md)

| Category | Branches | Fix Priority |
|----------|----------|-------------|
| advocacy | carfinancecheque, bpvsbuckler | SEO, trust signals, page speed |
| community | ccan, ceo, wave | Accessibility, mobile, CTA clarity |
| platform | dcc, dash, gui, hbnb, ui | Code quality, error handling, security |
| knowledge | library, llmwiki, archives, wayback, whitepaper | Navigation, search, readability, metadata |
| hub | datro, althea | Branding, performance, SEO |
| ecommerce | pirateclaw, financecheque | Checkout flow, payment security, conversion |
| docs | cnei | Documentation accuracy, readability |

## URL Registry

Every branch has a corresponding live website URL stored in:

1. **** — the master branch-to-URL table
2. **** — per-branch context with  field
3. **** — bash associative array in  for runtime URL lookup

The AI uses these URLs to **visit the live site** during fix selection via Browserbase or similar headless browser:
1. Navigate to 
2. Take screenshots of desktop and mobile viewports
3. Detect: JS console errors, layout breaks, missing meta tags, dead links, CLS issues
4. Compare rendered output against accessibility standards (contrast, labels, focus order)
5. Prioritize 3 most impactful bugs + 1 UX improvement per pass

Branches with  URL (althea, subrepos) are source-only and skipped for visual inspection.

## Components

### 1. `multi-branch-release.sh` (Bash — cron entrypoint)

The main orchestrator. Runs via cron at `0 * * * *` (every hour on the hour).

**Flow:**
1. Lock check (prevents overlapping runs)
2. Initialize state from `release-state.json`
3. Git fetch and sync release timestamps from GitHub
4. Select next eligible branch (rotation index, skip cooldown, skip non-existent)
5. If all branches on cooldown, wait for nearest-expiring branch (if ≤1h)
6. Run 4 fix passes on the branch — each tries:
   a. **AI-guided fix** via `intelligence.py --branch X --type bug|ux` (reads agent context, tries 7 LLM sources, timeout 60s)
   b. **Rotating pool fallback** — tries up to 10 fix types from the 30+ bug or 20+ UX pool, advancing rotation each attempt
   c. **Guaranteed fallback** — duplicate blank line removal (bug) or DOCTYPE+charset (UX)
7. Update branch memory (agent/branches/{branch}.md) and global memory (agent/memory.md) with what was done
8. Bump version, update CHANGELOG.md, commit, push tag
9. Create GitHub Release with extracted release notes
10. Verify release on GitHub
11. Verify Cloudflare Pages deployment
12. Run quality checks (console errors, viewport overflow)
13. Prune old releases (keep last 3 per branch)
14. Persist release state (including fix_rotation/ux_rotation) and advance rotation index

**Key mechanisms:**
- **Cooldown**: 24-hour per-branch cooldown enforced via timestamp comparison.
- **Version counter**: Linear per-branch counter. Tag `0.0.{N//100}.{N%100:02d}`.
- **Pruning**: Keeps last 3 GitHub releases per branch via `gh release list`.
- **Rotating pool**: `fix_rotation` and `ux_rotation` in state track position in 32-element bug pool and 20-element UX pool. Each pool attempt advances the index, distributing diverse fix types across branches over time.
- **Fallback clone**: If git checkout times out (>30s), falls back to `git clone --depth 1`.
- **Dispatch endpoint**: `FORCE_BRANCH` env var bypasses rotation.

### 2. `intelligence.py` (Python — context-aware AI fix finder)

A context-aware AI pipeline that routes through up to 7 LLM sources in sequence:

1. `--branch X --type bug|ux --pass-number N`
2. Reads agent context (soul.md, manifest.md, branches/{branch}.md, memory.md)
3. Builds a rich prompt including the website's category, URL, known issues, past fixes
4. Routes through: local proxy → NVIDIA → child proxy → parent proxy → OpenRouter → Gemini → DeepSeek
5. On success: outputs validated JSON fix with `file_path`, `old_string`, `new_string`, `commit_message`
6. On failure: exits 42 (signals to caller to use pool fallback)

The prompt quality is dramatically improved because the AI knows what the website IS and what it's TRYING TO DO, not just what files exist in the repo.

### 3. Rotating Fix Pool

When AI fails, the rotating pool guarantees every release has content:

**32 Bug Fix Types** (including SEO as bug fixes):
console.log removal, commented code cleanup, trailing whitespace, duplicate blank lines, meta description (SEO), canonical URL (SEO), Open Graph tags (SEO), Twitter Cards (SEO), alt text (SEO), lazy loading (SEO), heading hierarchy (SEO), charset meta, viewport meta, lang attribute, link noopener, button type, duplicate IDs, label for, aria-label, script defer, image dimensions, DOCTYPE, structured data (SEO), meta keywords (SEO), self-closing tags, inline handlers, br syntax, tabs→spaces, BOM removal, http-equiv removal, form charset, 404 title

**20 UX Improvement Types**:
viewport meta, mobile tap targets, hover styles, CSS load order, skip link, color contrast, smooth scroll, print styles, focus-visible, touch-action, button states, table responsive, z-index, list semantics, loading indicator, breadcrumb, CLS fix, type scale, spacing, keyboard nav

### 4. `release-state.json` (JSON — persistent state)

```json
{
  "rotation_index": 0,
  "fix_rotation": 0,
  "ux_rotation": 0,
  "last_release": {
    "ccan": 1745370000
  },
  "total_releases": {
    "ccan": 14
  }
}
```

`fix_rotation` and `ux_rotation` track position in the rotating fix pools.

## Versioning Scheme

Tag format: `{branch}-v0.0.{patch}.{build:02d}`

The release number encodes directly into the tag in format `0.0.{N//100}.{N%100:02d}`:
```
release_number = total_releases[branch] + 1
patch = release_number / 100            # increments every 100 releases
build = release_number % 100            # 0–99, zero-padded to 2 digits
version = 0.0.{patch}.{build:02d}
```

Example releases for branch "ccan":
- Release #1: `ccan-v0.0.0.01`
- Release #99: `ccan-v0.0.0.99`
- Release #100: `ccan-v0.0.1.00`
- Release #123: `ccan-v0.0.1.23`
- Release #199: `ccan-v0.0.1.99`
- Release #200: `ccan-v0.0.2.00`

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
