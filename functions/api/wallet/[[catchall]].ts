interface Env {
  DB: D1Database;
}

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

async function ensureTables(db: D1Database) {
  await db.prepare(
    `CREATE TABLE IF NOT EXISTS wallets (
      wallet_id TEXT PRIMARY KEY,
      balance INTEGER DEFAULT 0,
      credited INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    )`
  ).run();
  await db.prepare(
    `INSERT OR IGNORE INTO wallets (wallet_id, balance, credited) VALUES ('agent-network-wallet', 0, 1)`
  ).run();
}

export async function onRequest(context: { request: Request; env: Env }) {
  const { request, env } = context;
  const url = new URL(request.url);
  const method = request.method;

  if (method === 'OPTIONS') return json(null, 204);

  try {
    await ensureTables(env.DB);

    const path = url.pathname.replace(/^\/api\/wallet\/?/, '').replace(/\/$/, '');
    const segments = path.split('/').filter(Boolean);

    // POST /api/wallet/create
    if (method === 'POST' && segments[0] === 'create') {
      const body = await request.json() as any;
      const { sessionId } = body;
      if (!sessionId) return json({ error: 'sessionId required' }, 400);

      const existing = await env.DB.prepare('SELECT balance, credited FROM wallets WHERE wallet_id = ?').bind(sessionId).first() as any;
      const isNew = !existing;
      if (isNew) {
        await env.DB.prepare('INSERT INTO wallets (wallet_id, balance, credited) VALUES (?, 0, 0)').bind(sessionId).run();
      }

      return json({
        walletId: sessionId,
        balance: existing?.balance ?? 0,
        currency: 'FCUK',
        isNew,
        credited: existing ? !!existing.credited : false,
      });
    }

    // POST /api/wallet/credit
    if (method === 'POST' && segments[0] === 'credit') {
      const body = await request.json() as any;
      const { sessionId, amount = 50 } = body;
      if (!sessionId) return json({ error: 'sessionId required' }, 400);

      const existing = await env.DB.prepare('SELECT balance, credited FROM wallets WHERE wallet_id = ?').bind(sessionId).first() as any;
      if (!existing) {
        await env.DB.prepare('INSERT INTO wallets (wallet_id, balance, credited) VALUES (?, 0, 0)').bind(sessionId).run();
      }

      if (!existing?.credited) {
        await env.DB.prepare('UPDATE wallets SET balance = balance + ?, credited = 1 WHERE wallet_id = ?').bind(amount, sessionId).run();
      }

      const updated = await env.DB.prepare('SELECT balance, credited FROM wallets WHERE wallet_id = ?').bind(sessionId).first() as any;
      return json({ walletId: sessionId, balance: updated?.balance ?? amount, currency: 'FCUK', credited: true });
    }

    // GET /api/wallet/<sessionId>
    if (method === 'GET' && segments.length === 1 && segments[0] && segments[0] !== 'agent') {
      const walletId = segments[0];
      const row = await env.DB.prepare('SELECT balance, credited FROM wallets WHERE wallet_id = ?').bind(walletId).first() as any;
      if (!row) return json({ error: 'Wallet not found' }, 404);
      return json({ walletId, balance: row.balance, currency: 'FCUK', credited: !!row.credited });
    }

    // POST /api/wallet/transfer
    if (method === 'POST' && segments[0] === 'transfer') {
      const body = await request.json() as any;
      const { sessionId, amount } = body;
      if (!sessionId || !amount) return json({ error: 'sessionId and amount required' }, 400);

      const sender = await env.DB.prepare('SELECT balance FROM wallets WHERE wallet_id = ?').bind(sessionId).first() as any;
      if (!sender) return json({ error: 'Sender wallet not found' }, 404);
      if (sender.balance < amount) return json({ error: 'Insufficient balance' }, 402);

      await env.DB.prepare('UPDATE wallets SET balance = balance - ? WHERE wallet_id = ?').bind(amount, sessionId).run();
      await env.DB.prepare('UPDATE wallets SET balance = balance + ? WHERE wallet_id = ?').bind(amount, 'agent-network-wallet').run();

      const newSender = await env.DB.prepare('SELECT balance FROM wallets WHERE wallet_id = ?').bind(sessionId).first() as any;
      const agent = await env.DB.prepare('SELECT balance FROM wallets WHERE wallet_id = ?').bind('agent-network-wallet').first() as any;

      return json({
        senderWalletId: sessionId,
        receiverWalletId: 'agent-network-wallet',
        amount,
        senderBalance: newSender?.balance ?? 0,
        agentBalance: agent?.balance ?? 0,
        currency: 'FCUK',
      });
    }

    // GET /api/wallet/agent
    if (method === 'GET' && segments[0] === 'agent') {
      const row = await env.DB.prepare('SELECT balance FROM wallets WHERE wallet_id = ?').bind('agent-network-wallet').first() as any;
      return json({ walletId: 'agent-network-wallet', balance: row?.balance ?? 0, currency: 'FCUK', credited: true });
    }

    return json({ error: 'Not found' }, 404);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Internal error';
    return json({ error: msg }, 500);
  }
}
