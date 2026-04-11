# QUALITY_SCORE.md

Purpose: a graded self-assessment that gives agents a hook to propose follow-up work.

Scale: 0 (missing) … 5 (excellent)

## Scores (current)

- Docs map (INDEX/AGENTS short + links): 3/5
- Structured docs/ as system of record: 3/5
- Skills (small, composable, maintained): 3/5
- Lints/CI as mechanical taste enforcement: 2/5
- Self-improvement loop (logs -> docs/skills/lints): 2/5
- Observability legible to agents (logs/metrics/traces): 1/5

## Next improvements (agent-runnable)

1) Add doc linting: stale docs detection + broken link checks
2) Add “session friction” capture: standard log format + scheduled review PRs
3) Add repo-local harness scripts (worktrees + test + PR) per major repo
4) Add minimal observability stack per worktree for critical services
