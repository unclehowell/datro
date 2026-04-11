# USER_CONTEXT.md

This file captures “in the user’s head” context that should not be trapped in chat.

User teaching (harness engineering):
- The engineer’s job shifts from writing code to designing the environment, feedback loops, and context.
- Human attention is the scarce resource (not tokens).
- Code is disposable; rework is cheap.
- Agents should own the full loop: dashboards, alerts, tests, CI, docs.
- Don’t babysit; enforce taste continuously.

Repository principles:
- AGENTS.md is a short table of contents (~100 lines), never an encyclopedia.
- docs/ is the system of record.
- Knowledge in Slack/Docs/heads must be encoded into repo markdown.
- Skills should be short, discrete, composable.
- Lints enforce taste; lint messages should teach the agent how to fix.

UI snippet (carry-forward):
::view-transition-group(*),
::view-transition-old(*),
::view-transition-new(*) {
  animation-duration: 0.25s;
  animation-timing-function: cubic-bezier(0.19, 1, 0.22, 1);
}
