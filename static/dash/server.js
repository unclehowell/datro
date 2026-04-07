require('dotenv').config();
const express = require('express');
const path = require('path');
const axios = require('axios');
const fs = require('fs');
const QuotaTracker = require('./lib/quotaTracker');

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

class PaperclipAgentMonitor {
    constructor() {
        this.agents = [];
        this.checkInterval = 30000;
        this.apiBase = process.env.PAPERCLIP_API_URL || 'http://127.0.0.1:3100/api';
        this.companyId = process.env.PAPERCLIP_COMPANY_ID || 'b2f6358e-c1a7-40fb-8aa0-a2791d6c14bd';
        this.init();
    }
    
    async fetchAgents() {
        try {
            const apiKey = require('fs').readFileSync('/home/unclehowell/.paperclip/api-key', 'utf8').trim();
            const response = await axios.get(
                `${this.apiBase}/companies/${this.companyId}/agents`,
                { headers: { Authorization: `Bearer ${apiKey}` }, timeout: 5000 }
            );
            return response.data.map(a => ({
                id: a.id,
                name: a.name,
                profile: a.adapterConfig?.profile || 'default',
                model: a.adapterConfig?.model || 'unknown',
                status: a.status || 'unknown',
                lastHeartbeatAt: a.lastHeartbeatAt,
                adapterType: a.adapterType
            }));
        } catch (e) {
            console.error('Failed to fetch Paperclip agents:', e.message);
            return [];
        }
    }
    
    init() {
        this.refresh();
        setInterval(() => this.refresh(), this.checkInterval);
    }
    
    async refresh() {
        this.agents = await this.fetchAgents();
    }
}

// ── Known programs/agents on this machine ──
class APIQuotaMonitor {
    constructor() {
        this.quotas    = new Map();
        this.traffic   = new Map(); // track traffic weight per provider
        this.checkInterval = 30000;
        this.init();
    }

    getAllProviders() {
        const seen  = new Set();
        const out   = [];

        const add = (name, model, apiKey, apiBase, color) => {
            // Basic check for ollama API key to prevent adding it as a custom provider if it's the default
            if (name === 'OLLAMA' && apiKey === 'ollama') {
                 // Treat default ollama key as an indicator to use the dedicated ollama logic
            } else if (!apiKey || apiKey.trim() === '') {
                return;
            }
            if (seen.has(name)) return;
            seen.add(name);
            out.push({
                name, model, apiKey,
                apiBase: apiBase || '',
                color: PROVIDER_COLORS[name.toLowerCase()] || color || '#666666',
            });
        };

        // Legacy / env providers
        add('OPENAI',    'GPT-4O',          process.env.OPENAI_API_KEY,       'https://api.openai.com/v1');
        add('GOOGLE',    'Gemini 2.0 Flash', process.env.GEMINI_API_KEY,       'https://generativelanguage.googleapis.com');
        add('GROQ',      'Llama 3.3',        process.env.GROQ_API_KEY,         'https://api.groq.com/openai/v1');
        add('OPENROUTER','Auto Router',      process.env.OPENROUTER_API_KEY,   'https://openrouter.ai/api/v1');
        add('NVIDIA',    'MoonshotAI Kimi K2.5',  process.env.NVAPI_KEY,            'https://integrate.api.nvidia.com/v1');
        add('MISTRAL',   'Mistral Large 2603', process.env.MISTRAL_API_KEY,     'https://api.mistral.ai/v1');
        add('ANTHROPIC', 'Claude Sonnet',    process.env.ANTHROPIC_API_KEY,    'https://api.anthropic.com/v1');
        add('DEEPSEEK',  'DeepSeek V3',      process.env.DEEPSEEK_API_KEY,     'https://api.deepseek.com');
        // Explicitly add Ollama if an API key isn't set, or if it's the default placeholder.
        // The checkOne method will handle querying the local Ollama instance.
        if (!process.env.OLLAMA_API_KEY) { // Only add default if no specific key is provided
            add('OLLAMA',    'Local Models',     'ollama',                        'http://localhost:11434');
        }

        console.log(`✅ ${out.length} providers loaded`);
        return out;
    }

    extractKey(m) {
        const base = (m.api_base || '').toLowerCase();
        const nm   = (m.model    || '').toLowerCase();
        if (base.includes('ollama') || base.includes('localhost') || nm.includes('ollama')) return 'LOCAL LLM';
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
    }

    async checkOne(p) {
        try {
            const hdrs = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${p.apiKey}` };
            let remaining = 50, limit = 100, used = 0;
            let status = 'OK';

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
            } else if (p.name === 'OLLAMA' || p.name === 'LOCAL LLM') {
                // Attempt to query local Ollama for status
                try {
                    await axios.get('http://localhost:11434/api/tags', { timeout: 5000 });
                    // If successful, assume it's available. Quotas aren't typically exposed this way.
                    // We'll represent availability as 100% for simplicity.
                    remaining = 100;
                    limit = 100;
                    used = 0; // No direct "used" percentage from /api/tags for general status
                    status = 'OK';
                } catch (err) {
                    console.error(`❌ Ollama check failed: ${err.message}`);
                    remaining = 0; // Mark as unavailable
                    limit = 100;
                    used = 100; // Effectively 100% used/unavailable
                    status = 'OFFLINE';
                }
            } else if (p.name === 'ANTHROPIC') {
                // Assume partial availability if no specific headers are found
                remaining = 70; limit = 100;
            } else if (p.name === 'MISTRAL') {
                remaining = 50; limit = 100;
            } else if (p.name === 'NVIDIA') {
                // Check NVIDIA NIM quota
                try {
                    const r = await axios.post(`${p.apiBase}/chat/completions`,
                        { model: 'moonshotai/kimi-k2.5', messages: [{ role: 'user', content: 'hi' }], max_tokens: 5 },
                        { headers: hdrs, timeout: 6000 });
                    remaining = 90; limit = 100;
                } catch (e) {
                    remaining = 50; limit = 100;
                }
            } else {
                // Default for other providers or custom setups
                remaining = 50; limit = 100;
            }

            // Ensure remaining is not negative and used is calculated correctly
            const rem = Math.max(0, remaining);
            used    = limit > 0 ? ((limit - rem) / limit) * 100 : (status === 'OFFLINE' || status === 'ERR' ? 100 : 0);

            this.traffic.set(p.name, used);              // track traffic weight
            this.setQuota(p.name, p.model, used, limit, rem, p.color, status);

        } catch (err) {
            const s = err.response?.status;
            this.traffic.set(p.name, 100); // Mark as 100% used on error
            this.setQuota(p.name, p.model, 100, 100, 0, p.color,
                s === 429 ? 'OVER' : 'ERR');
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
const quotaTracker = new QuotaTracker();
const paperclip = new PaperclipAgentMonitor();

// ── Token / user tracker ──
const tracker = new (class {
    constructor() {
        this.programs = paperclip.agents.map(a => ({
            id: a.id, name: a.name,
            device: 'laptop', status: a.status, visible: true,
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
app.get('/api/quota-status', (req, res) => {
    res.json({
        statuses: quotaTracker.getAllStatuses(),
        grouped: quotaTracker.getStatusesByGroup(),
        timestamp: new Date().toISOString()
    });
});
app.get('/api/quota-status/:apiId', (req, res) => {
    const status = quotaTracker.getDisplayStatus(req.params.apiId);
    res.json(status);
});
app.post('/api/quota-status/:apiId', (req, res) => {
    const updated = quotaTracker.updateQuotaStatus(req.params.apiId, req.body);
    res.json(updated);
});

app.get('/api/hermes-agents', async (req, res) => {
    await paperclip.refresh();
    res.json({
        agents: paperclip.agents,
        timestamp: new Date().toISOString()
    });
});

app.get('/',             (req, res) => res.sendFile(path.join(__dirname, 'index-fishtank-colored.html')));
app.use(express.static(__dirname));

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Dashboard → http://0.0.0.0:${PORT}`);
});
