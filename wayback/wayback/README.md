# Wayback Archive — wayback.datro.xyz

Point-of-reference archive for all Great House Farm, Llandough, Mrs Williams, and BP vs Buckler 1987 evidence.

## Structure

```
wayback/
  index.html          ← root served at wayback.datro.xyz
  README.md           ← this file
  version.txt         ← semantic version
  images/             ← photographs, screenshots, scans (JPG, PNG)
    _treeview.json    ← auto-generated index consumed by index.html
  pdf/                ← land registry, FOI responses, evidence, legal docs (PDF)
    _treeview.json
  text/               ← email bodies, correspondence, transcripts (TXT)
    _treeview.json
  video/              ← video evidence (MP4, WebM)
    _treeview.json
  other/              ← miscellaneous formats (DOC, DOCX)
    _treeview.json
```

## Categories & Hashtags

- **#bpvsbuckler** — Great House Farm (the defendant's property), images
- **#datro** — all pre-existing / non-GHF files

## Index

The root `index.html` loads each category's `_treeview.json` and renders a tabbed,
paginated gallery with hashtag cloud filtering. All paths in treeview JSON use the
`wayback/` prefix so they resolve from the root domain.

## Naming Convention

Files follow: `YYYY-MM-DD_description_author__lang_vX-Y-Z[_NNN].ext`

- Date prefix (YYYY-MM-DD or 0000-00-00 if unknown)
- Underscore-separated description + author
- Language tag (en, cy, etc.)
- Version tag (v0-0-1, etc.)
- Optional sequence number (_001, _002)

## Deployment

Deploy via Cloudflare Pages using `wrangler pages deploy` from the repo root.
The project is `wayback`, account `hywelapbuckler@gmail.com`.
