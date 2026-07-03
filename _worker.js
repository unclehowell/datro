const WORKER = 'https://datro-flywheel.righteous.workers.dev';
const ALL_BRANCHES = ['althea','archives','bpvsbuckler','bpvsbuckler-redflag','bucklervsbp','bw_base','carfinancecheque','ccan','ceo','cnei','command','command-agent-endpoint','dash','datro','dcc','financecheque','financecheque-monday-agent','gh-pages','gui','hbnb','library','llmwiki','pirateclaw','rerelease','subrepos','ui','wave','wayback','whitepaper'];

// Branch number mapping (second digit of version: v0.{branch}.{X}.{Y})
const BRANCH_NUM = {
  command:1, 'command-agent-endpoint':2, cnei:3, ceo:4,
  financecheque:5, 'financecheque-monday-agent':6, carfinancecheque:7,
  bpvsbuckler:8, 'bpvsbuckler-redflag':9, bucklervsbp:10,
  rerelease:11, wayback:12, 'gh-pages':13,
  gui:14, ui:15, dash:16, althea:17,
  datro:18, dcc:19, ccan:20,
  llmwiki:21, pirateclaw:22, whitepaper:23,
  wave:24, bw_base:25, subrepos:26
};

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
  // Version scheme: v0.{branch}.{X}.{Y} where X=floor(counter/100), Y=counter%100
  // Reject old formats
  const parts = v.split('.').map(Number);
  if (parts.length !== 4) return 0;
  if (parts[0] !== 0) return 0;                    // must start with 0
  if (parts[1] < 1 || parts[1] > 26) return 0;    // branch: 1-26
  if (parts[2] < 0 || parts[2] > 99) return 0;    // X: 0-99
  if (parts[3] < 0 || parts[3] > 99) return 0;    // Y: 0-99
  // Flat counter for comparison: X*100 + Y (branch is just an identifier)
  return parts[2] * 100 + parts[3];
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
  const r = await fetch(url, { headers: { 'User-Agent': 'command-dashboard-worker' } });
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
      let targetVer = null;
      try {
        const ghHeaders = { 'User-Agent': 'command-dashboard-worker', 'Accept': 'application/vnd.github.v3+json' };
        // Check tags (lighter than releases, all accessible via refs API)
        const tagsResp = await fetch('https://api.github.com/repos/unclehowell/datro/git/refs/tags?per_page=100', { headers: ghHeaders });
        const tagsText = await tagsResp.text();
        const tags = JSON.parse(tagsText);
        if (Array.isArray(tags)) {
          for (const tag of tags) {
            const tagName = (tag.ref || '').replace('refs/tags/', '');
            const ver = extractVersion(tagName, 'command');
            if (ver && (!targetVer || parseVer(ver) > parseVer(targetVer))) {
              targetVer = ver;
            }
          }
        }
        // Also check first page of releases as fallback
        if (!targetVer) {
          const releasesResp = await fetch('https://api.github.com/repos/unclehowell/datro/releases?per_page=100', { headers: ghHeaders });
          const releasesText = await releasesResp.text();
          const releases = JSON.parse(releasesText);
          if (Array.isArray(releases)) {
            for (const release of releases) {
              const tag = release.tag_name || '';
              const ver = extractVersion(tag, 'command');
              if (ver && (!targetVer || parseVer(ver) > parseVer(targetVer))) {
                targetVer = ver;
              }
            }
          }
        }
      } catch(e) {}
      // Fallback: read counter from KV
      if (!targetVer) {
        try {
          const counter = await kvGet(env, 'METADATA', 'release_counter');
          if (counter) {
            const branchNum = BRANCH_NUM['command'] || 1;
            const x = Math.floor(counter / 100);
            const y = counter % 100;
            targetVer = `0.${branchNum}.${x}.${String(y).padStart(2, '0')}`;
          }
        } catch(e) {}
      }
      return json({ version: 'command-V' + (targetVer || '0.1.0.01') });
    }

    if (path === '/api/fuel') {
      // Query real provider quotas/balances from Cloudflare Worker
      const providers = [];

      // Groq — free tier: check model count as proxy for availability
      try {
        const gKey = env.GROQ_API_KEY || '';
        const g = await fetch('https://api.groq.com/openai/v1/models', {
          headers: { 'Authorization': 'Bearer ' + gKey },
        });
        const gd = await g.json();
        const modelCount = (gd.data || []).length;
        const pct = Math.min(100, Math.round((modelCount / 20) * 100));
        providers.push({ name: 'Groq', model: 'llama-3.3-70b', remaining: modelCount + ' models', pct, tier: 'Free', color: '#f55036' });
      } catch(e) {
        providers.push({ name: 'Groq', model: 'llama-3.3-70b', remaining: 'Error', pct: 0, tier: 'Free', color: '#f55036', error: true });
      }

      // Gemini — check model availability
      try {
        const gKey = env.GOOGLE_API_KEY || '';
        const g = await fetch('https://generativelanguage.googleapis.com/v1beta/models?key=' + gKey);
        const gd = await g.json();
        const modelCount = (gd.models || []).length;
        const pct = Math.min(100, Math.round((modelCount / 50) * 100));
        providers.push({ name: 'Gemini', model: '2.5-flash', remaining: modelCount + ' models', pct, tier: 'Free', color: '#4285f4' });
      } catch(e) {
        providers.push({ name: 'Gemini', model: '2.5-flash', remaining: 'Error', pct: 0, tier: 'Free', color: '#4285f4', error: true });
      }

      // OpenRouter — check credits
      try {
        const oKey = env.OPENROUTER_API_KEY || '';
        const o = await fetch('https://openrouter.ai/api/v1/credits', {
          headers: { 'Authorization': 'Bearer ' + oKey },
        });
        const od = await o.json();
        const total = od.data?.total_credits || 0;
        const used = od.data?.total_usage || 0;
        const remaining = Math.max(0, total - used);
        const pct = total > 0 ? Math.round((remaining / total) * 100) : (used > 0 ? 5 : 50);
        providers.push({ name: 'OpenRouter', model: 'gemma-4-31b', remaining: '$' + remaining.toFixed(4), pct, tier: 'Free', color: '#6366f1' });
      } catch(e) {
        providers.push({ name: 'OpenRouter', model: 'gemma-4-31b', remaining: 'N/A', pct: 0, tier: 'Free', color: '#6366f1', error: true });
      }

      // DeepSeek — check balance
      try {
        const d = await fetch('https://api.deepseek.com/user/balance', {
          headers: { 'Authorization': 'Bearer ' + (env.DEEPSEEK_API_KEY || '') },
        });
        const dd = await d.json();
        const bal = parseFloat(dd.balance_infos?.[0]?.total_balance || '0');
        const pct = bal > 0 ? Math.min(100, Math.round(bal * 20)) : 0;
        providers.push({ name: 'DeepSeek', model: 'deepseek-chat', remaining: '$' + bal.toFixed(2), pct, tier: 'Pay', color: '#059669' });
      } catch(e) {
        providers.push({ name: 'DeepSeek', model: 'deepseek-chat', remaining: '$0.00', pct: 0, tier: 'Pay', color: '#059669', error: true });
      }

      // OpenAI — check if key works (usage endpoint needs org)
      try {
        const oKey = env.OPENAI_API_KEY || '';
        const o = await fetch('https://api.openai.com/v1/models', {
          headers: { 'Authorization': 'Bearer ' + oKey },
        });
        const ok = o.ok;
        providers.push({ name: 'OpenAI', model: 'gpt-4o', remaining: ok ? 'Active' : 'No key', pct: ok ? 60 : 0, tier: 'Pay', color: '#10b981' });
      } catch(e) {
        providers.push({ name: 'OpenAI', model: 'gpt-4o', remaining: 'N/A', pct: 0, tier: 'Pay', color: '#10b981', error: true });
      }

      // Hermes (local) — check if ollama is running
      try {
        const h = await fetch('http://localhost:11434/api/tags', { signal: AbortSignal.timeout(2000) });
        const hd = await h.json();
        const modelCount = (hd.models || []).length;
        const pct = Math.min(100, modelCount * 15);
        providers.push({ name: 'Hermes', model: 'ollama', remaining: modelCount + ' local', pct, tier: 'Local', color: '#f59e0b' });
      } catch(e) {
        providers.push({ name: 'Hermes', model: 'ollama', remaining: 'Offline', pct: 0, tier: 'Local', color: '#f59e0b', error: true });
      }

      return json({ providers, ts: Date.now() });
    }

    if (path === '/api/branches') {
      const r = await fetch(WORKER + '/__status');
      const s = await r.json();
      const activeBranch = (s.last_run && s.last_run.branch) || 'command';

      let branchVersions = {};
      try {
        const ghHeaders = { 'User-Agent': 'command-dashboard-worker', 'Accept': 'application/vnd.github.v3+json' };
        // Scan tags (covers all branches)
        const tagsResp = await fetch('https://api.github.com/repos/unclehowell/datro/git/refs/tags?per_page=100', { headers: ghHeaders });
        const tagsText = await tagsResp.text();
        const tags = JSON.parse(tagsText);
        if (Array.isArray(tags)) {
          for (const tag of tags) {
            const tagName = (tag.ref || '').replace('refs/tags/', '');
            for (const b of ALL_BRANCHES) {
              const ver = extractVersion(tagName, b);
              if (ver && (!branchVersions[b] || parseVer(ver) > parseVer(branchVersions[b]))) {
                branchVersions[b] = ver;
              }
            }
          }
        }
        // Also scan releases as fallback
        const releasesResp = await fetch('https://api.github.com/repos/unclehowell/datro/releases?per_page=100', { headers: ghHeaders });
        const releasesText = await releasesResp.text();
        const releases = JSON.parse(releasesText);
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
        const raw = await fetch('https://raw.githubusercontent.com/unclehowell/datro/' + encodeURIComponent(branch) + '/' + encodeURIComponent(filename), {
          headers: { 'User-Agent': 'command-dashboard-worker' }
        });
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
