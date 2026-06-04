const APP_VERSION = 'command-v1.0.0.01';
const GITHUB_API = 'https://api.github.com';
const GITHUB_OWNER = 'unclehowell';
const GITHUB_REPO = 'datro';
const MD_FILES = ['AGENT.md', 'README.md', 'CHANGELOG.md', 'MEMORY.md', 'SKILLS.md', 'HEARTBEAT.md', 'SOUL.md', 'MASTERPLAN.md', 'RULES.md', 'TEMPLATE.md', 'CONTEXT.md', 'GLOSSARY.md', 'RESOURCES.md', 'TASKS.md', 'IDENTITY.md'];
const SIDES = ['left', 'right', 'high', 'low'];

function sideSuffix(side, filename) {
  if (!side || filename === 'master-record.md') return filename;
  const base = filename.replace('.md', '');
  return `${base}.${side}.md`;
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

// ── Auth ──

async function generateToken(secret, kv) {
  const payload = JSON.stringify({ t: Date.now() + 86400000, s: secret.slice(0, 8) });
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(payload));
  const hmac = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 12);
  const token = btoa(payload) + '.' + hmac;
  await kv.put('token:' + token, '1', { expirationTtl: 86400 });
  return token;
}

async function validateToken(token, secret, kv) {
  if (!token) return false;
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return false;
    const payload = atob(parts[0]);
    const parsed = JSON.parse(payload);
    if (parsed.t < Date.now()) return false;
    const stored = await kv.get('token:' + token);
    if (!stored) return false;
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const sig = await crypto.subtle.sign('HMAC', key, enc.encode(payload));
    const expected = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 12);
    return expected === parts[1];
  } catch {
    return false;
  }
}

// ── GitHub API helpers ──

function ghHeaders(env) {
  return {
    'Authorization': 'Bearer ' + (env.GITHUB_TOKEN || ''),
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'command-dashboard-cf',
  };
}

async function ghGet(path, env) {
  const resp = await fetch(`${GITHUB_API}${path}`, { headers: ghHeaders(env) });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`GitHub API error ${resp.status}: ${text.slice(0, 200)}`);
  }
  return resp.json();
}

async function ghPut(path, body, env) {
  const resp = await fetch(`${GITHUB_API}${path}`, {
    method: 'PUT',
    headers: { ...ghHeaders(env), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`GitHub API error ${resp.status}: ${text.slice(0, 200)}`);
  }
  return resp.json();
}

function resolveBranchFilePath(branch, side, filename) {
  if (filename === 'master-record.md') {
    return { path: `static/${branch}.md`, ghPath: `static/${encodeURIComponent(branch)}.md` };
  }
  const sfx = sideSuffix(side, filename);
  return { path: `static/${branch}/${sfx}`, ghPath: `static/${encodeURIComponent(branch)}/${encodeURIComponent(sfx)}` };
}

// ── Main handler ──

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;
    const secret = env.TOKEN_SECRET || 'fallback-secret';
    const kv = env.COMMAND_DASHBOARD;

    // Parse body
    let body = null;
    if (method === 'POST' || method === 'PUT') {
      try { body = await request.json(); } catch {}
    }

    // CORS preflight
    if (method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders() });
    }

    try {

      // ── POST /api/login ──
      if (path === '/api/login' && method === 'POST') {
        const passphrase = body?.passphrase || '';
        const validPassphrase = env.LOGIN_PASSPHRASE || 'Burgerking';
        if (passphrase === validPassphrase) {
          const jwt = await generateToken(secret, kv);
          return json({ token: jwt, success: true });
        }
        return json({ error: 'Invalid passphrase', success: false }, 401);
      }

      // ── GET /api/status ──
      if (path === '/api/status' && method === 'GET') {
        return json({ status: 'ok', version: APP_VERSION, timestamp: new Date().toISOString() });
      }

      // ── GET /api/version ──
      if (path === '/api/version' && method === 'GET') {
        return json({ version: APP_VERSION });
      }

      // ── Auth required from here down ──
      const auth = request.headers.get('Authorization') || '';
      const token = auth.startsWith('Bearer ') ? auth.slice(7) : url.searchParams.get('token') || '';
      const authValid = await validateToken(token, secret, kv);
      if (!authValid) {
        return json({ error: 'Unauthorized' }, 401);
      }

      // ── GET /api/fuel ──
      if (path === '/api/fuel' && method === 'GET') {
        return json({ api: 80, llm: 65, cli: 90, ide: 40 });
      }

      // ── GET /api/config ──
      if (path === '/api/config' && method === 'GET') {
        const stored = await kv.get('dashboard:config');
        return json(stored ? JSON.parse(stored) : { bias: 3, risk: 3, gear: 6, released: [] });
      }

      // ── POST /api/config ──
      if (path === '/api/config' && method === 'POST') {
        const stored = await kv.get('dashboard:config');
        const current = stored ? JSON.parse(stored) : {};
        const updated = { ...current, ...(body || {}) };
        await kv.put('dashboard:config', JSON.stringify(updated));
        return json(updated);
      }

      // ── GET /api/masters ──
      if (path === '/api/masters' && method === 'GET') {
        let list = await kv.get('dashboard:masters_list');
        if (!list) {
          const contents = await ghGet('/repos/' + GITHUB_OWNER + '/' + GITHUB_REPO + '/contents/static', env);
          list = JSON.stringify(
            contents.filter(f => f.name.endsWith('.md') && !f.name.includes('.')).map(f => f.name.replace('.md', ''))
          );
          await kv.put('dashboard:masters_list', list, { expirationTtl: 300 });
        }
        return json(JSON.parse(list));
      }

      // ── GET /api/masters/:branch ──
      if (path.match(/^\/api\/masters\/[a-zA-Z0-9_-]+$/) && method === 'GET') {
        const branch = path.split('/')[3];
        try {
          const data = await ghGet(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/static/${encodeURIComponent(branch)}.md`, env);
          return json({ content: atob(data.content.replace(/\n/g, '')) });
        } catch { return json({ content: '' }); }
      }

      // ── POST /api/masters/:branch ──
      if (path.match(/^\/api\/masters\/[a-zA-Z0-9_-]+$/) && method === 'POST') {
        const branch = path.split('/')[3];
        const content = body?.content || '';
        try {
          const sha = await kv.get('sha:static/' + branch + '.md');
          const result = await ghPut(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/static/${encodeURIComponent(branch)}.md`, {
            message: `docs(${branch}): update master-record via dashboard`,
            content: btoa(content),
            sha: sha || undefined,
            branch: 'command',
          }, env);
          if (result.content?.sha) await kv.put('sha:static/' + branch + '.md', result.content.sha);
          return json({ success: true });
        } catch (err) { return json({ error: err.message }, 500); }
      }

      // ── POST /api/push ──
      if (path === '/api/push' && method === 'POST') {
        return json({ output: 'KV-backed changes auto-sync on save. Use git push for batch updates.', success: true });
      }

      // ── POST /api/pull ──
      if (path === '/api/pull' && method === 'POST') {
        const keys = await kv.list({ prefix: 'sha:' });
        for (const k of keys.keys) await kv.delete(k.name);
        await kv.delete('dashboard:masters_list');
        await kv.delete('dashboard:branches_list');
        return json({ output: 'Cache cleared. Latest data fetched from GitHub on next read.', success: true });
      }

      // ── GET /api/branches ──
      if (path === '/api/branches' && method === 'GET') {
        let cached = await kv.get('dashboard:branches_list');
        if (cached) return json(JSON.parse(cached));

        const contents = await ghGet(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/static`, env);
        const branches = contents.filter(f => f.name.endsWith('.md') && !f.name.includes('.')).map(f => f.name.replace('.md', ''));
        const result = [];
        for (const name of branches) {
          const leftFiles = [], rightFiles = [], highFiles = [], lowFiles = [];
          try {
            const dir = await ghGet(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/static/${encodeURIComponent(name)}`, env);
            const dirNames = dir.map(f => f.name);
            for (const mdFile of MD_FILES) {
              const addFile = (side, arr) => {
                const sfx = sideSuffix(side, mdFile);
                arr.push({ name: mdFile, label: mdFile.replace('.md', ''), exists: dirNames.includes(sfx) });
              };
              addFile('left', leftFiles); addFile('right', rightFiles);
              addFile('high', highFiles); addFile('low', lowFiles);
            }
          } catch {
            for (const mdFile of MD_FILES) {
              ['left','right','high','low'].forEach(side => {
                const arr = side==='left'?leftFiles:side==='right'?rightFiles:side==='high'?highFiles:lowFiles;
                arr.push({ name: mdFile, label: mdFile.replace('.md', ''), exists: false });
              });
            }
          }
          result.push({ name, masterExists: true, leftFiles, rightFiles, highFiles, lowFiles });
        }
        await kv.put('dashboard:branches_list', JSON.stringify(result), { expirationTtl: 300 });
        return json(result);
      }

      // ── GET|POST /api/branches/:branch/files/:side/:filename ──
      const fileMatch = path.match(/^\/api\/branches\/([a-zA-Z0-9_-]+)\/files\/(left|right|high|low)\/(.+)$/);
      if (fileMatch) {
        const [, branch, side, filename] = fileMatch;
        const fileInfo = resolveBranchFilePath(branch, side, filename);

        if (method === 'GET') {
          try {
            const data = await ghGet(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${fileInfo.ghPath}`, env);
            const content = atob(data.content.replace(/\n/g, ''));
            await kv.put('sha:' + fileInfo.path, data.sha);
            return json({ content, side, exists: true });
          } catch { return json({ content: '', side, exists: false }); }
        }

        if (method === 'POST') {
          const content = body?.content || '';
          try {
            let sha = await kv.get('sha:' + fileInfo.path);
            if (!sha) {
              try { const existing = await ghGet(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${fileInfo.ghPath}`, env); sha = existing.sha; } catch {}
            }
            const result = await ghPut(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${fileInfo.ghPath}`, {
              message: `docs(${branch}): update ${side}/${filename.replace('.md','').toLowerCase()}`,
              content: btoa(content),
              sha: sha || undefined,
              branch: 'command',
            }, env);
            if (result.content?.sha) await kv.put('sha:' + fileInfo.path, result.content.sha);
            await kv.delete('dashboard:branches_list');
            return json({ success: true, side, savedAt: fileInfo.path });
          } catch (err) { return json({ error: err.message }, 500); }
        }
      }

      // ── GET /api/memory/:branch ──
      const memMatch = path.match(/^\/api\/memory\/([a-zA-Z0-9_-]+)$/);
      if (memMatch && method === 'GET') {
        const branch = memMatch[1];
        for (const f of ['MEMORY.md', 'MEMORY.left.md']) {
          try {
            const data = await ghGet(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/static/${encodeURIComponent(branch)}/${encodeURIComponent(f)}`, env);
            return json({ content: atob(data.content.replace(/\n/g, '')) });
          } catch {}
        }
        return json({ content: 'No MEMORY.md found' });
      }

      // ── POST /api/chat ──
      if (path === '/api/chat' && method === 'POST') {
        const message = body?.message || '';
        if (!message) return json({ response: 'No message provided', success: false }, 400);
        const parentProxy = env.PARENT_PROXY_URL || 'https://www.financecheque.uk';
        const routing = [{ node: 'dashboard (CF Worker)', status: 'ok' }];
        try {
          const proxyResp = await fetch(parentProxy + '/api/proxy?action=chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              system: 'You are the dashboard command intercom for the DATRO flywheel control system. Respond concisely (1-3 sentences).',
              message,
            }),
          });
          const proxyData = await proxyResp.json();
          const reply = proxyData.reply || proxyData.response || 'No response';
          const proxyInfo = proxyData._proxy || {};
          routing.push({ node: `parent proxy (${parentProxy})`, status: 'ok', detail: proxyInfo.routing || 'direct_llm' });
          if (proxyInfo.routing === 'child_proxy') routing.push({ node: 'child proxy machine', status: 'ok' });
          else if (proxyInfo.routing === 'direct_llm') routing.push({ node: 'CF environment LLM', status: 'ok' });
          return json({ response: reply, success: true, routing });
        } catch (err) {
          routing.push({ node: `parent proxy (${parentProxy})`, status: 'error', detail: err.message });
          return json({ response: 'All proxies unavailable.', success: false, routing });
        }
      }

      // ── GET /api/mcp ──
      if (path === '/api/mcp' && method === 'GET') {
        const target = url.searchParams.get('url') || 'https://datro.directory';
        const workerUrl = env.CF_WORKER_URL || 'https://datro-flywheel.righteous.workers.dev';
        try {
          const cfResp = await fetch(`${workerUrl}/__mcp?url=${encodeURIComponent(target)}`);
          return json(await cfResp.json());
        } catch (err) { return json({ error: err.message }, 502); }
      }

      // ── POST /api/machine/register ──
      if (path === '/api/machine/register' && method === 'POST') {
        const { machine_id, api_keys, ide, cli_tools } = body || {};
        if (!machine_id || !api_keys) return json({ error: 'machine_id and api_keys required' }, 400);
        await kv.put('machine:' + machine_id, JSON.stringify({
          api_keys, ide: ide || null, cli_tools: cli_tools || [],
          registered_at: Date.now(), last_seen: Date.now(),
        }), { expirationTtl: 86400 });
        const index = await kv.get('machine:index');
        const machines = index ? JSON.parse(index) : [];
        if (!machines.includes(machine_id)) { machines.push(machine_id); await kv.put('machine:index', JSON.stringify(machines)); }
        return json({ success: true, machine_id, message: 'Keys registered as fallback for LLM quota exhaustion.' });
      }

      // ── GET /api/local/profiles ──
      if (path === '/api/local/profiles' && method === 'GET') {
        return json({ profiles: [] });
      }

      // ── AWS endpoints (gone) ──
      if (path.startsWith('/api/aws/') || path === '/api/trigger/ota' || path === '/api/trigger/meta') {
        return json({ error: 'AWS decommissioned. System is Cloudflare-native.', success: false }, 410);
      }

      // ── Not API → serve from Pages static assets ──
      // The _worker.js receives ALL requests. For non-API routes, we
      // need to serve the static asset from the Pages KV store.
      // We use env.ASSETS to access the Pages static asset store.
      if (env.ASSETS) {
        return env.ASSETS.fetch(request);
      }

      // ── Fallback SPA routing ──
      const assetUrl = new URL(request.url);
      if (path === '/' || !path.startsWith('/api/')) {
        // Try common static files
        const staticPaths = ['/index.html', '/app.js', '/style.css', '/racetrack.js'];
        for (const p of staticPaths) {
          if (path === p && env.ASSETS) {
            return env.ASSETS.fetch(new Request(new URL(p, url.origin), request));
          }
        }
        // Fallback to index.html (SPA)
        if (env.ASSETS) {
          return env.ASSETS.fetch(new Request(new URL('/index.html', url.origin), request));
        }
      }

      return json({ error: 'Not found', path }, 404);

    } catch (err) {
      return json({ error: err.message, stack: err.stack }, 500);
    }
  }
};
