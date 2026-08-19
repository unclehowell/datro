// App Store catalog for the Apps (settings) page. Every entry maps to a
// key in ~/.llm_keys that the cloud router / agent.py provider pool reads.
// Logos are inline SVG so the store never depends on a CDN at runtime.

export type AppAuth = "apikey" | "oauth" | "none";

export interface AppLogoProps {
  className?: string;
}

export interface AppInfo {
  key: string; // env key in ~/.llm_keys
  id: string; // stable slug
  name: string;
  vendor: string;
  category: "llm" | "service" | "system";
  auth: AppAuth;
  oauthPlatform?: string; // id used by /api/oauth/callback
  oauthAuthUrl?: string; // provider authorize endpoint
  oauthClientEnv?: string; // env var holding the registered client id
  desc: string;
  placeholder?: string;
  bg: string; // tile background (css color)
  fg: string; // logo fill
  alwaysInstalled?: boolean; // system apps — no install/uninstall
}

// Brand glyphs (single-color path data, drawn as white/fg fills).
const GEMINI =
  "M11.04 19.32Q12 21.51 12 24q0-2.49.93-4.68.96-2.19 2.58-3.81t3.81-2.55Q21.51 12 24 12q-2.49 0-4.68-.93a12.3 12.3 0 0 1-3.81-2.58 12.3 12.3 0 0 1-2.58-3.81Q12 2.49 12 0q0 2.49-.96 4.68-.93 2.19-2.55 3.81a12.3 12.3 0 0 1-3.81 2.58Q2.49 12 0 12q2.49 0 4.68.96 2.19.93 3.81 2.55t2.55 3.81";

const GOOGLE_G =
  "M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z";

const NVIDIA =
  "M8.948 8.798v-1.43a6.7 6.7 0 0 1 .424-.018c3.922-.124 6.493 3.374 6.493 3.374s-2.774 3.851-5.75 3.851c-.398 0-.787-.062-1.158-.185v-4.346c1.528.185 1.837.857 2.747 2.385l2.04-1.714s-1.492-1.952-4-1.952a6.016 6.016 0 0 0-.796.035m0-4.735v2.138l.424-.027c5.45-.185 9.01 4.47 9.01 4.47s-4.08 4.964-8.33 4.964c-.37 0-.733-.035-1.095-.097v1.325c.3.035.61.062.91.062 3.957 0 6.82-2.023 9.593-4.408.459.371 2.34 1.263 2.73 1.652-2.633 2.208-8.772 3.984-12.253 3.984-.335 0-.653-.018-.971-.053v1.864H24V4.063zm0 10.326v1.131c-3.657-.654-4.673-4.46-4.673-4.46s1.758-1.944 4.673-2.262v1.237H8.94c-1.528-.186-2.73 1.245-2.73 1.245s.68 2.412 2.739 3.11M2.456 10.9s2.164-3.197 6.5-3.533V6.201C4.153 6.59 0 10.653 0 10.653s2.35 6.802 8.948 7.42v-1.237c-4.84-.6-6.492-5.936-6.492-5.936z";

const OLLAMA =
  "M12 0c.394 0 .692.115.86.332.158.2.315.55.419.976.17.69.2 1.51.21 2.03l.002.475-.118.177-.119.178-.278-.006a3.7 3.7 0 0 0-.954.124l-.238.06c-.033.007-.038-.003-.057-.144a8.44 8.44 0 0 1 .016-2.323c.124-.788.413-1.501.696-1.711.067-.05.079-.049.157.013zm9.8 1.402c.24.19.42.524.56.952.29.89.34 2.06.2 3.17-.02.15-.03.16-.06.15l-.24-.06a3.7 3.7 0 0 0-.95-.13h-.28l-.12-.18-.12-.17.003-.48c.005-.67.07-1.19.21-1.77.16-.62.44-1.18.68-1.38.08-.06.09-.06.16-.01zM12 3.03c.6 0 1.2.18 1.75.5a4.86 4.86 0 0 0 1.53.71c.46.11.95.1 1.42 0 .2-.04.36-.02.5.04.15.08.24.19.32.33.08.17.15.28.25.44.25.36.58.7.94.96.34.25.66.39 1.03.48.5.13.9.1 1.22-.07.2-.11.3-.24.36-.42.05-.16.02-.3-.06-.5-.22-.4-.4-.7-.55-1.02-.3-.62-.7-1.06-1.19-1.3.28.12.54.3.77.53.32.32.53.74.65 1.24l.28 1.13c-.05.09-.2.14-.4.14l-.2-.02-.06-.07c-.36-.37-.85-.5-1.4-.32a3.09 3.09 0 0 1-.99.04c-.45-.08-.85-.3-1.22-.64a3.4 3.4 0 0 1-1.02.6c-.53.16-1.03.16-1.5 0a3.4 3.4 0 0 1-1.02-.6c-.37.34-.77.56-1.22.64a3.1 3.1 0 0 1-1-.04c-.54-.18-1.03-.05-1.4.32l-.06.07-.2.02c-.2 0-.35-.05-.4-.14l.28-1.13c.12-.5.33-.92.65-1.24.23-.23.49-.41.77-.53-.5.24-.9.68-1.2 1.3-.15.32-.33.62-.55 1.02-.08.2-.11.34-.06.5.06.18.16.31.36.42.32.17.72.2 1.22.07.37-.09.7-.23 1.03-.48.36-.26.7-.6.94-.96.1-.16.17-.27.25-.44.08-.14.17-.25.32-.33.14-.06.3-.08.5-.04.47.1.96.11 1.42 0a4.86 4.86 0 0 0 1.53-.71A4.57 4.57 0 0 1 12 3.03zm.85 4.96c-.29.05-.42.18-.42.4 0 .2.1.3.3.36.3.07.62.05.92-.05.16-.06.25-.13.25-.26 0-.2-.28-.42-.55-.44a1.2 1.2 0 0 0-.5-.01zm-2.1 0c-.27.06-.42.2-.42.4 0 .2.1.3.3.36.3.07.62.05.92-.05.16-.06.25-.13.25-.26 0-.2-.28-.42-.55-.44a1.2 1.2 0 0 0-.5-.01zm1.05 2.05c-.34.05-.45.21-.45.46 0 .26.12.43.44.6.12.06.15.12.15.24 0 .14-.06.33-.13.5-.06.14-.13.28-.13.4 0 .12.1.24.22.3.11.05.15.06.3.06.17 0 .22-.02.31-.08.15-.1.18-.26.1-.55-.05-.2-.03-.3.13-.38.17-.1.33-.25.38-.36a.32.32 0 0 0-.16-.45.35.35 0 0 0-.16-.03c-.12 0-.2.03-.33.13l-.08.05-.05-.03c-.17-.1-.22-.12-.32-.11-.08.01-.15.02-.18.06-.04.04-.06.11-.04.2a1.1 1.1 0 0 1-.06.25c-.03.05-.08.08-.14.06-.1-.03-.13-.16-.08-.32.06-.2.03-.3-.12-.35a.29.29 0 0 0-.12-.01z";

const OPENROUTER =
  "M16.778 1.844v1.919q-.569-.026-1.138-.032-.708-.008-1.415.037c-1.93.126-4.023.728-6.149 2.237-2.911 2.066-2.731 1.95-4.14 2.75-.396.223-1.342.574-2.185.798-.841.225-1.753.333-1.751.333v4.229s.768.108 1.61.333c.842.224 1.789.575 2.185.799 1.41.798 1.228.683 4.14 2.75 2.126 1.509 4.22 2.11 6.148 2.236.88.058 1.716.041 2.555.005v1.918l7.222-4.168-7.222-4.17v2.176c-.86.038-1.611.065-2.278.021-1.364-.09-2.417-.357-3.979-1.465-2.244-1.593-2.866-2.027-3.68-2.508.889-.518 1.449-.906 3.822-2.59 1.56-1.109 2.614-1.377 3.978-1.466.667-.044 1.418-.017 2.278.02v2.176L24 6.014Z";

const MISTRAL =
  "M17.143 3.429v3.428h-3.429v3.429h-3.428V6.857H6.857V3.43H3.43v13.714H0v3.428h10.286v-3.428H6.857v-3.429h3.429v3.429h3.429v-3.429h3.428v3.429h-3.428v3.428H24v-3.428h-3.43V3.429z";

const HF =
  "M12.025 1.13c-5.77 0-10.449 4.647-10.449 10.378 0 1.112.178 2.181.503 3.185.064-.222.203-.444.416-.577a.96.96 0 0 1 .524-.15c.293 0 .584.124.84.284.278.173.48.408.71.694.226.282.458.611.684.951v-.014c.017-.324.106-.622.264-.874s.403-.487.762-.543c.3-.047.596.06.787.203s.31.313.4.467c.15.257.212.468.233.542.01.026.653 1.552 1.657 2.54.616.605 1.01 1.223 1.082 1.912.055.537-.096 1.059-.38 1.572.637.121 1.294.187 1.967.187.657 0 1.298-.063 1.921-.178-.287-.517-.44-1.041-.384-1.581.07-.69.465-1.307 1.081-1.913 1.004-.987 1.647-2.513 1.657-2.539.021-.074.083-.285.233-.542.09-.154.208-.323.4-.467a1.08 1.08 0 0 1 .787-.203c.359.056.604.29.762.543s.247.55.265.874v.015c.225-.34.457-.67.683-.952.23-.286.432-.52.71-.694.257-.16.547-.284.84-.285a.97.97 0 0 1 .524.151c.228.143.373.388.43.625l.006.04a10.3 10.3 0 0 0 .534-3.273c0-5.731-4.678-10.378-10.449-10.378";

// Wordmark-style glyphs (custom paths for brands not in simple-icons).
const GROQ_BOLT = "M13 2 4.5 13.5H11L10 22l8.5-11.5H12l1-8.5z";

const HERMES_H = "M5 2h2.7v7.1H16.3V2H19v20h-2.7v-7.4H7.7V22H5V2z";

const FIREWORKS =
  "M12 0l2.2 9.8L24 12l-9.8 2.2L12 24l-2.2-9.8L0 12l9.8-2.2L12 0zm0 7.2L10.9 11 7.2 12l3.7 1 1.1 3.8 1.1-3.8 3.7-1-3.7-1L12 7.2z";

const COHERE =
  "M4 2.5C4 1.12 5.12 0 6.5 0h11C18.88 0 20 1.12 20 2.5v4C20 7.88 18.88 9 17.5 9h-11C5.12 9 4 7.88 4 6.5v-4zm0 9C4 10.12 5.12 9 6.5 9h11c1.38 0 2.5 1.12 2.5 2.5v4C20 16.88 18.88 18 17.5 18h-11C5.12 18 4 16.88 4 15.5v-4zm0 9C4 19.12 5.12 18 6.5 18h11c1.38 0 2.5 1.12 2.5 2.5v1c0 1.38-1.12 2.5-2.5 2.5h-11C5.12 24 4 22.88 4 21.5v-1z";

const DEEPINFRA =
  "M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm-1.1 6.9h1.9c1.72 0 3.03.42 3.92 1.27.89.83 1.33 1.98 1.33 3.46 0 1.03-.22 1.9-.66 2.63-.44.72-1.07 1.27-1.89 1.65l2.6 4.09h-2.7l-2.24-3.65h-1.63V20h-2.4V6.9h2.27zm-.02 5.48h1.27c.99 0 1.74-.2 2.25-.62.51-.42.76-1.04.76-1.86 0-.8-.25-1.4-.76-1.8-.5-.4-1.25-.6-2.25-.6h-1.27v4.88z";

const MEM0 =
  "M12 1C6.48 1 2 5.48 2 11c0 5.52 4.48 10 10 10s10-4.48 10-10c0-5.52-4.48-10-10-10zm-4.4 13.2c-.35 0-.64-.28-.64-.64V7.94c0-.36.29-.65.65-.65h1.4c.5 0 .94.3 1.13.77l1.86 4.5 1.86-4.5c.19-.47.63-.77 1.13-.77h1.4c.36 0 .65.29.65.65v5.62c0 .36-.29.64-.65.64h-1.2c-.36 0-.65-.28-.65-.64v-3.1l-1.66 3.6c-.15.33-.48.54-.84.54h-.29c-.36 0-.69-.21-.84-.54l-1.66-3.6v3.1c0 .36-.29.64-.65.64H7.6z";

const CEREBRAS =
  "M12 1.5a10.5 10.5 0 1 1 0 21 10.5 10.5 0 0 1 0-21zm0 2.8a7.7 7.7 0 1 0 0 15.4 7.7 7.7 0 0 0 0-15.4zm0 2.6a5.1 5.1 0 1 1 0 10.2 5.1 5.1 0 0 1 0-10.2zm-7 5.1a7.1 7.1 0 0 1 2.06-4.98l-1.98-1.98A10.52 10.52 0 0 0 2.6 12zm14 0h-2.5a4.5 4.5 0 0 1-1.4 3.27l1.78 1.78A7.46 7.46 0 0 0 17.4 14.6z";

const OMNIROUTE =
  "M12 2a3 3 0 0 0-2.86 3.86L6.14 8.86a3 3 0 1 0 .99 4.3l2.87 2.87a3 3 0 1 0 3.99.99l3.01-3.01a3 3 0 1 0-.99-4.3l-2.87-2.87A3 3 0 0 0 12 2zM12 4a1 1 0 1 1 0 2 1 1 0 0 1 0-2zM6 10a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm12 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2zM12 16a1 1 0 1 1 0 2 1 1 0 0 1 0-2z";

const HERMES = HERMES_H;

function PathLogo({ d, fg, className }: { d: string; fg: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill={fg} aria-hidden>
      <path d={d} />
    </svg>
  );
}

export function AppLogo({ app, className = "w-10 h-10" }: { app: AppInfo; className?: string }) {
  const logo: Record<string, string> = {
    "google-gemini": GEMINI,
    "google-tts": GOOGLE_G,
    "groq": GROQ_BOLT,
    "openrouter": OPENROUTER,
    "nvidia": NVIDIA,
    "ollama-cloud": OLLAMA,
    "cerebras": CEREBRAS,
    "mistral": MISTRAL,
    "deepinfra": DEEPINFRA,
    "fireworks": FIREWORKS,
    "cohere": COHERE,
    "huggingface": HF,
    "mem0": MEM0,
    "omniroute": OMNIROUTE,
    "hermes": HERMES,
  };
  const d = logo[app.id];
  return d ? (
    <PathLogo d={d} fg={app.fg} className={className} />
  ) : (
    <span className={`${className} flex items-center justify-center font-bold text-sm`} style={{ color: app.fg }}>
      {app.name.slice(0, 2).toUpperCase()}
    </span>
  );
}

export const APPS: AppInfo[] = [
  {
    key: "GOOGLE_API_KEY",
    id: "google-gemini",
    name: "Gemini",
    vendor: "Google",
    category: "llm",
    auth: "oauth",
    oauthPlatform: "google-gemini",
    oauthAuthUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    oauthClientEnv: "GOOGLE_OAUTH_CLIENT_ID",
    desc: "Google Gemini free-tier model access for the child proxy's cloud brain.",
    placeholder: "AIza...",
    bg: "#8E75B2",
    fg: "#ffffff",
  },
  {
    key: "GROQ_API_KEY",
    id: "groq",
    name: "Groq",
    vendor: "Groq, Inc.",
    category: "llm",
    auth: "apikey",
    desc: "Fast LPU-backed inference with a free tier. llama-3.1-8b-instant.",
    placeholder: "gsk_...",
    bg: "#F55036",
    fg: "#ffffff",
  },
  {
    key: "OPENROUTER_API_KEY",
    id: "openrouter",
    name: "OpenRouter",
    vendor: "OpenRouter",
    category: "llm",
    auth: "apikey",
    desc: "One key for hundreds of models, with :free tagged options.",
    placeholder: "sk-or-...",
    bg: "#1b1b1f",
    fg: "#94A3B8",
  },
  {
    key: "NVIDIA_API_KEY",
    id: "nvidia",
    name: "NVIDIA",
    vendor: "NVIDIA build.nvidia.com",
    category: "llm",
    auth: "apikey",
    desc: "NVIDIA NIM / build.nvidia.com hosted models.",
    placeholder: "nvapi-...",
    bg: "#76B900",
    fg: "#ffffff",
  },
  {
    key: "OLLAMA_CLOUD_API_KEY",
    id: "ollama-cloud",
    name: "Ollama Cloud",
    vendor: "Ollama",
    category: "llm",
    auth: "apikey",
    desc: "Hosted Ollama models for cloud inference.",
    placeholder: "ollama-...",
    bg: "#222222",
    fg: "#ffffff",
  },
  {
    key: "CEREBRAS_API_KEY",
    id: "cerebras",
    name: "Cerebras",
    vendor: "Cerebras Systems",
    category: "llm",
    auth: "apikey",
    desc: "Ultra-fast inference at 1,000+ tok/s on the WSE.",
    placeholder: "cerebras key",
    bg: "#0F2A3D",
    fg: "#FFB84D",
  },
  {
    key: "MISTRAL_API_KEY",
    id: "mistral",
    name: "Mistral AI",
    vendor: "Mistral AI",
    category: "llm",
    auth: "apikey",
    desc: "European frontier models with a free tier.",
    placeholder: "Mistral key",
    bg: "#FA5200",
    fg: "#ffffff",
  },
  {
    key: "DEEPINFRA_API_KEY",
    id: "deepinfra",
    name: "DeepInfra",
    vendor: "DeepInfra",
    category: "llm",
    auth: "apikey",
    desc: "Serverless open-model inference on GPUs.",
    placeholder: "DeepInfra key",
    bg: "#8B5CF6",
    fg: "#ffffff",
  },
  {
    key: "FIREWORKS_API_KEY",
    id: "fireworks",
    name: "Fireworks",
    vendor: "Fireworks AI",
    category: "llm",
    auth: "apikey",
    desc: "Fast fine-tuned and open models with fire attention.",
    placeholder: "Fireworks key",
    bg: "#FF4D00",
    fg: "#ffffff",
  },
  {
    key: "COHERE_API_KEY",
    id: "cohere",
    name: "Cohere",
    vendor: "Cohere",
    category: "llm",
    auth: "apikey",
    desc: "Command models plus RAG / rerank for grounded answers.",
    placeholder: "Cohere key",
    bg: "#E85D3D",
    fg: "#ffffff",
  },
  {
    key: "HF_TOKEN",
    id: "huggingface",
    name: "Hugging Face",
    vendor: "Hugging Face",
    category: "llm",
    auth: "oauth",
    oauthPlatform: "huggingface",
    oauthAuthUrl: "https://huggingface.co/oauth/authorize",
    oauthClientEnv: "HF_OAUTH_CLIENT_ID",
    desc: "Router + inference over the Hub's free models.",
    placeholder: "hf_...",
    bg: "#FFD21E",
    fg: "#101014",
  },
  {
    key: "GOOGLE_TTS_API_KEY",
    id: "google-tts",
    name: "Google TTS",
    vendor: "Google",
    category: "service",
    auth: "oauth",
    oauthPlatform: "google-tts",
    oauthAuthUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    oauthClientEnv: "GOOGLE_OAUTH_CLIENT_ID",
    desc: "Neural voices for the voice agent when edge-tts falls back to cloud.",
    placeholder: "AIza...",
    bg: "#ffffff",
    fg: "#4285F4",
  },
  {
    key: "MEM0_API_KEY",
    id: "mem0",
    name: "Mem0",
    vendor: "Mem0",
    category: "service",
    auth: "apikey",
    desc: "Layered long-term memory for the agent between sessions.",
    placeholder: "Mem0 key",
    bg: "#6C5CE7",
    fg: "#ffffff",
  },
  {
    key: "OMNIRUTE_URL",
    id: "omniroute",
    name: "OmniRoute",
    vendor: "AgentOS local",
    category: "system",
    auth: "none",
    desc: "Local routing proxy across all configured providers. Ships with the machine.",
    bg: "#1F2937",
    fg: "#22D3EE",
    alwaysInstalled: true,
  },
  {
    key: "HERMES_URL",
    id: "hermes",
    name: "Hermes",
    vendor: "AgentOS local",
    category: "system",
    auth: "none",
    desc: "Local tool / skills executor used by the child agent. Ships with the machine.",
    bg: "#1F2937",
    fg: "#FACC15",
    alwaysInstalled: true,
  },
];

// Map oauth platform id → settings key so a completed OAuth handshake can
// drop the token straight into ~/.llm_keys for the router to use.
export const OAUTH_KEY_MAP: Record<string, string> = {
  "google-gemini": "GOOGLE_API_KEY",
  "google-tts": "GOOGLE_TTS_API_KEY",
  "huggingface": "HF_TOKEN",
};

export const OAUTH_AUTH_URL: Record<string, string> = {
  "google-gemini": "https://accounts.google.com/o/oauth2/v2/auth",
  "google-tts": "https://accounts.google.com/o/oauth2/v2/auth",
  "huggingface": "https://huggingface.co/oauth/authorize",
};

export const OAUTH_CLIENT_ENV: Record<string, string> = {
  "google-gemini": "GOOGLE_OAUTH_CLIENT_ID",
  "google-tts": "GOOGLE_OAUTH_CLIENT_ID",
  "huggingface": "HF_OAUTH_CLIENT_ID",
};
