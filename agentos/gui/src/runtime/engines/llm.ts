// ============================================================
// LLM Client v2 — Connects to OmniRoute
// ============================================================

export interface LLMResponse {
  content: string;
  model: string;
  tokens: { prompt: number; completion: number; total: number };
  duration: number;
}

export class LLMClient {
  private baseUrl: string;
  private model: string;
  private temperature: number;
  private maxTokens: number;

  constructor(config: { model?: string; temperature?: number; maxTokens?: number }) {
    this.baseUrl = "http://localhost:20128";
    this.model = config.model || "minicpm5-32k";
    this.temperature = config.temperature ?? 0.7;
    this.maxTokens = config.maxTokens || 4096;
  }

  async complete(
    messages: Array<{ role: string; content: string }>,
    options?: { temperature?: number; maxTokens?: number }
  ): Promise<LLMResponse> {
    const start = Date.now();

    try {
      const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: this.model,
          messages,
          temperature: options?.temperature ?? this.temperature,
          max_tokens: options?.maxTokens ?? this.maxTokens,
          stream: false,
        }),
        signal: AbortSignal.timeout(300000), // 5 min timeout for Celeron
      });

      if (!response.ok) {
        throw new Error(`OmniRoute error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const choice = data.choices?.[0];

      return {
        content: choice?.message?.content || "",
        model: data.model || this.model,
        tokens: {
          prompt: data.usage?.prompt_tokens || 0,
          completion: data.usage?.completion_tokens || 0,
          total: data.usage?.total_tokens || 0,
        },
        duration: Date.now() - start,
      };
    } catch (err) {
      return {
        content: "",
        model: this.model,
        tokens: { prompt: 0, completion: 0, total: 0 },
        duration: Date.now() - start,
      };
    }
  }

  // Chat completion for the agent loop
  async chat(systemPrompt: string, userMessage: string): Promise<LLMResponse> {
    return this.complete([
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ]);
  }
}
