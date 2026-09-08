# Agent Harness — Configuration & Design

## Overview

The AgentOS harness is the runtime infrastructure that manages agent sessions, tool execution, and response generation. It follows the opencode pattern of **minimal prompts, maximal tools**.

## Pipeline Architecture

Local-first routing. The chat/voice path prefers the on-node stack and only
reaches a cloud LLM when the entire local stack is unavailable:

```
User Input (text/voice)
    ↓
WebGUI (Next.js) / voicemail
    ↓
Classifier (task-router :3200 — local, classifies CHAT vs TASK)
    ├─ CHAT → Hermes built-in (local) → MiniCPM5-1B via OmniRoute (:20128)
    └─ TASK → opencode → kilo → kiro (delegate, located locally)
             (each refused → retried once with a tool-use directive)
    ↓
Cloud LLM fallback — only if the local stack is entirely unavailable
(Router: Groq → OpenRouter → Cerebras → Google → Mistral, then the
ROUTER_SYSTEM classifier parses EXEC:/MATH:/VIDEO:/DELEGATE: prefixes)
    ↓
Response (text/voice/video)
```

## Components

### 1. Local Router / Classifier (`agentos/task-router.mjs`)
- Runs on :3200 (loopback-only, optional shared-secret).
- Classifies each prompt as `chat` (→ ollama via OmniRoute) or `task`
  (→ opencode → kilo → kiro fallback chain, each executed via the
  tool-use wrapper so files/tools/permissions are granted).
- Per-task ledger for crash-resume; refusal detection with a single
  tool-use directive retry.

### 2. Chat Route (`src/app/api/chat/route.ts`)
- `routeThroughLocalStack()` first: attempts classify → task-router → local
  brain (Hermes / MiniCPM5 via OmniRoute), all locally.
- Only if the entire local stack is unavailable does it fall back to the
  cloud-LLM priority chain (Groq → OpenRouter → Cerebras → Google → Mistral).
- Returns: reply, routed, dependency, provider.

### 3. Tool Registry (`src/runtime/tools/registry.ts`)
- Tools registered at startup, executed via `ToolRegistry.execute()`.
- Both the chat route and the agent loop share this registry.

### 4. Agent Loop (`src/runtime/loop.ts`)
- Hybrid architecture: LLM planner + tool executor.
- Procedure-first planning: check procedures (procedures/skills) before
  generating plans. LLM fallback only when no procedure matches.

### 5. Session Manager (`src/runtime/session-manager.ts`)
- Lifecycle: queued → planning → running → completed/failed.
- Persistence: sessions saved to disk. Events: SSE streaming for real-time updates.

## Scaffolding Patterns

### Pre-built Templates
- **Remotion templates**: TextAnimation, TitleCard, GradientBg, Shapes
- **Chat routes**: CHAT, EXEC, MATH, VIDEO, TOOL, MCP
- **Tool parameters**: Each tool has typed parameters with defaults

### Procedures
- Stored in `~/.agentos/procedures/`
- JSON format: goal, steps, tool, parameters
- Agent checks procedures before generating plans
- If procedure matches, execute directly (no LLM)

### Skills
- Loaded from `~/.fcukproxy/skills/` (durable per-node state tracked in
  `~/.fcukproxy/skills/skill.state.json`, per the OTA manifest).
- YAML frontmatter: name, description, mode
- Markdown body: instructions, examples, edge cases
- Agent reads skill and follows procedure

## Memory System

### Vault Structure
```
~/brain/
├── INDEX.md
├── Personal/
│   ├── Memory/          # Episodic memory
│   ├── Agent Decisions/  # Decision logs
│   └── Templates/        # Reusable templates
└── Projects/
    └── datro/           # Branch notes (29 branches)
```

### Memory Pipeline
1. **Mem0** (cloud) → semantic recall
2. **Hermes** (built-in) → MEMORY.md, USER.md
3. **Honcho** (cloud) → peer observations
4. **Vault** (local) → persistent knowledge store

### Memory Store
- `memory_search`: query vault for relevant knowledge
- `memory_store`: save key observations to vault
- Daily cron at 2:30am syncs Mem0 to vault

## Performance Constraints

- **RAM**: 3.4GB total, ~248MB available
- **CPU**: 2 cores, Intel Celeron N3350 @ 1.10GHz
- **Swap**: 13GB
- **Disk**: 15GB free

### Optimization Strategies
- Concurrency: 1 for all rendering (Chrome, FFmpeg)
- Model: 1B parameter (MiniCPM5), Q4_K_M quantization
- Context: 32K KV cache for local LLM
- Timeout: 30s for most tools, 120s for video rendering

## Guardrails

### Tool Loop Limits
- Warn after 2 same-tool failures
- Hard stop after 8 failures
- Warn after 2 idempotent-no-progress
- Hard stop after 5 idempotent-no-progress

### Permissions
- Bash: generally allowed
- Destructive commands: require confirmation
- External directories: ask first unless in brain/projects

### Context Management
- Protect first 3, last 20 messages
- Target compression ratio: 0.2
- Auto-compaction enabled
