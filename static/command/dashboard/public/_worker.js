const APP_VERSION = 'command-V0.0.0.03';
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

const HARDCODED = {
  github_owner: 'unclehowell',
  github_repo: 'datro',
  parent_proxy_url: 'https://www.financecheque.uk',
  cf_worker_url: 'https://datro-flywheel.righteous.workers.dev',
  branch_ref: 'command',
};

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
    const kv = env.COMMAND_DASHBOARD;
    const ghToken = env.GITHUB_TOKEN || '';

    let body = null;
    if (method === 'POST' || method === 'PUT') { try { body = await request.json(); } catch {} }

    if (method === 'OPTIONS') return new Response(null, { headers: cors() });

    try {
      // GET /api/status
      if (path === '/api/status' && method === 'GET') {
        return json({ status: 'ok', version: APP_VERSION, timestamp: new Date().toISOString() });
      }

      // GET /api/version
      if (path === '/api/version' && method === 'GET') {
        let version = APP_VERSION;
        let cached = await kv.get('version:command_tag');
        if (cached) {
          version = cached;
        } else {
          try {
            const headers = { 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'command-dashboard-cf' };
            if (ghToken) headers['Authorization'] = 'Bearer ' + ghToken;
            const resp = await fetch('https://api.github.com/repos/unclehowell/datro/releases?per_page=100', { headers });
            const data = await resp.json();
            if (Array.isArray(data)) {
              const cmd = data.filter(r => r.tag_name.startsWith('command-')).sort((a, b) => new Date(b.published_at) - new Date(a.published_at))[0];
              version = cmd ? cmd.tag_name : 'command-v0.0.0';
              await kv.put('version:command_tag', version, { expirationTtl: 3600 });
            }
          } catch {}
        }
        return json({ version });
      }

      // GET /api/settings — always connected
      if (path === '/api/settings' && method === 'GET') {
        return json({
          ...HARDCODED,
          gh_connected: !!ghToken ? 'connected' : '',
          cf_connected: !!env.CLOUDFLARE_API_TOKEN ? 'connected' : '',
        });
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
        const s = HARDCODED;
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
        const s = HARDCODED;
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
        const s = HARDCODED;
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
        const s = HARDCODED;
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
        const s = HARDCODED;
        try {
          const resp = await fetch(s.cf_worker_url + '/__mcp?url=' + encodeURIComponent(target));
          return json(await resp.json());
        } catch (err) { return json({ error: err.message }, 502); }
      }

      // GET /api/rereleases
      if (path === '/api/rereleases' && method === 'GET') {
        const s = HARDCODED;
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

      // POST /api/flywheel/trigger/:branch
      const tm = path.match(/^\/api\/flywheel\/trigger\/([a-zA-Z0-9_-]+)$/);
      if (tm && method === 'POST') {
        const s = HARDCODED;
        const branch = tm[1];
        try {
          const resp = await fetch(s.cf_worker_url + '/__cron?branch=' + encodeURIComponent(branch), { method: 'POST' });
          const text = await resp.text();
          return json({ success: resp.ok, branch, output: text.slice(0, 500) });
        } catch (err) { return json({ error: err.message, success: false }, 502); }
      }

      // GET /api/flywheel/state
      if (path === '/api/flywheel/state' && method === 'GET') {
        const s = HARDCODED;
        try {
          const resp = await fetch(s.cf_worker_url + '/__state');
          return json(await resp.json());
        } catch { return json({ regular_index: 0, cnei_queue: 0, lap: 0, mode: 'AUTO' }); }
      }

      // POST /api/flywheel/config
      if (path === '/api/flywheel/config' && method === 'POST') {
        const s = HARDCODED;
        try {
          const resp = await fetch(s.cf_worker_url + '/__config', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body || {}) });
          return json(await resp.json());
        } catch { return json({ ok: false }, 502); }
      }

      // POST /api/flywheel/bias
      if (path === '/api/flywheel/bias' && method === 'POST') {
        const s = HARDCODED;
        try {
          const resp = await fetch(s.cf_worker_url + '/__bias', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body || {}) });
          return json(await resp.json());
        } catch { return json({ ok: false }, 502); }
      }

      // GET /api/flywheel/bias
      if (path === '/api/flywheel/bias' && method === 'GET') {
        const s = HARDCODED;
        try {
          const resp = await fetch(s.cf_worker_url + '/__bias');
          return json(await resp.json());
        } catch { return json({ bias: 3, steering: 'CTR', risk: 3 }); }
      }

      // GET /api/flywheel/status
      if (path === '/api/flywheel/status' && method === 'GET') {
        const s = HARDCODED;
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