const express = require('express');
const expressWs = require('express-ws');
const { NodeSSH } = require('node-ssh');
const path = require('path');
const fs = require('fs');
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

// Command Intercom (Self-Modifying Design)
app.post('/api/chat', async (req, res) => {
    const { message } = req.body;
    try {
        const dashboardDir = __dirname;
        const publicDir = path.join(dashboardDir, 'public');
        
        // Use intelligence.py to generate a fix
        // We'll create a temporary "branch" context for the dashboard itself
        const dashboardContext = {
            branch: 'dashboard',
            url: 'http://localhost:3000',
            category: 'ui',
            master_plan: `- [ ] ${message}`,
            repo_path: dashboardDir
        };
        
        const tempCtx = path.join(FCUK_DIR, 'agent/branches/dashboard.md');
        await fsPromises.writeFile(tempCtx, `## Category\nui\n## URL\nhttp://localhost:3000\n## Master Plan\n- [ ] ${message}`);

        // Run intelligence.py to generate the fix
        const { exec } = require('child_process');
        const util = require('util');
        const execAsync = util.promisify(exec);
        
        const cmd = `python3 /home/unclehowell/.fcukproxy/intelligence.py --branch dashboard --repo-path ${dashboardDir} --type ux`;
        console.log(`Executing design change: ${cmd}`);
        
        const { stdout } = await execAsync(cmd, {
            env: { ...process.env, OPENAI_BASE_URL: 'http://localhost:6000/v1', OPENAI_API_KEY: 'fcuk-proxy' }
        });
        
        // Apply the fix
        const applyCmd = `python3 /home/unclehowell/.fcukproxy/intelligence.py --branch dashboard --repo-path ${dashboardDir} --type ux --apply '${stdout.trim().replace(/'/g, "'\\''")}'`;
        await execAsync(applyCmd);
        
        res.json({ response: "DESIGN CHANGE APPLIED. REFRESHING...", success: true });
    } catch (err) {
        console.error('Chat Error:', err);
        res.status(500).json({ response: "SYSTEM MALFUNCTION: " + err.message, success: false });
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

const SIDES = ['left', 'right'];

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
      const leftFiles = [];
      const rightFiles = [];
      for (const mdFile of MD_FILES) {
        let leftExists = false, rightExists = false;
        try { await fsPromises.access(path.join(STATIC_DIR, name, sideSuffix('left', mdFile))); leftExists = true; } catch {}
        try { await fsPromises.access(path.join(STATIC_DIR, name, sideSuffix('right', mdFile))); rightExists = true; } catch {}
        const label = mdFile.replace('.md', '');
        leftFiles.push({ name: mdFile, label, exists: leftExists });
        rightFiles.push({ name: mdFile, label, exists: rightExists });
      }
      return { name, masterExists, leftFiles, rightFiles };
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

// Version
let APP_VERSION = '0.0.0';
try {
    const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
    APP_VERSION = pkg.version || '0.0.0';
} catch {}

app.get('/api/version', async (req, res) => {
    res.json({ version: APP_VERSION });
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
