// projects.bucklerfamily.estate — estate build step (20 Oct 2026). Idempotent; check.mjs runs it before the theme.
// Makes the site independent: no link, embed or mention of the hosted wiki's address survives in the built output.
//  - a link to a wiki page this site also carries becomes a link to the local page (fragment kept);
//  - any other wiki link becomes plain text (the reference words stay, e.g. "EV-0249");
//  - the shared nav and footer are rewritten to the estate-wide ones; page titles carry the estate site name.
import fs from "fs"; import path from "path";
const here = path.dirname(new URL(import.meta.url).pathname);
export const publicDir = path.join(here, "..", "public");
export const SITE = "Cedwyn Estate Projects — PRINCE2";
const OLD_SITE = "Great House Farm Projects — PRINCE2";
const WIKI_HOST = ["greathousefarmwiki", "wordpress", "com"].join(".");
const WIKI_RE = new RegExp("https?://" + WIKI_HOST.replace(/\./g, "\\.") + "[^\"'\\s<>)]*", "g");
const A_RE = new RegExp("<a\\b([^>]*?)href=\"(https?://" + WIKI_HOST.replace(/\./g, "\\.") + "[^\"]*)\"([^>]*)>([\\s\\S]*?)</a>", "g");
export const NAV_LINKS = [["/", `<strong>${SITE}</strong>`], ["/overview/", "Overview"], ["/estate/asset-register/", "Asset register"], ["/estate/pid/", "PID"], ["/estate/risk-register/", "Registers"], ["/estate/highlight-reports/", "Reports"], ["/workstreams/evidence-recovery/", "Evidence recovery"], ["/programme/", "Programme"]];
const NAV_INNER = NAV_LINKS.map(([h, t]) => `<a href="${h}">${t}</a>`).join('<span class="sep" aria-hidden="true"> · </span>');
export const FOOT = `<footer class="sl-foot"><div class="sl-foot-in"><a class="sl-foot-title" href="/">${SITE}</a><a href="/">PID (home)</a><a href="/overview/">Overview</a><a href="/estate/mandate/">Mandate</a><a href="/programme/">Programme charter</a><a href="/estate/asset-register/">Asset register</a><a href="/workstreams/evidence-recovery/">Workstream: evidence recovery</a><a href="https://bucklerfamily.estate/">Cedwyn Estate map</a><a href="https://bucklerfamily.estate/ebook/">Get the e-book (from £0.00 · £9.99 – v0.02 · all four £31.99)</a><a href="/posts.json">posts.json</a></div></footer>`;

function localMap(dir) {
  const m = new Map();
  try {
    const j = JSON.parse(fs.readFileSync(path.join(dir, "posts.json"), "utf8"));
    for (const n of (j.posts && j.posts.nodes) || []) {
      const w = n.wikiUrl || n.originalPath; const u = n.url || ("/" + n.slug + "/");
      if (w) m.set(norm(w), new URL(u, "https://projects.bucklerfamily.estate").pathname);
    }
  } catch {}
  return m;
}
function norm(u) { try { const x = new URL(u); return x.pathname.replace(/\/+$/, "") + (x.searchParams.get("page_id") ? "?p=" + x.searchParams.get("page_id") : ""); } catch { return String(u).replace(/^https?:\/\/[^/]+/, "").split("#")[0].replace(/\/+$/, ""); } }
function resolveLocal(u, map, dir) {
  const k = norm(u); if (map.has(k)) return map.get(k);
  const seg = k.split("?")[0].split("/").filter(Boolean).pop();
  if (seg && fs.existsSync(path.join(dir, seg, "index.html"))) return "/" + seg + "/";
  return null;
}
export function fixHtml(t, map, dir, stats) {
  let o = t;
  o = o.replace(/<nav class="top"([^>]*)>[\s\S]*?<\/nav>/, (m, attrs) => `<nav class="top"${attrs}>${NAV_INNER}</nav>`);
  o = o.replace(/<footer class="sl-foot">[\s\S]*?<\/footer>/, FOOT);
  o = o.replace(/<div class="migr">Copied unchanged from the Great House Farm wiki page <a [^>]*>([\s\S]*?)<\/a> \(wiki page (\d+)\) on 19 October 2026\. Evidence references link back to the wiki's own evidence pages\./,
    (m, title, id) => `<div class="migr">Part of <a href="/workstreams/evidence-recovery/">Workstream: evidence recovery</a>. ${title} (originally wiki page ${id}) was copied unchanged on 19 October 2026; this site stands alone, so evidence references are given as plain IDs (e.g. EV-0249).`);
  o = o.replace(A_RE, (m, pre, href, post, inner) => {
    const loc = resolveLocal(href, map, dir);
    if (loc) { stats.local++; const frag = href.includes("#") ? "#" + href.split("#")[1] : ""; return `<a${pre}href="${loc}${frag}"${post}>${inner}</a>`; }
    stats.plain++; return `<span class="xref">${inner}</span>`;
  });
  o = o.replace(WIKI_RE, () => { stats.text++; return "the Great House Farm wiki"; });
  o = o.split(WIKI_HOST).join("the Great House Farm wiki");
  o = o.replace(/<title>([\s\S]*?)<\/title>/, (m, tt) => `<title>${tt.split(OLD_SITE).join(SITE)}</title>`);
  o = o.split(`<a class="sl-foot-title" href="/">${OLD_SITE}</a>`).join(`<a class="sl-foot-title" href="/">${SITE}</a>`);
  return o;
}
export function fixPosts(dir) {
  const p = path.join(dir, "posts.json"); if (!fs.existsSync(p)) return false;
  const j = JSON.parse(fs.readFileSync(p, "utf8")); let ch = false;
  if (j.site !== SITE) { j.site = SITE; ch = true; }
  if (typeof j.source === "string" && j.source.includes("wordpress")) { j.source = "Independent estate PRINCE2 site. The case pages were first compiled on the Great House Farm wiki and copied here on 19 October 2026."; ch = true; }
  for (const n of (j.posts && j.posts.nodes) || []) if (n.wikiUrl) { try { n.originalPath = new URL(n.wikiUrl).pathname; } catch {} delete n.wikiUrl; ch = true; }
  const out = JSON.stringify(j, null, 1).split(WIKI_HOST).join("the Great House Farm wiki");
  if (ch || out !== fs.readFileSync(p, "utf8")) fs.writeFileSync(p, out);
  return ch;
}

// Home page (Sion, 20 Oct 2026): the site's front page IS the Project Initiation Documentation. index.html is written from
// estate/pid/index.html on every build (so the two never drift); /estate/pid/ keeps working; the former front page lives at /overview/.
const CANON = '<link rel="canonical" href="https://projects.bucklerfamily.estate/"/>';
export function homeFromPid(dir = publicDir) {
  // 21 Oct 2026: the home page is the Parcel A PID, generated in PRINCE2 7 form; it is no longer copied from estate/pid.
  { const h = path.join(dir, "index.html"); if (fs.existsSync(h) && fs.readFileSync(h, "utf8").includes("/assets/p2.css")) return false; }
  const src = path.join(dir, "estate", "pid", "index.html"); if (!fs.existsSync(src)) return false;
  let t = fs.readFileSync(src, "utf8");
  if (!t.includes('rel="canonical"')) { t = t.replace("</head>", "  " + CANON + "\n</head>"); fs.writeFileSync(src, t); }
  const out = path.join(dir, "index.html");
  if (fs.existsSync(out) && fs.readFileSync(out, "utf8") === t) return false;
  fs.writeFileSync(out, t); return true;
}
export function runEstate(dir = publicDir) {
  const map = localMap(dir); const stats = { files: 0, changed: 0, local: 0, plain: 0, text: 0 };
  (function walk(d) { for (const f of fs.readdirSync(d)) { const p = path.join(d, f);
    if (fs.statSync(p).isDirectory()) { if (f !== "assets") walk(p); }
    else if (/\.(html|txt|xml)$/.test(f)) { stats.files++; const t = fs.readFileSync(p, "utf8"); if (t.includes("/assets/p2.css")) continue; const o = f.endsWith(".html") ? fixHtml(t, map, dir, stats) : t.split(WIKI_HOST).join("the Great House Farm wiki"); if (o !== t) { fs.writeFileSync(p, o); stats.changed++; } } } })(dir);
  stats.posts = fixPosts(dir);
  stats.home = homeFromPid(dir);
  return stats;
}
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) console.log("estate", JSON.stringify(runEstate()));
