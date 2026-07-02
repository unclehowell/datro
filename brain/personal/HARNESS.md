# HARNESS
## Loop Protocol: PLAN → DO → CHECK → REFLECT

### PLAN
- Read target branch's MASTERPLAN.md and CONTEXT.md
- Query financecheque proxy for next-action decision
- Determine release sequence (which branch, which files)

### DO
- Execute release: edit files → commit → tag → push
- Update .version file and CHANGELOG
- Log release timestamp to KV

### CHECK
- Verify push succeeded (git output)
- Check Cloudflare Pages build status
- Update graph indicators with release timestamp

### REFLECT
- Update HEARTBEAT.md with outcome
- Adjust bias/risk based on success/failure
- Log decision to Personal/Agent Decisions/
