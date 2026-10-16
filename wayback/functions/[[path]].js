// Serve archive media from the existing R2 binding without making the whole bucket public.
// Only the catalogue's explicit media roots are eligible; site pages and treeview JSON
// continue through the ordinary Cloudflare Pages static-asset pipeline.
const MEDIA_ROOTS = ["images/", "pdf/", "text/", "video/"];

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  if (request.method !== "GET" && request.method !== "HEAD") {
    return context.next();
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
    // This also preserves intentional static items such as pdf/index.html.
    return context.next();
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
