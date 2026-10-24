// Wayback html site: design-kept snapshots. Readable addresses keep their .html extension in the address bar
// (served directly, no pretty-URL redirect); the snapshot's copied styles, fonts, images and thumbnails come from the
// shared archive bucket under html/. — Sion's Tab agent
const TYPES = {css:"text/css; charset=utf-8",woff2:"font/woff2",woff:"font/woff",ttf:"font/ttf",otf:"font/otf",eot:"application/vnd.ms-fontobject",
  jpg:"image/jpeg",png:"image/png",gif:"image/gif",webp:"image/webp",svg:"image/svg+xml"};
export async function onRequest(context) {
  const { request, env } = context; const url = new URL(request.url); let p = url.pathname;
  if (request.method !== "GET" && request.method !== "HEAD") return context.next();
  try { p = decodeURIComponent(p); } catch { return context.next(); }
  if (/^\/[^/]+\/_a\/[0-9a-f]{16}\.[a-z0-9]+$/.test(p) || /^\/[^/]+\/[^/]+\.thumb\.jpg$/.test(p)) {
    const o = await env.wayback_media.get("html" + p);
    if (!o) return context.next();   // assets added later by sync_html.py are committed beside the page
    const ext = p.split(".").pop();
    return new Response(request.method === "HEAD" ? null : o.body, {headers: {"content-type": TYPES[ext] || "application/octet-stream",
      "cache-control": "public, max-age=604800, immutable", "x-content-type-options": "nosniff", "access-control-allow-origin": "*"}});
  }
  if (p.endsWith(".html") && p !== "/index.html") {
    const r = await env.ASSETS.fetch(new URL(url.pathname.slice(0, -5), url), request);
    if (r.status === 200) {
      const h = new Headers(r.headers); h.set("x-robots-tag", "noindex"); h.set("cache-control", "public, max-age=300");
      return new Response(request.method === "HEAD" ? null : r.body, {status: 200, headers: h});
    }
    return r.status >= 300 && r.status < 400 ? new Response("Not found\n", {status: 404, headers: {"content-type": "text/plain"}}) : r;
  }
  // an address typed without the extension goes to the readable .html name
  if (/^\/[^/]+\/[^/.]+(\.v\d+\.\d+\.\d+)?$/.test(p)) {
    const r = await env.ASSETS.fetch(new URL(url.pathname, url), {method: "HEAD"});
    if (r.status === 200) return Response.redirect(new URL(url.pathname + ".html", url).toString(), 301);
  }
  return context.next();
}
