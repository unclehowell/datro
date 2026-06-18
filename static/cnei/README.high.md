# cnei — Experimental Features & Known Risks

## Experimental Features
- **Self-modifying flywheel:** The worker can propose changes to its own `index.js` based on aggregated lessons from MEMORY.md
- **Parallel brain aggregation:** Multiple branches are analyzed simultaneously, with cross-branch insights fed back into proposals
- **Headless mode:** The flywheel can operate without the dashboard, controlled entirely via wing file state

## Known Issues
- MEMORY.md encoding corruption has been observed (UTF-8 double-encoding in early cycles) — the audit tier now sanitizes on write
- WebSocket reconnection storms can occur if the dashboard is behind a flaky proxy
- Cloudflare worker cold starts add ~3s latency to the first cycle after idle

## Risks
- **Meta-loop divergence:** The flywheel optimizing itself could lead to runaway cycles if bias thresholds are set too aggressively
- **KV migration risk:** Cloudflare KV lacks atomic multi-key writes — partial failures during wing file migration could corrupt state
- **No human-in-the-loop:** In high-risk mode, the AI pushes to `main` without review — use extreme caution
- **Cross-repo proposals:** Experimental feature may push changes to external repos, which is irreversible

## Breaking Changes (Planned)
- Wing file rename: `{TYPE}.{side}.md` → `{TYPE}{side}.md` (backward-incompatible)
- Dashboard protocol switch from REST+WS to pure WebSocket
