// ============================================================
// Scheduler v2 — Queue, priorities, retries, concurrency
// ============================================================

import { v4 as uuid } from "uuid";
import { readFile, writeFile, mkdir } from "fs/promises";
import { join } from "path";
import {
  SchedulerState, ScheduledJob, SchedulerConfig, Session,
} from "./types";

const SCHEDULER_PATH = join(
  process.env.HOME || "/home/unclehowell",
  ".agentos",
  "scheduler.json"
);

const DEFAULT_CONFIG: SchedulerConfig = {
  maxConcurrent: 4,
  maxConcurrentPerGroup: 2,
  defaultTimeout: 3600000,       // 1 hour (was 5 min)
  defaultMaxRetries: 5,          // was 3
  retryBackoffMs: 10000,         // was 5000
  priorityWeights: {
    urgent: 10,
    high: 7,
    normal: 5,
    low: 2,
  },
  // Long-running task support
  maxTaskDuration: 86400000,     // 24 hours max per task
  checkpointInterval: 300,       // checkpoint every 5 min
  enableBackgroundExecution: true,
  maxBackgroundJobs: 10,
};

export class Scheduler {
  private state: SchedulerState;
  private executionCallbacks: Map<string, (job: ScheduledJob) => Promise<void>> = new Map();
  private listeners: Array<(event: string, job: ScheduledJob) => void> = [];

  constructor(config?: Partial<SchedulerConfig>) {
    this.state = {
      queue: [],
      running: [],
      completed: [],
      failed: [],
      config: { ...DEFAULT_CONFIG, ...config },
    };
  }

  // ─── Queue Management ──────────────────────────────────

  async enqueue(session: Session, options?: {
    priority?: ScheduledJob["priority"];
    concurrencyGroup?: string;
    timeout?: number;
    maxRetries?: number;
  }): Promise<ScheduledJob> {
    const job: ScheduledJob = {
      id: uuid(),
      sessionId: session.id,
      priority: options?.priority || session.priority || "normal",
      status: "queued",
      concurrencyGroup: options?.concurrencyGroup,
      createdAt: Date.now(),
      retryCount: 0,
      maxRetries: options?.maxRetries ?? this.state.config.defaultMaxRetries,
      timeout: options?.timeout ?? this.state.config.defaultTimeout,
      cancelRequested: false,
    };

    this.state.queue.push(job);
    this.sortQueue();
    await this.persist();
    this.emit("job_queued", job);

    // Try to start immediately
    this.tryStartNext();

    return job;
  }

  async cancel(jobId: string): Promise<boolean> {
    // Check running
    const running = this.state.running.find((j) => j.id === jobId);
    if (running) {
      running.cancelRequested = true;
      this.emit("job_cancel_requested", running);
      await this.persist();
      return true;
    }

    // Check queued
    const idx = this.state.queue.findIndex((j) => j.id === jobId);
    if (idx !== -1) {
      const job = this.state.queue.splice(idx, 1)[0];
      job.status = "cancelled";
      this.state.completed.push(job);
      this.emit("job_cancelled", job);
      await this.persist();
      return true;
    }

    return false;
  }

  async pause(jobId: string): Promise<boolean> {
    const running = this.state.running.find((j) => j.id === jobId);
    if (running) {
      running.status = "paused";
      this.emit("job_paused", running);
      await this.persist();
      return true;
    }
    return false;
  }

  async resume(jobId: string): Promise<boolean> {
    const paused = this.state.running.find((j) => j.id === jobId && j.status === "paused");
    if (paused) {
      paused.status = "running";
      this.emit("job_resumed", paused);
      await this.persist();
      return true;
    }
    return false;
  }

  // ─── Execution ─────────────────────────────────────────

  registerExecutor(name: string, callback: (job: ScheduledJob) => Promise<void>): void {
    this.executionCallbacks.set(name, callback);
  }

  async tryStartNext(): Promise<void> {
    const { maxConcurrent, maxConcurrentPerGroup, maxBackgroundJobs } = this.state.config;
    const activeCount = this.state.running.filter((j) => j.status === "running").length;
    const bgCount = this.state.backgroundJobs.filter((j) => j.status === "running").length;

    // Allow background jobs to run alongside regular jobs
    if (activeCount >= maxConcurrent && bgCount >= maxBackgroundJobs) return;

    for (const job of this.state.queue) {
      if (job.cancelRequested) continue;

      // Check concurrency group limit
      if (job.concurrencyGroup) {
        const groupCount = this.state.running.filter(
          (j) => j.status === "running" && j.concurrencyGroup === job.concurrencyGroup
        ).length;
        if (groupCount >= maxConcurrentPerGroup) continue;
      }

      // Start this job
      this.startJob(job);
      break;
    }
  }

  private async startJob(job: ScheduledJob): Promise<void> {
    // Remove from queue
    const idx = this.state.queue.indexOf(job);
    if (idx !== -1) this.state.queue.splice(idx, 1);

    // Move to running
    job.status = "running";
    job.startedAt = Date.now();
    this.state.running.push(job);
    this.sortQueue();
    await this.persist();
    this.emit("job_started", job);

    // Execute (non-blocking)
    this.executeJob(job).catch((err) => {
      console.error(`Job ${job.id} failed:`, err);
    });
  }

  private async executeJob(job: ScheduledJob): Promise<void> {
    const startTime = Date.now();

    try {
      // Set up timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`Job timed out after ${job.timeout}ms`)), job.timeout);
      });

      // Set up cancellation check
      const cancellationCheck = async (): Promise<void> => {
        while (!job.cancelRequested) {
          await new Promise((r) => setTimeout(r, 1000));
        }
        throw new Error("Job cancelled");
      };

      // Find executor
      const callback = this.executionCallbacks.get("default");
      if (!callback) throw new Error("No default executor registered");

      // Run with timeout and cancellation
      await Promise.race([
        callback(job),
        timeoutPromise,
        cancellationCheck(),
      ]);

      // Success
      this.completeJob(job);
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);

      if (job.cancelRequested) {
        this.cancelJob(job);
      } else if (job.retryCount < job.maxRetries) {
        // Retry with backoff
        job.retryCount++;
        const backoff = this.state.config.retryBackoffMs * Math.pow(2, job.retryCount - 1);
        this.emit("job_retrying", job);

        setTimeout(() => {
          job.status = "queued";
          this.state.queue.push(job);
          this.sortQueue();
          this.tryStartNext();
        }, backoff);
      } else {
        this.failJob(job, error);
      }
    }
  }

  private completeJob(job: ScheduledJob): void {
    const idx = this.state.running.indexOf(job);
    if (idx !== -1) this.state.running.splice(idx, 1);

    job.status = "completed";
    job.completedAt = Date.now();
    this.state.completed.push(job);
    this.emit("job_completed", job);

    this.persist();
    this.tryStartNext();
  }

  private failJob(job: ScheduledJob, error: string): void {
    const idx = this.state.running.indexOf(job);
    if (idx !== -1) this.state.running.splice(idx, 1);

    job.status = "failed";
    job.completedAt = Date.now();
    this.state.failed.push(job);
    this.emit("job_failed", job);

    this.persist();
    this.tryStartNext();
  }

  private cancelJob(job: ScheduledJob): void {
    const idx = this.state.running.indexOf(job);
    if (idx !== -1) this.state.running.splice(idx, 1);

    job.status = "cancelled";
    job.completedAt = Date.now();
    this.state.completed.push(job);
    this.emit("job_cancelled", job);

    this.persist();
    this.tryStartNext();
  }

  // ─── Query ─────────────────────────────────────────────

  getState(): SchedulerState {
    return { ...this.state };
  }

  getJob(jobId: string): ScheduledJob | undefined {
    return [...this.state.queue, ...this.state.running, ...this.state.completed, ...this.state.failed]
      .find((j) => j.id === jobId);
  }

  getQueueLength(): number {
    return this.state.queue.length;
  }

  getRunningCount(): number {
    return this.state.running.filter((j) => j.status === "running").length;
  }

  // ─── Events ────────────────────────────────────────────

  onEvent(listener: (event: string, job: ScheduledJob) => void): void {
    this.listeners.push(listener);
  }

  private emit(event: string, job: ScheduledJob): void {
    for (const listener of this.listeners) {
      try { listener(event, job); } catch { /* ignore */ }
    }
  }

  // ─── Persistence ───────────────────────────────────────

  async persist(): Promise<void> {
    try {
      await mkdir(join(process.env.HOME || "/home/unclehowell", ".agentos"), { recursive: true });
      await writeFile(SCHEDULER_PATH, JSON.stringify(this.state, null, 2), "utf-8");
    } catch (err) {
      console.error("Failed to persist scheduler:", err);
    }
  }

  async load(): Promise<void> {
    try {
      const content = await readFile(SCHEDULER_PATH, "utf-8");
      this.state = JSON.parse(content);
    } catch { /* no saved state */ }
  }

  // ─── Helpers ───────────────────────────────────────────


  // ─── Background Jobs ──────────────────────────────

  async startBackgroundJob(sessionId: string, command: string, cwd: string, pid: number, logFile: string): Promise<BackgroundJob> {
    const job: BackgroundJob = {
      id: uuid(),
      sessionId,
      command,
      cwd,
      pid,
      status: "running",
      output: "",
      startedAt: Date.now(),
      logFile,
    };
    this.state.backgroundJobs.push(job);
    this.emit("background_job_started", job);
    await this.persist();
    return job;
  }

  async updateBackgroundJob(jobId: string, updates: Partial<BackgroundJob>): Promise<void> {
    const job = this.state.backgroundJobs.find((j) => j.id === jobId);
    if (!job) return;
    Object.assign(job, updates);
    if (updates.status && updates.status !== "running") {
      job.completedAt = Date.now();
    }
    await this.persist();
  }

  getBackgroundJob(jobId: string): BackgroundJob | undefined {
    return this.state.backgroundJobs.find((j) => j.id === jobId);
  }

  listBackgroundJobs(sessionId?: string): BackgroundJob[] {
    if (sessionId) {
      return this.state.backgroundJobs.filter((j) => j.sessionId === sessionId);
    }
    return [...this.state.backgroundJobs];
  }

  // ─── Checkpoints ──────────────────────────────────

  async saveCheckpoint(sessionId: string, step: number, state: Record<string, unknown>, artifacts: string[], observations: string[]): Promise<Checkpoint> {
    const checkpoint: Checkpoint = {
      id: uuid(),
      sessionId,
      step,
      state,
      artifacts,
      observations,
      timestamp: Date.now(),
      duration: 0,
    };
    this.state.checkpoints.push(checkpoint);
    // Keep last 100 checkpoints per session
    const sessionCheckpoints = this.state.checkpoints.filter((c) => c.sessionId === sessionId);
    if (sessionCheckpoints.length > 100) {
      this.state.checkpoints = this.state.checkpoints.filter(
        (c) => c.sessionId !== sessionId || sessionCheckpoints.length - 100 <= this.state.checkpoints.indexOf(c)
      );
    }
    await this.persist();
    return checkpoint;
  }

  getCheckpoints(sessionId: string): Checkpoint[] {
    return this.state.checkpoints
      .filter((c) => c.sessionId === sessionId)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  getLastCheckpoint(sessionId: string): Checkpoint | undefined {
    return this.getCheckpoints(sessionId)[0];
  }

  private sortQueue(): void {
    const weights = this.state.config.priorityWeights;
    this.state.queue.sort((a, b) => {
      const wa = weights[a.priority] || 5;
      const wb = weights[b.priority] || 5;
      if (wb !== wa) return wb - wa;
      return a.createdAt - b.createdAt; // FIFO within same priority
    });
  }
}
