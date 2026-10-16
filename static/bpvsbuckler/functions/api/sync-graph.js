// POST /api/sync-graph — refresh the D1 search graph after Pages deploys.
// The regular Pages token can deploy the site but may not have D1:Edit for
// Wrangler's SQL-import endpoint. This function uses the existing DB binding.
// Access is restricted to an active Cloudflare API token that can read this
// account's bpvsbuckler Pages project; the token is never stored or returned.
const ACCOUNT_ID = '42a4a8d7bfb96321118ada213638d050';
const PROJECT_NAME = 'bpvsbuckler';
const SQL_URL = 'https://raw.githubusercontent.com/unclehowell/datro/bpvsbuckler/static/bpvsbuckler/api/graph.sql';
const META_TABLE = '_graph_sync_meta';
const META_KEY = 'graph_sql_sha256';

const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
  },
});

async function bodyJson(response) {
  try { return await response.json(); } catch (_error) { return null; }
}

async function authorised(request) {
  const header = request.headers.get('authorization') || '';
  if (!/^Bearer\s+\S+/i.test(header)) return false;
  const headers = { authorization: header, accept: 'application/json' };

  // Verify the bearer credential itself, then bind it to the expected account
  // by checking access to this Pages project. No credential is logged.
  const verifyResponse = await fetch('https://api.cloudflare.com/client/v4/user/tokens/verify', { headers });
  const verify = await bodyJson(verifyResponse);
  if (!verifyResponse.ok || verify?.success !== true || verify?.result?.status !== 'active') return false;

  const projectResponse = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/pages/projects/${PROJECT_NAME}`,
    { headers },
  );
  const project = await bodyJson(projectResponse);
  return projectResponse.ok && project?.success === true && project?.result?.name === PROJECT_NAME;
}

async function count(db, table) {
  const row = await db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).first();
  return Number(row?.n || 0);
}

export async function onRequestPost({ request, env }) {
  if (!env.DB) return json({ ok: false, error: 'D1 binding DB is unavailable.' }, 503);

  try {
    if (!(await authorised(request))) return json({ ok: false, error: 'Cloudflare authentication or project access denied.' }, 401);

    const response = await fetch(SQL_URL, { headers: { accept: 'text/plain' }, cf: { cacheTtl: 0, cacheEverything: false } });
    if (!response.ok) return json({ ok: false, stage: 'fetch-sql', status: response.status }, 502);
    const sql = await response.text();

    if (sql.length < 100000 || !sql.startsWith('DROP TABLE IF EXISTS nodes;') ||
        !sql.includes('CREATE VIRTUAL TABLE qa_fts') || !sql.includes('CREATE VIRTUAL TABLE messages_fts')) {
      return json({ ok: false, stage: 'validate-sql', bytes: sql.length }, 422);
    }

    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(sql));
    const sha256 = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');

    await env.DB.prepare(
      `CREATE TABLE IF NOT EXISTS ${META_TABLE} (key TEXT PRIMARY KEY, value TEXT NOT NULL)`,
    ).run();
    const previous = await env.DB.prepare(`SELECT value FROM ${META_TABLE} WHERE key = ?`).bind(META_KEY).first();
    if (previous?.value === sha256) {
      return json({
        ok: true, skipped: true, reason: 'SQL export unchanged', sha256,
        counts: {
          nodes: await count(env.DB, 'nodes'),
          edges: await count(env.DB, 'edges'),
          qa: await count(env.DB, 'qa'),
          messages: await count(env.DB, 'messages'),
          qa_fts: await count(env.DB, 'qa_fts'),
          messages_fts: await count(env.DB, 'messages_fts'),
        },
      });
    }

    // D1 exec accepts a SQL script containing multiple statements. It executes
    // the same validated export used by the Wrangler import step.
    await env.DB.exec(sql);
    const counts = {
      nodes: await count(env.DB, 'nodes'),
      edges: await count(env.DB, 'edges'),
      qa: await count(env.DB, 'qa'),
      messages: await count(env.DB, 'messages'),
      qa_fts: await count(env.DB, 'qa_fts'),
      messages_fts: await count(env.DB, 'messages_fts'),
    };
    if (!counts.nodes || !counts.edges || !counts.qa || !counts.messages ||
        counts.qa !== counts.qa_fts || counts.messages !== counts.messages_fts) {
      return json({ ok: false, stage: 'verify-d1', bytes: sql.length, sha256, counts }, 500);
    }

    await env.DB.prepare(
      `INSERT INTO ${META_TABLE} (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    ).bind(META_KEY, sha256).run();

    return json({ ok: true, skipped: false, bytes: sql.length, sha256, counts });
  } catch (error) {
    return json({ ok: false, error: String(error), stage: 'sync' }, 500);
  }
}
