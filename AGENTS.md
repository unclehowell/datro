# Datro Flywheel — Agent Context

## Project Overview

Automated multi-branch release engine running on two infrastructure:
- **AWS EC2** (1 vCPU, 1 GB RAM, Ubuntu) — primary flywheel
- **Cloudflare Workers** — secondary flywheel (CF cron: `30 * * * *`)

AWS produces **3 bug + 1 UX fix releases** per branch, hourly (cron: `0 * * * *`), with `-aws` tag suffix.
CF produces **maintenance releases** for all 21 branches, every 30 min (cron: `30 * * * *`), without `-aws` suffix.

## Two Flywheels, One System

| Aspect | AWS Flywheel | CF Flywheel |
|---|---|---|
| Cron | `0 * * * *` | `30 * * * *` |
| Location | EC2 `13.135.142.244` | `flywheel.righteous.workers.dev` |
| Source | `flywheel/multi-branch-release.sh` | `flywheel-cf/src/index.js` |
| Releases | 3 bug + 1 UX fix, AI-generated | Maintenance (tag-only) |
| Tag | `{branch}-v0.0.X.Y-aws` | `{branch}-v0.0.X.Y` |
| Cooldown | 1h per branch | 1h per branch |
| State | `release-state.json` on EC2 | KV namespace `FLYWHEEL_STATE` |
| OTA | Self-updates from cnei branch | Deployed via wrangler from AWS |

## Self-Improvement Cycle

1. CF creates cnei release every 2 hours (every second CF run)
2. AWS detects new cnei release → runs `ota-update.sh`
3. OTA pulls `flywheel/` and `flywheel-cf/` from cnei branch
4. CF worker is redeployed via wrangler
5. Human (opencode) commits improvements to cnei branch flywheel code
6. Next CF release + OTA propagates the improvements

## Upward Spiral Safeguards

- **Version validation**: OTA validates scripts (`bash -n`, `python3 -m py_compile`) before replacing
- **Rollback**: Previous versions kept in `~/.fcukproxy/backups/`
- **Health check**: Post-OTA smoke test runs before replacing critical files
- **Rate limiting**: Max 12 OTA updates per day (every 2 hours)
- **Cooldown isolation**: AWS only tracks `-aws` tags; CF ignores `-aws` tags

## Branches

21 branches, each deploying to Cloudflare Pages:
`althea archives bpvsbuckler carfinancecheque ccan ceo dash datro dcc financecheque gui hbnb library llmwiki cnei subrepos ui wave wayback pirateclaw`

cnei branch = control plane (flywheel code + dashboard)
financecheque = proxy agent code

## Key Endpoints

- `flywheel.righteous.workers.dev/__state` — CF rotation state
- `flywheel.righteous.workers.dev/__debug?branch=X` — CF cooldown status
- `cnei.datro.xyz` — Dashboard / status page
- `/home/ubuntu/.fcukproxy/release-state.json` — AWS state file
