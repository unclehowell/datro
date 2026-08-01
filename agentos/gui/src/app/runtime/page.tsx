"use client";

import { useState, useEffect, useRef } from "react";

interface Session {
  id: string;
  goal: string;
  status: string;
  priority: string;
  completedSteps: any[];
  observations: string[];
  logs: any[];
  cost: { tokens: number; toolCalls: number; duration: number; estimatedDollars: number };
  confidence: { score: number; factors: string[] };
  timeline: any[];
  proceduresUsed: string[];
  proceduresCreated: string[];
  createdAt: number;
  updatedAt: number;
}

interface RuntimeEvent {
  type: string;
  sessionId?: string;
  stage?: string;
  message?: string;
  tool?: string;
  worker?: string;
  decision?: any;
  [key: string]: any;
}

export default function RuntimePage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [goal, setGoal] = useState("");
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<RuntimeEvent[]>([]);
  const [cognition, setCognition] = useState<string[]>([]);
  const [procedures, setProcedures] = useState<any>(null);
  const [connected, setConnected] = useState(false);
  const eventsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadSessions();
    connectSSE();
    const interval = setInterval(loadSessions, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    eventsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [events, cognition]);

  function connectSSE() {
    const source = new EventSource("/api/events");
    source.onmessage = (e) => {
      try {
        const event: RuntimeEvent = JSON.parse(e.data);
        if (event.type === "connected") {
          setConnected(true);
          return;
        }
        if (event.type === "heartbeat") return;

        setEvents((prev) => [...prev.slice(-100), event]);

        // Track cognition events
        if (event.type === "cognition" && event.message) {
          setCognition((prev) => [...prev.slice(-50), `[${event.stage}] ${event.message}`]);
        }

        // Refresh sessions on key events
        if (["session_completed", "session_failed", "session_started", "action_completed"].includes(event.type)) {
          loadSessions();
        }
      } catch {}
    };
    source.onerror = () => {
      setConnected(false);
      setTimeout(connectSSE, 5000);
    };
  }

  async function loadSessions() {
    try {
      const res = await fetch("/api/sessions");
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
        if (data.procedures) setProcedures(data.procedures);
      }
    } catch {}
  }

  async function createSession() {
    if (!goal.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal: goal.trim(), priority: "high" }),
      });
      const data = await res.json();
      if (data.session) {
        await fetch("/api/sessions", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: data.session.id, action: "start" }),
        });
        setGoal("");
        loadSessions();
      }
    } catch {}
    setLoading(false);
  }

  function formatTime(ts: number) {
    return new Date(ts).toLocaleTimeString();
  }

  function statusColor(status: string) {
    const colors: Record<string, string> = {
      running: "#4caf50", planning: "#ff9800", completed: "#2196f3",
      failed: "#f44336", queued: "#9e9e9e", paused: "#ff5722",
      cancelled: "#607d8b", reflecting: "#9c27b0", verifying: "#00bcd4",
    };
    return colors[status] || "#9e9e9e";
  }

  const stageIcons: Record<string, string> = {
    system: "🔵", planner: "📋", executor: "⚡", verifier: "✅",
    reflector: "🪞", supervisor: "👁️", worker: "🤖", memory: "🧠",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", color: "#e8e0d0", fontFamily: "'JetBrains Mono', monospace", padding: "20px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1px solid #333", paddingBottom: "10px" }}>
        <h1 style={{ color: "#e8b84e", margin: 0, fontSize: "20px" }}>HERMES — AUTONOMOUS RUNTIME</h1>
        <div style={{ display: "flex", gap: "15px", fontSize: "12px", alignItems: "center" }}>
          <span style={{ color: connected ? "#4caf50" : "#f44336" }}>● {connected ? "STREAMING" : "DISCONNECTED"}</span>
          <span>Sessions: {sessions.length}</span>
          <span>Active: {sessions.filter((s) => ["running", "planning"].includes(s.status)).length}</span>
          {procedures && <span>Procedures: {procedures.total}</span>}
        </div>
      </div>

      {/* New Objective */}
      <div style={{ background: "#111", borderRadius: "8px", padding: "15px", marginBottom: "20px", border: "1px solid #333" }}>
        <div style={{ color: "#e8b84e", fontSize: "12px", marginBottom: "8px", fontWeight: "bold" }}>NEW OBJECTIVE</div>
        <div style={{ display: "flex", gap: "10px" }}>
          <input value={goal} onChange={(e) => setGoal(e.target.value)} onKeyDown={(e) => e.key === "Enter" && createSession()}
            placeholder="Enter an objective for the autonomous runtime..."
            disabled={loading}
            style={{ flex: 1, background: "#1a1a2e", border: "1px solid #333", borderRadius: "4px", color: "#e8e0d0", padding: "8px 12px", fontSize: "13px", fontFamily: "inherit" }} />
          <button onClick={createSession} disabled={loading || !goal.trim()}
            style={{ background: loading ? "#555" : "#e8b84e", color: loading ? "#999" : "#000", border: "none", borderRadius: "4px", padding: "8px 20px", fontSize: "13px", fontWeight: "bold", cursor: loading ? "wait" : "pointer", fontFamily: "inherit" }}>
            {loading ? "CREATING..." : "LAUNCH"}
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "15px" }}>
        {/* Sessions List */}
        <div style={{ background: "#111", borderRadius: "8px", padding: "15px", border: "1px solid #333", maxHeight: "60vh", overflow: "auto" }}>
          <div style={{ color: "#e8b84e", fontSize: "12px", marginBottom: "10px", fontWeight: "bold" }}>SESSIONS</div>
          {sessions.length === 0 ? (
            <div style={{ color: "#666", fontSize: "12px" }}>No sessions yet</div>
          ) : sessions.map((s) => (
            <div key={s.id} onClick={() => setSelectedSession(s)}
              style={{ background: selectedSession?.id === s.id ? "#1a2a1a" : "#0d0d15", border: `1px solid ${selectedSession?.id === s.id ? "#4caf50" : "#222"}`, borderRadius: "6px", padding: "10px", marginBottom: "8px", cursor: "pointer" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "12px", fontWeight: "bold" }}>{s.goal.slice(0, 40)}{s.goal.length > 40 ? "..." : ""}</span>
                <span style={{ background: statusColor(s.status), color: "#fff", padding: "2px 6px", borderRadius: "10px", fontSize: "9px", fontWeight: "bold" }}>{s.status.toUpperCase()}</span>
              </div>
              <div style={{ display: "flex", gap: "8px", marginTop: "4px", fontSize: "9px", color: "#888" }}>
                <span>Steps: {s.completedSteps.length}</span>
                <span>Conf: {Math.round((s.confidence?.score || 0) * 100)}%</span>
                <span>Cost: {s.cost?.toolCalls || 0} calls</span>
                <span>{formatTime(s.updatedAt)}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Session Detail */}
        <div style={{ background: "#111", borderRadius: "8px", padding: "15px", border: "1px solid #333", maxHeight: "60vh", overflow: "auto" }}>
          <div style={{ color: "#e8b84e", fontSize: "12px", marginBottom: "10px", fontWeight: "bold" }}>SESSION DETAIL</div>
          {selectedSession ? (
            <div>
              <div style={{ fontSize: "13px", fontWeight: "bold", marginBottom: "10px" }}>{selectedSession.goal}</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", marginBottom: "12px" }}>
                {[["Status", selectedSession.status], ["Priority", selectedSession.priority],
                  ["Confidence", `${Math.round((selectedSession.confidence?.score || 0) * 100)}%`],
                  ["Tool Calls", `${selectedSession.cost?.toolCalls || 0}`],
                  ["Procedures Used", `${selectedSession.proceduresUsed?.length || 0}`],
                  ["Procedures Created", `${selectedSession.proceduresCreated?.length || 0}`],
                ].map(([label, value]) => (
                  <div key={label} style={{ background: "#0d0d15", borderRadius: "4px", padding: "6px 8px" }}>
                    <div style={{ color: "#888", fontSize: "8px" }}>{label}</div>
                    <div style={{ color: "#e8e0d0", fontSize: "11px" }}>{value}</div>
                  </div>
                ))}
              </div>
              {selectedSession.observations.length > 0 && (
                <div style={{ marginBottom: "12px" }}>
                  <div style={{ color: "#e8b84e", fontSize: "10px", marginBottom: "4px" }}>OBSERVATIONS</div>
                  {selectedSession.observations.slice(-5).map((obs, i) => (
                    <div key={i} style={{ background: "#0d0d15", borderRadius: "4px", padding: "4px 8px", marginBottom: "3px", fontSize: "10px", color: "#aaa" }}>{obs}</div>
                  ))}
                </div>
              )}
              {selectedSession.logs.length > 0 && (
                <div>
                  <div style={{ color: "#e8b84e", fontSize: "10px", marginBottom: "4px" }}>LOGS</div>
                  {selectedSession.logs.slice(-8).map((log, i) => (
                    <div key={i} style={{ background: "#0d0d15", borderRadius: "4px", padding: "3px 8px", marginBottom: "2px", fontSize: "9px", fontFamily: "monospace",
                      color: log.level === "error" ? "#f44336" : log.level === "warn" ? "#ff9800" : "#aaa" }}>
                      [{log.level}] {log.message}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : <div style={{ color: "#666", fontSize: "12px" }}>Select a session</div>}
        </div>

        {/* Cognition Stream */}
        <div style={{ background: "#111", borderRadius: "8px", padding: "15px", border: "1px solid #333", maxHeight: "60vh", overflow: "auto" }}>
          <div style={{ color: "#e8b84e", fontSize: "12px", marginBottom: "10px", fontWeight: "bold" }}>COGNITION STREAM</div>
          {cognition.length === 0 ? (
            <div style={{ color: "#666", fontSize: "12px" }}>Waiting for activity...</div>
          ) : cognition.map((line, i) => {
            const stage = line.match(/^\[(\w+)\]/)?.[1] || "";
            return (
              <div key={i} style={{ background: "#0d0d15", borderRadius: "4px", padding: "4px 8px", marginBottom: "2px", fontSize: "10px", fontFamily: "monospace" }}>
                <span style={{ color: "#888" }}>{stageIcons[stage] || "•"}</span>{" "}
                <span style={{ color: "#aaa" }}>{line}</span>
              </div>
            );
          })}
          <div ref={eventsEndRef} />
        </div>
      </div>

      {/* Recent Events */}
      {events.length > 0 && (
        <div style={{ background: "#111", borderRadius: "8px", padding: "15px", marginTop: "15px", border: "1px solid #333" }}>
          <div style={{ color: "#e8b84e", fontSize: "12px", marginBottom: "10px", fontWeight: "bold" }}>RECENT EVENTS</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
            {events.slice(-15).reverse().map((event, i) => (
              <div key={i} style={{ background: "#0d0d15", borderRadius: "4px", padding: "4px 8px", fontSize: "10px", fontFamily: "monospace", display: "flex", gap: "8px" }}>
                <span style={{ color: "#666" }}>{event.type}</span>
                <span style={{ color: "#888" }}>{event.sessionId?.slice(0, 8)}</span>
                <span style={{ color: "#aaa" }}>{event.stage || event.tool || event.worker || ""}</span>
                <span style={{ color: "#555" }}>{event.message?.slice(0, 50) || ""}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
