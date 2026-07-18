module.exports = {
  apps: [
    {
      name: "omniroute-lite",
      script: "proxy.mjs",
      cwd: "/home/unclehowell/omniroute-lite",
      env: {
        GROQ_API_KEY: process.env.GROQ_API_KEY || "",
      },
      max_restarts: 5,
      restart_delay: 3000,
    },
    {
      name: "agentos-gui",
      script: "node_modules/.bin/next",
      args: "start -p 3000",
      cwd: "/home/unclehowell/agentos-gui",
      env: {
        OMNIRUTE_URL: "http://localhost:20128",
        HERMES_URL: "http://localhost:9119",
        VOICE_SERVICE_URL: "http://localhost:3101",
      },
      max_restarts: 3,
      restart_delay: 5000,
    },
    {
      name: "voice-service",
      script: "server.py",
      interpreter: "python3",
      cwd: "/home/unclehowell/voice-service",
      max_restarts: 3,
      restart_delay: 3000,
    },
    {
      name: "code-intel",
      script: "dist/server.js",
      cwd: "/home/unclehowell/code-intel",
      max_restarts: 3,
      restart_delay: 3000,
    },
    {
      name: "index-service",
      script: "dist/indexer.js",
      cwd: "/home/unclehowell/index-service",
      max_restarts: 3,
      restart_delay: 3000,
    },
  ],
};
