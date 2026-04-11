// Template MCP server for Honcho integration (Gemini CLI)
// Place in: ~/.gemini/mcp/honcho/server.mjs

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import * as z from "zod/v4";
import { spawnSync } from "node:child_process";

const PYTHON = process.env.HONCHO_MCP_PYTHON || "/home/ubuntu/.hermes/hermes-agent/venv/bin/python";
const HONCHO_TOOL = process.env.HONCHO_MCP_TOOL || "/home/ubuntu/.gemini/mcp/honcho/honcho_tool.py";

function callPython(action, payload) {
  const res = spawnSync(PYTHON, [HONCHO_TOOL, action], {
    input: JSON.stringify(payload ?? {}),
    encoding: "utf-8",
    env: process.env,
    maxBuffer: 10 * 1024 * 1024,
  });

  if (res.error) throw res.error;
  const out = (res.stdout || "").trim();
  const err = (res.stderr || "").trim();

  if (res.status !== 0) {
    let msg = `python exited ${res.status}`;
    try {
      const j = JSON.parse(out);
      if (j && j.error) msg = j.error;
    } catch {}
    throw new Error([msg, err].filter(Boolean).join("\n"));
  }

  if (!out) return { ok: true };
  return JSON.parse(out);
}

const server = new McpServer({ name: "honcho-mcp", version: "1.0.0" });

server.registerTool(
  "profile",
  {
    description: "Get Honcho peer-card style facts about the user (from gemini-cli's perspective)",
    inputSchema: {
      user_peer_id: z.string().optional().describe("Human peer id (default: 'user')"),
      ai_peer_id: z.string().optional().describe("AI peer id (default: 'gemini-cli')"),
    },
  },
  async (args) => {
    const r = callPython("profile", args);
    const text = (r.card || []).join("\n");
    return { content: [{ type: "text", text: text || "(no card yet)" }] };
  }
);

server.registerTool(
  "search",
  {
    description: "Semantic search Honcho conclusions about the user",
    inputSchema: {
      query: z.string(),
      top_k: z.number().int().min(1).max(100).optional(),
      max_distance: z.number().min(0).max(1).optional(),
      user_peer_id: z.string().optional(),
      ai_peer_id: z.string().optional(),
    },
  },
  async (args) => {
    const r = callPython("search", args);
    const results = r.results || [];
    const text = results.length ? results.map((x) => `- ${x}`).join("\n") : "(no matches)";
    return { content: [{ type: "text", text }] };
  }
);

server.registerTool(
  "ask",
  {
    description: "Ask Honcho (dialectic) a natural-language question about the user",
    inputSchema: {
      query: z.string(),
      user_peer_id: z.string().optional(),
      ai_peer_id: z.string().optional(),
    },
  },
  async (args) => {
    const r = callPython("ask", args);
    return { content: [{ type: "text", text: r.answer || "" }] };
  }
);

server.registerTool(
  "conclude",
  {
    description: "Persist a new conclusion/fact about the user into Honcho",
    inputSchema: {
      conclusion: z.string(),
      user_peer_id: z.string().optional(),
      ai_peer_id: z.string().optional(),
    },
  },
  async (args) => {
    const r = callPython("conclude", args);
    const created = r.created || [];
    return { content: [{ type: "text", text: created.length ? created.join("\n") : "ok" }] };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((e) => {
  console.error(String(e?.stack || e));
  process.exit(1);
});
