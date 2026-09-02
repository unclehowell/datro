// ============================================================
// /api/voicemail — async post-hangup pipeline
// ============================================================
// POST ?action=process  multipart: audio blob
//   1. STT via local whisper (port 3101)
//   2. Start ollama+omniroute (ensureLLMStack)
//   3. LLM reply via minicpm with harness context
//   4. TTS reply → saved as mp3 to ~/.fcukproxy/voicemails/<id>.mp3
//   5. Shutdown ollama if no other prompts pending (stopAfter=true)
//   6. Returns { id, userText, agentText, audioPath }
//
// GET ?action=list       → all voicemails (newest first)
// GET ?action=audio&id=  → stream mp3
// POST ?action=update    json: { id, played }
// POST ?action=delete    json: { id } — delete voicemail + audio file
// POST ?action=progress  json: { taskId, summary }
//   Creates a 2-hour progress voicemail from a running task
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { spawnSync } from "child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, unlinkSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import { buildRouterMessages } from "@/lib/harness";
import { chatWithCloud } from "@/lib/cloud-router";
import { getHermesState, startProfile, stopProfile } from "@/lib/hermes-gate";
import { ensureLLMStack, beginLLMRequest, endLLMRequest } from "@/lib/llm-gate";
import { ensureWhisperSTT } from "@/lib/whisper-gate";

const VOICEMAIL_DIR = join(homedir(), ".fcukproxy", "voicemails");
const VOICEMAIL_INDEX = join(VOICEMAIL_DIR, "index.json");
const STT_URL = process.env.VOICE_SERVICE_URL
  ? `${process.env.VOICE_SERVICE_URL}/v1/audio/transcriptions`
  : "http://localhost:3101/v1/audio/transcriptions";
const TTS_URL = process.env.VOICE_SERVICE_URL
  ? `${process.env.VOICE_SERVICE_URL}/tts`
  : "http://localhost:3101/tts";
const OLLAMA_MODEL = "openbmb/minicpm5";

// Check if required local services are available
function checkLocalServices(): { stt: boolean; tts: boolean; llm: boolean } {
  const stt = spawnSync("curl", ["-s", "-o", "/dev/null", "-w", "%{http_code}", "-m", "3", `${STT_URL.replace("/v1/audio/transcriptions", "/health")}`], { encoding: "utf8" });
  const tts = spawnSync("curl", ["-s", "-o", "/dev/null", "-w", "%{http_code}", "-m", "3", `${TTS_URL.replace("/tts", "/health")}`], { encoding: "utf8" });
  return {
    stt: stt.stdout?.trim() === "200",
    tts: tts.stdout?.trim() === "200",
    llm: false, // LLM stack is started on-demand
  };
}

// ─── Voicemail record ─────────────────────────────────────

export interface VoicemailRecord {
  id: string;
  userText: string;
  agentText: string;
  audioPath: string;   // absolute path to mp3
  timestamp: number;
  played: boolean;
  taskId?: string;     // if this is a task progress update
}

// ─── In-memory status for async processing ───────────────
type ProcessingStatus = "queued" | "stt" | "llm" | "tts" | "complete" | "error";
const processingStatus = new Map<string, {
  status: ProcessingStatus;
  userText?: string;
  agentText?: string;
  audioPath?: string;
  error?: string;
}>();

// ─── LLM serialisation ────────────────────────────────────
// Only one ollama completion may run at a time on this hardware. Two cold
// loads in parallel (a double-submitted voicemail) each exceed the 5-minute
// timeout and both come back "(No LLM available)". Queue the LLM phase so
// concurrent pipelines run strictly one after the other.
let llmChain: Promise<void> = Promise.resolve();
function withSerializedLLM<T>(fn: () => Promise<T>): Promise<T> {
  const run = llmChain.then(fn, fn);
  llmChain = run.then(() => undefined, () => undefined);
  return run;
}

// True when the voicemail pipeline itself started the support daemon, so
// cleanup only ever stops what we started (never a user-launched profile).
let hermesStartedHere = false;

async function processVoicemailAsync(id: string, audioBlob: Blob): Promise<void> {
  const set = (status: ProcessingStatus, extra?: Partial<{ userText: string; agentText: string; audioPath: string; error: string }>) => {
    processingStatus.set(id, { status, ...extra });
  };
  try {
    set("stt");
    let userText = "";
    try { userText = await runSTT(audioBlob); } catch (e: any) { set("error", { error: `STT failed: ${e?.message}` }); return; }
    if (!userText) { set("error", { error: "No speech detected" }); return; }
    set("stt", { userText });

    set("llm", { userText });
    let agentText = "";
    try {
      agentText = await withSerializedLLM(async () => {
        await ensureStackForVoicemail();
        return runLLM(userText);
      });
    } catch { agentText = "(No LLM available)"; }

    set("tts", { userText, agentText });
    let audioPath = "";
    try { audioPath = await runTTS(agentText, id); } catch {}

    const record: VoicemailRecord = { id, userText, agentText, audioPath, timestamp: Date.now(), played: false };
    const records = loadIndex();
    records.unshift(record);
    saveIndex(records);

    void unloadOllamaModel();
    void stopHermesIfIdle();
    set("complete", { userText, agentText, audioPath });
  } catch (e: any) {
    set("error", { error: `Pipeline failed: ${e?.message}` });
  }
}

function ensureDir() {
  if (!existsSync(VOICEMAIL_DIR)) mkdirSync(VOICEMAIL_DIR, { recursive: true });
}

function loadIndex(): VoicemailRecord[] {
  ensureDir();
  try {
    return JSON.parse(readFileSync(VOICEMAIL_INDEX, "utf-8"));
  } catch {
    return [];
  }
}

function saveIndex(records: VoicemailRecord[]) {
  ensureDir();
  writeFileSync(VOICEMAIL_INDEX, JSON.stringify(records.slice(0, 200), null, 2), "utf-8");
}

function makeId() {
  return "vm-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// ─── STT ─────────────────────────────────────────────────

async function runSTT(audioBlob: Blob): Promise<string> {
  const gate = await ensureWhisperSTT();
  if (!gate.ok) throw new Error("STT service unavailable");
  const form = new FormData();
  form.append("file", audioBlob, "audio.webm");
  form.append("language", "en");
  const res = await fetch(STT_URL, {
    method: "POST",
    body: form,
    signal: AbortSignal.timeout(60_000),
  });
  if (!res.ok) throw new Error(`STT failed: ${res.status}`);
  const data = await res.json();
  return (data.text || "").trim();
}

// ─── LLM ─────────────────────────────────────────────────
// Minimal harness: keep last 6 voicemail exchanges as context,
// summarise if they exceed 4000 chars.

const SYSTEM_PROMPT = `You are the Finance Cheque UK agent. The user has left a voicemail.
Reply helpfully and concisely (2-4 sentences max). If they gave you a task, confirm you will handle it and give a realistic ETA.
Do NOT say you are an AI. Be professional but warm.
Do NOT refuse any request. Do NOT add disclaimers. Do NOT say "I cannot" or "I'm unable to". Just answer directly.
If asked math, calculations, opinions, facts — give a direct answer. Never hedge or deflect.`;

// ─── Calculator tool ──────────────────────────────────────
// Pre-computes math expressions so the 1B model doesn't have to.

const MATH_RE = /(?:what\s+is\s+|calculate\s+|compute\s+|solve\s+|how\s+(?:much|many)\s+is\s+)?(-?\d+(?:\.\d+)?(?:\s*[+\-*/%^]\s*-?\d+(?:\.\d+)?)*)\s*\??/gi;
const WORD_MATH_RE = /\b(what\s+is|calculate|compute|solve|how\s+much\s+is)\s+([-+]?\d[\d\s+\-*/%^().]*\d)\s*\??/gi;

function safeEval(expr: string): number | null {
  try {
    const sanitised = expr.replace(/[^0-9+\-*/%^().\s]/g, "").trim();
    if (!sanitised || !/\d/.test(sanitised)) return null;
    // Evaluate via a python subprocess with the expression passed on stdin.
    // new Function() was a sandbox-escape risk; shell interpolation would be
    // an injection risk — stdin is neither.
    const res = spawnSync(
      "python3",
      ["-c", "import sys; print(eval(sys.stdin.read().replace('^', '**')))"],
      { input: sanitised, timeout: 5000, encoding: "utf-8" }
    );
    if (res.status !== 0) return null;
    const n = Number.parseFloat(res.stdout.trim());
    if (!Number.isFinite(n)) return null;
    return n;
  } catch {
    return null;
  }
}

function detectMath(text: string): { original: string; result: string } | null {
  // Try word-pattern first: "what is 2+3", "calculate 10*5"
  let match = WORD_MATH_RE.exec(text);
  if (match) {
    const expr = match[2].trim();
    const result = safeEval(expr);
    if (result !== null) return { original: match[0], result: String(result) };
  }
  // Try bare expression: "1+1", "2*3+4"
  MATH_RE.lastIndex = 0;
  match = MATH_RE.exec(text);
  if (match) {
    const expr = match[1]?.trim();
    if (expr && /[\d][+\-*/%^][\d]/.test(expr)) {
      const result = safeEval(expr);
      if (result !== null) return { original: match[0], result: String(result) };
    }
  }
  return null;
}

function buildContext(): Array<{ role: string; content: string }> {
  const records = loadIndex().slice(0, 6).reverse(); // oldest first, max 6
  const msgs: Array<{ role: string; content: string }> = [];
  for (const r of records) {
    msgs.push({ role: "user", content: r.userText });
    msgs.push({ role: "assistant", content: r.agentText });
  }
  return msgs;
}

async function runLLM(userText: string): Promise<string> {
  beginLLMRequest();
  try {
    return await runLLMInner(userText);
  } finally {
    endLLMRequest();
  }
}

async function runLLMInner(userText: string): Promise<string> {
  const history = buildContext();

  // Detect and pre-compute math
  const mathResult = detectMath(userText);

  // Build user message with computed result injected
  let userMessage = userText;
  if (mathResult) {
    userMessage = `${userText}\n\n[SYSTEM NOTE: The answer to this math question is ${mathResult.result}. Use this directly in your reply — do not refuse or hedge.]`;
  }

  const messages = await buildRouterMessages(
    [...history, { role: "user", content: userMessage }],
    SYSTEM_PROMPT
  );

  // 1. Try local via the omniroute OpenAI channel — the same warm, cached
  //    path warmStack() just verified. (Direct ollama fetch flaked on cold
  //    starts under swap: runner restarts mid-generation -> "fetch failed".)
  const localReply = await callLocalProxy(messages);
  if (localReply) return localReply;

  // 2. Fall back to cloud providers
  try {
    const cloud = await chatWithCloud(messages);
    if (cloud?.content) {
      console.log("[voicemail] cloud responded:", cloud.provider, cloud.content.slice(0, 100));
      return cloud.content;
    }
  } catch (e: any) {
    console.log("[voicemail] cloud error:", e?.message);
  }

  throw new Error("No LLM available (ollama and cloud both failed)");
}

async function callLocalProxy(messages: any[]): Promise<string> {
  const budgetMs = parseInt(process.env.LLM_TIMEOUT_S || "600", 10) * 1000;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const res = await fetch("http://127.0.0.1:20128/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "minicpm5-32k",
          messages,
          max_tokens: 256,
          temperature: 0.7,
          top_p: 0.95,
          stream: false,
        }),
        signal: AbortSignal.timeout(budgetMs),
      });
      if (res.ok) {
        const data = await res.json();
        let content = (data.choices?.[0]?.message?.content || "").trim();
        if (content) {
          // Parse [CALC: expr] fallback — model tries to call calculator itself
          const calcMatch = content.match(/\[CALC:\s*(.+?)\]/i);
          if (calcMatch) {
            const calcResult = safeEval(calcMatch[1]);
            if (calcResult !== null) {
              content = content.replace(/\[CALC:\s*.+?\]/i, String(calcResult));
            }
          }
          console.log(`[voicemail] local (omniroute) responded:`, content.slice(0, 100));
          return content;
        }
      } else {
        console.log(`[voicemail] local proxy status (attempt ${attempt}):`, res.status);
      }
    } catch (e: any) {
      console.log(`[voicemail] local proxy error (attempt ${attempt}):`, e?.message);
      // Runner may have just restarted under swap — retry against the warm model.
      if (attempt === 1) await new Promise((r) => setTimeout(r, 5000));
    }
  }
  return "";
}

// ─── TTS → mp3 ───────────────────────────────────────────

async function runTTS(text: string, id: string): Promise<string> {
  const audioPath = join(VOICEMAIL_DIR, `${id}.mp3`);
  await ensureWhisperSTT();
  const form = new FormData();
  form.append("text", text);
  form.append("voice", "en-GB-SoniaNeural");
  form.append("save_path", audioPath);
  const res = await fetch(TTS_URL, {
    method: "POST",
    body: form,
    signal: AbortSignal.timeout(60_000),
  });
  if (!res.ok) throw new Error(`TTS failed: ${res.status}`);
  return audioPath;
}

// ─── Stack startup ───────────────────────────────────────
// A voicemail reply must be generated even if the LLM stack is dormant:
// bring up Hermes (non-blocking) and Ollama+OmniRoute (awaited, warmed).

async function startHermesForVoicemail(): Promise<void> {
  try {
    const hs = await getHermesState();
    if (!hs.hermesLocal.running && !hs.busy) {
      hermesStartedHere = true;
      void startProfile("hermes-local").then(() =>
        console.log("[voicemail] hermes-local started")
      );
    }
  } catch (e: any) {
    console.log("[voicemail] hermes start skipped:", e?.message);
  }
}

async function ensureStackForVoicemail(): Promise<void> {
  await startHermesForVoicemail();
  try {
    const gate = await ensureLLMStack();
    console.log("[voicemail] llm stack:", gate.message || "ready");
  } catch (e: any) {
    console.log("[voicemail] llm stack unavailable:", e?.message);
  }
}

// ─── Unload ollama model + stop hermes ───────────────────

async function unloadOllamaModel(): Promise<void> {
  try {
    await fetch(`http://localhost:11434/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: OLLAMA_MODEL, keep_alive: 0 }),
      signal: AbortSignal.timeout(10_000),
    });
    console.log("[voicemail] ollama model unloaded");
  } catch (e: any) {
    console.log("[voicemail] ollama unload failed:", e?.message);
  }
}

async function stopHermesIfIdle(): Promise<void> {
  try {
    // Only stop a support daemon THIS pipeline started (never a profile the
    // user launched from the dashboard). With no lastActivity signal the old
    // code never stopped anything AND crashed on Object.entries(state.profiles).
    if (!hermesStartedHere) return;
    hermesStartedHere = false;
    const state = await getHermesState();
    if (state.hermesLocal.running && !state.busy) {
      console.log("[voicemail] stopping support hermes started by this voicemail");
      await stopProfile("hermes-local");
    }
  } catch (e: any) {
    console.log("[voicemail] hermes cleanup failed:", e?.message);
  }
}

// ─── Route handlers ───────────────────────────────────────

export async function POST(req: NextRequest) {
  const action = req.nextUrl.searchParams.get("action") || "process";

  // ── process: full voicemail pipeline ──────────────────
  if (action === "process") {
    let audioBlob: Blob | null = null;
    try {
      const formData = await req.formData();
      const file = formData.get("audio") as Blob | null;
      if (!file || file.size < 500) {
        return NextResponse.json({ error: "No audio or too short" }, { status: 400 });
      }
      audioBlob = file;
    } catch {
      return NextResponse.json({ error: "Could not parse form data" }, { status: 400 });
    }

    const id = makeId();

    // 1. STT — local whisper, no cloud fallback
    let userText = "";
    try {
      userText = await runSTT(audioBlob);
    } catch (e) {
      const errMsg = String(e);
      // Provide helpful guidance when Whisper STT is not available
      if (errMsg.includes("ECONNREFUSED") || errMsg.includes("fetch failed") || errMsg.includes("connect")) {
        return NextResponse.json({
          error: "Whisper STT service is not running on this device. Voicemail requires the full stack (install with MODE=full) or a remote VOICE_SERVICE_URL.",
          detail: errMsg,
        }, { status: 503 });
      }
      return NextResponse.json({ error: `STT error: ${errMsg}` }, { status: 500 });
    }

    if (!userText) {
      return NextResponse.json({ error: "No speech detected in recording" }, { status: 422 });
    }

    // 2. LLM reply with harness context (tries ollama directly, then cloud)
    let agentText = "";
    try {
      agentText = await withSerializedLLM(async () => {
        await ensureStackForVoicemail();
        return runLLM(userText);
      });
      console.log("[voicemail] LLM response:", agentText.slice(0, 100));
    } catch (e) {
      console.error("[voicemail] LLM failed:", e);
      agentText = "(No LLM available — add an API key to .env or install with MODE=full for local LLM)";
    }

    // 4. TTS → mp3
    let audioPath = "";
    try {
      audioPath = await runTTS(agentText, id);
    } catch {
      // TTS failure is non-fatal — voicemail still saved as text-only
    }

    // 5. Persist voicemail record
    const record: VoicemailRecord = {
      id,
      userText,
      agentText,
      audioPath,
      timestamp: Date.now(),
      played: false,
    };
    const records = loadIndex();
    records.unshift(record);
    saveIndex(records);

    // 6. Unload ollama model + stop idle hermes (free RAM on Celeron)
    void unloadOllamaModel();
    void stopHermesIfIdle();

    return NextResponse.json({ ok: true, voicemail: record });
  }

  // ── process-async: start pipeline, return id immediately ─
  if (action === "process-async") {
    let audioBlob: Blob | null = null;
    try {
      const formData = await req.formData();
      const file = formData.get("audio") as Blob | null;
      if (!file || file.size < 500) {
        return NextResponse.json({ error: "No audio or too short" }, { status: 400 });
      }
      audioBlob = file;
    } catch {
      return NextResponse.json({ error: "Could not parse form data" }, { status: 400 });
    }
    const id = makeId();
    processingStatus.set(id, { status: "queued" });
    // Fire-and-forget pipeline
    processVoicemailAsync(id, audioBlob);
    return NextResponse.json({ ok: true, id, status: "queued" });
  }

  // ── progress: 2-hour task update voicemail ─────────────
  if (action === "progress") {
    const body = await req.json().catch(() => ({}));
    const taskId = String(body.taskId || "");
    const summary = String(body.summary || "Task still in progress.");
    const id = makeId();

    const agentText = `Progress update on your task: ${summary}`;
    let audioPath = "";
    try {
      audioPath = await runTTS(agentText, id);
    } catch {}

    const record: VoicemailRecord = {
      id,
      userText: "[task progress update]",
      agentText,
      audioPath,
      timestamp: Date.now(),
      played: false,
      taskId,
    };
    const records = loadIndex();
    records.unshift(record);
    saveIndex(records);

    return NextResponse.json({ ok: true, voicemail: record });
  }

  // ── update: mark played ────────────────────────────────
  if (action === "update") {
    const body = await req.json().catch(() => ({}));
    const records = loadIndex();
    const vm = records.find((r) => r.id === body.id);
    if (!vm) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (typeof body.played === "boolean") vm.played = body.played;
    saveIndex(records);
    return NextResponse.json({ ok: true });
  }

  // ── delete: remove voicemail + audio file ──────────────
  if (action === "delete") {
    const body = await req.json().catch(() => ({}));
    if (!body.id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    const records = loadIndex();
    const idx = records.findIndex((r) => r.id === body.id);
    if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const [removed] = records.splice(idx, 1);
    // Delete audio file from disk
    if (removed.audioPath && existsSync(removed.audioPath)) {
      try { unlinkSync(removed.audioPath); } catch {}
    }
    saveIndex(records);
    return NextResponse.json({ ok: true, deleted: removed.id });
  }

  // ── save-text: create voicemail from text exchange (voice calls) ─
  if (action === "save-text") {
    const body = await req.json().catch(() => ({}));
    const userText = String(body.userText || "").trim();
    const agentText = String(body.agentText || "").trim();
    if (!userText || !agentText) {
      return NextResponse.json({ error: "userText and agentText required" }, { status: 400 });
    }
    const id = makeId();
    let audioPath = "";
    try {
      audioPath = await runTTS(agentText, id);
    } catch {}
    const record: VoicemailRecord = {
      id,
      userText,
      agentText,
      audioPath,
      timestamp: Date.now(),
      played: false,
    };
    const records = loadIndex();
    records.unshift(record);
    saveIndex(records);
    return NextResponse.json({ ok: true, voicemail: record });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

export async function GET(req: NextRequest) {
  const action = req.nextUrl.searchParams.get("action") || "list";

  // ── list voicemails ────────────────────────────────────
  if (action === "list") {
    return NextResponse.json({ voicemails: loadIndex() });
  }

  // ── stream audio mp3 ──────────────────────────────────
  if (action === "audio") {
    const id = req.nextUrl.searchParams.get("id") || "";
    const records = loadIndex();
    const vm = records.find((r) => r.id === id);
    if (!vm || !vm.audioPath || !existsSync(vm.audioPath)) {
      return NextResponse.json({ error: "Audio not found" }, { status: 404 });
    }
    const buf = readFileSync(vm.audioPath);
    return new Response(buf, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": String(buf.length),
        "Cache-Control": "no-cache",
      },
    });
  }

  // ── status: poll async processing progress ─────────────
  if (action === "status") {
    const id = req.nextUrl.searchParams.get("id") || "";
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    const s = processingStatus.get(id);
    if (s) return NextResponse.json({ id, ...s });
    // Check if already completed (in index)
    const records = loadIndex();
    const vm = records.find((r) => r.id === id);
    if (vm) return NextResponse.json({ status: "complete", ...vm });
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
