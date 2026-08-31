const OMNIRute_URL = process.env.OMNIRUTE_URL || "http://localhost:20128";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface CompletionRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

export interface CompletionResponse {
  id: string;
  choices: Array<{
    message: { role: string; content: string };
    finish_reason: string;
  }>;
  usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
}

export async function complete(req: CompletionRequest): Promise<CompletionResponse> {
  const res = await fetch(`${OMNIRute_URL}/v1/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ stream: false, ...req }),
    signal: AbortSignal.timeout(300000),
  });
  if (!res.ok) throw new Error(`OmniRoute error: ${res.status} ${await res.text()}`);
  return res.json();
}

export function streamComplete(
  req: CompletionRequest,
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (err: Error) => void,
): AbortController {
  const ctrl = new AbortController();
  (async () => {
    try {
      const res = await fetch(`${OMNIRute_URL}/v1/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stream: true, ...req }),
        signal: ctrl.signal,
      });
      if (!res.ok) throw new Error(`OmniRoute stream error: ${res.status}`);
      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body");
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (!line.trim()) continue;
          let data: string;
          if (line.startsWith("data: ")) {
            data = line.slice(6);
            if (data === "[DONE]") { onDone(); return; }
          } else {
            data = line;
          }
          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta?.content ?? parsed.message?.content;
            if (delta) onChunk(delta);
            if (parsed.done) { onDone(); return; }
          } catch {}
        }
      }
      onDone();
    } catch (err) {
      if (ctrl.signal.aborted) return;
      onError(err instanceof Error ? err : new Error(String(err)));
    }
  })();
  return ctrl;
}

export async function healthCheck(): Promise<{ status: string; providers: string[] }> {
  try {
    const res = await fetch(`${OMNIRute_URL}/api/health`, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) return { status: "offline", providers: [] };
    return res.json();
  } catch {
    return { status: "offline", providers: [] };
  }
}

export async function listModels(): Promise<string[]> {
  try {
    const res = await fetch(`${OMNIRute_URL}/v1/models`, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) return [];
    const data = await res.json();
    return data.data?.map((m: { id: string }) => m.id) || [];
  } catch {
    return [];
  }
}
