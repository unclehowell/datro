const express = require('express');
const expressWs = require('express-ws');
const { NodeSSH } = require('node-ssh');
const path = require('path');
const fs = require('fs');
const http = require('http');
const fsPromises = fs.promises;
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

const app = express();
expressWs(app);

const HOME = process.env.HOME || '/home/unclehowell';
const PORT = process.env.PORT || 3000;
const AWS_IP = process.env.AWS_IP || '13.135.142.244';
const SSH_KEY = process.env.SSH_KEY || path.join(HOME, 'Desktop/aws-recovery-key');
const FCUK_DIR = process.env.FCUK_DIR || path.join(HOME, '.fcukproxy');
const MASTERS_DIR = path.join(FCUK_DIR, 'agent/masters');
const PROFILES_FILE = path.join(FCUK_DIR, 'agent/profiles.json');
const DASHBOARD_CONFIG = path.join(FCUK_DIR, 'dashboard-config.json');
const PROTOCOL_DIR = path.join(FCUK_DIR, 'protocol');
const REPO_PATH = process.env.REPO_PATH || path.join(HOME, 'datro');
const STATIC_DIR = path.join(REPO_PATH, 'static');
const MD_FILES = ['SPEC.md', 'AGENT.md', 'TASKS.md', 'MEMORY.md', 'README.md'];

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const ssh = new NodeSSH();

// Helper to read/write dashboard config
async function getDashboardConfig() {
    try {
        const data = await fsPromises.readFile(DASHBOARD_CONFIG, 'utf8');
        return JSON.parse(data);
    } catch {
        return { gear: 6, steering: 'CTR' };
    }
}

async function saveDashboardConfig(config) {
    await fsPromises.writeFile(DASHBOARD_CONFIG, JSON.stringify(config, null, 2));
    await syncConfigToAws(config);
}

async function syncConfigToAws(config) {
    try {
        const client = await getSsh();
        await client.putFile(DASHBOARD_CONFIG, '/home/ubuntu/.fcukproxy/dashboard-config.json');
        console.log('Synced dashboard config to AWS.');
    } catch (err) {
        console.error('Failed to sync config to AWS:', err);
    }
}

// --- API Endpoints ---

// Get Dashboard Config
app.get('/api/config', async (req, res) => {
    const config = await getDashboardConfig();
    res.json(config);
});

// Update Dashboard Config
app.post('/api/config', async (req, res) => {
    const current = await getDashboardConfig();
    const updated = { ...current, ...req.body };
    await saveDashboardConfig(updated);
    res.json(updated);
});

// Get Fuel Levels (Mocking for now)
app.get('/api/fuel', async (req, res) => {
    res.json({
        api: 80,
        llm: 65,
        cli: 90,
        ide: 40
    });
});

// Command Intercom (Chat + Voice)
app.post('/api/chat', async (req, res) => {
    const { message } = req.body;
    if (!message) return res.status(400).json({ response: 'No message provided', success: false });
    try {
        // 1. Always route through local hermes agent first (port 6000)
        const localData = await new Promise((resolve, reject) => {
            const body = JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: 'You are the dashboard command intercom for the DATRO flywheel control system. The user gives design instructions or asks questions about branches. Respond concisely (1-3 sentences).' },
                    { role: 'user', content: message }
                ]
            });
            const req = http.request({
                hostname: '127.0.0.1', port: 6000, path: '/v1/chat/completions',
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
                timeout: 10000
            }, (res) => {
                let data = '';
                res.on('data', c => data += c);
                res.on('end', () => { try { resolve(JSON.parse(data)); } catch(e) { reject(e); } });
            });
            req.on('error', reject);
            req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
            req.write(body);
            req.end();
        });
        const reply = localData.choices?.[0]?.message?.content || 'No response';
        const proxyInfo = localData._proxy || {};
        
        // 2. Build routing breadcrumb from hermes agent's _proxy response
        const routing = [];
        routing.push({ node: 'dashboard (port 3000)', status: 'ok' });
        routing.push({ node: `hermes agent (127.0.0.1:6000)`, status: 'ok', machine_id: proxyInfo.origin_machine_id || null });
        
        if (proxyInfo.routing_decision === 'direct_llm') {
            routing.push({ node: `direct LLM provider (round-robin)`, status: 'ok', detail: proxyInfo.routing_decision });
        } else if (proxyInfo.routing_decision === 'parent') {
            routing.push({ node: `parent proxy (financecheque.uk)`, status: 'pending' });
            // Try to trace the parent proxy hop
            try {
                const parentResp = await fetch('https://www.financecheque.uk/api/proxy?action=chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ system: 'respond with routing info only', message: 'routing trace' })
                });
                const parentData = await parentResp.json();
                const parentRoute = parentData._proxy?.routing || 'direct_llm';
                routing[routing.length - 1] = { node: `parent proxy (financecheque.uk)`, status: 'ok', detail: parentRoute };
                if (parentRoute === 'child_proxy') {
                    routing.push({ node: `child proxy machine`, status: 'ok' });
                } else if (parentRoute === 'direct_llm') {
                    routing.push({ node: `CF environment LLM`, status: 'ok' });
                }
            } catch {
                routing[routing.length - 1] = { node: `parent proxy (financecheque.uk)`, status: 'error', detail: 'unreachable' };
            }
        } else if (proxyInfo.routing_decision === 'peer') {
            routing.push({ node: `peer proxy (multicast)`, status: 'ok' });
        } else if (proxyInfo.polling_queued) {
            routing.push({ node: `parent poll queue`, status: 'pending' });
        } else {
            routing.push({ node: `provider round-robin`, status: 'ok', detail: proxyInfo.routing_decision || 'unknown' });
        }

        res.json({ response: reply, success: true, routing });
    } catch (err) {
        console.error('Chat Error:', err);
        // Fallback: try parent proxy directly
        try {
            const parentResp = await fetch('https://www.financecheque.uk/api/proxy?action=chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ system: 'You are a helpful dashboard assistant. Reply concisely.', message })
            });
            const parentData = await parentResp.json();
            const routing = [
                { node: 'dashboard (port 3000)', status: 'ok' },
                { node: 'hermes agent (127.0.0.1:6000)', status: 'error', detail: err.message },
                { node: `parent proxy (financecheque.uk)`, status: 'ok', detail: parentData._proxy?.routing || 'direct_llm' }
            ];
            res.json({ response: parentData.reply || parentData.response || 'No response', success: true, routing });
        } catch (fallbackErr) {
            const routing = [
                { node: 'dashboard (port 3000)', status: 'ok' },
                { node: 'hermes agent (127.0.0.1:6000)', status: 'error', detail: err.message },
                { node: 'parent proxy (financecheque.uk)', status: 'error', detail: fallbackErr.message },
                { node: 'NO LLM AVAILABLE', status: 'error' }
            ];
            res.status(500).json({ response: 'All proxies unavailable. Check local agent on port 6000.', success: false, routing });
        }
    }
});

async function getSsh() {
    if (!ssh.isConnected()) {
        console.log(`Connecting to AWS (${AWS_IP})...`);
        const privateKeyContent = await fsPromises.readFile(SSH_KEY, 'utf8');
        await ssh.connect({
            host: AWS_IP,
            username: 'ubuntu',
            privateKey: privateKeyContent
        });
        console.log('Connected to AWS.');
    }
    return ssh;
}

// --- API Endpoints ---

// Get AWS Status
app.get('/api/aws/status', async (req, res) => {
    try {
        const client = await getSsh();
        const uptime = await client.execCommand('uptime');
        const free = await client.execCommand('free -m');
        const state = await client.execCommand('cat ~/.fcukproxy/release-state.json');
        
        if (uptime.stderr) console.error('AWS Uptime Error:', uptime.stderr);
        
        res.json({
            uptime: uptime.stdout,
            memory: free.stdout,
            state: JSON.parse(state.stdout || '{}')
        });
    } catch (err) {
        console.error('AWS Status Error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get Local Profiles
app.get('/api/local/profiles', async (req, res) => {
    try {
        const data = await fsPromises.readFile(PROFILES_FILE, 'utf8');
        res.json(JSON.parse(data));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// List Master Plans
app.get('/api/masters', async (req, res) => {
    try {
        const files = await fsPromises.readdir(MASTERS_DIR);
        const plans = files.filter(f => f.endsWith('.md')).map(f => f.replace('.md', ''));
        res.json(plans);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Read Master Plan
app.get('/api/masters/:branch', async (req, res) => {
    try {
        const content = await fsPromises.readFile(path.join(MASTERS_DIR, `${req.params.branch}.md`), 'utf8');
        res.json({ content });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Write Master Plan
app.post('/api/masters/:branch', async (req, res) => {
    try {
        await fsPromises.writeFile(path.join(MASTERS_DIR, `${req.params.branch}.md`), req.body.content);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── MD Protocol: Branch File Management (Left/Right Variations) ──

const SIDES = ['left', 'right', 'high', 'low'];

function sideSuffix(side, filename) {
  if (!side || filename === 'master-record.md') return filename;
  const base = filename.replace('.md', '');
  return `${base}.${side}.md`;
}

function resolveBranchFilePath(branch, side, filename) {
  if (filename === 'master-record.md') {
    return path.join(MASTERS_DIR, `${branch}.md`);
  }
  return path.join(STATIC_DIR, branch, sideSuffix(side, filename));
}

// List all branches with their LEFT and RIGHT file sets
app.get('/api/branches', async (req, res) => {
  try {
    const files = await fsPromises.readdir(MASTERS_DIR);
    const branches = files.filter(f => f.endsWith('.md')).map(f => f.replace('.md', ''));
    const result = await Promise.all(branches.map(async (name) => {
      const masterExists = true;
      const leftFiles = [], rightFiles = [], highFiles = [], lowFiles = [];
      for (const mdFile of MD_FILES) {
        let leftExists = false, rightExists = false, highExists = false, lowExists = false;
        try { await fsPromises.access(path.join(STATIC_DIR, name, sideSuffix('left', mdFile))); leftExists = true; } catch {}
        try { await fsPromises.access(path.join(STATIC_DIR, name, sideSuffix('right', mdFile))); rightExists = true; } catch {}
        try { await fsPromises.access(path.join(STATIC_DIR, name, sideSuffix('high', mdFile))); highExists = true; } catch {}
        try { await fsPromises.access(path.join(STATIC_DIR, name, sideSuffix('low', mdFile))); lowExists = true; } catch {}
        const label = mdFile.replace('.md', '');
        leftFiles.push({ name: mdFile, label, exists: leftExists });
        rightFiles.push({ name: mdFile, label, exists: rightExists });
        highFiles.push({ name: mdFile, label, exists: highExists });
        lowFiles.push({ name: mdFile, label, exists: lowExists });
      }
      return { name, masterExists, leftFiles, rightFiles, highFiles, lowFiles };
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Read a branch's file for a specific side (left/right)
app.get('/api/branches/:branch/files/:side/:filename', async (req, res) => {
  try {
    const filePath = resolveBranchFilePath(req.params.branch, req.params.side, req.params.filename);
    const content = await fsPromises.readFile(filePath, 'utf8');
    res.json({ content, side: req.params.side });
  } catch (err) {
    res.json({ content: '', exists: false, side: req.params.side });
  }
});

// Write a branch's file for a specific side (left/right) — commits + pushes to git
app.post('/api/branches/:branch/files/:side/:filename', async (req, res) => {
  try {
    const filePath = resolveBranchFilePath(req.params.branch, req.params.side, req.params.filename);
    await fsPromises.mkdir(path.dirname(filePath), { recursive: true });
    await fsPromises.writeFile(filePath, req.body.content);

    const branch = req.params.branch;
    const side = req.params.side;
    const filename = req.params.filename;
    const label = filename === 'master-record.md' ? 'master-record' : filename.replace('.md', '').toLowerCase();

    // Git commit + push
    const commitMsg = `docs(${branch}): update ${side}/${label}`;
    const repoPath = REPO_PATH;
    const relPath = path.relative(repoPath, filePath);
    const { execSync } = require('child_process');
    try {
      execSync(`git add "${relPath}"`, { cwd: repoPath, timeout: 10000 });
      execSync(`git commit -m "${commitMsg}"`, { cwd: repoPath, timeout: 10000 });
      execSync(`git push origin "${branch}"`, { cwd: repoPath, timeout: 30000 });
      console.log(`[git] Pushed to ${branch}: ${commitMsg}`);
    } catch (gitErr) {
      console.error(`[git] Failed to commit/push: ${gitErr.message}`);
    }

    // If master record was saved, regenerate protocol files via md-protocol.sh
    if (filename === 'master-record.md') {
      const mdScript = path.join(PROTOCOL_DIR, 'md-protocol.sh');
      if (fs.existsSync(mdScript)) {
        try {
          execSync(`bash "${mdScript}" --branch "${branch}" --repo-path "${REPO_PATH}"`, { timeout: 30000 });
        } catch (e) {
          console.error('md-protocol regeneration failed:', e.message);
        }
      }
    }

    res.json({ success: true, side, savedAt: filePath });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const APP_VERSION = '0.0.0.05';
const CF_WORKER_URL = process.env.CF_WORKER_URL || 'https://datro-flywheel.righteous.workers.dev';

app.get('/api/version', async (req, res) => {
    res.json({ version: APP_VERSION });
});

// MCP scan proxy (reaches CF worker /__mcp)
app.get('/api/mcp', async (req, res) => {
    try {
        const target = req.query.url || 'https://datro.directory';
        const cfResp = await fetch(`${CF_WORKER_URL}/__mcp?url=${encodeURIComponent(target)}`);
        const data = await cfResp.json();
        res.json(data);
    } catch (err) {
        res.status(502).json({ error: err.message });
    }
});

// Health / Status
app.get('/api/status', async (req, res) => {
    res.json({
        status: 'ok',
        version: APP_VERSION,
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

// Get MEMORY.md for a branch
app.get('/api/memory/:branch', async (req, res) => {
    try {
        const memPaths = [
            path.join(REPO_PATH, 'static', req.params.branch, 'MEMORY.md'),
            path.join(FCUK_DIR, 'agent/memory.md')
        ];
        let content = null;
        for (const p of memPaths) {
            try {
                content = await fsPromises.readFile(p, 'utf8');
                break;
            } catch {}
        }
        res.json({ content: content || 'No MEMORY.md found' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Trigger OTA Update on AWS
app.post('/api/trigger/ota', async (req, res) => {
    try {
        const client = await getSsh();
        const result = await client.execCommand('cd ~/.fcukproxy && sudo ./ota-update.sh');
        res.json({ output: result.stdout + result.stderr });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Pause/Resume AWS Flywheel
app.post('/api/aws/toggle-pause', async (req, res) => {
    try {
        const client = await getSsh();
        const pauseFile = '/home/ubuntu/.fcukproxy/paused';
        const { pause } = req.body;
        
        if (pause) {
            await client.execCommand(`touch ${pauseFile}`);
        } else {
            await client.execCommand(`rm -f ${pauseFile}`);
        }
        res.json({ success: true, paused: pause });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Check if AWS is Paused
app.get('/api/aws/is-paused', async (req, res) => {
    try {
        const client = await getSsh();
        const result = await client.execCommand('test -f /home/ubuntu/.fcukproxy/paused && echo "true" || echo "false"');
        res.json({ paused: result.stdout.trim() === 'true' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- WebSockets for Real-time Logs ---

app.ws('/ws/logs/aws', async (ws, req) => {
    try {
        const client = await getSsh();
        const stream = await client.exec('tail', ['-f', '/home/ubuntu/logs/multi-branch-release.log'], { stream: 'both' });
        
        stream.stdout.on('data', (data) => ws.send(data.toString()));
        stream.stderr.on('data', (data) => ws.send(`ERR: ${data.toString()}`));
        
        ws.on('close', () => stream.dispose());
    } catch (err) {
        ws.send(`SSH Error: ${err.message}`);
    }
});

app.ws('/ws/logs/meta', async (ws, req) => {
    const logFile = path.join('/home/unclehowell/logs', 'meta-review.log');
    const tail = exec(`tail -f ${logFile}`);
    
    tail.stdout.on('data', (data) => ws.send(data.toString()));
    tail.stderr.on('data', (data) => ws.send(`ERR: ${data.toString()}`));
    
    ws.on('close', () => tail.kill());
});

app.listen(PORT, () => {
    console.log(`Master Dashboard running at http://localhost:${PORT}`);
});
