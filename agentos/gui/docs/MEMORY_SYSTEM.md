# Memory System — Design & Configuration

## Overview

The memory system is a 3-layer pipeline that converges in the Obsidian vault. It provides semantic recall, episodic memory, and persistent knowledge storage.

## Architecture

```
Layer 1: Mem0 (Cloud)
    ↓ daily cron sync
Layer 2: Hermes Built-in
    ↓ auto-generated
Layer 3: Honcho (Cloud)
    ↓ (currently unavailable)
Convergence: Obsidian Vault (~/brain)
```

## Layer 1: Mem0 (Cloud Semantic Recall)

### Purpose
- Semantic search over conversation history
- Find relevant memories by meaning, not keywords
- Cloud-based, requires API key

### Configuration
- User: `sion`
- Provider: `mem0`
- Daily cron: 2:30am syncs to vault
- Script: `~/bin/sync_mem0.py`

### Usage
- `memory_search`: query Mem0 for relevant memories
- `memory_store`: save key observations to Mem0
- Automatic: daily sync captures all new memories

## Layer 2: Hermes Built-in Memory

### Purpose
- Auto-generated during conversations
- Stores preferences, episodic context, session summaries
- Local, no cloud dependency

### Files
- `MEMORY.md`: conversation summaries, key facts
- `USER.md`: user preferences, habits, settings
- `CONTEXT.md`: project-specific terminology

### Configuration (from `~/.hermes/config.yaml`)
- Max char limit: 2200
- User limit: 1375 chars
- Provider: Mem0 (for semantic search)
- Consolidation: every 168 hours (7 days)
- Stale after: 30 days
- Prune builtins: false

## Layer 3: Honcho (Structured Observations)

### Purpose
- Structured peer observations
- Multi-user memory sharing
- Currently unavailable (tenant cold storage)

### Status
- Last active: unknown
- Resume at: app.honcho.dev
- Impact: minimal (Mem0 + Hermes cover most use cases)

## Convergence: Obsidian Vault

### Structure
```
~/brain/
├── INDEX.md                    # Root index, links both hemispheres
├── Personal/                   # General intelligence (blue)
│   ├── Memory/                 # Episodic memory
│   │   ├── version-scheme.md   # Mandatory versioning rules
│   │   └── ...
│   ├── Agent Decisions/        # Decision logs
│   │   ├── flywheel/           # Release system decisions
│   │   ├── config/             # Configuration decisions
│   │   └── ...
│   ├── 00 - Templates/         # Reusable templates
│   └── Integrations/           # External service configs
└── Projects/                   # Codebase notes (orange)
    └── datro/                  # 29 branch notes
        ├── command.md
        ├── gui.md
        ├── financecheque.md
        └── ...
```

### Hemispheres (Graph View Colors)
- **Personal/** (blue, left): General intelligence, memories, templates
- **Projects/** (orange, right): Codebase project notes
- **INDEX.md** (grey, center): Root index linking both

### Branch Notes
29 branch notes under `Projects/datro/`:
- BP vs Buckler: bpvsbuckler, bpvsbuckler-redflag, bucklervsbp, rerelease, wayback
- Agent/Flywheel: command, command-agent-endpoint, cnei, ceo, financecheque, financecheque-monday-agent, gh-pages
- Finance: financecheque, financecheque-monday-agent, carfinancecheque
- UI: gui, ui, dash, althea
- Core: datro, dcc, ccan, llmwiki, pirateclaw, whitepaper, wave, bw_base, subrepos
- Steering: hbnb, library, v0.8

## Usage Patterns

### Brain-First Protocol
Before any action:
1. Search vault for relevant knowledge
2. Check existing decisions
3. Act only with context

### Decision Logging
For any non-trivial action:
- Log to `Personal/Agent Decisions/<project>/<date>-<topic>.md`
- Use template at `Personal/00 - Templates/agent/decision-log.md`
- Include: decision, rationale, alternatives, consequences

### Post-Action Recording
After completing a task:
- Update relevant branch notes in `Projects/datro/`
- Log key outcomes to decision log
- Optionally trigger `sync_mem0.py` for fresh memories

## Sync Pipeline

### Daily Cron (2:30am)
```bash
~/bin/sync_mem0.py
```
- Pulls new memories from Mem0 cloud
- Writes to `Personal/Memory/` in vault
- Deduplicates by content hash
- Updates timestamps

### Manual Sync
```bash
python3 ~/bin/sync_mem0.py
```
- Force sync at any time
- Useful after large conversation sessions

## Performance

### Vault Size
- 33 branch notes
- ~50 decision logs
- ~20 templates
- Total: ~5MB

### Search Speed
- Obsidian search: <100ms
- Mem0 semantic: <500ms
- Hermes built-in: instant (in-memory)

### Memory Limits
- Mem0: unlimited (cloud)
- Hermes: 2200 chars per memory
- Vault: unlimited (local disk)
- Context window: 32K tokens (local LLM)
