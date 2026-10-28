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
      if (request.method !== "HEAD") { h.delete("content-length"); h.delete("etag"); }
      const res = new Response(request.method === "HEAD" ? null : r.body, {status: 200, headers: h});
      return request.method === "HEAD" ? res : twoLines(res);
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

// Sion's 27 Oct 2026 rule for every snapshot: under the copy, (1) the Internet Archive's captures of the address,
// (2) the live website, then a small dated line. The address and date are read from the copy's own banner, so every
// copy (old and new, design-kept or plain) carries the lines without rewriting 184+ files. Links inside the copy
// already lead only to other copies (external ones carry data-href, not href). — Sion's Tab agent, 28 Oct 2026
function twoLines(res) {
  let src = "", cap = "", ver = "", done = false;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"}[c]));
  const block = () => {
    if (done || !/^https?:\/\//i.test(src)) return "";
    done = true;
    const s = "all:initial;display:block;box-sizing:border-box;margin:24px 0 0;padding:10px 12px;border-top:2px solid #1f2a24;background:#f7f5ef;color:#1d2420;font:13px/1.6 system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif;word-break:break-all";
    const a = "color:#2f5d46;text-decoration:underline";
    return `<div id="wbx-foot" style="${s}"><span style="display:block"><b>Internet Archive copy:</b> <a style="${a}" href="https://web.archive.org/web/*/${esc(src)}" target="_blank" rel="noopener nofollow">Wayback Machine captures of this address</a></span>`
      + `<span style="display:block"><b>Live website:</b> <a style="${a}" href="${esc(src)}" target="_blank" rel="noopener nofollow">${esc(src)}</a></span>`
      + (cap ? `<span style="display:block;opacity:.7">Captured ${esc(cap)}${ver ? " · " + esc(ver) : ""}</span>` : "") + `</div>`;
  };
  try {
    return new HTMLRewriter()
      .on("#wbx-banner", {text(t) { const m = /captured (\d{4}-\d{2}-\d{2})/.exec(t.text); if (m && !cap) cap = m[1];
                                     const v = /^(v\d+\.\d+\.\d+)$/.exec(t.text.trim()); if (v && !ver) ver = v[1]; }})
      .on('#wbx-banner a[target="_blank"]', {element(e) { const u = e.getAttribute("href") || ""; if (!src && /^https?:\/\//i.test(u)) src = u; }})
      .on("body", {element(e) { e.onEndTag(end => { const b = block(); if (b) end.before(b, {html: true}); }); }})
      .transform(res);
  } catch (err) { return res; }
}
