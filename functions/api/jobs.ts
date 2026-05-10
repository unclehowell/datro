import { jwtVerify } from 'jose';

interface Env {
  DB: D1Database;
  JWT_SECRET?: string;
  PARENT_PROXY_SECRET?: string;
}

function getJwtSecret(env: Env) {
  return new TextEncoder().encode(env.JWT_SECRET || 'your-jwt-secret-change-in-production');
}

async function getUserFromRequest(request: Request, env: Env) {
  const auth = request.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  try {
    const { payload } = await jwtVerify(auth.substring(7), getJwtSecret(env));
    return payload as { id: number; email: string };
  } catch { return null; }
}

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { request, env } = context;
  const user = await getUserFromRequest(request, env);
  if (!user) return json({ error: 'Unauthorized' }, 401);

  const row = await env.DB.prepare(
    'SELECT wallet_balance as credits FROM users WHERE id = ?'
  ).bind(user.id).first() as any;

  return json({ credits: row?.credits ?? 0 });
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;
  const user = await getUserFromRequest(request, env);
  if (!user) return json({ error: 'Unauthorized' }, 401);

  const body = await request.json() as any;
  const { url, leadAmount, quantity, creditCost } = body;

  if (!url || !leadAmount || !quantity || !creditCost) {
    return json({ error: 'Missing required fields' }, 400);
  }

  // Check credits
  const row = await env.DB.prepare(
    'SELECT wallet_balance as credits FROM users WHERE id = ?'
  ).bind(user.id).first() as any;

  if ((row?.credits ?? 0) < creditCost) {
    return json({ error: 'Insufficient credits' }, 402);
  }

  // Deduct credits and insert job atomically
  await env.DB.batch([
    env.DB.prepare('UPDATE users SET wallet_balance = wallet_balance - ? WHERE id = ?').bind(creditCost, user.id),
    env.DB.prepare(
      'INSERT INTO jobs (user_id, url, lead_amount, quantity, credit_cost, status) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(user.id, url, leadAmount, quantity, creditCost, 'queued'),
  ]);

  // Dispatch to child proxy (fire and forget)
  const jobRow = await env.DB.prepare('SELECT last_insert_rowid() as id').first() as any;
  dispatchJob({ id: jobRow?.id, userId: user.id, url, leadAmount, quantity }, env).catch(console.error);

  const updated = await env.DB.prepare('SELECT wallet_balance as credits FROM users WHERE id = ?').bind(user.id).first() as any;
  return json({ ok: true, creditsRemaining: updated?.credits ?? 0 });
}

async function dispatchJob(job: any, env: Env) {
  // Get least-loaded child proxy
  const child = await env.DB.prepare(
    "SELECT id, url FROM child_proxies WHERE last_seen > datetime('now', '-60 seconds') ORDER BY load ASC LIMIT 1"
  ).first() as any;

  if (!child) return;

  try {
    await fetch(`${child.url}/dispatch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(job),
    });
    await env.DB.prepare('UPDATE child_proxies SET load = load + 1 WHERE id = ?').bind(child.id).run();
    await env.DB.prepare("UPDATE jobs SET status = 'dispatched' WHERE id = ?").bind(job.id).run();
  } catch { /* child unavailable */ }
}

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
