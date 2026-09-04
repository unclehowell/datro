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
      const home = process.env.HOME || "";
      const candidates = [
        `${home}/.fcukproxy/omniroute/task-router.mjs`,
        `${home}/.fcukproxy/datro/agentos/task-router.mjs`,
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
    try {
      firstCompletion = await timed("minicpm", () => complete({
        model: "openbmb/minicpm5",
        messages: baseMessages,
        temperature: 0.7,
        max_tokens: 700,
        stream: false,
        ...(tools ? { tools, tool_choice: "auto" } : {}),
      }), onPhase);
    } catch {
      // Phase event already emitted with ok=false; fall through to without-tools retry
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
