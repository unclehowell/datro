-- Central database schema (Hive Operating Framework v0.1, section 4).
-- Not applied automatically. The ingest Worker creates only `correspondence` for itself.
-- Apply when the other flywheels are wired in:  npx wrangler d1 execute hive --remote --file migrations/0001_central_schema.sql

CREATE TABLE IF NOT EXISTS bodies (id INTEGER PRIMARY KEY, name TEXT, domain TEXT, type TEXT, contact TEXT);
CREATE TABLE IF NOT EXISTS requests (id INTEGER PRIMARY KEY, body_id INTEGER, ref TEXT, kind TEXT, sent_on TEXT, due_on TEXT, status TEXT, hubspot_task_id TEXT);
CREATE TABLE IF NOT EXISTS correspondence (message_id TEXT PRIMARY KEY, received_on TEXT, sender_domain TEXT, class TEXT, body_name TEXT, subject TEXT, needs_owner INTEGER DEFAULT 0, hubspot_task_id TEXT);
CREATE TABLE IF NOT EXISTS evidence_items (id INTEGER PRIMARY KEY, title TEXT, type TEXT, parcel TEXT, source_ref TEXT, second_source TEXT, validated INTEGER DEFAULT 0, file_url TEXT);
CREATE TABLE IF NOT EXISTS claims (id INTEGER PRIMARY KEY, text TEXT, status TEXT, evidence_id INTEGER, dartboard_url TEXT);
CREATE TABLE IF NOT EXISTS drafts (id INTEGER PRIMARY KEY, correspondence_id TEXT, version TEXT, hubspot_task_id TEXT, reviews INTEGER DEFAULT 0, state TEXT);
CREATE TABLE IF NOT EXISTS page_sync (page TEXT, evidence_id INTEGER, last_checked TEXT, in_sync INTEGER);
