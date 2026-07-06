#!/usr/bin/env node
/**
 * child-proxy.mjs — FinanceCheque child proxy (ESM, zero deps)
 *
 * Listens on PORT (default 4001) for OpenAI-compatible chat requests.
 * Implements strict routing policy with loop prevention.
 *
 * Routing Policy (Boolean Logic):
 *   C = Chat-only query  F = X-Forwarded header  A = X-Agentic header
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
 *
 * Version: 0.7.0
 */

import http from 'http';
import url from 'url';
import os from 'os';

const PARENT_URL = process.env.PARENT_URL || 'https://www.financecheque.uk';
const CHILD_ID = process.env.CHILD_ID || process.env.MACHINE_ID || `child-${os.hostname()}`;
const PORT = Number(process.env.PORT) || 4001;
const MACHINE_NAME = process.env.MACHINE_NAME || os.hostname();
const AGENT_ROLE = process.env.AGENT_ROLE || 'chat';
const VERSION = '0.7.0';

let activeJobs = 0;
let retryCount = 0;
let backoffMs = 1000;
const MAX_BACKOFF_MS = 30000;

// Agent task polling
let pollingInterval = null;

function nextBackoff() {
  const jitter = Math.random() * 0.3 + 0.85;
  backoffMs = Math.min(backoffMs * 2 * jitter, MAX_BACKOFF_MS);
  return backoffMs;
}

function resetBackoff() {
  backoffMs = 1000;
}

// ── Poll for delegated agent tasks (for NAT'd devices) ───────────────────
async function pollForAgentTasks() {
  try {
    const resp = await fetch(`${PARENT_URL}/api/proxy/poll?machine_id=${CHILD_ID}`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!resp.ok) return;
    const data = await resp.json();
    if (!data.pending) return;

    console.log(`[child-proxy] Received delegated task: ${data.work_id}`);
    activeJobs++;

    try {
      const { execSync } = await import('child_process');
      const taskJson = JSON.stringify(data.payload);
      const result = execSync(`bash \"${process.env.HOME}/.fcukproxy/agent-exec.sh\"`, {
        input: taskJson,
        timeout: 300000,
        encoding: 'utf-8',
        env: { 
          ...process.env, 
          MACHINE_ID: CHILD_ID, 
          MACHINE_NAME, 
          AGENT_ROLE, 
          PARENT_URL,
          HOME: process.env.HOME
        },
        maxBuffer: 10 * 1024 * 1024
      });

      await fetch(`${PARENT_URL}/api/proxy/result`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ machine_id: CHILD_ID, work_id: data.work_id, result: JSON.parse(result) }),
      });
      console.log(`[child-proxy] Task ${data.work_id} completed`);
    } catch (e) {
      console.error(`[child-proxy] Task ${data.work_id} failed: ${e.message}`);
      await fetch(`${PARENT_URL}/api/proxy/result`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ machine_id: CHILD_ID, work_id: data.work_id, result: { error: e.message } }),
      });
    } finally {
      activeJobs--;
    }
  } catch (e) {
    // Polling errors are silent — not all nodes support polling
  }
}

function register() {
  const body = JSON.stringify({
    childId: CHILD_ID,
    machine_id: CHILD_ID,
    machine_name: MACHINE_NAME,
    url: process.env.SELF_URL || process.env.NGROK_URL || `http://${getLocalIP()}:${PORT}`,
    proxy_port: PORT,
    version: VERSION,
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

async function sendHeartbeat() {
  const body = JSON.stringify({
    machine_id: CHILD_ID,
    machine_name: MACHINE_NAME,
    load: activeJobs,
    role: AGENT_ROLE
  });
  try {
    await fetch(`${PARENT_URL}/api/proxy?action=heartbeat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });
  } catch (e) {
    console.error(`[child-proxy] Heartbeat error: ${e.message}`);
  }
}

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
    'X-Source-Machine': CHILD_ID,
    'X-Role': AGENT_ROLE
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

async function queryLocalLLM(messages, model) {
  const endpoints = [
    { url: 'http://localhost:6000/v1/chat/completions', format: 'openai' },
    { url: 'http://localhost:11434/api/chat', format: 'ollama' },
    { url: 'http://localhost:5000/v1/chat/completions', format: 'openai' },
    { url: 'http://localhost:8080/v1/chat/completions', format: 'openi' }
  ];
   
  for (const ep of endpoints) {
    try {
      let body;
      if (ep.format === 'ollama') {
        body = JSON.stringify({ model: model || 'llama3', messages, stream: false });
      } else {
        body = JSON.stringify({ model: model || 'local', messages, max_tokens: 1024, stream: false });
      }
      const resp = await fetch(ep.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
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

const server = http.createServer(async (req, res) => {
  const parsed = url.parse(req.url, true);
  const path = parsed.pathname;

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Chat-Only, X-Forwarded, X-Machine-ID, X-Agentic');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Handle GET requests for agent status
  if (req.method === 'GET' && path === '/v1/agent/status') {
    const { default: fs } = await import('fs');
    const hasExec = fs.existsSync(`${process.env.HOME}/.fcukproxy/agent-exec.sh`);
    const hasDeepAgent = fs.existsSync(`${process.env.HOME}/.fcukproxy/deepagent-service.py`);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      machine_id: CHILD_ID,
      role: AGENT_ROLE,
      capabilities: { agent_exec: hasExec, git: true, node: true, deepagent: hasDeepAgent },
      version: VERSION,
      port: PORT
    }));
    return;
  }

  if (req.method === 'GET' && path === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, machine_id: CHILD_ID, version: VERSION, role: AGENT_ROLE }));
    return;
  }

  if (req.method === 'POST' && (path === '/v1/agent/execute' || path === '/v1/agent/delegate')) {
    let bodyStr = '';
    for await (const chunk of req) bodyStr += chunk;
    try {
      const body = JSON.parse(bodyStr);
      const deepagentResp = await fetch('http://localhost:6000/v1/agent/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: bodyStr,
        signal: AbortSignal.timeout(60000),
      });
      const data = await deepagentResp.json();
      res.writeHead(deepagentResp.status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data));
      return;
    } catch (e) {
      res.writeHead(502);
      res.end(JSON.stringify({ error: `DeepAgent unavailable: ${e.message}` }));
      return;
    }
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
  const isForwarded = req.headers['x-forwarded'] === 'true';
  const isChatOnly = req.headers['x-chat-only'] === 'true';
  const isAgentic = req.headers['x-agentic'] === 'true';

  activeJobs++;
  const startTime = Date.now();

  try {
    let responseData;
    let routedTo = 'unknown';

    if (isForwarded) {
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
      if (retryCount > 0) {
        await new Promise(r => setTimeout(r, nextBackoff()));
      }
      console.log(`[child-proxy] Routing to parent proxy [${model}] (agentic: ${isAgentic})`);
      responseData = await routeToParent(messages, model, isAgentic);
      
      if (!responseData) {
        retryCount++;
        console.log(`[child-proxy] Parent unreachable (attempt ${retryCount})`);
        
        if (retryCount >= 3) {
          console.log('[child-proxy] Retry exhausted → local LLM fallback');
          responseData = await queryLocalLLM(messages, model);
          routedTo = 'local_fallback_exhausted';
        } else {
          const waitMs = nextBackoff();
          console.log(`[child-proxy] Waiting ${Math.round(waitMs)}ms before retry...`);
          await new Promise(r => setTimeout(r, waitMs));
          responseData = await routeToParent(messages, model, isAgentic);
          if (!responseData) {
            const lastMsg = messages.length > 0 ? (typeof messages[messages.length-1].content === 'string' ? messages[messages.length-1].content : '') : '';
            responseData = {
              choices: [{ message: { role: 'assistant', content: `Timeout: ${lastMsg}` }, finish_reason: 'stop' }],
            };
            routedTo = 'timeout_no_fallback';
          } else {
            routedTo = 'parent_proxy_retry';
            resetBackoff();
          }
        }
      } else {
        routedTo = 'parent_proxy';
        resetBackoff();
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
  console.log(`[child-proxy] Listening on port ${PORT} (machine: ${CHILD_ID}, role: ${AGENT_ROLE}, v${VERSION})`);
  register();
  setInterval(sendHeartbeat, 60000);
  setInterval(register, 120000);
  setInterval(pollForAgentTasks, 5000);
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

process.on('SIGTERM', () => { console.log('[child-proxy] Shutting down'); process.exit(0); });
process.on('SIGINT', () => { console.log('[child-proxy] Shutting down'); process.exit(0); });