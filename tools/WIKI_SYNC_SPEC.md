# Wiki ← Wayback case-mail sync: spec (19 Oct 2026)

Goal: greathousefarmwiki.wordpress.com shows the case correspondence by pulling it from the deployed wayback, never from its own copy.

## Source (live now)
- https://wayback.bucklerfamily.estate/api/index.json: every record (id, date, direction, from, institutions, subject, threadId, refs, textUrl, jsonUrl), newest first
- /api/threads.json: one row per Gmail thread (subject, institutions, first/last date, count, messageIds)
- /api/message/<id>.json: the record plus its text. /mail/<id>.txt is the same as plain text
- Already redacted (email addresses, phone numbers, private address, postcodes). Ids (gm-<gmail id>, gt-<thread id>) never change. CORS is open for GET
- The email archive renders any thread at https://email.bucklerfamily.estate/thread/<threadSlug> (slug as in /api/records)

## What the wiki can do
The site is a WordPress.com "simple" site (not Atomic; Jetpack off). On WordPress.com that means:
- No plugins, no custom JavaScript, and iframes from non-approved domains are stripped from post content. Only the Business plan or above (Atomic) allows custom code or plugins
- So a JS widget or iframe embed of email.bucklerfamily.estate will not survive on the current plan. (Unverified: the exact plan tier. Check Settings → Plan. If it's Business, embeds become possible.)
- The WordPress.com REST API (public-api.wordpress.com/wp/v2/sites/greathousefarmwiki.wordpress.com/…) works on every plan with an OAuth2 token for the site owner's account

## Recommendation: scheduled sync job (option A)
A small job, either a GitHub Action on the datro wayback branch or a Cloudflare Worker cron, runs every 6 h and after each ingest:
1. GET /api/threads.json and /api/index.json
2. For each thread, build one wiki page: slug `mail-<threadId>` (for example mail-gt-19e6f0e4a747d5bc) under a parent page "Case correspondence". Contents:
   - the title: the subject
   - a line naming the institution(s) and the date range
   - each message as a block: date, sent/received, sender name, its text in a preformatted block (escape HTML), and links to /mail/<id>.txt and to the email-archive thread
3. Upsert: GET the page by slug, then compare a content hash stored in an HTML comment at the top of the page (`<!-- wayback-sync sha256=… -->`). POST/update only when the hash differs, so nothing is rewritten needlessly. Never delete: a thread that disappears from the feed gets a "withdrawn from feed" note
4. Also maintain one index page per institution (slug `mail-inst-<id>`) listing its threads, newest first
5. Auth: a WordPress.com OAuth2 token (developer.wordpress.com/apps, "global" scope or this site only), kept as a repo or Worker secret. Never in the repo
6. Safety: the feed is already redacted, but the job re-runs the same email and phone regex before posting and refuses to post a page that still matches

Why A: it works on the current plan, the pages are real wiki content (searchable, indexed, survive if wayback is down), and it is idempotent.

## Option B: embed (only on Business plan or above)
Each wiki page carries `<iframe src="https://email.bucklerfamily.estate/thread/<slug>?embed=1">`. The email archive already allows framing by *.wordpress.com and has a "Copy embed code" button. This is zero sync and always live, but on the current plan the iframe is stripped, and the content isn't wiki-searchable.

## Option C: link-only (works today, no token)
A static "Case correspondence" page linking to email.bucklerfamily.estate and the JSON. Fine as a stopgap.

## Run order for the wiki owner
1. Create a WordPress.com app and get a token for greathousefarmwiki
2. Put the token in a GitHub Actions secret WPCOM_TOKEN on unclehowell/datro
3. Add the sync workflow (about 150 lines of Node, no dependencies), dry-run it to list the pages it would create (409 threads now), then run it live
