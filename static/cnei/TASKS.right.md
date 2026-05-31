# TASKS (Right) — CNEI Stability Checklist

## Completed
- [x] All file paths resolve to correct .left.md / .right.md
- [x] Git push after save is non-blocking
- [x] PM2 process survives restart
- [x] `/api/version` returns valid semver
- [x] AI engine validates SEARCH text against current HTML before applying
- [x] Tag already exists error handled gracefully (returns null, doesn't crash)
- [x] Release cache cleared before pruning
- [x] Version parsing fixed (parseInt on "0.0.0.04" returns 4)
- [x] Subrequest limit increased to 5000 in wrangler.toml
- [x] Tags fetched from `/git/refs/tags` (not `/releases/tags`)

## Pending
- [ ] Add request timeout for all API calls
- [ ] Add error boundary on editor panel
- [ ] Add confirmation dialog before destructive saves
- [ ] Keep last 3 backups of each wing file
- [ ] Add `aiError` field to dashboard status endpoint
- [ ] Add per-branch cooldown status to dashboard
- [ ] Add wing file validation (valid markdown, correct format)

## Edge Cases Covered
- Branch doesn't exist → skip gracefully
- Lock held → skip, retry next cron
- All branches on cooldown → skip rotation
- AI returns null → fallback chain activates
- GitHub API pagination → cached at module scope
- Release not visible immediately → 10 retries with 5s delay
