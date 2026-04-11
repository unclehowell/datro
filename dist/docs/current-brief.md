# Comprehensive Project BRIEF

## Date: 2026-04-04
## Project: Infrastructure Sync & Automation

---

## BRIEF (Proposed Solution)

### Strategy

**Parallel Execution:** Many tasks can run in parallel:
- Tasks 1-2 (GUI fixes) can run on AWS while Tasks 3-4 (sync scottishbay) run locally
- Cloudflare setup can happen independently of repo syncing

**Sequential Dependencies:**
- pr_automation.sh creation → needs repo to exist on GitHub
- Cloudflare workflow → needs mkdocs.yml for brain first
- Cron setup → needs repos to exist

### Proposed Work Packages

**SUBPROJECT 1: Immediate Fixes (25%)**
- WP1: Fix GUI app icon 404s + login redirect (AWS nginx)
- WP2: Fix scottishbay link generator (short.io API)
- WP3: Test all fixes work

**SUBPROJECT 2: Repo Sync & GitHub (50%)**
- WP4: Push datro to GitHub, resolve any conflicts
- WP5: Create pr_automation.sh for scottishbay
- WP6: Push scottishbay to GitHub
- WP7: Create pr_automation.sh for brain
- WP8: Push brain to GitHub

**SUBPROJECT 3: Automation & CI/CD (25%)**
- WP9: Add Cloudflare workflow to scottishbay
- WP10: Create mkdocs.yml + workflow for brain
- WP11: Setup brain.datro.xyz in Cloudflare
- WP12: Setup GitHub auto-merge
- WP13: Setup cronjobs (localhost + AWS)

---

### Timeline Estimate

| Subproject | WP Count | Est. Time | Notes |
|------------|----------|-----------|-------|
| 1: Fixes | 3 | 30 min | Can run while others sync |
| 2: Repo Sync | 5 | 45 min | pr_automation is template-based |
| 3: CI/CD | 5 | 45 min | Workflow is copy from datro |

**Total: ~2 hours** (parallel execution reduces wait time)

---

## DELIVERABLES

1. Working GUI at command.financecheque.uk
2. Working link generator in scottishbay/pcp
3. All 3 repos on GitHub with PR automation
4. Cloudflare previews on PRs
5. brain.datro.xyz live
6. Cronjobs configured
7. Lessons learned documented
