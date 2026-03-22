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
                    { name: 'Llama2', used: Math.floor(usage * 30), limit: 1000 },
                    { name: 'CodeLlama', used: Math.floor(usage * 25), limit: 1000 },
                    { name: 'Mistral', used: Math.floor(2 + usage * 8), limit: 100 }
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