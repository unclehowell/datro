interface Env {
  DB: D1Database;
}

export async function onRequest(context: { request: Request; env: Env }): Promise<Response> {
  const { env } = context;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (context.request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    await env.DB.prepare(
      `CREATE TABLE IF NOT EXISTS proxy_nodes (
        machine_id TEXT PRIMARY KEY,
        machine_name TEXT NOT NULL DEFAULT '',
        ip_address TEXT NOT NULL DEFAULT '',
        proxy_port INTEGER DEFAULT 6000,
        version TEXT DEFAULT '',
        last_seen TEXT DEFAULT (datetime('now')),
        registered_at TEXT DEFAULT (datetime('now'))
      )`
    ).run();
    await env.DB.prepare(
      `ALTER TABLE proxy_nodes ADD COLUMN url TEXT DEFAULT ''`
    ).run().catch(() => {});

    await env.DB.prepare(
      `CREATE TABLE IF NOT EXISTS proxy_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        origin_machine_id TEXT DEFAULT '',
        endpoint TEXT NOT NULL DEFAULT '',
        model TEXT DEFAULT '',
        response_status INTEGER DEFAULT 0,
        routing_decision TEXT DEFAULT 'direct',
        created_at TEXT DEFAULT (datetime('now'))
      )`
    ).run();

    const { results: nodes } = await env.DB.prepare(
      `SELECT machine_id, machine_name, ip_address, proxy_port, version, url, last_seen, registered_at
       FROM proxy_nodes
       ORDER BY last_seen DESC`
    ).all() as { results: any[] };

    const { results: logs } = await env.DB.prepare(
      `SELECT id, origin_machine_id, endpoint, model, response_status, routing_decision, created_at
       FROM proxy_logs
       ORDER BY created_at DESC
       LIMIT 100`
    ).all() as { results: any[] };

    const activeCount = await env.DB.prepare(
      `SELECT COUNT(*) as count FROM proxy_nodes WHERE last_seen > datetime('now', '-1 hour')`
    ).first() as { count: number };

    const todayCount = await env.DB.prepare(
      `SELECT COUNT(*) as count FROM proxy_logs WHERE created_at > datetime('now', '-1 day')`
    ).first() as { count: number };

    return new Response(JSON.stringify({
      status: 'ok',
      timestamp: new Date().toISOString(),
      summary: {
        total_nodes_registered: nodes.length,
        active_nodes_last_hour: activeCount?.count || 0,
        total_logs_today: todayCount?.count || 0,
      },
      nodes,
      logs,
    }), { status: 200, headers: corsHeaders });

  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Internal error';
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: corsHeaders });
  }
}
