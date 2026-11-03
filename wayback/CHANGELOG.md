## Unreleased - 2026-10-22

### Added
- New item in the **Video** tab: `video/2026-10-22_ty-mawr-great-house-story-on-the-map.webm`, "Tŷ Mawr, the Great House of Llandough: the story on the map" (13 min 34 s, 9.9 MB, 1600x720 WebM, VP9/Opus), with a poster frame `video/2026-10-22_ty-mawr-great-house-story-on-the-map-poster.jpg`. It is the narrated map story of the farm, 1547 to 2026, recorded from maps.bucklerfamily.estate and trimmed to the narration (in 16.6 s, out 830.9 s of the recording).
- Like the other archive videos, the WebM sits in the `wayback_media` R2 store under the same `video/` key (md5 d553adceb1590dc753d477f56e0c041b) and is served through the media function with byte ranges; the poster frame is a static file in this branch.
- `video/_treeview.json`, `agent-index.json` and `llms.txt` list it.

## Unreleased - 2026-10-19 (evening)

### Added
- The two Welsh Government replies of 19 October 2026, as emails and as their attached letters:
  - ATISN 26-0010 disclosure response (retention and destruction schedules; no files found under the farm name, Western Ground Rents Ltd or BP Properties Ltd). Email `gm-1a1537b442f27f72`; letter `pdf/foi/2026-10-19_welsh-government_atisn-26-0010_disclosure-response.pdf`.
  - Cadw ATISN 27589 response, ref qA2496208 (refused under FOIA s.14(2) as a repeat of ATISN 27021). Email `gm-1a154577a09c3329`; letter `pdf/foi/2026-10-19_cadw_atisn-27589_response-s14-2.pdf`.
  - Both letters are public copies: the requester's personal email address is redacted and nothing else is changed. `pdf/foi/manifest.json` records the SHA-256 of the public copy and of the original.
- Email attachments in the case-mail API. Records in `api/index.json` and `api/message/<id>.json` now carry an `attachments` list (name, title, site-relative url, MIME type, bytes, SHA-256, catalogue number) wherever `pdf/foi/manifest.json` holds a file that came with that email. 18 emails now link 27 files. The same links are appended to the end of each `mail/<id>.txt`. New tool: `tools/wayback-attachments.py`; run it after `tools/wayback-gmail-ingest.py`.
- `pdf/_treeview.json`, `pdf/foi/README.md`, `agent-index.json` and `llms.txt` list the two new letters.

The case-mail API now holds 767 emails in 411 threads. email.bucklerfamily.estate reads it live.

## Unreleased - 2026-10-19

### Added
- First item in the **Video** tab: `video/2026-10-19_great-house-farm-our-case-film-v6.mp4`, "Great House Farm: our case (film v6)" (5 min 33 s, 15.3 MB, H.264/AAC, faststart), with a poster frame `video/2026-10-19_great-house-farm-our-case-film-v6-poster.jpg`.
- New `video/_treeview.json` index; `agent-index.json` and `llms.txt` now list it.
- The film is our case, not a finding of any court. Like the other archive videos, the MP4 itself sits in the `wayback_media` R2 store under the same `video/` key (md5 cd926c990dfd6b0345c610170399a9d1) and is served through the media function with byte ranges; the poster frame is a static file in this branch.

## [0.1.0] - 2026-10-16

### Fixed
- Added a Pages Function for media requests. It reads from the existing `wayback_media` R2 binding for the whitelisted `images/`, `pdf/`, `text/`, and `video/` prefixes.
- Returns the R2 object body and HTTP metadata. Treeview JSON and static HTML continue through Pages, and the R2 bucket is not enabled for public `r2.dev` access.

### Changed
- Merged Email into a single **Text / Email** tab. Email correspondence remains in the text index and can be filtered by `#email`.
- Kept legacy `?cat=email` links working by routing them to Text / Email with the `#email` filter active.
- Replaced the non-standard four-part development version with semantic version `0.1.0`.

### Release process
- Added a version-file-triggered GitHub Actions workflow. It validates `wayback/version.txt`, requires the matching release notes, and publishes the tagged GitHub Release `wayback-v0.1.0`.
- Full release notes: [v0.1.0](releases/v0.1.0.md).

## v0.0.0.88 (1989 planning file and GHF email filter)
- Added the Vale of Glamorgan 89/01396/OUT papers for Great House Farm, Llandough, under `pdf/planning/`: application form and section 27 certificate (16 Oct 1989), GGAT comments, the officer report, the 13 March 1990 outline permission, and the plans bundle (1985 register map, 1989 location plan, 1991 Heronhurst layout, 1992/1995 Ideal Homes layout, 1998 sketch).
- Added a text catalogue note and the sent Great House Farm / Llandough FOI emails that were not already filed (Welsh Government ATISN 26-0010 chase, NLW Herbert survey S7 / Bute X.6 FOI and LibAnswers 9890384 acknowledgement, National Archives hearth-tax FOI, Vale of Glamorgan FOI 00210772 chase).
- Email tab and #email / #ghf / #planning filters. Items tagged `email` in `text/_treeview.json` are the Gmail correspondence.
- October 2026 text files that were on the branch but missing from `text/_treeview.json` are now listed.
- Police and MOD FOI files are omitted from the public catalogue. Mobile numbers are redacted.

## v0.0.0.87 (FOI reply attachments)
- Added 36 original attachments from public-authority replies (FOI/EIR/complaints/records enquiries, Feb–Oct 2026) under `pdf/foi/`, unaltered, with `manifest.json` (Gmail message id, subject, original filename, SHA-256) and `README.md`.
- Catalogue numbers match the wiki's FOI & Public-Authority Reply Register (GHF-E106-R01 … R41).
- Added 35 entries to `pdf/_treeview.json` and 1 to `images/_treeview.json` (tags: foi, bpvsbuckler).
- Deploy note: media normally lives in R2; these files are also committed under `wayback/pdf/foi/` so they are served if the Pages deploy includes them. Sync `pdf/foi/` to the R2 bucket if the domain routes `/pdf/*` to R2.
- Not retrievable automatically (too large for the mail connector): Museum Wales FOI 2026-032 (22 Sep, 28.5 MB), Vale of Glamorgan 00211027 (14 Sep, 27 MB), Cadw listed buildings (21 May, 11.6 MB).

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

