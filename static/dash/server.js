const express = require('express');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(__dirname));

// API endpoint to get LLM usage data
app.get('/api/llm-usage', (req, res) => {
  const usageData = getLLMUsageData();
  res.json(usageData);
});

// API endpoint to get active users and their colors
app.get('/api/users', (req, res) => {
  const users = getActiveUsers();
  res.json(users);
});

// Get LLM usage data from various sources
function getLLMUsageData() {
  const data = {
    models: [],
    lastUpdated: new Date().toISOString()
  };

  // Check if picoclaw is running
  const picoclawStatus = checkPicoclawStatus();
  
  // Add picoclaw data if available
  if (picoclawStatus.isRunning) {
    data.models.push({
      id: 'picoclaw',
      model: 'PicoClaw Agent',
      provider: 'Local',
      limit: 1000,
      used: picoclawStatus.usage || 0,
      unit: 'Requests',
      rating: 5,
      isActive: true,
      user: picoclawStatus.user || 'picoclaw'
    });
  }

  // Add other LLM API usage (this would be fetched from your monitoring system)
  data.models.push(
    {
      id: 'gemini-user1',
      model: 'Gemini Pro',
      provider: 'Google',
      limit: 60,
      used: 45,
      unit: 'Requests/min',
      rating: 4,
      isActive: true,
      user: 'researcher'
    },
    {
      id: 'groq-dev1',
      model: 'Llama 3 70B',
      provider: 'Groq',
      limit: 30,
      used: 12,
      unit: 'RPM',
      rating: 5,
      isActive: true,
      user: 'developer'
    },
    {
      id: 'openai-backend',
      model: 'GPT-4o Mini',
      provider: 'OpenAI',
      limit: 500,
      used: 150,
      unit: 'TPM',
      rating: 5,
      isActive: true,
      user: 'backend'
    }
  );

  return data;
}

function checkPicoclawStatus() {
  try {
    // Check if picoclaw is running
    // This would be customized based on how picoclaw is actually running
    const isRunning = fs.existsSync('/tmp/picoclaw.pid') || 
                     (process.env.PICOCLAW_PID && fs.existsSync(`/proc/${process.env.PICOCLAW_PID}`));
    
    return {
      isRunning: isRunning,
      usage: 450, // Simulated usage
      user: 'picoclaw'
    };
  } catch (error) {
    return {
      isRunning: false,
      usage: 0,
      user: 'picoclaw'
    };
  }
}

function getActiveUsers() {
  return {
    users: [
      { id: 'picoclaw', name: 'PicoClaw Agent', color: '#00ff00', isActive: true },
      { id: 'researcher', name: 'Research Bot', color: '#ff6b6b', isActive: true },
      { id: 'developer', name: 'Dev Assistant', color: '#4ecdc4', isActive: true },
      { id: 'backend', name: 'Backend Service', color: '#45b7d1', isActive: true }
    ],
    colorKey: [
      { name: 'PicoClaw', color: '#00ff00', description: 'Local AI Agent' },
      { name: 'Research', color: '#ff6b6b', description: 'General Research' },
      { name: 'Development', color: '#4ecdc4', description: 'Code Generation & Dev' },
      { name: 'Backend', color: '#45b7d1', description: 'Production Services' }
    ]
  };
}

// Serve the dashboard
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 LLM Dashboard running on http://localhost:${PORT}`);
  console.log(`📊 API endpoints available at /api/llm-usage and /api/users`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});