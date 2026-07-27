import { NextResponse } from "next/server";
import { healthCheck, listModels } from "@/lib/omniroute";
import { getHermesStatus } from "@/lib/hermes";

export const dynamic = "force-dynamic";

async function getKokoroStatus(): Promise<{ online: boolean; model: string; voice: string }> {
  try {
    const res = await fetch("http://127.0.0.1:3101/health", { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      const data = await res.json();
      return { online: true, model: data.tts || "unknown", voice: "am_michael" };
    }
  } catch {}
  // Fallback: check child proxy /tts
  try {
    const res = await fetch("http://127.0.0.1:6000/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "test", voice: "am_michael" }),
      signal: AbortSignal.timeout(15000),
    });
    if (res.ok) return { online: true, model: "kokoro-onnx", voice: "am_michael" };
  } catch {}
  return { online: false, model: "none", voice: "none" };
}

export async function GET() {
  const [omniroute, hermes, models, kokoro] = await Promise.all([
    healthCheck(),
    getHermesStatus(),
    listModels(),
    getKokoroStatus(),
  ]);

  return NextResponse.json({
    omniroute,
    hermes,
    models,
    kokoro,
    timestamp: new Date().toISOString(),
  });
}
