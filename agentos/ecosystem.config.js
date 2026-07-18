module.exports = {
  apps: [
    {
      name: "omniroute-lite",
      script: "proxy.mjs",
      cwd: __dirname + "/omniroute",
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
      cwd: __dirname + "/gui",
      env: {
        OMNIRUTE_URL: "http://localhost:20128",
        HERMES_URL: process.env.HERMES_URL || "http://localhost:9119",
        VOICE_SERVICE_URL: "http://localhost:3101",
        CODE_INDEX_DIR: process.env.CODE_INDEX_DIR || __dirname + "/../",
      },
      max_restarts: 3,
      restart_delay: 5000,
    },
    {
      name: "voice-service",
      script: "server.py",
      interpreter: "python3",
      cwd: __dirname + "/voice-service",
      max_restarts: 3,
      restart_delay: 3000,
    },
    {
      name: "task-router",
      script: "task-router.mjs",
      cwd: __dirname,
      env: {
        OMNIRUTE_URL: "http://localhost:20128",
        OPENCODE_BIN: process.env.OPENCODE_BIN || "opencode",
        KILO_BIN: process.env.KILO_BIN || "kilo",
      },
      max_restarts: 3,
      restart_delay: 3000,
    },
  ],
};
