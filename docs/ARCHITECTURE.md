# FinanceCheque Architecture

This document describes the runtime architecture of the `financecheque` branch
(the AgentOS child-proxy network). It is the reference for "what runs always-on,
what's gated, and where the code lives."

## Deployment model

A `financecheque` node is a 2–8 GB machine (laptop, Raspberry Pi, cheap VPS) that
sells compute/leads into the FCUK network. It runs a local AI stack that is
**idle by default**: only the web GUI is continuously resident; every heavy
dependency is woken per prompt and released after the deliverable.

```
                financecheque.uk (parent proxy / Cloudflare Pages + D1)
                                   │
              ┌────────────────────┼────────────────────┐
              │                    │                    │
        Child Proxy A          Child Proxy B        Child Proxy C
        (port 6100)            (port 6100)          (port 6100)
              └─────── each runs the AgentOS local stack ───────┘
```

Each node independently owns:

- The **AgentOS WebGUI** on port 3000 (always-on).
- The **child proxy** on port 4001 (gated — started on prompt).
- The **Main Agent local AI stack** (ollama + omniroute + task-router),
  engaged on prompt and released after the answer.

## The AgentOS local stack (under `agentos/`)

| Service        | Port   | Role                                                            | Gated? |
|----------------|--------|-----------------------------------------------------------------|--------|
| `agentos-gui`  | 3000   | Next.js chat/voice web app (`agentos/gui`)                      | No — always-on |
| `omniroute`    | 20128  | OpenAI-compatible LLM proxy in front of ollama (`omniroute/proxy.mjs`) | Yes |
| `task-router`  | 3200   | Classifies prompts; routes tasks to opencode/kilo (`task-router.mjs`) | Yes |
| voice-service | 3101/3102 | Whisper STT + edge-tts (`voice-service/`)                       | Yes |
| ollama (system) | 11434 | Local model server (`minicpm5`, 688 MB)                          | Yes |

Dependency graph:

```
WebGUI :3000 ──> POST /api/chat
                   ├─> task-router :3200  (/route)  ──> opencode/kilo  (task)
                   ├─> hermes support agent           (chat)
                   └─> omniroute :20128 ──> ollama    (chat fallback, minicpm5)
```

## On-demand gate (`agentos/gui/src/lib/llm-gate.ts`)

- `ensureLLMStack()` cold-starts ollama + omniroute, waits for readiness, warms
  the model.
- `releaseAfterAnswer()` stops the stack ~15 s after an answer is delivered
  (re-arming while the model is still settling, bounded by
  `LLM_AFTER_ANSWER_MAX_MS`).
- The idle watchdog stops the stack after 30 min without a prompt.
- `chat/route.ts` also gate-starts `task-router` on a detected task (Bug B fix,
  v1.11.1) so tasks are executed rather than silently ignored.

## Chat routing (`agentos/gui/src/app/api/chat/route.ts`)

1. `engageMainAgent()` — switch profile to hermes-proxy, boot + warm the LLM
   stack on demand.
2. Query GraphRAG for context.
3. `classifyTask()` → POST to `task-router /route`:
   - `type: task` → return the agentic result (opencode/kilo).
   - `type: chat` → ask hermes, then MiniCPM via omniroute.
   - unreachable → gate-start the router, retry once, else report
     `agent_unavailable`.
4. Cloud fallback (`chatWithCloud`) only if the whole local stack is down; it can
   still return `EXEC:`/`DELEGATE:` tool instructions that perform operations.

## Task router (`agentos/task-router.mjs`)

- Loopback-only bind (`127.0.0.1`), optional `TASK_ROUTER_TOKEN` shared secret
  on `/route` (WS6, v1.11.1).
- `isTask()` classifies prompts after stripping politeness prefixes (`please`,
  `help me`, `can you`), with regex fast-path + verb heuristic. No LLM
  dependency in the hot path.

## Child proxy (`child-proxy.js`, `public/fcukproxy/agent.py`)

- The node's connection to the parent on port 6100 / 4001.
- Registers with the parent, polls for work, reports results, earns credits.
- Local peer discovery via UDP multicast.

## Installers (canonical entrypoints)

See `AGENTS.md` → "Canonical Installer Entrypoints". The two you most likely
care about:

- `public/fcukproxy/install.sh` — full child-proxy + GUI + optional local LLM.
- `agentos/install.sh` — AgentOS local stack from a checkout.

## OTA update path

`public/fcukproxy/update-checker.sh` runs on a timer, fetches the newest version,
pulls/applies the new source, **re-syncs + rebuilds the GUI after the pull**, then
restarts services and writes `.local-version`. This ordering guarantees the GUI
never serves a stale bundle after an update (Bug A fix, v1.11.1).

## Data / state

| Path                        | Purpose                                    |
|-----------------------------|--------------------------------------------|
| `~/.fcukproxy/checkpoints/` | Session checkpoints, pruned (WS3)          |
| `~/.fcukproxy/skills/`      | Durable per-node skill state               |
| `~/.fcukproxy/omniroute/`   | Deployed mirror of omniroute proxy         |
| `~/.fcukproxy/agentos-gui/` | Deployed GUI source (built via OTA)        |
| `schema.sql` / D1           | Parent-side tables (`proxy_nodes`, etc.)   |