// POST /api/sync-graph — reload D1 from graph.sql (qa branch or bpvsbuckler fallback)

const ACCOUNT_ID = '42a4a8d7bfb96321118ada213638d050';
const PROJECT_NAME = 'qa';
const SQL_URL = 'https://raw.githubusercontent.com/unclehowell/datro/qa/static/qa/api/graph.sql';
const META_TABLE = '_graph_sync_meta';
const META_KEY = 'graph_sql_sha256';
const MAX_BATCH_BYTES = 88000;
const MAX_STATEMENT_BYTES = 87000;

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
    },
  });

async function bodyJson(response) {
  try { return await response.json(); } catch { return null; }
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

function splitStatements(sql) {
  const statements = [];
  let start = 0;
  let quote = '';
  for (let i = 0; i < sql.length; i += 1) {
    const ch = sql[i];
    if (quote) {
      if (ch === quote) {
        if (sql[i + 1] === quote && (quote === "'" || quote === '"' || quote === '`')) i += 1;
        else quote = '';
      }
      continue;
    }
    if (ch === "'" || ch === '"' || ch === '`') quote = ch;
    else if (ch === ';') {
      const statement = sql.slice(start, i).trim();
      if (statement) statements.push(statement);
      start = i + 1;
    }
  }
  const tail = sql.slice(start).trim();
  if (tail) statements.push(tail);
  return statements;
}

function makeBatches(statements) {
  const encoder = new TextEncoder();
  const batches = [];
  let pending = [];
  let pendingBytes = 0;
  const MAX_BATCH_STATEMENTS = 75;
  for (let index = 0; index < statements.length; index += 1) {
    const statement = statements[index];
    const statementBytes = encoder.encode(statement).byteLength;
    if (statementBytes > MAX_STATEMENT_BYTES) throw new Error(`oversized statement ${index + 1}`);
    const addition = statementBytes + (pending.length ? 2 : 0);
    // Keep both batch size and statement count comfortably bounded.
    if (pending.length &&
        (pendingBytes + addition > MAX_BATCH_BYTES || pending.length >= MAX_BATCH_STATEMENTS)) {
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
  try {
    const row = await db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).first();
    return Number(row?.n || 0);
  } catch { return 0; }
}

export async function onRequestPost({ request, env }) {
  if (!env.DB) return json({ ok: false, stage: 'binding', error: 'D1 binding unavailable' }, 503);
  let stage = 'authenticate';
  try {
    if (!(await authorised(request))) return json({ ok: false, stage, error: 'auth denied' }, 401);
    stage = 'fetch-sql';
    let response = await fetch(SQL_URL, { headers: { accept: 'text/plain' }, cf: { cacheTtl: 0 } });
    if (!response.ok) {
      response = await fetch(
        'https://raw.githubusercontent.com/unclehowell/datro/bpvsbuckler/static/bpvsbuckler/api/graph.sql',
        { headers: { accept: 'text/plain' }, cf: { cacheTtl: 0 } }
      );
    }
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
    if (!statements.length || statements.length > 100000) {
      return json({ ok: false, stage, statementCount: statements.length }, 422);
    }
    const batches = makeBatches(statements);
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(sql));
    const sha256 = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
    await env.DB.prepare(`CREATE TABLE IF NOT EXISTS ${META_TABLE} (key TEXT PRIMARY KEY, value TEXT NOT NULL)`).run();
    const previous = await env.DB.prepare(`SELECT value FROM ${META_TABLE} WHERE key = ?`).bind(META_KEY).first();
    if (previous?.value === sha256) {
      return json({ ok: true, skipped: true, sha256, counts: { qa: await count(env.DB, 'qa'), messages: await count(env.DB, 'messages') } });
    }
    stage = 'execute-batches';
    for (let i = 0; i < batches.length; i += 1) {
      try {
        await env.DB.exec(batches[i]);
      } catch (_error) {
        // SQL errors can echo literal correspondence content; never return or log them.
        return json({
          ok: false,
          stage,
          failedBatch: i + 1,
          batchCount: batches.length,
          batchBytes: new TextEncoder().encode(batches[i]).byteLength,
          batchStatementCount: splitStatements(batches[i]).length,
          batchStartId: batches[i].match(/INSERT INTO nodes VALUES \x28'([^']+)'/)?.[1] || null,
          error: 'D1 rejected a SQL batch; statement details withheld.',
        }, 500);
      }
    }
    stage = 'record-sync';
    await env.DB.prepare(
      `INSERT INTO ${META_TABLE} (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value`
    ).bind(META_KEY, sha256).run();
    return json({
      ok: true, skipped: false, bytes: sql.length, statementCount: statements.length, batchCount: batches.length, sha256,
      counts: { qa: await count(env.DB, 'qa'), messages: await count(env.DB, 'messages'), nodes: await count(env.DB, 'nodes') },
    });
  } catch (_error) {
    return json({ ok: false, stage, error: 'Graph sync failed' }, 500);
  }
}
