/**
 * fcg-wp — fcg.bucklerfamily.estate. Serverless WP-shaped CMS on Cloudflare Workers + D1, with GraphQL.
 * 24 Oct 2026: /first-seen — First appeared online register (firstseen.js, built by work/first-seen/build_fcg.py).
 * 21 Oct 2026: home is the Security clearance ranking (clearance.js, built from work/fcg/scores.json); Accountability Index moved to /accountability/.
 * 20 Oct 2026: dark Starlink-style theme shared with projects.bucklerfamily.estate (theme.css / theme.js / Barlow fonts),
 * one page shell for every route, 0 D1 reads on the home page and assets, and an edge cache (5 min fresh,
 * served stale if D1 is unavailable) so a D1 read-allowance outage no longer takes the site down.
 */
import THEME_CSS from "./theme.css";
import THEME_JS from "./theme.js";
import F300 from "./fonts/barlow-latin-300-normal.woff2";
import F400 from "./fonts/barlow-latin-400-normal.woff2";
import F500 from "./fonts/barlow-latin-500-normal.woff2";
import F700 from "./fonts/barlow-latin-700-normal.woff2";
import FX400 from "./fonts/barlow-latin-ext-400-normal.woff2";
import FX700 from "./fonts/barlow-latin-ext-700-normal.woff2";
import OFL from "./fonts/OFL.txt";
import ACCOUNTABILITY_MAIN from "./accountability.js";
import { HOME as CLEARANCE_HOME, STANDARD as CLEARANCE_STANDARD, DATA as CLEARANCE_DATA } from "./clearance.js";
import { HOME as FIRSTSEEN_HOME, DATA as FIRSTSEEN_DATA } from "./firstseen.js";

const FONTS = {
  "barlow-latin-300-normal.woff2": F300, "barlow-latin-400-normal.woff2": F400, "barlow-latin-500-normal.woff2": F500,
  "barlow-latin-700-normal.woff2": F700, "barlow-latin-ext-400-normal.woff2": FX400, "barlow-latin-ext-700-normal.woff2": FX700,
};
const ASSET_V = "20261020a";
const FRESH_MS = 5 * 60 * 1000;
const BRAND = "FCG";
const BRAND_LONG = "Fraud, concealment and government involvement";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") return cors(new Response(null, { status: 204 }));
    if (url.pathname === "/health") return cors(json({ ok: true, service: "fcg-wp" }));
    if (url.pathname === "/graphql") return cors(await handleGraphQL(request, env));
    if (request.method === "GET" || request.method === "HEAD") {
      const a = asset(url.pathname);
      if (a) return cors(a);
      if (url.pathname === "/" || url.pathname === "/index.html") return cors(html(clearancePage(), 200, 300));
      if (url.pathname === "/standard" || url.pathname === "/standard/") return cors(html(standardPage(), 200, 300));
      if (url.pathname === "/first-seen" || url.pathname === "/first-seen/") return cors(html(firstSeenPage(), 200, 300));
      if (url.pathname === "/first-seen.json") return cors(new Response(FIRSTSEEN_DATA, { headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "public, max-age=300" } }));
      if (url.pathname === "/clearance.json") return cors(new Response(CLEARANCE_DATA, { headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "public, max-age=300" } }));
      if (url.pathname === "/theory" || url.pathname === "/theory/" || url.pathname === "/theory/index.html") return cors(html(homePage(env), 200, 300));
      if (url.pathname === "/accountability" || url.pathname === "/accountability/") return cors(html(indexPage(), 200, 300));
      if (url.pathname === "/index" || url.pathname === "/index/") return Response.redirect(url.origin + "/accountability/", 301);
      return cors(await cached(request, ctx, () => handlePage(url, env)));
    }
    return cors(json({ error: "Not found" }, 404));
  },
};

function cors(res) {
  const h = new Headers(res.headers);
  h.set("Access-Control-Allow-Origin", "*");
  h.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  h.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return new Response(res.body, { status: res.status, headers: h });
}
function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), { status, headers: { "Content-Type": "application/json; charset=utf-8" } });
}
function estateTourNav() {
  return '<nav data-estate-tour-nav aria-label="Estate website tour" style="box-sizing:border-box;display:flex;align-items:center;justify-content:space-between;gap:.65rem;flex-wrap:wrap;flex:0 0 100%;width:100%;max-width:100%;min-height:36px;padding:.45rem .8rem;margin:.35rem 0;background:#1d1b18;color:#f5ead5;border:1px solid #9f7b42;border-radius:7px;font:500 14px/1.35 system-ui,sans-serif;position:relative;z-index:9999">' +
    '<a style="color:#f5ead5;text-decoration:none;padding:.3rem .2rem" href="https://projects.bucklerfamily.estate/" rel="prev" aria-label="Previous website: Project Office">← Previous</a>' +
    '<span style="flex:1;text-align:center;min-width:130px;font-size:12px;opacity:.95">Estate tour · 9 / 62 · Family Estate Site</span>' +
    '<a style="color:#f5ead5;text-decoration:none;padding:.3rem .2rem" href="https://bpvsbuckler.bucklerfamily.estate/" rel="next" aria-label="Next website: BP v Buckler Archive">Next →</a></nav>';
}
function html(body, status = 200, maxAge = 60) {
  let page = String(body ?? "");
  if (!page.includes("data-estate-tour-nav")) {
    const nav = estateTourNav();
    if (/<\/header\s*>/i.test(page)) page = page.replace(/<\/header\s*>/i, nav + "</header>");
    else if (/<body\b[^>]*>/i.test(page)) page = page.replace(/<body\b[^>]*>/i, m => m + '<header data-estate-tour-shell style="box-sizing:border-box;width:100%;margin:0;padding:.3rem .7rem;background:#111;color:#f5ead5;border-bottom:1px solid #9f7b42">' + nav + "</header>");
    else page = nav + page;
  }
  return new Response(page, { status, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=" + maxAge } });
}
function esc(s) {
  return String(s ?? "").replace(/&(?!#?[A-Za-z0-9]+;)/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function asset(path) {
  const long = "public, max-age=604800";
  if (path === "/assets/theme.css") return new Response(THEME_CSS, { headers: { "Content-Type": "text/css; charset=utf-8", "Cache-Control": long } });
  if (path === "/assets/theme.js") return new Response(THEME_JS, { headers: { "Content-Type": "text/javascript; charset=utf-8", "Cache-Control": long } });
  if (path === "/assets/fonts/OFL.txt") return new Response(OFL, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": long } });
  const m = /^\/assets\/fonts\/([a-z0-9-]+\.woff2)$/.exec(path);
  if (m && FONTS[m[1]]) return new Response(FONTS[m[1]], { headers: { "Content-Type": "font/woff2", "Cache-Control": "public, max-age=31536000, immutable" } });
  return null;
}

// Edge cache in front of D1: fresh for 5 minutes; if D1 fails, the last good copy is served.
async function cached(request, ctx, build) {
  const cache = caches.default;
  const key = new Request(new URL(request.url).origin + new URL(request.url).pathname, { method: "GET" });
  let hit = null;
  try { hit = await cache.match(key); } catch (e) { hit = null; }
  const fresh = hit && Date.now() - Number(hit.headers.get("x-fcg-built") || 0) < FRESH_MS;
  if (fresh) return relabel(hit, "HIT");
  try {
    const res = await build();
    if (res.status === 200) {
      const body = await res.text();
      const h = new Headers(res.headers);
      h.set("Cache-Control", "public, max-age=86400");
      h.set("x-fcg-built", String(Date.now()));
      ctx.waitUntil(cache.put(key, new Response(body, { status: 200, headers: h })));
      return relabel(new Response(body, { status: 200, headers: res.headers }), "MISS");
    }
    return res;
  } catch (e) {
    if (hit) return relabel(hit, "STALE");
    return html(shell({ title: "Temporarily unavailable", kind: "sl-plainpage",
      main: `<header class="sl-hero"><div class="sl-hero-in"><h1>Temporarily unavailable</h1></div></header><div class="sl-plain"><p>This page could not be loaded just now. Please try again in a few minutes.</p><div class="sl-actions"><a class="sl-btn" href="/">Home</a></div></div>` }), 503, 0);
  }
}
function relabel(res, state) {
  const h = new Headers(res.headers);
  h.set("Cache-Control", "public, max-age=60");
  h.set("x-fcg-cache", state);
  h.delete("x-fcg-built");
  return new Response(res.body, { status: res.status, headers: h });
}

const NAV = `<header class="sl-nav"><nav class="top" aria-label="Site"><a href="/"><strong>${BRAND}</strong></a><a href="/">Clearance</a><a href="/standard">Standard</a><a href="/first-seen">First online</a><a href="/accountability/">Accountability</a><a href="/theory/">Theory</a><a class="sl-ghost" href="/case">Our case</a></nav></header>`;
const FOOT = `<footer class="sl-foot"><div class="sl-foot-in"><a class="sl-foot-title" href="/">${BRAND} — Security clearance</a><a href="/">Clearance ranking</a><a href="/standard">Clearance standard</a><a href="/first-seen">First appeared online</a><a href="/accountability/">Accountability Index</a><a href="/theory/">Theory home</a><a href="/case">Our case</a><a href="/mandate">Mandate</a><a href="/graphql">GraphQL</a><a href="https://projects.bucklerfamily.estate/">Projects (PRINCE2)</a><a href="https://greathousefarmwiki.wordpress.com/">Legal Wiki</a><a href="https://bucklerfamily.estate/">bucklerfamily.estate campus</a></div></footer>`;

function shell({ title, description = "", kind, main }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>${esc(title)}</title>
  ${description ? `<meta name="description" content="${esc(description)}"/>` : ""}
  <meta name="theme-color" content="#000000"/>
  <link rel="preload" href="/assets/fonts/barlow-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin/>
  <link rel="preload" href="/assets/fonts/barlow-latin-500-normal.woff2" as="font" type="font/woff2" crossorigin/>
  <link rel="stylesheet" href="/assets/theme.css?v=${ASSET_V}"/>
  <script src="/assets/theme.js?v=${ASSET_V}" defer></script>
  <script src="https://bucklerfamily.estate/ghf-lang/ghf-lang.js" defer></script>
  <script src="https://bucklerfamily.estate/ebook/cta.js" defer></script>
  <script src="https://bucklerfamily.estate/basecamp.js" defer></script>
  <script src="https://bucklerfamily.estate/ghf-lang/ghf-boot.js?v=2.1.0"></script>
</head>
<body class="${kind}">${NAV}
${main}
${FOOT}</body>
</html>`;
}

// Pages stored in the older plain format carry their own head bits, nav and source notice; tidy them at render.
function tidy(content) {
  let c = String(content || "");
  c = c.replace(/^\s*<meta name="viewport"[^>]*>\s*/i, "");
  c = c.replace(/^\s*<title>[\s\S]*?<\/title>\s*/i, "");
  c = c.replace(/<style>body\{font-family:system-ui[\s\S]*?<\/style>/g, "");
  c = c.replace(/<style>\.migr\{[\s\S]*?<\/style>/g, "");
  c = c.replace(/<p class="fcgnav">[\s\S]*?<\/p>/g, "");
  return words(c).replace(/class="migr"/g, 'class="fcg-src"');
}
function words(s) {
  return String(s || "")
    .replace(/ \(moved from the wiki\)/g, "")
    .replace(/Copied unchanged from the Great House Farm wiki page /g, "Source: Legal Wiki page ")
    .replace(/\(wiki page (\d+)\) on 19 October 2026\. /g, "(page $1). ")
    .replace(/link back to the wiki(?:'|&#039;|’)s own evidence pages/g, "link to the Legal Wiki's evidence pages")
    .replace(/All migrated case pages/g, "All case pages")
    .replace(/^Migrated from wiki page /, "Legal Wiki page ");
}

async function handlePage(url, env) {
  let slug = decodeURIComponent(url.pathname).replace(/^\/+|\/+$/g, "");
  if (slug === "index.html") slug = "";
  const row = await env.DB.prepare(
    "SELECT title, slug, content, excerpt, meta_json FROM posts WHERE slug = ? AND status = 'publish' LIMIT 1"
  ).bind(slug).first();
  if (!row) {
    return html(shell({ title: "Not found — " + BRAND, kind: "sl-plainpage",
      main: `<header class="sl-hero"><div class="sl-hero-in"><h1>Not found</h1></div></header><div class="sl-plain"><p>No page at <code>/${esc(slug)}</code>.</p><div class="sl-actions"><a class="sl-btn solid" href="/case">Our case</a><a class="sl-btn" href="/">Home</a></div></div>` }), 404, 60);
  }
  let meta = {};
  try { meta = JSON.parse(row.meta_json || "{}"); } catch (e) { meta = {}; }
  const title = words(row.title);
  const excerpt = words(row.excerpt);
  if (meta.hub) {
    return html(shell({ title: title + "— " + BRAND, description: excerpt, kind: "sl-home",
      main: `<header class="sl-hero"><div class="sl-hero-in"><p class="sl-kicker">${BRAND} · Great House Farm / Tŷ Mawr</p><h1>${esc(title)}</h1>${excerpt ? `<p>${esc(excerpt)}</p>` : ""}<div class="sl-actions"><a class="sl-btn solid" href="#sections">Sections</a><a class="sl-btn" href="#inst">Institutions</a></div></div><span class="sl-scroll" aria-hidden="true"></span></header>
<main class="sl-main">${tidy(row.content)}</main>` }));
  }
  const kicker = row.slug.startsWith("case/") ? `<p class="sl-kicker">${BRAND} · Our case</p>` : `<p class="sl-kicker">${BRAND}</p>`;
  const back = row.slug.startsWith("case/") ? `<nav class="fcg-pager" aria-label="More"><a class="sl-btn" href="/case">All case pages</a><a class="sl-btn" href="/">Home</a></nav>` : `<nav class="fcg-pager" aria-label="More"><a class="sl-btn" href="/case">Our case</a><a class="sl-btn" href="/">Home</a></nav>`;
  return html(shell({ title: title + "— " + BRAND, description: excerpt, kind: "sl-page",
    main: `<article><header class="sl-hero"><div class="sl-hero-in">${kicker}<h1>${esc(title)}</h1>${excerpt ? `<p class="meta">${esc(excerpt)}</p>` : ""}</div></header><div class="sl-article"><div class="content">${tidy(row.content)}</div></div></article>${back}` }));
}

function homePage(env) {
  const band = (h, items) => `<section class="sl-band"><h2>${h}</h2>\n<ul class="idx">${items.map(([href, t, m]) => `<li><a href="${href}"><strong>${t}</strong></a> <span class="meta">${m}</span></li>`).join("\n")}</ul></section>`;
  return shell({ title: "Theory — " + BRAND + "— " + BRAND_LONG, kind: "sl-home",
    description: "Our case on fraud, concealment and government involvement in the Great House Farm (Tŷ Mawr) case. Not findings of any court or public body.",
    main: `<header class="sl-hero"><div class="sl-hero-in"><p class="sl-kicker">${BRAND} · Great House Farm / Tŷ Mawr</p><h1>${BRAND_LONG}</h1><p>Great House Farm (Tŷ Mawr), Llandough-juxta-Penarth: our case and lines of enquiry on fraud, concealment and the handling of the case by government, courts and public bodies. Not findings of any court or public body.</p><div class="sl-actions"><a class="sl-btn solid" href="/case">Our case</a><a class="sl-btn" href="/">Accountability Index</a><a class="sl-btn" href="/mandate">Project Mandate</a></div></div><span class="sl-scroll" aria-hidden="true"></span></header>
<main class="sl-main">
${band("Accountability", [
  ["/", "Accountability Index", "public bodies ranked by questions the record had already answered"],
])}
${band("Our case", [
  ["/case#case", "Fraud and concealment", "analysis and legal review"],
  ["/case#claims", "Working theories", "our case, unproven"],
  ["/case#handling", "Government, court and public-body handling", "how the case was handled"],
  ["/case#registers", "Registers, chronologies and matrices", "who knew what, when"],
  ["/case#capture", "Forensic evidence capture", "decisive documents"],
  ["/case#inst", "Institutional forensic assessments", "one page per institution"],
  ["/case#reports", "Reports with fraud triggers", "PRINCE2 highlight reports"],
])}
${band("Project", [
  ["/mandate", "Project Mandate", "Great House Farm evidence recovery"],
  ["https://projects.bucklerfamily.estate/", "Projects", "PRINCE2 project record"],
  ["/graphql", "GraphQL API", "machine-readable pages"],
])}
${band("Across the estate", [
  ["https://greathousefarmwiki.wordpress.com/", "Legal Wiki", "evidence register and timeline"],
  ["https://bpvsbuckler.bucklerfamily.estate/", "BP v Buckler", "the story in slides"],
  ["https://dartboard.bucklerfamily.estate/", "Dartboard", "records and memory"],
  ["https://bucklerfamily.estate/", "bucklerfamily.estate", "the campus"],
])}
</main>` });
}

// Home page since 20 Oct 2026: the Accountability Index (content in accountability.js; the former home is at /theory/).
function clearancePage() {
  return shell({ title: "Security clearance — " + BRAND + "— Great House Farm / Tŷ Mawr", kind: "sl-home",
    description: "Institutions ranked out of 1000 on how they answered requests for the Great House Farm record: every point from a dated email or letter.",
    main: CLEARANCE_HOME });
}
function standardPage() {
  return shell({ title: "Clearance standard — " + BRAND, kind: "sl-plainpage",
    description: "How FCG clearance scores are worked out: start at 500, fixed point rules, statutory clocks, cleared at 900.",
    main: CLEARANCE_STANDARD });
}
function firstSeenPage() {
  return shell({ title: "First appeared online — " + BRAND + "— Great House Farm / Tŷ Mawr", kind: "sl-plainpage",
    description: "When records about Great House Farm, Llandough first became publicly available online, with dated evidence of absence before and the date each was requested.",
    main: FIRSTSEEN_HOME });
}
function indexPage() {
  return shell({ title: "Accountability Index — " + BRAND + "— Great House Farm / Tŷ Mawr", kind: "sl-home",
    description: "Public bodies ranked by clarification questions the record had already answered, with dates, quotes, days lost and the statutory clock.",
    main: ACCOUNTABILITY_MAIN });
}

async function handleGraphQL(request, env) {
  if (request.method === "GET") {
    return html(shell({ title: "GraphQL — " + BRAND, kind: "sl-plainpage",
      main: `<header class="sl-hero"><div class="sl-hero-in"><p class="sl-kicker">${BRAND} · API</p><h1>GraphQL</h1></div></header><div class="sl-plain"><p>POST JSON with a <code>query</code> field to this address.</p><pre><code>{ "query": "{ posts(status: publish, first: 5) { nodes { title slug date } } }" }</code></pre><p>Also: <code>page(slug: "case/the-tightrope") { title content }</code></p></div>` }), 200, 300);
  }
  if (request.method !== "POST") return json({ errors: [{ message: "Use POST" }] }, 405);
  let body;
  try { body = await request.json(); } catch (e) { return json({ errors: [{ message: "Invalid JSON" }] }, 400); }
  try {
    return json({ data: await executeGraphQL(body.query || "", body.variables || {}, env, request) });
  } catch (e) {
    return json({ errors: [{ message: e.message || String(e) }] }, 400);
  }
}

async function executeGraphQL(query, variables, env, request) {
  const q = query.replace(/\s+/g, " ");
  if (/\bmutation\b/i.test(query) && /createPost\s*\(/.test(query)) {
    const token = env.ADMIN_TOKEN;
    if (!token) throw new Error("ADMIN_TOKEN not configured");
    if ((request.headers.get("Authorization") || "") !== "Bearer " + token) throw new Error("Unauthorized");
    const input = variables.input || {};
    const title = input.title || "Untitled";
    const slug = input.slug || title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 120) || "post";
    const result = await env.DB.prepare(
      "INSERT INTO posts (title, slug, content, excerpt, status, post_type, author) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id, title, slug, content, excerpt, status, post_type, date_gmt"
    ).bind(title, slug, input.content || "", input.excerpt || "", input.status || "draft", input.postType || "post", input.author || "admin").first();
    return { createPost: mapRow(result) };
  }
  const single = q.match(/\b(page|post)\s*\(\s*slug\s*:\s*["']([^"']+)["']\s*\)/i);
  if (single) {
    const key = single[1].toLowerCase();
    const row = await env.DB.prepare(
      "SELECT id, title, slug, content, excerpt, status, post_type, date_gmt FROM posts WHERE slug = ? AND status = 'publish' AND post_type = ? LIMIT 1"
    ).bind(single[2], key).first();
    return { [key]: row ? mapRow(row) : null };
  }
  if (/\bposts\s*[({]/.test(q)) {
    let status = "publish";
    const sm = q.match(/status\s*:\s*(\w+)/i);
    if (sm) status = sm[1].toLowerCase();
    if (status !== "publish") throw new Error("Only published content is publicly readable");
    let first = 20;
    const fm = q.match(/first\s*:\s*(\d+)/);
    if (fm) first = Math.min(100, parseInt(fm[1], 10));
    const rs = await env.DB.prepare(
      "SELECT id, title, slug, content, excerpt, status, post_type, date_gmt FROM posts WHERE status = ? ORDER BY date_gmt DESC LIMIT ?"
    ).bind(status, first).all();
    return { posts: { nodes: (rs.results || []).map(mapRow) } };
  }
  if (/__schema|__typename/.test(q)) return { __typename: "Query" };
  throw new Error("Unsupported query. Use posts, page(slug), post(slug), or mutation createPost.");
}

function mapRow(row) {
  if (!row) return null;
  return { id: String(row.id), title: row.title, slug: row.slug, content: row.content, excerpt: row.excerpt, status: row.status, postType: row.post_type, date: row.date_gmt };
}
