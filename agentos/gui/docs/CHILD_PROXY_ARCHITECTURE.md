# Child Proxy Architecture

## Overview

The child proxy is a lightweight local AI stack installed on any Linux machine, laptop, Raspberry Pi, or Android phone (Termux). It registers with the FinanceCheque parent proxy at `financecheque.uk` and provides a full WebGUI at `localhost:3000`.

OpenClaw is a separate system and is **not** part of this stack.

## Services (managed by pm2)

| Service | Port | Role |
|---------|------|------|
| `agentos-gui` | 3000 | Next.js WebGUI — chat, terminal, pipeline view |
| `child-proxy` | 4001 | OpenAI-compatible proxy agent, registers with parent |
| `llama-server` | 8090 | Local LLM runtime (MiniCPM-1B Q4_K_M, ~700MB RAM) |
| `pty-server` | 3001 | WebSocket PTY bridge (real bash via xterm.js) |
| `voice-service` | local | Whisper STT + Piper TTS |

## Local Inference Stack

```
Browser → WebGUI :3000 → child-proxy :4001 → llama-server :8090 (MiniCPM-1B)
```

Fallback path (when local LLM is overloaded or request needs cloud):
```
child-proxy :4001 → parent proxy (financecheque.uk) → Cloud LLM (Groq/OpenRouter/Gemini/Mistral)
```

## Agent CLI Tools

All three tools are installed and configured to use `localhost:4001/v1` as their LLM endpoint:

- **kiro-cli** — Kiro AI coding agent (`kiro chat`)
- **kilo (kilocode)** — Kilo coding assistant (`kilo`)
- **hermes** — General-purpose agent with memory and tool use (`hermes`)

Hermes config lives at `~/.hermes/config.yaml` — local-first, parent fallback.

## Voice Pipeline

```
Mic → Whisper STT → child-proxy :4001 → MiniCPM-1B :8090 → Piper TTS → Speaker
```

- **STT**: Groq Whisper API (fast, free tier) or local `openai-whisper` (offline)
- **TTS**: Piper (local, instant) or Google Cloud TTS
- **Push-to-talk**: mic button in WebGUI chat
- **Continuous voice**: duplex button — auto-looping 3s capture windows
- **Auto-speak**: toggle in WebGUI status bar

## Routing Policy (Loop Prevention)

```
Child Proxy receives request:
  X-Forwarded: true  →  LOCAL LLM ONLY (came from parent)
  else               →  Forward to parent proxy
                         On failure: fall back to local LLM

Parent Proxy receives request:
  X-Forwarded: true  →  CLOUD LLM ONLY (never route to children)
  X-Agentic: true    →  Route to agentic child node
  X-Chat-Only: true  →  Cloud LLM directly
  else               →  Route to available child
                         NEVER back to the requesting child
```

## Install

```bash
curl -fsSL https://www.financecheque.uk/fcukproxy/install.sh | bash
```

After install: `http://localhost:3000/chat`
