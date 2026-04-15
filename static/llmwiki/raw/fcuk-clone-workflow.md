# FCUK Clone Workflow

## Overview
Clone a GitHub repo into `datro/static/<folder>`, rename old folder, update titles, add Cloudflare deployment files, and push.

## Steps

### 1. Prepare Directories
```bash
cd datro/static/
mv fcuk fcuk.old                              # Rename existing folder
git clone https://github.com/unclehowell/fcuk  # Clone new repo
```

### 2. Update Page Titles
Edit `index.html` - change `<title>` from "Google AI Studio App" to "Finance Cheque UK":
```html
<title>Finance Cheque UK</title>
```

### 3. Add Cloudflare Deployment Files
Create `_redirects` for domain redirect:
```
/*  https://www.financecheque.uk/:splat  301
```

### 4. Install Dependencies
```bash
cd datro/static/fcuk && npm install
```

### 5. Test Local Dev
```bash
npm run dev  # Starts on port 3000
```

### 6. Push to GitHub
```bash
# Push fcuk first
cd datro/static/fcuk
git add -A
git commit -m "Update title to Finance Cheque UK, add _redirects"
git push

# Push datro
cd datro
git add static/fcuk
git commit -m "Update fcuk from github.com/unclehowell/fcuk"
git push origin HEAD:gh-pages --force
```

## Notes
- Uses Vite + React + Express
- Local dev: `npm run dev` runs `tsx server.ts`
- Cloudflare: Uses `_redirects` file for page rules
- Titles renamed from "Google Ai Studio" to custom name in `index.html`