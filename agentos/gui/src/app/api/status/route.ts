import { NextResponse } from "next/server";
import { healthCheck, listModels } from "@/lib/omniroute";
import { getHermesStatus } from "@/lib/hermes";
import { getGateState } from "@/lib/llm-gate";

export const dynamic = "force-dynamic";

export interface BreadcrumbSegment {
  label: string;
  status: "green" | "amber" | "red";
  detail?: string;
}

async function checkOllama(): Promise<{ ok: boolean; model?: string }> {
  try {
    const res = await fetch("http://localhost:11434/api/tags", { signal: AbortSignal.timeout(3000) });
    if (!res.ok) return { ok: false };
    const data = await res.json();
    const models = data.models || [];
    const model = models.find((m: { name: string }) => m.name.includes("minicpm"));
    return { ok: true, model: model?.name };
  } catch {
    return { ok: false };
  }
}

async function checkTools(): Promise<{ count: number; ok: boolean }> {
  try {
    const res = await fetch("http://localhost:3000/api/tools", { signal: AbortSignal.timeout(2000) });
    if (!res.ok) return { count: 0, ok: false };
    const data = await res.json();
    return { count: data.tools?.length || 0, ok: true };
  } catch {
    return { count: 0, ok: false };
  }
}

async function checkMcp(): Promise<{ count: number; ok: boolean }> {
  try {
    const res = await fetch("http://localhost:20128/health", { signal: AbortSignal.timeout(2000) });
    return { count: 0, ok: res.ok };
  } catch {
    return { count: 0, ok: false };
  }
}

async function checkVoice(): Promise<{ stt: boolean; realtime: boolean }> {
  const [stt, realtime] = await Promise.all([
    fetch("http://localhost:3101/health", { signal: AbortSignal.timeout(2000) })
      .then((r) => r.ok)
      .catch(() => false),
    fetch("http://localhost:3102/health", { signal: AbortSignal.timeout(2000) })
      .then((r) => r.ok)
      .catch(() => false),
  ]);
  return { stt, realtime };
}

export async function GET() {
  const [omniroute, hermes, models, ollama, tools, mcp, gate, voice] = await Promise.all([
    healthCheck(),
    getHermesStatus(),
    listModels(),
    checkOllama(),
    checkTools(),
    checkMcp(),
    getGateState(),
    checkVoice(),
  ]);

  const omniHealthy = omniroute.status === "ok" || (omniroute.providers && omniroute.providers.length > 0);

  const breadcrumbs: BreadcrumbSegment[] = [
    {
      label: "hermes",
      status: hermes.online ? "green" : "red",
      detail: hermes.online ? "Dashboard active" : "Offline",
    },
    {
      label: "ollama",
      status: ollama.ok ? "green" : omniHealthy ? "amber" : "red",
      detail: ollama.ok ? `Local (${ollama.model || "loaded"})` : omniHealthy ? "Via OmniRoute" : "Unreachable",
    },
    {
      label: models[0] || "openbmb/minicpm5",
      status: omniHealthy ? "green" : "red",
      detail: omniHealthy ? "Ready" : "No provider",
    },
    {
      label: "tools",
      status: tools.ok && tools.count > 0 ? "green" : "amber",
      detail: tools.ok ? `${tools.count} registered` : "Unavailable",
    },
    {
      label: "mcp",
      status: mcp.ok ? "green" : "amber",
      detail: mcp.ok ? "Connected" : "Not configured",
    },
  ];

  return NextResponse.json({
    omniroute,
    hermes,
    models,
    ollama: { ok: ollama.ok, model: ollama.model },
    tools: { count: tools.count, ok: tools.ok },
    gate,
    voice,
    breadcrumbs,
    timestamp: new Date().toISOString(),
  });
}
