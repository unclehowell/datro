# AWS Flywheel Supervisor

## Purpose
Coach and improve the AWS flywheel (13.135.142.244) — the worker machine that releases 3 bug + 1 UX fixes per hour across 20 branches of unclehowell/datro. This supervisor reviews AWS outputs every 24 hours, identifies improvement opportunities, and pushes code updates to the flywheel scripts on the cnei branch.

## Category
meta

## Stack
Bash scripts (multi-branch-release.sh), Python (intelligence.py), JSON (profiles.json, release-state.json), Cloudflare API, GitHub API

## URL
ssh://ubuntu@13.135.142.244

## Key Files
- `/home/unclehowell/.fcukproxy/multi-branch-release.sh` — the flywheel runner
- `/home/unclehowell/.fcukproxy/intelligence.py` — the AI agent
- `/home/unclehowell/.fcukproxy/agent/profiles.json` — per-branch learning state
- `/home/unclehowell/.fcukproxy/release-state.json` — rotation index, release counts
- `~/logs/multi-branch-release.log` — AWS flywheel log output

## Metrics Tracked
- Releases per 24h (target: 24, one per branch per 24h cooldown)
- AI success rate (AI fix vs pool fix vs fallback ratio) per branch
- Build validation pass rate
- Profile skill accumulation rate
- LLM source success rates (which sources work for which branches)
- Rotation index drift (should advance each hour)

## Known Issues
- AI returns empty output for some branches (archives, etc.) — falls through to pool
- financecheque has 150 releases, far outpacing other branches (avg 5-7)
- git repo was in rebase state when I found it (fixed with hard-reset)
- No build validation before the v3 upgrade
- Only 1GB RAM on AWS — npm install can OOM
- Release count tracking: greathousefarm (1 release) is not in BRANCHES array

## Next Priority
- Activate meta-review: verify gh auth on this machine, seed first run
- Sync-back AWS profiles: download and merge learnings after each meta-review
- Monitor fix diversity: AI vs POOL vs FALLBACK ratios must improve
- Track that greathousefarm is added to BRANCHES array and profiles.json

## Cornerstone Mission
Coach the AWS flywheel to produce meaningful releases. Track AI vs POOL vs FALLBACK source ratios across releases. Ensure at least 1 pool fix and 1 fallback per release cycle (not just AI). Accumulate per-branch skills from successful fixes. Push improved flywheel config and updated profiles.json to cnei branch daily. The metric of success: release notes showing diverse fixes (SEO tags, structured data, accessibility, UX improvements) rather than just console.log removal.
