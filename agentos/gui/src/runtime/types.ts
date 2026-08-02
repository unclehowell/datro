// ============================================================
// Agent Runtime v3 — OS Architecture
// ============================================================
// Hermes = operating system
// Scheduler = heart
// Planner = replaceable
// Tools = first-class citizens
// Memory = shared infrastructure
// UI = just another client
// ============================================================

// ─── Session (Top-Level Container) ─────────────────────────
// Each objective creates a Session.
// A Session owns everything: goal, plan, artifacts, logs,
// memory, state, execution graph, cost, timeline.

export type SessionStatus =
  | "created"
  | "queued"
  | "planning"
  | "running"
  | "paused"
  | "blocked"
  | "verifying"
  | "reflecting"
  | "checkpointing"
  | "completed"
  | "failed"
  | "cancelled"
  | "resumed"; // resumed from checkpoint

export interface Session {
  id: string;
  goal: string;
  description?: string;
  status: SessionStatus;
  priority: "low" | "normal" | "high" | "urgent";

  // Plan
  plan: Plan | null;

  // Execution
  completedSteps: StepResult[];
  pendingSteps: Action[];
  currentAction: Action | null;

  // Graph
  graph: ExecutionGraph | null;

  // Memory
  observations: string[];
  proceduresUsed: string[];      // Procedure IDs referenced
  proceduresCreated: string[];   // Procedure IDs generated

  // Artifacts
  artifacts: Artifact[];

  // Logs
  logs: SessionLog[];

  // Verification
  verification: VerificationSummary;

  // Cost tracking
  cost: CostTracker;

  // Timeline
  timeline: TimelineEvent[];

  // State
  confidence: ConfidenceScore;
  retryCount: number;
  maxRetries: number;

  // Hierarchy
  parentSessionId?: string;
  childSessionIds: string[];

  // Timestamps
  createdAt: number;
  updatedAt: number;
  startedAt?: number;
  completedAt?: number;
  pausedAt?: number;

  // Error
  error?: string;

  // Metadata
  metadata: Record<string, unknown>;
}

// ─── Plan ──────────────────────────────────────────────────

export interface Plan {
  id: string;
  objective: string;
  milestones: Milestone[];
  currentMilestone: number;
  status: "draft" | "active" | "revised" | "completed" | "failed";
  revisionCount: number;
  reasoning: string;            // Why this plan
  estimatedCost: CostEstimate;
  createdAt: number;
  updatedAt: number;
}

export interface Milestone {
  id: string;
  description: string;
  actions: Action[];
  status: "pending" | "in_progress" | "completed" | "failed" | "skipped";
  dependsOn: string[];
}

export interface Action {
  id: string;
  type: "tool_call" | "delegate" | "wait" | "respond" | "plan" | "reflect";
  tool?: string;
  worker?: string;              // Specialist worker to delegate to
  parameters: Record<string, unknown>;
  capability?: string;
  description: string;
  reasoning: string;
  confidence: ConfidenceScore;
  dependsOn: string[];
  timeout: number;
  retryCount: number;
  maxRetries: number;
  status: "pending" | "running" | "completed" | "failed" | "skipped";
  result?: ToolCallResult;
  createdAt: number;
}

// ─── Workers (OpenCode, Kilo, etc.) ───────────────────────

export type WorkerName = "opencode" | "kilo" | "hermes" | "terminal" | "subagent";

export interface WorkerSession {
  id: string;
  worker: WorkerName;
  sessionId: string;            // Parent Session ID
  status: "idle" | "starting" | "running" | "completed" | "failed" | "interrupted";
  task: string;
  cwd: string;

  // Streaming
  stdout: string[];
  stderr: string[];
  lastOutput: number;

  // Process
  pid?: number;
  process?: any;                // ChildProcess (not serialized)

  // Artifacts produced
  artifacts: Artifact[];

  // Timing
  startedAt: number;
  completedAt?: number;
  duration?: number;

  // Cost
  tokensUsed: number;

  // Subagent support
  subagentId?: string;
  subagentAgent?: string;
  checkpointInterval?: number;
  lastCheckpoint?: number;
  checkpoints?: Checkpoint[];
}

export interface Checkpoint {
  id: string;
  sessionId: string;
  step: number;
  state: Record<string, unknown>;
  artifacts: string[];
  observations: string[];
  timestamp: number;
  duration: number;
}

// ─── Supervisor ────────────────────────────────────────────
// Watches above the planner.
// Never executes tools.
// Monitors for stuck loops, retries, budget, strategy.

export interface SupervisorDecision {
  type: "continue" | "retry" | "replan" | "split" | "escalate" | "abort";
  reason: string;
  action?: Action;
  suggestedSplit?: string[];    // If splitting into sub-objectives
}

export interface SupervisorState {
  sessionId: string;
  stuckCounter: number;         // How many times planner repeated same action
  retryLoops: number;           // Detected retry loops
  budgetUsed: CostTracker;
  budgetLimit: CostEstimate;
  timeRunning?: number;
  lastIntervention?: number;
  interventions: SupervisorDecision[];
}

// ─── Procedure Memory ──────────────────────────────────────
// Stores HOW to do things, not just WHAT.
// Task → succeeded → store procedure → future planner retrieves it.

export interface Procedure {
  id: string;
  task: string;                 // What was attempted
  taskEmbedding?: number[];     // For semantic search
  steps: ProcedureStep[];
  result: "success" | "failure";
  artifacts: string[];          // Artifact IDs produced
  duration: number;
  cost: CostTracker;
  context: string;              // When this applies
  tags: string[];
  confidence: number;           // How reliable this procedure is
  useCount: number;             // How many times retrieved
  lastUsed?: number;
  createdAt: number;
  updatedAt: number;
}

export interface ProcedureStep {
  order: number;
  action: string;               // What was done
  tool: string;                 // Which tool was used
  parameters: Record<string, unknown>;
  output: string;               // What happened
  success: boolean;
  duration: number;
}

// ─── Tool System ───────────────────────────────────────────

export interface ToolDefinition {
  name: string;
  category: "system" | "code" | "file" | "web" | "memory" | "agent" | "data" | "media";
  capability: string;
  description: string;
  parameters: ToolParameter[];
  timeout: number;
  permissions: ("read" | "write" | "execute" | "network" | "dangerous")[];
  retryPolicy: { maxRetries: number; backoffMs: number };
  tags: string[];
}

export interface ToolParameter {
  name: string;
  type: "string" | "number" | "boolean" | "array" | "object";
  description: string;
  required: boolean;
  default?: unknown;
  enum?: string[];
}

export interface ToolCallRequest {
  id: string;
  tool: string;
  parameters: Record<string, unknown>;
  timestamp: number;
  sessionId?: string;
  nodeId?: string;
}

export interface ToolCallResult {
  id: string;
  tool: string;
  success: boolean;
  output: string;
  error?: string;
  duration: number;
  timestamp: number;
  confidence: ConfidenceScore;
  verification?: VerificationResult;
  retryCount: number;
  alternativeUsed?: string;
  metadata?: Record<string, unknown>;
}

// ─── Execution Graph (DAG) ─────────────────────────────────

export interface ExecutionGraph {
  id: string;
  sessionId: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  executionOrder: string[];
  completedNodes: string[];
  failedNodes: string[];
  blockedNodes: string[];
  startedAt: number;
  updatedAt: number;
}

export interface GraphNode {
  id: string;
  action: Action;
  status: "pending" | "ready" | "running" | "completed" | "failed" | "skipped";
  result?: ToolCallResult;
  verification?: VerificationResult;
  reflection?: ReflectionResult;
  startedAt?: number;
  completedAt?: number;
  duration?: number;
}

export interface GraphEdge {
  from: string;
  to: string;
  type: "depends" | "triggers" | "blocks";
}

// ─── Pipeline Stages ───────────────────────────────────────

export type PipelineStageName = "observe" | "reason" | "plan" | "choose" | "execute" | "verify" | "reflect";

export interface PipelineStageResult {
  stage: PipelineStageName;
  input: unknown;
  output: unknown;
  duration: number;
  timestamp: number;
  success: boolean;
  error?: string;
}

// ─── Reflection ────────────────────────────────────────────

export interface ReflectionResult {
  observation: string;
  shouldContinue: boolean;
  planNeedsUpdate: boolean;
  completed: boolean;
  summary?: string;
}

// ─── Verification ──────────────────────────────────────────

export interface VerificationCheck {
  name: string;
  passed: boolean;
  message: string;
}

export interface VerificationResult {
  passed: boolean;
  checks: VerificationCheck[];
  confidence: ConfidenceScore;
  shouldRetry: boolean;
  alternative?: Action;
}

export interface VerificationSummary {
  totalChecks: number;
  passed: number;
  failed: number;
  lastCheck?: VerificationResult;
}

// ─── Cost & Budget ─────────────────────────────────────────

export interface CostTracker {
  tokens: number;
  toolCalls: number;
  duration: number;
  estimatedDollars: number;
}

export interface CostEstimate {
  maxTokens: number;
  maxToolCalls: number;
  maxDuration: number;          // ms
  maxDollars: number;
}

// ─── Timeline ──────────────────────────────────────────────

export interface TimelineEvent {
  timestamp: number;
  type: "plan_created" | "action_started" | "action_completed" | "action_failed" |
        "stage_entered" | "stage_completed" | "tool_executing" | "tool_completed" |
        "verification" | "reflection" | "supervisor_intervention" | "checkpoint" |
        "checkpoint_saved" | "session_created" | "cognition" |
        "worker_started" | "worker_completed" | "worker_output" |
        "procedure_stored" | "procedure_retrieved" |
        "error" | "status_change";
  message: string;
  metadata?: Record<string, unknown>;
}

// ─── Step Result ───────────────────────────────────────────

export interface StepResult {
  action: Action;
  result: ToolCallResult;
  verification: VerificationResult;
  reflection: ReflectionResult;
  timestamp: number;
}

// ─── Artifacts ─────────────────────────────────────────────

export interface Artifact {
  id: string;
  type: "file" | "output" | "screenshot" | "log" | "memory" | "procedure";
  name: string;
  path?: string;
  content?: string;
  size: number;
  sessionId: string;
  createdAt: number;
}

// ─── Logs ──────────────────────────────────────────────────

export interface SessionLog {
  level: "debug" | "info" | "warn" | "error";
  message: string;
  timestamp: number;
  stage?: PipelineStageName;
  nodeId?: string;
  worker?: WorkerName;
}

// ─── Confidence ────────────────────────────────────────────

export interface ConfidenceScore {
  score: number;                // 0.0 - 1.0
  factors: string[];
  suggestion?: string;
}

// ─── Scheduler ─────────────────────────────────────────────

export interface SchedulerConfig {
  maxConcurrent: number;
  maxConcurrentPerGroup: number;
  defaultTimeout: number;
  defaultMaxRetries: number;
  retryBackoffMs: number;
  priorityWeights: Record<string, number>;
  // Long-running task support
  maxTaskDuration: number;          // Max duration for a single task (ms)
  checkpointInterval: number;       // Checkpoint every N seconds
  enableBackgroundExecution: boolean; // Allow fire-and-forget execution
  maxBackgroundJobs: number;        // Max concurrent background jobs
}

export interface SchedulerState {
  queue: ScheduledJob[];
  running: ScheduledJob[];
  completed: ScheduledJob[];
  failed: ScheduledJob[];
  config: SchedulerConfig;
  backgroundJobs: BackgroundJob[];
  checkpoints: Checkpoint[];
}

export interface Checkpoint {
  id: string;
  sessionId: string;
  step: number;
  state: Record<string, unknown>;
  artifacts: string[];
  observations: string[];
  timestamp: number;
  duration: number;
}

export interface ScheduledJob {
  id: string;
  sessionId: string;
  priority: "low" | "normal" | "high" | "urgent";
  status: "queued" | "running" | "paused" | "completed" | "failed" | "cancelled";
  concurrencyGroup?: string;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  retryCount: number;
  maxRetries: number;
  timeout?: number;
  cancelRequested: boolean;
}

export interface BackgroundJob {
  id: string;
  sessionId: string;
  command: string;
  cwd: string;
  pid: number;
  status: "running" | "completed" | "failed" | "cancelled";
  output: string;
  startedAt: number;
  completedAt?: number;
  logFile?: string;
}

// ─── Runtime Events (SSE) ─────────────────────────────────

export type RuntimeEvent =
  | { type: "session_created"; sessionId: string; goal: string }
  | { type: "session_queued"; sessionId: string; priority: string }
  | { type: "session_started"; sessionId: string }
  | { type: "session_completed"; sessionId: string; summary: string }
  | { type: "session_failed"; sessionId: string; error: string }
  | { type: "session_paused"; sessionId: string }
  | { type: "session_resumed"; sessionId: string; checkpoint?: number }
  | { type: "plan_created"; sessionId: string; milestones: number }
  | { type: "plan_revised"; sessionId: string; revision: number }
  | { type: "stage_entered"; sessionId: string; stage: PipelineStageName }
  | { type: "stage_completed"; sessionId: string; stage: PipelineStageName; duration: number }
  | { type: "action_started"; sessionId: string; action: Action }
  | { type: "action_completed"; sessionId: string; actionId: string; success: boolean }
  | { type: "tool_executing"; sessionId: string; tool: string; parameters: Record<string, unknown> }
  | { type: "tool_completed"; sessionId: string; result: ToolCallResult }
  | { type: "worker_started"; sessionId: string; worker: WorkerName; task: string }
  | { type: "worker_output"; sessionId: string; worker: WorkerName; line: string }
  | { type: "worker_completed"; sessionId: string; worker: WorkerName; duration: number }
  | { type: "verification_passed"; sessionId: string; checks: number }
  | { type: "verification_failed"; sessionId: string; checks: number; shouldRetry: boolean }
  | { type: "reflection"; sessionId: string; observation: string; continue: boolean }
  | { type: "supervisor_intervention"; sessionId: string; decision: SupervisorDecision }
  | { type: "procedure_stored"; sessionId: string; procedureId: string; task: string }
  | { type: "procedure_retrieved"; sessionId: string; procedureId: string; task: string }
  | { type: "checkpoint_saved"; sessionId: string; stateId: string }
  | { type: "cognition"; sessionId: string; stage: string; message: string }
  | { type: "error"; message: string; context?: string; sessionId?: string };

// ─── Serialization ─────────────────────────────────────────

export interface SerializedSession {
  version: number;
  session: Session;
  graph?: ExecutionGraph;
  workerSessions?: WorkerSession[];
  schedulerJob?: ScheduledJob;
  timestamp: number;
}

// ─── Supervisor Config ─────────────────────────────────────

export interface SupervisorConfig {
  stuckThreshold: number;       // Same action N times = stuck
  retryLoopThreshold: number;   // Same retry N times = loop
  maxTimeWithoutProgress: number; // ms without new completed step
  budgetWarningPercent: number; // Warn at X% of budget
  autoSplitOnStuck: boolean;    // Auto-split objective if stuck
  autoReplanOnFailure: boolean; // Auto-replan after failure
}
