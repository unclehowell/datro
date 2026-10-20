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

Our case, prospective. Not a finding of any court.
