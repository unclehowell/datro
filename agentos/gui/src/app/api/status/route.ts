import { NextResponse } from "next/server";
import { healthCheck, listModels } from "@/lib/omniroute";
import { getHermesStatus } from "@/lib/hermes";

export const dynamic = "force-dynamic";

export async function GET() {
  const [omniroute, hermes, models] = await Promise.all([
    healthCheck(),
    getHermesStatus(),
    listModels(),
  ]);

  return NextResponse.json({
    omniroute,
    hermes,
    models,
    timestamp: new Date().toISOString(),
  });
}
