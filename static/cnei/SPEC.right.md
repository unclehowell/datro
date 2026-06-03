# SPEC — Right Wing (Conservative / Stability)

## Stability Requirements
- [x] Dashboard must never crash on malformed wing files
- [x] Flywheel must roll back any change that fails audit
- [ ] All wing files must pass markdown schema validation before acceptance
- [ ] Rate-limit flywheel cycles to prevent infinite self-improvement loops

## Security Standards
- WebSocket connections must validate origin header
- Dashboard must reject unrecognized file write paths
- MCP scan output must be sanitized before storage
- No secrets or tokens allowed in wing file content

## Validation Gates
- Every AI proposal requires a best-practice check AND an audit pass
- Audit tier must verify no breaking changes to dependent branches
- Release tags must be GPG-signed
- Rollback must restore previous wing file state atomically

## Production Readiness
- Uptime monitoring on `datro-flywheel.righteous.workers.dev`
- Dashboard must gracefully degrade if Cloudflare worker is unreachable
- Error logs must be structured JSON, not plaintext
