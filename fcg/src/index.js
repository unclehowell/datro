/**
 * fcg-wp — fcg.bucklerfamily.estate. Serverless WP-shaped CMS on Cloudflare Workers + D1, with GraphQL.
 * 24 Oct 2026: /first-seen — First appeared online register (firstseen.js, built by work/first-seen/build_fcg.py).
 * 21 Oct 2026: home is the Security clearance ranking (clearance.js, built from work/fcg/scores.json); Accountability Index moved to /accountability/.
 * 20 Oct 2026: dark Starlink-style theme shared with projects.bucklerfamily.estate (theme.css / theme.js / Barlow fonts),
 * one page shell for every route, 0 D1 reads on the home page and assets, and an edge cache (5 min fresh,
 * served stale if D1 is unavailable) so a D1 read-allowance outage no longer takes the site down.
 */
import THEME_CSS from "./theme.css";
const THEME_JS = String.raw`// fcg.bucklerfamily.estate theme script: the nav turns solid on scroll (as on projects.bucklerfamily.estate), and inline colours
// carried over from the source pages are re-toned so no text ends up dark-on-black.
(function(){var n=document.querySelector('.sl-nav');if(n){var f=function(){n.classList.toggle('is-solid',window.scrollY>24)};f();window.addEventListener('scroll',f,{passive:true})}
function rgb(s){var m=/rgba?\(([^)]+)\)/.exec(s||'');if(!m)return null;var p=m[1].split(',').map(parseFloat);return{r:p[0],g:p[1],b:p[2],a:p.length>3?p[3]:1}}
function lum(c){function ch(v){v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)}return .2126*ch(c.r)+.7152*ch(c.g)+.0722*ch(c.b)}
function bgOf(el){while(el&&el.nodeType===1){var c=rgb(getComputedStyle(el).backgroundColor);if(c&&c.a>.5)return c;el=el.parentElement}return{r:0,g:0,b:0,a:1}}
var root=document.querySelector('.content');if(!root)return;var els=root.querySelectorAll('[style],font,span,td,th,p,li,a,strong,em,div');var max=6000;
for(var i=0;i<els.length&&i<max;i++){var el=els[i];if(!el.firstChild)continue;var cs=getComputedStyle(el);var fg=rgb(cs.color);if(!fg)continue;var bg=bgOf(el);var lf=lum(fg),lb=lum(bg);var hi=Math.max(lf,lb),lo=Math.min(lf,lb);if((hi+.05)/(lo+.05)<3){el.style.setProperty('color',lb<.4?'#d4d4d4':'#212529','important')}}
})();`;
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
    '<span style="flex:1;text-align:center;min-width:130px;font-size:12px;opacity:.95">Estate tour · 9 / 64 · Family Estate Site</span>' +
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
<section class="sl-band" id="theories"><h2>Competing theories, most plausible first</h2>
<p class="meta">Five theories that could account for the record, ordered from most to least plausible on the evidence held today. Each is a theory, not a finding; the courts’ view is ranked with the rest. Evidence for and against each, with links to every record: <a href="https://cedwyn.bucklerfamily.estate/thousand-cuts/">1000 Cuts on Cedwyn</a>.</p>
<ol class="idx">
<li><strong>The courts’ view.</strong> On this theory, possession was lawfully recovered and the paper title was never extinguished: the 1962 order stopped the 12-year period, and the 31 Oct 1974 letters made the later possession a licence. <span class="meta">Would be settled by the 1938 Bute–Western Ground Rents conveyance plan, and any written rejection of the 1974 licence.</span></li>
<li><strong>Lawful steps, timed against the 12-year clock.</strong> On this theory, each step was lawful on its own, but together they kept the family’s possession from running 12 years without the ownership plea being decided. <span class="meta">Would be settled by the 1974 Cardiff County Court file (HMCTS reply due 2 Nov 2026) and BP’s own files on the 1974 and 1983 steps.</span></li>
<li><strong>The farmhouse parcel stood outside the paper chain.</strong> On this theory, Parcel A, the house parcel, was never conveyed in the Bute → Western Ground Rents chain. <span class="meta">Would be settled by the 1938 conveyance and plan, and the 1905 Bute conveyance.</span></li>
<li><strong>The 1983 registration misdescribed the occupation.</strong> On this theory, the farmhouse application, made while she lived there and examined after her death, did not give the Registry the occupier’s true position. <span class="meta">Would be settled by the Land Registry’s 1983 application papers and letters (reply due 28 Oct 2026).</span></li>
<li><strong>A 1988 sale drove the clearance.</strong> On this theory, the site had become an asset for sale in 1988, and the clearance served that sale. <span class="meta">Would be settled by sale particulars for 1988–93, or the Land Registry history of WA231076.</span></li>
</ol></section>
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
