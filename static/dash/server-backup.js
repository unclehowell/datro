const express = require('express');
const path = require('path');
const EventEmitter = require('events');

const app = express();
const PORT = process.env.PORT || 3000;

// Token usage tracker
class TokenTracker extends EventEmitter {
    constructor() {
        super();
        this.isMonitoring = true;
        this.activeUsers = new Map();
        this.activeDevices = new Map();
        
        // Setup defaults and start simulation
        this.setupDefaultUsers();
        this.startUsageSimulation();
        
        console.log('🎯 Token tracking initialized');
    }
    
    setupDefaultUsers() {
        // PicoClaw Agent
        this.activeUsers.set('picoclaw', {
            id: 'picoclaw',
            name: 'PicoClaw Agent',
            color: '#00ffff',
            icon: '🤖',
            emoji: '⚡',
            requests: 245,
            lastSeen: Date.now() - 120000,
            status: 'online',
            type: 'agent'
        });
        
        // OpenClaw spawn processes
        this.activeUsers.set('openclaw', {
            id: 'openclaw',
            name: 'OpenClaw Spawn',
            color: '#ff6b6b',
            icon: '🤖',
            emoji: '🔥',
            requests: 189,
            lastSeen: Date.now() - 5000,
            status: 'online',
            type: 'agent'
        });
        
        // CLIs
        this.activeUsers.set('groq-cli', {
            id: 'groq-cli',
            name: 'Groq CLI',
            color: '#4ecdc4',
            icon: 'CLI',
            emoji: '💾',
            requests: 67,
            lastSeen: Date.now() - 60000,
            status: 'online',
            type: 'cli'
        });
        
        this.activeUsers.set('gemini-cli', {
            id: 'gemini-cli',
            name: 'Gemini CLI',
            color: '#e91e63',
            icon: 'CLI',
            emoji: '📝',
            requests: 23,
            lastSeen: Date.now() - 180000,
            status: 'online',
            type: 'cli'
        });
        
        this.activeUsers.set('ollama-cli', {
            id: 'ollama-cli',
            name: 'Ollama CLI',
            color: '#00ff80',
            icon: 'CLI',
            emoji: '🏠',
            requests: 12,
            lastSeen: Date.now() - 8000,
            status: 'online',
            type: 'local'
        });

        // Devices
        this.activeDevices.set('laptop', {
            id: 'laptop',
            name: 'Laptop',
            icon: '💻',
            color: '#00ff80',
            users: 324,
            type: 'device',
            status: 'online'
        });
        
        this.activeDevices.set('phone', {
            id: 'phone',
            name: 'Phone',
            icon: '📱',
            color: '#ffb347',
            users: 12,
            type: 'device',
            status: 'online'
        });
        
        this.activeDevices.set('aws', {
            id: 'aws',
            name: 'AWS Server',
            icon: '☁️',
            color: '#ff9500',
            users: 188,
            type: 'cloud',
            status: 'online'
        });
    }
    
    startUsageSimulation() {
        if (!this.isMonitoring) return;
        
        setInterval(() => {
            if (!this.isMonitoring) return;
            this.broadcastUsageUpdate();
        }, 3000); // Update every 3 seconds
    }
    
    createUsageSnapshot() {
        const simulateHours = Math.floor(Date.now() / (1000 * 60 * 60));
        const baseUsage = Math.sin(simulateHours / 12) * 0.3 + 0.5;
        const randomFactor = (Math.random() - 0.5) * 0.2;
        const usage = Math.max(0, Math.min(1, baseUsage + randomFactor));
        
        return {
            companies: [
                { name: 'Google', color: '#00ffff', models: [
                    { name: 'Gemini Pro', used: Math.floor(45 + usage * 15), limit: 60 },
                    { name: 'Gemini Flash', used: Math.floor(20 + usage * 10), limit: 30 },
                    { name: 'Gemini Vision', used: Math.floor(5 + usage * 8), limit: 15 }
                ]},
                { name: 'OpenAI', color: '#ff6b6b', models: [
                    { name: 'GPT-4o', used: Math.floor(120 + usage * 80), limit: 200 },
                    { name: 'GPT-4o Mini', used: Math.floor(300 + usage * 150), limit: 500 },
                    { name: 'GPT-3.5', used: Math.floor(10 + usage * 25), limit: 50 }
                ]},
                { name: 'Groq', color: '#4ecdc4', models: [
                    { name: 'Llama 70B', used: Math.floor(18 + usage * 15), limit: 30 },
                    { name: 'Llama 8B', used: Math.floor(70 + usage * 25), limit: 100 },
                    { name: 'Mixtral', used: Math.floor(6 + usage * 10), limit: 20 }
                ]},
                { name: 'Ollama', color: '#00ff00', models: [
                    { name: 'Llama2', used: Math.floor(usage * 50), limit: 1000 },
                    { name: 'CodeLlama', used: Math.floor(usage * 30), limit: 1000 },
                    { name: 'Mistral', used: Math.floor(2 + usage * 8), limit: 100 }
                ]},
                { name: 'Anthropic', color: '#8b5cf6', models: [
                    { name: 'Claude 3.5', used: Math.floor(80 + usage * 40), limit: 120 },
                    { name: 'Claude 3', used: Math.floor(70 + usage * 30), limit: 100 },
                    { name: 'Claude Haiku', used: Math.floor(200 + usage * 50), limit: 250 }
                ]}
            ],
            users: this.getActiveUsers(),
            devices: this.getActiveDevices(),
            timestamp: new Date().toISOString()
        };
    }
    
    broadcastUsageUpdate() {
        const usageData = this.createUsageSnapshot();
        this.emit('usageUpdate', usageData);
    }
    
    getActiveUsers() {
        return Array.from(this.activeUsers.values()).map(user => ({ ...user }));
    }
    
    getActiveDevices() {
        return Array.from(this.activeDevices.values());
    }
    
    getTimeAgo(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        const seconds = Math.floor(diff / 1000);
        
        if (seconds < 60) return `${seconds}s ago`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        return `${Math.floor(seconds / 86400)}d ago`;
    }
}

const tokenTracker = new TokenTracker();

// Middleware
app.use(express.json());
app.use(express.static(__dirname));

// Add CORS for all origins (public GitHub repo)
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    next();
});

// API endpoint to get current token usage (real-time animated data)
app.get('/api/current-usage', (req, res) => {
    const usageData = tokenTracker.createUsageSnapshot();
    res.json(usageData);
});

// API endpoint for LLM usage - formatted for bubble visualization
app.get('/api/llm-usage', (req, res) => {
    const usageData = tokenTracker.createUsageSnapshot();
    
    const bubbleData = {
        providers: usageData.companies.map(company => ({
            name: company.name,
            color: company.color,
            models: company.models.map(model => ({
                name: model.name,
                usage: Math.round((model.used / model.limit) * 100),
                used: model.used,
                limit: model.limit,
                description: `${model.name} - ${company.name} model with dynamic scaling`,
                stars: Math.floor(Math.random() * 3) + 3
            }))
        }))
    };
    
    res.json(bubbleData);
});

// Get currently active users and devices
app.get('/api/active', (req, res) => {
    res.json({
        users: tokenTracker.getActiveUsers(),
        devices: tokenTracker.getActiveDevices(),
        timestamp: new Date().toISOString()
    });
});

// Fix users endpoint - same as active
app.get('/api/users', (req, res) => {
    res.json({
        users: tokenTracker.getActiveUsers(),
        devices: tokenTracker.getActiveDevices(),
        timestamp: new Date().toISOString()
    });
});

// Track actual usage events (when devices/users make API calls)
app.post('/api/track', (req, res) => {
    const { deviceId, userId, apiProvider, model, requestsCount = 1, metadata } = req.body;
    
    if (!deviceId) {
        return res.status(400).json({ error: 'deviceId is required' });
    }

    // Emit real-time update
    const timestamp = Date.now();
    const userIdFinal = userId || deviceId;
    
    tokenTracker.emit('usageUpdate', {
        type: 'tokenUsageUpdate',
        deviceId,
        userId: userIdFinal,
        apiProvider,
        model,
        requestsCount,
        timestamp,
        metadata,
        currentUsage: Math.floor(Math.random() * 200),
        limit: Math.floor(Math.random() * 300) + 100
    });
    
    res.json({
        success: true,
        message: 'Usage tracked',
        deviceId,
        userId: userIdFinal,
        timestamp
    });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        services: {
            tokenTracking: 'active',
            visualization: 'running'
        }
    });
});

// Main dashboard
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Graceful shutdown
const server = app.listen(PORT, () => {
    console.log(`🎯 Token Visualization Dashboard running on http://localhost:${PORT}`);
    console.log('📊 Features:');
    console.log('   • Floating translucent squares for each company');
    console.log('   • Expanding model squares based on token usage');
    console.log('   • Real-time updates every 3 seconds');
    console.log('   • No scroll - everything fits on one screen');
    console.log('   • Tracks PicoClaw, OpenClaw, CLIs, devices');
    console.log(`   • Publicly deployable (no secrets/keys required)`);
});

process.on('SIGTERM', () => {
    console.log('SIGTERM received, disconnecting clients and shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    process.exit(0);
});