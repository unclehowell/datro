# watchtower.bucklerfamily.estate

Watchtower: dated changes to institution web pages about Great House Farm (Tŷ Mawr), Llandough, and the family's case.
Every institution web link found in the case emails received (wayback email archive), plus institution pages found by site search
that mention Llandough, Great House Farm or Tŷ Mawr, compared against the Internet Archive (Wayback Machine) for the last 13 months
and against the live page.

- Landing page: a scatter graph, x = date, y = institution (or that institution's pages when one is selected). Red = text removed
  or the page is no longer served; green = text added; blue = text altered. A gold ring marks changed text that mentions the farm,
  Llandough or the family. Tap a dot for the summary, the before/after text and links to both archived copies and the live page.
- Data: `public/data/changes.json` (built by `work/watchtower/build_site.py` from `refresh.py`'s output). Re-checked daily at midday.
- Relevance filter (21 Oct 2026): `work/watchtower/relevance.py` keeps pages and changes about the farm, Llandough, the family
  or the parcels (any wording in the nomenclature lexicon, https://nomenclature.bucklerfamily.estate/) and process pages whose
  rules or routes the case uses (marked “Why kept”). Unrelated pages are moved to `excluded.json` with the reason; nothing is deleted.
- Static site: Cloudflare Pages project bucklerfamily-watchtower, branch `watchtower`, output `public/`, no build step.


— Sion's Tab agent

