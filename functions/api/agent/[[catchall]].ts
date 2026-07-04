interface Env {
  DB: D1Database;
}

interface ProxyNode {
  machine_id: string;
  machine_name: string;
  ip_address: string;
  proxy_port: number;
  version: string;
  url: string;
  last_seen: string;
}

async function ensureTable(env: Env): Promise<void> {
  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS proxy_nodes (
      machine_id TEXT PRIMARY KEY,
      machine_name TEXT NOT NULL DEFAULT '',
      ip_address TEXT NOT NULL DEFAULT '',
      proxy_port INTEGER DEFAULT 6000,
      version TEXT DEFAULT '',
      last_seen TEXT DEFAULT (datetime('now')),
      registered_at TEXT DEFAULT (datetime('now')),
      url TEXT DEFAULT '',
      avg_response_ms REAL DEFAULT 1000,
      total_requests INTEGER DEFAULT 0
    )`
  ).run();
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
}

export async function onRequest(context: { request: Request; env: Env }): Promise<Response> {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  const headers: Record<string, string> = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Machine-ID',
    'Content-Type': 'application/json',
  };

  if (method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  try {
    await ensureTable(env);

    // GET /api/agent/status — list available agents
    if (path === '/api/agent/status' && method === 'GET') {
      const { results: nodes } = await env.DB.prepare(
        `SELECT machine_id, machine_name, version, last_seen, url, ip_address, proxy_port
         FROM proxy_nodes WHERE last_seen > datetime('now', '-1 hour')
         ORDER BY last_seen DESC`
      ).all() as { results: ProxyNode[] };

      const agents = [];
      for (const n of nodes) {
        const nodeUrl = n.url || `http://${n.ip_address}:${n.proxy_port || 4001}`;
        try {
          const resp = await fetch(`${nodeUrl}/v1/agent/status`, {
            signal: AbortSignal.timeout(5000),
          });
          if (resp.ok) {
            const data = await resp.json();
            agents.push(data);
          } else {
            agents.push({ machine_id: n.machine_id, role: 'unknown', capabilities: {}, version: n.version });
          }
        } catch {
          agents.push({ machine_id: n.machine_id, role: 'unknown', capabilities: {}, version: n.version });
        }
      }

      return new Response(JSON.stringify({ agents, total: agents.length }), { status: 200, headers });
    }

    // POST /api/agent/delegate — route task to a child proxy
    if (path === '/api/agent/delegate' && method === 'POST') {
      const body = await request.json() as any;
      const { task, target_device, timeout_sec = 300, context: taskContext = {} } = body;

      if (!task) {
        return new Response(JSON.stringify({ error: 'task is required' }), { status: 400, headers });
      }

      // Find target node
      let targetNode: any = null;
      if (target_device) {
        targetNode = await env.DB.prepare(
          `SELECT * FROM proxy_nodes WHERE machine_id = ? AND last_seen > datetime('now', '-1 hour')`
        ).bind(target_device).first();
      } else {
        const callerId = request.headers.get('X-Machine-ID') || '';
        targetNode = await env.DB.prepare(
          `SELECT * FROM proxy_nodes WHERE machine_id != ? AND last_seen > datetime('now', '-1 hour')
           ORDER BY avg_response_ms ASC, last_seen DESC LIMIT 1`
        ).bind(callerId).first();
      }

      if (!targetNode) {
        return new Response(JSON.stringify({ error: 'No suitable agent node available' }), { status: 503, headers });
      }

      const nodeUrl = targetNode.url || `http://${targetNode.ip_address}:${targetNode.proxy_port || 4001}`;

      try {
        const resp = await fetch(`${nodeUrl}/v1/agent/delegate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ task, context: taskContext, timeout_sec }),
          signal: AbortSignal.timeout((timeout_sec + 30) * 1000),
        });

        const result = await resp.json();

        await env.DB.prepare(
          `INSERT INTO proxy_logs (origin_machine_id, endpoint, model, response_status, routing_decision, created_at)
           VALUES (?, ?, ?, ?, ?, datetime('now'))`
        ).bind(request.headers.get('X-Machine-ID') || 'unknown', 'agent/delegate', 'agent', resp.status, `delegate_to_${targetNode.machine_id}`).run();

        return new Response(JSON.stringify({
          delegated_to: targetNode.machine_id,
          device_name: targetNode.machine_name,
          ...result
        }), { status: resp.status, headers });
      } catch (e) {
        return new Response(JSON.stringify({
          error: `Delegation failed: ${e instanceof Error ? e.message : 'unknown'}`,
          target_device: targetNode.machine_id
        }), { status: 502, headers });
      }
    }

    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Internal error';
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers });
  }
}
