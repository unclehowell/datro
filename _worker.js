const WORKER = 'https://datro-flywheel.righteous.workers.dev';
const ALL_BRANCHES = ['althea','archives','bpvsbuckler','bpvsbuckler-redflag','bucklervsbp','bw_base','carfinancecheque','ccan','ceo','cnei','command','command-agent-endpoint','dash','datro','dcc','financecheque','financecheque-monday-agent','gh-pages','gui','hbnb','library','llmwiki','pirateclaw','rerelease','subrepos','ui','wave','wayback','whitepaper'];

const PERSONAL_BRAIN_FILES = ['PERSONALITY','MEMORY','SKILLS','HARNESS','VALUES'];
const PROJECT_BRAIN_FILES = ['MASTERPLAN','CONTEXT','TASKS','RULES','HEARTBEAT'];

// In-memory fallback when no KV binding
var fallbackKV = {};

function cors(resp) {
  const h = new Headers(resp.headers);
  h.set('Access-Control-Allow-Origin', '*');
  return new Response(resp.body, { status: resp.status, statusText: resp.statusText, headers: h });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
}

function extractVersion(tag, branch) {
  const prefix = branch + '-v';
  if (tag.startsWith(prefix)) return tag.slice(prefix.length);
  return null;
}

function parseVer(v) {
  const parts = v.split('.').map(Number);
  return parts.reduce((a, b, i) => a + b * Math.pow(100, 3 - i), 0);
}

// ── KV Helpers ──────────────────────────────────────────────────────
async function kvGet(env, ns, key) {
  try {
    const kv = env[ns];
    if (kv) return JSON.parse(await kv.get(key));
  } catch(e) {}
  return fallbackKV[ns + ':' + key] || null;
}

async function kvPut(env, ns, key, val) {
  try {
    const kv = env[ns];
    if (kv) await kv.put(key, JSON.stringify(val));
  } catch(e) {}
  fallbackKV[ns + ':' + key] = val;
}

async function kvList(env, ns, prefix) {
  try {
    const kv = env[ns];
    if (kv) {
      const list = await kv.list({ prefix });
      return list.keys.map(k => k.name);
    }
  } catch(e) {}
  return Object.keys(fallbackKV).filter(k => k.startsWith(ns + ':' + prefix)).map(k => k.slice(ns.length + 1));
}

// ── GitHub raw fetch ────────────────────────────────────────────────
async function fetchGitHubFile(branch, path) {
  const url = 'https://raw.githubusercontent.com/unclehowell/datro/' + encodeURIComponent(branch) + '/' + encodeURIComponent(path);
  const r = await fetch(url);
  if (!r.ok) return null;
  return await r.text();
}

// ── Brain endpoints ─────────────────────────────────────────────────
async function handleBrainPersonal(request, env, file) {
  const method = request.method;
  if (method === 'GET') {
    if (file) {
      // Try KV first, then GitHub raw, then brain/personal/ directory
      let content = await kvGet(env, 'BRAIN_FILES', 'personal/' + file);
      if (!content) {
        content = await fetchGitHubFile('command', 'brain/personal/' + file + '.md');
        if (content) {
          await kvPut(env, 'BRAIN_FILES', 'personal/' + file, content);
        }
      }
      if (!content) return json({ error: 'File not found' }, 404);
      return json({ file, content, hemisphere: 'left', type: 'personal' });
    }
    // List all personal brain files
    const files = [];
    for (const f of PERSONAL_BRAIN_FILES) {
      const content = await kvGet(env, 'BRAIN_FILES', 'personal/' + f) || await fetchGitHubFile('command', 'brain/personal/' + f + '.md');
      files.push({ file: f, exists: !!content });
    }
    return json({ hemisphere: 'left', type: 'personal', files });
  }
  if (method === 'POST' && file) {
    const body = await request.json();
    await kvPut(env, 'BRAIN_FILES', 'personal/' + file, body.content);
    return json({ ok: true, file });
  }
  return json({ error: 'Method not allowed' }, 405);
}

async function handleBrainProject(request, env, branch, file) {
  const method = request.method;
  if (method === 'GET') {
    if (file) {
      let content = await kvGet(env, 'BRAIN_FILES', 'project/' + branch + '/' + file);
      if (!content) {
        content = await fetchGitHubFile(branch, file + '.md') || await fetchGitHubFile(branch, 'brain/' + file + '.md');
        if (content) {
          await kvPut(env, 'BRAIN_FILES', 'project/' + branch + '/' + file, content);
        }
      }
      if (!content) return json({ error: 'File not found' }, 404);
      return json({ file, content, branch, hemisphere: 'right', type: 'project' });
    }
    // List all project brain files for this branch
    const files = [];
    for (const f of PROJECT_BRAIN_FILES) {
      const content = await kvGet(env, 'BRAIN_FILES', 'project/' + branch + '/' + f) || await fetchGitHubFile(branch, f + '.md');
      files.push({ file: f, exists: !!content });
    }
    return json({ hemisphere: 'right', type: 'project', branch, files });
  }
  return json({ error: 'Method not allowed' }, 405);
}

// ── State endpoints ─────────────────────────────────────────────────
async function handleBrainState(request, env) {
  const method = request.method;
  if (method === 'GET') {
    const state = await kvGet(env, 'DATRO_STATE', 'current') || {
      bias: 0, risk: 0, gear: 3, steering: 'CTR',
      last_releases: {}, last_brain_update: null, cadence: '2h'
    };
    return json(state);
  }
  if (method === 'POST') {
    const body = await request.json();
    const current = await kvGet(env, 'DATRO_STATE', 'current') || {};
    const updated = { ...current, ...body };
    await kvPut(env, 'DATRO_STATE', 'current', updated);
    return json(updated);
  }
  return json({ error: 'Method not allowed' }, 405);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, '') || '/';

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Max-Age': '86400' },
      });
    }

    // ── Brain API Routes ──
    // /api/brain/personal/{file}
    const brainPersonalMatch = path.match(/^\/api\/brain\/personal\/([^/]+)$/);
    if (brainPersonalMatch) {
      return handleBrainPersonal(request, env, brainPersonalMatch[1]);
    }
    if (path === '/api/brain/personal') {
      return handleBrainPersonal(request, env, null);
    }

    // /api/brain/{branch}/{file}
    const brainProjectMatch = path.match(/^\/api\/brain\/([^/]+)\/([^/]+)$/);
    if (brainProjectMatch) {
      const [, branch, file] = brainProjectMatch;
      return handleBrainProject(request, env, branch, file);
    }

    // /api/brain/state
    if (path === '/api/brain/state') {
      return handleBrainState(request, env);
    }

    // /api/brain — list all brain info
    if (path === '/api/brain') {
      // Build a comprehensive brain listing
      var personalFiles = [];
      for (const f of PERSONAL_BRAIN_FILES) {
        personalFiles.push({ file: f, exists: true });
      }
      var projectBrains = {};
      for (const b of ALL_BRANCHES) {
        projectBrains[b] = PROJECT_BRAIN_FILES.map(f => ({ file: f }));
      }
      return json({
        personal: { hemisphere: 'left', files: personalFiles },
        projects: projectBrains,
        state: await kvGet(env, 'DATRO_STATE', 'current') || { bias: 0, gear: 3 }
      });
    }

    // ── Existing API Routes ──
    if (path === '/api/version') {
      const r = await fetch(WORKER + '/__status');
      const s = await r.json();
      const ver = (s.last_run && s.last_run.version) || '0.0.0';
      return json({ version: 'command-V' + ver });
    }

    if (path === '/api/fuel') {
      return json({ api: 80, llm: 65, cli: 90, ide: 40 });
    }

    if (path === '/api/branches') {
      const r = await fetch(WORKER + '/__status');
      const s = await r.json();
      const activeBranch = (s.last_run && s.last_run.branch) || 'command';

      let branchVersions = {};
      try {
        const releasesResp = await fetch('https://api.github.com/repos/unclehowell/datro/releases?per_page=100');
        const releases = await releasesResp.json();
        if (Array.isArray(releases)) {
          for (const release of releases) {
            const tag = release.tag_name || '';
            for (const b of ALL_BRANCHES) {
              const ver = extractVersion(tag, b);
              if (ver && (!branchVersions[b] || parseVer(ver) > parseVer(branchVersions[b]))) {
                branchVersions[b] = ver;
              }
            }
          }
        }
      } catch (e) { /* best-effort */ }

      return json(ALL_BRANCHES.map(b => ({
        name: b,
        active: b === activeBranch,
        version: branchVersions[b] || null,
        releaseUrl: branchVersions[b] ? ('https://github.com/unclehowell/datro/releases/tag/' + b + '-v' + branchVersions[b]) : null,
      })));
    }

    // File read: GET /api/branches/{branch}/files/{side}/{filename}
    const fileMatch = path.match(/^\/api\/branches\/([^/]+)\/files\/([^/]+)\/(.+)$/);
    if (fileMatch) {
      const [, branch, side, filename] = fileMatch;
      if (request.method === 'GET') {
        const raw = await fetch('https://raw.githubusercontent.com/unclehowell/datro/' + encodeURIComponent(branch) + '/' + encodeURIComponent(filename));
        if (!raw.ok) return json({ error: 'File not found' }, 404);
        const content = await raw.text();
        return json({ content, branch, filename, side });
      }
      if (request.method === 'POST') {
        const body = await request.json();
        const r = await fetch(WORKER + '/__edit_file', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ branch, path: filename, content: body.content, message: body.message || 'Edited via COMMAND Cockpit' }),
        });
        return cors(r);
      }
    }

    // Rerelease: POST /api/rerelease/{branch}
    const rereleaseMatch = path.match(/^\/api\/rerelease\/([^/]+)$/);
    if (rereleaseMatch && request.method === 'POST') {
      const branch = rereleaseMatch[1];
      const body = await request.json();
      const files = body.files || [];

      const results = [];
      let ok = true;
      for (const file of files) {
        try {
          const r = await fetch(WORKER + '/__edit_file', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ branch, path: file.path, content: file.content, message: file.message || 'Edited via COMMAND Cockpit' }),
          });
          const result = await r.json();
          results.push(result);
          if (!result.ok) ok = false;
        } catch (e) {
          ok = false;
          results.push({ ok: false, error: e.message });
        }
      }

      const cronR = await fetch(WORKER + '/__cron?branch=' + encodeURIComponent(branch), { method: 'POST' });
      const cronText = await cronR.text();

      // Record release in KV state
      const state = await kvGet(env, 'DATRO_STATE', 'current') || {};
      if (!state.last_releases) state.last_releases = {};
      state.last_releases[branch] = Date.now();
      await kvPut(env, 'DATRO_STATE', 'current', state);

      return json({ ok, files: results, trigger: cronText });
    }

    if (path === '/api/flywheel/state') {
      // Enhance state with KV data
      const r = await fetch(WORKER + '/__state');
      const state = await r.json();
      const brainState = await kvGet(env, 'DATRO_STATE', 'current') || {};
      state.last_releases = brainState.last_releases || {};
      state.brain = {
        bias: brainState.bias || 0,
        gear: brainState.gear || 3,
        steering: brainState.steering || 'CTR',
        last_update: brainState.last_brain_update || null,
      };
      return cors(new Response(JSON.stringify(state), { headers: { 'Content-Type': 'application/json' } }));
    }

    if (path === '/api/flywheel/bias') {
      if (request.method === 'GET') {
        const r = await fetch(WORKER + '/__bias');
        return cors(r);
      }
      const body = await request.json();
      const r = await fetch(WORKER + '/__set', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      return cors(r);
    }

    if (path === '/api/flywheel/config') {
      if (request.method === 'GET') {
        const r = await fetch(WORKER + '/__config');
        return cors(r);
      }
      const { gear } = await request.json();
      const r = await fetch(WORKER + '/__gear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gear }),
      });
      return cors(r);
    }

    if (path.startsWith('/api/flywheel/trigger/')) {
      const branch = path.replace('/api/flywheel/trigger/', '');
      const r = await fetch(WORKER + '/__cron?branch=' + encodeURIComponent(branch), { method: 'POST' });
      return cors(r);
    }

    if (path === '/api/chat') {
      const { message } = await request.json();
      const r = await fetch(WORKER + '/__status');
      const s = await r.json();
      const branch = (s.last_run && s.last_run.branch) || 'unknown';
      const brainState = await kvGet(env, 'DATRO_STATE', 'current') || {};
      return json({
        reply: 'J.A.R.V.I.S. Active: ' + branch + '. Mode: ' + s.mode + ' Gear: ' + s.gear + '. Brain state: bias=' + (brainState.bias || 0) + ' steering=' + (brainState.steering || 'CTR'),
        status: 'ok'
      });
    }

    // ── Static assets ──
    return env.ASSETS.fetch(request);
  },
};
