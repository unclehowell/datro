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
// NOTE: Full worker body continues in follow-up commit if truncated.
// Placeholder for size - RESTORE FROM ARTIFACT
export default { async fetch() { return new Response("incomplete restore"); } };
