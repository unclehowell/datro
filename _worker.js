const WORKER = 'https://datro-flywheel.righteous.workers.dev';
const ALL_BRANCHES = ['althea','archives','bpvsbuckler','bpvsbuckler-redflag','bucklervsbp','bw_base','carfinancecheque','ccan','ceo','cnei','command','command-agent-endpoint','dash','datro','dcc','financecheque','financecheque-monday-agent','gh-pages','gui','hbnb','library','llmwiki','pirateclaw','rerelease','subrepos','ui','wave','wayback','whitepaper'];

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

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, '') || '/';

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Max-Age': '86400' },
      });
    }

    // ── API Routes ──
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

      // Fetch release versions from GitHub
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
      const files = body.files || []; // [{path, content}]

      // Save all files first
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

      // Trigger rerelease via flywheel cron
      const cronR = await fetch(WORKER + '/__cron?branch=' + encodeURIComponent(branch), { method: 'POST' });
      const cronText = await cronR.text();

      return json({ ok, files: results, trigger: cronText });
    }

    if (path === '/api/flywheel/state') {
      const r = await fetch(WORKER + '/__state');
      return cors(r);
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
      return json({ reply: 'J.A.R.V.I.S. Active: ' + branch + '. Mode: ' + s.mode + ' Gear: ' + s.gear + '.', status: 'ok' });
    }

    // ── Static assets ──
    return env.ASSETS.fetch(request);
  },
};