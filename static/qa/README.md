# QA — FOI Questions & Answers Graph (Buckler Family Estate)

**Live:** [qa.bucklerfamily.estate](https://qa.bucklerfamily.estate)

Dedicated knowledge-graph webapp that logs every question asked in FOI / EIR / records correspondence with stable UIDs, pairs them to answers, and exposes the graph for agents via WebMCP and a GraphQL-style JSON API.

## What is logged

Every sent message that contains an ask is split into individual questions (numbered items preferred). Each gets a stable UID of the form `qa-<12-char-sha1>`. Pairing rules:

- item-level when the reply has matching numbered items
- thread-level otherwise
- `unanswered` when no reply is present in the corpus
- reply-only for unsolicited official replies

Message UIDs (`asked_msg`, `answer_msg`) are the Gmail / catalogue message ids already used in the bpvsbuckler graph. References (FOI numbers, title numbers, archive refs) and years are extracted automatically.

Source of truth remains the monorepo graph build on the `bpvsbuckler` branch (`content/graph/*` → `api/qa.json`, `api/graph.json`, `api/graph.sql`). This site mirrors that export and adds agent-facing surfaces.

## Surfaces

| Path | Purpose |
|------|---------|
| `/` | Human UI: search, filter by party / kind / status, open any QA record by UID |
| `/api/qa.json` | Full static dump (UID-keyed) |
| `/api/ask?q=` | Full-text + graph-neighbour search (D1 FTS, static fallback) |
| `/api/graphql` | GraphQL-style POST: `query { qa(id), search(q), byParty(party) }` |
| `/api/mcp` | WebMCP endpoint for agents (tools: `search_qa`, `get_qa`, `list_parties`, `list_open`) |
| `/api/sync-graph` | Authenticated D1 reload (same pattern as bpvsbuckler) |

## Agent / WebMCP

Point an MCP client at `https://qa.bucklerfamily.estate/api/mcp`. Tools:

- `search_qa` — natural-language or keyword search across questions + answers
- `get_qa` — fetch one record by UID
- `list_parties` — parties that appear in the correspondence
- `list_open` — questions still marked unanswered or pending

All responses include UIDs so downstream agents can cite and link.

## Deploy

Push to the `qa` branch. GitHub Actions:

1. Pulls / rebuilds the latest graph exports from the shared pipeline (or copies the committed `api/*` from bpvsbuckler).
2. Builds the static UI.
3. Deploys to Cloudflare Pages project `qa` with custom domain `qa.bucklerfamily.estate`.
4. Triggers D1 sync for the bound database `qa-graph`.

Required secrets (already present for bpvsbuckler): `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`.

## Relation to bpvsbuckler

The storyboard player at bpvsbuckler.bucklerfamily.estate continues to own the narrative timeline. This site is the pure Q&A / FOI log + agent interface. Both share the same graph build and UIDs.
