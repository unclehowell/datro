// ============================================================
// ai-video Registry Tool — SVG Scene Engine
// ============================================================
// Accepts scene-script JSON, dispatches to Remotion SVG compositions,
// trims with ffmpeg, returns output path. Cloud-API-ready interface.

import { spawn } from "child_process";
import { existsSync, mkdirSync, readdirSync, rmSync, unlinkSync } from "fs";
import { join } from "path";
import { promisify } from "util";

const execAsync = promisify(require("child_process").exec);

const REMOTION_DIR = "/home/unclehowell/agentos-gui/remotion";
const OUTPUT_DIR = "/home/unclehowell/agentos-gui/remotion/out";
const TMPDIR = process.env.TMPDIR || "/tmp";

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

// ─── Render SVG scene via Remotion + ffmpeg trim ───
export async function renderAIVideo(params: Record<string, unknown>): Promise<{ success: boolean; output?: string; error?: string; metadata?: Record<string, unknown> }> {
  const scene = String(params.scene || params.template || "dance");
  const duration = Math.max(1, Math.min(30, Number(params.duration) || 5));
  const propsStr = typeof params.props === "string" ? params.props : JSON.stringify(params.props || {});
  let props: Record<string, unknown> = {};
  try { props = JSON.parse(propsStr); } catch { props = {}; }

  // Enforce no text unless explicitly requested
  if (!props.text) props.text = "";
  if (!props.subtitle) props.subtitle = "";

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
  description: "Generate literal video content from scene scripts. Templates: dance, nature, city, space, fire, snow. Produces actual animated content — no text overlays unless explicitly requested.",
  category: "media",
  capability: "video",
  parameters: [
    { name: "scene", type: "string", description: "Scene template: dance, nature, city, space, fire, snow", required: true },
    { name: "duration", type: "number", description: "Duration in seconds (1-30)", required: false, default: 5 },
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
