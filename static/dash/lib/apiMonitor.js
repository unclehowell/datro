const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

class APIMonitor {
  constructor(configPath = './config/apis.json') {
    this.configPath = configPath;
    this.apis = new Map();
    this.usageHistory = new Map();
    this.loadConfig();
  }

  async loadConfig() {
    try {
      const config = await fs.readFile(this.configPath, 'utf8');
      const apiConfigs = JSON.parse(config).apis;
      
      apiConfigs.forEach(api => {
        this.apis.set(api.id, {
          ...api,
          lastReset: new Date(api.lastReset),
          customHeaders: api.customHeaders || {}
        });
      });
    } catch (error) {
      console.warn('Could not load API config, using defaults');
      this.setDefaultAPIs();
    }
  }

  setDefaultAPIs() {
    this.apis.set('gemini-pro', {
      id: 'gemini-pro',
      provider: 'Gemini',
      model: 'gemini-pro',
      limit: 60,
      unit: 'RPM',
      endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro',
      token: process.env.GEMINI_API_KEY,
      headers: { 'x-goog-api-key': process.env.GEMINI_API_KEY }
    });

    this.apis.set('groq-llama', {
      id: 'groq-llama',
      provider: 'Groq',
      model: 'llama3-70b-8192',
      limit: 30,
      unit: 'RPM',
      endpoint: 'https://api.groq.com/openai/v1/models/llama3-70b-8192',
      token: process.env.GROQ_API_KEY,
      headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` }
    });

    this.apis.set('openai-gpt4', {
      id: 'openai-gpt4',
      provider: 'OpenAI',
      model: 'gpt-4o-mini',
      limit: 500,
      unit: 'TPM',
      endpoint: 'https://api.openai.com/v1/models/gpt-4o-mini',
      token: process.env.OPENAI_API_KEY,
      headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` }
    });
  }

  async checkUsage(apiId) {
    const api = this.apis.get(apiId);
    if (!api) return null;

    try {
      const usage = await this.fetchRealUsage(api);
      this.recordUsage(apiId, usage);
      return {
        ...api,
        used: usage.current,
        remaining: api.limit - usage.current,
        usagePercentage: (usage.current / api.limit) * 100,
        lastUpdated: new Date(),
        trends: this.calculateTrends(apiId)
      };
    } catch (error) {
      console.error(`Error checking usage for ${apiId}:`, error);
      return this.getFallbackUsage(api);
    }
  }

  async fetchRealUsage(api) {
    // Implement actual API calls based on provider specifications
    // This is a simplified version
    
    const currentTime = Date.now();
    const mockUsage = {
      current: Math.floor(Math.random() * api.limit),
      today: Math.floor(Math.random() * api.limit * 10),
      thisWeek: Math.floor(Math.random() * api.limit * 50)
    };

    return mockUsage;
  }

  getFallbackUsage(api) {
    return {
      ...api,
      used: Math.floor(Math.random() * api.limit),
      remaining: api.limit - Math.floor(Math.random() * api.limit),
      usagePercentage: Math.random() * 100,
      lastUpdated: new Date()
    };
  }

  recordUsage(apiId, usage) {
    if (!this.usageHistory.has(apiId)) {
      this.usageHistory.set(apiId,[]);
    }
    
    const history = this.usageHistory.get(apiId);
    history.push({
      timestamp: Date.now(),
      currentUsage: usage.current,
      percentage: (usage.current / this.apis.get(apiId).limit) * 100
    });

    // Keep only last 30 days
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    this.usageHistory.set(apiId, history.filter(h => h.timestamp > thirtyDaysAgo));
  }

  calculateTrends(apiId) {
    const history = this.usageHistory.get(apiId) || [];
    if (history.length < 2) return { trend: 'stable', dailyIncrease: 0 };

    // Calculate trend based on recent vs older usage
    const recent = history.slice(-7);
    const older = history.slice(-14, -7);
    
    if (recent.length === 0 || older.length === 0) return { trend: 'stable', dailyIncrease: 0 };

    const recentAvg = recent.reduce((sum, h) => sum + h.percentage, 0) / recent.length;
    const olderAvg = older.reduce((sum, h) => sum + h.percentage, 0) / older.length;

    const dailyIncrease = (recentAvg - olderAvg) / 7;
    
    let trend = 'stable';
    if (recentAvg > olderAvg + 10) trend = 'increasing';
    else if (recentAvg < olderAvg - 10) trend = 'decreasing';

    return { trend, dailyIncrease };
  }

  async getAllAPIUsage() {
    const results = [];
    
    for (const apiId of this.apis.keys()) {
      const usage = await this.checkUsage(apiId);
      if (usage) results.push(usage);
    }

    return results;
  }

  async saveConfig() {
    const configData = {
      apis: Array.from(this.apis.values())
    };
    
    await fs.writeFile(this.configPath, JSON.stringify(configData, null, 2));
  }

  async addAPI(apiConfig) {
    this.apis.set(apiConfig.id, {
      ...apiConfig,
      lastReset: new Date(),
      customHeaders: apiConfig.customHeaders || {}
    });
    
    await this.saveConfig();
  }

  removeAPI(apiId) {
    this.apis.delete(apiId);
    this.usageHistory.delete(apiId);
    this.saveConfig();
  }
}

module.exports = APIMonitor;