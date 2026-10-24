// Serve archive media from the existing R2 binding without making the whole bucket public.
// Only the catalogue's explicit media roots are eligible; site pages and treeview JSON
// continue through the ordinary Cloudflare Pages static-asset pipeline.
const MEDIA_ROOTS = ["images/", "pdf/", "text/", "video/"];

// Website snapshots moved to https://wayback-html.bucklerfamily.estate (design kept, readable names, 24 Oct 2026).
// Every old /websites/<host>/<slug>/... address answers 301 with the readable address; the map is /websites/moved.json.
const WS_HTML = "https://wayback-html.bucklerfamily.estate";
let WS_MOVED = null;
async function websitesMoved(context, url) {
  let p; try { p = decodeURIComponent(url.pathname); } catch { return null; }
  if (p === "/websites/index.json" || p === "/websites/moved.json") return null;
  if (p === "/websites" || p === "/websites/" || p === "/websites/index.html" || p === "/websites/index") return WS_HTML + "/";
  if (!WS_MOVED) {
    try { const r = await context.env.ASSETS.fetch(new URL("/websites/moved.json", url)); WS_MOVED = r.ok ? await r.json() : {}; } catch { WS_MOVED = {}; }
  }
  const m = p.match(/^\/websites\/([^/]+)\/([^/]+)(?:\/(.*))?$/);
  if (!m) return /^\/websites\/[^/]+\/?$/.test(p) ? WS_HTML + "/" : null;
  const base = WS_MOVED[m[1] + "/" + m[2]];
  if (!base) return null;
  if (base === "/") return WS_HTML + "/";
  const rest = (m[3] || "").replace(/\/$/, "");
  let v;
  if ((v = rest.match(/^(v\d+\.\d+\.\d+)(\.html?)?$/))) return WS_HTML + base + "." + v[1] + ".html";
  if (rest === "meta.json") return WS_HTML + base + ".meta.json";
  if (rest === "thumb.jpg" || /^screenshot/.test(rest)) return WS_HTML + base + ".thumb.jpg";
  return WS_HTML + base + ".html";
}

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  if (request.method !== "GET" && request.method !== "HEAD") {
    return context.next();
  }

  if (url.pathname === "/websites" || url.pathname.startsWith("/websites/")) {
    const moved = await websitesMoved(context, url);
    if (moved) return Response.redirect(moved, 301);
  }

  let key;
  try {
    key = decodeURIComponent(url.pathname.replace(/^\/+/, ""));
  } catch {
    return new Response("Invalid archive path.", {
      status: 400,
      headers: { "content-type": "text/plain; charset=utf-8", "x-content-type-options": "nosniff" },
    });
  }

  if (!MEDIA_ROOTS.some((prefix) => key.startsWith(prefix))) {
    return context.next();
  }

  // Catalogue manifests are static Pages assets, not public R2 objects.
  if (key.endsWith("/_treeview.json")) {
    return context.next();
  }

  if (
    !key ||
    key.includes("\\") ||
    key.split("/").some((segment) => segment === "" || segment === "." || segment === "..")
  ) {
    return new Response("Invalid archive path.", {
      status: 400,
      headers: { "content-type": "text/plain; charset=utf-8", "x-content-type-options": "nosniff" },
    });
  }

  const object = await env.wayback_media.get(key);
  if (object === null) {
    // This also preserves intentional static items such as pdf/index.html and the
    // text files committed under wayback/text/. But Pages answers any unknown path with
    // the site's index.html (SPA fallback) and _headers then labels it text/plain, so a
    // missing archive file used to come back as "200 + the Wayback HTML shell" and was
    // indexed downstream as if it were the email text. Missing media is now a real 404.
    const fallback = await context.next();
    if (!fallback.ok || key.toLowerCase().endsWith(".html")) return fallback;
    const ctype = (fallback.headers.get("content-type") || "").toLowerCase();
    let isShell = ctype.includes("text/html");
    if (!isShell && (ctype.startsWith("text/") || ctype === "")) {
      const head = (await fallback.clone().text()).slice(0, 2048).trimStart().toLowerCase();
      isShell = head.startsWith("<!doctype html") || head.startsWith("<html") || head.includes("<title>datro wayback archive</title>");
    }
    if (!isShell) return fallback;
    return new Response("Not found in the Wayback archive: " + key + "\n", {
      status: 404,
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "x-content-type-options": "nosniff",
        "cache-control": "no-store",
        "access-control-allow-origin": "*",
      },
    });
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("content-length", String(object.size));
  headers.set("x-content-type-options", "nosniff");
  headers.set("cache-control", "public, max-age=3600, stale-while-revalidate=86400");

  return new Response(request.method === "HEAD" ? null : object.body, {
    status: 200,
    headers,
  });
}
