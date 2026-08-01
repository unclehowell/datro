import { NextRequest, NextResponse } from "next/server";
import { isProxyLocked, lockForProxy, unlockProxy, getProxyLock } from "@/lib/proxy-state";

// ─── In-memory session store (shared globally) ─────────────
interface ProxySession {
  id: string;
  prompt: string;
  response: string | null;
  status: "pending" | "processing" | "completed" | "error";
  createdAt: number;
  completedAt: number | null;
  origin: string; // parent proxy URL
  error?: string;
}

declare global {
  // eslint-disable-next-line no-var
  var __proxySessions: Map<string, ProxySession> | undefined;
}
const sessions = globalThis.__proxySessions || new Map<string, ProxySession>();
globalThis.__proxySessions = sessions;

// Cleanup old sessions every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [id, session] of sessions) {
    if (now - session.createdAt > 300000) { // 5 min
      sessions.delete(id);
    }
  }
}, 300000);

// ─── POST /api/proxy/submit ────────────────────────────────
// Parent proxy submits a prompt to the child
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, origin } = body;

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    // Check if session is locked by another parent
    if (isProxyLocked()) {
      const lock = getProxyLock();
      if (lock && lock.sessionId !== body.sessionId) {
        return NextResponse.json({
          error: "Child proxy is locked by another session",
          lockOwner: lock.sessionId,
          retryAfter: 30,
        }, { status: 423 });
      }
    }

    const sessionId = body.sessionId || `proxy-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    // Create session
    const session: ProxySession = {
      id: sessionId,
      prompt,
      response: null,
      status: "processing",
      createdAt: Date.now(),
      completedAt: null,
      origin: origin || "unknown",
    };
    sessions.set(sessionId, session);

    // Lock the session for this parent
    lockForProxy(sessionId, origin || "parent");

    // Process the prompt asynchronously via the chat API
    processPrompt(sessionId, prompt).catch((err) => {
      const s = sessions.get(sessionId);
      if (s) {
        s.status = "error";
        s.error = err.message || "Processing failed";
        s.completedAt = Date.now();
      }
    });

    return NextResponse.json({
      sessionId,
      status: "processing",
      message: "Prompt submitted. Poll /api/proxy/poll for response.",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ─── GET /api/proxy/poll ───────────────────────────────────
// Parent polls for response
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const sessionId = url.searchParams.get("sessionId");

  if (!sessionId) {
    return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
  }

  const session = sessions.get(sessionId);
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (session.status === "completed" || session.status === "error") {
    // Release lock when done
    unlockProxy();
  }

  return NextResponse.json({
    sessionId: session.id,
    status: session.status,
    response: session.response,
    error: session.error,
    createdAt: session.createdAt,
    completedAt: session.completedAt,
  });
}

// ─── Helper: process prompt via chat API ───────────────────
async function processPrompt(sessionId: string, prompt: string) {
  const session = sessions.get(sessionId);
  if (!session) return;

  try {
    // Call the local chat API
    const chatRes = await fetch("http://localhost:3000/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: prompt }],
        model: "openbmb/minicpm5",
        proxySessionId: sessionId, // flag to prevent recursive proxy
      }),
    });

    if (!chatRes.ok) {
      throw new Error(`Chat API returned ${chatRes.status}`);
    }

    const data = await chatRes.json();
    session.response = data.reply || "No response";
    session.status = "completed";
    session.completedAt = Date.now();
  } catch (err: any) {
    session.status = "error";
    session.error = err.message;
    session.completedAt = Date.now();
  }
}
