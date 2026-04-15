// archives API — serves md files and manifest
const API_KEYS = ["llmwiki-agent-key-unclehowell-2026"];

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  
  const key = request.headers.get("X-API-Key") || url.searchParams.get("api_key");
  if (!API_KEYS.includes(key)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { "Content-Type": "application/json" }
    });
  }
  
  const path = url.pathname.replace(/^\/api\/?/, "").replace(/\?.*$/, "");
  
  // Root: return manifest
  if (!path || path === "/") {
    try {
      const manifestUrl = new URL('/_archives_manifest.json', url.origin);
      const resp = await fetch(manifestUrl.toString());
      if (resp.ok) {
        const data = await resp.json();
        return new Response(JSON.stringify({
          description: "Archives API — archives.financecheque.uk",
          ...data
        }), { headers: { "Content-Type": "application/json" } });
      }
    } catch {}
    return new Response(JSON.stringify({
      description: "Archives API — archives.financecheque.uk",
      deployed_files: []
    }), { headers: { "Content-Type": "application/json" } });
  }
  
  // Serve .md files
  if (path.endsWith(".md")) {
    try {
      const fileUrl = new URL(`/static/archives/${path}`, url.origin);
      const resp = await fetch(fileUrl.toString());
      if (resp.ok) {
        return new Response(await resp.text(), {
          headers: { "Content-Type": "text/markdown" }
        });
      }
    } catch {}
  }
  
  return new Response(JSON.stringify({ error: "Not found" }), {
    status: 404, headers: { "Content-Type": "application/json" }
  });
}
