import { NextResponse } from "next/server";
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { homedir } from "os";
import { join } from "path";

export const dynamic = "force-dynamic";

const KEYS_PATH = join(homedir(), ".llm_keys");

// Provider config: env key name → human label. These map to the free-tier
// providers supported by cloud-router.ts and agent.py's provider pool.
export const LLM_PROVIDERS = [
  { key: "GOOGLE_API_KEY", label: "Google Gemini (free)", placeholder: "AIza..." },
  { key: "GROQ_API_KEY", label: "Groq (free)", placeholder: "gsk_..." },
  { key: "OPENROUTER_API_KEY", label: "OpenRouter (:free)", placeholder: "sk-or-..." },
  { key: "NVIDIA_API_KEY", label: "NVIDIA build.nvidia.com", placeholder: "nvapi-..." },
  { key: "OLLAMA_CLOUD_API_KEY", label: "Ollama Cloud", placeholder: "ollama-..." },
  { key: "CEREBRAS_API_KEY", label: "Cerebras (free)", placeholder: "" },
  { key: "MISTRAL_API_KEY", label: "Mistral (free tier)", placeholder: "" },
  { key: "DEEPINFRA_API_KEY", label: "DeepInfra", placeholder: "" },
  { key: "FIREWORKS_API_KEY", label: "Fireworks", placeholder: "" },
  { key: "COHERE_API_KEY", label: "Cohere", placeholder: "" },
  { key: "HF_TOKEN", label: "HuggingFace Router", placeholder: "hf_..." },
] as const;

export const OTHER_KEYS = [
  "OMNIRUTE_URL",
  "HERMES_URL",
  "GOOGLE_TTS_API_KEY",
  "MEM0_API_KEY",
] as const;

export type KeyMap = Record<string, string>;

function readKeys(): KeyMap {
  const out: KeyMap = {};
  try {
    const raw = readFileSync(KEYS_PATH, "utf-8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^export\s+(\w+)=(.*)/);
      if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch {}
  return out;
}

function writeKeys(keys: KeyMap) {
  mkdirSync(homedir(), { recursive: true });
  const lines = Object.entries(keys)
    .map(([k, v]) => `export ${k}="${v ? v.replace(/(["\s])/g, "\\$1") : ""}"`)
    .join("\n");
  writeFileSync(KEYS_PATH, lines + "\n", { mode: 0o600 });
}

export async function GET() {
  const keys = readKeys();
  return NextResponse.json({ keys, path: KEYS_PATH });
}

export async function POST(request: Request) {
  let patch: KeyMap = {};
  try {
    patch = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const current = readKeys();
  for (const [k, v] of Object.entries(patch)) {
    current[k] = typeof v === "string" ? v : "";
  }
  writeKeys(current);
  return NextResponse.json({ ok: true, path: KEYS_PATH });
}