# FCG — Serverless WP-shaped CMS on Cloudflare Workers

**Honest scope:** A full PHP WordPress process cannot run inside a Cloudflare Worker (no PHP/MySQL runtime in V8 isolates). What *is* standard and what tutorials usually mean by “serverless WordPress on CF” is:

1. **Headless / edge mirror** — content model like WP (posts, pages, revisions) stored in **D1** (SQLite at the edge)
2. **GraphQL API** on a Worker (WPGraphQL-shaped queries)
3. **Static or SPA front end** on Cloudflare Pages, talking to that API
4. Optional: sync *from* greathousefarmwiki.wordpress.com via REST into D1

This branch (`fcg`) implements (1)–(3) as a deployable Worker.

## Layout

```
fcg/
  wrangler.toml          # Worker name, D1 binding, vars
  schema.sql             # posts / pages tables (WP-ish)
  src/index.js           # GraphQL + minimal HTML shell
  package.json
  README.md
```

## Bindings / env

| Binding / var | Purpose |
|---------------|--------|
| `DB` | D1 database `fcg-wp-d1` |
| `ENVIRONMENT` | `production` / `preview` |
| `SITE_TITLE` | Display title |
| `WP_SOURCE_URL` | Optional upstream WP.com site to mirror (e.g. greathousefarmwiki.wordpress.com) |
| `ADMIN_TOKEN` | Bearer token for write mutations (set as secret) |

## Deploy (from this folder)

```bash
cd fcg
npm install
npx wrangler d1 execute fcg-wp-d1 --file=./schema.sql --remote
npx wrangler secret put ADMIN_TOKEN
npx wrangler deploy
```

## GraphQL (POST `/graphql`)

Public reads expose published records only. `posts(status: draft)` is rejected, and `post(slug)` / `page(slug)` constrain both publication status and content type. The source-level regression checks run with `npm test` from this folder.

```graphql
query {
  posts(status: PUBLISH, first: 10) {
    nodes { id title slug content excerpt date }
  }
  page(slug: "mandate") { id title content }
}
```

## Not included (by design)

- PHP `wp-admin`, plugins, themes as PHP
- MySQL compatibility layer
- Full WP REST plugin ecosystem

Those require a real WordPress host; this Worker is the edge CMS + API layer.


## Theme and page shell (20 Oct 2026)

`src/index.js` is the deployed source of Worker `fcg-wp` (version b6b5bfd9). Every HTML route uses one page shell with the same dark,
Starlink-style look as projects.bucklerfamily.estate: `src/theme.css` (copied from `projects/public/assets/theme.css` on branch `projects`,
plus fcg additions), `src/theme.js` (nav turns solid on scroll; re-tones inline colours carried in page bodies), and the Barlow font
(SIL OFL, `src/fonts/`), all bundled into the Worker and served at `/assets/`. The home page makes no D1 reads; page reads go through an
edge cache (5 minutes fresh, last good copy served if D1 is unavailable). `/graphql`, `/health` and `/mandate` are unchanged in behaviour.
