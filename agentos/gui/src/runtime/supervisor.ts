// ============================================================
// Supervisor v3 — Watchdog above the planner
// ============================================================
// Never executes tools.
// Monitors: stuck loops, retries, budget, strategy.
// Can: replan, split, abort.
// ============================================================

import {
  Session, Action, SupervisorDecision, SupervisorState, SupervisorConfig,
  CostTracker, CostEstimate, RuntimeEvent, PipelineStageName,
} from "./types";

const DEFAULT_CONFIG: SupervisorConfig = {
  stuckThreshold: 3,            // Same action 3 times = stuck
  retryLoopThreshold: 3,        // Same retry 3 times = loop
  maxTimeWithoutProgress: 600000, // 10 min without progress (allows slow LLM planning)
  budgetWarningPercent: 80,
  autoSplitOnStuck: true,
  autoReplanOnFailure: true,
};

export class Supervisor {
  private state: SupervisorState;
  private config: SupervisorConfig;
  private actionHistory: Map<string, number> = new Map(); // action signature → count
  private lastProgressAt: number;
  private eventCallbacks: Array<(event: RuntimeEvent) => void> = [];

  constructor(sessionId: string, config?: Partial<SupervisorConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.state = {
      sessionId,
      stuckCounter: 0,
      retryLoops: 0,
      budgetUsed: { tokens: 0, toolCalls: 0, duration: 0, estimatedDollars: 0 },
      budgetLimit: { maxTokens: 100000, maxToolCalls: 50, maxDuration: 600000, maxDollars: 1.0 },
      interventions: [],
    };
    this.lastProgressAt = Date.now();
  }

  onEvent(callback: (event: RuntimeEvent) => void): void {
    this.eventCallbacks.push(callback);
  }

  private emit(event: RuntimeEvent): void {
    for (const cb of this.eventCallbacks) {
      try { cb(event); } catch { /* ignore */ }
    }
  }

  // ─── Main Entry Point ───────────────────────────────────
  // Called before each action. Returns a decision.

  check(session: Session, plannedAction: Action): SupervisorDecision {
    // 1. Check for stuck behavior
    const stuckCheck = this.checkStuck(plannedAction);
    if (stuckCheck) return this.intervene(stuckCheck);

    // 2. Check for retry loops
    const loopCheck = this.checkRetryLoop(session);
    if (loopCheck) return this.intervene(loopCheck);

    // 3. Check budget
    const budgetCheck = this.checkBudget();
    if (budgetCheck) return this.intervene(budgetCheck);

    // 4. Check for timeout
    const timeoutCheck = this.checkTimeout(session);
    if (timeoutCheck) return this.intervene(timeoutCheck);

    // 5. Check for repeated failures
    const failureCheck = this.checkRepeatedFailures(session);
    if (failureCheck) return this.intervene(failureCheck);

    // All clear — continue
    return { type: "continue", reason: "Supervisor check passed" };
  }

  // ─── After Action ───────────────────────────────────────

  recordAction(action: Action, success: boolean): void {
    const signature = this.actionSignature(action);
    this.actionHistory.set(signature, (this.actionHistory.get(signature) || 0) + 1);

    if (success) {
      this.lastProgressAt = Date.now();
      this.state.stuckCounter = 0;
    }
  }

  recordProgress(): void {
    this.lastProgressAt = Date.now();
  }

  recordCost(cost: Partial<CostTracker>): void {
    if (cost.tokens) this.state.budgetUsed.tokens += cost.tokens;
    if (cost.toolCalls) this.state.budgetUsed.toolCalls += cost.toolCalls;
    if (cost.duration) this.state.budgetUsed.duration += cost.duration;
    if (cost.estimatedDollars) this.state.budgetUsed.estimatedDollars += cost.estimatedDollars;
  }

  // ─── Checks ─────────────────────────────────────────────

  private checkStuck(action: Action): SupervisorDecision | null {
    const signature = this.actionSignature(action);
    const count = this.actionHistory.get(signature) || 0;

    if (count >= this.config.stuckThreshold) {
      this.state.stuckCounter = count;
      return {
        type: this.config.autoSplitOnStuck ? "split" : "replan",
        reason: `Action "${action.description}" has been attempted ${count} times (stuck threshold: ${this.config.stuckThreshold})`,
        suggestedSplit: this.config.autoSplitOnStuck ? this.suggestSplit(action) : undefined,
      };
    }

    return null;
  }

  private checkRetryLoop(session: Session): SupervisorDecision | null {
    const recentFailures = session.completedSteps
      .slice(-10)
      .filter((s) => s.result && !s.result.success);

    if (recentFailures.length >= this.config.retryLoopThreshold) {
      // Check if they're all the same tool
      const tools = recentFailures.map((s) => s.action.tool);
      const uniqueTools = new Set(tools);
      if (uniqueTools.size === 1) {
        this.state.retryLoops++;
        return {
          type: "replan",
          reason: `Retry loop detected: ${recentFailures.length} consecutive failures on tool "${tools[0]}"`,
        };
      }
    }

    return null;
  }

  private checkBudget(): SupervisorDecision | null {
    const { budgetUsed, budgetLimit } = this.state;

    // Token budget
    if (budgetUsed.tokens > budgetLimit.maxTokens * (this.config.budgetWarningPercent / 100)) {
      return {
        type: "escalate",
        reason: `Token budget at ${Math.round((budgetUsed.tokens / budgetLimit.maxTokens) * 100)}% (${budgetUsed.tokens}/${budgetLimit.maxTokens})`,
      };
    }

    // Tool call budget
    if (budgetUsed.toolCalls > budgetLimit.maxToolCalls * (this.config.budgetWarningPercent / 100)) {
      return {
        type: "escalate",
        reason: `Tool call budget at ${Math.round((budgetUsed.toolCalls / budgetLimit.maxToolCalls) * 100)}% (${budgetUsed.toolCalls}/${budgetLimit.maxToolCalls})`,
      };
    }

    // Dollar budget
    if (budgetUsed.estimatedDollars > budgetLimit.maxDollars * (this.config.budgetWarningPercent / 100)) {
      return {
        type: "escalate",
        reason: `Cost budget at ${Math.round((budgetUsed.estimatedDollars / budgetLimit.maxDollars) * 100)}% ($${budgetUsed.estimatedDollars.toFixed(4)}/$${budgetLimit.maxDollars})`,
      };
    }

    return null;
  }

  private checkTimeout(session: Session): SupervisorDecision | null {
    if (!session.startedAt) return null;

    const elapsed = Date.now() - session.startedAt;
    if (elapsed > this.state.budgetLimit.maxDuration) {
      return {
        type: "abort",
        reason: `Session exceeded time limit: ${Math.round(elapsed / 1000)}s / ${Math.round(this.state.budgetLimit.maxDuration / 1000)}s`,
      };
    }

    // Check for no progress
    const timeSinceProgress = Date.now() - this.lastProgressAt;
    if (timeSinceProgress > this.config.maxTimeWithoutProgress) {
      return {
        type: "replan",
        reason: `No progress for ${Math.round(timeSinceProgress / 1000)}s (threshold: ${Math.round(this.config.maxTimeWithoutProgress / 1000)}s)`,
      };
    }

    return null;
  }

  private checkRepeatedFailures(session: Session): SupervisorDecision | null {
    const recentSteps = session.completedSteps.slice(-5);
    const failureCount = recentSteps.filter((s) => s.result && !s.result.success).length;

    if (failureCount >= 3) {
      return {
        type: this.config.autoReplanOnFailure ? "replan" : "escalate",
        reason: `${failureCount} of last ${recentSteps.length} steps failed`,
      };
    }

    return null;
  }

  // ─── Intervention ───────────────────────────────────────

  private intervene(decision: SupervisorDecision): SupervisorDecision {
    this.state.interventions.push(decision);
    this.state.lastIntervention = Date.now();

    this.emit({
      type: "supervisor_intervention",
      sessionId: this.state.sessionId,
      decision,
    });

    return decision;
  }

  // ─── Split Suggestion ───────────────────────────────────

  private suggestSplit(action: Action): string[] {
    // Suggest splitting the objective into smaller parts
    return [
      `Sub-objective: Understand ${action.description}`,
      `Sub-objective: Implement ${action.description}`,
      `Sub-objective: Verify ${action.description}`,
    ];
  }

  // ─── Helpers ────────────────────────────────────────────

  private actionSignature(action: Action): string {
    return `${action.tool || "unknown"}:${JSON.stringify(action.parameters)}`;
  }

  // ─── Getters ────────────────────────────────────────────

  getState(): SupervisorState {
    return { ...this.state };
  }

  getInterventions(): SupervisorDecision[] {
    return [...this.state.interventions];
  }

  getBudgetUsage(): { used: CostTracker; limit: CostEstimate; percent: number } {
    const percent = Math.max(
      (this.state.budgetUsed.tokens / this.state.budgetLimit.maxTokens) * 100,
      (this.state.budgetUsed.toolCalls / this.state.budgetLimit.maxToolCalls) * 100,
      (this.state.budgetUsed.estimatedDollars / this.state.budgetLimit.maxDollars) * 100
    );
    return {
      used: { ...this.state.budgetUsed },
      limit: { ...this.state.budgetLimit },
      percent: Math.round(percent),
    };
  }

  isStuck(): boolean {
    return this.state.stuckCounter >= this.config.stuckThreshold;
  }

  isOverBudget(): boolean {
    return this.getBudgetUsage().percent >= 100;
  }

  hasExcessiveInterventions(): boolean {
    return this.state.interventions.length >= 5;
  }
}
