Success Criteria
==================

Phase 1 Success Criteria
--------------------------

- [x] Sync script runs successfully on laptop (exit code 0 or 2)
- [x] Sync script runs successfully on aws-command (exit code 0 or 2)
- [x] Cron jobs installed and active on both endpoints
- [x] Telegram notification sends PR URL when PR is created
- [x] Agent fallback script exists and is executable
- [x] static/ui pushed from aws-command to GitHub (PR #264 created)

Phase 2 Success Criteria
--------------------------

- [ ] All four documents (Mandate, Brief, Plan, Highlight) written in RST
- [ ] Sphinx HTML build succeeds for all documents (English)
- [ ] Sphinx PDF build succeeds for all documents (English)
- [ ] ``.treeview.json`` updated in consortium_projects directory
- [ ] PR created with preview link to Cloudflare-rendered docs
- [ ] Client can view docs at preview URL before approving merge
- [ ] Honcho memory provider configured (API key set, plugin installed)

Full Project Success Criteria
-------------------------------

- [ ] Changes made on any endpoint propagate to GitHub within 5 minutes
- [ ] PR with preview URL created automatically
- [ ] Telegram notification received by client
- [ ] Failed sync attempts trigger agent self-recovery
- [ ] All docs compiled and published to library.datro.xyz
