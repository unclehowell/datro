/**
 * Research — isolated serverless mirror of the Great House Farm WordPress.com wiki.
 * Runs as a Cloudflare Worker with its own D1 database. It never writes upstream.
 */
import { LANDING_CSS, LANDING_TITLE, LANDING_HTML, STATIC_PAGES, ADDENDA } from "./landing.js";
// Interpretation layer (25 Oct 2026): our reading, rendered after the record text in its own section; the record is never altered. — Sion's Tab agent
import { interpretationHtml } from "./interpretation.js";
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

const WAYBACK_MEDIA = {"2026/09/1524700_10201438107374704_411812269_n_102014381073747042403570205450538263.jpg": "https://wayback.bucklerfamily.estate/images/evidence/0000-00-00_wp480_history-fight-to-savefarm.jpg", "2026/09/1546141_10201438100374529_1063850573_n_1020143810037452977861057556805709.jpg": "https://wayback.bucklerfamily.estate/images/evidence/0000-00-00_wp479_1974-newspaper-article.jpg", "2026/09/fb_img_17898673178876153542422585352056.jpg": "https://wayback.bucklerfamily.estate/images/evidence/0000-00-00_wp69_photograph-tree-planting-at-great-house-farm-date.jpg", "2026/09/img-20260924-wa00088484596834553616462.jpg": "https://wayback.bucklerfamily.estate/images/evidence/0000-00-00_wp434_burntrelicsrepresentyearsofdigs.jpg", "2026/09/img-20260924-wa00092623072631384426010.jpg": "https://wayback.bucklerfamily.estate/images/evidence/0000-00-00_wp435_historicsocietyhadnotableyear.jpg", "2026/09/screenshot_20260924_170403_chrome5485752220725341268.jpg": "https://wayback.bucklerfamily.estate/images/evidence/1841-00-00_wp438_historical-map-labelled-1841-map-title-date-source.jpg", "2026/09/wp-1790112811838.pdf": "https://wayback.bucklerfamily.estate/pdf/evidence/1988-05-03_wp36_european-commission-of-human-rights-application-14.pdf", "2026/09/wp-1790112812055.pdf": "https://wayback.bucklerfamily.estate/pdf/evidence/2026-09-00_wp47_hm-land-registry-title-plan-for-title-wa513690.pdf", "2026/09/wp-1790112812079.pdf": "https://wayback.bucklerfamily.estate/pdf/evidence/2026-09-00_wp46_hm-land-registry-title-register-for-title-wa513690.pdf", "2026/09/wp-1790112812098.pdf": "https://wayback.bucklerfamily.estate/pdf/evidence/2026-09-00_wp50_hm-land-registry-title-plan-for-title-wa231076.pdf", "2026/09/wp-1790112812130.pdf": "https://wayback.bucklerfamily.estate/pdf/evidence/2026-09-00_wp49_hm-land-registry-title-register-for-title-wa231076.pdf", "2026/09/wp-1790112812150.pdf": "https://wayback.bucklerfamily.estate/pdf/evidence/2026-09-00_wp48_hm-land-registry-title-plan-for-wa735527-current-c.pdf", "2026/09/wp-1790112812173.pdf": "https://wayback.bucklerfamily.estate/pdf/evidence/2026-09-00_wp52_hm-land-registry-title-register-for-wa735527-septe.pdf", "2026/09/wp-1790112812192.pdf": "https://wayback.bucklerfamily.estate/pdf/evidence/2026-09-20_wp51_records-request-to-heneb-schedule.pdf", "2026/09/wp-1790112812328.mp4": "https://wayback.bucklerfamily.estate/video/evidence/0000-00-00_wp54_video-clip-untitled.mp4", "2026/09/wp-1790112812369.pdf": "https://wayback.bucklerfamily.estate/pdf/evidence/0000-00-00_wp55_analysis-flaws-in-the-1962-possession.pdf", "2026/09/wp-1790112812388.docx": "https://wayback.bucklerfamily.estate/pdf/evidence/0000-00-00_wp53_museum-wales-82-44h-collection-summary-note.docx", "2026/09/wp-1790112812403.xls": "https://wayback.bucklerfamily.estate/pdf/evidence/0000-00-00_wp56_museum-wales-collection-spreadsheet-a.xls", "2026/09/wp-1790112812420.xls": "https://wayback.bucklerfamily.estate/pdf/evidence/0000-00-00_wp57_museum-wales-collection-spreadsheet-b.xls", "2026/09/wp-1790112812437.xlsx": "https://wayback.bucklerfamily.estate/pdf/evidence/0000-00-00_wp59_museum-wales-95-56h-early-medieval-burials-list.xlsx", "2026/09/wp-1790112812454.xlsx": "https://wayback.bucklerfamily.estate/pdf/evidence/0000-00-00_wp58_museum-wales-82-44h-finds-list.xlsx", "2026/09/wp-1790112812470.pdf": "https://wayback.bucklerfamily.estate/pdf/evidence/0000-00-00_wp60_analysis-timeline-v0-1.pdf", "2026/09/wp-1790112812490.pdf": "https://wayback.bucklerfamily.estate/pdf/evidence/1980-04-00_wp61_ggat-and-wales-west-housing-association-correspond.pdf", "2026/09/wp-1790112812516.pdf": "https://wayback.bucklerfamily.estate/pdf/evidence/1994-05-04_wp68_cotswold-archaeological-trust-letter-to-national-m.pdf", "2026/09/wp-1790112812829.pdf": "https://wayback.bucklerfamily.estate/pdf/evidence/2022-00-00_wp65_background-portable-antiquities-scheme-finds-recor.pdf", "2026/09/wp-1790112812892.pdf": "https://wayback.bucklerfamily.estate/pdf/evidence/0000-00-00_wp62_background-ggat-rcahmw-funerary-and-ritual-sitesre.pdf", "2026/09/wp-1790112813178.pdf": "https://wayback.bucklerfamily.estate/pdf/evidence/0000-00-00_wp67_background-davis-filling-the-gaps-the-iron-age-in.pdf", "2026/09/wp-1790112813249.pdf": "https://wayback.bucklerfamily.estate/pdf/evidence/0000-00-00_wp66_analysis-forensic-analysis.pdf", "2026/09/wp-1790112968592.pdf": "https://wayback.bucklerfamily.estate/pdf/planning/1990-03-13%20-%20Vale%20outline%20permission%2089-01396-OUT%20Great%20House%20Farm%20-%20EN%20-%20V0.0.0.00.pdf", "2026/09/wp-1790112968628.pdf": "https://wayback.bucklerfamily.estate/pdf/planning/1990-02-08%20-%20Vale%20officer%20report%2089-01396-OUT%20Great%20House%20Farm%20-%20EN%20-%20V0.0.0.00.pdf", "2026/09/wp-1790112968680.pdf": "https://wayback.bucklerfamily.estate/pdf/planning/1989-10-00%20-%20GGAT%20comments%2089-01396-OUT%20Great%20House%20Farm%20Llandough%20-%20EN%20-%20V0.0.0.00.pdf", "2026/09/wp-1790112968735.pdf": "https://wayback.bucklerfamily.estate/pdf/planning/1989-10-16%20-%20Vale%2089-01396-OUT%20application%20form%20and%20certificate%20A%20-%20EN%20-%20V0.0.0.00.pdf", "2026/09/wp-1790112968773.pdf": "https://wayback.bucklerfamily.estate/pdf/planning/1989-11-08%20-%20Llandough%20plans%20village%20green%20and%20later%20housing%20layouts%20-%20EN%20-%20V0.0.0.00.pdf", "2026/09/wp-1790112987088.pdf": "https://wayback.bucklerfamily.estate/pdf/evidence/1994-06-23_wp79_site-layout-drawing-20-plot-development-llandough.pdf", "2026/09/wp-1790112987151.pdf": "https://wayback.bucklerfamily.estate/pdf/evidence/0000-00-00_wp76_unidentified-scanned-pdf-in-the-wiki-media-library.pdf", "2026/09/wp-1790112987191.pdf": "https://wayback.bucklerfamily.estate/pdf/evidence/1992-09-03_wp75_approved-planning-drawings-92-00671-res-screen-wal.pdf", "2026/09/wp-1790112987219.pdf": "https://wayback.bucklerfamily.estate/pdf/evidence/1990-08-00_wp77_land-at-great-house-farm-llandough-an-archaeologic.pdf", "2026/09/wp-1790112987254.pdf": "https://wayback.bucklerfamily.estate/pdf/evidence/0000-00-00_wp78_butterley-brick-product-brochure-annotated-stonele.pdf", "2026/09/wp-1790112987285.pdf": "https://wayback.bucklerfamily.estate/pdf/evidence/0000-00-00_wp80_external-finishes-schedule-for-20-dwellings-great.pdf", "2026/09/wp-1790112987299.pdf": "https://wayback.bucklerfamily.estate/pdf/evidence/0000-00-00_wp82_ideal-homes-sales-brochure-for-hunters-green-devel.pdf", "2026/09/wp-1790112987335.pdf": "https://wayback.bucklerfamily.estate/pdf/evidence/0000-00-00_wp81_unidentified-scanned-pdf-in-the-wiki-media-library.pdf", "2026/09/wp-1790112987385.pdf": "https://wayback.bucklerfamily.estate/pdf/evidence/1992-05-14_wp84_planning-application-form-d-for-approval-of-reserv.pdf", "2026/09/wp-1790112987440.pdf": "https://wayback.bucklerfamily.estate/pdf/evidence/1993-12-13_wp86_ggat-letters-on-archaeological-planning-conditions.pdf", "2026/09/wp-1790112987556.pdf": "https://wayback.bucklerfamily.estate/pdf/evidence/0000-00-00_wp83_planning-officers-report-outline-application-forme.pdf", "2026/09/wp-1790112987583.pdf": "https://wayback.bucklerfamily.estate/pdf/evidence/1994-01-12_wp85_ideal-homes-wales-llandough-farm-site-location-map.pdf", "2026/09/wp-17901130381817595013974459963855.jpg": "https://wayback.bucklerfamily.estate/images/evidence/1824-00-00_wp87_map-of-ty-mawr-dated-1824-uploaded-image.jpg", "2026/09/wp-17901130382388153716561495856833.jpg": "https://wayback.bucklerfamily.estate/images/evidence/1939-05-00_wp88_dbdt123-7-1939-agreement-western-ground-rents-to-j.jpg", "2026/09/wp-17901130383762862870648380186560.jpg": "https://wayback.bucklerfamily.estate/images/evidence/0000-00-00_wp89_plan-of-the-williams-parcel-date-and-originunknown.jpg", "2026/10/1976.jpg": "https://wayback.bucklerfamily.estate/images/evidence/1976-00-00_wp1434_family-photograph-great-house-farm.jpg", "2026/10/2026-02-26_tna_hmc-9-311_llandough-manor-return.jpg": "https://wayback.bucklerfamily.estate/pdf/foi/2026-02-26_tna_hmc-9-311_llandough-manor-return.jpg", "2026/10/2026-04-13_hmlr_foi-f260213_response.pdf": "https://wayback.bucklerfamily.estate/pdf/foi/2026-04-13_hmlr_foi-f260213_response.pdf", "2026/10/2026-04-27_moj_to130237_reply-r.pdf": "https://wayback.bucklerfamily.estate/pdf/foi/2026-04-27_moj_to130237_reply.pdf", "2026/10/2026-05-28_rcahmw_rc26-0205_les08-order-form-2021.docx": "https://wayback.bucklerfamily.estate/pdf/foi/2026-05-28_rcahmw_rc26-0205_les08-order-form-2021.docx", "2026/10/2026-05-28_rcahmw_rc26-0205_les16-price-list-2026.pdf": "https://wayback.bucklerfamily.estate/pdf/foi/2026-05-28_rcahmw_rc26-0205_les16-price-list-2026.pdf", "2026/10/2026-05-28_rcahmw_rc26-0205_les17-licence-fees-2026.pdf": "https://wayback.bucklerfamily.estate/pdf/foi/2026-05-28_rcahmw_rc26-0205_les17-licence-fees-2026.pdf", "2026/10/2026-06-11_welsh-government_atisn-27021_doc1-1988-07-29-farmhouse-survey-photo.pdf": "https://wayback.bucklerfamily.estate/pdf/foi/2026-06-11_welsh-government_atisn-27021_doc1-1988-07-29-farmhouse-survey-photo.pdf", "2026/10/2026-06-11_welsh-government_atisn-27021_doc2-1988-07-29-barn-survey-photo.pdf": "https://wayback.bucklerfamily.estate/pdf/foi/2026-06-11_welsh-government_atisn-27021_doc2-1988-07-29-barn-survey-photo.pdf", "2026/10/2026-06-11_welsh-government_atisn-27021_response-letter-r2.pdf": "https://wayback.bucklerfamily.estate/pdf/foi/2026-06-11_welsh-government_atisn-27021_response-letter.pdf", "2026/10/2026-07-13_hmlr_n610cgv_letter-r.pdf": "https://wayback.bucklerfamily.estate/pdf/foi/2026-07-13_hmlr_n610cgv_letter.pdf", "2026/10/2026-07-16_south-wales-police_foi-719-26_response.pdf": "https://wayback.bucklerfamily.estate/pdf/evidence/2026-07-16_wp1300_south-wales-police-response-to-foi-request-719-26.pdf", "2026/10/2026-07-22_dcms_foi2026-06174_response-r2.pdf": "https://wayback.bucklerfamily.estate/pdf/foi/2026-07-22_dcms_foi2026-06174_response.pdf", "2026/10/2026-07-24_post-office_foi2026-00751_response-r.pdf": "https://wayback.bucklerfamily.estate/pdf/foi/2026-07-24_post-office_foi2026-00751_response.pdf", "2026/10/2026-08-10_ico_ic-546505-w6p0_letter-r.pdf": "https://wayback.bucklerfamily.estate/pdf/foi/2026-08-10_ico_ic-546505-w6p0_letter.pdf", "2026/10/2026-08-12_moj_260805002_foia-response-r.pdf": "https://wayback.bucklerfamily.estate/pdf/foi/2026-08-12_moj_260805002_foia-response.pdf", "2026/10/2026-08-19_dcms_ir2026-06711_response-r2.pdf": "https://wayback.bucklerfamily.estate/pdf/foi/2026-08-19_dcms_ir2026-06711_response.pdf", "2026/10/2026-09-07_glamorgan-archives_digital-photography-order-form-2025.docx": "https://wayback.bucklerfamily.estate/pdf/foi/2026-09-07_glamorgan-archives_digital-photography-order-form-2025.docx", "2026/10/2026-09-09_moj_260813002_foi-ir-extension-letter-r.pdf": "https://wayback.bucklerfamily.estate/pdf/foi/2026-09-09_moj_260813002_foi-ir-extension-letter.pdf", "2026/10/2026-09-22_wales-office_26foi-103_response-r2.pdf": "https://wayback.bucklerfamily.estate/pdf/foi/2026-09-22_wales-office_26foi-103_response.pdf", "2026/10/2026-09-29_rcahmw_rc26-0375_les08-order-form-2023.docx": "https://wayback.bucklerfamily.estate/pdf/foi/2026-09-29_rcahmw_rc26-0375_les08-order-form-2023.docx", "2026/10/2026-09-29_rcahmw_rc26-0375_les16-price-list-2026.pdf": "https://wayback.bucklerfamily.estate/pdf/foi/2026-09-29_rcahmw_rc26-0375_les16-price-list-2026.pdf", "2026/10/2026-09-29_south-wales-police_foi-1040-26_response.pdf": "https://wayback.bucklerfamily.estate/pdf/evidence/2026-09-29_wp1311_south-wales-police-foi-response-1040-26-29-sep-202.pdf", "2026/10/2026-09-30_glamorgan-archives_bute-10.doc": "https://wayback.bucklerfamily.estate/pdf/foi/2026-09-30_glamorgan-archives_bute-10.doc", "2026/10/6600.jpg": "https://wayback.bucklerfamily.estate/images/evidence/1988-12-06_wp1329_western-mail-report-farmer-fails-in-final-eviction.jpg", "2026/10/census-1881-rg11-5288-p2-llandough.jpg": "https://wayback.bucklerfamily.estate/images/evidence/1881-04-03_wp5881_1881-census-llandough-rg11-5288-page-2-llandough-h.jpg", "2026/10/ghf-e090-n01-1891-farmyard-theft.png": "https://wayback.bucklerfamily.estate/images/evidence/1891-11-00_wp1194_newspaper-report-alleged-theft-of-geese-from-great.png", "2026/10/ghf-e090-n02-1897-marconi-lavernock.jpg": "https://wayback.bucklerfamily.estate/images/evidence/1897-05-15_wp1195_press-cutting-wireless-telegraphy-marconi-inventio.jpg", "2026/10/ghf-e090-n03-1974-open-day-telegraph.jpg": "https://wayback.bucklerfamily.estate/images/evidence/1974-04-16_wp1197_daily-telegraph-report-open-day-to-save-ancient-we.jpg", "2026/10/ghf-e090-n03-n04-1974-open-day-and-grievous-loss-page.jpg": "https://wayback.bucklerfamily.estate/images/evidence/1974-00-00_wp1196_grievous-loss-letter-from-william-rees-opposing-de.jpg", "2026/10/ghf-e090-n05-1980-neath-guardian.jpg": "https://wayback.bucklerfamily.estate/images/evidence/1980-04-17_wp1198_neath-guardian-report-of-historical-society-meetin.jpg", "2026/10/ghf-e090-n06-1983-echo-burnt-relics.jpg": "https://wayback.bucklerfamily.estate/images/evidence/1983-03-18_wp1199_south-wales-echo-warehouse-fire-destroys-glamorgan.jpg", "2026/10/ghf-e090-n07-1988-chainsaw-farmer.jpg": "https://wayback.bucklerfamily.estate/images/evidence/1988-04-30_wp1200_c-30-april-1988-chainsaw-farmer-vows-to-fighton.jpg", "2026/10/ghf-e090-n07-1988-police-wait-photo.jpg": "https://wayback.bucklerfamily.estate/images/evidence/1988-04-00_wp1201_newspaper-photograph-captioned-police-wait-outside.jpg", "2026/10/ghf-e090-n08-1988-history-fight.jpg": "https://wayback.bucklerfamily.estate/images/evidence/1988-12-03_wp1202_history-fight-to-save-farm-south-wales-echo-report.jpg", "2026/10/ghf-e090-n09-1988-billys-unhappy-family.jpg": "https://wayback.bucklerfamily.estate/images/evidence/1988-12-03_wp1203_south-wales-echo-report-on-residents-evicted-from.jpg", "2026/10/ghf-e090-n10-1988-western-mail-final-hearing.jpg": "https://wayback.bucklerfamily.estate/images/evidence/1988-12-06_wp1204_6-december-1988-farmer-fails-in-final-eviction-hea.jpg", "2026/10/ghf-e090-n11-1988-tears-flow-razed.jpg": "https://wayback.bucklerfamily.estate/images/evidence/1988-12-07_wp1205_press-cutting-tears-flow-as-800-year-old-farm-hous.jpg", "2026/10/ghf-e090-n12-1989-charge-dropped.png": "https://wayback.bucklerfamily.estate/images/evidence/1989-01-00_wp1206_press-cutting-charge-against-evicted-farmer-droppe.png", "2026/10/ghf-e090-n13-1989-farm-to-bus.jpg.png": "https://wayback.bucklerfamily.estate/images/evidence/1989-00-00_wp1207_from-farm-to-a-bus-south-wales-echo-feature-by-pet.png", "2026/10/ghf-e090-n14-1988-echo-front-page.jpg": "https://wayback.bucklerfamily.estate/images/evidence/1988-11-30_wp1208_south-wales-echo-inside-page-on-great-house-farm-e.jpg", "2026/10/ghf-e090-n15-bna-extract-01.png": "https://wayback.bucklerfamily.estate/images/evidence/1988-12-03_wp1215_south-wales-echo-search-extract-evicted-farmer-tak.png", "2026/10/ghf-e090-n15-bna-extract-02.png": "https://wayback.bucklerfamily.estate/images/evidence/1988-04-29_wp1210_south-wales-echo-29-april-1988-background-to-buckl.png", "2026/10/ghf-e090-n15-bna-extract-03.png": "https://wayback.bucklerfamily.estate/images/evidence/1988-12-02_wp1214_south-wales-echo-2-dec-1988-summons-against-bp-and.png", "2026/10/ghf-e090-n15-bna-extract-04.png": "https://wayback.bucklerfamily.estate/images/evidence/1989-01-06_wp1223_south-wales-echo-search-extract-bail-change-for-ev.png", "2026/10/ghf-e090-n15-bna-extract-05.png": "https://wayback.bucklerfamily.estate/images/evidence/1988-05-12_wp1212_south-wales-echo-alun-michael-mp-asks-lord-chancel.png", "2026/10/ghf-e090-n15-bna-extract-06.png": "https://wayback.bucklerfamily.estate/images/evidence/1988-12-06_wp1216_south-wales-echo-6-dec-1988-llandough-ownership-fi.png", "2026/10/ghf-e090-n15-bna-extract-07.png": "https://wayback.bucklerfamily.estate/images/evidence/1988-11-30_wp1213_south-wales-echo-forced-entry-at-great-house-farm.png", "2026/10/ghf-e090-n15-bna-extract-08.png": "https://wayback.bucklerfamily.estate/images/evidence/1988-12-07_wp1217_south-wales-echo-1988-councillor-calls-demolition.png", "2026/10/ghf-e090-n15-bna-extract-09.png": "https://wayback.bucklerfamily.estate/images/evidence/1989-03-20_wp1224_south-wales-echo-20-march-1989-bp-properties-site.png", "2026/10/ghf-e090-n15-bna-extract-10.png": "https://wayback.bucklerfamily.estate/images/evidence/1988-12-09_wp1218_south-wales-echo-search-extract-villagers-anger-at.png", "2026/10/ghf-e090-n15-bna-extract-11.png": "https://wayback.bucklerfamily.estate/images/evidence/1988-12-21_wp1222_south-wales-echo-readers-letter-responding-to-bull.png", "2026/10/ghf-e090-n15-bna-extract-r002.png": "https://wayback.bucklerfamily.estate/images/evidence/1988-04-30_wp1211_south-wales-echo-mr-buckler-refuses-to-leave-farm.png", "2026/10/ghf-e090-n15-bna-extract-r003.png": "https://wayback.bucklerfamily.estate/images/evidence/1989-03-23_wp1225_south-wales-echo-search-extract-evicted-farmer-fre.png", "2026/10/ghf-e090-n15-bna-extract-r004.png": "https://wayback.bucklerfamily.estate/images/evidence/1988-12-10_wp1220_south-wales-echo-search-extract-mr-buckler-freed-o.png", "2026/10/ghf-e090-n15-bna-extract-r005.png": "https://wayback.bucklerfamily.estate/images/evidence/1989-03-24_wp1226_south-wales-echo-search-extract-farmer-freed-buckl.png", "2026/10/ghf-e090-n15-bna-extract-r006.png": "https://wayback.bucklerfamily.estate/images/evidence/1988-12-13_wp1221_south-wales-echo-search-extract-mr-buckler-on-evic.png", "2026/10/ghf-e090-n16-1980-hansard-rowlands.png": "https://wayback.bucklerfamily.estate/images/evidence/1980-05-22_wp1209_hansard-ted-rowlands-mp-criticises-western-ground.png", "2026/10/ghf-e106-r33-a1-1931-letter-file-63-24.pdf": "https://wayback.bucklerfamily.estate/pdf/foi/2026-10-05_museum-wales_foi-2026-036_63-24-letter-1931.pdf", "2026/10/ghf-e106-r33-a2-63-24-1-rowel-spur-record.pdf": "https://wayback.bucklerfamily.estate/pdf/foi/2026-10-05_museum-wales_foi-2026-036_63-24-1-rowel-spur.pdf", "2026/10/ghf-e106-r33-a3-63-24-2-spearhead-record.pdf": "https://wayback.bucklerfamily.estate/pdf/foi/2026-10-05_museum-wales_foi-2026-036_63-24-2-spearhead.pdf", "2026/10/ghf-e106-r49-a1-npcc-3065-2026-search-disclosure-2026-10-09.pdf": "https://wayback.bucklerfamily.estate/pdf/evidence/2026-10-09_wp1871_npcc-foi-3065-2026-response-on-search-disclosure-g.pdf", "2026/10/ghf-e106-r49-a1-npcc-3156-2026-response-2026-09-16.pdf": "https://wayback.bucklerfamily.estate/pdf/evidence/2026-09-16_wp1825_npcc-response-to-foi-request-3156-2026-no-informat.pdf", "2026/10/ghf-e106-r50-a1-npcc-internal-reviews-3157-3176-2026-09-29.pdf": "https://wayback.bucklerfamily.estate/pdf/evidence/2026-09-29_wp1826_npcc-internal-review-decisions-3157-2026-and-3176.pdf", "2026/10/ghf-e106-r51-a1-npcc-3065-2026-search-disclosure-2026-10-09.pdf": "https://wayback.bucklerfamily.estate/pdf/evidence/2026-10-09_wp1871_npcc-foi-3065-2026-response-on-search-disclosure-g.pdf", "2026/10/ghf-location-slot-machine.gif": "https://wayback.bucklerfamily.estate/images/evidence/0000-00-00_wp1142_location-nomenclature-slot-machine.gif", "2026/10/ghf-slot-machine.gif": "https://wayback.bucklerfamily.estate/images/evidence/0000-00-00_wp1141_nomenclature-slot-machine.gif", "2026/10/hlxvji2wuaawo9f.jpg": "https://wayback.bucklerfamily.estate/images/evidence/1988-00-00_wp2593_photograph-great-house-farm-ruins-with-the-church.jpg", "2026/10/hrghuipagaaf5lt.jpg": "https://wayback.bucklerfamily.estate/images/evidence/1988-12-03_wp2595_south-wales-echo-3-dec-1988-history-fight-to-savef.jpg", "2026/10/htcakj6wyaaqe_z.jpg": "https://wayback.bucklerfamily.estate/images/evidence/1980-04-17_wp2594_neath-guardian-17-april-1980-roman-villa-remains-a.jpg", "2026/10/wp-1790112811868-r.pdf": "https://wayback.bucklerfamily.estate/pdf/foi/2026-05-25_hmlr_stage-two-complaint-decision.pdf", "2026/10/wp-1790112811886-r.pdf": "https://wayback.bucklerfamily.estate/pdf/foi/2026-05-25_hmlr_stage-two-complaint-decision.pdf", "2026/10/wp-1790112811907-r.pdf": "https://wayback.bucklerfamily.estate/pdf/foi/2026-07-30_hmlr_first-registration-schedule.pdf", "2026/10/wp-1790112811931-r.pdf": "https://wayback.bucklerfamily.estate/pdf/foi/2026-04-21_hmlr_stage-two-acknowledgement.pdf", "2026/10/wp-1790112811957-r.pdf": "https://wayback.bucklerfamily.estate/pdf/foi/2026-04-21_hmlr_stage-two-acknowledgement.pdf", "2026/10/wp-1790112811975-r.pdf": "https://wayback.bucklerfamily.estate/pdf/foi/2026-04-19_hmlr_stage-one-complaint-decision.pdf", "2026/10/wp-1790112811997-r.pdf": "https://wayback.bucklerfamily.estate/pdf/foi/2026-04-19_hmlr_stage-one-complaint-decision.pdf", "2026/10/wp-1790112812018-r.pdf": "https://wayback.bucklerfamily.estate/pdf/foi/2026-03-23_hmlr_wa231076_registration-history.pdf", "2026/10/wp-1790112812037-r.pdf": "https://wayback.bucklerfamily.estate/pdf/foi/2026-02-13_hmlr_wa231076_holding-letter.pdf", "2026/10/wp-1790112813235-r.docx": "https://wayback.bucklerfamily.estate/pdf/evidence/2026-09-22_wp6070_museum-wales-formal-complaint-and-collections-enquiry.docx", "2026/10/wp-17908311064163244374663777438784.jpg": "https://wayback.bucklerfamily.estate/images/evidence/1983-00-00_wp994_william-bucklers-1983-diary-inside-cover-note-list.jpg", "2026/10/wp-1790831542912387549342980826887.jpg": "https://wayback.bucklerfamily.estate/images/evidence/1983-00-00_wp997_william-bucklers-1983-diary-two-handwritten-sums.jpg"};
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
    content_html: noSionYT(row.content_html), excerpt_html: noSionYT(row.excerpt_html), source_link: row.source_link,
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
  const excerpt = stripTags(noSionYT(row.excerpt_html)) || stripTags(noSionYT(row.content_html)).slice(0, 900);
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
    const content = rewriteContentLinks(noSionYT(row.content_html)) + (ADDENDA[path] || "");
    const readerDocs = path === "/read-the-docs/" ? qualityDocs() : "";
    const body = '<article class="article" data-source-type="' + escapeHtml(row.source_type) + '" data-source-id="' + Number(row.source_id) + '">' +
      '<h1>' + escapeHtml(title) + '</h1>' +
      '<p class="meta">' + escapeHtml(row.source_type) + ' · Updated ' + escapeHtml(row.modified_gmt || row.date_gmt || "date not supplied") +
      ' · <a href="' + escapeHtml(row.source_link || SOURCE_SITE) + '">Original source</a></p>' +
      '<div class="content">' + content + '</div>' + interpretationHtml(path) + readerDocs + '</article>' +
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
      if (status !== "publish") {
        return json({ errors: [{ message: "Only published content is publicly readable" }] }, 400);
      }
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
  return { id: String(row.source_id), title: row.title, slug: row.slug, path: row.path, content: noSionYT(row.content_html), excerpt: noSionYT(row.excerpt_html), status: row.status, postType: row.source_type, date: row.date_gmt, modified: row.modified_gmt, sourceLink: row.source_link };
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
// 24 Oct 2026: the 11 PRINCE2 drafts/bin copies added to the archive too; the other 8 withdrawn pages are served from STATIC_PAGES (landing.js). — Sion's Tab agent
// 24 Oct 2026 (later): /draft-email/ (unsent FOI letter drafts) taken back out of STATIC_PAGES, so it answers 410 'Page withdrawn' like the other withdrawn pages; 7 remain static. — Sion's Tab agent
// 24 Oct 2026 (16:54 BST, Sion): his own YouTube channel and its videos are never shared on this site; the 26 media-register item pages for it (/evidence/mr-0118/ .. /evidence/mr-0145/) are out of STATIC_PAGES and answer 410 like the other withdrawn pages. — Sion's Tab agent
// NEVER SHARE Sion's own YouTube channel or its videos (Sion, WhatsApp 16:54 BST 24 Oct 2026: "Dont share my YouTube channel on here.
// And its not a 'family channel'"). The wiki mirror in D1 still carries his embeds; they are stripped here at serve time, so a re-import cannot bring them back. — Sion's Tab agent
const SION_YT_IDS = ["-c0UvjM-lwA", "05_Ei82HSeE", "0eXOoj7eUCo", "4GXmR7mAas0", "5wCBtClDkyQ", "6o07JL4ZoGY", "ADs8MemYWYw", "GesJfW_yECQ", "HcZzIyEhhO8", "J8Dt2UBuHt0", "SNUY-XFAjyE", "XPM6vi1R7VA", "XuArB_vYWWA", "Yv7q1POk550", "Z1GRL_h31Y8", "aRRvkt3ryXg", "aazpNjlzRtQ", "baMrjvG6hl8", "dnQ0gFhcbEA", "duISt8CMOfM", "hS4aN9dBr4I", "hzbCZg_3V9k", "nYxHueeoLmc", "p7xEURn9kb8", "vnhbyahwQWk", "yuKeFAk7Uko"];
const SION_YT_ALT = SION_YT_IDS.map(function (s) { return s.replace(/[-]/g, "\\-"); }).join("|") + "|UC2sN1VEs1WeLfBH8VmbvLWw|sionbuckler5713";
const SION_YT_FIG = new RegExp("<figure\\b(?:(?!<\\/figure>)[\\s\\S])*?(?:" + SION_YT_ALT + ")(?:(?!<\\/figure>)[\\s\\S])*?<\\/figure>", "gi");
const SION_YT_IFR = new RegExp("<iframe\\b[^>]*(?:" + SION_YT_ALT + ")[^>]*>(?:[\\s\\S]*?<\\/iframe>)?", "gi");
const SION_YT_A = new RegExp("<a\\b[^>]*href=[\"'][^\"']*(?:" + SION_YT_ALT + ")[^\"']*[\"'][^>]*>([\\s\\S]*?)<\\/a>", "gi");
const SION_YT_URL = new RegExp("https?:\\/\\/(?:www\\.|m\\.)?(?:youtube(?:-nocookie)?\\.com|youtu\\.be|web\\.archive\\.org\\/web\\/\\d+\\/https?:\\/\\/(?:www\\.)?youtube\\.com)\\/[^\\s\"'<]*(?:" + SION_YT_ALT + ")[^\\s\"'<]*", "gi");
const SION_YT_TXT = new RegExp(";?\\s*YouTube\\s+(?:" + SION_YT_ALT + ")(?:\\s*\\(secondary host\\))?", "gi");
function noSionYT(h) {
  if (!h || typeof h !== "string" || !new RegExp(SION_YT_ALT + "|family channel", "i").test(h)) return h;
  return h.replace(SION_YT_FIG, "").replace(SION_YT_IFR, "").replace(SION_YT_A, "$1").replace(SION_YT_URL, "").replace(SION_YT_TXT, "")
    .replace(/\bfamily channel\b/gi, "channel");
}
const ARCHIVED_ON_PROJECTS = new Set(["/project-management/brief-evidence-recovery-draft/", "/project-management/highlight-reports/highlight-report-week-36-2026/", "/project-management/highlight-reports/highlight-report-week-37-2026/", "/project-management/highlight-reports/highlight-report-week-38-2026/", "/project-management/highlight-reports/highlight-report-week-39-2026/", "/project-management/highlight-reports/highlight-report-week-40-2026/", "/project-management/highlight-reports/highlight-report-week-41-2026/", "/project-management/justice/brief/", "/project-management/justice/mandate/", "/project-management/mandate-evidence-recovery-phase-draft/", "/project-management/plan-evidence-recovery-draft/", "/highlight-report-october-2026/", "/project-management/analytics/", "/project-management/brief/", "/project-management/business-case/", "/project-management/change-control/", "/project-management/communication-management-approach/", "/project-management/configuration-item-records/", "/project-management/delivery-breakdown/", "/project-management/end-stage-report-s0/", "/project-management/highlight-reports/", "/project-management/highlight-reports/17-october-2026-highlight-report-addendum-county-treasures-cross-institution-packs/", "/project-management/highlight-reports/april-2026/", "/project-management/highlight-reports/august-2026/", "/project-management/highlight-reports/december-2025/", "/project-management/highlight-reports/february-2026/", "/project-management/highlight-reports/hr-01-2026-10-18/", "/project-management/highlight-reports/hr-02-2026-10-18/", "/project-management/highlight-reports/hr-02-2026-10-19/", "/project-management/highlight-reports/january-2026/", "/project-management/highlight-reports/july-2026/", "/project-management/highlight-reports/june-2026/", "/project-management/highlight-reports/march-2026/", "/project-management/highlight-reports/may-2026/", "/project-management/highlight-reports/november-2025/", "/project-management/highlight-reports/october-2026-highlight-report-addendum-litigation-activation/", "/project-management/highlight-reports/october-2026-highlight-report-forensic-reframe-control-point-baseline/", "/project-management/highlight-reports/october-2026-highlight-report/", "/project-management/highlight-reports/september-2026-highlight-report-full-control-record/", "/project-management/highlight-reports/september-2026/", "/project-management/justice/", "/project-management/justice/plan/", "/project-management/mandate/", "/project-management/october-2026-s0-control-register/", "/project-management/organisation-roles/", "/project-management/plan/", "/project-management/plan/stage-plan-litigation-activation-sprint-8-october-14-november-2026/", "/project-management/prince2-7-compliance-control-manual/", "/project-management/prince2-control-registers/", "/project-management/prince2-project-initiation-documentation-g0-pack/", "/project-management/prince2-project-initiation-documentation-g0-pack/p1-evidence-archive-pid/", "/project-management/prince2-project-initiation-documentation-g0-pack/p2-title-justice-accountability-pid/", "/project-management/prince2-project-initiation-documentation-g0-pack/p3-artefacts-pid/", "/project-management/prince2-project-initiation-documentation-g0-pack/p4-t-mawr-replica-museum-pid/", "/project-management/product-breakdown-structure/", "/project-management/programme-dashboard/", "/project-management/report-templates/", "/project-management/stage-plan-s0-s1/", "/project-management/work-packages/"]);
const WITHDRAWN_PATHS = new Set(["/corrections-log-18-oct-2026/","/draft-email/","/evidence-library/newspaper-1974-article/","/evidence-library/newspaper-1988-history-fight-to-save-farm/","/evidence-library/newspaper-transcriptions/","/highlight-report-october-2026/","/new-sources-oct-2026/","/project-management/analytics/","/project-management/brief-evidence-recovery-draft/","/project-management/brief/","/project-management/business-case/","/project-management/change-control/","/project-management/communication-management-approach/","/project-management/configuration-item-records/","/project-management/delivery-breakdown/","/project-management/end-stage-report-s0/","/project-management/highlight-reports/","/project-management/highlight-reports/17-october-2026-highlight-report-addendum-county-treasures-cross-institution-packs/","/project-management/highlight-reports/april-2026/","/project-management/highlight-reports/august-2026/","/project-management/highlight-reports/december-2025/","/project-management/highlight-reports/february-2026/","/project-management/highlight-reports/highlight-report-week-36-2026/","/project-management/highlight-reports/highlight-report-week-37-2026/","/project-management/highlight-reports/highlight-report-week-38-2026/","/project-management/highlight-reports/highlight-report-week-39-2026/","/project-management/highlight-reports/highlight-report-week-40-2026/","/project-management/highlight-reports/highlight-report-week-41-2026/","/project-management/highlight-reports/hr-01-2026-10-18/","/project-management/highlight-reports/hr-02-2026-10-18/","/project-management/highlight-reports/hr-02-2026-10-19/","/project-management/highlight-reports/january-2026/","/project-management/highlight-reports/july-2026/","/project-management/highlight-reports/june-2026/","/project-management/highlight-reports/march-2026/","/project-management/highlight-reports/may-2026/","/project-management/highlight-reports/november-2025/","/project-management/highlight-reports/october-2026-highlight-report-addendum-litigation-activation/","/project-management/highlight-reports/october-2026-highlight-report-forensic-reframe-control-point-baseline/","/project-management/highlight-reports/october-2026-highlight-report/","/project-management/highlight-reports/september-2026-highlight-report-full-control-record/","/project-management/highlight-reports/september-2026/","/project-management/justice/","/project-management/justice/brief/","/project-management/justice/mandate/","/project-management/justice/plan/","/project-management/mandate-evidence-recovery-phase-draft/","/project-management/mandate/","/project-management/october-2026-s0-control-register/","/project-management/organisation-roles/","/project-management/plan-evidence-recovery-draft/","/project-management/plan/","/project-management/plan/stage-plan-litigation-activation-sprint-8-october-14-november-2026/","/project-management/prince2-7-compliance-control-manual/","/project-management/prince2-control-registers/","/project-management/prince2-project-initiation-documentation-g0-pack/","/project-management/prince2-project-initiation-documentation-g0-pack/p1-evidence-archive-pid/","/project-management/prince2-project-initiation-documentation-g0-pack/p2-title-justice-accountability-pid/","/project-management/prince2-project-initiation-documentation-g0-pack/p3-artefacts-pid/","/project-management/prince2-project-initiation-documentation-g0-pack/p4-t-mawr-replica-museum-pid/","/project-management/product-breakdown-structure/","/project-management/programme-dashboard/","/project-management/report-templates/","/project-management/stage-plan-s0-s1/","/project-management/work-packages/","/start-here-2/","/the-tightrope-2/","/wiki-sitemap-semver/","/evidence/mr-0118/","/evidence/mr-0119/","/evidence/mr-0120/","/evidence/mr-0121/","/evidence/mr-0122/","/evidence/mr-0123/","/evidence/mr-0124/","/evidence/mr-0125/","/evidence/mr-0128/","/evidence/mr-0129/","/evidence/mr-0130/","/evidence/mr-0131/","/evidence/mr-0132/","/evidence/mr-0133/","/evidence/mr-0134/","/evidence/mr-0135/","/evidence/mr-0136/","/evidence/mr-0137/","/evidence/mr-0138/","/evidence/mr-0139/","/evidence/mr-0140/","/evidence/mr-0141/","/evidence/mr-0142/","/evidence/mr-0143/","/evidence/mr-0144/","/evidence/mr-0145/"]);
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
