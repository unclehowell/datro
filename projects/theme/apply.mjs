// projects.bucklerfamily.estate — applies the dark (Starlink-style) theme to every page in projects/public.
// Idempotent: a page that already links /assets/theme.css is left alone. Content, headings, titles and links are not changed;
// only the shared <style> block is swapped for /assets/theme.css and the page is wrapped in nav / hero / footer containers.
// Run: node projects/theme/apply.mjs   (check.mjs also runs it, so a page regenerated in the old plain format is themed at build).
import fs from "fs"; import path from "path";
const here = path.dirname(new URL(import.meta.url).pathname);
export const publicDir = path.join(here, "..", "public");
const HEAD = `<meta name="theme-color" content="#000000"/>
  <link rel="preload" href="/assets/fonts/barlow-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin/>
  <link rel="preload" href="/assets/fonts/barlow-latin-500-normal.woff2" as="font" type="font/woff2" crossorigin/>
  <link rel="stylesheet" href="/assets/theme.css"/>
  <script src="/assets/theme.js" defer></script>`;
const FOOT = `<footer class="sl-foot"><div class="sl-foot-in"><a class="sl-foot-title" href="/">Great House Farm Projects — PRINCE2</a><a href="/mandate/">Mandate</a><a href="/posts.json">posts.json</a><a href="https://greathousefarmwiki.wordpress.com/">Great House Farm wiki</a><a href="https://fcg.bucklerfamily.estate/">fcg.bucklerfamily.estate</a></div></footer>`;

export function themePage(t) {
  if (t.includes('href="/assets/theme.css"')) return null;
  const h = t.indexOf("</head>"); if (h < 0) return null;
  let head = t.slice(0, h), rest = t.slice(h);
  head = head.replace(/<style>[\s\S]*?<\/style>/, HEAD);
  if (!head.includes("/assets/theme.css")) head = head.replace(/\s*$/, "\n  " + HEAD + "\n");
  // nav
  rest = rest.replace(/<nav class="top">([\s\S]*?)<\/nav>/, (m, inner) =>
    `<header class="sl-nav"><nav class="top" aria-label="Site">${inner.replace(/<\/a> · <a/g, '</a><span class="sep" aria-hidden="true"> · </span><a')}</nav></header>`);
  let kind;
  if (/<article>\s*<h1>/.test(rest)) {
    kind = "sl-page";
    rest = rest.replace(/<article>\s*(<h1>[\s\S]*?<\/h1>)\s*(<p class="meta">[\s\S]*?<\/p>)?/, (m, h1, meta) =>
      `<article><header class="sl-hero"><div class="sl-hero-in">${h1}${meta || ""}</div></header><div class="sl-article">`);
    rest = rest.replace(/<\/article>(?![\s\S]*<\/article>)/, "</div></article>");
  } else if (/<\/nav><\/header>\s*<h1>[^<]*<\/h1>\s*<p>/.test(rest) && /<h2>/.test(rest)) {
    kind = "sl-home";
    rest = rest.replace(/(<\/nav><\/header>)\s*(<h1>[\s\S]*?<\/h1>)\s*(<p>[\s\S]*?<\/p>)\s*(<p class="meta">[\s\S]*?<\/p>)?/, (m, nv, h1, p, meta) =>
      `${nv}\n<header class="sl-hero"><div class="sl-hero-in">${h1}${p}${meta || ""}<div class="sl-actions"><a class="sl-btn solid" href="/mandate/">Project Mandate</a><a class="sl-btn" href="/business-case/">Business Case</a></div></div><span class="sl-scroll" aria-hidden="true"></span></header>\n<main class="sl-main">`);
    // each h2 + its list becomes a band
    rest = rest.replace(/<h2>([\s\S]*?)<\/h2>\s*(<ul class="idx">[\s\S]*?<\/ul>)/g, (m, h2, ul) => `<section class="sl-band"><h2>${h2}</h2>\n${ul}</section>`);
    rest = rest.replace(/<\/body>/, "</main></body>");
  } else {
    kind = "sl-plainpage";
    rest = rest.replace(/(<\/nav><\/header>)\s*(<h1>[\s\S]*?<\/h1>)([\s\S]*?)<\/body>/, (m, nv, h1, body) =>
      `${nv}\n<header class="sl-hero"><div class="sl-hero-in">${h1}</div></header><div class="sl-plain">${body}</div></body>`);
  }
  rest = rest.replace(/<body>/, `<body class="${kind}">`).replace(/<\/body>/, FOOT + "</body>");
  return head + rest;
}

export function applyAll(dir = publicDir) {
  let changed = 0, seen = 0;
  (function walk(d) { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); if (fs.statSync(p).isDirectory()) { if (f !== "assets") walk(p); }
    else if (f.endsWith(".html")) { seen++; const t = fs.readFileSync(p, "utf8"); const o = themePage(t); if (o) { fs.writeFileSync(p, o); changed++; } } } })(dir);
  return { seen, changed };
}
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) console.log("theme", JSON.stringify(applyAll()));
