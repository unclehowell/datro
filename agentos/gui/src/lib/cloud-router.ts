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
  maxTokens?: number;
  format: "openai" | "google";
}

interface CloudResponse {
  content: string;
  provider: string;
  model: string;
  duration: number;
  reasoning?: string;
}

// Load API keys from ~/.llm_keys
let cachedKeys: Record<string, string> | null = null;

// Called by the settings route whenever keys change so newly installed
// apps are picked up without restarting the server.
export function invalidateKeysCache() {
  cachedKeys = null;
}

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
async function quickPortCheck(baseUrl: string): Promise<boolean> {
  try {
    const u = new URL(baseUrl);
    const port = u.port || (u.protocol === "https:" ? "443" : "80");
    const net = await import("net");
    return new Promise<boolean>((resolve) => {
      const sock = new net.Socket();
      const done = () => { sock.destroy(); resolve(true); };
      const fail = () => { sock.destroy(); resolve(false); };
      sock.setTimeout(2000);
      sock.once("connect", done);
      sock.once("timeout", fail);
      sock.once("error", fail);
      sock.connect(parseInt(port, 10), u.hostname);
    });
  } catch {
    return false;
  }
}

async function getProviders(): Promise<CloudProvider[]> {
  const providers: CloudProvider[] = [];

  // Local Ollama (minicpm5) — PRIMARY so prompts never leave the device.
  // On phones/edge devices, this is the only LLM available and it must work
  // without any API keys. Listed first so all routing goes through it by default.
  // We do a fast port check first so we don't waste 120s on a hung provider.
  if (process.env.LLM_LOCAL_ONLY !== "false") {
    const ollamaUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434/v1";
    const ollamaReachable = await quickPortCheck(ollamaUrl).catch(() => false);
    if (ollamaReachable) {
      providers.push({
        name: "local-ollama",
        baseUrl: ollamaUrl,
        model: process.env.OLLAMA_MODEL || "minicpm5-32k",
        apiKey: "",
        timeout: 90000,
        maxTokens: 1024,
        format: "openai",
      });
    }
  }

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

  // DeepSeek — fast, cheap, OpenAI-compatible, with automatic prefix
  // caching (the shared ROUTER_SYSTEM prompt is cached server-side, so
  // the router classification gets a big latency cut). deepseek-chat is
  // the default; set DEEPSEEK_MODEL=deepseek-reasoner for the R1
  // reasoning harness (reasoning_content is captured and surfaced).
  const deepseekKey = getKey("DEEPSEEK_API_KEY");
  if (deepseekKey) {
    providers.push({
      name: "deepseek",
      baseUrl: "https://api.deepseek.com/v1",
      model: process.env.DEEPSEEK_MODEL || "deepseek-chat",
      apiKey: deepseekKey,
      timeout: 30000,
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

  // Local OmniRoute → ollama MiniCPM5-1B (prompt-cached). Slow (~2 tok/s) but
  // always on. Kept as a secondary local fallback if direct ollama is unavailable.
  // (This is only added if LLM_LOCAL_ONLY is not 'false' AND the direct ollama
  // provider wasn't already added above.)
  if (process.env.LLM_LOCAL_ONLY !== "false" && !providers.find(p => p.name === "local-ollama")) {
    providers.push({
      name: "local-minicpm",
      baseUrl: process.env.OMNIRUTE_URL || "http://localhost:20128/v1",
      model: "minicpm5-32k",
      apiKey: "",
      timeout: 900000,
      maxTokens: 100,
      format: "openai",
    });
  }

  // Local FCUK child proxy agent — routes via the parent's cloud LLMs, no key needed
  // (Only used as a remote fallback when local LLM is disabled via LLM_LOCAL_ONLY=false)
  if (process.env.LLM_LOCAL_ONLY === "false") {
    providers.push({
      name: "fcuk-agent",
      baseUrl: process.env.FCUK_AGENT_URL || "http://127.0.0.1:6100/v1",
      model: "auto",
      apiKey: "",
      timeout: 60000,
      format: "openai",
    });
  }

  return providers;
}

async function callOpenAI(provider: CloudProvider, messages: Array<{ role: string; content: string }>, options?: { tools?: any[]; tool_choice?: string | object }): Promise<CloudResponse> {
  const start = Date.now();
  const body: any = {
    model: provider.model,
    messages,
    max_tokens: provider.maxTokens || 500,
    temperature: 0.7,
  };
  // Only pass tools to providers that explicitly support them. Local ollama
  // (minicpm5) has limited/buggy tool support that often causes the request
  // to hang or fail silently. Pass tools only to providers with proper
  // tool-call implementation (cloud providers with API key).
  if (options?.tools && options.tools.length > 0 && provider.apiKey) {
    body.tools = options.tools;
    if (options.tool_choice) body.tool_choice = options.tool_choice;
  }
  const response = await fetch(`${provider.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${provider.apiKey}`,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(provider.timeout),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`${provider.name}: ${response.status} ${body.slice(0, 200)}`);
  }

  const data = await response.json();
  const msg = data.choices?.[0]?.message || {};
  return {
    content: msg.content || "",
    // DeepSeek reasoner emits its chain-of-thought in reasoning_content.
    reasoning: msg.reasoning_content || undefined,
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
  options?: { preferProvider?: string; tools?: any[]; tool_choice?: string | object }
): Promise<CloudResponse | null> {
  const providers = await getProviders();
  if (providers.length === 0) return null;

  if (options?.preferProvider) {
    providers.sort((a, b) => (a.name === options.preferProvider ? -1 : b.name === options.preferProvider ? 1 : 0));
  }

  for (const provider of providers) {
    try {
      const callOpts = { tools: options?.tools, tool_choice: options?.tool_choice };
      const result = provider.format === "google"
        ? await callGoogle(provider, messages)
        : await callOpenAI(provider, messages, callOpts);
      // Some proxies (fcuk-agent) return provider errors as HTTP 200 text.
      // Skip those and fall through to the next provider (local fallback).
      if (result.content && !isFailureContent(result.content)) {
        console.log(`[CLOUD] ${result.provider}/${result.model} responded in ${result.duration}ms`);
        return result;
      }
      console.log(`[CLOUD] ${provider.name} returned failure-looking content, trying next: ${String(result.content).slice(0, 80)}`);
    } catch (err: any) {
      console.log(`[CLOUD] ${provider.name} failed: ${err.message}`);
    }
  }

  return null;
}

function isFailureContent(content: string): boolean {
  const FAILURE_MARKERS = [
    /no llm available/i,
    /no providers? available/i,
    /all providers failed/i,
    /\[no endpoint\]/i,
    /set api keys/i,
    /no api key/i,
    /missing.*api key/i,
    /openai.*(?:api key|key).*required/i,
  ];
  return FAILURE_MARKERS.some((re) => re.test(content.slice(0, 300)));
}

export function hasCloudProviders(): Promise<boolean> {
  return getProviders().then(p => p.length > 0);
}

// Streaming variant of chatWithCloud — emits content deltas via onDelta as
// they arrive. Handles both OpenAI-style SSE (`data: {...}`) and raw ollama
// NDJSON passthrough (omniroute → ollama streams `{"message":{"content":...}}`
// lines). Google has no OpenAI-style streaming, so it is buffered and emitted
// in one shot. A provider that starts with failure-looking content is dropped
// before anything is forwarded to the caller.
export async function chatWithCloudStream(
  messages: Array<{ role: string; content: string }>,
  onDelta: (delta: string) => void,
  options?: { preferProvider?: string; signal?: AbortSignal }
): Promise<CloudResponse | null> {
  const providers = await getProviders();
  if (providers.length === 0) return null;

  if (options?.preferProvider) {
    providers.sort((a, b) => (a.name === options.preferProvider ? -1 : b.name === options.preferProvider ? 1 : 0));
  }

  const externalSignal = options?.signal;

  for (const provider of providers) {
    if (provider.format === "google") {
      try {
        const result = await callGoogle(provider, messages);
        if (result.content && !isFailureContent(result.content)) {
          onDelta(result.content);
          return result;
        }
      } catch (err: any) {
        console.log(`[CLOUD:stream] ${provider.name} failed: ${err.message}`);
      }
      continue;
    }

    let accumulated = "";
    let emittedLen = 0;
    let reasoning: string | undefined;
    const start = Date.now();

    try {
      const response = await fetch(`${provider.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${provider.apiKey}`,
        },
        body: JSON.stringify({
          model: provider.model,
          messages,
          max_tokens: provider.maxTokens || 500,
          temperature: 0.7,
          stream: true,
        }),
        signal: externalSignal
          ? AbortSignal.any([AbortSignal.timeout(provider.timeout), externalSignal])
          : AbortSignal.timeout(provider.timeout),
      });

      if (!response.ok || !response.body) {
        const body = await response.text().catch(() => "");
        throw new Error(`${provider.name}: ${response.status} ${body.slice(0, 200)}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });

        let nl: number;
        while ((nl = buf.indexOf("\n")) >= 0) {
          const line = buf.slice(0, nl).trim();
          buf = buf.slice(nl + 1);
          if (!line) continue;

          let delta = "";
          if (line.startsWith("data:")) {
            const payload = line.slice(5).trim();
            if (payload === "[DONE]") { streamDone = true; continue; }
            try {
              const json = JSON.parse(payload);
              const choice = json.choices?.[0];
              delta = choice?.delta?.content || "";
              if (choice?.delta?.reasoning_content) reasoning = (reasoning || "") + choice.delta.reasoning_content;
              if (choice?.finish_reason) streamDone = true;
            } catch {}
          } else {
            // ollama NDJSON passthrough (omniroute → ollama)
            try {
              const json = JSON.parse(line);
              delta = json.message?.content || "";
              if (json.message?.reasoning) reasoning = (reasoning || "") + json.message.reasoning;
              if (json.done) streamDone = true;
            } catch {}
          }

          if (delta) {
            accumulated += delta;
            if (emittedLen === 0 && isFailureContent(accumulated)) {
              throw new Error(`${provider.name} returned failure-looking content`);
            }
            onDelta(delta);
            emittedLen += delta.length;
          }
        }
      }

      if (!accumulated) continue;
      console.log(`[CLOUD:stream] ${provider.name}/${provider.model} streamed in ${Date.now() - start}ms`);
      return {
        content: accumulated,
        provider: provider.name,
        model: provider.model,
        duration: Date.now() - start,
        reasoning,
      };
    } catch (err: any) {
      if (emittedLen > 0) {
        // Already streamed content to the caller — returning a second answer
        // from another provider would confuse the client, so keep the partial.
        console.log(`[CLOUD:stream] ${provider.name} failed after streaming ${emittedLen} chars: ${err.message}`);
        return {
          content: accumulated,
          provider: provider.name,
          model: provider.model,
          duration: Date.now() - start,
          reasoning,
        };
      }
      console.log(`[CLOUD:stream] ${provider.name} failed: ${err.message}`);
    }
  }

  return null;
}
