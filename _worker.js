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
      return json(ALL_BRANCHES.map(b => ({ name: b, active: b === activeBranch, purpose: '', url: 'https://' + b + '.datro.directory' })));
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
          body: JSON.stringify({ branch, path: filename, content: body.content, message: 'Edited via COMMAND Cockpit' }),
        });
        return cors(r);
      }
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
      const r = await fetch(WORKER + '/__trigger?branch=' + encodeURIComponent(branch), { method: 'POST' });
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
