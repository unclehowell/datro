# Buckler Family Projects Data API

An independent Cloudflare Worker for structured project data. It does not replace or deploy the Pages site at https://projects.bucklerfamily.estate and never needs to commit routine record changes to the `projects` branch.

## Endpoints

- MCP Streamable HTTP: `https://mcp.projects.bucklerfamily.estate/mcp`
- GraphQL-compatible API: `https://mcp.projects.bucklerfamily.estate/graphql`
- Public health check: `https://mcp.projects.bucklerfamily.estate/health`

All data operations require `Authorization: Bearer <token>`. The token is configured as the Cloudflare Worker secret `PROJECTS_API_TOKEN`; do not commit it to Git or embed it in public website JavaScript.

## Storage and privacy

The Worker binds to the private Cloudflare R2 bucket `projects-private`, which has no public bucket domain. Structured records, an audit log and uploaded artefacts stay in R2. GitHub contains the API source/schema/configuration only—not the live data or bearer token.

On the first authenticated request, the Worker imports the published 81-item asset register and the 34-node/36-edge trigger-event SOP graph from `unclehowell/datro@projects`. Source paths and provenance are kept on imported records. Imported status is a snapshot of the published register, not independent verification.

## MCP tools

The server exposes `record_list`, `record_upsert`, `graph_search`, `graph_neighbors`, `audit_list`, `artifact_put`, and `artifact_get`. `record_list` supports project, asset, work-package, risk/issue, evidence, SOP-node, relationship and artefact metadata stores. Updates capture actor, action, before/after values, entity and timestamp. Artefacts are SHA-256 hashed.

`graph_search` performs keyword-ranked GraphRAG-style retrieval and returns related graph edges and provenance context. Edges aid navigation; they do not establish that a linked claim is true.

## GraphQL-compatible queries

POST JSON to `/graphql` with `query` and optional `variables`, using the same bearer authentication. Supported root fields and examples are documented in `schema.graphql`. The endpoint is a deliberately small GraphQL-compatible subset; use MCP for complete graph-search results and all generic record kinds.

## Operating notes

- The Pages site remains a static presentation layer; data edits persist independently in R2.
- Do not give the bearer token to a browser or publish it in static files.
- The data endpoint is authenticated; the R2 bucket itself is not public.
- Keep source material, formal records, inference, family interpretation and unresolved allegations as separate fields.
- The initial implementation stores structured state as an R2 JSON object. For bulk or concurrent editing, use one writer at a time; this initial JSON state store is not a transactional relational database.
