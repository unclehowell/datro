// ============================================================
// Cloud Router — Free-tier LLM routing for conversational AI
// ============================================================
// Routes conversational requests to the best available free cloud model.
// Falls back to local MiniCPM5-1B if all cloud providers fail.
// ============================================================

import { readFileSync } from "fs";
import { homedir } from "os";
import { join } from "path";

interface CloudProvider {
  name: string;
  baseUrl: string;
  model: string;
  apiKey: string;
  timeout: number;
  format: "openai" | "google";
}

interface CloudResponse {
  content: string;
  provider: string;
  model: string;
  duration: number;
}

// Load API keys from ~/.llm_keys
let cachedKeys: Record<string, string> | null = null;

function loadKeys(): Record<string, string> {
  if (cachedKeys) return cachedKeys;
  cachedKeys = {};
  try {
    const raw = readFileSync(join(homedir(), ".llm_keys"), "utf-8");
    for (const line of raw.split("\n")) {
      const match = line.match(/^export\s+(\w+)=(.+)/);
      if (match) {
        cachedKeys[match[1]] = match[2].replace(/^["']|["']$/g, "").trim();
      }
    }
  } catch {}
  return cachedKeys;
}

function getKey(name: string): string {
  return loadKeys()[name] || process.env[name] || "";
}

// Free-tier providers in priority order
function getProviders(): CloudProvider[] {
  const providers: CloudProvider[] = [];

  const orKey = getKey("OPENROUTER_API_KEY");
  if (orKey) {
    providers.push({
      name: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      model: "meta-llama/llama-3.1-8b-instruct:free",
      apiKey: orKey,
      timeout: 30000,
      format: "openai",
    });
  }

  const groqKey = getKey("GROQ_API_KEY");
  if (groqKey) {
    providers.push({
      name: "groq",
      baseUrl: "https://api.groq.com/openai/v1",
      model: "llama-3.1-8b-instant",
      apiKey: groqKey,
      timeout: 15000,
      format: "openai",
    });
  }

  const cerebrasKey = getKey("CEREBRAS_API_KEY");
  if (cerebrasKey) {
    providers.push({
      name: "cerebras",
      baseUrl: "https://api.cerebras.ai/v1",
      model: "llama-3.1-8b",
      apiKey: cerebrasKey,
      timeout: 15000,
      format: "openai",
    });
  }

  const googleKey = getKey("GOOGLE_API_KEY");
  if (googleKey) {
    providers.push({
      name: "google",
      baseUrl: "https://generativelanguage.googleapis.com/v1beta",
      model: "gemini-2.0-flash",
      apiKey: googleKey,
      timeout: 30000,
      format: "google",
    });
  }

  const mistralKey = getKey("MISTRAL_API_KEY");
  if (mistralKey) {
    providers.push({
      name: "mistral",
      baseUrl: "https://api.mistral.ai/v1",
      model: "mistral-small-latest",
      apiKey: mistralKey,
      timeout: 30000,
      format: "openai",
    });
  }

  // Local FCUK child proxy agent — routes via the parent's cloud LLMs, no key needed
  providers.push({
    name: "fcuk-agent",
    baseUrl: process.env.FCUK_AGENT_URL || "http://127.0.0.1:6100/v1",
    model: "auto",
    apiKey: "",
    timeout: 60000,
    format: "openai",
  });

  return providers;
}

async function callOpenAI(provider: CloudProvider, messages: Array<{ role: string; content: string }>): Promise<CloudResponse> {
  const start = Date.now();
  const response = await fetch(`${provider.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${provider.apiKey}`,
    },
    body: JSON.stringify({
      model: provider.model,
      messages,
      max_tokens: 500,
      temperature: 0.7,
    }),
    signal: AbortSignal.timeout(provider.timeout),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`${provider.name}: ${response.status} ${body.slice(0, 200)}`);
  }

  const data = await response.json();
  return {
    content: data.choices?.[0]?.message?.content || "",
    provider: provider.name,
    model: provider.model,
    duration: Date.now() - start,
  };
}

async function callGoogle(provider: CloudProvider, messages: Array<{ role: string; content: string }>): Promise<CloudResponse> {
  const start = Date.now();
  const lastMsg = messages[messages.length - 1];
  const systemMsg = messages.find((m) => m.role === "system")?.content || "";

  const url = `${provider.baseUrl}/models/${provider.model}:generateContent?key=${provider.apiKey}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: lastMsg.content }] }],
      systemInstruction: systemMsg ? { parts: [{ text: systemMsg }] } : undefined,
      generationConfig: { maxOutputTokens: 500, temperature: 0.7 },
    }),
    signal: AbortSignal.timeout(provider.timeout),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`google: ${response.status} ${body.slice(0, 200)}`);
  }

  const data = await response.json();
  return {
    content: data.candidates?.[0]?.content?.parts?.[0]?.text || "",
    provider: provider.name,
    model: provider.model,
    duration: Date.now() - start,
  };
}

export async function chatWithCloud(
  messages: Array<{ role: string; content: string }>,
  options?: { preferProvider?: string }
): Promise<CloudResponse | null> {
  const providers = getProviders();
  if (providers.length === 0) return null;

  if (options?.preferProvider) {
    providers.sort((a, b) => (a.name === options.preferProvider ? -1 : b.name === options.preferProvider ? 1 : 0));
  }

  for (const provider of providers) {
    try {
      const result = provider.format === "google"
        ? await callGoogle(provider, messages)
        : await callOpenAI(provider, messages);
      if (result.content) {
        console.log(`[CLOUD] ${result.provider}/${result.model} responded in ${result.duration}ms`);
        return result;
      }
    } catch (err: any) {
      console.log(`[CLOUD] ${provider.name} failed: ${err.message}`);
    }
  }

  return null;
}

export function hasCloudProviders(): boolean {
  return getProviders().length > 0;
}
