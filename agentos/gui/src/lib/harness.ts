// ============================================================
// Harness — Cline-style cherry-picked features
// Session context, plan/act, checkpoints, approvals, caching
// ============================================================

import { mkdir, readdir, readFile, writeFile, unlink, stat } from "fs/promises";
import { join } from "path";
import { LLMClient } from "@/runtime/engines/llm";

// ─── Deterministic hash (djb2) ────────────────────────────

export function hashString(str: string): string {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h + str.charCodeAt(i)) | 0;
  }
  return "h" + (h >>> 0).toString(36);
}

// ─── Session context + compaction ─────────────────────────

const ROUTER_WINDOW = 8;
const ROUTER_MAX_CHARS = 8000;
const SUMMARY_SYSTEM =
  "You are a conversation summarizer for an AI assistant. Below is chat history. " +
  "Condense it into a short factual summary that preserves key facts, user preferences, " +
  "commands that were run, and any unresolved requests. Do not add or invent anything. " +
  "Output only the summary text.";

async function summarizeHistory(messages: Array<{ role: string; content: string }>): Promise<string> {
  const text = messages.map((m) => `${m.role}: ${m.content}`).join("\n---\n");
  const llm = new LLMClient({ model: "minicpm5-32k" });
  const res = await llm.chat(SUMMARY_SYSTEM, text.slice(-6000));
  return res.content.trim();
}

// Returns the classifier message list: system prompt, then the last 8 messages.
// If the history exceeds 8000 chars, older messages are summarized via the
// local model into a single "[condensed history]" user message. Never throws.
export async function buildRouterMessages(
  messages: Array<{ role: string; content: string }>,
  systemPrompt: string
): Promise<Array<{ role: string; content: string }>> {
  const history = messages.filter((m) => m.role !== "system");
  const recent = history.slice(-ROUTER_WINDOW);
  const older = history.slice(0, -ROUTER_WINDOW);
  const totalChars = history.reduce((n, m) => n + (m.content || "").length, 0);

  if (totalChars > ROUTER_MAX_CHARS && older.length > 0) {
    try {
      const summary = await summarizeHistory(older);
      if (summary) {
        return [
          { role: "system", content: systemPrompt },
          { role: "user", content: `${summary} [condensed history]` },
          ...recent,
        ];
      }
    } catch {}
  }

  return [{ role: "system", content: systemPrompt }, ...recent];
}

// ─── Checkpoints ──────────────────────────────────────────

const CHECKPOINT_ROOT = process.env.HOME ? join(process.env.HOME, ".fcukproxy", "checkpoints") : "";

// Cap checkpoint growth per session and by age (WS3). Keeps crashes resumable
// without letting ~/.fcukproxy/checkpoints balloon across many sessions/prompts.
const MAX_CHECKPOINTS_PER_SESSION = 50;
const CHECKPOINT_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export interface CheckpointData {
  mode?: string;
  messages?: Array<{ role: string; content: string }>;
  intent?: unknown;
  tool?: string;
}

export async function saveCheckpoint(sessionId: string, data: CheckpointData): Promise<string | null> {
  try {
    if (!CHECKPOINT_ROOT) return null;
    const dir = join(CHECKPOINT_ROOT, String(sessionId));
    await mkdir(dir, { recursive: true });
    const id = Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
    const checkpoint = {
      id,
      sessionId: String(sessionId),
      mode: data.mode,
      messages: data.messages,
      intent: data.intent,
      tool: data.tool,
      timestamp: Date.now(),
    };
    await writeFile(join(dir, `${id}.json`), JSON.stringify(checkpoint, null, 2), "utf-8");
    await pruneCheckpoints(dir);
    return id;
  } catch (err) {
    console.error("[harness] saveCheckpoint failed:", err);
    return null;
  }
}

// Keep a session's checkpoint dir bounded: drop anything older than the max age
// and, after that, the oldest beyond MAX_CHECKPOINTS_PER_SESSION.
async function pruneCheckpoints(dir: string): Promise<void> {
  try {
    const entries = await readdir(dir);
    const files = entries.filter((f) => f.endsWith(".json"));
    const now = Date.now();
    const meta: Array<{ file: string; mtimeMs: number }> = [];
    for (const f of files) {
      const p = join(dir, f);
      try {
        const st = await stat(p);
        meta.push({ file: f, mtimeMs: st.mtimeMs });
      } catch { /* file vanished */ }
    }
    // Age eviction
    const fresh = meta.filter((m) => now - m.mtimeMs <= CHECKPOINT_MAX_AGE_MS);
    const stale = meta.filter((m) => now - m.mtimeMs > CHECKPOINT_MAX_AGE_MS);
    await Promise.all(stale.map((m) => unlink(join(dir, m.file)).catch(() => {})));
    // Count eviction — keep newest N
    fresh.sort((a, b) => b.mtimeMs - a.mtimeMs);
    await Promise.all(fresh.slice(MAX_CHECKPOINTS_PER_SESSION).map((m) => unlink(join(dir, m.file)).catch(() => {})));
  } catch (err) {
    console.error("[harness] pruneCheckpoints failed:", err);
  }
}

export async function listCheckpoints(sessionId: string): Promise<Array<Record<string, unknown>>> {
  try {
    if (!CHECKPOINT_ROOT) return [];
    const dir = join(CHECKPOINT_ROOT, String(sessionId));
    const files = await readdir(dir);
    const out: Array<Record<string, unknown>> = [];
    for (const f of files.filter((f) => f.endsWith(".json"))) {
      try {
        const raw = JSON.parse(await readFile(join(dir, f), "utf-8"));
        out.push({
          id: raw.id || f.replace(/\.json$/, ""),
          sessionId: raw.sessionId || sessionId,
          mode: raw.mode,
          tool: raw.tool,
          intent: raw.intent,
          timestamp: raw.timestamp,
        });
      } catch {}
    }
    out.sort((a, b) => (Number(b.timestamp) || 0) - (Number(a.timestamp) || 0));
    return out;
  } catch {
    return [];
  }
}

export async function restoreCheckpoint(sessionId: string, checkpointId: string): Promise<any | null> {
  try {
    if (!CHECKPOINT_ROOT) return null;
    const dir = join(CHECKPOINT_ROOT, String(sessionId));
    const filename = checkpointId.endsWith(".json") ? checkpointId : `${checkpointId}.json`;
    const raw = await readFile(join(dir, filename), "utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// ─── Approval rules (granular permissions) ────────────────

function parsePatterns(list: string[]): RegExp[] {
  const out: RegExp[] = [];
  for (const p of list) {
    try {
      out.push(new RegExp(p));
    } catch {}
  }
  return out;
}

function envPatterns(envVar: string | undefined): RegExp[] {
  if (!envVar) return [];
  return parsePatterns(
    envVar
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  );
}

export function checkApproval(
  command: string,
  allow: string[] = [],
  deny: string[] = []
): { allowed: boolean; reason?: string } {
  const denyPatterns = envPatterns(process.env.EXEC_DENY_PATTERNS).concat(parsePatterns(deny));
  const allowPatterns = envPatterns(process.env.EXEC_ALLOW_PATTERNS).concat(parsePatterns(allow));

  for (const p of denyPatterns) {
    if (p.test(command)) return { allowed: false, reason: `Denied by pattern: ${p.source}` };
  }

  if (allowPatterns.length > 0) {
    for (const p of allowPatterns) {
      if (p.test(command)) return { allowed: true };
    }
    return { allowed: false, reason: "Command is not in the allowlist" };
  }

  return { allowed: true };
}

// ─── Route-level response cache (LRU + TTL) ───────────────

interface CacheEntry {
  value: any;
  expiresAt: number;
}

const ROUTER_CACHE_MAX = 128;
const ROUTER_CACHE_TTL = 15 * 60 * 1000;
const routerCache = new Map<string, CacheEntry>();

export function cacheKey(systemPrompt: string, lastUserMessage: string): string {
  return hashString(systemPrompt + "\u0000" + lastUserMessage);
}

export function getRouterCache(key: string): any | undefined {
  const entry = routerCache.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    routerCache.delete(key);
    return undefined;
  }
  return entry.value;
}

export function cacheRouter(key: string, response: any): void {
  if (routerCache.size >= ROUTER_CACHE_MAX) {
    const now = Date.now();
    for (const [k, v] of routerCache) {
      if (v.expiresAt <= now) {
        routerCache.delete(k);
        break;
      }
    }
    if (routerCache.size >= ROUTER_CACHE_MAX) {
      const oldestKey = routerCache.keys().next().value;
      if (oldestKey !== undefined) routerCache.delete(oldestKey);
    }
  }
  routerCache.set(key, { value: response, expiresAt: Date.now() + ROUTER_CACHE_TTL });
}

// Drop every cached router reply so the next prompt is re-classified
// fresh. Used on hang-up: a call is its own session, and a stale cached
// reply from a previous call must never surface in the next one.
export function clearRouterCache(): void {
  routerCache.clear();
}

// ─── Plan mode helpers ────────────────────────────────────

export function parsePlanSteps(reply: string): string[] {
  const text = reply.replace(/^PLAN:/i, "").trim();
  const steps = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => /^\d+[\.\)]/.test(l))
    .map((l) => l.replace(/^\d+[\.\)]\s*/, "").trim());
  return steps.length > 0 ? steps : text ? [text] : [];
}
