import { spawn } from "child_process";
import { existsSync, mkdirSync, readdirSync, rmSync, unlinkSync } from "fs";
import { join } from "path";

// Static absolute paths (fixed deployment) — dynamic process.env lookups make
// Turbopack's NFT trace the whole project, which OOMs the build's finalize step.
const REMOTION_DIR = "/home/unclehowell/agentos-gui/remotion";
const OUTPUT_DIR = "/home/unclehowell/agentos-gui/remotion/out";

if (!existsSync(OUTPUT_DIR)) {
  mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Chromium discardable-memory files and Remotion webpack bundle dirs are left
// behind in TMPDIR after crashed renders and silently fill the tmpfs (1.7G on
// this Celeron), which then crashes every future render. Remove them before
// each render.
function cleanupShmFiles() {
  try {
    const tmp = process.env.TMPDIR || "/tmp";
    for (const f of readdirSync(tmp)) {
      if (f.startsWith(".5bf7f") && f.endsWith("-00000000.so")) {
        try { unlinkSync(join(tmp, f)); } catch {}
      }
      if (f.startsWith("remotion-webpack-bundle-") || f.startsWith("react-motion-render-")) {
        try { rmSync(join(tmp, f), { recursive: true, force: true }); } catch {}
      }
      if (f.startsWith("core.")) {
        try { rmSync(join(tmp, f), { force: true }); } catch {}
      }
    }
  } catch {}
}

const COMPOSITIONS = ["TextAnimation", "TitleCard", "GradientBg", "Shapes"];

interface RenderJob {
  jobId: string;
  status: "running" | "done" | "failed";
  outputPath: string;
  composition: string;
  duration: number;
  error?: string;
  startedAt: number;
  completedAt?: number;
}

const renderJobs = new Map<string, RenderJob>();

function generateJobId(): string {
  return "r_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export function getRenderJob(jobId: string): RenderJob | undefined {
  return renderJobs.get(jobId);
}

function inferComposition(composition: string | undefined, props: Record<string, unknown>): string {
  if (composition && COMPOSITIONS.includes(composition)) return composition;
  const title = props.title;
  const text = props.text;
  if (title && typeof title === "string" && title.trim()) return "TitleCard";
  if (text && typeof text === "string" && text.trim()) return "TextAnimation";
  if (composition && !COMPOSITIONS.includes(composition)) {
    throw new Error(`Invalid composition: ${composition}. Available: ${COMPOSITIONS.join(", ")}`);
  }
  return "TextAnimation";
}

export interface RenderVideoResult {
  success: boolean;
  output: string;
  error?: string;
  metadata?: Record<string, unknown>;
}

export async function renderVideo(params: Record<string, unknown>): Promise<RenderVideoResult> {
  let inputProps: Record<string, unknown> = {};
  if (params.props) {
    try {
      inputProps = JSON.parse(String(params.props));
    } catch {
      return {
        success: false,
        output: "",
        error: `Invalid props JSON: ${params.props}`,
      };
    }
  }

  let composition: string;
  try {
    composition = inferComposition(
      params.composition ? String(params.composition) : undefined,
      inputProps
    );
  } catch (err) {
    return {
      success: false,
      output: "",
      error: err instanceof Error ? err.message : "Invalid composition",
    };
  }

  const rawDuration = parseInt(params.duration?.toString() || "5", 10);
  const durationSec = Math.max(1, Math.min(30, Number.isFinite(rawDuration) ? rawDuration : 5));
  const outputName = params.output ? String(params.output) : `video-${Date.now()}.mp4`;
  const outputPath = join(OUTPUT_DIR, outputName);



  const fps = 24;
  const durationInFrames = Math.max(1, durationSec * fps);
  const jobId = generateJobId();

  cleanupShmFiles();

  const job: RenderJob = {
    jobId,
    status: "running",
    outputPath,
    composition,
    duration: durationSec,
    startedAt: Date.now(),
  };
  renderJobs.set(jobId, job);

  // Renderer crashes are common on this 3.4GB box (transient OOM / browser
  // crash). Retry once with a clean slate; a deterministic retry almost always
  // succeeds once memory settles.
  const spawnRender = (attempt: number) => {
    const child = spawn(
      "npx",
      [
        "remotion", "render",
        composition,
        outputPath,
        "--props", JSON.stringify(inputProps),
        "--frames", `0-${durationInFrames - 1}`,
        "--concurrency", "1",
        "--gl", "swangle",
        "--scale", "1",
        "--log", "error",
      ],
      {
        cwd: REMOTION_DIR,
        detached: true,
        stdio: "ignore",
      }
    );

    child.unref();

    child.on("error", (err) => {
      job.status = "failed";
      job.error = err.message;
      job.completedAt = Date.now();
    });

    child.on("exit", (code, signal) => {
      if (code === 0) {
        job.status = "done";
        job.completedAt = Date.now();
        return;
      }
      if (attempt === 0) {
        cleanupShmFiles();
        job.startedAt = Date.now();
        spawnRender(1);
        return;
      }
      job.status = "failed";
      job.error = signal ? `Killed: ${signal}` : `Exit code: ${code}`;
      job.completedAt = Date.now();
    });
  };

  spawnRender(0);

  return {
    success: true,
    output: `Video rendering started (jobId: ${jobId}, ${durationSec}s, ${composition})`,
    metadata: {
      jobId,
      outputPath,
      composition,
      duration: durationSec,
      fps,
      frames: durationInFrames,
    },
  };
}

export const remotionTool = {
  name: "remotion",
  description: "Generate abstract/stylized videos using Remotion. Templates: TextAnimation (animated text), TitleCard (title with gradient), GradientBg (color transitions), Shapes (moving geometric shapes). For literal scene content use ai-video tool.",
  category: "media",
  parameters: [
    {
      name: "composition",
      type: "string",
      description: `Template to use: ${COMPOSITIONS.join(", ")}. For scenes/abstract themes always use "Scene" with a subject prop.`,
      required: false,
    },
    {
      name: "duration",
      type: "number",
      description: "Duration in seconds (default: 5, max: 30)",
      required: false,
      default: 5,
    },
    {
      name: "output",
      type: "string",
      description: "Output filename (default: auto-generated timestamp)",
      required: false,
    },
    {
      name: "props",
      type: "string",
      description: `JSON string of template-specific props. Scene props: ${JSON.stringify({ subject: "beach", text: "optional title", subtitle: "optional", colors: ["#hex", "#hex"] })}`,
      required: false,
    },
  ],
  handler: async (params: Record<string, unknown>): Promise<RenderVideoResult> => renderVideo(params),
};

export default remotionTool;

