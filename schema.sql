-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  wallet_balance INTEGER DEFAULT 1000,
  seller_balance INTEGER DEFAULT 500,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Password reset tokens
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at DATETIME NOT NULL,
  used INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Sessions
CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Jobs (lead campaigns)
CREATE TABLE IF NOT EXISTS jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  url TEXT NOT NULL,
  lead_amount INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  credit_cost INTEGER NOT NULL,
  status TEXT DEFAULT 'queued',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Child proxies (AWS machines)
CREATE TABLE IF NOT EXISTS child_proxies (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  load INTEGER DEFAULT 0,
  last_seen DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Proxy nodes (child proxies registered with parent)
CREATE TABLE IF NOT EXISTS proxy_nodes (
  machine_id TEXT PRIMARY KEY,
  machine_name TEXT NOT NULL DEFAULT '',
  ip_address TEXT NOT NULL DEFAULT '',
  proxy_port INTEGER DEFAULT 6000,
  version TEXT DEFAULT '',
  last_seen TEXT DEFAULT (datetime('now')),
  registered_at TEXT DEFAULT (datetime('now'))
);

-- Proxy call logs (health page)
CREATE TABLE IF NOT EXISTS proxy_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  origin_machine_id TEXT DEFAULT '',
  endpoint TEXT NOT NULL DEFAULT '',
  model TEXT DEFAULT '',
  response_status INTEGER DEFAULT 0,
  routing_decision TEXT DEFAULT 'direct',
  created_at TEXT DEFAULT (datetime('now'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON jobs(user_id);
