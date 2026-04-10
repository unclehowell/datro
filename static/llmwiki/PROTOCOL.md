# Brain Protocol

Navigation guide for agents and humans working with this brain.

## Philosophy

This brain follows the **Hive Mind** principle: all agents share one collective intelligence. Knowledge is stored where it's most useful, with clear paths to finding what you need.

## Reading Order

### Agents: Startup Sequence

Every agent MUST read files in this order at startup:

```
1. AGENTS.md          → Master instructions & rules
2. memory/core.md    → Core identity & mission
3. memory/soul.md    → Who we are (personality/values)
4. memory/user.md    → User preferences & context
5. memory/context/current.md → Current project state
6. Browse skills/    → Available capabilities
```

### Humans: Orientation

```
1. README.md         → Overview & structure (you're here)
2. PROTOCOL.md       → This file - navigation guide
3. memory/index.md   → Memory index
4. AGENTS.md         → How agents use the brain
5. Browse skills/    → Available capabilities
```

## Memory Hierarchy

### Level 1: Permanent Knowledge
- `memory/core.md` - Mission, purpose, goals (rarely changes)
- `memory/soul.md` - Identity, personality, values
- `memory/common-values.md` - Shared principles

### Level 2: Context
- `memory/user.md` - User preferences, environment references
- `memory/context/current.md` - Current project state, priorities

### Level 3: Working Knowledge
- `memory/roles/` - Role-specific instructions
- `memory/communication-rules.md` - How we communicate

### Level 4: Ephemeral
- `memory/archive/learned/` - Raw learnings (gitignored)

## Navigation by Task

### Finding Skills
```
skills/
├── software-development/     → Development methodologies
├── paperclip/                → Orchestrator integration
├── github/                   → GitHub operations
├── elevenlabs/               → Audio generation
├── display-ad-generator/     → Ad creation
├── skill-creator/            → Creating new skills
└── ...                       → Check directory listing
```

### Understanding Campaigns
1. Reference `.env_example` for campaign variables
2. Use ID (e.g., "campaign 1") not URLs
3. Campaign details stay in `.env`

### Finding Learnings
```
# Raw learnings (private)
memory/archive/learned/YYYY-MM-DD/*.md

# Approved learnings (public)
learnings/YYYY-MM-DD-*.md
```

### Finding Services
```
docs/services.md    → Service endpoints & purposes
docs/api.md         → API reference
```

## Contributing

### Adding New Skills
1. Create `skills/[skill-name]/SKILL.md`
2. Follow skill template structure
3. Add references in `skills/[skill-name]/references/` if needed

### Capturing Learnings
Agents write to `memory/archive/learned/YYYY-MM-DD/[agent-name].md` (gitignored)

### Sharing Learnings
1. Review `memory/archive/learned/` for raw learnings
2. Sanitize: remove API keys, credentials, internal URLs
3. Copy to `learnings/YYYY-MM-DD-[topic].md`
4. Run `bash scripts/sync.sh`

## Environment Variables

### Required
```
BRAIN_DIR=/home/ubuntu/datro/static/brain
```

### Campaign Variables
```
CAMPAIGN_1_URL - Primary campaign website
CAMPAIGN_2_URL - Secondary campaign website
CAMPAIGN_3_URL - Additional campaign
CAMPAIGN_4_URL - Additional campaign
CAMPAIGN_5_URL - Additional campaign
```

### API Keys (stored in .env, never in brain)
```
NVIDIA_API_KEY
MISTRAL_API_KEY
OPENAI_API_KEY
GROQ_API_KEY
GEMINI_API_KEY
ANTHROPIC_API_KEY
OPENROUTER_API_KEY
GITHUB_TOKEN
```

See `.env_example` for complete template.

## Script Reference

| Script | Purpose |
|--------|---------|
| `scripts/sync.sh` | Sync brain to GitHub |
| `scripts/hook.sh` | Source for agent brain integration |
| `scripts/agent.sh` | General agent launcher |
| `scripts/agent-brain-sync.sh` | Agent brain sync utility |

## Rules Summary

1. **NO SECRETS** - Never write credentials to brain (it's public)
2. **NO CODE TO USER** - Never send raw code via Telegram
3. **SYNC BEFORE EXIT** - Always sync after changes
4. **READ BEFORE ACTING** - Check brain first
5. **WRITE LESSONS** - Document what you learned
6. **USE CAMPAIGN IDs** - Reference by ID, not URL

## Quick Reference

| Need | Go To |
|------|-------|
| What is our mission? | `memory/core.md` |
| Who are we? | `memory/soul.md` |
| What are we working on? | `memory/context/current.md` |
| How do agents work? | `AGENTS.md` |
| What skills exist? | `skills/` |
| How do I contribute? | `learnings/README.md` |
| Service endpoints? | `docs/services.md` |

---

*Navigation is about knowing where to look, not knowing everything.*
