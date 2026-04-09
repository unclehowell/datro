# Pi Integration

Pi is a lightweight coding agent with 4 core tools: read, write, edit, bash. It's much faster than full agents for simple tasks.

## Installation

```bash
npm install -g @mariozechner/pi-coding-agent
```

Version: 0.66.1

## Wrapper Scripts

### Hermes Pi Subagent
- **Path**: `~/.hermes/bin/hermes-pi-subagent.sh`
- **Usage**: `hermes-pi-subagent.sh "goal" [context]`
- **Provider**: Groq (llama-3.3-70b-versatile)
- **API Key**: Uses GROQ_API_KEY from ~/.env

### Groq Pi Wrapper
- **Path**: `~/bin/groq-pi`
- **Usage**: `groq-pi "prompt"`
- **Purpose**: Simple CLI interface to Pi via Groq

## Hermes Tool Integration

### pi_subagent Tool
- **Location**: `hermes-agent/tools/pi_subagent.py`
- **Toolset**: file
- **Registered in**: 
  - `model_tools.py` (import)
  - `toolsets.py` (_HERMES_CORE_TOOLS)

### How It Works
The tool runs the Pi wrapper script and returns the output as JSON.

## Skills Location

### Hermes Laptop Agents (1-4)
- `~/.agents/skills/pi/SKILL.md` (symlinked)
- `~/.agents/skills/pi-subagent/SKILL.md` (symlinked)
- Also at: `hermes_laptop_agent{1-4}/skills/pi` and `hermes_laptop_agent{1-4}/skills/pi-subagent`

### .agents/skills
- `/home/unclehowell/.agents/skills/pi/SKILL.md`
- `/home/unclehowell/.agents/skills/pi-subagent/SKILL.md`

### OpenCode
- `/home/unclehowell/.opencode/skills/pi.yaml`
- `/home/unclehowell/.opencode/skills/pi-subagent.yaml`

### Gemini
- Symlink at: `~/.gemini/skills/pi -> ~/.agents/skills/pi`

## Usage Examples

### Direct Pi
```bash
pi -p --provider groq "list files in /tmp"
```

### Groq Pi
```bash
groq-pi "list files in /tmp"
```

### Hermes Tool
When user says "use pi" or for simple tasks, use the `pi_subagent` tool with:
- `goal`: What you want Pi to do
- `context`: Optional additional context

## Pi Capabilities

- **read**: Read files from disk
- **write**: Create or overwrite files  
- **bash**: Run shell commands
- **edit**: Modify files in place

## Provider Configuration

Default provider: Groq with llama-3.3-70b-versatile model.

The wrapper script extracts GROQ_API_KEY from ~/.env to avoid conflicts with other providers.

## Notes

- Pi is much faster than spawning a full Hermes subagent
- Best for: listing files, reading small files, creating simple files, running simple commands
- For complex tasks, use delegate_task instead