// ============================================================
// /api/tools — Direct tool execution endpoint
// ============================================================

import { NextRequest } from "next/server";
import { ToolRegistry } from "@/runtime/tools/registry";

// Singleton registry
let registry: ToolRegistry | null = null;

function getRegistry(): ToolRegistry {
  if (!registry) {
    registry = new ToolRegistry();
  }
  return registry;
}

export async function POST(req: NextRequest) {
  const { tool, params } = await req.json();

  if (!tool) {
    return Response.json({ success: false, error: "tool name required" }, { status: 400 });
  }

  const reg = getRegistry();
  const request = {
    id: "api_" + Date.now().toString(36),
    tool,
    parameters: params || {},
    timestamp: Date.now(),
  };

  const result = await reg.execute(request);
  return Response.json({ success: result.success, result: result.output, error: result.error });
}

// List available tools
export async function GET() {
  const reg = getRegistry();
  const tools = reg.listTools().map((t: any) => ({
    name: t.name,
    category: t.category,
    description: t.description,
    parameters: t.parameters,
    tags: t.tags,
  }));
  return Response.json({ tools });
}
