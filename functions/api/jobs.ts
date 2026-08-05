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

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { request, env } = context;
  const user = await getUserFromRequest(request, env);
  if (!user) return json({ error: 'Unauthorized' }, 401);

  const row = await env.DB.prepare(
    'SELECT wallet_balance as credits FROM users WHERE id = ?'
  ).bind(user.id).first() as any;

  const { results: orders } = await env.DB.prepare(
    'SELECT id, target_url, budget_credits, quantity, lead_value, status, escrow_balance, campaign_prompt, created_at FROM orders WHERE user_id = ? ORDER BY id DESC LIMIT 20'
  ).bind(user.id).all();

  return json({ credits: row?.credits ?? 0, orders });
}

function buildCampaignPrompt(order: any): string {
  return [
    'You are a FinanceCheque lead-generation campaign node.',
    'Objective: drive qualified leads to the target website and report each lead as it is captured.',
    `Target URL: ${order.target_url}`,
    `Budget: ${order.budget_credits} FCUK credits (escrowed).`,
    `Lead target: ${order.quantity} leads, each valued at ${order.lead_value} FCUK.`,
    '',
    'Instructions:',
    '1. Use the connected social/marketing platforms (X, LinkedIn, IG, TikTok, YouTube, Pinterest, ads) to promote the target.',
    '2. Use your LLMs + local tools + opencode/kilo CLIs + skills for multi-step research, copywriting, audience targeting, and campaign execution.',
    '3. Capture leads (form fills, DMs, comments, signups, referrals) and report each via POST /api/proxy/lead with order_id, source, and status=verified.',
    '4. Work autonomously over hours; iterate on content that performs. Attribute all work to your node.',
    '',
    'Report every verified lead as soon as you capture it — payout is disbursed per verified lead to your node wallet.',
    `Order ID: ${order.id}. Campaign end: after ${order.quantity} verified leads or when the escrow is consumed.`,
  ].join('\n');
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;
  const user = await getUserFromRequest(request, env);
  if (!user) return json({ error: 'Unauthorized' }, 401);

  const body = await request.json() as any;
  const { url, leadAmount, quantity, creditCost, budget } = body;

  if (!url || !leadAmount || !quantity || !creditCost) {
    return json({ error: 'Missing required fields (url, leadAmount, quantity, creditCost)' }, 400);
  }

  // Check credits
  const row = await env.DB.prepare(
    'SELECT wallet_balance as credits FROM users WHERE id = ?'
  ).bind(user.id).first() as any;

  if ((row?.credits ?? 0) < creditCost) {
    return json({ error: 'Insufficient credits' }, 402);
  }

  // Deduct credits from buyer wallet, escrow the budget, insert order
  const insertRes = await env.DB.batch([
    env.DB.prepare('UPDATE users SET wallet_balance = wallet_balance - ? WHERE id = ?').bind(creditCost, user.id),
    env.DB.prepare(
      `INSERT INTO orders (user_id, target_url, budget_credits, quantity, lead_value, status, escrow_balance)
       VALUES (?, ?, ?, ?, ?, 'escrowed', ?)`
    ).bind(user.id, url, Number(budget) || creditCost, quantity, leadAmount, creditCost),
  ]);

  const orderRow = await env.DB.prepare('SELECT last_insert_rowid() as id').first() as any;
  const orderId = orderRow?.id;
  orderId && buildCampaignPrompt({ id: orderId, target_url: url, budget_credits: creditCost, quantity, lead_value: leadAmount });

  // Capability/pressure-aware dispatch to the swarm (best-effort).
  dispatchToSwarm(env, { id: orderId, target_url: url, quantity, lead_value: leadAmount, budget: creditCost, user_id: user.id }).catch(console.error);

  const updated = await env.DB.prepare('SELECT wallet_balance as credits FROM users WHERE id = ?').bind(user.id).first() as any;
  return json({ ok: true, creditsRemaining: updated?.credits ?? 0, orderId });
}

// ── Swarm dispatch ────────────────────────────────────────────────────────
// Selects the least-loaded announced node that can do agent work and feeds it
// the campaign via its poll queue (proxy_pending), so even NAT'd nodes work.
async function dispatchToSwarm(env: Env, job: any) {
  try {
    // Capability-aware: prefer nodes that advertise agent_exec + code; fall back to any recent node.
    const { results: nodes } = await env.DB.prepare(
      `SELECT machine_id, url, ip_address, proxy_port,
              COALESCE(CAST(agent_info AS TEXT), '{}') AS agent_info,
              COALESCE(CAST(provider_info AS TEXT), '{}') AS provider_info
       FROM proxy_nodes
       WHERE last_seen > datetime('now', '-10 minutes')
       ORDER BY
         CASE WHEN CAST(agent_info AS TEXT) LIKE '%agent_exec%' OR CAST(agent_info AS TEXT) LIKE '%opencode%' OR CAST(agent_info AS TEXT) LIKE '%kilo%' THEN 0 ELSE 1 END,
         last_seen DESC
       LIMIT 5`
    ).all();

    if (!nodes?.length) return;

    // Build the campaign payload per node (first picker + backups).
    for (const rawNode of nodes) {
      const node = rawNode as any;
      const payload = {
        action: 'campaign',
        order_id: job.id,
        machine_id: node.machine_id,
        target_url: job.target_url,
        budget: job.budget,
        quantity: job.quantity,
        lead_value: job.lead_value,
        prompt: buildCampaignPrompt(job),
      };

      // Prefer delegation to an announced URL; otherwise queue in proxy_pending (poll path).
      const nodeUrl = node.url || `http://${node.ip_address}:${node.proxy_port || 6100}`;
      if (node.url) {
        try {
          const resp = await fetch(`${nodeUrl}/v1/agent/execute`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(10000),
          });
          if (resp.ok) {
            await env.DB.prepare("UPDATE orders SET status = 'in_progress' WHERE id = ?").bind(job.id).run();
            return;
          }
        } catch { /* try next */ }
      }

      // Fallback: queue for polling nodes.
      const workId = `campaign-${job.id}-${node.machine_id}`;
      await env.DB.prepare(
        `INSERT OR IGNORE INTO proxy_pending (work_id, machine_id, payload, status) VALUES (?, ?, ?, 'pending')`
      ).bind(workId, node.machine_id, JSON.stringify(payload)).run();
      await env.DB.prepare("UPDATE orders SET status = 'in_progress' WHERE id = ?").bind(job.id).run();
      return;
    }
  } catch { /* swarm unavailable — order stays escrowed, retried next job */ }
}