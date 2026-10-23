# fb.bucklerfamily.estate — "farmbook"

Since 21 Oct 2026 a mock social network that retells the Great House Farm (Tŷ Mawr), Llandough story: each newspaper or broadcaster in the archive is a profile, each of its real articles is a wall post (dated to publication), the article's own photograph is cropped into the post and the profile's Photos, and the direct quotes of William (Billy) Buckler and Mary (Nancy) Williams appear word for word as comments by their profiles. A thin line on every page: "A reconstruction: these outlets' real articles shown as if posted online. Not their own accounts." Every post has a Source tap (paper, date, page, archive link, EV- number).

- Data: `tools/social_data.py` (profiles + posts). Build: `python3 tools/build_social.py` (writes index.html, u/, n/, profiles.html, posts.json; keeps the header v2 loader `ghf-boot.js?v=2.0.3` at the end of every <head>).
- Do NOT re-run `tools/build_posts.py` on index.html any more: it was the old timeline generator. The old family timeline is kept as `site/timeline.html` with its pages in `site/p/`.
- Check: `node check.mjs` (honesty line, footer, v2 loader, house-list words, private patterns, image sizes).

## The hope wall (22 Oct 2026)
Sion, 00:00 22 Oct: daily HyperFrames highlight-report videos, the main wall as reverse chronology from today (highlights and key events
only), and full per-person profiles with their whole chronology, every actor with a face.
- `python3 tools/build_social.py && python3 tools/build_wall.py` (always both, in that order). build_wall overwrites index.html (the wall),
  u/<slug>.html (profiles), writes wall/<year>.html, api/wall.json, wall.css, and keeps the press feed as papers.html.
- Data: `data/daily.json` (written by /home/user/tab/work/fb-daily/make_daily.py), `data/faces.json` (portraits: illustrated, generated from
  the public role only, never from a real photo; William and Mary keep their family archive photos), `data/statements.json`, `data/friends.json`,
  and the dartboard roadmap JSON (every reply, request and missed deadline per institution).
- Push: `python3 tools/push.py "<message> — Sion's Tab agent"` (GitHub API, fetch + fast-forward, force:false).
- Check: `node check.mjs`.


## Two editions: Then (fb.) and Now (fb2.) — 23 Oct 2026
One generator, one branch, a build flag. `FB_EDITION=then` (default) builds `site/` for https://fb.bucklerfamily.estate/: only actors, events and media before 2005, retold as social media (each post by the party that acted, "X is now friends with Y" for transfers, "shared a link" for the press, reactions, comments, a Source link on every post). `FB_EDITION=now` builds `site2/` for https://fb2.bucklerfamily.estate/: 2005 onwards (requests, replies, refusals, missed deadlines as posts, "Seen" receipts and check-ins by the body that acted; the daily highlight-report video).

    python3 tools/email_posts.py   # new emails → fb2 posts in the sender's own words (data/email_posts.json)
    python3 tools/build_social.py && python3 tools/build_wall.py && FB_EDITION=now python3 tools/build_wall.py
    node check.mjs site && node check.mjs site2
    python3 tools/push.py "<message> — Sion's Tab agent"

Pages: `bucklerfamily-fb` (build `node check.mjs`, output `site`) and `bucklerfamily-fb2` (build `node check.mjs site2`, output `site2`), both from branch `fb`. Stories: site/stories.js (rings at the top of both walls). Anything moved to fb2 answers on fb with a 301 (site/_redirects, generated block).

Shorts (both editions) carry pictures, video and hyperframes only, never a text slide (SHORTS GATE). fb2 email posts: the sender's own first-person summary, optional key words, hashtags (#email #to/#from …), dated and timed to the email's sent time; no "Reply" labels (23 Oct 2026).
