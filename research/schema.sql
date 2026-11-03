-- Research mirror schema: WordPress-shaped records, not PHP WordPress.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS content_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_type TEXT NOT NULL CHECK (source_type IN ('page','post','media')),
  source_id INTEGER NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  slug TEXT NOT NULL DEFAULT '',
  path TEXT NOT NULL UNIQUE,
  content_html TEXT NOT NULL DEFAULT '',
  excerpt_html TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'publish',
  source_link TEXT NOT NULL DEFAULT '',
  source_url TEXT NOT NULL DEFAULT '',
  mime_type TEXT NOT NULL DEFAULT '',
  media_type TEXT NOT NULL DEFAULT '',
  alt_text TEXT NOT NULL DEFAULT '',
  caption_html TEXT NOT NULL DEFAULT '',
  parent_source_id INTEGER NOT NULL DEFAULT 0,
  menu_order INTEGER NOT NULL DEFAULT 0,
  date_gmt TEXT NOT NULL DEFAULT '',
  modified_gmt TEXT NOT NULL DEFAULT '',
  meta_json TEXT NOT NULL DEFAULT '{}',
  UNIQUE(source_type, source_id)
);

CREATE INDEX IF NOT EXISTS idx_content_type_status ON content_items(source_type, status);
CREATE INDEX IF NOT EXISTS idx_content_slug ON content_items(slug);
CREATE INDEX IF NOT EXISTS idx_content_parent ON content_items(parent_source_id);
CREATE INDEX IF NOT EXISTS idx_content_modified ON content_items(modified_gmt);

-- Durable cursor for the scheduled, resumable public-source import.
CREATE TABLE IF NOT EXISTS migration_state (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
