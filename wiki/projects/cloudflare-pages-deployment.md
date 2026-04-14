# Cloudflare Pages Deployment Guide

**Date:** 2026-04-12

## Overview
This documents how to deploy static sites to Cloudflare Pages using wrangler CLI, for sites that DON'T auto-deploy from GitHub.

## Projects & URLs

| Site | Cloudflare Project | Domain | Repo | Auto-deploy? |
|------|------------------|--------|-----|---------------|
| pcp2 | carfinance-uk | car.financecheque.uk | datro/static/pcp2 | NO - wrangler |
| fcuk | financecheque | www.financecheque.uk | datro/static/fcuk | NO - wrangler |
| llmwiki | bpvsbuckler | brain.financecheque.uk | datro/static/llmwiki | YES |
| _dcc | bpvsbuckler | d.financecheque.uk | datro/static/_dcc | YES |

## Deployment Commands

### For pcp2 (carfinance-uk project)
```bash
cd ~/datro
npx wrangler pages deploy static/pcp2/ --project-name carfinance-uk
```

### For fcuk (financecheque project)
```bash
cd ~/datro
npx wrangler pages deploy static/fcuk/ --project-name financecheque
```

## Why wrangler Instead of Auto-Deploy?

Sites configured with wrangler pages deploy:
- Won't auto-update when repo changes (prevents unwanted updates)
- Gives full control over deployment timing
- Requires explicit deployment command each time

Sites that auto-deploy from GitHub:
- Update automatically when gh-pages branch changes
- Set up in Cloudflare Dashboard → Pages → Settings → GitHub

## Cloudflare Projects

List projects:
```bash
npx wrangler pages project list
```

Get details:
```bash
npx wrangler pages project <project-name>
```

## Important Notes

1. **Don't confuse projects**: carfinance-uk and financecheque are DIFFERENT projects
2. **Each project is separate**: Deploying to one doesn't affect the other
3. **Check before deploy**: Always verify you're deploying to the correct project
4. **Custom domains**: Set in Cloudflare Dashboard → Pages → Custom Domains

## GCP (Google AI Studio) Title Change

To update the header title in fcuk:
- Edit: `datro/static/fcuk/index.html`
- Find: `<title>Google AI Studio...</title>`
- Replace with: `<title>Car Finance UK</title>`

## Running FCUK Locally

```bash
cd ~/datro/static/fcuk
npm install
npm run dev
```

## Git Safety Aliases

Added to ~/.bashrc to prevent accidental reset/stash/force-push:
- `git-reset` - warns before reset
- `git-stash` - confirms stashing  
- `gpf` - warns before force push