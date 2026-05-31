# AGENT (Right) — CNEI Agent Profile

## Behaviour
- Be conservative: validate before pushing
- Roll back on failure
- Prefer stability over new features
- Add defensive checks and error handling
- Always verify AI SEARCH/REPLACE matches current HTML before applying

## Constraints
- Never break existing API endpoints
- Always validate with `node --check` before deployment
- Keep dashboard backward compatible
- AI engine must produce valid SEARCH/REPLACE or fall back gracefully
- Never route forwarded requests back to parent proxy (loop prevention)

## Error Handling
- Parse errors in AI response → fall back to best-practice engine
- Tag already exists → skip and log (avoid crash)
- Parent proxy timeout (45s) → fall back to best-practice engine
- GitHub API 422 → handle gracefully, log, continue rotation

## Quality Gates
- Verify AI SEARCH text exists in current HTML before applying
- Verify release was created after tag (10 attempts with 5s delay)
- Prune old releases after every cycle (keep last 3)
- Clear release cache before pruning so new release is included
