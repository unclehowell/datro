#!/usr/bin/env node
// Task Router — Detects tasks vs chat, routes to agentic backends
// Chat → ollama (free local LLM)
// Task → opencode/kilo (agentic harness with MCP tools)

import http from "node:http";
import { execFile, spawn } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const execFileAsync = promisify(execFile);
const PORT = parseInt(process.env.PORT || "3200");
const OMNIRUTE_URL = process.env.OMNIRUTE_URL || "http://localhost:20128";
const OPENCODE_BIN = process.env.OPENCODE_BIN || "opencode";
const KILO_BIN = process.env.KILO_BIN || "kilo";

// Task detection patterns
const TASK_PATTERNS = [
  /^(create|write|build|make|generate|add|implement|fix|debug|refactor|deploy|test|install|configure|setup|update|modify|change|edit|rename|move|copy|delete|remove|run|execute|start|stop|restart|check|inspect|analyze|review|summarize|explain|document|scaffold|init)\b/i,
  /\b(file|code|script|function|class|component|page|route|endpoint|api|database|migration|test|spec|config|dockerfile|yaml|json|html|css|js|ts|py|sh)\b/i,
  /\b(into|to|for|from|with|using|that|which|where|how)\b.*\b(file|code|script|function|class|component|page|route|endpoint|api|database)\b/i,
  /^(hey|ok|sure|yes|no|thanks|thank|please|help)\s+(me\s+)?(to\s+)?/i,
];

// Chat patterns (bypass task routing)
const CHAT_PATTERNS = [
  /^(hi|hello|hey|yo|sup|what's up|how are you|how's it going|good morning|good evening|good night)\b/i,
  /^(what|who|where|when|why|how|which|tell me|describe|explain)\s+(is|are|was|were|do|does|did|can|could|would|should|will)\b/i,
  /^(yes|no|ok|sure|thanks|thank you|cool|great|awesome|nice|perfect|good|bad|fine)\s*[!.?]*$/i,
  /^(I think|I feel|I want|I need|I like|I don't|I can't|I'm)\b/i,
];

function isTask(text) {
  const trimmed = text.trim();
  
  // Check chat patterns first (short circuit)
  for (const pattern of CHAT_PATTERNS) {
    if (pattern.test(trimmed)) return false;
  }
  
  // Very short messages are likely chat
  if (trimmed.length < 10) return false;
  
  // Check task patterns
  for (const pattern of TASK_PATTERNS) {
    if (pattern.test(trimmed)) return true;
  }
  
  // Default: if it's long and structured, treat as task
  return trimmed.length > 50;
}

async function routeToOpencode(task) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      child.kill();
      reject(new Error("opencode timeout (5 min)"));
    }, 300_000);

    const child = spawn(OPENCODE_BIN, ["run", task], {
      cwd: process.env.HOME || "/home/unclehowell",
      env: { ...process.env, NONINTERACTIVE: "1" },
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (data) => { stdout += data.toString(); });
    child.stderr.on("data", (data) => { stderr += data.toString(); });

    child.on("close", (code) => {
      clearTimeout(timeout);
      if (code === 0) {
        resolve(stdout || "Task completed (no output)");
      } else {
        resolve(stderr || stdout || `Task failed with exit code ${code}`);
      }
    });

    child.on("error", (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
}

async function routeToKilo(task) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      child.kill();
      reject(new Error("kilo timeout (5 min)"));
    }, 300_000);

    const child = spawn(KILO_BIN, ["--chat", task], {
      cwd: process.env.HOME || "/home/unclehowell",
      env: { ...process.env, NONINTERACTIVE: "1" },
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (data) => { stdout += data.toString(); });
    child.stderr.on("data", (data) => { stderr += data.toString(); });

    child.on("close", (code) => {
      clearTimeout(timeout);
      if (code === 0) {
        resolve(stdout || "Task completed (no output)");
      } else {
        resolve(stderr || stdout || `Task failed with exit code ${code}`);
      }
    });

    child.on("error", (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
}

async function routeTask(task) {
  // Try opencode first (primary agentic backend)
  try {
    const result = await routeToOpencode(task);
    return { backend: "opencode", result };
  } catch (err) {
    console.log(`[task-router] opencode failed: ${err.message}, trying kilo...`);
  }

  // Fallback to kilo
  try {
    const result = await routeToKilo(task);
    return { backend: "kilo", result };
  } catch (err) {
    console.log(`[task-router] kilo failed: ${err.message}`);
    return { backend: "none", result: "No agentic backend available. Install opencode or kilo." };
  }
}

// HTTP server for task routing API
const server = http.createServer(async (req, res) => {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ 
      status: "ok",
      backends: {
        opencode: await checkBinary(OPENCODE_BIN),
        kilo: await checkBinary(KILO_BIN),
      }
    }));
    return;
  }

  if (req.method === "POST" && req.url === "/route") {
    let body = "";
    for await (const chunk of req) body += chunk;

    try {
      const { text, messages } = JSON.parse(body);
      const input = text || (messages?.length ? messages[messages.length - 1].content : "");

      if (!input) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "text or messages required" }));
        return;
      }

      const isTaskRequest = isTask(input);

      if (!isTaskRequest) {
        // Chat — route to ollama via OmniRoute
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ type: "chat", backend: "ollama", input }));
        return;
      }

      // Task — route to agentic backend
      console.log(`[task-router] Task detected: "${input.slice(0, 80)}..."`);
      const { backend, result } = await routeTask(input);

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ type: "task", backend, result }));
    } catch (err) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Not found" }));
});

async function checkBinary(name) {
  try {
    await execFileAsync("which", [name]);
    return true;
  } catch {
    return false;
  }
}

server.listen(PORT, () => {
  console.log(`[task-router] Running on http://localhost:${PORT}`);
  console.log(`[task-router] opencode: ${OPENCODE_BIN}`);
  console.log(`[task-router] kilo: ${KILO_BIN}`);
});
