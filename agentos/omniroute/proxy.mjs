#!/usr/bin/env node
// OmniRoute Lite — Lightweight OpenAI-compatible proxy
// Routes requests across providers with automatic failover
// No dependencies beyond Node.js built-ins

import http from "node:http";
import https from "node:https";
import { URL } from "node:url";
import fs from "node:fs";
import path from "node:path";

const PORT = parseInt(process.env.PORT || "20128");

// Provider configuration
// Priority order: local llama.cpp first, then cloud providers
const PROVIDERS = [
  {
    id: "ollama",
    name: "Local MiniCPM5-1B (Ollama)",
    baseUrl: "http://localhost:11434",
    apiKey: "ollama",
    models: ["minicpm5-32k", "openbmb/minicpm5"],
    chatPath: "/api/chat",
    modelsPath: "/api/tags",
    enabled: true,
    priority: 1,
    apiFormat: "ollama",
    keepAlive: process.env.OLLAMA_KEEP_ALIVE || "30m",
    numCtx: parseInt(process.env.MINICPM_NUM_CTX || "8192", 10),
    timeout: parseInt(process.env.OLLAMA_TIMEOUT_MS || "600000", 10),
  },
  {
    id: "groq",
    name: "Groq (cloud fallback)",
    baseUrl: "https://api.groq.com/openai/v1",
    apiKey: process.env.GROQ_API_KEY || "",
    models: ["llama-3.1-8b-instant", "llama-3.3-70b-versatile"],
    chatPath: "/chat/completions",
    modelsPath: "/models",
    enabled: true, // Cloud fallback when local LLM unavailable
    priority: 2,
  },
  // OpenRouter DISABLED — paid models, removed per user request
  // {
  //   id: "openrouter",
  //   name: "OpenRouter",
  //   baseUrl: "https://openrouter.ai/api/v1",
  //   apiKey: process.env.OPENROUTER_API_KEY || "",
  //   models: ["anthropic/claude-sonnet-4", "openai/gpt-4o", "google/gemini-2.0-flash-001", "meta-llama/llama-3.1-8b-instruct"],
  //   chatPath: "/chat/completions",
  //   modelsPath: "/models",
  //   enabled: !!process.env.OPENROUTER_API_KEY,
  //   priority: 3,
  // },
  // Together AI disabled — using Groq free tier + local ollama only
];

// Health state
const health = {};
for (const p of PROVIDERS) {
  health[p.id] = { ok: true, lastCheck: Date.now(), failures: 0 };
}

// ── Prompt / response cache (Cline-style harness prompt caching) ────────────
// Exact-match LRU over (model, messages). Keeps repeated agent-loop prompts
// (constant system prefix + growing history) from re-inferencing on the Celeron.
// KV-cache reuse is layered on top via keep_alive + num_ctx to ollama.
const CACHE_MAX = parseInt(process.env.PROMPT_CACHE_MAX || "256", 10);
const CACHE_TTL_MS = parseInt(process.env.PROMPT_CACHE_TTL_S || "1800", 10) * 1000;
const responseCache = new Map(); // key -> { ts, value }

let cacheHits = 0;
let cacheMisses = 0;

function hashKey(s) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

// Translate ollama's native /api/chat response into the OpenAI chat.completion
// shape that all the GUI clients (LLMClient, omniroute lib) expect.
function toOpenAIFormat(parsed, model) {
  const msg = parsed.message || {};
  return {
    id: "chatcmpl-" + hashKey(JSON.stringify(parsed).slice(0, 64)),
    object: "chat.completion",
    created: Math.floor(Date.now() / 1000),
    model: parsed.model || model,
    choices: [
      {
        index: 0,
        message: { role: msg.role || "assistant", content: msg.content || "" },
        finish_reason: parsed.done_reason || "stop",
      },
    ],
    usage: {
      prompt_tokens: parsed.prompt_eval_count || 0,
      completion_tokens: parsed.eval_count || 0,
      total_tokens: (parsed.prompt_eval_count || 0) + (parsed.eval_count || 0),
    },
  };
}

function cacheKeyFor(reqBody) {
  const model = reqBody.model || "";
  const msgs = (reqBody.messages || []).map((m) => `${m.role}\x1f${m.content}`).join("\x1e");
  return hashKey(model + "\x1e" + msgs);
}

function cacheGet(reqBody) {
  const key = cacheKeyFor(reqBody);
  const entry = responseCache.get(key);
  if (!entry) {
    cacheMisses++;
    return null;
  }
  if (Date.now() - entry.ts > CACHE_TTL_MS) {
    responseCache.delete(key);
    cacheMisses++;
    return null;
  }
  cacheHits++;
  return { key, value: entry.value };
}

function cachePut(reqBody, value) {
  if (responseCache.size >= CACHE_MAX) {
    const oldest = responseCache.keys().next().value;
    if (oldest) responseCache.delete(oldest);
  }
  responseCache.set(cacheKeyFor(reqBody), { ts: Date.now(), value });
}

function log(level, msg, extra = "") {
  const ts = new Date().toISOString().slice(11, 23);
  console.log(`${ts} [${level}] ${msg}${extra ? " " + extra : ""}`);
}

function matchModel(requestedModel, provider) {
  if (!requestedModel) return provider.models[0] || null;
  const lower = requestedModel.toLowerCase();
  // Exact match
  for (const m of provider.models) {
    if (m.toLowerCase() === lower) return m;
  }
  // Partial match
  for (const m of provider.models) {
    if (m.toLowerCase().includes(lower) || lower.includes(m.toLowerCase())) return m;
  }
  return null;
}

function getProvidersForModel(model) {
  const matches = [];
  for (const p of PROVIDERS) {
    if (!p.enabled || !health[p.id]?.ok) continue;
    if (model && !matchModel(model, p)) continue;
    matches.push(p);
  }
  matches.sort((a, b) => a.priority - b.priority);
  return matches;
}

function buildPath(basePath, subPath) {
  const base = basePath.replace(/\/+$/, "");
  return base + (subPath.startsWith("/") ? subPath : "/" + subPath);
}

function proxyRequest(provider, reqBody, isStream) {
  return new Promise((resolve, reject) => {
    const base = new URL(provider.baseUrl);
    const fullPath = buildPath(base.pathname, provider.chatPath);
    const body = JSON.stringify(reqBody);
    const proto = base.protocol === "https:" ? https : http;

    const options = {
      hostname: base.hostname,
      port: base.port || (base.protocol === "https:" ? 443 : 80),
      path: fullPath,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body),
        Authorization: `Bearer ${provider.apiKey}`,
      },
      timeout: provider.timeout || 180000,
    };

    const proxyReq = proto.request(options, (proxyRes) => {
      resolve(proxyRes);
    });

    proxyReq.on("error", (err) => {
      health[provider.id].failures++;
      if (health[provider.id].failures > 3) health[provider.id].ok = false;
      log("WARN", `${provider.name} request failed:`, err.message);
      reject(err);
    });

    proxyReq.on("timeout", () => {
      proxyReq.destroy();
      health[provider.id].failures++;
      reject(new Error(`timeout after ${provider.timeout || 180000}ms`));
    });

    proxyReq.write(body);
    proxyReq.end();
  });
}

async function handleChatCompletion(req, res) {
  let body = "";
  for await (const chunk of req) body += chunk;

  let parsed;
  try { parsed = JSON.parse(body); } catch {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Invalid JSON" }));
    return;
  }

  const { model: requestedModel, stream = false, ...rest } = parsed;
  const providers = getProvidersForModel(requestedModel);

  if (providers.length === 0) {
    res.writeHead(503, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "No providers available for model: " + (requestedModel || "any") }));
    return;
  }

  let lastError = null;
  for (const provider of providers) {
    const actualModel = matchModel(requestedModel, provider) || provider.models[0];
    const reqBody = { ...rest, model: actualModel, stream };
    if (provider.id === "ollama") {
      reqBody.think = false;
      reqBody.keep_alive = provider.keepAlive || "30m";
      reqBody.options = { ...(reqBody.options || {}), num_ctx: provider.numCtx };
      // OpenAI-style max_tokens must become num_predict for Ollama's /api/chat;
      // otherwise the reasoning model generates unbounded tokens and blows the timeout.
      if (reqBody.max_tokens) {
        reqBody.options.num_predict = reqBody.max_tokens;
        delete reqBody.max_tokens;
      }
    }

    // Cline-style prompt cache: exact-match reuse for non-streaming calls.
    if (!stream) {
      const hit = cacheGet(reqBody);
      if (hit) {
        log("CACHE", "HIT", `model=${actualModel}`);
        res.writeHead(200, {
          "Content-Type": "application/json",
          "X-Provider": provider.id,
          "X-Model": actualModel,
          "X-Cache": "HIT",
        });
        res.end(JSON.stringify(hit.value));
        return;
      }
    }

    log("INFO", `→ ${provider.name}`, `model=${actualModel} stream=${stream}`);

    try {
      const proxyRes = await proxyRequest(provider, reqBody, stream);

      if (proxyRes.statusCode >= 200 && proxyRes.statusCode < 300) {
        // Success
        health[provider.id].failures = 0;
        health[provider.id].ok = true;

        const responseHeaders = {
          "Content-Type": proxyRes.headers["content-type"] || "application/json",
          "X-Provider": provider.id,
          "X-Model": actualModel,
          "X-Cache": "MISS",
        };

        // Buffer non-streaming JSON so we can store it in the prompt cache.
        if (!stream && (proxyRes.headers["content-type"] || "").includes("json")) {
          let body = "";
          proxyRes.on("data", (c) => (body += c));
          proxyRes.on("end", () => {
            let outBody = body;
            try {
              let parsed = JSON.parse(body);
              if (provider.apiFormat === "ollama") {
                parsed = toOpenAIFormat(parsed, actualModel);
                outBody = JSON.stringify(parsed);
              }
              cachePut(reqBody, parsed);
            } catch {
              // non-JSON body — don't cache
            }
            res.writeHead(proxyRes.statusCode, responseHeaders);
            res.end(outBody);
            log("OK", `← ${provider.name}`, `status=${proxyRes.statusCode} (cached)`);
          });
          proxyRes.on("error", () => res.destroy());
          return;
        }

        res.writeHead(proxyRes.statusCode, responseHeaders);
        proxyRes.pipe(res);

        proxyRes.on("end", () => {
          log("OK", `← ${provider.name}`, `status=${proxyRes.statusCode}`);
        });
        return;
      } else {
        const errBody = await new Promise((resolve) => {
          let data = "";
          proxyRes.on("data", (c) => data += c);
          proxyRes.on("end", () => resolve(data));
        });
        log("WARN", `${provider.name} returned ${proxyRes.statusCode}:`, errBody.slice(0, 200));
        lastError = { status: proxyRes.statusCode, body: errBody, provider: provider.name };

        // If it's a rate limit or auth error, try next provider
        if (proxyRes.statusCode === 429 || proxyRes.statusCode === 401 || proxyRes.statusCode === 402) {
          continue;
        }
        // Other errors — still try next
        continue;
      }
    } catch (err) {
      lastError = { error: err.message, provider: provider.name };
      log("WARN", `Failover from ${provider.name}:`, err.message);
      continue;
    }
  }

  // All providers failed
  res.writeHead(502, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "All providers failed", lastError }));
}

async function handleModels(_req, res) {
  const allModels = [];
  for (const p of PROVIDERS) {
    if (!p.enabled) continue;
    for (const m of p.models) {
      allModels.push({
        id: m,
        object: "model",
        owned_by: p.id,
        created: Math.floor(Date.now() / 1000),
      });
    }
  }
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ object: "list", data: allModels }));
}

function handleCacheStats(_req, res) {
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({
    status: "ok",
    size: responseCache.size,
    max: CACHE_MAX,
    ttlMs: CACHE_TTL_MS,
    hits: cacheHits,
    misses: cacheMisses,
    hitRate: cacheHits + cacheMisses > 0 ? (cacheHits / (cacheHits + cacheMisses)).toFixed(3) : 0,
    providers: PROVIDERS.filter((p) => p.enabled).map((p) => ({ id: p.id, keepAlive: p.keepAlive || null, numCtx: p.numCtx || null })),
  }));
}

function handleCacheClear(_req, res) {
  responseCache.clear();
  cacheHits = 0;
  cacheMisses = 0;
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ status: "ok", cleared: true, size: 0 }));
}

function handleHealth(_req, res) {
  const enabledProviders = PROVIDERS.filter((p) => p.enabled);
  const healthyProviders = enabledProviders.filter((p) => health[p.id]?.ok);
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({
    status: healthyProviders.length > 0 ? "ok" : "degraded",
    providers: enabledProviders.map((p) => ({
      id: p.id,
      name: p.name,
      ok: health[p.id]?.ok,
      failures: health[p.id]?.failures || 0,
    })),
    healthy: healthyProviders.map((p) => p.id),
  }));
}

function handleRoot(_req, res) {
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({
    name: "OmniRoute Lite",
    version: "0.1.0",
    description: "Lightweight OpenAI-compatible proxy with provider failover + prompt caching",
    endpoints: ["/v1/chat/completions", "/v1/models", "/api/health", "/v1/cache"],
    providers: PROVIDERS.filter((p) => p.enabled).map((p) => p.id),
  }));
}

// Health check loop — ping each provider every 30s
setInterval(async () => {
  for (const p of PROVIDERS) {
    if (!p.enabled) continue;
    try {
      const base = new URL(p.baseUrl);
      const fullPath = buildPath(base.pathname, p.modelsPath);
      const proto = base.protocol === "https:" ? https : http;
      const checkReq = proto.request(
        { hostname: base.hostname, port: base.port, path: fullPath, method: "GET", headers: { Authorization: `Bearer ${p.apiKey}` }, timeout: 5000 },
        (res) => {
          if (res.statusCode < 400) {
            health[p.id].ok = true;
            health[p.id].failures = 0;
          }
          res.resume();
        },
      );
      checkReq.on("error", () => {
        health[p.id].failures++;
        if (health[p.id].failures > 5) health[p.id].ok = false;
      });
      checkReq.on("timeout", () => checkReq.destroy());
      checkReq.end();
    } catch {}
  }
}, 30000);

// HTTP server
const server = http.createServer(async (req, res) => {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (req.method === "GET" && url.pathname === "/") return handleRoot(req, res);
  if (req.method === "GET" && url.pathname === "/api/health") return handleHealth(req, res);
  if (req.method === "GET" && url.pathname === "/v1/cache") return handleCacheStats(req, res);
  if (req.method === "DELETE" && url.pathname === "/v1/cache") return handleCacheClear(req, res);
  if (req.method === "GET" && url.pathname === "/v1/models") return handleModels(req, res);
  if (req.method === "POST" && url.pathname === "/v1/chat/completions") return handleChatCompletion(req, res);

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Not found" }));
});

server.listen(PORT, () => {
  log("INFO", `OmniRoute Lite running on http://localhost:${PORT}`);
  log("INFO", `Enabled providers:`, PROVIDERS.filter((p) => p.enabled).map((p) => p.name).join(", ") || "none (set env vars)");
  log("INFO", `Endpoints:`);
  log("INFO", `  GET  /                     — Root info`);
  log("INFO", `  GET  /api/health           — Health check`);
  log("INFO", `  GET  /v1/models            — List models`);
  log("INFO", `  POST /v1/chat/completions  — Chat completions (OpenAI-compatible)`);
  log("INFO", ``);
  log("INFO", `Set env vars to enable cloud providers:`);
  log("INFO", `  GROQ_API_KEY, OPENROUTER_API_KEY, TOGETHER_API_KEY`);
});
