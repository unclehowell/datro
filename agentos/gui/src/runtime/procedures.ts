// ============================================================
// Procedure Memory v3 — How-to knowledge, not just facts
// ============================================================
// Stores: Task → succeeded → procedure → future planner retrieves
// Hermes gets better because it remembers HOW it solved problems
// ============================================================

import { v4 as uuid } from "uuid";
import { readFile, writeFile, readdir, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { join, resolve } from "path";
import { Procedure, ProcedureStep, CostTracker } from "./types";

const PROCEDURES_DIR = join(process.env.HOME || "/home/unclehowell", ".agentos", "procedures");

export class ProcedureMemory {
  private procedures: Map<string, Procedure> = new Map();
  private checkpoints: Map<string, any[]> = new Map(); // sessionId → checkpoints[]
  private initialized = false;

  async init(): Promise<void> {
    if (this.initialized) return;
    await mkdir(PROCEDURES_DIR, { recursive: true });
    await this.loadAll();
    await this.loadCheckpoints();
    this.initialized = true;
  }

  // ─── Store a Procedure ──────────────────────────────────

  async store(params: {
    task: string;
    steps: ProcedureStep[];
    result: "success" | "failure";
    artifacts?: string[];
    duration?: number;
    cost?: CostTracker;
    context?: string;
    tags?: string[];
  }): Promise<Procedure> {
    await this.init();

    const procedure: Procedure = {
      id: uuid(),
      task: params.task,
      steps: params.steps,
      result: params.result,
      artifacts: params.artifacts || [],
      duration: params.duration || 0,
      cost: params.cost || { tokens: 0, toolCalls: 0, duration: 0, estimatedDollars: 0 },
      context: params.context || "",
      tags: params.tags || [],
      confidence: params.result === "success" ? 0.8 : 0.3,
      useCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.procedures.set(procedure.id, procedure);
    await this.persist(procedure);
    return procedure;
  }

  // ─── Retrieve Procedures ────────────────────────────────

  // Find procedures that match a task (keyword + tag matching)
  async retrieve(task: string, options?: {
    limit?: number;
    tags?: string[];
    onlySuccessful?: boolean;
  }): Promise<Procedure[]> {
    await this.init();

    const limit = options?.limit || 5;
    const onlySuccessful = options?.onlySuccessful ?? true;

    const taskWords = task.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
    const taskTags = options?.tags || [];

    const scored = Array.from(this.procedures.values())
      .filter((p) => !onlySuccessful || p.result === "success")
      .map((p) => {
        let score = 0;

        // Task similarity (word overlap)
        const procWords = p.task.toLowerCase().split(/\s+/);
        const overlap = taskWords.filter((w) => procWords.some((pw) => pw.includes(w) || w.includes(pw)));
        score += overlap.length * 2;

        // Tag overlap
        const tagOverlap = taskTags.filter((t) => p.tags.includes(t));
        score += tagOverlap.length * 3;

        // Confidence boost
        score += p.confidence;

        // Use count boost (proven procedures)
        score += Math.min(p.useCount * 0.5, 3);

        // Recency boost
        const ageDays = (Date.now() - p.createdAt) / (1000 * 60 * 60 * 24);
        score += Math.max(0, 5 - ageDays * 0.1);

        return { procedure: p, score };
      })
      .filter((s) => s.score > 2)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    // Update use counts
    for (const { procedure } of scored) {
      procedure.useCount++;
      procedure.lastUsed = Date.now();
      await this.persist(procedure);
    }

    return scored.map((s) => s.procedure);
  }

  // ─── Store from Session Result ──────────────────────────

  async storeFromSession(params: {
    sessionId: string;
    task: string;
    steps: Array<{
      action: string;
      tool: string;
      parameters: Record<string, unknown>;
      output: string;
      success: boolean;
      duration: number;
    }>;
    result: "success" | "failure";
    artifacts?: string[];
    totalDuration: number;
    totalCost: CostTracker;
  }): Promise<Procedure | null> {
    // Validate: last step output must be meaningful (not empty, not just echo)
    const lastStep = params.steps[params.steps.length - 1];
    
    // For file redirect commands, verify the file was actually created
    const lastCommand = String(lastStep?.parameters?.command || "");
    if (this.isFileRedirect(lastCommand)) {
      const filePath = this.extractRedirectPath(lastCommand);
      if (filePath) {
        // Resolve relative paths against home directory (default exec CWD)
        const resolvedPath = filePath.startsWith("/") ? filePath : resolve(process.env.HOME || "/home/unclehowell", filePath);
        if (!existsSync(resolvedPath)) {
          console.log(`[PROCEDURES] File redirect but file not created: ${resolvedPath}`);
          return null;
        }
      }
    }
    
    console.log(`[PROCEDURES] Validating output for task "${params.task}": lastStep=${!!lastStep}, output="${lastStep?.output?.slice(0, 100)}"`);
    if (!lastStep || !this.validateOutput(lastStep.output, params.task)) {
      console.log(`[PROCEDURES] Validation FAILED — not storing procedure for "${params.task}"`);
      return null; // Don't store — output doesn't answer the question
    }
    console.log(`[PROCEDURES] Validation PASSED — storing procedure for "${params.task}"`);

    const procedureSteps: ProcedureStep[] = params.steps.map((s, i) => ({
      order: i + 1,
      action: s.action,
      tool: s.tool,
      parameters: s.parameters,
      output: s.output,
      success: s.success,
      duration: s.duration,
    }));

    return this.store({
      task: params.task,
      steps: procedureSteps,
      result: params.result,
      artifacts: params.artifacts,
      duration: params.totalDuration,
      cost: params.totalCost,
      tags: this.extractTags(params.task),
    });
  }

  // ─── Output Validation ──────────────────────────────────

  private validateOutput(output: string, task: string): boolean {
    const trimmed = output.trim();
    
    // Empty output is OK for file redirect commands (echo > file produces no stdout)
    // We'll check the actual file existence in storeFromSession
    if (!trimmed) {
      return true; // Allow empty output — file redirect check happens earlier
    }
    
    // Output that's just echo of the command itself is not valid
    // e.g., task "count files" → command "echo counting files" → output "counting files"
    const taskWords = task.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const outputLower = trimmed.toLowerCase();
    const echoedTaskWords = taskWords.filter(w => outputLower.includes(w));
    if (taskWords.length > 0 && echoedTaskWords.length >= taskWords.length * 0.7) {
      // Output is mostly echoing the task — likely wrong command
      console.log(`[PROCEDURES] Validation failed: output echoes task words for "${task}"`);
      return false;
    }
    
    // Very short output with no numbers/data is suspicious for query tasks
    if (trimmed.length < 3 && /\b(count|how many|list|find|show)\b/i.test(task)) {
      console.log(`[PROCEDURES] Validation failed: too short for query task "${task}"`);
      return false;
    }
    
    return true;
  }

  // ─── File Redirect Helpers ──────────────────────────────

  private isFileRedirect(command: string): boolean {
    return /\s*>\s*\S/.test(command);
  }

  private extractRedirectPath(command: string): string | null {
    const match = command.match(/>\s*(\S+)/);
    return match ? match[1] : null;
  }

  // ─── Query ──────────────────────────────────────────────

  get(id: string): Procedure | undefined {
    return this.procedures.get(id);
  }

  list(options?: { result?: "success" | "failure"; tag?: string; limit?: number }): Procedure[] {
    let procs = Array.from(this.procedures.values());

    if (options?.result) procs = procs.filter((p) => p.result === options.result);
    if (options?.tag) {
      const tag = options.tag;
      procs = procs.filter((p) => p.tags.includes(tag));
    }

    procs.sort((a, b) => b.useCount - a.useCount);

    if (options?.limit) procs = procs.slice(0, options.limit);
    return procs;
  }


  // ─── Checkpoints for Long-Running Tasks ─────────

  async saveCheckpoint(sessionId: string, step: number, state: Record<string, unknown>, artifacts: string[], observations: string[]): Promise<void> {
    await this.init();
    const sessionCheckpoints = this.checkpoints.get(sessionId) || [];
    sessionCheckpoints.push({
      step,
      state,
      artifacts,
      observations,
      timestamp: Date.now(),
    });
    // Keep last 50 checkpoints per session
    if (sessionCheckpoints.length > 50) {
      sessionCheckpoints.splice(0, sessionCheckpoints.length - 50);
    }
    this.checkpoints.set(sessionId, sessionCheckpoints);
    await this.persistCheckpoints();
  }

  async getCheckpoints(sessionId: string): Promise<any[]> {
    await this.init();
    return this.checkpoints.get(sessionId) || [];
  }

  async getLastCheckpoint(sessionId: string): Promise<any | null> {
    const checkpoints = await this.getCheckpoints(sessionId);
    return checkpoints.length > 0 ? checkpoints[checkpoints.length - 1] : null;
  }

  async restoreFromCheckpoint(sessionId: string): Promise<any | null> {
    const checkpoint = await this.getLastCheckpoint(sessionId);
    return checkpoint;
  }

  // ─── Persistence ──────────────────────────────────

  private async persistCheckpoints(): Promise<void> {
    try {
      const path = join(PROCEDURES_DIR, "..", "checkpoints");
      await mkdir(path, { recursive: true });
      for (const [sessionId, checkpoints] of this.checkpoints) {
        await writeFile(join(path, `${sessionId}.json`), JSON.stringify(checkpoints, null, 2), "utf-8");
      }
    } catch (err) {
      console.error("Failed to persist checkpoints:", err);
    }
  }

  private async loadCheckpoints(): Promise<void> {
    try {
      const path = join(PROCEDURES_DIR, "..", "checkpoints");
      const files = await readdir(path);
      for (const file of files) {
        if (!file.endsWith(".json")) continue;
        try {
          const sessionId = file.replace(".json", "");
          const content = await readFile(join(path, file), "utf-8");
          this.checkpoints.set(sessionId, JSON.parse(content));
        } catch { /* skip corrupt files */ }
      }
    } catch { /* dir doesn't exist yet */ }
  }

  // ─── Stats ────────────────────────────────────────

  getStats(): { total: number; successful: number; failed: number; avgConfidence: number; checkpoints: number } {
    const all = Array.from(this.procedures.values());
    const totalCheckpoints = Array.from(this.checkpoints.values()).reduce((sum, c) => sum + c.length, 0);
    return {
      total: all.length,
      successful: all.filter((p) => p.result === "success").length,
      failed: all.filter((p) => p.result === "failure").length,
      avgConfidence: all.reduce((sum, p) => sum + p.confidence, 0) / (all.length || 1),
      checkpoints: totalCheckpoints,
    };
  }

  // ─── Improve Confidence ─────────────────────────────────
  // When a retrieved procedure succeeds again, boost its confidence

  async boostConfidence(procedureId: string): Promise<void> {
    const proc = this.procedures.get(procedureId);
    if (!proc) return;
    proc.confidence = Math.min(1.0, proc.confidence + 0.1);
    proc.updatedAt = Date.now();
    await this.persist(proc);
  }

  // When a retrieved procedure fails, reduce its confidence

  async reduceConfidence(procedureId: string): Promise<void> {
    const proc = this.procedures.get(procedureId);
    if (!proc) return;
    proc.confidence = Math.max(0.1, proc.confidence - 0.2);
    proc.updatedAt = Date.now();
    await this.persist(proc);
  }

  // ─── Persistence ────────────────────────────────────────

  private async persist(procedure: Procedure): Promise<void> {
    const path = join(PROCEDURES_DIR, `${procedure.id}.json`);
    await writeFile(path, JSON.stringify(procedure, null, 2), "utf-8");
  }

  private async loadAll(): Promise<void> {
    try {
      const files = await readdir(PROCEDURES_DIR);
      for (const file of files) {
        if (!file.endsWith(".json")) continue;
        try {
          const content = await readFile(join(PROCEDURES_DIR, file), "utf-8");
          const procedure: Procedure = JSON.parse(content);
          this.procedures.set(procedure.id, procedure);
        } catch { /* skip corrupt files */ }
      }
    } catch { /* dir doesn't exist yet */ }
  }

  // ─── Helpers ────────────────────────────────────────────

  private extractTags(task: string): string[] {
    const tags: string[] = [];
    const taskLower = task.toLowerCase();

    // Auto-tag based on keywords
    const tagMap: Array<{ pattern: RegExp; tag: string }> = [
      { pattern: /deploy|deployment/i, tag: "deployment" },
      { pattern: /build|compile/i, tag: "build" },
      { pattern: /test|testing/i, tag: "testing" },
      { pattern: /refactor|restructure/i, tag: "refactoring" },
      { pattern: /fix|bug|error/i, tag: "bugfix" },
      { pattern: /create|new|generate/i, tag: "creation" },
      { pattern: /update|upgrade|migrate/i, tag: "migration" },
      { pattern: /config|setup|install/i, tag: "configuration" },
      { pattern: /search|find|grep/i, tag: "search" },
      { pattern: /git|commit|push|merge/i, tag: "git" },
      { pattern: /next\.?js|react|vue|angular/i, tag: "frontend" },
      { pattern: /api|endpoint|server/i, tag: "backend" },
      { pattern: /database|sql|mongo/i, tag: "database" },
      { pattern: /docker|container|k8s/i, tag: "devops" },
      { pattern: /memory|vault|obsidian/i, tag: "knowledge" },
    ];

    for (const { pattern, tag } of tagMap) {
      if (pattern.test(taskLower)) tags.push(tag);
    }

    return tags;
  }
}
