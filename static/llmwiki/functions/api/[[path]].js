// llmwiki agent API — serves raw MD files to authenticated agents
// Deploy as Cloudflare Pages Function at /api/[[path]].js
// Usage: GET /api/memory_longterm/longterm_honcho/latest/source/mem0-memory-plugin.md
//        Header: X-API-Key: <key>
//        Or: GET /api/search?q=honcho

const API_KEYS = [
  "llmwiki-agent-key-unclehowell-2026"
];

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  // Auth
  const key = request.headers.get("X-API-Key") || url.searchParams.get("api_key");
  if (!API_KEYS.includes(key)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { "Content-Type": "application/json" }
    });
  }

  const path = url.pathname.replace(/^\/api\/?/, "");

  // List endpoint
  if (!path || path === "list") {
    return new Response(JSON.stringify({
      description: "LLMWiki Agent API — brain.financecheque.uk",
      endpoints: {
        "GET /api/{category}/{doc}/latest/source/{file}.md": "Fetch raw MD file",
        "GET /api/list": "This listing"
      },
      categories: [
        "memory_longterm",
        "skills_devops", "skills_creative", "skills_research",
        "skills_communication", "skills_lifestyle", "skills_autonomous",
        "soul_identity"
      ]
    }), { headers: { "Content-Type": "application/json" } });
  }

  // Serve raw MD — fetch from Pages static assets
  const mdUrl = new URL(`/${path}`, url.origin);
  try {
    const resp = await fetch(mdUrl);
    if (!resp.ok) return new Response(JSON.stringify({ error: "Not found", path }), {
      status: 404, headers: { "Content-Type": "application/json" }
    });
    const text = await resp.text();
    return new Response(text, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Access-Control-Allow-Origin": "*"
      }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { "Content-Type": "application/json" }
    });
  }
}
