# Agent Harness — Configuration & Design

## Overview

The AgentOS harness is the runtime infrastructure that manages agent sessions, tool execution, and response generation. It follows the opencode pattern of **minimal prompts, maximal tools**.

## Pipeline Architecture

```
User Input (text/voice)
    ↓
WebGUI (Next.js)
    ↓
Router (cloud LLM: Groq → OpenRouter → Cerebras → Google → Mistral)
    ↓
Dispatcher (classify: CHAT/EXEC/MATH/VIDEO/TOOL)
    ↓
Executor (tool registry, shell, remotion)
    ↓
Response (text/voice/video)
```

## Components

### 1. Cloud Router (`src/lib/cloud-router.ts`)
- Priority chain: Groq → OpenRouter → Cerebras → Google → Mistral
- API keys from `~/.llm_keys`
- Free-tier providers, no paid cloud LLMs
- Timeout: 15-30s per provider

### 2. Chat API (`src/app/api/chat/route.ts`)
- Pure switchboard: every prompt goes to cloud LLM
- Cloud LLM classifies as CHAT/EXEC/MATH/VIDEO
- Only pure math (`2+2`) bypasses LLM
- Returns: reply, routed, dependency, provider

### 3. Tool Registry (`src/runtime/tools/registry.ts`)
- 17 tools with executors
- Each tool has: name, category, capability, parameters, timeout, permissions
- Tools registered at startup, executed via `ToolRegistry.execute()`

### 4. Agent Loop (`src/runtime/loop.ts`)
- Hybrid architecture: LLM planner + tool executor
- Procedure-first planning: check procedures before generating plans
- LLM fallback: if no procedure matches, generate plan from prompt
- Dual parsing: JSON array format + terminal command format

### 5. Session Manager (`src/runtime/session-manager.ts`)
- Lifecycle: queued → planning → running → completed/failed
- Persistence: sessions saved to disk
- Events: SSE streaming for real-time updates

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
- Loaded from `~/.agents/skills/`
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
