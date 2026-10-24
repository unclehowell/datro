/**
 * Research — isolated serverless mirror of the Great House Farm WordPress.com wiki.
 * Runs as a Cloudflare Worker with its own D1 database. It never writes upstream.
 */
import { LANDING_CSS, LANDING_TITLE, LANDING_HTML, STATIC_PAGES, ADDENDA } from "./landing.js";
const SOURCE_SITE = "https://greathousefarmwiki.wordpress.com";
// Drafts pipeline panel on the landing page (Hive promotion pyramid; data https://hive.bucklerfamily.estate/hive.json, CORS *). — Sion's Tab agent
const HIVE_PIPELINE_HTML = '<div class="landing-block" style="padding-left:.6rem" data-hive-pipeline="full"><p><a href="https://hive.bucklerfamily.estate/">Drafts pipeline: open the Hive</a></p></div><script src="/hive-pipeline.js" defer></script>';
const FRESH_SECONDS = 300;
const SOURCE_HOST = "greathousefarmwiki.wordpress.com";
const WP_API_FIELDS = "id,slug,link,title,content,excerpt,date,date_gmt,modified,modified_gmt,status,parent,menu_order,author,featured_media,source_url,media_type,mime_type,alt_text,caption,description,post";

const app = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") {
      return cors(new Response(null, { status: 204 }));
    }
    try {
      // Hive drafts pipeline widget (promotion tiers, metadata only), same-origin copy of https://hive.bucklerfamily.estate/pipeline.js. — Sion's Tab agent
      if (url.pathname === "/hive-pipeline.js") {
        for (const src of ["https://hive.bucklerfamily.estate/pipeline.js", "https://raw.githubusercontent.com/unclehowell/datro/watch/worker/pipeline.js"]) {
          try {
            const r = await fetch(src, { cf: { cacheTtl: 60, cacheEverything: true } });
            if (r.ok) return cors(new Response(r.body, { status: 200, headers: { "Content-Type": "application/javascript; charset=utf-8", "Cache-Control": "public, max-age=60" } }));
          } catch (e) {}
        }
        return cors(new Response("/* pipeline unavailable */", { status: 502, headers: { "Content-Type": "application/javascript; charset=utf-8" } }));
      }
      if (url.pathname === "/health") {
        const count = await env.DB.prepare("SELECT COUNT(*) AS count FROM content_items WHERE status = 'publish'").first();
        const grouped = await env.DB.prepare("SELECT source_type, COUNT(*) AS count FROM content_items WHERE status = 'publish' GROUP BY source_type").all();
        const publishedByType = {};
        for (const row of (grouped.results || [])) publishedByType[row.source_type] = row.count;
        const cursorRow = await env.DB.prepare("SELECT value FROM migration_state WHERE key='auto_import_cursor'").first();
        const completedRow = await env.DB.prepare("SELECT value FROM migration_state WHERE key='auto_import_completed_at'").first();
        const noteRow = await env.DB.prepare("SELECT value FROM migration_state WHERE key='auto_import_completion_note'").first();
        return cors(json({
          ok: true,
          service: "research-wp",
          environment: env.ENVIRONMENT || "unknown",
          published_records: count ? count.count : 0,
          published_by_type: publishedByType,
          migration_cursor: cursorRow ? cursorRow.value : "not-started",
          import_completed_at: completedRow ? completedRow.value : null,
          import_completion_note: noteRow ? noteRow.value : null
        }));
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

const WAYBACK_MEDIA = {"2026/10/2026-05-28_rcahmw_rc26-0205_les17-licence-fees-2026.pdf": "https://wayback.bucklerfamily.estate/pdf/foi/2026-05-28_rcahmw_rc26-0205_les17-licence-fees-2026.pdf","2026/10/2026-06-11_welsh-government_atisn-27021_doc2-1988-07-29-barn-survey-photo.pdf": "https://wayback.bucklerfamily.estate/pdf/foi/2026-06-11_welsh-government_atisn-27021_doc2-1988-07-29-barn-survey-photo.pdf","2026/10/2026-06-11_welsh-government_atisn-27021_doc1-1988-07-29-farmhouse-survey-photo.pdf": "https://wayback.bucklerfamily.estate/pdf/foi/2026-06-11_welsh-government_atisn-27021_doc1-1988-07-29-farmhouse-survey-photo.pdf","2026/10/2026-06-11_welsh-government_atisn-27021_response-letter-r2.pdf": "https://wayback.bucklerfamily.estate/pdf/foi/2026-06-11_welsh-government_atisn-27021_response-letter.pdf","2026/10/2026-04-27_moj_to130237_reply-r.pdf": "https://wayback.bucklerfamily.estate/pdf/foi/2026-04-27_moj_to130237_reply.pdf","2026/10/2026-04-13_hmlr_foi-f260213_response.pdf": "https://wayback.bucklerfamily.estate/pdf/foi/2026-04-13_hmlr_foi-f260213_response.pdf","2026/10/2026-02-26_tna_hmc-9-311_llandough-manor-return.jpg": "https://wayback.bucklerfamily.estate/pdf/foi/2026-02-26_tna_hmc-9-311_llandough-manor-return.jpg","2026/10/2026-08-19_dcms_ir2026-06711_response-r2.pdf": "https://wayback.bucklerfamily.estate/pdf/foi/2026-08-19_dcms_ir2026-06711_response.pdf","2026/10/2026-07-22_dcms_foi2026-06174_response-r2.pdf": "https://wayback.bucklerfamily.estate/pdf/foi/2026-07-22_dcms_foi2026-06174_response.pdf","2026/10/2026-08-10_ico_ic-546505-w6p0_letter-r.pdf": "https://wayback.bucklerfamily.estate/pdf/foi/2026-08-10_ico_ic-546505-w6p0_letter.pdf","2026/10/2026-07-13_hmlr_n610cgv_letter-r.pdf": "https://wayback.bucklerfamily.estate/pdf/foi/2026-07-13_hmlr_n610cgv_letter.pdf","2026/10/2026-09-09_moj_260813002_foi-ir-extension-letter-r.pdf": "https://wayback.bucklerfamily.estate/pdf/foi/2026-09-09_moj_260813002_foi-ir-extension-letter.pdf","2026/10/2026-08-12_moj_260805002_foia-response-r.pdf": "https://wayback.bucklerfamily.estate/pdf/foi/2026-08-12_moj_260805002_foia-response.pdf","2026/10/2026-09-30_glamorgan-archives_bute-10.doc": "https://wayback.bucklerfamily.estate/pdf/foi/2026-09-30_glamorgan-archives_bute-10.doc","2026/10/2026-09-07_glamorgan-archives_digital-photography-order-form-2025.docx": "https://wayback.bucklerfamily.estate/pdf/foi/2026-09-07_glamorgan-archives_digital-photography-order-form-2025.docx","2026/10/2026-09-22_wales-office_26foi-103_response-r2.pdf": "https://wayback.bucklerfamily.estate/pdf/foi/2026-09-22_wales-office_26foi-103_response.pdf","2026/10/2026-09-29_rcahmw_rc26-0375_les16-price-list-2026.pdf": "https://wayback.bucklerfamily.estate/pdf/foi/2026-09-29_rcahmw_rc26-0375_les16-price-list-2026.pdf","2026/10/2026-09-29_rcahmw_rc26-0375_les08-order-form-2023.docx": "https://wayback.bucklerfamily.estate/pdf/foi/2026-09-29_rcahmw_rc26-0375_les08-order-form-2023.docx","2026/10/2026-05-28_rcahmw_rc26-0205_les08-order-form-2021.docx": "https://wayback.bucklerfamily.estate/pdf/foi/2026-05-28_rcahmw_rc26-0205_les08-order-form-2021.docx","2026/10/2026-05-28_rcahmw_rc26-0205_les16-price-list-2026.pdf": "https://wayback.bucklerfamily.estate/pdf/foi/2026-05-28_rcahmw_rc26-0205_les16-price-list-2026.pdf","2026/10/2026-07-24_post-office_foi2026-00751_response-r.pdf": "https://wayback.bucklerfamily.estate/pdf/foi/2026-07-24_post-office_foi2026-00751_response.pdf"};
// Wiki uploads that have a verified copy on wayback.bucklerfamily.estate (checked 24 Oct 2026: type not HTML, size matches the wiki file) link there, so they keep working when the wiki retires.
function waybackFor(u) {
  try {
    const m = String(u.pathname || "").match(/(\d{4}\/\d{2}\/[^\/]+)$/);
    if (!m) return "";
    const k = decodeURIComponent(m[1]).toLowerCase();
    return WAYBACK_MEDIA[k] || WAYBACK_MEDIA[k.replace(/-\d{2,5}x\d{2,5}(\.[a-z0-9]+)$/, "$1")] || "";
  } catch (_) { return ""; }
}

function rewriteContentLinks(html) {
  const safe = safeImportedHtml(html);
  return safe.replace(/\b(href|src)\s*=\s*(["'])(https?:\/\/[^"']+)\2/gi, function(all, attribute, quote, rawUrl) {
    let u;
    try { u = new URL(rawUrl); } catch (_) { return all; }
    if (u.protocol === "http:" && (u.hostname === SOURCE_HOST || u.hostname === "files.wordpress.com" || /^i[0-2]\\.wp\\.com$/.test(u.hostname))) u.protocol = "https:";
    if (u.hostname === SOURCE_HOST) {
      if (/\/wp-content\/uploads\//i.test(u.pathname)) {
        return attribute + "=" + quote + (waybackFor(u) || "/asset?url=" + encodeURIComponent(u.href)) + quote;
      }
      if (u.pathname === "/wp-json/" || u.pathname.startsWith("/wp-json/")) return all;
      return attribute + "=" + quote + (u.pathname || "/") + u.search + u.hash + quote;
    }
    if (u.hostname === "files.wordpress.com") {
      return attribute + "=" + quote + (waybackFor(u) || "/asset?url=" + encodeURIComponent(u.href)) + quote;
    }
    if (/^i[0-2]\.wp\.com$/.test(u.hostname) && u.pathname.startsWith("/" + SOURCE_HOST + "/wp-content/uploads/")) {
      return attribute + "=" + quote + (waybackFor(u) || "/asset?url=" + encodeURIComponent(u.href)) + quote;
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
    items: visibleRows(result.results).map(function(row) {
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
  if (!row || WITHDRAWN_PATHS.has(row.path)) return json({ error: "Not found" }, 404);
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
  if (!row || WITHDRAWN_PATHS.has(row.path)) {
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
  let canonical;
  try {
    canonical = new URL(originalUrl);
    canonical.search = "";
    canonical.hash = "";
  } catch (_) {
    return null;
  }
  const row = await env.DB.prepare("SELECT meta_json FROM content_items WHERE source_type='media' AND source_url IN (?, ?) AND status='publish' LIMIT 1").bind(canonical.href, originalUrl).first();
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
  const links = visibleRows(results).map(function(row) {
    return "<url><loc>" + escapeHtml(base + row.path) + "</loc>" + (row.modified_gmt ? "<lastmod>" + escapeHtml(row.modified_gmt) + "</lastmod>" : "") + "</url>";
  }).join("");
  return new Response('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + links + "</urlset>", { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}

async function handleHtml(url, env) {
  const path = normalisePath(url.pathname);
  if (path === "/graphql/" || path === "/graphql") return new Response("Use /graphql", { status: 400 });
  if (path === "/search/") return await handleSearchHtml(url, env);
  let row = await env.DB.prepare("SELECT * FROM content_items WHERE path = ? AND status='publish' AND source_type IN ('page','post') LIMIT 1").bind(path).first();
  if (!row && /%[0-9A-Fa-f]{2}/.test(path)) {
    // Imported paths keep the wiki's lower-case %-escapes (e.g. %e2%86%92); browsers may send upper case.
    const alt = path.replace(/%[0-9A-F]{2}/gi, function(m) { return m.toLowerCase(); });
    if (alt !== path) row = await env.DB.prepare("SELECT * FROM content_items WHERE path = ? AND status='publish' AND source_type IN ('page','post') LIMIT 1").bind(alt).first();
  }
  if (!row && path === "/") {
    row = await env.DB.prepare("SELECT * FROM content_items WHERE source_type='page' AND slug='main-page' AND status='publish' LIMIT 1").first();
  }
  if (row) {
    const title = titleText(row.title);
    const content = rewriteContentLinks(row.content_html) + (ADDENDA[path] || "");
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
  const moved = await sourceRedirect(path);
  if (moved) return moved.startsWith("http") ? Response.redirect(moved + url.search, 302) : Response.redirect(url.origin + moved + url.search, 301);
  return html(htmlShell("Not found — " + (env.SITE_TITLE || "Research Mirror"), '<h1>Not found</h1><p>No published mirror page matches <code>' + escapeHtml(path) + '</code>.</p><p><a href="/">Browse the index</a></p>', env), 404);
}

// Link repair (24 Oct 2026): the wiki answers a short or old slug (e.g. /court-of-appeal-forensic-institutional-review/) with a 301 to the
// page's current nested path; the mirror now follows the wiki's own redirect instead of showing "Not found". No D1 read. — Sion's Tab agent
async function sourceRedirect(path) {
  try {
    const r = await fetch(SOURCE_SITE + path, { redirect: "manual", headers: { "User-Agent": "research-mirror-link-repair" }, cf: { cacheTtl: 3600, cacheEverything: true } });
    if (r.status === 200 && (r.headers.get("Content-Type") || "").includes("text/html")) return SOURCE_SITE + path; // on the wiki, not yet imported here
    if (r.status < 300 || r.status >= 400) return null;
    const loc = new URL(r.headers.get("Location") || "", SOURCE_SITE);
    if (loc.hostname !== new URL(SOURCE_SITE).hostname) return null;
    const p = normalisePath(loc.pathname);
    return p !== path && !p.startsWith("/wp-") ? p : null;
  } catch (_) {
    return null;
  }
}

async function browseIndex(env) {
  const { results } = await env.DB.prepare("SELECT title, path, source_type, excerpt_html, menu_order FROM content_items WHERE status='publish' AND source_type IN ('page','post') ORDER BY CASE WHEN path='/' THEN 0 ELSE 1 END, menu_order ASC, title COLLATE NOCASE ASC LIMIT 1000").all();
  if (!results || !results.length) return '<section><h2>Browse the mirror</h2><p>No content has been imported yet. Run the authenticated importer described in the deployment README.</p></section>';
  return '<section class="browse-index"><h2>Browse the mirror</h2><form action="/search/" method="get"><label for="q">Search pages and posts</label> <input id="q" name="q" type="search" placeholder="Search the wiki" /><button type="submit">Search</button></form><ol>' +
    visibleRows(results).map(function(item) {
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
  const items = visibleRows(results).map(function(item) {
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

function htmlShell(title, body, env, opts) {
  const footer = '<footer class="site-footer"><p>© 2026 the Williams–Buckler family of Tŷ Mawr (Great House Farm), Llandough. All rights reserved. <a href="https://bucklerfamily.estate/licence/">Licence</a></p></footer>';
  return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="index,follow"><title>' + escapeHtml(title) + '</title>' +
    `
<style>
:root {
  color-scheme: light;
  --wiki-bg: #f8f9fa;
  --wiki-paper: #ffffff;
  --wiki-text: #202122;
  --wiki-muted: #54595d;
  --wiki-border: #a2a9b1;
  --wiki-soft-border: #c8ccd1;
  --wiki-link: #0645ad;
  --wiki-visited: #0b0080;
  --wiki-control: #f8f9fa;
  --wiki-control-border: #a2a9b1;
  --wiki-table-head: #eaecf0;
  --wiki-table-alt: #f8f9fa;
  --assured: #f6fcf4;
  --assured-mark: #c7e8bd;
  --notassured: #fffaf1;
  --notassured-mark: #f2d6aa;
}
html[data-theme="dark"], body[data-theme="dark"],
html[data-color-theme="dark"], body[data-color-theme="dark"],
html.dark, body.dark, html.dark-mode, body.dark-mode,
html.theme-dark, body.theme-dark, body[data-mw-color-scheme="dark"] {
  color-scheme: dark;
  --wiki-bg: #101418;
  --wiki-paper: #202122;
  --wiki-text: #eaecf0;
  --wiki-muted: #a7acb1;
  --wiki-border: #54595d;
  --wiki-soft-border: #72777d;
  --wiki-link: #8ab4f8;
  --wiki-visited: #c0a5e8;
  --wiki-control: #27292d;
  --wiki-control-border: #72777d;
  --wiki-table-head: #303338;
  --wiki-table-alt: #27292d;
  --assured: #202d25;
  --assured-mark: #344d39;
  --notassured: #30291d;
  --notassured-mark: #5c4829;
}
* { box-sizing: border-box; }
html { background: var(--wiki-bg); }
body {
  margin: 0;
  padding: 0;
  max-width: none;
  color: var(--wiki-text);
  background: var(--wiki-bg);
  font-family: Arial, "Liberation Sans", sans-serif;
  font-size: 14px;
  line-height: 1.6;
  text-rendering: optimizeLegibility;
}
a { color: var(--wiki-link); text-decoration: none; }
a:visited { color: var(--wiki-visited); }
a:hover { text-decoration: underline; }
a:focus-visible, button:focus-visible, input:focus-visible, select:focus-visible {
  outline: 2px solid var(--wiki-link);
  outline-offset: 2px;
}
img, video, iframe, svg { max-width: 100%; }
img { height: auto; }
body > header {
  max-width: 1320px;
  margin: 0 auto;
  padding: 1rem clamp(1rem, 3vw, 2.25rem) .75rem;
  color: var(--wiki-text);
  background: var(--wiki-bg);
  border-bottom: 1px solid var(--wiki-border);
}
body > header a { color: var(--wiki-text); }
body > header a:visited { color: var(--wiki-text); }
body > header small { font-size: 1.05rem; font-weight: 600; }
header, nav, [class*="header-row"], [class*="headerRow"], [data-header-row] {
  color: var(--wiki-text);
}
main {
  width: 100%;
  max-width: 1320px;
  min-height: 60vh;
  margin: 0 auto;
  padding: 1.5rem clamp(1rem, 3vw, 2.5rem) 3rem;
  color: var(--wiki-text);
  background: var(--wiki-paper);
  border-left: 1px solid var(--wiki-soft-border);
  border-right: 1px solid var(--wiki-soft-border);
}
.article { width: 100%; min-width: 0; }
.article h1, .article h2, .article h3, .article h4 {
  color: var(--wiki-text);
  font-family: "Linux Libertine", "Georgia", "Times New Roman", serif;
  font-weight: normal;
  overflow-wrap: anywhere;
}
.article h1 {
  margin: 0 0 .35rem;
  padding: 0 0 .2em;
  font-size: 1.9rem;
  line-height: 1.25;
  border-bottom: 1px solid var(--wiki-border);
}
.article .meta {
  margin: .2rem 0 1.2rem;
  padding: 0 0 .55rem;
  color: var(--wiki-muted);
  font-size: .82rem;
  line-height: 1.5;
  border-bottom: 1px solid var(--wiki-soft-border);
}
.content {
  min-width: 0;
  color: var(--wiki-text);
  font-size: .9rem;
  line-height: 1.7;
  overflow-wrap: anywhere;
}
.content p { margin: .5em 0; }
.content h2 {
  margin: 1.25em 0 .4em;
  padding-bottom: .18em;
  font-size: 1.55rem;
  line-height: 1.35;
  border-bottom: 1px solid var(--wiki-border);
}
.content h3 { margin: 1em 0 .35em; font-size: 1.25rem; line-height: 1.4; }
.content h4 { margin: .8em 0 .3em; font-size: 1.08rem; font-weight: 600; }
.content ul, .content ol { padding-left: 1.8em; }
.content li { margin: .18em 0; }
.content blockquote {
  margin: .7em 1.5em;
  padding: .2em .8em;
  color: var(--wiki-muted);
  border-left: 3px solid var(--wiki-soft-border);
}
.content hr { border: 0; border-top: 1px solid var(--wiki-soft-border); margin: 1.5em 0; }
.content table {
  border: 1px solid var(--wiki-border);
  border-collapse: collapse;
  border-spacing: 0;
  max-width: 100%;
  margin: 1em 0;
  color: var(--wiki-text);
  background: var(--wiki-paper);
}
.content th, .content td {
  border: 1px solid var(--wiki-border);
  padding: .35em .6em;
  vertical-align: top;
}
.content th { font-weight: 600; background: var(--wiki-table-head); }
.content tr:nth-child(even) td { background: var(--wiki-table-alt); }
.content pre, .content code, code, pre {
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
}
.content pre, pre {
  max-width: 100%;
  overflow: auto;
  padding: .8em;
  border: 1px solid var(--wiki-soft-border);
  background: var(--wiki-table-alt);
  color: var(--wiki-text);
}
.content code, code { overflow-wrap: anywhere; }
.content figure { max-width: 100%; margin: 1em 0; }
.content figcaption { color: var(--wiki-muted); font-size: .85rem; }
.content img { max-width: 100%; }
.content p[data-evidence-status="assured"],
.content li[data-evidence-status="assured"],
.content blockquote[data-evidence-status="assured"] {
  background: var(--assured);
  border-radius: 2px;
}
.content p[data-evidence-status="not-assured"],
.content li[data-evidence-status="not-assured"],
.content blockquote[data-evidence-status="not-assured"] {
  background: var(--notassured);
  border-radius: 2px;
}
.quality-marker {
  display: inline-block;
  font-weight: 700;
  font-size: .86em;
  margin-right: .42em;
  padding: 0 .1em;
  user-select: none;
}
.quality-marker.assured, .assured-inline, .quality-key.assured { background: var(--assured-mark); }
.quality-marker.not-assured, .not-assured-inline, .quality-key.not-assured { background: var(--notassured-mark); }
.content p[data-evidence-status="assured"] .quality-marker,
.content p[data-evidence-status="not-assured"] .quality-marker { opacity: .9; }
.quality-key { padding: .08rem .25rem; border-radius: 2px; }
.quality-key.unassessed { border-bottom: 1px dotted var(--wiki-muted); }
.quality-docs {
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid var(--wiki-border);
}
.site-footer {
  max-width: 1320px;
  margin: 0 auto;
  padding: 1rem clamp(1rem, 3vw, 2.25rem) 1.5rem;
  color: var(--wiki-muted);
  background: var(--wiki-bg);
  border-top: 1px solid var(--wiki-border);
  font-size: .8rem;
}
.site-footer p { margin: .4rem 0; }
.quality-legend { color: var(--wiki-muted); }
.browse-index {
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid var(--wiki-border);
}
.browse-index h2 {
  font-family: "Linux Libertine", Georgia, "Times New Roman", serif;
  font-size: 1.55rem;
  font-weight: normal;
  border-bottom: 1px solid var(--wiki-border);
}
.browse-index form { display: flex; flex-wrap: wrap; align-items: center; gap: .45rem; margin: .75rem 0 1rem; }
.browse-index li { margin: .75rem 0; }
.index-excerpt { margin: .15rem 0; color: var(--wiki-muted); font-size: .88rem; overflow-wrap: anywhere; }
.browse-index a { overflow-wrap: anywhere; }
.back { margin-top: 2rem; padding-top: .75rem; border-top: 1px solid var(--wiki-soft-border); }
input, select, textarea {
  max-width: 100%;
  padding: .45rem .6rem;
  border: 1px solid var(--wiki-control-border);
  border-radius: 2px;
  background: var(--wiki-paper);
  color: var(--wiki-text);
  font: inherit;
}
button, input[type="submit"], input[type="button"], [role="button"] {
  padding: .45rem .75rem;
  border: 1px solid var(--wiki-control-border);
  border-radius: 2px;
  background: var(--wiki-control);
  color: var(--wiki-text);
  font: inherit;
  cursor: pointer;
}
button:hover, input[type="submit"]:hover, input[type="button"]:hover, [role="button"]:hover {
  background: var(--wiki-table-head);
}
.theme-toggle, #theme-toggle, [data-theme-toggle] { color: var(--wiki-text); background: var(--wiki-control); }
.preview-modal {
  position: fixed;
  z-index: 10000;
  right: 1rem;
  bottom: 1rem;
  width: min(27rem, calc(100vw - 2rem));
  max-height: 65vh;
  overflow: auto;
  color: var(--wiki-text);
  background: var(--wiki-paper);
  border: 1px solid var(--wiki-border);
  border-radius: 2px;
  box-shadow: 0 8px 32px #0002;
  padding: 1rem;
}
.preview-modal[hidden] { display: none; }
.preview-modal h2 { font-size: 1rem; margin: .1rem 0 .5rem; }
.preview-modal p { font-size: .9rem; margin: .4rem 0; }
.preview-modal .preview-actions { display: flex; justify-content: space-between; align-items: center; gap: .5rem; margin-top: .6rem; }
.preview-modal button { padding: .35rem .6rem; }
@media (min-width: 1100px) {
  .content { font-size: .92rem; }
}
@media (max-width: 700px) {
  body { font-size: 14px; }
  body > header { padding: .8rem 1rem .6rem; }
  main { padding: 1rem .9rem 2rem; border-left: 0; border-right: 0; }
  .article h1 { font-size: 1.65rem; }
  .content h2 { font-size: 1.35rem; }
  .content table { display: block; overflow-x: auto; }
  .content blockquote { margin-left: .5rem; margin-right: .5rem; }
  .site-footer { padding: .8rem 1rem 1.2rem; }
}
` + LANDING_CSS + `</style><script src="https://bucklerfamily.estate/ghf-lang/ghf-lang.js" defer></script>
<script src="https://bucklerfamily.estate/ghf-lang/ghf-boot.js?v=2.1.2"></script>
</head><body>` +
    '<main' + (opts && opts.landing ? ' class="landing"' : '') + '>' + body + '</main>' + footer +
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

function html(body, status, cacheControl) {
  return new Response(body, { status: status || 200, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": cacheControl || "no-store" } });
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
      return json({ data: { [one[1].toLowerCase()]: row && !WITHDRAWN_PATHS.has(row.path) ? graphqlRow(row) : null } });
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
      const nodes = visibleRows(rows.results).map(graphqlRow);
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


// Front door (23 Oct 2026): static pages need no database; every other GET is cached at the edge for
// FRESH_SECONDS, with a 7-day copy kept back. When the database refuses (e.g. its daily read limit), a page
// seen before is served from that copy, and an HTML page never seen gets a plain notice with the menu
// instead of a JSON error. This keeps reads low and the site up. — Tab agent
const JSON_PATHS = ["/health", "/llms.txt", "/agent-index.json", "/.well-known/agent.json", "/robots.txt", "/sitemap.xml"];
function isHtmlPath(pathname) {
  return !JSON_PATHS.includes(pathname) && !pathname.startsWith("/api/") && !pathname.startsWith("/media/") && pathname !== "/asset" && pathname !== "/graphql" && !pathname.startsWith("/admin");
}
function unavailablePage(env) {
  const nav = (LANDING_HTML.match(/^<nav[\s\S]*?<\/nav>/) || [""])[0];
  return htmlShell("Page not available right now — Great House Farm Wiki", nav + '<p>This page cannot be shown right now. Please try again later.</p><p><a href="/">Home</a> · <a href="/evidence/ev-0513-llandough-community-council-agenda-22-october-2026-item-10/">EV-0513</a></p>', env, { landing: true });
}
// Link repair (24 Oct 2026): old wiki slugs still linked from pages and other sites land on the current page, and links to
// the wiki's uploaded files open the source copy instead of a mirror 404. — Sion's Tab agent
const PATH_ALIASES = {
  "/main-page/": "/",
  "/master-timeline/": "/timeline/",
  "/change-log/": "/master-change-log-october-2026/",
  "/>*/": "/", // verbatim email text "<http://greathousefarmwiki.wordpress.com>*" auto-linked by WordPress
  "/%3E*/": "/"
};
// Privacy (24 Oct 2026, Sion's rule): pages the wiki made private, left as drafts or moved to the bin are not served by the mirror.
// They answer 410 Gone. To restore one, delete its line here and redeploy. — Sion's Tab agent
function visibleRows(rows) { return (rows || []).filter(function(r) { return !WITHDRAWN_PATHS.has(r.path); }); }
// Of those, the PRINCE2 pages now live in the public Project Office archive; their old addresses forward there.
const ARCHIVED_ON_PROJECTS = new Set(["/highlight-report-october-2026/", "/project-management/analytics/", "/project-management/brief/", "/project-management/business-case/", "/project-management/change-control/", "/project-management/communication-management-approach/", "/project-management/configuration-item-records/", "/project-management/delivery-breakdown/", "/project-management/end-stage-report-s0/", "/project-management/highlight-reports/", "/project-management/highlight-reports/17-october-2026-highlight-report-addendum-county-treasures-cross-institution-packs/", "/project-management/highlight-reports/april-2026/", "/project-management/highlight-reports/august-2026/", "/project-management/highlight-reports/december-2025/", "/project-management/highlight-reports/february-2026/", "/project-management/highlight-reports/hr-01-2026-10-18/", "/project-management/highlight-reports/hr-02-2026-10-18/", "/project-management/highlight-reports/hr-02-2026-10-19/", "/project-management/highlight-reports/january-2026/", "/project-management/highlight-reports/july-2026/", "/project-management/highlight-reports/june-2026/", "/project-management/highlight-reports/march-2026/", "/project-management/highlight-reports/may-2026/", "/project-management/highlight-reports/november-2025/", "/project-management/highlight-reports/october-2026-highlight-report-addendum-litigation-activation/", "/project-management/highlight-reports/october-2026-highlight-report-forensic-reframe-control-point-baseline/", "/project-management/highlight-reports/october-2026-highlight-report/", "/project-management/highlight-reports/september-2026-highlight-report-full-control-record/", "/project-management/highlight-reports/september-2026/", "/project-management/justice/", "/project-management/justice/plan/", "/project-management/mandate/", "/project-management/october-2026-s0-control-register/", "/project-management/organisation-roles/", "/project-management/plan/", "/project-management/plan/stage-plan-litigation-activation-sprint-8-october-14-november-2026/", "/project-management/prince2-7-compliance-control-manual/", "/project-management/prince2-control-registers/", "/project-management/prince2-project-initiation-documentation-g0-pack/", "/project-management/prince2-project-initiation-documentation-g0-pack/p1-evidence-archive-pid/", "/project-management/prince2-project-initiation-documentation-g0-pack/p2-title-justice-accountability-pid/", "/project-management/prince2-project-initiation-documentation-g0-pack/p3-artefacts-pid/", "/project-management/prince2-project-initiation-documentation-g0-pack/p4-t-mawr-replica-museum-pid/", "/project-management/product-breakdown-structure/", "/project-management/programme-dashboard/", "/project-management/report-templates/", "/project-management/stage-plan-s0-s1/", "/project-management/work-packages/"]);
const WITHDRAWN_PATHS = new Set(["/corrections-log-18-oct-2026/","/draft-email/","/evidence-library/newspaper-1974-article/","/evidence-library/newspaper-1988-history-fight-to-save-farm/","/evidence-library/newspaper-transcriptions/","/highlight-report-october-2026/","/new-sources-oct-2026/","/project-management/analytics/","/project-management/brief-evidence-recovery-draft/","/project-management/brief/","/project-management/business-case/","/project-management/change-control/","/project-management/communication-management-approach/","/project-management/configuration-item-records/","/project-management/delivery-breakdown/","/project-management/end-stage-report-s0/","/project-management/highlight-reports/","/project-management/highlight-reports/17-october-2026-highlight-report-addendum-county-treasures-cross-institution-packs/","/project-management/highlight-reports/april-2026/","/project-management/highlight-reports/august-2026/","/project-management/highlight-reports/december-2025/","/project-management/highlight-reports/february-2026/","/project-management/highlight-reports/highlight-report-week-36-2026/","/project-management/highlight-reports/highlight-report-week-37-2026/","/project-management/highlight-reports/highlight-report-week-38-2026/","/project-management/highlight-reports/highlight-report-week-39-2026/","/project-management/highlight-reports/highlight-report-week-40-2026/","/project-management/highlight-reports/highlight-report-week-41-2026/","/project-management/highlight-reports/hr-01-2026-10-18/","/project-management/highlight-reports/hr-02-2026-10-18/","/project-management/highlight-reports/hr-02-2026-10-19/","/project-management/highlight-reports/january-2026/","/project-management/highlight-reports/july-2026/","/project-management/highlight-reports/june-2026/","/project-management/highlight-reports/march-2026/","/project-management/highlight-reports/may-2026/","/project-management/highlight-reports/november-2025/","/project-management/highlight-reports/october-2026-highlight-report-addendum-litigation-activation/","/project-management/highlight-reports/october-2026-highlight-report-forensic-reframe-control-point-baseline/","/project-management/highlight-reports/october-2026-highlight-report/","/project-management/highlight-reports/september-2026-highlight-report-full-control-record/","/project-management/highlight-reports/september-2026/","/project-management/justice/","/project-management/justice/brief/","/project-management/justice/mandate/","/project-management/justice/plan/","/project-management/mandate-evidence-recovery-phase-draft/","/project-management/mandate/","/project-management/october-2026-s0-control-register/","/project-management/organisation-roles/","/project-management/plan-evidence-recovery-draft/","/project-management/plan/","/project-management/plan/stage-plan-litigation-activation-sprint-8-october-14-november-2026/","/project-management/prince2-7-compliance-control-manual/","/project-management/prince2-control-registers/","/project-management/prince2-project-initiation-documentation-g0-pack/","/project-management/prince2-project-initiation-documentation-g0-pack/p1-evidence-archive-pid/","/project-management/prince2-project-initiation-documentation-g0-pack/p2-title-justice-accountability-pid/","/project-management/prince2-project-initiation-documentation-g0-pack/p3-artefacts-pid/","/project-management/prince2-project-initiation-documentation-g0-pack/p4-t-mawr-replica-museum-pid/","/project-management/product-breakdown-structure/","/project-management/programme-dashboard/","/project-management/report-templates/","/project-management/stage-plan-s0-s1/","/project-management/work-packages/","/start-here-2/","/the-tightrope-2/","/wiki-sitemap-semver/"]);
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = normalisePath(url.pathname);
    if (WITHDRAWN_PATHS.has(path) && !Object.prototype.hasOwnProperty.call(STATIC_PAGES, path)) {
      if (ARCHIVED_ON_PROJECTS.has(path)) return Response.redirect("https://projects.bucklerfamily.estate/archive/legal-wiki" + path, 301);
      const nav = (LANDING_HTML.match(/^<nav[\s\S]*?<\/nav>/) || [""])[0];
      return cors(html(htmlShell("Page withdrawn — Great House Farm Wiki", nav + '<h1>Page withdrawn</h1><p>This page is no longer published.</p><p><a href="/">Home</a></p>', env, { landing: true }), 410, "public, max-age=300"));
    }
    if ((request.method === "GET" || request.method === "HEAD") && Object.prototype.hasOwnProperty.call(PATH_ALIASES, path)) {
      return Response.redirect(url.origin + PATH_ALIASES[path] + url.search, 301);
    }
    if ((request.method === "GET" || request.method === "HEAD") && (url.pathname.startsWith("/wp-content/uploads/") || url.pathname === "/feed/" || url.pathname === "/wp-login.php" || url.pathname.startsWith("/wp-admin/"))) {
      const wb = url.pathname.startsWith("/wp-content/uploads/") ? waybackFor(url) : "";
      return Response.redirect(wb || ("https://greathousefarmwiki.wordpress.com" + url.pathname + url.search), wb ? 301 : 302);
    }
    if ((request.method === "GET" || request.method === "HEAD") && (path === "/" || Object.prototype.hasOwnProperty.call(STATIC_PAGES, path))) {
      if (url.pathname !== "/" && url.pathname !== path) return Response.redirect(url.origin + path + url.search, 301);
      if (path === "/") return cors(html(htmlShell(LANDING_TITLE, LANDING_HTML.replace(/^(<nav[\s\S]*?<\/nav>)/, "$1" + HIVE_PIPELINE_HTML), env, { landing: true }), 200, "public, max-age=" + FRESH_SECONDS));
      const sp = STATIC_PAGES[path];
      return cors(html(htmlShell(sp.title + " — Great House Farm Wiki", '<article class="article">' + (sp.notitle ? '' : '<h1>' + escapeHtml(sp.title) + '</h1>') + '<div class="content">' + sp.html + '</div></article>', env), 200, "public, max-age=" + FRESH_SECONDS));
    }
    const cacheable = request.method === "GET" && !request.headers.get("Authorization") && isHtmlPath(url.pathname) && url.pathname !== "/search/" || request.method === "GET" && url.pathname === "/health";
    if (!cacheable) {
      const r = await app.fetch(request, env, ctx);
      if (r.status >= 500 && request.method === "GET" && isHtmlPath(url.pathname)) return cors(html(unavailablePage(env), 503, "no-store"));
      return r;
    }
    const cache = caches.default;
    const key = new Request(url.origin + url.pathname + url.search, { method: "GET" });
    const staleKey = new Request(url.origin + "/__stale__" + url.pathname + url.search, { method: "GET" });
    const hit = await cache.match(key);
    if (hit) return hit;
    const resp = await app.fetch(request, env, ctx);
    if (resp.status === 200) {
      const buf = await resp.arrayBuffer();
      const fresh = new Response(buf, resp); fresh.headers.set("Cache-Control", "public, max-age=" + FRESH_SECONDS);
      const stale = new Response(buf, resp); stale.headers.set("Cache-Control", "public, max-age=604800");
      ctx.waitUntil(Promise.all([cache.put(key, fresh), cache.put(staleKey, stale)]));
      const out = new Response(buf, resp); out.headers.set("X-Research-Cache", "miss");
      return out;
    }
    if (resp.status >= 500) {
      const old = await cache.match(staleKey);
      if (old) { const o = new Response(old.body, old); o.headers.set("Cache-Control", "no-store"); o.headers.set("X-Research-Cache", "stale"); return o; }
      if (isHtmlPath(url.pathname)) return cors(html(unavailablePage(env), 503, "no-store"));
    }
    return resp;
  }
};
