# CHANGELOG (Right) — Stability & Infrastructure

## Infrastructure Milestones

| Date | Change |
|---|---|
| 2026-05-31 | Laptop child proxy registered on financecheque.uk (port 4001) |
| 2026-05-31 | AWS Main + Command registered as placeholders (unreachable) |
| 2026-05-31 | Loop prevention: X-Forwarded header routing implemented |
| 2026-05-31 | Chat flag: X-Chat-Only enforcement in parent proxy |
| 2026-05-31 | Response-time routing: avg_response_ms per proxy node |
| 2026-05-31 | Termux one-liner installer created |
| 2026-05-31 | Parent proxy multi-provider LLM fallback (OpenRouter → Gemini → Echo) |
| 2026-05-28 | CF worker first deployed to cloudflare |
| 2026-05-28 | Dashboard Express server on port 3000 |
| 2026-05-27 | Initial monorepo setup |

## Proxy Node Registration

| Node | Status | URL | Registered |
|---|---|---|---|
| UncleHowell-Laptop | Active | http://192.168.1.118:4001 | 2026-05-31 |
| AWS Main (Arm) | Unreachable | http://44.194.23.52:4001 | 2026-05-31 |
| AWS Command (x86) | Unreachable | http://13.135.142.244:4001 | 2026-05-31 |
