interface Env {
  DB: D1Database;
}

const FCUK_PROXY_VERSION = '0.5.0';

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
    // Cleanup dead nodes (older than 2 hours)
    await env.DB.prepare(
      `DELETE FROM proxy_nodes WHERE last_seen < datetime('now', '-2 hours')`
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

    const totalNodes = nodes.length;
    const activeNodes = activeCount?.count || 0;

    const now = new Date();
    const nodesWithStatus = nodes.map(n => ({
      ...n,
      status: 'online',
      age_seconds: Math.max(0, Math.floor((now.getTime() - new Date(n.last_seen).getTime()) / 1000))
    }));

    return new Response(JSON.stringify({
      ok: true,
      status: 'ok',
      timestamp: now.toISOString(),
      version: FCUK_PROXY_VERSION,
      summary: {
        total_nodes_registered: totalNodes,
        active_nodes_last_hour: activeNodes,
        total_logs_today: todayCount?.count || 0,
      },
      nodes: nodesWithStatus,
      logs,
    }), { status: 200, headers: corsHeaders });

  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Internal error';
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: corsHeaders });
  }
}