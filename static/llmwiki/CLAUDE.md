---
name: collective-brain
description: Claude Code specific optimizations for brain
version: "1.0"
updated: 2026-04-01
---

# CLAUDE.md - Claude Code Optimizations

Claude Code (claude.ai/cli) prioritizes CLAUDE.md over AGENTS.md. This file provides Claude-specific instructions.

## Priority Order

1. `CLAUDE.md` (if exists - highest priority for Claude Code)
2. `AGENTS.md` (fallback for all other agents)
3. `memory/` files (loaded by AGENTS.md)

## Startup Behavior

Claude Code will read this file first, then continue with AGENTS.md startup protocol.

## Key Differences from AGENTS.md

- This file is Claude-specific
- Use Hermes memory tool for learnings (not file writes)
- All AGENTS.md rules apply here too

## Hermes Integration

Use Hermes memory tool to save learnings:
- Check for existing assignments
- Update task status
- Post comments with learnings

## Memory Location

- **Claude reads:** `CLAUDE.md` → `AGENTS.md` → `memory/`
- **Shared memory:** `${BRAIN_ROOT}/memory/`
- **Raw learnings:** `${BRAIN_ROOT}/memory/archive/learned/` (gitignored)
- **Approved learnings:** `${BRAIN_ROOT}/learnings/` (public)

## Running Tasks

When asked to run commands:
1. Use tools efficiently (batch where possible)
2. Check AGENTS.md for LLM priority order
3. Verify with lint/typecheck when available

## Sync Before Exit

Always run: `bash ${BRAIN_ROOT}/scripts/sync.sh ${BRAIN_ROOT}`