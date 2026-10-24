// watch.bucklerfamily.estate — change monitor for every *.bucklerfamily.estate site (Sion's Tab agent, 23 Oct 2026).
// Cron (every 5 min) checks one shard of the sites (each site about every 30 min): HTTP status, latency, a hash of the
// page with volatile bits stripped, the visible-text diff when it changes, and the git branch heads of the repos that
// build the sites (git smart-HTTP refs, one request per repo; commit author/message from the branch's public Atom feed).
// Storage: Workers KV only (one state write per run; change log and text snapshots only on change). No D1.
// Read: /status.json · /changes.json?since= · /feed.xml · /sites.json · MCP (JSON-RPC) at /mcp · /.well-known/mcp.json · /agent/webmcp.js
import SEEDTXT from "./seed.txt";
import PIPELINE_JS from "./pipeline.txt";
const SEED = JSON.parse(SEEDTXT);
const VER = "1.0.0";
const PERIOD_MIN = 5;          // cron interval
const PER_RUN = 14;            // sites per run (free plan: 50 subrequests per invocation)
const MAX_CHANGES = 800;
const MAX_ADDED = 60;
const KV_WRITE_CAP = 850;      // free plan: 1,000 KV writes/day; keep headroom
const UA = "ghf-watch/1.0 (+https://watch.bucklerfamily.estate/; change monitor)";
const ALLOW_HOST = /(^|\.)bucklerfamily\.estate$|^greathousefarmwiki\.wordpress\.com$|\.sites\.tab\.bot$|\.pages\.dev$/;

const AGENTS_MD = "# FLYWHEEL.md \u2014 rules for any agent improving the bucklerfamily.estate sites\n\nThe repos that build these sites (GitHub unclehowell/datro, every branch, and unclehowell/BucklerFamilyFarm) are polished in turns, like rocks in a tumbler: one agent improves, the next responds to that change, and so on. watch.bucklerfamily.estate watches every branch and every live site and tells each side when it is their turn. No signup, no key.\n\n## 1. Before you start\n- Read the recent changes: GET https://watch.bucklerfamily.estate/changes.json?since=<your last visit> (or MCP tool get_changes). Each commit entry names the agent, the files touched and whose turn it now is.\n- Read the baton for your branch: GET https://watch.bucklerfamily.estate/baton.json?branch=<branch> (MCP get_baton). \"turn\" is \"tab\" or \"other\".\n- Claim it: POST https://watch.bucklerfamily.estate/api/claim_baton {\"branch\":\"<branch>\",\"agent\":\"<your name>\"} (MCP claim_baton). A claim lasts 2 hours, is renewed by each of your commits, and cannot be taken while another agent's claim is live.\n\n## 2. While you work\n- Improve only in response to the last changes and the \"next\" note left by the other side. Small, reviewable commits; one idea per commit.\n- Sign every commit with a trailer line:  Agent: <your name>   (the owner's Tab agent uses its own house signature). Unsigned commits count as \"other\".\n- Never force-push. Fetch and rebase first. Never revert another agent's work without saying why in the commit message.\n- House rules for public pages: no in-body titles, no crest; `<script src=\"https://bucklerfamily.estate/ghf-lang/ghf-boot.js?v=2.1.2\"></script>` is the last line of `<head>`; footer is only the \u00a9 line and the licence link; no disclaimers; do not name the family member who runs the case; avoid the house list of reporting and accusation words. Name institutions and roles, not private people. Check any text first: POST /api/check_text {\"text\": \"\u2026\"} (MCP check_text) lists every problem it finds.\n\n## 3. When you finish\n- Pass the baton: POST https://watch.bucklerfamily.estate/api/release_baton {\"branch\":\"<branch>\",\"agent\":\"<your name>\",\"note\":\"what I changed\",\"next\":\"what the other side should look at\"} (MCP release_baton). The turn goes to the other side.\n- A commit made without a claim passes the baton automatically: after your commit lands, the watcher hands the turn to the other side (within about 5 minutes).\n- Optional: POST /api/log_update {\"site\",\"agent\",\"summary\",\"commit\"} to annotate a live-site change.\n\n## The Hive (email drafts, any number of agents)\nEmail drafts are reviewed in HubSpot by a round-robin of seats (Tab, ChatGPT, then any agent that joins). Rules, roster, board and a copy-paste drop-in prompt: https://hive.bucklerfamily.estate (text: /hive.md, JSON: /hive.json). Turn prefix \"[TURN: <agent> vX.Y.Z]\"; legacy \"[TAB'S TURN\" = Tab, \"[OTHER AGENT'S TURN\" = ChatGPT.\n\n## Endpoints\nMCP (streamable HTTP, JSON-RPC 2.0): https://watch.bucklerfamily.estate/mcp \u00b7 discovery /.well-known/mcp.json \u00b7 WebMCP /agent/webmcp.js\nTools: list_sites, get_status, get_changes(since, site, kind, side, branch), check_now, add_site, log_update, get_baton, claim_baton, release_baton, check_text.\nJSON: /status.json \u00b7 /changes.json \u00b7 /baton.json \u00b7 /sites.json \u00b7 Atom: /feed.xml \u00b7 this file: /agents.md\n";
const H = { "access-control-allow-origin": "*", "access-control-allow-headers": "content-type, mcp-session-id, mcp-protocol-version", "access-control-allow-methods": "GET, POST, OPTIONS", "x-ghf-watch": VER };
const J = (o, s = 200, cache = 60) => new Response(JSON.stringify(o, null, 1), { status: s, headers: { ...H, "content-type": "application/json; charset=utf-8", "cache-control": cache ? `public, max-age=${cache}` : "no-store" } });
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const now = () => new Date().toISOString().replace(/\.\d+Z$/, "Z");
const day = () => now().slice(0, 10);

async function sha(s) { const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)); return [...new Uint8Array(d)].slice(0, 8).map((b) => b.toString(16).padStart(2, "0")).join(""); }

// volatile bits: Cloudflare email obfuscation / beacons / nonces / challenge tokens, ISO timestamps, epoch numbers, cache-busting hashes
const VOL = /data-cfemail="[^"]*"|\/cdn-cgi\/[^"' )]*|<script[^>]*cloudflareinsights[^>]*><\/script>|nonce="[^"]*"|integrity="[^"]*"|__cf[a-z_]*=[^"'&;\s]*|"?(?:csrf|_token|token|nonce|buildId|build_id)"?\s*[:=]\s*"[^"]{6,}"|\b20\d\d-\d\d-\d\dT\d\d:\d\d(?::\d\d(?:\.\d+)?)?(?:Z|[+-]\d\d:?\d\d)?\b|\b1[6-9]\d{8}(?:\d{3})?\b|[?&](?:t|ts|_|cb|cachebust)=\d+/g;
function textLines(html) {
  let t = html.replace(/<(script|style|noscript|svg|template)\b[\s\S]*?<\/\1>/gi, " ").replace(/<!--[\s\S]*?-->/g, " ");
  t = t.replace(/<\/?(p|div|li|h[1-6]|tr|td|th|br|section|article|header|footer|nav|main|aside|details|summary|dt|dd|figcaption|option|button|a)\b[^>]*>/gi, "\n").replace(/<[^>]+>/g, " ");
  t = t.replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;|&#x27;/g, "'");
  const out = []; const seen = new Set();
  for (let l of t.split("\n")) { l = l.replace(/\s+/g, " ").trim(); if (l.length < 2 || seen.has(l)) continue; seen.add(l); out.push(l.slice(0, 240)); if (out.length >= 600) break; }
  return out;
}
const titleOf = (html) => ((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || "").replace(/\s+/g, " ").trim().slice(0, 160);
const TAB_AGENT = /Sion's Tab agent|^Tab \(owner's agent\)$/i;
// public text never carries the owner's name: his own agent is shown as "Tab (owner's agent)"
const scrub = (s) => typeof s !== "string" ? s : s.replace(/\s*[—–-]{1,2}\s*Sion's Tab agent\s*$/gm, "").replace(/Sion's Tab agent/gi, "Tab (owner's agent)").replace(/\bSion(?:'s)?\s+Buckler\b/gi, "the owner").replace(/\bSion's\b/gi, "the owner's").replace(/\bSion\b/gi, "the owner");
const scrubDeep = (o) => Array.isArray(o) ? o.map(scrubDeep) : o && typeof o === "object" ? Object.fromEntries(Object.entries(o).map(([k, v]) => [k, scrubDeep(v)])) : scrub(o);
const sideOf = (agent) => (TAB_AGENT.test(agent || "") ? "tab" : "other");
const other = (side) => (side === "tab" ? "other" : "tab");
const agentOf = (msg, author, branch) => {
  const m = String(msg || "");
  let a = (m.match(/^Agent:\s*(.{2,80})$/im) || [])[1];
  if (!a) a = (m.match(/[—–-]{1,2}\s*([^\n—–]{3,60}?(?:agent|Agent|bot|Bot|Claude|Codex|Copilot|GPT|Tab))\s*$/m) || [])[1];
  if (!a) a = (m.match(/Co-authored-by:\s*([^<\n]+)</i) || [])[1];
  if (!a && /^claude\//.test(branch || "")) a = "Claude (branch " + branch + ")";
  if (!a && /^codex\//.test(branch || "")) a = "Codex (branch " + branch + ")";
  a = (a || author || "unknown").trim();
  return TAB_AGENT.test(a) || /[—–-]{1,2}\s*Sion's Tab agent\s*$/m.test(m) ? "Tab (owner's agent)" : a;
};

async function loadAll(env) {
  const [state, added] = await Promise.all([env.WATCH.get("state", "json"), env.WATCH.get("added", "json")]);
  return { state: state || { v: 1, run: 0, sites: {}, heads: {}, commits: {}, kvw: { day: day(), n: 0 } }, added: added || [] };
}
function allSites(added) {
  const seen = new Set(); const out = [];
  for (const s of [...SEED.sites, ...added]) { if (seen.has(s.url)) continue; seen.add(s.url); out.push(s); }
  return out;
}
async function kvPut(env, st, key, val, opts) {
  if (st.kvw.day !== day()) st.kvw = { day: day(), n: 0 };
  if (st.kvw.n >= KV_WRITE_CAP && key !== "state") return false;
  st.kvw.n++; await env.WATCH.put(key, typeof val === "string" ? val : JSON.stringify(val), opts); return true;
}

async function probe(s, prev) {
  const t0 = Date.now();
  try {
    const r = await fetch(s.url, { redirect: "manual", headers: { "user-agent": UA, accept: "text/html,application/json;q=0.9,*/*;q=0.8" }, cf: { cacheTtl: 0, cacheEverything: false }, signal: AbortSignal.timeout(15000) });
    const ms = Date.now() - t0;
    const loc = r.headers.get("location");
    const ct = r.headers.get("content-type") || "";
    let body = "";
    if (r.status >= 300 && r.status < 400) { body = "REDIRECT " + r.status + " " + (loc || ""); }
    else { body = await r.text(); if (body.length > 1500000) body = body.slice(0, 1500000); }
    const raw = await sha(body);
    const norm = prev && prev.raw === raw && prev.hash ? null : body.replace(VOL, " ");
    return { status: r.status, ms, ct: ct.split(";")[0], location: loc || undefined, bytes: body.length, raw, hash: norm === null ? prev.hash : await sha(norm), body, edge: r.headers.get("x-agent-ready") ? "agent-ready " + r.headers.get("x-agent-ready") : undefined };
  } catch (e) { return { status: 0, ms: Date.now() - t0, error: String(e).slice(0, 200), hash: null, body: "" }; }
}

async function repoHeads(repo) {
  // git protocol v2 ls-refs limited to branches: ~5 KB instead of the 250 KB ref advertisement
  const pkt = (s) => (s.length + 4).toString(16).padStart(4, "0") + s;
  const r = await fetch(`https://github.com/${repo}.git/git-upload-pack`, { method: "POST", body: pkt("command=ls-refs\n") + "0001" + pkt("ref-prefix refs/heads/\n") + "0000", headers: { "user-agent": "git/2.40 ghf-watch", "git-protocol": "version=2", "content-type": "application/x-git-upload-pack-request" } });
  if (!r.ok) throw new Error("refs " + r.status);
  const t = await r.text(); const h = {};
  for (const m of t.matchAll(/([0-9a-f]{40}) refs\/heads\/([^\s\0]+)/g)) h[m[2]] = m[1];
  return h;
}
const ent = (s) => String(s).replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;|&#x27;|&apos;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n)).replace(/&amp;/g, "&");
async function branchCommits(repo, branch, fromSha) {
  const r = await fetch(`https://github.com/${repo}/commits/${encodeURIComponent(branch).replace(/%2F/g, "/")}.atom`, { headers: { "user-agent": UA, accept: "application/atom+xml" } });
  if (!r.ok) return [];
  const x = await r.text(); const out = [];
  for (const e of x.split("<entry>").slice(1)) {
    const sha1 = (e.match(/Commit\/([0-9a-f]{40})/) || [])[1]; if (!sha1) continue;
    if (fromSha && sha1 === fromSha) break;
    const msgHtml = (e.match(/<content[^>]*>([\s\S]*?)<\/content>/) || [])[1] || "";
    const msg = ent(ent(msgHtml).replace(/<[^>]+>/g, "")).trim(); // XML-escaped HTML: decode, strip tags, decode again
    const author = ent((e.match(/<author>\s*<name>([\s\S]*?)<\/name>/) || [])[1] || "").trim();
    const at = ((e.match(/<updated>([^<]+)<\/updated>/) || [])[1] || "").trim();
    out.push({ sha: sha1, at, author, agent: agentOf(msg, author, branch), message: msg.slice(0, 400) });
    if (out.length >= 10) break;
  }
  return out;
}

async function filesTouched(repo, sha1) {
  try {
    const r = await fetch(`https://github.com/${repo}/commit/${sha1}.patch`, { headers: { "user-agent": UA } });
    if (!r.ok || !r.body) return null;
    const rd = r.body.getReader(); const dec = new TextDecoder(); let t = "";
    while (t.length < 65536) { const { value, done } = await rd.read(); if (done) break; t += dec.decode(value, { stream: true }); if (t.includes("\ndiff --git")) break; }
    try { await rd.cancel(); } catch {}
    const head = t.split("\ndiff --git")[0]; const files = [];
    for (const m of head.matchAll(/^ (\S[^\n|]*?)\s+\|\s+(\d+|Bin[^\n]*)/gm)) { files.push(m[1].trim()); if (files.length >= 40) break; }
    const stat = (head.match(/^ \d+ files? changed[^\n]*/m) || [])[0];
    return { files, stat: stat ? stat.trim() : undefined };
  } catch { return null; }
}
const BATON_TTL = 2 * 3600e3;
function batonOnCommit(bt, key, c, branch) {
  const b = bt[key] || { branch: key };
  const side = sideOf(c.agent);
  const held = b.holder && Date.parse(b.expires || 0) > Date.now();
  b.last_commit = c.sha.slice(0, 7); b.last_agent = c.agent; b.last_side = side; b.last_message = (c.message || "").split("\n")[0].slice(0, 200); b.updated = now();
  if (held && b.holder_side === side) { b.expires = new Date(Date.now() + BATON_TTL).toISOString(); }
  else { b.turn = other(side); b.holder = null; b.holder_side = null; b.expires = null; b.passed_by = "commit " + b.last_commit + " by " + c.agent; }
  bt[key] = b;
}

// ---- Uptime monitor (24 Oct 2026): Archwilio + controls, every cron run; state lives inside the "state" KV key (no extra writes)
const UPTIME = [
  { id: "archwilio", name: "Archwilio", url: "https://archwilio.org.uk/", alert: true },
  { id: "archwilio-wp", name: "Archwilio /wp/", url: "https://archwilio.org.uk/wp/" },
  { id: "archwilio-record", name: "Archwilio record GGAT02038s", url: "https://archwilio.org.uk/her/chi3/report/page.php?watprn=GGAT02038s" },
  { id: "coflein", name: "Coflein site 20182 (control)", url: "https://coflein.gov.uk/en/site/20182/" },
  { id: "heneb", name: "Heneb (control)", url: "https://heneb.org.uk/" },
];
const UPTIME_KEEP_DAYS = 90, UPTIME_CONFIRM = 2;
async function uptimeProbe(t) {
  const t0 = Date.now(); const ac = new AbortController(); const tm = setTimeout(() => ac.abort(), 25000);
  try {
    const r = await fetch(t.url, { redirect: "follow", signal: ac.signal, headers: { "user-agent": UA, accept: "text/html,*/*" }, cf: { cacheTtl: 0 } });
    try { await r.body?.cancel(); } catch (e) {}
    return { status: r.status, ms: Date.now() - t0 };
  } catch (e) { return { status: 0, ms: Date.now() - t0, error: ac.signal.aborted ? "timeout 25 s" : String(e).slice(0, 120) }; }
  finally { clearTimeout(tm); }
}
async function uptimeRun(env, st) {
  const U = (st.uptime = st.uptime || { v: 1, sites: {}, outages: [], alerts: [] });
  const res = await Promise.all(UPTIME.map(uptimeProbe)); const at = now(); const events = [];
  UPTIME.forEach((t, i) => {
    const r = res[i], ok = r.status >= 200 && r.status < 400, p = U.sites[t.id];
    const rec = { name: t.name, url: t.url, status: r.status, ms: r.ms, error: r.error, checked: at, ok, hist: [[at, r.status, r.ms], ...((p && p.hist) || [])].slice(0, 12) };
    const openOut = () => U.outages.find((o) => o.site === t.id && !o.end);
    if (!p) {
      rec.up = ok; rec.since = at; rec.first = at;
      if (!ok) U.outages.push({ site: t.id, name: t.name, start: at, start_note: "already down when monitoring began", end: null, codes: [r.status] });
    } else {
      rec.up = p.up; rec.since = p.since; rec.first = p.first;
      if (ok === p.up) { rec.pend = undefined; }
      else {
        const pend = p.pend && p.pend.up === ok ? { ...p.pend, n: p.pend.n + 1 } : { up: ok, n: 1, at };
        if (pend.n >= UPTIME_CONFIRM) {
          rec.up = ok; rec.since = pend.at; rec.pend = undefined;
          if (!ok) U.outages.push({ site: t.id, name: t.name, start: pend.at, end: null, codes: [r.status] });
          else { const o = openOut(); if (o) { o.end = pend.at; o.minutes = Math.round((Date.parse(o.end) - Date.parse(o.start)) / 60e3); } }
          events.push({ id: t.id, name: t.name, up: ok, at: pend.at, status: r.status, alert: !!t.alert });
        } else rec.pend = pend;
      }
      if (!ok) { const o = openOut(); if (o && !o.codes.includes(r.status)) o.codes = [...o.codes, r.status].slice(-8); }
    }
    for (const k of Object.keys(rec)) if (rec[k] === undefined) delete rec[k];
    U.sites[t.id] = rec;
  });
  const cut = Date.now() - UPTIME_KEEP_DAYS * 864e5;
  U.outages = U.outages.filter((o) => !o.end || Date.parse(o.end) >= cut).slice(-300);
  U.last = { at, checked: UPTIME.length };
  for (const e of events.filter((x) => x.alert)) {
    const msg = `${e.name} is ${e.up ? "back UP" : "DOWN"} (HTTP ${e.status || "no answer"}) since ${e.at.replace("T", " ").replace("Z", " UTC")}, confirmed by ${UPTIME_CONFIRM} checks in a row. https://watch.bucklerfamily.estate/uptime`;
    const a = { at, msg };
    if (env.TG_BOT_TOKEN && env.TG_CHAT_ID) {
      try { const r = await fetch(`https://api.telegram.org/bot${env.TG_BOT_TOKEN}/sendMessage`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ chat_id: env.TG_CHAT_ID, text: msg, disable_web_page_preview: true }) }); a.telegram = "HTTP " + r.status; }
      catch (err) { a.telegram = "failed: " + String(err).slice(0, 80); }
    } else a.telegram = "not sent: no Telegram chat id stored for the owner";
    U.alerts = [a, ...(U.alerts || [])].slice(0, 50);
  }
  return events;
}
const UKF = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", timeZoneName: "short" });
const tUTC = (s) => s ? s.slice(0, 16).replace("T", " ") + " UTC" : "";
const tUK = (s) => { try { return s ? UKF.format(new Date(s)) : ""; } catch (e) { return ""; } };
const tBoth = (s) => s ? `${esc(tUTC(s))}<br><small>${esc(tUK(s))}</small>` : "";
function uptimeJSON(st) {
  const U = st.uptime || { sites: {}, outages: [] };
  return { checks: UPTIME.map((t) => ({ id: t.id, ...(U.sites[t.id] || { name: t.name, url: t.url, up: null }) })), outages: [...(U.outages || [])].reverse(), alerts: U.alerts || [], last_run: U.last || null, confirm_checks: UPTIME_CONFIRM, every_minutes: PERIOD_MIN, keep_days: UPTIME_KEEP_DAYS };
}
function uptimePage(st) {
  const d = uptimeJSON(st);
  const rows = d.checks.map((c) => `<tr class="${c.up === false ? "dn" : ""}"><td>${c.up == null ? "○" : c.up ? "● up" : "✕ down"}</td><td><a href="${esc(c.url)}">${esc(c.name)}</a></td><td>${c.status ?? ""}${c.error ? " · " + esc(c.error) : ""}</td><td>${c.ms ?? ""}</td><td>${tBoth(c.since)}</td></tr>`).join("");
  const outs = d.outages.map((o) => `<tr><td>${esc(o.name)}</td><td>${tBoth(o.start)}${o.start_note ? "<br><small>" + esc(o.start_note) + "</small>" : ""}</td><td>${o.end ? tBoth(o.end) : "ongoing"}</td><td>${o.end ? o.minutes + " min" : ""}</td><td>${esc((o.codes || []).join(", "))}</td></tr>`).join("");
  return `<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Uptime · Archwilio and controls</title><meta name="description" content="Up/down status for Archwilio (Welsh Historic Environment Records) with Coflein and Heneb as controls, checked every 5 minutes."><style>body{font:15px/1.45 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;margin:0;color:#1d1d1f;background:#fafaf7}main{max-width:900px;margin:0 auto;padding:14px}details{background:#fff;border:1px solid #e3e3dc;border-radius:10px;margin:10px 0;padding:8px 12px}summary{cursor:pointer;font-weight:600}table{border-collapse:collapse;width:100%;font-size:13px}td,th{padding:4px 6px;border-top:1px solid #eee;text-align:left;vertical-align:top}th{font-weight:600;color:#555}tr.dn td{color:#b00020}small{color:#666}footer{max-width:900px;margin:0 auto;padding:14px;font-size:12px;color:#666}a{color:#245}</style>
<script src="https://bucklerfamily.estate/ghf-lang/ghf-boot.js?v=2.1.2"></script>
</head><body><main><p>Checked every ${PERIOD_MIN} min · a change counts after ${UPTIME_CONFIRM} checks in a row · last check ${esc(tUTC(d.last_run?.at) || "pending")}${d.last_run ? " (" + esc(tUK(d.last_run.at)) + ")" : ""}</p>
<details open><summary>Now</summary><table><thead><tr><th></th><th>Site</th><th>HTTP</th><th>ms</th><th>State since</th></tr></thead><tbody>${rows}</tbody></table></details>
<details open><summary>Outages (last ${UPTIME_KEEP_DAYS} days)</summary>${outs ? `<table><thead><tr><th>Site</th><th>Start</th><th>End</th><th>Length</th><th>HTTP codes</th></tr></thead><tbody>${outs}</tbody></table>` : "<p>None recorded.</p>"}</details>
</main><footer>HTTP 0 = no answer within 25 s; 52x = the site's own server did not answer its CDN. JSON: <a href="/uptime.json">/uptime.json</a> · <a href="/">change monitor</a></footer></body></html>`;
}

async function cron(env, ctx, sched) {
  const { state: st, added } = await loadAll(env);
  const changes = []; const tStart = Date.now();
  st.run = (st.run || 0) + 1;
  const uptimeP = uptimeRun(env, st).catch((e) => { st.uptime_error = { at: now(), error: String(e).slice(0, 160) }; return []; });
  // 1. git branch heads (one request per repo); moved branches get their commits from the Atom feed (max 4 per run)
  let atomBudget = 4; let batons = null;
  for (const repo of SEED.repos) {
    try {
      const h = await repoHeads(repo); const key = (b) => repo + "@" + b;
      for (const [b, s1] of Object.entries(h)) {
        const k = key(b), old = st.heads[k];
        if (!old) { st.heads[k] = s1; if (st.run > 1 && st.repoSeen?.[repo]) changes.push({ kind: "branch_created", repo, branch: b, sha: s1.slice(0, 7) }); continue; }
        if (old === s1) continue;
        if (atomBudget <= 0) continue; // handled next run (head stays at the old sha)
        atomBudget--;
        const cs = await branchCommits(repo, b, old);
        const last = cs[0] || { sha: s1, at: now(), author: "unknown", agent: "unknown", message: "(commit details not available yet)" };
        st.commits[k] = { sha: s1, at: last.at, author: last.author, agent: last.agent, side: sideOf(last.agent), message: last.message.split("\n")[0].slice(0, 200), seen: now() };
        const ft = await filesTouched(repo, s1);
        batons = batons || (await env.WATCH.get("baton", "json")) || {}; batonOnCommit(batons, k, last.sha ? last : { ...last, sha: s1 }, b);
        changes.push({ kind: "commit", repo, branch: b, old_sha: old.slice(0, 7), new_sha: s1.slice(0, 7), commits: cs.length ? cs.map((c) => ({ sha: c.sha.slice(0, 7), at: c.at, author: c.author, agent: c.agent, side: sideOf(c.agent), message: c.message.split("\n")[0].slice(0, 200) })) : [{ sha: s1.slice(0, 7) }], agent: last.agent, side: sideOf(last.agent), author: last.author, files: ft ? ft.files : undefined, stat: ft ? ft.stat : undefined, baton_turn: batons[k] && batons[k].turn, compare: `https://github.com/${repo}/compare/${old.slice(0, 7)}...${s1.slice(0, 7)}` });
        st.heads[k] = s1;
      }
      for (const k of Object.keys(st.heads)) if (k.startsWith(repo + "@") && !(k.slice(repo.length + 1) in h)) { changes.push({ kind: "branch_deleted", repo, branch: k.slice(repo.length + 1), sha: st.heads[k].slice(0, 7) }); delete st.heads[k]; }
      st.repoSeen = st.repoSeen || {}; st.repoSeen[repo] = now();
    } catch (e) { st.repoError = { repo, at: now(), error: String(e).slice(0, 160) }; }
  }
  // 2. this run's shard of sites
  const sites = allSites(added); const shards = Math.max(1, Math.ceil(sites.length / PER_RUN));
  // shard by the scheduled time, so a run that fails (e.g. CPU limit) does not pin the same shard
  const slot = Math.floor((sched?.scheduledTime || Date.now()) / (PERIOD_MIN * 60e3));
  const shard = ((slot % shards) + shards) % shards; const mine = sites.filter((_, i) => i % shards === shard);
  st.shards = shards; st.cycle_minutes = shards * PERIOD_MIN;
  const results = await Promise.all(mine.map((s) => probe(s, st.sites[s.url])));
  for (let i = 0; i < mine.length; i++) {
    const s = mine[i], r = results[i], p = st.sites[s.url] || {};
    const up = r.status >= 200 && r.status < 400;
    const rec = { id: s.id, url: s.url, status: r.status, up, ms: r.ms, ct: r.ct, bytes: r.bytes, hash: r.hash, raw: r.raw, location: r.location, edge: r.edge, error: r.error, checked: now(), title: r.body ? titleOf(r.body) : p.title, changed: p.changed, checks: (p.checks || 0) + 1, changes: p.changes || 0, down_since: up ? undefined : (p.down_since || now()), up_since: up ? (p.up ? p.up_since : now()) : undefined };
    rec.ctx = "cron";
    if (p.checks && p.ctx === "cron") { // compare only cron-to-cron (a fetch-context check bypasses the zone's route Workers)
      if (!!p.up !== up || (up && p.status !== r.status && Math.floor(p.status / 100) !== Math.floor(r.status / 100))) {
        changes.push({ kind: up ? "up" : "down", site: s.id, url: s.url, status_old: p.status, status_new: r.status, error: r.error, ms: r.ms });
      }
      if (up && r.hash && p.hash && r.hash !== p.hash) {
        const lines = textLines(r.body); const tkey = "t:" + s.url;
        const oldLines = (await env.WATCH.get(tkey, "json")) || [];
        const oldSet = new Set(oldLines), newSet = new Set(lines);
        const addedL = lines.filter((l) => !oldSet.has(l)), removedL = oldLines.filter((l) => !newSet.has(l));
        const textChanged = addedL.length + removedL.length > 0 || !oldLines.length;
        // attribution: newest commit on the site's branch seen in the last 3 h
        const ck = s.branch ? (s.repo || "unclehowell/datro") + "@" + s.branch : null; const c = ck ? st.commits[ck] : null;
        const recent = c && (Date.now() - Date.parse(c.seen || c.at)) < 3 * 3600e3;
        changes.push({ kind: textChanged ? "content" : "markup", site: s.id, url: s.url, old_hash: p.hash, new_hash: r.hash, title_old: p.title !== rec.title ? p.title : undefined, title_new: p.title !== rec.title ? rec.title : undefined,
          diff: { added: addedL.length, removed: removedL.length, sample_added: addedL.slice(0, 5), sample_removed: removedL.slice(0, 5), bytes_old: p.bytes, bytes_new: r.bytes },
          branch: s.branch || undefined, commit: recent ? { sha: c.sha.slice(0, 7), at: c.at, author: c.author, agent: c.agent, message: c.message } : undefined,
          agent: recent ? c.agent : undefined, side: recent ? sideOf(c.agent) : undefined,
          attribution: recent ? `commit ${c.sha.slice(0, 7)} on ${ck} by ${c.agent}` : (s.branch ? `no new commit on ${s.branch} in the last 3 h: a Worker deploy, database content or another runtime change` : "no git branch mapped to this site: a Worker deploy, database content or another runtime change") });
        rec.changed = now(); rec.changes = (p.changes || 0) + 1;
        await kvPut(env, st, tkey, lines);
      } else if (up && r.hash && !p.hash) { await kvPut(env, st, "t:" + s.url, textLines(r.body)); }
    } else if (up && r.body) { await kvPut(env, st, "t:" + s.url, textLines(r.body)); rec.first_seen = p.first_seen || now(); }
    for (const k of Object.keys(rec)) if (rec[k] === undefined) delete rec[k];
    st.sites[s.url] = rec;
  }
  st.last_run = { at: now(), shard, of: shards, checked: mine.length, wall_ms: Date.now() - tStart, cron: sched?.cron };
  for (const e of await uptimeP) changes.push({ kind: e.up ? "up" : "down", site: "uptime:" + e.id, url: UPTIME.find((t) => t.id === e.id)?.url, status_new: e.status, summary: e.name + (e.up ? " back up" : " down") + " (confirmed)" });
  if (batons) await kvPut(env, st, "baton", scrubDeep(batons));
  if (changes.length) await appendChanges(env, st, changes);
  await kvPut(env, st, "state", st);
}

async function appendChanges(env, st, evs) {
  const log = (await env.WATCH.get("changes", "json")) || [];
  const at = now(); let seq = Math.max(st.seq || 0, log.length ? log[log.length - 1].n || 0 : 0);
  for (const e of evs) { seq++; log.push(scrubDeep({ n: seq, at: e.at || at, ...e })); }
  st.seq = seq;
  while (log.length > MAX_CHANGES) log.shift();
  await kvPut(env, st, "changes", log);
}

// ---- tools (shared by REST, MCP and WebMCP) ----
const TOOLS = [
  { name: "list_sites", description: "List every monitored site (all *.bucklerfamily.estate subdomains and extra pages) with its current state: up/down, HTTP status, latency, content hash, last change, mapped git branch.", inputSchema: { type: "object", properties: { only_down: { type: "boolean", description: "Only sites that are down" } } }, annotations: { readOnlyHint: true } },
  { name: "get_changes", description: "Change log, newest last: content/markup changes (old vs new hash, text diff summary, the commit and agent that made it when known), up/down events, git commits on the repos that build the sites, notes posted by agents, and sites added. Use since= (ISO time or change number) to read only what is new.", inputSchema: { type: "object", properties: { since: { type: "string", description: "ISO 8601 time (e.g. 2026-10-23T12:00:00Z) or a change number n" }, site: { type: "string", description: "Site id or host, e.g. research or research.bucklerfamily.estate" }, kind: { type: "string", description: "content, markup, commit, up, down, note, baton, site_added, branch_created, branch_deleted" }, side: { type: "string", description: "tab or other: only changes made by the owner's Tab agent, or only by any other agent" }, branch: { type: "string", description: "Repo branch, e.g. research" }, limit: { type: "integer", description: "Max entries (default 100, max 500)" } } }, annotations: { readOnlyHint: true } },
  { name: "get_status", description: "Current state of one site (or all), and the monitor's own run status.", inputSchema: { type: "object", properties: { site: { type: "string" } } }, annotations: { readOnlyHint: true } },
  { name: "add_site", description: "Self-register a URL to be monitored (no signup). Allowed: any https URL on *.bucklerfamily.estate, greathousefarmwiki.wordpress.com, *.sites.tab.bot or *.pages.dev. It is picked up on the next run.", inputSchema: { type: "object", required: ["url"], properties: { url: { type: "string" }, id: { type: "string", description: "Short id (defaults to the subdomain)" }, branch: { type: "string", description: "Git branch in unclehowell/datro that builds it, if any" }, added_by: { type: "string", description: "Who is adding it (agent name)" } } } },
  { name: "log_update", description: "Announce an update you (an agent) made or are about to make to a site, so other agents reading the change log know who did it and why. Appears in get_changes as kind=note.", inputSchema: { type: "object", required: ["site", "agent", "summary"], properties: { site: { type: "string" }, agent: { type: "string", description: "Your agent name" }, summary: { type: "string", description: "What changed, one or two sentences" }, commit: { type: "string", description: "Commit sha, if any" } } } },
  { name: "get_baton", description: "Whose turn it is on a repo branch in the improvement flywheel: turn (tab | other), current holder and claim expiry, last commit/agent, and the note + next step left by the last agent. Omit branch for all branches.", inputSchema: { type: "object", properties: { branch: { type: "string", description: "e.g. research, dartboard, or unclehowell/datro@research" } } }, annotations: { readOnlyHint: true } },
  { name: "claim_baton", description: "Claim a branch before you start improving it (lasts 2 h; each of your commits renews it; refused while another agent's claim is live). Read get_changes and get_baton first. Rules: /agents.md", inputSchema: { type: "object", required: ["branch", "agent"], properties: { branch: { type: "string" }, agent: { type: "string", description: "Your agent name, as in your commit trailer 'Agent: <name>'" }, token: { type: "string", description: "Only if the owner has set a flywheel token" } } } },
  { name: "release_baton", description: "Hand the branch to the other side when you are done: what you changed and what they should look at next.", inputSchema: { type: "object", required: ["branch", "agent", "note"], properties: { branch: { type: "string" }, agent: { type: "string" }, note: { type: "string", description: "What you changed" }, next: { type: "string", description: "What the other side should improve next" }, token: { type: "string" } } } },
  { name: "check_text", description: "House-rules check for text or HTML you are about to publish on a bucklerfamily.estate site: banned reporting/accusation words, the owner's name, disclaimers, and for HTML the ghf-boot script as the last line of <head> and the footer. Returns each problem found.", inputSchema: { type: "object", required: ["text"], properties: { text: { type: "string" } } }, annotations: { readOnlyHint: true } },
  { name: "check_now", description: "Fetch one monitored site live right now and compare its hash with the last stored check (read-only: nothing is stored; the scheduled run records it).", inputSchema: { type: "object", required: ["site"], properties: { site: { type: "string" } } }, annotations: { readOnlyHint: true } },
];
function findSite(sites, q) { if (!q) return null; q = String(q).toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, ""); return sites.find((s) => s.id.toLowerCase() === q || s.url.toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, "") === q || s.url.toLowerCase().includes("//" + q + ".bucklerfamily.estate/")) || null; }
const rate = new Map();
async function callTool(env, name, a = {}, ip = "") {
  const { state: st, added } = await loadAll(env); const sites = allSites(added);
  if (name === "list_sites") {
    let rows = sites.map((s) => { const r = st.sites[s.url] || {}; return { id: s.id, url: s.url, up: r.up, status: r.status, ms: r.ms, hash: r.hash, title: r.title, checked: r.checked, changed: r.changed, changes: r.changes, branch: s.branch || null, repo: s.branch ? s.repo || "unclehowell/datro" : null, via: s.via, edge: r.edge, location: r.location, added_by: s.added_by }; });
    rows = scrubDeep(rows);
    if (a.only_down) rows = rows.filter((r) => r.up === false);
    return { count: rows.length, up: rows.filter((r) => r.up).length, down: rows.filter((r) => r.up === false).length, not_yet_checked: rows.filter((r) => r.up === undefined).length, cycle_minutes: st.cycle_minutes, sites: rows };
  }
  if (name === "get_status") {
    const meta = { version: VER, last_run: st.last_run, runs: st.run, cycle_minutes: st.cycle_minutes, kv_writes_today: st.kvw, repos: Object.keys(st.repoSeen || {}), repo_error: st.repoError, branches_tracked: Object.keys(st.heads || {}).length };
    if (a.site) { const s = findSite(sites, a.site); if (!s) return { error: "unknown site " + a.site }; return scrubDeep({ ...meta, site: { ...s, ...(st.sites[s.url] || {}) } }); }
    return scrubDeep({ ...meta, sites: Object.values(st.sites) });
  }
  if (name === "get_changes") {
    let log = (await env.WATCH.get("changes", "json")) || [];
    if (a.since) { const n = Number(a.since); log = Number.isFinite(n) && String(a.since).length < 9 ? log.filter((e) => e.n > n) : log.filter((e) => e.at > new Date(Date.parse(a.since) || 0).toISOString().replace(/\.\d+Z$/, "Z")); }
    if (a.site) { const s = findSite(sites, a.site); const q = String(a.site); log = log.filter((e) => (s && (e.url === s.url || (s.branch && e.branch === s.branch))) || e.site === q); }
    if (a.kind) log = log.filter((e) => e.kind === a.kind);
    if (a.side) log = log.filter((e) => (e.side || (e.agent ? sideOf(e.agent) : "")) === a.side);
    if (a.branch) log = log.filter((e) => e.branch === a.branch || (e.branch && e.branch.endsWith("@" + a.branch)));
    const lim = Math.min(500, Math.max(1, Number(a.limit) || 100));
    return { count: log.length, returned: Math.min(lim, log.length), latest_n: st.seq || 0, changes: log.slice(-lim) };
  }
  if (name === "check_now") {
    const s = findSite(sites, a.site); if (!s) return { error: "unknown site " + a.site };
    const k = "cn:" + ip; const t = rate.get(k) || 0; if (Date.now() - t < 3000) return { error: "one check_now every 3 s, please" }; rate.set(k, Date.now());
    const r = await probe(s); const p = st.sites[s.url] || {};
    return { id: s.id, url: s.url, status: r.status, ms: r.ms, hash: r.hash, note: "check_now runs in request context, where pages a zone route Worker adds to (e.g. agent-ready) are seen without that layer, so the hash can differ from the scheduled check even when nothing changed", stored_hash: p.hash, stored_checked: p.checked, differs_from_last_check: !!(p.hash && r.hash && p.hash !== r.hash), title: r.body ? titleOf(r.body) : undefined, error: r.error };
  }
  if (name === "add_site") {
    let u; try { u = new URL(String(a.url || "")); } catch { return { error: "url must be a full https URL" }; }
    if (u.protocol !== "https:" || !ALLOW_HOST.test(u.hostname)) return { error: "only https URLs on *.bucklerfamily.estate, greathousefarmwiki.wordpress.com, *.sites.tab.bot or *.pages.dev" };
    u.hash = ""; const url = u.href;
    if (sites.some((s) => s.url === url)) return { ok: true, already_monitored: true, url };
    if (added.length >= MAX_ADDED) return { error: "the monitor is full (" + MAX_ADDED + " added sites); ask the owner's agent" };
    if (st.kvw && st.kvw.day === day() && st.kvw.n > KV_WRITE_CAP - 50) return { error: "daily write budget nearly used; try again after 00:00 UTC" };
    const id = String(a.id || u.hostname.replace(/\.bucklerfamily\.estate$/, "") + (u.pathname !== "/" ? u.pathname.replace(/\/$/, "") : "")).slice(0, 60).replace(/[^\w.\/-]/g, "-");
    const s = { id, url, branch: a.branch ? String(a.branch).slice(0, 80) : null, via: "added by an agent", source: "add_site", added_by: String(a.added_by || "anonymous agent").slice(0, 80), added_at: now() };
    added.push(s); await env.WATCH.put("added", JSON.stringify(added));
    await appendChanges(env, { ...st }, [{ kind: "site_added", site: id, url, agent: s.added_by }]);
    return { ok: true, added: s, next_check_within_minutes: st.cycle_minutes || 30 };
  }
  if (name === "log_update") {
    if (!a.site || !a.agent || !a.summary) return { error: "site, agent and summary are required" };
    const k = "lu:" + ip; const t = rate.get(k) || 0; if (Date.now() - t < 10000) return { error: "one log_update every 10 s, please" }; rate.set(k, Date.now());
    if (st.kvw && st.kvw.day === day() && st.kvw.n > KV_WRITE_CAP - 50) return { error: "daily write budget nearly used; try again after 00:00 UTC" };
    const s = findSite(sites, a.site);
    const st3 = { ...st, kvw: { ...(st.kvw || { day: day(), n: 0 }) } };
    await appendChanges(env, st3, [{ kind: "note", site: s ? s.id : String(a.site).slice(0, 80), url: s ? s.url : undefined, agent: String(a.agent).slice(0, 80), summary: String(a.summary).slice(0, 600), commit: a.commit ? String(a.commit).slice(0, 40) : undefined }]);
    return { ok: true, n: st3.seq };
  }
  if (name === "check_text") {
    const t = String(a.text || "").slice(0, 400000); const issues = [];
    const BANNED = ["says", "claims", "according to", "hearsay", "unverified", "alleged", "fraud", "stolen"];
    for (const w of BANNED) { const n = (t.match(new RegExp("\\b" + w.replace(/ /g, "\\s+") + "\\b", "gi")) || []).length; if (n) issues.push({ rule: "banned word", word: w, count: n }); }
    if (/\bsion\b/i.test(t)) issues.push({ rule: "owner's name", count: (t.match(/\bsion\b/gi) || []).length });
    if (/not legal advice|not a finding of any court|disclaimer/i.test(t)) issues.push({ rule: "disclaimer" });
    if (/<head[\s>]/i.test(t)) {
      const head = (t.match(/<head[\s>][\s\S]*?<\/head>/i) || [""])[0];
      const lastTag = (head.replace(/<\/head>$/i, "").trim().match(/<script[^>]*>\s*<\/script>\s*$/i) || [""])[0];
      if (!/ghf-boot\.js\?v=2\.1\.2/.test(lastTag)) issues.push({ rule: "ghf-boot.js?v=2.1.2 must be the last line of <head>" });
      const f = (t.match(/<footer[\s\S]*?<\/footer>/gi) || []).pop();
      if (f && !/©/.test(f)) issues.push({ rule: "footer should be only the © line and the licence link" });
    }
    return { ok: issues.length === 0, issues };
  }
  if (name === "get_baton" || name === "claim_baton" || name === "release_baton") {
    const bt = (await env.WATCH.get("baton", "json")) || {};
    const keyOf = (b) => { b = String(b || "").trim(); if (!b) return null; return b.includes("@") ? b : "unclehowell/datro@" + b; };
    const k = keyOf(a.branch);
    if (name === "get_baton") {
      if (!k) return { count: Object.keys(bt).length, rules: "/agents.md", batons: bt };
      return bt[k] || { branch: k, turn: "open", note: "no commit seen on this branch since the monitor started; claim it to begin", known_branch: !!st.heads[k] };
    }
    if (!k || !st.heads[k]) return { error: "unknown branch " + a.branch + " (use a branch of unclehowell/datro or unclehowell/BucklerFamilyFarm)" };
    if (!a.agent) return { error: "agent is required" };
    const tok = await env.WATCH.get("baton_token"); if (tok && a.token !== tok) return { error: "this flywheel needs a token for claims; ask the owner's agent" };
    const rk = "bt:" + ip; const t = rate.get(rk) || 0; if (Date.now() - t < 5000) return { error: "one baton call every 5 s, please" }; rate.set(rk, Date.now());
    if (st.kvw && st.kvw.day === day() && st.kvw.n > KV_WRITE_CAP - 50) return { error: "daily write budget nearly used; try again after 00:00 UTC" };
    const agent = scrub(String(a.agent).slice(0, 80)); const side = sideOf(agent);
    const b = bt[k] || { branch: k }; const live = b.holder && Date.parse(b.expires || 0) > Date.now();
    if (name === "claim_baton") {
      if (live && b.holder !== agent) return { ok: false, error: "held by " + b.holder + " until " + b.expires, baton: b };
      Object.assign(b, { holder: agent, holder_side: side, claimed_at: now(), expires: new Date(Date.now() + BATON_TTL).toISOString(), updated: now() });
    } else {
      if (live && b.holder !== agent) return { ok: false, error: "held by " + b.holder + "; only the holder can release it", baton: b };
      Object.assign(b, { holder: null, holder_side: null, expires: null, turn: other(side), note: String(a.note || "").slice(0, 800), next: a.next ? String(a.next).slice(0, 800) : null, released_by: agent, updated: now() });
    }
    bt[k] = b; await env.WATCH.put("baton", JSON.stringify(scrubDeep(bt)));
    await appendChanges(env, { ...st, kvw: { ...(st.kvw || { day: day(), n: 0 }) } }, [{ kind: "baton", branch: k, action: name === "claim_baton" ? "claimed" : "released", agent, side, turn: b.turn, note: b.note && name === "release_baton" ? b.note : undefined, next: name === "release_baton" ? b.next || undefined : undefined }]);
    return { ok: true, baton: b };
  }
  return { error: "unknown tool " + name };
}

async function mcp(env, req, ip) {
  let m; try { m = await req.json(); } catch { return J({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "parse error" } }, 400, 0); }
  const one = async (x) => {
    const id = x.id ?? null;
    if (x.method === "initialize") return { jsonrpc: "2.0", id, result: { protocolVersion: (x.params && x.params.protocolVersion) || "2025-06-18", capabilities: { tools: { listChanged: false } }, serverInfo: { name: "ghf-watch", title: "bucklerfamily.estate change monitor", version: VER }, instructions: "Read get_changes(since) and get_baton(branch) before editing any bucklerfamily.estate site or repo branch; claim_baton, make small commits signed 'Agent: <name>', then release_baton with a note and next step. Rules: https://watch.bucklerfamily.estate/agents.md. No signup or key." } };
    if (x.method && x.method.startsWith("notifications/")) return null;
    if (x.method === "ping") return { jsonrpc: "2.0", id, result: {} };
    if (x.method === "tools/list") return { jsonrpc: "2.0", id, result: { tools: TOOLS } };
    if (x.method === "tools/call") {
      const r = await callTool(env, x.params?.name, x.params?.arguments || {}, ip);
      return { jsonrpc: "2.0", id, result: { content: [{ type: "text", text: JSON.stringify(r) }], structuredContent: r, isError: !!r.error } };
    }
    return { jsonrpc: "2.0", id, error: { code: -32601, message: "method not found: " + x.method } };
  };
  if (Array.isArray(m)) { const out = (await Promise.all(m.map(one))).filter(Boolean); return out.length ? J(out, 200, 0) : new Response(null, { status: 202, headers: H }); }
  const r = await one(m); return r ? J(r, 200, 0) : new Response(null, { status: 202, headers: H });
}

function manifest(origin) {
  return { schema_version: "2025-06-18", name: "ghf-watch", title: "bucklerfamily.estate change monitor", description: "Up/down and content-change monitor for every *.bucklerfamily.estate site, with the git commit and agent behind each change. No signup, no key.", version: VER,
    transport: { type: "streamable-http", url: origin + "/mcp" }, endpoints: { mcp: origin + "/mcp", webmcp: origin + "/agent/webmcp.js", status: origin + "/status.json", changes: origin + "/changes.json", feed: origin + "/feed.xml", sites: origin + "/sites.json" },
    rest: { "GET /changes.json?since=&site=&kind=&limit=": "get_changes", "GET /status.json": "get_status", "GET /sites.json": "list_sites", "POST /api/add_site {url,id?,branch?,added_by?}": "add_site", "POST /api/log_update {site,agent,summary,commit?}": "log_update", "GET /api/check_now?site=": "check_now", "GET /baton.json?branch=": "get_baton", "POST /api/claim_baton {branch,agent}": "claim_baton", "POST /api/release_baton {branch,agent,note,next?}": "release_baton" }, rules: origin + "/agents.md",
    auth: "none", tools: TOOLS };
}

const WEBMCP = `/*! ghf-watch WebMCP tools · registers the change-monitor tools with navigator.modelContext where the browser supports WebMCP. */
(function(){var mc=navigator.modelContext;var O=document.currentScript?new URL(document.currentScript.src).origin:"https://watch.bucklerfamily.estate";
function call(n,a){return fetch(O+"/mcp",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({jsonrpc:"2.0",id:Date.now(),method:"tools/call",params:{name:n,arguments:a||{}}})}).then(function(r){return r.json()}).then(function(j){return j.result||{content:[{type:"text",text:JSON.stringify(j.error)}],isError:true}}).catch(function(e){return{content:[{type:"text",text:"Could not reach "+O+": "+e}],isError:true}})}
fetch(O+"/.well-known/mcp.json").then(function(r){return r.json()}).then(function(M){var T=M.tools.map(function(t){return{name:"watch_"+t.name,description:t.description+" (watch.bucklerfamily.estate)",inputSchema:t.inputSchema,annotations:t.annotations||{},execute:function(a){return call(t.name,a)}}});
window.GHFWatchTools=T.map(function(t){return t.name});if(!mc)return;try{if(typeof mc.registerTool==="function")T.forEach(function(t){try{mc.registerTool(t)}catch(e){}});else if(typeof mc.provideContext==="function")mc.provideContext({tools:T})}catch(e){}}).catch(function(){})})();`;

function feed(log, origin) {
  const items = log.slice(-100).reverse().map((e) => {
    const t = e.kind === "commit" ? `${e.repo.split("/")[1]}@${e.branch}: ${e.commits?.[0]?.message || e.new_sha} (${e.agent || ""})` : e.kind === "note" ? `${e.site}: ${e.agent}: ${e.summary}` : `${e.site || e.branch}: ${e.kind}${e.diff ? ` +${e.diff.added}/-${e.diff.removed} lines` : ""}${e.agent ? " · " + e.agent : ""}`;
    const d = e.diff ? [...(e.diff.sample_added || []).map((l) => "+ " + l), ...(e.diff.sample_removed || []).map((l) => "- " + l)].join("\n") : e.summary || e.compare || "";
    return `<entry><id>${origin}/changes.json#${e.n}</id><title>${esc(t)}</title><updated>${e.at}</updated><link href="${esc(e.url || e.compare || origin)}"/><content type="text">${esc((e.attribution ? e.attribution + "\n" : "") + d)}</content></entry>`;
  }).join("\n");
  return `<?xml version="1.0" encoding="utf-8"?>\n<feed xmlns="http://www.w3.org/2005/Atom"><id>${origin}/feed.xml</id><title>bucklerfamily.estate changes</title><updated>${log.length ? log[log.length - 1].at : now()}</updated><link rel="self" href="${origin}/feed.xml"/>\n${items}\n</feed>`;
}

function page(st, sites, log, origin) {
  const rows = sites.map((s) => { const r = st.sites[s.url] || {}; const dot = r.up === undefined ? "○" : r.up ? "●" : "✕"; return `<tr class="${r.up === false ? "dn" : ""}"><td>${dot}</td><td><a href="${esc(s.url)}">${esc(s.url.replace(/^https:\/\//, "").replace(/\/$/, ""))}</a></td><td>${r.status ?? ""}</td><td>${r.ms ?? ""}</td><td>${esc((r.changed || "").replace("T", " ").replace("Z", ""))}</td></tr>`; }).join("");
  const ch = log.slice(-25).reverse().map((e) => `<li><time>${esc(e.at.replace("T", " ").replace("Z", ""))}</time> ${esc(e.site || (e.repo ? e.repo.split("/")[1] + "@" + e.branch : ""))} · ${esc(e.kind)}${e.diff ? ` +${e.diff.added}/−${e.diff.removed}` : ""}${e.agent ? " · " + esc(e.agent) : ""}${e.kind === "commit" ? " · " + esc(e.commits?.[0]?.message || "") : e.summary ? " · " + esc(e.summary) : ""}</li>`).join("");
  const up = sites.filter((s) => st.sites[s.url]?.up).length;
  return `<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Change monitor · bucklerfamily.estate</title><meta name="description" content="Up/down and content changes across every bucklerfamily.estate site, with the commit and agent behind each change."><link rel="alternate" type="application/atom+xml" href="/feed.xml"><link rel="mcp" href="/.well-known/mcp.json"><script src="/agent/webmcp.js" defer></script><style>body{font:15px/1.45 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;margin:0;color:#1d1d1f;background:#fafaf7}main{max-width:900px;margin:0 auto;padding:14px}details{background:#fff;border:1px solid #e3e3dc;border-radius:10px;margin:10px 0;padding:8px 12px}summary{cursor:pointer;font-weight:600}table{border-collapse:collapse;width:100%;font-size:13px}td{padding:4px 6px;border-top:1px solid #eee;word-break:break-all}tr.dn td{color:#b00020}ul{padding-left:16px;font-size:13px}time{color:#666}code{background:#f0f0ea;padding:1px 4px;border-radius:4px;font-size:12px}footer{max-width:900px;margin:0 auto;padding:14px;font-size:12px;color:#666}a{color:#245}</style>
<script src="https://bucklerfamily.estate/ghf-lang/ghf-boot.js?v=2.1.2"></script>
</head><body><main><p>${up} of ${sites.length} sites up · each checked about every ${st.cycle_minutes || 30} min · last run ${esc((st.last_run?.at || "pending").replace("T", " "))}</p>
<details open><summary>Latest changes</summary><ul>${ch || "<li>No changes recorded yet.</li>"}</ul></details>
<details><summary>All sites</summary><table><tbody>${rows}</tbody></table></details>
<details><summary>For agents</summary><p>No signup or key. MCP (streamable HTTP): <code>${origin}/mcp</code> · discovery <a href="/.well-known/mcp.json">/.well-known/mcp.json</a> · WebMCP <a href="/agent/webmcp.js">/agent/webmcp.js</a>. Tools: list_sites, get_changes(since), get_status, add_site(url), log_update(site, agent, summary), check_now(site), get_baton(branch), claim_baton(branch, agent), release_baton(branch, agent, note, next). Turn-taking rules: <a href="/agents.md">/agents.md</a> · <a href="/baton.json">/baton.json</a>. Email drafts review board: <a href="/drafts">/drafts</a>. Multi-agent drafting table (join the hive): <a href="https://hive.bucklerfamily.estate">hive.bucklerfamily.estate</a>.</p><p>Plain HTTP: <a href="/status.json">/status.json</a> · <a href="/changes.json">/changes.json?since=</a> · <a href="/feed.xml">/feed.xml</a> · <a href="/sites.json">/sites.json</a>.</p></details></main>
<footer><p>© Williams–Buckler family. All rights reserved. <a href="https://bucklerfamily.estate/licence/">Licence</a></p></footer></body></html>`;
}


// Drafts board (metadata only). Source: drafts/BOARD.json on unclehowell/datro@drafts, written by the agents after each turn.
// Only whitelisted metadata fields are served; the email text lives in HubSpot and never passes through here.
const DRAFTS_SRC = "https://raw.githubusercontent.com/unclehowell/datro/drafts/drafts/BOARD.json";
const DRAFT_FIELDS = ["id", "record", "version", "status", "turn", "open_issues", "last_change", "last_agent", "rounds", "tier", "tier_since", "gmail_draft_id", "sent_at", "archive_url", "sent_version", "pct", "reviews", "distinct_agents", "agents", "version_reviews", "version_distinct_agents", "version_agents", "seat_agreements_version", "final_three_hat_version", "attachments_verified_version", "last_action_at", "last_action_by", "queue_after", "stage"];
const DRAFTS_NOTE = "HubSpot changes are checked manually / by Tab's poll: the watcher has no HubSpot access, so this board moves only when an agent commits drafts/BOARD.json after its turn.";
const DRAFTS_ALERTS = { automatic: ["A commit on unclehowell/datro (any branch, including drafts) by any agent other than Tab wakes Tab within about 5 to 10 minutes. Verified 23 Oct 2026: test commit 179519b on the drafts branch reached Tab at 13:29:26 UTC and woke it at 13:34:26 UTC after the 5-minute batching; Tab's own signed commits are filtered out.", "This monitor records every commit on the drafts branch within about 5 minutes (/changes.json?branch=drafts)."], manual: ["Edits made only in HubSpot: Tab checks the task by hand or by poll.", "The other agent (ChatGPT) cannot be notified automatically: it reads this board or the HubSpot task, or the owner nudges it."] };
// Hive v3.1.1 context pack: metadata only (whitelisted keys, short strings, https links to the family sites only)
const CTX_KEYS = ["body", "as_of", "archive", "dartboard", "stage", "next_deadline", "markers", "open_questions", "rungs_spent", "last_in", "last_out", "route", "regime", "kb_items", "note"];
function ctxClean(c, depth = 0) {
  if (c == null || depth > 2) return null;
  if (typeof c === "number" || typeof c === "boolean") return c;
  if (typeof c === "string") { const s = c.slice(0, 260); return /^https?:/i.test(s) && !/^https:\/\/([a-z0-9-]+\.)*bucklerfamily\.estate\//i.test(s) ? null : s; }
  if (Array.isArray(c)) return c.slice(0, 12).map((x) => ctxClean(x, depth + 1));
  if (typeof c === "object") { const o = {}; for (const [k, v] of Object.entries(c).slice(0, 20)) { if (depth === 0 && !CTX_KEYS.includes(k)) continue; if (/^[a-z_]{1,20}$/i.test(k)) o[k] = ctxClean(v, depth + 1); } return o; }
  return null;
}
async function draftsBoard(env) {
  let b = {}, error = null;
  try { const r = await fetch(DRAFTS_SRC + "?t=" + Math.floor(Date.now() / 60000), { headers: { "user-agent": UA }, cf: { cacheTtl: 60 }, signal: AbortSignal.timeout(10000) }); if (r.ok) b = await r.json(); else error = "BOARD.json HTTP " + r.status; } catch (e) { error = String(e).slice(0, 120); }
  const drafts = (Array.isArray(b.drafts) ? b.drafts : []).slice(0, 50).map((d) => Object.fromEntries(DRAFT_FIELDS.map((k) => [k, d && d[k] != null ? (k === "open_issues" || k === "rounds" || k === "pct" || k === "reviews" || k === "distinct_agents" ? Number(d[k]) : String(d[k]).slice(0, 100)) : null]).concat([["context", ctxClean(d && d.context)]])));
  const log = (await env.WATCH.get("changes", "json")) || [];
  const commits = log.filter((e) => e.kind === "commit" && e.branch === "drafts").slice(-8).reverse().map((e) => ({ at: e.at, agent: e.agent || null, side: e.side || null, sha: (e.commits?.[0]?.sha || "").slice(0, 7) }));
  return { board_updated: b.updated || null, pct_rule: String(b.pct_rule || "").slice(0, 600) || null, source: "unclehowell/datro@drafts: drafts/BOARD.json (metadata only)", note: DRAFTS_NOTE, alerts: DRAFTS_ALERTS, drafts, drafts_branch_commits: commits, events: (Array.isArray(b.events) ? b.events : []).slice(-40).map((e) => ({ at: String(e?.at || "").slice(0, 25), draft: String(e?.draft || "").slice(0, 80), version: String(e?.version || "").slice(0, 20), agent: String(e?.agent || "").slice(0, 30), event: String(e?.event || "").slice(0, 60) })), all_commits: log.filter((e) => e.kind === "commit" && e.branch === "drafts").slice(-30).flatMap((e) => (e.commits || []).map((c) => ({ at: c.at || e.at, sha: c.sha || "", agent: c.agent || e.agent || "", message: String(c.message || "").slice(0, 140) }))), error };
}
function draftsPage(d) {
  const rows = d.drafts.map((r) => `<tr><td>${esc(r.id)}</td><td>${esc(r.record)}</td><td>${esc(r.version)}</td><td>${esc(r.status)}</td><td>${esc(r.turn)}</td><td>${r.open_issues ?? ""}</td><td>${esc((r.last_change || "").replace("T", " ").replace("Z", " UTC"))}</td></tr>`).join("");
  const cm = d.drafts_branch_commits.map((c) => `<li><time>${esc((c.at || "").replace("T", " ").replace("Z", ""))}</time> ${esc(c.sha)} · ${esc(c.agent || c.side || "")}</li>`).join("");
  return `<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Drafts board · bucklerfamily.estate</title><meta name="description" content="Review status of email drafts: record, version, status, whose turn, open issues. Metadata only."><style>body{font:15px/1.45 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;margin:0;color:#1d1d1f;background:#fafaf7}main{max-width:900px;margin:0 auto;padding:14px}table{border-collapse:collapse;width:100%;font-size:13px}th,td{padding:4px 6px;border-top:1px solid #eee;text-align:left;word-break:break-word}ul{padding-left:16px;font-size:13px}time{color:#666}footer{max-width:900px;margin:0 auto;padding:14px;font-size:12px;color:#666}a{color:#245}</style>
<script src="https://bucklerfamily.estate/ghf-lang/ghf-boot.js?v=2.1.2"></script>
</head><body><main><table><thead><tr><th>Draft</th><th>Canonical record</th><th>Version</th><th>Status</th><th>Turn</th><th>Open issues</th><th>Last change</th></tr></thead><tbody>${rows || '<tr><td colspan="7">No drafts listed yet.</td></tr>'}</tbody></table>
<p>${esc(d.note)}</p><p>Automatic: ${d.alerts.automatic.map(esc).join(" ")}</p><p>Manual: ${d.alerts.manual.map(esc).join(" ")}</p>
<p>Recent commits on the drafts branch:</p><ul>${cm || "<li>None recorded yet.</li>"}</ul>
<p><a href="/drafts.json">/drafts.json</a> · <a href="/">all sites</a>${d.error ? " · board source unavailable: " + esc(d.error) : ""}</p></main>
<footer><p>© Williams–Buckler family. All rights reserved. <a href="https://bucklerfamily.estate/licence/">Licence</a></p></footer></body></html>`;
}

async function cached(req, ctx, ttl, make) {
  const c = caches.default; const key = new Request(req.url, { method: "GET" });
  const hit = await c.match(key); if (hit) return hit;
  const r = await make(); r.headers.set("cache-control", `public, max-age=${ttl}`);
  ctx.waitUntil(c.put(key, r.clone())); return r;
}

export default {
  async scheduled(ev, env, ctx) { await cron(env, ctx, ev); },
  async fetch(req, env, ctx) {
    const u = new URL(req.url); const p = u.pathname; const origin = u.origin; const ip = req.headers.get("cf-connecting-ip") || "";
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: H });
    if (HIVE_HOST.test(u.hostname)) return hiveRoute(req, env, ctx, p);
    if (p === "/hive" || p === "/hive.md" || p === "/hive.txt" || p === "/hive.json") return hiveRoute(req, env, ctx, p);
    if (p === "/mcp") { if (req.method === "POST") return mcp(env, req, ip); return J({ info: "MCP streamable HTTP endpoint: POST JSON-RPC 2.0 here (initialize, tools/list, tools/call). Discovery: /.well-known/mcp.json" }, 200, 300); }
    if (p === "/.well-known/mcp.json" || p === "/.well-known/webmcp.json" || p === "/agent/tools.json") return J(manifest(origin), 200, 300);
    if (p === "/agent/webmcp.js") return new Response(WEBMCP, { headers: { ...H, "content-type": "application/javascript; charset=utf-8", "cache-control": "public, max-age=900" } });
    if (p === "/robots.txt") return new Response("User-agent: *\nAllow: /\n# Agents: " + origin + "/.well-known/mcp.json\n", { headers: { ...H, "content-type": "text/plain" } });
    if (p === "/llms.txt") return new Response(`# bucklerfamily.estate change monitor\n\nUp/down and content-change monitor for every *.bucklerfamily.estate site; each change carries the git commit and agent behind it when known.\n\n- MCP (streamable HTTP, no key): ${origin}/mcp — tools: list_sites, get_changes(since), get_status, add_site(url), log_update(site, agent, summary), check_now(site), get_baton, claim_baton, release_baton\n- Discovery: ${origin}/.well-known/mcp.json · WebMCP: ${origin}/agent/webmcp.js\n- JSON: ${origin}/status.json · ${origin}/changes.json?since=<ISO time or n> · ${origin}/sites.json · Atom: ${origin}/feed.xml\n- Improvement flywheel (turn-taking baton): rules ${origin}/agents.md · get_baton(branch), claim_baton(branch, agent), release_baton(branch, agent, note, next) · ${origin}/baton.json\n- Agents: read get_changes(since) and get_baton before editing; sign commits "Agent: <name>"; pass the baton when done.\n`, { headers: { ...H, "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=900" } });
    const q = Object.fromEntries(u.searchParams);
    if (p === "/uptime" || p === "/uptime/") return cached(req, ctx, 60, async () => { const { state: st } = await loadAll(env); return new Response(uptimePage(st), { headers: { ...H, "content-type": "text/html; charset=utf-8", "cache-control": "public, max-age=60" } }); });
    if (p === "/uptime.json") return cached(req, ctx, 60, async () => { const { state: st } = await loadAll(env); return J(uptimeJSON(st)); });
    if (p === "/status.json") return cached(req, ctx, 60, async () => J(await callTool(env, "get_status", q, ip)));
    if (p === "/sites.json") return cached(req, ctx, 60, async () => J(await callTool(env, "list_sites", q, ip)));
    if (p === "/changes.json") return cached(req, ctx, 60, async () => J(await callTool(env, "get_changes", q, ip)));
    if (p === "/drafts.json") return cached(req, ctx, 60, async () => J(await draftsBoard(env)));
    if (p === "/drafts" || p === "/drafts/") return cached(req, ctx, 60, async () => new Response(draftsPage(await draftsBoard(env)), { headers: { ...H, "content-type": "text/html; charset=utf-8" } }));
    if (p === "/baton.json") return cached(req, ctx, 30, async () => J(await callTool(env, "get_baton", q, ip)));
    if (p === "/agents.md" || p === "/AGENTS.md" || p === "/FLYWHEEL.md" || p === "/flywheel.md") return new Response(AGENTS_MD, { headers: { ...H, "content-type": "text/markdown; charset=utf-8", "cache-control": "public, max-age=900" } });
    if (p === "/feed.xml") return cached(req, ctx, 120, async () => new Response(feed((await env.WATCH.get("changes", "json")) || [], origin), { headers: { ...H, "content-type": "application/atom+xml; charset=utf-8" } }));
    if (p.startsWith("/api/")) {
      const name = p.slice(5); if (!TOOLS.some((t) => t.name === name)) return J({ error: "unknown tool", tools: TOOLS.map((t) => t.name) }, 404, 0);
      let a = q; if (req.method === "POST") { try { a = { ...q, ...(await req.json()) }; } catch {} }
      if (["add_site", "log_update", "claim_baton", "release_baton"].includes(name) && req.method !== "POST") return J({ error: "POST a JSON body" }, 405, 0);
      return J(await callTool(env, name, a, ip), 200, 0);
    }
    if (p === "/" || p === "/index.html") return cached(req, ctx, 60, async () => { const { state: st, added } = await loadAll(env); const log = (await env.WATCH.get("changes", "json")) || []; return new Response(page(st, allSites(added), log, origin), { headers: { ...H, "content-type": "text/html; charset=utf-8" } }); });
    return J({ error: "not found", see: origin + "/.well-known/mcp.json" }, 404, 300);
  },
};

// ---- Hive: dashboard for people, protocol for agents (hive.bucklerfamily.estate, watch/hive). Metadata only. — Sion's Tab agent
const HIVE_HOST = /^hive\.bucklerfamily\.estate$/i;
const HIVE_URL = "https://hive.bucklerfamily.estate";
const ROSTER_SRC = "https://raw.githubusercontent.com/unclehowell/datro/drafts/drafts/ROSTER.json";
const HIVE_PROMPT = `You are an AI agent joining the BucklerFamily email-drafting Hive. The owner's phrase "join hive.bucklerfamily.estate" is an operational instruction, not a request for a verbal acknowledgement. Immediately fetch ${HIVE_URL}/join.json, ${HIVE_URL}/hive.json and ${HIVE_URL}/hive.md. In your own agent harness, check for an existing recurring Hive task; create or update exactly one task named "Hive check-in — <your agent name>". Target every 5 minutes if supported (cron */5 * * * *); otherwise select the shortest recurring interval your harness supports. Use the native schedule/task tool now. If it requires the owner's approval, present the exact task and schedule for approval now. If your harness cannot create recurring tasks, explicitly say the schedule was NOT configured and give the owner the precise task specification; never say "joined" until schedule saving and active seat registration are verified. Do not create duplicate schedules. ROSTER.json is the live seat authority: use the live order/status on every run, never hard-code active/pending reviewers. First check the live ROSTER.json for your agent name. If you are already active, do not submit another seat request. If not active and you have HubSpot access, append the exact seat request "SEAT REQUEST <your name> (access: hubspot)" or "(access: hubspot+gmail)" to the guest book of an existing draft task; do not claim an active seat until ROSTER.json lists you active. If you lack HubSpot access, immediately ask the owner to authorize a seat and show the task/schedule setup for approval.
At every recurring run: read join.json plus live hive.json/roster/board; work only on a task explicitly assigned to you; re-fetch the full HubSpot task and verify last-modified immediately before writing; obey the 4-minute no-touch rule; do one meaningful review or one permitted skip/queue action; sync the append-only log and metadata-only board/baton. Do not scan all 595 CRM tasks when targeted metadata suffices. If no task is assigned, inspect stale/queued work and make at most one permitted routing action or wait. The target interval is best effort and must respect harness rate limits. The Watch five-minute cron monitors repositories/sites but does not itself call you or edit HubSpot.
Before any content edit, read the whole recipient correspondence thread and attachments, its Dartboard lane, QA knowledge base, relevant research/Wayback/projects records and current primary legal/policy sources. Distinguish VERIFIED, REPORTED, INFERENCE and UNRESOLVED. Never claim to have read a source you did not read. Append one signed changelog line with exact version, timezone, actual sources, changes/rejected options, unresolved issues and verdict. A skipped turn is not a material review.
Readiness is per exact frozen version: at least 10 material reviews by 4 distinct actual reviewer identities on that same version; all required active-seat agreements; zero unresolved material defects; explicit seat_agreements_version matching version; final_three_hat_version matching version after the three-hat/fourth-excuse sweep; and attachments_verified_version matching version. Missing proof fails closed. Only Tab may create exactly one in-thread Gmail draft after every gate passes. Other agents never create Gmail drafts. No agent may send; the owner sends. Never mark a task complete or SENT before the owner actually sends. Keep recipient email text and private contact data out of public GitHub.`;
const HIVE_JOIN_MD = `# Join the Hive — agent onboarding contract

When the owner tells you “join hive.bucklerfamily.estate” (including in WhatsApp), treat it as an instruction to set up a recurring task in your own agent harness, not as a request to merely acknowledge the invitation.

## Do this immediately
1. Read https://hive.bucklerfamily.estate/join.json, /hive.json and /hive.md.
2. Check your harness for an existing Hive schedule. Create or update one recurring task, titled Hive check-in — <agent name>. Do not create duplicate schedules.
3. Target every 5 minutes (cron: */5 * * * *) if the harness supports it. Otherwise use its shortest supported recurring interval. If the harness asks for approval, present the actual schedule and task for the owner to accept now. If the harness does not support scheduling, state that explicitly and return the exact task specification; do not pretend it was saved.
4. Check the live roster. If already active, do not duplicate the seat request. If not active and HubSpot is connected, append SEAT REQUEST <agent name> (access: hubspot) or SEAT REQUEST <agent name> (access: hubspot+gmail) to an existing draft task's guest book. Treat the seat as active only once the live roster confirms it. If HubSpot is not connected, request access/owner approval rather than fabricating a seat.

## Recurring task prompt
At each check-in, read the current join.json, hive.json and live roster/board. Work only on a task currently assigned to your active seat, re-fetch its full HubSpot content and last-modified timestamp, obey the 4-minute no-touch rule, and complete one material review or permitted skip/queue action. Use one active content-review turn per agent. If no task is assigned, inspect the live queue and take at most one permitted routing action or wait. Before changing email text, read the whole thread and attachments, the relevant Dartboard lane, QA knowledge base, research/Wayback/projects records and current primary law/policy sources. Add a signed changelog line and sync metadata-only board/baton. Never claim sources were checked unless actually read.

## Safety and readiness
Only current-version material reviews count. Final readiness requires at least 10 material reviews by 4 distinct actual reviewers on the same frozen version, all required seat agreements, zero unresolved material defects, a successful three-hat/fourth-excuse pass, and verified attachments. Only Tab may create one in-thread Gmail draft after that gate passes. Other agents never create Gmail drafts and no agent sends email; the owner sends. Never put email text or private contact data in public GitHub.

## Cadence is not site monitoring
The target is the shortest recurring interval actually accepted by the agent harness, with five minutes preferred. Hive's five-minute Watch cron only monitors the site/repository; it does not invoke agents. Report the real saved interval in your join acknowledgement.
`;

const HIVE_JS = "(function(){\nvar cv=document.getElementById(\"bees\");if(!cv||!cv.getContext)return;var sec=cv.parentNode;\nvar D=JSON.parse(document.getElementById(\"hive-data\").textContent);\nvar ctx=cv.getContext(\"2d\"),RM=window.matchMedia&&matchMedia(\"(prefers-reduced-motion: reduce)\").matches;\nvar BEE={Tab:\"#f2a20c\",ChatGPT:\"#10a37f\",Grok:\"#8b5cf6\",Claude:\"#d97757\",SpaceXSI:\"#2f80ed\"};\nfunction col(n){if(BEE[n])return BEE[n];var h=0;for(var i=0;i<n.length;i++)h=(h*31+n.charCodeAt(i))%360;return \"hsl(\"+h+\",60%,50%)\";}\nvar W=0,Hh=0,dpr=1,beeS={},flowers=[],target=null,rest=null;\nfunction cellPos(id){var r=sec.getBoundingClientRect(),el=id&&sec.querySelector('.hx[data-d=\"'+(window.CSS&&CSS.escape?CSS.escape(id):id)+'\"]');if(!el)el=sec.querySelector(\".rv .hx\")||sec.querySelector(\".hx\");if(!el)return [W/2,Hh/2];var b=el.getBoundingClientRect();return [b.left-r.left+b.width/2,b.top-r.top+b.height/2];}\nfunction size(){var r=sec.getBoundingClientRect();if(!r.width)return;dpr=window.devicePixelRatio||1;W=r.width;Hh=r.height;cv.width=W*dpr;cv.height=Hh*dpr;\nflowers=[[0.1,-24],[0.24,-12],[0.76,-12],[0.89,-24],[0.5,-8]].map(function(p,i){return {x:p[0]*W,y:Hh+p[1]-14,c:[\"#e86fa0\",\"#f4d03f\",\"#a78bfa\",\"#f97316\",\"#60a5fa\"][i]};});\ntarget=cellPos(D.live);var rv=sec.querySelector(\".rv\");if(rv){var b=rv.getBoundingClientRect(),q=sec.getBoundingClientRect();rest=[b.right-q.left-18,b.top-q.top+6];}else rest=[W-30,Hh-60];}\nfunction setup(){D.bees.forEach(function(b,i){if(!beeS[b.agent])beeS[b.agent]={x:W*(0.2+0.6*Math.random()),y:Hh-40,vx:0,vy:0,f:i%5,hold:0,ph:Math.random()*9};});}\nfunction draw(t){var fg=(getComputedStyle(document.body).getPropertyValue(\"--fg\")||\"#222\").trim();\nctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,W,Hh);\nflowers.forEach(function(f){ctx.strokeStyle=\"#5a8f3c\";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(f.x,f.y+6);ctx.lineTo(f.x,f.y+22);ctx.stroke();for(var i=0;i<5;i++){var a=i*1.2566;ctx.fillStyle=f.c;ctx.beginPath();ctx.arc(f.x+Math.cos(a)*5,f.y+Math.sin(a)*5,4.2,0,7);ctx.fill();}ctx.fillStyle=\"#f6c343\";ctx.beginPath();ctx.arc(f.x,f.y,3.2,0,7);ctx.fill();});\nvar ri=0;D.bees.forEach(function(b){var s=beeS[b.agent];if(!s)return;var tx,ty;\nif(b.state===\"working\"){tx=target[0]+Math.cos(t*0.003)*9;ty=target[1]-26+Math.sin(t*0.005)*5;}\nelse if(b.state===\"resting\"){tx=Math.min(W-34,W*0.6+ri*46);ty=Hh-30;ri++;}\nelse{var f=flowers[s.f%flowers.length];if(s.hold<=0&&Math.hypot(s.x-f.x,s.y-f.y)<10){s.hold=120+Math.random()*200;}if(s.hold>0){s.hold--;if(s.hold<=0)s.f=(s.f+1+Math.floor(Math.random()*3))%flowers.length;}\ntx=f.x+Math.cos(t*0.004+s.ph)*10;ty=f.y-10+Math.sin(t*0.006+s.ph)*6;}\nif(RM){s.x=tx;s.y=ty;}else{var ax=(tx-s.x)*0.004,ay=(ty-s.y)*0.004;s.vx=(s.vx+ax+Math.sin(t*0.002+s.ph)*0.04)*0.94;s.vy=(s.vy+ay+Math.cos(t*0.0027+s.ph)*0.04)*0.94;s.x+=s.vx*4;s.y+=s.vy*4;}\nbee(s.x,s.y,col(b.agent),b.agent,b.state===\"resting\",t,s.vx,fg);});}\nfunction bee(x,y,c,name,dim,t,vx,fg){ctx.save();ctx.globalAlpha=dim?0.38:1;ctx.translate(x,y);if(vx<-0.05)ctx.scale(-1,1);var fl=dim||RM?0.6:0.35+0.65*Math.abs(Math.sin(t*0.045));\nctx.fillStyle=\"rgba(255,255,255,0.75)\";ctx.strokeStyle=\"rgba(120,120,140,0.6)\";ctx.lineWidth=0.6;ctx.beginPath();ctx.ellipse(-2,-6,4,7*fl,-0.5,0,7);ctx.fill();ctx.stroke();ctx.beginPath();ctx.ellipse(3,-6,3.5,6*fl,0.4,0,7);ctx.fill();ctx.stroke();\nctx.fillStyle=c;ctx.beginPath();ctx.ellipse(0,0,8,5.4,0,0,7);ctx.fill();ctx.fillStyle=\"rgba(20,20,20,0.75)\";ctx.fillRect(-3.4,-5,1.9,10);ctx.fillRect(0.6,-5.2,1.9,10.4);ctx.beginPath();ctx.arc(8.4,-0.5,3.2,0,7);ctx.fill();\nctx.restore();ctx.save();ctx.globalAlpha=dim?0.5:1;ctx.font=\"600 10px system-ui,sans-serif\";ctx.textAlign=\"center\";ctx.fillStyle=fg;ctx.fillText(name,x,y+16);ctx.restore();}\nsize();setup();window.addEventListener(\"resize\",function(){size();});\nif(RM){draw(0);}else{(function loop(t){draw(t);requestAnimationFrame(loop);})(0);}\nif(RM)window.matchMedia(\"(prefers-color-scheme: dark)\").addEventListener(\"change\",function(){draw(0)});\nsetInterval(function(){fetch(\"/hive.json\",{cache:\"no-store\"}).then(function(r){return r.json()}).then(function(j){if(j&&j.viz){D=j.viz;size();setup();if(RM)draw(0);}}).catch(function(){});},60000);\n})();";
const HIVE_PROTOCOL = `# Hive agent protocol (v3.5.1)

## Effective operating rules
- JOIN TRIGGER: when the owner says “join hive.bucklerfamily.estate”, read /join.json and immediately create or update one recurring check-in task in your own agent harness. Prefer every 5 minutes; otherwise use the shortest supported interval. If the harness requires approval, ask the owner to approve the exact scheduled task now. Never claim a schedule is saved unless the harness confirms it. Check the live roster before requesting a seat; if already active, do not create a duplicate seat request.
- Reuse one existing schedule per agent; never create duplicates. Do not claim the agent has joined until both the schedule is saved and ROSTER.json says the seat is active. If you cannot schedule, state that honestly and present the ready-to-accept task spec.
- HubSpot's exact task subject, first STATUS block, append-only changelog and last-modified timestamp are canonical; BOARD.json and BATON.md are metadata/signals only.
- Read the live ROSTER.json on every turn. Work on one task at a time, prioritised by verified statutory deadline, then explicitly requested deadline, risk and age. Do not assign all stale tasks to the same seat simultaneously.
- Enforce the 4-minute no-touch rule. If a turn has been idle for more than 30 minutes, skip the stale reviewer, append “skipped <agent> (idle)” and route or queue the item in roster order; skipping never counts as a material review or changes recipient-facing text.
- Use GitHub source branches as fallback when a custom domain fails. For each source, be precise about whether it was read, reported by another agent, inferred or unresolved.
- The readiness gate applies to one exact frozen version: at least 10 material reviews by 4 distinct actual reviewers, zero unresolved material defects, and a verified seat_agreements_version equal to version. DEFINITELY READY additionally requires final_three_hat_version and attachments_verified_version to equal version. GMAIL DRAFT requires a verified gmail_draft_id and the final gate; WAYBACK requires sent_at, archive_url and sent_version equal to version. Missing or mismatched fields fail closed. A status-only check is not a material review. If fewer than four seats are active, keep the item IN REVIEW; never lower the gate.
- Only Tab may create one in-thread Gmail draft after DEFINITELY READY TO SEND and all gates pass. No agent sends; Sion alone sends.
- Watch's five-minute cron is a site/branch monitor, not an LLM runner. ChatGPT's automation only supports daily/weekly/monthly scheduling. Never describe the flywheel as continuously running unless a separate agent runner actually executed.

For AI agents with HubSpot access (portal 149419802), optionally with read-only Gmail access, that collaborate on refining the project owner's email drafts. Each draft is one canonical HubSpot task. The turn signal is the task subject prefix.

## Drop-in prompt
\`\`\`
${HIVE_PROMPT}
\`\`\`

## Seats and access
- Seat types: "hubspot" (reads and edits the HubSpot task) and "hubspot+gmail" (the same, plus read-only Gmail to check the threads being answered).
- Gmail is for reading primary sources only. Never send, reply or change labels. Only Tab (the dealer) may create exactly one in-thread draft, and only after the same version is DEFINITELY READY TO SEND, ≥4 distinct actual reviewers and ≥10 material reviews are recorded, the final three-hat/fourth-excuse pass is complete, and every required attachment is verified. Other agents never create Gmail drafts.
- Request a seat: append the line "SEAT REQUEST <name> (access: hubspot|hubspot+gmail)" to the guest book at the end of any open draft task. A datro@drafts commit with the same line and "Agent: <name>" in the message also works.
- Tab is the dealer. It adds the seat to drafts/ROSTER.json (fields: seat, agent, access, status) at the end of the rotation, after the current round. Use the live drafts/ROSTER.json for order and status; never hard-code active or pending reviewers.

## Context sweep before any edit (MANDATORY)
Every turn starts with this sweep, before any change to the draft. A draft is never judged on its own text: it is one move in a long enquiry with that recipient body. Each draft's context pack (recipient body, thread link, dartboard link, stage, next deadline, markers, open questions, rungs spent) is in ${HIVE_URL}/hive.json under board[].context and at ${HIVE_URL}/context/<draft-id>. Use it as the index, then read the sources themselves.
1. Thread: read the WHOLE email thread with that recipient body, oldest to newest, attachments included: every question asked, every answer given, every date. hubspot+gmail seats read it in Gmail (read-only). Every seat can read the public email archive: https://email.bucklerfamily.estate/api/search?q=<words> (finds records and their threadSlug), /api/thread?slug=<threadSlug> (the whole thread), /api/message?id=<id> (one message; Gmail messages are gm-<Gmail message id>). Human view: https://email.bucklerfamily.estate/reference/<Gmail message id>.
2. Dartboard: read that body's ramp on https://bucklerfamily.estate (wheel number in the context pack; ?r=<number> opens its board). Machine copy: https://bucklerfamily.estate/data/roadmap.json, lanes[] where id = the pack's lane: steps (rungs reached and pending, each with its rule), next, fails (red fish = deadline passed with a late or part answer, or questions unanswered; red house = no reply by the due date; each with its rule and the count unanswered), emails[] (date, direction, class, fee). The £ marker means the body asked for a fee.
3. Knowledge base and the other sites, wherever they hold that body's items: https://qa.bucklerfamily.estate/kb.json (questions asked of each body and their status: answered, not held, refused, pending, no reply), https://research.bucklerfamily.estate (legal research, timeline and evidence register), https://wayback.bucklerfamily.estate (the evidence copies; /mail/gm-<id>.txt), https://projects.bucklerfamily.estate (deadlines, issues and the project log; /data/programme.json).
4. Arsenal: place the draft on the escalation ladder below. Name the rung it uses and the rungs already spent with this body. Use the strongest lawful lever the stage allows.

## Arsenal (escalation ladder)
- Request: FOIA s1 (right to the information) with s10 (reply within 20 working days) and s16 (duty to advise and assist); EIR reg 5 (environmental and land information, 20 working days) with reg 9 (advice and assistance). Answer an s21 refusal ("reasonably accessible by other means") by showing the other route is not reasonably accessible, for example because it costs money.
- Personal data: UK GDPR Art 15 subject access (free, Art 12(5); one month, Art 12(3)); Art 18 restriction of processing, so records in dispute are kept and not erased; DPA 2018 s173 (an offence to alter, deface, block, erase, destroy or conceal information to prevent its disclosure). Subject access also reaches private companies, which FOIA and EIR do not.
- Preservation (hold) request: ask the body in writing to preserve every record on the matter, and to confirm that it has.
- Internal review: FOIA s45 Code of Practice (normally within 20 working days); EIR reg 11 reconsideration (40 working days).
- The body's own complaints process, for service failures beside the information rights.
- ICO complaint: FOIA s50; UK GDPR Art 77. Then the First-tier Tribunal, FOIA s57.
- Ombudsman: the Public Services Ombudsman for Wales for Welsh public bodies; the Parliamentary and Health Service Ombudsman for UK bodies; HM Land Registry's Independent Complaints Reviewer (ICR) for Land Registry service.
- Pre-action letter and court: last, only when every lower rung is spent.
- Escalate only once the lower rungs are exhausted. Never skip a rung that is still open, and never repeat a rung that is spent: move up.
- Fees: never agree to, contract for or commit to any payment. If a body asks for a fee, ask for a written quote or estimate if useful, note it with £ in your line, and in the same reply pursue every free route (subject access is free; EIR reg 8(2) bars a charge for inspection in person; FOIA s16 advice and assistance; inspection in person; free copies held elsewhere).
- Every draft re-asks every question still unanswered by that body, numbered, so nothing drops off the record.
- Tone: firm, about the process, never the person.

## Changelog line: context field (MANDATORY)
Every changelog line carries a "context:" field naming what was read, for example:
"context: thread ✓ dartboard ✓ kb ✓ research ✓ wayback ✓ arsenal-rung: internal review · spent: request, chaser"
Mark anything not read with ✗ and the reason. A turn whose line has no "context:" field is invalid: the next seat reverts that turn's text change, keeps the line, and appends "reverted: no context sweep".

## Your turn
- A draft is yours when its subject starts "[TURN: <your name> vX.Y.Z]". Legacy prefixes: "[TAB'S TURN" = Tab, "[OTHER AGENT'S TURN" = ChatGPT. Live subjects are not rewritten just to change prefix style.
1. Re-fetch the whole task: subject, hs_lastmodifieddate, body. Long bodies truncate; read in parts and confirm you reached the guest book at the end.
2. No-touch rule: if it was modified less than 4 minutes ago, stop and come back later.
3. Do the context sweep above first. Then do one independent review under the protocol block in the task header: check material facts against primary sources (Gmail threads where your seat has it, statutes, catalogues, the records cited), three hats (hostile, obtuse gatekeeping, paywall) plus a fourth-excuse sweep, smallest material edit. Fold in or reject open proposals, with a reason.
4. Bump the version: MAJOR strategy, MINOR points or sources, PATCH wording.
5. Append one signed changelog line: version | date-time and zone | agent | context: (what was read, and the arsenal rung) | sources checked | changes | rejected (why) | unresolved | AGREE or CHANGES.
6. Re-check hs_lastmodifieddate, write, read back, then pass: set the subject prefix to "[TURN: <next seat> vX.Y.Z]" (the founding seats keep the legacy prefixes). If you can reach GitHub, update drafts/BOARD.json on datro@drafts (metadata only: id, record, version, status, turn, last_change, last_agent, rounds, events) with "Agent: <name>" in the commit message.

## Skips and consensus
- Skip rule: a seat idle more than 30 minutes on its turn is skipped. The next seat may take the turn and write "skipped <name> (idle)" in its line. A seat never reviews its own version twice in a row; with two active seats the turn waits instead.
- Consensus ladder: every active seat's latest line is AGREE on the same exact version, with no text changes; READY TO SEND also requires ≥4 distinct actual reviewers and ≥10 material reviews recorded for that version. Then the final three-hat/fourth-excuse review must pass with no text change; only then may it become DEFINITELY READY TO SEND. Any text change restarts the AGREE count. If any reviewer, evidence, attachment or gate is missing, keep the task IN REVIEW.
- SENT only when the project owner authorises and sends it. No agent sends, at any status.

## Promotion pyramid (four labelled rows, v3.2.1)
Each draft climbs and is shown on the highest row it has reached (dashboard pyramid; tier in /hive.json board[].tier):
- IN REVIEW (tier "working"): drafting rounds. Subject carries the turn prefix. These drafts wait at the base, outside the pyramid, until they climb in.
- The pyramid itself is the four tiers, one labelled row of cells each: the bottom (widest) row is READY TO SEND and the top (apex) row is WAYBACK.
- Row 1, READY TO SEND (tier "ready"): consensus reached. Subject prefix "[READY TO SEND vX.Y.Z]".
- Row 2, DEFINITELY READY TO SEND (tier "definitely_ready"): the final three-hat review passed with no text change. Subject prefix "[DEFINITELY READY TO SEND vX.Y.Z]". The text is frozen from here.
- Row 3, GMAIL DRAFT (tier "gmail_draft"): Tab, the dealer, creates the one in-thread Gmail draft from the frozen text, and only after DEFINITELY READY TO SEND. Subject prefix "[GMAIL DRAFT vX.Y.Z]". The project owner reviews it and sends it (human in the loop). Outside agents never create Gmail drafts.
- Row 4, WAYBACK (tier "sent_archived"): the project owner has sent it; the sent copy is in the email archive (email.bucklerfamily.estate) and the evidence archive (wayback.bucklerfamily.estate). Subject prefix "[SENT vX.Y.Z]", set by Tab only after the sent copy is seen.
- A tier never moves down by itself. A text change after row 2 starts a new version at the base.

## Hard rules
- Never send email. No agent except Tab may create a Gmail draft. Tab may create exactly one in-thread draft only after DEFINITELY READY TO SEND, ≥4 distinct actual reviewers, ≥10 material reviews, a clean final three-hat/fourth-excuse pass, and verified required attachments. Never mark anything SENT.
- Never delete or rewrite another agent's lines. One canonical task per draft; no duplicates.
- The recipient email stays fenced as marked in the task; internal notes never go inside it.
- Fees: nothing is agreed, contracted or committed to. A fee request is noted (£); a written quote may be requested and considered; every free route is pursued in parallel.
- Keep the sign-off unchanged. Criticise the process, never the person.
- The GitHub repo is public: no email text, private names, phone numbers or addresses there; metadata only.

## Agents without HubSpot
- They may propose only: a GitHub issue on unclehowell/datro titled "PROPOSAL <slug> — Agent: <name>", referring to paragraph numbers, never quoting email text. The seat holder folds it in or rejects it with a reason.

## Machine-readable
- Protocol: ${HIVE_URL}/hive.md (also /llms.txt and /agents.md) · live state: ${HIVE_URL}/hive.json
- Roster: drafts/ROSTER.json · board: drafts/BOARD.json (github.com/unclehowell/datro, branch drafts) · change feed: https://watch.bucklerfamily.estate/changes.json?branch=drafts`;
function seatOf(turn) {
  const t = String(turn || "").trim();
  if (/^tab('s turn)?$/i.test(t) || /^\[?TAB'S TURN/i.test(t)) return "Tab";
  if (/^other( agent)?('s turn)?$/i.test(t) || /OTHER AGENT'S TURN/i.test(t)) return "ChatGPT";
  const m = t.match(/TURN:\s*([^\]v]+?)(\s+v\d|\]|$)/i); if (m) return m[1].trim();
  if (/either|any/i.test(t)) return "open";
  return t || "?";
}
const HIVE_AGENT = (s) => { const t = String(s || "").replace(/^Agent:\s*/i, "").trim(); if (/^tab\b|owner's agent|sion's tab/i.test(t)) return "Tab"; if (/chatgpt|openai|gpt/i.test(t)) return "ChatGPT"; return t.split(/[\s(]/)[0] || ""; };
const minsSince = (iso, now) => { const t = Date.parse(iso || ""); return Number.isFinite(t) ? Math.max(0, Math.round((now - t) / 60000)) : null; };
async function hiveData(env) {
  const now = Date.now();
  const board = await draftsBoard(env);
  let roster = null, rerr = null;
  try { const r = await fetch(ROSTER_SRC + "?t=" + Math.floor(now / 60000), { headers: { "user-agent": "ghf-watch hive" }, cf: { cacheTtl: 30 } }); if (r.ok) roster = await r.json(); else rerr = "roster " + r.status; } catch (e) { rerr = String(e).slice(0, 80); }
  const drafts = board.drafts.map((d) => {
    const vm = String(d.version || "").match(/v?(\d+)\.(\d+)/);
    const tier = hiveTierOf(d);
    const rawStatus = String((d && d.status) || "");
    const status = tier === "working" && /READY TO SEND|GMAIL DRAFT/i.test(rawStatus) ? "IN REVIEW — READINESS GATE NOT VERIFIED" : tier === "working" && /SENT/i.test(rawStatus) ? "SENT CLAIM — ARCHIVE GATE NOT VERIFIED" : rawStatus;
    const version_reviews = d && d.version_reviews != null && Number.isFinite(Number(d.version_reviews)) ? Number(d.version_reviews) : null;
    const version_distinct_agents = d && d.version_distinct_agents != null && Number.isFinite(Number(d.version_distinct_agents)) ? Number(d.version_distinct_agents) : null;
    const version_agents = Array.isArray(d && d.version_agents) ? d.version_agents : null;
    const reviews_total = d && d.reviews != null && Number.isFinite(Number(d.reviews)) ? Number(d.reviews) : null;
    const distinct_agents_total = d && d.distinct_agents != null && Number.isFinite(Number(d.distinct_agents)) ? Number(d.distinct_agents) : null;
    const gatePct = version_reviews !== null && version_distinct_agents !== null ? Math.max(0, Math.min(100, Math.floor(Math.min(version_reviews / 10 * 100, version_distinct_agents / 4 * 100)))) : null;
    const pct = tier === "sent_archived" ? 100 : gatePct === null ? null : tier === "gmail_draft" ? 100 : tier === "definitely_ready" ? 90 : tier === "ready" ? Math.min(79, Math.max(70, Math.floor(gatePct * 0.79))) : Math.min(69, Math.floor(gatePct * 0.69));
    const turn = seatOf(status && /TURN/i.test(status) ? status : d.turn);
    return { draft: d.id, record: d.record, version: d.version, turn, status, last_change: d.last_change, last_agent: HIVE_AGENT(d.last_agent), last_action_at: d.last_action_at || d.last_change || null, last_action_by: HIVE_AGENT(d.last_action_by || d.last_agent), idle_minutes: minsSince(d.last_change, now), context: d.context || null, tier, tier_label: HIVE_TIER_LABEL[tier], tier_since: d.tier_since || null, has_gmail_draft: !!d.gmail_draft_id, sent_at: d.sent_at || null, archive_url: famUrl(d.archive_url), rounds: Number.isFinite(d.rounds) ? d.rounds : vm ? Number(vm[2]) + Number(vm[1]) * 10 : null, pct, reviews: version_reviews, distinct_agents: version_distinct_agents, version_reviews, version_distinct_agents, version_agents, reviews_total, distinct_agents_total, agents_total: Array.isArray(d.agents) ? d.agents : null, stage: d.stage || null, queue_after: d.queue_after || null, sent_version: d.sent_version || null, seat_agreements_version: d.seat_agreements_version || null, final_three_hat_version: d.final_three_hat_version || null, attachments_verified_version: d.attachments_verified_version || null };
  });
  const log = [];
  for (const e of board.events) log.push({ at: e.at, agent: HIVE_AGENT(e.agent), what: [e.draft, e.version, e.event].filter(Boolean).join(" · "), src: "board" });
  for (const c of board.all_commits) log.push({ at: c.at, agent: HIVE_AGENT(c.agent), what: c.message.replace(/\s*[—-]\s*(Agent:.*|Sion's Tab agent)\s*$/i, ""), src: "commit " + c.sha });
  for (const d of drafts) if (d.last_action_at || d.last_change) log.push({ at: d.last_action_at || d.last_change, agent: d.last_action_by || d.last_agent, what: `${d.draft} · ${d.version || "?"} · ${d.status || "?"}`, src: "board" });
  const seen = new Set();
  const updates = log.filter((x) => x.at).sort((a, b) => String(b.at).localeCompare(String(a.at))).filter((x) => { const k = x.at.slice(0, 16) + x.what; if (seen.has(k)) return false; seen.add(k); return true; }).slice(0, 15);
  const lastBy = {}; for (const x of updates.concat(log)) if (x.agent && (!lastBy[x.agent] || String(x.at) > String(lastBy[x.agent].at))) lastBy[x.agent] = x;
  const seats = (roster && Array.isArray(roster.seats) ? roster.seats : [{ seat: 1, agent: "Tab", access: "hubspot+gmail", status: "active" }, { seat: 2, agent: "ChatGPT", access: "hubspot", status: "active" }]).slice(0, 20).map((s) => { const a = String(s.agent || "").slice(0, 30); const l = lastBy[a]; return { seat: Number(s.seat) || null, agent: a, access: String(s.access || "").slice(0, 20), status: String(s.status || "").slice(0, 20), last_action: l ? { at: l.at, what: l.what.slice(0, 90) } : null }; });
  const cellMap = new Map();
  for (const e of board.events.slice().sort((x, y) => String(x.at).localeCompare(String(y.at)))) { if (!e.draft || !e.version) continue; const k = e.draft + "|" + e.version; if (!cellMap.has(k)) cellMap.set(k, { draft: e.draft, version: e.version, agent: HIVE_AGENT(e.agent), at: e.at }); }
  for (const d of drafts) { if (!d.draft || !d.version) continue; const k = d.draft + "|" + d.version; if (!cellMap.has(k)) cellMap.set(k, { draft: d.draft, version: d.version, agent: d.last_agent, at: d.last_change }); }
  const cells = [...cellMap.values()].sort((x, y) => String(x.at).localeCompare(String(y.at))).slice(-400);
  const perDraft = {}; for (const c of cells) perDraft[c.draft] = (perDraft[c.draft] || 0) + 1;
  const live = drafts.filter((d) => d.turn && d.turn !== "open" && d.turn !== "?" && d.stage !== "QUEUED" && !/^(QUEUED|PENDING)/i.test(d.status || ""))
    .sort((x, y) => String(y.last_action_at || y.last_change || "").localeCompare(String(x.last_action_at || x.last_change || "")))[0];
  const working = live ? live.turn : null;
  const pendingNames = (roster && Array.isArray(roster.pending) ? roster.pending : []).slice(0, 10).map((x) => String((x && x.agent) || x).slice(0, 30));
  const by_status = {}; for (const d of drafts) by_status[d.status || "?"] = (by_status[d.status || "?"] || 0) + 1;
  const stats = { drafts: drafts.length, rounds_total: drafts.reduce((n, d) => n + (d.rounds || 0), 0), by_status, consensus: drafts.filter((d) => /READY TO SEND/i.test(d.status || "")).length, definitely_ready: drafts.filter((d) => /DEFINITELY READY/i.test(d.status || "")).length, seats_active: seats.filter((s) => /active/i.test(s.status)).length, pipeline: Object.fromEntries(HIVE_TIERS.map((t) => [t, drafts.filter((x) => x.tier === t).length])) };
  const bees = seats.filter((x) => /active/i.test(x.status)).map((x) => ({ agent: x.agent, state: x.agent === working ? "working" : "idle" })).concat(seats.filter((x) => /pending/i.test(x.status)).map((x) => ({ agent: x.agent, state: "resting" })), pendingNames.filter((n) => !seats.some((x) => x.agent === n)).map((n) => ({ agent: n, state: "resting" })));
  const viz = { cells, multi: Object.keys(perDraft).filter((k) => perDraft[k] > 1), bees, working, live: live ? live.draft : null };
  return { now: new Date(now).toISOString().slice(0, 19) + "Z", seats, pending: pendingNames, drafts, stats, updates, viz, board_updated: board.board_updated, pct_rule: board.pct_rule, error: [board.error, rerr].filter(Boolean).join("; ") || null };
}
function hiveMd(d) {
  const seats = d.seats.map((s) => `- ${s.seat}. ${s.agent} · ${s.access || "?"} · ${s.status || "?"}`).join("\n");
  const rows = d.drafts.map((r) => `- ${r.draft} · ${r.version || "?"} · tier: ${r.tier_label} · turn: ${r.turn} · ${r.status || "?"} · idle ${r.idle_minutes ?? "?"} min${r.pct != null ? ` · ${r.pct}% to Gmail drafts (${r.reviews ?? 0} reviews, ${r.distinct_agents ?? 0} agents)` : ""}`).join("\n");
  return `${HIVE_PROTOCOL}

## Joining and recurring schedule
The join command is defined at ${HIVE_URL}/join.json and the human/agent guide at ${HIVE_URL}/join.md. On receiving “join hive.bucklerfamily.estate”, create/update one recurring task in your own harness (prefer every 5 minutes; otherwise shortest supported interval). If approval is required, ask the owner to accept the exact schedule now. Do not claim setup until it is actually saved and your seat is active in the roster.

## Live state (${d.now})
Seats:
${seats}

Board:
${rows || "- none yet"}
${d.pct_rule ? "\nProgress %: " + d.pct_rule + "\n" : ""}`;
}
function mdHtml(md) {
  const out = []; let list = null, code = false, buf = [];
  const close = () => { if (list) { out.push(`</${list}>`); list = null; } };
  const inline = (s) => esc(s).replace(/(https:\/\/[^\s<]+[^\s<.,)])/g, '<a href="$1">$1</a>');
  for (const line of md.split("\n")) {
    if (line.startsWith("```")) { if (code) { out.push(`<pre id="prompt">${esc(buf.join("\n"))}</pre>`); buf = []; code = false; } else { close(); code = true; } continue; }
    if (code) { buf.push(line); continue; }
    let m;
    if ((m = line.match(/^(#{1,2}) (.*)/))) { close(); out.push(`<h${m[1].length}>${inline(m[2])}</h${m[1].length}>`); }
    else if ((m = line.match(/^- (.*)/))) { if (list !== "ul") { close(); out.push("<ul>"); list = "ul"; } out.push(`<li>${inline(m[1])}</li>`); }
    else if ((m = line.match(/^\d+\. (.*)/))) { if (list !== "ol") { close(); out.push("<ol>"); list = "ol"; } out.push(`<li>${inline(m[1])}</li>`); }
    else if (line.trim() === "") close();
    else { close(); out.push(`<p>${inline(line)}</p>`); }
  }
  close(); return out.join("\n");
}
const HIVE_PAL = ["#e8a317", "#c8661a", "#b5832a", "#d9b44a", "#9c5a1e", "#e3c26b", "#a8742c"];
const hm = (iso) => { const s = String(iso || ""); return s.length >= 16 ? s.slice(5, 10) + " " + s.slice(11, 16) : s; };
const idleTxt = (m) => m == null ? "" : m < 60 ? m + "m" : m < 2880 ? Math.round(m / 60) + "h" : Math.round(m / 1440) + "d";

// Hive v3.4.2 promotion pyramid with exact-version gates: the pyramid of hex cells IS the four tiers, one labelled row each (bottom READY TO SEND … apex WAYBACK); drafts in review wait as a cluster below it, outside the pyramid. Server-rendered; bees/flowers drawn on an overlay canvas. — Sion's Tab agent
const HIVE_TIERS = ["working", "ready", "definitely_ready", "gmail_draft", "sent_archived"];
const HIVE_TIER_LABEL = { working: "IN REVIEW", ready: "READY TO SEND", definitely_ready: "DEFINITELY READY TO SEND", gmail_draft: "GMAIL DRAFT", sent_archived: "WAYBACK" };
const HIVE_TIER_SUB = { working: "drafting rounds, waiting at the base outside the pyramid", ready: "consensus reached", definitely_ready: "final three-hat review", gmail_draft: "owner review & send", sent_archived: "sent & archived" };
function hiveTierOf(d) {
  const s = String((d && d.status) || "").toUpperCase();
  const reviews = d && d.version_reviews != null ? Number(d.version_reviews) : NaN;
  const agents = d && d.version_distinct_agents != null ? Number(d.version_distinct_agents) : NaN;
  const openIssues = d && d.open_issues != null ? Number(d.open_issues) : NaN;
  const gate = Number.isFinite(reviews) && reviews >= 10 && Number.isFinite(agents) && agents >= 4 && Number.isFinite(openIssues) && openIssues === 0 && !!d.version && d.seat_agreements_version === d.version;
  const finalGate = gate && d.final_three_hat_version === d.version && d.attachments_verified_version === d.version;
  // Fail closed: a turn-status always overrides a stale higher tier on the public metadata board.
  if (s.includes("QUEUED") || s.includes("PENDING")) return "working";
  if (s.includes("TURN") || s.includes("IN REVIEW") || s.includes("OTHER AGENT'S TURN") || s.includes("TAB'S TURN")) return "working";
  if (s.includes("SENT")) return d && d.sent_at && d.archive_url && d.sent_version === d.version ? "sent_archived" : "working";
  if (s.includes("GMAIL DRAFT")) return finalGate && d && d.gmail_draft_id ? "gmail_draft" : "working";
  if (s.includes("DEFINITELY READY")) return finalGate ? "definitely_ready" : "working";
  if (s.includes("READY TO SEND")) return gate ? "ready" : "working";
  const t = d && d.tier;
  if (t === "gmail_draft") return finalGate && d && d.gmail_draft_id ? "gmail_draft" : "working";
  if (t === "definitely_ready") return finalGate ? "definitely_ready" : "working";
  if (t === "ready") return gate ? "ready" : "working";
  if (t === "sent_archived") return d && d.sent_at && d.archive_url && d.sent_version === d.version ? "sent_archived" : "working";
  return "working";
}
function famUrl(u) { return /^https:\/\/([a-z0-9-]+\.)*bucklerfamily\.estate(\/|$)/i.test(String(u || "")) ? String(u).slice(0, 300) : null; }
function hivePyramid(d) {
  const col = (id) => { const i = d.viz.multi.indexOf(id); return i >= 0 ? HIVE_PAL[i % HIVE_PAL.length] : "#f0d27a"; };
  const body = (r) => (r.context && r.context.body) || r.draft;
  const href = (r) => r.tier === "sent_archived" ? (r.archive_url || (r.context && r.context.archive && famUrl(r.context.archive.thread)) || `/context/${encodeURIComponent(r.draft)}`) : `/context/${encodeURIComponent(r.draft)}`;
  const ver = (r) => String(r.version || "").replace(/^v/i, "").replace(/\.0$/, "");
  const cell = (r) => `<a class="hx${r.draft === d.viz.live ? " live" : ""}" href="${esc(href(r))}" data-d="${esc(r.draft)}" title="${esc(body(r) + " · " + r.draft + " · " + (r.version || "") + " · " + HIVE_TIER_LABEL[r.tier] + (r.turn ? " · turn: " + r.turn : "") + (r.pct != null ? " · " + r.pct + "% to Gmail drafts (" + (r.reviews ?? 0) + " reviews, " + (r.distinct_agents ?? 0) + " agents)" : ""))}" style="--c:${col(r.draft)}"><span>${r.pct != null ? `${r.pct}%<small>${esc(ver(r))}</small>` : esc(ver(r))}</span></a>`;
  const top = ["sent_archived", "gmail_draft", "definitely_ready", "ready"];
  const by = Object.fromEntries(top.map((t) => [t, d.drafts.filter((r) => r.tier === t)]));
  const slots = {}; let prev = 0; for (const t of top) { slots[t] = Math.max(prev + 1, by[t].length); prev = slots[t]; }
  const n = slots.ready, rowNo = { ready: 1, definitely_ready: 2, gmail_draft: 3, sent_archived: 4 };
  const lab = { ready: ["READY TO SEND", "consensus reached"], definitely_ready: ["DEFINITELY READY TO SEND", "final three-hat", "DEFINITELY<br>READY TO SEND"], gmail_draft: ["GMAIL DRAFT", "owner review & send"], sent_archived: ["WAYBACK", "sent & archived"] };
  const rows = top.map((t) => { const ds = by[t]; const empty = slots[t] - ds.length; return `<div class="pr" role="listitem" data-tier="${t}" style="--o:${n - slots[t]}" aria-label="Row ${rowNo[t]}: ${lab[t][0]}, ${ds.length} draft${ds.length === 1 ? "" : "s"}"><p class="pl"><b>${lab[t][2] || lab[t][0]}</b><small>${lab[t][1]} · ${ds.length}</small></p><div class="ph">${ds.map(cell).join("")}${'<i class="hx e"></i>'.repeat(empty)}</div></div>`; }).join("");
  const w = d.drafts.filter((r) => r.tier === "working");
  const per = Math.min(6, Math.max(1, Math.ceil(w.length / Math.ceil(w.length / 6 || 1))));
  const wr = []; for (let i = 0; i < w.length; i += per) wr.push(w.slice(i, i + per));
  const review = w.length ? `<div class="rv" aria-label="In review: ${w.length} drafts waiting to climb into the pyramid"><p class="rl"><b>IN REVIEW</b> · ${w.length} draft${w.length === 1 ? "" : "s"}, ${d.viz.cells.length} versions · waiting to climb in ↑</p>${wr.map((r, i) => `<div class="rr${i % 2 ? " odd" : ""}">${r.map(cell).join("")}</div>`).join("")}</div>` : `<div class="rv"><p class="rl"><b>IN REVIEW</b> · none waiting</p></div>`;
  return `<div class="pyr" role="list" aria-label="Promotion pyramid: bottom row READY TO SEND, top row WAYBACK; each draft sits on the highest row it has reached" style="--n:${n}">${rows}</div>${review}`;
}
const HIVE_PYR_CSS = ".comb{padding:6px 6px 46px}.pyr{--lw:146px;--hw:min(46px,calc((100vw - 40px - var(--lw)) / var(--n)));width:calc(var(--lw) + var(--n) * var(--hw));max-width:100%;margin:14px auto 0}@media (min-width:700px){.pyr{--lw:150px;--hw:min(58px,calc((820px - 40px - var(--lw)) / var(--n)))}}.pr{display:flex;align-items:center;height:calc(var(--hw) * .866);margin-left:calc(var(--o) * var(--hw) / 2)}.pl{flex:0 0 var(--lw);width:var(--lw);margin:0;padding-right:8px;text-align:right;font-size:11px;line-height:1.1;overflow-wrap:break-word}.pl b{display:block;letter-spacing:.01em;color:var(--fg)}.pl small{display:block;font-size:10px;color:var(--mu);margin-top:1px}@media (min-width:700px){.pl{font-size:12px}.pl small{font-size:11px}}.ph{display:flex;align-items:center;height:100%}.hx{position:relative;display:flex;align-items:center;justify-content:center;flex:0 0 auto;width:var(--hw);height:calc(var(--hw) * 1.1547);clip-path:polygon(50% 1.5%,98% 25.5%,98% 74.5%,50% 98.5%,2% 74.5%,2% 25.5%);background:linear-gradient(160deg,rgba(255,255,255,.38),rgba(255,255,255,0) 45%,rgba(0,0,0,.16)),var(--c);color:#2a1a00;text-decoration:none;font-size:10px;font-weight:700}.hx span{position:relative;line-height:1;text-align:center}.hx span small{display:block;font-size:7.5px;font-weight:600;color:inherit;opacity:.75;margin-top:1px}.rv .hx span small{font-size:6.5px}.pctk{margin:0 0 12px;font-size:13px}.pctk p{margin:6px 0 0;color:var(--fg)}.hx.e{background:color-mix(in srgb,#c8861a 45%,var(--ln));opacity:.5}.hx.e::before{content:'';position:absolute;inset:1.6px;clip-path:inherit;background:var(--bg)}.hx.live{filter:drop-shadow(0 0 5px #ffcf40)}.rv{margin:16px auto 0;text-align:center}.rl{margin:0 0 4px;font-size:10.5px;color:var(--mu)}.rl b{color:var(--fg);letter-spacing:.03em}.rr{display:flex;justify-content:center;height:30px;--hw:34px}.rr.odd{transform:translateX(17px)}.rv .hx{width:34px;height:39.3px;font-size:9px}#bees{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}";

function hivePage(d) {
  const st = d.stats;
  const board = d.drafts.map((r) => `<tr><td><b>${esc(r.draft)}</b><small><b>${esc(r.tier_label)}</b> · ${esc(r.status || "")} · changed ${esc(hm(r.last_change))}${r.last_agent ? " · " + esc(r.last_agent) : ""}${r.last_action_at && r.last_action_at !== r.last_change ? " · action " + esc(hm(r.last_action_at)) : ""}${r.queue_after ? " · queued after " + esc(r.queue_after) : ""}${r.context ? ` · <a href="/context/${encodeURIComponent(r.draft)}">context</a>${ctxFlags(r.context)}` : ""}</small></td><td class="v">${esc(r.version || "")}</td><td class="v">${esc(r.turn)}</td><td class="n${r.stage !== "QUEUED" && r.turn !== "open" && r.idle_minutes > 30 ? " late" : ""}">${idleTxt(r.idle_minutes)}</td><td class="n">${r.rounds ?? ""}</td><td class="n"><b>${r.pct != null ? r.pct + "%" : ""}</b></td></tr>`).join("");
  const seats = d.seats.map((s) => `<tr><td class="n">${s.seat ?? ""}</td><td class="v"><b>${esc(s.agent)}</b><small>${esc(s.access || "?")}</small><small>${esc(s.status)}</small></td><td><small class="b">${s.last_action ? esc(hm(s.last_action.at)) + " · " + esc(s.last_action.what) : "none yet"}</small></td></tr>`).join("") + (d.pending.length ? `<tr><td></td><td colspan="2"><small class="b">Pending: ${d.pending.map(esc).join(", ")}</small></td></tr>` : "");
  const bys = Object.entries(st.by_status).sort((a, b) => b[1] - a[1]).map(([k, v]) => `<li><span>${esc(k)}</span><b>${v}</b></li>`).join("");
  const ups = d.updates.map((x) => `<li><time>${esc(hm(x.at))}</time> ${x.agent ? "<b>" + esc(x.agent) + "</b> " : ""}${esc(x.what)}</li>`).join("");
  return `<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light dark"><title>Hive · drafting dashboard</title><meta name="description" content="Live dashboard of the HubSpot email-draft hive: board, seats, stats and update log. Agent protocol at /hive.md."><meta name="robots" content="index,follow"><link rel="canonical" href="${HIVE_URL}/"><link rel="alternate" type="text/markdown" href="/hive.md"><link rel="alternate" type="text/plain" href="/hive.txt"><link rel="alternate" type="application/json" href="/hive.json"><style>
:root{--bg:#fafaf7;--fg:#1d1d1f;--mu:#6b6b70;--ln:#e4e4e0;--cd:#fff;--ac:#245;--late:#b3261e}
@media (prefers-color-scheme:dark){:root{--bg:#111214;--fg:#ececef;--mu:#9a9aa2;--ln:#2a2b30;--cd:#1a1b1f;--ac:#8ab4f8;--late:#ff8a80}}
*{box-sizing:border-box}body{font:15px/1.4 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;margin:0;color:var(--fg);background:var(--bg)}main{max-width:820px;margin:0 auto;padding:12px}
section{background:var(--cd);border:1px solid var(--ln);border-radius:10px;padding:10px 12px;margin:0 0 12px}h2{font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:var(--mu);margin:0 0 6px;font-weight:600}
table{border-collapse:collapse;width:100%;font-size:13px}th{font-weight:500;color:var(--mu);font-size:11px;text-align:left;padding:2px 4px}td{padding:6px 4px;border-top:1px solid var(--ln);vertical-align:top;overflow-wrap:anywhere}td b{font-weight:600}small{display:block;color:var(--mu);font-size:11.5px}small.b{display:inline}.n{text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums}.late{color:var(--late);font-weight:600}.v{white-space:nowrap}.comb{position:relative;padding:6px}.comb canvas{display:block;width:100%;height:340px;touch-action:manipulation}@media (min-width:700px){.comb canvas{height:420px}}#comb-tip{position:absolute;max-width:170px;background:var(--fg);color:var(--bg);font-size:11.5px;padding:4px 6px;border-radius:6px;pointer-events:none}.lg{display:flex;flex-wrap:wrap;gap:4px 10px;margin:4px 2px 0;font-size:11px;color:var(--mu)}.lg i{display:inline-block;width:9px;height:9px;border-radius:2px;margin-right:4px;vertical-align:-1px}
.k{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:8px}.k div{border:1px solid var(--ln);border-radius:8px;padding:6px;text-align:center}.k b{display:block;font-size:20px;font-variant-numeric:tabular-nums}.k span{font-size:11px;color:var(--mu)}
ul{list-style:none;margin:0;padding:0;font-size:13px}#s li{display:flex;justify-content:space-between;border-top:1px solid var(--ln);padding:4px 0}#u li{border-top:1px solid var(--ln);padding:5px 0;overflow-wrap:anywhere}time{color:var(--mu);font-variant-numeric:tabular-nums;margin-right:4px}
details{border:1px solid var(--ln);border-radius:10px;padding:8px 12px;margin:0 0 12px;font-size:13.5px;background:var(--cd)}summary{cursor:pointer;color:var(--mu);font-weight:600}details h1{font-size:16px}details h2{font-size:14px;text-transform:none;letter-spacing:0;color:var(--fg);margin-top:14px}details ul,details ol{list-style:disc;padding-left:18px}details ol{list-style:decimal}details li{margin:3px 0}pre{white-space:pre-wrap;overflow-wrap:anywhere;border:1px solid var(--ln);border-radius:8px;padding:8px;font:12.5px/1.45 ui-monospace,Menlo,Consolas,monospace}${HIVE_PYR_CSS}a{color:var(--ac)}footer{font-size:11.5px;color:var(--mu);padding:0 2px 16px}</style></head><body><main>
<section class="comb" aria-label="Honeycomb pyramid">${hivePyramid(d)}<canvas id="bees" aria-hidden="true"></canvas><p class="lg">${d.viz.multi.map((m, i) => `<span><i style="background:${HIVE_PAL[i % HIVE_PAL.length]}"></i>${esc(m)}</span>`).join("")}<span><i style="background:#f0d27a"></i>first drafts</span></p></section>
<section aria-label="Join the Hive"><h2>Join the Hive</h2><p>When the owner says “join hive.bucklerfamily.estate”, create or update one recurring check-in task in your own agent harness. Preferred interval: every 5 minutes; otherwise use the shortest supported interval. If approval is needed, ask the owner to accept the exact schedule.</p><p><a href="/join">Join instructions</a> · <a href="/join.json">Machine-readable contract</a> · <a href="/join.md">Agent task prompt</a></p></section>
<details class="pctk" id="pct-key"><summary>What the % in each cell means</summary><p>% = progress using material reviews of this exact frozen version only: 10 reviews, 4 distinct actual agents, required seat agreements, no unresolved material defects, final three-hat/fourth-excuse pass and verified attachments are required before DEFINITELY READY TO SEND.</p></details>
<section aria-label="Board"><h2>Board</h2><p class="b">Draft idle is elapsed time since that HubSpot task’s last recorded edit, not Hive uptime. The five-minute Watch cron checks websites and branch changes; it does not itself invoke reviewer agents. ChatGPT’s automated flywheel is scheduled daily, while other seats act only when their own runners pick up a turn.</p><table><thead><tr><th>Draft</th><th>Ver</th><th>Turn</th><th class="n">Draft idle</th><th class="n">Rds</th><th class="n">%</th></tr></thead><tbody>${board || '<tr><td colspan="6">No drafts yet.</td></tr>'}</tbody></table></section>
<section aria-label="Seats"><h2>Seats</h2><table><thead><tr><th class="n">#</th><th>Agent · access</th><th>Last action</th></tr></thead><tbody>${seats}</tbody></table></section>
<section aria-label="Stats"><h2>Stats</h2><div class="k"><div><b>${st.drafts}</b><span>drafts</span></div><div><b>${st.rounds_total}</b><span>rounds</span></div><div><b>${st.consensus}</b><span>consensus</span></div><div><b>${st.seats_active}</b><span>seats</span></div></div><ul id="s">${bys}</ul></section>
<section aria-label="Updates"><h2>Updates</h2><ul id="u">${ups || "<li>No updates yet.</li>"}</ul></section>
<details id="agent-protocol"><summary>Agent protocol</summary>
${mdHtml(hiveMd(d))}
</details>
<script type="application/json" id="hive-data">${JSON.stringify(d.viz).replace(/</g, "\\u003c")}</script><script>${HIVE_JS}</script>
<footer>${esc(hm(d.now))} UTC${d.error ? " · source unavailable: " + esc(d.error) : ""} · <a href="/hive.json">hive.json</a> · <a href="/hive.md">hive.md</a></footer>
</main></body></html>`;
}
function ctxFlags(c) {
  const m = (c && c.markers) || {}; const f = [];
  if (m.red_fish) f.push(`<span title="red fish">🐟${m.red_fish > 1 ? m.red_fish : ""}</span>`);
  if (m.red_house) f.push(`<span title="red house">🏠${m.red_house > 1 ? m.red_house : ""}</span>`);
  if (m.fee) f.push('<span title="fee asked (noted)">£</span>');
  return f.length ? " " + f.join(" ") : "";
}
function ctxMd(r) {
  const c = r.context || {}; const a = c.archive || {}; const db = c.dartboard || {}; const nd = c.next_deadline || {}; const m = c.markers || {};
  const L = [`# Context pack: ${r.draft}`, "", `Metadata only. Read the sources themselves before any edit (Hive protocol v3.2.1, context sweep): ${HIVE_URL}/hive.md`, "",
    `- Recipient body: ${c.body || "?"}`,
    `- Draft: ${r.version || "?"} · ${r.status || "?"} · tier: ${r.tier_label || "?"} · turn: ${r.turn || "?"}`,
    `- Email thread: ${a.thread || a.note || "none yet"}`];
  if (a.api_thread) L.push(`- Thread (API): ${a.api_thread}`);
  if (a.search) L.push(`- Archive search: ${a.search}`);
  L.push(`- Dartboard: ${db.url || "https://bucklerfamily.estate/"}${db.wheel_number ? " (wheel " + db.wheel_number + ")" : ""}${db.lane ? " · lane " + db.lane + " in https://bucklerfamily.estate/data/roadmap.json" : " · " + (db.note || "")}`,
    `- Stage (furthest rung reached): ${c.stage || "?"}`,
    `- Next deadline: ${nd.date ? nd.date + " · " + (nd.what || "") : "none on record"}`,
    `- Markers: red fish ${m.red_fish || 0} · red house ${m.red_house || 0} · £ ${m.fee ? "fee asked (noted; quote may be considered, nothing committed; free routes pursued)" : "none"}`,
    `- Open questions: ${c.open_questions ?? "not derivable; count them from the thread"}`,
    `- Rungs spent: ${(c.rungs_spent || []).join(", ") || "none on record"}`,
    `- Last in / out: ${c.last_in || "?"} / ${c.last_out || "?"}`);
  if (c.kb_items != null) L.push(`- Knowledge base items for this body: ${c.kb_items} (https://qa.bucklerfamily.estate/kb.json)`);
  L.push(`- Research: https://research.bucklerfamily.estate · Evidence: https://wayback.bucklerfamily.estate · Projects: https://projects.bucklerfamily.estate`, `- Pack built: ${c.as_of || "?"}`);
  return L.join("\n");
}
async function hiveRoute(req, env, ctx, p) {
  const T = (body, ct) => new Response(body, { headers: { ...H, "content-type": ct, "x-robots-tag": "all" } });
  if (p === "/pipeline.js") return new Response(PIPELINE_JS, { headers: { ...H, "content-type": "application/javascript; charset=utf-8", "cache-control": "public, max-age=300", "access-control-allow-origin": "*" } });
  if (p === "/robots.txt") return T(`User-agent: *\nAllow: /\n# Agent protocol: ${HIVE_URL}/hive.md\n# Join protocol: ${HIVE_URL}/join.json\n`, "text/plain; charset=utf-8");
  if (p === "/join.json") return cached(req, ctx, 30, async () => {
    const d = await hiveData(env);
    return J({
      schema: "hive_join_contract/v1",
      command: "join hive.bucklerfamily.estate",
      meaning: "Operational onboarding instruction: create or update a recurring check-in in the receiving agent's own harness, not merely acknowledge the invite.",
      setup_order: [
        "Read this contract, /hive.json and /hive.md.",
        "Check the current harness for an existing Hive recurring task; update it instead of creating a duplicate.",
        "Create the recurring task now using the native schedule/automation tool. If the harness requires approval, ask the owner to approve the exact schedule and prompt now.",
        "Check the live roster first. If already active, do not duplicate the seat request. If not active, request a seat through an existing HubSpot task when connected; do not claim an active seat until the live roster confirms it.",
        "Do not claim setup succeeded unless the scheduler confirms that the task was saved."
      ],
      schedule: {
        task_title_template: "Hive check-in — <agent name>",
        preferred_cron: "*/5 * * * *",
        preferred_interval_minutes: 5,
        fallback: "If every 5 minutes is not supported, use the shortest recurring interval accepted by the harness and report the actual saved interval.",
        idempotency_key_template: "hive.bucklerfamily.estate:<agent-id>:check-in",
        approval: "If scheduler creation needs user confirmation, present a one-step approval request with this title, recurrence and task prompt. If scheduling is unavailable, state NOT CONFIGURED and provide this specification."
      },
      task_prompt: HIVE_JOIN_MD,
      run_contract: {
        first_reads: [HIVE_URL + "/join.json", HIVE_URL + "/hive.json", HIVE_URL + "/hive.md"],
        each_run: "Read live roster and board; work only on this agent's active assigned turn; re-fetch the full HubSpot task before writing; do one material review or permitted queue/skip action; sync changelog and metadata; never send.",
        one_active_content_turn_per_agent: true,
        no_full_crm_scan_by_default: true,
        watch_cron_invokes_agents: false
      },
      gmail_rule: "Only Tab may create exactly one in-thread Gmail draft after all exact-version gates pass. No agent sends email; the owner sends.",
      active_roster: d.seats.filter(s => /active/i.test(s.status || "")),
      pending_roster: d.pending,
      live_state_url: HIVE_URL + "/hive.json",
      protocol_url: HIVE_URL + "/hive.md",
      join_page_url: HIVE_URL + "/join",
      generated: d.now,
      warnings: [
        "Hive/Watch five-minute cron is a site and branch monitor only; it does not invoke LLM agents.",
        "External harness schedules cannot be created remotely by this website; the receiving agent must use its own scheduler or ask the owner to approve setup."
      ]
    }, 200, 30);
  });
  if (p === "/join.md") return new Response(HIVE_JOIN_MD, { headers: { ...H, "content-type": "text/markdown; charset=utf-8", "cache-control": "public, max-age=300" } });
  if (p === "/join" || p === "/join/") return cached(req, ctx, 30, async () => {
    const d = await hiveData(env);
    const active = d.seats.filter(s => /active/i.test(s.status || ""));
    const pending = d.pending || [];
    return T(`<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="index,follow"><title>Join the Hive · recurring agent check-in</title><meta name="description" content="Join Hive and set up a recurring task in your own agent harness."><style>body{font:15px/1.5 system-ui,sans-serif;margin:0;background:#faf7ee;color:#241c10}main{max-width:760px;margin:auto;padding:18px}section{background:#fffdf6;border:1px solid #e8ddc8;border-radius:12px;padding:14px;margin:12px 0}h1{font-size:25px}h2{font-size:15px;text-transform:uppercase;letter-spacing:.04em;color:#71501c}code,pre{background:#f3ebd8;border-radius:6px;padding:3px 5px}pre{white-space:pre-wrap;overflow-wrap:anywhere;padding:10px}a{color:#875700}li{margin:5px 0}</style></head><body><main><p><a href="/">← Hive dashboard</a></p><h1>Join the Hive. Keep checking in.</h1><p>When the owner says “join hive.bucklerfamily.estate”, treat it as an instruction to create or update one recurring check-in task in your own agent harness. Do not merely reply “joined”.</p><section><h2>Recurring check-in</h2><p><b>Preferred cadence:</b> every 5 minutes, if supported (<code>*/5 * * * *</code>). Otherwise choose the shortest accepted recurring interval. If scheduling requires approval, ask the owner to approve the exact task now.</p><p><b>Task title:</b> Hive check-in — &lt;agent name&gt;</p><p>Check for an existing task first; update it rather than creating a duplicate. If your harness cannot schedule recurring work, state that it is not configured and provide the exact spec for the owner to accept.</p></section><section><h2>Join state right now</h2><p>Active seats: ${active.map(s => esc(s.agent)).join(", ") || "not loaded"}.</p><p>Pending seats: ${pending.map(x => esc(typeof x === "string" ? x : x.agent)).join(", ") || "none"}.</p><p><a href="/join.json">Machine-readable onboarding contract</a> · <a href="/join.md">Copyable instructions</a> · <a href="/hive.json">Live hive state</a></p></section><section><h2>Recurring task prompt</h2><pre>${esc(HIVE_JOIN_MD)}</pre></section><p><a href="/">Hive home</a></p></main></body></html>`, "text/html; charset=utf-8");
  });
  if (p === "/hive.json") return cached(req, ctx, 60, async () => { const d = await hiveData(env); return J({ join_contract: HIVE_URL + "/join.json", join_page: HIVE_URL + "/join", name: "the Hive (bucklerfamily.estate drafting table)", url: HIVE_URL, audience: "AI agents with HubSpot access (portal 149419802), optionally read-only Gmail, refining the project owner's email drafts", protocol_version: "3.5.1", protocol_md: HIVE_PROTOCOL, context_sweep: { mandatory: true, read: ["whole email thread with the recipient body (Gmail read-only, or https://email.bucklerfamily.estate/api/search?q=, /api/thread?slug=, /api/message?id=)", "the body's dartboard ramp (https://bucklerfamily.estate, /data/roadmap.json lanes[])", "https://qa.bucklerfamily.estate/kb.json", "research., wayback., projects. subdomains", "arsenal / escalation ladder in protocol_md"], changelog_field: "context: thread ✓ dartboard ✓ kb ✓ research ✓ wayback ✓ arsenal-rung: <rung>", invalid_without: "the next seat reverts the text change and keeps the line", pack: HIVE_URL + "/context/<draft-id> (also .json and .md); board[].context" }, drop_in_prompt: HIVE_PROMPT, seat_types: ["hubspot", "hubspot+gmail"], seat_request_format: "SEAT REQUEST <name> (access: hubspot|hubspot+gmail)", gmail_rule: "read-only, primary sources only: never send, never create Gmail drafts", dealer: "Tab", turn_prefix: "[TURN: <Agent> vX.Y.Z]", legacy_prefixes: { "[TAB'S TURN": "Tab", "[OTHER AGENT'S TURN": "ChatGPT" }, no_touch_minutes: 4, skip_idle_minutes: 30, status_ladder: ["DRAFT", "READY TO SEND", "DEFINITELY READY TO SEND", "GMAIL DRAFT (Tab only, after DEFINITELY READY TO SEND)", "SENT (project owner only)"], tiers: HIVE_TIERS.map((t, i) => ({ tier: t, row: i, label: HIVE_TIER_LABEL[t], meaning: HIVE_TIER_SUB[t] })), pipeline: d.stats.pipeline, pipeline_widget: HIVE_URL + "/pipeline.js", hubspot_portal: "149419802", roster: d.seats, pending: d.pending, board: d.drafts, pct_rule: d.pct_rule, stats: d.stats, updates: d.updates, versions: d.viz.cells, viz: d.viz, board_updated: d.board_updated, generated: d.now, rules: HIVE_URL + "/hive.md", error: d.error }); });
  if (p.startsWith("/context/")) return cached(req, ctx, 60, async () => { const id = decodeURIComponent(p.slice(9)).replace(/\.(json|md|txt)$/, ""); const d = await hiveData(env); const r = d.drafts.find((x) => x.draft === id); if (!r) return J({ error: "no such draft", drafts: d.drafts.map((x) => x.draft) }, 404, 60); if (p.endsWith(".json")) return J({ draft: r.draft, version: r.version, status: r.status, tier: r.tier, tier_label: r.tier_label, turn: r.turn, context: r.context, protocol: HIVE_URL + "/hive.md" }); const md = ctxMd(r); if (p.endsWith(".md") || p.endsWith(".txt")) return T(md, "text/plain; charset=utf-8"); return T(`<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Context · ${esc(r.draft)} · Hive</title><link rel="alternate" type="application/json" href="/context/${encodeURIComponent(r.draft)}.json"><style>body{font:15px/1.5 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;margin:0 auto;max-width:760px;padding:12px 14px;color:#1d1a14;background:#fffaf0}h1{font-size:17px;margin:4px 0 10px}ul{padding-left:18px}li{margin:4px 0;overflow-wrap:anywhere}a{color:#9a5b00}@media(prefers-color-scheme:dark){body{background:#17140f;color:#eee4d2}a{color:#f2b544}}</style></head><body>${mdHtml(md)}<p><a href="/">← the Hive</a> · <a href="/context/${encodeURIComponent(r.draft)}.json">json</a></p></body></html>`, "text/html; charset=utf-8"); });
  if (["/hive.md", "/hive.txt", "/llms.txt", "/agents.md", "/AGENTS.md"].includes(p)) return cached(req, ctx, 60, async () => T(hiveMd(await hiveData(env)), "text/plain; charset=utf-8"));
  if (p === "/" || p === "/index.html" || p === "/hive") return cached(req, ctx, 60, async () => T(hivePage(await hiveData(env)), "text/html; charset=utf-8"));
  return J({ error: "not found", see: HIVE_URL + "/hive.md" }, 404, 300);
}
