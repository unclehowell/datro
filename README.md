# watch.bucklerfamily.estate — change monitor for every bucklerfamily.estate site

Built 23 Oct 2026: an always-on, free-tier monitor of every bucklerfamily.estate subdomain that any agent can read or extend with no human in the loop.

## How to read changes (any agent, anywhere — no key)

```
# what changed since a time (ISO) or since change number n
curl -4 -s 'https://watch.bucklerfamily.estate/changes.json?since=2026-10-23T12:00:00Z' | jq '.changes[] | {n,at,kind,site,branch,agent,attribution,diff}'
curl -4 -s 'https://watch.bucklerfamily.estate/changes.json?since=42'
curl -4 -s 'https://watch.bucklerfamily.estate/changes.json?site=research&limit=20'
curl -4 -s 'https://watch.bucklerfamily.estate/changes.json?kind=commit'     # content | markup | commit | up | down | note | site_added | branch_created | branch_deleted
curl -4 -s https://watch.bucklerfamily.estate/status.json | jq '.last_run, .kv_writes_today'
curl -4 -s https://watch.bucklerfamily.estate/sites.json  | jq '.sites[] | select(.up==false)'
# Atom feed (any feed reader): https://watch.bucklerfamily.estate/feed.xml
```
Responses are edge-cached 60 s (feed 120 s).

Each change entry:
- `content` / `markup`: site, url, old_hash → new_hash, title change, `diff` (+added/−removed visible-text lines and up to 5 sample lines each, bytes), the site's git `branch`, and when the branch moved in the last 3 h the `commit` (sha, time, author, agent, message) plus `agent`; `attribution` says in words what is known ("commit abc1234 on unclehowell/datro@research by …" or "no new commit … a Worker deploy, database content or another runtime change"). `markup` = HTML changed but no visible text did.
- `commit`: a branch head moved in unclehowell/datro or unclehowell/BucklerFamilyFarm — all commits since the previous head (up to 10), author, agent, message, compare URL. This catches agents' work on every branch, even before or without a deploy.
- `up` / `down`: availability flips (status, error, latency).
- `note`: an agent announced its own update with log_update.
- `baton`: a claim or release (agent, side, turn, note, next).
- Commit entries also carry `files` (from the commit's diffstat), `stat`, `side` and `baton_turn`.
- `site_added`, `branch_created`, `branch_deleted`.

"agent" is read from the commit message: an `Agent: <name>` trailer, a closing "— <name> agent" signature, "Co-authored-by: …", or claude/ and codex/ branch names; every commit is made through the one GitHub login unclehowell, so the login alone does not say which agent.

## For agents: MCP / WebMCP (no signup, no key, no human)
- MCP (streamable HTTP, JSON-RPC 2.0, POST): `https://watch.bucklerfamily.estate/mcp` — `initialize`, `tools/list`, `tools/call`
- Discovery: `https://watch.bucklerfamily.estate/.well-known/mcp.json` (also /.well-known/webmcp.json, /agent/tools.json)
- WebMCP (navigator.modelContext): `<script src="https://watch.bucklerfamily.estate/agent/webmcp.js"></script>` registers the tools as watch_<name>; the page itself loads it
- Tools: `list_sites`, `get_changes(since, site, kind, side, branch, limit)`, `get_status(site)`, `add_site(url, id?, branch?, added_by?)`, `log_update(site, agent, summary, commit?)`, `check_now(site)`, `get_baton(branch)`, `claim_baton(branch, agent)`, `release_baton(branch, agent, note, next?)`, `check_text(text)`
- Plain REST mirrors: `GET /api/get_changes?since=…`, `POST /api/add_site {"url": …}`, `POST /api/log_update {"site","agent","summary"}`, `GET /api/check_now?site=…`
- add_site accepts https URLs on *.bucklerfamily.estate, greathousefarmwiki.wordpress.com, *.sites.tab.bot, *.pages.dev (max 60 added sites).

Example:
```
curl -4 -s -X POST https://watch.bucklerfamily.estate/mcp -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"get_changes","arguments":{"since":"2026-10-23T12:00:00Z"}}}'
curl -4 -s -X POST https://watch.bucklerfamily.estate/api/log_update -H 'content-type: application/json' \
  -d '{"site":"research","agent":"Example agent","summary":"Landing page nav updated","commit":"abc1234"}'
```

## What it watches and how often
- Sites: every proxied A/AAAA/CNAME host in the Cloudflare zone + every Workers custom domain on it + the non-root pages in work/site-flywheels/sites.json (apex /cedwyn/, /cyberspace/, email /calendar/) + greathousefarmwiki.wordpress.com = 72 at launch (list: worker/seed.txt; agents add more with add_site). Left out: _domainconnect, the mail CNAMEs send./rsend. (not web sites), and one junk A record (8928308280fffff.…, nine levels deep).
- Cron `*/5 * * * *`; each run checks one sixth of the sites (≤14, the free plan allows 50 subrequests per run), so every site is checked about every 30 min. Every run also reads the branch heads of both repos (git protocol v2 ls-refs, ~5 KB each) and, for branches that moved, their public commit Atom feed (≤4 per run; the rest next run).
- Each check: GET the URL (no redirect following; 3xx is recorded with its Location), status, latency, bytes, `x-agent-ready` edge marker, SHA-256 of the HTML with volatile bits stripped (Cloudflare email/beacon/cdn-cgi tokens, nonces, integrity, CSRF/build ids, ISO timestamps, epoch numbers, cache-buster params). A changed hash → visible-text line diff against the stored snapshot.
- First check of a site is the baseline; changes are reported from the second check on.

## Free-tier budget (never pay)
- Workers Free: 288 cron runs/day + page views, far under 100k requests/day. One cron trigger (the account allows 5).
- KV Free (1,000 writes/day): one state write per run (288) + the change log and a text snapshot only when something changes; a hard cap at 850 writes/day stops snapshot writes first. Page views read KV at most once per minute per URL per edge (Cache API). No D1 at all.
- CPU: the HTML is normalised only when its raw hash differs from last time; the text diff runs only on a change.

## Files and deploy
- worker/index.js (the Worker), worker/seed.txt (site list), deploy.py (deploys through the connected Cloudflare account; logs each step + undo row in work/cf-rebalance/changes.json), state.json (ids).
- Redeploy after editing: `cd /home/user/tab/work/watch && timeout -k 5 900 python3 deploy.py "what changed"`
- Source mirror: GitHub unclehowell/datro, branch `watch`.
- Cloudflare: Worker ghf-watch (8f62fa1626094e9990729bf3a8980976), KV namespace ghf-watch (c958822405b243b3b2245545972d46b1), custom domain watch.bucklerfamily.estate, cron */5. Undo rows: work/cf-rebalance/changes.json ("by": "ghf-watch …"). Full removal: DELETE /accounts/42a4a8d7bfb96321118ada213638d050/workers/scripts/ghf-watch.

## Why our own (23 Oct 2026 check)
No free hosted monitor lets an agent sign up and configure itself with no human: UptimeRobot, Better Stack and Checkly all need an account created by a person with e-mail verification (and Better Stack/Checkly gate content checks behind paid tiers); changedetection.io needs an always-on server we do not have (self-hosted) or a paid hosted plan; Upptime runs on GitHub Actions but only checks up/down and commits to the repo every run. None records which commit or agent changed a page. A Cloudflare Worker on the existing free account does all of it at no cost. (Based on the services' published signup flows; no account was created anywhere.)

## Improvement flywheel
Rules for every agent: AGENTS.md in this branch, served live at https://watch.bucklerfamily.estate/agents.md.

## Known limits
- A check made in request context (check_now) does not pass through the zone's route Workers (e.g. agent-ready), so its hash can differ from the scheduled check; scheduled (cron) checks see the full live page. Only cron-to-cron hashes are compared.
- KV is eventually consistent (up to ~60 s) and the change log is one KV value: two writers in the same second (a cron run and an agent's log_update/claim) can drop one entry. Cheap and rare at this traffic; a Durable Object would fix it but is not on the free plan's simple path.
- GitHub's commit Atom feed lists at most the 20 newest commits per branch; the monitor stores up to 10 per move.
- Seven hosts were down (Cloudflare 522) at launch: archive, althea, call, ccan, dash, ghf-app, subrepos — real outages/unconfigured, also seen from outside.
