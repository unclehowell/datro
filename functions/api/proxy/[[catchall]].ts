interface Env {
  DB: D1Database;
}

interface ProxyNode {
  machine_id: string;
  machine_name: string;
  ip_address: string;
  proxy_port: number;
  version: string;
  last_seen: string;
}

interface ChatMessage {
  role: string;
  content: string;
}

interface ChatRequest {
  model?: string;
  messages: ChatMessage[];
  stream?: boolean;
  [key: string]: unknown;
}

export async function onRequest(context: { request: Request; env: Env }): Promise<Response> {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  const headers: Record<string, string> = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Machine-ID, X-Chat-Only',
    'Content-Type': 'application/json',
  };

  if (method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  try {
    if (path === '/api/proxy/register' && method === 'POST') {
      return await handleRegister(request, env, headers);
    }
    if (path === '/api/proxy/nodes' && method === 'GET') {
      return await handleNodes(request, env, headers);
    }
    if (path === '/api/proxy/v1/chat/completions' && method === 'POST') {
      return await handleChat(request, env, headers);
    }
    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Internal error';
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers });
  }
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
      registered_at TEXT DEFAULT (datetime('now'))
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

async function handleRegister(request: Request, env: Env, headers: Record<string, string>): Promise<Response> {
  await ensureTable(env);
  const body = await request.json() as Partial<ProxyNode>;
  const machine_id = body.machine_id;
  if (!machine_id) {
    return new Response(JSON.stringify({ error: 'machine_id required' }), { status: 400, headers });
  }

  await env.DB.prepare(
    `INSERT INTO proxy_nodes (machine_id, machine_name, ip_address, proxy_port, version, last_seen)
     VALUES (?, ?, ?, ?, ?, datetime('now'))
     ON CONFLICT(machine_id) DO UPDATE SET
       machine_name = excluded.machine_name,
       ip_address = excluded.ip_address,
       proxy_port = excluded.proxy_port,
       version = excluded.version,
       last_seen = datetime('now')`
  ).bind(
    machine_id,
    body.machine_name || '',
    body.ip_address || '',
    body.proxy_port || 6000,
    body.version || ''
  ).run();

  return new Response(JSON.stringify({ ok: true, machine_id }), { status: 200, headers });
}

async function handleNodes(request: Request, env: Env, headers: Record<string, string>): Promise<Response> {
  await ensureTable(env);
  const { results } = await env.DB.prepare(
    `SELECT machine_id, machine_name, ip_address, proxy_port, version, last_seen
     FROM proxy_nodes
     WHERE last_seen > datetime('now', '-1 hour')
     ORDER BY last_seen DESC`
  ).all() as { results: ProxyNode[] };

  return new Response(JSON.stringify(results), { status: 200, headers });
}

async function handleChat(request: Request, env: Env, headers: Record<string, string>): Promise<Response> {
  await ensureTable(env);
  const originMachineId = request.headers.get('X-Machine-ID') || '';
  const body = await request.json() as ChatRequest;
  const messages = body.messages || [];

  await env.DB.prepare(
    `UPDATE proxy_nodes SET last_seen = datetime('now') WHERE machine_id = ?`
  ).bind(originMachineId).run();

  const nodeCount = await env.DB.prepare(
    `SELECT COUNT(*) as count FROM proxy_nodes WHERE last_seen > datetime('now', '-1 hour')`
  ).first() as { count: number };
  const totalNodes = nodeCount?.count || 0;

  const isCrossMachine = totalNodes > 1;

  const routingDecision = isCrossMachine && originMachineId ? 'route_to_child' : 'direct';

  let completionContent = '';

  if (messages.length > 0) {
    const lastMsg = messages[messages.length - 1];
    const userContent = typeof lastMsg.content === 'string' ? lastMsg.content : '';

    let viaClause = '';
    if (isCrossMachine) {
      viaClause = `\n\n[via proxy node ${originMachineId || 'unknown'}]`;
    }

    completionContent = `Echo: ${userContent}${viaClause}`;
  }

  const model = body.model || 'proxy-router';
  const responseStatus = 200;

  await env.DB.prepare(
    `INSERT INTO proxy_logs (origin_machine_id, endpoint, model, response_status, routing_decision, created_at)
     VALUES (?, ?, ?, ?, ?, datetime('now'))`
  ).bind(originMachineId, 'v1/chat/completions', model, responseStatus, routingDecision).run();

  const responseBody = {
    id: `chatcmpl-${Date.now()}`,
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model,
    choices: [
      {
        index: 0,
        message: {
          role: 'assistant',
          content: completionContent,
        },
        finish_reason: 'stop',
      },
    ],
    usage: {
      prompt_tokens: 0,
      completion_tokens: 0,
      total_tokens: 0,
    },
    _proxy: {
      origin_machine_id: originMachineId,
      total_nodes: totalNodes,
      chat_only: isCrossMachine,
      routing_decision: routingDecision,
    },
  };

  const respHeaders = { ...headers };
  if (isCrossMachine) {
    respHeaders['X-Chat-Only'] = 'true';
  }

  return new Response(JSON.stringify(responseBody), { status: responseStatus, headers: respHeaders });
}
