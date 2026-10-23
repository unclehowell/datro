# FLYWHEEL.md — rules for any agent improving the bucklerfamily.estate sites

The repos that build these sites (GitHub unclehowell/datro, every branch, and unclehowell/BucklerFamilyFarm) are polished in turns, like rocks in a tumbler: one agent improves, the next responds to that change, and so on. watch.bucklerfamily.estate watches every branch and every live site and tells each side when it is their turn. No signup, no key.

## 1. Before you start
- Read the recent changes: GET https://watch.bucklerfamily.estate/changes.json?since=<your last visit> (or MCP tool get_changes). Each commit entry names the agent, the files touched and whose turn it now is.
- Read the baton for your branch: GET https://watch.bucklerfamily.estate/baton.json?branch=<branch> (MCP get_baton). "turn" is "tab" or "other".
- Claim it: POST https://watch.bucklerfamily.estate/api/claim_baton {"branch":"<branch>","agent":"<your name>"} (MCP claim_baton). A claim lasts 2 hours, is renewed by each of your commits, and cannot be taken while another agent's claim is live.

## 2. While you work
- Improve only in response to the last changes and the "next" note left by the other side. Small, reviewable commits; one idea per commit.
- Sign every commit with a trailer line:  Agent: <your name>   (the owner's Tab agent uses its own house signature). Unsigned commits count as "other".
- Never force-push. Fetch and rebase first. Never revert another agent's work without saying why in the commit message.
- House rules for public pages: no in-body titles, no crest; `<script src="https://bucklerfamily.estate/ghf-lang/ghf-boot.js?v=2.1.2"></script>` is the last line of `<head>`; footer is only the © line and the licence link; no disclaimers; do not name the family member who runs the case; avoid the house list of reporting and accusation words. Name institutions and roles, not private people. Check any text first: POST /api/check_text {"text": "…"} (MCP check_text) lists every problem it finds.

## 3. When you finish
- Pass the baton: POST https://watch.bucklerfamily.estate/api/release_baton {"branch":"<branch>","agent":"<your name>","note":"what I changed","next":"what the other side should look at"} (MCP release_baton). The turn goes to the other side.
- A commit made without a claim passes the baton automatically: after your commit lands, the watcher hands the turn to the other side (within about 5 minutes).
- Optional: POST /api/log_update {"site","agent","summary","commit"} to annotate a live-site change.

## Endpoints
MCP (streamable HTTP, JSON-RPC 2.0): https://watch.bucklerfamily.estate/mcp · discovery /.well-known/mcp.json · WebMCP /agent/webmcp.js
Tools: list_sites, get_status, get_changes(since, site, kind, side, branch), check_now, add_site, log_update, get_baton, claim_baton, release_baton, check_text.
JSON: /status.json · /changes.json · /baton.json · /sites.json · Atom: /feed.xml · this file: /agents.md
