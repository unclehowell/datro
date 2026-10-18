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
    if (cursor.startsWith("media-scan:")) {
      await runMediaScan(env, Math.max(0, Number(cursor.split(":")[1] || 0)));
      return;
    }
    if (cursor.startsWith("media-wayback:")) {
      await runWaybackImport(env);
      return;
    }
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
      if (type === "media") {
        // WordPress.com requires authentication for its media-library API on
        // some public sites. Preserve the diagnostic, then recover a catalogue
        // from embedded assets before consulting Internet Archive CDX.
        await setState(env, "auto_import_media_source_api_error", JSON.stringify(error));
        await setState(env, "auto_import_last_error", "");
        await setState(env, "auto_import_cursor", "media-scan:0");
        console.warn("Media endpoint is restricted; starting page-embedded media inventory.");
        return;
      }
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


const MEDIA_SCAN_BATCH = 50;

function supportedAssetUrl(raw, base) {
  const value = decodeEntities(String(raw || "").trim()).replace(/^['"]|['"]$/g, "");
  if (!value || value.startsWith("data:") || value.startsWith("blob:")) return "";
  let target;
  try { target = new URL(value, base || SOURCE_SITE); } catch (_) { return ""; }
  if (target.protocol === "http:") target.protocol = "https:";
  target.hash = "";
  const uploads = target.hostname === SOURCE_HOST && target.pathname.startsWith("/wp-content/uploads/");
  const files = target.hostname === "files.wordpress.com" && target.pathname.length > 1;
  const cdn = /^i[0-2]\.wp\.com$/.test(target.hostname) &&
    target.pathname.startsWith("/" + SOURCE_HOST + "/wp-content/uploads/");
  return target.protocol === "https:" && (uploads || files || cdn) ? target.href : "";
}

function assetCandidates(html, base) {
  const found = new Map();
  const add = function(raw, alt) {
    const url = supportedAssetUrl(raw, base);
    if (!url) return;
    if (!found.has(url)) found.set(url, { url, alt: String(alt || "") });
    else if (alt && !found.get(url).alt) found.get(url).alt = String(alt);
  };
  const source = String(html || "");

  // Parse image tags separately to preserve useful alt text.
  const imageTag = /<img\b[^>]*>/gi;
  let match;
  while ((match = imageTag.exec(source))) {
    const tag = match[0];
    const altMatch = tag.match(/\balt\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
    const alt = decodeEntities(altMatch ? (altMatch[1] || altMatch[2] || altMatch[3] || "") : "");
    const attr = /\b(?:src|data-src|data-original|data-lazy-src|data-large-file|srcset)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi;
    let a;
    while ((a = attr.exec(tag))) {
      const raw = decodeEntities(a[1] || a[2] || a[3] || "");
      if (/srcset$/i.test(a[0].split("=")[0])) {
        for (const candidate of raw.split(",")) add(candidate.trim().split(/\s+/)[0], alt);
      } else {
        add(raw, alt);
      }
    }
  }

  // Also collect linked PDFs and other uploads, including URLs in picture/source
  // and non-image anchors; the allowlist prevents arbitrary URLs being imported.
  const urlPattern = /(?:https?:)?\/\/(?:greathousefarmwiki\.wordpress\.com\/wp-content\/uploads\/|files\.wordpress\.com\/|i[0-2]\.wp\.com\/greathousefarmwiki\.wordpress\.com\/wp-content\/uploads\/)[^\s"'<>`]+/gi;
  while ((match = urlPattern.exec(source))) {
    let candidate = match[0].replace(/&amp;$/i, "").replace(/[.,;:!?])]+$/g, "");
    add(candidate, "");
  }
  const attrPattern = /(?:href|src|data-src|data-original|data-lazy-src|data-large-file)s*=s*(?:"([^"]*)"|'([^']*)'|([^s>]+))/gi;
  while ((match = attrPattern.exec(source))) add(match[1] || match[2] || match[3] || "", "");
  return Array.from(found.values());
}

async function stableAssetId(url) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(url));
  const bytes = new Uint8Array(digest);
  let id = 0;
  for (let i = 0; i < 6; i++) id = id * 256 + bytes[i];
  return id || 1;
}

function mimeFromUrl(url) {
  let path = "";
  try { path = new URL(url).pathname.toLowerCase(); } catch (_) {}
  const ext = path.split("/").pop().split(".").pop();
  const map = {
    pdf:"application/pdf", jpg:"image/jpeg", jpeg:"image/jpeg", jpe:"image/jpeg",
    png:"image/png", gif:"image/gif", webp:"image/webp", svg:"image/svg+xml",
    tif:"image/tiff", tiff:"image/tiff", bmp:"image/bmp", avif:"image/avif",
    doc:"application/msword", docx:"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls:"application/vnd.ms-excel", xlsx:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ppt:"application/vnd.ms-powerpoint", pptx:"application/vnd.openxmlformats-officedocument.presentationml.presentation",
    txt:"text/plain", csv:"text/csv", zip:"application/zip", mp3:"audio/mpeg",
    mp4:"video/mp4", mov:"video/quicktime", wav:"audio/wav"
  };
  return map[ext] || "application/octet-stream";
}

function assetTitle(url) {
  try {
    const name = new URL(url).pathname.split("/").filter(Boolean).pop() || "WordPress media asset";
    return decodeEntities(decodeURIComponent(name.replace(/+/g, " "))).slice(0, 240);
  } catch (_) {
    return "WordPress media asset";
  }
}

function assetStatement(env, asset, id, metadata, sourceLink, modified) {
  const mime = asset.mime_type || mimeFromUrl(asset.url);
  const title = assetTitle(asset.url);
  const sourceMeta = JSON.stringify(metadata || {});
  return env.DB.prepare(
    "INSERT INTO content_items (source_type, source_id, title, slug, path, content_html, excerpt_html, status, source_link, source_url, mime_type, media_type, alt_text, caption_html, parent_source_id, menu_order, date_gmt, modified_gmt, meta_json) " +
    "VALUES ('media', ?, ?, ?, ?, '', ?, 'publish', ?, ?, ?, ?, ?, '', 0, 0, ?, ?, ?) " +
    "ON CONFLICT(source_type, source_id) DO UPDATE SET title=excluded.title, slug=excluded.slug, path=excluded.path, source_url=CASE WHEN content_items.source_url='' THEN excluded.source_url ELSE content_items.source_url END, mime_type=CASE WHEN content_items.mime_type='' THEN excluded.mime_type ELSE content_items.mime_type END, media_type=CASE WHEN content_items.media_type='' THEN excluded.media_type ELSE content_items.media_type END, alt_text=CASE WHEN content_items.alt_text='' THEN excluded.alt_text ELSE content_items.alt_text END, excerpt_html=CASE WHEN content_items.excerpt_html='' THEN excluded.excerpt_html ELSE content_items.excerpt_html END, source_link=CASE WHEN content_items.source_link='' THEN excluded.source_link ELSE content_items.source_link END, meta_json=json_patch(content_items.meta_json, excluded.meta_json)"
  ).bind(
    id, title, title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
    "/media/" + id + "/", asset.alt || "", sourceLink || "", asset.url, mime,
    mime.split("/")[0], asset.alt || "", modified || "", modified || "", sourceMeta
  );
}

async function runMediaScan(env, offset) {
  const query = await env.DB.prepare(
    "SELECT source_id, path, source_link, content_html, excerpt_html, modified_gmt FROM content_items " +
    "WHERE source_type IN ('page','post') AND status='publish' ORDER BY source_type, source_id LIMIT ? OFFSET ?"
  ).bind(MEDIA_SCAN_BATCH, offset).all();
  const pages = query.results || [];
  const assets = new Map();
  for (const page of pages) {
    for (const asset of assetCandidates(String(page.content_html || "") + "
" + String(page.excerpt_html || ""), SOURCE_SITE)) {
      if (!assets.has(asset.url)) assets.set(asset.url, { ...asset, discovered_on: page.path, source_link: page.source_link, modified: page.modified_gmt });
      else if (asset.alt && !assets.get(asset.url).alt) assets.get(asset.url).alt = asset.alt;
    }
  }

  const statements = [];
  for (const asset of assets.values()) {
    const id = await stableAssetId(asset.url);
    statements.push(assetStatement(env, asset, id, {
      discovered_by: "embedded-page-scan",
      original_url: asset.url,
      discovered_on: asset.discovered_on,
      alt_source: asset.alt ? "image-alt-attribute" : "none"
    }, asset.source_link, asset.modified));
  }
  let imported = 0;
  for (let i = 0; i < statements.length; i += 100) {
    const batch = statements.slice(i, i + 100);
    if (batch.length) {
      await env.DB.batch(batch);
      imported += batch.length;
    }
  }

  await setState(env, "auto_import_media_scan_progress", JSON.stringify({
    offset, pages_scanned: pages.length, assets_found_this_batch: assets.size,
    metadata_upserts: imported, updated_at: new Date().toISOString()
  }));
  await setState(env, "auto_import_last_error", "");
  if (pages.length < MEDIA_SCAN_BATCH) {
    await setState(env, "auto_import_cursor", "media-wayback:0");
  } else {
    await setState(env, "auto_import_cursor", "media-scan:" + (offset + pages.length));
  }
}

async function runWaybackImport(env) {
  const cdx = new URL("https://web.archive.org/cdx/search/cdx");
  cdx.searchParams.set("url", SOURCE_HOST + "/wp-content/uploads/*");
  cdx.searchParams.set("matchType", "prefix");
  cdx.searchParams.set("output", "json");
  cdx.searchParams.set("fl", "original,timestamp,mimetype,statuscode");
  cdx.searchParams.append("filter", "statuscode:200");
  cdx.searchParams.append("filter", "!mimetype:text/html");
  cdx.searchParams.set("collapse", "urlkey");
  cdx.searchParams.set("limit", "5000");
  cdx.searchParams.set("gzip", "false");

  try {
    const response = await fetch(cdx.toString(), { headers: { "Accept": "application/json" }, cf: { cacheTtl: 0 } });
    if (!response.ok) {
      await setState(env, "auto_import_wayback_status", JSON.stringify({
        status: "unavailable", http_status: response.status,
        detail: (await response.text()).slice(0, 600), queried_at: new Date().toISOString()
      }));
      await finishImport(env, "Wayback CDX could not be queried; media inventory is limited to uploads discovered in page HTML.");
      return;
    }
    const data = await response.json();
    if (!Array.isArray(data) || !data.length) {
      await setState(env, "auto_import_wayback_status", JSON.stringify({
        status: "empty-or-unparseable", queried_at: new Date().toISOString()
      }));
      await finishImport(env, "Wayback CDX returned no usable inventory; media inventory is limited to uploads discovered in page HTML.");
      return;
    }
    const header = Array.isArray(data[0]) ? data[0].map(x => String(x)) : [];
    const index = key => header.indexOf(key);
    const entries = [];
    for (const row of data.slice(1)) {
      if (!Array.isArray(row)) continue;
      const original = supportedAssetUrl(row[index("original")], SOURCE_SITE);
      const timestamp = String(row[index("timestamp")] || "");
      const mime = String(row[index("mimetype")] || "");
      const code = String(row[index("statuscode")] || "");
      if (!original || !/^\d{8,14}$/.test(timestamp) || code !== "200") continue;
      entries.push({ url: original, mime_type: mime });
      const archiveUrl = "https://web.archive.org/web/" + timestamp + "id_/" + original;
      const id = await stableAssetId(original);
      const statement = assetStatement(env, { url: original, mime_type: mime, alt: "" }, id, {
        discovered_by: "internet-archive-cdx",
        original_url: original,
        archive_url: archiveUrl,
        archive_timestamp: timestamp,
        archive_mime_type: mime
      }, "", "");
      await env.DB.batch([statement]);
    }
    await setState(env, "auto_import_wayback_status", JSON.stringify({
      status: "queried",
      unique_capture_urls_imported: entries.length,
      query_limit: 5000,
      may_be_truncated: entries.length >= 5000,
      url: cdx.toString(),
      queried_at: new Date().toISOString()
    }));
    await finishImport(env, entries.length >= 5000
      ? "Wayback asset inventory imported up to the 5,000-result query limit; this may be a partial archive inventory."
      : "Wayback asset inventory queried and merged with page-embedded uploads.");
  } catch (error) {
    await setState(env, "auto_import_wayback_status", JSON.stringify({
      status: "error", detail: String(error && error.message || error), queried_at: new Date().toISOString()
    }));
    await finishImport(env, "Wayback CDX failed; imported-media inventory uses uploads discovered in page HTML only.");
  }
}

async function finishImport(env, note) {
  await setState(env, "auto_import_cursor", "complete");
  await setState(env, "auto_import_completed_at", new Date().toISOString());
  await setState(env, "auto_import_completion_note", note);
  const apiError = await readState(env, "auto_import_media_source_api_error");
  if (apiError) await setState(env, "auto_import_media_source_api_error", apiError);
  console.log("Research content import completed: " + note);
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
