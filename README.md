# infographic.bucklerfamily.estate — Great House Farm: the land changing hands

A circular network diagram (the "Patent Wars" shape) of every known holder of Tŷ Mawr / Great House Farm land, Llandough.

- **Ring:** the holders (families by role, companies, councils), in an order that keeps each chain's arcs apart.
- **Centre (💩):** the origin without a root title. Three chains run from it to the ring (house A(2) → 1983 registration WA240304; woodland 2(a) → 1961 deed on WA735527; the green → 1970 VG41), each with its 12-year limitation period marked and a source per year (dashed = source to add).
- **Arcs:** one per transfer, from the party it came from to the party it went to, arrowhead at the receiver.
  Stroke colour = year (gradient legend). Solid = record held; dashed = per secondary source / record not seen / per family statement.
- **Circles on the arcs:** the parcel(s) carried: A (whole, from 1877), A1 north wood, A2 house & yard, A3 the green, B the fields,
  W woods round the farm (link to Parcel A not established). A1–A3 are the three parts of Parcel A on the Legal Wiki's three-part
  model and the maps site (v1.6.0 ids AN / AM / AS).
- **Label on each arc:** year + kind ("1938 sale"). On a phone the overview shows the year; zooming in shows the full label.
- **Tap an arc:** date, parcel, from → to, instrument, note, sources (Legal Wiki pages).
- **List:** the same chain as a chronology, plus the two dated events with no change of hands (1987 amalgamation, 1987 appeal).

Data: `public/data/transfers.json` (ghf-infographic/1). Build: `tools/build.py` inlines the data into `tools/template.html`
and runs the public-words gate. Static, no external assets.

Compiled by Sion's Tab agent.
