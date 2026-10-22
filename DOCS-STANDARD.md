# DOCS-STANDARD — how a document is published on docs.bucklerfamily.estate

Version 1.1.0 · 2026-10-22. Drawn from the library branch (library.bucklerfamily.estate), which stays as it is.
The rules are numbered so a change, a review or a build error can point at one. `python3 _theme-docs/build.py --check`
enforces the ones marked **[checked]**; a deploy fails rather than publish a document that breaks them.

## 1. The branch holds source only
1.1 The `docs` branch holds reStructuredText, gettext catalogues (`.po`), images, metadata and the build kit. **[checked]**
1.2 No HTML, PDF, `.mo`, `build/`, `public/` or `_release/` is ever committed. Cloudflare Pages builds the HTML on every deploy. **[checked]**
1.4 The site is HTML only. Older versions are PDFs kept in the wayback archive (§6), never on docs.
1.3 `README.md`, `CHANGELOG.md` and this file live at the root of the branch.

## 2. Paths (the library's pattern, kept)
2.1 One collection folder per subject: `<subsidiaryID>_<categoryID>/` — lowercase letters and digits, one underscore,
    e.g. `ghf_tests`, `ghf_records`, `ghf_guides`. **[checked]**
2.2 One document folder inside it: `<subcategoryID>_<documentID>/`, e.g. `specimen_loremipsum`, `lease_1939`. **[checked]**
2.3 Depth is always two. Inside the document folder there is one `latest/` folder holding `doc.json` and `source/`.
2.4 The document source:
```
<collection>/<document>/latest/doc.json                    metadata (§3)
<collection>/<document>/latest/source/index.rst            title, one-paragraph introduction, toctree
<collection>/<document>/latest/source/releasenotes.rst     first chapter (§6)
<collection>/<document>/latest/source/N-<chapter>.rst      chapters, numbered 1-, 2-, …
<collection>/<document>/latest/source/_static/images/      images (PNG or JPEG; SVG is not used, the PDF builder cannot place it)
<collection>/<document>/latest/source/locales/<lang>/LC_MESSAGES/docs.po
<collection>/collection.json                               collection label per language, its order, and the band labels (§7.3)
```
2.5 Published addresses (built, never committed):
```
/                                                                  menu: categories (collections)
/<collection>/                                                     menu: the collection's documents
/<collection>/<document>/                                          menu: one row per language — Latest (HTML), older versions (PDF) to its right
/<collection>/<document>/latest/html/<lang>/                       HTML, one folder per language
/docs.json                                                         navigation index (§7)
```
2.6 File names join the two folder names with a hyphen: `ghf_tests-specimen_loremipsum` (as in the library).
2.7 Archived editions use `YYYY-MM-DD_<collection>-<document>_<lang>_vX-Y-Z.pdf` — the date of that edition (its `updated`), language before version.
2.8 Archived editions live in the wayback branch at `wayback/pdf/docs-archive/<collection>/<document>/<lang>/<name from 2.7>`,
    served at `https://wayback.bucklerfamily.estate/pdf/docs-archive/<collection>/<document>/<lang>/<name>`.
    The archive's own list is `wayback/pdf/docs-archive/index.json`. **[checked: the URL in doc.json must follow this pattern]**

## 3. Metadata: doc.json (required fields) **[checked]**
```json
{
  "id": "ghf_tests/specimen_loremipsum",       // must equal the folder path
  "title": "Specimen Document: Lorem Ipsum",   // English; identical to the H1 of index.rst
  "summary": "One sentence shown on the homepage.",
  "version": "0.1.0",                           // MAJOR.MINOR.PATCH
  "date": "2026-10-22",                         // first publication, YYYY-MM-DD
  "updated": "2026-10-22",                      // this version, YYYY-MM-DD
  "languages": ["en", "cy", "es"],             // ISO 639-1; the order is the order shown
  "source_language": "en",
  "author": "Estate office, Great House Farm (Tŷ Mawr)",   // an institution or a role, never a person's name
  "status": "draft | published | test | withdrawn",
  "archive": [                                  // older versions, newest first; written by release.py (§6), not by hand
    {"version": "0.0.1", "date": "2026-10-22",
     "pdf": {"en": "https://wayback.bucklerfamily.estate/pdf/docs-archive/ghf_tests/specimen_loremipsum/en/2026-10-22_ghf_tests-specimen_loremipsum_en_v0-0-1.pdf"}}
  ]
}
```
3.1 Title and summary are translated in the same `.po` as the text (the build adds them to the catalogue).

## 4. Languages
4.1 **One English RST source, one gettext catalogue per language** (`locales/<lang>/LC_MESSAGES/docs.po`). Why: it is the library's
    own method (sphinx-intl), the text structure can never drift between languages, and Cloudflare builds it with plain pip packages.
4.2 Default languages: `en` (source), `cy`, `es`. Any ISO 639-1 code can be added to `languages`.
4.3 Every language listed must have a catalogue. **[checked]** An untranslated string falls back to English; it is never left blank on purpose.
4.4 After editing the English, refresh the catalogues: `python3 _theme-docs/build.py --update-po <collection>/<document>`, then
    translate the new `msgstr` lines. Do not edit `msgid`.
4.5 Welsh and Spanish characters (ŵ ŷ â ñ á …) are written as themselves in UTF-8; the archive PDF fonts (TeX Gyre) carry them.

## 5. Writing RST
5.1 Heading characters, in this order: `=` title (once, in index.rst and once per chapter), `-` section, `~` subsection, `^` sub-subsection.
5.2 Cross-references use labels (`.. _label:` above a heading, `:ref:\`label\``), never raw URLs to our own pages.
5.3 Tables use `list-table` with `:header-rows: 1`; figures use `figure` with `:alt:`. Captions carry no number — the build numbers them.
5.4 Footnotes use auto-numbered `[#name]_`.
5.5 Public wording rules of the family sites apply: never name a private individual; institutions and roles only; none of the words
    says, claims, according to, hearsay, unverified, alleged, fraud, stolen. **[checked]** No disclaimers, no crest.

## 6. Versions, release notes and the archive SOP
6.1 `releasenotes.rst` is the first chapter: "This release (version x.y.z)" with dated bullets `**2026-Oct-22** - …`, then "Older versions".
6.2 SemVer: PATCH for wording fixes, MINOR for new sections or a new language, MAJOR for a restructure or a new edition.
6.3 **SOP — every new version.** Before touching the source, run
```
pip install -r requirements.txt -r _theme-docs/requirements-release.txt
python3 _theme-docs/release.py <collection>/<document> --to X.Y.Z [--date YYYY-MM-DD] [--wayback-checkout ../wayback]
```
    It builds the outgoing version to PDF once per language, stages each at its wayback path (§2.8) under `_release/wayback/…`
    with an updated `index.json`, adds the outgoing version to the top of `doc.json` `"archive"` with its URL per language, and sets
    `"version"`/`"updated"` to the new version. With `--wayback-checkout` it also commits the PDFs in a checkout of the wayback branch.
6.4 Then: commit `_release/wayback/` to the **wayback** branch (fetch and rebase, never force-push) and make sure wayback deploys;
    edit the source for X.Y.Z; add the release notes (§6.1) and a CHANGELOG.md line; `build.py --check`; commit the **docs** branch.
6.5 One PDF per language listed at the time of the outgoing version. Archived PDFs are never rebuilt, replaced or deleted; a correction is a new version.
6.6 Why wayback and not git tags or PDFs on docs: the archive is the family's store of originals, a replaced edition is frozen exactly as it was,
    and the docs build stays fast and HTML only.

## 7. The navigation index: docs.json
7.1 `docs.json` is generated by the build from every `doc.json`, `collection.json` and the built files. Never edited by hand.
7.2 It carries, per document: id, collection, version, date, updated, author, status, title, summary, archive (versions), and per language:
    title, summary, html and archive (`[{version, date, pdf}]`, the wayback PDFs in that language); plus the collections with their labels,
    the archive base URL, the commit and the build time.
7.3 The menus are built from it, in the library's journey and look: home = one band per subsidiary (the part of the collection id
    before `_`, label `subsidiary_title`) with a button per collection; collection page = one band per document group (the part of the
    document id before `_`, label from `groups`) with a button per document; document page = the document's title, then one band per
    language: a green **Latest** button (HTML) and, to its right, a red button per older version (PDF in wayback, `X-Y-Z`). « goes up a level.

## 8. Adding or changing a document
1. Make the two folders (§2), `doc.json` (§3), `source/index.rst`, `source/releasenotes.rst`, chapters; add `collection.json` for a new collection.
2. `python3 _theme-docs/build.py --update-po <collection>/<document>`; translate the `.po` files.
3. `python3 _theme-docs/build.py --check`, then `python3 _theme-docs/build.py --only <collection>/<document>` and look at `public/`.
   For a new version of an existing document, start with the SOP in §6.3.
4. Add a CHANGELOG.md line (§9) and commit: `docs(<collection>/<document>): <what> v<version>`.
5. Push to `docs`. Cloudflare builds and publishes; if no deployment starts within a few minutes, request one through the Pages API.

## 9. CHANGELOG.md and README.md
9.1 CHANGELOG.md follows Keep a Changelog + SemVer. Newest first. `## [Unreleased]`, then `## [docs-x.y.z] - YYYY-MM-DD`
    with `### Added / Changed / Fixed / Removed`. One line per change: `- \`<collection>/<document>\` v0.1.0 (en, cy, es) — what changed`.
9.2 The branch's own version (`docs-x.y.z`) moves on every merge: MINOR for a new document or a kit change, PATCH for a fix.
9.3 README.md says what the branch is, how to build it, where it is published, and points here. It never lists documents (docs.json does).

## 10. Build (Cloudflare Pages)
10.1 Project `bucklerfamily-docs`, production branch `docs`, build command `python3 _theme-docs/build.py`, output directory `public`.
10.2 `requirements.txt` pins Sphinx, Furo and sphinx-intl; Pages installs it before the build. `PYTHON_VERSION` = 3.11.
     `_theme-docs/requirements-release.txt` adds rinohtype for release.py only.
10.3 HTML: Sphinx + Furo, shared settings in `_theme-docs/sphinx/conf.py` (documents have no conf.py). The deploy makes no PDF.
     Archive PDFs (release.py): rinohtype (pure Python, no TeX), A4, `_theme-docs/sphinx/pdf.rtt` + `pdf.rts`.
10.5 The site's `_redirects` sends the old PDF addresses (`/<collection>/<document>/latest/pdf/…`) to the document's menu; other missing paths are a 404.
10.4 Every generated HTML page ends its `<head>` with the family header loader `ghf-boot.js?v=2.1.2`.

## 11. Passing in other markup later
11.1 Markdown, HTML or Word handed to the docs branch is converted to RST first, then follows §2–§9:
```
pandoc -f markdown -t rst --wrap=none  in.md   -o source/1-chapter.rst
pandoc -f html     -t rst --wrap=none  in.html -o source/1-chapter.rst
pandoc -f docx     -t rst --wrap=none --extract-media=source/_static/images in.docx -o source/1-chapter.rst
```
11.2 After converting: fix heading characters to §5.1, replace raw links to our pages with `:ref:`, give figures `:alt:` text,
     remove typed figure numbers, then run `--check`. `_theme-docs/convert.sh` does the pandoc step.
