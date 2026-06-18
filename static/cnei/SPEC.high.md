# SPEC — High Wing (High-Risk / Experimental)

## Experimental Features
- Self-modifying flywheel that rewrites its own `index.js` based on aggregated lessons
- Branch auto-creation from dashboard with zero human review
- AI tier allowed to push directly to `main` on PASS verdicts
- Real-time wing file editing via WebSocket with no local backup

## Risky Refactors
- Replace Express backend with pure WebSocket for all dashboard IO
- Migrate wing file storage to Cloudflare KV with local cache fallback
- Drop audit tier for branches with >90% historical PASS rate

## Breaking Changes
- Rename all wing files to `{TYPE}{side}.md` (remove dot) — breaks every existing reference
- Collapse 16 wing files into 4 composite files (one per type with side sections)
- Remove dashboard entirely; flywheel must spawn headless UI-less mode

## Known Dangers
- Meta-improvement loops could diverge and corrupt the entire branch tree
- Auto-push to `main` has no human-in-the-loop safety valve
- Cloudflare KV has no atomic multi-key writes — partial updates risk data loss
