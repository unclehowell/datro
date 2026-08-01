// ============================================================
// Agent Loop v3 — OS Architecture
// ============================================================
// Supervisor → Planner → Execution Graph → Workers → Verification
// Streaming cognition throughout
// Procedure memory for learning
// Background execution via persistence
// ============================================================

import { v4 as uuid } from "uuid";
import { exec } from "child_process";
import { promisify } from "util";
import {
  Session, Action, Plan, StepResult, RuntimeEvent,
  ToolCallResult, ToolCallRequest, WorkerName,
  CostTracker, ReflectionResult, VerificationResult,
  SupervisorDecision,
} from "./types";
import { ToolRegistry } from "./tools/registry";
import { buildCompactToolPrompt, detectIntent } from "./tools/protocol";
import { LLMClient } from "./engines/llm";
import { SessionManager } from "./session-manager";
import { Supervisor } from "./supervisor";
import { ProcedureMemory } from "./procedures";
import {
  createWorkerSession, WorkerRegistry, BaseWorkerSession,
} from "./workers";
import { ExecutionGraphManager } from "./graph";
import { Scheduler } from "./scheduler";

const execAsync = promisify(exec);

export interface AgentLoopConfig {
  maxIterations: number;
  maxToolRounds: number;
  checkpointEvery: number;
  useLLM: boolean;
  logLevel: "debug" | "info" | "warn" | "error";
}

export interface AgentLoopResult {
  sessionId: string;
  success: boolean;
  output: string;
  summary: string;
  iterations: number;
  toolCalls: number;
  artifacts: string[];
  proceduresStored: number;
  duration: number;
}

export class AgentLoop {
  private config: AgentLoopConfig;
  private toolRegistry: ToolRegistry;
  private llm: LLMClient;
  private sessionManager: SessionManager;
  private supervisor: Supervisor | null = null;
  private procedureMemory: ProcedureMemory;
  private workerRegistry: WorkerRegistry;
  private graphManager: ExecutionGraphManager;
  private scheduler: Scheduler;
  private events: RuntimeEvent[] = [];
  private eventCallbacks: Array<(event: RuntimeEvent) => void> = [];

  constructor(config?: Partial<AgentLoopConfig>) {
    this.config = {
      maxIterations: 50,
      maxToolRounds: 10,
      checkpointEvery: 5,
      useLLM: true,
      logLevel: "info",
      ...config,
    };

    this.toolRegistry = new ToolRegistry();
    this.llm = new LLMClient({ model: "minicpm5-32k", temperature: 0.7, maxTokens: 2048 });
    this.sessionManager = new SessionManager();
    this.procedureMemory = new ProcedureMemory();
    this.workerRegistry = new WorkerRegistry();
    this.graphManager = new ExecutionGraphManager();
    this.scheduler = new Scheduler();
  }

  onEvent(callback: (event: RuntimeEvent) => void): void {
    this.eventCallbacks.push(callback);
  }

  private emit(event: RuntimeEvent): void {
    this.events.push(event);
    for (const cb of this.eventCallbacks) {
      try { cb(event); } catch { /* ignore */ }
    }
  }

  // ─── Main Entry Points ─────────────────────────────────

  async chat(message: string): Promise<string> {
    const session = await this.sessionManager.createSession(message, {
      priority: "normal",
      description: `Chat: ${message}`,
    });

    const result = await this.runObjective(session.id, message);
    return result.output;
  }

  async runObjective(sessionId: string, goal: string): Promise<AgentLoopResult> {
    const start = Date.now();
    let iterations = 0;
    let toolCalls = 0;
    let proceduresStored = 0;
    const artifacts: string[] = [];

    try {
      // Load or create session
      let session = this.sessionManager.getSession(sessionId);
      if (!session) {
        session = await this.sessionManager.createSession(goal, { priority: "high" });
        sessionId = session.id;
      }

      await this.sessionManager.updateStatus(sessionId, "running");
      this.emit({ type: "session_started", sessionId });

      // Initialize Supervisor
      this.supervisor = new Supervisor(sessionId);
      this.supervisor.onEvent((e) => this.emit(e));

      // Emit initial cognition
      this.emitCognition(sessionId, "system", "Session started. Analyzing objective...");

      // Check for relevant procedures (instant, no LLM)
      const procedures = await this.procedureMemory.retrieve(goal, { limit: 3 });
      if (procedures.length > 0) {
        this.emitCognition(sessionId, "memory", `Found ${procedures.length} relevant procedures — will reuse (no LLM needed)`);
        for (const proc of procedures) {
          await this.sessionManager.addProcedureUsed(sessionId, proc.id);
        }
      } else {
        this.emitCognition(sessionId, "memory", "No procedures found — will ask LLM to create plan (~45s)");
      }

      // Create plan (procedure-based or LLM-generated)
      this.emitCognition(sessionId, "planner", "Creating plan...");
      const plan = await this.createPlan(session, procedures);
      const totalActions = plan.milestones.flatMap((m) => m.actions).length;
      console.log(`[PLAN] Created plan: ${plan.milestones.length} milestones, ${totalActions} actions, reasoning: ${plan.reasoning}`);
      this.supervisor.recordProgress(); // Reset progress timer after LLM call
      await this.sessionManager.setPlan(sessionId, plan);

      // Build execution graph
      const graph = this.graphManager.createGraph(sessionId);
      const allActions = plan.milestones.flatMap((m) => m.actions);
      this.graphManager.buildFromActions(graph.id, allActions);
      console.log(`[GRAPH] Built graph: ${allActions.length} actions, ${this.graphManager.getReadyNodes(graph.id).length} ready`);

      // Main loop
      while (iterations < this.config.maxIterations) {
        iterations++;

        // Checkpoint
        if (iterations % this.config.checkpointEvery === 0) {
          await this.sessionManager.checkpoint(sessionId);
          this.emit({ type: "checkpoint_saved", sessionId, stateId: `${sessionId}-${Date.now()}` });
        }

        // Get ready nodes
        const readyNodes = this.graphManager.getReadyNodes(graph.id);

        if (readyNodes.length === 0) {
          if (this.graphManager.isComplete(graph.id)) {
            this.emitCognition(sessionId, "system", "All steps completed");
            break;
          }
          if (this.graphManager.hasFailures(graph.id)) {
            const stats = this.graphManager.getStats(graph.id);
            if (stats.pending === 0) break;
          }
          if (iterations <= 3) {
            const stats = this.graphManager.getStats(graph.id);
            console.log(`[LOOP] Iteration ${iterations}: no ready nodes. Stats: ${JSON.stringify(stats)}`);
          }
          await this.sleep(1000);
          continue;
        }

        // Process each ready node
        for (const node of readyNodes) {
          if (iterations >= this.config.maxIterations) break;

          // Set current action
          await this.sessionManager.setCurrentAction(sessionId, node.action);

          // Supervisor check
          const decision = this.supervisor.check(session, node.action);
          if (decision.type !== "continue") {
            console.log(`[SUPERVISOR] Blocked: ${decision.type} — ${decision.reason}`);
            this.emitCognition(sessionId, "supervisor", `Intervention: ${decision.reason}`);

            if (decision.type === "abort") {
              await this.sessionManager.updateStatus(sessionId, "failed");
              await this.sessionManager.addLog(sessionId, "error", `Supervisor abort: ${decision.reason}`);
              return this.buildResult(sessionId, false, decision.reason, iterations, toolCalls, artifacts, proceduresStored, Date.now() - start);
            }

            if (decision.type === "replan") {
              this.emitCognition(sessionId, "planner", "Revising plan based on supervisor intervention");
              // Continue with next iteration — plan will be revised
              continue;
            }

            if (decision.type === "split") {
              this.emitCognition(sessionId, "supervisor", "Splitting objective into sub-tasks");
              // For now, continue — split logic would create child sessions
              continue;
            }
          }

          // Execute action
          this.graphManager.markNodeRunning(graph.id, node.id);
          this.emitCognition(sessionId, "executor", `Executing: ${node.action.description.slice(0, 60)}`);

          const result = await this.executeAction(sessionId, node.action);
          toolCalls++;

          // Record in supervisor
          this.supervisor.recordAction(node.action, result.success);
          this.supervisor.recordCost({ toolCalls: 1, duration: result.duration });

          // Verify
          const verification = this.verifyResult(result, node.action);
          this.graphManager.setNodeVerification(graph.id, node.id, verification);

          if (verification.passed) {
            this.graphManager.markNodeCompleted(graph.id, node.id, result);
            this.emitCognition(sessionId, "verifier", `Verified: ${result.tool} succeeded`);

            // Check if milestone is complete (all nodes in milestone done)
            if (session.plan) {
              for (const milestone of session.plan.milestones) {
                if (milestone.status === "completed") continue;
                const milestoneActions = milestone.actions.map((a) => a.id);
                const allDone = milestoneActions.every((actionId) => {
                  const n = graph.nodes.find((gn) => gn.id === actionId);
                  return n && (n.status === "completed" || n.status === "failed");
                });
                if (allDone && milestoneActions.length > 0) {
                  milestone.status = "completed";
                  this.emitCognition(sessionId, "planner", `Milestone completed: ${milestone.description}`);
                }
              }
            }
          } else {
            this.graphManager.markNodeFailed(graph.id, node.id, result);
            this.emitCognition(sessionId, "verifier", `Verification failed: ${verification.checks.filter((c) => !c.passed).map((c) => c.name).join(", ")}`);
          }

          // Record step
          const step: StepResult = {
            action: node.action,
            result,
            verification,
            reflection: { observation: "", shouldContinue: true, planNeedsUpdate: false, completed: false },
            timestamp: Date.now(),
          };
          await this.sessionManager.addStepResult(sessionId, step);

          // Collect artifacts
          for (const art of this.extractArtifacts(result, sessionId)) {
            artifacts.push(art.name);
          }

          // Reflect
          const reflection = this.reflect(session, step, verification);
          this.graphManager.setNodeReflection(graph.id, node.id, reflection);
          await this.sessionManager.addObservation(sessionId, reflection.observation);

          this.emitCognition(sessionId, "reflector", reflection.observation);

          // Check completion
          if (reflection.completed) {
            console.log(`[LOOP] Step completed — storing procedure for "${session.goal}" (${session.completedSteps.length} steps)`);
            // Store procedure for future use
            const procedure = await this.procedureMemory.storeFromSession({
              sessionId,
              task: session.goal,
              steps: session.completedSteps.map((s) => ({
                action: s.action.description,
                tool: s.action.tool || "unknown",
                parameters: s.action.parameters,
                output: s.result.output.slice(0, 500),
                success: s.result.success,
                duration: s.result.duration,
              })),
              result: "success",
              artifacts,
              totalDuration: Date.now() - start,
              totalCost: session.cost,
            });
            if (procedure) {
              proceduresStored++;
              await this.sessionManager.addProcedureCreated(sessionId, procedure.id);
              console.log(`[LOOP] Procedure stored: ${procedure.id}`);
            } else {
              console.log(`[LOOP] Procedure NOT stored (validation failed)`);
            }

            await this.sessionManager.updateStatus(sessionId, "completed");
            const summary = reflection.summary || reflection.observation || `Done: ${session.goal}`;
            this.emit({ type: "session_completed", sessionId, summary });
            return this.buildResult(sessionId, true, summary, iterations, toolCalls, artifacts, proceduresStored, Date.now() - start);
          }

          // Plan needs update
          if (reflection.planNeedsUpdate) {
            this.emitCognition(sessionId, "planner", "Revising plan...");
            const newPlan = await this.createPlan(session, []);
            await this.sessionManager.setPlan(sessionId, newPlan);
            this.emit({ type: "plan_revised", sessionId, revision: newPlan.revisionCount });
          }
        }
      }

      // Final status
      if (iterations >= this.config.maxIterations) {
        await this.sessionManager.updateStatus(sessionId, "failed");
        return this.buildResult(sessionId, false, "Max iterations reached", iterations, toolCalls, artifacts, proceduresStored, Date.now() - start);
      }

      await this.sessionManager.updateStatus(sessionId, "completed");
      return this.buildResult(sessionId, true, "Objective completed", iterations, toolCalls, artifacts, proceduresStored, Date.now() - start);

    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      await this.sessionManager.addLog(sessionId, "error", error);
      await this.sessionManager.updateStatus(sessionId, "failed");
      this.emit({ type: "error", message: error, sessionId });
      return this.buildResult(sessionId, false, error, iterations, toolCalls, artifacts, proceduresStored, Date.now() - start);
    }
  }

  // ─── Action Execution ───────────────────────────────────

  private async executeAction(sessionId: string, action: Action): Promise<ToolCallResult> {
    // Delegate to worker
    if (action.worker) {
      return this.executeWithWorker(sessionId, action.worker as WorkerName, action);
    }

    // Direct tool execution
    if (action.tool) {
      const request: ToolCallRequest = {
        id: uuid(),
        tool: action.tool,
        parameters: action.parameters,
        timestamp: Date.now(),
        sessionId,
      };

      this.emit({ type: "tool_executing", sessionId, tool: action.tool, parameters: action.parameters });
      const result = await this.toolRegistry.execute(request);
      this.emit({ type: "tool_completed", sessionId, result });
      return result;
    }

    // Fallback: terminal
    const command = action.parameters.command || action.parameters.cmd || `echo "${action.description}"`;
    const request: ToolCallRequest = {
      id: uuid(),
      tool: "terminal",
      parameters: { command },
      timestamp: Date.now(),
      sessionId,
    };

    return this.toolRegistry.execute(request);
  }

  private async executeWithWorker(sessionId: string, worker: WorkerName, action: Action): Promise<ToolCallResult> {
    const cwd = String(action.parameters.cwd || "/home/unclehowell");
    const task = String(action.parameters.task || action.description);

    this.emitCognition(sessionId, "worker", `Delegating to ${worker}: ${task.slice(0, 60)}`);

    const workerSession = createWorkerSession(worker, sessionId, task, cwd);
    workerSession.onEvent((e) => this.emit(e));

    await workerSession.start();
    const result = await workerSession.waitForCompletion(300000); // 5 min timeout

    // Parse artifacts
    if ("parseArtifacts" in workerSession) {
      const workerArtifacts = (workerSession as any).parseArtifacts();
      for (const art of workerArtifacts) {
        await this.toolRegistry.execute({
          id: uuid(),
          tool: "terminal",
          parameters: { command: `echo "Artifact: ${art.name}"` },
          timestamp: Date.now(),
        });
      }
    }

    return {
      id: uuid(),
      tool: `worker:${worker}`,
      success: result.status === "completed",
      output: workerSession.getOutput(),
      error: result.status === "failed" ? workerSession.getErrors() : undefined,
      duration: result.duration || 0,
      timestamp: Date.now(),
      confidence: { score: result.status === "completed" ? 0.9 : 0.3, factors: [`Worker ${worker} ${result.status}`] },
      retryCount: 0,
    };
  }

  // ─── Verification ───────────────────────────────────────

  private verifyResult(result: ToolCallResult, action: Action): VerificationResult {
    const checks = [
      { name: "execution_success", passed: result.success, message: result.success ? "OK" : `Failed: ${result.error}` },
      { name: "no_errors", passed: !result.output?.includes("Error:") && !result.output?.includes("Traceback"), message: "Clean output" },
    ];

    const passed = checks.every((c) => c.passed);
    return {
      passed,
      checks,
      confidence: { score: passed ? 0.9 : 0.3, factors: checks.map((c) => `${c.name}: ${c.passed ? "PASS" : "FAIL"}`) },
      shouldRetry: !passed && result.retryCount < (action.maxRetries || 1),
    };
  }

  // ─── Reflection ─────────────────────────────────────────

  private reflect(session: Session, step: StepResult, verification: VerificationResult): ReflectionResult {
    const progress = this.calculateProgress(session);
    const observation = verification.passed
      ? `Step succeeded: ${step.action.tool} (${Math.round(progress * 100)}% complete)`
      : `Step failed: ${step.verification.checks.filter((c) => !c.passed).map((c) => c.name).join(", ")}`;

    const completed = progress >= 1.0;
    const totalFailures = session.completedSteps.filter((s) => !s.result.success).length;
    const shouldContinue = !completed && totalFailures < session.maxRetries;

    return {
      observation,
      shouldContinue,
      planNeedsUpdate: !verification.passed && !verification.shouldRetry,
      completed,
      summary: completed ? observation || `Done: ${session.goal}` : undefined,
    };
  }

  // ─── Plan Creation ──────────────────────────────────────

  private async createPlan(session: Session, procedures: any[]): Promise<Plan> {
    // HYBRID APPROACH:
    // 1. If procedures exist → use them directly (no LLM, instant)
    // 2. If no procedures → use LLM to generate a plan (~45s on Celeron)

    if (procedures.length > 0 && procedures[0].steps) {
      // REUSE: Use existing procedure
      this.emitCognition(session.id, "planner", "Reusing learned procedure");
      const bestProcedure = procedures[0];

      const milestones = [
        {
          id: uuid(),
          description: "Execute learned procedure",
          actions: bestProcedure.steps.map((s: any) => ({
            id: uuid(),
            type: "tool_call" as const,
            tool: s.tool,
            parameters: s.parameters,
            description: s.action,
            reasoning: `From procedure: ${bestProcedure.task.slice(0, 50)}`,
            confidence: { score: bestProcedure.confidence || 0.8, factors: ["Procedure-based"] },
            dependsOn: [],
            timeout: 30000,
            retryCount: 0,
            maxRetries: 2,
            status: "pending" as const,
            createdAt: Date.now(),
          })),
          status: "pending" as const,
          dependsOn: [],
        },
      ];

      return {
        id: uuid(),
        objective: session.goal,
        milestones,
        currentMilestone: 0,
        status: "active",
        revisionCount: 0,
        reasoning: `Reusing procedure: ${bestProcedure.task.slice(0, 60)}`,
        estimatedCost: { maxTokens: 0, maxToolCalls: bestProcedure.steps.length, maxDuration: 300000, maxDollars: 0 },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
    }

    // NO PROCEDURE: Use LLM to generate plan
    this.emitCognition(session.id, "planner", "No procedure found — asking LLM to create plan (~45s)...");

    const availableTools = this.toolRegistry.listTools().map((t) => t.name).join(", ");
    const systemPrompt = `You are a task planner. Given an objective, output EXACTLY the terminal commands needed.

Output format: one command per line, no explanation.
Example: if asked "create a file with hello world", output:
echo "hello world" > hello.txt

Example: if asked "list files and show disk usage", output:
ls -la
df -h /

Do NOT explain. Just output the commands.`;

    const response = await this.llm.chat(systemPrompt, `Objective: ${session.goal}`);
    console.log(`[LLM] Response: "${response.content.slice(0, 500)}" (${response.tokens.total} tokens, ${response.duration}ms)`);

    if (!response.content) {
      this.emitCognition(session.id, "planner", "LLM returned empty response — falling back to default plan");
      return this.createDefaultPlan(session);
    }

    // Parse LLM response into plan
    try {
      const content = response.content.trim();
      
      // Check if response is already JSON array
      const jsonArrayMatch = content.match(/\[[\s\S]*\]/);
      if (jsonArrayMatch) {
        try {
          const steps = JSON.parse(jsonArrayMatch[0]);
          if (Array.isArray(steps) && steps.length > 0) {
            // JSON array format
            const milestones = steps.map((step: any) => ({
              id: uuid(),
              description: step.description || "Execute step",
              actions: [{
                id: uuid(),
                type: "tool_call" as const,
                tool: step.tool || "terminal",
                parameters: step.params || step.parameters || {},
                description: step.description || "Execute step",
                reasoning: "LLM-generated plan",
                confidence: { score: 0.7, factors: ["LLM-generated"] },
                dependsOn: [],
                timeout: 30000,
                retryCount: 0,
                maxRetries: 1,
                status: "pending" as const,
                createdAt: Date.now(),
              }],
              status: "pending" as const,
              dependsOn: [],
            }));

            this.emitCognition(session.id, "planner", `LLM generated ${steps.length} steps (${response.tokens.total} tokens, ${response.duration}ms)`);
            return {
              id: uuid(),
              objective: session.goal,
              milestones,
              currentMilestone: 0,
              status: "active",
              revisionCount: 0,
              reasoning: `LLM-generated plan (${response.tokens.total} tokens)`,
              estimatedCost: { maxTokens: response.tokens.total, maxToolCalls: steps.length, maxDuration: 300000, maxDollars: 0 },
              createdAt: Date.now(),
              updatedAt: Date.now(),
            };
          }
        } catch {}
      }
      
      // Terminal command format: each line is a command
      const lines = content.split('\n')
        .map((l: string) => l.trim())
        .filter((l: string) => l && !l.startsWith('#') && !l.startsWith('Do NOT') && !l.startsWith('Example'));
      
      if (lines.length > 0) {
        const milestones = lines.map((cmd: string) => ({
          id: uuid(),
          description: `Execute: ${cmd.slice(0, 60)}`,
          actions: [{
            id: uuid(),
            type: "tool_call" as const,
            tool: "terminal",
            parameters: { command: cmd },
            description: `Execute: ${cmd.slice(0, 60)}`,
            reasoning: "LLM-generated terminal command",
            confidence: { score: 0.7, factors: ["LLM-generated"] },
            dependsOn: [],
            timeout: 30000,
            retryCount: 0,
            maxRetries: 1,
            status: "pending" as const,
            createdAt: Date.now(),
          }],
          status: "pending" as const,
          dependsOn: [],
        }));

        this.emitCognition(session.id, "planner", `LLM generated ${lines.length} terminal commands (${response.tokens.total} tokens, ${response.duration}ms)`);
        return {
          id: uuid(),
          objective: session.goal,
          milestones,
          currentMilestone: 0,
          status: "active",
          revisionCount: 0,
          reasoning: `LLM-generated terminal commands (${response.tokens.total} tokens)`,
          estimatedCost: { maxTokens: response.tokens.total, maxToolCalls: lines.length, maxDuration: 300000, maxDollars: 0 },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
      }

      this.emitCognition(session.id, "planner", "Could not parse LLM response — using default");
      return this.createDefaultPlan(session);
    } catch (err) {
      this.emitCognition(session.id, "planner", `LLM plan parsing failed: ${err} — using default`);
      return this.createDefaultPlan(session);
    }
  }

  private createDefaultPlan(session: Session): Plan {
    // Fallback: simple echo-and-verify plan
    return {
      id: uuid(),
      objective: session.goal,
      milestones: [
        {
          id: uuid(),
          description: "Execute objective",
          actions: [{
            id: uuid(),
            type: "tool_call" as const,
            tool: "terminal",
            parameters: { command: `echo "Executing: ${session.goal.replace(/"/g, '\\"')}"` },
            description: "Execute objective via terminal",
            reasoning: "Default fallback plan",
            confidence: { score: 0.5, factors: ["Default plan"] },
            dependsOn: [],
            timeout: 10000,
            retryCount: 0,
            maxRetries: 1,
            status: "pending" as const,
            createdAt: Date.now(),
          }],
          status: "pending" as const,
          dependsOn: [],
        },
      ],
      currentMilestone: 0,
      status: "active",
      revisionCount: 0,
      reasoning: "Default plan (LLM unavailable)",
      estimatedCost: { maxTokens: 0, maxToolCalls: 1, maxDuration: 60000, maxDollars: 0 },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }

  // ─── Cognition Events ───────────────────────────────────

  private emitCognition(sessionId: string, stage: string, message: string): void {
    this.emit({ type: "cognition", sessionId, stage, message });
    this.sessionManager.addCognitionEvent(sessionId, stage, message);
  }

  // ─── Helpers ────────────────────────────────────────────

  private calculateProgress(session: Session): number {
    if (!session.plan) return session.completedSteps.length > 0 ? 0.5 : 0;
    const total = session.plan.milestones.length;
    const completed = session.plan.milestones.filter((m) => m.status === "completed").length;
    return total > 0 ? completed / total : 0;
  }

  private extractArtifacts(result: ToolCallResult, sessionId: string): Array<{ name: string }> {
    const artifacts: Array<{ name: string }> = [];
    if (result.success && result.output) {
      // Check for file operations
      const fileMatch = result.output.match(/(?:written|created|updated)\s+(\S+\.\w+)/i);
      if (fileMatch) {
        artifacts.push({ name: fileMatch[1] });
      }
    }
    return artifacts;
  }

  private buildResult(
    sessionId: string, success: boolean, summary: string,
    iterations: number, toolCalls: number, artifacts: string[],
    proceduresStored: number, duration: number
  ): AgentLoopResult {
    const session = this.sessionManager.getSession(sessionId);
    const steps = session?.completedSteps || [];

    // Find the most meaningful output from all completed steps
    let output = "";
    for (const step of steps) {
      const out = step.result?.output?.trim();
      if (out && out.length > output.length) output = out;
    }

    // If no useful output from tools, synthesize from goal + steps
    if (!output) {
      const toolNames = [...new Set(steps.map((s) => s.action?.tool).filter(Boolean))];
      const goal = session?.goal || "task";
      output = steps.length > 0
        ? `Completed: ${goal}${toolNames.length > 0 ? ` (used ${toolNames.join(", ")})` : ""}`
        : summary;
    }

    return { sessionId, success, output, summary, iterations, toolCalls, artifacts, proceduresStored, duration };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // ─── Public Getters ────────────────────────────────────

  getToolRegistry(): ToolRegistry { return this.toolRegistry; }
  getSessionManager(): SessionManager { return this.sessionManager; }
  getSupervisor(): Supervisor | null { return this.supervisor; }
  getProcedureMemory(): ProcedureMemory { return this.procedureMemory; }
  getWorkerRegistry(): WorkerRegistry { return this.workerRegistry; }
  getGraphManager(): ExecutionGraphManager { return this.graphManager; }
  getScheduler(): Scheduler { return this.scheduler; }
  getEvents(): RuntimeEvent[] { return [...this.events]; }
}
