/**
 * Research importer — scheduled, resumable WordPress.com public-content sync.
 * This helper has no public route or administrative secret. It writes only to
 * the isolated research-wp-d1 database and never writes to the source website.
 */
const SOURCE_SITE = "https://greathousefarmwiki.wordpress.com";
const SOURCE_HOST = "greathousefarmwiki.wordpress.com";
const WP_API_FIELDS = "id,slug,link,title,content,excerpt,date,date_gmt,modified,modified_gmt,status,parent,menu_order,author,featured_media,source_url,media_type,mime_type,alt_text,caption,description,post";
const ORDER = ["page", "post", "media"];

export default {
  async scheduled(controller, env, ctx) {
    ctx.waitUntil(runOnePage(env));
  },
  async fetch(request, env) {
    const state = await readState(env, "auto_import_cursor");
    const rows = await env.DB.prepare(
      "SELECT source_type, COUNT(*) AS count FROM content_items WHERE status='publish' GROUP BY source_type"
    ).all();
    const counts = {};
    for (const row of (rows.results || [])) counts[row.source_type] = row.count;
    return json({
      service: "research-importer",
      mode: "scheduled-only",
      cursor: state || "page:1",
      complete: state === "complete",
      published_by_type: counts
    });
  }
};

async function runOnePage(env) {
  await env.DB.prepare(
    "CREATE TABLE IF NOT EXISTS migration_state (key TEXT PRIMARY KEY, value TEXT NOT NULL DEFAULT '', updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)"
  ).run();

  const now = Date.now();
  const lockUntil = now + 55000;
  const lock = await env.DB.prepare(
    "INSERT INTO migration_state (key,value,updated_at) VALUES ('auto_import_lock_until',?,?) " +
    "ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at " +
    "WHERE CAST(migration_state.value AS INTEGER) < ?"
  ).bind(String(lockUntil), new Date(now).toISOString(), now).run();
  if (!lock.meta || Number(lock.meta.changes || 0) < 1) return;

  try {
    let cursor = await readState(env, "auto_import_cursor") || "page:1";
    if (cursor === "complete") return;
    let [type, pageText] = cursor.split(":");
    let page = Math.max(1, Number(pageText || 1));
    if (!ORDER.includes(type) || !Number.isFinite(page)) {
      type = "page";
      page = 1;
      cursor = "page:1";
      await setState(env, "auto_import_cursor", cursor);
    }

    const source = await fetchSource(type, page);
    if (!source.ok) {
      const error = {
        cursor,
        status: source.status,
        detail: source.detail,
        tried: source.tried,
        updated_at: new Date().toISOString()
      };
      await setState(env, "auto_import_last_error", JSON.stringify(error));
      console.error("Research import paused at " + cursor + ": " + source.status + " " + source.detail);
      return;
    }

    const imported = await upsertItems(type, source.items, env);
    await setState(env, "auto_import_last_error", "");
    await setState(env, "auto_import_last_result", JSON.stringify({
      cursor,
      imported_this_page: imported,
      upstream_total: source.total,
      upstream_total_pages: source.totalPages,
      source_api: source.sourceUrl,
      updated_at: new Date().toISOString()
    }));

    let nextCursor;
    if (page < source.totalPages) {
      nextCursor = type + ":" + (page + 1);
    } else {
      await setState(env, "auto_import_collection:" + type, JSON.stringify({
        total: source.total,
        pages: source.totalPages,
        final_page: page,
        updated_at: new Date().toISOString()
      }));
      const nextType = ORDER[ORDER.indexOf(type) + 1];
      nextCursor = nextType ? nextType + ":1" : "complete";
    }
    await setState(env, "auto_import_cursor", nextCursor);
    if (nextCursor === "complete") {
      await setState(env, "auto_import_completed_at", new Date().toISOString());
      console.log("Research public-content import completed.");
    }
  } catch (error) {
    await setState(env, "auto_import_last_error", JSON.stringify({
      detail: String(error && error.message || error),
      updated_at: new Date().toISOString()
    }));
    console.error("Research import failed:", error);
  } finally {
    await setState(env, "auto_import_lock_until", "0");
  }
}

async function fetchSource(type, page) {
  const endpoint = type === "page" ? "pages" : type === "post" ? "posts" : "media";
  const statusValues = type === "media" ? ["inherit", ""] : ["publish"];
  const tried = [];
  let lastStatus = 0;
  let lastDetail = "No source API response";
  for (const status of statusValues) {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    params.set("per_page", "100");
    params.set("page", String(page));
    params.set("_fields", WP_API_FIELDS);
    const query = params.toString();
    const urls = [
      SOURCE_SITE + "/wp-json/wp/v2/" + endpoint + "?" + query,
      "https://public-api.wordpress.com/wp/v2/sites/greathousefarmwiki.wordpress.com/" + endpoint + "?" + query
    ];
    for (const target of urls) {
      try {
        const response = await fetch(target, {
          headers: { "Accept": "application/json", "User-Agent": "ResearchWikiMirror/0.2 (+read-only migration)" },
          cf: { cacheTtl: 0 }
        });
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
        return { ok: true, items: data, total, totalPages, sourceUrl: target, tried };
      } catch (error) {
        lastStatus = 0;
        lastDetail = String(error && error.message || error);
        tried.push({ url: target, error: lastDetail });
      }
    }
  }
  return { ok: false, status: lastStatus, detail: lastDetail, tried };
}

async function upsertItems(type, items, env) {
  const rows = [];
  for (const item of items) {
    const itemPath = recordPath(item, type);
    const title = titleText(rendered(item, "title") || item.slug || type + " " + item.id);
    const content = type === "media" ? safeHtml(rendered(item, "description")) : safeHtml(rendered(item, "content"));
    const excerpt = type === "media" ? safeHtml(rendered(item, "caption")) : safeHtml(rendered(item, "excerpt"));
    const sourceUrl = type === "media" ? String(item.source_url || "") : "";
    const mimeType = String(item.mime_type || "");
    const mediaType = String(item.media_type || "");
    const altText = String(item.alt_text || "");
    const caption = safeHtml(rendered(item, "caption"));
    const parentId = Number(item.parent || 0);
    const menuOrder = Number(item.menu_order || 0);
    const dateGmt = String(item.date_gmt || item.date || "");
    const modifiedGmt = String(item.modified_gmt || item.modified || "");
    const originalStatus = String(item.status || (type === "media" ? "inherit" : "publish"));
    // Public attachments use WordPress status "inherit". In the mirror, status
    // "publish" means the imported record is publicly readable.
    const status = type === "media" ? "publish" : originalStatus;
    const meta = JSON.stringify({
      author: item.author || null,
      featured_media: item.featured_media || null,
      guid: item.guid && item.guid.rendered || item.guid || null,
      source_type: type,
      source_status: originalStatus
    });
    rows.push(env.DB.prepare(
      "INSERT INTO content_items (source_type, source_id, title, slug, path, content_html, excerpt_html, status, source_link, source_url, mime_type, media_type, alt_text, caption_html, parent_source_id, menu_order, date_gmt, modified_gmt, meta_json) " +
      "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) " +
      "ON CONFLICT(source_type, source_id) DO UPDATE SET title=excluded.title, slug=excluded.slug, path=excluded.path, content_html=excluded.content_html, excerpt_html=excluded.excerpt_html, status=excluded.status, source_link=excluded.source_link, source_url=excluded.source_url, mime_type=excluded.mime_type, media_type=excluded.media_type, alt_text=excluded.alt_text, caption_html=excluded.caption_html, parent_source_id=excluded.parent_source_id, menu_order=excluded.menu_order, date_gmt=excluded.date_gmt, modified_gmt=excluded.modified_gmt, meta_json=excluded.meta_json"
    ).bind(type, Number(item.id), title, String(item.slug || ""), itemPath, content, excerpt, status, String(item.link || ""), sourceUrl, mimeType, mediaType, altText, caption, parentId, menuOrder, dateGmt, modifiedGmt, meta));
  }
  if (rows.length) await env.DB.batch(rows);
  return rows.length;
}

async function readState(env, key) {
  try {
    const row = await env.DB.prepare("SELECT value FROM migration_state WHERE key=?").bind(key).first();
    return row ? String(row.value || "") : "";
  } catch (_) {
    return "";
  }
}

async function setState(env, key, value) {
  await env.DB.prepare(
    "INSERT INTO migration_state (key,value,updated_at) VALUES (?,?,?) " +
    "ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at"
  ).bind(key, String(value), new Date().toISOString()).run();
}

function recordPath(item, type) {
  if (type === "media") return "/media/" + Number(item.id) + "/";
  try {
    const parsed = new URL(item.link || "/", SOURCE_SITE);
    let path = (parsed.pathname || "/").split("?")[0].split("#")[0];
    if (!path.startsWith("/")) path = "/" + path;
    if (path !== "/" && !path.endsWith("/")) path += "/";
    return path;
  } catch (_) {
    return "/" + (item.slug || type + "-" + item.id) + "/";
  }
}

function rendered(item, field) {
  const value = item && item[field];
  if (value && typeof value === "object" && typeof value.rendered === "string") return value.rendered;
  return typeof value === "string" ? value : "";
}

function titleText(value) {
  return decodeEntities(stripTags(value));
}

function stripTags(value) {
  return String(value || "")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, " ")
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
    .replace(/&#(\d+);/g, (_, code) => {
      try { return String.fromCodePoint(Number(code)); } catch (_) { return ""; }
    })
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => {
      try { return String.fromCodePoint(parseInt(code, 16)); } catch (_) { return ""; }
    });
}

function safeHtml(html) {
  return String(html || "")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, "")
    .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/(href|src)\s*=\s*(["'])\s*javascript:[\s\S]*?\2/gi, '$1="#"');
}

function json(data, status) {
  return new Response(JSON.stringify(data, null, 2), {
    status: status || 200,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }
  });
}
