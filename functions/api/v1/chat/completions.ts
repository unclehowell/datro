interface Env {
  DB: D1Database;
  OPENAI_API_KEY?: string;
  OPENROUTER_API_KEY?: string;
  GROQ_API_KEY?: string;
  GOOGLE_API_KEY?: string;
  DEEPSEEK_API_KEY?: string;
  MISTRAL_API_KEY?: string;
  TOGETHER_API_KEY?: string;
  PERPLEXITY_API_KEY?: string;
}

interface ChatMessage {
  role: string;
  content: string;
}

interface ChatRequest {
  model?: string;
  messages: ChatMessage[];
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
}

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

const providers: { name: string; key: string; url: string; mapModel: (m: string) => string }[] = [
  {
    name: 'openrouter',
    key: 'OPENROUTER_API_KEY',
    url: 'https://openrouter.ai/api/v1/chat/completions',
    mapModel: (m) => m || 'google/gemini-2.0-flash-exp:free',
  },
  {
    name: 'groq',
    key: 'GROQ_API_KEY',
    url: 'https://api.groq.com/openai/v1/chat/completions',
    mapModel: (m) => m || 'llama-3.3-70b-versatile',
  },
  {
    name: 'gemini',
    key: 'GOOGLE_API_KEY',
    url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
    mapModel: (m) => m || 'gemini-2.0-flash',
  },
  {
    name: 'deepseek',
    key: 'DEEPSEEK_API_KEY',
    url: 'https://api.deepseek.com/chat/completions',
    mapModel: (m) => m || 'deepseek-chat',
  },
  {
    name: 'openai',
    key: 'OPENAI_API_KEY',
    url: 'https://api.openai.com/v1/chat/completions',
    mapModel: (m) => m || 'gpt-4o-mini',
  },
  {
    name: 'mistral',
    key: 'MISTRAL_API_KEY',
    url: 'https://api.mistral.ai/v1/chat/completions',
    mapModel: (m) => m || 'mistral-small-latest',
  },
  {
    name: 'together',
    key: 'TOGETHER_API_KEY',
    url: 'https://api.together.xyz/v1/chat/completions',
    mapModel: (m) => m || 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
  },
];

async function proxyChat(body: ChatRequest, env: Env): Promise<Response> {
  const messages = body.messages || [];
  const model = body.model || 'auto';

  const lastUser = [...messages].reverse().find((m) => m.role === 'user');
  const prompt = lastUser?.content || messages[messages.length - 1]?.content || '';

  let lastErr: string | null = null;

  for (const provider of providers) {
    const apiKey = env[provider.key as keyof Env] as string | undefined;
    if (!apiKey) continue;

    const mappedModel = provider.mapModel(model);

    try {
      const resp = await fetch(provider.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: mappedModel,
          messages,
          stream: false,
          temperature: body.temperature ?? 0.7,
          max_tokens: body.max_tokens ?? 1024,
        }),
        signal: AbortSignal.timeout(30000),
      });

      if (resp.ok) {
        const data = await resp.json();
        return json(data, 200);
      }

      const errText = await resp.text().catch(() => '');
      lastErr = `${provider.name} ${resp.status}: ${errText?.slice(0, 120)}`;
    } catch (err: any) {
      lastErr = `${provider.name} error: ${err?.message || err}`;
    }
  }

  return json({
    error: 'all_providers_failed',
    detail: lastErr,
    hint: 'Configure at least one LLM provider key in Cloudflare Pages environment variables.',
  }, 502);
}

export async function onRequestPost(context: { request: Request; env: Env }): Promise<Response> {
  try {
    const body = await context.request.json() as ChatRequest;
    return proxyChat(body, context.env);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Invalid JSON body';
    return json({ error: 'bad_request', detail: msg }, 400);
  }
}

export async function onRequestGet(context: { request: Request; env: Env }): Promise<Response> {
  const available = providers
    .filter((p) => Boolean((context.env as any)[p.key]))
    .map((p) => ({ provider: p.name, model: p.mapModel('') }));

  return json({
    ok: true,
    endpoint: '/v1/chat/completions',
    methods: ['POST'],
    available_providers: available,
  }, 200);
}

export async function onRequestOptions(): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}
