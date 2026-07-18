"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface SystemStatus {
  omniroute: { status: string; providers: Array<{ id: string; name: string; ok: boolean }> };
  hermes: { online: boolean; currentTask: string | null; uptime: number; memoryUsed: string; activeSessions: number };
  models: string[];
  timestamp: string;
}

export default function Dashboard() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [time, setTime] = useState("");

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

  const greeting = getGreeting();

  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-black font-bold text-sm">A</div>
          <h1 className="text-lg font-semibold">AgentOS</h1>
          <span className="text-text-muted text-xs">UncleHowell</span>
        </div>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/" className="text-accent font-medium">Dashboard</Link>
          <Link href="/chat" className="text-text-secondary hover:text-text-primary transition-colors">Chat</Link>
          <Link href="/settings" className="text-text-secondary hover:text-text-primary transition-colors">Settings</Link>
        </nav>
      </header>

      <main className="flex-1 p-6 max-w-5xl mx-auto w-full">
        <div className="mb-8">
          <div className="text-2xl font-light text-text-primary mb-1">{greeting}</div>
          <div className="text-sm text-text-muted">{time} &mdash; {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</div>
        </div>

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
            title="Models"
            status={status?.models?.length ? "online" : "offline"}
            details={[
              { label: "Available", value: String(status?.models?.length ?? 0) },
              { label: "Primary", value: status?.models?.[0] || "none" },
            ]}
          />
        </div>

        <div className="mb-8">
          <h2 className="text-sm font-medium text-text-secondary mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <QuickAction href="/chat" label="Chat" desc="Talk to Hermes" icon="💬" />
            <QuickAction href="http://localhost:9119" label="Hermes" desc="Dashboard" icon="🤖" external />
            <QuickAction href="http://localhost:20128" label="OmniRoute" desc="Providers" icon="🔀" external />
            <QuickAction href="/settings" label="Settings" desc="Configure" icon="⚙️" />
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
    <div className="bg-surface border border-border rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-2 h-2 rounded-full ${status === "online" ? "bg-success animate-pulse-dot" : "bg-error"}`} />
        <h3 className="font-medium text-sm">{title}</h3>
        <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${status === "online" ? "bg-success/10 text-success" : "bg-error/10 text-error"}`}>
          {status}
        </span>
      </div>
      <div className="space-y-1">
        {details.map((d, i) => (
          <div key={i} className="flex justify-between text-xs">
            <span className="text-text-muted">{d.label}</span>
            <span className="text-text-secondary font-mono">{d.value || "—"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function QuickAction({ href, label, desc, icon, external }: { href: string; label: string; desc: string; icon: string; external?: boolean }) {
  return (
    <Link
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="bg-surface border border-border rounded-lg p-4 hover:border-accent/50 hover:bg-surface-hover transition-all group"
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="text-base">{icon}</span>
        <span className="text-sm font-medium group-hover:text-accent transition-colors">{label}</span>
      </div>
      <div className="text-xs text-text-muted">{desc}</div>
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
