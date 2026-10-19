// projects.bucklerfamily.estate build check (Cloudflare Pages build command: node projects/check.mjs; output: projects/public)
import fs from "fs"; import path from "path";
import { applyAll } from "./theme/apply.mjs";
console.log("theme", JSON.stringify(applyAll())); // themes any page still in the old plain format (idempotent)
const root = path.join(path.dirname(new URL(import.meta.url).pathname), "public");
const bad = [/Robin Hill/i, /hywelapbuckler/i, /7845\s?933\s?262/, /(?:\+44\s?7|\b07)\d{3}\s?\d{3}\s?\d{3}\b/, /[\w.+-]+@(?:gmail|hotmail|yahoo|outlook|icloud|btinternet|aol)\.[\w.]+/i, /family(?:'s|’s|&#8217;s)? (?:account|testimony)/i];
let files = 0, fails = [];
(function walk(d) { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); if (fs.statSync(p).isDirectory()) walk(p); else if (/\.(html|json)$/.test(f)) { files++; const t = fs.readFileSync(p, "utf8").replace(/<[^>]+>/g, " "); for (const r of bad) if (r.test(t)) fails.push(`${p}: ${r}`); } } })(root);
for (const need of ["index.html", "mandate/index.html", "posts.json", "assets/theme.css", "assets/theme.js"]) if (!fs.existsSync(path.join(root, need))) fails.push("missing " + need);
if (fails.length) { console.error("CHECK FAILED\n" + fails.join("\n")); process.exit(1); }
console.log(`projects check ok: ${files} files`);
