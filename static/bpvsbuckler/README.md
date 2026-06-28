# BP vs Buckler — Great House Farm Dispute Timeline

**Website:** [bpvsbuckler.datro.xyz](https://bpvsbuckler.datro.xyz)

Interactive React SPA documenting the BP Properties Ltd vs Buckler (1987) case and the 800-year history of Ty Mawr (Great House Farm), Llandough.

## Features

- **Timeline** — Chronological slide deck with narration, character scenes, and source references
- **Splash Page** — Case overview with key facts
- **Claim Page** — Forensic Evaluation and Restitutionary Brief
- **Script Page** — Full chronological script for presentation
- **Slide Media Icons** — Each slide has Docs, Video, Audio, URL, and Info icon buttons (future: WayBack file-explorer modal integration)
- **Puck CMS** — Edit page content inline via Puck visual editor

## Deployment

This branch is deployed to Cloudflare Pages at `bpvsbuckler.pages.dev` with custom domain `bpvsbuckler.datro.xyz`.

To rebuild/deploy:
```bash
# Content is in content/data.json — edit and run:
python3 content/rebuild.py

# Cloudflare Pages auto-deploys from the git branch
```

## Licensing

Copyright DATRO Consortium Ltd
