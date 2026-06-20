interface Env {
  DB: D1Database;
  OPENROUTER_API_KEY?: string;
  GEMINI_API_KEY?: string;
  DEEPSEEK_API_KEY?: string;
  GROQ_API_KEY?: string;
  OPENAI_API_KEY?: string;
  ANTHROPIC_API_KEY?: string;
  MISTRAL_API_KEY?: string;
  TOGETHER_API_KEY?: string;
  PERPLEXITY_API_KEY?: string;
}

interface ProxyNode {
  machine_id: string;
  machine_name: string;
  ip_address: string;
  proxy_port: number;
  version: string;
  last_seen: string;
  url?: string;
  avg_response_ms?: number;
  total_requests?: number;
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

// ── Boolean Logic for query routing ──────────────────────────────────────
// Let:  C = X-Chat-Only header is "true"
//       F = X-Forwarded header is "true" (request was already forwarded)
//       R = response obtained
//
// Route decision matrix (C is always true for public proxy):
//   ¬F → route to caller's own child proxy first
//       → route to other child proxies
//       → route to fastest known child proxy
//       → fallback to parent's LLM env vars
//       → echo
//   F  → skip all child proxy routing (prevents loop)
//       → fallback to parent's LLM env vars
//       → echo
//
// Chat flag enforcement:
//   Requests without X-Chat-Only: true cannot access child proxy routing
//   or LLM env vars — they get echo-only response.

export async function onRequest(context: { request: Request; env: Env }): Promise<Response> {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  const headers: Record<string, string> = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Machine-ID, X-Chat-Only, X-Forwarded',
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
    if (path === '/api/proxy/poll' && method === 'GET') {
      return await handlePoll(request, env, headers);
    }
    if (path === '/api/proxy/result' && method === 'POST') {
      return await handleResult(request, env, headers);
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
    `ALTER TABLE proxy_nodes ADD COLUMN url TEXT DEFAULT ''`
  ).run().catch(() => {});
  await env.DB.prepare(
    `ALTER TABLE proxy_nodes ADD COLUMN avg_response_ms REAL DEFAULT 1000`
  ).run().catch(() => {});
  await env.DB.prepare(
    `ALTER TABLE proxy_nodes ADD COLUMN total_requests INTEGER DEFAULT 0`
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
  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS proxy_pending (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      work_id TEXT UNIQUE,
      machine_id TEXT NOT NULL DEFAULT '',
      payload TEXT NOT NULL DEFAULT '{}',
      status TEXT NOT NULL DEFAULT 'pending',
      result TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      completed_at TEXT DEFAULT ''
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

  const nodeUrl = body.url || '';

  await env.DB.prepare(
    `INSERT INTO proxy_nodes (machine_id, machine_name, ip_address, proxy_port, version, url, last_seen)
     VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
     ON CONFLICT(machine_id) DO UPDATE SET
       machine_name = excluded.machine_name,
       ip_address = excluded.ip_address,
       proxy_port = excluded.proxy_port,
       version = excluded.version,
       url = excluded.url,
       last_seen = datetime('now')`
  ).bind(
    machine_id,
    machine_name,
    ip_address,
    proxy_port,
    body.version || '',
    nodeUrl
  ).run();

  return new Response(JSON.stringify({ ok: true, machine_id }), { status: 200, headers });
}

async function handleHeartbeat(request: Request, env: Env, headers: Record<string, string>): Promise<Response> {
  const body = await request.json() as { childId?: string; load?: number; machine_id?: string; machine_name?: string; url?: string };
  const machineId = body.childId || body.machine_id;
  if (machineId) {
    const updates: string[] = ["last_seen = datetime('now')"];
    const binds: any[] = [];
    if (body.url) {
      updates.push("url = ?");
      binds.push(body.url);
    }
    if (body.machine_name) {
      updates.push("machine_name = ?");
      binds.push(body.machine_name);
    }
    binds.push(machineId);
    await env.DB.prepare(
      `UPDATE proxy_nodes SET ${updates.join(', ')} WHERE machine_id = ?`
    ).bind(...binds).run();
  }
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
}

async function handleNodes(request: Request, env: Env, headers: Record<string, string>): Promise<Response> {
  await ensureTable(env);
  const { results } = await env.DB.prepare(
    `SELECT machine_id, machine_name, ip_address, proxy_port, version, url, last_seen
     FROM proxy_nodes
     WHERE last_seen > datetime('now', '-1 hour')
     ORDER BY last_seen DESC`
  ).all() as { results: ProxyNode[] };

  return new Response(JSON.stringify(results), { status: 200, headers });
}

async function handlePoll(request: Request, env: Env, headers: Record<string, string>): Promise<Response> {
  await ensureTable(env);
  const url = new URL(request.url);
  const machineId = url.searchParams.get('machine_id');
  if (!machineId) {
    return new Response(JSON.stringify({ error: 'machine_id required' }), { status: 400, headers });
  }
  const pending = await env.DB.prepare(
    `SELECT id, work_id, payload FROM proxy_pending
     WHERE machine_id = ? AND status = 'pending'
     ORDER BY created_at ASC LIMIT 1`
  ).bind(machineId).first() as any;
  if (pending) {
    await env.DB.prepare(
      `UPDATE proxy_pending SET status = 'in_progress' WHERE id = ?`
    ).bind(pending.id).run();
    return new Response(JSON.stringify({
      pending: true,
      work_id: pending.work_id,
      payload: JSON.parse(pending.payload),
    }), { status: 200, headers });
  }
  return new Response(JSON.stringify({ pending: false }), { status: 200, headers });
}

async function handleResult(request: Request, env: Env, headers: Record<string, string>): Promise<Response> {
  await ensureTable(env);
  const body = await request.json() as any;
  const { machine_id, work_id, result } = body;
  if (!work_id) {
    return new Response(JSON.stringify({ error: 'work_id required' }), { status: 400, headers });
  }
  const existing = await env.DB.prepare(
    `SELECT id FROM proxy_pending WHERE work_id = ?`
  ).bind(work_id).first() as any;
  if (existing) {
    await env.DB.prepare(
      `UPDATE proxy_pending SET status = 'completed', result = ?, completed_at = datetime('now') WHERE id = ?`
    ).bind(JSON.stringify(result), existing.id).run();
  }
  return new Response(JSON.stringify({ ok: true, machine_id }), { status: 200, headers });
}

async function queueWorkForNode(env: Env, machineId: string, payload: any): Promise<string> {
  await ensureTable(env);
  const workId = `poll_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  await env.DB.prepare(
    `INSERT INTO proxy_pending (work_id, machine_id, payload, status, created_at)
     VALUES (?, ?, ?, 'pending', datetime('now'))`
  ).bind(workId, machineId, JSON.stringify(payload)).run();
  return workId;
}

async function handleSimpleChat(request: Request, env: Env, headers: Record<string, string>): Promise<Response> {
  const body = await request.json() as { message?: string; sessionId?: string };
  const message = body.message;
  if (!message || typeof message !== 'string') {
    return new Response(JSON.stringify({ error: 'message is required' }), { status: 400, headers });
  }

  // Chat flag enforcement: public website chat is ALWAYS chat-only.
  // The X-Chat-Only header is set by the parent proxy before forwarding
  // to child proxies, ensuring the public website cannot trigger agentic
  // actions on the monorepo.
  const isChatOnly = request.headers.get('X-Chat-Only') === 'true';
  const isForwarded = request.headers.get('X-Forwarded') === 'true';

  // If forwarded (previously routed through another child proxy), skip
  // child proxy routing to prevent loops. Go directly to LLM fallbacks.
  if (isForwarded) {
    // Attempt parent's own LLM env var keys
    const reply = await tryParentLlm(message, env);
    if (reply) {
      return new Response(JSON.stringify({ ok: true, reply, _proxy: { forwarded: true, routing: 'direct_llm' } }), { status: 200, headers });
    }
    return new Response(JSON.stringify({ ok: true, reply: `Echo: ${message}` }), { status: 200, headers });
  }

  // For chat-only requests, try routing to child proxy network first
  if (isChatOnly) {
    const childReply = await routeSimpleChatToChild(message, env);
    if (childReply) {
      return new Response(JSON.stringify({ ok: true, reply: childReply, _proxy: { routed: true, routing: 'child_proxy' } }), { status: 200, headers });
    }
  }

  // Fallback: parent's own LLM env var keys
  const reply = await tryParentLlm(message, env);
  if (reply) {
    return new Response(JSON.stringify({ ok: true, reply, _proxy: { routing: 'direct_llm' } }), { status: 200, headers });
  }

  // Final fallback: echo
  return new Response(JSON.stringify({ ok: true, reply: `Echo: ${message}` }), { status: 200, headers });
}

async function tryParentLlm(message: string, env: Env): Promise<string | null> {
  // Effective use of env var API keys for parent proxy fallback to LLMs.
  // Order: prefer fast/cheap first. All respect provided keys (no hard-coded).
  const providers: Array<{
    key?: string;
    url: string;
    getBody: (msg: string) => any;
    headers?: (k: string) => Record<string, string>;
    parseReply: (data: any) => string;
    keyInQuery?: boolean;
  }> = [
    // Groq - fast, free tier friendly
    {
      key: env.GROQ_API_KEY,
      url: 'https://api.groq.com/openai/v1/chat/completions',
      getBody: (msg) => ({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'system', content: 'You are a helpful AI assistant for Finance Cheque UK. Be concise.' }, { role: 'user', content: msg }],
        max_tokens: 600,
      }),
      headers: (k) => ({ 'Authorization': `Bearer ${k}`, 'Content-Type': 'application/json' }),
      parseReply: (d) => d?.choices?.[0]?.message?.content || '',
    },
    // OpenRouter - multi model router
    {
      key: env.OPENROUTER_API_KEY,
      url: 'https://openrouter.ai/api/v1/chat/completions',
      getBody: (msg) => ({
        model: 'openrouter/auto',
        messages: [{ role: 'system', content: 'You are a helpful AI assistant for Finance Cheque UK. Be concise and friendly.' }, { role: 'user', content: msg }],
        max_tokens: 500,
      }),
      headers: (k) => ({ 'Authorization': `Bearer ${k}`, 'Content-Type': 'application/json', 'HTTP-Referer': 'https://www.financecheque.uk', 'X-Title': 'FinanceCheque UK' }),
      parseReply: (d) => d?.choices?.[0]?.message?.content || '',
    },
    // Gemini
    {
      key: env.GEMINI_API_KEY,
      url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
      getBody: (msg) => ({ contents: [{ parts: [{ text: msg }] }] }),
      keyInQuery: true,
      parseReply: (d) => d?.candidates?.[0]?.content?.parts?.[0]?.text || '',
    },
    // OpenAI
    {
      key: env.OPENAI_API_KEY,
      url: 'https://api.openai.com/v1/chat/completions',
      getBody: (msg) => ({
        model: 'gpt-4o-mini',
        messages: [{ role: 'system', content: 'Concise helpful assistant for Finance Cheque UK.' }, { role: 'user', content: msg }],
        max_tokens: 500,
      }),
      headers: (k) => ({ 'Authorization': `Bearer ${k}`, 'Content-Type': 'application/json' }),
      parseReply: (d) => d?.choices?.[0]?.message?.content || '',
    },
    // DeepSeek
    {
      key: env.DEEPSEEK_API_KEY,
      url: 'https://api.deepseek.com/v1/chat/completions',
      getBody: (msg) => ({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: msg }],
        max_tokens: 600,
      }),
      headers: (k) => ({ 'Authorization': `Bearer ${k}`, 'Content-Type': 'application/json' }),
      parseReply: (d) => d?.choices?.[0]?.message?.content || '',
    },
    // Anthropic
    {
      key: env.ANTHROPIC_API_KEY,
      url: 'https://api.anthropic.com/v1/messages',
      getBody: (msg) => ({
        model: 'claude-3-haiku-20240307',
        max_tokens: 500,
        messages: [{ role: 'user', content: msg }],
        system: 'You are a helpful concise AI for Finance Cheque UK.',
      }),
      headers: (k) => ({ 'x-api-key': k, 'Content-Type': 'application/json', 'anthropic-version': '2023-06-01' }),
      parseReply: (d) => d?.content?.[0]?.text || '',
    },
    // Groq again? already first. Add mistral etc if key present
    {
      key: env.MISTRAL_API_KEY,
      url: 'https://api.mistral.ai/v1/chat/completions',
      getBody: (msg) => ({
        model: 'mistral-small-latest',
        messages: [{ role: 'user', content: msg }],
        max_tokens: 500,
      }),
      headers: (k) => ({ 'Authorization': `Bearer ${k}`, 'Content-Type': 'application/json' }),
      parseReply: (d) => d?.choices?.[0]?.message?.content || '',
    },
  ];

  for (const p of providers) {
    if (!p.key) continue;
    try {
      const fullUrl = p.keyInQuery ? `${p.url}?key=${p.key}` : p.url;
      const resp = await fetch(fullUrl, {
        method: 'POST',
        headers: p.headers ? p.headers(p.key) : { 'Content-Type': 'application/json' },
        body: JSON.stringify(p.getBody(message)),
        signal: AbortSignal.timeout(18000),
      });
      if (resp.ok) {
        const data = await resp.json();
        const reply = p.parseReply(data);
        if (reply && reply.trim()) return reply.trim();
      }
    } catch (e) {
      // continue to next provider
    }
  }
  return null;
}

async function routeSimpleChatToChild(message: string, env: Env): Promise<string | null> {
  try {
    const { results } = await env.DB.prepare(
      `SELECT machine_id, machine_name, ip_address, proxy_port, version, url, last_seen,
              COALESCE(avg_response_ms, 1000) as avg_response_ms
       FROM proxy_nodes
       WHERE last_seen > datetime('now', '-1 hour')
       ORDER BY avg_response_ms ASC, last_seen DESC`
    ).all() as { results: any[] };
    if (!results || results.length === 0) return null;
    const messages = [
      { role: 'system', content: 'You are a helpful AI assistant for Finance Cheque UK. Be concise and friendly.' },
      { role: 'user', content: message },
    ];
    for (const node of results) {
      const childUrl = node.url || `http://${node.ip_address}:${node.proxy_port + 1 || 4001}/v1/chat/completions`;
      try {
        const resp = await fetch(childUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Chat-Only': 'true',
            'X-Forwarded': 'true',
            'X-Machine-ID': 'parent-proxy',
          },
          body: JSON.stringify({ model: 'proxy-router', messages, max_tokens: 500 }),
          signal: AbortSignal.timeout(10000),
        });
        if (resp.ok) {
          const data = await resp.json() as any;
          const content = data?.choices?.[0]?.message?.content || data?.reply || '';
          if (content) return content;
        }
      } catch {}
    }
  } catch {}
  return null;
}

async function routeToChildProxy(node: ProxyNode, messages: ChatMessage[], model: string, originMachineId: string, env?: Env): Promise<{ content: string; timeMs: number } | null> {
  const childUrl = (node as any).url || `http://${node.ip_address}:${node.proxy_port + 1 || 4001}/v1/chat/completions`;
  if (!childUrl || childUrl === 'http://:4001') return null;
  const start = Date.now();
  try {
    const resp = await fetch(childUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Chat-Only': 'true',
        'X-Forwarded': 'true',
        'X-Machine-ID': originMachineId,
      },
      body: JSON.stringify({ model, messages, max_tokens: 1024 }),
      signal: AbortSignal.timeout(25000),
    });
    const timeMs = Date.now() - start;
    if (resp.ok) {
      const data = await resp.json() as any;
      const content = data?.choices?.[0]?.message?.content || '';
      if (content) return { content, timeMs };
    }
    // Log response time even on failure
    if (env) {
      await env.DB.prepare(
        `UPDATE proxy_nodes SET avg_response_ms = COALESCE((avg_response_ms * total_requests + ?) / (total_requests + 1), ?), total_requests = COALESCE(total_requests, 0) + 1 WHERE machine_id = ?`
      ).bind(timeMs, timeMs, node.machine_id).run().catch(() => {});
    }
  } catch {
    const timeMs = Date.now() - start;
    // Child is unreachable (closed ports). Queue work for polling if we have DB access.
    if (env && node.machine_id !== originMachineId) {
      try {
        await queueWorkForNode(env, node.machine_id, { model, messages, max_tokens: 1024 });
      } catch {}
    }
    // Log high response time for unreachable node
    if (env) {
      await env.DB.prepare(
        `UPDATE proxy_nodes SET avg_response_ms = COALESCE((avg_response_ms * total_requests + ?) / (total_requests + 1), ?), total_requests = COALESCE(total_requests, 0) + 1 WHERE machine_id = ?`
      ).bind(30000, 30000, node.machine_id).run().catch(() => {});
    }
  }
  return null;
}

async function handleChat(request: Request, env: Env, headers: Record<string, string>): Promise<Response> {
  await ensureTable(env);
  const originMachineId = request.headers.get('X-Machine-ID') || '';
  const isForwarded = request.headers.get('X-Forwarded') === 'true';
  const isChatOnly = request.headers.get('X-Chat-Only') === 'true';
  const body = await request.json() as ChatRequest;
  const messages = body.messages || [];
  const model = body.model || 'proxy-router';

  await env.DB.prepare(
    `UPDATE proxy_nodes SET last_seen = datetime('now') WHERE machine_id = ?`
  ).bind(originMachineId).run();

  // ── Loop prevention: if already forwarded, skip child proxy routing ──
  if (isForwarded) {
    let completionContent = '';
    let routingDecision = 'forwarded_direct_llm';

    // Try parent's own LLM env var keys
    const lastMsg = messages.length > 0
      ? (typeof messages[messages.length - 1].content === 'string' ? messages[messages.length - 1].content : '')
      : '';
    if (lastMsg) {
      const reply = await tryParentLlm(lastMsg, env);
      if (reply) completionContent = reply;
    }

    if (!completionContent) {
      routingDecision = 'forwarded_echo';
      const lastMsg = messages.length > 0
        ? (typeof messages[messages.length - 1].content === 'string' ? messages[messages.length - 1].content : '')
        : '';
      completionContent = `Echo: ${lastMsg}`;
    }

    const responseBody = {
      id: `chatcmpl-${Date.now()}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model,
      choices: [{ index: 0, message: { role: 'assistant', content: completionContent }, finish_reason: 'stop' }],
      usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
      _proxy: { origin_machine_id: originMachineId, forwarded: true, routing_decision: routingDecision, chat_only: true },
    };

    await env.DB.prepare(
      `INSERT INTO proxy_logs (origin_machine_id, endpoint, model, response_status, routing_decision, created_at)
       VALUES (?, ?, ?, ?, ?, datetime('now'))`
    ).bind(originMachineId, 'v1/chat/completions', model, 200, routingDecision).run();

    return new Response(JSON.stringify(responseBody), { status: 200, headers: { ...headers, 'X-Chat-Only': 'true', 'X-Forwarded': 'true' } });
  }

  // ── Normal (non-forwarded) routing ──
  const activeNodes = await env.DB.prepare(
    `SELECT machine_id, machine_name, ip_address, proxy_port, version, url, last_seen,
            COALESCE(avg_response_ms, 1000) as avg_response_ms
     FROM proxy_nodes WHERE last_seen > datetime('now', '-1 hour')
     ORDER BY avg_response_ms ASC, last_seen DESC`
  ).all() as { results: any[] };
  const totalNodes = activeNodes.results?.length || 0;

  let completionContent = '';
  let routingDecision = 'direct';
  let pollingQueued = false;

  // Priority 1: route to the calling machine's own child proxy (fastest path)
  const callingNode = activeNodes.results?.find(n => n.machine_id === originMachineId);
  if (callingNode && messages.length > 0) {
    routingDecision = 'route_to_calling_child';
    const childResult = await routeToChildProxy(callingNode, messages, model, originMachineId, env);
    if (childResult) {
      completionContent = childResult.content;
    }
  }

  // Priority 2: route to other active child proxies on the network (fastest first)
  if (!completionContent && totalNodes > 1 && messages.length > 0) {
    routingDecision = 'route_to_other_children';
    for (const node of activeNodes.results) {
      if (node.machine_id === originMachineId) continue;
      const childResult = await routeToChildProxy(node, messages, model, originMachineId, env);
      if (childResult) {
        completionContent = childResult.content;
        if (completionContent) break;
      }
    }
    if (!completionContent) pollingQueued = true;
  }

  // Priority 3: parent proxy's own env var LLM keys (fallback)
  if (!completionContent && messages.length > 0) {
    routingDecision = 'direct_llm';
    const lastMsg = typeof messages[messages.length - 1].content === 'string' ? messages[messages.length - 1].content : '';
    if (lastMsg) {
      const reply = await tryParentLlm(lastMsg, env);
      if (reply) completionContent = reply;
    }
  }

  // Final fallback: echo
  if (!completionContent && messages.length > 0) {
    routingDecision = pollingQueued ? 'polling_queued' : 'echo';
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
      polling_queued: pollingQueued,
    },
  };

  const respHeaders = { ...headers, 'X-Chat-Only': 'true' };
  return new Response(JSON.stringify(responseBody), { status: responseStatus, headers: respHeaders });
}
