// Simple HTTP server for LLM Dashboard
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;

// Serve files and handle API requests
const requestListener = function (req, res) {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  
  // API endpoints
  if (req.url === '/api/llm-usage') {
    res.writeHead(200, {'Content-Type': 'application/json'});
    const usageData = {
      models: [
        {
          id: 'picoclaw',
          model: 'PicoClaw Agent',
          provider: 'Local',
          limit: 1000,
          used: 450,
          unit: 'Requests',
          rating: 5,
          isActive: true,
          user: 'picoclaw'
        },
        {
          id: 'gemini-user1',
          model: 'Gemini Pro',
          provider: 'Google',
          limit: 60,
          used: 45,
          unit: 'RPM',
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
      ],
      lastUpdated: new Date().toISOString()
    };
    res.end(JSON.stringify(usageData));
    return;
  }
  
  if (req.url === '/api/users') {
    res.writeHead(200, {'Content-Type': 'application/json'});
    const userData = {
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
    res.end(JSON.stringify(userData));
    return;
  }
  
  // Serve static files
  let filePath = '.';
  if (req.url === '/') {
    filePath = './index.html';
  } else if (req.url.startsWith('/')) {
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
    '.ico': 'image/x-icon'
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
  console.log(`📊 Server PID: ${process.pid}`);
  console.log(`📁 Working directory: ${__dirname}`);
});

// Graceful shutdown
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