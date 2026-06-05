const APP_VERSION = 'command-v1.1.0.00';
const GITHUB_API = 'https://api.github.com';
const MD_FILES = ['AGENT.md', 'README.md', 'CHANGELOG.md', 'MEMORY.md', 'SKILLS.md', 'HEARTBEAT.md', 'SOUL.md', 'MASTERPLAN.md', 'RULES.md', 'TEMPLATE.md', 'CONTEXT.md', 'GLOSSARY.md', 'RESOURCES.md', 'TASKS.md', 'IDENTITY.md', 'SPEC.md'];
const SIDES = ['high', 'left', 'right', 'low'];

function sfx(side, fn) {
  if (!side || fn === 'master-record.md') return fn;
  return fn.replace('.md', '') + '.' + side + '.md';
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
}

function cors() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

async function getSettings(kv, env) {
  const raw = await kv.get('command:settings');
  if (raw) return JSON.parse(raw);
  return {
    github_owner: env.GITHUB_OWNER || 'unclehowell',
    github_repo: env.GITHUB_REPO || 'datro',
    parent_proxy_url: env.PARENT_PROXY_URL || 'https://www.financecheque.uk',
    cf_worker_url: env.CF_WORKER_URL || 'https://datro-flywheel.righteous.workers.dev',
    branch_ref: env.BRANCH_REF || 'command',
  };
}

async function saveSettings(kv, settings) {
  await kv.put('command:settings', JSON.stringify(settings));
}

function getGhToken(request, env) {
  const auth = request.headers.get('Authorization') || '';
  if (auth.startsWith('Bearer ')) return auth.slice(7);
  return env.GITHUB_TOKEN || '';
}

function ghHeaders(token) {
  return {
    'Authorization': 'Bearer ' + token,
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'command-dashboard-cf',
  };
}

async function ghGet(path, token) {
  const resp = await fetch(GITHUB_API + path, { headers: ghHeaders(token) });
  if (!resp.ok) { const t = await resp.text(); throw new Error('GitHub ' + resp.status + ': ' + t.slice(0, 200)); }
  return resp.json();
}

async function ghPut(path, body, token) {
  const resp = await fetch(GITHUB_API + path, {
    method: 'PUT',
    headers: { ...ghHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!resp.ok) { const t = await resp.text(); throw new Error('GitHub ' + resp.status + ': ' + t.slice(0, 200)); }
  return resp.json();
}

async function genToken(secret, kv) {
  const p = JSON.stringify({ t: Date.now() + 86400000, s: secret.slice(0, 8) });
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(p));
  const hmac = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 12);
  const t = btoa(p) + '.' + hmac;
  await kv.put('token:' + t, '1', { expirationTtl: 86400 });
  return t;
}

async function validateToken(token, secret, kv) {
  if (!token) return false;
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return false;
    const p = JSON.parse(atob(parts[0]));
    if (p.t < Date.now()) return false;
    const stored = await kv.get('token:' + token);
    if (!stored) return false;
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const sig = await crypto.subtle.sign('HMAC', key, enc.encode(p));
    const expected = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 12);
    return expected === parts[1];
  } catch { return false; }
}

function rfp(branch, side, fname) {
  if (fname === 'master-record.md') return { path: 'static/' + branch + '.md', gh: 'static/' + encodeURIComponent(branch) + '.md' };
  const s = sfx(side, fname);
  return { path: 'static/' + branch + '/' + s, gh: 'static/' + encodeURIComponent(branch) + '/' + encodeURIComponent(s) };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;
    const secret = env.TOKEN_SECRET || 'fallback-secret';
    const kv = env.COMMAND_DASHBOARD;

    let body = null;
    if (method === 'POST' || method === 'PUT') { try { body = await request.json(); } catch {} }

    if (method === 'OPTIONS') return new Response(null, { headers: cors() });

    try {
      // ── Public endpoints (no auth required) ──

      // GET /api/status
      if (path === '/api/status' && method === 'GET') {
        return json({ status: 'ok', version: APP_VERSION, timestamp: new Date().toISOString() });
      }

      // GET /api/version
      if (path === '/api/version' && method === 'GET') {
        return json({ version: APP_VERSION });
      }

      // POST /api/login (passphrase fallback)
      if (path === '/api/login' && method === 'POST') {
        const pass = body?.passphrase || '';
        if (pass === (env.LOGIN_PASSPHRASE || 'Burgerking')) {
          const t = await genToken(secret, kv);
          return json({ token: t, success: true });
        }
        return json({ error: 'Invalid passphrase', success: false }, 401);
      }

      // GET /api/auth/github/url
      if (path === '/api/auth/github/url' && method === 'GET') {
        const clientId = env.GITHUB_OAUTH_CLIENT_ID;
        if (!clientId) return json({ error: 'GitHub OAuth not configured', url: null });
        const redirectUri = url.origin + '/api/auth/github/callback';
        const state = Math.random().toString(36).slice(2);
        const ghUrl = 'https://github.com/login/oauth/authorize?client_id=' + clientId + '&redirect_uri=' + encodeURIComponent(redirectUri) + '&scope=repo&state=' + state;
        return json({ url: ghUrl, state });
      }

      // GET /api/auth/github/callback
      if (path === '/api/auth/github/callback' && method === 'GET') {
        const code = url.searchParams.get('code');
        const clientId = env.GITHUB_OAUTH_CLIENT_ID;
        const clientSecret = env.GITHUB_OAUTH_CLIENT_SECRET;
        if (!code || !clientId || !clientSecret) return json({ error: 'OAuth params missing' }, 400);
        const tokResp = await fetch('https://github.com/login/oauth/access_token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }),
        });
        const tokData = await tokResp.json();
        const ghToken = tokData.access_token;
        if (!ghToken) return json({ error: 'Failed to get token: ' + JSON.stringify(tokData) }, 400);
        const storedToken = await genToken(secret, kv);
        await kv.put('oauth:gh_token:' + storedToken, ghToken, { expirationTtl: 86400 });
        const returnTo = url.searchParams.get('return_to') || url.origin + '/';
        return Response.redirect(returnTo + (returnTo.includes('?') ? '&' : '?') + 'token=' + storedToken, 302);
      }

      // GET /api/auth/github/token
      if (path === '/api/auth/github/token' && method === 'GET') {
        return json({ message: 'Use the OAuth flow to authenticate.' });
      }

      // GET /api/settings
      if (path === '/api/settings' && method === 'GET') {
        const s = await getSettings(kv, env);
        return json({ ...s, oauth_configured: !!env.GITHUB_OAUTH_CLIENT_ID });
      }

      // ── Auth required from here ──
      if (path.startsWith('/api/')) {
        const auth = request.headers.get('Authorization') || '';
        const token = auth.startsWith('Bearer ') ? auth.slice(7) : url.searchParams.get('token') || '';
        const valid = await validateToken(token, secret, kv);
        if (!valid) return json({ error: 'Unauthorized' }, 401);
        // Resolve GitHub token: OAuth token or env var
        var ghToken = await kv.get('oauth:gh_token:' + token) || env.GITHUB_TOKEN || '';
      }

      // POST /api/settings
      if (path === '/api/settings' && method === 'POST') {
        const current = await getSettings(kv, env);
        const updated = { ...current, ...(body || {}) };
        // Only allow whitelisted keys
        const allowed = ['github_owner', 'github_repo', 'parent_proxy_url', 'cf_worker_url', 'branch_ref'];
        const filtered = {};
        for (const k of allowed) if (updated[k] !== undefined) filtered[k] = updated[k];
        await saveSettings(kv, { ...current, ...filtered });
        return json(filtered);
      }

      // GET /api/config
      if (path === '/api/config' && method === 'GET') {
        const stored = await kv.get('command:config');
        return json(stored ? JSON.parse(stored) : { bias: 0, risk: 0, gear: 3, released: [], toggle_exceptions: {} });
      }

      // POST /api/config
      if (path === '/api/config' && method === 'POST') {
        const stored = await kv.get('command:config');
        const current = stored ? JSON.parse(stored) : {};
        const updated = { ...current, ...(body || {}) };
        await kv.put('command:config', JSON.stringify(updated));
        return json(updated);
      }

      // GET /api/fuel
      if (path === '/api/fuel' && method === 'GET') {
        return json({ api: 80, llm: 65, cli: 90, ide: 40 });
      }

      // GET /api/branches
      if (path === '/api/branches' && method === 'GET') {
        const s = await getSettings(kv, env);
        const cacheKey = 'branches:' + s.github_owner + '/' + s.github_repo + '@' + s.branch_ref;
        let cached = await kv.get(cacheKey);
        if (cached) return json(JSON.parse(cached));

        let contents;
        try {
          contents = await ghGet('/repos/' + s.github_owner + '/' + s.github_repo + '/contents/static?ref=' + encodeURIComponent(s.branch_ref), ghToken);
        } catch { return json([]); }
        const branchDirs = contents.filter(f => f.type === 'dir').map(f => f.name);
        const result = [];
        for (const name of branchDirs) {
          const leftFiles = [], rightFiles = [], highFiles = [], lowFiles = [];
          try {
            const dir = await ghGet('/repos/' + s.github_owner + '/' + s.github_repo + '/contents/static/' + encodeURIComponent(name) + '?ref=' + encodeURIComponent(s.branch_ref), ghToken);
            const names = dir.map(f => f.name);
            for (const mdFile of MD_FILES) {
              const addF = (side, arr) => {
                const sn = sfx(side, mdFile);
                arr.push({ name: mdFile, label: mdFile.replace('.md', ''), exists: names.includes(sn), side });
              };
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
        await kv.put(cacheKey, JSON.stringify(result), { expirationTtl: 120 });
        return json(result);
      }

      // GET|POST /api/branches/:branch/files/:side/:filename
      const fm = path.match(/^\/api\/branches\/([a-zA-Z0-9_-]+)\/files\/(high|left|right|low)\/(.+)$/);
      if (fm) {
        const s = await getSettings(kv, env);
        const [, branch, side, fname] = fm;
        const fi = rfp(branch, side, fname);
        if (method === 'GET') {
          try {
            const data = await ghGet('/repos/' + s.github_owner + '/' + s.github_repo + '/contents/' + fi.gh + '?ref=' + encodeURIComponent(s.branch_ref), ghToken);
            return json({ content: atob(data.content.replace(/\n/g, '')), side, exists: true });
          } catch { return json({ content: '', side, exists: false }); }
        }
        if (method === 'POST') {
          const content = body?.content || '';
          try {
            let sha = null;
            try { const e = await ghGet('/repos/' + s.github_owner + '/' + s.github_repo + '/contents/' + fi.gh + '?ref=' + encodeURIComponent(s.branch_ref), ghToken); sha = e.sha; } catch {}
            await ghPut('/repos/' + s.github_owner + '/' + s.github_repo + '/contents/' + fi.gh, {
              message: 'docs(' + branch + '): update ' + side + '/' + fname.replace('.md','').toLowerCase(),
              content: btoa(content), sha: sha || undefined, branch: s.branch_ref,
            }, ghToken);
            await kv.delete('branches:' + s.github_owner + '/' + s.github_repo + '@' + s.branch_ref);
            return json({ success: true, side, savedAt: fi.path });
          } catch (err) { return json({ error: err.message }, 500); }
        }
      }

      // GET /api/memory/:branch
      const mm = path.match(/^\/api\/memory\/([a-zA-Z0-9_-]+)$/);
      if (mm && method === 'GET') {
        const s = await getSettings(kv, env);
        const branch = mm[1];
        for (const f of ['MEMORY.md', 'MEMORY.left.md']) {
          try {
            const data = await ghGet('/repos/' + s.github_owner + '/' + s.github_repo + '/contents/static/' + encodeURIComponent(branch) + '/' + encodeURIComponent(f) + '?ref=' + encodeURIComponent(s.branch_ref), ghToken);
            return json({ content: atob(data.content.replace(/\n/g, '')) });
          } catch {}
        }
        return json({ content: 'No MEMORY.md found' });
      }

      // POST /api/chat
      if (path === '/api/chat' && method === 'POST') {
        const message = body?.message || '';
        if (!message) return json({ response: 'No message', success: false }, 400);
        const s = await getSettings(kv, env);
        const proxyUrl = s.parent_proxy_url;
        const routing = [{ node: 'command dashboard', status: 'ok' }];
        try {
          const resp = await fetch(proxyUrl + '/api/proxy?action=chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ system: body?.system || 'You are the command intercom. Respond concisely.', message }),
          });
          const d = await resp.json();
          routing.push({ node: 'parent proxy (' + proxyUrl + ')', status: 'ok', detail: d._proxy?.routing || 'direct_llm' });
          return json({ response: d.reply || d.response || 'No response', success: true, routing });
        } catch (err) {
          routing.push({ node: 'parent proxy (' + proxyUrl + ')', status: 'error', detail: err.message });
          return json({ response: 'Proxy unavailable.', success: false, routing });
        }
      }

      // GET /api/mcp
      if (path === '/api/mcp' && method === 'GET') {
        const target = url.searchParams.get('url') || 'https://datro.directory';
        const s = await getSettings(kv, env);
        try {
          const resp = await fetch(s.cf_worker_url + '/__mcp?url=' + encodeURIComponent(target));
          return json(await resp.json());
        } catch (err) { return json({ error: err.message }, 502); }
      }

      // GET /api/rereleases
      if (path === '/api/rereleases' && method === 'GET') {
        const s = await getSettings(kv, env);
        let lastCheck = await kv.get('rerelease:lastCheck');
        const lastTime = lastCheck ? parseInt(lastCheck, 10) : 0;
        try {
          const releases = await ghGet('/repos/' + s.github_owner + '/' + s.github_repo + '/releases?per_page=10', ghToken);
          const rereleases = [];
          if (Array.isArray(releases)) {
            for (const r of releases) {
              if (new Date(r.published_at).getTime() > lastTime) {
                rereleases.push({ branch: (r.tag_name || '').split('-v')[0], tag: r.tag_name, name: r.name, published: r.published_at });
              }
            }
          }
          await kv.put('rerelease:lastCheck', String(Date.now()));
          return json({ rereleases, count: rereleases.length });
        } catch { return json({ rereleases: [], count: 0 }); }
      }

      // POST /api/flywheel/trigger
      if (path === '/api/flywheel/trigger' && method === 'POST') {
        const s = await getSettings(kv, env);
        try {
          const resp = await fetch(s.cf_worker_url + '/__cron', { method: 'POST' });
          const text = await resp.text();
          return json({ success: resp.ok, output: text.slice(0, 500) });
        } catch (err) { return json({ error: err.message, success: false }, 502); }
      }

      // GET /api/flywheel/status
      if (path === '/api/flywheel/status' && method === 'GET') {
        const s = await getSettings(kv, env);
        try {
          const resp = await fetch(s.cf_worker_url + '/__status');
          return json(await resp.json());
        } catch { return json({ status: 'unreachable' }); }
      }

      // POST /api/machine/register
      if (path === '/api/machine/register' && method === 'POST') {
        const { machine_id, api_keys, ide, cli_tools } = body || {};
        if (!machine_id || !api_keys) return json({ error: 'machine_id and api_keys required' }, 400);
        await kv.put('machine:' + machine_id, JSON.stringify({ api_keys, ide: ide || null, cli_tools: cli_tools || [], registered_at: Date.now(), last_seen: Date.now() }), { expirationTtl: 86400 });
        const idx = await kv.get('machine:index');
        const machines = idx ? JSON.parse(idx) : [];
        if (!machines.includes(machine_id)) { machines.push(machine_id); await kv.put('machine:index', JSON.stringify(machines)); }
        return json({ success: true, machine_id, message: 'Keys registered as fallback.' });
      }

      // GET /api/local/profiles
      if (path === '/api/local/profiles' && method === 'GET') {
        return json({ profiles: [] });
      }

      // AWS endpoints (gone)
      if (path.startsWith('/api/aws/') || path === '/api/trigger/ota' || path === '/api/trigger/meta') {
        return json({ error: 'AWS decommissioned.', success: false }, 410);
      }

      // ── Serve static assets ──
      if (env.ASSETS) {
        return env.ASSETS.fetch(request);
      }

      // Fallback SPA routing
      if (path === '/' || !path.startsWith('/api/')) {
        const staticPaths = ['/index.html', '/app.js', '/style.css', '/racetrack.js'];
        for (const p of staticPaths) {
          if (path === p && env.ASSETS) return env.ASSETS.fetch(new Request(new URL(p, url.origin), request));
        }
        if (env.ASSETS) return env.ASSETS.fetch(new Request(new URL('/index.html', url.origin), request));
      }

      return json({ error: 'Not found', path }, 404);

    } catch (err) {
      return json({ error: err.message, stack: err.stack }, 500);
    }
  }
};