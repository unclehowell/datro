# chess.bucklerfamily.estate — the Great House Farm chessboard

One giant zoomable chessboard of the Great House Farm / Tŷ Mawr record. Black squares: actions, legal framings and omissions
against Williams/Buckler ownership (and records that cut against the case). White squares: evidence of ownership and
occupation, heritage and lineage, and the trees and land. Rows are eras; squares read left to right in time order.

- Static site served by Cloudflare Pages project `bucklerfamily-chess` from this branch (`chess` of unclehowell/datro),
  output directory `public/`, no build command.
- Data: `data/items.json` (every square: id, code A/L/C/K/E/H/T, theory flag, title, summary, date, sources).
- Rebuild: `python3 tools/build.py [--theory squares.json]` writes `public/data/board.json`, `public/list/` and
  `public/index.html` (from `index.tpl.html`). The build fails on banned wording or private data (gate).
- Renderer: `public/assets/chess.js`, a dependency-free canvas with level of detail (colours from afar, titles closer,
  full text and source up close), pinch/wheel zoom, search, colour and text toggles, deep links `#s=<id>`.
- Shared estate pieces: ghf-lang (EN/CY/ES interface, dictionary `public/lang/chess.json`) and the e-book card (cta.js).
- Font: Barlow (SIL OFL, `public/assets/fonts/OFL.txt`).

## v2 (20 Oct 2026): a paragraph inside every square, Read more, Visit website, and one big case sudoku

- **Squares.** Every square draws its OWN text inside its own edges (canvas clip): from afar only colours; closer in the date and
  title; from about 120 px per square the square's short paragraph (its summary) and a "Read more ›" tab. Zoom is capped so a square
  never grows past the screen, so no text runs across the board. The first view opens at a readable zoom; "Fit board" shows the whole board.
- **Read more.** Tapping a square opens a modal (phone-first, scrollable, Close): date, title, summary, sources, a "Visit website"
  button, then the square's full content: every archive extract placed in it, each with its own "Visit website" button.
- **Visit website links.** Each link is the source page plus a text fragment (`#id:~:text=…`) built from words verified to sit inside
  one block of the live page (wiki pages read from the public REST API, site pages fetched), with the nearest real element id in front
  as a fallback anchor. Verified anchors: 8,973 of 9,652 extracts and 747 of 808 squares; the rest link to the page. PDF-only
  extracts link to the wiki page the archive edition was built from, never to a PDF. fcg.'s old home is now /theory/.
- **The case sudoku** (`?mode=sudoku`): one 16×16 board (`public/data/sudoku16.json`, UI `public/assets/sudoku16.js`).
  Rows = 16 eras; columns = 16 kinds of evidence in four grade bands (Corroborated record, Documented, Inference, Theory not yet
  proven to a legal standard); symbols 1–9, A–G = 16 actors and records; boxes = an era band × a grade band. Each correct entry
  opens the record placed in that cell with its grade and a Visit website link; theory cells read as hypotheses with
  "" Notes, same-symbol highlight, undo, hint, reveal cell, progress in localStorage.
- **Difficulty by evidence grade.** `tools/sudoku16/gen.js 1987 12,9,5,1` removes givens band by band (12/9/5/1 per box), keeping
  exactly one solution and a no-guess logic solve. Measured: 111 givens; the Corroborated band needs only naked singles (solve
  wave 1.3 on average), Documented hidden singles (wave 2.8), Inference locked candidates (wave 15.9), Theory pairs (wave 22.1).
- **Test:** `node tools/sudoku16/verify.js` (exactly one solution, equals the stored solution, logic-solvable, every cell has a record).
  **Gate:** `python3 tools/archive/gate.py` (banned wording + privacy grep over every public file, decoded).

 — Sion's Tab agent


## Rights and licence

© Williams–Buckler family. All rights reserved. Licence terms apply.

The content and original code in this repository are not open source. You may read it, link to it and quote it fairly with credit. Any other copying, adaptation or commercial use (books, film, TV, documentary, podcasts, paid articles, AI training) needs a written licence first. Full terms: https://bucklerfamily.estate/licence/ · Apply: https://bucklerfamily.estate/enquire/ · See `LICENSE` and `NOTICE`. Third-party components keep their own licences.

 — Sion's Tab agent

## v3 (21 Oct 2026)
- Two square colours only: pure white (every record in the family's favour: codes E, H, T) and pure black (the opposing narrative: A, L, C, K). Text is black on white and white on black.
- Empty cells, filtered-out cells and the page background are one purple, #1e1b4b.
- No labels, era bands, file letters, separators, corner markers or hint drawn over the grid. The era of the rows in view and the tally "White N · Black N" sit in the bar under the board.
- build.py: the asset version (?v=) hashes chess.js, chess.css and sudoku16.js as well as board.json; a privacy scrub keeps a witness's first name withheld on every rebuild. Build without --theory (the theory squares are already merged into data/items.json).
