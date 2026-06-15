# WAYBACK BRANCH — Architecture & Deployment

## What this branch is

The `wayback` branch is the media-library frontend for the datro monorepo. It
contains the *app shell only* — `wayback/index.html`, `wayback/version.txt`,
`wayback/{cat}/_treeview.json` per category, and a Pages Function at
`functions/_middleware.js` for serving media from R2.

**Media files (text, images, PDFs, video) live in Cloudflare R2**
(`wayback-media` bucket) — NOT in git. This keeps deploys tiny and fast.

## Why media is in R2, not git

- Git-based deploys time out trying to push 1500+ files through Cloudflare
  Pages build pipeline
- Media files never change after upload — no reason to re-deploy them
- R2 serves media at the edge with zero compute cost
- Pages deploys take ~2s (6 static files + 1 function bundle)

## How media gets served

All media requests go through `functions/_middleware.js` (at project root):

```
User -> wayback.datro.xyz/images/photo with spaces.jpg
                        |
               _middleware.js checks path
                        |
         /text/, /images/, /pdf/, /video/
         (except _treeview.json)
                        |
               decodeURIComponent(path) -> R2 key
                        |
          env.wayback_media.get(key)
                        |
         Found? -> serve with correct content-type
         Not found? -> context.next() -> Pages static
```

**Important:** `url.pathname` in Workers keeps percent-encoding (e.g. `%20` for
spaces). The middleware calls `decodeURIComponent()` on the key before looking
it up in R2, since R2 keys have literal spaces, not `%20`.

### R2 binding

The R2 binding must be configured via the Cloudflare API (wrangler.toml is
only for local dev; `wrangler pages deploy` does NOT apply bindings):

```bash
curl -X PATCH "https://api.cloudflare.com/client/v4/accounts/{account}/pages/projects/wayback" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "deployment_configs": {
      "production": { "r2_buckets": { "wayback_media": { "name": "wayback-media" } } },
      "preview": { "r2_buckets": { "wayback_media": { "name": "wayback-media" } } }
    }
  }'
```

## What's in git (this branch)

```
functions/_middleware.js  <- Pages Function for R2 proxy (project root)
wayback/
  index.html              <- archive frontend (mobile-app SPA)
  version.txt             <- semver string
  text/_treeview.json     <- metadata for text files
  images/_treeview.json   <- metadata for images
  pdf/_treeview.json      <- metadata for PDFs
  video/_treeview.json    <- metadata for videos
  AGENTS.md               <- this file
wrangler.toml             <- Pages project config
```

**Note:** The `functions/` directory MUST be at the project root (not inside
`wayback/`). `wrangler pages deploy` only detects Pages Functions at the
project root, even when `pages_build_output_dir` is set.

## How to deploy

```bash
cd /path/to/wayback/worktree
wrangler pages deploy --project-name wayback --branch wayback
```

Deploy is instant (~2s) because only the app shell files are uploaded.

## How to add new media

1. Upload the file to R2 via the Cloudflare API or dashboard.
2. Add an entry to the appropriate `{cat}/_treeview.json` with `name`, `path`,
   and optional `tags` array (e.g. `["#bpvsbuckler"]`).
3. Deploy the updated treeview as above.

## URL structure (shareable)

```
?cat=text                        -> text category, first page
?cat=text&tag=%23morgan          -> text, filtered by #morgan
?cat=text&file=text/some.txt     -> text, modal open for that file
```

Any combination is shareable.

## Hashtags & email detection

Text files starting with email headers (From:, To:, Subject:, etc.) are
auto-tagged `#email` in the treeview.

## Do NOT

- Do NOT commit media files to this branch
- Do NOT run `git add wayback/text/` or any category directory — only
  individual JSON files go in
- Do NOT change the Pages build output dir (`wayback/`) or production branch
