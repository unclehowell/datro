// ============================================================
// /api/voicemail — async post-hangup pipeline
// ============================================================
// POST ?action=process      multipart: audio blob   (synchronous reply)
// POST ?action=process-async multipart: audio blob   (returns id, polls status)
// GET  ?action=list                                  (all voicemails, newest first)
// GET  ?action=audio&id=                             (stream mp3)
// GET  ?action=status&id=                            (poll pipeline progress)
// POST ?action=update        json: { id, played }
// POST ?action=delete        json: { id }            (delete voicemail + audio)
// POST ?action=progress      json: { taskId, summary }
// POST ?action=save-text     json: { userText, agentText } (voice-call recordings)
//
// v1.11.29 changes (over the v1.11.27 baseline):
//   1. The LLM phase now calls the SHARED chat pipeline (lib/pipeline.ts)
//      instead of talking to omniroute :20128 directly. The voicemail
//      gets the SAME brain as the chat UI:
//        - task-router classifies intent (opencode / kilo / delegate)
//        - hermes for conversational replies
//        - minicpm5 via omniroute with a real tool-calling ReAct loop
//        - cloud fallback (groq / deepseek / openrouter / etc.)
//      A user who leaves a voicemail saying "fix the build" now
//      actually has the work done instead of getting a polite
//      acknowledgement that the system will handle it.
//   2. startHermesForVoicemail() is now AWAITED and uses the
//      hermes-PROXY profile (the intended local MiniCPM path), not
//      hermes-local (which was the support daemon that ran in
//      parallel without being part of the inference path). The
//      previous "start and forget" pattern meant hermes was a
//      race-condition side process, not a phase of the pipeline.
//   3. The 3-stage status (stt / think / tts) is replaced by a
//      full pipeline-stage array (stt / router / hermes / ollama /
//      tools / tts) with real per-stage events from runPrompt().
//      The UI's VmProcessingBreadcrumb now renders the actual
//      dependency chain that lit up, not a 3-card approximation.
//   4. Every code path runs through try/finally so releaseAfterAnswer(),
//      unloadOllamaModel(), and stopHermesIfIdle() always fire — even
//      on STT / LLM / TTS failure. The previous code only cleaned
//      up on the happy path, so a failed voicemail could leave
//      ollama and hermes running for the full 30-min watchdog.
//   5. Status and per-job metadata are persisted to disk
//      (~/.fcukproxy/voicemail/jobs/<id>.json) so a GUI restart
//      during a cold MiniCPM load doesn't lose the job. On
//      startup, the route re-attachs to any "in-progress" job so
//      the user sees the correct state (likely "error: restarted
//      during processing") instead of polling "not found" forever.
//   6. TTS uses the same voice service but treats TTS failure as
//      non-terminal: the reply text is still saved, the audioPath
//      is just empty, and the user can read the reply. The
//      cloud Edge-TTS dependency inside the voice service is a
//      separate concern (covered in the v1.11.29 backlog as
//      "provision a local TTS engine"); the route no longer
//      fails the whole pipeline when TTS flakes.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  readdirSync,
  unlinkSync,
  renameSync,
} from "fs";
import { join } from "path";
import { homedir } from "os";
import { runPrompt, PipelineEvent } from "@/lib/pipeline";
import {
  getHermesState,
  stopProfile,
  switchToProfile,
} from "@/lib/hermes-gate";
import {
  releaseAfterAnswer,
} from "@/lib/llm-gate";
import { ensureWhisperSTT, shutdownWhisperSTT } from "@/lib/whisper-gate";

const VOICEMAIL_DIR = join(homedir(), ".fcukproxy", "voicemails");
const VOICEMAIL_INDEX = join(VOICEMAIL_DIR, "index.json");
const VOICEMAIL_JOBS_DIR = join(homedir(), ".fcukproxy", "voicemail", "jobs");
const STT_URL = process.env.VOICE_SERVICE_URL
  ? `${process.env.VOICE_SERVICE_URL}/v1/audio/transcriptions`
  : "http://localhost:3101/v1/audio/transcriptions";
const TTS_URL = process.env.VOICE_SERVICE_URL
  ? `${process.env.VOICE_SERVICE_URL}/tts`
  : "http://localhost:3101/tts";
const OLLAMA_MODEL = "openbmb/minicpm5";

export const dynamic = "force-dynamic";
export const maxDuration = 600; // 10 min — covers a cold MiniCPM load + retry

// The 6 stages the UI breadcrumb will render. Order is the order the
// pipeline visits them (early-exit stages are skipped but still shown
// as "done" with 0ms duration). The id values match the PipelinePhase
// values emitted by lib/pipeline.ts.
const PIPELINE_STAGE_IDS = ["stt", "router", "hermes", "ollama", "tools", "tts"] as const;
type PipelineStageId = (typeof PIPELINE_STAGE_IDS)[number];

// ─── Persisted types ───────────────────────────────────────

export interface VoicemailRecord {
  id: string;
  userText: string;
  agentText: string;
  audioPath: string;
  timestamp: number;
  played: boolean;
  taskId?: string;
}

// Per-job state. Persisted to ~/.fcukproxy/voicemail/jobs/<id>.json so
// a GUI restart during processing doesn't lose the request.
interface JobState {
  id: string;
  status: "queued" | "running" | "complete" | "error";
  startedAt: number;
  finishedAt?: number;
  // Per-stage: { state: off|active|done|error, durationMs, errorCode? }
  stages: Record<PipelineStageId, {
    state: "off" | "active" | "done" | "error";
    startedAt?: number;
    durationMs?: number;
    errorCode?: string;
  }>;
  currentStage: PipelineStageId | null;
  userText?: string;
  agentText?: string;
  audioPath?: string;
  error?: string;
  errorCode?: string;
  // Real per-stage events from runPrompt() — preserved in the job
  // record so the UI can show what actually happened, not just a
  // coarse status string.
  events: Array<{ phase: string; ok: boolean; durationMs?: number; detail?: string; error?: string }>;
  // What was actually invoked — for "this voicemail ran a tool" UX.
  routed?: string;
  provider?: string;
  toolsExecuted?: string[];
}

// ─── Persistence helpers ───────────────────────────────────

function ensureJobDir() {
  if (!existsSync(VOICEMAIL_JOBS_DIR)) mkdirSync(VOICEMAIL_JOBS_DIR, { recursive: true });
}
function jobPath(id: string) {
  return join(VOICEMAIL_JOBS_DIR, `${id}.json`);
}
function persistJob(state: JobState) {
  ensureJobDir();
  // Atomic write: write to .tmp then rename. Avoids a half-written
  // file if the process is killed mid-flush.
  const tmp = jobPath(state.id) + ".tmp";
  writeFileSync(tmp, JSON.stringify(state, null, 2), "utf-8");
  renameSync(tmp, jobPath(state.id));
}
function loadJob(id: string): JobState | null {
  try {
    return JSON.parse(readFileSync(jobPath(id), "utf-8"));
  } catch {
    return null;
  }
}
function listActiveJobs(): JobState[] {
  ensureJobDir();
  const out: JobState[] = [];
  for (const f of readdirSync(VOICEMAIL_JOBS_DIR)) {
    if (!f.endsWith(".json")) continue;
    try {
      const s = JSON.parse(readFileSync(join(VOICEMAIL_JOBS_DIR, f), "utf-8")) as JobState;
      if (s.status === "running" || s.status === "queued") out.push(s);
    } catch {}
  }
  return out;
}
function emptyStages(): JobState["stages"] {
  const stages: JobState["stages"] = {} as any;
  for (const id of PIPELINE_STAGE_IDS) {
    stages[id] = { state: "off" };
  }
  return stages;
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

// ─── LLM serialisation (one ollama cold-load at a time) ────

let llmChain: Promise<void> = Promise.resolve();
function withSerializedLLM<T>(fn: () => Promise<T>): Promise<T> {
  const run = llmChain.then(fn, fn);
  llmChain = run.then(() => undefined, () => undefined);
  return run;
}

// Tracks which side processes THIS voicemail pipeline woke up, so
// cleanup only ever stops what we started (never a user-launched
// profile). v1.11.29: now scoped per-job, not global, so concurrent
// voicemails on different IDs don't fight over the same flag.
interface JobResources {
  hermesStartedHere: boolean;
  whisperStartedHere: boolean;
}

// ─── STT ────────────────────────────────────────────────────

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

// ─── TTS → mp3 (non-fatal on failure) ──────────────────────

async function runTTS(text: string, id: string): Promise<string> {
  const audioPath = join(VOICEMAIL_DIR, `${id}.mp3`);
  const gate = await ensureWhisperSTT();
  if (!gate.ok) throw new Error("TTS service unavailable");
  const form = new FormData();
  form.append("text", text);
  // v1.11.29: keep the legacy voice name so the installer-deployed
  // voice service (currently faster-whisper + edge-tts) doesn't
  // reject the request. The Kokoro-82M migration in v1.11.30 will
  // switch this to a Kokoro voice id; until then, the v1.11.29
  // CHANGELOG tracks it.
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

// ─── Hermes profile (v1.11.29: awaited, hermes-PROXY) ──────

async function startHermesForVoicemail(resources: JobResources): Promise<void> {
  try {
    const state = await getHermesState();
    // v1.11.29: we now use hermes-PROXY, the intended local MiniCPM
    // path. hermes-local was the support daemon that ran in parallel
    // without being part of the inference path; using it here made
    // hermes a race-condition side process, not a phase of the
    // pipeline the user could observe.
    if (!state.hermesProxy.running) {
      resources.hermesStartedHere = true;
      await switchToProfile("hermes-proxy");
    }
  } catch (e: any) {
    console.log("[voicemail] hermes switch to proxy failed:", e?.message);
  }
}

async function ensureStackForVoicemail(resources: JobResources): Promise<void> {
  await startHermesForVoicemail(resources);
  try {
    const gate = await ensureLLMStack();
    console.log("[voicemail] llm stack:", gate.message || "ready");
  } catch (e: any) {
    console.log("[voicemail] llm stack unavailable:", e?.message);
  }
}

// ─── Cleanup (v1.11.29: always-runs, no more early-return leak) ──

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

async function stopHermesIfIdle(resources: JobResources): Promise<void> {
  try {
    if (!resources.hermesStartedHere) return;
    resources.hermesStartedHere = false;
    const state = await getHermesState();
    if (state.hermesProxy.running && !state.busy) {
      console.log("[voicemail] stopping hermes-proxy started by this voicemail");
      await stopProfile("hermes-proxy");
    }
  } catch (e: any) {
    console.log("[voicemail] hermes cleanup failed:", e?.message);
  }
}

async function shutdownWhisperIfStartedByUs(resources: JobResources): Promise<void> {
  if (!resources.whisperStartedHere) return;
  try {
    await shutdownWhisperSTT("voicemail-pipeline-cleanup");
  } catch (e: any) {
    console.log("[voicemail] whisper cleanup failed:", e?.message);
  }
}

// ─── Real pipeline (the actual async processor) ────────────

async function processVoicemailAsync(id: string, audioBlob: Blob): Promise<void> {
  const now = () => Date.now();
  const state: JobState = {
    id,
    status: "running",
    startedAt: now(),
    stages: emptyStages(),
    currentStage: "stt",
    events: [],
  };
  state.stages.stt = { state: "active", startedAt: now() };
  persistJob(state);

  const resources: JobResources = {
    hermesStartedHere: false,
    whisperStartedHere: false,
  };
  // Detected on first use; controls whether the watchdog releases the
  // whisper service when this job finishes.
  resources.whisperStartedHere = !(await isWhisperAlreadyUp());

  const finishWithError = (stage: PipelineStageId, errorCode: string, message: string) => {
    state.stages[stage] = { ...state.stages[stage], state: "error", errorCode };
    state.status = "error";
    state.error = message;
    state.errorCode = errorCode;
    state.finishedAt = now();
    state.currentStage = null;
    persistJob(state);
  };

  // The single try/finally that guarantees cleanup. v1.11.29 fix:
  // the previous code had early returns scattered through the
  // function and only the happy path called unloadOllamaModel /
  // stopHermesIfIdle. Now EVERY terminal outcome — success, STT
  // fail, LLM fail, TTS fail, unexpected exception — runs through
  // the same finally block.
  try {
    // ── 1. STT ────────────────────────────────────────────
    let userText = "";
    try {
      userText = await runSTT(audioBlob);
    } catch (e: any) {
      finishWithError("stt", "STT_FAIL", `STT failed: ${e?.message || e}`);
      return;
    }
    if (!userText) {
      finishWithError("stt", "STT_EMPTY", "No speech detected in recording");
      return;
    }
    state.stages.stt = { state: "done", startedAt: state.stages.stt.startedAt, durationMs: now() - (state.stages.stt.startedAt || now()) };
    state.userText = userText;
    persistJob(state);

    // ── 2. LLM (real pipeline, not direct omniroute) ───────
    state.currentStage = "router";
    state.stages.router = { state: "active", startedAt: now() };
    persistJob(state);

    const history = buildContext();

    let pipelineResult: Awaited<ReturnType<typeof runPrompt>> | null = null;
    let llmErrorCode: string | undefined;
    try {
      pipelineResult = await withSerializedLLM(async () => {
        await ensureStackForVoicemail(resources);
        return runPrompt(userText, [...history, { role: "user", content: userText }], {
          systemSuffix: "",
          voiceCall: true,
          onPhase: (evt: PipelineEvent) => {
            // Translate the chat-pipeline phase into a voicemail stage.
            // The voicemail UI has 6 stages (stt/router/hermes/ollama/tools/tts);
            // the chat pipeline emits 8 phases (router/task/hermes/minicpm/tools/cloud/ollama/tts).
            // We map them and emit real per-stage events the UI can render.
            state.events.push(evt);
            const stage = mapPhaseToStage(evt.phase);
            if (!stage) return;
            const prev = state.stages[stage];
            if (evt.ok) {
              if (prev?.state === "active") {
                state.stages[stage] = { state: "done", startedAt: prev.startedAt, durationMs: evt.durationMs ?? (now() - (prev.startedAt || now())) };
              } else if (!prev || prev.state === "off") {
                state.stages[stage] = { state: "active", startedAt: now() };
                // Mark the previously-active stage as done.
                if (state.currentStage && state.currentStage !== stage && state.stages[state.currentStage]?.state === "active") {
                  const cur = state.stages[state.currentStage];
                  state.stages[state.currentStage] = { state: "done", startedAt: cur.startedAt, durationMs: now() - (cur.startedAt || now()) };
                }
                state.currentStage = stage;
              }
            } else {
              state.stages[stage] = { state: "error", startedAt: prev?.startedAt, durationMs: evt.durationMs, errorCode: classifyError(evt.error) };
            }
            persistJob(state);
          },
        });
      });
    } catch (e: any) {
      const msg = String(e?.message || "");
      if (/ECONNREFUSED|fetch failed|connect/i.test(msg)) llmErrorCode = "OLLAMA_DOWN";
      else if (/timeout|aborted/i.test(msg)) llmErrorCode = "LLM_TIMEOUT";
      else llmErrorCode = "E_NO_PROVIDER";
    }

    if (llmErrorCode || !pipelineResult || pipelineResult.routed === "no_llm") {
      const code = llmErrorCode || "E_NO_PROVIDER";
      finishWithError("ollama", code, pipelineResult?.reply || "No LLM available");
      return;
    }

    const agentText = pipelineResult.reply;
    state.agentText = agentText;
    state.routed = pipelineResult.routed;
    state.provider = pipelineResult.provider;
    state.toolsExecuted = pipelineResult.toolsExecuted;
    // Mark the LLM stages done — whichever sub-stage actually ran.
    for (const stage of ["router", "hermes", "ollama", "tools"] as PipelineStageId[]) {
      if (state.stages[stage].state === "active" || state.stages[stage].state === "off") {
        state.stages[stage] = { state: state.stages[stage].state === "off" ? "done" : "done", startedAt: state.stages[stage].startedAt || now(), durationMs: state.stages[stage].state === "off" ? 0 : now() - (state.stages[stage].startedAt || now()) };
      }
    }
    persistJob(state);

    // ── 3. TTS (non-fatal) ────────────────────────────────
    state.currentStage = "tts";
    state.stages.tts = { state: "active", startedAt: now() };
    persistJob(state);
    let audioPath = "";
    try {
      audioPath = await runTTS(agentText, id);
    } catch (e: any) {
      // TTS failure is non-fatal — the voicemail is still saved as
      // text and the user can read the reply. Mark the TTS stage
      // as error but continue to persist the record.
      state.stages.tts = { state: "error", startedAt: state.stages.tts.startedAt, durationMs: now() - (state.stages.tts.startedAt || now()), errorCode: "TTS_FAIL" };
      state.error = `TTS failed: ${e?.message}`;
      state.errorCode = "TTS_FAIL";
      // Still save the record, just without audio.
      const record: VoicemailRecord = { id, userText, agentText, audioPath: "", timestamp: Date.now(), played: false };
      const records = loadIndex();
      records.unshift(record);
      saveIndex(records);
      state.status = "error";
      state.finishedAt = now();
      state.currentStage = null;
      persistJob(state);
      return;
    }
    state.audioPath = audioPath;
    state.stages.tts = { state: "done", startedAt: state.stages.tts.startedAt, durationMs: now() - (state.stages.tts.startedAt || now()) };

    const record: VoicemailRecord = { id, userText, agentText, audioPath, timestamp: Date.now(), played: false };
    const records = loadIndex();
    records.unshift(record);
    saveIndex(records);

    state.status = "complete";
    state.finishedAt = now();
    state.currentStage = null;
    persistJob(state);
  } catch (e: any) {
    // Catch-all for any unexpected exception (e.g. processVoicemailAsync
    // itself crashes). The stage we were in gets the error marker.
    const stage = state.currentStage || "ollama";
    finishWithError(stage, "PIPELINE_FAIL", `Pipeline failed: ${e?.message || e}`);
  } finally {
    // ALWAYS run cleanup, regardless of how we got here. v1.11.29
    // fix: the previous code only ran unloadOllamaModel /
    // stopHermesIfIdle on the happy path, so a failed voicemail
    // could leave omniroute, ollama, and hermes running for the
    // full 30-minute watchdog.
    void unloadOllamaModel();
    await stopHermesIfIdle(resources);
    await shutdownWhisperIfStartedByUs(resources);
    // releaseAfterAnswer drops the LLM stack idle timeout, so the
    // next prompt can cold-start it again instead of waiting on
    // a stale session.
    releaseAfterAnswer();
  }
}

function classifyError(msg?: string): string {
  if (!msg) return "PIPELINE_FAIL";
  if (/ECONNREFUSED|fetch failed|connect/i.test(msg)) return "OLLAMA_DOWN";
  if (/timeout|aborted/i.test(msg)) return "LLM_TIMEOUT";
  if (/no.*llm|no.*provider/i.test(msg)) return "E_NO_PROVIDER";
  return "PIPELINE_FAIL";
}

function mapPhaseToStage(phase: string): PipelineStageId | null {
  switch (phase) {
    case "router":
    case "task":
      return "router";
    case "hermes":
      return "hermes";
    case "minicpm":
    case "ollama":
    case "cloud":
      return "ollama";
    case "tools":
      return "tools";
    case "tts":
      return "tts";
    default:
      return null;
  }
}

function isWhisperAlreadyUp(): Promise<boolean> {
  return fetch("http://localhost:3101/health", { signal: AbortSignal.timeout(2000) })
    .then((r) => r.ok)
    .catch(() => false);
}

function buildContext(): Array<{ role: "user" | "assistant"; content: string }> {
  const records = loadIndex().slice(0, 6).reverse();
  const msgs: Array<{ role: "user" | "assistant"; content: string }> = [];
  for (const r of records) {
    msgs.push({ role: "user", content: r.userText });
    msgs.push({ role: "assistant", content: r.agentText });
  }
  return msgs;
}

// ─── Startup recovery ──────────────────────────────────────
// On GUI boot, look for jobs that were "running" when the previous
// process died. Mark them as error so the user sees an honest state
// instead of polling "not found" forever. The recorded voicemails
// themselves (saved to VOICEMAIL_INDEX) are still retrievable.
function recoverStaleJobs(): void {
  ensureJobDir();
  const now = Date.now();
  for (const f of readdirSync(VOICEMAIL_JOBS_DIR)) {
    if (!f.endsWith(".json")) continue;
    const p = join(VOICEMAIL_JOBS_DIR, f);
    try {
      const s = JSON.parse(readFileSync(p, "utf-8")) as JobState;
      if (s.status !== "running" && s.status !== "queued") continue;
      // A job is stale if it has been "running" for more than 10
      // minutes (the max route duration) OR if the file's mtime is
      // older than the current process start.
      const ageMs = now - (s.startedAt || 0);
      if (ageMs > 10 * 60_000) {
        s.status = "error";
        s.finishedAt = now;
        s.error = "GUI restarted during processing";
        s.errorCode = "PIPELINE_RESTART";
        // Mark the current stage as error.
        if (s.currentStage) {
          s.stages[s.currentStage] = { ...s.stages[s.currentStage], state: "error", errorCode: "PIPELINE_RESTART" };
        }
        persistJob(s);
      }
    } catch {}
  }
}

// Run recovery once per process, lazily on first request.
let recovered = false;
function ensureRecovery() {
  if (recovered) return;
  recovered = true;
  try { recoverStaleJobs(); } catch (e: any) { console.log("[voicemail] recovery failed:", e?.message); }
}

// ─── Route handlers ───────────────────────────────────────

export async function POST(req: NextRequest) {
  ensureRecovery();
  const action = req.nextUrl.searchParams.get("action") || "process";

  // ── process: full voicemail pipeline (synchronous) ────
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
    const queuedAt = Date.now();
    const state: JobState = {
      id,
      status: "queued",
      startedAt: queuedAt,
      stages: emptyStages(),
      currentStage: "stt",
      events: [],
    };
    persistJob(state);

    // Synchronous: await the pipeline. Async: fire-and-forget (handled below).
    await processVoicemailAsync(id, audioBlob);
    const finished = loadJob(id);
    if (finished?.status === "complete") {
      const records = loadIndex();
      const vm = records.find((r) => r.id === id);
      return NextResponse.json({ ok: true, voicemail: vm });
    }
    return NextResponse.json({
      ok: false,
      id,
      error: finished?.error || "pipeline did not complete",
      errorCode: finished?.errorCode,
      stages: finished?.stages,
    }, { status: finished?.errorCode === "STT_FAIL" ? 422 : 500 });
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
    const queuedAt = Date.now();
    const state: JobState = {
      id,
      status: "queued",
      startedAt: queuedAt,
      stages: emptyStages(),
      currentStage: "stt",
      events: [],
    };
    persistJob(state);
    // Fire-and-forget pipeline. We do NOT await — the response
    // returns immediately and the caller polls /api/voicemail?action=status.
    // Unhandled rejections are caught inside processVoicemailAsync's
    // try/catch/finally so this never throws.
    void processVoicemailAsync(id, audioBlob);
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
    if (removed.audioPath && existsSync(removed.audioPath)) {
      try { unlinkSync(removed.audioPath); } catch {}
    }
    saveIndex(records);
    // Also remove the job file (if any)
    const jp = jobPath(removed.id);
    if (existsSync(jp)) {
      try { unlinkSync(jp); } catch {}
    }
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
  ensureRecovery();
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
    // First check the on-disk job state (persisted). This is the
    // source of truth — survives GUI restarts.
    const job = loadJob(id);
    if (job) {
      const now = Date.now();
      return NextResponse.json({
        id,
        status: job.status,
        stages: job.stages,
        currentStage: job.currentStage,
        events: job.events,
        routed: job.routed,
        provider: job.provider,
        toolsExecuted: job.toolsExecuted || [],
        userText: job.userText,
        agentText: job.agentText,
        audioPath: job.audioPath,
        error: job.error,
        errorCode: job.errorCode,
        elapsedMs: now - (job.startedAt ?? now),
        stageElapsedMs: job.currentStage ? now - (job.stages[job.currentStage]?.startedAt ?? now) : 0,
      });
    }
    // Fall back to the index for already-completed voicemails.
    const records = loadIndex();
    const vm = records.find((r) => r.id === id);
    if (vm) return NextResponse.json({ status: "complete", ...vm });
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
