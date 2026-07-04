#!/usr/bin/env node
/**
 * child-proxy.mjs — FinanceCheque child proxy (ESM, zero deps)
 *
 * Listens on PORT (default 4001) for OpenAI-compatible chat requests.
 * Implements strict routing policy with loop prevention.
 *
 * Routing Policy (Boolean Logic):
 *   C = Chat-only query  F = X-Forwarded header  A = Agentic prompt
 *   
 *   Parent Proxy Behavior:
 *     - Receives request from child proxy
 *     - Checks F header: if NOT forwarded, routes to child proxies
 *     - NEVER routes back to the child that originated the request
 *     - Chat responses come from LLM APIs (env vars on Cloudflare)
 *     - Agentic prompts routed to designated agentic child
 *   
 *   Child Proxy Behavior:
 *     - Received with F header: use local LLM ONLY (loop prevention)
 *     - Received without F: forward to parent proxy
 *     - NEVER queries parent proxy API endpoint for responses
 *     - Fallback to local LLM only after timeout/retry exhaustion
 */

import http from 'http';
import url from 'url';
import os from 'os';

const PARENT_URL = process.env.PARENT_URL || 'https://www.financecheque.uk';
const CHILD_ID = process.env.CHILD_ID || process.env.MACHINE_ID || `child-${os.hostname()}`;
const PORT = Number(process.env.PORT) || 4001;
const MACHINE_NAME = process.env.MACHINE_NAME || os.hostname();
const AGENT_ROLE = process.env.AGENT_ROLE || 'chat'; // 'chat' or 'agent'

let activeJobs = 0;
let retryCount = 0;

// ── Register with parent proxy ──────────────────────────────────────────
function register() {
  const body = JSON.stringify({
    childId: CHILD_ID,
    machine_id: CHILD_ID,
    machine_name: MACHINE_NAME,
    url: process.env.SELF_URL || `http://${getLocalIP()}:${PORT}`,
    proxy_port: PORT,
    version: '0.5.0',
    role: AGENT_ROLE
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
    role: AGENT_ROLE
  });
  fetch(`${PARENT_URL}/api/proxy?action=heartbeat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  }).catch(() => {});
}

// ── Chat route: forward to parent proxy ─────────────────────────────────
async function routeToParent(messages, model, isAgentic = false) {
  const body = JSON.stringify({
    model: model || 'proxy-router',
    messages,
    max_tokens: 1024,
    is_agentic: isAgentic,
    source_machine: CHILD_ID
  });
  const headers = {
    'Content-Type': 'application/json',
    'X-Chat-Only': 'true',
    'X-Source-Machine': CHILD_ID
  };
  if (isAgentic) headers['X-Agentic'] = 'true';
  
  try {
    const resp = await fetch(`${PARENT_URL}/api/proxy/v1/chat/completions`, {
      method: 'POST',
      headers,
      body,
      signal: AbortSignal.timeout(25000),
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    return data;
  } catch (e) {
    console.error(`[child-proxy] Parent request failed: ${e.message}`);
    return null;
  }
}

// ── Local LLM fallback (only for loop prevention or exhausted retries) ───
async function queryLocalLLM(messages, model) {
  const endpoints = [
    'http://localhost:6000/v1/chat/completions',
    'http://localhost:11434/api/chat',
    'http://localhost:5000/v1/chat/completions'
  ];
  for (const ep of endpoints) {
    try {
      const resp = await fetch(ep, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: model || 'local', messages, max_tokens: 1024, stream: false }),
        signal: AbortSignal.timeout(10000),
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data?.choices?.[0]?.message?.content || data?.message?.content) {
          return data;
        }
      }
    } catch {}
  }
  return null;
}

// ── HTTP Server ─────────────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  const parsed = url.parse(req.url, true);
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
  const isAgentic = req.headers['x-agentic'] === 'true';

  activeJobs++;
  const startTime = Date.now();

  try {
    let responseData;
    let routedTo = 'unknown';

    if (isForwarded) {
      // ── Loop prevention: forwarded request → use local LLM ONLY ──
      // This request came FROM parent proxy, must NOT go back
      console.log(`[child-proxy] FORWARDED request → local LLM ONLY (loop prevention) [${model}]`);
      responseData = await queryLocalLLM(messages, model);
      if (!responseData) {
        const lastMsg = messages.length > 0 ? (typeof messages[messages.length-1].content === 'string' ? messages[messages.length-1].content : '') : '';
        responseData = {
          choices: [{ message: { role: 'assistant', content: `Echo (local): ${lastMsg}` }, finish_reason: 'stop' }],
        };
      }
      routedTo = 'local_llm';
      responseData._proxy = { forwarded: true, routed: routedTo, loop_prevented: true };
    } else {
      // ── Normal: forward to parent proxy ──
      console.log(`[child-proxy] Routing to parent proxy [${model}] (agentic: ${isAgentic})`);
      responseData = await routeToParent(messages, model, isAgentic);
      
      if (!responseData) {
        // Parent unreachable after timeout → track retry
        retryCount++;
        console.log(`[child-proxy] Parent unreachable (attempt ${retryCount})`);
        
        // Only fallback to local LLM after retry exhaustion or long timeout
        if (retryCount >= 3) {
          console.log('[child-proxy] Retry exhausted → local LLM fallback');
          responseData = await queryLocalLLM(messages, model);
          routedTo = 'local_fallback_exhausted';
          retryCount = 0; // reset
        } else {
          // Wait for parent with timeout - don't immediately fallback
          await new Promise(r => setTimeout(r, 5000));
          responseData = await routeToParent(messages, model, isAgentic);
          if (!responseData) {
            const lastMsg = messages.length > 0 ? (typeof messages[messages.length-1].content === 'string' ? messages[messages.length-1].content : '') : '';
            responseData = {
              choices: [{ message: { role: 'assistant', content: `Timeout: ${lastMsg}` }, finish_reason: 'stop' }],
            };
            routedTo = 'timeout_no_fallback';
          }
        }
      } else {
        routedTo = 'parent_proxy';
        retryCount = 0; // reset on success
      }
      responseData._proxy = { routed: routedTo, forwarded: false };
    }

    res.writeHead(200, { 'Content-Type': 'application/json', 'X-Chat-Only': 'true' });
    res.end(JSON.stringify(responseData));
  } catch (e) {
    console.error(`[child-proxy] Error: ${e.message}`);
    res.writeHead(500);
    res.end(JSON.stringify({ error: e.message }));
  } finally {
    activeJobs--;
  }
});

server.listen(PORT, () => {
  console.log(`[child-proxy] Listening on port ${PORT} (machine: ${CHILD_ID}, role: ${AGENT_ROLE})`);
  register();
  setInterval(sendHeartbeat, 60000);
  setInterval(register, 120000); // re-register every 2 min
});

function getLocalIP() {
  const ifaces = os.networkInterfaces();
  for (const name of Object.keys(ifaces)) {
    for (const iface of ifaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) return iface.address;
    }
  }
  return '127.0.0.1';
}

// Graceful shutdown
process.on('SIGTERM', () => { console.log('[child-proxy] Shutting down'); process.exit(0); });
process.on('SIGINT', () => { console.log('[child-proxy] Shutting down'); process.exit(0); });