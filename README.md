# Finance Cheque UK (FCUK)

**Universal Agentic A.I Lead Generation**

A joint venture between [Vcare Saver Club Limited](https://vcaresaverclub.co.uk) and [Datro Consortium Limited](https://datro.xyz).

---

## What is FCUK?

Finance Cheque UK is an AI-powered lead generation marketplace:

- **Lead Buyers** submit orders (website URL, budget per lead, quantity) and pay in FCUK credits.
- **Lead Sellers** install the FCUK Proxy on their machine. Their machine joins the network as a child proxy, uses AI agents to generate leads for buyers, and earns credits.
- Credits can be exchanged for GBP or BTC via the Exchange page.

---

## Website

Live at [financecheque.uk](https://financecheque.uk)

The homepage has two sides:
- **Left — Lead Buyer**: Submit a lead order (URL, budget, quantity). Demo balance starts at 1000 credits.
- **Right — Lead Seller(s)**: See the AI agents. Click Stacey to open the demo agent, connect a social account, and watch credits flow.

Register to unlock the full dashboard, top up your wallet, and manage your agents.

---

## Joining the Network (Lead Seller)

Run this one-liner on any Linux or macOS machine:

```sh
curl -fsSL https://financecheque.uk/fcukproxy/install.sh | sh
```

This will:
1. Download the FCUK Proxy agent (`~/.fcukproxy/agent.py`)
2. Generate a unique machine config (`~/.fcukproxy/machine.json`)
3. Install a systemd user service (Linux) to keep the agent running
4. Start a local web GUI at **http://localhost:6001**

The proxy runs on port `6000` and connects to the parent proxy at `financecheque.uk`. It discovers other child proxies on your local network via UDP multicast.

---

## Architecture

```
financecheque.uk (parent proxy)
        │
        ├── Child Proxy A (your machine, port 6000)
        │       └── GUI at localhost:6001
        ├── Child Proxy B (another machine)
        └── Child Proxy C (another machine)
```

Each child proxy:
- Receives lead generation tasks from the parent
- Routes LLM calls (parent → peers → local)
- Reports stats back to the platform
- Earns FCUK credits per lead generated

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite + TypeScript + Tailwind CSS v4 |
| Backend | Cloudflare Pages Functions (Workers) |
| Database | Cloudflare D1 (SQLite) |
| Auth | bcryptjs + jose (JWT HS256, 7-day sessions) |
| Payments | Stripe (Cloudflare Pages Function) |
| Proxy Agent | Python 3 + aiohttp |
| Peer Discovery | UDP multicast (STP-inspired) |

---

## Development

```sh
npm install
npm run dev        # starts Vite + Express dev server on :3000
npm run build      # production build → dist/
```

Environment variables (copy `.env.example` to `.env`):

```
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

Cloudflare secrets (set via dashboard, not committed):
```
JWT_SECRET=<random 32+ char string>
STRIPE_SECRET_KEY=sk_live_...
```

---

## Changelog

See [CHANGELOG.md](./CHANGELOG.md)
