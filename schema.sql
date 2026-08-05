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

-- Wallets (Tatum-style per-session wallets)
CREATE TABLE IF NOT EXISTS wallets (
  wallet_id TEXT PRIMARY KEY,
  balance INTEGER DEFAULT 0,
  credited INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Node wallets (per child-proxy earnings)
CREATE TABLE IF NOT EXISTS node_wallets (
  wallet_id TEXT PRIMARY KEY,
  machine_id TEXT NOT NULL UNIQUE,
  balance INTEGER NOT NULL DEFAULT 0,
  total_earned INTEGER NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Orders (buyer lead orders with escrow)
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  target_url TEXT NOT NULL,
  budget_credits INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  lead_value INTEGER NOT NULL,
  status TEXT DEFAULT 'escrowed',
  escrow_balance INTEGER NOT NULL DEFAULT 0,
  escrow_remaining INTEGER NOT NULL DEFAULT 0,
  accepted_node_id TEXT DEFAULT '',
  leads_paid INTEGER NOT NULL DEFAULT 0,
  lead_quota INTEGER NOT NULL DEFAULT 0,
  expires_at TEXT DEFAULT '',
  campaign_prompt TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Leads (attributed results from swarm campaigns)
CREATE TABLE IF NOT EXISTS leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  machine_id TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  source TEXT DEFAULT '',
  value INTEGER NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (order_id) REFERENCES orders(id)
);

-- Disbursements (wallet payout ledger per node)
CREATE TABLE IF NOT EXISTS disbursements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  wallet_id TEXT NOT NULL,
  order_id INTEGER NOT NULL,
  amount INTEGER NOT NULL,
  reason TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (wallet_id) REFERENCES node_wallets(wallet_id),
  FOREIGN KEY (order_id) REFERENCES orders(id)
);

-- Double-entry ledger: append-only balance changes with UNIQUE idempotency keys
CREATE TABLE IF NOT EXISTS ledger (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source TEXT NOT NULL,
  source_id INTEGER NOT NULL,
  wallet_id TEXT NOT NULL,
  order_id INTEGER DEFAULT 0,
  delta INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  reason TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE (source, source_id)
);

-- OAuth tokens (connected platforms)
CREATE TABLE IF NOT EXISTS oauth_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  machine_id TEXT NOT NULL,
  platform TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  expires_at TEXT DEFAULT '',
  scope TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE (machine_id, platform)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_leads_order_id ON leads(order_id);
CREATE INDEX IF NOT EXISTS idx_node_wallets_machine ON node_wallets(machine_id);
CREATE INDEX IF NOT EXISTS idx_oauth_machine ON oauth_tokens(machine_id);
