# AgentOS Lifecycle

This document describes the lifecycle of a prompt through the AgentOS local
stack, and the idle/on-demand policy that governs when heavy processes run.

## States

A FinanceCheque node is always in one of these states:

| State              | What is running                                  | How you get there |
|--------------------|--------------------------------------------------|-------------------|
| **Idle**           | GUI :3000 only. All child-proxy / LLM / router stopped. | Boot, or after `releaseAfterAnswer()` finishes. |
| **Warming**        | ollama + omniroute starting; task-router starting on demand. | Prompt arrives (cold). |
| **Active**         | Full stack + an in-flight request (chat or task). | Prompt arrives; model warm. |
| **Releasing**      | Stack shutting down after a deliverable.          | `releaseAfterAnswer()` fires ~15 s after the answer. |

## The prompt lifecycle

```
         prompt
            │
            ▼
   ┌───────────────────────────┐
   │ Idle ──► Warming ──► Active│   (gate: ensureLLMStack)
   └───────────────────────────┘
            │  order of work:
            │   1. engageMainAgent()  — boot + warm ollama/omniroute
            │   2. queryGraphRAG()     — knowledge context for the prompt
            │   3. classifyTask()      — ask task-router :3200
            │
            │  ┌─ type=TASK ──► opencode/kilo executes, return result
            ├──┤─ type=CHAT ──► hermes ─ then MiniCPM via omniroute
            │  └─ unreachable ─► gate-start router, retry, else
            │                      report "agent_unavailable"
            │   4. (fallback) chatWithCloud() if the whole local stack is down
            │
            ▼
        answer delivered  ──►  releaseAfterAnswer()
                                    │  (~15 s settle, re-arms if busy)
                                    ▼
                                Releasing  ──►  Idle
```

## Gate rules

1. Nothing LLM-heavy runs at boot. Only `agentos-gui.service` is enabled.
2. A prompt cold-starts the stack; the first reply may take longer (model load).
3. After the answer, `releaseAfterAnswer()` stops the stack — it does not sit
   warmed for the full idle timeout.
4. The idle watchdog (default 30 min) is the backstop for abandoned sessions.
5. `releaseAfterAnswer()` re-arms while the stack is still settling but never
   holds longer than `LLM_AFTER_ANSWER_MAX_MS` (default 10 min).
6. Task prompts gate-start `task-router` too. A task is never silently treated
   as chat when the router is down — the user is told the agent is unavailable.

## Task vs chat discrimination

`agentos/task-router.mjs` `isTask()`:

- Strip politeness prefixes first (`please`, `help me`, `can you`, `I want you
  to`).
- Short chat patterns and questions short-circuit to chat.
- Strong task verbs (`install`, `download`, `fix`, `create`, `write`, `build`,
  `configure`, `deploy`, `refactor`, `delete`, …) → task.
- Bare "help"/"please" / short sentences → chat.

## Release semantics

Every change ships as a `financecheque-v{major}.{minor}.{patch}` release (golden
rule). Nodes converge by OTA update, not by hand-patching individual machines.

## Troubleshooting

- **GUI shows an old `latest` version after updating:** the OTA updater's
  build-after-pull ordering (v1.11.1). Re-run `update-checker.sh`; confirm the
  running `next-server` was restarted after the build.
- **A "task" prompt only gets a chat reply:** the agentic backend is down.
  v1.11.1 surfaces `agent_unavailable` and gate-starts task-router. Check
  `opencode`/the agent stack is installed and `task-router :3200` comes up.
- **Stack never idles:** check `llm-gate.ts` `releaseAfterAnswer()` wiring and
  the idle watchdog; heavy processes should stop after the deliverable.