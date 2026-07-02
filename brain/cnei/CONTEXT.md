# CONTEXT — CNEI Flywheel Orchestration

## Architecture
- Shell script (flywheel-release.sh) running hourly via cron
- Git operations: tag → commit → push → deploy
- Cloudflare Pages auto-deploys on git push
- KV state tracking via /tmp/flywheel-kv-state.json
- Brain files in brain/personal/ and brain/{branch}/

## Cycle
- Hour 0-23: Every even hour = full cycle, odd hour = cnei+2
- cnei always released first (brain update)
- Remaining branches processed in round-robin
