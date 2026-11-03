# Research mirror audit — 23 October 2026

## Decision

**NOT SAFE TO PURGE `greathousefarmwiki.wordpress.com`.** Keep the source online until the completeness checks below pass. The current research site is a deployed, useful mirror, but the evidence available in this audit does not establish a content-complete, binary-independent, route-verified replacement.

## Current source inventory

Read-only listings from the authenticated WordPress.com content API returned:

| Collection | Current source count | How to interpret it |
|---|---:|---|
| Published pages | 975 | Current published page inventory, not the historic migration figure |
| Published posts | 0 | No public posts returned |
| Media-library records | 130 | Attachment metadata and source URLs, not a statement that all file bytes were copied |
| Non-public pages | 59 | Pages with private, draft, pending or future status; do not publish automatically |

The older migration note in this README reports **442 published pages**. That is a historical snapshot and is inconsistent with the current source inventory. It must not be used as proof that the current 975-page inventory is present in D1.

The public site also has a live agent index, evidence library, timeline, page hierarchy, linked artifacts and machine-readable routes. Checking the homepage alone cannot establish coverage for these collections or all linked attachments.

## Source inventory artifact

The branch now contains [source-inventory-2026-10-23.json](audit/source-inventory-2026-10-23.json), a source-derived metadata snapshot of all 975 published pages and 130 media-library records. It intentionally includes **only the aggregate count** for the 59 non-public pages; their individual identifiers, titles and links are omitted. The manifest does **not** contain page bodies or media bytes and is not itself proof of mirroring.

## Target and live-service observations

- Target hostname: https://research.bucklerfamily.estate
- Worker: `research-wp`
- D1 database: `research-wp-d1`
- Scheduled importer: `research-importer`, configured to run every minute
- Source: https://greathousefarmwiki.wordpress.com
- Branch: `research`

Cloudflare account configuration lists `research.bucklerfamily.estate` as an enabled Worker domain bound to `research-wp`. Public search results also surfaced indexed research pages. These facts support that the target is deployed; they are **not** an end-to-end health or completeness test.

A direct live-fetch verification of `/health` and representative routes could not be completed from the available execution environment. The Cloudflare D1 API returned error **7500** (daily free-tier row-read quota exceeded) during the audit. Subsequent attempts to read the mirror counts and to write a batch of media metadata were blocked by that limit. No successful media-batch import is claimed.

## Actions taken

1. Re-read the current WordPress.com source inventory: 975 published pages, zero published posts, 130 media records and 59 pages outside public status.
2. Reset `migration_state.auto_import_cursor` to `page:1`, reset the import lock to `0`, cleared the prior completion timestamp, and recorded the reason in `auto_import_restart_reason`. The scheduled importer may resume when D1 allows reads/writes; **its progress and completion have not been verified** because the daily row-read limit was reached.
3. Updated the README gate so future work does not confuse the historic 442-page baseline with the current source inventory.
4. Preserved the source metadata inventory in `audit/source-inventory-2026-10-23.json`, without individual details for non-public pages.
5. Attempted a media-metadata batch based on the 130 source-listed attachments. The D1 quota rejected the write. No media import completion is claimed.

## Known gaps and risks

### 1. Public-page coverage is unknown

Current source count is 975 published pages. Mirror-side counts could not be verified because D1 reads were exhausted. Until all 975 source records are matched to their original WordPress IDs, canonical URL/path, status, title and content checksum (or explicitly logged exception), there is no proof of parity.

The importer is a scheduled, one-time cursor-based import rather than a perpetual synchronization mechanism. It will not by itself guarantee that later source edits/deletions/status changes have been mirrored indefinitely.

### 2. Attachment inventory is not binary preservation

The source provides 130 media-library records. This worker's documented fallback scans imported page HTML for linked uploads and queries Internet Archive availability. Its README explicitly says it does **not** copy all media binaries into R2 or another object store; the media proxy may still fetch files from WordPress.com and therefore depends on the source staying online. Files not linked from a public imported page may remain undiscovered by the fallback.

A safe migration must copy the permitted original file bytes to a durable destination, record SHA-256, byte length, MIME type, original URL and source media ID, and test opening every copied asset independently of the source domain. If a file cannot legally or technically be copied, record it as a named exception and decide whether the source must remain available.

### 3. Non-public pages must not leak

The source currently returns 59 pages with private, draft, pending or future status. These are not part of the published public mirror scope. Do not blindly import them into public D1. Preserve them in a private archive or export only with authorised access and appropriate controls. Also check for previously imported records that may now have a non-public source status; a one-way published-record upsert does not necessarily downgrade old rows whose visibility changed after the original import.

### 4. Navigation and routes require a closure test

For each publicly published source page, verify:
- the target route returns the expected HTML and status;
- title, content, parent/hierarchy and canonical path match the source;
- internal links resolve to the target mirror where equivalent content exists;
- each linked image, PDF, DOC/DOCX, audio/video or other attachment opens without a WordPress.com fetch;
- search, sitemap, feed/agent index and machine-readable endpoints reflect the full published set;
- no public route reveals private/draft source material.

Any original URL intentionally retained as the only access to a source artifact is a dependency and must be listed as such, not counted as fully migrated.

## Purge gate — all criteria must pass

- [ ] Fetch and archive a current manifest of all **975 published pages**, each with source ID, canonical URL, status, modified time and a content checksum.
- [ ] Verify the destination contains a match for every published source page (or document each explicit exception).
- [ ] Run the importer from page 1 and verify it reaches its terminal cursor; record the completion timestamp and source totals. Confirm posts and media phases separately.
- [ ] Reconcile all **130 media-library records** with imported metadata and actual file bytes; maintain a hash manifest and confirm no attachment depends solely on WordPress.com hosting.
- [ ] Inventory all linked assets in page HTML, including uploads not listed in the public source API, and close or document every link.
- [ ] Preserve the **59 non-public pages** privately, with original status and parent path; confirm none is exposed publicly by the mirror.
- [ ] Check source links in old content, redirects, menus, canonical URLs, sitemap, search and agent endpoints; add redirects where needed and avoid breaking old external citations.
- [ ] Run automated route/asset tests and a representative manual mobile/desktop review; save the results and test timestamp.
- [ ] Re-read source and destination totals after quota reset; verify counts by type, unmatched IDs and status mismatches are all zero or explicitly approved exceptions.
- [ ] Retain a final export/backup of the source pages, all permitted media binaries, metadata and hierarchy before decommissioning anything.

**Until every applicable criterion is satisfied, do not purge the WordPress.com source or remove its uploads.** The present findings do not establish full equivalence.
