const express = require('express');
const path = require('path');
const EventEmitter = require('events');

const app = express();
const PORT = process.env.PORT || 8080;

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
        // Set up the 3 key devices as requested
        this.devices = [
            { id: 'aws-cloud', type: 'aws', name: 'AWS Cloud Instance' },
            { id: 'mobile-phone', type: 'phone', name: 'Mobile Phone' },
            { id: 'dev-laptop', type: 'laptop', name: 'Development Laptop' }
        ];

        // Coding agents primarily on the laptop
        this.activeUsers.set('picoclaw', {
            id: 'picoclaw',
            name: 'PicoClaw',
            version: 'v2.1',
            device: 'dev-laptop',
            program: 'System Service',
            color: '#00ff80',
            requests: 245,
            lastSeen: Date.now(),
            status: 'online'
        });
        
        this.activeUsers.set('gemini', {
            id: 'gemini',
            name: 'Gemini CLI',
            version: 'v1.5',
            device: 'dev-laptop',
            program: 'Terminal',
            color: '#4285F4',
            requests: 156,
            lastSeen: Date.now(),
            status: 'online'
        });

        this.activeUsers.set('claude', {
            id: 'claude',
            name: 'Claude Code',
            version: 'v0.8',
            device: 'dev-laptop',
            program: 'VS Code',
            color: '#FF6B35',
            requests: 89,
            lastSeen: Date.now(),
            status: 'online'
        });

        this.activeUsers.set('aider', {
            id: 'aider',
            name: 'Aider',
            version: 'v0.35',
            device: 'dev-laptop',
            program: 'Terminal',
            color: '#bb86fc',
            requests: 124,
            lastSeen: Date.now(),
            status: 'online'
        });

        this.activeUsers.set('groq', {
            id: 'groq',
            name: 'Groq CLI',
            version: 'v1.0',
            device: 'aws-cloud',
            program: 'API Gateway',
            color: '#f55036',
            requests: 567,
            lastSeen: Date.now(),
            status: 'online'
        });
    }
    
    createUsageSnapshot() {
        // Simulate realistic usage patterns
        const now = Date.now();
        const usage = (Math.sin(now / 500000) + 1) / 2; // Faster oscillation for demo
        
        return {
            providers: [
                {
                    name: 'OpenAI',
                    color: '#00A86B',
                    models: [
                        { name: 'GPT-4o', used: Math.floor(usage * 150 + 30), limit: 200, usage: Math.round(usage * 60 + 20), description: 'Powerful language model', stars: 5 },
                        { name: 'GPT-4o Mini', used: Math.floor(usage * 180 + 150), limit: 500, usage: Math.round(usage * 40 + 10), description: 'Efficient model', stars: 4 },
                        { name: 'GPT-3.5 Turbo', used: Math.floor(usage * 250 + 700), limit: 1000, usage: Math.round(usage * 20 + 70), description: 'Legacy fast model', stars: 3 }
                    ]
                },
                {
                    name: 'Anthropic',
                    color: '#FF6B35',
                    models: [
                        { name: 'Claude 3.5 Sonnet', used: Math.floor(usage * 80 + 40), limit: 150, usage: Math.round(usage * 55 + 35), description: 'Advanced reasoning', stars: 5 },
                        { name: 'Claude 3 Opus', used: Math.floor(usage * 30 + 10), limit: 50, usage: Math.round(usage * 70 + 20), description: 'Highest intelligence', stars: 5 },
                        { name: 'Claude Haiku', used: Math.floor(usage * 200 + 50), limit: 300, usage: Math.round(usage * 40 + 10), description: 'Fast and efficient', stars: 4 }
                    ]
                },
                {
                    name: 'Google',
                    color: '#4285F4',
                    models: [
                        { name: 'Gemini 1.5 Pro', used: Math.floor(usage * 70 + 10), limit: 100, usage: Math.round(usage * 85 + 5), description: 'Gemini chat model', stars: 5 },
                        { name: 'Gemini 1.5 Flash', used: Math.floor(usage * 160 + 20), limit: 200, usage: Math.round(usage * 60 + 15), description: 'Gemini fast model', stars: 4 },
                        { name: 'Gemini 1.0 Pro', used: Math.floor(usage * 30 + 10), limit: 50, usage: Math.round(usage * 40 + 10), description: 'Legacy Gemini', stars: 3 }
                    ]
                },
                {
                    name: 'Groq',
                    color: '#f55036',
                    models: [
                        { name: 'Llama 3 70B', used: Math.floor(usage * 45 + 5), limit: 60, usage: Math.round(usage * 90 + 5), description: 'Large language model', stars: 5 },
                        { name: 'Llama 3 8B', used: Math.floor(usage * 120 + 20), limit: 200, usage: Math.round(usage * 75 + 10), description: 'Efficient model', stars: 4 },
                        { name: 'Mixtral 8x7B', used: Math.floor(usage * 60 + 10), limit: 100, usage: Math.round(usage * 50 + 20), description: 'MoE model', stars: 4 }
                    ]
                }
            ],
            users: this.getUsers(),
            devices: this.devices,
            timestamp: new Date().toISOString()
        };
    }
    
    getUsers() {
        return Array.from(this.activeUsers.values());
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

app.get('/api/users', (req, res) => {
    res.json({
        users: tracker.getUsers(),
        devices: tracker.devices,
        timestamp: new Date().toISOString()
    });
});

app.get('/api/active', (req, res) => {
    res.json({
        users: tracker.getUsers(),
        devices: tracker.devices,
        timestamp: new Date().toISOString()
    });
});

// Track usage events
app.post('/api/track', (req, res) => {
    const { deviceId } = req.body;
    if (!deviceId) {
        return res.status(400).json({ error: 'deviceId is required' });
    }
    return res.json({ success: true, deviceId, timestamp: Date.now() });
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

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Static files (moved after specific routes)
app.use(express.static(__dirname));

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Token Visualization Dashboard`);
    console.log(`🌐 Running on: http://localhost:${PORT}`);
    console.log(`📊 Try these URLs:`);
    console.log('   • / for grid visualization');
    console.log('   • /dashboard for user grid');
});