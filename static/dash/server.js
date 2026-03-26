require('dotenv').config();
const express = require('express');
const path = require('path');
const axios = require('axios');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 8080;

const PROVIDER_COLORS = {
    'openai':      '#74aa9c',
    'anthropic':   '#d4a574',
    'google':      '#4285f4',
    'groq':        '#f55036',
    'deepseek':    '#6b9bd1',
    'openrouter':  '#6942ad',
    'nvidia':      '#76b900',
    'ollama':      '#8b5cf6',
    'mistral':     '#e44d26',
    'zhipu':       '#00d4aa',
    'qwen':        '#fb923c',
    'moonshot':    '#10b981',
    'cerebras':    '#f59e0b',
    'azure':       '#0078d4',
    'minimax':     '#00d4aa',
    'local llm':   '#8b5cf6',
};

// ── Known programs/agents on this machine ──
const LAPTOP_PROGRAMS = [
    'OPENCLAW', 'GEMINI', 'OPENCODE', 'HERMES',
    'FC_RESEARCHER', 'FC_PROJECTMGR', 'CLAUDE', 'CODECLD'
];

class APIQuotaMonitor {
    constructor() {
        this.quotas    = new Map();
        this.traffic   = new Map(); // track traffic weight per provider
        this.checkInterval = 30000;
        this.picoConfig = this.loadPicoClawConfig();
        this.init();
    }

    loadPicoClawConfig() {
        const paths = [
            '/home/unclehowell/.picoclaw/config.json',
            '/home/unclehowell/picoclaw/docker/data/config.json',
        ];
        for (const p of paths) {
            try {
                if (fs.existsSync(p)) {
                    const cfg = JSON.parse(fs.readFileSync(p, 'utf8'));
                    console.log(`📁 PicoClaw config: ${p}`);
                    return cfg;
                }
            } catch (e) { /* ignore */ }
        }
        return null;
    }

    getAllProviders() {
        const seen  = new Set();
        const out   = [];

        const add = (name, model, apiKey, apiBase, color) => {
            if (!apiKey || apiKey.trim() === '') return;
            if (seen.has(name)) return;
            seen.add(name);
            out.push({
                name, model, apiKey,
                apiBase: apiBase || '',
                color: PROVIDER_COLORS[name.toLowerCase()] || color || '#666666',
            });
        };

        // From PicoClaw model_list
        if (this.picoConfig?.model_list) {
            for (const m of this.picoConfig.model_list) {
                if (!m.api_key || m.api_key.trim() === '') continue;
                const key = this.extractKey(m);
                add(key.toUpperCase(), m.model_name || m.model, m.api_key, m.api_base);
            }
        }

        // Legacy / env providers
        add('OPENAI',    'GPT-4O',          process.env.OPENAI_API_KEY,       'https://api.openai.com/v1');
        add('GOOGLE',    'Gemini 2.0 Flash', process.env.GEMINI_API_KEY,       'https://generativelanguage.googleapis.com');
        add('GROQ',      'Llama 3.3',        process.env.GROQ_API_KEY,         'https://api.groq.com/openai/v1');
        add('OPENROUTER','Auto Router',      process.env.OPENROUTER_API_KEY,   'https://openrouter.ai/api/v1');
        add('NVIDIA',    'Nemotron 4 340B',  process.env.NVAPI_KEY,            'https://integrate.api.nvidia.com/v1');
        add('ANTHROPIC', 'Claude Sonnet',    process.env.ANTHROPIC_API_KEY,    'https://api.anthropic.com/v1');
        add('DEEPSEEK',  'DeepSeek V3',      process.env.DEEPSEEK_API_KEY,     'https://api.deepseek.com');
        add('OLLAMA',    'Local Models',     'ollama',                        'http://localhost:11434/v1');

        console.log(`✅ ${out.length} providers loaded`);
        return out;
    }

    extractKey(m) {
        const base = (m.api_base || '').toLowerCase();
        const nm   = (m.model    || '').toLowerCase();
        if (base.includes('ollama') || base.includes('localhost')) return 'LOCAL LLM';
        if (base.includes('openai.com'))     return 'OPENAI';
        if (base.includes('anthropic.com'))  return 'ANTHROPIC';
        if (base.includes('googleapis.com') || base.includes('generativelanguage')) return 'GOOGLE';
        if (base.includes('groq.com'))       return 'GROQ';
        if (base.includes('deepseek.com'))  return 'DEEPSEEK';
        if (base.includes('openrouter.ai')) return 'OPENROUTER';
        if (base.includes('nvidia') || base.includes('nvapi')) return 'NVIDIA';
        if (base.includes('mistral.ai'))    return 'MISTRAL';
        if (base.includes('zhipu') || base.includes('bigmodel')) return 'ZHIPU';
        if (base.includes('moonshot'))      return 'MOONSHOT';
        if (base.includes('cerebras'))      return 'CEREBRAS';
        if (base.includes('qwen') || base.includes('dashscope')) return 'QWEN';
        if (base.includes('azure'))         return 'AZURE';
        if (base.includes('minimax'))       return 'MINIMAX';
        return nm.split('/')[0]?.toUpperCase() || 'CUSTOM';
    }

    getRandomColor() {
        const c = ['#888','#a55','#5a5','#55a','#aa5','#a5a'];
        return c[Math.floor(Math.random() * c.length)];
    }

    init() {
        this.checkQuotas();
        setInterval(() => this.checkQuotas(), this.checkInterval);
    }

    async checkQuotas() {
        console.log('🔍 Checking quotas…');
        const providers = this.getAllProviders();
        if (!providers.length) {
            this.setQuota('NOCONFIG', 'No Providers', 100, 0, 0, '#666');
        }
        for (const p of providers) {
            await this.checkOne(p);
        }
        await this.scanClawTeam();
    }

    async checkOne(p) {
        try {
            const hdrs = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${p.apiKey}` };
            let remaining = 50, limit = 100, used = 0;

            if (p.name === 'OPENAI' || p.apiBase?.includes('openai')) {
                const r = await axios.post(`${p.apiBase}/chat/completions`,
                    { model: 'gpt-4o-mini', messages: [{ role: 'user', content: 'x' }], max_tokens: 1 },
                    { headers: hdrs, timeout: 6000 });
                remaining = parseInt(r.headers['x-ratelimit-remaining-requests'] || 50);
                limit     = parseInt(r.headers['x-ratelimit-limit-requests']       || 100);
            } else if (p.name === 'GROQ') {
                const r = await axios.post(`${p.apiBase}/chat/completions`,
                    { model: 'llama-3.3-70b-versatile', messages: [{ role: 'user', content: 'x' }], max_tokens: 1 },
                    { headers: hdrs, timeout: 6000 });
                remaining = parseInt(r.headers['x-ratelimit-remaining-requests'] || 500000);
                limit     = parseInt(r.headers['x-ratelimit-limit-requests']       || 500000);
            } else if (p.name === 'GOOGLE') {
                await axios.post(`${p.apiBase}/models/gemini-2.0-flash:generateContent?key=${p.apiKey}`,
                    { contents: [{ parts: [{ text: 'x' }] }] }, { timeout: 6000 });
                remaining = 90; limit = 100;
            } else if (p.name === 'OPENROUTER') {
                const r = await axios.get('https://openrouter.ai/api/v1/auth/key', { headers: hdrs, timeout: 6000 });
                const u = r.data.data?.usage || 0, l = r.data.data?.limit || 100;
                remaining = Math.max(0, l - u); limit = l;
            } else if (p.name === 'DEEPSEEK') {
                await axios.post(`${p.apiBase}/chat/completions`,
                    { model: 'deepseek-chat', messages: [{ role: 'user', content: 'x' }], max_tokens: 1 },
                    { headers: hdrs, timeout: 6000 });
                remaining = 100; limit = 100;
            } else if (p.name === 'OLLAMA') {
                // Local – always available
                remaining = 100; limit = 100;
            } else if (p.name === 'ANTHROPIC' || p.name === 'NVIDIA') {
                // Assume partial
                remaining = 70; limit = 100;
            } else {
                remaining = 50; limit = 100;
            }

            used    = limit > 0 ? ((limit - remaining) / limit) * 100 : 0;
            const rem = Math.max(0, remaining);          // 0–100
            this.traffic.set(p.name, used);              // track traffic weight
            this.setQuota(p.name, p.model, used, limit, remaining, p.color);

        } catch (err) {
            const s = err.response?.status;
            this.traffic.set(p.name, 100);
            this.setQuota(p.name, p.model, 100, 100, 0, p.color,
                s === 429 ? 'OVER' : 'ERR');
        }
    }

    async scanClawTeam() {
        try {
            const base = process.env.CLAWTEAM_PATH || '/home/unclehowell/.clawteam';
            const td   = path.join(base, 'tasks');
            if (!fs.existsSync(td)) return;
            let active = 0, total = 0;
            for (const proj of fs.readdirSync(td)) {
                const pd = path.join(td, proj);
                if (!fs.statSync(pd).isDirectory()) continue;
                for (const f of fs.readdirSync(pd).filter(x => x.endsWith('.json'))) {
                    total++;
                    const t = JSON.parse(fs.readFileSync(path.join(pd, f), 'utf8'));
                    if (['active','in-progress','locked'].includes(t.status)) active++;
                }
            }
            const u = total > 0 ? (active / total) * 100 : 0;
            this.traffic.set('CLAWTEAM', u);
            this.setQuota('CLAWTEAM', 'ClawTeam Agents', u, total, active, '#00ff80',
                active > 0 ? 'ACTIVE' : 'IDLE');
        } catch (e) {
            this.setQuota('CLAWTEAM', 'ClawTeam', 0, 0, 0, '#00ff80', 'OFFLINE');
        }
    }

    setQuota(name, model, used, limit, remaining, color, status = 'OK') {
        this.quotas.set(name, { name, model, used, limit, remaining, color, status });
    }

    getSnapshot() {
        return Array.from(this.quotas.values());
    }

    getTraffic() {
        // Normalised 0–1 per provider
        const all = Array.from(this.traffic.entries());
        const max = Math.max(...all.map(([, v]) => v), 1);
        const obj = {};
        all.forEach(([k, v]) => { obj[k] = v / max; });
        return obj;
    }
}

const monitor = new APIQuotaMonitor();

// ── Token / user tracker ──
const tracker = new (class {
    constructor() {
        this.programs = LAPTOP_PROGRAMS.map(n => ({
            id: `laptop-${n}`, name: n,
            device: 'laptop', status: 'online', visible: true,
        }));
    }

    getUsers() { return this.programs; }

    createSnapshot() {
        return {
            providers: monitor.getSnapshot(),
            traffic:   monitor.getTraffic(),
            users:     this.getUsers(),
            devices:   [{ id: 'laptop', name: 'LAPTOP', configured: true }],
            timestamp: new Date().toISOString(),
        };
    }
})();

app.use(express.json());
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', '*');
    next();
});

app.get('/api/llm-usage', (req, res) => res.json(tracker.createSnapshot()));
app.get('/api/health',    (req, res) => res.json({ status: 'ok', uptime: process.uptime() }));
app.get('/',             (req, res) => res.sendFile(path.join(__dirname, 'index-grid.html')));
app.use(express.static(__dirname));

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Dashboard → http://0.0.0.0:${PORT}`);
});
