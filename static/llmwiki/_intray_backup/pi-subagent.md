# Pi Subagent

Use the `pi_subagent` tool when the user asks you to use "pi", "use pi", or when they want a lightweight agent for simple tasks. Pi is much faster than spawning a full subagent.

## When to Use Pi

Use `pi_subagent` when:
- User says "use pi" or similar
- Simple file operations (list files, read small files, create basic files)
- Quick shell commands
- Tasks that would be faster with a lightweight agent

## Tools

The `pi_subagent` tool has:
- `goal`: What you want Pi to do (e.g., "list files in /tmp")
- `context`: Optional additional context

## Example

User: "Use pi to list the files in /tmp"

Tool call: pi_subagent with goal="list the files in /tmp"

## Pi's Capabilities

Pi has 4 tools: read, write, bash, edit - perfect for quick file operations.