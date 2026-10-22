const VERSION = "1.0.0";
const STORES = {
  projects: ["projects", "indexes/projects.json"],
  assets: ["assets", "indexes/assets.json"],
  workPackages: ["work-packages", "indexes/work-packages.json"],
  riskIssues: ["risk-issues", "indexes/risk-issues.json"],
  evidence: ["evidence", "indexes/evidence.json"],
  relationships: ["relationships", "indexes/relationships.json"],
  sopNodes: ["sop-nodes", "indexes/sop-nodes.json"],
  artifacts: ["artifact-metadata", "indexes/artifacts.json"]
};
const SEED = "meta/bootstrap-v1.json";
function reply(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data), { status, headers: Object.assign({
    "content-type": "application/json; charset=utf-8", "cache-control": "no-store, max-age=0",
    "x-content-type-options": "nosniff", "referrer-policy": "no-referrer"
  }, extra) });
}
function same(a, b) {
  if (!a || !b) return false;
  let d = a.length ^ b.length, n = Math.max(a.length, b.length);
  for (let i = 0; i < n; i++) d |= (a.charCodeAt(i % a.length) || 0) ^ (b.charCodeAt(i % b.length) || 0);
  return d === 0;
}
function auth(req, env) {
  const m = (req.headers.get("authorization") || "").match(/^Bearer\s+(.+)$/i);
  return !!(m && env.PROJECTS_API_TOKEN && same(m[1].trim(), env.PROJECTS_API_TOKEN));
}
function safeId(s) { return String(s || "").trim().replace(/[^A-Za-z0-9._-]/g, "-").replace(/-+/g, "-").slice(0, 120); }
function slug(s) { return String(s || "").toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 100); }
function now() { return new Date().toISOString(); }
async function getJ(env, key) {
  const o = await env.PROJECTS.get(key);
  if (!o) return null;
  try { return await o.json(); } catch (_) { return null; }
}
async function putJ(env, key, value) {
  await env.PROJECTS.put(key, JSON.stringify(value), { httpMetadata: { contentType: "application/json; charset=utf-8" } });
}
async function list(env, kind) {
  const cfg = STORES[kind]; if (!cfg) throw new Error("Unknown store: " + kind);
  const idx = await getJ(env, cfg[1]); return Array.isArray(idx) ? idx : [];
}
async function audit(env, actor, action, type, id, before, after) {
  const stamp = now(), uid = crypto.randomUUID();
  await putJ(env, "audit/" + stamp.replace(/[:.]/g, "-") + "_" + uid + ".json", {
    id: uid, actor: String(actor || "mcp-agent").slice(0, 120), action, entityType: type,
    entityId: id, before: before || null, after: after || null, createdAt: stamp
  });
}
async function upsert(env, kind, input, actor) {
  const cfg = STORES[kind]; if (!cfg) throw new Error("Unsupported record type");
  const d = Object.assign({}, input || {});
  if (kind === "projects") { if (!d.name && !d.slug) throw new Error("Project name or slug required"); d.slug = slug(d.slug || d.name); d.name = String(d.name || d.slug).slice(0, 240); d.id = safeId(d.id || d.slug); }
  if (kind === "assets") { if (!d.name) throw new Error("Asset name required"); d.id = safeId(d.id || d.id === "0" ? d.id : d.name); }
  if (kind === "workPackages" || kind === "riskIssues" || kind === "evidence") {
    if (!d.title) throw new Error("Title required");
    d.id = safeId(d.id || slug(d.title) + "-" + crypto.randomUUID().slice(0, 8));
  }
  if (kind === "riskIssues" && d.kind && !["risk", "issue"].includes(d.kind)) throw new Error("kind must be risk or issue");
  if (kind === "sopNodes" && !d.id) throw new Error("SOP node id required");
  if (kind === "relationships") {
    if (!d.fromType || !d.fromId || !d.relationship || !d.toType || !d.toId) throw new Error("fromType, fromId, relationship, toType and toId required");
    d.id = safeId(d.id || slug(d.fromType + "-" + d.fromId + "-" + d.relationship + "-" + d.toType + "-" + d.toId));
  }
  if (kind === "artifacts" && !d.id) throw new Error("Artifact id required");
  const id = d.id;
  const before = await getJ(env, cfg[0] + "/" + id + ".json");
  const records = await list(env, kind);
  const item = Object.assign({}, before || {}, d, { id, createdAt: before?.createdAt || d.createdAt || now(), updatedAt: now(), updatedBy: String(actor || "mcp-agent").slice(0, 120) });
  const i = records.findIndex(x => x.id === id); if (i < 0) records.push(item); else records[i] = item;
  await putJ(env, cfg[0] + "/" + id + ".json", item);
  await putJ(env, cfg[1], records);
  await audit(env, actor, before ? "update" : "create", kind, id, before, item);
  return item;
}
function terms(q) { return String(q || "").toLowerCase().split(/[^a-z0-9]+/).filter(x => x.length > 2).slice(0, 15); }
function body(r) { return Object.values(r || {}).map(v => typeof v === "string" ? v : (v && typeof v === "object" ? JSON.stringify(v) : "")).join(" ").toLowerCase(); }
function ranked(items, q) {
  const ts = terms(q);
  return items.map(r => ({ record: r, score: ts.reduce((n, t) => n + (body(r).includes(t) ? (String(r.name || r.title || r.label || "").toLowerCase().includes(t) ? 3 : 1) : 0), 0) }))
    .filter(x => x.score > 0).sort((a, b) => b.score - a.score).map(x => x);
}
function filtered(items, a) {
  let out = items;
  for (const k of ["status", "kind", "projectId", "group"]) if (a[k]) out = out.filter(x => String(x[k] || "").toLowerCase().includes(String(a[k]).toLowerCase()));
  if (a.query) out = ranked(out, a.query).map(x => x.record);
  return out.slice(0, Math.max(1, Math.min(Number(a.limit) || 100, 200)));
}
async function seed(env) {
  if (await getJ(env, SEED)) return;
  const urls = [
    "https://raw.githubusercontent.com/unclehowell/datro/projects/projects/public/estate/asset-register.json",
    "https://raw.githubusercontent.com/unclehowell/datro/projects/projects/public/data/sop-branches.json"
  ];
  const res = await Promise.all(urls.map(u => fetch(u)));
  if (res.some(r => !r.ok)) throw new Error("Could not fetch the published project registers");
  const [ar, sop] = await Promise.all(res.map(r => r.json()));
  if (!Array.isArray(ar.items) || !Array.isArray(sop.nodes) || !Array.isArray(sop.edges)) throw new Error("Unexpected source-register schema");
  const t = now();
  const projects = [
    { id: "parcel-a", slug: "parcel-a", name: "Parcel A (Phase 1)", status: "active", stage: "S0", nextGate: "2026-12-18", summary: "Recovery and independent assessment of Great House Farm / Tŷ Mawr records. Published baseline says Executive acceptance is not recorded.", publicUrl: "https://projects.bucklerfamily.estate/", sourcePath: "projects/public/index.html" },
    { id: "digital-estate", slug: "digital-estate", name: "Digital estate", status: "active", stage: "S1 — independence and consolidation", summary: "Resilient, independent and documented Buckler family digital estate.", publicUrl: "https://projects.bucklerfamily.estate/estate/pid/", sourcePath: "projects/public/estate/asset-register.json" },
    { id: "cedwyn-estate", slug: "cedwyn-estate", name: "Cedwyn Estate (Phase 2)", status: "proposed", stage: "Brief", summary: "The published project index describes this project as having a brief but not yet being initiated.", publicUrl: "https://projects.bucklerfamily.estate/cedwyn-estate/", sourcePath: "projects/public/index.html" },
    { id: "evidence-recovery", slug: "evidence-recovery", name: "Great House Farm evidence recovery", status: "active", stage: "S0", summary: "Evidence-recovery workstream. Preserve source, inference, interpretation and unresolved allegations as distinct fields.", publicUrl: "https://projects.bucklerfamily.estate/workstreams/evidence-recovery/", sourcePath: "projects/README.md" },
    { id: "case-reopening", slug: "case-reopening", name: "Reopening-route assessment", status: "standby", stage: "trigger-led", summary: "The published trigger-event SOP is on standby pending a verified trigger; the import does not confirm one.", publicUrl: "https://projects.bucklerfamily.estate/side-project-reopen/", sourcePath: "projects/public/data/sop-branches.json" }
  ];
  const assets = ar.items.map(x => Object.assign({}, x, { projectId: "digital-estate", sourceRegister: ar.title, sourcePath: "projects/public/estate/asset-register.json", sourceChecked: ar.checked, provenance: { repo: "unclehowell/datro", ref: "projects", path: "projects/public/estate/asset-register.json" } }));
  const sopNodes = sop.nodes.map(x => Object.assign({}, x, { projectId: "case-reopening", sourceRegister: sop.title, sourcePath: "projects/public/data/sop-branches.json", provenance: { repo: "unclehowell/datro", ref: "projects", path: "projects/public/data/sop-branches.json", generated: sop.generated } }));
  const relationships = [];
  for (const p of projects) relationships.push({ id: "rel-project-" + p.id, fromType: "project", fromId: "digital-estate", relationship: "tracks-project", toType: "project", toId: p.id, provenance: "Published project office map" });
  for (const a of assets) relationships.push({ id: "rel-asset-" + a.id, fromType: "project", fromId: "digital-estate", relationship: "tracks-asset", toType: "asset", toId: a.id, label: a.group || "Configuration item", provenance: "Published asset register" });
  for (const e of sop.edges) relationships.push({ id: "rel-sop-" + slug(e.from + "-" + e.label + "-" + e.to), fromType: "sopNode", fromId: e.from, relationship: "sop:" + String(e.label || "links"), toType: "sopNode", toId: e.to, label: e.label, provenance: "Published SOP graph" });
  relationships.push({ id: "rel-evidence-sop", fromType: "project", fromId: "evidence-recovery", relationship: "feeds-review-of", toType: "project", toId: "case-reopening", label: "Navigation relationship, not a legal conclusion", provenance: "Project structure mapping" });
  const initial = { projects, assets, workPackages: [], riskIssues: [], evidence: [], sopNodes, relationships, artifacts: [] };
  for (const [kind, records] of Object.entries(initial)) {
    const cfg = STORES[kind];
    await putJ(env, cfg[1], records);
    for (const r of records) await putJ(env, cfg[0] + "/" + r.id + ".json", Object.assign({}, r, { createdAt: r.createdAt || t, updatedAt: r.updatedAt || t }));
  }
  await audit(env, "bootstrap", "import", "registers", "asset-register+sop-branches", null, { projects: projects.length, assets: assets.length, sopNodes: sopNodes.length, sopEdges: sop.edges.length, sourceRepo: "unclehowell/datro@projects" });
  await putJ(env, SEED, { schema: "projects-data/bootstrap-v1", seededAt: now(), counts: { projects: projects.length, assets: assets.length, sopNodes: sopNodes.length, relationships: relationships.length }, sources: urls });
}
async function neighbors(env, id, type) {
  const edges = await list(env, "relationships");
  const found = edges.filter(e => (e.fromId === id && (!type || e.fromType === type)) || (e.toId === id && (!type || e.toType === type)));
  const mapping = { project: "projects", asset: "assets", workPackage: "workPackages", riskIssue: "riskIssues", evidence: "evidence", sopNode: "sopNodes", artifact: "artifacts" };
  const results = [];
  for (const e of found) {
    const from = e.fromId === id && (!type || e.fromType === type);
    const t = from ? e.toType : e.fromType, nid = from ? e.toId : e.fromId, store = mapping[t];
    const rec = store ? (await list(env, store)).find(x => x.id === nid) : null;
    results.push({ edge: e, node: rec || { id: nid, type: t } });
  }
  return { id, type: type || null, count: results.length, neighbors: results };
}
async function graphSearch(env, query, limit) {
  const all = [];
  for (const type of ["projects", "assets", "workPackages", "riskIssues", "evidence", "sopNodes"]) {
    const rs = await list(env, type);
    for (const x of ranked(rs, query)) all.push({ type, score: x.score, record: x.record });
  }
  all.sort((a, b) => b.score - a.score);
  const matches = all.slice(0, Math.max(1, Math.min(Number(limit) || 15, 50)));
  const ids = new Set(matches.map(x => x.record.id));
  const edges = (await list(env, "relationships")).filter(e => ids.has(e.fromId) || ids.has(e.toId)).slice(0, 100);
  return { query, matches, contextEdges: edges, counts: { candidates: all.length, returned: matches.length, contextEdges: edges.length }, provenanceNote: "Keyword-ranked records plus graph links. Relationships support navigation and context; they do not prove the linked proposition." };
}
async function auditList(env, a) {
  const page = await env.PROJECTS.list({ prefix: "audit/", limit: 1000 });
  const out = [];
  for (const o of page.objects || []) { const x = await getJ(env, o.key); if (x && (!a.entityId || x.entityId === a.entityId)) out.push(x); }
  out.sort((x, y) => String(y.createdAt).localeCompare(String(x.createdAt)));
  return out.slice(0, Math.max(1, Math.min(Number(a.limit) || 25, 100)));
}
async function artifactPut(env, a) {
  const filename = String(a.filename || "artifact.txt").split(/[\\/]/).pop().replace(/[^A-Za-z0-9._ -]/g, "_").slice(0, 140) || "artifact.txt";
  if (a.textContent === undefined && a.contentBase64 === undefined) throw new Error("Supply textContent or contentBase64");
  let bytes;
  if (a.contentBase64 !== undefined) {
    const b64 = String(a.contentBase64);
    if (b64.length > 5600000 || !/^[A-Za-z0-9+/]*={0,2}$/.test(b64)) throw new Error("Invalid or oversized base64");
    const raw = atob(b64); bytes = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  } else bytes = new TextEncoder().encode(String(a.textContent));
  if (bytes.byteLength > 4 * 1024 * 1024) throw new Error("Artefact exceeds 4 MiB");
  const id = crypto.randomUUID(), key = "artifacts/" + id + "/" + filename;
  const hash = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))).map(b => b.toString(16).padStart(2, "0")).join("");
  const contentType = String(a.contentType || (a.textContent !== undefined ? "text/plain; charset=utf-8" : "application/octet-stream")).slice(0, 160);
  await env.PROJECTS.put(key, bytes, { httpMetadata: { contentType } });
  return upsert(env, "artifacts", { id, filename, title: String(a.title || filename).slice(0, 240), projectId: a.projectId || null, objectKey: key, contentType, size: bytes.length, sha256: hash, notes: String(a.notes || "").slice(0, 4000), storage: "private R2" }, a.actor);
}
function base64(bytes) {
  let s = ""; for (let i = 0; i < bytes.length; i += 32768) s += String.fromCharCode.apply(null, bytes.subarray(i, Math.min(i + 32768, bytes.length)));
  return btoa(s);
}
async function artifactGet(env, id) {
  const meta = (await list(env, "artifacts")).find(x => x.id === id);
  if (!meta) return { found: false, id };
  const o = await env.PROJECTS.get(meta.objectKey);
  if (!o) return { found: false, id, error: "Object missing" };
  if (meta.size > 3 * 1024 * 1024) return { found: true, metadata: meta, error: "Too large for inline retrieval" };
  const bytes = new Uint8Array(await o.arrayBuffer());
  if (/^(text\/|application\/(json|xml|javascript))/.test(meta.contentType || "")) return { found: true, metadata: meta, textContent: new TextDecoder().decode(bytes) };
  return { found: true, metadata: meta, contentBase64: base64(bytes) };
}
function filteredFields(query, name) {
  const m = query.match(new RegExp("\\b" + name + "\\s*(?:\\(([^)]*)\\))?\\s*\\{([^{}]*)\\}", "s"));
  if (!m) return null;
  return { args: m[1] || "", fields: Array.from(new Set((m[2].match(/\b[_A-Za-z][_0-9A-Za-z]*\b/g) || []))) };
}
function parseArgs(raw, vars) {
  const a = {}, re = /([_A-Za-z][_0-9A-Za-z]*)\s*:\s*(\$[_A-Za-z][_0-9A-Za-z]*|"[^"]*"|'[^']*'|-?\d+(?:\.\d+)?|true|false|null|[_A-Za-z][_0-9A-Za-z-]*)/g;
  let m;
  while ((m = re.exec(raw))) { const v = m[2]; a[m[1]] = v[0] === "$" ? vars[v.slice(1)] : (v[0] === '"' || v[0] === "'" ? v.slice(1, -1) : v === "true" ? true : v === "false" ? false : v === "null" ? null : /^-?\d/.test(v) ? Number(v) : v); }
  return a;
}
function projection(value, fields) {
  if (Array.isArray(value)) return value.map(x => projection(x, fields));
  if (!value || typeof value !== "object") return value;
  const result = {}; for (const f of fields || []) if (Object.prototype.hasOwnProperty.call(value, f)) result[f] = value[f];
  return result;
}
const TOOLS = [
  ["project_list","List projects", { query:"string", status:"string", limit:"integer" }],
  ["project_get","Get a project by id or slug", { id:"string", slug:"string" }],
  ["project_upsert","Create/update a project; writes are audited", { id:"string", slug:"string", name:"string", status:"string", priority:"string", owner:"string", stage:"string", nextGate:"string", summary:"string", publicUrl:"string", actor:"string" }],
  ["asset_list","Search the imported configuration-item register", { query:"string", group:"string", status:"string", limit:"integer" }],
  ["asset_upsert","Create/update an asset; writes are audited", { id:"string", group:"string", name:"string", url:"string", purpose:"string", platform:"string", repo:"string", owner:"string", status:"string", backup:"string", actor:"string" }],
  ["work_package_list","List work packages", { projectId:"string", status:"string", query:"string", limit:"integer" }],
  ["work_package_upsert","Create/update a work package", { id:"string", projectId:"string", title:"string", description:"string", status:"string", owner:"string", dueDate:"string", priority:"string", dependencies:"array", actor:"string" }],
  ["risk_issue_list","List risk and issue records", { kind:"string", projectId:"string", status:"string", query:"string", limit:"integer" }],
  ["risk_issue_upsert","Create/update a risk or issue", { id:"string", kind:"string", projectId:"string", title:"string", description:"string", status:"string", probability:"string", impact:"string", owner:"string", dueDate:"string", mitigation:"string", actor:"string" }],
  ["evidence_list","List evidence references", { projectId:"string", status:"string", query:"string", limit:"integer" }],
  ["evidence_upsert","Create/update an evidence reference with provenance", { id:"string", projectId:"string", title:"string", sourceUrl:"string", artifactId:"string", sha256:"string", status:"string", confidence:"string", sourceType:"string", notes:"string", actor:"string" }],
  ["sop_node_list","List trigger-event SOP nodes", { kind:"string", status:"string", query:"string", limit:"integer" }],
  ["sop_node_upsert","Update SOP node status/owner/note while keeping the source fields", { id:"string", status:"string", owner:"string", text:"string", outcome:"string", note:"string", actor:"string" }],
  ["relationship_upsert","Create/update an entity relationship with provenance", { id:"string", fromType:"string", fromId:"string", relationship:"string", toType:"string", toId:"string", label:"string", provenance:"string", actor:"string" }],
  ["graph_search","GraphRAG-style keyword retrieval plus connected edges", { query:"string", limit:"integer" }],
  ["graph_neighbors","Find graph relationships for an entity id", { id:"string", type:"string" }],
  ["audit_list","Read recent change audit entries", { limit:"integer", entityId:"string" }],
  ["artifact_put","Store a private file/text artefact in R2; maximum 4 MiB", { filename:"string", title:"string", projectId:"string", contentType:"string", textContent:"string", contentBase64:"string", notes:"string", actor:"string" }],
  ["artifact_get","Retrieve a private artefact by id", { id:"string" }],
  ["artifact_list","List private artefact metadata", { projectId:"string", query:"string", limit:"integer" }]
].map(([name, description, fields]) => ({ name, description, inputSchema: {
  type: "object", properties: Object.fromEntries(Object.entries(fields).map(([k, t]) => [k, t === "array" ? { type:"array", items:{ type:"string" } } : { type:t }] ))
} }));
async function toolCall(env, name, a) {
  const actor = a.actor || "mcp-agent";
  if (name === "project_list") return filtered(await list(env, "projects"), a);
  if (name === "project_get") return (await list(env, "projects")).find(x => x.id === a.id || x.slug === a.slug) || null;
  if (name === "project_upsert") return upsert(env, "projects", a, actor);
  if (name === "asset_list") return filtered(await list(env, "assets"), a);
  if (name === "asset_upsert") return upsert(env, "assets", a, actor);
  if (name === "work_package_list") return filtered(await list(env, "workPackages"), a);
  if (name === "work_package_upsert") return upsert(env, "workPackages", a, actor);
  if (name === "risk_issue_list") return filtered(await list(env, "riskIssues"), a);
  if (name === "risk_issue_upsert") return upsert(env, "riskIssues", a, actor);
  if (name === "evidence_list") return filtered(await list(env, "evidence"), a);
  if (name === "evidence_upsert") return upsert(env, "evidence", a, actor);
  if (name === "sop_node_list") return filtered(await list(env, "sopNodes"), a);
  if (name === "sop_node_upsert") {
    const x = (await list(env, "sopNodes")).find(r => r.id === a.id); if (!x) throw new Error("SOP node not found");
    const changes = {}; for (const k of ["status","owner","text","outcome","note"]) if (a[k] !== undefined) changes[k] = a[k];
    return upsert(env, "sopNodes", Object.assign({}, x, changes), actor);
  }
  if (name === "relationship_upsert") return upsert(env, "relationships", a, actor);
  if (name === "graph_search") return graphSearch(env, a.query, a.limit);
  if (name === "graph_neighbors") return neighbors(env, a.id, a.type);
  if (name === "audit_list") return auditList(env, a);
  if (name === "artifact_put") return artifactPut(env, a);
  if (name === "artifact_get") return artifactGet(env, a.id);
  if (name === "artifact_list") return filtered(await list(env, "artifacts"), a);
  throw new Error("Unknown tool: " + name);
}
async function graphql(req, env) {
  if (req.method !== "POST") return reply({ errors:[{message:"POST JSON query required"}] },405,{allow:"POST"});
  let b; try { b = await req.json(); } catch (_) { return reply({ errors:[{message:"Invalid JSON"}] },400); }
  const q = String(b.query || ""), vars = b.variables || {};
  if (!q) return reply({ errors:[{message:"query required"}] },400);
  const roots = ["projects","project","assets","asset","workPackages","workPackage","riskIssues","evidence","sopNodes","graphNeighbors","search","upsertProject","upsertAsset","upsertWorkPackage","upsertRiskIssue","upsertEvidence","upsertSopNode","upsertRelationship"];
  const data = {};
  try {
    for (const f of roots) {
      const s = filteredFields(q, f); if (!s) continue;
      const a = parseArgs(s.args, vars); let v = null;
      if (f === "projects") v = filtered(await list(env,"projects"),a);
      else if (f === "project") v = (await list(env,"projects")).find(x => x.id === a.id || x.slug === a.slug) || null;
      else if (f === "assets") v = filtered(await list(env,"assets"),a);
      else if (f === "asset") v = (await list(env,"assets")).find(x => x.id === a.id) || null;
      else if (f === "workPackages") v = filtered(await list(env,"workPackages"),a);
      else if (f === "workPackage") v = (await list(env,"workPackages")).find(x => x.id === a.id) || null;
      else if (f === "riskIssues") v = filtered(await list(env,"riskIssues"),a);
      else if (f === "evidence") v = filtered(await list(env,"evidence"),a);
      else if (f === "sopNodes") v = filtered(await list(env,"sopNodes"),a);
      else if (f === "graphNeighbors") v = await neighbors(env,a.id,a.type);
      else if (f === "search") v = await graphSearch(env,a.query,a.limit);
      else {
        const map = {upsertProject:"projects",upsertAsset:"assets",upsertWorkPackage:"workPackages",upsertRiskIssue:"riskIssues",upsertEvidence:"evidence",upsertSopNode:"sopNodes",upsertRelationship:"relationships"};
        let input = a.input; if (typeof input === "string" && vars[input]) input = vars[input];
        if (!input || typeof input !== "object") input = vars.input || {};
        v = await upsert(env,map[f],input,input.actor || "graphql-client");
      }
      data[f] = projection(v,s.fields);
    }
    if (!Object.keys(data).length) return reply({ errors:[{message:"Unsupported root field. See schema.graphql in branch projects-mcp."}] },400);
    return reply({ data });
  } catch (e) { return reply({ data, errors:[{message:String(e.message || "GraphQL operation failed").slice(0,400)}] },400); }
}
async function mcp(req, env) {
  if (req.method !== "POST") return reply({ error:"POST JSON-RPC requests to /mcp" },405,{allow:"POST"});
  let m; try { m = await req.json(); } catch (_) { return reply({error:"Expected JSON-RPC body"},400); }
  const hasId = Object.prototype.hasOwnProperty.call(m || {}, "id"), id = hasId ? m.id : null;
  const response = (result, error) => {
    if (!hasId) return new Response(null,{status:202,headers:{"cache-control":"no-store"}});
    const obj = {jsonrpc:"2.0",id}; if (error) obj.error = error; else obj.result = result;
    return reply(obj);
  };
  if (!m || m.jsonrpc !== "2.0" || typeof m.method !== "string") return response(null,{code:-32600,message:"Invalid JSON-RPC request"});
  if (m.method === "notifications/initialized" || m.method === "notifications/cancelled") return new Response(null,{status:202});
  if (m.method === "initialize") return response({protocolVersion:"2025-06-18",capabilities:{tools:{listChanged:false},resources:{subscribe:false,listChanged:false}},serverInfo:{name:"bucklerfamily-projects-data",version:VERSION},instructions:"Use graph_search for grounded retrieval; all record writes are audited; source records and interpretation must remain distinct."});
  if (m.method === "ping") return response({});
  if (m.method === "tools/list") return response({tools:TOOLS});
  if (m.method === "resources/list") return response({resources:[
    {uri:"projects://register",name:"Project register",mimeType:"application/json"},
    {uri:"projects://assets",name:"Configuration-item register",mimeType:"application/json"},
    {uri:"projects://graph/summary",name:"Graph summary",mimeType:"application/json"}
  ]});
  try {
    await seed(env);
    if (m.method === "tools/call") {
      const value = await toolCall(env,m.params?.name,m.params?.arguments || {});
      return response({content:[{type:"text",text:JSON.stringify(value)}],structuredContent:value,isError:false});
    }
    if (m.method === "resources/read") {
      const uri = m.params?.uri; let value;
      if (uri === "projects://register") value = await list(env,"projects");
      else if (uri === "projects://assets") value = await list(env,"assets");
      else if (uri === "projects://graph/summary") value = {projects:(await list(env,"projects")).length,assets:(await list(env,"assets")).length,workPackages:(await list(env,"workPackages")).length,riskIssues:(await list(env,"riskIssues")).length,evidence:(await list(env,"evidence")).length,sopNodes:(await list(env,"sopNodes")).length,relationships:(await list(env,"relationships")).length,storage:"private R2 bucket; no public bucket domain"};
      else return response(null,{code:-32602,message:"Unknown resource URI"});
      return response({contents:[{uri,mimeType:"application/json",text:JSON.stringify(value)}]});
    }
    return response(null,{code:-32601,message:"Method not found: " + m.method});
  } catch(e) { return response(null,{code:-32000,message:String(e.message || "Request failed").slice(0,400)}); }
}
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/health" && request.method === "GET") return reply({ok:true,service:"bucklerfamily-projects-data",version:VERSION,storage:"private R2",endpoints:["/mcp","/graphql"]});
    if (url.pathname === "/" && request.method === "GET") return new Response("Buckler Family Projects Data API\nMCP: /mcp\nGraphQL: /graphql\nHealth: /health\n", {headers:{"content-type":"text/plain; charset=utf-8","cache-control":"no-store"}});
    if (!auth(request,env)) return reply({error:"Unauthorized. Supply the configured bearer token."},401,{"www-authenticate":"Bearer realm=\"projects-data\""});
    try {
      if (url.pathname === "/mcp") return await mcp(request,env);
      if (url.pathname === "/graphql") { await seed(env); return await graphql(request,env); }
      if (url.pathname === "/openapi.json" && request.method === "GET") return reply({name:"bucklerfamily-projects-data",version:VERSION,mcp:"/mcp",graphql:"/graphql",auth:"Bearer",graphqlMode:"supported GraphQL subset; see schema.graphql"});
      return reply({error:"Not found"},404);
    } catch(e) { return reply({error:"Request failed",detail:String(e.message || "").slice(0,300)},500); }
  }
};