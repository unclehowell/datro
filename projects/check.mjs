// projects.bucklerfamily.estate build check (Cloudflare Pages build command: node projects/check.mjs; output: projects/public)
import fs from "fs"; import path from "path";
import { applyAll } from "./theme/apply.mjs";
import { runEstate } from "./estate/build.mjs";
console.log("theme", JSON.stringify(applyAll())); // themes any page still in the old plain format (idempotent)
console.log("estate", JSON.stringify(runEstate())); // independence: wiki links -> local pages or plain text; estate nav/footer (idempotent)

// ghf-lang (20 Oct 2026): English / Cymraeg / Español dropdown on every page (idempotent; interface text only)
{
  const GHF_LANG = '<script src="https://bucklerfamily.estate/ghf-lang/ghf-lang.js" defer></script>';
  const rootL = path.join(path.dirname(new URL(import.meta.url).pathname), "public"); let nL = 0;
  (function walkL(d) { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); if (fs.statSync(p).isDirectory()) walkL(p); else if (f.endsWith(".html")) { const t = fs.readFileSync(p, "utf8"); if (!t.includes("ghf-lang.js") && t.includes("</head>")) { fs.writeFileSync(p, t.replace("</head>", GHF_LANG + "\n</head>")); nL++; } } } })(rootL);
  console.log("ghf-lang", nL);
}
const root = path.join(path.dirname(new URL(import.meta.url).pathname), "public");
const bad = [/Robin Hill/i, /hywelapbuckler/i, /7845\s?933\s?262/, /(?:\+44\s?7|\b07)\d{3}\s?\d{3}\s?\d{3}\b/, /[\w.+-]+@(?:gmail|hotmail|yahoo|outlook|icloud|btinternet|aol)\.[\w.]+/i, /family(?:'s|’s|&#8217;s)? (?:account|testimony)/i, /wordpress\.com/i];
let files = 0, fails = [];
(function walk(d) { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); if (fs.statSync(p).isDirectory()) walk(p); else if (/\.(html|json)$/.test(f)) { files++; const raw = fs.readFileSync(p, "utf8"); const t = raw.replace(/<[^>]+>/g, " ") + " " + (raw.match(/(?:href|src)="[^"]*"/g) || []).join(" "); for (const r of bad) if (r.test(t)) fails.push(`${p}: ${r}`); } } })(root);
for (const need of ["index.html", "overview/index.html", "estate/pid/index.html", "mandate/index.html", "posts.json", "assets/theme.css", "assets/theme.js", "estate/asset-register/index.html", "estate/asset-register.json", "workstreams/evidence-recovery/index.html"]) if (!fs.existsSync(path.join(root, need))) fails.push("missing " + need);
if (!/<h1>Project Initiation Documentation/.test(fs.readFileSync(path.join(root, "index.html"), "utf8"))) fails.push("index.html is not the PID (home page must be the PID)");
if (fails.length) { console.error("CHECK FAILED\n" + fails.join("\n")); process.exit(1); }
console.log(`projects check ok: ${files} files`);
