// ============================================================
// Tool Calling Protocol v2 — JSON structured tool calls
// ============================================================

import { v4 as uuid } from "uuid";
import { homedir } from "os";
import { join } from "path";
import { ToolCallRequest, ToolDefinition, ConfidenceScore } from "../types";

const DEFAULT_HOME = homedir();

// ─── Tool Call Emission (Model Output → Structured Request) ─

export interface ParsedToolCall {
  tool: string;
  args: Record<string, unknown>;
  confidence: ConfidenceScore;
}

// Parse model output for structured tool calls
// Supports: JSON code blocks, compact JSON, legacy ACTION: format
export function parseToolCall(output: string): ParsedToolCall | null {
  // 1. Try JSON code block: ```json\n{...}\n```
  const jsonBlockMatch = output.match(/```json\s*\n?([\s\S]*?)\n?\s*```/);
  if (jsonBlockMatch) {
    try {
      const parsed = JSON.parse(jsonBlockMatch[1]);
      const result = validateToolCall(parsed);
      if (result) return result;
    } catch { /* not valid JSON, continue */ }
  }

  // 2. Try raw JSON object on its own line
  const lines = output.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      try {
        const parsed = JSON.parse(trimmed);
        const result = validateToolCall(parsed);
        if (result) return result;
      } catch { /* not valid JSON, continue */ }
    }
  }

  // 3. Try inline JSON anywhere in the output
  const inlineJsonMatch = output.match(/\{[^{}]*"tool"[^{}]*"args"[^{}]*\}/);
  if (inlineJsonMatch) {
    try {
      const parsed = JSON.parse(inlineJsonMatch[0]);
      const result = validateToolCall(parsed);
      if (result) return result;
    } catch { /* not valid JSON */ }
  }

  // 4. Fallback: legacy ACTION: format
  const actionMatch = output.match(/ACTION:\s*(\w+)\(([^)]*)\)/);
  if (actionMatch) {
    const tool = actionMatch[1];
    const argsStr = actionMatch[2];
    const args = parseLegacyArgs(argsStr);
    return {
      tool,
      args,
      confidence: { score: 0.5, factors: ["Legacy ACTION: format (fallback)"], suggestion: "Model should emit JSON code blocks" },
    };
  }

  return null;
}

function validateToolCall(obj: Record<string, unknown>): ParsedToolCall | null {
  if (!obj.tool || typeof obj.tool !== "string") return null;
  const args = (obj.args && typeof obj.args === "object") ? obj.args as Record<string, unknown> : {};
  return {
    tool: obj.tool,
    args,
    confidence: { score: 0.95, factors: ["Valid JSON tool call"] },
  };
}

function parseLegacyArgs(argsStr: string): Record<string, unknown> {
  const args: Record<string, unknown> = {};
  const paramMatches = argsStr.matchAll(/(\w+)=("([^"]*)"|'([^']*)'|(\S+))/g);
  for (const m of paramMatches) {
    const key = m[1];
    const val = m[3] ?? m[4] ?? m[5];
    args[key] = val;
  }
  return args;
}

// ─── Tool Call Emission (Structured Request → Model Prompt) ─

export function buildToolPrompt(tools: ToolDefinition[]): string {
  const lines: string[] = [];

  lines.push("## Available Tools");
  lines.push("");
  lines.push("To use a tool, emit a JSON code block in your response:");
  lines.push("```json");
  lines.push('{"tool": "tool_name", "args": {"param": "value"}}');
  lines.push("```");
  lines.push("");

  // Group by category
  const byCategory = new Map<string, ToolDefinition[]>();
  for (const t of tools) {
    if (!byCategory.has(t.category)) byCategory.set(t.category, []);
    byCategory.get(t.category)!.push(t);
  }

  for (const [cat, catTools] of byCategory) {
    lines.push(`### ${cat.charAt(0).toUpperCase() + cat.slice(1)}`);
    for (const t of catTools) {
      const params = t.parameters
        .filter((p) => p.required)
        .map((p) => `${p.name}: ${p.type}`)
        .join(", ");
      lines.push(`- **${t.name}**: ${t.description}`);
      if (params) lines.push(`  Required params: ${params}`);
    }
    lines.push("");
  }

  lines.push("Rules:");
  lines.push("1. Emit exactly ONE tool call per response as a JSON code block");
  lines.push("2. Use the exact tool name from the list above");
  lines.push("3. Include all required parameters");
  lines.push("4. If no tool is needed, respond normally without a code block");
  lines.push("5. After receiving a tool result, analyze it and decide what to do next");

  return lines.join("\n");
}

// ─── Compact Prompt (for tight contexts) ──────────────────

export function buildCompactToolPrompt(tools: ToolDefinition[]): string {
  const toolLines = tools.map((t) => {
    const req = t.parameters.filter((p) => p.required).map((p) => p.name).join(",");
    return `  ${t.name}(${req}) — ${t.description}`;
  });

  return [
    "To use a tool, emit: ```json\n{\"tool\":\"name\",\"args\":{...}}\n```",
    ...toolLines,
    "One tool call per response. No tool needed? Reply normally.",
  ].join("\n");
}

// ─── Intent Detection (for simple commands) ────────────────

export interface IntentMatch {
  command: string;
  description: string;
  confidence: number;
}

const INTENT_PATTERNS: Array<{ pattern: RegExp; command: (m: RegExpMatchArray) => string; description: string }> = [
  { pattern: /what time|current time|what('s| is) the time/i, command: () => "date", description: "Current time" },
  { pattern: /what day|what('s| is) (the )?date/i, command: () => "date '+%A, %B %d, %Y'", description: "Current date" },
  { pattern: /disk (space|usage|free|available)/i, command: () => "df -h / | awk 'NR==2{print $5\" used of \"$2\" (\"$3\" free)\"}'", description: "Disk usage" },
  { pattern: /memory (usage|free|available|status)/i, command: () => "free -m | awk 'NR==2{printf \"%s/%sMB (%.1f%%)\",$3,$2,$3*100/$2}'", description: "Memory usage" },
  { pattern: /(running|list) (processes|pm2|services)/i, command: () => "pm2 list", description: "Running processes" },
  { pattern: /system (info|status|health)/i, command: () => "free -m | awk 'NR==2{printf \"Memory: %s/%sMB (%.1f%%)\", $3,$2,$3*100/$2}' && echo '' && df -h / | awk 'NR==2{printf \"Disk: %s/%s (%s used)\", $3,$2,$5}' && echo '' && uptime", description: "System info" },
  { pattern: /network|internet|ping|connection/i, command: () => "curl -s -o /dev/null -w 'HTTP %{http_code} in %{time_total}s' https://www.google.com --max-time 5", description: "Network check" },
  { pattern: /list (files|dir|directory)(?: in| of)? (.+)/i, command: (m) => `ls -la ${m[2]}`, description: "List files" },
  { pattern: /list (files|dir|directory)/i, command: () => "ls -la", description: "List current directory" },
  { pattern: /git (status|log|diff|branch)/i, command: (m) => `git ${m[1]}`, description: "Git operation" },
  { pattern: /pm2 (list|status|save)/i, command: (m) => `pm2 ${m[1]}`, description: "PM2 operation" },
  { pattern: /uptime/i, command: () => "uptime", description: "System uptime" },
  { pattern: /whoami/i, command: () => "whoami", description: "Current user" },
  { pattern: /hostname/i, command: () => "hostname", description: "System hostname" },
  { pattern: /kernel|uname/i, command: () => "uname -a", description: "System info" },
  { pattern: /process(es)? (count|total|number)/i, command: () => "ps aux | wc -l", description: "Process count" },
  { pattern: /disk (list|partitions)/i, command: () => "lsblk", description: "Disk partitions" },
  { pattern: /env(ironment)?( vars)?/i, command: () => "env | sort | head -30", description: "Environment variables" },
  { pattern: /which (.+)/i, command: (m) => `which ${m[1]}`, description: "Find command location" },
  { pattern: /where(is| to find) (.+)/i, command: (m) => `find ${DEFAULT_HOME} -name "${m[2]}" -type f 2>/dev/null | head -10`, description: "Find file" },
  { pattern: /generate (a )?website/i, command: () => `bash ${join(DEFAULT_HOME, "agentos-gui", "scripts", "gen-website.sh")}`, description: "Generate website" },
];

export function detectIntent(message: string): IntentMatch | null {
  const trimmed = message.trim();

  for (const { pattern, command, description } of INTENT_PATTERNS) {
    const match = trimmed.match(pattern);
    if (match) {
      return {
        command: command(match),
        description,
        confidence: 0.9,
      };
    }
  }

  return null;
}
