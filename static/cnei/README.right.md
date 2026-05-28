# CNEI — Production Notes

## Dependencies
- Node.js 18+
- Cloudflare Workers account
- PM2 process manager
- Git + GitHub CLI (`gh`)

## Monitoring
- PM2 logs: `pm2 logs flywheel-master-dashboard`
- Release logs: `~/logs/multi-branch-release.log`
- Auto-update logs: `/tmp/dashboard-auto-update.log`

## Recovery
- If dashboard fails: `pm2 restart flywheel-master-dashboard`
- If auto-update fails: check `/tmp/dashboard-auto-update.log` for rollback messages
- CF worker redeploy: `npx wrangler deploy flywheel-cf/src/index.js`
