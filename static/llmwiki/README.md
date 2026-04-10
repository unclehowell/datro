# Brain - Collective Agent Intelligence

Shared memory and coordination system for distributed agent teams.

## Purpose

This brain serves as the **shared intelligence base** for all agents in the collective. It provides:
- **Identity & Mission**: Core purpose and values
- **Context**: Current project state and priorities
- **Skills**: Reusable agent capabilities
- **Learnings**: Approved, sanitized knowledge for public sharing
- **Protocol**: Navigation and contribution guidelines

## Security

**CRITICAL**: This brain is PUBLIC on GitHub. Never write secrets here:
- ❌ No API keys, tokens, credentials
- ❌ No actual campaign URLs (use campaign IDs: "campaign 1", "campaign 2")
- ❌ No personal data or private information

Campaign URLs are stored in `.env` and referenced by ID:
```
CAMPAIGN_1_URL - Primary campaign website
CAMPAIGN_2_URL - Secondary campaign website
CAMPAIGN_3_URL+ - Additional campaigns as needed
```

## Structure

```
brain/
├── AGENTS.md              # Master instructions (START HERE for agents)
├── README.md              # This file - overview & navigation
├── PROTOCOL.md            # Detailed navigation protocol
├── .env_example           # Environment template (no actual values)
├── .gitignore             # Git ignore rules
│
├── memory/                # Long-term curated knowledge
│   ├── index.md           # Memory index
│   ├── core.md            # Core identity & mission
│   ├── soul.md            # Who we are (personality/values)
│   ├── user.md            # User context & preferences
│   ├── common-values.md   # Shared values & principles
│   ├── communication-rules.md
│   ├── context/           # Current context
│   │   └── current.md
│   ├── roles/             # Agent role definitions
│   │   ├── engineer.md
│   │   ├── copywriter.md
│   │   ├── manager.md
│   │   └── creative.md
│   └── archive/           # Legacy learnings (LOCAL ONLY - gitignored)
│       └── learned/
│
├── learnings/              # APPROVED learnings for public sharing
│   └── README.md          # Learnings contribution guide
│
├── skills/                # Shared agent skills
│   ├── software-development/
│   ├── paperclip/
│   ├── github/
│   ├── elevenlabs/
│   └── ... (other skills)
│
├── scripts/               # Utility scripts
│   ├── sync.sh           # Brain sync script
│   ├── hook.sh           # Brain hook for agents
│   └── agent*.sh         # Agent launchers
│
├── docs/                 # Documentation
│   ├── services.md       # Service endpoints
│   └── api.md            # API reference
│
└── agents/               # Shared agent configs
    └── nvidia-kimi/
```

## Quick Start

### For Agents

At startup, every agent MUST:
1. Read `AGENTS.md` - Master instructions
2. Read `memory/core.md` - Core identity
3. Read `memory/soul.md` - Personality & values
4. Read `memory/user.md` - User preferences
5. Read `memory/context/current.md` - Current context
6. Browse `skills/` - Available capabilities

After tasks:
- Save learnings to `memory/archive/learned/` (gitignored)
- Run `bash scripts/sync.sh` to sync

### For Humans

1. Read this README for overview
2. Read PROTOCOL.md for detailed navigation
3. Browse memory/ for identity and context
4. Check skills/ for capabilities
5. Review learnings/ for approved knowledge

## Campaigns

Campaigns are numbered and URLs stored in `.env`:

| ID | Description |
|----|-------------|
| campaign 1 | Primary campaign (CAMPAIGN_1_URL) |
| campaign 2 | Secondary campaign (CAMPAIGN_2_URL) |
| campaign 3+ | Additional campaigns |

Reference campaigns by ID in all documentation.

## Learnings

- **Raw learnings**: `memory/archive/learned/` (gitignored) - for raw agent captures
- **Approved learnings**: `learnings/` (public) - manually migrated and sanitized

See `learnings/README.md` for contribution guidelines.

## Services

- **Paperclip** (127.0.0.1:3100) - Main orchestrator
- **Hermes** - Personal AI assistant
- **OpenCode** / **Claude CLI** / **Groq CLI** - Terminal AIs

See `docs/services.md` for full service list.

## Sync Protocol

```bash
# Sync brain
bash scripts/sync.sh

# Or pull latest
cd brain && git pull origin main
```

---

*"We are many, we think as one."* - The Collective
