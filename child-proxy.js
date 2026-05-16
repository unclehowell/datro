#!/usr/bin/env node
/**
 * child-proxy.js — runs on AWS 172.31.29.216
 * Registers with the parent proxy at financecheque.uk/api/proxy
 * Receives dispatched jobs and runs them via Hermes/Kiro agents
 *
 * Usage:
 *   PARENT_URL=https://financecheque.uk CHILD_ID=aws-172-31-29-216 node child-proxy.js
 *
 * Install:
 *   npm install express node-fetch
 *   pm2 start child-proxy.js --name fcuk-child-proxy
 */

import express from "express";
import { execFile, spawn } from "child_process";
import { promisify } from "util";
import os from "os";

const execFileAsync = promisify(execFile);

const PARENT_URL = process.env.PARENT_URL || "https://financecheque.uk";
const CHILD_ID   = process.env.CHILD_ID   || `aws-${os.hostname()}`;
const PORT       = Number(process.env.PORT) || 4001;
const SELF_URL   = process.env.SELF_URL    || `http://172.31.29.216:${PORT}`;

const app = express();
app.use(express.json());

let activeJobs = 0;

// ── Register with parent proxy ────────────────────────────────────────────
async function register() {
  try {
    const res = await fetch(`${PARENT_URL}/api/proxy?action=register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ childId: CHILD_ID, url: SELF_URL }),
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
  console.log(`[child-proxy] Received job ${job.id}: ${job.url} — ${job.quantity} leads @ £${job.leadAmount}`);
  res.json({ ok: true, childId: CHILD_ID });

  activeJobs++;
  runJob(job).finally(() => activeJobs--);
});

app.get("/health", (_req, res) => {
  res.json({ ok: true, childId: CHILD_ID, activeJobs });
});

app.post("/chat", async (req, res) => {
  const { message, chat_only } = req.body || {};
  if (!message) return res.status(400).json({ ok: false, error: "message is required" });

  const isChatOnly = chat_only === true || chat_only === 'true';
  if (!isChatOnly) {
    console.log(`[child-proxy] Chat request without chat_only flag — processing as chat anyway`);
  }

  try {
    const reply = await runChat(message);
    return res.json({ ok: true, reply, childId: CHILD_ID });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message || "chat failed", childId: CHILD_ID });
  }
});

// ── Run job via Hermes/Kiro ───────────────────────────────────────────────
async function runJob(job) {
  const { id, url, leadAmount, quantity } = job;
  console.log(`[child-proxy] Starting job ${id}`);

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

    console.log(`[child-proxy] Job ${id} completed via Kiro`);
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
  const prompt = `You are the FinanceCheque child proxy operator. Reply concisely.\nUser message: ${message}`;

  // Priority 1: groq (fastest)
  try {
    const { stdout } = await execFileAsync("groq", ["chat", "--message", prompt], {
      timeout: 30_000, maxBuffer: 1024 * 1024,
    });
    if (stdout?.trim()) return stdout.trim();
  } catch {}

  // Priority 2: kiro
  const kiroPath = process.env.KIRO_PATH || "/usr/local/bin/kiro";
  try {
    const { stdout } = await execFileAsync(kiroPath, ["chat", "--non-interactive", "--message", prompt], {
      timeout: 60_000, maxBuffer: 1024 * 1024,
    });
    if (stdout?.trim()) return stdout.trim();
  } catch {}

  // Priority 3: opencode
  try {
    const { stdout } = await execFileAsync("opencode", ["chat", "--message", prompt], {
      timeout: 60_000, maxBuffer: 1024 * 1024,
    });
    if (stdout?.trim()) return stdout.trim();
  } catch {}

  // Priority 4: kilo
  try {
    const { stdout } = await execFileAsync("kilo", ["chat", "--message", prompt], {
      timeout: 60_000, maxBuffer: 1024 * 1024,
    });
    if (stdout?.trim()) return stdout.trim();
  } catch {}

  // Priority 5: Cloudflare proxy fallback
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
