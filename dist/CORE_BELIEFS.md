# CORE_BELIEFS.md

Harness engineering doctrine (agent-first):

1) Map, not manual
- AGENTS.md / INDEX.md are short navigation aids, not encyclopedias.
- Deep truth lives in structured docs/ and memory/.

2) In-repo knowledge is real knowledge
- Anything the agent can’t see in-context effectively doesn’t exist.
- Decisions in chat/Slack/people’s heads must be encoded into markdown in this repo.

3) Skills are small and composable
- Prefer a small number of discrete skills that chain together.
- Each skill should be focused, testable, and reusable.

4) Taste is enforced mechanically
- Encode architecture + style as lints/tests.
- Write lint error messages as remediation prompts for the agent.

5) Build confidence one SDLC stage at a time
- Make one stage (tests, CI, review, deploy, observability) agent-runnable.
- Then expand autonomy.

6) Self-improvement is a loop
- Session friction is a signal of missing context.
- Feed failures back into: docs, skills, lints, checks.

7) Don’t babysit agents
- Invest in environment + feedback loops so the system converges autonomously.
