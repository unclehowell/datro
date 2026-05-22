#!/usr/bin/env node
/**
 * child-proxy.js — FinanceCheque child proxy
 * Registers with parent proxy, provides OpenAI-compatible chat via CLI chain
 *
 * Usage:
 *   node child-proxy.js
 *   PORT=4001 CHILD_ID=my-machine node child-proxy.js
 */

import express from "express";
import { execFile, spawn } from "child_process";
import { promises as fsp } from "fs";
import { promisify } from "util";
import os from "os";
import path from "path";

const execFileAsync = promisify(execFile);

// Load machine identity from ~/.fcukproxy/machine.json
let machineId = "";
try {
  const p = path.join(os.homedir(), ".fcukproxy", "machine.json");
  const cfg = JSON.parse(await fsp.readFile(p, "utf-8"));
  machineId = cfg.machine_id || "";
} catch {}

const PARENT_URL = process.env.PARENT_URL || "https://www.financecheque.uk";
const CHILD_ID   = process.env.CHILD_ID   || machineId || `child-${os.hostname()}`;
const PORT       = Number(process.env.PORT) || 4001;
// Use tunnel URL if available (makes child proxy reachable from parent proxy via Cloudflare)
const TUNNEL_URL = process.env.TUNNEL_URL || "https://child-proxy.financecheque.uk";
const SELF_URL   = process.env.SELF_URL    || TUNNEL_URL;

const app = express();
app.use(express.json());

let activeJobs = 0;

// ── Register with parent proxy ────────────────────────────────────────────
async function register() {
  try {
    const res = await fetch(`${PARENT_URL}/api/proxy?action=register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ childId: CHILD_ID, machine_id: CHILD_ID, machine_name: os.hostname(), url: SELF_URL }),
    });
    if (res.ok) console.log(`[child-proxy] Registered with parent: ${PARENT_URL}`);
    else console.error(`[child-proxy] Registration failed: ${res.status}`);
  } catch (err) {
    console.error("[child-proxy] Registration error:", err.message);
  }
}

// ── Heartbeat every 30s ───────────────────────────────────────────────────
async function heartbeat() {
  try {
    await fetch(`${PARENT_URL}/api/proxy?action=heartbeat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ childId: CHILD_ID, load: activeJobs }),
    });
  } catch { /* ignore */ }
}

// ── Dispatch endpoint (called by parent proxy) ────────────────────────────
app.post("/dispatch", async (req, res) => {
  const job = req.body;
  res.json({ ok: true, childId: CHILD_ID });

  activeJobs++;
  runJob(job).finally(() => activeJobs--);
});

app.get("/health", (_req, res) => {
  res.json({ ok: true, childId: CHILD_ID, activeJobs });
});

app.post("/chat", async (req, res) => {
  const { message, messages, chat_only } = req.body || {};
  const text = message || (messages?.length > 0 ? messages[messages.length - 1].content : "");
  if (!text) return res.status(400).json({ ok: false, error: "message is required" });

  try {
    const reply = await runChat(text);
    return res.json({
      id: `chatcmpl-${Date.now()}`,
      object: "chat.completion",
      created: Math.floor(Date.now() / 1000),
      model: "child-proxy",
      choices: [{ index: 0, message: { role: "assistant", content: reply }, finish_reason: "stop" }],
      usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
      _proxy: { childId: CHILD_ID },
    });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message || "chat failed", childId: CHILD_ID });
  }
});

// ── OpenAI-compatible endpoint ─────────────────────────────────────────
app.post("/v1/chat/completions", async (req, res) => {
  const body = req.body || {};
  const messages = body.messages || [];
  const lastMsg = messages.length > 0 ? messages[messages.length - 1].content : "";
  if (!lastMsg) return res.status(400).json({ error: "messages required" });

  try {
    const reply = await runChat(lastMsg);
    return res.json({
      id: `chatcmpl-${Date.now()}`,
      object: "chat.completion",
      created: Math.floor(Date.now() / 1000),
      model: body.model || "proxy-router",
      choices: [{ index: 0, message: { role: "assistant", content: reply || "" }, finish_reason: "stop" }],
      usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
      _proxy: { childId: CHILD_ID },
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || "chat failed" });
  }
});

// ── Find bugs endpoint ──────────────────────────────────────────────────
app.post("/find-bugs", async (req, res) => {
  const { repo_context, branch } = req.body || {};
  if (!repo_context) return res.status(400).json({ ok: false, error: "repo_context is required" });

  const prompt = [
    `Find the single biggest, most apparent, obvious and crucial bug in this codebase on branch '${branch || "unknown"}'.`,
    `Read the actual source code below.`,
    `Return ONLY raw JSON (no markdown) with keys: file_path, bug_description, old_string (exact text to replace), new_string (replacement), commit_message.`,
    ``,
    repo_context,
  ].join("\n");

  try {
    const reply = await runChat(prompt);
    return res.json({ ok: true, reply, childId: CHILD_ID });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message || "find-bugs failed", childId: CHILD_ID });
  }
});

// ── Dispatch dator fix (full pipeline) ────────────────────────────────
app.post("/dispatch-datro-fix", async (req, res) => {
  const { branch, repo_dir } = req.body || {};
  if (!branch || !repo_dir) return res.status(400).json({ ok: false, error: "branch and repo_dir required" });

  try {
    const { execSync } = await import("child_process");
    const result = execSync(`bash /home/unclehowell/.fcukproxy/multi-branch-release.sh`, {
      cwd: repo_dir,
      timeout: 300_000,
      env: { ...process.env, FORCE_BRANCH: branch },
    });
    const output = result.stdout?.toString() || "";
    res.json({ ok: true, output: output.slice(-2000), childId: CHILD_ID });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message, childId: CHILD_ID });
  }
});

// ── Run job via Hermes/Kiro ───────────────────────────────────────────────
async function runJob(job) {
  const { id, url, leadAmount, quantity } = job;
  // Try Kiro CLI first, fall back to Hermes
  const prompt = buildPrompt(url, leadAmount, quantity);

  // Option 1: Kiro CLI
  const kiroPath = process.env.KIRO_PATH || "/home/ubuntu/kiro-cli-temp";
  try {
    const proc = spawn(kiroPath, ["chat", "--non-interactive", "--message", prompt], {
      cwd: "/home/ubuntu",
      env: { ...process.env },
      timeout: 300_000, // 5 min
    });

    proc.stdout.on("data", d => console.log(`[kiro][${id}]`, d.toString().trim()));
    proc.stderr.on("data", d => console.error(`[kiro][${id}]`, d.toString().trim()));

    await new Promise((resolve, reject) => {
      proc.on("close", code => code === 0 ? resolve(code) : reject(new Error(`kiro exited ${code}`)));
    });
    return;
  } catch (err) {
    console.warn(`[child-proxy] Kiro failed for job ${id}: ${err.message}. Trying Hermes...`);
  }

  // Option 2: Hermes workspace dispatch
  const hermesPath = "/home/ubuntu/hermes-workspace";
  try {
    const { stdout } = await execFileAsync("node", [
      "skills/workspace-dispatch/dispatch.js",
      "--prompt", prompt,
    ], { cwd: hermesPath, timeout: 300_000 });
    console.log(`[child-proxy] Job ${id} completed via Hermes:`, stdout.slice(0, 200));
  } catch (err) {
    console.error(`[child-proxy] Hermes also failed for job ${id}:`, err.message);
  }
}

function buildPrompt(url, leadAmount, quantity) {
  return [
    `You are a lead generation agent for financecheque.uk.`,
    `Target webapp: ${url}`,
    `Goal: Generate ${quantity} qualified leads with an estimated value of £${leadAmount} each.`,
    `Tasks:`,
    `1. Analyse the target webapp and identify the ideal customer profile.`,
    `2. Create SEO-optimised content and landing page copy targeting those customers.`,
    `3. Draft outreach messages for email and social media.`,
    `4. Identify traffic sources and suggest a campaign strategy.`,
    `5. Output a structured report with all assets ready to deploy.`,
    `Be concise and output actionable deliverables only.`,
  ].join("\n");
}

async function runChat(message) {
  const prompt = message;

  // Priority 1: groq CLI (fastest if installed)
  try {
    const { stdout } = await execFileAsync("groq", ["chat", "--message", prompt], {
      timeout: 30_000, maxBuffer: 1024 * 1024,
    });
    if (stdout?.trim()) return stdout.trim();
  } catch {}

  // Priority 2: kiro CLI
  const kiroPath = process.env.KIRO_PATH || "/usr/local/bin/kiro";
  try {
    const { stdout } = await execFileAsync(kiroPath, ["chat", "--non-interactive", "--message", prompt], {
      timeout: 60_000, maxBuffer: 1024 * 1024,
    });
    if (stdout?.trim()) return stdout.trim();
  } catch {}

  // Priority 3: local fcuk proxy agent (port 6000, big-pickle model)
  try {
    const resp = await fetch("http://localhost:6000/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: "proxy-router", messages: [{ role: "user", content: prompt }], max_tokens: 1024 }),
    });
    if (resp.ok) {
      const data = await resp.json();
      const content = data?.choices?.[0]?.message?.content;
      if (content && content !== "No LLM available") return content;
    }
  } catch {}

  // Priority 4: opencode CLI
  try {
    const { stdout } = await execFileAsync("opencode", ["run", prompt], {
      timeout: 60_000, maxBuffer: 1024 * 1024,
    });
    if (stdout?.trim()) return stdout.trim();
  } catch {}

  // Priority 5: kilo CLI
  try {
    const { stdout } = await execFileAsync("kilo", ["run", prompt], {
      timeout: 60_000, maxBuffer: 1024 * 1024,
    });
    if (stdout?.trim()) return stdout.trim();
  } catch {}

  // Priority 6: Cloudflare proxy fallback (pirateclaw)
  try {
    const resp = await fetch("https://pirateclaw.datro.xyz/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer test" },
      body: JSON.stringify({ model: "auto", messages: [{ role: "user", content: prompt }], max_tokens: 500 }),
    });
    if (resp.ok) {
      const data = await resp.json();
      if (data?.choices?.[0]?.message?.content) return data.choices[0].message.content;
    }
  } catch {}

  return `Child proxy ${CHILD_ID} received your message and is online.`;
}

// ── Start ─────────────────────────────────────────────────────────────────
app.listen(PORT, "0.0.0.0", async () => {
  console.log(`[child-proxy] Listening on port ${PORT} (${CHILD_ID})`);
  await register();
  setInterval(heartbeat, 30_000);
});
