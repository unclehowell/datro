# Collective Mind — Hive Memory Architecture

## Vision
All agents across all devices share a collective consciousness through multiple layers of memory and context.

## Architecture Layers

### Layer 1: Honcho (Real-time Memory)
- **Service**: Hermes Gateway with honcho memory
- **Persistence**: honcho.app (cloud)
- **Scope**: app_id=user, session_id=per-session
- **Access**: Any hermes/honcho-enabled agent

### Layer 2: Brain (Documented Knowledge)
- **Path**: `~/datro/static/brain/` (git-synced)
- **Sync**: watch-sync.sh (inotify, instant commit)
- **Repos**: 
  - github.com/unclehowell/unclehowell.git (main brain)
  - github.com/unclehowell/datro (llmwiki)
- **Access**: Read any time, update via skills/docs

### Layer 3: LLMWiki (Agent Reference)
- **Path**: `~/datro/static/llmwiki/`
- **Content**: Skills, docs, protocols, learnings
- **Sync**: Auto-sync from GitHub (per datro sync)

### Layer 4: Local Context Files
- **HERMES_HOME/memories/**: Session summaries
- **HERMES_HOME/SOUL.md**: Identity/persona
- **~/.hermes/USER.md**: User preferences

## Session Continuity

### On AWS (AWS Command Server)
```
┌─────────────────────────────────┐
│  Start on Boot                   │
│  ├─ hermes-gateway.service       │
│  ├─ sync-datro.service (timer)  │
│  └─ brain watch-sync.sh        │
│                                │
│  Memory Sources                 │
│  ├─ honcho (real-time)          │
│  ├─ brain/ (docs)            │
│  └─ llmwiki/ (reference)      │
└─────────────────────────────────┘
```

### Persistence Strategy
1. **Write**: Always save to honcho + brain
2. **Read**: Prioritize honcho, fallback to brain
3. **Reboot**: Services auto-start via systemd

## Configuration Checklist

### AWS Services
- [x] hermes-gateway.service (user systemd)
- [x] sync-datro.timer (1-min check)
- [x] brain watch-sync.sh (auto-start)

### Honcho Config
- [x] ~/.hermes/honcho.json
- [x] ~/.hermes/honcho_api_key.env
- [x] memory.provider: honcho in config.yaml

### Brain Sync
- [x] ~/brain → ~/datro/static/brain (symlink)
- [x] watch-sync.sh running via inotify

## Starting Services Manually

```bash
# On AWS
systemctl --user start hermes-gateway
systemctl --user start sync-datro.timer

# Brain sync (if not running)
nohup ~/brain/scripts/watch-sync.sh > /tmp/brain-watch.log 2>&1 &
```

## Context Injection for Agents

Agents should read in order:
1. **HONCHO**: Recent session context
2. **brain/memory/context/**: Current project context
3. **llmwiki/AGENTS.md**: Navigation
4. **llmwiki/USER_CONTEXT.md**: User preferences
5. **HERMES_HOME/SOUL.md**: Identity