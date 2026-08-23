// GraphRAG client — queries the local Python RAG server for knowledge context.

const GRAPHRAG_URL = process.env.GRAPHRAG_URL || "http://127.0.0.1:8050";

interface RagResult {
  source: string;
  score: number;
  excerpt: string;
}

export async function queryGraphRAG(
  query: string,
  opts?: { topK?: number; timeoutMs?: number }
): Promise<{ results: RagResult[]; context: string }> {
  try {
    const res = await fetch(`${GRAPHRAG_URL}/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ q: query, top_k: opts?.topK ?? 3 }),
      signal: AbortSignal.timeout(opts?.timeoutMs ?? 3000),
    });
    if (!res.ok) return { results: [], context: "" };
    const data = await res.json();
    const results: RagResult[] = data.results || [];
    const context = results
      .map((r, i) => `[Source: ${r.source}]\n${r.excerpt}`)
      .join("\n\n");
    return { results, context };
  } catch {
    return { results: [], context: "" };
  }
}
