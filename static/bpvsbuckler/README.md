# Tŷ Mawr — The Great House Farm Story

**Website:** [bpvsbuckler.bucklerfamily.estate](https://bpvsbuckler.bucklerfamily.estate)

A narrated film storyboard of the true story of the Williams/Buckler family and Great House Farm (Tŷ Mawr), Llandough-juxta-Penarth, built for documentary development: something a studio, producers and cast can read, play and cite. Every scene is drawn from the [Great House Farm Wiki](https://greathousefarmwiki.wordpress.com/) and links to its evidence.

## What's on the site

- **Play** (`/?event=<id>`) — one scene at a time, narrated, with the scene's photo or press cutting, evidence, parcel and basis
- **Storyboard** (`/?view=storyboard`) — every scene as a panel, grouped into a prologue, eight acts and an epilogue
- **Cast** (`/?view=cast`) — the people and bodies in the story and the scenes they appear in
- **Three-part Parcel A assessment** (`/research/three-parcel-split-forensic-assessment.html`) — interactive schematic, 1955/1961/1962/1970/1982–87 chronology, evidence for and against, and the primary-document control list
- **Questions** (`/?view=questions`) — the case questions, their current answers and status, and a search over every question and answer in the correspondence
- **Script** (`/story/`) — the printable script and scene list; each act starts on a new page when printed
- **Data** — `/api/timeline.json`, `/api/graph.json`, `/api/qa.json`, `/api/ask?q=`, `/llms.txt`, `/story/transcript.txt`, `sitemap.xml`

Scenes are cited by reference (act.scene, e.g. `VI.11`) or by permanent id (`?event=ghf-19881206-1`). Ids from earlier releases redirect to the scene that now carries that event.

## Editing the story

The slides come from a Q&A knowledge graph. Three inputs feed it:

1. **The scenes**: `content/story_source.py`. One scene per event, in date order; every scene needs at least one evidence link; narration in the present tense, the most plausible account the evidence supports. Running it writes the seed, `content/graph/seed/story.seed.json`.
2. **The correspondence**: every email sent and received with records bodies.
   - `content/graph/raw/catalogue/*.html`: the wiki's word-for-word email catalogue pages, parsed by `ingest_catalogue.py`.
   - `content/graph/raw/gmail/`: Gmail threads, either as exported thread JSON (`<threadId>.json`) or as hand-made extracts (`extracts-*.json`), parsed by `ingest_gmail.py`.
3. **The case questions**: `content/graph/case_questions.json`. These are the questions the story turns on. Each carries its current best answer, what supports it, what cuts against it, and what is still to find. Its status is one of: documented, family-account, contested, open or not-held.

`content/graph/build_graph.py` does the rest:

- It pairs each question asked with the answer given, and classifies each answer (provided, partial, not held, refused, pointed elsewhere, acknowledged, automatic).
- It links answers to case questions and to scenes through shared references (titles, archive references, FOI numbers) and through the case questions.
- It grades every scene: documented, single source, family account, contested, or the family's argument.
- It writes `api/graph.json`, `api/qa.json`, `api/graph.sql` (for Cloudflare D1) and `src/data/story.json`, which the player renders.

To rebuild:

```
python3 content/story_source.py
python3 content/graph/ingest_catalogue.py
python3 content/graph/ingest_gmail.py
python3 content/graph/build_graph.py
node scripts/build-timeline-exports.mjs <version> <date>
```

**New FOI replies update the story by themselves.** Drop the thread into `content/graph/raw/gmail/` and push. The workflow rebuilds the graph, reloads D1 and redeploys. Each affected slide then shows the new answer under "What the records bodies say". When a reply settles or overturns something, update its case question's answer and status. Every scene that turns on it changes with it.

**Search.** `/?view=questions` lists the case questions and searches every question and answer through `/api/ask` (`functions/api/ask.js`). That reads the D1 database `bpvsbuckler-graph`, with full-text search and graph neighbours, and falls back to `/api/qa.json` if D1 is unavailable.

Commit and push to the `bpvsbuckler` branch. GitHub Actions builds with Vite, loads D1 and deploys to Cloudflare Pages.

Photos and cuttings are in `media/` (from the `wayback` branch).

## Licensing

Copyright DATRO Consortium Ltd. Cadw photographs © Crown copyright, released to the family under ATISN 27021. Newspaper cuttings are reproduced from the family archive as evidence, with their transcripts on the wiki.
