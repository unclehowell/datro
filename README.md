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

## Archive text in the squares, and the Sudoku board (20 Oct 2026)

- The full text of the free archive edition of the Legal Wiki (v0.1.0, 2,033 pages; never a paid edition) and the public GHF sites
  (fcg., projects., clerk., bpvsbuckler., wayback., dartboard., email.; research. is the wiki mirror, already covered) is split into
  ~700-character extracts, privacy-scrubbed and normalised to the house wording, then tagged black (BP / authorities side: court record
  and official documents) or white (the Williams/Buckler record). A segment takes the colour of the board squares sourced from the same
  wiki page; otherwise a keyword rubric decides; correspondence is decided paragraph by paragraph (who is writing).
- Distribution: within each colour, extracts in time order are poured into that colour's squares in board order so every square holds an
  equal share of characters (to within one extract). Shards: `public/data/archive/a-NN.json.gz` (24 squares each, gzip), index
  `public/data/archive/index.json`. The browser loads a shard only when a square is zoomed into or opened.
- Sudoku: `public/data/sudoku.json` holds ten unique-solution 9×9 puzzles. The 808 squares in story order are split evenly across them;
  the n-th correct number in a puzzle opens extract n (1–2 squares) in time order. Progress is kept in localStorage (`ghf-sudoku-v1`).
- Rebuild (from `tools/archive/`): `python3 ext.py` (PDF → pdf.json), `python3 crawl.py` (sites → sites.json), `python3 chunk.py`,
  `python3 build_archive.py <site dir>`, then `python3 gate.py` (wording + privacy grep over everything public) and `node verify_sudoku.js`.

Our case, prospective. Not a finding of any court. — Sion's Tab agent
