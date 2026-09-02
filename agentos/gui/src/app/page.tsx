"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

interface SystemStatus {
  omniroute: { status: string; providers: Array<{ id: string; name: string; ok: boolean }> };
  hermes: { online: boolean; currentTask: string | null; uptime: number; memoryUsed: string; activeSessions: number };
  models: string[];
  timestamp: string;
}

interface NodeStatus {
  child: { ok?: boolean; version?: string; machine_id?: string; role?: string };
  agent: { version?: string };
}

interface ProfileState {
  running: boolean;
  starting: boolean;
  stopping: boolean;
  guiPort: number;
  guiUrl: string;
  label: string;
  description: string;
  model: string;
}

interface HermesProfiles {
  hermesLocal: ProfileState;
  hermesProxy: ProfileState;
  busy: boolean;
  message?: string;
}

export default function Dashboard() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [node, setNode] = useState<NodeStatus | null>(null);
  const [time, setTime] = useState("");
  const [hermesProfiles, setHermesProfiles] = useState<HermesProfiles | null>(null);
  const [hermesBusy, setHermesBusy] = useState("");
  const [selectedProfile, setSelectedProfile] = useState<"hermes-local" | "hermes-proxy">("hermes-local");
  const [updateInfo, setUpdateInfo] = useState<{ local: string; remote: string; upToDate: boolean; update: string; updateTo?: string } | null>(null);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }));
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch("/api/status", { signal: AbortSignal.timeout(8000) });
        if (res.ok) setStatus(await res.json());
      } catch {}
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchNode = async () => {
      try {
        const res = await fetch("/api/node", { signal: AbortSignal.timeout(5000) });
        if (res.ok) setNode(await res.json());
      } catch {}
    };
    fetchNode();
    const interval = setInterval(fetchNode, 30000);
    return () => clearInterval(interval);
  }, []);

  // ─── Hermes profiles polling ──────────────────────────────
  useEffect(() => {
    const fetchHermes = async () => {
      try {
        const res = await fetch("/api/hermes", { signal: AbortSignal.timeout(5000) });
        if (res.ok) setHermesProfiles(await res.json());
      } catch {}
    };
    fetchHermes();
    const interval = setInterval(fetchHermes, 5000);
    return () => clearInterval(interval);
  }, []);

  // ─── Version polling + auto-update trigger ────────────────
  useEffect(() => {
    let triggered = false;
    const checkVersion = async () => {
      try {
        const res = await fetch("/api/version", { signal: AbortSignal.timeout(8000) });
        if (!res.ok) return;
        const data = await res.json();
        setUpdateInfo(data);

        // Auto-trigger update when remote is newer and no update is running
        if (!data.upToDate && data.update === "idle" && !triggered) {
          triggered = true;
          fetch("/api/update", { method: "POST" }).catch(() => {});
        }
      } catch {}
    };
    checkVersion();
    const interval = setInterval(checkVersion, 15000);
    return () => clearInterval(interval);
  }, []);

  // ─── Service control state ─────────────────────────────
  const [controlBusy, setControlBusy] = useState("");
  const [openclaw, setOpenclaw] = useState<{ active: boolean } | null>(null);
  const [gate, setGate] = useState<{ state: string; busy: boolean; idleRemainingMs: number } | null>(null);
  const controlBusyRef = useRef("");

  useEffect(() => {
    const check = async () => {
      if (controlBusyRef.current) return;
      try {
        const res = await fetch("/api/control", { signal: AbortSignal.timeout(8000) });
        if (!res.ok) return;
        const data = await res.json();
        if (data.openclaw) setOpenclaw(data.openclaw);
        if (data.gate) setGate({ state: data.gate.state, busy: data.gate.busy, idleRemainingMs: data.gate.idleRemainingMs });
      } catch {}
    };
    check();
    const interval = setInterval(check, 20000);
    return () => clearInterval(interval);
  }, []);

  const runControl = async (target: string, action: string) => {
    controlBusyRef.current = `${target}:${action}`;
    setControlBusy(`${target}:${action}`);
    try {
      const res = await fetch("/api/control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target, action }),
        signal: AbortSignal.timeout(300000),
      });
      const data = await res.json();
      if (target === "openclaw" && data && typeof data.active === "boolean") setOpenclaw({ active: data.active });
      if (target === "llm" && data.gate) setGate({ state: data.gate.state, busy: data.gate.busy, idleRemainingMs: data.gate.idleRemainingMs });
    } catch {
    } finally {
      setControlBusy("");
      controlBusyRef.current = "";
      try {
        const res = await fetch("/api/control", { cache: "no-store", signal: AbortSignal.timeout(30000) });
        const data = await res.json();
        if (data.openclaw && typeof data.openclaw.active === "boolean") setOpenclaw({ active: data.openclaw.active });
        if (data.gate) setGate({ state: data.gate.state, busy: data.gate.busy, idleRemainingMs: data.gate.idleRemainingMs });
      } catch {}
    }
  };

  // ─── Hermes profile controls ──────────────────────────────
  const runHermes = async (action: "start" | "stop", profile: string) => {
    // "start" uses "switch" to enforce mutual exclusion (stops the other)
    const apiAction = action === "start" ? "switch" : "stop";
    setHermesBusy(`${action}:${profile}`);
    try {
      const res = await fetch("/api/hermes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: apiAction, profile }),
        signal: AbortSignal.timeout(60000),
      });
      const data = await res.json();
      if (data && data.hermesLocal) setHermesProfiles(data);
    } catch {
    } finally {
      setHermesBusy("");
      // Resync
      try {
        const res = await fetch("/api/hermes", { cache: "no-store", signal: AbortSignal.timeout(5000) });
        if (res.ok) setHermesProfiles(await res.json());
      } catch {}
    }
  };

  const greeting = getGreeting();

  return (
    <div className="flex flex-col min-h-screen">
        <header className="border-b border-border px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-black font-bold text-sm">A</div>
            <h1 className="text-base md:text-lg font-semibold">AgentOS</h1>
            <span className="text-text-muted text-xs hidden sm:inline">UncleHowell</span>
          </div>
          <nav className="hidden md:flex items-center gap-4 text-sm">
            <Link href="/" className="text-accent font-medium">Dashboard</Link>
            <Link href="/chat" className="text-text-secondary hover:text-text-primary transition-colors">Chat</Link>
            <Link href="/terminal" className="text-text-secondary hover:text-text-primary transition-colors">Terminal</Link>
            <Link href="/settings" className="text-text-secondary hover:text-text-primary transition-colors">Apps</Link>
          </nav>
        </header>

      <main className="flex-1 p-4 md:p-6 max-w-5xl mx-auto w-full">
        <div className="mb-8">
          <div className="text-2xl font-light text-text-primary mb-1">{greeting}</div>
          <div className="text-sm text-text-muted">{time} &mdash; {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</div>
        </div>

        {/* ─── OTA Update Banner ──────────────────────────── */}
        {updateInfo && !updateInfo.upToDate && (
          <div className={`mb-6 rounded-lg border px-4 py-3 flex items-center gap-3 text-sm ${
            updateInfo.update === "updating"
              ? "bg-accent/10 border-accent/30 text-accent"
              : updateInfo.update === "done"
                ? "bg-success/10 border-success/30 text-success"
                : updateInfo.update === "error"
                  ? "bg-error/10 border-error/30 text-error"
                  : "bg-info/10 border-info/30 text-info"
          }`}>
            <span className="text-base">
              {updateInfo.update === "updating" ? "⟳" : updateInfo.update === "done" ? "✓" : updateInfo.update === "error" ? "✗" : "↑"}
            </span>
            <span className="flex-1">
              {updateInfo.update === "updating" && `Updating v${updateInfo.local} → v${updateInfo.remote}…`}
              {updateInfo.update === "done" && `Updated to v${updateInfo.remote} — restarting…`}
              {updateInfo.update === "error" && `Update failed — will retry`}
              {updateInfo.update === "idle" && `Update available: v${updateInfo.local} → v${updateInfo.remote}`}
            </span>
            {updateInfo.update === "updating" && (
              <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full spinner-ring" />
            )}
          </div>
        )}

        {/* ─── Hermes Agents ─────────────────────────────── */}
        <div className="mb-8">
          <h2 className="text-sm font-medium text-text-secondary mb-3">Hermes Agents</h2>
          <div className="bg-surface border border-border rounded-lg p-5">
            {/* Toggle between profiles */}
            <div className="flex items-center gap-2 mb-4 overflow-x-auto">
              <div className="flex bg-surface-hover rounded-lg p-0.5 border border-border min-w-0">
                {(["hermes-local", "hermes-proxy"] as const).map((key) => {
                  const p = hermesProfiles?.[key === "hermes-local" ? "hermesLocal" : "hermesProxy"];
                  const selected = selectedProfile === key;
                  const running = p?.running ?? false;
                  return (
                    <button
                      key={key}
                      onClick={() => setSelectedProfile(key)}
                      className={`px-3 md:px-4 py-2 rounded-md text-xs font-mono transition-all whitespace-nowrap ${
                        selected
                          ? "bg-accent text-black font-semibold"
                          : "text-text-secondary hover:text-text-primary"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        {running && <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />}
                        {p?.label ?? key}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
            </div>

            {/* Selected profile details + actions */}
            {(() => {
              const key = selectedProfile;
              const p = hermesProfiles?.[key === "hermes-local" ? "hermesLocal" : "hermesProxy"];
              const running = p?.running ?? false;
              const eitherRunning = (hermesProfiles?.hermesLocal?.running ?? false) || (hermesProfiles?.hermesProxy?.running ?? false);
              const isBusy = hermesBusy.startsWith("start:") || hermesBusy.startsWith("stop:");
              const startTarget = hermesBusy.replace("start:", "").replace("stop:", "");

              return (
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                  {/* Status dot + label */}
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${running ? "bg-success animate-pulse-dot" : "bg-text-muted/40"}`} />
                    <span className="text-sm font-medium text-text-primary truncate">{p?.label ?? key}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${running ? "bg-success/10 text-success" : "bg-surface-hover text-text-muted"}`}>
                      {isBusy && startTarget === key ? "starting…" : running ? "running" : "stopped"}
                    </span>
                  </div>

                  {/* Model + description */}
                  <div className="flex-1 text-xs text-text-muted font-mono truncate">
                    {p?.model} — {p?.description}
                  </div>

                  {/* Start / Stop button — visible until both stopped */}
                  {(!running || eitherRunning) && (
                    !running ? (
                      <button
                        onClick={() => runHermes("start", key)}
                        disabled={isBusy || (eitherRunning && !running)}
                        className="text-xs px-4 py-1.5 rounded-lg bg-success/20 text-success border border-success/30 hover:bg-success/30 transition-colors disabled:opacity-30"
                      >
                        {isBusy && startTarget === key ? "…" : "Start"}
                      </button>
                    ) : (
                      <button
                        onClick={() => runHermes("stop", key)}
                        disabled={isBusy}
                        className="text-xs px-4 py-1.5 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-colors disabled:opacity-30"
                      >
                        {isBusy && startTarget === key ? "…" : "Stop"}
                      </button>
                    )
                  )}

                  {/* GUI button — only when running */}
                  {running && p?.guiUrl && (
                    <Link
                      href={p.guiUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs px-4 py-1.5 rounded-lg border border-accent/40 text-accent hover:bg-accent/10 transition-colors"
                    >
                      GUI
                    </Link>
                  )}
                </div>
              );
            })()}

            <p className="text-xs text-text-muted mt-3">Only one profile can run at a time. Starting one stops the other.</p>
          </div>
        </div>

        {/* ─── System Status ──────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <StatusCard
            title="OmniRoute"
            status={status?.omniroute?.status === "ok" ? "online" : "offline"}
            details={[
              { label: "Providers", value: status?.omniroute?.providers?.filter(p => p.ok).length + " / " + (status?.omniroute?.providers?.length ?? 0) },
              { label: "Endpoint", value: "localhost:20128" },
            ]}
          />
          <StatusCard
            title="Hermes"
            status={status?.hermes?.online ? "online" : "offline"}
            details={[
              { label: "Dashboard", value: "localhost:9119" },
              { label: "Memory", value: status?.hermes?.memoryUsed || "N/A" },
            ]}
          />
          <StatusCard
            title="Child Node"
            status={node?.child?.ok ? "online" : "offline"}
            details={[
              { label: "Proxy", value: `v${node?.child?.version || "—"}` },
              { label: "Agent", value: `v${node?.agent?.version || "—"}` },
              { label: "Role", value: node?.child?.role || "—" },
            ]}
          />
        </div>

        {/* ─── Services ─────────────────────────────────── */}
        <div className="mb-8">
          <h2 className="text-sm font-medium text-text-secondary mb-3">Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-surface border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-2 h-2 rounded-full ${openclaw?.active ? "bg-success animate-pulse-dot" : "bg-error"}`} />
                <h3 className="font-medium text-sm">OpenClaw</h3>
                <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${openclaw?.active ? "bg-success/10 text-success" : "bg-error/10 text-error"}`}>
                  {openclaw?.active ? "running" : "stopped"}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <ControlButton busy={controlBusy === "openclaw:start"} onClick={() => runControl("openclaw", "start")} disabled={openclaw?.active}>Start</ControlButton>
                <ControlButton busy={controlBusy === "openclaw:stop"} onClick={() => runControl("openclaw", "stop")} disabled={!openclaw?.active}>Stop</ControlButton>
                <ControlButton busy={controlBusy === "openclaw:restart"} onClick={() => runControl("openclaw", "restart")}>Restart</ControlButton>
                {openclaw?.active ? (
                  <Link href="http://localhost:18789" target="_blank" rel="noopener noreferrer" className="text-xs px-3 py-1.5 rounded-lg border border-border text-text-secondary hover:text-accent hover:border-accent/50 transition-colors">Launch</Link>
                ) : (
                  <span className="text-xs px-3 py-1.5 rounded-lg border border-border text-text-muted opacity-60 cursor-not-allowed" title="Start OpenClaw first">Launch</span>
                )}
              </div>
              <p className="text-xs text-text-muted mt-3">openclaw-gateway · port 18789</p>
            </div>

            <div className="bg-surface border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-success animate-pulse-dot" />
                <h3 className="font-medium text-sm">WebGUI</h3>
                <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-success/10 text-success">running</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href="/" className="text-xs px-3 py-1.5 rounded-lg border border-border text-text-secondary hover:text-accent hover:border-accent/50 transition-colors">Dashboard</Link>
                <Link href="/chat" className="text-xs px-3 py-1.5 rounded-lg border border-border text-text-secondary hover:text-accent hover:border-accent/50 transition-colors">Chat</Link>
                <Link href="/terminal" className="text-xs px-3 py-1.5 rounded-lg border border-border text-text-secondary hover:text-accent hover:border-accent/50 transition-colors">Terminal</Link>
              </div>
              <p className="text-xs text-text-muted mt-3">agentos-gui · port 3000</p>
            </div>

            <div className="bg-surface border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-2 h-2 rounded-full ${gate?.state === "up" ? "bg-success animate-pulse-dot" : "bg-error"}`} />
                <h3 className="font-medium text-sm">LLM Stack</h3>
                <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${gate?.state === "up" ? "bg-success/10 text-success" : gate?.busy ? "bg-amber/10 text-amber-400" : "bg-error/10 text-error"}`}>
                  {gate?.busy ? "starting…" : gate?.state === "up" ? "on" : "off"}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <ControlButton busy={controlBusy === "llm:start"} onClick={() => runControl("llm", "start")} disabled={gate?.state === "up"}>Start</ControlButton>
                <ControlButton busy={controlBusy === "llm:stop"} onClick={() => runControl("llm", "stop")} disabled={gate?.state !== "up"}>Stop</ControlButton>
              </div>
              <p className="text-xs text-text-muted mt-3">ollama (minicpm5-32k) + omniroute · dormant until a prompt is submitted</p>
            </div>
          </div>
        </div>

        {/* ─── Quick Actions ──────────────────────────────── */}
        <div className="mb-8">
          <h2 className="text-sm font-medium text-text-secondary mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <QuickAction href="/chat" label="Chat" desc="Talk to Hermes" icon="💬" />
            <QuickAction href="/terminal" label="Terminal" desc="Shell + Keyboard" icon="⌨️" />
            <QuickAction href="/jobs" label="Jobs" desc="Lead orders + wallet" icon="⚡" />
            <QuickAction href="/connect" label="Connect" desc="OAuth + LLM keys" icon="🔗" />
            <QuickAction href="http://localhost:9119" label="Hermes" desc="Dashboard" icon="🤖" external />
            <QuickAction href="http://localhost:20128" label="OmniRoute" desc="Providers" icon="🔀" external />
            <QuickAction href="/docs" label="Docs" desc="System documentation" icon="📖" />
            <QuickAction href="/settings" label="Apps" desc="Install & configure" icon="🛍️" />
          </div>
        </div>

        {status?.omniroute?.providers && (
          <div>
            <h2 className="text-sm font-medium text-text-secondary mb-3">Providers</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {status.omniroute.providers.map((p) => (
                <div key={p.id} className="bg-surface border border-border rounded-lg px-3 py-2 flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${p.ok ? "bg-success" : "bg-error"}`} />
                  <span className="text-xs text-text-primary">{p.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function StatusCard({ title, status, details }: { title: string; status: string; details: { label: string; value: string | number }[] }) {
  return (
    <div className="bg-surface border border-border rounded-lg p-4 min-w-0">
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-2 h-2 rounded-full shrink-0 ${status === "online" ? "bg-success animate-pulse-dot" : "bg-error"}`} />
        <h3 className="font-medium text-sm truncate">{title}</h3>
        <span className={`ml-auto text-xs px-2 py-0.5 rounded-full shrink-0 ${status === "online" ? "bg-success/10 text-success" : "bg-error/10 text-error"}`}>
          {status}
        </span>
      </div>
      <div className="space-y-1">
        {details.map((d, i) => (
          <div key={i} className="flex justify-between text-xs gap-2">
            <span className="text-text-muted shrink-0">{d.label}</span>
            <span className="text-text-secondary font-mono text-right truncate">{d.value || "—"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ControlButton({ onClick, disabled, busy, children }: { onClick: () => void; disabled?: boolean; busy?: boolean; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || busy}
      className="text-xs px-4 py-2.5 min-h-[44px] rounded-lg border border-border text-text-secondary hover:text-accent hover:border-accent/50 transition-colors disabled:opacity-30 disabled:hover:text-text-secondary disabled:hover:border-border active:bg-surface-hover"
    >
      {busy ? "…" : children}
    </button>
  );
}

function QuickAction({ href, label, desc, icon, external }: { href: string; label: string; desc: string; icon: string; external?: boolean }) {
  return (
    <Link
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="bg-surface border border-border rounded-lg p-4 min-h-[72px] flex items-center gap-3 hover:border-accent/50 hover:bg-surface-hover transition-all group active:scale-[0.98]"
    >
      <span className="text-2xl">{icon}</span>
      <div>
        <div className="text-sm font-medium group-hover:text-accent transition-colors">{label}</div>
        <div className="text-xs text-text-muted">{desc}</div>
      </div>
    </Link>
  );
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 6) return "Good night.";
  if (h < 12) return "Good morning.";
  if (h < 17) return "Good afternoon.";
  if (h < 21) return "Good evening.";
  return "Good night.";
}
