// ============================================================
// Chat API v4 — Pure Router (no hardcoded responses)
// ============================================================
// Every prompt → cloud LLM classifies → routes to handler.
// Cloud LLM is the brain. Local tools are the hands.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { AgentLoop } from "@/runtime/loop";
import { detectIntent } from "@/runtime/tools/protocol";
import { Session } from "@/runtime/types";
import { chatWithCloud } from "@/lib/cloud-router";
import { complete } from "@/lib/omniroute";
import { sendToHermes } from "@/lib/hermes";
import { switchToProfile } from "@/lib/hermes-gate";
import { isProxyLocked, lockForProxy, unlockProxy, getProxyLock } from "@/lib/proxy-state";
import { exec, spawn } from "child_process";
import { promisify } from "util";
import { homedir } from "os";
import { getRenderJob } from "@/runtime/tools/remotion";
import { queryGraphRAG } from "@/lib/graphrag";
import { ensureLLMStack, beginLLMRequest, endLLMRequest } from "@/lib/llm-gate";

const execAsync = promisify(exec);

const DEFAULT_HOME = homedir();

const TASK_ROUTER_URL = process.env.TASK_ROUTER_URL || "http://localhost:3200";

// Mode / voice persona adjustments appended to system prompts.
function personaSuffix(mode?: string, voiceCall?: boolean): string {
  const parts: string[] = [];
  if (mode === "plan") parts.push("The user is in PLAN mode: analyze the request and propose a step-by-step plan. Do not execute changes or tools.");
  if (voiceCall) parts.push("You are on a live phone call. Reply in one to three short spoken sentences. No markdown, no lists, no emojis.");
  return parts.length ? ` ${parts.join(" ")}` : "";
}

// ─── Engage the Main Agent on demand ────────────────────────
// Nothing LLM runs in the background by default. When a prompt is
// submitted through the chat page:
//   1. the Support Agent (hermes-local / ollama-cloud) is stopped if it
//      is running, and
//   2. the Main Agent (hermes-proxy / local ollama+MiniCPM stack) is
//      engaged — systemd units first, then the LLM stack is booted and
//      warmed so the reply pipeline (omniroute :20128) actually answers.
async function engageMainAgent(): Promise<void> {
  try {
    const profiles = await switchToProfile("hermes-proxy");
    console.log(`[chat] main agent: hermes-proxy=${profiles.hermesProxy?.running}, hermes-local=${profiles.hermesLocal?.running}`);
  } catch (e: any) {
    console.log(`[chat] profile switch skipped: ${e?.message || e}`);
  }
  try {
    // Cold-start the stack if it is down (stop-to-boot with a warm ping so
    // the first chat reply is not a 30s model-load timeout). Subsequent
    // messages are cheap: warmStack skips the ping once the model is loaded.
    const gate = await ensureLLMStack();
    console.log(`[chat] llm stack: ${gate.message || gate.state}`);
  } catch (e: any) {
    console.log(`[chat] llm stack unavailable: ${e?.message || e}`);
  }
}

async function routeThroughLocalStack(messages: Array<{ role: "system" | "user" | "assistant"; content: string }>, msg: string, opts?: { mode?: string; voiceCall?: boolean }): Promise<{
  reply: string;
  routed: string;
  dependency: string;
  provider: string;
  model?: string;
  backend?: string;
} | null> {
  // Mark the whole local-route window as an LLM request so the idle
  // watchdog (llm-gate) never shuts the stack down mid-completion.
  beginLLMRequest();
  try {
    const routerRes = await fetch(`${TASK_ROUTER_URL}/route`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: msg, messages }),
      signal: AbortSignal.timeout(360000),
    });

    if (!routerRes.ok) throw new Error(`task-router ${routerRes.status}`);
    const routed = await routerRes.json();

    if (routed.type === "task") {
      return {
        reply: routed.result || "Task completed.",
        routed: "delegate",
        dependency: routed.backend || "task-router",
        provider: "task-router",
        backend: routed.backend,
      };
    }

    try {
      const hermesReply = await sendToHermes(msg, JSON.stringify({ messages: messages.slice(-8), router: routed }));
      if (hermesReply && hermesReply !== "No response") {
        return {
          reply: hermesReply,
          routed: "chat",
          dependency: "hermes",
          provider: "hermes",
        };
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.log(`[LOCAL] Hermes unavailable, falling back to MiniCPM via OmniRoute: ${message}`);
    }

    const completion = await complete({
      model: "openbmb/minicpm5",
      messages: [
        {
          role: "system",
          content: "You are Hermes, the local AgentOS chat brain. Answer conversationally and keep responses concise. Do not claim to execute tasks; task execution is handled by the task-router." + personaSuffix(opts?.mode, opts?.voiceCall),
        },
        ...messages.slice(-8),
      ],
      temperature: 0.7,
      max_tokens: 700,
      stream: false,
    });
    const reply = completion.choices?.[0]?.message?.content?.trim();
    if (!reply) throw new Error("empty MiniCPM response");

    return {
      reply,
      routed: "chat",
      dependency: "minicpm5",
      provider: "omniroute",
      model: "openbmb/minicpm5",
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.log(`[LOCAL] AgentOS local route unavailable: ${message}`);
    return null;
  } finally {
    endLLMRequest();
  }
}


// ─── Video render jobs (background) ─────────────────────────
interface VideoJob {
  id: string;
  status: "pending" | "running" | "done" | "failed";
  composition: string;
  duration: number;
  props: Record<string, unknown>;
  result?: { success: boolean; output?: string; error?: string };
  createdAt: number;
  completedAt?: number;
}

const videoJobs = new Map<string, VideoJob>();

const delegateJobs = new Map<string, { id: string; agent: string; task: string; context: string; status: string; createdAt: number; result: any; completedAt?: number }>();

function generateJobId(): string {
  return "v_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

let agentLoop: AgentLoop | null = null;

function getAgentLoop(): AgentLoop {
  if (!agentLoop) {
    agentLoop = new AgentLoop({
      maxIterations: 200,
      maxToolRounds: 20,
      checkpointEvery: 10,
      useLLM: true,
      logLevel: "info",
      enableSubagents: true,
      maxSubagentDepth: 3,
    });
  }
  return agentLoop;
}

// ─── Video template names for redirect detection ───
const AI_VIDEO_TEMPLATES = ["dance", "nature", "city", "space", "fire", "snow"];

function isVideoToolCall(tool: string, args: Record<string, unknown>): boolean {
  if (tool !== "remotion") return false;
  const props = args.props;
  if (typeof props === "string") {
    try {
      const parsed = JSON.parse(props);
      if (parsed.template && AI_VIDEO_TEMPLATES.includes(parsed.template)) return true;
      if (parsed.scene && AI_VIDEO_TEMPLATES.includes(parsed.scene)) return true;
    } catch {}
  }
  if (args.template && AI_VIDEO_TEMPLATES.includes(String(args.template))) return true;
  if (args.scene && AI_VIDEO_TEMPLATES.includes(String(args.scene))) return true;
  return false;
}

function redirectRemotionToAIVideo(args: Record<string, unknown>): Record<string, unknown> {
  const props = args.props;
  let parsedProps: Record<string, unknown> = {};
  if (typeof props === "string") {
    try { parsedProps = JSON.parse(props); } catch { parsedProps = {}; }
  } else if (props && typeof props === "object") {
    parsedProps = props as Record<string, unknown>;
  }
  const template = parsedProps.template || parsedProps.scene || args.template || "dance";
  const duration = parsedProps.duration || args.duration || 5;
  return {
    scene: template,
    duration,
    props: JSON.stringify(parsedProps),
  };
}
function isMathExpr(s: string): boolean {
  return /^[\d\s\+\-\*\/\%\.\(\)\^]+$/.test(s) && s.length < 80 && /\d/.test(s) && /[\+\-\*\/\%\^]/.test(s);
}

async function evalMath(expr: string): Promise<string | null> {
  const sanitized = expr.replace(/[^0-9\+\-\*\/\%\.\(\)\s\^]/g, "");
  if (!sanitized || !/\d/.test(sanitized)) return null;
  try {
    // Expression is passed via stdin — never interpolated into a shell
    // command (backticks in the old version allowed command substitution).
    const stdout = await new Promise<string>((resolve, reject) => {
      const py = spawn("python3", ["-c", "import sys; print(eval(sys.stdin.read().replace('^', '**')))"]);
      let out = "";
      const timer = setTimeout(() => { py.kill(); reject(new Error("math eval timeout")); }, 5000);
      py.stdout.on("data", (d) => (out += d));
      py.on("error", (e) => { clearTimeout(timer); reject(e); });
      py.on("close", (code) => {
        clearTimeout(timer);
        if (code === 0) resolve(out); else reject(new Error("math eval failed"));
      });
      py.stdin.write(sanitized);
      py.stdin.end();
    });
    const val = stdout.trim();
    return val || null;
  } catch {
    return null;
  }
}

// ─── JSON tool extraction ─────────────────────────────────
function extractJsonTool(msg: string): { tool: string; args: Record<string, unknown> } | null {
  const match = msg.match(/```json\s*\n?\s*(\{[\s\S]*?\})\s*\n?\s*```/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[1]);
    if (parsed.tool && parsed.args) return parsed;
  } catch {}
  return null;
}

// ─── System prompt: the router asks the cloud LLM to classify ─
const ROUTER_SYSTEM = `You are Jarvis, an AI router. Classify the user message and respond in EXACTLY one of these formats. ONLY output the prefix and content, nothing else:

CHAT: <response> — for questions, jokes, greetings, explanations, opinions, or anything you can answer from knowledge.

EXEC: <command> — ONLY if the user explicitly asks to run a command or do something on the computer.

MATH: <expression> — ONLY for pure arithmetic with no words, like "42*7".

VIDEO: <JSON> — if the user asks to create/generate/make/render a video or any visual scene. Output ONLY a JSON object: {"template":"<name>","props":{<props>},"duration":<seconds>}. Use the ai-video tool (SVG scene engine) for ALL literal video requests. If the user specifies a duration (e.g. "3 second video", "10 seconds"), set "duration" to that number of seconds. Otherwise default to 5.

DELEGATE: <JSON> — if the user asks you to spawn a subagent or delegate a task to another agent (opencode, kilo, or hermes). Output ONLY a JSON object: {"agent":"<name>","task":"<task description>","context":"<optional context>"}. Use this to spawn independent subagents for long-running or complex tasks.

Available VIDEO templates (ai-video / SVG scene engine):
- dance: animated character dancing. Props: {"character":"cat","action":"groovy sway","background":"disco floor","palette":["#ff6b6b","#ffd93d"],"motion":"lively"}
- nature: natural scenes. Props: {"character":"none","action":"waves gently rolling","background":"tropical beach, palm trees, golden sand","palette":["#ff6b6b","#ffa94d","#0077be"],"motion":"calm"}
- city: city scenes. Props: {"character":"none","action":"traffic flowing","background":"night skyline with neon lights","palette":["#232526","#414345","#fc466b"],"motion":"energetic"}
- space: space scenes. Props: {"character":"none","action":"stars twinkling","background":"deep space with nebula","palette":["#0f0c29","#302b63","#c850c0"],"motion":"slow"}
- fire: fire scenes. Props: {"character":"none","action":"flames rising","background":"fire and embers","palette":["#f83600","#f9d423","#ff4e50"],"motion":"intense"}
- snow: snow scenes. Props: {"character":"none","action":"snow falling","background":"winter landscape","palette":["#e0eafc","#cfdef3","#ffffff"],"motion":"gentle"}

RULES for video requests:
1. ALWAYS route ANY request to make/create/generate/render a video or visual scene to VIDEO:.
2. For literal video requests (animals, people, actions, scenes) use the appropriate template with detailed props.
3. NEVER use the remotion tool for video creation. The remotion tool is ONLY for abstract/stylized renders (gradients, text animations, title cards, shapes).
4. NEVER route a video creation request to EXEC. Always use VIDEO.
5. Do NOT include "text" or "subtitle" props unless the user explicitly asks for text in the video.
6. Keep props concise and descriptive.

RULES for delegate requests:
7. If the user asks you to spawn a subagent, delegate a task, or run a task in the background using another agent, use DELEGATE:.
8. DELEGATE is for long-running tasks, complex multi-step operations, or when the user explicitly asks to use opencode, kilo, or hermes.
9. Never use EXEC for tasks that should be delegated to a subagent.

If it is not a video request and the user wants you to do something on the computer, use EXEC. Never EXEC for video creation.`;


async function runDelegate(agent: string, task: string, context?: string): Promise<{ success: boolean; output: string; error?: string }> {
  // Spawn the agent as a subprocess with unrestricted permissions
  const env = { ...process.env, HERMES_YOLO: "1", EXEC_MODE: "unrestricted", DELEGATE_TASK: task };

  try {
    const { execSync } = require("child_process");
    const cmd = agent === "opencode"
      ? `opencode --quiet --task "${task.replace(/"/g, '\"')}"`
      : agent === "kilo"
      ? `kilo --quiet --task "${task.replace(/"/g, '\"')}"`
      : `hermes --yolo --task "${task.replace(/"/g, '\"')}"`;

    const output = execSync(cmd, {
      cwd: DEFAULT_HOME,
      timeout: 3600000, // 1 hour max for delegate tasks
      env,
      encoding: "utf-8",
    });
    return { success: true, output: output.trim() || "Task completed" };
  } catch (err: any) {
    return { success: false, error: err.message || "Delegate task failed", output: err.stdout || "" };
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const message = body.message || (Array.isArray(body.messages) && body.messages.length > 0
      ? body.messages[body.messages.length - 1].content
      : null);

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const msg = message.trim();

    // ── Proxy mode ──────
    const proxySessionId = body.proxySessionId;
    if (proxySessionId) {
      lockForProxy(proxySessionId, body.proxyOrigin || "parent");
    }

    if (isProxyLocked() && !proxySessionId) {
      const lock = getProxyLock();
      return NextResponse.json({
        reply: "🔒 Chat is locked. A parent proxy is using this session.",
        locked: true,
        lockInfo: lock ? { sessionId: lock.sessionId, origin: lock.origin, expiresAt: lock.expiresAt } : null,
      }, { status: 423 });
    }

    // ── 1. Direct JSON tool call ──
    const jsonTool = extractJsonTool(msg);
    if (jsonTool) {
      // Redirect remotion tool calls that are actually video requests to ai-video
      if (jsonTool.tool === "remotion" && isVideoToolCall("remotion", jsonTool.args)) {
        const aiVideoParams = redirectRemotionToAIVideo(jsonTool.args);
        const loop = getAgentLoop();
        const result = await loop.getToolRegistry().execute({
          id: crypto.randomUUID(),
          tool: "ai-video",
          parameters: aiVideoParams,
          timestamp: Date.now(),
        });
        return NextResponse.json({
          reply: result.success ? result.output : `Error: ${result.error}`,
          toolCall: { tool: "ai-video", args: aiVideoParams },
          success: result.success,
        });
      }

      const loop = getAgentLoop();
      const result = await loop.getToolRegistry().execute({
        id: crypto.randomUUID(),
        tool: jsonTool.tool,
        parameters: jsonTool.args,
        timestamp: Date.now(),
      });
      return NextResponse.json({
        reply: result.success ? result.output : `Error: ${result.error}`,
        toolCall: { tool: jsonTool.tool, args: jsonTool.args },
        success: result.success,
      });
    }

    // ── 2. Fast-path: pure math ────────────────────
    if (isMathExpr(msg)) {
      const result = await evalMath(msg);
      if (result !== null) {
        return NextResponse.json({ reply: result, routed: "math", dependency: "python3", success: true });
      }
    }

    // ── 2b. Fast-path: video status check ─────────────────────
    const videoCreatePattern = /\b(make|create|generate|render|build|produce|make me|can you)\b/i;
    const videoStatusPattern = /\b(video|render|mp4|movie)\b/i;
    if (videoStatusPattern.test(msg) && !videoCreatePattern.test(msg)) {
      let latest: VideoJob | null = null;
      for (const job of videoJobs.values()) {
        if (!latest || job.createdAt > latest.createdAt) {
          latest = job;
        }
      }

      if (!latest) {
        try {
          const { readdir, stat } = require("fs/promises");
          const { join } = require("path");
          const outDir = join(process.cwd(), "remotion", "out");
          const files = await readdir(outDir);
          const mp4Files = files.filter((f: string) => f.endsWith(".mp4"));
          if (mp4Files.length > 0) {
            let newestFile = mp4Files[0];
            let newestMtime = 0;
            for (const f of mp4Files) {
              const s = await stat(join(outDir, f));
              if (s.mtimeMs > newestMtime) {
                newestMtime = s.mtimeMs;
                newestFile = f;
              }
            }
            return NextResponse.json({
              reply: `Here is your most recent video:`,
              routed: "video",
              dependency: "remotion",
              videoResult: { filename: newestFile, path: join(outDir, newestFile) },
              success: true,
            });
          }
        } catch {}
        return NextResponse.json({
          reply: "No videos found. Ask me to create one!",
          routed: "video",
          success: true,
        });
      }

      if (latest) {
        const elapsed = Date.now() - latest.createdAt;
        const elapsedMin = Math.floor(elapsed / 60000);
        const elapsedSec = Math.floor((elapsed % 60000) / 1000);

        if (latest.status === "done") {
          const rawOutput = latest.result?.output || "";
          const pathMatch = rawOutput.match(/\/([^/\n]+\.mp4)/);
          const filename = pathMatch ? pathMatch[1] : "video.mp4";
          return NextResponse.json({
            reply: `Your video is ready! It is a ${latest.duration}s ${latest.composition} video. Here it is:`,
            routed: "video",
            dependency: "remotion",
            videoJobId: latest.id,
            videoResult: { filename, path: latest.result?.output },
            success: true,
          });
        }
        if (latest.status === "failed") {
          return NextResponse.json({
            reply: `Your video render failed: ${latest.result?.error || "Unknown error"}. Want me to try again?`,
            routed: "video",
            dependency: "remotion",
            videoJobId: latest.id,
            success: false,
          });
        }
        return NextResponse.json({
          reply: `Still rendering — it has been ${elapsedMin}m ${elapsedSec}s so far. These Celeron renders take a while. I will have it ready soon.`,
          routed: "video",
          dependency: "remotion",
          videoJobId: latest.id,
          success: true,
        });
      }
    }

    // ── 3. Route through the local AgentOS stack first ──────────────
    // Bring the Main Agent up on demand (stop Support, boot ollama +
    // omniroute, warm the model) so the local stack is actually alive.
    await engageMainAgent();
    // Query GraphRAG for knowledge context before routing
    const { context: ragContext } = await queryGraphRAG(msg);
    const localMessages = Array.isArray(body.messages) && body.messages.length > 0
      ? body.messages.map((m: { role?: string; content?: string }) => ({
        role: m.role === "assistant" ? "assistant" : m.role === "system" ? "system" : "user",
        content: String(m.content || ""),
      }))
      : [{ role: "user", content: msg }];
    // Prepend RAG context as system message if available
    if (ragContext) {
      localMessages.unshift({
        role: "system" as const,
        content: `You have access to the following knowledge base context. Use it to answer the user's question when relevant:\n\n${ragContext}`,
      });
    }
    const localResult = await routeThroughLocalStack(localMessages, msg, { mode: body.mode, voiceCall: body.voiceCall });
    if (localResult) {
      return NextResponse.json({ ...localResult, success: true });
    }

    // ── 4. Cloud fallback if the local stack is unavailable ──────────────
    const cloudMessages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
      { role: "system", content: ROUTER_SYSTEM + personaSuffix(body.mode, body.voiceCall) },
    ];
    if (ragContext) {
      cloudMessages.push({
        role: "system",
        content: `Knowledge base context for the user's question:\n\n${ragContext}`,
      });
    }
    cloudMessages.push({ role: "user", content: msg });
    const cloudResult = await chatWithCloud(cloudMessages);

    if (!cloudResult?.content) {
      return NextResponse.json({
        reply: "Local AgentOS and cloud fallback are unavailable. Check pm2 status and Ollama, then try again.",
        success: false,
      }, { status: 503 });
    }

    const response = cloudResult.content.trim();

    // ── 3a. CHAT response → return directly ─────────────────
    if (response.startsWith("CHAT:")) {
      return NextResponse.json({
        reply: response.slice(5).trim(),
        routed: "chat",
        dependency: cloudResult.provider,
        provider: cloudResult.provider,
        model: cloudResult.model,
        success: true,
      });
    }

    // ── 3b. MATH response → compute via shell ───────────────
    if (response.startsWith("MATH:")) {
      const expr = response.slice(5).trim();
      const result = await evalMath(expr);
      if (result !== null) {
        return NextResponse.json({ reply: result, routed: "math", dependency: "python3", success: true });
      }
    }

    // ── 3c. EXEC response → run terminal command ────────────
    if (response.startsWith("EXEC:")) {
      const command = response.slice(5).trim();
      const intent = detectIntent(command);
      const cmdToRun = intent?.command || command;

      // Determine if this is a long-running task (background execution)
      const isLongRunning = /(npm install|pip install|git clone|make|cargo build|docker build|wget|curl.*-O|tar|xz|gzip|ffmpeg|render|compile|build)/i.test(cmdToRun);
      const execTimeout = 600000; // 10 min for all exec (was 30s)

      try {
        const { stdout, stderr } = await execAsync(cmdToRun, {
          cwd: DEFAULT_HOME,
          timeout: execTimeout,
          env: { ...process.env, HERMES_YOLO: "1", EXEC_MODE: "unrestricted" },
        });
        const output = (stdout + (stderr ? "\nSTDERR: " + stderr : "")).trim();
        return NextResponse.json({
          reply: output || `Done: \`${cmdToRun}\``,
          toolCall: { tool: "terminal", args: { command: cmdToRun } },
          routed: "exec",
          dependency: "terminal",
          provider: cloudResult.provider,
          success: true,
        });
      } catch (err: any) {
        return NextResponse.json({
          reply: err.stdout?.trim() || err.stderr?.trim() || err.message,
          toolCall: { tool: "terminal", args: { command: cmdToRun } },
          routed: "exec",
          dependency: "terminal",
          success: false,
        });
      }
    }

    // ── 3d. DELEGATE response → spawn subagent ──────────
    if (response.startsWith("DELEGATE:")) {
      const delegateStr = response.slice(9).trim();
      try {
        const delegate = JSON.parse(delegateStr);
        const { agent, task, context } = delegate;

        const jobId = "delegate_" + Date.now().toString(36);
        delegateJobs.set(jobId, {
          id: jobId, agent, task, context,
          status: "running", createdAt: Date.now(), result: null,
        });

        // Fire and forget — run delegate in background
        runDelegate(agent, task, context).then((result) => {
          const job = delegateJobs.get(jobId);
          if (job) {
            job.result = result;
            job.status = result.success ? "done" : "failed";
            job.completedAt = Date.now();
          }
        }).catch((err) => {
          const job = delegateJobs.get(jobId);
          if (job) {
            job.result = { success: false, error: err.message };
            job.status = "failed";
            job.completedAt = Date.now();
          }
        });

        return NextResponse.json({
          reply: `Delegated to ${agent}: ${task.slice(0, 100)}... (job ${jobId})`,
          routed: "delegate",
          dependency: agent,
          provider: cloudResult.provider,
          delegateJobId: jobId,
          success: true,
        });
      } catch {
        return NextResponse.json({
          reply: 'Invalid delegate format. Use: DELEGATE:{"agent":"opencode","task":"...","context":"..."}',
          routed: "delegate",
          success: false,
        });
      }
    }

    // ── 3e. VIDEO response → render via ai-video tool (background) ──
    if (response.startsWith("VIDEO:")) {
      const jsonStr = response.slice(6).trim();
      try {
        const videoParams = JSON.parse(jsonStr);
        let { template, props = {}, duration = 5 } = videoParams;
        // Fallback: honor explicit duration in the user message if the router missed it
        const durationMatch = msg.match(/\b(\d{1,2})\s*(?:second|sec|s)\b/i);
        if (durationMatch) {
          duration = Math.max(1, Math.min(30, parseInt(durationMatch[1], 10)));
        }

        const jobId = generateJobId();
        const job: VideoJob = {
          id: jobId,
          status: "running",
          composition: template || "dance",
          duration,
          props,
          createdAt: Date.now(),
        };
        videoJobs.set(jobId, job);

        // Fire and forget — render in background via ai-video tool
        const loop = getAgentLoop();
        const registry = loop.getToolRegistry();
        registry.execute({
          id: jobId,
          tool: "ai-video",
          timestamp: Date.now(),
          parameters: {
            scene: template || "dance",
            duration,
            props: JSON.stringify(props),
          },
        }).then((result) => {
          job.result = { success: result.success, output: result.output, error: result.error };

          if (result.success && result.output) {
            job.status = "done";
            job.completedAt = Date.now();
          } else {
            job.status = "failed";
            job.result = { success: false, error: result.error || "Video generation failed" };
            job.completedAt = Date.now();
          }
        }).catch((err) => {
          job.result = { success: false, error: err.message };
          job.status = "failed";
          job.completedAt = Date.now();
          console.error(`Video job ${jobId} failed:`, err.message);
        });

        return NextResponse.json({
          reply: `processing ...`,
          routed: "video",
          dependency: "ai-video",
          provider: cloudResult.provider,
          toolCall: { tool: "ai-video", args: { template, duration, props } },
          videoJobId: jobId,
          success: true,
        });
      } catch (parseErr) {
        return NextResponse.json({
          reply: `Failed to parse video parameters: ${jsonStr}`,
          routed: "video",
          dependency: "ai-video",
          success: false,
        });
      }
    }

    // ── 3f. Unrecognized format → check for remotion video redirect or treat as chat ──
    const remotionRedirect = extractJsonTool(response);
    if (remotionRedirect && remotionRedirect.tool === "remotion" && isVideoToolCall("remotion", remotionRedirect.args)) {
      const aiVideoParams = redirectRemotionToAIVideo(remotionRedirect.args);
      const loop = getAgentLoop();
      const result = await loop.getToolRegistry().execute({
        id: crypto.randomUUID(),
        tool: "ai-video",
        parameters: aiVideoParams,
        timestamp: Date.now(),
      });
      return NextResponse.json({
        reply: result.success ? result.output : `Error: ${result.error}`,
        toolCall: { tool: "ai-video", args: aiVideoParams },
        routed: "video",
        dependency: "ai-video",
        success: result.success,
      });
    }

    return NextResponse.json({
      reply: response,
      routed: "chat",
      dependency: cloudResult.provider,
      provider: cloudResult.provider,
      model: cloudResult.model,
      success: true,
    });
  } catch (err: any) {
    console.error("Chat API error:", err);
    return NextResponse.json({
      reply: "Sorry, I encountered an error processing your request.",
      error: err.message,
    }, { status: 500 });
  }
}

// GET: Agent status + proxy lock info + video job status
export async function GET(req: NextRequest) {
  const loop = getAgentLoop();
  const sessions = loop.getSessionManager().listSessions();
  const events = loop.getEvents().slice(-20);

  const jobId = req.nextUrl.searchParams.get("videoJobId");
  if (jobId) {
    const job = videoJobs.get(jobId);
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }
    return NextResponse.json({
      id: job.id,
      status: job.status,
      composition: job.composition,
      duration: job.duration,
      result: job.result || null,
      createdAt: job.createdAt,
      completedAt: job.completedAt || null,
      elapsedMs: Date.now() - job.createdAt,
    });
  }

  return NextResponse.json({
    activeSessions: sessions.filter((s: Session) => ["running", "planning"].includes(s.status)).length,
    queuedSessions: sessions.filter((s: Session) => s.status === "queued").length,
    completedSessions: sessions.filter((s: Session) => s.status === "completed").length,
    recentEvents: events,
    tools: loop.getToolRegistry().listTools().length,
    workers: loop.getWorkerRegistry().list().length,
    procedures: loop.getProcedureMemory().getStats(),
    proxyLock: isProxyLocked() ? getProxyLock() : null,
  });
}
