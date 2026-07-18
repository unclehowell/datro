import { NextRequest, NextResponse } from "next/server";
import { searchMemory, addMemory, listMemories } from "@/lib/memory";

export async function GET(req: NextRequest) {
  const action = req.nextUrl.searchParams.get("action");
  const userId = req.nextUrl.searchParams.get("userId") || "sion";

  if (action === "search") {
    const query = req.nextUrl.searchParams.get("q") || "";
    const results = await searchMemory(query, userId);
    return NextResponse.json({ results });
  }

  const memories = await listMemories(userId);
  return NextResponse.json({ memories });
}

export async function POST(req: NextRequest) {
  const { content, userId = "sion", metadata } = await req.json();
  if (!content) return NextResponse.json({ error: "content required" }, { status: 400 });
  const id = await addMemory(content, userId, metadata || {});
  return NextResponse.json({ id, success: !!id });
}
