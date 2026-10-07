# Changelog

## [bpvsbuckler-v0.0.0.60] - 2026-10-07

New page: **Records control** (`/control/`), a control panel of every body the family is seeking records from and every procedure available against it.

### Added
- 34 bodies and 85 requests or cases, grouped as land and title; heritage, archives and museums; government, council and police; courts and justice; elected representatives; companies, firms and private holders
- Nine procedures, each laid out step by step in the order the steps must be exhausted: FOI / EIR (request through to tribunal appeal), subject access (through to a court order), complaints (through to the ombudsman or independent reviewer and a legal challenge), preservation notices, records and copies, reports to prosecutors, statutory notices, elected representatives, and private-party disclosure
- Every step coloured by state: done, waiting on them, your move, overdue, unconfirmed, available, not applicable. Each state also has an icon and a label
- Headline figures: ground covered (steps taken out of steps available), and counts of overdue, your-move, waiting and unconfirmed cases. Clicking one filters the page
- Overview matrix (bodies × procedures) and a step-by-step section for each body with dates, references and what was said
- A waiting step turns overdue on its own once its due date passes
- Data at `/api/control.json`, built by `content/control_source.py`. Sources: the wiki's Records Access Chronology and reply register, the family's correspondence and the HubSpot tickets, as at 7 October 2026
- "Records" tab in the film's header; both URLs added to the sitemap

## [bpvsbuckler-v0.0.0.59] - 2026-10-06

Every scene checked against the Great House Farm Wiki (213 pages): each quotation, date, number and named fact traced to a wiki page, and every scene now links to at least one.

### Corrected
- 1974 letters: BP wrote that Mary could remain "under licence"; "for life" / "for the rest of her life" removed (not on the wiki)
- 1955: the wiki records Mary's recent return from hospital (1987 judgment), not an amputation at that date; the leg amputation is kept where her c. 1974 statement records it
- Armour account: in a Royal Commission record (NMR 6048942) and the 1974 Daily Telegraph, not in the 1988 report
- Rubble examination: the record does not name who made it; attribution to R. F. Suggett removed
- "County treasure": GGAT's 1989 planning report describes the house as having been listed as a "county treasure"; Cadw states it was never listed
- 1991 record: the exact Royal Commission wording ("suddenly and completely destroyed … amid considerable local controversy", NMR 6048945); the HER entry compiled 21 August 1991
- Cemetery: "by far the largest Early-medieval burial population so far recovered from Wales" (the excavators' words)
- Lordship: "Lord Clynton and Say", as Cardiff Records spells it; Cogan/Bute 1793 wording
- D 219 quotation in the catalogue's exact form
- 1950: Mr Knapp, Penarth estate agent, and the lodger Bruce Sutherland named as in the statement; papers given to Mr Knapp
- Cadw "YYY": "marginally below the bar" (21 May) and "did not meet the criteria" (10 July); no destruction record
- House of Lords papers: survive (YHL/PO/JO/10/11/2536), found September 2026; "catalogued in May 2026" removed
- "Preservation notice to eleven public bodies" removed (not on the wiki); the June 2026 request to HM Land Registry not to destroy material is kept
- Mary died aged sixty-nine
- 1877, 1928 and 1940: stated on Mary's statement and the family's case, with the wiki's notes that the 1877 deal's character (sale or quarry lease) and the 1940 point depend on documents still to be tested

### Marked as family account, not yet recorded on the wiki
- The woodland of Parcel A taken in 1955, passed to a couple in Llandough and later to the Forest of Cardiff, which has not used it
- The land south of the farmhouse taken by the council and laid out as a green in the 1980s

### Evidence
- Wiki links added where scenes cited only outside sources or needed the page a statement comes from (Case Analysis, Source Conflicts Register, Forensic Master Chronology, Register Additions A-080, 1988 Possession and Demolition, Bute Estate, 1990 GGAT transcription, Legal Review)

## [bpvsbuckler-v0.0.0.58] - 2026-10-06

### Fixed
- The lordship of the manor and the ownership of the farm are now told as two separate lines. New scene "The lordship of the manor" (1536–1793): Tewkesbury Abbey, the Crown, Sir George Herbert by 1545, Bute in 1793 (noting that Cardiff Records places the manor with William Hurst and others from 1767). "The Vaughans" now says they held the farm as a freehold while the Herberts held the lordship. "The Bute Estate" now gives both dates: the lordship bought in 1793, the farm freehold acquired early in the 19th century
- "Manorial leases": 1552–1829 is the date range of the whole National Library of Wales bundle (D 219); the farm's own leases run 1552–1824. No event in 1829 is recorded
- Parcel A's freehold chain now reads: the Vaughans, then Bute (by the early 19th century), then Daniel Thomas (1877), then the Williamses (1928)
- Prologue scene references after P.2 move up by one (the new scene is P.3)

## [bpvsbuckler-v0.0.0.57] - 2026-10-06

### Design
- The parcel storyline (true Parcel A, synthetic Parcel A, Parcel B, merged "A & B") now fills the top of every scene, with the scene marked; on phones it scrolls to the current scene
- The scene's photograph or press cutting appears as a picture-in-picture thumbnail on the storyline, with "Enlarge" opening it full size (Esc or click to close)
- The narrator now reads the event, then "The received account", then "What we now know", with word-by-word highlighting through all three
- The transcript at /story/transcript.txt includes the received account and what we now know

### Content
- "What we now know" rewritten on 18 key scenes to tell the family's story and the injustices plainly: three centuries in the manor's house, the papers taken, Mary home from losing a leg in 1955, the licence sent to a woman in a wheelchair, the eviction, the 4am demolition, the bus, Billy's death
- New segment "Stating the obvious" (O.1–O.11), each narrated: they were not squatters; Mary never asked for permission; nobody produced a deed to the house; they knew it was two parcels; losing on possession is not losing on ownership; William Buckler was the last obstacle; four in the morning was chosen; the public was on their side; the papers did not leave on their own; a decision with no file; they never asked a court who owned the house
- Opening page rewritten to set out the other side: what people heard, and what this site shows

## [bpvsbuckler-v0.0.0.56] - 2026-10-06

Every scene restructured into three layers.

### Content
- **What happened**: each scene's event rewritten as a minimal, neutral description, with neutral titles. This is the text the narrator reads
- **The received account**: what the unquestioned narrative would have people believe occurred, with the wordings of the time that reinforce it (e.g. "the whole farm", "the whole of the farm", "the farmhouse and garden", "licence", "no question or doubt", "the paper title to the farm", "registered correctly")
- **What we now know**: what the event and its wording truly meant, on the two-parcel reading
- Act titles, loglines and cast descriptions made neutral
- The analysis layers live in `content/accounts.py`, one entry per scene, checked complete at build time

### Design
- Player shows the event, then "The received account" and "What we now know", then the title ledger and storyline
- Script page, llms.txt and api/timeline.json carry `received_account`, `received_wording` and `what_we_now_know` (replacing `words`)

## [bpvsbuckler-v0.0.0.55] - 2026-10-06

### Content
- The story is now unpacked on the two-parcel reading throughout. "The whole farm" (1916) is named as the birth of a synthetic, single-estate farm that existed only on paper; every case against the family was fought over it
- 1955: why an order against the fields tenant could only reach Parcel B, so any clock that started then was a clock on the fields; the insinuation that it reached the house was later mistaken for fact
- "The farmhouse and garden" (1959, 1962, 1975, 1983) explained as Parcel A, less the woodland to the north and the land to the south already taken, and as proof the landlords treated the house parcel as separate
- 1974: Mary's statement of the 1877 split, the case no lawyer of hers ever built
- 1984–87: the family's defence of adverse possession from 1955 shown as a claim to a mythical estate, fought on the other side's map, when Parcel A had been theirs since 1928 and by possession since 1940; the 1987 merger as proof that BP and the Land Registry knew the parcels were two; the Court of Appeal reading a separate conveyance of "the farmhouse and garden" yet deciding one farm
- New epilogue scene "Who knew": what the family knew, what WGR, BP, the Land Registry and the court plainly knew, the mess everyone made of the case, and the family's conclusion that it was a conspiracy against them

### Design
- New panel on 22 scenes, "The words, and what they meant": each phrase of the time (e.g. "the whole farm", "the farmhouse and garden", "the paper title to the farm", "registered correctly") decoded on the two-parcel reading; also in the printable script, llms.txt and api/timeline.json (`words`)

## [bpvsbuckler-v0.0.0.54] - 2026-10-06

### Content
- The ploys against Mary are now named for what they were: six attempts to make her occupation of her own house look permissive (1949 house spoken of as part of Frederick's fields tenancy, which she rejected while still holding the paper title; the 1955 "whole of the farm" order against the fields tenant; the 1959 and 1965 tenancy offers; the unenforced 1962 order treating her as holding over; the 1974 licence letters). The 1975 conveyance, 1983 registration and 1987 merger are told as the paper steps that followed
- 1940: the family's title by possession (rent-free since 1928) is now Mary's household's, and the narration says plainly that from 1940 there was no basis to call her occupation permissive
- 1955: Mary just home from hospital after losing a leg; the family's account that the woodland half of Parcel A was taken in 1955, passed to a couple in Llandough and later to the Forest of Cardiff, which has left it untouched; and why an order against a fields tenant could only start a clock on the fields
- 1970–72: the council's taking of the land south of the farmhouse, registered as village green VG41 and laid out as a green in the 1980s
- The conflation of the two parcels is attributed to the landlords' documents, never the family; the 1965 and 1974 scenes set out what the sequence of tenancies, orders and licence implies about the deed nobody produced
- Court of Appeal scene: the clock was started in 1955 from an order about the fields; counted from 1928, twelve years ran out in 1940
- Title ledger and storyline labels updated to match

## [bpvsbuckler-v0.0.0.53] - 2026-10-06

The story retold as a legal thriller about the title chain.

### Content
- Narration rewritten around the two titles to Parcel A. The true title runs Vaughan → Bute → Daniel Thomas (1877) → Williams (1928), with its papers taken in 1950. The synthetic Parcel A is built beside it, move by move: the 1916 "whole farm" wording, Frederick's unwritten fields tenancy (1949), the 1955 "whole of the farm" order, the refused tenancies of 1959 and 1965, the unenforced 1962 order, the 1969 handover, the 1974 licence letters, the 1975 BP-to-BP conveyance of "the farmhouse and garden", the 1983 separate registration, and the 1987 merger into the fields title. Each scene now says what the move did to Parcel A and why it mattered
- The 1969 sale is told precisely: Parcel B passes by deed (Bute → WGR → BP); for the house, what passes is the case against Mary (the 1962 order), with no deed to Parcel A behind it
- The 23 May 1975 conveyance is restored as its own scene ("A deed for the mimic")
- The Court of Appeal scene now explains that the judges found adverse possession running from 1955, and that BP won only through the 1962 order and the 1974 letters; the judgment decided possession, never ownership
- Epilogue "How it was done": the moves in order, and the two doors in English law they went through (possession without ownership tried; registration without a rival claim decided)
- Acts retitled: The Root, The Split, Two Words, The Mimic, The Handover, Possession Not Ownership, Bulldozed Before Breakfast, Built Over, The Buried Title, Today

### Design
- New storyline diagram, after the family's drawing: the true Parcel A (green, buried after 1950 but running on), the synthetic Parcel A (red, dashed), Parcel B (blue), and the merged "A & B" title (gold) from 1987. Every move is a dot that opens its scene. Full-size on the Storyboard; compact in the player, with the current scene marked
- Every scene shows "The titles after this scene": the state of each title, with the lane that moves in that scene marked
- Title moves added to the printable script, llms.txt and api/timeline.json (`title_ledger`, `title_moves`)

## [bpvsbuckler-v0.0.0.52] - 2026-10-06

The story retold as a narrated film.

### Content
- Narration rewritten as a film script: present tense, the most plausible account the evidence supports, told plainly instead of in the wiki's catalogue voice. The theme is the title chain, the family, and how the house was taken: the 1877 split, the 1928 last rent, the "whole farm" wording, the papers taken from the blanket box, the possession orders, BP's registration of the house while Mary lived in it, the courts deciding possession but never ownership, the demolition, the thousand graves, and the silence since
- "The family's case" notes folded into the narration
- Acts retitled: The Great House, The Bargain, The House Is Theirs, The Papers Vanish, BP, Possession Not Ownership, Bulldozed Before Breakfast, Built Over, The Silence, Today
- 129 scenes tightened to 99: administrative and side-site scenes merged into the scenes they belong to, keeping every evidence link; every old scene id still redirects. Scene references after VI.2 change as a result (e.g. "Bulldozed before breakfast" is now VI.11)
- Epilogue rebuilt as a build-up to today: who holds the land, the register and the dead; the village history that leaves the Great House out; no inquiry, no apology, no reparation; what the family ask for
- Opening page, Storyboard and Cast introductions rewritten to match

## [bpvsbuckler-v0.0.0.51] - 2026-10-06

Evidence-link repair. Story wording, scene order, scene ids, evidence titles and catalogue references are unchanged.

### Fixed
- Cadw survey photographs of the farmhouse and barn, 29 July 1988 (ATISN 27021), in VI.5 and VIII.6: `archaeology/#cadw-1988` no longer exists; now link to the ATISN 27021 response entry (GHF-E106-R37) in the FOI & Public-Authority Reply Register, `records-access-chronology/foi-reply-register/#R37`
- Mary Williams — 1965 offer (III.11): `mary-williams/#offer-1965` no longer exists; now links to the Chronology section of the Mary Williams page, `mary-williams/#chronology`, which holds the 2 March 1965 entry
- The Williams / Buckler Family (P.5, II.10, III.12, III.14, IV.17, VII.14): the page's sections no longer carry anchors, so `#origins`, `#william` and `#rumoured-sale` are removed and these entries link to `williams-buckler-family/`

## [bpvsbuckler-v0.0.0.50] - 2026-10-06

Re-release as a documentary storyboard.

### Content
- Rebuilt the story as 129 scenes in a prologue, eight acts and an epilogue, each with a scene reference (e.g. VI.12), a short title, place, parcel (A, B, both, unknown), basis (document, court record, newspaper, Mary's statement, family account…) and the family's case
- Every scene in the wiki's Master Timeline is covered; added the 13 February 2026 Land Registry holding reply, the 18–19 September 2026 letters to Stephen Doughty MP and the 20 September 2026 Heneb records request
- Newspaper cuttings (N07–N16 and the South Wales Echo extracts N15-01 to N15-16) are now evidence on the scene they report, instead of 23 separate scenes that retold the same events; duplicate scenes on the medieval pottery, the armour find and the HER record merged
- Removed events that belong to Llandough near Cowbridge (Walsh 1100, Herbert 1444, Carne 1536, Talbot 1677) or to Piercefield (Morris 1770, Wood 1794), and others with no source (Tewkesbury 1215, Dissolution 1539, Bute–Pembroke 1552, Lambert Williams, Bute–Plymouth exchange, 1880 names); replaced with sourced entries (NLW Bute D 219 leases 1552–1829, Bute rentals R1 1818–21)
- Narration rewritten in the present tense without drafting notes; contested points moved into "The family's case"; the 1876 note no longer calls the quarry bargain "oral"
- Every scene now has at least one specific evidence link (previously 17 had none)
- Old event ids redirect to the merged scene

### Design
- New player: photo or cutting beside the scene, readable evidence list with thumbnails, cast and parcel tags, "Copy reference" for citing, act-segmented scene bar, keyboard controls, narration that highlights as it reads
- New Storyboard and Cast views; new printable script at /story/ (/script.html now redirects there)
- Splash with the 1988 Cadw photograph of the farmhouse; correct release label
- Cadw photographs and press cuttings added under /media/
- Removed the development Tailwind CDN and placeholder social links; donation buttons moved to the opening page

## [bpvsbuckler-v0.0.0.49] - 2026-10-06

### Added
- 149 chronological events taken from the Great House Farm Wiki evidence catalogue, in strict date order; the player starts at the first event (c. AD 650) and stops at the end
- `?event=<id>` and `?year=<year>` deep links
- New `/story/` page with schema.org JSON-LD
- New `/story/transcript.txt` narration transcript
- Regenerated `/api/timeline.json`, `/llms.txt` and `sitemap.xml`
- Deploy workflow now builds the exports and ships `story/`
- Editorial/forensic chronology expanded from 149 to 172 events, including the 1949 and 1965 tenancy strands as explicit evidential pivots
- Added discrete dated entries for the South Wales Echo N15-01 to N15-16 search extracts and the 17 April 1980 Neath Guardian context report
- Narrator slides now expose small links back to the Great House Farm Wiki Evidence Library, Press Articles Index, and event-specific Wiki evidence pages

## [bpvsbuckler-v0.0.0.48] - 2026-10-05

### Added
- Every dated event in the Great House Farm Wiki's Master Timeline (greathousefarmwiki.wordpress.com/timeline/) is now in the site timeline: 111 -> 132 scenes. New: c.650 St Dochdwy's early monastery (family account); 11 Nov 1891 geese theft court report; 23 Feb 1905 Bute conveyance; Frederick Buckler's birth (1910-11); 15 May 1924 agreement; eldest son's birth (c.1937-40); the c.1940 limitation contention (marked as a family contention); William (Billy) Buckler's birth (c.1948-49); 10 Oct 1952 agents' letter; 29 Mar 1961 deed; eldest son's household leaving (1968-69); 16 Jun 1970 village green VG41; 25 Jul 1972 housing permission; 13 Mar 1983 GGAT warehouse fire (Roman villa finds, separate site); 10 Oct 1989 Oakview sale (WA513690); 8 Feb 1990 GGAT Appendix B missing from the planning file; 10 Nov 1994 woodland to Forest of Cardiff (WA735527); 1995-96 South Wales Electricity rights and Persimmon correspondence; 22 Dec 2005 woodland division; 2025-26 records requests; 3 Oct 2026 press transcription
- Each new scene cites the Master Timeline and the wiki page it links to; existing scenes are unchanged
- scripts/build-timeline-exports.mjs rebuilds api/timeline.json and llms.txt from the timeline data

### Fixed
- The opening slide is found by year (1897) instead of a fixed index, so added events no longer shift it

### Note
- Release numbered 0.0.0.48 to follow the latest published tag (bpvsbuckler-v0.0.0.47); the 0.0.0.10-0.0.0.11 changelog entries of 3 Oct were not tagged


## [bpvsbuckler-v0.0.0.11] - 2026-10-03

### Fixed
- Dates corrected from the transcribed press cuttings (Press Archive, GHF-E090-N01 to N15, on the Great House Farm Wiki): the chainsaw stand-off was on 29 April 1988, not 29 November; the "1977" open day was 15 April 1974 (Daily Telegraph, 16 April 1974); the Rees "Grievous loss" letter is marked year-unclear
- 1988: the April stand-off, Alun Michael MP (12 May), the forced entry of 30 November, the interim injunction, the 5 December hearing before Judge Norman Francis and the 4am demolition of 6 December now follow the press reports; each scene cites its transcript
- 1989: charges, bail, guilty plea (23 March), site clearance (20 March) and "From farm to a bus" dated and sourced; duplicate clearance scene removed (112 -> 111 scenes)
- Splash events, llms.txt and api/timeline.json regenerated


## [bpvsbuckler-v0.0.0.10] - 2026-10-03

### Changed
- Timeline brought in line with the Great House Farm Wiki (greathousefarmwiki.wordpress.com): 99 -> 112 scenes
- Corrected: Mary Williams born 10 Aug 1913 and married 1936; 1938 Bute reversion to WGR replaces the unrecorded 1926 "Penarth Estate Company" sale; 1955 High Court order and 1962 Cardiff County Court order; 1986 High Court judgment dated 10 July (Hollis J); 1978-79 Roman villa marked as a separate site; 1994 excavation is an early-medieval cemetery (1,026 burials); "armour" find given its Museum Wales provenance (Church Farm, 1858)
- Added: 1877 Daniel Thomas sale and the two parcels, 1877 Bute lease, 1908, 1928, 1944, 1950-52 papers taken, 1963 committal, 1965 offer, 1967, 1977 open day, 1982 GGAT warning, 1987 amalgamation, 1988 House of Lords and first eviction attempt, 1989 ECHR decision and planning, 1990 evaluation, 1992, 1993, 2019, 2026 campaign
- Removed scenes with no supporting record: 1978 and 1980 hearings, 1986 demolition application, Roman villa scenes, 2024 duplicate
- Challenges reworded as family contentions, per the Wiki's evidence standard
- Splash key events, llms.txt and api/timeline.json regenerated

### Added
- GitHub Actions deploy to the bpvsbuckler Cloudflare Pages project on every push


## [bpvsbuckler-v0.0.0.09] - 2026-06-01

### Added
- **Slide Media Icons** — Every timeline slide now has 5 tiny icon buttons (Docs, Video, Audio, URL, Info) beneath the narration text, ready for future WayBack file-explorer modal integration sourced from wayback.datro.xyz

### Removed
- **Social Media Login** — Removed Google, Facebook, and X (Twitter) login modal ("Access Evidence" / "Please login") and all related social authentication code
- **Padlock Icon** — Removed the padlock/lock icon from the footer evidence section
- **Social Media Links** — Removed Facebook, Instagram, and X icon links from the copyright footer

### Changed
- Version bumped to bpvsbuckler-v0.0.0.09

## [bpvsbuckler-v0.0.0.05] - 2026-05-22

### Fixed
- - fix: remove console.log from 3 files
- - fix: remove console.log from 3 files
- - fix: remove console.log from 3 files
-

## [bpvsbuckler-v0.0.0.04] - 2026-05-22

### Fixed
- fix: 3 bugs [fix 1: fix: remove console.log from 3 files] [fix 2: fix: remove console.log from 3 files] [fix 3: fix: remove console.log from 3 files]

## [bpvsbuckler-v0.0.0.05] - 2026-05-21

### Fixed
- fix: remove console.log from ./static/archives/canvas/assets/js/app-iframesafe.js

It's expected that developers log all changes to this branch in this CHANGELOG.md file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [bpvsbuckler-v0.0.0.08] - 2026-05-30

### Added
- **HER Facts Distributed Chronologically** — 8 new standalone timeline slides drawn from GGAT02038s, each at its correct year:
  - 1215: Medieval pottery sherds and ironwork confirming early occupation
  - 1560: Vaughan family tenure begins (chief freehold farmers mid C16th)
  - 1800: Bute Estate acquires freehold; manorial courts held at Great House
  - 1880: Medieval ironwork ("armour") found under rear wing floor
  - 1974: House surveyed in unusual circumstances by H.J.T. (access blocked by ownership dispute)
  - 1988: HER independently confirms demolition "suddenly and completely" on 6 December
  - 1988: Post-demolition findings (fireplace jamb, lost stone capital, ogee-stopped beam)
  - 1990: HER record PRN 02038s compiled with 7 related archaeological events (1990–2013)
- **Agent-Friendly API** — `/api/timeline.json` endpoint returns all 87 entries as structured JSON with metadata, summary, and key events for AI/LLM consumption
- **LLMs.txt** — `/llms.txt` serves the full timeline in plain text following the llms.txt standard, optimized for ChatGPT and similar agents
- **Robots.txt + Sitemap** — `/robots.txt` allows all agents; `/sitemap.xml` lists every timeline year for search engine crawling
- **Auto-generation Pipeline** — `content/generate-api.js` regenerates all agent files from data.json; integrated into `content/rebuild.py` so API/LLM/sitemap update automatically on rebuild

### Changed
- Version bumped to bpvsbuckler-v0.0.0.08
- Removed standalone 2023 HER dump entry (facts now distributed to their correct years)
- Existing timeline entries unchanged — no facts appended to existing slides

## [bpvsbuckler-v0.2.0.07] - 2026-05-29

### Added
- **HER Record Integrated into Timeline** — GGAT02038s HER record entry (2023) added directly to the React SPA's slide chronology (`a1` array), covering:
  - Confirmed demolition by BP Properties Ltd on 6 Dec 1988
  - C12th-C14th pottery sherds confirming medieval occupation
  - Medieval ironwork at National Museum of Wales (Vaughan tenure from mid C16th)
  - Bute Estate acquisition early C19th
  - RCAHMW Inventory and 7 related archaeological events (1990–2013)
- **Content Extraction System** — `content/data.json` + `content/rebuild.py`: all timeline, splash, and claim content externalised from the JS bundle. Future updates: edit `data.json`, run `python3 content/rebuild.py`.
- **Beurcracy Nav Link** — Reliable MutationObserver injects Beurcracy into the React nav alongside Home, Script, Reparations.

### Changed
- Version bumped to bpvsbuckler-v0.2.0.07.
- `index.html`: consolidated MutationObserver scripts, removed stale HER Record nav link (content now integrated).

## [bpvsbuckler-v0.2.0.06] - 2026-05-29

### Added
- **HER Record GGAT02038s** — Official Glamorgan-Gwent HER record for Great House Farm retrieved from Heneb (Archwilio). Independently confirms demolition by BP Properties Ltd on 6 December 1988, medieval origins (C12th-C14th pottery), Vaughan family tenure from mid C16th, Bute Estate acquisition early C19th, and medieval ironwork at National Museum of Wales.
- **HER Research File** — `research/her-record-ggat02038s.txt` with full HER record transcription, related events table, and significance analysis for the BP vs Buckler case.
- **Timeline Slide: 6 Dec 1988 — HER Record** — `static/timeline/1988-her-record-demolition.html` self-contained timeline entry documenting the HER record with full narrative, timeline, and significance analysis.
- **Evidence Entry** — HER record added to `evidence/data.json` under 1988 with links to original Archwilio record and research analysis.
- **Cards added to index.html and research/index.html** linking to the new HER research file and timeline slide.

### Changed
- Version bumped to bpvsbuckler-v0.2.0.06.

---

## [bpvsbuckler-v0.2.0.05] - 2026-05-17

### Added
- **Evidence Data Hub** — Comprehensive evidence data spanning 1667–2026 with detailed entries for key events (Marconi experiments, forced tenancy, identity fraud, Land Registry circular logic, state-sanctioned deed erasure, court judgment contradictions, armed eviction/demolition).
- **Evidence Modal System** — JavaScript modal overlay for browsing evidence entries by year, with gallery display for linked evidence (emails, documents, images).
- **Senedd Email Correspondence** — 30 email .eml files documenting 2026 communications with Senedd members (Heledd Fychan MS, Leticia Gonzalez MS, Joe Martin MS, Eleri Griffiths) regarding the Great House Farm dispossession case.
- **Email Fetch Script** — `fetch-emails.py` utility to pull BP vs Buckler / Great House Farm emails from Gmail and update data.json with evidence references to wayback.datro.xyz.

### Changed
- `evidence/data.json` expanded from a single 1987 entry to 15 year-groupings (1667–2026) with full subject, content, and evidence reference arrays.
- Evidence modal dark/gold theme integrated with existing site design.

---

## [bpvsbuckler-v0.2.0.03] - 2026-05-16

### Changed
- Homepage UI: Added the timeline video as the first element (hero section) for immediate visibility.
- Timeline Narrative: Extensively corrected the Great House Farm timeline to accurately reflect the Williams/Buckler family's superior title claim, their refusal to pay rent, and the systematic "Death of a Thousand Cuts" (DoaTC) lawfare used against them.
- Version bumped to bpvsbuckler-v0.2.0.03.

---

## [bpvsbuckler-v0.2.0.02] - 2026-05-15

### Added
- **Timeline XMB experience** — Full PS3 XMB-style interactive timeline with video background, narration audio (startup.mp3, nav.mp3), play button, animated clock, and 19 menu entries (Home, Games, Music, Photos, Videos, Settings + submenus)
- **Static timeline entries** — 34 chronological HTML entries from 1100s medieval monastery through 1994 cemetery excavation, with data-driven launch page
- **Great House Farm Research section**:
  - BP v Buckler Rundown (333 lines) — full chronological title history with 10 discrepancy notes
  - Estate Gap Analysis (140 lines) — documentation gaps by record series, two-Llandoughs problem, fee simple question, research to-do list
  - FOI Requests — 6 letters to NLW, Glamorgan RO, National Archives, Vale Council, Cadw, HM Land Registry
  - Research Hub — HTML navigation portal with links to all documents
- **Reparations section** — Land Registry WA231076, Senedd engagement, legal strategy, highlight report
- **Scripts section** — Build/deploy documentation for website, library, Cloudflare Pages, and image processing
- Wayback archive (20+ documents, multiple video files)

### Changed
- Version bumped to bpvsbuckler-v0.2.0.01
- Custom domain: bpvsbuckler.datro.xyz
- Site served from Cloudflare Pages at `https://*.bpvsbuckler.pages.dev`

### Fixed
- CSS path in timeline/index.html (scss/main.css → main.css)
- Large video files (>25MB) excluded from Cloudflare Pages build
- All timeline assets (images, audio, SCSS, JS) properly linked

---

## [financecheque-v0.1.0.05] - 2026-05-04

### Added
- Migrated UI files from ui branch to static/financecheque/ui and public/ui
- Updated iframe references from ui.financecheque.uk to /ui
- Migrated PirateClaw files to static/financecheque/pirateclaw/ and public/pirateclaw/
- Updated PirateClaw install script to point to financecheque.uk/pirateclaw/website/
- curl -fsSL https://financecheque.uk/pirateclaw/website/install.sh | sh now works

### Changed
- PirateClaw branch changed from pirateclaw to financecheque for installation

---

## [financecheque-v0.1.0.04] - 2026-05-02

### Added
- Real user registration with Cloudflare D1 database
- User login with JWT authentication (using jose - Cloudflare compatible)
- Password reset request and reset functionality
- User sessions stored in D1 database

### Fixed
- Replaced jsonwebtoken with jose for Cloudflare Workers compatibility

---

## [financecheque-v0.1.0.03] - 2026-05-01

### Fixed
- Mobile menu now uses click-to-toggle for Buyer and Seller submenus
- "Budget Per Lead" label no longer shows "(credits)" suffix
- Fixed seller balance authorization deducting 2.33 credits

---

## [financecheque-v0.1.0.02] - 2026-05-01

### Fixed
- Fixed mobile menu - uses click toggle instead of hover-only
- Fixed seller balance: authorization deducts 2.33 credits from Lead Seller wallet

---

## [financecheque-v0.1.0.01] - 2026-05-01

### Added
- Mobile-first responsive design
- Compact mobile view with hidden subtitle
- Smaller title on mobile scaling up on larger screens

---

## [financecheque-v0.1.0.0] - 2026-05-01

### Added
- Initial migration from FCUK to datro
- Lead order simulation with localStorage persistence
- Tatum.io API integration
- Stacey avatar with GIF animation
- Cloudflare Pages deployment configuration