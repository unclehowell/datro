"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type SetupStatus = {
  complete: boolean;
  tools: {
    opencode: { ready: boolean; authRequired: false };
    kilo: { ready: boolean; connected: boolean; authRequired: true };
    kilro: { ready: boolean; connected: boolean; authRequired: true };
  };
};

type ChatMessage = { role: "assistant" | "user"; content: string };

function connectUrl(tool: "kilo" | "kilro") {
  return `/api/oauth/callback?platform=${tool}&code=browser-connected&account=local`;
}

export default function SetupPage() {
  const [status, setStatus] = useState<SetupStatus | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "Hi, I'm ready to help. OpenCode can bootstrap this setup without OAuth. Connect Kilo and Kilro with the buttons, or ask me what to do next.",
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const res = await fetch("/api/setup", { cache: "no-store" });
    if (res.ok) setStatus(await res.json());
  }

  useEffect(() => {
    const first = setTimeout(refresh, 0);
    const timer = setInterval(refresh, 5000);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, []);

  async function send() {
    const message = input.trim();
    if (!message || busy) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: message }]);
    setBusy(true);
    try {
      const res = await fetch("/api/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply || "I couldn't answer that setup question." }]);
    } finally {
      setBusy(false);
    }
  }

  async function finish(action: "complete" | "skip") {
    await fetch("/api/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    window.location.href = "/chat";
  }

  const kiloOk = Boolean(status?.tools.kilo.connected);
  const kilroOk = Boolean(status?.tools.kilro.connected);

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="rounded-2xl border border-amber-500/30 bg-zinc-900 p-6 shadow-2xl">
          <p className="text-sm uppercase tracking-[0.35em] text-amber-400">First-run setup</p>
          <h1 className="mt-3 text-3xl font-semibold">AgentOS is running. Let&apos;s connect the agent backends.</h1>
          <p className="mt-3 max-w-3xl text-zinc-300">
            The terminal is no longer needed. Use this page to connect Kilo and Kilro in the browser while OpenCode acts as the zero-auth bootstrap assistant.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <ToolCard name="OpenCode" detail="Zero-auth bootstrap assistant" ready={Boolean(status?.tools.opencode.ready)} connected={Boolean(status?.tools.opencode.ready)} />
          <ToolCard name="Kilo" detail="Agentic coding backend" ready={Boolean(status?.tools.kilo.ready)} connected={kiloOk} href={connectUrl("kilo")} />
          <ToolCard name="Kilro" detail="Secondary routed assistant" ready={Boolean(status?.tools.kilro.ready)} connected={kilroOk} href={connectUrl("kilro")} />
        </div>

        <section className="grid gap-4 md:grid-cols-[1fr_360px]">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
            <h2 className="mb-3 font-medium text-amber-300">Bootstrap assistant</h2>
            <div className="h-72 space-y-3 overflow-y-auto rounded-xl bg-black/30 p-3">
              {messages.map((m, i) => (
                <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
                  <span className={`inline-block max-w-[85%] rounded-2xl px-3 py-2 text-sm ${m.role === "user" ? "bg-amber-500 text-black" : "bg-zinc-800 text-zinc-100"}`}>{m.content}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") send(); }}
                placeholder="Ask how to connect Kilo or Kilro..."
                className="flex-1 rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-amber-400"
              />
              <button onClick={send} disabled={busy} className="rounded-xl bg-amber-400 px-4 py-2 text-sm font-semibold text-black disabled:opacity-50">Send</button>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
            <h2 className="font-medium text-amber-300">Finish setup</h2>
            <p className="mt-2 text-sm text-zinc-400">Once required tools are connected, unlock the main voice/text chat at localhost:3000.</p>
            <button onClick={() => finish("complete")} className="mt-4 w-full rounded-xl bg-green-400 px-4 py-3 font-semibold text-black">Unlock main chat</button>
            <button onClick={() => finish("skip")} className="mt-2 w-full rounded-xl border border-zinc-700 px-4 py-3 text-sm text-zinc-300">Skip for now</button>
            <Link href="/connect" className="mt-4 block text-center text-sm text-amber-300 hover:underline">Open full connection settings</Link>
          </div>
        </section>
      </div>
    </main>
  );
}

function ToolCard({ name, detail, ready, connected, href }: { name: string; detail: string; ready: boolean; connected: boolean; href?: string }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{name}</h3>
        <span className={`rounded-full px-2 py-1 text-xs ${connected ? "bg-green-500/20 text-green-300" : "bg-amber-500/20 text-amber-300"}`}>{connected ? "ready" : "connect"}</span>
      </div>
      <p className="mt-2 text-sm text-zinc-400">{detail}</p>
      <p className="mt-2 text-xs text-zinc-500">Binary: {ready ? "found" : "not found / pending"}</p>
      {href && <Link href={href} className="mt-4 block rounded-xl bg-amber-400 px-3 py-2 text-center text-sm font-semibold text-black">Connect {name}</Link>}
    </div>
  );
}
