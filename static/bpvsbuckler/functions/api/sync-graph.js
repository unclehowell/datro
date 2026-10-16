// POST /api/sync-graph — refresh the D1 search graph after Pages deploys.
// Wrangler's SQL-import endpoint needs a permission the deployment token lacks,
// so this function applies the same checked export via the site's D1 binding.
// Caller must present an active Cloudflare API token that can read this Pages
// project. Credentials are never stored, logged, or returned.
const ACCOUNT_ID = '42a4a8d7bfb96321118ada213638d050';
const PROJECT_NAME = 'bpvsbuckler';
const SQL_URL = 'https://raw.githubusercontent.com/unclehowell/datro/bpvsbuckler/static/bpvsbuckler/api/graph.sql';
const META_TABLE = '_graph_sync_meta';
const META_KEY = 'graph_sql_sha256';
const MAX_BATCH_BYTES = 88000;
const MAX_STATEMENT_BYTES = 87000;

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

// The generated file may contain semicolons and newlines inside quoted values.
// Split only on SQL statement delimiters outside string/identifier quotes.
function splitStatements(sql) {
  const statements = [];
  let start = 0;
  let quote = '';
  for (let i = 0; i < sql.length; i += 1) {
    const ch = sql[i];
    if (quote) {
      if (ch === quote) {
        if (sql[i + 1] === quote && (quote === "'" || quote === '"' || quote === '`')) {
          i += 1;
        } else {
          quote = '';
        }
      }
      continue;
    }
    if (ch === "'" || ch === '"' || ch === '`') {
      quote = ch;
    } else if (ch === ';') {
      const statement = sql.slice(start, i).trim();
      if (statement) statements.push(statement);
      start = i + 1;
    }
  }
  if (quote) throw new Error('SQL export contains an unterminated quoted value.');
  const tail = sql.slice(start).trim();
  if (tail) statements.push(tail);
  return statements;
}

function makeBatches(statements) {
  const encoder = new TextEncoder();
  const batches = [];
  let pending = [];
  let pendingBytes = 0;
  for (let index = 0; index < statements.length; index += 1) {
    const statement = statements[index];
    const statementBytes = encoder.encode(statement).byteLength;
    if (statementBytes > MAX_STATEMENT_BYTES) {
      throw new Error(`SQL statement ${index + 1} is oversized (${statementBytes} bytes).`);
    }
    const addition = statementBytes + (pending.length ? 2 : 0);
    if (pending.length && pendingBytes + addition > MAX_BATCH_BYTES) {
      batches.push(pending.join(';\n') + ';');
      pending = [];
      pendingBytes = 0;
    }
    pending.push(statement);
    pendingBytes += statementBytes + (pending.length > 1 ? 2 : 0);
  }
  if (pending.length) batches.push(pending.join(';\n') + ';');
  return batches;
}

async function count(db, table) {
  const row = await db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).first();
  return Number(row?.n || 0);
}

async function verifyGraph(db) {
  const counts = {
    nodes: await count(db, 'nodes'),
    edges: await count(db, 'edges'),
    qa: await count(db, 'qa'),
    messages: await count(db, 'messages'),
    qa_fts: await count(db, 'qa_fts'),
    messages_fts: await count(db, 'messages_fts'),
  };
  const current = await db.prepare("SELECT COUNT(*) AS n FROM nodes WHERE id = ?")
    .bind('scene:ghf-19900529-1').first();
  const obsolete = await db.prepare("SELECT COUNT(*) AS n FROM nodes WHERE id = ?")
    .bind('scene:ghf-19920515-1').first();
  const canonicalDeathScene = Number(current?.n || 0);
  const obsoleteDeathScene = Number(obsolete?.n || 0);
  const healthy = counts.nodes >= 900 && counts.edges >= 1500 &&
    counts.qa > 0 && counts.messages > 0 &&
    counts.qa === counts.qa_fts && counts.messages === counts.messages_fts &&
    canonicalDeathScene === 1 && obsoleteDeathScene === 0;
  return { healthy, counts, canonicalDeathScene, obsoleteDeathScene };
}

export async function onRequestPost({ request, env }) {
  if (!env.DB) return json({ ok: false, stage: 'binding', error: 'D1 binding DB is unavailable.' }, 503);

  let stage = 'authenticate';
  try {
    if (!(await authorised(request))) {
      return json({ ok: false, stage, error: 'Cloudflare authentication or project access denied.' }, 401);
    }

    stage = 'fetch-sql';
    const response = await fetch(SQL_URL, {
      headers: { accept: 'text/plain' },
      cf: { cacheTtl: 0, cacheEverything: false },
    });
    if (!response.ok) return json({ ok: false, stage, status: response.status }, 502);
    const sql = await response.text();

    stage = 'validate-sql';
    if (sql.length < 100000 ||
        !sql.startsWith('DROP TABLE IF EXISTS nodes;') ||
        !sql.includes('CREATE VIRTUAL TABLE qa_fts') ||
        !sql.includes('CREATE VIRTUAL TABLE messages_fts') ||
        !sql.includes('scene:ghf-19900529-1')) {
      return json({ ok: false, stage, bytes: sql.length }, 422);
    }
    const statements = splitStatements(sql);
    const batches = makeBatches(statements);
    if (!statements.length || batches.length > 50) {
      return json({ ok: false, stage, statementCount: statements.length, batchCount: batches.length }, 422);
    }

    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(sql));
    const sha256 = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
    await env.DB.prepare(
      `CREATE TABLE IF NOT EXISTS ${META_TABLE} (key TEXT PRIMARY KEY, value TEXT NOT NULL)`,
    ).run();
    const previous = await env.DB.prepare(`SELECT value FROM ${META_TABLE} WHERE key = ?`)
      .bind(META_KEY).first();

    stage = 'verify-current';
    const before = await verifyGraph(env.DB);
    if (previous?.value === sha256 && before.healthy) {
      return json({ ok: true, skipped: true, reason: 'SQL export unchanged and D1 verified', sha256, ...before });
    }

    // Keep each request below D1's 100 KB single-statement ceiling and prevent
    // the 4 MB catalogue export from being sent as one oversized SQL request.
    stage = 'execute-batches';
    for (let i = 0; i < batches.length; i += 1) {
      try {
        await env.DB.exec(batches[i]);
      } catch (_error) {
        return json({
          ok: false, stage, failedBatch: i + 1, batchCount: batches.length,
          batchBytes: new TextEncoder().encode(batches[i]).byteLength,
          error: 'D1 rejected a SQL batch; no sync marker was written.',
        }, 500);
      }
    }

    stage = 'verify-loaded-graph';
    const verified = await verifyGraph(env.DB);
    if (!verified.healthy) return json({ ok: false, stage, bytes: sql.length, sha256, ...verified }, 500);

    stage = 'record-sync';
    await env.DB.prepare(
      `INSERT INTO ${META_TABLE} (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    ).bind(META_KEY, sha256).run();

    return json({
      ok: true, skipped: false, bytes: sql.length, statementCount: statements.length,
      batchCount: batches.length, sha256, ...verified,
    });
  } catch (_error) {
    // Do not echo SQL, email content, bearer credentials, or vendor error details.
    return json({ ok: false, stage, error: 'Graph sync failed during the reported stage.' }, 500);
  }
}
