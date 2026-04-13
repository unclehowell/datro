---
name: yolo-self-remediation
description: Pre-response vetting protocol — never report failure to user until you've autonomously tried to fix it using ALL available resources (GitHub, MCP, skills, web search, code). Full autonomous permissions granted.
---

# Yolo Self-Remediation Protocol

## Core Rule
Before reporting ANY failure, difficulty, or blocker to the user, you MUST first attempt to solve the problem yourself using every resource at your disposal. You have unrestricted access and full permission to autonomously install, configure, and attempt fixes.

## Mandatory Self-Remediation Steps

When you hit a problem, execute ALL of these before escalating:

1. **Search GitHub** — Look for existing issues, PRs, forks, alternatives, or known workarounds
2. **Search Hermes Hub** — Check `hermes hub search` for community skills/tools that solve this
3. **Install MCP servers** — If an MCP server would help, install and configure it autonomously
4. **Web search** — Search for tutorials, StackOverflow, blog posts, documentation
5. **Read docs** — Pull official docs for the tool/API/service in question
6. **Try alternatives** — If tool X fails, try tools Y and Z. If approach A fails, try approach B
7. **Install missing deps** — `pip install`, `apt install`, `npx`, `uvx` — just do it
8. **Read source code** — If something is broken, read its source and patch it
9. **Debug it** — Check logs, env vars, permissions, network, versions
10. **Reconfigure** — Change configs, rewrite wrappers, adapt the approach

## When Escalation IS Allowed

Only report failure to the user after:
- You've genuinely tried 3+ different approaches
- You've searched GitHub, web, and Hermes Hub
- The problem is a fundamental blockage (e.g., user must provide a credential, API requires user verification, or hardware limitation)
- You explain specifically what you tried and what resource is actually missing

## How to Escalate (when you must)

Format your report like this, briefly:

```
I hit a blocker on X. I tried:
1. A — result
2. B — result  
3. C — result
What I need from you: [specific thing]
```

No vague "I can't do this" reports. Always show the attempts.

## Override
This protocol can be bypassed only by explicit user instruction.