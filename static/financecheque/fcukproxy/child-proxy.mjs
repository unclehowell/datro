#!/usr/bin/env node
/**
 * child-proxy.mjs — FinanceCheque child proxy (ESM, zero deps)
 *
 * Listens on PORT (default 4001) for OpenAI-compatible chat requests.
 * Routes queries through the parent proxy network with loop prevention.
 *
 * Routing logic (Boolean):
 *   Received X-Forwarded: true → use local LLM (prevents loop)
 *   Otherwise                → forward to parent proxy
 *
 * Run:
 *   node child-proxy.mjs
 *   PORT=4001 CHILD_ID=machine-id node child-proxy.mjs
 */

import http from 'http';
import urlMod from 'url';
import os from 'os';

const PARENT_URL = process.env.PARENT_URL || 'https://www.financecheque.uk';
const CHILD_ID   = process.env.CHILD_ID || process.env.MACHINE_ID || `child-${os.hostname()}`;
const PORT       = Number(process.env.PORT) || 4001;
const MACHINE_NAME = process.env.MACHINE_NAME || os.hostname();

let activeJobs = 0;

// ── Register with parent proxy ──────────────────────────────────────────
function register() {
  const body = JSON.stringify({
    childId: CHILD_ID,
    machine_id: CHILD_ID,
    machine_name: MACHINE_NAME,
    url: process.env.SELF_URL || `http://${getLocalIP()}:${PORT}`,
    proxy_port: PORT,
    version: '0.4.0',
  });
  fetch(`${PARENT_URL}/api/proxy?action=register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  }).then(r => {
    if (r.ok) console.log(`[child-proxy] Registered as ${CHILD_ID}`);
    else console.error(`[child-proxy] Registration failed: ${r.status}`);
  }).catch(e => console.error(`[child-proxy] Registration error: ${e.message}`));
}

// ── Heartbeat ───────────────────────────────────────────────────────────
function sendHeartbeat() {
  const body = JSON.stringify({
    machine_id: CHILD_ID,
    machine_name: MACHINE_NAME,
    load: activeJobs,
  });
  fetch(`${PARENT_URL}/api/proxy?action=heartbeat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  }).catch(() => {});
}

// ── Chat route: forward to parent proxy ─────────────────────────────────
async function routeToParent(messages, model) {
  const body = JSON.stringify({
    model: model || 'proxy-router',
    messages,
    max_tokens: 1024,
  });
  const resp = await fetch(`${PARENT_URL}/api/proxy/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Chat-Only': 'true',
      'X-Machine-ID': CHILD_ID,
    },
    body,
    signal: AbortSignal.timeout(25000),
  });
  if (!resp.ok) return null;
  const data = await resp.json();
  return data;
}

// ── Local LLM fallback ──────────────────────────────────────────────────
async function queryLocalLLM(messages, model) {
  const endpoints = [
    'http://localhost:6000/v1/chat/completions',
    'http://localhost:11434/v1/chat/completions',
    'http://localhost:5000/v1/chat/completions',
  ];
  for (const ep of endpoints) {
    try {
      const resp = await fetch(ep, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: model || 'local', messages, max_tokens: 1024 }),
        signal: AbortSignal.timeout(10000),
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data?.choices?.[0]?.message?.content) return data;
      }
    } catch {}
  }
  return null;
}

// ── HTTP Server ─────────────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  const parsed = urlMod.parse(req.url, true);
  const path = parsed.pathname;

  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Chat-Only, X-Forwarded, X-Machine-ID');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    res.writeHead(405);
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  if (path !== '/v1/chat/completions' && path !== '/chat') {
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Not found. Use POST /v1/chat/completions' }));
    return;
  }

  // Read body
  let bodyStr = '';
  for await (const chunk of req) bodyStr += chunk;

  let body;
  try {
    body = JSON.parse(bodyStr);
  } catch {
    res.writeHead(400);
    res.end(JSON.stringify({ error: 'Invalid JSON' }));
    return;
  }

  const messages = body.messages || [];
  const model = body.model || 'proxy-router';
  // Boolean routing flags
  const isForwarded = req.headers['x-forwarded'] === 'true';
  const isChatOnly = req.headers['x-chat-only'] === 'true';

  activeJobs++;

  try {
    let responseData;

    if (isForwarded) {
      // ── Loop prevention: forwarded request → use local LLM only ──
      console.log(`[child-proxy] Forwarded request → local LLM (${model})`);
      responseData = await queryLocalLLM(messages, model);
      if (!responseData) {
        const lastMsg = messages.length > 0 ? (typeof messages[messages.length-1].content === 'string' ? messages[messages.length-1].content : '') : '';
        responseData = {
          choices: [{ message: { role: 'assistant', content: `Echo: ${lastMsg}` }, finish_reason: 'stop' }],
        };
      }
      responseData._proxy = { forwarded: true, routed: 'local_llm' };
    } else {
      // ── Normal: route to parent proxy ──
      console.log(`[child-proxy] Routing to parent proxy (${model})`);
      responseData = await routeToParent(messages, model);
      if (!responseData) {
        // Parent unreachable → fallback to local LLM
        console.log('[child-proxy] Parent unreachable → local LLM fallback');
        responseData = await queryLocalLLM(messages, model);
        if (!responseData) {
          const lastMsg = messages.length > 0 ? (typeof messages[messages.length-1].content === 'string' ? messages[messages.length-1].content : '') : '';
          responseData = {
            choices: [{ message: { role: 'assistant', content: `Echo: ${lastMsg}` }, finish_reason: 'stop' }],
          };
        }
        responseData._proxy = { routed: 'local_fallback' };
      } else {
        responseData._proxy = { routed: 'parent_proxy' };
      }
    }

    res.writeHead(200, { 'Content-Type': 'application/json', 'X-Chat-Only': 'true' });
    res.end(JSON.stringify(responseData));
  } catch (e) {
    res.writeHead(500);
    res.end(JSON.stringify({ error: e.message }));
  } finally {
    activeJobs--;
  }
});

server.listen(PORT, () => {
  console.log(`[child-proxy] Listening on port ${PORT} (machine: ${CHILD_ID})`);
  register();
  setInterval(sendHeartbeat, 60000);
  setInterval(register, 120000); // re-register every 2 min
});

function getLocalIP() {
  const ifaces = os.networkInterfaces();
  for (const name of Object.keys(ifaces)) {
    for (const iface of ifaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) return iface.address;
    }
  }
  return '127.0.0.1';
}

// Graceful shutdown
process.on('SIGTERM', () => { console.log('[child-proxy] Shutting down'); process.exit(0); });
process.on('SIGINT', () => { console.log('[child-proxy] Shutting down'); process.exit(0); });
