#!/usr/bin/env node
/**
 * PTY WebSocket Server
 *
 * Spawns a Python PTY bridge per WebSocket connection,
 * relays input/output bidirectionally.
 *
 * Port: 3001 (configurable via PORT_TERM env)
 */

const { spawn } = require("child_process");
const { WebSocketServer } = require("ws");
const path = require("path");

const PORT = parseInt(process.env.PORT_TERM || "3001", 10);
const BRIDGE = path.join(__dirname, "pty_bridge.py");

const wss = new WebSocketServer({ port: PORT });

console.log(`[pty-server] listening on port ${PORT}`);

wss.on("connection", (ws) => {
  console.log("[pty-server] client connected");

  const python = spawn("python3", [BRIDGE], {
    stdio: ["pipe", "pipe", "pipe"],
    env: { ...process.env, TERM: "xterm-256color" },
  });

  let closed = false;

  const close = () => {
    if (closed) return;
    closed = true;
    python.kill("SIGTERM");
    setTimeout(() => python.kill("SIGKILL"), 2000);
    try { ws.close(); } catch {}
  };

  python.stdout.on("data", (chunk) => {
    if (closed) return;
    const lines = chunk.toString("utf-8").split("\n");
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const msg = JSON.parse(line);
        if (msg.type === "output") {
          ws.send(JSON.stringify({ type: "output", data: msg.data }));
        } else if (msg.type === "exit") {
          ws.send(JSON.stringify({ type: "exit", code: msg.code }));
          close();
        }
      } catch {}
    }
  });

  python.stderr.on("data", (chunk) => {
    console.error("[pty-server:stderr]", chunk.toString());
  });

  python.on("exit", (code) => {
    console.log("[pty-server] python bridge exited, code:", code);
    if (!closed) {
      ws.send(JSON.stringify({ type: "exit", code }));
    }
    close();
  });

  ws.on("message", (raw) => {
    if (closed) return;
    try {
      const msg = JSON.parse(raw.toString());
      const line = JSON.stringify(msg) + "\n";
      python.stdin.write(line);
    } catch {}
  });

  ws.on("close", () => {
    console.log("[pty-server] client disconnected");
    close();
  });

  ws.on("error", () => close());
});

wss.on("error", (err) => {
  console.error("[pty-server] error:", err.message);
});

process.on("SIGINT", () => {
  console.log("[pty-server] shutting down");
  wss.close(() => process.exit(0));
});

process.on("SIGTERM", () => {
  console.log("[pty-server] shutting down");
  wss.close(() => process.exit(0));
});
