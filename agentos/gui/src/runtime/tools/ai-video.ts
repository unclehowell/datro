// ============================================================
// ai-video Registry Tool — Scene Engine Dispatcher
// ============================================================
// Accepts scene-script JSON, dispatches to the local child-proxy
// video endpoint (/v1/video) which renders with the lightweight
// Pillow+ffmpeg engine (phone_video.py, versioned in the branch).
// Falls back to the Remotion SVG composer for high-res 720p output.
// Cloud-API-ready interface.

import { spawn } from "child_process";
import { existsSync, mkdirSync, readdirSync, rmSync, unlinkSync } from "fs";
import { join } from "path";
import { promisify } from "util";
import http from "http";

const execAsync = promisify(require("child_process").exec);

const REMOTION_DIR = "/home/unclehowell/agentos-gui/remotion";
const OUTPUT_DIR = "/home/unclehowell/agentos-gui/remotion/out";
const TMPDIR = process.env.TMPDIR || "/tmp";
// Local child-proxy video endpoint (agent.py, port 6000). Overridable so the
// harness can point at any child proxy's /v1/video.
const VIDEO_API = process.env.VIDEO_API_URL || "http://127.0.0.1:6000/v1/video";
// When true, always use the PIL engine endpoint; when false, fall back to
// Remotion if the endpoint is unreachable.
const PREFER_LOCAL_ENGINE = (process.env.VIDEO_USE_PIL_ENGINE || "1") === "1";

if (!existsSync(OUTPUT_DIR)) {
  mkdirSync(OUTPUT_DIR, { recursive: true });
}

interface AIJob {
  id: string;
  status: "pending" | "rendering" | "done" | "failed";
  composition: string;
  duration: number;
  props: Record<string, unknown>;
  error?: string;
  createdAt: number;
  completedAt?: number;
  result?: { success: boolean; output?: string; error?: string };
}

const aiJobs = new Map<string, AIJob>();

function generateJobId(): string {
  return "av_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export function getAIVideoJob(jobId: string): AIJob | undefined {
  return aiJobs.get(jobId);
}

// ─── Cleanup stale temp files before each render ───
function cleanupShmFiles() {
  try {
    for (const f of readdirSync(TMPDIR)) {
      if (f.startsWith(".5bf7f") && f.endsWith("-00000000.so")) {
        try { unlinkSync(join(TMPDIR, f)); } catch {}
      }
      if (f.startsWith("remotion-webpack-bundle-") || f.startsWith("react-motion-render-")) {
        try { rmSync(join(TMPDIR, f), { recursive: true, force: true }); } catch {}
      }
      if (f.startsWith("core.")) {
        try { rmSync(join(TMPDIR, f), { force: true }); } catch {}
      }
    }
  } catch {}
}

// ─── Render via local child-proxy /v1/video (PIL engine) ───
// Uses Node's http module (not global fetch) because undici's fetch fails
// against the aiohttp child-proxy server on port 6000 ("bad port").
function httpJson(host: string, port: number, path: string, method: "GET" | "POST", bodyObj?: Record<string, unknown>, timeoutMs = 30000): Promise<{ status: number; data: any; buf?: Buffer }> {
  return new Promise((resolve, reject) => {
    const body = bodyObj ? JSON.stringify(bodyObj) : undefined;
    const req = http.request(
      { host, port, path, method, headers: { ...(body ? { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) } : {}) } },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (c) => chunks.push(c as Buffer));
        res.on("end", () => {
          const buf = Buffer.concat(chunks);
          let data: any = buf.toString("utf8");
          try { data = JSON.parse(data); } catch {}
          resolve({ status: res.statusCode || 0, data, buf });
        });
      }
    );
    req.on("error", reject);
    req.setTimeout(timeoutMs, () => req.destroy(new Error(`timeout after ${timeoutMs}ms`)));
    if (body) req.write(body);
    req.end();
  });
}

function parseVideoApi(url: string): { host: string; port: number; base: string } {
  try {
    const u = new URL(url);
    return { host: u.hostname, port: Number(u.port || 80), base: u.pathname.replace(/\/$/, "") };
  } catch {
    const m = url.match(/^https?:\/\/([^:/]+):?(\d*)(.*)$/);
    return { host: m?.[1] || "127.0.0.1", port: m?.[2] ? Number(m[2]) : 6000, base: (m?.[3] || "").replace(/\/$/, "") };
  }
}

async function renderViaChildProxy(params: Record<string, unknown>): Promise<{ success: boolean; output?: string; error?: string; metadata?: Record<string, unknown> }> {
  const scene = String(params.scene || params.template || "dance");
  const prompt = String(params.prompt || params.message || "").trim();
  const duration = Math.max(1, Math.min(30, Number(params.duration) || 5));
  const { host, port, base } = parseVideoApi(VIDEO_API);

  // Build an English prompt for the classifier from structured props if none given
  let text = prompt;
  if (!text) {
    const subject = params.subject || params.character || "a character";
    const action = params.action || "";
    const bg = params.background || params.env || "";
    text = `a ${subject}${action ? " " + action : ""}${bg ? " in " + bg : ""}`.trim();
  }

  try {
    const created = await httpJson(host, port, `${base}`, "POST", { prompt: text }, 10000);
    if (created.status < 200 || created.status >= 300 || !created.data?.videoJobId) {
      return { success: false, error: `child-proxy video endpoint returned ${created.status}: ${JSON.stringify(created.data).slice(0, 200)}` };
    }
    const jobId = created.data.videoJobId;

    // Poll until done
    const started = Date.now();
    let lastError = "";
    while (Date.now() - started < 600000) {
      await new Promise((r) => setTimeout(r, 3000));
      let sr;
      try {
        sr = await httpJson(host, port, `${base}/${jobId}`, "GET", undefined, 10000);
      } catch (e: any) {
        lastError = e.message;
        continue;
      }
      if (sr.status < 200 || sr.status >= 300) { lastError = `status ${sr.status}`; continue; }
      const st = sr.data;
      if (st.status === "done" && st.filename) {
        const fileResp = await httpJson(host, port, `${base}/file/${encodeURIComponent(st.filename)}`, "GET", undefined, 30000);
        if (fileResp.status === 200 && fileResp.buf) {
          const outputName = `ai-video-${Date.now()}-${st.scene || scene}.mp4`;
          const outputPath = join(OUTPUT_DIR, outputName);
          mkdirSync(OUTPUT_DIR, { recursive: true });
          const { writeFileSync } = await import("fs");
          writeFileSync(outputPath, fileResp.buf);
          aiJobs.set(jobId, { id: jobId, status: "done", composition: st.scene || scene, duration: st.duration || duration, props: params, createdAt: started, result: { success: true, output: outputPath } });
          return { success: true, output: outputPath, metadata: { jobId, scene: st.scene, duration: st.duration, engine: "child-proxy(PIL)", width: 480, height: 270 } };
        }
        lastError = `file fetch failed (${fileResp.status})`;
        continue;
      }
      if (st.status === "failed") {
        return { success: false, error: st.error || "render failed" };
      }
    }
    return { success: false, error: `render timed out: ${lastError}` };
  } catch (e: any) {
    return { success: false, error: `child-proxy video error: ${e.message}` };
  }
}

// ─── Render SVG scene via Remotion + ffmpeg trim (high-res fallback) ───
export async function renderAIVideo(params: Record<string, unknown>): Promise<{ success: boolean; output?: string; error?: string; metadata?: Record<string, unknown> }> {
  const scene = String(params.scene || params.template || "dance");
  const duration = Math.max(1, Math.min(30, Number(params.duration) || 5));
  const propsStr = typeof params.props === "string" ? params.props : JSON.stringify(params.props || {});
  let props: Record<string, unknown> = {};
  try { props = JSON.parse(propsStr); } catch { props = {}; }

  // Enforce no text unless explicitly requested
  if (!props.text) props.text = "";
  if (!props.subtitle) props.subtitle = "";

  // Try the lightweight child-proxy engine first (minimal compute, no Remotion)
  if (PREFER_LOCAL_ENGINE) {
    const childResult = await renderViaChildProxy({ scene, duration, ...props, props: props });
    if (childResult.success) return childResult;
    const fallback = process.env.VIDEO_USE_PIL_ENGINE === "1" && !process.env.VIDEO_ALLOW_REMOTION;
    if (fallback) {
      return { success: false, error: `child-proxy engine failed (${childResult.error}); set VIDEO_ALLOW_REMOTION=1 to use Remotion fallback` };
    }
    // else fall through to Remotion
  }

  // Map scene names to Remotion composition IDs
  const sceneToComposition: Record<string, string> = {
    dance: "DanceScene",
    nature: "NatureScene",
    city: "CityScene",
    space: "SpaceScene",
    fire: "FireScene",
    snow: "SnowScene",
  };

  const composition = sceneToComposition[scene] || "DanceScene";
  const outputName = `ai-video-${Date.now()}-${scene}.mp4`;
  const outputPath = join(OUTPUT_DIR, outputName);
  const tempPath = join(OUTPUT_DIR, `temp-${Date.now()}-${scene}.mp4`);

  cleanupShmFiles();

  const jobId = generateJobId();
  aiJobs.set(jobId, {
    id: jobId,
    status: "rendering",
    composition: scene,
    duration,
    props,
    createdAt: Date.now(),
  });

  // Render via Remotion CLI (detached process)
  const frames = Math.max(1, Math.round(duration * 24)); // 24fps for SVG

  const child = spawn(
    "npx",
    [
      "remotion", "render",
      composition,
      tempPath,
      "--props", propsStr,
      "--frames", `0-${frames - 1}`,
      "--concurrency", "1",
      "--gl", "swangle",
      "--scale", "1",
      "--log", "error",
      "--codec", "h264",
      "--crf", "18",
      "--jpeg-quality", "100",
      "--color-space", "bt709",
    ],
    { cwd: REMOTION_DIR, detached: true, stdio: "ignore" }
  );

  child.unref();

  return new Promise((resolve) => {
    child.on("error", (err) => {
      aiJobs.set(jobId, { id: jobId, status: "failed", composition: scene, duration, props, error: err.message, createdAt: Date.now() });
      resolve({ success: false, error: err.message });
    });

    child.on("exit", async (code) => {
      if (code !== 0) {
        aiJobs.set(jobId, { id: jobId, status: "failed", composition: scene, duration, props, error: `Remotion exited with code ${code}`, createdAt: Date.now() });
        resolve({ success: false, error: `Remotion render failed (exit code ${code})` });
        return;
      }

      // ffmpeg trim to exact duration
      try {
        await execAsync(
          `ffmpeg -y -i "${tempPath}" -t ${duration} -c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p "${outputPath}" 2>/dev/null`,
          { timeout: 30000 }
        );

        // Clean up temp file
        try { unlinkSync(tempPath); } catch {}

        aiJobs.set(jobId, { id: jobId, status: "done", composition: scene, duration, props, createdAt: Date.now(), result: { success: true, output: outputPath } });
        resolve({ success: true, output: outputPath, metadata: { jobId, composition, duration, frames } });
      } catch (ffErr: any) {
        aiJobs.set(jobId, { id: jobId, status: "failed", composition: scene, duration, props, error: ffErr.message, createdAt: Date.now() });
        resolve({ success: false, error: `ffmpeg trim failed: ${ffErr.message}` });
      }
    });
  });
}

// ─── Tool definition ───
export const aiVideoTool = {
  name: "ai-video",
  description: "Generate literal video content from scene scripts. Templates: dance, nature, city, space, fire, snow, cat, fox, dog, bird, robot. Produces actual animated content — no text overlays unless explicitly requested.",
  category: "media",
  capability: "video",
  parameters: [
    { name: "scene", type: "string", description: "Scene template: dance, nature, city, space, fire, snow, cat, fox, dog, bird, robot", required: true },
    { name: "duration", type: "number", description: "Duration in seconds (1-30)", required: false, default: 5 },
    { name: "prompt", type: "string", description: "Free-form prompt (e.g. 'a red fox in a forest') — preferred over structured props", required: false },
    { name: "props", type: "object", description: "Scene-specific properties (character, action, background, palette, motion)" },
  ],
  timeout: 600000,
  permissions: ["execute", "write"],
  retryPolicy: { maxRetries: 1, backoffMs: 5000 },
  tags: ["video", "svg", "ai-video"],
  handler: async (params: Record<string, unknown>) => {
    try {
      const result = await renderAIVideo(params);
      return {
        success: result.success,
        output: result.output,
        error: result.error,
        ...(result.metadata ? { metadata: result.metadata } : {}),
      };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },
};
