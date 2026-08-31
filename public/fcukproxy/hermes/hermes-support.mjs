#!/usr/bin/env node
// ─── Hermes Support Agent (hermes-local) ───────────────────────────────
// Long-running, on-demand support gateway on port 18789.
//   engine=openclaw   → local `openclaw gateway` is preferred when installed
//   engine=support    → this bundled zero-dependency fallback daemon
// Its model profile is ollama-cloud (remote), so it must NOT run any local
// model — it only talks to the configured cloud LLM through the same
// omniroute/API-keys used elsewhere. No keys → answers report it politely.
// ────────────────────────────────────────────────────────────────────────

import http from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const PORT = parseInt(process.env.HERMES_SUPPORT_PORT || "18789", 10);
const HOME = os.homedir();
const FCUK = path.join(HOME, ".fcukproxy");
const HERMES = path.join(FCUK, "hermes");
const OMNI = process.env.OMNIRUTE_URL || "http://localhost:20128";

const PROFILE = { name: "hermes-local", label: "Support Agent", model: "ollama-cloud", port: PORT };

function log(...a) { console.log(new Date().toISOString().slice(11, 23), "[support-agent]", ...a); }

function readEnvFile(p) {
  const env = {};
  try {
    for (const line of fs.readFileSync(p, "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (m && !m[1].startsWith("#")) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch {}
  return env;
}

function hasCloudCreds() {
  const env = { ...readEnvFile(path.join(FCUK, ".env")), ...readEnvFile(path.join(HERMES, "ollama-cloud.env")) };
  return Boolean(
    env.OLLAMA_CLOUD_API_KEY || env.OPENROUTER_API_KEY || env.OPENAI_API_KEY ||
    env.ANTHROPIC_API_KEY || env.GROQ_API_KEY || env.Google_API_KEY || env.GOOGLE_API_KEY
  );
}

function sendJson(res, code, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(code, { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) });
  res.end(body);
}

function server() {
  return http.createServer((req, res) => {
    const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
    if (req.method === "GET" && (url.pathname === "/" || url.pathname === "/health")) {
      return sendJson(res, 200, {
        status: "ok",
        profile: PROFILE.name,
        label: PROFILE.label,
        model: PROFILE.model,
        engine: "support",
        cloudCredsConfigured: hasCloudCreds(),
        ui: `http://127.0.0.1:${PORT}/`,
      });
    }
    if (req.method === "POST" && url.pathname === "/api/chat") {
      let body = "";
      req.on("data", (d) => (body += d));
      req.on("end", async () => {
        try {
          const { message } = JSON.parse(body || "{}");
          if (!message) return sendJson(res, 400, { error: "message required" });
          if (!hasCloudCreds()) {
            return sendJson(res, 200, {
              reply:
                "Support Agent is on, but no ollama-cloud / cloud API key is configured on this node " +
                "(set one in ~/.fcukproxy/.env or ~/.fcukproxy/hermes/ollama-cloud.env). " +
                "Ask the main agent (chat) for everything else.",
              profile: PROFILE.name,
              model: PROFILE.model,
            });
          }
          try {
            const r = await fetch(`${OMNI}/v1/chat/completions`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                model: "ollama-cloud/gpt-oss:20b",
                messages: [
                  { role: "system", content: "You are the Support Agent (ollama-cloud). Be concise and helpful." },
                  { role: "user", content: String(message) },
                ],
                max_tokens: 500,
                stream: false,
              }),
              signal: AbortSignal.timeout(120000),
            });
            const data = await r.json();
            return sendJson(res, 200, {
              reply: data.choices?.[0]?.message?.content || "No response",
              profile: PROFILE.name,
              model: PROFILE.model,
              upstream: data.model || null,
            });
          } catch (e) {
            return sendJson(res, 200, {
              reply: `Support Agent could not reach the LLM backend: ${e?.message || e}`,
              profile: PROFILE.name,
            });
          }
        } catch (e) {
          return sendJson(res, 400, { error: String(e) });
        }
      });
      return;
    }
    return sendJson(res, 404, { error: "not found" });
  });
}

if (process.argv.includes("--selfcheck")) {
  console.log("support-agent selfcheck:", JSON.stringify(PROFILE));
  process.exit(0);
}

server().listen(PORT, "127.0.0.1", () => log(`support agent listening on 127.0.0.1:${PORT}`));
process.on("SIGTERM", () => process.exit(0));