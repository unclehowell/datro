#!/usr/bin/env node
import express from "express";
import { execFile } from "child_process";
import { promises as fsp } from "fs";
import { promisify } from "util";
import os from "os";
import path from "path";

const execFileAsync = promisify(execFile);

const PARENT_URL = process.env.PARENT_URL || "https://www.financecheque.uk";
const CHILD_ID   = process.env.CHILD_ID   || `child-${os.hostname()}`;
const PORT       = Number(process.env.PORT) || 4001;
const SELF_URL   = process.env.SELF_URL    || `http://${os.hostname()}:${PORT}`;

const app = express();
app.use(express.json());
let activeJobs = 0;

let rrIndex = 0;
const rrFile = path.join(os.homedir(), ".fcukproxy", "round-robin-state.json");
async function loadRRState() {
  try {
    const s = JSON.parse(await fsp.readFile(rrFile, "utf-8"));
    rrIndex = s.index || 0;
  } catch {}
}
async function saveRRState() {
  try { await fsp.writeFile(rrFile, JSON.stringify({ index: rrIndex, updated: new Date().toISOString() })); } catch {}
}

async function register() {
  try {
    const res = await fetch(`${PARENT_URL}/api/proxy?action=register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ childId: CHILD_ID, machine_id: CHILD_ID, machine_name: os.hostname(), url: SELF_URL }),
    });
    if (res.ok) {
    } else {
      console.error(`[child-proxy] Registration failed: ${res.status}`);
    }
  } catch (err) {
    console.error("[child-proxy] Registration error:", err.message);
  }
}

async function heartbeat() {
  try {
    await fetch(`${PARENT_URL}/api/proxy?action=heartbeat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ childId: CHILD_ID, machine_id: CHILD_ID, machine_name: os.hostname(), load: activeJobs, url: SELF_URL }),
    });
  } catch { /* ignore */ }
}

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

app.get("/v1/models", (_req, res) => {
  res.json({
    object: "list",
    data: [
      { id: "proxy-router", object: "model", created: Math.floor(Date.now() / 1000), owned_by: "fcuk-proxy" },
      { id: "kilo-chat", object: "model", created: Math.floor(Date.now() / 1000), owned_by: "kilo" },
      { id: "opencode-chat", object: "model", created: Math.floor(Date.now() / 1000), owned_by: "opencode" },
    ],
  });
});

const providers = [
  { cmd: "groq", args: ["chat", "--message"], timeout: 30000 },
  { cmd: "gemini", args: ["-p"], timeout: 45000 },
  { cmd: "gemini", args: ["chat", "--message"], timeout: 45000 },
  { cmd: process.env.KIRO_PATH || "kirox", args: ["chat", "--non-interactive", "--message"], timeout: 60000 },
  { cmd: "kiro", args: ["chat", "--non-interactive", "--message"], timeout: 30000 },
  { cmd: "opencode", args: ["chat", "--message"], timeout: 60000 },
  { cmd: "opencode", args: ["run"], timeout: 60000 },
  { cmd: "kilo", args: ["chat", "--message"], timeout: 60000 },
  { cmd: "kilo", args: ["run"], timeout: 60000 },
  { cmd: "hermes", args: ["chat", "-z"], timeout: 90000 },
];

async function runChat(message) {
  const prompt = `You are the FinanceCheque child proxy operator. Reply concisely.\nUser message: ${message}`;
  const total = providers.length;

  async function tryProvider(p, idx) {
    try {
      const args = [...p.args, prompt];
      const { stdout } = await execFileAsync(p.cmd, args, { timeout: Math.min(p.timeout, 15000), maxBuffer: 1024 * 1024 });
      const reply = stdout?.trim();
      if (reply) return { idx, reply };
    } catch {}
    return null;
  }

  const results = await Promise.allSettled(
    providers.map((p, i) => tryProvider(p, (rrIndex + i) % total))
  );

  for (const r of results) {
    if (r.status === "fulfilled" && r.value) {
      rrIndex = (r.value.idx + 1) % total;
      await saveRRState();
      return r.value.reply;
    }
  }

  try {
    const resp = await fetch("https://pirateclaw.datro.xyz/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer test" },
      body: JSON.stringify({ model: "auto", messages: [{ role: "user", content: prompt }], max_tokens: 500 }),
      signal: AbortSignal.timeout(15000),
    });
    if (resp.ok) {
      const data = await resp.json();
      if (data?.choices?.[0]?.message?.content) return data.choices[0].message.content;
    }
  } catch {}

  return `Child proxy ${CHILD_ID} received your message and is online.`;
}

app.listen(PORT, "0.0.0.0", async () => {
  await loadRRState();
  console.log(`[child-proxy] Listening on port ${PORT} (${CHILD_ID}) [rrIndex=${rrIndex}]`);
  await register();
  setInterval(heartbeat, 30_000);
});
