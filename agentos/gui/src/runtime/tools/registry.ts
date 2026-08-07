// ============================================================
// Tool Registry v2 — Semantic capabilities, structured tools
// ============================================================

import { exec, execSync } from "child_process";
import { readFile, writeFile, readdir, stat, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { join, dirname } from "path";
import { promisify } from "util";
import { homedir } from "os";
import { v4 as uuid } from "uuid";
import {
  ToolDefinition,
  ToolCallRequest,
  ToolCallResult,
  ConfidenceScore,
} from "../types";
import { renderVideo } from "./remotion";
import { renderAIVideo } from "./ai-video";

const execAsync = promisify(exec);

// Machine-agnostic defaults: resolved from the real home dir at load time so
// the same build works on any host. DATRO_DIR can be overridden per-machine.
const DEFAULT_HOME = homedir();
const DATRO_DIR = process.env.DATRO_DIR || join(DEFAULT_HOME, "datro");

// ─── Built-in Tool Definitions ─────────────────────────────

const BUILTIN_TOOLS: ToolDefinition[] = [
  {
    name: "terminal",
    category: "system",
    capability: "terminal",
    description: "Execute shell commands on the host system",
    parameters: [
      { name: "command", type: "string", description: "Shell command to execute", required: true },
      { name: "cwd", type: "string", description: "Working directory", required: false, default: DEFAULT_HOME },
      { name: "timeout", type: "number", description: "Timeout in milliseconds", required: false, default: 30000 },
    ],
    timeout: 600000,
    permissions: ["execute", "network", "read", "write", "dangerous"],
    retryPolicy: { maxRetries: 2, backoffMs: 2000 },
    tags: ["bash", "shell", "command", "system", "long-running"],
  },
  {
    name: "file_read",
    category: "file",
    capability: "filesystem",
    description: "Read file contents",
    parameters: [
      { name: "path", type: "string", description: "File path to read", required: true },
      { name: "offset", type: "number", description: "Line number to start from", required: false },
      { name: "limit", type: "number", description: "Max lines to read", required: false, default: 200 },
    ],
    timeout: 10000,
    permissions: ["read"],
    retryPolicy: { maxRetries: 0, backoffMs: 0 },
    tags: ["read", "file", "content"],
  },
  {
    name: "file_write",
    category: "file",
    capability: "filesystem",
    description: "Write content to a file",
    parameters: [
      { name: "path", type: "string", description: "File path to write", required: true },
      { name: "content", type: "string", description: "Content to write", required: true },
    ],
    timeout: 10000,
    permissions: ["read", "write"],
    retryPolicy: { maxRetries: 0, backoffMs: 0 },
    tags: ["write", "file", "create"],
  },
  {
    name: "file_search",
    category: "file",
    capability: "filesystem",
    description: "Find files by name pattern (glob)",
    parameters: [
      { name: "pattern", type: "string", description: "Glob pattern (e.g. **/*.ts)", required: true },
      { name: "path", type: "string", description: "Root directory to search from", required: false, default: DEFAULT_HOME },
    ],
    timeout: 15000,
    permissions: ["read"],
    retryPolicy: { maxRetries: 0, backoffMs: 0 },
    tags: ["find", "glob", "search"],
  },
  {
    name: "file_grep",
    category: "file",
    capability: "filesystem",
    description: "Search file contents by regex pattern",
    parameters: [
      { name: "pattern", type: "string", description: "Regex pattern to search for", required: true },
      { name: "path", type: "string", description: "Directory to search in", required: false, default: DEFAULT_HOME },
      { name: "include", type: "string", description: "File pattern to include (e.g. *.ts)", required: false },
    ],
    timeout: 15000,
    permissions: ["read"],
    retryPolicy: { maxRetries: 0, backoffMs: 0 },
    tags: ["grep", "search", "content", "regex"],
  },
  {
    name: "git",
    category: "code",
    capability: "git",
    description: "Execute git commands",
    parameters: [
      { name: "command", type: "string", description: "Git subcommand with args (e.g. 'status', 'log --oneline -5')", required: true },
      { name: "cwd", type: "string", description: "Repository path", required: false, default: DATRO_DIR },
    ],
    timeout: 120000,
    permissions: ["execute", "read", "write"],
    retryPolicy: { maxRetries: 2, backoffMs: 2000 },
    tags: ["git", "version-control", "vcs", "long-running"],
  },
  {
    name: "python",
    category: "code",
    capability: "python",
    description: "Execute Python code or scripts",
    parameters: [
      { name: "code", type: "string", description: "Python code to execute", required: true },
      { name: "timeout", type: "number", description: "Timeout in milliseconds", required: false, default: 30000 },
    ],
    timeout: 600000,
    permissions: ["execute", "read", "write"],
    retryPolicy: { maxRetries: 2, backoffMs: 2000 },
    tags: ["python", "script", "code", "long-running"],
  },
  {
    name: "service_check",
    category: "system",
    capability: "terminal",
    description: "Check if a service is running and responding",
    parameters: [
      { name: "name", type: "string", description: "Service name", required: true },
      { name: "url", type: "string", description: "Health check URL", required: false },
    ],
    timeout: 10000,
    permissions: ["read", "network"],
    retryPolicy: { maxRetries: 2, backoffMs: 2000 },
    tags: ["health", "service", "monitor"],
  },
  {
    name: "pm2",
    category: "system",
    capability: "terminal",
    description: "Manage PM2 processes",
    parameters: [
      { name: "action", type: "string", description: "PM2 action (start, stop, restart, list, logs, save)", required: true, enum: ["start", "stop", "restart", "list", "logs", "save"] },
      { name: "name", type: "string", description: "Process name or config file", required: false },
      { name: "args", type: "string", description: "Additional arguments", required: false },
    ],
    timeout: 60000,
    permissions: ["execute", "read", "write"],
    retryPolicy: { maxRetries: 2, backoffMs: 2000 },
    tags: ["pm2", "process", "service", "long-running"],
  },
  {
    name: "web_fetch",
    category: "web",
    capability: "browser",
    description: "Fetch content from a URL",
    parameters: [
      { name: "url", type: "string", description: "URL to fetch", required: true },
      { name: "format", type: "string", description: "Response format", required: false, default: "text", enum: ["text", "html", "markdown"] },
    ],
    timeout: 60000,
    permissions: ["network", "read"],
    retryPolicy: { maxRetries: 3, backoffMs: 5000 },
    tags: ["fetch", "http", "web", "url", "long-running"],
  },
  {
    name: "memory_search",
    category: "memory",
    capability: "memory",
    description: "Search the agent's memory and vault for relevant knowledge",
    parameters: [
      { name: "query", type: "string", description: "Search query", required: true },
      { name: "limit", type: "number", description: "Max results", required: false, default: 5 },
    ],
    timeout: 10000,
    permissions: ["read"],
    retryPolicy: { maxRetries: 0, backoffMs: 0 },
    tags: ["search", "memory", "knowledge", "vault"],
  },
  {
    name: "memory_store",
    category: "memory",
    capability: "memory",
    description: "Store a piece of knowledge in memory",
    parameters: [
      { name: "key", type: "string", description: "Memory key or title", required: true },
      { name: "content", type: "string", description: "Content to store", required: true },
      { name: "category", type: "string", description: "Category (e.g. decision, observation, fact)", required: false },
    ],
    timeout: 10000,
    permissions: ["write"],
    retryPolicy: { maxRetries: 0, backoffMs: 0 },
    tags: ["store", "memory", "knowledge"],
  },
  {
    name: "delegate",
    category: "agent",
    capability: "software_engineer",
    description: "Delegate a task to a specialist agent (OpenCode, Kilo, etc.)",
    parameters: [
      { name: "agent", type: "string", description: "Agent to delegate to", required: true, enum: ["opencode", "kilo", "hermes"] },
      { name: "task", type: "string", description: "Task description for the agent", required: true },
      { name: "context", type: "string", description: "Additional context or file paths", required: false },
    ],
    timeout: 300000,
    permissions: ["execute", "read", "write"],
    retryPolicy: { maxRetries: 1, backoffMs: 5000 },
    tags: ["delegate", "agent", "specialist"],
  },
  {
    name: "web_search",
    category: "web",
    capability: "browser",
    description: "Search the web for information",
    parameters: [
      { name: "query", type: "string", description: "Search query", required: true },
      { name: "numResults", type: "number", description: "Number of results", required: false, default: 5 },
    ],
    timeout: 30000,
    permissions: ["network"],
    retryPolicy: { maxRetries: 2, backoffMs: 3000 },
    tags: ["search", "web", "query"],
  },
  {
    name: "file_list",
    category: "file",
    capability: "filesystem",
    description: "List files and directories at a path",
    parameters: [
      { name: "path", type: "string", description: "Directory path to list", required: true },
      { name: "recursive", type: "boolean", description: "List recursively", required: false, default: false },
    ],
    timeout: 10000,
    permissions: ["read"],
    retryPolicy: { maxRetries: 0, backoffMs: 0 },
    tags: ["list", "directory", "ls"],
  },
  {
    name: "subagent",
    category: "agent",
    capability: "agent",
    description: "Spawn a subagent (opencode, kilo, or hermes) to run a task independently with unrestricted permissions",
    parameters: [
      { name: "agent", type: "string", description: "Agent to spawn (opencode, kilo, hermes)", required: true, enum: ["opencode", "kilo", "hermes"] },
      { name: "task", type: "string", description: "Task description for the subagent", required: true },
      { name: "context", type: "string", description: "Additional context or file paths", required: false },
      { name: "timeout", type: "number", description: "Timeout in milliseconds (default: 1 hour)", required: false, default: 3600000 },
    ],
    timeout: 3600000, // 1 hour
    permissions: ["execute", "read", "write", "network", "dangerous"],
    retryPolicy: { maxRetries: 1, backoffMs: 5000 },
    tags: ["subagent", "delegate", "agent", "spawn", "long-running"],
  },
  {
    name: "background_exec",
    category: "system",
    capability: "terminal",
    description: "Execute a shell command in the background and poll for results. Returns a jobId for status checking.",
    parameters: [
      { name: "command", type: "string", description: "Shell command to execute in background", required: true },
      { name: "cwd", type: "string", description: "Working directory", required: false, default: DEFAULT_HOME },
      { name: "timeout", type: "number", description: "Max runtime in milliseconds", required: false, default: 3600000 },
    ],
    timeout: 10000,
    permissions: ["execute", "read", "write", "network", "dangerous"],
    retryPolicy: { maxRetries: 0, backoffMs: 0 },
    tags: ["background", "async", "long-running", "daemon"],
  },
  {
    name: "system_info",
    category: "system",
    capability: "terminal",
    description: "Get system resource usage (CPU, memory, disk, swap)",
    parameters: [],
    timeout: 5000,
    permissions: ["read"],
    retryPolicy: { maxRetries: 0, backoffMs: 0 },
    tags: ["system", "resources", "monitor", "health"],
  },
  {
    name: "remotion",
    category: "media",
    capability: "video",
    description: "Generate a video using Remotion. Abstract/stylized templates: TextAnimation, TitleCard, GradientBg, Shapes.",
    parameters: [
      { name: "composition", type: "string", description: "Template: TextAnimation, TitleCard, GradientBg, Shapes. Use Scene only for abstract themes.", required: false },
      { name: "duration", type: "number", description: "Duration in seconds (default: 5, max: 30)", required: false, default: 5 },
      { name: "output", type: "string", description: "Output filename", required: false },
      { name: "props", type: "string", description: "JSON string of template props.", required: false },
    ],
    timeout: 600000, // 10 min
    permissions: ["execute", "write"],
    retryPolicy: { maxRetries: 1, backoffMs: 5000 },
    tags: ["video", "remotion", "media", "render"],
  },
  {
    name: "ai-video",
    category: "media",
    capability: "video",
    description: "Generate literal video content using scene scripts. Template options: dance, nature, city, space, fire, snow. No text overlays by default.",
    parameters: [
      {
        name: "scene",
        type: "string",
        description: "Scene template: dance, nature, city, space, fire, snow. For characters: {subject: string, action: string, background: string, colors: string[]}",
        required: true
      },
      {
        name: "duration",
        type: "number",
        description: "Duration in seconds (1-30)",
        required: true
      },
      {
        name: "props",
        type: "object",
        description: "Scene-specific properties (character/entity details)",
        required: false,
      }
    ],
    timeout: 600000,
    permissions: ["execute", "write"],
    retryPolicy: { maxRetries: 1, backoffMs: 5000 },
    tags: ["video", "svg", "ai-video"],
  },
];

// ─── Tool Registry ─────────────────────────────────────────

export class ToolRegistry {
  private tools: Map<string, ToolDefinition> = new Map();
  private executors: Map<string, (req: ToolCallRequest) => Promise<ToolCallResult>> = new Map();

  constructor() {
    // Register all built-in tools
    for (const tool of BUILTIN_TOOLS) {
      this.tools.set(tool.name, tool);
    }

    // Register built-in executors
    this.registerExecutor("terminal", this.execTerminal.bind(this));
    this.registerExecutor("file_read", this.execFileRead.bind(this));
    this.registerExecutor("file_write", this.execFileWrite.bind(this));
    this.registerExecutor("file_search", this.execFileSearch.bind(this));
    this.registerExecutor("file_grep", this.execFileGrep.bind(this));
    this.registerExecutor("file_list", this.execFileList.bind(this));
    this.registerExecutor("git", this.execGit.bind(this));
    this.registerExecutor("python", this.execPython.bind(this));
    this.registerExecutor("service_check", this.execServiceCheck.bind(this));
    this.registerExecutor("pm2", this.execPm2.bind(this));
    this.registerExecutor("subagent", this.execSubagent.bind(this));
    this.registerExecutor("background_exec", this.execBackgroundExec.bind(this));
    this.registerExecutor("system_info", this.execSystemInfo.bind(this));
    this.registerExecutor("web_fetch", this.execWebFetch.bind(this));
    this.registerExecutor("remotion", this.execRemotion.bind(this));
    this.registerExecutor("ai-video", this.execAIVideo.bind(this));
  }

  // ─── Public API ────────────────────────────────────────

  registerTool(tool: ToolDefinition): void {
    this.tools.set(tool.name, tool);
  }

  registerExecutor(toolName: string, executor: (req: ToolCallRequest) => Promise<ToolCallResult>): void {
    this.executors.set(toolName, executor);
  }

  getTool(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  listTools(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  getToolsByCapability(capability: string): ToolDefinition[] {
    return this.listTools().filter((t) => t.capability === capability);
  }

  getToolsByCategory(category: string): ToolDefinition[] {
    return this.listTools().filter((t) => t.category === category);
  }

  getToolsByTag(tag: string): ToolDefinition[] {
    return this.listTools().filter((t) => t.tags.includes(tag));
  }

  // Map a semantic capability name to available tools
  resolveCapability(capability: string): ToolDefinition[] {
    return this.listTools().filter(
      (t) => t.capability === capability || t.tags.includes(capability)
    );
  }

  async execute(request: ToolCallRequest): Promise<ToolCallResult> {
    const tool = this.tools.get(request.tool);
    if (!tool) {
      return this.buildErrorResult(request, `Tool not found: ${request.tool}`);
    }

    const executor = this.executors.get(request.tool);
    if (!executor) {
      return this.buildErrorResult(request, `No executor for tool: ${request.tool}`);
    }

    const start = Date.now();
    try {
      const result = await Promise.race([
        executor(request),
        this.timeout(tool.timeout).then(() =>
          this.buildErrorResult(request, `Tool timed out after ${tool.timeout}ms`)
        ),
      ]);
      result.duration = Date.now() - start;
      return result;
    } catch (err) {
      return this.buildErrorResult(
        request,
        err instanceof Error ? err.message : String(err)
      );
    }
  }

  // Build a compact prompt describing available tools
  buildToolPrompt(): string {
    const tools = this.listTools();
    const lines: string[] = [];
    lines.push("Available tools (emit JSON code block):");
    lines.push("```json");
    lines.push('{"tool": "<name>", "args": {<params>}}');
    lines.push("```");
    lines.push("");
    lines.push("Available capabilities and their tools:");

    const byCapability = new Map<string, ToolDefinition[]>();
    for (const t of tools) {
      if (!byCapability.has(t.capability)) byCapability.set(t.capability, []);
      byCapability.get(t.capability)!.push(t);
    }

    for (const [cap, capTools] of byCapability) {
      lines.push(`  ${cap}: ${capTools.map((t) => t.name).join(", ")}`);
    }

    lines.push("");
    lines.push("Rules:");
    lines.push("- Emit exactly one tool call per response as a JSON code block");
    lines.push("- Use semantic capability names when possible");
    lines.push("- Include reasoning in a comment field if needed");
    lines.push("- If no tool is needed, respond normally");

    return lines.join("\n");
  }

  // ─── Built-in Executors ────────────────────────────────

  private async execTerminal(req: ToolCallRequest): Promise<ToolCallResult> {
    const command = String(req.parameters.command || "");
    const cwd = String(req.parameters.cwd || DEFAULT_HOME);
    const timeout = Number(req.parameters.timeout || 30000);

    try {
      const { stdout, stderr } = await execAsync(command, { cwd, timeout });
      return this.buildSuccessResult(req, (stdout + (stderr ? "\nSTDERR: " + stderr : "")).trim());
    } catch (err: any) {
      const output = [err.stdout, err.stderr, err.message].filter(Boolean).join("\n").trim();
      return this.buildErrorResult(req, output || "Command failed");
    }
  }

  private async execFileRead(req: ToolCallRequest): Promise<ToolCallResult> {
    const filePath = String(req.parameters.path || "");
    try {
      const content = await readFile(filePath, "utf-8");
      const lines = content.split("\n");
      const offset = Number(req.parameters.offset) || 0;
      const limit = Number(req.parameters.limit) || 200;
      const sliced = lines.slice(offset, offset + limit).join("\n");
      return this.buildSuccessResult(req, sliced, { totalLines: lines.length, returnedLines: Math.min(limit, lines.length - offset) });
    } catch (err: any) {
      return this.buildErrorResult(req, err.message);
    }
  }

  private async execFileWrite(req: ToolCallRequest): Promise<ToolCallResult> {
    const filePath = String(req.parameters.path || "");
    const content = String(req.parameters.content || "");
    try {
      await mkdir(dirname(filePath), { recursive: true });
      await writeFile(filePath, content, "utf-8");
      return this.buildSuccessResult(req, `Written ${content.length} bytes to ${filePath}`);
    } catch (err: any) {
      return this.buildErrorResult(req, err.message);
    }
  }

  private async execFileSearch(req: ToolCallRequest): Promise<ToolCallResult> {
    const pattern = String(req.parameters.pattern || "");
    const root = String(req.parameters.path || DEFAULT_HOME);
    try {
      const { stdout } = await execAsync(`find ${root} -name "${pattern}" -type f 2>/dev/null | head -50`, { timeout: 15000 });
      return this.buildSuccessResult(req, stdout.trim() || "No files found");
    } catch (err: any) {
      return this.buildErrorResult(req, err.message);
    }
  }

  private async execFileGrep(req: ToolCallRequest): Promise<ToolCallResult> {
    const pattern = String(req.parameters.pattern || "");
    const root = String(req.parameters.path || DEFAULT_HOME);
    const include = req.parameters.include ? String(req.parameters.include) : undefined;
    const includeArg = include ? `--include="${include}"` : "";
    try {
      const { stdout } = await execAsync(
        `rg -n "${pattern}" ${includeArg} "${root}" 2>/dev/null | head -100`,
        { timeout: 15000 }
      );
      return this.buildSuccessResult(req, stdout.trim() || "No matches found");
    } catch (err: any) {
      return this.buildErrorResult(req, err.stdout?.trim() || "No matches found");
    }
  }

  private async execFileList(req: ToolCallRequest): Promise<ToolCallResult> {
    const dirPath = String(req.parameters.path || DEFAULT_HOME);
    const recursive = Boolean(req.parameters.recursive);
    try {
      const cmd = recursive
        ? `find "${dirPath}" -maxdepth 3 -type f 2>/dev/null | head -100`
        : `ls -la "${dirPath}" 2>/dev/null`;
      const { stdout } = await execAsync(cmd, { timeout: 10000 });
      return this.buildSuccessResult(req, stdout.trim());
    } catch (err: any) {
      return this.buildErrorResult(req, err.message);
    }
  }

  private async execGit(req: ToolCallRequest): Promise<ToolCallResult> {
    const command = String(req.parameters.command || "status");
    const cwd = String(req.parameters.cwd || DATRO_DIR);
    try {
      const { stdout, stderr } = await execAsync(`git ${command}`, { cwd, timeout: 30000 });
      return this.buildSuccessResult(req, (stdout + (stderr ? "\n" + stderr : "")).trim());
    } catch (err: any) {
      return this.buildErrorResult(req, [err.stdout, err.stderr, err.message].filter(Boolean).join("\n").trim());
    }
  }

  private async execPython(req: ToolCallRequest): Promise<ToolCallResult> {
    const code = String(req.parameters.code || "");
    const timeout = Number(req.parameters.timeout || 30000);
    try {
      const { stdout, stderr } = await execAsync(`python3 -c '${code.replace(/'/g, "'\\''")}'`, { timeout });
      return this.buildSuccessResult(req, (stdout + (stderr ? "\nSTDERR: " + stderr : "")).trim());
    } catch (err: any) {
      const output = [err.stdout, err.stderr, err.message].filter(Boolean).join("\n").trim();
      return this.buildErrorResult(req, output || "Command failed");
    }
  }

  private async execServiceCheck(req: ToolCallRequest): Promise<ToolCallResult> {
    const name = String(req.parameters.name || "");
    const url = String(req.parameters.url || "");

    if (url) {
      try {
        const { stdout } = await execAsync(`curl -s -o /dev/null -w '%{http_code}' "${url}" --max-time 5`, { timeout: 10000 });
        const status = parseInt(stdout.trim());
        return this.buildSuccessResult(req, JSON.stringify({ name, url, status, up: status >= 200 && status < 400 }));
      } catch (err: any) {
        return this.buildErrorResult(req, JSON.stringify({ name, url, up: false, error: err.message }));
      }
    }

    // PM2-based check
    try {
      const { stdout } = await execAsync("pm2 jlist 2>/dev/null", { timeout: 10000 });
      const processes = JSON.parse(stdout || "[]");
      const proc = processes.find((p: any) => p.name === name || p.name?.includes(name));
      if (proc) {
        return this.buildSuccessResult(req, JSON.stringify({
          name, status: proc.pm2_env?.status, pid: proc.pid,
          up: proc.pm2_env?.status === "online",
          restarts: proc.pm2_env?.restart_time,
          memory: proc.monit?.memory,
          cpu: proc.monit?.cpu,
        }));
      }
      return this.buildErrorResult(req, `Service not found: ${name}`);
    } catch (err: any) {
      return this.buildErrorResult(req, err.message);
    }
  }

  private async execPm2(req: ToolCallRequest): Promise<ToolCallResult> {
    const action = String(req.parameters.action || "list");
    const name = String(req.parameters.name || "");
    const args = String(req.parameters.args || "");

    const cmdMap: Record<string, string> = {
      list: "pm2 jlist",
      start: `pm2 start ${name} ${args}`,
      stop: `pm2 stop ${name}`,
      restart: `pm2 restart ${name}`,
      logs: `pm2 logs ${name} --lines 20 --nostream`,
      save: "pm2 save",
    };

    const cmd = cmdMap[action] || `pm2 ${action} ${name} ${args}`;
    try {
      const { stdout, stderr } = await execAsync(cmd, { timeout: 15000 });
      return this.buildSuccessResult(req, (stdout + (stderr ? "\nSTDERR: " + stderr : "")).trim());
    } catch (err: any) {
      return this.buildErrorResult(req, [err.stdout, err.stderr, err.message].filter(Boolean).join("\n").trim());
    }
  }

  private async execSubagent(req: ToolCallRequest): Promise<ToolCallResult> {
    const agent = String(req.parameters.agent || "opencode");
    const task = String(req.parameters.task || "");
    const context = String(req.parameters.context || "");
    const timeout = Number(req.parameters.timeout || 3600000);

    try {
      const { execSync } = require("child_process");
      const cmd = agent === "opencode"
        ? `opencode --quiet --task "${task.replace(/"/g, '\"')}"`
        : agent === "kilo"
        ? `kilo --quiet --task "${task.replace(/"/g, '\"')}"`
        : `hermes --yolo --task "${task.replace(/"/g, '\"')}"`;

      const output = execSync(cmd, {
        cwd: DEFAULT_HOME,
        timeout,
        env: { ...process.env, HERMES_YOLO: "1", EXEC_MODE: "unrestricted", DELEGATE_TASK: task },
        encoding: "utf-8",
      });
      return this.buildSuccessResult(req, output.trim() || "Subagent task completed");
    } catch (err: any) {
      return this.buildErrorResult(req, err.message || "Subagent task failed");
    }
  }

  private async execBackgroundExec(req: ToolCallRequest): Promise<ToolCallResult> {
    const command = String(req.parameters.command || "");
    const cwd = String(req.parameters.cwd || DEFAULT_HOME);
    const timeout = Number(req.parameters.timeout || 3600000);

    try {
      const { exec } = require("child_process");
      const proc = exec(`nohup ${command} > /tmp/background_${Date.now()}.log 2>&1 & echo $!`, {
        cwd,
        timeout: 10000,
        env: { ...process.env, HERMES_YOLO: "1", EXEC_MODE: "unrestricted" },
      });

      let jobId = "";
      proc.stdout?.on("data", (data: { toString(): string }) => { jobId = data.toString().trim(); });

      await new Promise((resolve) => { proc.on("close", resolve); });

      return this.buildSuccessResult(req, JSON.stringify({
        jobId,
        status: "running",
        command,
        cwd,
        logFile: `/tmp/background_${Date.now()}.log`,
        message: "Background job started. Use the 'terminal' tool with 'tail -f /tmp/background_*.log' to monitor progress.",
      }));
    } catch (err: any) {
      return this.buildErrorResult(req, err.message || "Failed to start background job");
    }
  }

  private async execSystemInfo(req: ToolCallRequest): Promise<ToolCallResult> {
    try {
      const { stdout } = await execAsync(
        `free -m | awk 'NR==2{printf "Memory: %s/%sMB (%.1f%%)", $3,$2,$3*100/$2}' && echo "" && df -h / | awk 'NR==2{printf "Disk: %s/%s (%s used)", $3,$2,$5}' && echo "" && uptime | awk -F'load average:' '{print "Load:" $2}'`,
        { timeout: 5000 }
      );
      return this.buildSuccessResult(req, stdout.trim());
    } catch (err: any) {
      return this.buildErrorResult(req, err.message);
    }
  }

  private async execWebFetch(req: ToolCallRequest): Promise<ToolCallResult> {
    const url = String(req.parameters.url || "");
    const format = String(req.parameters.format || "text");
    try {
      const { stdout } = await execAsync(`curl -sL "${url}" --max-time 30 | head -c 50000`, { timeout: 35000 });
      return this.buildSuccessResult(req, stdout.trim());
    } catch (err: any) {
      return this.buildErrorResult(req, err.message);
    }
  }

  private async execRemotion(req: ToolCallRequest): Promise<ToolCallResult> {
    // Delegates to remotion.ts renderVideo: non-blocking detached spawn
    // (avoids the request being killed when the API response sends), software
    // GL (swangle), half-resolution rendering for this low-memory Celeron,
    // and returns a jobId in metadata that route.ts polls via getRenderJob().
    try {
      const result = await renderVideo(req.parameters);
      return {
        id: uuid(),
        tool: req.tool,
        success: result.success,
        output: result.output,
        error: result.error,
        duration: 0,
        timestamp: Date.now(),
        confidence: {
          score: result.success ? 0.9 : 0.1,
          factors: result.success ? ["Render started"] : [result.error || "Render failed"],
        },
        retryCount: 0,
        ...(result.metadata ? { metadata: result.metadata } : {}),
      };
    } catch (err: any) {
      return this.buildErrorResult(req, `Remotion render failed: ${err.message}`);
    }
  }

  private async execAIVideo(req: ToolCallRequest): Promise<ToolCallResult> {
    try {
      const result = await renderAIVideo(req.parameters);
      return {
        id: uuid(),
        tool: req.tool,
        success: result.success,
        output: result.output || "",
        error: result.error,
        duration: 0,
        timestamp: Date.now(),
        confidence: {
          score: result.success ? 0.9 : 0.1,
          factors: result.success ? ["Video generation started"] : [result.error || "Video generation failed"],
        },
        retryCount: 0,
        ...(result.metadata ? { metadata: result.metadata } : {}),
      };
    } catch (err: any) {
      return this.buildErrorResult(req, `AI video generation failed: ${err.message}`);
    }
  }

  // ─── Helpers ───────────────────────────────────────────

  private buildSuccessResult(req: ToolCallRequest, output: string, metadata?: Record<string, unknown>): ToolCallResult {
    return {
      id: uuid(),
      tool: req.tool,
      success: true,
      output,
      duration: 0,
      timestamp: Date.now(),
      confidence: { score: 0.9, factors: ["Direct execution succeeded"] },
      retryCount: 0,
      ...(metadata ? { metadata } : {}),
    };
  }

  private buildErrorResult(req: ToolCallRequest, error: string): ToolCallResult {
    return {
      id: uuid(),
      tool: req.tool,
      success: false,
      output: "",
      error,
      duration: 0,
      timestamp: Date.now(),
      confidence: { score: 0.1, factors: ["Execution failed"], suggestion: "Check command or parameters" },
      retryCount: 0,
    };
  }

  private timeout(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export default new ToolRegistry();