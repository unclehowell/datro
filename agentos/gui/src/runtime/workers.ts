// ============================================================
// Worker Sessions v3 — Real subprocess management
// ============================================================
// OpenCode: spawn process, stream stdout, detect completion
// Kilo: persistent sessions, repo indexing, streaming
// ============================================================

import { spawn, ChildProcess } from "child_process";
import { v4 as uuid } from "uuid";
import { homedir } from "os";
import { WorkerSession, WorkerName, Artifact, RuntimeEvent } from "./types";

const DEFAULT_HOME = homedir();

// ─── Base Worker Session ───────────────────────────────────

export abstract class BaseWorkerSession {
  protected session: WorkerSession;
  protected process: ChildProcess | null = null;
  protected eventCallbacks: Array<(event: RuntimeEvent) => void> = [];

  constructor(worker: WorkerName, parentSessionId: string, task: string, cwd: string) {
    this.session = {
      id: uuid(),
      worker,
      sessionId: parentSessionId,
      status: "idle",
      task,
      cwd,
      stdout: [],
      stderr: [],
      lastOutput: Date.now(),
      artifacts: [],
      startedAt: Date.now(),
      tokensUsed: 0,
    };
  }

  getSession(): WorkerSession {
    return { ...this.session };
  }

  onEvent(callback: (event: RuntimeEvent) => void): void {
    this.eventCallbacks.push(callback);
  }

  protected emit(event: RuntimeEvent): void {
    for (const cb of this.eventCallbacks) {
      try { cb(event); } catch { /* ignore */ }
    }
  }

  async start(): Promise<void> {
    this.session.status = "starting";
    this.session.startedAt = Date.now();
    this.emit({
      type: "worker_started",
      sessionId: this.session.sessionId,
      worker: this.session.worker,
      task: this.session.task,
    });

    try {
      this.process = await this.spawnProcess();
      this.session.pid = this.process.pid;
      this.session.status = "running";

      this.process.stdout?.on("data", (data: Buffer) => {
        const lines = data.toString().split("\n").filter(Boolean);
        for (const line of lines) {
          this.session.stdout.push(line);
          this.session.lastOutput = Date.now();
          this.emit({
            type: "worker_output",
            sessionId: this.session.sessionId,
            worker: this.session.worker,
            line,
          });
        }
      });

      this.process.stderr?.on("data", (data: Buffer) => {
        const lines = data.toString().split("\n").filter(Boolean);
        for (const line of lines) {
          this.session.stderr.push(line);
        }
      });

      this.process.on("close", (code) => {
        this.session.status = code === 0 ? "completed" : "failed";
        this.session.completedAt = Date.now();
        this.session.duration = Date.now() - this.session.startedAt;
        this.emit({
          type: "worker_completed",
          sessionId: this.session.sessionId,
          worker: this.session.worker,
          duration: this.session.duration,
        });
      });

      this.process.on("error", (err) => {
        this.session.status = "failed";
        this.session.completedAt = Date.now();
        this.session.stderr.push(err.message);
      });

    } catch (err) {
      this.session.status = "failed";
      this.session.completedAt = Date.now();
      this.session.stderr.push(err instanceof Error ? err.message : String(err));
    }
  }

  async interrupt(): Promise<void> {
    if (this.process && this.process.pid) {
      this.session.status = "interrupted";
      this.process.kill("SIGTERM");
      // Give it 5 seconds to clean up
      setTimeout(() => {
        if (this.process && !this.process.killed) {
          this.process.kill("SIGKILL");
        }
      }, 5000);
    }
  }

  async waitForCompletion(timeout: number): Promise<WorkerSession> {
    return new Promise((resolve) => {
      const start = Date.now();
      const check = () => {
        if (this.session.status === "completed" || this.session.status === "failed" || this.session.status === "interrupted") {
          resolve(this.session);
        } else if (Date.now() - start > timeout) {
          this.interrupt().then(() => resolve(this.session));
        } else {
          setTimeout(check, 500);
        }
      };
      check();
    });
  }

  getArtifacts(): Artifact[] {
    return this.session.artifacts;
  }

  getOutput(): string {
    return this.session.stdout.join("\n");
  }

  getErrors(): string {
    return this.session.stderr.join("\n");
  }

  isComplete(): boolean {
    return this.session.status === "completed" || this.session.status === "failed" || this.session.status === "interrupted";
  }

  isStuck(staleTimeout: number = 30000): boolean {
    return this.session.status === "running" && (Date.now() - this.session.lastOutput > staleTimeout);
  }

  protected abstract spawnProcess(): Promise<ChildProcess>;
}

// ─── OpenCode Worker Session ───────────────────────────────

export class OpenCodeSession extends BaseWorkerSession {
  private prompt: string;

  constructor(parentSessionId: string, task: string, cwd: string = DEFAULT_HOME) {
    super("opencode", parentSessionId, task, cwd);
    this.prompt = task;
  }

  protected async spawnProcess(): Promise<ChildProcess> {
    // OpenCode CLI: non-interactive mode
    // Pipe prompt via stdin, capture stdout
    const proc = spawn("opencode", ["--quiet"], {
      cwd: this.session.cwd,
      env: {
        ...process.env,
        TERM: "dumb",
        NO_COLOR: "1",
      },
      stdio: ["pipe", "pipe", "pipe"],
    });

    // Send the prompt
    if (proc.stdin) {
      proc.stdin.write(this.prompt);
      proc.stdin.end();
    }

    return proc;
  }

  // Parse stdout for file artifacts
  parseArtifacts(): Artifact[] {
    const artifacts: Artifact[] = [];
    const output = this.getOutput();

    // Look for file creation/modification patterns
    const filePatterns = [
      /(?:created|wrote|updated|modified|edited)\s+(?:file\s+)?([^\s]+\.\w+)/gi,
      /(?:Writing|Creating|Updating)\s+([^\s]+\.\w+)/gi,
    ];

    for (const pattern of filePatterns) {
      for (const match of output.matchAll(pattern)) {
        artifacts.push({
          id: uuid(),
          type: "file",
          name: match[1],
          path: match[1],
          size: 0,
          sessionId: this.session.sessionId,
          createdAt: Date.now(),
        });
      }
    }

    this.session.artifacts = artifacts;
    return artifacts;
  }
}

// ─── Kilo Worker Session ───────────────────────────────────

export class KiloSession extends BaseWorkerSession {
  private prompt: string;
  private repoPath: string;

  constructor(parentSessionId: string, task: string, cwd: string = DEFAULT_HOME) {
    super("kilo", parentSessionId, task, cwd);
    this.prompt = task;
    this.repoPath = cwd;
  }

  protected async spawnProcess(): Promise<ChildProcess> {
    // Kilo CLI: repository-focused editing
    const proc = spawn("kilo", ["--quiet"], {
      cwd: this.session.cwd,
      env: {
        ...process.env,
        TERM: "dumb",
        NO_COLOR: "1",
      },
      stdio: ["pipe", "pipe", "pipe"],
    });

    if (proc.stdin) {
      proc.stdin.write(this.prompt);
      proc.stdin.end();
    }

    return proc;
  }

  // Index repository for context
  async indexRepo(): Promise<{ files: string[]; structure: string }> {
    const { exec } = await import("child_process");
    const { promisify } = await import("util");
    const execAsync = promisify(exec);

    try {
      const { stdout } = await execAsync(
        `find "${this.repoPath}" -type f -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.py" -o -name "*.rs" -o -name "*.go" | head -100`,
        { timeout: 10000 }
      );
      const files = stdout.trim().split("\n").filter(Boolean);

      const { stdout: structure } = await execAsync(
        `ls -la "${this.repoPath}" 2>/dev/null`,
        { timeout: 5000 }
      );

      return { files, structure };
    } catch {
      return { files: [], structure: "" };
    }
  }

  parseArtifacts(): Artifact[] {
    const artifacts: Artifact[] = [];
    const output = this.getOutput();

    const filePatterns = [
      /(?:edited|modified|updated)\s+([^\s]+\.\w+)/gi,
      /(?:Changes to|Modified)\s+([^\s]+)/gi,
    ];

    for (const pattern of filePatterns) {
      for (const match of output.matchAll(pattern)) {
        artifacts.push({
          id: uuid(),
          type: "file",
          name: match[1],
          path: match[1],
          size: 0,
          sessionId: this.session.sessionId,
          createdAt: Date.now(),
        });
      }
    }

    this.session.artifacts = artifacts;
    return artifacts;
  }
}

// ─── Worker Factory ────────────────────────────────────────

export function createWorkerSession(
  worker: WorkerName,
  parentSessionId: string,
  task: string,
  cwd?: string
): BaseWorkerSession {
  switch (worker) {
    case "opencode":
      return new OpenCodeSession(parentSessionId, task, cwd);
    case "kilo":
      return new KiloSession(parentSessionId, task, cwd);
    default:
      throw new Error(`Unknown worker: ${worker}`);
  }
}

// ─── Worker Registry ───────────────────────────────────────

export class WorkerRegistry {
  private workers: Map<WorkerName, { name: WorkerName; description: string; capabilities: string[] }> = new Map();

  constructor() {
    this.workers.set("opencode", {
      name: "opencode",
      description: "Software engineering agent — code generation, refactoring, testing",
      capabilities: ["software_engineer", "code_generation", "refactoring", "bug_fixing", "testing"],
    });
    this.workers.set("kilo", {
      name: "kilo",
      description: "Repository editor — file modification, search/replace, code editing",
      capabilities: ["repository_editor", "code_editing", "file_modification", "search_and_replace"],
    });
    this.workers.set("hermes", {
      name: "hermes",
      description: "Daily assistant — conversation, memory, knowledge management",
      capabilities: ["conversation", "knowledge", "memory", "scheduling", "messaging"],
    });
  }

  list(): Array<{ name: WorkerName; description: string; capabilities: string[] }> {
    return Array.from(this.workers.values());
  }

  get(worker: WorkerName) {
    return this.workers.get(worker);
  }

  findForCapability(capability: string): WorkerName | undefined {
    for (const [name, info] of this.workers) {
      if (info.capabilities.includes(capability)) return name;
    }
    return undefined;
  }
}
