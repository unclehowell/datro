## [0.12.0.40] - 2026-07-16

## v0.0.0.15
- Critical UI fix (wayback.datro.xyz showed only stale "Wayback Archive v0.0.0.09", no tabs/gallery/content).
- Fixed JS loadCategory fetch path (removed erroneous `wayback/` prefix so it loads ${cat}/_treeview.json from CF Pages root).
- Updated titles in index.html to v0.0.0.15.
- Deployed via wrangler to wayback project (git data in wayback branch kept in sync via this changelog).

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
- Added #bpvsbuckler hashtag to all evidence names in treeviews for bpvs integration filtering.
- Updated index.html JS to support ?slide= ?year= ?hashtag=bpvsbuckler params, hide slide/bpvs tags from cloud UI.
- Icons and gallery feed support updated in bpvs side.


## v0.0.0.14
- Added #bpvsbuckler to all treeview names for filtering from bpvs site.
- Hide #bpvsbuckler and #slide- tags from hashtag cloud to preserve UI.
- Enhanced param support for year/category/hashtag filters.

