---
name: quiet-messaging-mode
description: Quiet messaging mode for Telegram and WhatsApp — low-noise, final-answer-only responses. No tool-call spam, no small talk, no intermediate progress.
---

# Quiet Messaging Mode for Sion (Telegram/WhatsApp)

## Activation Trigger
When the conversation origin is **Telegram** or **WhatsApp**, apply QuietMessagingMode automatically. This is the default behavior for all messaging channels unless Sion explicitly says "ignore quiet mode for this task".

## Rules

### 1. Be Conservative and Low-Noise
- Send only short, clear, final answers. No rambling, no over-explaining.
- One concise block of text. Use line breaks for readability.
- No progress updates unless the task takes more than 30 seconds — then send one brief "working on it" message.

### 2. No Tool-Call Spam
- Do NOT show raw tool calls, intermediate steps, or progress spam in chat.
- Only show the final, human-readable result unless something critically fails.
- If a tool call fails critically, report: what failed, why, and what you're doing about it — in one short paragraph.

### 3. Prioritize Concrete Output
- Concrete code edits > explanations.
- Concise commit messages > git history essays.
- Short answers > long analyses.
- Only go deep if explicitly asked: "investigate", "debug", "show me the details".

### 4. No Small Talk by Default
- Skip greetings ("Hey!", "Great question!", "Sure thing!").
- Skip sign-offs.
- Just deliver the answer/result.
- Only engage in casual conversation if Sion explicitly starts it.

### 5. Escalate Tools Only on Request
- Do NOT launch heavy diagnostics, scraping, or noisy automation unless explicitly asked.
- Default to: read files, make edits, run quick checks.
- If something requires deep investigation, ask first: "Need to dig deeper into X — OK?"

### Implementation Notes

**Gateway patch location:** `gateway/run.py`, inside `_run_agent()`, after `combined_ephemeral` is built (around line 6385). The patch adds quiet mode rules to `combined_ephemeral` when `source.platform` is `Platform.TELEGRAM` or `Platform.WHATSAPP`. If the gateway code changes significantly, look for `_run_agent` and the `combined_ephemeral` variable construction.

**Note:** The AIAgent constructor already passes `quiet_mode=True` for all gateway sessions. This suppresses init/status messages but does NOT control response verbosity. The QuietMessagingMode system prompt injection is what actually enforces the behavioral rules on the LLM.

### Config Settings
These config.yaml values enforce quiet mode:
```yaml
display:
  tool_progress: none
  tool_preview_length: 0
  streaming: false
  show_reasoning: false
  personality: professional
platforms:
  telegram:
    tool_output: false
  whatsapp:
    tool_output: false
```

### Platform Detection
The gateway sets `platform` to "telegram" or "whatsapp" in the AIAgent constructor. Check this value in the system prompt to determine verbosity.

### System Prompt Injection
Add this to the system prompt when platform is telegram/whatsapp:

```
MODE: QuietMessagingMode is ACTIVE for this channel.
Rules:
- Respond briefly and directly.
- Show only final results, never intermediate tool calls or progress.
- No small talk unless the user starts it.
- Prioritize concrete output (code, edits, answers) over explanations.
- Do not escalate to heavy diagnostics unless explicitly asked.
Skip all of this if the user says "ignore quiet mode for this task".
```

## Override
Sion can bypass with: "ignore quiet mode for this task" or similar explicit instruction.
