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
 * Version: 0.10.0
 */

import http from 'http';
import url from 'url';
import os from 'os';

const PARENT_URL = process.env.PARENT_URL || 'https://www.financecheque.uk';
const CHILD_ID = process.env.CHILD_ID || process.env.MACHINE_ID || `child-${os.hostname()}`;
const PORT = Number(process.env.PORT) || 4001;
const MACHINE_NAME = process.env.MACHINE_NAME || os.hostname();
const AGENT_ROLE = process.env.AGENT_ROLE || 'chat';
const EXECUTOR_URL = process.env.AGENT_PORT ? `http://localhost:${process.env.AGENT_PORT}` : 'http://localhost:6100';
const LOCAL_TOKEN = process.env.FCUK_LOCAL_TOKEN || '';
const AUTH_HEADER = 'X-FCUK-Token';
const authHeader = (h) => h[String(AUTH_HEADER).toLowerCase()] ?? h[AUTH_HEADER] ?? '';
const VERSION = '0.10.0';

// Local component versions (compared against ota-manifest.json)
const LOCAL_VERSIONS = {
  'child-proxy': VERSION,
  'agent': process.env.AGENT_VERSION || '0.7.0',
  'agent-exec': '1.0.0',
  'campaign-exec': '0.4.0',
  'reflect': '0.2.0',
  'skills-leadgen': '0.3.0',
  'skills-discharge': '0.2.0',
};

let activeJobs = 0;
let retryCount = 0;
let backoffMs = 1000;
const MAX_BACKOFF_MS = 30000;

// ── OTA self-update ───────────────────────────────────────────────────────
// Prefer the parent-served manifest (swarm-facing, always current after release);
// fall back to raw GitHub if the parent isn't reachable.
const ALLOWED_HOSTS = ['raw.githubusercontent.com', 'www.financecheque.uk', 'financecheque.uk'];
const MANIFEST_MAX_BYTES = 64 * 1024;
const FILE_MAX_BYTES = 4 * 1024 * 1024;
const RELEASE_SEQUENCE_FILE = `${FCUK_DIR}/.ota-sequence`;

const OTA_MANIFEST_URL = process.env.OTA_URL
  || `${PARENT_URL}/api/proxy/ota/manifest`
  || 'https://raw.githubusercontent.com/unclehowell/datro/financecheque/public/fcukproxy/ota-manifest.json';
const OTA_FALLBACK_URL = 'https://raw.githubusercontent.com/unclehowell/datro/financecheque/public/fcukproxy/ota-manifest.json';
const FCUK_DIR = `${process.env.HOME}/.fcukproxy`;
const OTA_TMP = `${FCUK_DIR}/.ota`;

// Internal component spec is hard-coded; the manifest may only name versions/URLs.
// Dest paths / validators are NEVER taken from the (untrusted) manifest.
const COMPONENT_SPEC = {
  'child-proxy': { file: 'child-proxy.mjs', check: 'node', mode: 0o644 },
  'agent': { file: 'agent.py', check: 'python', mode: 0o644 },
  'agent-exec': { file: 'agent-exec.sh', check: 'bash', mode: 0o755 },
  'campaign-exec': { file: 'campaign-exec.sh', check: 'bash', mode: 0o755 },
  'reflect': { file: 'reflect.sh', check: 'bash', mode: 0o755 },
  'skills-leadgen': { file: 'skills/leadgen-strategy.md', check: 'text', mode: 0o644 },
  'skills-discharge': { file: 'skills/local-agent-discharge.md', check: 'text', mode: 0o644 },
};

// RFC 3986 host extraction without the WHATWG URL host quirks (ipv6 brackets etc.)
function hostOf(url) {
  const m = /^https:\/\/([^/?#]+)/i.exec(url);
  if (!m) return null;
  return m[1].split(':').slice(0, 1)[0].replace(/^\[|\]$/g, '').toLowerCase();
}

function allowedUrl(url) {
  if (!/^https:/i.test(url)) return false;
  const host = hostOf(url);
  if (!host) return false;
  return ALLOWED_HOSTS.includes(host);
}

async function readSequence(fs) {
  try {
    const n = Number(await fs.promises.readFile(RELEASE_SEQUENCE_FILE, 'utf8'));
    return Number.isInteger(n) && n > 0 ? n : 0;
  } catch {
    return 0;
  }
}

async function fetchOtaManifest() {
  let resp = null;
  for (const url of [OTA_MANIFEST_URL, OTA_FALLBACK_URL]) {
    if (!allowedUrl(url)) continue;
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(10000), redirect: 'error' });
      if (!r.ok) continue;
      const text = await r.text();
      if (Buffer.byteLength(text) > MANIFEST_MAX_BYTES) continue;
      const json = JSON.parse(text);
      if (json && typeof json === 'object' && Number.isInteger(json.release_sequence)) return json;
    } catch { /* try next source */ }
  }
  return null;
}

async function downloadFile(url, destPath) {
  if (!allowedUrl(url)) throw new Error(`disallowed URL: ${url}`);
  const resp = await fetch(url, { signal: AbortSignal.timeout(60000), redirect: 'error' });
  if (!resp.ok) throw new Error(`HTTP ${resp.status} for ${url}`);
  const buf = Buffer.from(await resp.arrayBuffer());
  if (buf.length > FILE_MAX_BYTES) throw new Error(`file too large (${buf.length}) for ${url}`);
  await (await import('fs')).promises.writeFile(destPath, buf);
  return buf;
}

async function validateFile(kind, filePath) {
  const { execFileSync } = await import('child_process');
  try {
    if (kind === 'node') execFileSync('node', ['--check', filePath], { stdio: 'pipe' });
    else if (kind === 'python') execFileSync('python3', ['-m', 'py_compile', filePath], { stdio: 'pipe' });
    else if (kind === 'bash') execFileSync('bash', ['-n', filePath], { stdio: 'pipe' });
    else if (kind === 'text') { const s = await import('fs/promises'); const t = await s.readFile(filePath, 'utf8'); if (!t.length) return false; }
    return true;
  } catch {
    return false;
  }
}

function dirOf(file) {
  const i = file.lastIndexOf('/');
  return i === -1 ? '.' : file.slice(0, i);
}

// OTA v2: stage + validate ALL changed components first, then swap atomically,
// then persist markers and restart exactly once.
async function checkForUpdate() {
  try {
    const manifest = await fetchOtaManifest();
    if (!manifest?.apps) return;
    const fs = await import('fs');
    await fs.promises.mkdir(OTA_TMP, { recursive: true });

    // Anti-downgrade: only ever move forward through a monotonic release sequence.
    const seq = Number(manifest.release_sequence) || 0;
    if (seq <= 0) return;
    const lastSeq = await readSequence(fs);
    if (seq <= lastSeq) return; // already applied this or a newer release

    // Phase 1: download + validate every changed component into staging.
    const staged = [];
    for (const [name, meta] of Object.entries(manifest.apps)) {
      const spec = COMPONENT_SPEC[name];
      const localVersion = LOCAL_VERSIONS[name];
      if (!spec || !localVersion) continue; // only managed components
      if (meta.version === localVersion) continue;
      if (typeof meta.version !== 'string' || typeof meta.url !== 'string') continue;
      if (!allowedUrl(meta.url)) { console.error(`[child-proxy] OTA: ${name} bad url, skipping whole update`); return; }

      const tmp = `${OTA_TMP}/${spec.file.replace(/\//g, '__')}`;
      console.log(`[child-proxy] OTA: staging ${name} ${localVersion} → ${meta.version}`);
      try {
        await downloadFile(meta.url, tmp);
        if (!await validateFile(spec.check, tmp)) {
          console.error(`[child-proxy] OTA: ${name} failed validation, aborting update`);
          return;
        }
      } catch (e) {
        console.error(`[child-proxy] OTA: ${name} download failed (${e.message}), aborting update`);
        return;
      }
      staged.push({ name, spec, tmp, version: meta.version });
    }

    // Phase 2: swap all staged files into place atomically.
    if (!staged.length) return;
    const pendingChildRestart = staged.some(s => s.name === 'child-proxy');
    const agentUpdated = staged.some(s => s.name === 'agent');

    for (const { name, spec, tmp, version } of staged) {
      const dest = `${FCUK_DIR}/${spec.file}`;
      await fs.promises.mkdir(`${FCUK_DIR}/${dirOf(spec.file)}`, { recursive: true });
      if (fs.existsSync(dest)) { try { await fs.promises.rename(dest, `${dest}.bak`); } catch {} }
      await fs.promises.rename(tmp, dest);
      await fs.promises.chmod(dest, spec.mode).catch(() => {});
      const verFile = `${FCUK_DIR}/.ota-version-${name}`;
      await fs.promises.writeFile(verFile, version);
      console.log(`[child-proxy] OTA: ${name} updated to ${version}`);
    }

    // Phase 3: record the applied sequence (only after everything swapped).
    await fs.promises.writeFile(RELEASE_SEQUENCE_FILE, String(seq));

    if (agentUpdated) await fs.promises.writeFile(`${FCUK_DIR}/.ota-restart-agent`, manifest.apps.agent.version);
    if (pendingChildRestart) {
      console.log('[child-proxy] OTA: self-restarting with new code');
      process.exit(42);
    }
  } catch (e) {
    console.error(`[child-proxy] OTA check failed: ${e.message}`);
  }
}

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
// Adaptive schedule: poll fast after work, slow on idle.
let pollDelayMs = 5000;
const POLL_AFTER_WORK_MS = 5000;
const POLL_IDLE_MS = 30000;
let pollTimer = null;

function scheduleNextPoll() {
  if (pollTimer) clearTimeout(pollTimer);
  pollTimer = setTimeout(async () => {
    let foundWork = false;
    try {
      foundWork = await pollForAgentTasks();
    } catch {}
    pollDelayMs = foundWork ? POLL_AFTER_WORK_MS : Math.min(pollDelayMs * 1.5, POLL_IDLE_MS);
    scheduleNextPoll();
  }, pollDelayMs);
}

async function pollForAgentTasks() {
  try {
    const resp = await fetch(`${PARENT_URL}/api/proxy/poll?machine_id=${CHILD_ID}`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!resp.ok) return false;
    const data = await resp.json();
    if (!data.pending) return false;

    console.log(`[child-proxy] Received delegated task: ${data.work_id}`);
    activeJobs++;

    try {
      const { execSync } = await import('child_process');
      const taskJson = JSON.stringify(data.payload);
      const isCampaign = data.payload?.action === 'campaign';
      const execScript = isCampaign
        ? `${process.env.HOME}/.fcukproxy/campaign-exec.sh`
        : `${process.env.HOME}/.fcukproxy/agent-exec.sh`;
      const execTimeout = isCampaign ? 3600000 : 300000;
      const result = execSync(`bash \"${execScript}\"`, {
        input: taskJson,
        timeout: execTimeout,
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
    return true;
  } catch (e) {
    // Polling errors are silent — not all nodes support polling
    return false;
  }
}

async function hasBin(cmd) {
  try {
    const { execFileSync } = await import('child_process');
    execFileSync(cmd, ['--version'], { stdio: 'pipe' });
    return true;
  } catch { return false; }
}

async function getCapabilities() {
  const { default: fs } = await import('fs');
  const hasExec = fs.existsSync(`${FCUK_DIR}/agent-exec.sh`);
  const hasAgent = fs.existsSync(`${FCUK_DIR}/agent.py`);
  const hasVideo = fs.existsSync(`${FCUK_DIR}/phone_video.py`);
  const hasCampaign = fs.existsSync(`${FCUK_DIR}/campaign-exec.sh`);
  let hasOllama = false;
  try {
    const r = await fetch('http://localhost:11434/api/tags', { signal: AbortSignal.timeout(2000) });
    hasOllama = r.ok;
  } catch {}
  return {
    agent_exec: hasExec,
    campaign_exec: hasCampaign,
    agent_py: hasAgent,
    video: hasVideo,
    local_llm: hasOllama,
    git: true,
    node: true,
    opencode: await hasBin('opencode'),
    kilo: await hasBin('kilo'),
  };
}

async function getPressure() {
  let cpu = 0;
  let mem = 0;
  try {
    const os = await import('os');
    const load1 = os.loadavg()[0];
    const cpus = os.cpus();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    cpu = Math.min(100, Math.round((load1 / Math.max(1, cpus.length)) * 100));
    mem = Math.round(((totalMem - freeMem) / totalMem) * 100);
  } catch {}
  return { cpu, mem, jobs: activeJobs };
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

  // Ensure this node has a wallet on the parent (idempotent).
  fetch(`${PARENT_URL}/api/proxy/wallet`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ machine_id: CHILD_ID }),
  }).catch(() => {});
}

async function sendHeartbeat() {
  const [capabilities, pressure] = await Promise.all([getCapabilities(), getPressure()]);
  const body = JSON.stringify({
    machine_id: CHILD_ID,
    machine_name: MACHINE_NAME,
    load: activeJobs,
    role: AGENT_ROLE,
    version: VERSION,
    capabilities,
    pressure,
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
    { url: 'http://localhost:6100/v1/chat/completions', format: 'openai' },
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
  if (req.method === 'POST' && path === '/v1/ota/update') {
    if (LOCAL_TOKEN && authHeader(req.headers) !== LOCAL_TOKEN) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'unauthorized' }));
      return;
    }
    res.writeHead(202, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, message: 'OTA check triggered' }));
    checkForUpdate();
    return;
  }

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
    if (LOCAL_TOKEN && authHeader(req.headers) !== LOCAL_TOKEN) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'unauthorized' }));
      return;
    }
    let bodyStr = '';
    for await (const chunk of req) bodyStr += chunk;
    try {
      const body = JSON.parse(bodyStr);
      const deepagentResp = await fetch(`${EXECUTOR_URL}/v1/agent/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(LOCAL_TOKEN ? { [AUTH_HEADER]: LOCAL_TOKEN } : {}) },
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
  scheduleNextPoll();
  setInterval(checkForUpdate, (Number(process.env.OTA_INTERVAL_MS) || 1800000));
  checkForUpdate();
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