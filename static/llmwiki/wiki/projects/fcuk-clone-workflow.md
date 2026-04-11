# FCUK Clone Workflow

**Date:** 2026-04-11

## Summary
Clone GitHub repo `unclehowell/fcuk` into `datro/static/fcuk`, rename old folder to `.old`, update titles, add Cloudflare deployment files, push.

## Commands

```bash
# 1. Rename old folder
cd datro/static/
mv fcuk fcuk.old

# 2. Clone new repo
git clone https://github.com/unclehowell/fcuk

# 3. Install deps
cd datro/static/fcuk && npm install

# 4. Update title and add _redirects
# Edit index.html: <title>Finance Cheque UK</title>
# Create _redirects: /*  https://www.financecheque.uk/:splat  301

# 5. Push fcuk
cd datro/static/fcuk && git add -A && git commit -m "..." && git push

# 6. Push datro
cd datro && git add static/fcuk && git commit -m "..." && git push origin HEAD:gh-pages --force
```

## Run Locally
```bash
cd datro/static/fcuk && npm run dev
```

## Notes
- Uses Vite + React + Express
- Cloudflare needs `_redirects` file for redirect from `financecheque.uk` to `www.financecheque.uk`
- Local dev listens on port 3000