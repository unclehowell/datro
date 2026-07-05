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
  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS proxy_pending (
      work_id TEXT PRIMARY KEY,
      machine_id TEXT NOT NULL,
      payload TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
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
      const now = new Date();
      const { results: nodes } = await env.DB.prepare(
        `SELECT machine_id, machine_name, ip_address, proxy_port, version, url, last_seen
         FROM proxy_nodes
         WHERE datetime(last_seen) > datetime('now', '-5 minutes')`
      ).all() as { results: any[] };

      const agents = nodes.map(node => ({
        machine_id: node.machine_id,
        role: 'agent',
        capabilities: {},
        version: node.version || 'unknown',
        port: node.proxy_port || 4001,
        status: 'online'
      }));

      return new Response(JSON.stringify({
        agents,
        total: agents.length
      }), { status: 200, headers });
    }

    // POST /api/agent/delegate — delegate task to specific device
    if (path === '/api/agent/delegate' && method === 'POST') {
      const { task, target_device, timeout_sec, context } = await request.json();
      const requestId = request.headers.get('X-Machine-ID') || 'unknown';
      
      // Get target node info
      const { results: nodes } = await env.DB.prepare(
        `SELECT machine_id, machine_name, ip_address, proxy_port, url
         FROM proxy_nodes
         WHERE machine_id = ? AND datetime(last_seen) > datetime('now', '-5 minutes')`
      ).bind(target_device).run();

      if (!nodes.length) {
        return new Response(JSON.stringify({
          error: `Target device not found or offline: ${target_device}`
        }), { status: 404, headers });
      }

      const targetNode = nodes[0];
      const taskContext = {
        ...context,
        timestamp: new Date().toISOString(),
        delegated_by: requestId
      };

      const nodeUrl = targetNode.url || `http://${targetNode.ip_address}:${targetNode.proxy_port || 4001}`;

      // Try direct connection first
      try {
        const resp = await fetch(`${nodeUrl}/v1/agent/delegate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ task, context: taskContext, timeout_sec }),
          signal: AbortSignal.timeout(10000),
        });

        if (resp.ok) {
          const result = await resp.json();
          await env.DB.prepare(
            `INSERT INTO proxy_logs (origin_machine_id, endpoint, model, response_status, routing_decision, created_at)
             VALUES (?, ?, ?, ?, ?, datetime('now'))`
          ).bind(requestId, 'agent/delegate', 'agent', 200, `delegate_direct_${targetNode.machine_id}`).run();

          return new Response(JSON.stringify({
            delegated_to: targetNode.machine_id,
            device_name: targetNode.machine_name,
            method: 'direct',
            ...result
          }), { status: 200, headers });
        }
      } catch {}

      // Direct connection failed (NAT'd device) — queue for polling
      const workId = `agent_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      await env.DB.prepare(
        `INSERT INTO proxy_pending (work_id, machine_id, payload, status, created_at)
         VALUES (?, ?, ?, 'pending', datetime('now'))`
      ).bind(workId, targetNode.machine_id, JSON.stringify({ task, context: taskContext, timeout_sec })).run();

      await env.DB.prepare(
        `INSERT INTO proxy_logs (origin_machine_id, endpoint, model, response_status, routing_decision, created_at)
         VALUES (?, ?, ?, ?, ?, datetime('now'))`
      ).bind(requestId, 'agent/delegate', 'agent', 202, `delegate_queued_${targetNode.machine_id}`).run();

      return new Response(JSON.stringify({
        status: 'queued',
        work_id: workId,
        delegated_to: targetNode.machine_id,
        device_name: targetNode.machine_name,
        method: 'polling',
        message: 'Task queued — device will pick up on next poll cycle (~5s)'
      }), { status: 202, headers });
    }

    // GET /api/agent/delegations/:work_id — check delegation status
    if (path.startsWith('/api/agent/delegations/') && method === 'GET') {
      const workId = path.split('/').pop();
      if (!workId) {
        return new Response(JSON.stringify({ error: 'Missing work ID' }), { status: 400, headers });
      }

      const { results: [result] } = await env.DB.prepare(
        `SELECT wp.work_id, wp.status, wp.result, wp.created_at,
                pn.machine_name
         FROM proxy_pending wp
         JOIN proxy_nodes pn ON wp.machine_id = pn.machine_id
         WHERE wp.work_id = ?`
      ).bind(workId).run();

      if (!result) {
        return new Response(JSON.stringify({ error: 'Work ID not found' }), { status: 404, headers });
      }

      let responseBody = {
        work_id: result.work_id,
        status: result.status,
        device_name: result.machine_name,
        created_at: result.created_at
      };

      if (result.result) {
        try {
          responseBody.result = JSON.parse(result.result);
        } catch {
          responseBody.result = result.result;
        }
      }

      return new Response(JSON.stringify(responseBody), { status: 200, headers });
    }

    // Default: return API info
    return new Response(JSON.stringify({
      service: 'FCUK Agent API',
      version: '0.7.0',
      endpoints: {
        GET: ['/api/agent/status', '/api/agent/delegations/:work_id'],
        POST: ['/api/agent/delegate']
      }
    }), { status: 200, headers });
  } catch (e) {
    return new Response(JSON.stringify({ error: `Internal server error: ${e.message}` }), { status: 500, headers });
  }
}