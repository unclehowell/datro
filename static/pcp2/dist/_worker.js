export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    if (url.pathname.startsWith("/api/")) {
      return new Response(JSON.stringify({ status: "ok", path: url.pathname }), {
        headers: { "Content-Type": "application/json" }
      });
    }
    
    return env.ASSETS.fetch(request);
  }
};
