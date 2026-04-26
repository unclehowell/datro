# PirateClaw Changelog

## 0.0.1.29 - 2026-04-26

- Fixed installer heredoc bug that could emit `sh: ... SH: not found` during script execution.
- Hardened generated `start-all.sh`/`stop-all.sh` scripts with stable quoted heredoc generation.
- Synced version metadata across installer fallback, dashboard server, subproxy server, and `version.json`.
- Added Cloudflare Pages root `wrangler.toml` with `pages_build_output_dir = "static/pirateclaw"`.

## 0.0.1.28 - 2026-04-26

- Added unified installer, network-health API, and dashboard network tree.
- Added service manager support (systemd/pm2) with nohup fallback.
