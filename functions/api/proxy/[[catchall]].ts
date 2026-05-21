interface Env {
  DB: D1Database;
  OPENROUTER_API_KEY?: string;
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
    // Bare /api/proxy — dispatch by action from query param or body
    if (path === '/api/proxy' && method === 'POST') {
      const actionFromQuery = url.searchParams.get('action');
      if (actionFromQuery === 'register') return await handleRegister(request, env, headers);
      if (actionFromQuery === 'chat') return await handleSimpleChat(request, env, headers);
      if (actionFromQuery === 'heartbeat') return await handleHeartbeat(request, env, headers);
      const cloned = request.clone();
      const body = await cloned.json().catch(() => ({}));
      if (body.action === 'chat') return await handleSimpleChat(request, env, headers);
      if (body.action === 'register') return await handleRegister(request, env, headers);
      return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers });
    }

    if (path === '/api/proxy/register' && method === 'POST') {
      return await handleRegister(request, env, headers);
    }
    if (path === '/api/proxy/nodes' && method === 'GET') {
      return await handleNodes(request, env, headers);
    }
    if (path === '/api/proxy/chat' && method === 'POST') {
      return await handleSimpleChat(request, env, headers);
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
  const body = await request.json() as any;
  const machine_id = body.machine_id || body.childId;
  if (!machine_id) {
    return new Response(JSON.stringify({ error: 'machine_id or childId required' }), { status: 400, headers });
  }

  let ip_address = body.ip_address || '';
  let proxy_port = body.proxy_port || 6000;
  if (!ip_address && body.url) {
    try {
      const u = new URL(body.url);
      ip_address = u.hostname;
      proxy_port = Number(u.port) || proxy_port;
    } catch {}
  }

  const machine_name = body.machine_name || machine_id;

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
    machine_name,
    ip_address,
    proxy_port,
    body.version || ''
  ).run();

  return new Response(JSON.stringify({ ok: true, machine_id }), { status: 200, headers });
}

async function handleHeartbeat(request: Request, env: Env, headers: Record<string, string>): Promise<Response> {
  const body = await request.json() as { childId?: string; load?: number; machine_id?: string };
  const machineId = body.childId || body.machine_id;
  if (machineId) {
    await env.DB.prepare(
      `UPDATE proxy_nodes SET last_seen = datetime('now') WHERE machine_id = ?`
    ).bind(machineId).run();
  }
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
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

async function handleSimpleChat(request: Request, env: Env, headers: Record<string, string>): Promise<Response> {
  const body = await request.json() as { message?: string; sessionId?: string };
  const message = body.message;
  if (!message || typeof message !== 'string') {
    return new Response(JSON.stringify({ error: 'message is required' }), { status: 400, headers });
  }

  const openrouterKey = env.OPENROUTER_API_KEY;

  if (openrouterKey) {
    try {
      const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openrouterKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://www.financecheque.uk',
          'X-Title': 'FinanceCheque UK',
        },
        body: JSON.stringify({
          model: 'openrouter/auto',
          messages: [
            { role: 'system', content: 'You are a helpful AI assistant for Finance Cheque UK. Be concise and friendly.' },
            { role: 'user', content: message },
          ],
          max_tokens: 500,
        }),
      });

      if (resp.ok) {
        const data = await resp.json() as any;
        const reply = data?.choices?.[0]?.message?.content || '';
        return new Response(JSON.stringify({ ok: true, reply }), { status: 200, headers });
      }
    } catch (e) {
      // fall through to echo
    }
  }

  return new Response(JSON.stringify({ ok: true, reply: `Echo: ${message}` }), { status: 200, headers });
}

async function routeToChildProxy(node: ProxyNode, messages: ChatMessage[], model: string, originMachineId: string): Promise<Response | null> {
  const childUrl = `http://${node.ip_address}:${node.proxy_port + 1 || 4001}/v1/chat/completions`;
  try {
    const resp = await fetch(childUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Chat-Only': 'true',
        'X-Machine-ID': originMachineId,
      },
      body: JSON.stringify({ model, messages, max_tokens: 1024 }),
      signal: AbortSignal.timeout(25000),
    });
    if (resp.ok) {
      const data = await resp.json() as any;
      if (data?.choices?.[0]?.message?.content) return data;
    }
  } catch {}
  return null;
}

async function handleChat(request: Request, env: Env, headers: Record<string, string>): Promise<Response> {
  await ensureTable(env);
  const originMachineId = request.headers.get('X-Machine-ID') || '';
  const body = await request.json() as ChatRequest;
  const messages = body.messages || [];
  const model = body.model || 'proxy-router';

  await env.DB.prepare(
    `UPDATE proxy_nodes SET last_seen = datetime('now') WHERE machine_id = ?`
  ).bind(originMachineId).run();

  const activeNodes = await env.DB.prepare(
    `SELECT machine_id, machine_name, ip_address, proxy_port, version, last_seen
     FROM proxy_nodes WHERE last_seen > datetime('now', '-1 hour')
     ORDER BY last_seen DESC`
  ).all() as { results: ProxyNode[] };
  const totalNodes = activeNodes.results?.length || 0;

  let completionContent = '';
  let routingDecision = 'direct';

  // Priority 1: route to the calling machine's own child proxy
  const callingNode = activeNodes.results?.find(n => n.machine_id === originMachineId);
  if (callingNode && messages.length > 0) {
    routingDecision = 'route_to_child';
    const childResult = await routeToChildProxy(callingNode, messages, model, originMachineId);
    if (childResult) {
      completionContent = childResult.choices?.[0]?.message?.content || '';
    }
  }

  // Priority 2: route to other active child proxies on the network
  if (!completionContent && totalNodes > 1 && messages.length > 0) {
    routingDecision = 'route_to_other_children';
    for (const node of activeNodes.results) {
      if (node.machine_id === originMachineId) continue;
      const childResult = await routeToChildProxy(node, messages, model, originMachineId);
      if (childResult) {
        completionContent = childResult.choices?.[0]?.message?.content || '';
        if (completionContent) break;
      }
    }
  }

  // Priority 3: parent proxy's own env var LLM keys (OpenRouter)
  if (!completionContent && messages.length > 0) {
    routingDecision = 'direct_openrouter';
    const openrouterKey = env.OPENROUTER_API_KEY;
    if (openrouterKey) {
      try {
        const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openrouterKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://www.financecheque.uk',
            'X-Title': 'FinanceCheque UK',
          },
          body: JSON.stringify({
            model: 'openrouter/auto',
            messages,
            max_tokens: 500,
          }),
        });
        if (resp.ok) {
          const data = await resp.json() as any;
          completionContent = data?.choices?.[0]?.message?.content || '';
        }
      } catch {}
    }
  }

  // Final fallback: echo
  if (!completionContent && messages.length > 0) {
    routingDecision = 'echo';
    const lastMsg = messages[messages.length - 1];
    const userContent = typeof lastMsg.content === 'string' ? lastMsg.content : '';
    completionContent = `Echo: ${userContent}`;
  }

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
        message: { role: 'assistant', content: completionContent || '' },
        finish_reason: 'stop',
      },
    ],
    usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
    _proxy: {
      origin_machine_id: originMachineId,
      total_nodes: totalNodes,
      chat_only: true,
      routing_decision: routingDecision,
    },
  };

  const respHeaders = { ...headers, 'X-Chat-Only': 'true' };
  return new Response(JSON.stringify(responseBody), { status: responseStatus, headers: respHeaders });
}
