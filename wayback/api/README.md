# Wayback case-mail API

Static, read-only JSON for every case email (redacted copies), CORS open for GET.

- /api/index.json: every record without text, newest first
- /api/threads.json: records grouped by Gmail thread
- /api/message/<id>.json: one record with its text
- /api/corpus.json: lists /api/corpus-N.json shards with every redacted text (id -> text), for full-text search
- /mail/<id>.txt: the same text as plain text

Ids are `gm-<gmail message id>` and never change. Regenerate with tools/wayback-gmail-ingest.py (idempotent: adds new mail, rewrites nothing that has not changed, deletes nothing).
Email addresses, phone numbers, the family's private address and postcodes are redacted. Unredacted originals stay in Gmail and are never stored here.
