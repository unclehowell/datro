---
name: gemini-cli-datro-brain-honcho
description: Install Google Gemini CLI and configure it to use Datro static brain context plus a local Honcho MCP server (stdio) for memory tools.
trigger:
  - "install gemini cli"
  - "configure gemini cli settings.json"
  - "gemini cli includeDirectories"
  - "gemini cli + honcho mcp"
  - "gemini cli use datro/static/brain"
  - "gemini mcpServers"
prerequisites:
  - Ubuntu/Debian Linux with Node.js >= 18
  - npm available
  - (for Honcho MCP) a working HONCHO_API_KEY and access to Honcho service
notes:
  - "Do not persist API keys in this skill or in files unless user explicitly requests. Prefer env vars."
---

Goal
- Install @google/gemini-cli
- Ensure Gemini CLI uses additional context directories (Datro static brain + optional /home/ubuntu/datro/static/brain)
- Provide a working local MCP server alias `honcho` exposing a few Honcho memory tools

1) Install Gemini CLI
1. npm install -g @google/gemini-cli
2. Verify:
   - command -v gemini
   - gemini --version

2) Fix first-run registry error (projects.json rename ENOENT)
Sometimes gemini errors on first run if ~/.gemini doesn’t exist.
- mkdir -p ~/.gemini
- if [ ! -f ~/.gemini/projects.json ]; then echo '{}' > ~/.gemini/projects.json; fi
- gemini --version  (should be clean)

3) Configure Gemini CLI to include Datro brain directories
Gemini CLI reads settings from:
- User settings: ~/.gemini/settings.json
- Workspace settings: <project>/.gemini/settings.json (overrides user)

Write ~/.gemini/settings.json like:
{
  "context": {
    "fileName": ["CONTEXT.md", "GEMINI.md"],
    "includeDirectories": [
      "/var/www/datro/static/brain",
      "/home/ubuntu/datro/static/brain"
    ],
    "loadMemoryFromIncludeDirectories": true,
    "fileFiltering": {
      "respectGitIgnore": true,
      "respectGeminiIgnore": true
    }
  }
}

Notes
- `context.includeDirectories` adds additional workspace roots.
- CLI flag alternative: `--include-directories <dir1,dir2,...>` (Gemini CLI limits to 5 include directories).
- `context.loadMemoryFromIncludeDirectories=true` makes `/memory reload` scan include dirs for GEMINI.md.

Notes
- `context.includeDirectories` adds additional workspace roots.
- `context.loadMemoryFromIncludeDirectories=true` makes `/memory reload` scan those include dirs for GEMINI.md.

4) Ensure Datro brain has a GEMINI.md
Gemini uses GEMINI.md as a project context file.
If the target path is under /var/www and you hit permission errors, use sudo:
- sudo mkdir -p /var/www/datro/static/brain
- sudo tee /var/www/datro/static/brain/GEMINI.md >/dev/null <<'EOF'
  ...content...
  EOF
- sudo chmod 0644 /var/www/datro/static/brain/GEMINI.md

5) Auth: Gemini API key
Gemini CLI can use:
- GEMINI_API_KEY (Gemini API key)
- VertexAI / GCA env vars (enterprise)

Recommended: set in shell env, not in settings.json.
- export GEMINI_API_KEY="..."
- gemini -p "say hi"

Security note
- If an API key is pasted into chat/logs, treat it as compromised; rotate it.

6) Add Honcho MCP server (stdio) for memory tools
Gemini CLI supports MCP via settings.json key `mcpServers`.
We implement a local MCP server using Node + @modelcontextprotocol/sdk, and a Python helper using the existing honcho SDK.

6.1 Create MCP server workspace
- mkdir -p ~/.gemini/mcp/honcho
- cd ~/.gemini/mcp/honcho
- npm init -y
- npm install @modelcontextprotocol/sdk@latest
- npm install zod

Note:
- Some versions of the MCP TypeScript SDK may not expose zod as a direct dependency you can import from your own code. Installing zod explicitly avoids runtime import errors.
6.2 Python helper (honcho_tool.py)
- Use the Hermes venv python if present, e.g. /home/ubuntu/.hermes/hermes-agent/venv/bin/python
- Load HONCHO_API_KEY from env; optionally fallback to ~/.hermes/honcho_api_key.env or ~/.hermes/honcho.json if present.
- Implement actions: profile, search, ask, conclude

6.3 Node MCP server (server.mjs)
- Stdio transport
- Expose tools:
  - profile: get peer card
  - search: semantic search conclusions
  - ask: dialectic query
  - conclude: persist new conclusion
- Use spawnSync to run python helper.

6.4 Wire into ~/.gemini/settings.json
Add:
"mcpServers": {
  "honcho": {
    "command": "node",
    "args": ["/home/ubuntu/.gemini/mcp/honcho/server.mjs"],
    "cwd": "/home/ubuntu/.gemini/mcp/honcho",
    "description": "Honcho memory tools via local MCP server",
    "trust": false
  }
}

Gemini will display these as tool names prefixed:
- mcp_honcho_profile
- mcp_honcho_search
- mcp_honcho_ask
- mcp_honcho_conclude

7) Verification
A) Context directory inclusion
- cd /var/www/datro/static/brain
- gemini -p "summarize what this GEMINI.md says"

B) MCP server discovery
- Start gemini interactive and check tools list / MCP section.
- Or run a prompt that asks it to call mcp_honcho_profile.

8) Troubleshooting
- "Failed to save project registry ... projects.json": create ~/.gemini and an empty projects.json.
- "Permission denied" writing /var/www/...: use sudo.
- "Invalid API key" from Honcho helper: HONCHO_API_KEY is wrong/expired; rotate/set correct one.
- Browser-based docs fetch blocked by Chrome sandbox in some Ubuntu/VM/container setups: use curl/python urllib to pull docs instead of browser tool.

9) Hardening & persistence (reboot-safe)
Goal: make Gemini always load the right env (Honcho + optional Gemini API key) regardless of shell init files.

9.1 Dedicated env files (recommended)
- Honcho key:
  - ~/.hermes/honcho_api_key.env  (chmod 600)
- Gemini key (optional):
  - ~/.gemini/gemini.env (chmod 600)

9.2 Inject HONCHO_API_KEY directly into Gemini MCP server env (most reliable)
If you want Gemini to always pass the key to the MCP server (even if your shell didn’t source env files), set:

In ~/.gemini/settings.json:
{
  "mcpServers": {
    "honcho": {
      ...,
      "env": {
        "HONCHO_API_KEY": "<key>",
        "HONCHO_WORKSPACE_ID": "hermes",
        "HONCHO_MCP_PYTHON": "/home/ubuntu/.hermes/hermes-agent/venv/bin/python"
      }
    }
  }
}

Security note:
- If you store secrets inside settings.json, lock it down: chmod 600 ~/.gemini/settings.json

9.3 Wrapper approach when ~/.bashrc can’t be edited (or is protected)
Create a wrapper that sources env files then execs the real Gemini binary.
Common hardening pattern (NVM install):
- Locate gemini: which gemini
- Move the original to gemini.real
- Replace gemini with a wrapper that sources:
  - ~/.hermes/honcho_api_key.env
  - ~/.gemini/gemini.env
  then execs gemini.real.

Optional belt-and-braces:
- Add /usr/local/bin/gemini that calls the wrapper path.

Pitfall:
- npm updates / reinstall of @google/gemini-cli may overwrite the wrapper. Re-apply after upgrades.

Extra hardening (recommended on this server)
- Store HONCHO_API_KEY in BOTH places for resilience:
  1) ~/.hermes/honcho_api_key.env (chmod 600)
  2) ~/.hermes/honcho.json (apiKey field, chmod 600)
- Then configure Gemini MCP server `mcpServers.honcho.env.HONCHO_API_KEY` from that env file.
- Verify Honcho auth with:
  - /home/ubuntu/.hermes/hermes-agent/venv/bin/python ~/.gemini/mcp/honcho/honcho_tool.py profile <<<'{}'

Known limitation
- Hermes tool `honcho_conclude` may fail to initialize if Hermes itself is not configured with HONCHO_* env vars. In that case, fall back to the Honcho Python SDK:
  - from honcho import Honcho; Honcho(workspace_id='hermes').peer('<ai>').conclusions_of('<user>').create([...])

10) Operational preference: keep keys out of disk
If you can’t or won’t store keys in settings.json, keep them in env files and source them before use.
If you can’t edit ~/.bashrc, source manually in the current session:
- source ~/.hermes/honcho_api_key.env
- source ~/.gemini/gemini.env
