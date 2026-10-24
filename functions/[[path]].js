// Wayback pdf site: serves every file under a short readable name (from names.json), reading the
// shared archive bucket first and the hub's git copy second. Old hub addresses keep working unchanged. — Sion's Tab agent
const HUB = "https://wayback.bucklerfamily.estate/";
let MAP = null;
const CT = {pdf:"application/pdf",jpg:"image/jpeg",jpeg:"image/jpeg",png:"image/png",gif:"image/gif",webp:"image/webp",svg:"image/svg+xml",tif:"image/tiff",tiff:"image/tiff",
  mp4:"video/mp4",mov:"video/quicktime",webm:"video/webm",m4v:"video/mp4",mp3:"audio/mpeg",m4a:"audio/mp4",wav:"audio/wav",
  txt:"text/plain; charset=utf-8",md:"text/plain; charset=utf-8",csv:"text/plain; charset=utf-8",eml:"text/plain; charset=utf-8",
  doc:"application/msword",docx:"application/vnd.openxmlformats-officedocument.wordprocessingml.document",xls:"application/vnd.ms-excel",
  xlsx:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",odt:"application/vnd.oasis.opendocument.text",rtf:"application/rtf",zip:"application/zip",
  ppt:"application/vnd.ms-powerpoint",pptx:"application/vnd.openxmlformats-officedocument.presentationml.presentation"};
async function loadMap(env, url) {
  if (!MAP) { const r = await env.ASSETS.fetch(new URL("/names.json", url)); MAP = await r.json(); }
  return MAP;
}
function base(name, size, extra) {
  const ext = name.split(".").pop().toLowerCase();
  const h = new Headers({"content-type": CT[ext] || "application/octet-stream", "x-content-type-options": "nosniff",
    "cache-control": "public, max-age=3600, stale-while-revalidate=86400", "access-control-allow-origin": "*", "accept-ranges": "bytes",
    "content-disposition": `inline; filename="${name.replace(/"/g, "")}"`});
  if (size != null) h.set("content-length", String(size));
  for (const [k, v] of Object.entries(extra || {})) h.set(k, v);
  return h;
}
export async function onRequest(context) {
  const { request, env } = context; const url = new URL(request.url);
  if (request.method !== "GET" && request.method !== "HEAD") return context.next();
  let p; try { p = decodeURIComponent(url.pathname); } catch { return context.next(); }
  if (p.startsWith("/_t/")) {
    const o = await env.wayback_media.get("thumbs/pdf/" + p.slice(4));
    if (!o) return new Response("", {status: 404});
    return new Response(request.method === "HEAD" ? null : o.body, {headers: {"content-type": "image/jpeg", "cache-control": "public, max-age=86400", "access-control-allow-origin": "*"}});
  }
  const name = p.replace(/^\/+/, "");
  if (!name || name.includes("/")) return context.next();
  const map = await loadMap(env, url);
  let src = map[name];
  if (!src) return context.next();
  if (src.startsWith("=")) return Response.redirect(new URL("/" + encodeURIComponent(src.slice(1)), url).toString().replace(/%2F/g, "/"), 302);
  const range = request.headers.get("range");
  const obj = await env.wayback_media.get(src, range ? {range: request.headers} : undefined);
  if (obj) {
    const h = base(name, null, {etag: obj.httpEtag});
    if (range && obj.range) {
      const off = obj.range.offset ?? 0; const len = obj.range.length ?? (obj.size - off);
      h.set("content-range", `bytes ${off}-${off + len - 1}/${obj.size}`); h.set("content-length", String(len));
      return new Response(request.method === "HEAD" ? null : obj.body, {status: 206, headers: h});
    }
    h.set("content-length", String(obj.size));
    return new Response(request.method === "HEAD" ? null : obj.body, {status: 200, headers: h});
  }
  const r = await fetch(HUB + src.split("/").map(encodeURIComponent).join("/"), {headers: range ? {range} : {}});
  if (!r.ok && r.status !== 206) return new Response("Not found in the Wayback archive: " + name + "\n", {status: 404, headers: {"content-type": "text/plain; charset=utf-8"}});
  const h = base(name, r.headers.get("content-length"));
  if (r.headers.get("content-range")) h.set("content-range", r.headers.get("content-range"));
  return new Response(request.method === "HEAD" ? null : r.body, {status: r.status, headers: h});
}
