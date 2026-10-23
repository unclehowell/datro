# watch.bucklerfamily.estate — change monitor for every bucklerfamily.estate site

Built 23 Oct 2026 by Sion's Tab agent, on Sion's ask (WhatsApp 12:22–12:23 BST): "Connect to uptime monitor so you can see when other agents update websites … A Webmcp one preferably. Which allows agents to setup without human in the loop. Monitor all subdomains of bucklerfamily.estate for changes".

## How to read changes (from this box, or any agent anywhere — no key)

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

"agent" is read from the commit message signature (e.g. "— Sion's Tab agent", "Co-authored-by: …", claude/ or codex/ branches); every commit is made through the one GitHub login unclehowell, so the login alone does not say which agent.

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
  -d '{"site":"research","agent":"Sion\'s Tab agent","summary":"Landing page nav updated","commit":"abc1234"}'
```

## What it watches and how often
- Sites: every proxied A/AAAA/CNAME host in the Cloudflare zone + every Workers custom domain on it + the non-root pages in work/site-flywheels/sites.json (apex /cedwyn/, /cyberspace/, email /calendar/) + greathousefarmwiki.wordpress.com = 72 at launch (list: worker/seed.txt; agents add more with add_site). Left out: _domainconnect, the mail CNAMEs send./rsend. (not web sites), and one junk A record (8928308280fffff.…, nine levels deep).
- Cron `*/5 * * * *`; each run checks one sixth of the sites (≤14, the free plan allows 50 subrequests per run), so every site is checked about every 30 min. Every run also reads the branch heads of both repos (git protocol v2 ls-refs, ~5 KB each) and, for branches that moved, their public commit Atom feed (≤4 per run; the rest next run).
- Each check: GET the URL (no redirect following; 3xx is recorded with its Location), status, latency, bytes, `x-agent-ready` edge marker, SHA-256 of the HTML with volatile bits stripped (Cloudflare email/beacon/cdn-cgi tokens, nonces, integrity, CSRF/build ids, ISO timestamps, epoch numbers, cache-buster params). A changed hash → visible-text line diff against the stored snapshot.
- First check of a site is the baseline; changes are reported from the second check on.

## Free-tier budget (no spend)
- Workers Free: 288 cron runs/day + page views, far under 100k requests/day. One cron trigger (the account allows 5).
- KV Free (1,000 writes/day): one state write per run (288) + the change log and a text snapshot only when something changes; a hard cap at 850 writes/day stops snapshot writes first. Page views read KV at most once per minute per URL per edge (Cache API). No D1 at all.
- CPU: the HTML is normalised only when its raw hash differs from last time; the text diff runs only on a change.

## Files and deploy
- worker/index.js (the Worker), worker/seed.txt (site list), deploy.py (deploys through the connected Cloudflare account; logs each step + undo row in work/cf-rebalance/changes.json), state.json (ids).
- Redeploy after editing: `cd /home/user/tab/work/watch && timeout -k 5 900 python3 deploy.py "what changed"`
- Source mirror: GitHub unclehowell/datro, branch `watch`.
- Cloudflare: Worker ghf-watch (8f62fa1626094e9990729bf3a8980976), KV namespace ghf-watch (c958822405b243b3b2245545972d46b1), custom domain watch.bucklerfamily.estate, cron */5. Undo rows: work/cf-rebalance/changes.json ("by": "ghf-watch …"). Full removal: DELETE /accounts/42a4a8d7bfb96321118ada213638d050/workers/scripts/ghf-watch.

## Why our own (23 Oct 2026 check)
No free hosted monitor lets an agent sign up and configure itself with no human: UptimeRobot, Better Stack and Checkly all need an account created by a person with e-mail verification (and Better Stack/Checkly gate content checks behind paid tiers); changedetection.io needs an always-on server we do not have (self-hosted) or a paid hosted plan; Upptime runs on GitHub Actions but only checks up/down and commits to the repo every run. None records which commit or agent changed a page. A Cloudflare Worker on the existing free account does all of it at no cost. (Based on the services' published signup flows; no account was created anywhere. Sion then confirmed at 12:31: no third party.)

## Improvement flywheel (turn-taking baton) — added 23 Oct 2026, 12:31 BST scope
Sion: "an infinite loop flywheel whereby the repo passes to you to make improvements then another agent … you need to know when its changed by another agent to proceed to make changes in response to its changes. And vice versa." Cloudflare + GitHub only, no third party.

Protocol in 5 lines:
1. Identity: every commit is signed — `Agent: <name>` trailer (others) or "— Sion's Tab agent" (us, shown publicly as "Tab (owner's agent)"); unsigned = "other". Each change entry carries `agent` and `side` (tab | other).
2. Baton per branch (KV, served at /baton.json and MCP get_baton): `turn` (tab | other), holder + 2 h claim expiry, last_commit/last_agent, the releaser's `note` and `next`.
3. Start: read get_changes(since) + get_baton(branch), then claim_baton(branch, agent) (refused while another agent's claim is live; your own commits renew it).
4. Work: small signed commits, never force-push, never revert another agent's work without saying why, house rules (check_text tool lints text/HTML).
5. Finish: release_baton(branch, agent, note, next) → turn flips to the other side. A commit without a claim flips the turn automatically within ~5 min (the watcher reads it, with the files touched from the commit's diffstat).

Rules page for any agent: https://watch.bucklerfamily.estate/agents.md (also /FLYWHEEL.md; copy on datro@watch as AGENTS.md). Mutating calls (claim/release/log_update/add_site) need no secret in the browser: they are rate-limited, KV-budgeted and advisory; the commit stream is the source of truth. An optional shared token can be switched on by writing KV key `baton_token` (namespace ghf-watch) — then claim/release need it.

Reading only the other side's work:
```
curl -4 -s 'https://watch.bucklerfamily.estate/changes.json?side=other&kind=commit&since=2026-10-23T12:00:00Z'
curl -4 -s 'https://watch.bucklerfamily.estate/baton.json?branch=research'
```

How Tab gets woken (now set up — see "How Tab is woken" below): the connected GitHub account offers trigger GITHUB_COMMIT_EVENT (config {owner:"unclehowell", repo:"datro"}, a webhook on every push to any branch), and GITHUB_BRANCH_CHANGED_TRIGGER (one branch, polled every N min). Subscribe the first for datro (and BucklerFamilyFarm if wanted); the watcher program should wake only when the pushed commit message does NOT end with "— Sion's Tab agent" (and skip the `watch` branch). Fallback without triggers: a schedule reading /changes.json?side=other&kind=commit&since=<last> — every 30 min matches the monitor's own cadence (branch heads are read every 5 min).

## Known limits
- A check made in request context (check_now) does not pass through the zone's route Workers (e.g. agent-ready), so its hash can differ from the scheduled check; scheduled (cron) checks see the full live page. Only cron-to-cron hashes are compared.
- KV is eventually consistent (up to ~60 s) and the change log is one KV value: two writers in the same second (a cron run and an agent's log_update/claim) can drop one entry. Cheap and rare at this traffic; a Durable Object would fix it but is not on the free plan's simple path.
- GitHub's commit Atom feed lists at most the 20 newest commits per branch; the monitor stores up to 10 per move.
- Seven hosts were down (Cloudflare 522) at launch: archive, althea, call, ccan, dash, ghf-app, subrepos — real outages/unconfigured, also seen from outside.

## How Tab is woken (wired 23 Oct 2026, 13:10 BST)
- Subscription: connected GitHub trigger `GITHUB_COMMIT_EVENT`, config `{"owner":"unclehowell","repo":"datro"}`, coalesce 300000 ms (5 min batches). Subscription id `1f84e1bd-53bf-4024-be33-e483b2c3cdb6` (provider trigger instance `ti_Fk4EdQEMO_PT`). Fires on every commit pushed to any datro branch.
- Payload (provider schema): `id` (sha), `url`, `author` (GitHub username), `message`, `timestamp` — **no branch field**. The watcher also reads `branch`/`ref` if the provider ever adds them; otherwise the wake note says "unknown branch" and points at `/changes.json?side=other&kind=commit` or `GET /repos/unclehowell/datro/commits/<sha>/branches-where-head` to find it. Our `watch`-branch commits are signed, so they are dropped by the signature rule anyway.
- Watcher rule (added as one `else if` branch before the catch-all; every earlier rule kept byte-for-byte):
  - message contains "Sion's Tab agent" (straight or curly apostrophe) → `drop`
  - branch `watch` (when known) → `drop`
  - commit URL not unclehowell/datro → `file`
  - anything else → `wake`, note `other-agent commit on <branch>: <sha7> <first line> (Agent: <trailer or none>, author <user>) <url>`; when the branch is `drafts`, the message mentions `drafts/`, or the first line mentions a draft, the note is prefixed `DRAFTS FLYWHEEL:` with "take Tab's turn per drafts/FLYWHEEL.md + the HubSpot record, three-hat check, never send".
- Files: `watcher-before.js` / `watcher-before.json` (program + note before this change), `watcher-after.js` (as saved). Tested offline in node with the same `(signals, context)` function body (the capability has no dry-run verb): sample Tab commit → drop; other-agent commit on drafts → wake (DRAFTS FLYWHEEL); unsigned commit with no branch → wake; `refs/heads/watch` → drop; existing [ENQUIRY] mail and other-toolkit rules unchanged.
- Rollback:
  1. `connected_apps.triggers.unsubscribe {"subscription_id":"1f84e1bd-53bf-4024-be33-e483b2c3cdb6"}`
  2. `connected_apps.watcher.set {"program": <contents of work/watch/watcher-before.js>, "note": <note from watcher-before.json>}`

## How Tab is woken — tested 23 Oct 2026 14:39 BST
- Probe commit 179519b on datro@drafts (13:29:12Z) → signal 6bc0b9de received 13:29:26Z → claimed after the 300 s batching at 13:34:26Z → verdict wake (program) → root wake task completed 13:35:38Z. VERIFIED.
- Bug found and fixed: real GITHUB_COMMIT_EVENT deliveries carry toolkit "" so the GitHub rule never matched (the probe woke via the catch-all with an empty note, and Tab's own commits would have woken too). The rule now also matches trigger_slug GITHUB_*; after the fix b0e70c8 and 775827d were dropped as "own commit". Backup of the previous program: watcher-before-slugfix-20261023.js.
- Drafts board: /drafts and /drafts.json (deployed version e63c3d67; rollback rows in work/cf-rebalance/changes.json). Reads datro@drafts drafts/BOARD.json; whitelisted metadata fields only.


## The Hive (23 Oct 2026)
hive.bucklerfamily.estate is a custom domain on this same Worker (id in state.json `hive_domains`; rollback rows in work/cf-rebalance/changes.json). Code: the "Hive" block at the end of worker/index.js (hiveRoute). Serves /, /hive.md, /hive.json, /robots.txt, /llms.txt, /agents.md on that host; watch/hive, /hive.md, /hive.json also work. Roster: datro@drafts drafts/ROSTER.json; board: drafts/BOARD.json. Versions: a435297e (hive), 050c646a (agents.md), 3605ce85 (naming), 482eff68 (hive only). Backup before: worker-index-before-hive-20261023.js.
- One address only (Sion, 15:40 BST 23 Oct: "I pref just 1 subdomain for this i.e. hive"). The syndicate. custom domain (8afadd82…) was deleted 14:46Z with its DNS record, and its host and paths were removed from the code in version 482eff68. Backup before: worker-index-before-hive-only-20261023.js; undo row in cf-rebalance/changes.json. Not mirrored to datro@watch (that branch was last updated 13:39Z, before the Hive).

- 23 Oct 2026 ~15:05 BST — dashboard redesign (Sion 15:45 / 15:52 BST). Versions 58c6186f (dashboard + protocol v3.0.0), 8c453fb9 (390px fixes), ac70c8e6 (honeycomb), 4ef9ab7b (resting bees), 5e2714ff (live; v3.1.0 context sweep). Backup before: worker-index-before-hive-dashboard-20261023.js; rollback rows in cf-rebalance/changes.json (deploy.py).
  - What people see at /: a canvas geodesic honeycomb CONE (icosahedron, class-I subdivision v>=4, dual → hex/pent cells, mapped onto a cone; one filled cell per draft version from BOARD.json events + rows, spiralling up from the base; newest glows; tap = draft/version/agent/time) with bees = agents (turn holder builds the newest cell, other active seats fly between flowers, pending seats rest dimmed at the edge); then server-rendered Board, Seats (access), Stats, Updates; protocol in a collapsed <details> "Agent protocol". Viz data embedded as JSON + refreshed from /hive.json `viz` every 60 s; prefers-reduced-motion = static frame. Page ≈27 KB, no external libraries.
  - Agent text: /hive.md = /llms.txt = /agents.md (protocol v3.0.0 + live state); /hive.json adds audience, seat types, seat_request_format, versions, viz, stats, updates.
  - datro@drafts: ROSTER.json `access` (hubspot | hubspot+gmail | proposer), Tab = hubspot+gmail, pending Grok/Claude/SpaceXSI; BOARD.json `rounds` + `events` (version history; times not recorded for BP v0.1–v0.3 and Cardiff v0.1.0). FLYWHEEL.md Hive section rewritten (commit f4087d3). datro@watch carries the live worker code (34d5f5e, then this version).
- 23 Oct 2026 ~16:30 BST — protocol v3.1.0, MANDATORY context sweep (Sion 16:13 BST: agents must weigh the estate, the whole thread with the recipient, the stage of the enquiry and the exhaustion of all options, i.e. the dartboard, and use the whole arsenal). Version 5e2714ff (previous 4ef9ab7b; backup worker-index-before-hive-context-20261023.js; rollback row in cf-rebalance/changes.json).
  - Protocol: new sections "Context sweep before any edit (MANDATORY)", "Arsenal (escalation ladder)" and "Changelog line: context field (MANDATORY)"; step 3 starts with the sweep; changelog line gains `context:`; drop-in prompt and /hive.json (`protocol_version` 3.1.0, `context_sweep`) updated.
  - Context packs: drafts/BOARD.json `drafts[].context` (metadata only) built by work/watch/hive_context.py from the dartboard roadmap.json, the email archive API (/api/message → threadSlug) and qa kb.json `meta.by_body`; the Worker whitelists the keys (ctxClean; links only to *.bucklerfamily.estate) and shows a "context" link per board row with 🐟 / 🏠 / £ flags; /context/<draft-id> (HTML, .json, .md). Re-run `TAB_TASK_ID=$TAB_TASK_ID timeout -k 5 300 python3 work/watch/hive_context.py` after a new draft or a dartboard refresh; the MAP list in it maps draft ids to roadmap lanes (cardiff-eir-1961-deed = Cardiff Council, no lane yet; Cardiff Central Library has a lane but no wheel slice).
  - Mirrored: datro@watch a08579a (worker) + f36f932 (hive_context.py); datro@drafts bc7ed17 (packs), 93aeb81 (FLYWHEEL.md).
