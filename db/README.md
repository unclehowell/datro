# Dartboard section database

public/_db/section.sqlite is this section's own database (Cedwyn section convention: `records(kind, id, seq, data JSON)` + `meta(k, v)`); the Cedwyn build merges its rows into the core `section_records` table.

Kinds: `wdtk_request` (one per WhatDoTheyKnow request: authority, title, status, first and last dates, counts), `wdtk_message` (one per message: request, date, direction, kind), `media` (the long dartboard video).

Only dates, direction and status are stored for WhatDoTheyKnow messages: no message text, names or contact details.

`python3 db/export.py` regenerates src/data/section-db.json (what the front end imports) and db/section.sql (diffable dump) from the database.
