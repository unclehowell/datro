# Datro Brain (static)

This directory is the Datro static brain. Treat it as a shared knowledge base.

Operating rules:
- Prefer editing/creating small, well-scoped markdown files rather than giant documents.
- When you learn something durable, record it here with a clear title and date.

Honcho memory integration:
- Gemini CLI is configured with an MCP server alias `honcho`.
- Available tools (names will appear as `mcp_honcho_<tool>` in Gemini CLI):
  - `profile`   (get a peer-card style summary of the user)
  - `search`    (semantic search conclusions about the user)
  - `ask`       (ask Honcho a question about the user)
  - `conclude`  (persist a new factual conclusion about the user)

Recommended usage:
- Use Honcho for durable user facts/preferences.
- Use this Datro brain folder for project docs, runbooks, and long-form notes.
