## v0.0.0.18 (rollback + R2 fix)
- Rolled back wayback branch ~3 releases (to 1dc674553) because recent changes diminished UX (small catalogue, over-reduced treeviews).
- Restored full previous catalogue treeviews (~337 images etc) with relative R2-served paths.
- IMPORTANT: media library is in R2 bucket. Cleaned binaries out of the Pages deploy source dir (/wayback/{images,pdf,text}/ now only contain _treeview.json + GUI files). Future releases only ship the interface/GUI + metadata, not the entire media lib (fast, low compute).
- Full list of items now in catalogue again; thumbnails served via the domain's R2 setup (relative "images/..." paths resolve from R2).
- Re-deploy only GUI + full treeviews.

## v0.0.0.17
- Fixed missing thumbnails and "catalogue content" by regenerating _treeview.json to *exactly* match only the media files actually present on disk in the source (images ~6, pdf ~5, text ~5). No more 404s or broken previews for listed items.
- Reverted large "old full" treeviews (which brought back purged/generic 0000-00-00 entries) — now only real deployed content.
- Synced cleaned treeviews to datro/wayback branch + pushed.
- (Previous: single-row clickable hashtags under categories, dynamic version, safe path encoding for # filenames, mobile CSS.)

## v0.0.0.16
- Restored previous design and full catalogue content broken by recent overhauls (last ~5 commits on wayback).
  - Reverted treeviews to pre-bpvs-overhaul full set (~337 images, 30 pdf, 1128 text) from good commit.
  - Hashtags: back to single horizontal clickable row under categories/tabs ("click to show" positive filter).
  - Mobile friendly layout restored (no fixed sidebar cloud, horizontal scrollable tags, wrap on small).
  - Fixed missing thumbnails: use encodeURIComponent on path segments so # in filenames (from tags) don't break <img src>/<a href> as fragments.
  - Version no longer hardcoded in title/main-title; dynamic like bpvs (fetches version.txt, updates DOM + document.title).
- Updated index.html CSS/JS for row tags + dynamic ver.
- Also synced restored treeviews + commit to wayback git branch.
- Redeployed via wrangler.

## v0.0.0.15
- Critical fix for broken UI: only title "v0.0.0.09" and no content visible.
- Fixed fetch path in loadCategory() from `wayback/${cat}/_treeview.json` (wrong, caused 200 HTML fallback or json parse fail) to `${cat}/_treeview.json` (matches CF Pages deploy structure where images/, pdf/ etc. live at project root next to index.html).
- Updated title tag and main <p class="main-title"> to v0.0.0.15 for consistency.
- This allows init() to succeed, load real JSON treeviews (with #bpvsbuckler tags), render tabs, hashtag cloud (bpvs/slide hidden), gallery and pagination.
- Rerelease + wrangler deploy for wayback project.

## v0.0.0.12
- Added 5 new unique evidence items (no dups by name/date+title similarity):
  - 1988-07-29 Great House Farmhouse Llandough Cadw Survey Photo (pdf, #bpvs-slide-65)
  - 1988-07-29 Barn at Great House Farm Llandough Cadw Survey Photo (pdf, #bpvs-slide-65)
  - 1990-08-00 Great House Farmhouse Llandough GGAT Assessment (pdf)
  - 1897-00-00 Marconi Wireless Telegraph at Great House Farm (jpg)
  - 1897-00-00 Marconi Visit to Great House Farm (text excerpt from Rundown)
  - 1916-00-00 Tree Planting Ceremony John Williams Great House Farm Ownership (text excerpt from Rundown)
- Appended to images/, pdf/, text/ _treeview.json (and synced to datro/wayback)
- Used descriptive naming YYYY-MM-DD - Title - EN - V0.0.0.12
- Prepared for wayback-v0.0.1.44 release

## v0.0.0.11
- Added unique evidence: ATISN 27021 (11 June 2026) Welsh Government response with Cadw inspection photos dated 29/07/1988 of Great House Farm and barn; assessment that the building did not meet listing criteria; note on records at RCAHMW or destroyed. Tagged for slide 65 (1988 events). No duplicates.
- Added matching image placeholder with #slide-65.
- Updated treeviews and index title.


## v0.0.0.13
- Added #bpvsbuckler hashtag to evidence names in treeviews.
- Updated JS to hide #bpvsbuckler and #slide- tags from hashtag cloud (preserve design).
- Added support for URL params ?slide= ?year= ?hashtag=bpvsbuckler for bpvs integration filter.


## v0.0.0.14
- Added #bpvsbuckler to all treeview names for filtering from bpvs site.
- Hide #bpvsbuckler and #slide- tags from hashtag cloud to preserve UI.
- Enhanced param support for year/category/hashtag filters.

