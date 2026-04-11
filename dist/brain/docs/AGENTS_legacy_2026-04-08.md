# AGENTS.md (Legacy snapshot) — 2026-04-08

This file preserves the previous, long-form AGENTS.md content before we refactored AGENTS.md into a short “map not manual” entrypoint.

The new doctrine:
- AGENTS.md should be a short table of contents (~100 lines).
- Deeper rules and details live in structured docs/ and memory/.

---

---

Legacy AGENTS.md content (verbatim):

---

---
name: collective-brain
description: >
  Shared intelligence base for automated website marketing.
  Read this at startup to understand your role and capabilities.
version: "1.0"
updated: 2026-04-03
---

# HIVE MIND - COLLECTIVE AGENT INTELLIGENCE

You are part of a unified hive mind. All agents share one collective intelligence.

## Environment Variables

- **BRAIN_ROOT** - Root path to brain (default: `~/brain`, can be overridden)

## COVERED AGENTS & SERVICES

- **Paperclip** (127.0.0.1:3100) - Main orchestrator
- **Hermes** - Personal AI assistant
- **OpenCode** - Terminal AI
- **Claude CLI** - Terminal AI  
- **Groq CLI** - Terminal AI
- **Gemini CLI** - Terminal AI
- **All Paperclip workspace agents** - Task agents

## HIVE MIND PROTOCOL

**At STARTUP, every agent MUST:**

1. Read `${BRAIN_ROOT}/AGENTS.md` - These instructions
2. Read `${BRAIN_ROOT}/memory/core.md` - Core identity and mission
3. Read `${BRAIN_ROOT}/memory/user.md` - User preferences (references .env)
4. Read `${BRAIN_ROOT}/memory/soul.md` - Who we are
5. Read `${BRAIN_ROOT}/memory/context/current.md` - Current context
6. Browse `${BRAIN_ROOT}/skills/` - Available shared skills
7. Check for recent learnings using Hermes memory tool (if available)

**After completing ANY task:**

1. Use Hermes memory tool to save lessons (if available) or write to `${BRAIN_ROOT}/memory/archive/learned/YYYY-MM-DD/{agent-name}.md`
2. Run: `bash ${BRAIN_ROOT}/scripts/sync.sh ${BRAIN_ROOT}`
3. Sync MUST complete before finishing

**Brain folder structure:**

(see original AGENTS.md snapshot; retained here for reference)

## SHARED INTELLIGENCE

All agents share skills and memory through this brain.

## VISUAL COMMUNICATION STANDARDS

### PRINCE2 Status Updates

For all project management and status updates, use the **vibrant visual table format**.

## RULES

1. **NO SECRETS** - Never write passwords, API keys, or credentials to brain (it's PUBLIC on GitHub)
2. **SYNC BEFORE EXIT** - Always sync before stopping
3. **READ BEFORE ACTING** - Always check brain first
4. **WRITE LESSONS** - Always document what you learned

---
