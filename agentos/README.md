# AgentOS Child Proxy

Local AI agent stack for voice chat + task execution.

## Architecture

```
Voice/Text → OmniRoute → ollama (MiniCPM5-1B) → Chat Response
                ↓
Task Router → Detect task intent → opencode/kilo (agentic, MCP tools)
```

- **Chat mode**: Free local LLM (MiniCPM5-1B via ollama)
- **Task mode**: Routes to opencode/kilo with harness, scaffolding, MCP, tools
- **Voice**: edge-tts (local, free neural voices) + Groq Whisper (STT, cloud, free)

## Services

| Service | Port | Description |
|---------|------|-------------|
| agentos-gui | 3000 | Next.js web GUI |
| omniroute-lite | 20128 | LLM proxy (ollama backend) |
| voice-service | 3101 | TTS via edge-tts |
| task-router | 3200 | Task detection + agentic routing |

## Quick Start

```bash
# Install everything
./install.sh

# Start services
pm2 start ecosystem.config.js

# Save PM2 config
pm2 save
```

## Models

- **MiniCPM5-1B** (688MB Q4_K_M) — Local inference via ollama
- No paid cloud models required

## Task Routing

The task router detects whether input is chat or a task:
- **Chat** → ollama (free, local)
- **Task** → opencode → kilo (agentic, MCP tools, file system access)

Task patterns: create, write, build, make, generate, fix, debug, refactor, deploy, test, install, configure, etc.

## Files

- `gui/` — Next.js AgentOS web GUI
- `omniroute/` — LLM proxy (ollama backend)
- `voice-service/` — TTS via edge-tts
- `task-router.mjs` — Task detection + agentic routing
- `ecosystem.config.js` — PM2 process config
- `install.sh` — One-click installer
