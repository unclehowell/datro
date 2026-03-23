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
        const now = Date.now();
        // One model per "Provider Box" for the TV layout
        const providers = [
            { name: 'OPENAI', model: 'GPT-4O', usage: Math.round(40 + Math.sin(now/5000)*30), color: '#74aa9c' },
            { name: 'ANTHROPIC', model: 'CLAUDE 3.5', usage: Math.round(50 + Math.cos(now/4000)*20), color: '#d97757' },
            { name: 'GOOGLE', model: 'GEMINI PRO', usage: Math.round(30 + Math.sin(now/6000)*40), color: '#4285f4' },
            { name: 'GROQ', model: 'LLAMA 3.1', usage: Math.round(70 + Math.sin(now/3000)*25), color: '#f55036' },
            { name: 'MISTRAL', model: 'LARGE 2', usage: Math.round(20 + Math.cos(now/7000)*15), color: '#fdff00' },
            { name: 'META', model: 'LLAMA 3.2', usage: Math.round(45 + Math.sin(now/5500)*35), color: '#0668E1' }
        ];
        
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
});