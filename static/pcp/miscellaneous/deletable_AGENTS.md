# Portable Agent Template

Copy this file into a new repo and rename it to `AGENTS.md`.

## Purpose
- Keep Codex behavior consistent across projects.
- Make setup, lint, test, and verification deterministic.
- Reduce one-off commands and hidden workflow assumptions.

## Expected Layout
- `scripts/` for canonical command entrypoints.
- `tests/` for smoke/regression tests.
- `docs/plans/` for design and implementation plans.
- `docs/prompt-playbook.md` for reusable prompt templates.

## Canonical Commands
- Setup: `./scripts/setup`
- Lint: `./scripts/lint`
- Test: `./scripts/test`
- Verify: `./scripts/verify`
- Tool audit: `./scripts/check-tools`
- New task worktree: `./scripts/new-worktree <branch-name>`

## Guardrails
- Run `./scripts/verify` before any completion claim.
- Use one task branch/worktree at a time.
- Keep changes scoped to the requested task.
- Prefer canonical scripts over ad-hoc shell commands.

## No-Cost Tooling Baseline
- Recommended CLIs: `rg`, `fd`/`fdfind`, `jq`, `bat`/`batcat`, `delta`.
- Use `pre-commit` hooks for local lint/test gates.
- If `pre-commit` is missing, install with:
  - `uv tool install pre-commit`
  - fallback: `pipx install pre-commit`

## Reusable Prompt Patterns
- Bugfix:
  - "Use systematic debugging, reproduce first, add failing test, apply minimal fix, run `./scripts/verify`."
- Feature:
  - "Use brainstorming then planning, implement with TDD, keep scope minimal, run `./scripts/verify`."
- Refactor:
  - "Refactor [target] with no behavior change, adjust tests first, run `./scripts/verify`."
- Review:
  - "Review this branch for bugs/regressions first, then open questions, then summary."

## Memory and Persistence
- Do not assume Codex will remember repo-specific context in a different directory/session.
- Persist behavior in files (`AGENTS.md`, scripts, tests, prompt playbook), not chat history.
- Global machine setup (installed tools, shell config, `~/.codex` content) can carry across projects.
