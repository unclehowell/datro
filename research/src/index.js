/**
 * Research — isolated serverless mirror of the Great House Farm WordPress.com wiki.
 * Runs as a Cloudflare Worker with its own D1 database. It never writes upstream.
 */
const SOURCE_SITE = "https://greathousefarmwiki.wordpress.com";
const SOURCE_HOST = "greathousefarmwiki.wordpress.com";
const WP_API_FIELDS = "id,slug,link,title,content,excerpt,date,date_gmt,modified,modified_gmt,status,parent,menu_order,author,featured_media,source_url,media_type,mime_type,alt_text,caption,description,post";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") {
      return cors(new Response(null, { status: 204 }));
    }
    try {
      if (url.pathname === "/health") {
        const count = await env.DB.prepare("SELECT COUNT(*) AS count FROM content_items WHERE status = 'publish'").first();
        return cors(json({ ok: true, service: "research-wp", environment: env.ENVIRONMENT || "unknown", published_records: count ? count.count : 0 }));
      }
      if (url.pathname === "/llms.txt") {
        return cors(new Response(agentText(env), { headers: { "Content-Type": "text/plain; charset=utf-8" } }));
      }
      if (url.pathname === "/agent-index.json" || url.pathname === "/.well-known/agent.json") {
        return cors(json({
          name: env.SITE_TITLE || "Great House Farm Wiki — Research Mirror",
          kind: "serverless-wordpress-shaped-content-mirror",
          source: SOURCE_SITE,
          read_only_mirror: true,
          interfaces: { content: "/api/content", search: "/api/content?search=", preview: "/api/preview?path=/", graphql: "/graphql", docs: "/read-the-docs/", health: "/health", llms: "/llms.txt" },
          evidence_status: { assured: "□ data-evidence-status=assured", not_assured: "◇ data-evidence-status=not-assured", unmarked: "unassessed or ambiguous; no highlight" }
        }));
      }
      if (url.pathname === "/admin/sync") {
        return cors(await handleSync(request, url, env));
      }
      if (url.pathname === "/graphql") {
        return cors(await handleGraphQL(request, env));
      }
      if (url.pathname === "/api/content") {
        return cors(await handleContentIndex(url, env));
      }
      if (url.pathname === "/api/preview") {
        return cors(await handlePreview(url, env));
      }
      if (url.pathname.startsWith("/api/content/")) {
        return cors(await handleContentItem(url, env));
      }
      if (url.pathname.startsWith("/media/")) {
        return cors(await handleMedia(url, env));
      }
      if (url.pathname === "/asset") {
        return cors(await handleAsset(url, env));
      }
      if (url.pathname === "/robots.txt") {
        return cors(new Response("User-agent: *\nAllow: /\nSitemap: https://" + url.host + "/sitemap.xml\n", { headers: { "Content-Type": "text/plain; charset=utf-8" } }));
      }
      if (url.pathname === "/sitemap.xml") {
        return cors(await handleSitemap(url, env));
      }
      if (request.method !== "GET" && request.method !== "HEAD") {
        return cors(json({ error: "Method not allowed" }, 405));
      }
      return cors(await handleHtml(url, env));
    } catch (error) {
      return cors(json({ error: "Request failed", message: String(error && error.message || error) }, 500));
    }
  }
};

function cors(response) {
  const headers = new Headers(response.headers);
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "GET, HEAD, POST, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  headers.set("X-Content-Type-Options", "nosniff");
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

function json(data, status) {
  return new Response(JSON.stringify(data, null, 2), {
    status: status || 200,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }
  });
}

function agentText(env) {
  return [
    "# Great House Farm Wiki — Research Mirror",
    "",
    "This is a read-only public mirror of " + SOURCE_SITE + ". It is a WordPress-shaped D1 CMS running on a Cloudflare Worker, not a PHP WordPress installation.",
    "",
    "## Reading",
    "- Public JSON catalogue: /api/content",
    "- Filter by text: /api/content?search=terms",
    "- Filter by type: /api/content?type=page",
    "- Supporting-page preview: /api/preview?path=/evidence-library/",
    "- GraphQL endpoint: POST /graphql",
    "- Agent index: /agent-index.json",
    "- Read-the-docs: /read-the-docs/",
    "",
    "## Evidence quality",
    "□ with very pale green means a paragraph was explicitly assessed as assured, based on direct concrete support.",
    "◇ with very pale amber means a paragraph was explicitly assessed as not assured or incompletely supported.",
    "Unmarked and unhighlighted means unassessed or ambiguous. No status is inferred from the mere presence of a citation.",
    "These labels represent editorial assessment, not a judicial finding. A linked artifact preview is a navigation aid, not automatic proof of the whole paragraph.",
    "",
    "## Source / provenance",
    "Original source: " + SOURCE_SITE + ". Each record preserves its original permalink, content type, ID and last-modified timestamp. Importing is read-only upstream.",
    "Current mirror title: " + (env.SITE_TITLE || "Research Mirror")
  ].join("\n");
}

function stripTags(value) {
  return String(value || "").replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ").trim();
}

function decodeEntities(value) {
  return String(value || "")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#0*39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, function(_, code) {
      try { return String.fromCodePoint(Number(code)); } catch (_) { return ""; }
    })
    .replace(/&#x([0-9a-f]+);/gi, function(_, code) {
      try { return String.fromCodePoint(parseInt(code, 16)); } catch (_) { return ""; }
    });
}

function escapeHtml(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function titleText(value) {
  return decodeEntities(stripTags(value));
}

function normalisePath(path) {
  let result = String(path || "/").split("?")[0].split("#")[0];
  if (!result.startsWith("/")) result = "/" + result;
  if (result !== "/" && !result.endsWith("/")) result += "/";
  return result;
}

function recordPath(item, type) {
  if (type === "media") return "/media/" + Number(item.id) + "/";
  try {
    const parsed = new URL(item.link || "/", SOURCE_SITE);
    return normalisePath(parsed.pathname);
  } catch (_) {
    return normalisePath("/" + (item.slug || type + "-" + item.id));
  }
}

function rendered(item, field) {
  const value = item && item[field];
  if (value && typeof value === "object" && typeof value.rendered === "string") return value.rendered;
  return typeof value === "string" ? value : "";
}

function safeImportedHtml(html) {
  return String(html || "")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, "")
    .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/(href|src)\s*=\s*(["'])\s*javascript:[\s\S]*?\2/gi, '$1="#"');
}

function rewriteContentLinks(html) {
  const safe = safeImportedHtml(html);
  return safe.replace(/\b(href|src)\s*=\s*(["'])(https?:\/\/[^"']+)\2/gi, function(all, attribute, quote, rawUrl) {
    let u;
    try { u = new URL(rawUrl); } catch (_) { return all; }
    if (u.protocol === "http:" && (u.hostname === SOURCE_HOST || u.hostname === "files.wordpress.com" || /^i[0-2]\\.wp\\.com$/.test(u.hostname))) u.protocol = "https:";
    if (u.hostname === SOURCE_HOST) {
      if (/\/wp-content\/uploads\//i.test(u.pathname)) {
        return attribute + "=" + quote + "/asset?url=" + encodeURIComponent(u.href) + quote;
      }
      if (u.pathname === "/wp-json/" || u.pathname.startsWith("/wp-json/")) return all;
      return attribute + "=" + quote + (u.pathname || "/") + u.search + u.hash + quote;
    }
    if (u.hostname === "files.wordpress.com") {
      return attribute + "=" + quote + "/asset?url=" + encodeURIComponent(u.href) + quote;
    }
    if (/^i[0-2]\.wp\.com$/.test(u.hostname) && u.pathname.startsWith("/" + SOURCE_HOST + "/wp-content/uploads/")) {
      return attribute + "=" + quote + "/asset?url=" + encodeURIComponent(u.href) + quote;
    }
    return all;
  });
}

async function handleSync(request, url, env) {
  const auth = request.headers.get("Authorization") || "";
  const queryToken = url.searchParams.get("token") || "";
  const allowed = !!env.ADMIN_TOKEN && (auth === "Bearer " + env.ADMIN_TOKEN || (request.method === "GET" && queryToken === env.ADMIN_TOKEN));
  if (!allowed) return json({ error: "Unauthorized; use Bearer ADMIN_TOKEN" }, 401);
  if (request.method !== "POST" && request.method !== "GET") return json({ error: "Use POST" }, 405);

  let input = {};
  if (request.method === "POST") {
    try { input = await request.json(); } catch (_) { return json({ error: "Request body must be JSON" }, 400); }
  }
  const type = String(input.type || url.searchParams.get("type") || "page").toLowerCase();
  const page = Math.max(1, Math.min(1000, Number(input.page || url.searchParams.get("page") || 1)));
  const endpointMap = { page: "pages", post: "posts", media: "media" };
  if (!endpointMap[type]) return json({ error: "type must be page, post, or media" }, 400);
  const source = await fetchSource(endpointMap[type], page, env);
  if (!source.ok) {
    return json({ error: "Unable to fetch source API", upstream_status: source.status, detail: source.detail, tried: source.tried }, 502);
  }
  const rows = [];
  for (const item of source.items) {
    const sourceType = type;
    const itemPath = recordPath(item, type);
    const title = titleText(rendered(item, "title") || item.slug || type + " " + item.id);
    const content = type === "media" ? safeImportedHtml(rendered(item, "description")) : safeImportedHtml(rendered(item, "content"));
    const excerpt = type === "media" ? safeImportedHtml(rendered(item, "caption")) : safeImportedHtml(rendered(item, "excerpt"));
    const sourceUrl = type === "media" ? String(item.source_url || "") : "";
    const mimeType = String(item.mime_type || "");
    const mediaType = String(item.media_type || "");
    const altText = String(item.alt_text || "");
    const caption = safeImportedHtml(rendered(item, "caption"));
    const parentId = Number(item.parent || 0);
    const menuOrder = Number(item.menu_order || 0);
    const dateGmt = String(item.date_gmt || item.date || "");
    const modifiedGmt = String(item.modified_gmt || item.modified || "");
    const status = String(item.status || "publish");
    const meta = JSON.stringify({ author: item.author || null, featured_media: item.featured_media || null, guid: item.guid && item.guid.rendered || item.guid || null, source_type: type });
    rows.push(env.DB.prepare(
      "INSERT INTO content_items (source_type, source_id, title, slug, path, content_html, excerpt_html, status, source_link, source_url, mime_type, media_type, alt_text, caption_html, parent_source_id, menu_order, date_gmt, modified_gmt, meta_json) " +
      "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) " +
      "ON CONFLICT(source_type, source_id) DO UPDATE SET title=excluded.title, slug=excluded.slug, path=excluded.path, content_html=excluded.content_html, excerpt_html=excluded.excerpt_html, status=excluded.status, source_link=excluded.source_link, source_url=excluded.source_url, mime_type=excluded.mime_type, media_type=excluded.media_type, alt_text=excluded.alt_text, caption_html=excluded.caption_html, parent_source_id=excluded.parent_source_id, menu_order=excluded.menu_order, date_gmt=excluded.date_gmt, modified_gmt=excluded.modified_gmt, meta_json=excluded.meta_json"
    ).bind(sourceType, Number(item.id), title, String(item.slug || ""), itemPath, content, excerpt, status, String(item.link || ""), sourceUrl, mimeType, mediaType, altText, caption, parentId, menuOrder, dateGmt, modifiedGmt, meta));
  }
  if (rows.length) await env.DB.batch(rows);
  return json({
    ok: true,
    type: type,
    page: page,
    imported_this_page: rows.length,
    upstream_total: source.total,
    upstream_total_pages: source.totalPages,
    has_more: page < source.totalPages,
    source_api: source.sourceUrl,
    note: "Repeat with the next page number until has_more is false. The source site was only read."
  });
}

async function fetchSource(endpoint, page, env) {
  const params = "status=publish&per_page=100&page=" + page + "&_fields=" + encodeURIComponent(WP_API_FIELDS);
  const urls = [
    SOURCE_SITE + "/wp-json/wp/v2/" + endpoint + "?" + params,
    "https://public-api.wordpress.com/wp/v2/sites/greathousefarmwiki.wordpress.com/" + endpoint + "?" + params
  ];
  const tried = [];
  let lastStatus = 0;
  let lastDetail = "";
  for (const target of urls) {
    try {
      const response = await fetch(target, { headers: { "Accept": "application/json", "User-Agent": "ResearchWikiMirror/0.1 (+read-only migration)" }, cf: { cacheTtl: 0 } });
      tried.push({ url: target, status: response.status });
      if (!response.ok) {
        lastStatus = response.status;
        lastDetail = (await response.text()).slice(0, 400);
        continue;
      }
      const data = await response.json();
      if (!Array.isArray(data)) {
        lastStatus = response.status;
        lastDetail = "API response was not a collection";
        continue;
      }
      const total = Number(response.headers.get("X-WP-Total") || data.length || 0);
      const totalPages = Number(response.headers.get("X-WP-TotalPages") || (data.length === 100 ? page + 1 : page));
      return { ok: true, items: data, total: total, totalPages: totalPages, sourceUrl: target, tried: tried };
    } catch (error) {
      lastStatus = 0;
      lastDetail = String(error && error.message || error);
      tried.push({ url: target, error: lastDetail });
    }
  }
  return { ok: false, status: lastStatus, detail: lastDetail, tried: tried };
}

async function handleContentIndex(url, env) {
  const type = String(url.searchParams.get("type") || "").toLowerCase();
  const search = String(url.searchParams.get("search") || "").trim();
  const page = Math.max(1, Number(url.searchParams.get("page") || 1));
  const perPage = Math.max(1, Math.min(100, Number(url.searchParams.get("per_page") || 100)));
  const offset = (page - 1) * perPage;
  const conditions = ["status = 'publish'"];
  const binds = [];
  if (type && ["page", "post", "media"].includes(type)) { conditions.push("source_type = ?"); binds.push(type); }
  if (search) {
    conditions.push("(title LIKE ? OR excerpt_html LIKE ? OR content_html LIKE ? OR slug LIKE ?)");
    const q = "%" + search.slice(0, 150) + "%";
    binds.push(q, q, q, q);
  }
  const where = conditions.join(" AND ");
  const countRow = await env.DB.prepare("SELECT COUNT(*) AS total FROM content_items WHERE " + where).bind(...binds).first();
  const query = "SELECT source_type, source_id, title, slug, path, excerpt_html, source_link, source_url, mime_type, media_type, alt_text, parent_source_id, date_gmt, modified_gmt, meta_json FROM content_items WHERE " + where + " ORDER BY CASE source_type WHEN 'page' THEN 0 WHEN 'post' THEN 1 ELSE 2 END, menu_order ASC, title COLLATE NOCASE ASC LIMIT ? OFFSET ?";
  const result = await env.DB.prepare(query).bind(...binds, perPage, offset).all();
  return json({
    site: env.SITE_TITLE || "Research Mirror",
    source: SOURCE_SITE,
    total: countRow ? countRow.total : 0,
    page: page,
    per_page: perPage,
    items: (result.results || []).map(function(row) {
      return {
        type: row.source_type,
        id: row.source_id,
        title: row.title,
        slug: row.slug,
        path: row.path,
        url: row.source_type === "media" ? row.path : row.path,
        source_url: row.source_url || undefined,
        source_link: row.source_link,
        archive_url: row.source_type === "media" ? (parseJson(row.meta_json).archive_url || undefined) : undefined,
        discovered_by: row.source_type === "media" ? (parseJson(row.meta_json).discovered_by || undefined) : undefined,
        excerpt: stripTags(row.excerpt_html),
        mime_type: row.mime_type || undefined,
        media_type: row.media_type || undefined,
        alt_text: row.alt_text || undefined,
        parent_source_id: row.parent_source_id,
        date: row.date_gmt,
        modified: row.modified_gmt
      };
    })
  });
}

async function handleContentItem(url, env) {
  const key = decodeURIComponent(url.pathname.slice("/api/content/".length));
  const row = await env.DB.prepare("SELECT * FROM content_items WHERE path = ? AND status = 'publish' LIMIT 1").bind(normalisePath(key)).first();
  if (!row) return json({ error: "Not found" }, 404);
  return json({
    type: row.source_type, id: row.source_id, title: row.title, slug: row.slug, path: row.path,
    content_html: row.content_html, excerpt_html: row.excerpt_html, source_link: row.source_link,
    source_url: row.source_url || undefined, modified: row.modified_gmt, date: row.date_gmt,
    parent_source_id: row.parent_source_id, meta: parseJson(row.meta_json)
  });
}

async function handlePreview(url, env) {
  const rawPath = String(url.searchParams.get("path") || "/");
  const path = normalisePath(rawPath);
  const row = await env.DB.prepare("SELECT source_type, source_id, title, path, excerpt_html, content_html, source_link, source_url, mime_type FROM content_items WHERE path = ? AND status = 'publish' LIMIT 1").bind(path).first();
  if (!row) {
    const mediaUrl = url.searchParams.get("url");
    if (mediaUrl) return json({ found: true, type: "external-artifact", title: "Linked artifact", excerpt: "The paragraph links to this source artifact. Open it to inspect the original item.", url: mediaUrl });
    return json({ found: false, path: path }, 404);
  }
  const excerpt = stripTags(row.excerpt_html) || stripTags(row.content_html).slice(0, 900);
  return json({
    found: true, type: row.source_type, id: row.source_id, title: row.title,
    excerpt: excerpt.slice(0, 900), path: row.path,
    url: row.source_type === "media" ? "/media/" + row.source_id + "/" : row.path,
    mime_type: row.mime_type || undefined,
    source_link: row.source_link
  });
}

async function handleMedia(url, env) {
  const idText = url.pathname.split("/").filter(Boolean)[1];
  const id = Number(idText);
  if (!Number.isInteger(id) || id < 1) return json({ error: "Invalid media id" }, 400);
  const row = await env.DB.prepare("SELECT source_id, title, source_url, mime_type, alt_text, caption_html, source_link FROM content_items WHERE source_type='media' AND source_id=? AND status='publish' LIMIT 1").bind(id).first();
  if (!row) return json({ error: "Media record not found" }, 404);
  if (!row.source_url) return json({ error: "Media metadata exists but the source has no binary URL" }, 404);
  return Response.redirect(new URL("/asset?url=" + encodeURIComponent(row.source_url), url.origin).toString(), 302);
}

function isAllowedArchiveAssetUrl(target) {
  if (target.protocol !== "https:" || target.hostname !== "web.archive.org") return false;
  if (!target.pathname.startsWith("/web/")) return false;
  const rest = target.pathname.slice("/web/".length);
  const slash = rest.indexOf("/");
  if (slash < 0) return false;
  const capture = rest.slice(0, slash);
  if (!capture.endsWith("id_")) return false;
  const stamp = capture.slice(0, -3);
  if (stamp.length < 8 || stamp.length > 14) return false;
  for (const ch of stamp) if (ch < "0" || ch > "9") return false;
  const original = rest.slice(slash + 1);
  return original.startsWith("https://" + SOURCE_HOST + "/wp-content/uploads/");
}

async function fetchWaybackFallback(env, originalUrl, headers) {
  const row = await env.DB.prepare("SELECT meta_json FROM content_items WHERE source_type='media' AND source_url=? AND status='publish' LIMIT 1").bind(originalUrl).first();
  if (!row) return null;
  const metadata = parseJson(row.meta_json);
  if (!metadata || !metadata.archive_url) return null;
  let archive;
  try { archive = new URL(metadata.archive_url); } catch (_) { return null; }
  if (!isAllowedArchiveAssetUrl(archive)) return null;
  const response = await fetch(archive.toString(), { headers: headers, redirect: "follow", cf: { cacheTtl: 86400, cacheEverything: true } });
  return response.ok || response.status === 206 ? response : null;
}

async function handleAsset(url, env) {
  const raw = url.searchParams.get("url") || "";
  let target;
  try { target = new URL(raw); } catch (_) { return json({ error: "Invalid asset URL" }, 400); }
  const onUploads = target.hostname === SOURCE_HOST && target.pathname.startsWith("/wp-content/uploads/");
  const onWpFiles = target.hostname === "files.wordpress.com";
  const onWpImage = /^i[0-2]\\.wp\\.com$/.test(target.hostname) && target.pathname.startsWith("/" + SOURCE_HOST + "/wp-content/uploads/");
  const onArchive = isAllowedArchiveAssetUrl(target);
  if (target.protocol !== "https:" || !(onUploads || onWpFiles || onWpImage || onArchive)) {
    return json({ error: "Asset host/path not allowlisted" }, 403);
  }
  const forwardedHeaders = new Headers();
  const range = url.searchParams.get("range");
  if (range) forwardedHeaders.set("Range", range);
  let upstream = null;
  let upstreamError = null;
  let servedFrom = target.hostname;
  let waybackFallback = onArchive;
  try {
    upstream = await fetch(target.toString(), { headers: forwardedHeaders, redirect: "follow", cf: { cacheTtl: 86400, cacheEverything: true } });
  } catch (error) {
    upstreamError = error;
  }
  if ((!upstream || (!upstream.ok && upstream.status !== 206)) && !onArchive) {
    try {
      const backup = await fetchWaybackFallback(env, target.href, forwardedHeaders);
      if (backup) { upstream = backup; servedFrom = "web.archive.org"; waybackFallback = true; upstreamError = null; }
    } catch (error) { upstreamError = error; }
  }
  if (!upstream) {
    return json({ error: "Upstream media unavailable", detail: String(upstreamError && upstreamError.message || upstreamError || "no response") }, 502);
  }
  if (!upstream.ok && upstream.status !== 206) return new Response("Source asset unavailable (" + upstream.status + ")", { status: upstream.status, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  const headers = new Headers(upstream.headers);
  headers.set("Cache-Control", "public, max-age=3600, s-maxage=86400");
  headers.set("X-Research-Source", servedFrom);
  if (waybackFallback) headers.set("X-Research-Fallback", "Internet Archive Wayback Machine");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.delete("Set-Cookie");
  return new Response(upstream.body, { status: upstream.status, statusText: upstream.statusText, headers: headers });
}
async function handleSitemap(url, env) {
  const { results } = await env.DB.prepare("SELECT path, modified_gmt FROM content_items WHERE status='publish' AND source_type IN ('page','post') ORDER BY path LIMIT 5000").all();
  const base = "https://" + url.host;
  const links = (results || []).map(function(row) {
    return "<url><loc>" + escapeHtml(base + row.path) + "</loc>" + (row.modified_gmt ? "<lastmod>" + escapeHtml(row.modified_gmt) + "</lastmod>" : "") + "</url>";
  }).join("");
  return new Response('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + links + "</urlset>", { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}

async function handleHtml(url, env) {
  const path = normalisePath(url.pathname);
  if (path === "/graphql/" || path === "/graphql") return new Response("Use /graphql", { status: 400 });
  if (path === "/search/") return await handleSearchHtml(url, env);
  let row = await env.DB.prepare("SELECT * FROM content_items WHERE path = ? AND status='publish' AND source_type IN ('page','post') LIMIT 1").bind(path).first();
  if (!row && path === "/") {
    row = await env.DB.prepare("SELECT * FROM content_items WHERE source_type='page' AND slug='main-page' AND status='publish' LIMIT 1").first();
  }
  if (row) {
    const title = titleText(row.title);
    const content = rewriteContentLinks(row.content_html);
    const readerDocs = path === "/read-the-docs/" ? qualityDocs() : "";
    const body = '<article class="article" data-source-type="' + escapeHtml(row.source_type) + '" data-source-id="' + Number(row.source_id) + '">' +
      '<h1>' + escapeHtml(title) + '</h1>' +
      '<p class="meta">' + escapeHtml(row.source_type) + ' · Updated ' + escapeHtml(row.modified_gmt || row.date_gmt || "date not supplied") +
      ' · <a href="' + escapeHtml(row.source_link || SOURCE_SITE) + '">Original source</a></p>' +
      '<div class="content">' + content + '</div>' + readerDocs + '</article>' +
      (path === "/" ? await browseIndex(env) : '<p class="back"><a href="/">Browse mirror index</a></p>');
    return html(htmlShell(title + " — " + (env.SITE_TITLE || "Research Mirror"), body, env));
  }

  if (path === "/") {
    return html(htmlShell(env.SITE_TITLE || "Great House Farm Wiki — Research Mirror", '<h1>' + escapeHtml(env.SITE_TITLE || "Great House Farm Wiki — Research Mirror") + '</h1><p>This is the isolated serverless mirror. The source wiki has not been modified.</p>' + await browseIndex(env), env));
  }
  return html(htmlShell("Not found — " + (env.SITE_TITLE || "Research Mirror"), '<h1>Not found</h1><p>No published mirror page matches <code>' + escapeHtml(path) + '</code>.</p><p><a href="/">Browse the index</a></p>', env), 404);
}

async function browseIndex(env) {
  const { results } = await env.DB.prepare("SELECT title, path, source_type, excerpt_html, menu_order FROM content_items WHERE status='publish' AND source_type IN ('page','post') ORDER BY CASE WHEN path='/' THEN 0 ELSE 1 END, menu_order ASC, title COLLATE NOCASE ASC LIMIT 1000").all();
  if (!results || !results.length) return '<section><h2>Browse the mirror</h2><p>No content has been imported yet. Run the authenticated importer described in the deployment README.</p></section>';
  return '<section class="browse-index"><h2>Browse the mirror</h2><form action="/search/" method="get"><label for="q">Search pages and posts</label> <input id="q" name="q" type="search" placeholder="Search the wiki" /><button type="submit">Search</button></form><ol>' +
    results.map(function(item) {
      const title = titleText(item.title);
      const excerpt = stripTags(item.excerpt_html);
      return '<li><a href="' + escapeHtml(item.path) + '">' + escapeHtml(title) + '</a>' + (excerpt ? '<p class="index-excerpt">' + escapeHtml(excerpt.slice(0, 300)) + '</p>' : '') + '</li>';
    }).join("") + '</ol></section>';
}

async function handleSearchHtml(url, env) {
  const q = String(url.searchParams.get("q") || "").trim().slice(0, 150);
  if (!q) return html(htmlShell("Search — Research Mirror", '<h1>Search the wiki</h1><form action="/search/" method="get"><input name="q" type="search" /><button>Search</button></form><p><a href="/">Return home</a></p>', env));
  const like = "%" + q + "%";
  const { results } = await env.DB.prepare("SELECT title, path, source_type, excerpt_html FROM content_items WHERE status='publish' AND source_type IN ('page','post') AND (title LIKE ? OR slug LIKE ? OR content_html LIKE ? OR excerpt_html LIKE ?) ORDER BY title COLLATE NOCASE LIMIT 100").bind(like, like, like, like).all();
  const items = (results || []).map(function(item) {
    return '<li><a href="' + escapeHtml(item.path) + '">' + escapeHtml(titleText(item.title)) + '</a><p class="index-excerpt">' + escapeHtml(stripTags(item.excerpt_html).slice(0, 350)) + '</p></li>';
  }).join("");
  return html(htmlShell("Search: " + q, '<h1>Search results</h1><p>Query: ' + escapeHtml(q) + '</p><ol>' + (items || '<li>No results.</li>') + '</ol><p><a href="/">Return home</a></p>', env));
}

function qualityDocs() {
  return '<section id="research-quality-standard" class="quality-docs"><h2>Evidence-quality display standard</h2>' +
    '<p><span class="quality-key assured">□ Assured</span> — explicitly reviewed and directly supported by concrete, uncontested artifacts. Pale green.</p>' +
    '<p><span class="quality-key not-assured">◇ Not assured</span> — support is incomplete, indirect, contested or not conclusive. Pale amber.</p>' +
    '<p><span class="quality-key unassessed">Unmarked / unhighlighted</span> — ambiguous or not yet assessed. It must not be interpreted as either proof or disproof.</p>' +
    '<p>A citation alone does not establish that the source supports every clause. Allegations and working theories must remain clearly qualified. Status is paragraph-specific and editorial, not an official or judicial determination.</p>' +
    '<p>Hover over or focus a paragraph that links to a mirrored page to preview that page. The preview is a navigation aid; a reviewer must still check whether the artifact directly supports the statement.</p></section>';
}

function htmlShell(title, body, env) {
  const siteTitle = env && env.SITE_TITLE || "Great House Farm Wiki — Research Mirror";
  const footer = '<footer class="site-footer"><p class="quality-legend"><strong>Evidence-status standard:</strong> <span class="assured-inline">□ Assured</span> (very pale green, direct and concrete support); <span class="not-assured-inline">◇ Not assured</span> (very pale amber, support incomplete or inconclusive); unmarked text is ambiguous or unassessed and remains unhighlighted.</p>' +
    '<p>Research mirror of <a href="' + SOURCE_SITE + '">' + SOURCE_HOST + '</a>. Editorial status is not a legal finding. Agent guide: <a href="/llms.txt">/llms.txt</a> · <a href="/agent-index.json">machine-readable index</a> · <a href="/read-the-docs/">Read the docs</a>.</p></footer>';
  return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="index,follow"><title>' + escapeHtml(title) + '</title>' +
    '<style>' +
    ' :root{color-scheme:light;--assured:#f6fcf4;--assured-mark:#c7e8bd;--notassured:#fffaf1;--notassured-mark:#f2d6aa;--line:#e7e4dd;--ink:#222;--muted:#6b6b6b}' +
    ' *{box-sizing:border-box}body{font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;max-width:76rem;margin:0 auto;padding:1.25rem;line-height:1.62;color:var(--ink);background:#fff}a{color:#184e8a}img,video,iframe{max-width:100%}img{height:auto}.content{overflow-wrap:anywhere}.content table{border-collapse:collapse;max-width:100%;display:block;overflow:auto}.content th,.content td{border:1px solid var(--line);padding:.4rem}.meta{font-size:.83rem;color:var(--muted);border-bottom:1px solid var(--line);padding-bottom:.75rem}.article h1{line-height:1.2}.content p[data-evidence-status="assured"],.content li[data-evidence-status="assured"],.content blockquote[data-evidence-status="assured"]{background:var(--assured);border-radius:2px}.content p[data-evidence-status="not-assured"],.content li[data-evidence-status="not-assured"],.content blockquote[data-evidence-status="not-assured"]{background:var(--notassured);border-radius:2px}.quality-marker{display:inline-block;font-weight:700;font-size:.86em;margin-right:.42em;padding:0 .1em;user-select:none}.quality-marker.assured,.assured-inline,.quality-key.assured{background:var(--assured-mark)}.quality-marker.not-assured,.not-assured-inline,.quality-key.not-assured{background:var(--notassured-mark)}.content p[data-evidence-status="assured"] .quality-marker,.content p[data-evidence-status="not-assured"] .quality-marker{opacity:.9}.quality-key{padding:.08rem .25rem;border-radius:2px}.quality-key.unassessed{border-bottom:1px dotted #999}.quality-docs{border-top:1px solid var(--line);margin-top:2rem;padding-top:1rem}.site-footer{border-top:1px solid var(--line);margin-top:3rem;padding-top:1rem;font-size:.76rem;color:#565656}.site-footer p{margin:.4rem 0}.quality-legend{background:#fff}.browse-index{margin-top:2rem;border-top:1px solid var(--line);padding-top:1rem}.browse-index li{margin:.8rem 0}.index-excerpt{font-size:.9rem;color:var(--muted);margin:.1rem 0}.back{margin-top:2rem}.preview-modal{position:fixed;z-index:10000;right:1rem;bottom:1rem;width:min(27rem,calc(100vw - 2rem));max-height:65vh;overflow:auto;background:#fff;border:1px solid #c9c9c9;border-radius:.45rem;box-shadow:0 8px 32px #0002;padding:1rem}.preview-modal[hidden]{display:none}.preview-modal h2{font-size:1rem;margin:.1rem 0 .5rem}.preview-modal p{font-size:.9rem;margin:.4rem 0}.preview-modal .preview-actions{display:flex;justify-content:space-between;align-items:center;margin-top:.6rem}.preview-modal button{border:1px solid #aaa;background:#f7f7f7;padding:.35rem .6rem;border-radius:.25rem;cursor:pointer}form input{max-width:70%;padding:.5rem;border:1px solid #bbb;border-radius:.25rem}button{padding:.5rem .75rem;border:1px solid #bbb;border-radius:.25rem;background:#f5f5f5}@media(max-width:600px){body{padding:.85rem}.site-footer{font-size:.72rem}}' +
    '</style></head><body><header><a href="/" aria-label="Mirror home" style="text-decoration:none;color:inherit"><small>' + escapeHtml(siteTitle) + '</small></a></header><main>' + body + '</main>' + footer +
    '<aside id="evidence-preview" class="preview-modal" role="dialog" aria-live="polite" aria-label="Linked evidence preview" hidden><div class="preview-actions"><strong>Linked evidence preview</strong><button type="button" id="preview-close" aria-label="Close preview">Close</button></div><h2 id="preview-title"></h2><p id="preview-body"></p><div class="preview-actions"><a id="preview-link" href="#">Open page / artifact</a></div></aside>' +
    '<script>' +
    '(function(){' +
    'var box=document.getElementById("evidence-preview"),title=document.getElementById("preview-title"),body=document.getElementById("preview-body"),link=document.getElementById("preview-link"),close=document.getElementById("preview-close"),active=null,timer=null;' +
    'if(!box)return;' +
    'function hide(){box.hidden=true;active=null;} close.addEventListener("click",hide);' +
    'function mark(p){var s=p.getAttribute("data-evidence-status");if(!s){if(p.classList.contains("evidence-assured"))s="assured";else if(p.classList.contains("evidence-not-assured"))s="not-assured";}if(s!=="assured"&&s!=="not-assured")return;if(p.querySelector(".quality-marker"))return;var m=document.createElement("span");m.className="quality-marker "+(s==="assured"?"assured":"not-assured");m.textContent=s==="assured"?"□":"◇";m.setAttribute("aria-label",s==="assured"?"Assessed assured":"Assessed not assured");p.insertBefore(m,p.firstChild);}' +
    'function localEvidenceHref(a){try{var u=new URL(a.href,location.href);if(u.origin===location.origin&&u.pathname!==location.pathname&&u.pathname!=="/api/preview")return u.pathname;if(u.pathname.startsWith("/asset"))return u.pathname+u.search;}catch(e){}return null;}' +
    'async function preview(p){if(active===p)return;var a=p.querySelector("a[href]");if(!a)return;var target=localEvidenceHref(a);if(!target)return;active=p;try{var endpoint;if(target.startsWith("/asset")){var u=new URL(target,location.href).searchParams.get("url")||a.href;endpoint="/api/preview?url="+encodeURIComponent(u);}else{endpoint="/api/preview?path="+encodeURIComponent(target);}var r=await fetch(endpoint,{headers:{"Accept":"application/json"}});if(!r.ok)return;var d=await r.json();if(!d.found)return;title.textContent=d.title||"Linked page";body.textContent=d.excerpt||"Open the linked page to inspect its contents.";link.href=d.url||target;box.hidden=false;}catch(e){}}' +
    'document.querySelectorAll(".content p,.content li,.content blockquote").forEach(function(p){mark(p);p.addEventListener("mouseenter",function(){clearTimeout(timer);timer=setTimeout(function(){preview(p);},320);});p.addEventListener("focusin",function(){preview(p);});p.addEventListener("mouseup",function(){var sel=String(window.getSelection?window.getSelection():"").trim();if(sel.length>8)preview(p);});});' +
    'box.addEventListener("mouseenter",function(){clearTimeout(timer);});document.addEventListener("keydown",function(e){if(e.key==="Escape")hide();});' +
    '})();' +
    '</script></body></html>';
}

function html(body, status) {
  return new Response(body, { status: status || 200, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
}

function parseJson(value) {
  try { return JSON.parse(value || "{}"); } catch (_) { return {}; }
}

async function handleGraphQL(request, env) {
  if (request.method === "GET") {
    return html('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Research GraphQL</title></head><body style="font-family:system-ui;max-width:48rem;margin:2rem auto;padding:1rem"><h1>Research GraphQL</h1><p>POST JSON with a WP-shaped query to this endpoint. Example:</p><pre>{"query":"query { posts(status: PUBLISH, first: 10) { nodes { id title slug content excerpt date } } }"}</pre><p><a href="/api/content">Browse the public JSON catalogue</a></p></body></html>');
  }
  if (request.method !== "POST") return json({ errors: [{ message: "Use POST for GraphQL" }] }, 405);
  let body;
  try { body = await request.json(); } catch (_) { return json({ errors: [{ message: "Invalid JSON" }] }, 400); }
  const query = String(body.query || "");
  const q = query.replace(/\s+/g, " ");
  try {
    const one = q.match(/\b(page|post)\s*\(\s*slug\s*:\s*["']([^"']+)["']\s*\)/i);
    if (one) {
      const row = await env.DB.prepare("SELECT * FROM content_items WHERE slug=? AND source_type=? AND status='publish' LIMIT 1").bind(one[2], one[1].toLowerCase()).first();
      return json({ data: { [one[1].toLowerCase()]: row ? graphqlRow(row) : null } });
    }
    if (/\b(pages|posts|contentItems)\b/.test(q)) {
      const type = /\bpages\b/.test(q) ? "page" : (/\bposts\b/.test(q) ? "post" : "");
      const statusMatch = q.match(/status\s*:\s*(\w+)/i);
      const status = statusMatch ? statusMatch[1].toLowerCase() : "publish";
      const firstMatch = q.match(/first\s*:\s*(\d+)/i);
      const first = Math.max(1, Math.min(100, Number(firstMatch ? firstMatch[1] : 20)));
      let sql = "SELECT * FROM content_items WHERE status=? ";
      const binds = [status];
      if (type) { sql += "AND source_type=? "; binds.push(type); }
      sql += "ORDER BY date_gmt DESC LIMIT ?";
      binds.push(first);
      const rows = await env.DB.prepare(sql).bind(...binds).all();
      const nodes = (rows.results || []).map(graphqlRow);
      if (type === "page") return json({ data: { pages: { nodes: nodes } } });
      if (type === "post") return json({ data: { posts: { nodes: nodes } } });
      return json({ data: { contentItems: { nodes: nodes } } });
    }
    return json({ errors: [{ message: "Supported: page(slug), post(slug), pages, posts or contentItems" }] }, 400);
  } catch (error) {
    return json({ errors: [{ message: String(error && error.message || error) }] }, 400);
  }
}

function graphqlRow(row) {
  return { id: String(row.source_id), title: row.title, slug: row.slug, path: row.path, content: row.content_html, excerpt: row.excerpt_html, status: row.status, postType: row.source_type, date: row.date_gmt, modified: row.modified_gmt, sourceLink: row.source_link };
}