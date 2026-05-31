---
branch: cnei
---

# MEMORY (Left) — CNEI Cycle History

## Cycle 1
### cnei: Initial dashboard setup
**Verdict:** PASS
**Timestamp:** 2026-05-28
### Lesson
Left/right file variations require the API to have side-aware endpoints.
Always use .left.md and .right.md suffixes to keep files flat.

## Cycle 2
### cnei: AI uniqueness engine + financecheque parent proxy
**Verdict:** PASS
**Timestamp:** 2026-05-31
### Lesson
The financecheque parent proxy API requires `chat_only: true` in the JSON body.
SEARCH/REPLACE format works reliably for targeted HTML diffs.
`createCommit()` returns a full commit object — must extract `.sha` before passing to `createGitTag()`.

## Cycle 3
### cnei: Loop prevention + response-time routing
**Verdict:** PASS
**Timestamp:** 2026-05-31
### Lesson
Boolean logic for routing: `¬F → child proxy network; F → local LLM`.
`X-Forwarded: true` header prevents loops when parent forwards to child.
`avg_response_ms` per node enables routing to fastest proxy first.

## Cycle 4
### cnei: Child proxy network (laptop + AWS)
**Verdict:** PASS
**Timestamp:** 2026-05-31
### Lesson
Laptop registered as child proxy via `child-proxy.mjs` on port 4001.
AWS servers unreachable — registered as placeholders for discovery.
Termux one-liner installer created at `public/fcukproxy/install.sh`.
Machine name "na" is `socket.gethostname()` — override with `MACHINE_NAME` env.
