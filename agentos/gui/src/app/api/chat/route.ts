import { NextRequest, NextResponse } from "next/server";
import { streamComplete, ChatMessage } from "@/lib/omniroute";

export async function POST(req: NextRequest) {
  const { messages, model, temperature, max_tokens } = await req.json();

  if (!messages || !Array.isArray(messages)) {
    return NextResponse.json({ error: "messages array required" }, { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      const chatMessages: ChatMessage[] = messages.map((m: { role: string; content: string }) => ({
        role: m.role as "system" | "user" | "assistant",
        content: m.content,
      }));

      streamComplete(
        {
          model: model || "openbmb/minicpm5",
          messages: chatMessages,
          temperature: temperature ?? 0.7,
          max_tokens: max_tokens ?? 2048,
        },
        (chunk) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: chunk })}\n\n`));
        },
        () => {
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        },
        (err) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: err.message })}\n\n`));
          controller.close();
        },
      );
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
