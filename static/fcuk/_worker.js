// Cloudflare Worker for financecheque.uk and www.financecheque.uk serving fcuk static files
addEventListener("fetch", event => {
  event.respondWith(handleRequest(event.request));
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

async function handleRequest(request) {
  try {
    const url = new URL(request.url);
    let path = url.pathname;

    // Root path redirects to /fcuk/
    if (path === "/" || path === "") {
      return Response.redirect("https://financecheque.uk/fcuk/", 302);
    }

    // Strip /fcuk prefix and get the path
    if (path.startsWith("/fcuk")) {
      path = path.replace(/^\/fcuk/, "") || "/";
    }

    // Add .html if no extension
    if (!path.includes(".")) {
      path = path + ".html";
    }

    // Fetch from GitHub raw content
    const githubUrl = `https://raw.githubusercontent.com/unclehowell/datro/gh-pages/static/fcuk${path}`;

    const response = await fetch(githubUrl);

    if (response.ok) {
      const content = await response.text();

      let contentType = "text/plain";
      if (path.endsWith(".html")) contentType = "text/html";
      else if (path.endsWith(".css")) contentType = "text/css";
      else if (path.endsWith(".js")) contentType = "application/javascript";
      else if (path.endsWith(".json")) contentType = "application/json";
      else if (path.endsWith(".png")) contentType = "image/png";
      else if (path.endsWith(".jpg") || path.endsWith(".jpeg")) contentType = "image/jpeg";
      else if (path.endsWith(".svg")) contentType = "image/svg+xml";
      else if (path.endsWith(".md")) contentType = "text/markdown";

      const headers = {
        "Content-Type": `${contentType}; charset=utf-8`,
        "Cache-Control": "public, max-age=300",
        ...corsHeaders
      };

      return new Response(content, { status: 200, headers });
    }

    // Try index.html fallback
    if (!path.includes("index.html")) {
      const indexUrl = `https://raw.githubusercontent.com/unclehowell/datro/gh-pages/static/fcuk/index.html`;
      const idxResp = await fetch(indexUrl);

      if (idxResp.ok) {
        const content = await idxResp.text();
        return new Response(content, {
          status: 200,
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control": "public, max-age=300",
            ...corsHeaders
          }
        });
      }
    }

    return new Response("Not Found", { status: 404, headers: corsHeaders });

  } catch (error) {
    return new Response(error.message || "Internal Error", {
      status: 500,
      headers: corsHeaders
    });
  }
}