const express = require('express');
const path = require('path');
const fs = require('fs');
const https = require('https');

const PORT = process.env.PORT || 3456;
const CONFIG_PATH = path.join(__dirname, 'command.config.json');
const APP_VERSION = 'command-v1.1.0.00';

// ── Config helpers ──

function loadConfig() {
  try { return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8')); }
  catch { return {}; }
}

function saveConfig(cfg) {
  try { fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2)); } catch {}
}

function getSettings() {
  const cfg = loadConfig();
  return {
    github_owner: cfg.github_owner || process.env.GITHUB_OWNER || 'unclehowell',
    github_repo: cfg.github_repo || process.env.GITHUB_REPO || 'datro',
    parent_proxy_url: cfg.parent_proxy_url || process.env.PARENT_PROXY_URL || 'https://www.financecheque.uk',
    cf_worker_url: cfg.cf_worker_url || process.env.CF_WORKER_URL || 'https://datro-flywheel.righteous.workers.dev',
    branch_ref: cfg.branch_ref || process.env.BRANCH_REF || 'command',
    oauth_configured: !!process.env.GITHUB_OAUTH_CLIENT_ID,
  };
}

function getGhToken(req) {
  const auth = req.headers['authorization'] || '';
  if (auth.startsWith('Bearer ')) {
    const t = auth.slice(7);
    const cfg = loadConfig();
    if (cfg.oauth_tokens && cfg.oauth_tokens[t]) return cfg.oauth_tokens[t];
  }
  return process.env.GITHUB_TOKEN || '';
}

// ── GitHub API helpers ──

const GITHUB_API = 'https://api.github.com';

function ghHeaders(token) {
  return {
    'Authorization': 'Bearer ' + token,
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'command-dashboard-local',
  };
}

function ghGet(path, token) {
  return new Promise((resolve, reject) => {
    https.get(GITHUB_API + path, { headers: ghHeaders(token) }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        if (res.statusCode >= 400) reject(new Error('GitHub ' + res.statusCode + ': ' + data.slice(0, 200)));
        else resolve(JSON.parse(data));
      });
    }).on('error', reject);
  });
}

function ghFetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const opts = {
      hostname: u.hostname, path: u.pathname + u.search, method: options.method || 'GET',
      headers: options.headers || {},
    };
    const req = https.request(opts, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ ok: res.statusCode < 400, status: res.statusCode, json: () => JSON.parse(data), text: () => data }));
    });
    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

async function ghPut(path, body, token) {
  const resp = await ghFetch(GITHUB_API + path, {
    method: 'PUT',
    headers: { ...ghHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!resp.ok) { const t = await resp.text(); throw new Error('GitHub ' + resp.status + ': ' + t.slice(0, 200)); }
  return resp.json();
}

// ── Config helpers ──

function sideSuffix(side, fn) {
  if (!side || fn === 'master-record.md') return fn;
  return fn.replace('.md', '') + '.' + side + '.md';
}

const MD_FILES = ['AGENT.md', 'README.md', 'CHANGELOG.md', 'MEMORY.md', 'SKILLS.md', 'HEARTBEAT.md', 'SOUL.md', 'MASTERPLAN.md', 'RULES.md', 'TEMPLATE.md', 'CONTEXT.md', 'GLOSSARY.md', 'RESOURCES.md', 'TASKS.md', 'IDENTITY.md', 'SPEC.md'];

function rfp(branch, side, fname) {
  if (fname === 'master-record.md') return { path: 'static/' + branch + '.md', gh: 'static/' + encodeURIComponent(branch) + '.md' };
  const s = sideSuffix(side, fname);
  return { path: 'static/' + branch + '/' + s, gh: 'static/' + encodeURIComponent(branch) + '/' + encodeURIComponent(s) };
}

// ── Token helper (for local, simpler) ──

function genToken() {
  const cfg = loadConfig();
  if (!cfg.tokens) cfg.tokens = {};
  const token = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
  cfg.tokens[token] = Date.now() + 86400000;
  saveConfig(cfg);
  return token;
}

function validateToken(token) {
  if (!token) return false;
  const cfg = loadConfig();
  if (!cfg.tokens || !cfg.tokens[token]) return false;
  if (cfg.tokens[token] < Date.now()) { delete cfg.tokens[token]; saveConfig(cfg); return false; }
  return true;
}

// ── Express app ──

const app = express();
app.use(express.json({ limit: '10mb' }));

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// ── API Routes ──

// GET /api/status
app.get('/api/status', (req, res) => {
  res.json({ status: 'ok', version: APP_VERSION, timestamp: new Date().toISOString(), runtime: 'local' });
});

// GET /api/version
app.get('/api/version', (req, res) => {
  res.json({ version: APP_VERSION });
});

// POST /api/login
app.post('/api/login', (req, res) => {
  const pass = req.body?.passphrase || '';
  if (pass === (process.env.LOGIN_PASSPHRASE || 'Burgerking')) {
    return res.json({ token: genToken(), success: true });
  }
  res.status(401).json({ error: 'Invalid passphrase', success: false });
});

// GET /api/auth/github/url
app.get('/api/auth/github/url', (req, res) => {
  const clientId = process.env.GITHUB_OAUTH_CLIENT_ID;
  if (!clientId) return res.json({ error: 'GitHub OAuth not configured', url: null });
  const redirectUri = req.protocol + '://' + req.get('host') + '/api/auth/github/callback';
  const state = Math.random().toString(36).slice(2);
  res.json({ url: 'https://github.com/login/oauth/authorize?client_id=' + clientId + '&redirect_uri=' + encodeURIComponent(redirectUri) + '&scope=repo&state=' + state, state });
});

// GET /api/auth/github/callback
app.get('/api/auth/github/callback', async (req, res) => {
  const code = req.query.code;
  const clientId = process.env.GITHUB_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GITHUB_OAUTH_CLIENT_SECRET;
  if (!code || !clientId || !clientSecret) return res.status(400).json({ error: 'OAuth params missing' });

  try {
    const tokResp = await ghFetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }),
    });
    if (!tokResp.ok) return res.status(400).json({ error: 'Token exchange failed' });
    const tokData = await tokResp.json();
    if (!tokData.access_token) return res.status(400).json({ error: 'No access token' });

    const localToken = genToken();
    const cfg = loadConfig();
    if (!cfg.oauth_tokens) cfg.oauth_tokens = {};
    cfg.oauth_tokens[localToken] = tokData.access_token;
    saveConfig(cfg);

    const returnTo = req.query.return_to || '/';
    res.redirect(returnTo + (returnTo.includes('?') ? '&' : '?') + 'token=' + localToken);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Auth middleware for /api/*
app.all('/api/*', (req, res, next) => {
  if (['/api/status', '/api/version', '/api/login', '/api/auth/github/url', '/api/auth/github/callback', '/api/settings'].some(p => req.path === p && req.method === 'GET' || req.path === '/api/login' && req.method === 'POST')) return next();
  const auth = req.headers['authorization'] || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : req.query.token || '';
  if (!validateToken(token)) return res.status(401).json({ error: 'Unauthorized' });
  req.ghToken = getGhToken(req);
  next();
});

// GET /api/settings
app.get('/api/settings', (req, res) => {
  res.json(getSettings());
});

// POST /api/settings
app.post('/api/settings', (req, res) => {
  const current = loadConfig();
  const allowed = ['github_owner', 'github_repo', 'parent_proxy_url', 'cf_worker_url', 'branch_ref'];
  for (const k of allowed) if (req.body[k] !== undefined) current[k] = req.body[k];
  saveConfig(current);
  res.json({ success: true });
});

// GET /api/config
app.get('/api/config', (req, res) => {
  const cfg = loadConfig();
  res.json(cfg.dashboard_config || { bias: 0, risk: 0, gear: 3, released: [], toggle_exceptions: {} });
});

// POST /api/config
app.post('/api/config', (req, res) => {
  const cfg = loadConfig();
  cfg.dashboard_config = { ...(cfg.dashboard_config || {}), ...(req.body || {}) };
  saveConfig(cfg);
  res.json(cfg.dashboard_config);
});

// GET /api/fuel
app.get('/api/fuel', (req, res) => {
  res.json({ api: 80, llm: 65, cli: 90, ide: 40 });
});

// GET /api/branches
app.get('/api/branches', async (req, res) => {
  const s = getSettings();
  let contents;
  try { contents = await ghGet('/repos/' + s.github_owner + '/' + s.github_repo + '/contents/static?ref=' + encodeURIComponent(s.branch_ref), req.ghToken); }
  catch { return res.json([]); }
  const branchDirs = contents.filter(f => f.type === 'dir').map(f => f.name);
  const result = [];
  for (const name of branchDirs) {
    const highFiles = [], leftFiles = [], rightFiles = [], lowFiles = [];
    try {
      const dir = await ghGet('/repos/' + s.github_owner + '/' + s.github_repo + '/contents/static/' + encodeURIComponent(name) + '?ref=' + encodeURIComponent(s.branch_ref), req.ghToken);
      const names = dir.map(f => f.name);
      for (const mdFile of MD_FILES) {
        const addF = (side, arr) => { const sn = sideSuffix(side, mdFile); arr.push({ name: mdFile, label: mdFile.replace('.md', ''), exists: names.includes(sn), side }); };
        addF('high', highFiles); addF('left', leftFiles); addF('right', rightFiles); addF('low', lowFiles);
      }
    } catch {
      for (const mdFile of MD_FILES) {
        ['high','left','right','low'].forEach(side => {
          const arr = side === 'high' ? highFiles : side === 'left' ? leftFiles : side === 'right' ? rightFiles : lowFiles;
          arr.push({ name: mdFile, label: mdFile.replace('.md', ''), exists: false, side });
        });
      }
    }
    result.push({ name, highFiles, leftFiles, rightFiles, lowFiles });
  }
  res.json(result);
});

// GET|POST /api/branches/:branch/files/:side/:filename
const fileRe = /^\/api\/branches\/([a-zA-Z0-9_-]+)\/files\/(high|left|right|low)\/(.+)$/;
app.all(fileRe, async (req, res) => {
  const s = getSettings();
  const branch = req.params[0] || req.params.branch;
  const side = req.params[1] || req.params.side;
  const fname = req.params[2] || req.params.filename;
  const fi = rfp(branch, side, fname);

  if (req.method === 'GET') {
    try {
      const data = await ghGet('/repos/' + s.github_owner + '/' + s.github_repo + '/contents/' + fi.gh + '?ref=' + encodeURIComponent(s.branch_ref), req.ghToken);
      return res.json({ content: Buffer.from(data.content.replace(/\n/g, ''), 'base64').toString('utf-8'), side, exists: true });
    } catch { return res.json({ content: '', side, exists: false }); }
  }

  if (req.method === 'POST') {
    const content = req.body?.content || '';
    try {
      let sha = null;
      try { const e = await ghGet('/repos/' + s.github_owner + '/' + s.github_repo + '/contents/' + fi.gh + '?ref=' + encodeURIComponent(s.branch_ref), req.ghToken); sha = e.sha; } catch {}
      await ghPut('/repos/' + s.github_owner + '/' + s.github_repo + '/contents/' + fi.gh, {
        message: 'docs(' + branch + '): update ' + side + '/' + fname.replace('.md','').toLowerCase(),
        content: Buffer.from(content).toString('base64'), sha: sha || undefined, branch: s.branch_ref,
      }, req.ghToken);
      return res.json({ success: true, side, savedAt: fi.path });
    } catch (err) { return res.status(500).json({ error: err.message }); }
  }
});

// GET /api/memory/:branch
app.get(/^\/api\/memory\/([a-zA-Z0-9_-]+)$/, async (req, res) => {
  const s = getSettings();
  const branch = req.params[0];
  for (const f of ['MEMORY.md', 'MEMORY.left.md']) {
    try {
      const data = await ghGet('/repos/' + s.github_owner + '/' + s.github_repo + '/contents/static/' + encodeURIComponent(branch) + '/' + encodeURIComponent(f) + '?ref=' + encodeURIComponent(s.branch_ref), req.ghToken);
      return res.json({ content: Buffer.from(data.content.replace(/\n/g, ''), 'base64').toString('utf-8') });
    } catch {}
  }
  res.json({ content: 'No MEMORY.md found' });
});

// POST /api/chat
app.post('/api/chat', async (req, res) => {
  const message = req.body?.message || '';
  if (!message) return res.status(400).json({ response: 'No message', success: false });
  const s = getSettings();
  try {
    const resp = await ghFetch(s.parent_proxy_url + '/api/proxy?action=chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ system: req.body?.system || 'You are the command intercom. Respond concisely.', message }),
    });
    const d = await resp.json();
    res.json({ response: d.reply || d.response || 'No response', success: true, routing: [{ node: 'parent proxy', status: 'ok' }] });
  } catch (err) {
    res.json({ response: 'Proxy unavailable.', success: false, routing: [{ node: 'parent proxy', status: 'error', detail: err.message }] });
  }
});

// GET /api/mcp
app.get('/api/mcp', async (req, res) => {
  const target = req.query.url || 'https://datro.directory';
  const s = getSettings();
  try {
    const resp = await ghFetch(s.cf_worker_url + '/__mcp?url=' + encodeURIComponent(target));
    res.json(await resp.json());
  } catch (err) { res.status(502).json({ error: err.message }); }
});

// GET /api/rereleases
app.get('/api/rereleases', async (req, res) => {
  const s = getSettings();
  try {
    const releases = await ghGet('/repos/' + s.github_owner + '/' + s.github_repo + '/releases?per_page=10', req.ghToken);
    const rereleases = (Array.isArray(releases) ? releases : []).map(r => ({ branch: (r.tag_name || '').split('-v')[0], tag: r.tag_name, name: r.name, published: r.published_at }));
    res.json({ rereleases, count: rereleases.length });
  } catch { res.json({ rereleases: [], count: 0 }); }
});

// POST /api/flywheel/trigger
app.post('/api/flywheel/trigger', async (req, res) => {
  const s = getSettings();
  try {
    const resp = await ghFetch(s.cf_worker_url + '/__cron', { method: 'POST' });
    const text = await resp.text();
    res.json({ success: resp.ok, output: text.slice(0, 500) });
  } catch (err) { res.status(502).json({ error: err.message, success: false }); }
});

// GET /api/flywheel/status
app.get('/api/flywheel/status', async (req, res) => {
  const s = getSettings();
  try {
    const resp = await ghFetch(s.cf_worker_url + '/__status');
    res.json(await resp.json());
  } catch { res.json({ status: 'unreachable' }); }
});

// POST /api/machine/register
app.post('/api/machine/register', (req, res) => {
  const { machine_id, api_keys, ide, cli_tools } = req.body || {};
  if (!machine_id || !api_keys) return res.status(400).json({ error: 'machine_id and api_keys required' });
  const cfg = loadConfig();
  if (!cfg.machines) cfg.machines = {};
  cfg.machines[machine_id] = { api_keys, ide: ide || null, cli_tools: cli_tools || [], registered_at: Date.now(), last_seen: Date.now() };
  saveConfig(cfg);
  res.json({ success: true, machine_id, message: 'Keys registered as fallback.' });
});

// GET /api/local/profiles
app.get('/api/local/profiles', (req, res) => {
  res.json({ profiles: [] });
});

// AWS endpoints (gone)
app.all('/api/aws/*', (req, res) => res.status(410).json({ error: 'AWS decommissioned.', success: false }));
app.post('/api/trigger/ota', (req, res) => res.status(410).json({ error: 'AWS decommissioned.', success: false }));
app.post('/api/trigger/meta', (req, res) => res.status(410).json({ error: 'AWS decommissioned.', success: false }));

// SPA fallback
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'Not found' });
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('command dashboard running on http://127.0.0.1:' + PORT);
});