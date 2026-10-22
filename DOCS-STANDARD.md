# DOCS-STANDARD — how a document is published on docs.bucklerfamily.estate

Version 1.0.0 · 2026-10-22. Drawn from the library branch (library.bucklerfamily.estate), which stays as it is.
The rules are numbered so a change, a review or a build error can point at one. `python3 _theme-docs/build.py --check`
enforces the ones marked **[checked]**; a deploy fails rather than publish a document that breaks them.

## 1. The branch holds source only
1.1 The `docs` branch holds reStructuredText, gettext catalogues (`.po`), images, metadata and the build kit. **[checked]**
1.2 No HTML, PDF, `.mo`, `build/` or `public/` is ever committed. Cloudflare Pages builds them on every deploy. **[checked]**
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
<collection>/collection.json                               collection label per language and its order on the homepage
```
2.5 Published addresses (built, never committed):
```
/<collection>/<document>/latest/html/<lang>/                       HTML, one folder per language
/<collection>/<document>/latest/pdf/<lang>/<collection>-<document>.pdf
/<collection>/<document>/                                          → redirects to the reader's language
/docs.json                                                         navigation index (§7)
```
2.6 File names join the two folder names with a hyphen: `ghf_tests-specimen_loremipsum.pdf` (as in the library).
2.7 Archived editions use `YYYY-MM-DD_<collection>-<document>_<lang>_v0-1-0.pdf` — language before version.

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
  "status": "draft | published | test | withdrawn"
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
4.5 Welsh and Spanish characters (ŵ ŷ â ñ á …) are written as themselves in UTF-8; the PDF fonts (TeX Gyre) carry them.

## 5. Writing RST
5.1 Heading characters, in this order: `=` title (once, in index.rst and once per chapter), `-` section, `~` subsection, `^` sub-subsection.
5.2 Cross-references use labels (`.. _label:` above a heading, `:ref:\`label\``), never raw URLs to our own pages.
5.3 Tables use `list-table` with `:header-rows: 1`; figures use `figure` with `:alt:`. Captions carry no number — the build numbers them.
5.4 Footnotes use auto-numbered `[#name]_`.
5.5 Public wording rules of the family sites apply: never name a private individual; institutions and roles only; none of the words
    says, claims, according to, hearsay, unverified, alleged, fraud, stolen. **[checked]** No disclaimers, no crest.

## 6. Versions and release notes
6.1 `releasenotes.rst` is the first chapter: "This release (version x.y.z)" with dated bullets `**2026-Oct-22** - …`, then "Older versions".
6.2 SemVer: PATCH for wording fixes, MINOR for new sections or a new language, MAJOR for a restructure or a new edition.
6.3 When a version is replaced, its PDF goes to the wayback archive under the name in §2.7 and gets a line in "Older versions".

## 7. The navigation index: docs.json
7.1 `docs.json` is generated by the build from every `doc.json`, `collection.json` and the built files. Never edited by hand.
7.2 It carries, per document: id, collection, version, date, updated, author, status, and per language: title, summary, html, pdf, pdf_bytes;
    plus the collections with their labels, the commit and the build time. The homepage reads it.

## 8. Adding or changing a document
1. Make the two folders (§2), `doc.json` (§3), `source/index.rst`, `source/releasenotes.rst`, chapters; add `collection.json` for a new collection.
2. `python3 _theme-docs/build.py --update-po <collection>/<document>`; translate the `.po` files.
3. `python3 _theme-docs/build.py --check`, then `python3 _theme-docs/build.py --only <collection>/<document>` and look at `public/`.
4. Add a CHANGELOG.md line (§9) and commit: `docs(<collection>/<document>): <what> v<version>`.
5. Push to `docs`. Cloudflare builds and publishes; if no deployment starts within a few minutes, request one through the Pages API.

## 9. CHANGELOG.md and README.md
9.1 CHANGELOG.md follows Keep a Changelog + SemVer. Newest first. `## [Unreleased]`, then `## [docs-x.y.z] - YYYY-MM-DD`
    with `### Added / Changed / Fixed / Removed`. One line per change: `- \`<collection>/<document>\` v0.1.0 (en, cy, es) — what changed`.
9.2 The branch's own version (`docs-x.y.z`) moves on every merge: MINOR for a new document or a kit change, PATCH for a fix.
9.3 README.md says what the branch is, how to build it, where it is published, and points here. It never lists documents (docs.json does).

## 10. Build (Cloudflare Pages)
10.1 Project `bucklerfamily-docs`, production branch `docs`, build command `python3 _theme-docs/build.py`, output directory `public`.
10.2 `requirements.txt` pins Sphinx, Furo, rinohtype and sphinx-intl; Pages installs it before the build. `PYTHON_VERSION` = 3.11.
10.3 HTML: Sphinx + Furo, shared settings in `_theme-docs/sphinx/conf.py` (documents have no conf.py). PDF: rinohtype (pure Python, no TeX),
     A4, `_theme-docs/sphinx/pdf.rtt` + `pdf.rts`. One PDF per document per language.
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
