---
name: ui-redesign-with-design-md
description: Redesign an existing web UI using DESIGN.md files from the awesome-design-md library. Drops in proven design systems (Linear, Vercel, Stripe, etc.) to transform legacy interfaces into modern, professional designs.
category: devops
triggers:
  - redesign the UI
  - improve the web UI design
  - make the interface look better
  - apply a design system to my website
  - modernize the frontend
  - awesome-design-md redesign
  - install awesome-design-md
---

# UI Redesign with DESIGN.md

> Install this as a skill first: `awesome-design-md` from the Brain skills directory.

## Workflow Overview

When the user asks to improve or redesign a web UI, use the awesome-design-md skill to apply a proven design system rather than improvising.

## Step 1: Install the Skill

The LobeHub marketplace CLI requires credentials. Skip it and install from GitHub directly:

```bash
git clone https://github.com/Aradotso/trending-skills.git /tmp/trending-skills 2>&1
cp -r /tmp/trending-skills/skills/awesome-design-md ~/.hermes/skills/
cp -r /tmp/trending-skills/skills/awesome-design-md ~/brain/skills/
```

Read the installed SKILL.md: `skill_view(name='awesome-design-md')`

## Step 2: Fetch Relevant DESIGN.md Files

Download design systems from the VoltAgent/awesome-design-md repo. Choose based on the use case:

| Target Style | DESIGN.md URL | Best For |
|---|---|---|
| Linear (dark precision) | `https://raw.githubusercontent.com/VoltAgent/awesome-design-md/main/design-md/linear.app/DESIGN.md` | AI agent dashboards, developer tools |
| Vercel (minimal monochrome) | `https://raw.githubusercontent.com/VoltAgent/awesome-design-md/main/design-md/vercel/DESIGN.md` | Clean SaaS, developer infrastructure |
| Stripe (purple gradients) | `https://raw.githubusercontent.com/VoltAgent/awesome-design-md/main/design-md/stripe/DESIGN.md` | Fintech, payment products |
| Supabase (dark emerald) | `https://raw.githubusercontent.com/VoltAgent/awesome-design-md/main/design-md/supabase/DESIGN.md` | Dark dashboards, data tools |

Download to project root:
```bash
mkdir -p /var/www/<project>/design-system
curl -sL "<URL>" -o /var/www/<project>/design-system/DESIGN.md
```

## Step 3: Read Design Tokens

Read the DESIGN.md file and extract:
- **Color palette** (background surfaces, text hierarchy, accent colors, borders)
- **Typography** (font families, weights, letter-spacing, hierarchy table)
- **Components** (buttons, cards, inputs, nav with states)
- **Spacing** (sizing scale, grid system)
- **Shadows/depth** (elevation system)

## Step 4: Apply to Existing UI

**DO NOT** ask the user to pick a style — choose the best match and implement it directly.

1. **Read the current HTML/CSS** — identify what exists
2. **Replace the design tokens** — swap colors, fonts, spacing for the new system
3. **Preserve functionality** — keep all iframes, navigation, event handlers, login systems
4. **Strip dead dependencies** — remove unused jQuery, old CSS frameworks, tracking cruft
5. **Modernize the structure** — use CSS custom properties (`:root`), semantic HTML, flex/grid

Key patterns:
- All colors → CSS variables in `:root {}`
- Font imports via Google Fonts or system fallbacks
- Mobile-first responsive with `@media` queries
- Vanilla JS only — no jQuery dependency for simple UI

## Step 5: Verify

1. Check nginx is serving: `curl -sI https://<domain>` → 200 OK
2. Check content-length changed (new file is live)
3. If browser is available, visually verify with browser_vision
4. Report what changed to the user

## Pitfalls

- **LobeHub CLI needs auth** — always use `git clone` instead
- **DESIGN.md repo is VoltAgent/awesome-design-md** — Aradotso's repo is just the marketplace aggregator
- **Don't break existing functionality** — login gates, sandboxes, iframes, event listeners must all survive the redesign
- **Hardcoded passwords** — never remove or alter authentication logic, even if it's client-side
- **Caching** — nginx may cache old files; check `Last-Modified` header to confirm new version
