# Great House Farm Wiki — reconstruction (`wiki` branch)

This branch rebuilds **greathousefarmwiki.wordpress.com** — the public evidence catalogue for Great House Farm (Tŷ Mawr), Llandough-juxta-Penarth, and the Williams/Buckler family — as a plain static website that does not depend on WordPress.com.

WordPress.com suspended the site on 13 October 2026. This branch preserves it from archived copies so it can be republished anywhere (GitHub Pages, Cloudflare Pages, or a restored WordPress site).

## Layout

| Path | What it holds |
|---|---|
| `incoming/wayback/` | Pages saved from the Wayback Machine (any folder layout) |
| `incoming/wxr/` | A WordPress export file (`.xml`), if WordPress.com provides one |
| `incoming/catalogue/` | Email correspondence catalogue pages built from Gmail, with the source transcripts in `transcripts/` |
| `tools/ghfwiki.py` | Rebuilds `site/` from everything in `incoming/` |
| `site/` | The reconstructed website: one `index.html` per original page address |
| `site/pages.json` | Index of every recovered page, its title and where it came from |
| `site/missing.txt` | Pages that recovered pages link to but that have not been recovered yet |

Every rebuilt page keeps its original address (e.g. `/mary-williams/`), so internal links keep working, and shows a provenance line naming its source (Wayback capture timestamp, export file, or Gmail).

## Status (13 October 2026)

- **Recovered so far:** 19 email correspondence catalogue pages (Museum Wales, NaCTSO, South Wales Police ×3, Vale of Glamorgan Council ×3, Welsh Government & Cadw ×3, HM Land Registry ×5, Heneb/GGAT, plus partial Ministry of Defence and CPS pages).
- **Still to recover:** the rest of the wiki (about 390 pages: evidence library, chronology, forensic reviews, PRINCE2 documents, press archive and more). These need Wayback captures or a WordPress export — see below.

## Adding the Wayback copies

1. Download the captured pages of `greathousefarmwiki.wordpress.com` from the Wayback Machine into `incoming/wayback/`. Raw captures (the `id_` form of a Wayback address, e.g. `https://web.archive.org/web/2026id_/https://greathousefarmwiki.wordpress.com/mary-williams/`) are cleanest, but ordinary saved pages work too. A downloader such as `wayback-machine-downloader` keeps the folder layout the tool expects.
2. Run `python3 tools/ghfwiki.py`.
3. Check `site/missing.txt` for pages still not recovered, fetch those, and run again.
4. Commit `incoming/` and `site/`.

The importer removes the Wayback toolbar, keeps only each page's article content, and rewrites archive links back to the wiki's own addresses. Images still point at their original `files.wordpress.com` addresses; copy them into `site/` if those stop loading.

## Adding a WordPress export

If WordPress.com support can provide an export of the suspended site (Tools → Export, or on request), place the `.xml` file in `incoming/wxr/` and run the tool. Export content takes priority over Wayback copies because it is the exact page source.

## Viewing locally

```
cd site && python3 -m http.server 8000
```

then open http://localhost:8000/.
