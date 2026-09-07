// ============================================================
// Chat & voicemail pipeline (shared)
// ============================================================
// One call site for "user said X, run it through the same brain
// the chat UI uses". Replaces the previous behaviour where the
// voicemail route talked to omniroute :20128 directly, bypassing
// the task-router, tool registry, and (often) the cloud fallback.
//
// The exported `runPrompt` runs the chat pipeline in-process:
//   1. classifyTask() — task-router classifies intent, may delegate
//      to opencode / kilo / the tool registry for real work
//   2. routeThroughLocalStack() — local MiniCPM via omniroute, with
//      a full ReAct loop that executes any tool_calls the LLM emits
//   3. chatWithCloud() — cloud fallback (groq / deepseek / openrouter
//      / etc.) only if the local stack is unavailable
// Phase events are emitted through the optional `onPhase` callback
// so callers (voicemail route, chat UI breadcrumb) can show real
// progress, not the artificial 3-stage stt>think>tts approximation.
// ============================================================

import { chatWithCloud } from "@/lib/cloud-router";
import { complete } from "@/lib/omniroute";
import { sendToHermes } from "@/lib/hermes";
import { getAgentLoop } from "@/lib/agent-loop";
import {
  beginLLMRequest,
  endLLMRequest,
  releaseAfterAnswer,
  userServiceActive,
  userService,
} from "@/lib/llm-gate";
import { exec, execFile, spawn } from "child_process";
import { promisify } from "util";
import fs from "fs";
import { fcukHome } from "./fcuk-home";

const execFileAsync = promisify(execFile);

const TASK_ROUTER_URL = process.env.TASK_ROUTER_URL || "http://localhost:3200";

export type PipelinePhase =
  | "router"
  | "task"
  | "hermes"
  | "minicpm"
  | "tools"
  | "cloud"
  | "ollama"
  | "tts"
  | "done"
  | "error";

export interface PipelineEvent {
  phase: PipelinePhase;
  ok: boolean;
  durationMs?: number;
  detail?: string;
  error?: string;
}

export interface RunPromptOpts {
  systemSuffix?: string;
  voiceCall?: boolean;
  /** Skip the task-router / hermes / cloud layers and call the local
   *  ollama model directly. Used by voicemail when the user prompt
   *  is short and clearly conversational. */
  localOnly?: boolean;
  onPhase?: (e: PipelineEvent) => void;
}

export interface RunPromptResult {
  reply: string;
  routed: "task" | "delegate" | "chat" | "tool_use" | "cloud" | "no_llm";
  provider: string;
  model?: string;
  backend?: string;
  events: PipelineEvent[];
  toolCalls: string[];
  /** Per-spec, the request MAY have run a real tool. List of tool
   *  names that were actually invoked (not just offered to the LLM). */
  toolsExecuted: string[];
}

const timed = async <T>(label: string, fn: () => Promise<T>, onPhase?: (e: PipelineEvent) => void): Promise<{ value: T; event: PipelineEvent }> => {
  const start = Date.now();
  try {
    const value = await fn();
    const event: PipelineEvent = { phase: label as PipelinePhase, ok: true, durationMs: Date.now() - start };
    onPhase?.(event);
    return { value, event };
  } catch (e: unknown) {
    const event: PipelineEvent = { phase: label as PipelinePhase, ok: false, durationMs: Date.now() - start, error: e instanceof Error ? e.message : String(e) };
    onPhase?.(event);
    throw e;
  }
};

// ─── task-router gate (mirrors chat/route.ts) ──────────────

function isTaskRouterUp(): Promise<boolean> {
  return fetch(`${TASK_ROUTER_URL}/health`, { signal: AbortSignal.timeout(3000) })
    .then((r) => r.ok)
    .catch(() => false);
}

async function startTaskRouter(): Promise<boolean> {
  try {
    if (await userServiceActive("task-router")) {
      return await isTaskRouterUp();
    }
    const exists = await new Promise<boolean>((resolve) => {
      execFileAsync("systemctl", ["--user", "list-unit-files", "task-router.service"], { timeout: 10_000 })
        .then(({ stdout }) => resolve(/task-router\.service/.test(stdout)))
        .catch(() => resolve(false));
    });
    if (exists) {
      await userService("task-router", "start");
    } else {
      const base = fcukHome();
      const candidates = [
        `${base}/omniroute/task-router.mjs`,
        `${base}/datro/agentos/task-router.mjs`,
      ];
      const routerFile = candidates.find((f) => fs.existsSync(f)) as string | undefined;
      if (!routerFile) return false;
      spawn("node", [routerFile], {
        env: { ...process.env, PORT: String(parseInt(process.env.TASK_ROUTER_PORT || "3200", 10)) },
        detached: true,
        stdio: "ignore",
      }).unref();
    }
    const deadline = Date.now() + 15_000;
    while (Date.now() < deadline) {
      if (await isTaskRouterUp()) return true;
      await new Promise((r) => setTimeout(r, 1500));
    }
    return await isTaskRouterUp();
  } catch {
    return false;
  }
}

// ─── hermes gate (mirrors startTaskRouter) ─────────────────────

const HERMES_PORT = parseInt(process.env.HERMES_PORT || "9119", 10);

function isHermesUp(): Promise<boolean> {
  return fetch(`http://localhost:${HERMES_PORT}/api/skills`, { signal: AbortSignal.timeout(3000) })
    .then((r) => r.ok)
    .catch(() => false);
}

async function startHermes(): Promise<boolean> {
  try {
    if (await userServiceActive("hermes-proxy")) return await isHermesUp();
    const exists = await new Promise<boolean>((resolve) => {
      execFileAsync("systemctl", ["--user", "list-unit-files", "hermes-proxy.service"], { timeout: 10_000 })
        .then(({ stdout }) => resolve(/hermes-proxy\.service/.test(stdout)))
        .catch(() => resolve(false));
    });
    if (!exists) return false;
    await userService("hermes-proxy", "start");
    const deadline = Date.now() + 15_000;
    while (Date.now() < deadline) {
      if (await isHermesUp()) return true;
      await new Promise((r) => setTimeout(r, 1500));
    }
    return await isHermesUp();
  } catch {
    return false;
  }
}

async function classifyTask(msg: string, messages: Array<{ role: string; content: string }>): Promise<any | null> {
  if (!(await isTaskRouterUp())) {
    const started = await startTaskRouter();
    if (!started || !(await isTaskRouterUp())) return null;
  }
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = process.env.TASK_ROUTER_TOKEN || process.env.FCUK_LOCAL_TOKEN || "";
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const attempt = async (): Promise<Response> => {
    return fetch(`${TASK_ROUTER_URL}/route`, {
      method: "POST",
      headers,
      body: JSON.stringify({ text: msg, messages }),
      signal: AbortSignal.timeout(15_000),
    });
  };

  let res: Response;
  try {
    res = await attempt();
  } catch {
    const started = await startTaskRouter();
    if (!started) return null;
    try { res = await attempt(); } catch { return null; }
  }
  if (!res.ok) return null;
  try { return await res.json(); } catch { return null; }
}

// ─── Main entry point ──────────────────────────────────────

// ─── ReAct response cleanup (v1.11.37) ──────────────────────
// The 1B model is trained to emit <function>…</function> tool-call XML.
// When the tool catalog is rejected (ollama can't parse the schema for
// the non-tooling model) we retry WITHOUT tools, but the model still
// reaches for tool syntax. Clean the reply:
//   1. If a stub names a real registry tool, execute it and return the
//      output as the answer (legit real work, same as the with-tools path).
//   2. Otherwise strip every <function>…</function> stub so the user
//      never hears XML in chat or voicemail TTS.
const REACT_FUNCTION_RE = /<function\s+name=["']([^"']+)["']\s*>([\s\S]*?)<\/function>|<function\s+name=["']([^"']+)["'][^>]*\/>/g;
const REACT_PARAM_RE = /<param\s+name=["']([^"']+)["']\s*>([\s\S]*?)<\/param>/g;

function parseReActStub(content: string): Array<{ name: string; args: Record<string, string> }> {
  const out: Array<{ name: string; args: Record<string, string> }> = [];
  for (const m of content.matchAll(REACT_FUNCTION_RE)) {
    const name = m[1] || m[3] || "";
    const args: Record<string, string> = {};
    for (const p of (m[2] || "").matchAll(REACT_PARAM_RE)) {
      args[p[1]] = p[2]?.trim() || "";
    }
    if (name) out.push({ name, args });
  }
  return out;
}

function stripReActReply(content: string): string {
  return content.replace(REACT_FUNCTION_RE, "").replace(/\s*\n\s*/g, "\n").trim();
}

export async function runPrompt(
  msg: string,
  history: Array<{ role: "system" | "user" | "assistant"; content: string }>,
  opts: RunPromptOpts = {},
): Promise<RunPromptResult> {
  const events: PipelineEvent[] = [];
  const onPhase = (e: PipelineEvent) => { events.push(e); opts.onPhase?.(e); };
  const toolCalls: string[] = [];
  const toolsExecuted: string[] = [];

  beginLLMRequest();
  try {
    // 1. Classify (task-router → opencode / kilo / delegate)
    let routed: any = null;
    try {
      const { value } = await timed("router", () => classifyTask(msg, history), onPhase);
      routed = value;
    } catch {
      // timed() already emitted a phase event with ok=false
    }

    if (routed?.type === "task") {
      onPhase({ phase: "task", ok: true, detail: routed.backend || "task-router" });
      return {
        reply: routed.result || "Task completed.",
        routed: "task",
        provider: "task-router",
        backend: routed.backend,
        events,
        toolCalls,
        toolsExecuted,
      };
    }

    // 2. Local: hermes → minicpm (via omniroute) with ReAct tool loop
    try {
      // v1.11.36: gate-start hermes-proxy (user service, :9119) like the
      // router/omniroute so the stage has a fair chance instead of
      // hard-failing with "fetch failed" when the service exited.
      await startHermes();
      const hermesReply = await timed("hermes", () => sendToHermes(msg, JSON.stringify({ messages: history.slice(-8), router: routed })), onPhase);
      const reply = hermesReply.value;
      if (reply && reply !== "No response") {
        onPhase({ phase: "ollama", ok: true });
        return {
          reply,
          routed: "chat",
          provider: "hermes",
          events,
          toolCalls,
          toolsExecuted,
        };
      }
    } catch (e) {
      onPhase({ phase: "hermes", ok: false, error: e instanceof Error ? e.message : String(e) });
    }

    // 3. Direct minicpm via omniroute + ReAct tool loop
    const loop = getAgentLoop();
    const toolCatalog = (loop.getToolRegistry?.()?.listTools?.() || []) as any[];
    const tools = toolCatalog.length > 0 ? toolCatalog : undefined;
    const baseMessages = [
      {
        role: "system" as const,
        content: "You are Hermes, the local AgentOS chat brain. Answer conversationally and keep responses concise. Tool calls you make WILL be executed (apt install, terminal exec, file_read, calculator, etc.) — you may use them when they actually help the user." + (opts.systemSuffix || ""),
      },
      ...history.slice(-8),
    ];

    let firstCompletion: any;
    const minicpmBase = {
      model: "openbmb/minicpm5",
      messages: baseMessages,
      temperature: 0.7,
      max_tokens: 700,
      stream: false,
    };
    try {
      // v1.11.36: the tool catalog (ReAct) is rejected by the local 1B model
      // (ollama → 500 "Failed to parse tools"). When the tool-using call fails
      // we retry ONCE without tools so a plain conversational answer still
      // comes back; without this retry voicemail/chat surfaced a misleading
      // E_NO_PROVIDER when hermes was also down.
      firstCompletion = await timed("minicpm", () => complete({
        ...minicpmBase,
        ...(tools ? { tools, tool_choice: "auto" } : {}),
      }), onPhase);
    } catch {
      // First (with-tools) call failed — retry without tools. timed() already
      // emitted an ok=false minicpm event for the tools attempt.
      // v1.11.37: ALSO swap to a conversational system prompt for the retry so
      // the 1B model answers in plain text instead of emitting <function> XML
      // into the reply (its ReAct habit even without a tools schema).
      const noToolsSystem: { role: "system"; content: string } = {
        role: "system",
        content: "You are Hermes, the local AgentOS chat brain. Answer conversationally in plain text and keep responses concise. You do NOT have tools available — never output XML, JSON, or function-call syntax. Compute simple arithmetic yourself and state ONLY the final result (e.g. \"35\"), with no working-out or alternative methods." + (opts.systemSuffix || ""),
      };
      try {
        firstCompletion = await timed("minicpm", () => complete({
          ...minicpmBase,
          messages: [noToolsSystem, ...history.slice(-8)],
        }), onPhase);
      } catch {
        // Second attempt failed too; timed() emitted ok=false — fall through.
      }
    }

    const firstMessage = firstCompletion?.value?.choices?.[0]?.message ?? {};
    const firstToolCalls: any[] = Array.isArray(firstMessage.tool_calls) ? firstMessage.tool_calls : [];
    const firstContent: string = (firstMessage.content || "").trim();

    if (firstToolCalls.length > 0 && tools) {
      onPhase({ phase: "tools", ok: true, detail: firstToolCalls.map((t: any) => t.function?.name).filter(Boolean).join(",") });
      for (const tc of firstToolCalls) {
        const name = String(tc.function?.name || "");
        if (name) {
          toolCalls.push(name);
          toolsExecuted.push(name);
        }
        const args: Record<string, unknown> = (() => {
          try {
            return typeof tc.function?.arguments === "string" ? JSON.parse(tc.function.arguments || "{}") : (tc.function?.arguments || {});
          } catch { return {}; }
        })();
        let execResult: { success: boolean; output: string; error?: string };
        try {
          const r = await loop.getToolRegistry().execute({
            id: String(tc.id || `tc-${Date.now()}`),
            tool: name,
            parameters: args,
            timestamp: Date.now(),
          });
          execResult = { success: !!r.success, output: String(r.output || "").slice(0, 4000), error: r.error };
        } catch (e) {
          execResult = { success: false, output: "", error: e instanceof Error ? e.message : String(e) };
        }
        // We don't continue the ReAct loop for follow-up LLM calls here — that's
        // expensive on a 1B model and not worth the latency for voicemail. Just
        // surface the tool output. The chat UI does the full loop in its own
        // route for users typing; voicemail gets the tool's raw output.
        if (execResult.success && execResult.output) {
          return {
            reply: execResult.output,
            routed: "tool_use",
            provider: "tools",
            backend: name,
            events,
            toolCalls,
            toolsExecuted,
          };
        }
      }
    }

    if (firstContent) {
      // v1.11.37: even without a tools schema the 1B model may emit ReAct
      // <function>…</function> XML into a plain answer. If a stub names a REAL
      // registry tool, execute it (legit real work) and return its output;
      // otherwise strip the XML so chat/voicemail never surfaces raw markup.
      const stubs = parseReActStub(firstContent);
      if (stubs.length > 0) {
        for (const stub of stubs) {
          try {
            const r = await loop.getToolRegistry().execute({
              id: `stub-${Date.now()}`,
              tool: stub.name,
              parameters: stub.args,
              timestamp: Date.now(),
            });
            const output = String(r.output || "").slice(0, 4000);
            if (r.success && output) {
              onPhase({ phase: "tools", ok: true, detail: stub.name });
              return {
                reply: output,
                routed: "tool_use",
                provider: "tools",
                backend: stub.name,
                events,
                toolCalls: [stub.name],
                toolsExecuted: [stub.name],
              };
            }
          } catch {
            /* registry doesn't know the tool — strip instead */
          }
        }
        const cleaned = stripReActReply(firstContent);
        if (cleaned) {
          onPhase({ phase: "ollama", ok: true });
          return {
            reply: cleaned,
            routed: "chat",
            provider: "omniroute",
            model: "openbmb/minicpm5",
            events,
            toolCalls,
            toolsExecuted,
          };
        }
      }
      onPhase({ phase: "ollama", ok: true });
      return {
        reply: firstContent,
        routed: "chat",
        provider: "omniroute",
        model: "openbmb/minicpm5",
        events,
        toolCalls,
        toolsExecuted,
      };
    }

    // 4. Cloud fallback (only if not localOnly and we have providers)
    if (!opts.localOnly) {
      const toolCatalogForCloud = (loop.getToolRegistry?.()?.listTools?.() || []) as any[];
      const cloudTools = toolCatalogForCloud.length > 0 ? toolCatalogForCloud : undefined;
      try {
        const { value: cloud } = await timed("cloud", () => chatWithCloud([
          { role: "system" as const, content: "You are Hermes, the local AgentOS chat brain." + (opts.systemSuffix || "") },
          ...history.slice(-8),
          { role: "user" as const, content: msg },
        ], { tools: cloudTools }), onPhase);
        if (cloud?.content) {
          return {
            reply: cloud.content,
            routed: "cloud",
            provider: cloud.provider || "cloud",
            model: cloud.model,
            events,
            toolCalls,
            toolsExecuted,
          };
        }
      } catch (e) {
        onPhase({ phase: "cloud", ok: false, error: e instanceof Error ? e.message : String(e) });
      }
    }

    onPhase({ phase: "error", ok: false, error: "no_llm" });
    return {
      reply: "(No LLM available — add an API key to .env or install with MODE=full for local ollama)",
      routed: "no_llm",
      provider: "none",
      events,
      toolCalls,
      toolsExecuted,
    };
  } finally {
    endLLMRequest();
    // releaseAfterAnswer is fire-and-forget — the chat UI calls it explicitly,
    // but voicemail should too so omniroute / ollama are released after the
    // 30-min watchdog, not after 30 minutes of idle (which never happens in
    // a long-lived voicemail pipeline).
    releaseAfterAnswer();
  }
}
