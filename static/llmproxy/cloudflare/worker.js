/**
 * LLM Proxy - Cloudflare Worker
 * Routes /v1/chat/completions to available sub-proxies, falls back to Groq API.
 * Sub-proxies register themselves via POST /api/register with their public URL.
 * API keys set via: wrangler secret put MISTRAL_API_KEY
 */

// Sub-proxies self-register. Seeded with known machines (updated by register endpoint).
// Cloudflare Workers cannot reach Tailscale IPs directly — machines must expose a public URL
// or use cloudflared tunnel. Until then, Groq fallback handles all requests.
const SEED_MACHINES = [
  // { name: 'aws1', url: 'https://aws1.example.com', priority: 1 },
];

// KV namespace binding: MACHINES_KV (optional, for persistent registration)
// If not bound, falls back to in-memory SEED_MACHINES only.

const FALLBACK_URL = 'https://api.mistral.ai/v1/chat/completions';
const FALLBACK_DEFAULT_MODEL = 'mistral-small-latest';

const FALLBACK_PROVIDERS = [
  { name: 'mistral', url: 'https://api.mistral.ai/v1/chat/completions',   model: 'mistral-small-latest',            keyEnv: 'MISTRAL_API_KEY' },
  { name: 'nvidia',  url: 'https://integrate.api.nvidia.com/v1/chat/completions', model: 'meta/llama-3.3-70b-instruct', keyEnv: 'NVIDIA_API_KEY' },
  { name: 'gemini',  url: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', model: 'gemini-2.0-flash', keyEnv: 'GEMINI_API_KEY' },
];

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function json(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS, ...extra },
  });
}

async function fetchTimeout(url, opts, ms = 25000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...opts, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

async function getMachines(env) {
  if (env.MACHINES_KV) {
    try {
      const stored = await env.MACHINES_KV.get('machines', 'json');
      if (stored) return stored;
    } catch (_) {}
  }
  return SEED_MACHINES;
}

async function trySubProxies(machines, request, body) {
  for (const m of machines) {
    try {
      const resp = await fetchTimeout(`${m.url}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': request.headers.get('Authorization') || '',
        },
        body: JSON.stringify(body),
      }, 20000);
      if (resp.ok) {
        const result = await resp.json();
        return json(result, 200, { 'X-Routed-To': m.name });
      }
    } catch (_) {}
  }
  return null;
}

async function apiFallback(body, env) {
  for (const p of FALLBACK_PROVIDERS) {
    const key = env[p.keyEnv];
    if (!key) continue;
    const model = body.model && !['kiro', 'default'].includes(body.model) ? body.model : p.model;
    try {
      const resp = await fetchTimeout(p.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
        body: JSON.stringify({ ...body, model }),
      });
      if (resp.ok) {
        const result = await resp.json();
        return json(result, 200, { 'X-Routed-To': `${p.name}-fallback` });
      }
    } catch (_) {}
  }
  return json({ error: 'All fallback providers failed' }, 503);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS });
    }

    // Health
    if (path === '/health' || path === '/api/health') {
      const machines = await getMachines(env);
      return json({ status: 'ok', machines: machines.length, timestamp: new Date().toISOString() });
    }

    // Machine self-registration
    if (path === '/api/register' && request.method === 'POST') {
      try {
        const data = await request.json();
        if (!data.name || !data.url) return json({ error: 'name and url required' }, 400);
        if (env.MACHINES_KV) {
          const machines = await getMachines(env);
          const idx = machines.findIndex(m => m.name === data.name);
          if (idx >= 0) machines[idx] = data; else machines.push(data);
          await env.MACHINES_KV.put('machines', JSON.stringify(machines));
        }
        return json({ status: 'registered', name: data.name });
      } catch (e) {
        return json({ error: e.message }, 400);
      }
    }

    // Machine list
    if (path === '/api/machines') {
      return json({ machines: await getMachines(env) });
    }

    // Install script
    if (path === '/install.sh') {
      const script = await fetch(
        'https://raw.githubusercontent.com/unclehowell/datro/llmproxy/static/llmproxy/install.sh'
      );
      return new Response(await script.text(), {
        headers: { 'Content-Type': 'text/plain', ...CORS },
      });
    }

    // LLM requests
    if (path.startsWith('/v1/')) {
      let body;
      try { body = await request.json(); } catch (_) { return json({ error: 'Invalid JSON' }, 400); }

      // Try registered sub-proxies first
      const machines = await getMachines(env);
      if (machines.length > 0) {
        const result = await trySubProxies(machines, request, body);
        if (result) return result;
      }

      // Fall back to Groq
      return apiFallback(body, env);
    }

    // Dashboard redirect
    if (path === '/' || path === '/dashboard') {
      return Response.redirect('https://kiro.financecheque.uk/health', 302);
    }

    return json({ error: 'Not found', available: ['/health', '/v1/chat/completions', '/api/register', '/api/machines', '/install.sh'] }, 404);
  },
};
