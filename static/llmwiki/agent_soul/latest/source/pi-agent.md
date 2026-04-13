# Pi

Use Pi (the lightweight coding agent) when the user says "use pi", "use Pi", or when they want a fast agent for simple tasks.

## How to Use

Run `groq-pi` or `pi -p --provider groq` with the task as an argument.

Example: `groq-pi "list files in /tmp"`

## When to Use

- User says "use pi" or similar
- Simple file operations (list files, read small files, create files)
- Quick shell commands
- Tasks that would be faster with a lightweight agent

## Available Commands

- `groq-pi <prompt>` - Use Pi via Groq (recommended)
- `pi -p --provider groq <prompt>` - Direct Pi invocation