// llmwiki agent API — serves raw MD source files to authenticated agents
// Cloudflare Pages Function at /functions/api/[[path]].js

const API_KEYS = ["llmwiki-agent-key-unclehowell-2026"];

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);

  const key = request.headers.get("X-API-Key") || url.searchParams.get("api_key");
  if (!API_KEYS.includes(key)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { "Content-Type": "application/json" }
    });
  }

  const path = url.pathname.replace(/^\/api\/?/, "").replace(/\?.*$/, "");

  // Memory save endpoint — POST /api/memory
  if (request.method === 'POST' && (path === 'memory' || path === 'memory/')) {
    try {
      const body = await request.json();
      const { user_message, bot_reply, session_id } = body;
      if (!user_message) return new Response(JSON.stringify({ error: 'user_message required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

      const summary = `User asked: "${user_message}" | Bot replied: "${(bot_reply||'').slice(0,200)}"`;

      // Save to Mem0
      const mem0Key = typeof OPENROUTER_API_KEY !== 'undefined' ? null : null; // use env
      const mem0Resp = await fetch('https://api.mem0.ai/v1/memories/', {
        method: 'POST',
        headers: { 'Authorization': `Token m0-BNdEot8rxoSxxE5MH3aaaOCW36wo3g44tPP8UXdX`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: summary }], user_id: 'sion', agent_id: 'fcuk-chat', session_id: session_id || 'web' })
      });

      return new Response(JSON.stringify({ saved: true, mem0: mem0Resp.status }), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
    } catch(e) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
  }

  // CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST', 'Access-Control-Allow-Headers': 'Content-Type,X-API-Key' } });
  }


    // Fetch the deployed manifest written by build.js
    try {
      const manifestUrl = new URL('/_deployed_manifest.json', url.origin);
      const resp = await fetch(manifestUrl.toString());
      if (resp.ok) {
        const data = await resp.json();
        return new Response(JSON.stringify({
          description: "LLMWiki Agent API — brain.financecheque.uk",
          ...data
        }), { headers: { "Content-Type": "application/json" } });
      }
    } catch {}
    return new Response(JSON.stringify({
      description: "LLMWiki Agent API — brain.financecheque.uk",
      deployed_files: []
    }), { headers: { "Content-Type": "application/json" } });
  }

  // Only serve .md files from source directories
  if (!path.endsWith(".md")) {
    return new Response(JSON.stringify({ error: "Only .md files are served via this API" }), {
      status: 400, headers: { "Content-Type": "application/json" }
    });
  }

  // Fetch the static asset directly by constructing the full URL
  const assetUrl = new URL(`/${path}`, url.origin);
  const resp = await fetch(assetUrl.toString(), {
    headers: { "Accept": "text/plain, text/markdown, */*" }
  });

  // If Pages returns HTML (SPA fallback), the file doesn't exist
  const ct = resp.headers.get("content-type") || "";
  if (!resp.ok || ct.includes("text/html")) {
    return new Response(JSON.stringify({ error: "File not found", path }), {
      status: 404, headers: { "Content-Type": "application/json" }
    });
  }

  const text = await resp.text();
  return new Response(text, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "X-Source-Path": path
    }
  });
}
