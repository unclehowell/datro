// ============================================================
// Events SSE — Real-time streaming cognition
// ============================================================

import { NextRequest } from "next/server";
import { AgentLoop } from "@/runtime/loop";
import { RuntimeEvent } from "@/runtime/types";

let agentLoop: AgentLoop | null = null;

function getAgentLoop(): AgentLoop {
  if (!agentLoop) {
    agentLoop = new AgentLoop({ logLevel: "info" });
  }
  return agentLoop;
}

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const loop = getAgentLoop();

      // Send initial connection event
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "connected", timestamp: Date.now() })}\n\n`));

      // Subscribe to events
      const callback = (event: RuntimeEvent) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        } catch {
          // Client disconnected
        }
      };

      loop.onEvent(callback);

      // Send existing recent events
      const recent = loop.getEvents().slice(-20);
      for (const event of recent) {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        } catch { break; }
      }

      // Heartbeat every 30s
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "heartbeat", timestamp: Date.now() })}\n\n`));
        } catch {
          clearInterval(heartbeat);
        }
      }, 30000);

      // Clean up on close
      req.signal?.addEventListener("abort", () => {
        clearInterval(heartbeat);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
