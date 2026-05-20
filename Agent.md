# Wayback Archive — Filename & Treeview Rules

## Filename Schema (static/archives/)

```
YYYY-MM-DD_consortium-{subcategory}_{entity}__{lang}_v{major}-{minor}-{patch}[_{dedup}].ext
```

### Components
- **Date**: `YYYY-MM-DD` — publication date from content
- **Category**: always `consortium`
- **Subcategory**: one of: `evidence`, `foi`, `formal_notice`, `newspaper`, `land_registry`, `public_record`, `petition`, `legal_request`, `order_form`, `whistleblower`, `correspondence`
- **Entity**: `bpvsbuckler` (or future entity slugs)
- **Language**: ISO 639-1 two-letter code (e.g., `en`, `cy`)
- **Version**: `v0-0-1` (hyphen-separated, not dots)
- **Dedup suffix**: `_001`, `_002` … when content-identical copies exist; keep only one copy, remove others
- **Extension**: `txt`, `jpg`, `jpeg`, `png`, `pdf`, `doc`, `docx`

### Separators
- **Single underscore `_`**: separates major components
- **Double underscore `__`**: before language code
- **Hyphen `-`**: within version numbers (instead of dots)

## Treeview JSON Rules (_treeview.json)

- `name` field: display name WITHOUT file extension
- `path` field: relative file path WITH file extension
- `_links.html` field: same as `path`

## Dedup Rules
1. Content-identical duplicates → remove extras, keep earliest-dated copy
2. Pre-2026-05-18 files are exempt from dedup
3. After removing duplicates, regenerate _treeview.json to match
4. Verify MD5 hashes are all unique after dedup

## Subcategory List (for reference)
| Subcategory | Usage |
|---|---|
| evidence | Legal evidence documents |
| foi | Freedom of Information requests/responses |
| formal_notice | Formal legal notices |
| newspaper | Newspaper clippings/articles |
| land_registry | Land Registry records |
| petition | Petitions |
| legal_request | Legal requests |
| order_form | Order forms |
| whistleblower | Whistleblower disclosures |
| correspondence | Correspondence/letters |
