
## bpvsbuckler-v0.0.1.44
- Full icon integration: icons left of NARRATION (data-type set), highlight (glow has-evidence) for current slide using year/slide match (e.g. >=1667 or 1988/scene65).
- Clicks on highlighted icons: pause slideshow + open modal (styled identical to archive-modal) with wayback iframe filtered by ?slide=N&year=YYYY&cat= + #slide-N .
- Enhanced showEvidenceGallery / updateNarrationIcons: auto-pause on highlight/click, pass slide+year+type cat to wayback.
- Added static #evidence-modal HTML using archive-panel for identical design; close handlers.
- Appended 2-3 missing timeline details to scenes.json (1667 receipt/purchase emphasis; 1897 Marconi full wireless first signal detail + Williams at mast; 1988 Cadw/ATISN + demolition timing + attachments notes for scene 65).
- Mobile CSS fixes: improved @media (768px,600px,480px) for icons (larger touch 44px targets), narration layout, text sizes, arrows, controls, flex wrap, padding.
- Updated version.txt + CHANGELOG.
- Design kept identical.

## bpvsbuckler-v0.0.1.42
- Appended missing timeline info to scene 65 (1988): Cadw inspection 29/07/1988, did not meet listing criteria, only two photos in WG records, other records to RCAHMW or destroyed per ATISN 27021.
- UX: Moved media icons (PDF 📄, Image 🖼️, Text 📰, Video 📝) to left of NARRATION title on each narrator slide.
- Icons highlight with glow if supporting evidence exists for the year/event (based on catalogue).
- Click highlighted icon pauses the slideshow and opens modal gallery/iframe from wayback.datro.xyz filtered by slide/year (using #slide-N tags in evidence names, hidden in wayback UI).
- Added URL param support in wayback for ?slide=N &year=YYYY .
- Mobile UX fixes: better tap targets, layout, fonts on small screens.
- Design kept identical.

