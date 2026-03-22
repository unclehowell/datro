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
        // Set up some example users
        this.activeUsers.set('picoclaw', {
            id: 'picoclaw',
            name: 'PicoClaw Agent',
            color: '#00ff80',
            emoji: '⚡',
            requests: 245,
            lastSeen: Date.now(),
            status: 'online',
            type: 'agent'
        });
        
        this.activeUsers.set('gemini-cli', {
            id: 'gemini-cli',
            name: 'Gemini CLI',
            color: '#4285F4',
            emoji: '📝',
            requests: 23,
            lastSeen: Date.now(),
            status: 'online',
            type: 'cli'
        });
    }
    
    createUsageSnapshot() {
        // Simulate realistic usage patterns
        const now = Date.now();
        const usage = (Math.sin(now / 5000000) + 1) / 2; // Time-based oscillation
        
        return {
            providers: [
                {
                    name: 'OpenAI',
                    color: '#00A86B',
                    models: [
                        { name: 'GPT-4o', used: Math.floor(usage * 150 + 30), limit: 200, usage: Math.round(usage * 80 + 20), description: 'Powerful language model', stars: 5 },
                        { name: 'GPT-4o Mini', used: Math.floor(usage * 180 + 150), limit: 500, usage: Math.round(usage * 50 + 40), description: 'Efficient model', stars: 4 }
                    ]
                },
                {
                    name: 'Anthropic',
                    color: '#FF6B35',
                    models: [
                        { name: 'Claude 3.5', used: Math.floor(usage * 80 + 40), limit: 120, usage: Math.round(usage * 75 + 25), description: 'Advanced reasoning', stars: 5 },
                        { name: 'Claude Haiku', used: Math.floor(usage * 200 + 50), limit: 250, usage: Math.round(usage * 80 + 20), description: 'Fast and efficient', stars: 4 }
                    ]
                },
                {
                    name: 'Google',
                    color: '#4285F4',
                    models: [
                        { name: 'Gemini Pro', used: Math.floor(usage * 70 + 10), limit: 100, usage: Math.round(usage * 65 + 10), description: 'Gemini chat model', stars: 4 },
                        { name: 'Gemini Flash', used: Math.floor(usage * 60 + 20), limit: 90, usage: Math.round(usage * 70 + 15), description: 'Gemini vision model', stars: 3 }
                    ]
                },
                {
                    name: 'Groq',
                    color: '#1DA1F2',
                    models: [
                        { name: 'Llama 70B', used: Math.floor(usage * 45 + 5), limit: 50, usage: Math.round(usage * 90 + 5), description: 'Large language model', stars: 4 },
                        { name: 'Llama 8B', used: Math.floor(usage * 80 + 20), limit: 100, usage: Math.round(usage * 75 + 25), description: 'Efficient model', stars: 3 }
                    ]
                }
            ],
            users: this.getUsers(),
            devices: [],
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
app.use(express.static(__dirname));

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

// Same as /api/active for backwards compatibility
app.get('/api/users', (req, res) => {
    res.json({
        users: tracker.getUsers(),
        devices: [],
        timestamp: new Date().toISOString()
    });
});

app.get('/api/active', (req, res) => {
    res.json({
        users: tracker.getUsers(),
        devices: [],
        timestamp: new Date().toISOString()
    });
});

// Track usage events
app.post('/api/track', (req, res) => {
    const { deviceId } = req.body;
    if (!deviceId) {
        return res.status(400).json({ error: 'deviceId is required' });
    }
    // For demo purposes, just return success
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
    res.sendFile(path.join(__dirname, 'index-bubble.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Token Visualization Dashboard`);
    console.log(`🌐 Running on: http://localhost:${PORT}`);
    console.log(`📊 Try these URLs:`);
    console.log('   • / for bubble visualization');
    console.log('   • /dashboard for user grid');
});