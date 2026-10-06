# Tŷ Mawr — The Great House Farm Story

**Website:** [bpvsbuckler.bucklerfamily.estate](https://bpvsbuckler.bucklerfamily.estate)

A narrated film storyboard of the true story of the Williams/Buckler family and Great House Farm (Tŷ Mawr), Llandough-juxta-Penarth, built for documentary development: something a studio, producers and cast can read, play and cite. Every scene is drawn from the [Great House Farm Wiki](https://greathousefarmwiki.wordpress.com/) and links to its evidence.

## What's on the site

- **Play** (`/?event=<id>`) — one scene at a time, narrated, with the scene's photo or press cutting, evidence, parcel and basis
- **Storyboard** (`/?view=storyboard`) — every scene as a panel, grouped into a prologue, eight acts and an epilogue
- **Cast** (`/?view=cast`) — the people and bodies in the story and the scenes they appear in
- **Script** (`/story/`) — the printable script and scene list; each act starts on a new page when printed
- **Data** — `/api/timeline.json`, `/llms.txt`, `/story/transcript.txt`, `sitemap.xml`

Scenes are cited by reference (act.scene, e.g. `VI.11`) or by permanent id (`?event=ghf-19881206-1`). Ids from earlier releases redirect to the scene that now carries that event.

## Editing the story

The story lives in one file: `content/story_source.py`.

1. Edit the scene (or add one with `sc(...)` in date order). Rules: one scene per event; newspaper cuttings are evidence on the scene they report, not scenes of their own; every scene needs at least one evidence link; narration in the present tense, told as a narrated film: the most plausible account the evidence supports, stated plainly, with the title chain and the family's dispossession at its centre.
2. Run `python3 content/story_source.py` — writes `src/data/story.json` and checks order, ids and evidence.
3. Run `node scripts/build-timeline-exports.mjs <version> <date>` — rebuilds the script page, JSON, llms.txt, transcript and sitemap.
4. Commit and push to the `bpvsbuckler` branch. GitHub Actions builds with Vite and deploys to Cloudflare Pages.

Photos and cuttings are in `media/` (from the `wayback` branch).

## Licensing

Copyright DATRO Consortium Ltd. Cadw photographs © Crown copyright, released to the family under ATISN 27021. Newspaper cuttings are reproduced from the family archive as evidence, with their transcripts on the wiki.
