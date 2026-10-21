# fb.bucklerfamily.estate — "farmbook"

Since 21 Oct 2026 a mock social network that retells the Great House Farm (Tŷ Mawr), Llandough story: each newspaper or broadcaster in the archive is a profile, each of its real articles is a wall post (dated to publication), the article's own photograph is cropped into the post and the profile's Photos, and the direct quotes of William (Billy) Buckler and Mary (Nancy) Williams appear word for word as comments by their profiles. A thin line on every page: "A reconstruction: these outlets' real articles shown as if posted online. Not their own accounts." Every post has a Source tap (paper, date, page, archive link, EV- number).

- Data: `tools/social_data.py` (profiles + posts). Build: `python3 tools/build_social.py` (writes index.html, u/, n/, profiles.html, posts.json; keeps the header v2 loader `ghf-boot.js?v=2.0.3` at the end of every <head>).
- Do NOT re-run `tools/build_posts.py` on index.html any more: it was the old timeline generator. The old family timeline is kept as `site/timeline.html` with its pages in `site/p/`.
- Check: `node check.mjs` (honesty line, footer, v2 loader, house-list words, private patterns, image sizes).

Not affiliated with Meta or with any outlet shown.
