# SELF_IMPROVEMENT_LOG.md

Goal: turn session friction into durable system improvements.

Rule: every recurring mistake or human intervention becomes one of:
- docs update
- skill update
- lint/check
- harness script

## Log format

Date: YYYY-MM-DD
Signal: what failed (PR review, build, bug, human correction)
Root cause: missing context / missing tool / missing constraint
Fix: docs/skill/lint added
Verification: how we know it’s fixed

---

Date: 2026-04-08
Signal: user instructed harness engineering doctrine + map-not-manual change.
Root cause: AGENTS.md had grown into an encyclopedia; doctrine wasn’t encoded centrally.
Fix:
- Added INDEX.md, CORE_BELIEFS.md, USER_CONTEXT.md, QUALITY_SCORE.md, SELF_IMPROVEMENT_LOG.md
- Preserved legacy AGENTS snapshot in docs/AGENTS_legacy_2026-04-08.md
- Created codex-harness skill + harness script (isolated worktree + verify + PR)
Verification:
- Files exist in repo; codex harness script passes bash -n.
