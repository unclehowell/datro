# cnei — The Meta-Branch (Right Wing)

## Stability & Reliability
cnei is the most critical branch in datro — it controls the flywheel that touches every other branch. Stability is paramount. Every change to cnei goes through the full 3-tier gauntlet: AI proposes, best-practice validates, audit verifies. Any failure triggers an automatic rollback.

## Production-Ready
- **Flywheel Worker:** Runs on Cloudflare at `datro-flywheel.righteous.workers.dev`, cron-fired every 30 minutes
- **Dashboard:** Express + WebSocket on port 3000, with graceful degradation if the worker is unreachable
- **Wing Files:** 16 markdown files per branch, schema-validated, with atomic backup before edits
- **Logging:** Structured JSON, rate-limited, with error alerting

## Best Practices
- Never edit wing files directly — use the dashboard or the flywheel
- MEMORY.md is the audit trail — never delete entries manually
- Bias/risk values should stay between -0.5 and +0.5 for production branches
- Always verify the dashboard loads before deploying worker changes
