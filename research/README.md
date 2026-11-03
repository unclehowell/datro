# Research — Great House Farm wiki mirror

This branch is an isolated clone of the `fcg` branch's serverless WordPress-shaped CMS pattern. It deliberately does not modify `fcg` or the source WordPress.com site.


> **Migration gate — NOT SAFE TO PURGE THE SOURCE (audit 23 October 2026).** The source WordPress.com content API currently reports **975 published pages, 0 published posts, and 130 media-library records**, plus **59 pages with private/draft/pending/future status**. The older 442-page figure below is historical and must not be used as the current source total. The live D1 row-read quota was exhausted during this audit, preventing verification of current mirror counts and blocking the attempted catch-up write. The import cursor was reset to `page:1` and a reason recorded, but completion has **not** been verified. This mirror does not contain an offline copy of all 130 binaries; many media URLs still resolve to WordPress.com. **Keep the source site live** until the public-page inventory is reconciled, the non-public content has been preserved privately or explicitly excluded, linked assets are copied and verified, routes/internal links work without the source, and a repeatable migration check passes. Full findings: [MIRROR_AUDIT_2026-10-23.md](MIRROR_AUDIT_2026-10-23.md). Source-derived inventory metadata: [audit/source-inventory-2026-10-23.json](audit/source-inventory-2026-10-23.json) (page bodies and binary files are not included).

## Deployment shape

- Cloudflare Worker: `research-wp`
- Cloudflare D1: `research-wp-d1`
- Public hostname: `https://research.bucklerfamily.estate`
- Source: `https://greathousefarmwiki.wordpress.com`
- Worker entry point: `src/index.js`
- D1 schema: `schema.sql`

Public GraphQL list queries reject non-published status filters (release 0.1.1); the JSON catalogue, single-page and preview routes are published-only. This is a static/edge mirror with a WordPress-shaped data model. It is **not a PHP WordPress install**: PHP themes, plugins and wp-admin are not executed here. Public page hierarchy and HTML are copied into D1 by a repeatable scheduled importer. Native attachment metadata can be unavailable when WordPress.com restricts its media API; in that case the mirror catalogs upload links actually found in imported HTML. Those catalog entries are not a claim that every unattached library file was found. Media are served through a guarded proxy from the original public URL; if a validated Internet Archive capture exists, the proxy can fall back to it. Binary files are not being copied wholesale into R2 or another object store in this deployment.

## Initial setup

```sh
npm install
npx wrangler d1 execute research-wp-d1 --file=./schema.sql --remote
npx wrangler secret put ADMIN_TOKEN
npx wrangler deploy
```

Deploy from this directory or use the repository workflow after configuring Cloudflare secrets. The live Worker is deployed independently of the source branch.

## Import pages, posts and media

A separate scheduled-only Cloudflare Worker, `research-importer`, imports one 100-record source API page per minute and maintains its cursor in the `migration_state` table in `research-wp-d1`. It upserts page/post records by original WordPress ID. The helper has no custom-domain route and no admin secret; it only writes to the isolated mirror database. The main public `research-wp` Worker continues to serve content from the same D1 database.

The page cursor records `page:1`, `page:2`, and so on; after pages it checks posts and media. In this migration, WordPress.com reported 442 published pages and zero published posts. Its media-library endpoint returned HTTP 401 (“requires authentication”), and the attempted CDX prefix query returned HTTP 400. The fallback therefore scans imported page HTML for linked WordPress uploads and calls the Internet Archive Availability API separately for each discovered upload URL. That API returns at most a closest capture per URL; an empty response is not proof that no capture exists in every Wayback index. Embedded-link entries use deterministic synthetic IDs, and `meta_json.discovered_by` records whether an entry came from `embedded-page-scan` and/or `internet-archive-availability`. The resulting asset inventory is partial by design: unlinked files in the private/restricted media library cannot be enumerated through the available public interface.

Progress and diagnostics are held in `migration_state`: `auto_import_last_result`, `auto_import_last_error`, `auto_import_collection:page`, `auto_import_collection:post`, `auto_import_media_source_api_error`, `auto_import_media_scan_progress`, `auto_import_wayback_cdx_error`, `auto_import_wayback_status`, `auto_import_media_availability_progress`, `auto_import_completion_note` and `auto_import_completed_at`. If the cursor stops moving, inspect `auto_import_last_error` and the media-specific status rows in Cloudflare D1. The importer retries a failed page rather than silently skipping it. After `complete`, this is a one-time import, not a continuous WordPress sync; reset the cursor intentionally before re-running a new full import.

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
- `/asset?url=...` — media proxy restricted to the source site's WordPress uploads, WordPress.com media hosts and validated Wayback capture URLs; attempts a stored Wayback fallback when a source asset fails

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

## Static pages and the D1-safe front door (23 Oct 2026)

- `/` is a static mirror of the live greathousefarmwiki.wordpress.com home page (same menu groups, sections and order; detail behind a tap), held in `src/landing.js` and served without D1.
- `STATIC_PAGES` in `src/landing.js` holds evidence pages authored on this site (EV-0513 onward); `ADDENDA` appends a short linked section to named mirrored pages (timeline, Evidence Register, the 22 Oct 2026 Item 10 page).
- Every other GET is cached at the edge for 300 s with a 7-day copy kept back; when D1 refuses (for example the account's daily row-read limit), a page seen before is served from that copy and an unseen HTML page gets a plain notice with the menu.
- Deploy: upload a version through the Cloudflare Workers versions API with modules `index.js` and `landing.js`, inheriting `ADMIN_TOKEN`, then deploy it at 100%.
