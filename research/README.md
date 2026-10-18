# Research — Great House Farm wiki mirror

This branch is an isolated clone of the `fcg` branch's serverless WordPress-shaped CMS pattern. It deliberately does not modify `fcg` or the source WordPress.com site.

## Deployment shape

- Cloudflare Worker: `research-wp`
- Cloudflare D1: `research-wp-d1`
- Public hostname: `https://research.bucklerfamily.estate`
- Source: `https://greathousefarmwiki.wordpress.com`
- Worker entry point: `src/index.js`
- D1 schema: `schema.sql`

This is a static/edge mirror with a WordPress-shaped data model. It is **not a PHP WordPress install**: PHP themes, plugins and wp-admin are not executed here. Public pages, page hierarchy, HTML body, post metadata and attachment records are copied into D1 by an authenticated, repeatable importer. Uploaded media are served through a guarded proxy from their original public media URL unless separately archived in object storage.

## Initial setup

```sh
npm install
npx wrangler d1 execute research-wp-d1 --file=./schema.sql --remote
npx wrangler secret put ADMIN_TOKEN
npx wrangler deploy
```

Deploy from this directory or use the repository workflow after configuring Cloudflare secrets. The live Worker is deployed independently of the source branch.

## Import pages, posts and media

A separate scheduled-only Cloudflare Worker, `research-importer`, imports one 100-record source API page per minute and maintains its cursor in the `migration_state` table in `research-wp-d1`. It processes the public `page`, `post` and `media` collections in order, and upserts by original source type and ID. The helper has no custom-domain route and no admin secret; it only writes to the isolated mirror database. The main public `research-wp` Worker continues to serve pages from the same D1 database.

The cursor is `page:1`, `page:2`, `post:1`, and so on; `complete` means the public collections returned no more pages. The `auto_import_last_result`, `auto_import_last_error`, `auto_import_collection:page`, `auto_import_collection:post`, `auto_import_collection:media` and `auto_import_completed_at` rows record progress and outcome. If the cursor stops moving, inspect `auto_import_last_error` in Cloudflare D1. The helper deliberately retries the same page rather than silently skipping it.

The separate helper configuration is `importer.wrangler.toml`. To deploy or re-deploy it manually:

```sh
npx wrangler deploy --config=importer.wrangler.toml
```

Manual single-page import remains available on the public Worker for recovery. Set `ADMIN_TOKEN` as a Worker secret, then call:

```sh
curl -X POST https://research.bucklerfamily.estate/admin/sync \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type":"page","page":1}'
```

Do not publish the administrative token. The importer uses the source API's pagination headers where present. Public media attachments commonly use WordPress's `inherit` status, so the scheduled importer explicitly tries that status and then the endpoint's default collection if needed.

## Public interfaces

- `/` — homepage, followed by a browse index
- `/read-the-docs/` — source documentation page, augmented with the mirror's quality standard
- `/api/content` — machine-readable public index
- `/api/content?type=page&search=...` — filtered content
- `/api/preview?path=/evidence-library/example/` — short supporting-page preview
- `/graphql` — minimal WP-shaped GraphQL endpoint
- `/llms.txt` and `/agent-index.json` — agent discovery
- `/health` — health check
- `/media/{source_id}` — attachment metadata and redirect/proxy endpoint
- `/asset?url=...` — media proxy restricted to the source site's WordPress uploads and WordPress.com media hosts

## Evidence-quality display standard

The interface supports explicit paragraph metadata:

- `data-evidence-status="assured"`: very subtle pale green and `□`, only where the exact statement is directly supported by concrete, uncontested artifacts.
- `data-evidence-status="not-assured"`: very subtle pale amber and `◇`, where a statement is not conclusively supported or its support is incomplete.
- No status attribute: unhighlighted, unmarked and unclassified/ambiguous. It must not be interpreted as a finding against or for the statement.

Importing a citation does not automatically make a claim assured. The mirror intentionally does not guess status across 440+ pages. A human-supported paragraph-by-paragraph review is still needed to apply these attributes responsibly.

Where a paragraph contains an internal link to another mirrored page, hover, keyboard focus or selection may show a compact preview of that linked page's title and excerpt. This is navigation assistance, not proof that the linked artifact supports every assertion in the paragraph. For claims lacking a linked source, no evidence preview is invented.

## Provenance and limitations

Each copied record retains its original WordPress ID, permalink, content type and modified timestamp. The source WordPress.com site remains authoritative for its own live changes until the importer runs again. The worker never writes to the source site. Media proxying still relies on public upstream availability; complete offline preservation would require separately copying all binary attachments into R2 or another object store.

## Read the docs / agent guidance

Agents must distinguish original records, transcriptions, interpretation, allegations and working theories. Do not treat the mirror itself as verification. The quality symbols are the current annotation status of individual paragraphs, not a legal adjudication or a blanket statement about the case.
