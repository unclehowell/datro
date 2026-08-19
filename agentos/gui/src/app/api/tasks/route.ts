// ============================================================
// /api/tasks — background task queue (create, status, cancel)
// ============================================================
// GET    /api/tasks          → list of tasks (newest first)
// GET    /api/tasks?id=xyz   → single task status
// POST   {command, args, cwd, title, kind} → enqueue a task
// DELETE /api/tasks?id=xyz   → cancel/kill a task
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { getTaskManager } from "@/lib/tasks";
import { homedir } from "os";

export async function GET(req: NextRequest) {
  const tm = getTaskManager();
  const id = req.nextUrl.searchParams.get("id");
  if (id) {
    const task = tm.get(id);
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }
    const { log, ...rest } = task;
    return NextResponse.json({ task: { ...rest, tail: (log || "").slice(-8000) } });
  }
  return NextResponse.json({ tasks: tm.list(), active: tm.activeId() });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const command = String(body.command || "").trim();
  const args = Array.isArray(body.args) ? body.args.map(String) : [];
  if (!command) {
    return NextResponse.json({ error: "Missing command" }, { status: 400 });
  }
  const task = getTaskManager().enqueue({
    kind: (body.kind === "video" || body.kind === "delegate" ? body.kind : "cmd") as "video" | "delegate" | "cmd",
    title: String(body.title || command.split(" ")[0]),
    command,
    args,
    cwd: String(body.cwd || homedir()),
    outputPath: body.outputPath ? String(body.outputPath) : undefined,
    meta: body.meta && typeof body.meta === "object" ? body.meta : undefined,
  });
  return NextResponse.json({ task }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing task id" }, { status: 400 });
  }
  const ok = getTaskManager().cancel(id);
  return NextResponse.json({ ok, cancelled: id });
}
