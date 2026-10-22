# Buckler Family Projects Data API

This Worker is separate from the Pages project at https://projects.bucklerfamily.estate. Project-record changes persist in Cloudflare R2 and do not commit to or redeploy the Pages `projects` branch.

## Endpoints
- MCP Streamable HTTP: `https://mcp.projects.bucklerfamily.estate/mcp`
- GraphQL-compatible query endpoint: `https://mcp.projects.bucklerfamily.estate/graphql`
- Public health check: `https://mcp.projects.bucklerfamily.estate/health`

Data endpoints require `Authorization: Bearer <token>`. The token is a Cloudflare Worker secret and must not be committed to Git or embedded in public pages.

## Private storage and audit
Records and uploaded artefacts use private R2 bucket `projects-private`; the bucket has no public custom domain. GitHub holds only source code and schema, not live data or credentials. Record updates append before/after audit entries. Artefact uploads are SHA-256 hashed.

The first authenticated data request imports the public asset register and SOP graph from `unclehowell/datro@projects`: asset register (81 configuration items) and trigger-event SOP (34 nodes and 36 edges). Source paths and provenance are retained. Imported project statuses are snapshots of published project pages, not independent verification.

## MCP tools
Project, asset, work-package, risk/issue, evidence, SOP node, graph relationship, graph search, neighbour traversal, audit and private artefact tools are available from `tools/list`. `graph_search` combines keyword-ranked records with connected graph edges. Use the provenance fields to distinguish source records from interpretation.

## GraphQL
This is a lightweight GraphQL-compatible subset, supporting the root fields shown in `schema.graphql`. Send POST JSON with `query` and optional `variables`, plus the Bearer header. Writes are audited.

## Safety
The bucket is not publicly exposed. The Worker requires Bearer authentication for all data operations. Do not embed the token in the public Pages site. For bulk updates, use a single writer at a time; R2 JSON indexes are not a transactional relational database.
