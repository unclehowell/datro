---
name: display-ads
description: >
 Generate display ads with consistent branding across all ad sizes via an agent-configurable system.
 Variables stored in /home/ubuntu/datro/static/brain/skills/display-ads/config.json
 category: web
---

# Display Ads - Agent-Configured Ad Generator

## System Overview

Generates multiple display ad variations with **consistent branding** (same background image, logo, smallprint) across all formats at `/canvas/`.

## Architecture

- **UI**: Static HTML at `/home/ubuntu/datro/static/canvas/index.html` (never modified by agent)
- **Configuration**: `/home/ubuntu/datro/static/brain/skills/display-ads/config.json` (agent-editable)
- **Assets**: `/home/ubuntu/datro/static/canvas/assets/` directory
- **Live**: https://command.financecheque.uk/canvas/

## Features

- Generate multiple ad variations from combinations of:
  - 5 background colors
  - 5 headlines  
  - 5 banner dimensions
- **Same background**, logo, smallprint on all ads
- Two actions: Fullscreen view or PNG export (exact dimensions)
- Side menu stores settings, canvas remains stable
- Auto-loads config from file system

## Configuration File

**Location**: `/home/ubuntu/datro/static/brain/skills/display-ads/config.json`
**Web Access**: `/home/ubuntu/datro/static/canvas/config.json` (symlink)

Schema:
```json
{
  "assets": {
    "background": "assets/img/boxed-bg.jpg",
    "logo": "assets/img/logo.png"
  },
  "text": {
    "headlines": ["Headline 1", "Headline 2", "..."],
    "smallprint": "Terms and conditions..."
  },
  "colors": [
    { "name": "Color Name", "value": "#hexcode" }
  ],
  "dimensions": [
    { "name": "Banner Name", "width": 300, "height": 250 }
  ]
}
```

## Agent Commands

### Update Background Image
```bash
cp /path/to/new-bg.jpg /home/ubuntu/datro/static/canvas/assets/img/
edit /home/ubuntu/datro/static/brain/skills/display-ads/config.json
# Update: assets.background = "assets/img/new-bg.jpg"
```

### Update Logo
```bash
cp /path/to/logo.png /home/ubuntu/datro/static/canvas/assets/img/
edit /home/ubuntu/datro/static/brain/skills/display-ads/config.json
# Update: assets.logo = "assets/img/logo.png"
```

### Add Headline
```bash
edit /home/ubuntu/datro/static/brain/skills/display-ads/config.json
# Add to: text.headlines[]
```

### Change Smallprint
```bash
edit /home/ubuntu/datro/static/brain/skills/display-ads/config.json
# Update: text.smallprint = "New terms..."
```

### Add Background Color
```bash
edit /home/ubuntu/datro/static/brain/skills/display-ads/config.json
# Add to: colors[]: { "name": "Color", "value": "#HEX" }
```

### Add Dimension
```bash
edit /home/ubuntu/datro/static/brain/skills/display-ads/config.json
# Add to: dimensions[]: { "name": "Name", "width": X, "height": Y }
```

## UI Actions

### User
1. Click "⚙️ Edit Ads" to open settings
2. Select options (colors, headlines, dimensions)
3. Click "Generate Ads"
4. Click "Fullscreen" to view ad in fullscreen
5. Click "Export PNG" to download at exact dimensions

### Agent
Agent only modifies `/home/ubuntu/datro/static/brain/skills/display-ads/config.json` - never touches the HTML file directly.

## Nginx

Location: `/etc/nginx/sites-available/datro`
```nginx
location /canvas/ {
  alias /home/ubuntu/datro/static/canvas/;
  index index.html;
  try_files $uri $uri/ /canvas/index.html;
}
```

## Troubleshooting

**Config not loading:** Verify symlink exists:
```bash
ls -la /home/ubuntu/datro/static/canvas/config.json
```

**Wrong folder:** Config must be at `/home/ubuntu/datro/static/brain/skills/display-ads/config.json`

**No styles:** Assets must be in `/home/ubuntu/datro/static/canvas/assets/`

## Skills Integration

For agent-driven updates:
1. Edit `/home/ubuntu/datro/static/brain/skills/display-ads/config.json`
2. Reload canvas page (config loads dynamically)

No build/compilation required - handler script loads JSON at runtime.
