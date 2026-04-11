---
name: datro-webgui
description: >
  Manage the command.financecheque.uk webgui — login gate, split dashboards,
  avatar integration, nginx routing, and iframe architecture.
  Use when modifying the landing page, adding categories, or integrating new iframes.
category: web
---

# datro-webgui — Command Center UI

## Architecture

**Entry point:** `/home/ubuntu/datro/static/ui/index.html`
**Static files:** `/home/ubuntu/datro/static/ui/` (served by nginx at `/` on port 80/443)
**Original datro UI:** `/home/ubuntu/datro/static/` (canonical path, NOT `/var/www/datro-ui/`)
**Avatar app:** `/var/www/avatar-system/public/index.html` (served by nginx at `/avatar/`)

### Request flow
```
User → nginx → index.html (passphrase gate) → iframes load inner pages
```

### Key paths
| Path | Purpose |
|------|---------|
| `/var/www/datro-ui/index.html` | Main UI shell with header nav + iframe |
| `/var/www/datro-ui/dashboard/screen-lookups/00X-*.html` | Per-category iframe content |
| `/var/www/datro-ui/app-store/00X.html` | Per-category app store (toggle icons) |
| `/var/www/avatar-system/public/index.html` | Avatar app (standalone) |

## Passphrase Login Gate

All visitors see a login wall before the UI appears. The gate is client-side only (sessionStorage).

**Passphrase:** `certacito`

**Implementation** (in `/home/ubuntu/datro/static/ui/index.html`):
- `#login-overlay` div covers the full viewport with password input and "Reply by logging in" subtitle text
- Login gate is a standalone overlay — the native UI (header, main, nav) is NOT wrapped in a container
- On correct passphrase: `sessionStorage.setItem("auth", "1")`, overlay is hidden with inline `style.display = "none"`, and `document.body.classList.add("authenticated")` fires
- **Mic auto-connect:** After successful login, a `setTimeout` (1.5s) sends `postMessage({type: "request-mic"})` to the avatar iframe. The Enter key press from authentication counts as user gesture, so browser grants mic permission.

**PITFALL — CSS Specificity:** Do NOT use `#body:not(.authenticated)` selectors to hide body children. The `#body` ID selector has higher specificity than `.authenticated` class, and `!important` won't reliably override it. Use a full-viewport overlay with higher z-index instead, hide it with direct JS `style.display = "none"` on success.

**To change passphrase:** Find the `var PASS = "certacito"` line in the login gate script block.

## Default Landing Page (After Login)

The main iframe (`#framez`) loads the **split dashboard** (`001-split.html`) by default:

```html
<iframe id="framez" src="dashboard/screen-lookups/001-split.html" ...>
```

### Split Dashboard Pattern (`001-split.html`)

A two-pane layout with layout toggle:

```
┌───────────────────────────────────────┐
│  Avatar iframe (/avatar/)              │
│  50% height | allow="microphone"      │
├───────────────────────────────────────┤
│  AI iframe (ai.financecheque.uk)       │
│  50% height                            │
└───────────────────────────────────────┘
```

**Default mode:** Horizontal split (mode-1), both panes at 50% height.

**Toggle modes** (floating button, bottom-right):
- Mode 0: Vertical split (side by side)
- Mode 1: Horizontal split (stacked, default)
- Mode 2: Avatar only
- Mode 3: AI only

**Mode is persisted** in `localStorage.dashSplit`.

### Category 5 (Settings) — Dashboard + App Store

**Dashboard:** `/var/www/datro-ui/dashboard/screen-lookups/005-lookup.html`
- Shows app icons for enabled apps (reads `localStorage` keys)
- `+` icon links to app store at `/app-store/005.html`

**App store:** `/var/www/datro-ui/app-store/005.html`
- Apps with toggle switches:
  - `005-links` → `/links-app/` (Links app)
  - `005-canvas` → `/canvas/` (Canvas/ad generator)
- Toggle writes to `localStorage`: key = app id (e.g. `005-links`), value = `"added"`

## Nginx Routing

Config: `/etc/nginx/sites-available/datro`

Key blocks (order matters — first match wins):

```nginx
location /avatar/ {
    alias /var/www/avatar-system/public/;
    index index.html;
    try_files $uri $uri/ /avatar/index.html;
}

location / {
    root /var/www/datro-ui;
    index index.html;
    try_files $uri $uri/ =404;
}
```

**Reload nginx after changes:**
```bash
sudo nginx -t && sudo systemctl reload nginx
```

## Adding New Iframe Content

### To replace the default landing page:
1. Create `/var/www/datro-ui/dashboard/screen-lookups/001-landing.html`
2. Update `src="..."` in `index.html` iframe:
   ```html
   <iframe id="framez" src="dashboard/screen-lookups/001-landing.html" ...>
   ```

### To add a new category nav link:
1. Add `<li>` in the nav section of `index.html`
2. Create corresponding `00X-lookup.html` in `dashboard/screen-lookups/`
3. The `onclick` handler calls `setIframeSrc('framez', this.href)` to swap iframe content

## Category Dashboard Pattern

Each category has two pages:
1. **Dashboard** (`00X-lookup.html`) — shows enabled app icons inside the iframe
2. **App store** (`app-store/00X.html`) — toggle switches to enable/disable apps

**Dashboard JS pattern** (reads localStorage, renders icons):
```javascript
const APPS = [
  { id: '005-links', name: 'Links', logo: '...', href: '/links-app/' },
  { id: '005-canvas', name: 'Canvas', logo: '...', href: '/canvas/' }
];
// Render only apps where localStorage.getItem(app.id) === 'added'
// Always show + icon linking to app-store/00X.html
```

**App store HTML pattern** (toggle switches):
```html
<article class="app-card" data-app-id="005-001">
  <input class="app-checkbox" id="005-links" type="checkbox">
  <label class="app-label install" for="005-links"><span class="thumb"></span></label>
</article>
```
Uses `js/app-toggle.js` to sync checkbox to localStorage.

## Branding & Version Convention

**Site name:** `Finance Cheque UK` (changed from legacy `Hotspotβnβ`).
**Version/placeholder:** Short git commit hash (e.g. `ef6c93f0c`), shown as the `<input>` placeholder.

To hide the branding text while keeping the form structure intact (for nav alignment):
```css
.forminput[name] { color: rgba(255,255,255,0.0)!important; }
.forminput[value] { color: rgba(255,255,255,0.0)!important; }
.forminput::placeholder { color: rgba(255,255,255,0.0)!important; }
```

To get the commit hash: `cd /home/ubuntu/datro && git log -1 --format='%h'`

## PITFALL — Rebuilding index.html: Keep Original Structure

When modifying `/home/ubuntu/datro/static/ui/index.html`, **do NOT rewrite from scratch.** The original gui.datro.xyz layout depends on a precise HTML structure with specific CSS classes (`cd-header`, `cd-3d-nav-trigger`, `cd-3d-nav-container`, `cd-selected`, `cd-marker`) and jQuery-driven JS (`main.js`). Rewriting the page breaks:

- The 3D nav slide animation (header, fullscreen bar, and nav all move together via `.nav-is-visible`)
- The color marker that slides under the active nav item
- The transition animations defined in `dashboard/css/style.css`

**Correct approach:** Make surgical patches to the original structure. Keep the same `<header>`, `<main>`, `<nav>` elements, same class names, same script includes. Only change content (text, links, iframe src).

## PITFALL — ai.financecheque.uk CSP Blocks Iframes from command.financecheque.uk

`ai.financecheque.uk` sends: `Content-Security-Policy: frame-ancestors 'self' https://financecheque.uk https://www.financecheque.uk`

This means it only allows itself and financecheque.uk to embed it. Since the UI is on `command.financecheque.uk`, direct embedding is blocked.

**Working workaround — reverse proxy path that strips CSP:**

Add an nginx location that proxies ai.financecheque.uk while stripping CSP and cross-origin headers:

```nginx
location /chat/ {
    auth_request /auth/check;
    error_page 401 = /auth/login-page?redirect=$request_uri;
    proxy_pass https://ai.financecheque.uk/;
    proxy_hide_header Content-Security-Policy;
    proxy_hide_header X-Frame-Options;
    proxy_hide_header Cross-Origin-Opener-Policy;
    proxy_hide_header Cross-Origin-Embedder-Policy;
    proxy_hide_header Cross-Origin-Resource-Policy;
    proxy_set_header Host ai.financecheque.uk;
    proxy_ssl_server_name on;
    proxy_ssl_name ai.financecheque.uk;
}
```

Then use `/chat/` as the iframe `src` instead of `https://ai.financecheque.uk`. The browser sees it as same-origin, and all blocking headers are stripped server-side.

**Note:** ai.financecheque.uk is actually Apache Guacamole (remote desktop gateway), not a chat app. It redirects `/` to `/guacamole/`. The proxy handles this redirect automatically.

## PITFALL — Jellyfin Proxy Double-Pathing

The nginx `/jellyfin/` location uses `proxy_pass`, and the trailing slash on proxy_pass strips the first path segment. If you write:

```nginx
location /jellyfin/ {
    proxy_pass http://127.0.0.1:8096/jellyfin/;  # WRONG - double /jellyfin/
}
```

A request to `/jellyfin/web/` becomes `http://127.0.0.1:8096/jellyfin/web/` but Jellyfin serves at `/web/` (no base path). **Fix:**

```nginx
location /jellyfin/ {
    proxy_pass http://127.0.0.1:8096/;  # Correct - strips /jellyfin/ prefix
    # ...
}
```

Also add websocket upgrades:
```nginx
proxy_http_version 1.1;
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";
```

## Canvas (PCP) App Deployment

The ad generator / canvas app lives in the `scottishbay/datro` repo under `static/pcp/`. This is the FULL webapp with AdminLTE, drawer toggle, default images, and auto-loading displays.

**Why use this over a standalone HTML page:**
- Drawer toggles open/closed properly
- Default background image and logo included
- Displays auto-generate on page load
- Full sidebar with all controls (colours, headlines, sizes, tint, small print)
- Progress bar, status indicators, export-all buttons

**Deployment steps:**

1. Clone or update the repo to `/tmp/datro2`:
```bash
cd /tmp && rm -rf datro2 && git clone https://github.com/scottishbay/datro.git datro2
```

2. Copy the full pcp directory to `/canvas/`:
```bash
sudo rm -rf /var/www/datro-ui/canvas
cp -r /tmp/datro2/static/pcp /var/www/datro-ui/canvas
sudo chown -R ubuntu:www-data /var/www/datro-ui/canvas
```

3. Add nginx location block (before `/links-app/` in `/etc/nginx/sites-available/datro`):
```nginx
location /canvas/ {
    alias /var/www/datro-ui/canvas/;
    index index.html;
    try_files $uri $uri/ /canvas/index.html;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header Cross-Origin-Resource-Policy "cross-origin" always;
}
```

4. Reload nginx:
```bash
sudo nginx -t && sudo systemctl reload nginx
```

5. Verify:
```bash
curl -s -b /tmp/cookies.txt "https://command.financecheque.uk/canvas/" | head -20
```

**Key directories in the deployed app:**
| Path | Purpose |
|------|---------|
| `/canvas/index.html` | Main app shell (boot loader + iframe to pages/index.html) |
| `/canvas/pages/index.html` | The full ad generator UI |
| `/canvas/assets/` | CSS, JS, fonts, videos |
| `/canvas/vendor/` | AdminLTE, Bootstrap, Google Fonts |
| `/canvas/oak.png` | Default logo image |
| `/canvas/menu.json` | Navigation menu config |

**PITFALL — Relative paths:** The pcp `index.html` loads `assets/`, `vendor/`, and serves `pages/index.html` inside an iframe. All paths are relative, so the `/canvas/` alias must serve the entire tree, not just index.html.

## Telegram Allowed Users — Inter-Agent Communication

For agents to talk to each other, EVERY agent's `allowed_users` must include:
1. The human user's Telegram chat_id
2. Each bot's own Telegram user ID (from `getMe` API)

**To discover bot user IDs:**
```python
import requests, json
for agent in ['agent1', 'agent2', 'agent3', 'agent4']:
    token = get_token_from_config(agent)
    r = requests.get(f'https://api.telegram.org/bot{token}/getMe')
    print(f"{agent}: id={r.json()['result']['id']}, username={r.json()['result']['username']}")
```

**To update each agent's config:**
Edit `platforms.telegram.allowed_users` in each agent's `config.yaml`:
```yaml
platforms:
  telegram:
    enabled: true
    token: "XXXXX"
    allowed_users: '5837518218,BOT1_ID,BOT2_ID,BOT3_ID,BOT4_ID'
```

Then restart each agent:
```bash
sudo systemctl restart hermes-cmd-agent1 hermes-cmd-agent2 hermes-cmd-agent3 hermes-cmd-agent4
```

**PITFALL — Restart required:** Changing `allowed_users` in config.yaml doesn't take effect until the gateway process is restarted. Hot-reload doesn't pick up allowed users changes.

## car.financecheque.uk Site Content (Scraped)

The site is a **PCP refund claims service** — "PCP Refund" (trading name of Jigsaw Claims Ltd, FCA #912323, Manchester). Dark theme with green (#4ade80) and gold accents. Key content:

- **H1:** "WERE YOU MIS-SOLD CAR FINANCE?"
- **Tagline:** "Join thousands reclaiming what they're owed. The FCA is investigating secret commissions"
- **Stats:** Average refund £1,100 (FCA confirmed £829), deadline August 31 2027
- **CTA:** "Check Eligibility" at /claim
- **Marquee:** "NO WIN NO FEE* • FCA INVESTIGATION • CHECK ELIGIBILITY"
- **Contact:** info@jigsawclaims.co.uk
- **Brand colors:** Dark slate (#0f172a), green (#10b981), gold accent
- **Tech stack:** React SPA with TailwindCSS, Lucide icons, Unsplash images

**Full scrape saved at:** `/tmp/car_site_content.txt`
**Screenshot at:** `/tmp/car_financecheque_screenshot.png`

## PITFALL — Cloudflare Blocks Headless Scraping on car.financecheque.uk

car.financecheque.uk serves a Cloudflare JS challenge to curl (403). Headless Chromium without fingerprint randomisation also gets blocked. But Playwright with a realistic user agent + 8-second delay after domcontentloaded DOES bypass the challenge.

**Working approach:**
```python
import asyncio
from playwright.async_api import async_playwright

async with async_playwright() as p:
    browser = await p.chromium.launch(headless=True)
    context = await browser.new_context(
        viewport={'width': 1920, 'height': 1080},
        user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
    )
    page = await context.new_page()
    await page.goto('https://car.financecheque.uk', wait_until='domcontentloaded', timeout=30000)
    await asyncio.sleep(8)  # Allow Cloudflare challenge JS to execute
    screenshot = await page.screenshot(path='/tmp/car_financecheque_screenshot.png', full_page=True)
    text = await page.inner_text('body')
    html = await page.content()
    await browser.close()
```

**Requirements:** `pip3 install --break-system-packages playwright` then `python3 -m playwright install chromium`

## WhatsApp Allowed Users

WhatsApp allowed users is configured in `~/.hermes/.env`:
```
WHATSAPP_ALLOWED_USERS=+447****3262,+447860272148
```
Comma-separated list. The masking you see in tool output (showing `****`) is display-level redaction only — the actual file contains uncensored digits. Gateway must be restarted for WhatsApp config changes to take effect.

## Paperclip Billing Currency Change (USD → GBP)

Script: `~/paperclip-fix/update_currency.js`

```js
const { Client } = require('pg');
const client = new Client({ host: '127.0.0.1', port: 54329, user: 'paperclip', password: 'paperclip', database: 'paperclip' });
```

**Steps (already in the script):**
1. `ALTER TABLE companies ADD COLUMN currency text NOT NULL DEFAULT 'GBP'` (if not exists)
2. `UPDATE companies SET currency = 'GBP' WHERE currency != 'GBP'`
3. `ALTER TABLE finance_events ALTER COLUMN currency SET DEFAULT 'GBP'`
4. `UPDATE finance_events SET currency = 'GBP' WHERE currency != 'GBP'`

Run: `cd /home/ubuntu/paperclip-fix && node update_currency.js`

Verified: company "Finance Cheque UK" now shows `"currency": "GBP"` via `GET /companies/{id}`.

## PITFALL — Paperclip Database Uses finance_events for Currency, Not Companies

## Paperclip API Endpoint Patterns

Paperclip does NOT use `/api/companies/me` or `/api/agents`. Correct patterns:
- Company: `GET /companies/{company_id}` → `http://127.0.0.1:3100/companies/43406ede-016c-4d24-ac10-8ceaa113804e`
- Agents: `GET /companies/{id}/agents` → empty if no agents hired
- Org: `GET /companies/{id}/org`
- Issues: `GET /companies/{id}/issues`
- Dashboard: `GET /companies/{id}/dashboard`

## Social Icons (Updated)

**Social icons moved into the header** (inside `<header class="cd-header">`), placed between the nav-trigger and the fullscreen bar, alongside the branding form. Use the existing header flex structure.
```
`margin-left: auto` is what pushes the icon group to the far right of the flex header.

**WhatsApp number:** +44773262 (partial — full number known to user). Update the `wa.me/` href if it changes.

## Server Maintenance & Update Procedures

### Full Maintenance Checklist
1. **System packages:** `sudo apt-get update && sudo apt-get upgrade -y`
2. **Hermes agent:** `cd /home/ubuntu/.hermes/hermes-agent && git pull` then `pip3 install -e . --break-system-packages`
3. **Datro repo:** `cd /home/ubuntu/datro && git pull`
4. **Sync UI script:** Set `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` env vars, then `bash /home/ubuntu/datro/sync-ui.sh`
5. **PM2:** `sudo pm2 update`
6. **Service health:** `systemctl is-active nginx hermes-gateway netdata jellyfin auth-server gui`
7. **Disk usage:** `df -h`

### PITFALL — Hermes Agent: Local Changes Block git pull
The local `gateway/run.py` has custom modifications that conflict with upstream merges. Before pulling:
```bash
cd /home/ubuntu/.hermes/hermes-agent
git stash && git pull && git stash pop
```
The hermes-agent is installed as an editable package via `pip3 install -e . --break-system-packages`. No venv exists; packages are in `~/.local/lib/python3.12/`.

### PITFALL — Datro Repo: Sparse Checkout Blocks sync-ui.sh
The datro repo has sparse checkout enabled, which blocks `sync-ui.sh` from seeing 38+ dirty files (the script fails with exit code 1).
**Fix before running sync script:**
```bash
cd /home/ubuntu/datro
git sparse-checkout disable
```
After disabling, the sync script will see all dirty files and proceed normally.

### PITFALL — sync-ui.sh Commits Massive Diffs to gh-pages
The sync script runs `git add -A && git commit` when dirty files exist, which can commit 14,000+ files (including docusaurus sites, bpvsbuckler archives, library builds) to the `gh-pages` branch. Review the branch state after sync to ensure the push succeeded and clean up if needed.

## Pitfalls
- **Avatar iframe mic permissions:** Must include `allow="microphone"` and `sandbox="allow-scripts allow-same-origin ..."`. If mic fails, the parent page can proxy via `postMessage({ type: 'request-mic' })`.
- **Avatar in split view:** Must be compact — use `min(90px, 28vw)` for sizing, percentage-based positioning, and no scrollbar. The top half is only 50% viewport height.
- **nginx `alias` vs `root`:** Use `alias` for `/avatar/`, `root` for `/`. Mixing them up causes 404s.
- **Permission on `/var/www/datro-ui/`:** Files owned by `ubuntu:ubuntu`, nginx runs as `www-data` (needs read access).
- **Permission on `/var/www/avatar-system/`:** Often created by root; must `sudo chown -R ubuntu:ubuntu` before writing.
