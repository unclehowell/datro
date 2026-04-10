---
name: 2nd-brain
description: Central brain — persistent memory, cross-agent learning, session recall. Load this at session start to inherit all brain knowledge. Use to recall past sessions, save durable facts, and close the learning loop after tasks.
---

# 2nd Brain — Persistent Memory System

## What This Is
`~/brain/` (resolves to `/home/ubuntu/datro/static/brain/` on this server) is the shared intelligence between all agents on this machine.
Everything we learn flows through here.

**Important:** The brain path may vary by user profile. Always use `~/brain/` or `${BRAIN_ROOT}` rather than hardcoding `/home/ubuntu/datro/static/brain/`.
On this machine, the home directory is `/home/ubuntu`, not `/home/unclehowell`.

## Memory Architecture (3 tiers)

### Tier 1: Hermes Memory Tool
- survives sessions via memory tool (add/replace/remove actions)
- Two targets: "memory" (facts, lessons) and "user" (preferences, corrections)
- queried via session_search across all past sessions
- fast, searchable, always injected into context

### Tier 2: Brain Files
- ~/brain/memory/ — structured memory files
- ~/brain/memory/archive/learned/ — dated lesson archives
- synced to GitHub via ~/brain/scripts/sync.sh
- accessible to ALL agents (hermes, claude, opencode, etc.)

### Tier 3: Skills  
- ~/brain/skills/ — procedural memory (how-to guides)
- loaded via skill_view(name)
- created via skill_manage(action="create") when workflows repeat

## The Closed Loop Protocol

AT SESSION START:
1. Load this skill (2nd-brain)
2. Run session_search to check for relevant past sessions
3. Read ${BRAIN_ROOT}/memory/context/current.md for active priorities
4. Load relevant skills matching the task

DURING WORK:
5. Save durable facts immediately with memory(action="add")
6. Save user corrections with memory(action="add", target="user")
7. Discover recurring pattern? Create a skill in ${BRAIN_ROOT}/skills/

AFTER TASK COMPLETION:
8. Write a brief summary to ${BRAIN_ROOT}/memory/archive/learned/YYYY-MM-DD/agent-name.md
9. Run: bash ~/brain/scripts/sync.sh
10. Sync must complete before session ends

## Quick Reference

# Recall past learnings
session_search query="keywords OR topics"

# Load a skill  
skills_list [category=devops]
skill_view name=skill-name

# Save a durable fact
Write to brain memory files or archive directly

# Archive to brain (cross-agent sharing)
Write to ${BRAIN_ROOT}/memory/archive/learned/YYYY-MM-DD/

# Close the loop
bash ~/brain/scripts/sync.sh

## Wiring (do this once)

1. Symlink brain skills into Hermes profile skills dir:
   ln -sf ~/brain/skills /home/ubuntu/.hermes/profiles/{profile}/skills/_brain

   CRITICAL: The symlink must go into the PROFILE skills dir (~/.hermes/profiles/*/skills/),
   NOT into ~/.hermes/skills/. The profile dir is where Hermes actually discovers skills.

2. Ensure 2nd-brain/skills/brain-sync have SKILL.md files.
   The 2nd-brain directory will exist but may be EMPTY (no SKILL.md) after a git sync.
   If SKILL.md is missing, recreate it before loading.

3. Deploy Hermes post-session hook (fires agent:end, session:end):
   ~.hermes/hooks/brain-sync/HOOK.yaml + handler.py
   This auto-archives session summaries to brain and syncs to GitHub.

## Pitfalls

- The old sync.sh used `git reset --hard origin/main` which WIPES uncommitted local changes.
  The fixed version uses stash -> pull --rebase -> pop. If you see local changes vanishing
  after sync, this is the bug. Re-check git status after every sync.

- Brain files are PUBLIC on GitHub. .env is in .gitignore but verify before committing.
- The archive/learned/ folder can go stale — agents skip archiving if dirs dont exist.
  Always create dirs first with mkdir -p.

- Hermes memory tool session-level store and brain files are NOT automatically synced.
  An agent must explicitly write to BOTH to close the loop fully.
