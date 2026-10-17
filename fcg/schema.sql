-- FCG D1 schema — WP-shaped content model (not PHP WordPress)
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL DEFAULT '',
  excerpt TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('publish','draft','private')),
  post_type TEXT NOT NULL DEFAULT 'post' CHECK (post_type IN ('post','page')),
  author TEXT NOT NULL DEFAULT 'system',
  date_gmt TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  modified_gmt TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  meta_json TEXT NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_posts_type_status ON posts(post_type, status);
CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug);

-- Seed example page (Mandate stub)
INSERT OR IGNORE INTO posts (id, title, slug, content, excerpt, status, post_type, author)
VALUES (
  1,
  'Project Mandate',
  'mandate',
  '<p>Great House Farm / Tŷ Mawr — Evidence Recovery. Seed content for FCG edge CMS.</p>',
  'Evidence recovery mandate (seed).',
  'publish',
  'page',
  'system'
);
