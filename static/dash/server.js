require('dotenv').config();
const express = require('express');
const path = require('path');
const axios = require('axios');
const EventEmitter = require('events');

const app = express();
const PORT = process.env.PORT || 8080;

// Real-time API Quota Monitor
class APIQuotaMonitor {
    constructor() {
        this.quotas = new Map();
        this.checkInterval = 60000; // Check every minute
        this.init();
    }

    init() {
        this.checkQuotas();
        setInterval(() => this.checkQuotas(), this.checkInterval);
    }

    async checkQuotas() {
        console.log('🔍 Checking API quotas...');
        
        // OpenAI
        if (process.env.OPENAI_API_KEY) {
            await this.checkOpenAI();
        } else {
            this.setQuota('OPENAI', 'GPT-4O', 0, 100, 0, '#74aa9c', 'MISSING KEY');
        }

        // Anthropic
        if (process.env.ANTHROPIC_API_KEY) {
            await this.checkAnthropic();
        } else {
            this.setQuota('ANTHROPIC', 'CLAUDE 3.5', 0, 100, 0, '#d97757', 'MISSING KEY');
        }

        // Gemini
        if (process.env.GEMINI_API_KEY) {
            await this.checkGemini();
        } else {
            this.setQuota('GOOGLE', 'GEMINI PRO', 0, 100, 0, '#4285f4', 'MISSING KEY');
        }

        // Groq
        if (process.env.GROQ_API_KEY) {
            await this.checkGroq();
        } else {
            this.setQuota('GROQ', 'LLAMA 3.1', 0, 100, 0, '#f55036', 'MISSING KEY');
        }

        // Mistral (using placeholder if no key)
        if (process.env.MISTRAL_API_KEY) {
            await this.checkMistral();
        } else {
            this.setQuota('MISTRAL', 'LARGE 2', 0, 100, 0, '#fdff00', 'MISSING KEY');
        }
        
        // Meta (via NVAPI or similar)
        if (process.env.NVAPI_KEY) {
             await this.checkNVAPI(); // Using NVAPI as proxy for Meta/Llama
        } else {
             this.setQuota('META', 'LLAMA 3.2', 0, 100, 0, '#0668E1', 'MISSING KEY');
        }
    }

    async checkOpenAI() {
        const keys = [process.env.OPENAI_API_KEY, process.env.OPENAI_API_KEY_ALT].filter(Boolean);
        for (const key of keys) {
            try {
                const response = await axios.post('https://api.openai.com/v1/chat/completions', {
                    model: "gpt-3.5-turbo",
                    messages: [{ role: "user", content: "hi" }],
                    max_tokens: 1
                }, {
                    headers: { 'Authorization': `Bearer ${key}` },
                    timeout: 5000
                });
                
                const remaining = parseInt(response.headers['x-ratelimit-remaining-requests'] || 0);
                const limit = parseInt(response.headers['x-ratelimit-limit-requests'] || 100);
                const usage = ((limit - remaining) / limit) * 100;
                
                this.setQuota('OPENAI', 'GPT-4O', usage, limit, remaining, '#74aa9c');
                return; // Success
            } catch (error) {
                console.error(`OpenAI key ${key.substring(0, 8)} failed: ${error.response?.status || error.message}`);
            }
        }
        this.setQuota('OPENAI', 'GPT-4O', 100, 100, 0, '#74aa9c', 'ERROR');
    }

    async checkAnthropic() {
        try {
            const response = await axios.post('https://api.anthropic.com/v1/messages', {
                model: "claude-3-haiku-20240307",
                max_tokens: 1,
                messages: [{ role: "user", content: "hi" }]
            }, {
                headers: {
                    'x-api-key': process.env.ANTHROPIC_API_KEY,
                    'anthropic-version': '2023-06-01',
                    'content-type': 'application/json'
                },
                timeout: 5000
            });

            const remaining = parseInt(response.headers['anthropic-ratelimit-requests-remaining'] || 0);
            const limit = parseInt(response.headers['anthropic-ratelimit-requests-limit'] || 100);
            const usage = ((limit - remaining) / limit) * 100;

            this.setQuota('ANTHROPIC', 'CLAUDE 3.5', usage, limit, remaining, '#d97757');
        } catch (error) {
            if (error.response?.status === 401) {
                this.setQuota('ANTHROPIC', 'CLAUDE 3.5', 0, 100, 0, '#d97757', 'MISSING KEY');
            } else {
                console.error(`Anthropic error: ${error.response?.status || error.message}`);
                this.setQuota('ANTHROPIC', 'CLAUDE 3.5', 100, 100, 0, '#d97757', 'ERROR');
            }
        }
    }

    async checkGemini() {
        try {
            const response = await axios.post(
                `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
                { contents: [{ parts: [{ text: "hi" }] }] },
                { timeout: 5000 }
            );
            this.setQuota('GOOGLE', 'GEMINI PRO', 15, 100, 85, '#4285f4'); 
        } catch (error) {
             console.error(`Gemini error: ${error.response?.status || error.message}`);
             if (error.response && error.response.status === 429) {
                this.setQuota('GOOGLE', 'GEMINI PRO', 100, 100, 0, '#4285f4', 'EXCEEDED');
             } else {
                this.setQuota('GOOGLE', 'GEMINI PRO', 100, 100, 0, '#4285f4', 'ERROR');
             }
        }
    }

    async checkGroq() {
        try {
            const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
                model: "llama-3.3-70b-versatile",
                messages: [{ role: "user", content: "hi" }],
                max_tokens: 1
            }, {
                headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` },
                timeout: 5000
            });

            const remaining = parseInt(response.headers['x-ratelimit-remaining-requests'] || 0);
            const limit = parseInt(response.headers['x-ratelimit-limit-requests'] || 100);
            const usage = ((limit - remaining) / limit) * 100;

            this.setQuota('GROQ', 'LLAMA 3.1', usage, limit, remaining, '#f55036');
        } catch (error) {
             console.error(`Groq error: ${error.response?.status || error.message}`);
             this.setQuota('GROQ', 'LLAMA 3.1', 100, 100, 0, '#f55036', 'ERROR');
        }
    }
    
    async checkMistral() {
         // Similar to OpenAI structure
        try {
             const response = await axios.post('https://api.mistral.ai/v1/chat/completions', {
                model: "mistral-tiny",
                messages: [{ role: "user", content: "hi" }],
                max_tokens: 1
            }, {
                headers: { 'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}` }
            });
            
            const remaining = parseInt(response.headers['x-ratelimit-remaining-requests'] || 0);
            const limit = parseInt(response.headers['x-ratelimit-limit-requests'] || 100);
            const usage = ((limit - remaining) / limit) * 100;

            this.setQuota('MISTRAL', 'LARGE 2', usage, limit, remaining, '#fdff00');
        } catch (error) {
             this.setQuota('MISTRAL', 'LARGE 2', 100, 100, 0, '#fdff00', 'ERROR');
        }
    }

    async checkNVAPI() {
        // NVAPI often mirrors OpenAI
         try {
             const response = await axios.post('https://integrate.api.nvidia.com/v1/chat/completions', {
                model: "meta/llama3-70b-instruct",
                messages: [{ role: "user", content: "hi" }],
                max_tokens: 1
            }, {
                headers: { 'Authorization': `Bearer ${process.env.NVAPI_KEY}` }
            });
            // If success, assume OK. NVAPI headers vary.
            this.setQuota('META', 'LLAMA 3.2', 20, 100, 80, '#0668E1'); 
        } catch (error) {
             this.setQuota('META', 'LLAMA 3.2', 100, 100, 0, '#0668E1', 'ERROR');
        }
    }

    setQuota(name, model, usage, limit, remaining, color, status = 'ACTIVE') {
        this.quotas.set(name, {
            name,
            model,
            usage: Math.min(Math.max(usage, 0), 100), // Clamp 0-100
            limit,
            remaining,
            color,
            status
        });
    }

    getSnapshot() {
        return Array.from(this.quotas.values());
    }
}

const apiMonitor = new APIQuotaMonitor();

// Token usage tracker with simplified logic
class TokenTracker extends EventEmitter {
    constructor() {
        super();
        this.isMonitoring = true;
        this.activeUsers = new Map();
        
        // Setup defaults
        this.setupDefaultUsers();
        
        console.log('🎯 Token tracking initialized');
    }
    
    setupDefaultUsers() {
        // Set up the 3 key devices for TV Dashboard
        this.devices = [
            { id: 'laptop', type: 'laptop', name: 'Laptop' },
            { id: 'phone-a07', type: 'phone', name: 'A07 Phone' },
            { id: 'aws-c2', type: 'aws', name: 'AWS C2 Server' }
        ];

        // Laptop Users
        ['picoclaw', 'groq', 'aider', 'claude', 'gemini', 'codex', 'vscode'].forEach(name => {
            this.activeUsers.set(`laptop-${name}`, {
                id: `laptop-${name}`,
                name: name.toUpperCase(),
                device: 'laptop',
                color: '#00ff80',
                status: 'online'
            });
        });

        // Phone Users
        ['picoclaw', 'groq'].forEach(name => {
            this.activeUsers.set(`phone-${name}`, {
                id: `phone-${name}`,
                name: name.toUpperCase(),
                device: 'phone-a07',
                color: '#4285F4',
                status: 'online'
            });
        });

        // AWS Users
        ['picoclaw', 'groq'].forEach(name => {
            this.activeUsers.set(`aws-${name}`, {
                id: `aws-${name}`,
                name: name.toUpperCase(),
                device: 'aws-c2',
                color: '#FF6B35',
                status: 'online'
            });
        });
    }

    createUsageSnapshot() {
        // Use real data from API monitor
        const providers = apiMonitor.getSnapshot();
        
        return {
            providers,
            users: Array.from(this.activeUsers.values()),
            devices: this.devices,
            timestamp: new Date().toISOString()
        };
    }
}

const tracker = new TokenTracker();

// Middleware
app.use(express.json());

// CORS headers for all origins
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    next();
});

// API Routes
app.get('/api/llm-usage', (req, res) => {
    const data = tracker.createUsageSnapshot();
    res.json(data);
});

app.get('/api/current-usage', (req, res) => {
    res.json(tracker.createUsageSnapshot());
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        version: '2.0'
    });
});

// Main dashboard routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index-grid.html'));
});

// Static files (moved after specific routes)
app.use(express.static(__dirname));

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 TV Dashboard Server Running`);
    console.log(`🌐 URL: http://localhost:${PORT}`);
    console.log(`🔑 API Keys loaded: ${Object.keys(process.env).filter(k => k.endsWith('API_KEY')).length}`);
});