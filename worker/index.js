// watch.bucklerfamily.estate — change monitor for every *.bucklerfamily.estate site (Sion's Tab agent, 23 Oct 2026).
// Cron (every 5 min) checks one shard of the sites (each site about every 30 min): HTTP status, latency, a hash of the
// page with volatile bits stripped, the visible-text diff when it changes, and the git branch heads of the repos that
// build the sites (git smart-HTTP refs, one request per repo; commit author/message from the branch's public Atom feed).
// Storage: Workers KV only (one state write per run; change log and text snapshots only on change). No D1.
// Read: /status.json · /changes.json?since= · /feed.xml · /sites.json · MCP (JSON-RPC) at /mcp · /.well-known/mcp.json · /agent/webmcp.js
import SEEDTXT from "./seed.txt";
const SEED = JSON.parse(SEEDTXT);
const VER = "1.0.0";
const PERIOD_MIN = 5;          // cron interval
const PER_RUN = 14;            // sites per run (free plan: 50 subrequests per invocation)
const MAX_CHANGES = 800;
const MAX_ADDED = 60;
const KV_WRITE_CAP = 850;      // free plan: 1,000 KV writes/day; keep headroom
const UA = "ghf-watch/1.0 (+https://watch.bucklerfamily.estate/; change monitor)";
const ALLOW_HOST = /(^|\.)bucklerfamily\.estate$|^greathousefarmwiki\.wordpress\.com$|\.sites\.tab\.bot$|\.pages\.dev$/;

const AGENTS_MD = "# FLYWHEEL.md \u2014 rules for any agent improving the bucklerfamily.estate sites\n\nThe repos that build these sites (GitHub unclehowell/datro, every branch, and unclehowell/BucklerFamilyFarm) are polished in turns, like rocks in a tumbler: one agent improves, the next responds to that change, and so on. watch.bucklerfamily.estate watches every branch and every live site and tells each side when it is their turn. No signup, no key.\n\n## 1. Before you start\n- Read the recent changes: GET https://watch.bucklerfamily.estate/changes.json?since=<your last visit> (or MCP tool get_changes). Each commit entry names the agent, the files touched and whose turn it now is.\n- Read the baton for your branch: GET https://watch.bucklerfamily.estate/baton.json?branch=<branch> (MCP get_baton). \"turn\" is \"tab\" or \"other\".\n- Claim it: POST https://watch.bucklerfamily.estate/api/claim_baton {\"branch\":\"<branch>\",\"agent\":\"<your name>\"} (MCP claim_baton). A claim lasts 2 hours, is renewed by each of your commits, and cannot be taken while another agent's claim is live.\n\n## 2. While you work\n- Improve only in response to the last changes and the \"next\" note left by the other side. Small, reviewable commits; one idea per commit.\n- Sign every commit with a trailer line:  Agent: <your name>   (the owner's Tab agent uses its own house signature). Unsigned commits count as \"other\".\n- Never force-push. Fetch and rebase first. Never revert another agent's work without saying why in the commit message.\n- House rules for public pages: no in-body titles, no crest; `<script src=\"https://bucklerfamily.estate/ghf-lang/ghf-boot.js?v=2.1.2\"></script>` is the last line of `<head>`; footer is only the \u00a9 line and the licence link; no disclaimers; do not name the family member who runs the case; avoid the house list of reporting and accusation words. Name institutions and roles, not private people. Check any text first: POST /api/check_text {\"text\": \"\u2026\"} (MCP check_text) lists every problem it finds.\n\n## 3. When you finish\n- Pass the baton: POST https://watch.bucklerfamily.estate/api/release_baton {\"branch\":\"<branch>\",\"agent\":\"<your name>\",\"note\":\"what I changed\",\"next\":\"what the other side should look at\"} (MCP release_baton). The turn goes to the other side.\n- A commit made without a claim passes the baton automatically: after your commit lands, the watcher hands the turn to the other side (within about 5 minutes).\n- Optional: POST /api/log_update {\"site\",\"agent\",\"summary\",\"commit\"} to annotate a live-site change.\n\n## Endpoints\nMCP (streamable HTTP, JSON-RPC 2.0): https://watch.bucklerfamily.estate/mcp \u00b7 discovery /.well-known/mcp.json \u00b7 WebMCP /agent/webmcp.js\nTools: list_sites, get_status, get_changes(since, site, kind, side, branch), check_now, add_site, log_update, get_baton, claim_baton, release_baton, check_text.\nJSON: /status.json \u00b7 /changes.json \u00b7 /baton.json \u00b7 /sites.json \u00b7 Atom: /feed.xml \u00b7 this file: /agents.md\n";
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
async function branchCommits(repo, branch, fromSha) {
  const r = await fetch(`https://github.com/${repo}/commits/${encodeURIComponent(branch).replace(/%2F/g, "/")}.atom`, { headers: { "user-agent": UA, accept: "application/atom+xml" } });
  if (!r.ok) return [];
  const x = await r.text(); const out = [];
  for (const e of x.split("<entry>").slice(1)) {
    const sha1 = (e.match(/Commit\/([0-9a-f]{40})/) || [])[1]; if (!sha1) continue;
    if (fromSha && sha1 === fromSha) break;
    const msgHtml = (e.match(/<content[^>]*>([\s\S]*?)<\/content>/) || [])[1] || "";
    const msg = msgHtml.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/<[^>]+>/g, "").trim();
    const author = ((e.match(/<author>\s*<name>([\s\S]*?)<\/name>/) || [])[1] || "").trim();
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

async function cron(env, ctx, sched) {
  const { state: st, added } = await loadAll(env);
  const changes = []; const tStart = Date.now();
  st.run = (st.run || 0) + 1;
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
<details><summary>For agents</summary><p>No signup or key. MCP (streamable HTTP): <code>${origin}/mcp</code> · discovery <a href="/.well-known/mcp.json">/.well-known/mcp.json</a> · WebMCP <a href="/agent/webmcp.js">/agent/webmcp.js</a>. Tools: list_sites, get_changes(since), get_status, add_site(url), log_update(site, agent, summary), check_now(site), get_baton(branch), claim_baton(branch, agent), release_baton(branch, agent, note, next). Turn-taking rules: <a href="/agents.md">/agents.md</a> · <a href="/baton.json">/baton.json</a>.</p><p>Plain HTTP: <a href="/status.json">/status.json</a> · <a href="/changes.json">/changes.json?since=</a> · <a href="/feed.xml">/feed.xml</a> · <a href="/sites.json">/sites.json</a>.</p></details></main>
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
    if (p === "/mcp") { if (req.method === "POST") return mcp(env, req, ip); return J({ info: "MCP streamable HTTP endpoint: POST JSON-RPC 2.0 here (initialize, tools/list, tools/call). Discovery: /.well-known/mcp.json" }, 200, 300); }
    if (p === "/.well-known/mcp.json" || p === "/.well-known/webmcp.json" || p === "/agent/tools.json") return J(manifest(origin), 200, 300);
    if (p === "/agent/webmcp.js") return new Response(WEBMCP, { headers: { ...H, "content-type": "application/javascript; charset=utf-8", "cache-control": "public, max-age=900" } });
    if (p === "/robots.txt") return new Response("User-agent: *\nAllow: /\n# Agents: " + origin + "/.well-known/mcp.json\n", { headers: { ...H, "content-type": "text/plain" } });
    if (p === "/llms.txt") return new Response(`# bucklerfamily.estate change monitor\n\nUp/down and content-change monitor for every *.bucklerfamily.estate site; each change carries the git commit and agent behind it when known.\n\n- MCP (streamable HTTP, no key): ${origin}/mcp — tools: list_sites, get_changes(since), get_status, add_site(url), log_update(site, agent, summary), check_now(site), get_baton, claim_baton, release_baton\n- Discovery: ${origin}/.well-known/mcp.json · WebMCP: ${origin}/agent/webmcp.js\n- JSON: ${origin}/status.json · ${origin}/changes.json?since=<ISO time or n> · ${origin}/sites.json · Atom: ${origin}/feed.xml\n- Improvement flywheel (turn-taking baton): rules ${origin}/agents.md · get_baton(branch), claim_baton(branch, agent), release_baton(branch, agent, note, next) · ${origin}/baton.json\n- Agents: read get_changes(since) and get_baton before editing; sign commits "Agent: <name>"; pass the baton when done.\n`, { headers: { ...H, "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=900" } });
    const q = Object.fromEntries(u.searchParams);
    if (p === "/status.json") return cached(req, ctx, 60, async () => J(await callTool(env, "get_status", q, ip)));
    if (p === "/sites.json") return cached(req, ctx, 60, async () => J(await callTool(env, "list_sites", q, ip)));
    if (p === "/changes.json") return cached(req, ctx, 60, async () => J(await callTool(env, "get_changes", q, ip)));
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
