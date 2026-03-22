// LLM Dashboard Server - Accessibility version with Radio Monte Carlo
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8080;

// Extended API data with more LLM providers
const EXTENDED_LLM_DATA = {
  models: [
    {
      id: 'picoclaw',
      model: 'PicoClaw Agent',
      provider: 'Local AI',
      limit: 1000,
      used: 450,
      unit: 'Requests',
      user: 'picoclaw',
      userFullName: 'PicoClaw System',
      company: 'Local Production'
    },
    {
      id: 'gemini-pro',
      model: 'Gemini 1.5 Pro',
      provider: 'Google',
      limit: 60,
      used: 45,
      unit: 'RPM',
      user: 'researcher',
      userFullName: 'Research Team',
      company: 'Google DeepMind'
    },
    {
      id: 'gemini-flash',
      model: 'Gemini 1.5 Flash',
      provider: 'Google',
      limit: 1000000,
      used: 750000,
      unit: 'TPM',
      user: 'production',
      userFullName: 'Production Systems',
      company: 'Google DeepMind'
    },
    {
      id: 'groq-llama',
      model: 'Llama 3.1 70B',
      provider: 'Groq', 
      limit: 30,
      used: 12,
      unit: 'RPM',
      user: 'developer',
      userFullName: 'Development Team',
      company: 'Groq Inc'
    },
    {
      id: 'openai-gpt4',
      model: 'GPT-4o',
      provider: 'OpenAI',
      limit: 10000,
      used: 7500,
      unit: 'TPM',
      user: 'enterprise',
      userFullName: 'Enterprise Chat',
      company: 'OpenAI'
    },
    {
      id: 'openai-mini',
      model: 'GPT-4o Mini',
      provider: 'OpenAI', 
      limit: 200000,
      used: 150000,
      unit: 'TPM',
      user: 'backend',
      userFullName: 'Backend Processing',
      company: 'OpenAI'
    },
    {
      id: 'anthropic-claude',
      model: 'Claude 3.5 Sonnet',
      provider: 'Anthropic',
      limit: 40000,
      used: 32000,
      unit: 'Tokens',
      user: 'analysis',
      userFullName: 'Analysis Engine',
      company: 'Anthropic'
    },
    {
      id: 'mistral-large',
      model: 'Mistral Large',
      provider: 'Mistral AI',
      limit: 50,
      used: 22,
      unit: 'RPM',
      user: 'specialist',
      userFullName: 'Specialist AI',
      company: 'Mistral AI'
    },
    {
      id: 'meta-code',
      model: 'Code Llama',
      provider: 'Meta',
      limit: 20000,
      used: 18000,
      unit: 'TPM',
      user: 'code-assistant',
      userFullName: 'Code Assistant',
      company: 'Meta AI'
    }
  ],
  lastUpdated: new Date().toISOString()
};

// Serve files and handle API requests
const requestListener = function (req, res) {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  
  // Handle CORS for API requests
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'OPTIONS, GET, POST, PUT, DELETE',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };
  
  // API endpoints
  if (req.url === '/api/llm-usage' && req.method === 'GET') {
    // Simulate real-time usage changes
    EXTENDED_LLM_DATA.models.forEach(model => {
      const variance = (Math.random() - 0.5) * (model.limit * 0.02);
      model.used = Math.max(0, Math.min(model.limit, model.used + variance));
    });
    EXTENDED_LLM_DATA.lastUpdated = new Date().toISOString();
    
    res.writeHead(200, headers);
    res.end(JSON.stringify(EXTENDED_LLM_DATA));
    return;
  }
  
  if (req.url === '/api/users' && req.method === 'GET') {
    const userData = {
      colorKey: [
        { name: 'picoclaw', color: '#00ff00', description: 'Local AI System' },
        { name: 'researcher', color: '#ff6b6b', description: 'Research Team' },
        { name: 'developer', color: '#4ecdc4', description: 'Development Tools' },
        { name: 'enterprise', color: '#45b7d1', description: 'Enterprise Chat' },
        { name: 'backend', color: '#5dade2', description: 'Backend Processing' },
        { name: 'analysis', color: '#9b59b6', description: 'Analysis Engine' },
        { name: 'data-scientist', color: '#8e44ad', description: 'Data Science' },
        { name: 'designer', color: '#f7b731', description: 'Design Tools' },
        { name: 'specialist', color: '#e67e22', description: 'Specialist AI' },
        { name: 'code-assistant', color: '#d35400', description: 'Code Assistant' }
      ]
    };
    res.writeHead(200, headers);
    res.end(JSON.stringify(userData));
    return;
  }
  
  // Radio Monte Carlo stream proxy
  if (req.url === '/stream' && req.method === 'GET') {
    res.writeHead(200, {
      'Content-Type': 'audio/mpeg',
      'Content-Type': 'audio/mpeg; charset=utf-8',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });
    
    // Simulate radio stream with periodic audio data
    setInterval(() => {
      try {
        if (!res.finished) {
          res.write(Buffer.from(new Array(1024).fill(0)));
        }
      } catch (err) {
        // Client disconnected
      }
    }, 1000);
    
    return;
  }
  
  // Serve the NEW comprehensive bubble dashboard as main index
  if (req.url === '/') {
    console.log('Serving comprehensive bubble dashboard...');
    const htmlPath = './index.html';
    fs.readFile(htmlPath, (err, data) => {
      if (err) {
        console.error('Dashboard error:', err);
        res.writeHead(404);
        res.end('Dashboard file not found');
        return;
      }
      res.writeHead(200, {'Content-Type': 'text/html'});
      res.end(data);
    });
    return;
  }
  
  // Serve static files (lower priority)
  let filePath = '.';
  if (req.url.startsWith('/')) {
    filePath = '.' + req.url;
  }
  
  const extname = String(path.extname(filePath)).toLowerCase();
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav'
  };
  
  const contentType = mimeTypes[extname] || 'application/octet-stream';
  
  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        res.writeHead(404);
        res.end('404 Not Found');
      } else {
        res.writeHead(500);
        res.end('500 Internal Server Error');
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
};

const server = http.createServer(requestListener);

server.listen(PORT, () => {
  console.log(`🚀 LLM Dashboard running at http://localhost:${PORT}`);
  console.log(`📚 Radio Monte Carlo streaming available`);
  console.log(`🎯 Bubble visualization for visual accessibility`);
  console.log(`📊 Real-time updates enabled`);
});

// Keep server running on port 8080
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    process.exit(0);
  });
});