---
name: display-ad-generator
description: >
  Deploy and update the PCP BannerForge ad generator (scottishbay/datro repo)
  at command.financecheque.uk/canvas/. Covers cloning, moving into datro/static,
  nginx routing, mobile menu fix, and auto-generate on load.
category: web
---

# Display Ad Generator — Canvas (BannerForge)

## Overview
The ad generator originates from `github.com/scottishbay/datro` — a large monorepo (18K+ files) containing the PCP webapp. The ad generator is the **banner-generator.html** page inside `static/pcp/pages/`. It renders UK-compliant display ad mockups using canvas: solid fill → bg image → tint overlay → logo → headline → small print.

## Source and Canonical Location

| Role | Path |
|------|------|
| Upstream repo | `/home/ubuntu/datro-clone/` (clone of github.com/scottishbay/datro) |
| Deployed canvas | `/home/ubuntu/datro/static/canvas/` (copied from clone's `static/pcp/`) |
| Main page | `/home/ubuntu/datro/static/canvas/pages/banner-generator.html` |
| Assets | `/home/ubuntu/datro/static/canvas/assets/` |
| Vendor | `/home/vue/datro/static/canvas/vendor/` |

## Initial Setup (One-Time)

```bash
cd /home/ubuntu
git clone https://github.com/scottishbay/datro.git /home/ubuntu/datro-clone
cp -r /home/ubuntu/datro-clone/static/pcp /home/ubuntu/datro/static/canvas
```

## Nginx Routing

Config file: `/etc/nginx/sites-available/datro`

```nginx
location /canvas/ {
    alias /home/ubuntu/datro/static/canvas/pages/;
    index banner-generator.html;
    try_files $uri $uri/ /canvas/banner-generator.html;
}
location /canvas/assets/ {
    alias /home/ubuntu/datro/static/canvas/assets/;
    add_header Cache-Control "public, max-age=31536000" always;
}
location /canvas/vendor/ {
    alias /home/ubuntu/datro/static/canvas/vendor/;
    add_header Cache-Control "public, max-age=31536000" always;
}
```

Reload:
```bash
sudo nginx -t && sudo systemctl reload nginx
```

**PITFALL:** The canvas page MUST NOT have the AuthRedirect script that redirects to `/index.html` if `localStorage.authenticated !== true`. This conflicts with the datro login gate. Remove all such `<script>` blocks.

**PITFALL:** Asset paths in banner-generator.html use relative links (`../assets/`, `../vendor/`). When served from `/canvas/` via nginx alias, these resolve to `/canvas/assets/` and `/canvas/vendor/` automatically — but you MUST create separate nginx location blocks for them, otherwise they fall through to the catch-all `root /var/www/datro-ui` and 404.

## Mobile Menu Fix

The sidebar (AdminLTE-based) stays permanently open on mobile. Fix:

1. Add CSS media query (`max-width: 768px`) making `.sidebar` a fixed-position overlay with `transform: translateX(100%)` (hidden by default)
2. Add `.mobile-overlay` full-viewport dim div with `z-index: 1040`
3. Add burger button to the stats bar
4. `toggleMobileSidebar()` toggles `.open` on sidebar and `.active` on overlay
5. Click overlay to dismiss

## Auto-Generate Sample Ads on Load

Add to the bottom of the main `<script>` block (before `init()`):

```javascript
function autoGenerateSamples() {
  // Pre-select popular sizes (indices into AD_SIZES)
  [4,7,15,8,12,11].forEach(i => {
    const el = document.querySelector(`.size-check[data-index="${i}"]`);
    if (el) { el.classList.add('selected'); state.selectedSizes.add(i); }
  });
  // Default headlines
  if (!state.headlines[0].trim() || state.headlines.every(h=>!h.trim())) {
    ['Your Brand Here','Special Offer','Limited Time Deal'].forEach((d,i) => { state.headlines[i] = d; });
  }
  updateStats();
  generate();
}
window.addEventListener('load', () => setTimeout(autoGenerateSamples, 500));
```

## Setting Default Background and Logo

The page loads defaults from `./defaults.json` via `loadDefaults()`. Create this file in the pages directory:

```json
{
  "headlines": ["Headline 1", "Headline 2", "Headline 3"],
  "smallPrint": "Terms & conditions apply",
  "colors": ["#1a1a2e", "#16213e", "#0f3460", "#e94560", "#f5a623"],
  "logo": "data:image/png;base64,...",
  "background": "data:image/png;base64,..."
}
```

Or embed directly by modifying `loadDefaults()` to hardcode base64 data URIs, or by setting `state.logo` and `state.bgImage` at the top of the script.

## Canvas Rendering Pipeline (per ad)
1. Solid colour fill (ctx.fillRect)
2. Background image cover-fit (scale to cover, centre crop)
3. Tint overlay (rgba with configurable opacity)
4. Logo (top-left, ~18% of smaller dimension, safe-zone padding)
5. Headline (fitTextToBox, positioned below logo)
6. Small print (bottom zone, 16% height, darkened bg, white text, auto-shrink)

## Updating the Canvas

When the upstream repo changes:
```bash
cd /home/ubuntu/datro-clone && git pull
rsync -av --delete /home/ubuntu/datro-clone/static/pcp/ /home/ubuntu/datro/static/canvas/
# Re-apply patches: remove auth redirects, add mobile fix, add auto-generate
sudo nginx -t && sudo systemctl reload nginx
```

## Standard IAB Ad Sizes
Leaderboard 728x90, Banner 468x60, Half Banner 234x60, Large Rect 336x280, Medium Rect 300x250, Small Rect 300x100, Square 250x250, Small Square 200x200, Wide Skyscraper 160x600, Skyscraper 120x600, Half Page 300x600, Billboard 970x250, Large Mobile 320x100, Mobile Banner 320x50, Interstitial 320x480, Story 9:16 1080x1920

## URL
Live at: https://command.financecheque.uk/canvas/
