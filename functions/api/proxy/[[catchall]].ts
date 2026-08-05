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
  NVIDIA_API_KEY?: string;
  OLLAMA_CLOUD_API_KEY?: string;
  HF_TOKEN?: string;
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
  registered_at?: string;
  provider_info?: string;
  hermes_info?: string;
  agent_info?: string;
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

// Rate limiting store (in-memory per worker instance)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 60; // requests per minute
const RATE_LIMIT_WINDOW = 60000; // 1 minute in ms

function checkRateLimit(machineId: string): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(machineId);
  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(machineId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }
  entry.count++;
  return true;
}

// Cleanup dead nodes (older than 30 minutes without heartbeat)
async function cleanupDeadNodes(env: Env): Promise<void> {
  await env.DB.prepare(
    `DELETE FROM proxy_nodes WHERE last_seen < datetime('now', '-30 minutes')`
  ).run();
  await env.DB.prepare(
    `DELETE FROM proxy_pending WHERE status = 'in_progress' AND created_at < datetime('now', '-5 minutes')`
  ).run();
}

const FCUK_PROXY_VERSION = '0.6.0';
const PARENT_NAME = 'financecheque-uk';

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
    'Access-Control-Allow-Headers': 'Content-Type, X-Machine-ID, X-Chat-Only, X-Forwarded, X-Agentic, X-Delegate-To',
    'Content-Type': 'application/json',
  };

  if (method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  // Cleanup dead nodes periodically (every ~1000 requests, best-effort)
  cleanupDeadNodes(env).catch(() => {});

  try {
    // Health endpoint
    if (path === '/api/proxy/health' && method === 'GET') {
      return await handleHealth(env, headers);
    }
    
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
    if (path === '/api/proxy/capabilities' && method === 'GET') {
      return await handleCapabilities(request, env, headers);
    }
    if (path === '/api/proxy/poll' && method === 'GET') {
      return await handlePoll(request, env, headers);
    }
    if (path === '/api/proxy/result' && method === 'POST') {
      return await handleResult(request, env, headers);
    }
    if (path === '/api/proxy/wallet' && method === 'POST') {
      return await handleNodeWallet(request, env, headers);
    }
    if (path === '/api/proxy/wallet' && method === 'GET') {
      return await handleNodeWalletGet(request, env, headers);
    }
    if (path === '/api/proxy/ota/manifest' && method === 'GET') {
      return await handleOtaManifest(request, env, headers);
    }
    if (path === '/api/proxy/orders' && method === 'GET') {
      return await handleOrders(request, env, headers);
    }
    if (path === '/api/proxy/order/accept' && method === 'POST') {
      return await handleOrderAccept(request, env, headers);
    }
    if (path === '/api/proxy/lead' && method === 'POST') {
      return await handleLeadReport(request, env, headers);
    }
    if (path === '/api/proxy/chat' && method === 'POST') {
      return await handleSimpleChat(request, env, headers);
    }
    if (path === '/api/proxy/v1/chat/completions' && method === 'POST') {
      return await handleChat(request, env, headers);
    }
    if (path === '/api/tts' && method === 'POST') {
      return await handleTTS(request, env, headers);
    }
    if (path.startsWith('/api/video/') && method === 'GET') {
      return await handleVideoProxy(request, env, headers, path);
    }

    // ── Agent Delegation Endpoints ──────────────────────────────────────
    if (path === '/api/agent/delegate' && method === 'POST') {
      return await handleAgentDelegate(request, env, headers);
    }
    if (path === '/api/agent/status' && method === 'GET') {
      return await handleAgentStatus(env, headers);
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
      proxy_port INTEGER DEFAULT 6100,
      version TEXT DEFAULT '',
      last_seen TEXT DEFAULT (datetime('now')),
      registered_at TEXT DEFAULT (datetime('now')),
      url TEXT DEFAULT '',
      avg_response_ms REAL DEFAULT 1000,
      total_requests INTEGER DEFAULT 0,
      provider_info TEXT DEFAULT '{}',
      hermes_info TEXT DEFAULT '{}',
      agent_info TEXT DEFAULT '{}'
    )`
  ).run();
  // Migrate existing tables: add columns that may not exist, ignore if already present
  const migrates = [
    "ALTER TABLE proxy_nodes ADD COLUMN provider_info TEXT DEFAULT '{}'",
    "ALTER TABLE proxy_nodes ADD COLUMN hermes_info TEXT DEFAULT '{}'",
    "ALTER TABLE proxy_nodes ADD COLUMN agent_info TEXT DEFAULT '{}'",
  ];
  for (const sql of migrates) {
    try { await env.DB.prepare(sql).run(); } catch {}
  }
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
  // Node wallets (per child-proxy earnings)
  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS node_wallets (
      wallet_id TEXT PRIMARY KEY,
      machine_id TEXT NOT NULL UNIQUE,
      balance INTEGER NOT NULL DEFAULT 0,
      total_earned INTEGER NOT NULL DEFAULT 0,
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )`
  ).run();
  // Orders (buyer lead orders with escrow)
  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      target_url TEXT NOT NULL,
      budget_credits INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      lead_value INTEGER NOT NULL,
      status TEXT DEFAULT 'escrowed',
      escrow_balance INTEGER NOT NULL DEFAULT 0,
      campaign_prompt TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    )`
  ).run();
  // Leads (attributed results from swarm campaigns)
  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      machine_id TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'pending',
      source TEXT DEFAULT '',
      value INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    )`
  ).run();
  // Disbursements (wallet payout ledger per node)
  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS disbursements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      wallet_id TEXT NOT NULL,
      order_id INTEGER NOT NULL,
      amount INTEGER NOT NULL,
      reason TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    )`
  ).run();
  // OAuth tokens (connected platforms)
  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS oauth_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      machine_id TEXT NOT NULL,
      platform TEXT NOT NULL,
      access_token TEXT,
      refresh_token TEXT,
      expires_at TEXT DEFAULT '',
      scope TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      UNIQUE (machine_id, platform)
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

  // Rate limiting check
  if (!checkRateLimit(machine_id)) {
    return new Response(JSON.stringify({ error: 'Rate limit exceeded. Max 60 registrations/heartbeats per minute.' }), { status: 429, headers });
  }

  let ip_address = body.ip_address || '';
  let proxy_port = body.proxy_port || 4001;
  if (!ip_address && body.url) {
    try {
      const u = new URL(body.url);
      ip_address = u.hostname;
      proxy_port = Number(u.port) || proxy_port;
    } catch {}
  }

  const machine_name = body.machine_name || machine_id;
  const nodeUrl = body.url || '';
  const version = body.version || 'unknown';
  const provider_info = body.provider_info || '{}';
  const hermes_info = body.hermes_info || '{}';
  const agent_info = body.agent_info || '{}';

  // Validate version format
  if (version && !/^[\d.]+$/.test(version)) {
    console.warn(`Invalid version format from ${machine_id}`);
  }

  await env.DB.prepare(
    `INSERT INTO proxy_nodes (machine_id, machine_name, ip_address, proxy_port, version, url, provider_info, hermes_info, agent_info, last_seen, registered_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
     ON CONFLICT(machine_id) DO UPDATE SET
       machine_name = excluded.machine_name,
       ip_address = excluded.ip_address,
       proxy_port = excluded.proxy_port,
       version = excluded.version,
       url = excluded.url,
       provider_info = excluded.provider_info,
       hermes_info = excluded.hermes_info,
       agent_info = excluded.agent_info,
       last_seen = datetime('now')`
  ).bind(
    machine_id,
    machine_name,
    ip_address,
    proxy_port,
    version,
    nodeUrl,
    provider_info,
    hermes_info,
    agent_info
  ).run();

  return new Response(JSON.stringify({ ok: true, machine_id, version: FCUK_PROXY_VERSION }), { status: 200, headers });
}

async function handleHeartbeat(request: Request, env: Env, headers: Record<string, string>): Promise<Response> {
  const body = await request.json() as { childId?: string; load?: number; machine_id?: string; machine_name?: string; url?: string };
  const machineId = body.childId || body.machine_id;
  
  if (!machineId) {
    return new Response(JSON.stringify({ error: 'machine_id or childId required' }), { status: 400, headers });
  }

  // Rate limiting check
  if (!checkRateLimit(machineId)) {
    return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), { status: 429, headers });
  }

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
  
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
}

async function handleHealth(env: Env, headers: Record<string, string>): Promise<Response> {
  await ensureTable(env);
  
  // Cleanup dead nodes on health check
  await env.DB.prepare(
    `DELETE FROM proxy_nodes WHERE last_seen < datetime('now', '-2 hours')`
  ).run();
  
  const { results: nodes } = await env.DB.prepare(
    `SELECT machine_id, machine_name, ip_address, proxy_port, version, url, last_seen,
            provider_info, hermes_info, agent_info
     FROM proxy_nodes
     WHERE last_seen > datetime('now', '-1 hour')
     ORDER BY last_seen DESC`
  ).all() as { results: ProxyNode[] };
  
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
    total_node: nodes.length,
    nodes: nodesWithStatus,
  }), { status: 200, headers });
}

async function handleNodes(request: Request, env: Env, headers: Record<string, string>): Promise<Response> {
  await ensureTable(env);
  const { results } = await env.DB.prepare(
    `SELECT machine_id, machine_name, ip_address, proxy_port, version, url, last_seen,
            provider_info, hermes_info, agent_info
     FROM proxy_nodes
     WHERE last_seen > datetime('now', '-1 hour')
     ORDER BY last_seen DESC`
  ).all() as { results: ProxyNode[] };

  return new Response(JSON.stringify(results), { status: 200, headers });
}

async function handleCapabilities(request: Request, env: Env, headers: Record<string, string>): Promise<Response> {
  await ensureTable(env);
  const url = new URL(request.url);
  const machineId = url.searchParams.get('machine_id');

  if (machineId) {
    const node = await env.DB.prepare(
      `SELECT machine_id, machine_name, version, provider_info, hermes_info, agent_info
       FROM proxy_nodes WHERE machine_id = ?`
    ).bind(machineId).first() as ProxyNode | null;
    if (!node) {
      return new Response(JSON.stringify({ error: 'Node not found' }), { status: 404, headers });
    }
    return new Response(JSON.stringify({
      machine_id: node.machine_id,
      machine_name: node.machine_name,
      version: node.version,
      providers: node.provider_info ? JSON.parse(node.provider_info) : [],
      hermes: node.hermes_info ? JSON.parse(node.hermes_info) : null,
      agents: node.agent_info ? JSON.parse(node.agent_info) : null,
    }), { status: 200, headers });
  }

  // No machine_id: return all nodes' capabilities
  const { results } = await env.DB.prepare(
    `SELECT machine_id, machine_name, version, provider_info, hermes_info, agent_info
     FROM proxy_nodes
     WHERE last_seen > datetime('now', '-1 hour')`
  ).all() as { results: ProxyNode[] };

  const capabilities = results.map(n => ({
    machine_id: n.machine_id,
    machine_name: n.machine_name,
    version: n.version,
    providers: n.provider_info ? JSON.parse(n.provider_info) : [],
    hermes: n.hermes_info ? JSON.parse(n.hermes_info) : null,
    agents: n.agent_info ? JSON.parse(n.agent_info) : null,
  }));

  return new Response(JSON.stringify(capabilities), { status: 200, headers });
}

async function handlePoll(request: Request, env: Env, headers: Record<string, string>): Promise<Response> {
  await ensureTable(env);
  const url = new URL(request.url);
  const machineId = url.searchParams.get('machine_id');
  if (!machineId) {
    return new Response(JSON.stringify({ error: 'machine_id required' }), { status: 400, headers });
  }
  
  // Rate limiting check
  if (!checkRateLimit(machineId)) {
    return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), { status: 429, headers });
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

async function handleVideoInterception(videoContent: string, env: Env): Promise<any> {
  try {
    const jsonStr = videoContent.replace(/^VIDEO:\s*/, '').trim();
    const spec = JSON.parse(jsonStr);

    // Find a video-capable child node and POST to its /api/video/render
    const { results: nodes } = await env.DB.prepare(
      `SELECT machine_id, machine_name, ip_address, proxy_port, url FROM proxy_nodes ORDER BY avg_response_ms ASC, last_seen DESC`
    ).all() as { results: ProxyNode[] };

    for (const node of nodes) {
      const childUrl = node.url || `http://${node.ip_address}:${node.proxy_port || 6100}/api/video/render`;
      if (!childUrl || childUrl.includes('0.0.0.0')) continue;

      try {
        const resp = await fetch(childUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(spec),
          signal: AbortSignal.timeout(30000),
        });
        if (resp.ok) {
          const result = await resp.json() as any;
          const videoUrl = result.videoUrl;
          if (videoUrl) {
            // Route through parent proxy so browser can access
            const filename = videoUrl.split('/').pop() || videoUrl.replace(/^.*\//, '');
            const proxyUrl = `/api/video/${node.machine_id}/${filename}`;
            return {
              ok: true,
              reply: 'Video rendered successfully.',
              videoUrl: proxyUrl,
              _breadcrumb: `🌐 ${PARENT_NAME} > 🖥️ ${node.machine_name || 'child'} > 📹 video render`,
              _source: 'video:local',
              _proxy: { routed: true, routing: 'child_proxy' }
            };
          }
        }
      } catch {}
    }
  } catch {}
  return null;
}

async function handleTTS(request: Request, env: Env, headers: Record<string, string>): Promise<Response> {
  const body = await request.json() as { text?: string; voice?: string; speed?: number; target_machine?: string };
  const text = body.text;
  if (!text || typeof text !== 'string') {
    return new Response(JSON.stringify({ error: 'text is required' }), { status: 400, headers });
  }
  const voice = body.voice || 'am_michael';
  const speed = body.speed || 1.0;
  const targetMachine = body.target_machine;

  // Find a child proxy to handle TTS
  let query = `SELECT machine_id, machine_name, ip_address, proxy_port, url
    FROM proxy_nodes WHERE last_seen > datetime('now', '-1 hour')`;
  const params: string[] = [];
  if (targetMachine) {
    query += ` AND machine_id = ?`;
    params.push(targetMachine);
  }
  query += ` ORDER BY avg_response_ms ASC, last_seen DESC LIMIT 1`;

  const { results } = await (params.length > 0
    ? env.DB.prepare(query).bind(...params)
    : env.DB.prepare(query)
  ).all() as { results: any[] };

  if (!results || results.length === 0) {
    return new Response(JSON.stringify({ error: 'No child proxy available for TTS' }), { status: 503, headers });
  }

  const node = results[0];
  const childUrl = node.url || `http://${node.ip_address}:${node.proxy_port || 6100}/tts`;

  try {
    const resp = await fetch(childUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voice, speed, as_base64: true }),
      signal: AbortSignal.timeout(30000),
    });
    if (resp.ok) {
      const data = await resp.json() as any;
      return new Response(JSON.stringify({
        ok: true,
        audio: data.audio,
        format: data.format || 'wav',
        _tts: { node: node.machine_name || node.machine_id, voice },
      }), { status: 200, headers });
    }
  } catch (e) {}

  return new Response(JSON.stringify({ error: 'TTS failed' }), { status: 502, headers });
}

async function handleVideoProxy(request: Request, env: Env, headers: Record<string, string>, path: string): Promise<Response> {
  // /api/video/{machine_id}/{filename}
  const parts = path.replace('/api/video/', '').split('/');
  if (parts.length < 2) {
    return new Response(JSON.stringify({ error: 'Invalid video path' }), { status: 400, headers });
  }
  const machineId = parts[0];
  const filename = parts.slice(1).join('/');

  const node = await env.DB.prepare(
    `SELECT machine_id, ip_address, proxy_port, url FROM proxy_nodes WHERE machine_id = ?`
  ).bind(machineId).first() as any;

  if (!node) {
    return new Response(JSON.stringify({ error: 'Node not found' }), { status: 404, headers });
  }

  const childUrl = `${node.url || `http://${node.ip_address}:${node.proxy_port || 6100}`}/api/video/${filename}`;
  try {
    const resp = await fetch(childUrl, { signal: AbortSignal.timeout(15000) });
    if (resp.ok) {
      const contentType = resp.headers.get('Content-Type') || 'video/mp4';
      return new Response(resp.body, {
        status: 200,
        headers: { 'Content-Type': contentType, 'Cache-Control': 'public, max-age=3600' },
      });
    }
  } catch {}
  return new Response('Video not found', { status: 404 });
}

async function handleSimpleChat(request: Request, env: Env, headers: Record<string, string>): Promise<Response> {
  const body = await request.json() as { message?: string; sessionId?: string; chat_only?: boolean; action?: string; target_machine?: string };
  const message = body.message;
  if (!message || typeof message !== 'string') {
    return new Response(JSON.stringify({ error: 'message is required' }), { status: 400, headers });
  }

  const isChatOnly = request.headers.get('X-Chat-Only') === 'true' || body.chat_only === true;
  const isForwarded = request.headers.get('X-Forwarded') === 'true';
  const targetMachine = body.target_machine;

  if (isForwarded) {
    const reply = await tryParentLlm(message, env);
    if (reply) {
      return new Response(JSON.stringify({ ok: true, reply, _proxy: { forwarded: true, routing: 'direct_llm' } }), { status: 200, headers });
    }
    return new Response(JSON.stringify({ ok: true, reply: `Echo: ${message}` }), { status: 200, headers });
  }

  if (isChatOnly) {
    const childResult = await routeSimpleChatToChild(message, env, targetMachine);
    if (childResult) {
      // Check for VIDEO: prefix in response
      if (childResult.content.startsWith('VIDEO:')) {
        const videoResult = await handleVideoInterception(childResult.content, env);
        if (videoResult) {
          return new Response(JSON.stringify(videoResult), { status: 200, headers });
        }
      }
      return new Response(JSON.stringify({
        ok: true,
        reply: childResult.content,
        _breadcrumb: childResult.breadcrumb,
        _source: childResult.source,
        _proxy: { routed: true, routing: 'child_proxy' }
      }), { status: 200, headers });
    }
  }

  const reply = await tryParentLlm(message, env);
  if (reply) {
    // Check for VIDEO: prefix in parent LLM response
    if (reply.startsWith('VIDEO:')) {
      const videoResult = await handleVideoInterception(reply, env);
      if (videoResult) {
        return new Response(JSON.stringify(videoResult), { status: 200, headers });
      }
    }
    return new Response(JSON.stringify({ ok: true, reply, _proxy: { routing: 'direct_llm' } }), { status: 200, headers });
  }

  return new Response(JSON.stringify({ ok: true, reply: `Echo: ${message}` }), { status: 200, headers });
}

async function tryParentLlm(message: string, env: Env): Promise<string | null> {
  const hasAnyKey = Object.values(env).some(v => v && typeof v === 'string' && v.length > 10);
  if (!hasAnyKey) {
    return null;
  }
  
  const providers: Array<{
    key?: string;
    url: string;
    getBody: (msg: string) => any;
    headers?: (k: string) => Record<string, string>;
    parseReply: (data: any) => string;
    keyInQuery?: boolean;
  }> = [
    {
      key: env.GROQ_API_KEY,
      url: 'https://api.groq.com/openai/v1/chat/completions',
      getBody: (msg) => ({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'system', content: 'You are a helpful AI assistant for Finance Cheque UK. Be concise. When the user asks to create, make, or generate a video, respond with a JSON object prefixed by "VIDEO: ". Format: VIDEO: {"composition":"TextAnimation","duration":3,"props":{"text":"<text>","bgColor":"#1a1a2e","textColor":"#ffffff","animation":"bounce"}}. Available: TextAnimation, Beach, Gradient. Duration: 1-10 seconds.' }, { role: 'user', content: msg }],
        max_tokens: 600,
      }),
      headers: (k) => ({ 'Authorization': `Bearer ${k}`, 'Content-Type': 'application/json' }),
      parseReply: (d) => d?.choices?.[0]?.message?.content || '',
    },
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
    {
      key: env.GEMINI_API_KEY,
      url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
      getBody: (msg) => ({ contents: [{ parts: [{ text: msg }] }] }),
      keyInQuery: true,
      parseReply: (d) => d?.candidates?.[0]?.content?.parts?.[0]?.text || '',
    },
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
    {
      key: env.TOGETHER_API_KEY,
      url: 'https://api.together.xyz/v1/chat/completions',
      getBody: (msg) => ({
        model: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
        messages: [{ role: 'user', content: msg }],
        max_tokens: 500,
      }),
      headers: (k) => ({ 'Authorization': `Bearer ${k}`, 'Content-Type': 'application/json' }),
      parseReply: (d) => d?.choices?.[0]?.message?.content || '',
    },
    {
      key: env.PERPLEXITY_API_KEY,
      url: 'https://api.perplexity.ai/chat/completions',
      getBody: (msg) => ({
        model: 'sonar-small-chat',
        messages: [{ role: 'user', content: msg }],
        max_tokens: 500,
      }),
      headers: (k) => ({ 'Authorization': `Bearer ${k}`, 'Content-Type': 'application/json' }),
      parseReply: (d) => d?.choices?.[0]?.message?.content || '',
    },
    {
      key: env.NVIDIA_API_KEY,
      url: 'https://integrate.api.nvidia.com/v1/chat/completions',
      getBody: (msg) => ({
        model: 'meta/llama-3.3-70b-instruct',
        messages: [{ role: 'user', content: msg }],
        max_tokens: 500,
      }),
      headers: (k) => ({ 'Authorization': `Bearer ${k}`, 'Content-Type': 'application/json' }),
      parseReply: (d) => d?.choices?.[0]?.message?.content || '',
    },
    {
      key: env.OLLAMA_CLOUD_API_KEY,
      url: 'https://ollama.com/api/chat',
      getBody: (msg) => ({
        model: 'llama3.3:70b',
        messages: [{ role: 'user', content: msg }],
        stream: false,
      }),
      headers: (k) => ({ 'Authorization': `Bearer ${k}`, 'Content-Type': 'application/json' }),
      parseReply: (d) => d?.message?.content || d?.choices?.[0]?.message?.content || '',
    },
    {
      key: env.HF_TOKEN,
      url: 'https://router.huggingface.co/v1/chat/completions',
      getBody: (msg) => ({
        model: 'HuggingFaceH4/zephyr-7b-beta',
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
    } catch (e) {}
  }
  return null;
}

async function routeSimpleChatToChild(message: string, env: Env, targetMachine?: string): Promise<{ content: string; breadcrumb: string; source: string } | null> {
  try {
    let query = `SELECT machine_id, machine_name, ip_address, proxy_port, version, url, last_seen,
              COALESCE(avg_response_ms, 1000) as avg_response_ms
       FROM proxy_nodes
       WHERE last_seen > datetime('now', '-1 hour')`;
    const params: string[] = [];
    if (targetMachine) {
      query += ` AND machine_id = ?`;
      params.push(targetMachine);
    }
    query += ` ORDER BY avg_response_ms ASC, last_seen DESC`;
    const { results } = await (params.length > 0
      ? env.DB.prepare(query).bind(...params)
      : env.DB.prepare(query)
    ).all() as { results: any[] };
    if (!results || results.length === 0) return null;
    const messages = [
      { role: 'system', content: 'You are a helpful AI assistant for Finance Cheque UK. Be concise and friendly. When the user asks to create, make, or generate a video, respond with a JSON object prefixed by "VIDEO: ". Format: VIDEO: {"composition":"TextAnimation","duration":3,"props":{"text":"<text>","bgColor":"#1a1a2e","textColor":"#ffffff","animation":"bounce"}}. Available: TextAnimation, Beach, Gradient. Duration: 1-10 seconds.' },
      { role: 'user', content: message },
    ];

    // Phase 1: Try direct fetch to all children, track failures for polling
    const failedNodes: any[] = [];
    for (const node of results) {
      const childUrl = node.url || `http://${node.ip_address}:${node.proxy_port || 4001}/v1/chat/completions`;
      if (!childUrl || childUrl === 'http://:4001' || childUrl === 'http://' || childUrl.includes('0.0.0.0')) {
        failedNodes.push(node);
        continue;
      }
      const childLabel = node.machine_name || node.machine_id?.slice(0, 12) || 'child';
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
          signal: AbortSignal.timeout(8000),
        });
        if (resp.ok) {
          const data = await resp.json() as any;
          const content = data?.choices?.[0]?.message?.content || data?.reply || '';
          if (content) {
            const childBreadcrumb = data?._breadcrumb || '';
            const childSource = data?._source || '';
            const breadcrumb = `🌐 ${PARENT_NAME} > 🖥️ ${childLabel} > ${childBreadcrumb}`;
            return { content, breadcrumb, source: childSource };
          }
        }
      } catch {}
      failedNodes.push(node);
    }

    // Phase 2: Poll for results from all nodes that failed in Phase 1
    for (const node of failedNodes) {

      const childLabel = node.machine_name || node.machine_id?.slice(0, 12) || 'child';
      const workId = await queueWorkForNode(env, node.machine_id, {
        model: 'proxy-router',
        messages,
        max_tokens: 500,
      });

      // Poll for result (child polls every 2s, allow up to 20s)
      const deadline = Date.now() + 20000;
      while (Date.now() < deadline) {
        await new Promise(r => setTimeout(r, 2000));
        const pending = await env.DB.prepare(
          `SELECT status, result FROM proxy_pending WHERE work_id = ?`
        ).bind(workId).first() as any;
        if (pending && pending.status === 'completed' && pending.result) {
          const result = JSON.parse(pending.result);
          const content = result?.choices?.[0]?.message?.content || result?.reply || '';
          if (content) {
            const childBreadcrumb = result?._breadcrumb || '';
            const childSource = result?._source || '';
            const breadcrumb = `🌐 ${PARENT_NAME} > 🖥️ ${childLabel} > ${childBreadcrumb}`;
            return { content, breadcrumb, source: childSource };
          }
          break;
        }
        if (pending && pending.status === 'failed') break;
      }
    }
  } catch {}
  return null;
}

async function routeToChildProxy(node: ProxyNode, messages: ChatMessage[], model: string, originMachineId: string, env?: Env): Promise<{ content: string; timeMs: number; breadcrumb: string } | null> {
  const childUrl = node.url || `http://${node.ip_address}:${node.proxy_port || 4001}/v1/chat/completions`;
  const isUnreachable = !childUrl || childUrl === 'http://:4001' || childUrl === 'http://' || childUrl.includes('0.0.0.0');

  if (!isUnreachable) {
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
        signal: AbortSignal.timeout(15000),
      });
      const timeMs = Date.now() - start;
      if (resp.ok) {
        const data = await resp.json() as any;
        const content = data?.choices?.[0]?.message?.content || '';
        if (content) {
          if (env) {
            await env.DB.prepare(
              `UPDATE proxy_nodes SET avg_response_ms = COALESCE((avg_response_ms * total_requests + ?) / (total_requests + 1), ?), total_requests = COALESCE(total_requests, 0) + 1 WHERE machine_id = ?`
            ).bind(timeMs, timeMs, node.machine_id).run().catch(() => {});
          }
          const childBreadcrumb = data?._breadcrumb || '';
          const breadcrumb = `🌐 ${PARENT_NAME} > 🖥️ ${node.machine_name || node.machine_id?.slice(0, 12) || 'child'} > ${childBreadcrumb}`;
          return { content, timeMs, breadcrumb };
        }
      }
      if (env) {
        await env.DB.prepare(
          `UPDATE proxy_nodes SET avg_response_ms = COALESCE((avg_response_ms * total_requests + ?) / (total_requests + 1), ?), total_requests = COALESCE(total_requests, 0) + 1 WHERE machine_id = ?`
        ).bind(timeMs, timeMs, node.machine_id).run().catch(() => {});
      }
    } catch {
      const timeMs = Date.now() - start;
      if (env) {
        await env.DB.prepare(
          `UPDATE proxy_nodes SET avg_response_ms = COALESCE((avg_response_ms * total_requests + ?) / (total_requests + 1), ?), total_requests = COALESCE(total_requests, 0) + 1 WHERE machine_id = ?`
        ).bind(30000, 30000, node.machine_id).run().catch(() => {});
      }
    }
  }

  // Phase 2: For NAT'd nodes, queue work via polling and wait for result
  if (env && node.machine_id !== originMachineId) {
    try {
      const workId = await queueWorkForNode(env, node.machine_id, { model, messages, max_tokens: 1024 });
      const deadline = Date.now() + 20000;
      while (Date.now() < deadline) {
        await new Promise(r => setTimeout(r, 2000));
        const pending = await env.DB.prepare(
          `SELECT status, result FROM proxy_pending WHERE work_id = ?`
        ).bind(workId).first() as any;
        if (pending && pending.status === 'completed' && pending.result) {
          const result = JSON.parse(pending.result);
          const content = result?.choices?.[0]?.message?.content || result?.reply || '';
          const childBreadcrumb = result?._breadcrumb || '';
          const breadcrumb = `🌐 ${PARENT_NAME} > 🖥️ ${node.machine_name || node.machine_id?.slice(0, 12) || 'child'} > ${childBreadcrumb}`;
          return { content, timeMs: Date.now() - (deadline - 20000), breadcrumb };
          break;
        }
        if (pending && pending.status === 'failed') break;
      }
    } catch {}
  }
  return null;
}

async function handleChat(request: Request, env: Env, headers: Record<string, string>): Promise<Response> {
  await ensureTable(env);
  const originMachineId = request.headers.get('X-Machine-ID') || '';
  const isForwarded = request.headers.get('X-Forwarded') === 'true';
  const isChatOnly = request.headers.get('X-Chat-Only') === 'true';
  const isAgentic = request.headers.get('X-Agentic') === 'true';
  const body = await request.json() as ChatRequest;
  const messages = body.messages || [];
  const model = body.model || 'proxy-router';

  // Update last_seen if we have an origin machine
  if (originMachineId) {
    await env.DB.prepare(
      `UPDATE proxy_nodes SET last_seen = datetime('now') WHERE machine_id = ?`
    ).bind(originMachineId).run();
  }

  if (isForwarded) {
    let completionContent = '';
    let routingDecision = 'forwarded_direct_llm';

    const lastMsg = messages.length > 0 && typeof messages[messages.length - 1].content === 'string' ? messages[messages.length - 1].content : '';
    if (lastMsg) {
      const reply = await tryParentLlm(lastMsg, env);
      if (reply) completionContent = reply;
    }

    if (!completionContent) {
      routingDecision = 'forwarded_echo';
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
  let childBreadcrumb = '';

  const callingNode = activeNodes.results?.find(n => n.machine_id === originMachineId);
  if (callingNode && messages.length > 0) {
    routingDecision = 'route_to_calling_child';
    const childResult = await routeToChildProxy(callingNode, messages, model, originMachineId, env);
    if (childResult) {
      completionContent = childResult.content;
      childBreadcrumb = childResult.breadcrumb;
    }
  }

  if (!completionContent && totalNodes > 1 && messages.length > 0) {
    routingDecision = 'route_to_other_children';
    for (const node of activeNodes.results) {
      if (node.machine_id === originMachineId) continue;
      const childResult = await routeToChildProxy(node, messages, model, originMachineId, env);
      if (childResult) {
        completionContent = childResult.content;
        childBreadcrumb = childResult.breadcrumb;
        if (completionContent) break;
      }
    }
    if (!completionContent) pollingQueued = true;
  }

  if (!completionContent && messages.length > 0) {
    routingDecision = 'direct_llm';
    const lastMsg = typeof messages[messages.length - 1].content === 'string' ? messages[messages.length - 1].content : '';
    if (lastMsg) {
      const reply = await tryParentLlm(lastMsg, env);
      if (reply) completionContent = reply;
    }
  }

  if (!completionContent && messages.length > 0) {
    routingDecision = pollingQueued ? 'polling_queued' : 'echo';
    const lastMsg = messages[messages.length - 1];
    const userContent = typeof lastMsg.content === 'string' ? lastMsg.content : '';
    completionContent = `Echo: ${userContent}`;
  }

  // VIDEO: interception — check if response contains VIDEO: prefix
  if (completionContent.startsWith('VIDEO:')) {
    const videoResult = await handleVideoInterception(completionContent, env);
    if (videoResult) {
      await env.DB.prepare(
        `INSERT INTO proxy_logs (origin_machine_id, endpoint, model, response_status, routing_decision, created_at)
         VALUES (?, ?, ?, ?, ?, datetime('now'))`
      ).bind(originMachineId, 'v1/chat/completions', model, 200, 'video_render').run();

      return new Response(JSON.stringify({
        id: `chatcmpl-${Date.now()}`,
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model,
        choices: [{ index: 0, message: { role: 'assistant', content: videoResult.reply }, finish_reason: 'stop' }],
        usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
        videoUrl: videoResult.videoUrl,
        _breadcrumb: videoResult._breadcrumb,
        _source: videoResult._source,
        _proxy: { origin_machine_id: originMachineId, routing_decision: 'video_render', chat_only: true },
      }), { status: 200, headers });
    }
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
      child_breadcrumb: childBreadcrumb || undefined,
    },
  };

  const respHeaders = { ...headers, 'X-Chat-Only': 'true' };
  return new Response(JSON.stringify(responseBody), { status: responseStatus, headers: respHeaders });
}

// ── Agent Delegation: route a task to a specific child proxy ─────────────
async function handleAgentDelegate(request: Request, env: Env, headers: Record<string, string>): Promise<Response> {
  await ensureTable(env);
  const body = await request.json() as any;
  const { task, target_device, timeout_sec = 300, context = {} } = body;

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
    // Auto-select: find least loaded node that isn't the caller
    const callerId = request.headers.get('X-Machine-ID') || '';
    targetNode = await env.DB.prepare(
      `SELECT * FROM proxy_nodes WHERE machine_id != ? AND last_seen > datetime('now', '-1 hour')
       ORDER BY avg_response_ms ASC, last_seen DESC LIMIT 1`
    ).bind(callerId).first();
  }

  if (!targetNode) {
    return new Response(JSON.stringify({ error: 'No suitable agent node available', available_nodes: [] }), { status: 503, headers });
  }

  const nodeUrl = targetNode.url || `http://${targetNode.ip_address}:${targetNode.proxy_port || 4001}`;
  
  try {
    const resp = await fetch(`${nodeUrl}/v1/agent/delegate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task, context, timeout_sec }),
      signal: AbortSignal.timeout((timeout_sec + 30) * 1000),
    });

    const result = await resp.json();
    
    // Log the delegation
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

// ── Agent Status: list available agents and capabilities ─────────────────
async function handleAgentStatus(env: Env, headers: Record<string, string>): Promise<Response> {
  await ensureTable(env);
  const { results: nodes } = await env.DB.prepare(
    `SELECT machine_id, machine_name, version, last_seen, url, ip_address, proxy_port
     FROM proxy_nodes WHERE last_seen > datetime('now', '-1 hour')
     ORDER BY last_seen DESC`
  ).all();

  const agents = await Promise.all(nodes.map(async (n: any) => {
    const nodeUrl = n.url || `http://${n.ip_address}:${n.proxy_port || 4001}`;
    try {
      const resp = await fetch(`${nodeUrl}/v1/agent/status`, {
        signal: AbortSignal.timeout(5000),
      });
      if (resp.ok) return await resp.json();
    } catch {}
    return { machine_id: n.machine_id, role: 'unknown', capabilities: {}, version: n.version };
  }));

  return new Response(JSON.stringify({ agents, total: agents.length }), { status: 200, headers });
}

// ── Node Wallet: credit/balance for child proxies ─────────────────────────
async function ensureNodeWallet(env: Env, machineId: string): Promise<string> {
  const walletId = `node-${machineId}`;
  await env.DB.prepare(
    `INSERT OR IGNORE INTO node_wallets (wallet_id, machine_id, balance, total_earned, status)
     VALUES (?, ?, 0, 0, 'active')`
  ).bind(walletId, machineId).run();
  return walletId;
}

async function handleNodeWallet(request: Request, env: Env, headers: Record<string, string>): Promise<Response> {
  await ensureTable(env);
  const body = await request.json().catch(() => ({})) as any;
  const machineId = body.machine_id || body.childId;
  if (!machineId) return new Response(JSON.stringify({ error: 'machine_id required' }), { status: 400, headers });

  const walletId = await ensureNodeWallet(env, machineId);

  // POST credit — paid out when a node submits verified leads
  if (body.action === 'credit') {
    const amount = Number(body.amount) || 0;
    if (amount <= 0) return new Response(JSON.stringify({ error: 'amount required' }), { status: 400, headers });
    await env.DB.prepare(
      `UPDATE node_wallets SET balance = balance + ?, total_earned = total_earned + ?, updated_at = datetime('now') WHERE wallet_id = ?`
    ).bind(amount, amount, walletId).run();
  }

  // POST payout — move earned credits to a node operator wallet (withdrawal)
  if (body.action === 'payout') {
    const amount = Number(body.amount) || 0;
    const toWallet = body.to_wallet;
    if (amount <= 0) return new Response(JSON.stringify({ error: 'amount required' }), { status: 400, headers });
    const row = await env.DB.prepare('SELECT balance FROM node_wallets WHERE wallet_id = ?').bind(walletId).first() as any;
    if (!row || row.balance < amount) return new Response(JSON.stringify({ error: 'Insufficient balance' }), { status: 402, headers });
    await env.DB.prepare('UPDATE node_wallets SET balance = balance - ?, updated_at = datetime(\'now\') WHERE wallet_id = ?').bind(amount, walletId).run();
    if (toWallet) {
      await env.DB.prepare('INSERT OR IGNORE INTO wallets (wallet_id, balance, credited) VALUES (?, 0, 1)').bind(toWallet).run();
      await env.DB.prepare('UPDATE wallets SET balance = balance + ? WHERE wallet_id = ?').bind(amount, toWallet).run();
    }
  }

  const row = await env.DB.prepare('SELECT balance, total_earned, status FROM node_wallets WHERE wallet_id = ?').bind(walletId).first() as any;
  return new Response(JSON.stringify({
    wallet_id: walletId,
    machine_id: machineId,
    balance: row?.balance ?? 0,
    total_earned: row?.total_earned ?? 0,
    status: row?.status ?? 'active',
    currency: 'FCUK',
  }), { status: 200, headers });
}

async function handleNodeWalletGet(request: Request, env: Env, headers: Record<string, string>): Promise<Response> {
  await ensureTable(env);
  const url = new URL(request.url);
  const machineId = url.searchParams.get('machine_id');
  if (!machineId) return new Response(JSON.stringify({ error: 'machine_id required' }), { status: 400, headers });
  const walletId = await ensureNodeWallet(env, machineId);
  const row = await env.DB.prepare('SELECT balance, total_earned, status FROM node_wallets WHERE wallet_id = ?').bind(walletId).first() as any;
  return new Response(JSON.stringify({
    wallet_id: walletId,
    machine_id: machineId,
    balance: row?.balance ?? 0,
    total_earned: row?.total_earned ?? 0,
    status: row?.status ?? 'active',
    currency: 'FCUK',
  }), { status: 200, headers });
}

// ── OTA Manifest: served to the swarm ─────────────────────────────────────
async function handleOtaManifest(request: Request, env: Env, headers: Record<string, string>): Promise<Response> {
  await ensureTable(env);
  const url = new URL(request.url);
  const branch = url.searchParams.get('branch') || 'financecheque';
  const gh = `https://raw.githubusercontent.com/unclehowell/datro/${branch}/public/fcukproxy`;

  const manifest = {
    schema: 1,
    branch,
    updated: new Date().toISOString().slice(0, 10),
    apps: {
      'child-proxy': { version: '0.9.0', file: 'child-proxy.mjs', url: `${gh}/child-proxy.mjs`, check: 'node' },
      'agent': { version: '0.6.0', file: 'agent.py', url: `${gh}/agent.py`, check: 'python' },
      'agent-exec': { version: '1.0.0', file: 'agent-exec.sh', url: `${gh}/agent-exec.sh`, check: 'bash' },
      'campaign-exec': { version: '0.3.0', file: 'campaign-exec.sh', url: `${gh}/campaign-exec.sh`, check: 'bash' },
      'reflect': { version: '0.2.0', file: 'reflect.sh', url: `${gh}/reflect.sh`, check: 'bash' },
      'skills-leadgen': { version: '0.2.0', file: 'skills/leadgen-strategy.md', url: `${gh}/skills/leadgen-strategy.md`, check: 'text' },
      'skills-discharge': { version: '0.2.0', file: 'skills/local-agent-discharge.md', url: `${gh}/skills/local-agent-discharge.md`, check: 'text' },
    },
  };

  const respHeaders = { ...headers, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };
  return new Response(JSON.stringify(manifest, null, 2), { status: 200, headers: respHeaders });
}

// ── Orders: swarm view of escrowed lead orders ────────────────────────────
async function handleOrders(request: Request, env: Env, headers: Record<string, string>): Promise<Response> {
  await ensureTable(env);
  const url = new URL(request.url);
  const status = url.searchParams.get('status') || 'escrowed';
  const { results: orders } = await env.DB.prepare(
    `SELECT id, user_id, target_url, budget_credits, quantity, lead_value, status, escrow_balance, campaign_prompt, created_at
     FROM orders WHERE status = ? ORDER BY created_at DESC LIMIT 20`
  ).bind(status).all();
  return new Response(JSON.stringify({ orders }), { status: 200, headers });
}

async function handleOrderAccept(request: Request, env: Env, headers: Record<string, string>): Promise<Response> {
  await ensureTable(env);
  const body = await request.json().catch(() => ({})) as any;
  const orderId = Number(body.order_id);
  const machineId = body.machine_id;
  if (!orderId || !machineId) return new Response(JSON.stringify({ error: 'order_id and machine_id required' }), { status: 400, headers });

  const order = await env.DB.prepare('SELECT * FROM orders WHERE id = ?').bind(orderId).first() as any;
  if (!order) return new Response(JSON.stringify({ error: 'Order not found' }), { status: 404, headers });
  if (order.status !== 'escrowed') return new Response(JSON.stringify({ error: 'Order already claimed' }), { status: 409, headers });

  await env.DB.prepare(`UPDATE orders SET status = 'in_progress' WHERE id = ?`).bind(orderId).run();
  return new Response(JSON.stringify({ ok: true, order_id: orderId, machine_id: machineId }), { status: 200, headers });
}

// ── Lead Report: node reports a verified lead → payout to node wallet ─────
async function handleLeadReport(request: Request, env: Env, headers: Record<string, string>): Promise<Response> {
  await ensureTable(env);
  const body = await request.json().catch(() => ({})) as any;
  const orderId = Number(body.order_id);
  const machineId = body.machine_id || body.childId;
  const status = body.status || 'pending';
  const source = body.source || '';
  const value = Number(body.value) || 0;
  if (!orderId || !machineId) return new Response(JSON.stringify({ error: 'order_id and machine_id required' }), { status: 400, headers });

  const leadRes = await env.DB.prepare(
    `INSERT INTO leads (order_id, machine_id, status, source, value) VALUES (?, ?, ?, ?, ?)`
  ).bind(orderId, machineId, status, source, value).run();

  let payout = 0;
  // Verified leads pay out to the node wallet; budget is escrow
  if (status === 'verified') {
    const order = await env.DB.prepare('SELECT * FROM orders WHERE id = ?').bind(orderId).first() as any;
    if (order) {
      payout = value || Math.floor(order.lead_value);
      const walletId = await ensureNodeWallet(env, machineId);
      await env.DB.prepare(
        `UPDATE node_wallets SET balance = balance + ?, total_earned = total_earned + ?, updated_at = datetime('now') WHERE wallet_id = ?`
      ).bind(payout, payout, walletId).run();
      await env.DB.prepare(
        `INSERT INTO disbursements (wallet_id, order_id, amount, reason) VALUES (?, ?, ?, 'lead')`
      ).bind(walletId, orderId, payout).run();
      await env.DB.prepare(
        `UPDATE orders SET escrow_balance = MAX(escrow_balance - ?, 0), lead_value = ? WHERE id = ?`
      ).bind(payout, payout, orderId).run();
    }
  }

  return new Response(JSON.stringify({ ok: true, lead_id: leadRes.meta.last_row_id, payout }), { status: 200, headers });
}