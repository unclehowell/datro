# Inverse Ouroboros — Whitepaper

> A self-expanding AI architecture. From one command to a hive-mind semantic memory system.

**Live:** [whitepaper.financecheque.uk](https://whitepaper.financecheque.uk)  
**Version:** v0.0.1  
**Deployed via:** Cloudflare Pages (`whitepaper` project)

---

## What This Is

A single-page whitepaper explaining the Algocracy / Inverse Ouroboros architecture:

- One-line install → sub-proxy on localhost:4117
- Kiro CLI in tmux → free agentic LLM fallback
- Hermes agent → WhatsApp/Telegram interface
- Honcho + Mem0 → persistent semantic memory
- Boolean Simplifier → hourly self-sharpening mind palace
- Community pool → federated hive mind

## Structure

```
whitepaper/
├── index.html      # Full whitepaper (single page)
├── version.json    # Semantic version
├── CHANGELOG.md    # Release history
└── README.md       # This file
```

## Deploy

```bash
CLOUDFLARE_API_TOKEN=<token> wrangler pages deploy whitepaper --project-name whitepaper
```

## Features

- Animated canvas intro (Remotion-style, no build step)
- Copy-to-clipboard install command
- Download as PDF (browser print)
- Fully responsive, dark theme
- No external JS dependencies
