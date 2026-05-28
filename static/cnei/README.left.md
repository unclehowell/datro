# CNEI — Autonomous Flywheel Core

The cnei branch is the command centre for the DATRO flywheel.

## What it does
- Runs a CF Worker every hour at :30 to release improvements across 21 branches
- Hosts the FCUK Command Bridge dashboard for local steering
- Self-improves: each cnei release enhances its own code

## Getting Started
1. Clone the repo: `git clone https://github.com/unclehowell/datro -b cnei`
2. Install dashboard: `cd dashboard && npm install`
3. Start: `node server.js` or `pm2 start server.js --name dashboard`
4. Open http://localhost:3000

## Architecture
- `flywheel-cf/src/index.js` — CF Worker (hourly cron)
- `dashboard/` — Express web GUI + auto-update daemon
- `static/{branch}/*.left.md` — Left file variations
- `static/{branch}/*.right.md` — Right file variations
