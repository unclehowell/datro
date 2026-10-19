// POST /api/sync-graph — resumable, verified reload of the Q&A graph into D1.
// One request processes at most four SQL chunks. Every chunk and its progress
// marker are committed in the same D1 batch transaction so retries are safe.

const ACCOUNT_ID = '42a4a8d7bfb96321118ada213638d050';
const PROJECT_NAME = 'qa';
const SQL_URL = 'https://raw.githubusercontent.com/unclehowell/datro/qa/static/qa/api/graph.sql';
const FALLBACK_SQL_URL = 'https://raw.githubusercontent.com/unclehowell/datro/bpvsbuckler/static/bpvsbuckler/api/graph.sql';
const META_TABLE = '_graph_sync_meta';
const META_KEY = 'graph_sql_sha256';
const PENDING_KEY = 'graph_sql_pending_sha256';
const NEXT_KEY = 'graph_sql_next_batch';
const MAX_BATCH_BYTES = 88000;
const MAX_STATEMENT_BYTES = 87000;
const BATCHES_PER_REQUEST = 4;
const MAX_BATCH_STATEMENTS = 75;

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
  try { return await response.json(); } catch (_error) { return null; }
}

async function authorised(request) {
  const header = request.headers.get('authorization') || '';
  if (!/^Bearer\\s+\\S+/i.test(header)) return false;
  const headers = { authorization: header, accept: 'application/json' };
  const verifyResponse = await fetch('https://api.cloudflare.com/client/v4/user/tokens/verify', { headers });
  const verify = await bodyJson(verifyResponse);
  if (!verifyResponse.ok || verify?.success !== true || verify?.result?.status !== 'active') return false;
  const projectResponse = await fetch(
    'https://api.cloudflare.com/client/v4/accounts/' + ACCOUNT_ID + '/pages/projects/' + PROJECT_NAME,
    { headers },
  );
  const project = await bodyJson(projectResponse);
  return projectResponse.ok && project?.success === true && project?.result?.name === PROJECT_NAME;
}

// Split only on semicolons outside SQL strings and quoted identifiers.
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
    if (statementBytes > MAX_STATEMENT_BYTES) throw new Error('oversized SQL statement ' + (index + 1));
    const addition = statementBytes + (pending.length ? 2 : 0);
    if (pending.length &&
        (pendingBytes + addition > MAX_BATCH_BYTES || pending.length >= MAX_BATCH_STATEMENTS)) {
      batches.push(pending);
      pending = [];
      pendingBytes = 0;
    }
    pending.push(statement);
    pendingBytes += statementBytes + (pending.length > 1 ? 2 : 0);
  }
  if (pending.length) batches.push(pending);
  return batches;
}

async function count(db, table) {
  try {
    const row = await db.prepare('SELECT COUNT(*) AS n FROM ' + table).first();
    return Number(row?.n || 0);
  } catch (_error) {
    return 0;
  }
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
  const canonical = await db.prepare('SELECT COUNT(*) AS n FROM nodes WHERE id = ?')
    .bind('scene:ghf-19900529-1').first();
  const obsolete = await db.prepare('SELECT COUNT(*) AS n FROM nodes WHERE id = ?')
    .bind('scene:ghf-19920515-1').first();
  const canonicalDeathScene = Number(canonical?.n || 0);
  const obsoleteDeathScene = Number(obsolete?.n || 0);
  const healthy = counts.nodes >= 900 && counts.edges >= 1500 &&
    counts.qa > 0 && counts.messages > 0 &&
    counts.qa === counts.qa_fts && counts.messages === counts.messages_fts &&
    canonicalDeathScene === 1 && obsoleteDeathScene === 0;
  return { healthy, counts, canonicalDeathScene, obsoleteDeathScene };
}

const upsertMeta = 'INSERT INTO ' + META_TABLE +
  ' (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value';

async function metaValue(db, key) {
  const row = await db.prepare('SELECT value FROM ' + META_TABLE + ' WHERE key = ?').bind(key).first();
  return row?.value ?? null;
}

export async function onRequestPost({ request, env }) {
  if (!env.DB) return json({ ok: false, complete: false, stage: 'binding', error: 'D1 binding unavailable' }, 503);
  let stage = 'authenticate';
  try {
    if (!(await authorised(request))) return json({ ok: false, complete: false, stage, error: 'auth denied' }, 401);

    stage = 'fetch-sql';
    let response = await fetch(SQL_URL, { headers: { accept: 'text/plain' }, cf: { cacheTtl: 0 } });
    if (!response.ok) {
      response = await fetch(FALLBACK_SQL_URL, {
        headers: { accept: 'text/plain' },
        cf: { cacheTtl: 0, cacheEverything: false },
      });
    }
    if (!response.ok) return json({ ok: false, complete: false, stage, status: response.status }, 502);
    const sql = await response.text();

    stage = 'validate-sql';
    if (sql.length < 100000 ||
        !sql.startsWith('DROP TABLE IF EXISTS nodes;') ||
        !sql.includes('CREATE VIRTUAL TABLE qa_fts') ||
        !sql.includes('CREATE VIRTUAL TABLE messages_fts') ||
        !sql.includes('scene:ghf-19900529-1')) {
      return json({ ok: false, complete: false, stage, bytes: sql.length }, 422);
    }
    const statements = splitStatements(sql);
    if (!statements.length || statements.length > 100000) {
      return json({ ok: false, complete: false, stage, statementCount: statements.length }, 422);
    }
    const batches = makeBatches(statements);
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(sql));
    const sha256 = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');

    stage = 'prepare-metadata';
    await env.DB.prepare('CREATE TABLE IF NOT EXISTS ' + META_TABLE + ' (key TEXT PRIMARY KEY, value TEXT NOT NULL)').run();
    const previous = await metaValue(env.DB, META_KEY);
    const verification = await verifyGraph(env.DB);
    if (previous === sha256 && verification.healthy) {
      return json({
        ok: true, complete: true, skipped: true, reason: 'SQL export unchanged and D1 graph verified',
        sha256, batchCount: batches.length, ...verification,
      });
    }

    let pendingSha = await metaValue(env.DB, PENDING_KEY);
    let nextBatch = Number.parseInt(await metaValue(env.DB, NEXT_KEY) || '0', 10);
    if (!Number.isInteger(nextBatch) || nextBatch < 0 || nextBatch >= batches.length ||
        pendingSha !== sha256 || previous === sha256) {
      // A new export (or a damaged graph previously marked complete) starts
      // with batch 1, which drops and recreates the graph tables.
      nextBatch = 0;
      await env.DB.batch([
        env.DB.prepare(upsertMeta).bind(PENDING_KEY, sha256),
        env.DB.prepare(upsertMeta).bind(NEXT_KEY, '0'),
      ]);
    }

    stage = 'execute-batches';
    const endBatch = Math.min(nextBatch + BATCHES_PER_REQUEST, batches.length);
    for (let i = nextBatch; i < endBatch; i += 1) {
      const group = batches[i];
      const statementsInBatch = group.map((statement) => env.DB.prepare(statement));
      // The progress marker is part of the same D1 transaction as the data
      // chunk; if any statement fails, the chunk rolls back and is safe to retry.
      statementsInBatch.push(env.DB.prepare(upsertMeta).bind(NEXT_KEY, String(i + 1)));
      try {
        await env.DB.batch(statementsInBatch);
      } catch (_error) {
        const bytes = group.reduce((n, statement) => n + new TextEncoder().encode(statement).byteLength, 0);
        const firstNode = group.find((statement) => statement.startsWith('INSERT INTO nodes VALUES ')) || '';
        const idMatch = firstNode.match(/INSERT INTO nodes VALUES \\x28'([^']+)'/);
        return json({
          ok: false, complete: false, stage, failedBatch: i + 1, batchCount: batches.length,
          batchBytes: bytes, batchStatementCount: group.length,
          batchStartId: idMatch?.[1] || null,
          error: 'D1 rejected a SQL batch; statement details withheld.',
        }, 500);
      }
      nextBatch = i + 1;
    }

    if (nextBatch < batches.length) {
      return json({
        ok: true, complete: false, sha256, nextBatch, batchCount: batches.length,
        remainingBatches: batches.length - nextBatch,
      });
    }

    stage = 'verify-loaded-graph';
    const loaded = await verifyGraph(env.DB);
    if (!loaded.healthy) {
      return json({ ok: false, complete: false, stage, sha256, batchCount: batches.length, ...loaded }, 500);
    }

    stage = 'record-sync';
    await env.DB.batch([
      env.DB.prepare(upsertMeta).bind(META_KEY, sha256),
      env.DB.prepare('DELETE FROM ' + META_TABLE + ' WHERE key IN (?, ?)').bind(PENDING_KEY, NEXT_KEY),
    ]);
    return json({
      ok: true, complete: true, skipped: false, bytes: sql.length,
      statementCount: statements.length, batchCount: batches.length, sha256, ...loaded,
    });
  } catch (_error) {
    // Do not echo SQL, correspondence bodies, authorization credentials, or vendor errors.
    return json({ ok: false, complete: false, stage, error: 'Graph sync failed during the reported stage.' }, 500);
  }
}
