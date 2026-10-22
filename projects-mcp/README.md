# Buckler Family Projects Data API

Independent Cloudflare Worker for project data. Routine project-record changes persist to private Cloudflare R2 and do not commit to or redeploy the static Pages site at https://projects.bucklerfamily.estate.

## Endpoints

- MCP Streamable HTTP: `https://mcp.projects.bucklerfamily.estate/mcp`
- GraphQL-compatible API: `https://mcp.projects.bucklerfamily.estate/graphql`
- Public health check: `https://mcp.projects.bucklerfamily.estate/health`

All data endpoints require `Authorization: Bearer <token>`. The credential is stored as Cloudflare Worker secret `PROJECTS_API_TOKEN`; never commit it to Git or embed it in public website JavaScript.

## Privacy and storage

Structured records, relationships, change history and uploaded artefacts are stored in the private Cloudflare R2 bucket `projects-private`. The bucket has no public custom domain. GitHub holds source/schema/deployment configuration only, not live records or the token.

The first authenticated data request imports the 81-item asset register and trigger-event SOP graph (34 nodes, 36 edges) from `unclehowell/datro@projects`. Source paths and provenance are recorded. The imported project statuses are snapshots of published materials, not independent verification.

## MCP tools

- `project_list`, `project_get`, `project_upsert`
- `asset_list`, `asset_upsert`
- `work_package_list`, `work_package_upsert`
- `risk_issue_list`, `risk_issue_upsert`
- `evidence_list`, `evidence_upsert`
- `sop_node_list`, `sop_node_upsert`
- `relationship_upsert`, `graph_search`, `graph_neighbors`
- `audit_list`, `artifact_put`, `artifact_get`, `artifact_list`

Graph retrieval uses keyword ranking plus linked graph edges and provenance. These links help navigate context; they do not establish that a claim is true. Writes capture actor, action, entity, before/after values and timestamp. Artefacts are SHA-256 hashed.

## GraphQL

POST JSON with `query` and optional `variables` to `/graphql`, using the same bearer header. Supported fields are listed in `schema.graphql`. This is a deliberately small GraphQL-compatible subset; use MCP for full graph results and all available operations.

## Safety and operating limits

- The Pages production project remains `bucklerfamily-projects`, branch `projects`. This API is a separate Worker and branch.
- Never expose the token to a browser or static files. The R2 bucket itself is not public.
- Preserve the distinction between original records, formal findings, inference, family interpretation and unresolved allegations.
- Current structured state uses JSON in R2. For bulk changes or several agents editing simultaneously, use one writer at a time; this is not a transactional relational database.
