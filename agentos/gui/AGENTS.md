# AgentOS GUI — Agent Instructions

You are operating within the AgentOS GUI project — a Next.js web dashboard for an autonomous AI runtime running on a single Celeron laptop with 3.4GB RAM.

## Architecture

This is a **harness + scaffolding** pattern:
- **Harness** = the runtime that manages agent sessions, tools, and execution
- **Scaffolding** = the pre-built templates, procedures, and patterns agents follow
- **Memory** = shared knowledge store (Obsidian vault at `~/brain`)

The agent is NOT a monolithic LLM call. It is a **pipeline**:
1. **WebGUI** → user input captured (text or voice)
2. **Router** → cloud LLM classifies intent (CHAT/EXEC/MATH/VIDEO/TOOL)
3. **Dispatcher** → routes to appropriate handler
4. **Executor** → runs tool, shell command, or returns response
5. **TTS** → voice output via Piper + Web Audio API

## Key Principles (from opencode patterns)

### Brain-First Protocol
Before answering or acting, always:
1. Search the vault (`~/brain`) for relevant knowledge
2. Check existing decisions and procedures
3. Act only when you have context

### Minimal Prompt, Maximal Tools
- Don't over-explain in system prompts
- Give agents powerful tools and trust their reasoning
- Tools: terminal, file operations, git, python, web, memory, remotion (video)

### Phase-Gated Procedures
- Don't skip steps in multi-phase workflows
- "No red command, no Phase 2" — verify before proceeding
- Each phase must complete before the next begins

### Falsifiable Hypotheses
When diagnosing problems, require:
- "If X is the cause, then changing Y will make the bug disappear"
- "If Z is true, then changing W will make it worse"
- Forces testable claims, not vague hunches

### Decision Logging
Every significant action gets logged to:
- `~/brain/Personal/Agent Decisions/` — structured decision logs
- Rationale, alternatives considered, expected consequences

## Tool Registry

17 registered tools:
- **System**: terminal, service_check, pm2, system_info
- **File**: file_read, file_write, file_search, file_grep, file_list
- **Code**: git, python
- **Web**: web_fetch, web_search
- **Memory**: memory_search, memory_store
- **Agent**: delegate (opencode, kilo, hermes)
- **Media**: remotion (video generation)

## Memory Pipeline

Three layers, converging in the vault:
1. **Mem0** (cloud) — semantic recall, daily sync to vault
2. **Hermes built-in** — MEMORY.md, USER.md, session summaries
3. **Honcho** (cloud) — structured peer observations (currently unavailable)

## Terminal Architecture

The terminal uses a **real PTY** (pseudo-terminal) for full terminal emulation:
- **Frontend**: `@xterm/xterm` v6 + `@xterm/addon-fit` in the browser
- **WebSocket**: `server/pty-server.js` (Node.js, port 3001, pm2-managed)
- **PTY Bridge**: `server/pty_bridge.py` (Python stdlib `pty.fork`, JSON-line protocol over stdin/stdout)
- Bash has a ~7s startup delay on this Celeron; the bridge handles this transparently via select loop
- On-screen keyboard sends keystrokes to PTY via WebSocket (no local echo)
- Supports: top, htop, opencode, kilo, hermes, vim, and any full-screen terminal program
- Old `/api/term` route (child_process.exec wrapper) deleted

## Version Scheme

**Format**: `v0.{branch}.{X}.{Y}` — NEVER deviate.
- `{branch}` = branch number (1-26)
- `{X}` = floor(release_counter / 100)
- `{Y}` = release_counter % 100

## Best Practices

1. **Brain-first**: Search vault before answering from scratch
2. **Log decisions**: Every significant action gets a decision log
3. **Permissions**: Bash allowed, destructive commands require confirmation
4. **Context isolation**: Use handoff documents between sessions
5. **Vocabulary**: Use domain terms consistently, maintain glossary
