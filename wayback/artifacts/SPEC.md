# GHF artifact manifest — spec v1 (stable)

Owner: evidence-catalogue sweep (Sion's Tab agent). Readers: email site, dartboard, site flywheels, forensic reports, wiki.
Written 2026-10-21. Changes to this spec are additive only (new optional fields); nothing listed here is removed or renamed.

## Where
- Repo `unclehowell/datro`, branch `wayback`, file **`wayback/artifacts/manifest.json`**
- Live: **https://wayback.bucklerfamily.estate/artifacts/manifest.json** (static Pages asset, JSON, CORS open via the site's _headers)
- Human view: https://wayback.bucklerfamily.estate/artifacts/ (one list; `#<id>` opens one item, e.g. `/artifacts/#EV-0291`)
- Displayed on the Legal Wiki evidence catalogue: greathousefarmwiki.wordpress.com/evidence/ (Evidence Register 4517) and the "Wayback artifact index" page linked from it.

## What lives where (storage)
- New artifact files go under the existing media roots so the URL never changes if a file later moves between git and R2:
  `pdf/evidence/…` (documents, any office/PDF/zip), `images/evidence/…` (images), `text/evidence/…` (plain-text transcripts, OCR, email bodies), `video/evidence/…`.
  Served at `https://wayback.bucklerfamily.estate/<path>` (the site's function tries the R2 bucket first, then the git copy).
- Binary files (PDF, images, video, office files, zips) go to the R2 bucket `wayback-media` at key `<path>`, whatever their size. Only text and JSON (manifest, index pages, transcripts) are committed to git under `wayback/<path>`. The URL is the same either way, and `files[].storage` shows which (`git` for older collection files, `r2` for new ones).
- Empty fields are left out of the published manifest. A missing field means null or empty.
- Older collections (email archive `/api/index.json`, `/pdf/foi/manifest.json`, `/text/`, `/images/facebook/`) are listed under `collections` and are not repeated item by item, except where an EV entry points at one of their files.
- Email messages themselves stay in the email archive (`/api/index.json`, `/api/message/gm-<gmailId>.json`, `/mail/gm-<gmailId>.txt`) — owned by the email pipeline. The manifest covers documents, media and attachments, and points to the email they came from.
- Older collections already in wayback (`pdf/foi/manifest.json`, `pdf/planning/`, `text/`, `images/facebook/`, root `images/press/`) are referenced from the manifest, not moved. Originals are never overwritten.

## File naming for new files
`<date>_<source-slug>_<title-slug>.<ext>` — `<date>` = YYYY-MM-DD from the document itself; `0000-00-00` when the document shows no date (never taken from a filename or upload time). Lowercase, ascii, hyphens. A new version is a new file; the old one stays.

## manifest.json shape
```json
{
  "schema": "ghf-artifacts/1",
  "generated": "2026-10-21T13:00:00Z",
  "count": 0,
  "base_url": "https://wayback.bucklerfamily.estate/",
  "collections": [ { "name": "...", "index": "...", "count": 0 } ],
  "parts": [ { "url": "items-1.json", "count": 0, "first": "EV-0001", "last": "EV-0090" } ]
}
```
Items live in the part files (`/artifacts/items-N.json`, each `{ "schema", "part", "of", "items": [ ... ] }` and under 100 KB, because the repo push route refuses large files). Fetch every part and join the `items` arrays in order. A writer adding items rewrites the parts in id order (EV first, then WB).
### item
| field | type | meaning |
|---|---|---|
| `id` | string | Stable, never reused. `EV-0001`… when the item has a Legal Wiki EV page; otherwise `WB-0001`… (wayback-only). If a WB item later gets an EV page, `id` stays WB and `ev` is filled. |
| `ev` | string\|null | Legal Wiki evidence ID (EV-xxxx) |
| `keys` | string[] | other catalogue numbers (GHF-E…, FOI register numbers, media ids) |
| `title` | string | plain title, from the document |
| `date` | string | `YYYY-MM-DD`, `YYYY-MM`, `YYYY`, a range `YYYY–YYYY`, or `date unknown` |
| `date_basis` | string | `document` (printed on it), `catalogue` (archive catalogue date), `email` (date of the covering email only), `unknown` |
| `type` | string | letter, email-attachment, deed, plan, map, photo, newspaper, catalogue-entry, register, report, transcript, video, web-page, dataset, other |
| `status` | string | `HELD` (we hold a copy) · `CATALOGUE ENTRY` (we hold only a catalogue description) · `SOURCE PENDING` (referenced, not obtained) |
| `source` | object | `kind` (`gmail`, `drive`, `web`, `archive`, `wordpress`, `family`, `court`), plus any of `gmail_message_id`, `gmail_thread_id`, `email_from` (institution or role, never a private address), `email_date`, `email_subject`, `email_url` (wayback email archive link), `drive_file_id`, `url`, `repository`, `reference` |
| `institution` | string\|null | the public body / organisation the item came from |
| `files` | object[] | `path` (repo-relative to `wayback/`), `url`, `storage` (`git`/`r2`/`external`), `bytes`, `sha256`, `mime`, `original_filename` |
| `people` | string[] | people named in the item (public-record names only; private living individuals by first name or role) |
| `parcels` | string[] | `Parcel A`, `Parcel B`, title numbers (`WA231076`…), place names |
| `wiki` | object\|null | `url` (EV page or catalogue page), `page_id` |
| `duplicate_of` | string\|null | id of the item this duplicates (the duplicate stays listed) |
| `supersedes` | string\|null | id of an earlier version |
| `wp_copy` | string\|null | WordPress media URL still holding a copy (listed for later removal once the wayback link is verified) |
| `pending` | object\|null | for SOURCE PENDING: `held_by`, `route`, `cost` |
| `added` | string | ISO date the item entered the manifest |
| `note` | string | one plain line, optional |

### Rules for readers and writers
- Match items by `id`; de-duplicate new material by `source.gmail_message_id` + `files[].original_filename`, or by `files[].sha256`.
- Writers other than the sweep: append items with the next free `WB-` number, never edit another item's `id`, `files[].path` or `sha256`; fetch + rebase before every push; never force-push; commit messages end "— Sion's Tab agent".
- Privacy: the repo is public. No subject-access (SAR) disclosures, private phone numbers, private home addresses, personal ID documents, or the account holder's own name in public text. Such items are listed with `status` as usual, `files: []`, and `note: "held privately"`.
- Wording: plain, neutral; dates from the document; ""


RULE (Sion, 21 Oct 14:12): in the email archive, leave the account holder's name in email headers and signatures as in the originals. Do not redact it. This exception applies to the email archive only.

                             
