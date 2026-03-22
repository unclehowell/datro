module.exports = {
  apps: [
    {
      name: 'llm-dashboard',
      script: 'server-bubble.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 8080
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true
    },
    {
      name: 'picoclaw-service',
      script: 'picoclaw-service.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production'
      },
      error_file: './logs/picoclaw-err.log',
      out_file: './logs/picoclaw-out.log',
      log_file: './logs/picoclaw-combined.log',
      time: true
    }
  ]
};
