// ============================================================
// TaskManager — persistent, idle-aware background task engine
// ============================================================
// Long-horizon tasks (video renders, delegates) run as detached
// OS processes so they can be paused/resumed with SIGSTOP/SIGCONT.
// The scheduler only RUNS work while the machine has spare compute:
// it samples loadavg + CPU utilisation (via /proc/stat deltas) with
// hysteresis, so background work yields to interactive use instead of
// hogging this low-RAM Celeron. Jobs persist to disk and survive
// restarts. At most ONE task runs at a time; the rest stay queued.

import { spawn, ChildProcess } from "child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { homedir, loadavg, cpus } from "os";

export type TaskStatus = "queued" | "running" | "paused" | "done" | "failed" | "cancelled";
export type TaskKind = "video" | "delegate" | "cmd";

export interface Task {
  id: string;
  kind: TaskKind;
  title: string;
  command: string;
  args: string[];
  cwd: string;
  status: TaskStatus;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  exitCode?: number;
  error?: string;
  outputPath?: string;
  percent?: number;
  log: string;
  meta?: Record<string, unknown>;
}

const DATA_DIR = process.env.AGENTOS_GUI_DIR || join(homedir(), ".fcukproxy", "agentos-gui");
const STORE_PATH = join(DATA_DIR, "tasks.json");
const LOG_CAP = 200 * 1024;

const NCPUS = Math.max(1, cpus().length);

// Tunables — conservative defaults for a 2-core Celeron.
const LOAD_RUN_MAX = parseFloat(process.env.TASK_LOAD_RUN_MAX || String(NCPUS * 0.75));
const LOAD_PAUSE_MIN = parseFloat(process.env.TASK_LOAD_PAUSE_MIN || String(NCPUS * 0.95));
const UTIL_RUN_MAX = parseFloat(process.env.TASK_UTIL_RUN_MAX || "60");
const UTIL_PAUSE_MIN = parseFloat(process.env.TASK_UTIL_PAUSE_MIN || "75");
const UTIL_RESUME_MAX = parseFloat(process.env.TASK_UTIL_RESUME_MAX || "55");
const IDLE_SAMPLES = Math.max(1, parseInt(process.env.TASK_IDLE_SAMPLES || "2", 10));
const POLL_MS = Math.max(1000, parseInt(process.env.TASK_POLL_MS || "3000", 10));
// Percentage-complete recompute cadence for long-running tasks.
const PROGRESS_MS = Math.max(5000, parseInt(process.env.TASK_PROGRESS_MS || String(5 * 60 * 1000), 10));

interface IdleSample {
  load: number;
  util: number; // % busy over the last window
}

function readProcStatCpu(): { total: number; idle: number } {
  try {
    const lines = readFileSync("/proc/stat", "utf8").split("\n");
    const line = lines.find((l) => l.startsWith("cpu "));
    if (!line) return { total: 0, idle: 0 };
    const parts = line.split(/\s+/).slice(1).map(Number);
    const idle = parts[3] || 0;
    const total = parts.reduce((a, b) => a + (b || 0), 0);
    return { total, idle };
  } catch {
    return { total: 0, idle: 0 };
  }
}

export class TaskManager {
  private tasks: Task[] = [];
  private active: { task: Task; child: ChildProcess } | null = null;
  private timer: NodeJS.Timeout | null = null;
  private lastStat: { total: number; idle: number } | null = null;
  private recentIdle: IdleSample[] = [];
  private lastProgress = new Map<string, number>();
  private activeMs = new Map<string, number>();
  private resumeSince = new Map<string, number>();
  private listeners = new Set<(task: Task) => void>();

  constructor() {
    this.load();
    this.timer = setInterval(() => this.tick(), POLL_MS);
    this.timer.unref?.();
  }

  // ─── Public API ────────────────────────────────────────────

  enqueue(input: Omit<Task, "id" | "status" | "createdAt" | "log">): Task {
    const task: Task = {
      ...input,
      id: "task_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      status: "queued",
      createdAt: Date.now(),
      log: "",
    };
    this.tasks.push(task);
    this.persist();
    this.emit(task);
    this.tick(); // try to start immediately
    return task;
  }

  get(id: string): Task | undefined {
    return this.tasks.find((t) => t.id === id);
  }

  list(): Task[] {
    return [...this.tasks].reverse();
  }

  activeId(): string | null {
    return this.active ? this.active.task.id : null;
  }

  cancel(id: string): boolean {
    const task = this.tasks.find((t) => t.id === id);
    if (!task) return false;
    if (task.status === "queued") {
      task.status = "cancelled";
      task.completedAt = Date.now();
      this.persist();
      this.emit(task);
      return true;
    }
    if (this.active && this.active.task.id === id) {
      try { process.kill(-this.active.child.pid, "SIGKILL"); } catch {}
      try { this.active.child.kill("SIGKILL"); } catch {}
      task.status = "cancelled";
      task.completedAt = Date.now();
      task.error = "cancelled";
      this.persist();
      this.emit(task);
      this.active = null;
      return true;
    }
    return false;
  }

  onChange(fn: (task: Task) => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  // ─── Scheduler ─────────────────────────────────────────────

  private tick(): void {
    if (this.active) {
      const { task, child } = this.active;
      if (["running", "paused"].includes(task.status)) {
        this.updateProgress(task);
        if (task.status === "running" && !this.isIdle(true)) {
          this.pause(task, child);
        } else if (task.status === "paused" && this.isIdle(false)) {
          this.resume(task, child);
        }
      }
      return;
    }

    const queued = this.tasks.find((t) => t.status === "queued");
    if (queued && this.isIdle(false)) {
      this.start(queued);
    }
  }

  // ─── Progress estimation ─────────────────────────────────────
  // Percent-complete is recomputed at most once per PROGRESS_MS (default 5 min).
  // The estimate for a video render comes from the ACTUAL runtimes of earlier
  // completed video tasks (data-driven, so it self-corrects over time).
  private updateProgress(task: Task): void {
    if (task.status === "done") {
      task.percent = 100;
      return;
    }
    const now = Date.now();
    const last = this.lastProgress.get(task.id) || 0;
    if (now - last < PROGRESS_MS) return;
    const est = this.estimateMsFor(task);
    if (!est) return;
    const activeNow = (this.activeMs.get(task.id) || 0) + (this.resumeSince.has(task.id) ? Date.now() - (this.resumeSince.get(task.id) || Date.now()) : 0);
    task.percent = Math.min(99, Math.max(0, Math.round((activeNow / est) * 100)));
    this.lastProgress.set(task.id, now);
    this.persist();
    this.emit(task);
  }

  private estimateMsFor(task: Task): number | null {
    if (task.kind !== "video") return null;
    const finished = this.tasks.filter((t) => t.kind === "video" && t.status === "done" && t.completedAt && t.createdAt);
    if (finished.length === 0) return null;
    const avg = finished.reduce((s, t) => s + ((t.completedAt || 0) - t.createdAt), 0) / finished.length;
    return Math.max(1000, Math.round(avg));
  }

  private isIdle(requireStartHeadroom: boolean): boolean {
    const sample = this.sample();
    if (!sample) return false;
    this.recentIdle.push(sample);
    if (this.recentIdle.length > IDLE_SAMPLES) this.recentIdle.shift();
    if (this.recentIdle.length < IDLE_SAMPLES) return false;

    const avgLoad = this.recentIdle.reduce((s, x) => s + x.load, 0) / this.recentIdle.length;
    const avgUtil = this.recentIdle.reduce((s, x) => s + x.util, 0) / this.recentIdle.length;

    if (requireStartHeadroom) {
      // Running job must yield EARLY when the machine gets busy.
      return avgLoad < LOAD_PAUSE_MIN && avgUtil < UTIL_PAUSE_MIN;
    }
    // Starting (or resuming) requires MORE headroom (hysteresis).
    return avgLoad < LOAD_RUN_MAX && avgUtil < UTIL_RUN_MAX;
  }

  private sample(): IdleSample | null {
    const now = readProcStatCpu();
    if (this.lastStat && now.total > this.lastStat.total) {
      const dTotal = now.total - this.lastStat.total;
      const dIdle = now.idle - this.lastStat.idle;
      const util = dTotal > 0 ? Math.min(100, ((dTotal - dIdle) / dTotal) * 100) : 0;
      this.lastStat = now;
      return { load: loadavg()[0], util };
    }
    this.lastStat = now;
    return null;
  }

  // ─── Worker lifecycle ──────────────────────────────────────

  private start(task: Task): void {
    task.status = "running";
    task.startedAt = Date.now();
    task.log = "";
    task.percent = 0;
    this.activeMs.set(task.id, 0);
    this.resumeSince.set(task.id, Date.now());

    const child = spawn(task.command, task.args, {
      cwd: task.cwd,
      env: process.env,
      detached: true,
      stdio: ["ignore", "pipe", "pipe"],
    });

    const append = (chunk: string) => {
      task.log = (task.log + chunk).slice(-LOG_CAP);
    };
    child.stdout?.on("data", (d) => append(d.toString()));
    child.stderr?.on("data", (d) => append(d.toString()));

    child.on("error", (err) => {
      task.status = "failed";
      task.error = err.message;
      task.completedAt = Date.now();
      this.active = null;
      this.persist();
      this.emit(task);
    });

    child.on("exit", (code, signal) => {
      task.exitCode = code ?? undefined;
      task.completedAt = Date.now();
      if (code === 0) {
        task.status = "done";
        task.percent = 100;
      } else if (task.status !== "cancelled") {
        task.status = "failed";
        task.error = signal ? `killed by ${signal}` : `exit code ${code}`;
      }
      this.active = null;
      this.persist();
      this.emit(task);
      this.tick(); // pick up the next queued task
    });

    this.active = { task, child };
    this.persist();
    this.emit(task);
  }

  private pause(task: Task, child: ChildProcess): void {
    try { process.kill(-child.pid, "SIGSTOP"); } catch {}
    try { child.kill("SIGSTOP"); } catch {}
    if (this.resumeSince.has(task.id)) {
      this.activeMs.set(task.id, (this.activeMs.get(task.id) || 0) + (Date.now() - (this.resumeSince.get(task.id) || Date.now())));
      this.resumeSince.delete(task.id);
    }
    task.status = "paused";
    this.persist();
    this.emit(task);
  }

  private resume(task: Task, child: ChildProcess): void {
    try { process.kill(-child.pid, "SIGCONT"); } catch {}
    try { child.kill("SIGCONT"); } catch {}
    this.resumeSince.set(task.id, Date.now());
    task.status = "running";
    this.persist();
    this.emit(task);
  }

  // ─── Persistence ───────────────────────────────────────────

  private load(): void {
    try {
      if (existsSync(STORE_PATH)) {
        const raw = JSON.parse(readFileSync(STORE_PATH, "utf8"));
        if (Array.isArray(raw)) {
          this.tasks = raw.filter((t: Task) => t && typeof t.id === "string").map((t: Task) => ({
            ...t,
            // Anything left running/paused when the server went down re-queues on boot.
            status: ["running", "paused"].includes(t.status) ? "queued" : t.status,
            log: t.log || "",
          }));
        }
      }
    } catch {}
  }

  private persist(): void {
    try {
      mkdirSync(DATA_DIR, { recursive: true });
      const recent = this.tasks.slice(-50);
      writeFileSync(STORE_PATH, JSON.stringify(recent, null, 2));
    } catch {}
  }

  private emit(task: Task): void {
    for (const fn of this.listeners) {
      try { fn(task); } catch {}
    }
  }
}

const GLOBAL_KEY = "__agentosTaskManager";

function getGlobal(): { [key: string]: TaskManager } {
  return globalThis as { [key: string]: TaskManager };
}

export function getTaskManager(): TaskManager {
  if (!getGlobal()[GLOBAL_KEY]) {
    getGlobal()[GLOBAL_KEY] = new TaskManager();
  }
  return getGlobal()[GLOBAL_KEY];
}
