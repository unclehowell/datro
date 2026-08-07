// ============================================================
// Session Manager v3 — Top-level container for everything
// ============================================================
// Each objective creates a Session.
// A Session owns: goal, plan, artifacts, logs, memory,
// state, execution graph, cost, timeline.
// ============================================================

import { v4 as uuid } from "uuid";
import { readFile, writeFile, readdir, mkdir } from "fs/promises";
import { join } from "path";
import { homedir } from "os";
import {
  Session, SessionStatus, SessionLog, Artifact, TimelineEvent,
  CostTracker, VerificationSummary, ConfidenceScore, SerializedSession,
  Plan, Action, StepResult, ReflectionResult,
} from "./types";

const SESSIONS_DIR = join(homedir(), ".agentos", "sessions");

export class SessionManager {
  private sessions: Map<string, Session> = new Map();
  private listeners: Array<(event: string, session: Session) => void> = [];

  constructor() {
    this.ensureDirs();
  }

  // ─── Session Lifecycle ──────────────────────────────────

  async createSession(goal: string, options?: {
    priority?: Session["priority"];
    description?: string;
    parentSessionId?: string;
    maxRetries?: number;
    metadata?: Record<string, unknown>;
  }): Promise<Session> {
    const session: Session = {
      id: uuid(),
      goal,
      description: options?.description,
      status: "created",
      priority: options?.priority || "normal",
      plan: null,
      completedSteps: [],
      pendingSteps: [],
      currentAction: null,
      graph: null,
      observations: [],
      proceduresUsed: [],
      proceduresCreated: [],
      artifacts: [],
      logs: [],
      verification: { totalChecks: 0, passed: 0, failed: 0 },
      cost: { tokens: 0, toolCalls: 0, duration: 0, estimatedDollars: 0 },
      timeline: [],
      confidence: { score: 0.5, factors: ["New session"] },
      retryCount: 0,
      maxRetries: options?.maxRetries ?? 3,
      parentSessionId: options?.parentSessionId,
      childSessionIds: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      metadata: options?.metadata || {},
    };

    this.sessions.set(session.id, session);
    this.addTimelineEvent(session, "session_created", `Session created: ${goal}`);
    this.emit("session_created", session);
    await this.persistSession(session);

    return session;
  }

  async updateStatus(sessionId: string, status: SessionStatus): Promise<Session> {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error(`Session not found: ${sessionId}`);

    const prev = session.status;
    session.status = status;
    session.updatedAt = Date.now();

    if (status === "running" && !session.startedAt) session.startedAt = Date.now();
    if (status === "paused") session.pausedAt = Date.now();
    if (status === "completed" || status === "failed") session.completedAt = Date.now();

    this.addTimelineEvent(session, "status_change", `${prev} → ${status}`);
    this.emit(`session_${status}`, session);
    await this.persistSession(session);
    return session;
  }

  // ─── Step Management ────────────────────────────────────

  async addStepResult(sessionId: string, step: StepResult): Promise<Session> {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error(`Session not found: ${sessionId}`);

    session.completedSteps.push(step);
    session.updatedAt = Date.now();

    // Update verification
    if (step.verification) {
      session.verification.totalChecks += step.verification.checks.length;
      session.verification.passed += step.verification.checks.filter((c) => c.passed).length;
      session.verification.failed += step.verification.checks.filter((c) => !c.passed).length;
      session.verification.lastCheck = step.verification;
    }

    // Update cost
    if (step.result) {
      session.cost.toolCalls++;
      session.cost.duration += step.result.duration;
    }

    // Timeline
    this.addTimelineEvent(session, "action_completed",
      `${step.action.tool || "action"}: ${step.action.description.slice(0, 80)}`
    );

    await this.persistSession(session);
    return session;
  }

  async setCurrentAction(sessionId: string, action: Action | null): Promise<Session> {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error(`Session not found: ${sessionId}`);

    session.currentAction = action;
    session.updatedAt = Date.now();

    if (action) {
      this.addTimelineEvent(session, "action_started", action.description.slice(0, 80));
    }

    await this.persistSession(session);
    return session;
  }

  // ─── Observations & Memory ──────────────────────────────

  async addObservation(sessionId: string, observation: string): Promise<Session> {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error(`Session not found: ${sessionId}`);

    session.observations.push(observation);
    session.updatedAt = Date.now();
    await this.persistSession(session);
    return session;
  }

  async addProcedureUsed(sessionId: string, procedureId: string): Promise<Session> {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error(`Session not found: ${sessionId}`);

    session.proceduresUsed.push(procedureId);
    this.addTimelineEvent(session, "procedure_retrieved", `Procedure: ${procedureId}`);
    await this.persistSession(session);
    return session;
  }

  async addProcedureCreated(sessionId: string, procedureId: string): Promise<Session> {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error(`Session not found: ${sessionId}`);

    session.proceduresCreated.push(procedureId);
    this.addTimelineEvent(session, "procedure_stored", `Procedure: ${procedureId}`);
    await this.persistSession(session);
    return session;
  }

  // ─── Artifacts ──────────────────────────────────────────

  async addArtifact(sessionId: string, artifact: Artifact): Promise<Session> {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error(`Session not found: ${sessionId}`);

    session.artifacts.push(artifact);
    this.addTimelineEvent(session, "action_completed", `Artifact: ${artifact.name}`);
    await this.persistSession(session);
    return session;
  }

  // ─── Logs ───────────────────────────────────────────────

  async addLog(
    sessionId: string,
    level: SessionLog["level"],
    message: string,
    stage?: any,
    nodeId?: string
  ): Promise<Session> {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error(`Session not found: ${sessionId}`);

    session.logs.push({ level, message, timestamp: Date.now(), stage, nodeId });
    session.updatedAt = Date.now();
    await this.persistSession(session);
    return session;
  }

  // ─── Plan ───────────────────────────────────────────────

  async setPlan(sessionId: string, plan: Plan): Promise<Session> {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error(`Session not found: ${sessionId}`);

    session.plan = plan;
    this.addTimelineEvent(session, "plan_created", `Plan: ${plan.milestones.length} milestones`);
    await this.persistSession(session);
    return session;
  }

  // ─── Confidence ─────────────────────────────────────────

  async updateConfidence(sessionId: string, confidence: ConfidenceScore): Promise<Session> {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error(`Session not found: ${sessionId}`);

    session.confidence = confidence;
    await this.persistSession(session);
    return session;
  }

  // ─── Cognition Events ───────────────────────────────────

  addCognitionEvent(sessionId: string, stage: string, message: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    this.addTimelineEvent(session, "cognition", `[${stage}] ${message}`);
  }

  // ─── Query ──────────────────────────────────────────────

  getSession(sessionId: string): Session | undefined {
    return this.sessions.get(sessionId);
  }

  listSessions(status?: SessionStatus): Session[] {
    const all = Array.from(this.sessions.values());
    if (status) return all.filter((s) => s.status === status);
    return all.sort((a, b) => b.updatedAt - a.updatedAt);
  }

  getActiveSessions(): Session[] {
    return this.listSessions().filter((s) =>
      ["running", "planning", "verifying", "reflecting"].includes(s.status)
    );
  }

  getRecentSessions(limit: number = 10): Session[] {
    return this.listSessions().slice(0, limit);
  }

  // ─── Child Sessions ─────────────────────────────────────

  async addChildSession(parentId: string, childId: string): Promise<Session> {
    const parent = this.sessions.get(parentId);
    if (!parent) throw new Error(`Parent session not found: ${parentId}`);

    parent.childSessionIds.push(childId);
    parent.updatedAt = Date.now();
    await this.persistSession(parent);
    return parent;
  }

  // ─── Timeline ───────────────────────────────────────────

  private addTimelineEvent(session: Session, type: TimelineEvent["type"], message: string): void {
    session.timeline.push({ timestamp: Date.now(), type, message });
    // Keep timeline manageable
    if (session.timeline.length > 500) {
      session.timeline = session.timeline.slice(-250);
    }
  }

  // ─── Persistence ────────────────────────────────────────

  async persistSession(session: Session): Promise<void> {
    try {
      const serialized: SerializedSession = {
        version: 3,
        session,
        timestamp: Date.now(),
      };
      const path = join(SESSIONS_DIR, `${session.id}.json`);
      await writeFile(path, JSON.stringify(serialized, null, 2), "utf-8");
    } catch (err) {
      console.error(`Failed to persist session ${session.id}:`, err);
    }
  }

  async loadAllSessions(): Promise<void> {
    try {
      await mkdir(SESSIONS_DIR, { recursive: true });
      const files = await readdir(SESSIONS_DIR);
      for (const file of files) {
        if (!file.endsWith(".json")) continue;
        try {
          const content = await readFile(join(SESSIONS_DIR, file), "utf-8");
          const serialized: SerializedSession = JSON.parse(content);
          this.sessions.set(serialized.session.id, serialized.session);
        } catch { /* skip corrupt files */ }
      }
    } catch { /* dir doesn't exist yet */ }
  }

  async checkpoint(sessionId: string): Promise<string> {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error(`Session not found: ${sessionId}`);

    const stateId = `${sessionId}-${Date.now()}`;
    this.addTimelineEvent(session, "checkpoint_saved", `Checkpoint: ${stateId}`);
    await this.persistSession(session);
    return stateId;
  }

  // ─── Events ─────────────────────────────────────────────

  onEvent(listener: (event: string, session: Session) => void): void {
    this.listeners.push(listener);
  }

  private emit(event: string, session: Session): void {
    for (const listener of this.listeners) {
      try { listener(event, session); } catch { /* ignore */ }
    }
  }

  // ─── Helpers ────────────────────────────────────────────

  private async ensureDirs(): Promise<void> {
    await mkdir(SESSIONS_DIR, { recursive: true });
  }
}
