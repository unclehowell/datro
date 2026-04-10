---
name: codex-harness
description: "Reproducible harness wrapper around Codex CLI: isolated worktree, pinned base, auto-verify (tests/format), push + PR, with logs."
version: 1.0.0
author: Hermes Agent
license: MIT
metadata:
  hermes:
    tags: [Codex, Harness, Worktree, PR, CI]
    related_skills: [codex, github-pr-workflow, tmux]
---

# Codex Harness

Use this skill when you want Codex runs to be:
- Deterministic (pinned base, isolated worktree)
- Safe (doesn’t trash the main working tree)
- Verifiable (runs tests/formatters)
- Auditable (writes logs)

This is the “Codex harness” pattern.

## Prereqs

- Codex installed: `npm install -g @openai/codex`
- GitHub CLI installed + authenticated (optional but recommended): `gh auth status`
- Run inside a git repo with a configured `origin`
- Use `pty=true` when driving Codex interactively

## Standard lifecycle

1) Pick base branch (examples: `main`, `master`, `gh-pages`)
2) Create isolated worktree from `origin/<base>`
3) Run Codex in worktree
4) Verify (tests/format)
5) Push branch
6) Create PR
7) Cleanup worktree

## Provided script

- `scripts/codex_harness.sh`

It creates a worktree under `/tmp`, runs Codex, optionally runs a verify command, pushes, and (optionally) creates a PR.

## Usage

From inside your repo:

- Minimal (no PR, just run codex):
  - `TASK=fix-login BASE=main VERIFY_CMD='npm test' /path/to/codex_harness.sh -- "Fix login bug; run tests; commit when done"`

- Create PR automatically:
  - `TASK=dark-mode BASE=main VERIFY_CMD='npm test' CREATE_PR=1 /path/to/codex_harness.sh -- "Add dark mode toggle; run tests; commit when done"`

## Pitfalls

- If your repo has submodules/large LFS assets, worktrees may be slow.
- If Codex asks questions, you must answer (PTY mode).
- Don’t use `--yolo` unless you want unbounded edits.

## Verification checklist

- `git -C <worktree> status -sb` clean
- tests pass
- PR base/head correct
