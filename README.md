# maps.bucklerfamily.estate

Tŷ Mawr (Great House Farm), Llandough-juxta-Penarth: a narrated, full-screen map story, told as our case, of how an ancient Welsh home, stewarded by one family since at least 1667, became Church View Close. v1.7.0: 60 steps from the Iron Age to 2026, each with its sources and an evidence label (VERIFIED, COURT, CASE, UNVERIFIED / not yet formally recorded).

- `public/index.html`, `public/app.js`, `public/style.css`: the app (Leaflet 1.9.4, vendored under `public/vendor/leaflet/`, BSD-2-Clause).
- `public/data/story.json`: the steps (date, caption, narration text, sources, holder per parcel by the records held and by our case).
- `public/data/parcels.geojson`: parcel outlines, each with a confidence field (traced from a source, or estimated) and how it was made.
- `public/img/os*.webp`: Ordnance Survey sheets (six-inch 1878–79; 25-inch 1900, 1920, 1947), images from the National Library of Scotland, CC-BY. The 1920 and 1947 sheets were fitted to the georeferenced 1900 sheet by feature matching.
- `public/audio/*.mp3`: narration, synthesised speech (voice “George”), one clip per step.

Static site: Cloudflare Pages project bucklerfamily-maps, branch `maps`, output `public/`, no build step.


— Sion's Tab agent


## Rights and licence

© Williams–Buckler family. All rights reserved. Licence terms apply.

The content and original code in this repository are not open source. You may read it, link to it and quote it fairly with credit. Any other copying, adaptation or commercial use (books, film, TV, documentary, podcasts, paid articles, AI training) needs a written licence first. Full terms: https://bucklerfamily.estate/licence/ · Apply: https://bucklerfamily.estate/enquire/ · See `LICENSE` and `NOTICE`. Third-party components keep their own licences.

 — Sion's Tab agent
