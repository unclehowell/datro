# watchtower.bucklerfamily.estate

Watchtower: dated changes to institutions' own web pages about Great House Farm (Tŷ Mawr), Llandough, from the Internet Archive
(Wayback Machine).

- Pages tracked: institution pages that name Great House Farm, Tŷ Mawr, the Llandough monastic cemetery and its excavations
  (1990, 1994), the Llandough Roman villa, BP v Buckler, or titles WA231076 / WA240304: Archwilio (HER), Coflein (RCAHMW),
  Museum Wales, Welsh Government / Cadw, Llandough Community Council, the Vale of Glamorgan Council, the National Library of
  Wales, the Church in Wales and others as they are found. Llandough near Cowbridge, Treoes and Llanmaes are different places
  and are excluded.
- Method: every Wayback capture of each page is listed (CDX). Distinct captures are read and the passages about the farm or the
  site are compared capture to capture, narrowing each change down to two adjacent captures. Each change is one dot: page
  appeared, text added, text removed, text changed, or page gone, with links to the before and after captures.
- Landing page: one scatter graph (x = date, y = institution) and the full list of changes underneath.
- Release 3.0.1 adds keyboard-focus styling; data values unchanged. Data: `public/data/changes.json`. Re-checked daily at midday by `work/watchtower/v3/run_daily.py`.
- Archive: the earlier "Raised & replies" layer (correspondence items) and the v2 page-change data are kept unpublished in
  `archive/` (outside `public/`, so the site does not serve them).
- Static site: Cloudflare Pages project bucklerfamily-watchtower, branch `watchtower`, output `public/`, no build step.

© Williams–Buckler family. All rights reserved. Licence: https://bucklerfamily.estate/licence/

— Sion's Tab agent
