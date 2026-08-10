"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Connection {
  connected?: boolean;
  at?: string;
  account?: string | null;
}

type Connections = Record<string, Connection>;

const LLM_PROVIDERS = [
  "Google Gemini",
  "Groq",
  "OpenRouter",
  "NVIDIA",
  "Ollama Cloud",
  "Cerebras",
  "Mistral",
  "DeepInfra",
  "Fireworks",
  "Cohere",
  "HuggingFace",
];

const AGENT_BACKENDS: { id: string; label: string; authUrl?: string }[] = [
  { id: "kilo", label: "Kilo", authUrl: "/api/oauth/callback?platform=kilo&code=browser-connected&account=local" },
  { id: "kilro", label: "Kilro", authUrl: "/api/oauth/callback?platform=kilro&code=browser-connected&account=local" },
];

const SOCIAL_PLATFORMS: { id: string; label: string; authUrl?: string }[] = [
  { id: "x", label: "X.com", authUrl: "https://x.com/i/oauth2/authorize" },
  { id: "linkedin", label: "LinkedIn", authUrl: "https://www.linkedin.com/oauth/v2/authorization" },
  { id: "facebook", label: "Facebook", authUrl: "https://www.facebook.com/v19.0/dialog/oauth" },
  { id: "instagram", label: "Instagram", authUrl: "https://api.instagram.com/oauth/authorize" },
  { id: "tiktok", label: "TikTok", authUrl: "https://www.tiktok.com/auth/authorize" },
  { id: "youtube", label: "YouTube", authUrl: "https://accounts.google.com/o/oauth2/v2/auth" },
  { id: "pinterest", label: "Pinterest", authUrl: "https://www.pinterest.com/oauth/" },
  { id: "googleads", label: "Google Ads", authUrl: "https://accounts.google.com/o/oauth2/v2/auth" },
  { id: "metaads", label: "Meta Ads", authUrl: "https://www.facebook.com/v19.0/dialog/oauth" },
  { id: "tiktokads", label: "TikTok Ads", authUrl: "https://www.tiktok.com/v2/auth/authorize" },
  { id: "gbp", label: "Google Business Profile", authUrl: "https://accounts.google.com/o/oauth2/v2/auth" },
  { id: "stripe", label: "Stripe (payout)", authUrl: "https://connect.stripe.com/oauth/authorize" },
  { id: "buzz", label: "Buzz (FinanceCheque group chat)" },
];

const CALLBACK_BASE =
  process.env.NEXT_PUBLIC_OAUTH_CALLBACK || "http://localhost:3000/api/oauth/callback";

function oauthUrl(platform: { id: string; label: string; authUrl?: string }): string {
  if (!platform.authUrl) return "";
  const cb = `${CALLBACK_BASE}?platform=${platform.id}`;
  // Append standard params; many platforms require client_id which the operator
  // registers with the platform provider. Redirect_uri is the local callback.
  const sep = platform.authUrl.includes("?") ? "&" : "?";
  return `${platform.authUrl}${sep}redirect_uri=${encodeURIComponent(cb)}&state=${platform.id}&response_type=code`;
}

export default function ConnectPage() {
  const [connections, setConnections] = useState<Connections>({});
  const [loaded, setLoaded] = useState(false);
  const [newKey, setNewKey] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("/api/oauth")
      .then((r) => r.json())
      .then((d) => {
        setConnections(d.connections || {});
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  const disconnect = async (platform: string) => {
    await fetch("/api/oauth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platform, remove: true }),
    });
    setConnections((prev) => {
      const next = { ...prev };
      delete next[platform];
      return next;
    });
  };

  // Custom LLM providers: manual key entry stored via settings (routed to agent.py).
  const saveLlmKey = async (platform: string, key: string) => {
    await fetch("/api/oauth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platform, token: key, account: "manual" }),
    });
    setConnections((prev) => ({ ...prev, [platform]: { connected: true, at: new Date().toISOString(), account: "manual" } }));
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b border-border px-6 py-3 flex items-center gap-3 shrink-0">
        <Link href="/" className="text-text-muted hover:text-text-primary text-sm">Dashboard</Link>
        <span className="text-text-muted">/</span>
        <h1 className="text-sm font-medium">Connect</h1>
      </header>

      <main className="flex-1 p-6 max-w-3xl mx-auto w-full space-y-8 pb-24">
        <section>
          <h2 className="text-sm font-medium text-text-secondary mb-1">Free LLM Providers</h2>
          <p className="text-xs text-text-muted mb-3">These power the child proxy&apos;s cloud brain. Add keys or connect via OAuth.</p>
          <LlmGrid
            providers={LLM_PROVIDERS}
            connections={connections}
            newKey={newKey}
            setNewKey={setNewKey}
            onSave={saveLlmKey}
          />
        </section>

        <section>
          <h2 className="text-sm font-medium text-text-secondary mb-1">Agent Backends</h2>
          <p className="text-xs text-text-muted mb-3">Browser-based setup for the local agent tools. No terminal OAuth is required after install.</p>
          <div className="grid grid-cols-2 gap-3">
            {AGENT_BACKENDS.map((p) => {
              const connected = connections[p.id]?.connected;
              return (
                <div key={p.id} className={`bg-surface border rounded-xl p-4 flex flex-col gap-2 ${connected ? "border-green-500/40" : "border-border"}`}>
                  <div className="text-sm font-medium text-text-primary">{p.label}</div>
                  <div className="text-xs text-text-muted">{connected ? "Connected in browser" : "Ready to connect"}</div>
                  {connected ? (
                    <button onClick={() => disconnect(p.id)} className="text-xs text-red-400 hover:text-red-300 self-start">Disconnect</button>
                  ) : (
                    <a href={p.authUrl} className="px-3 py-1.5 bg-accent text-black text-xs font-medium rounded-lg hover:bg-accent/90 text-center">Connect {p.label}</a>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <section>
          <h2 className="text-sm font-medium text-text-secondary mb-1">Social & Marketing Platforms</h2>
          <p className="text-xs text-text-muted mb-3">Connect accounts so your node can post / run campaigns for lead orders.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {SOCIAL_PLATFORMS.map((p) => {
              const connected = connections[p.id]?.connected;
              return (
                <div key={p.id} className={`bg-surface border rounded-xl p-4 flex flex-col gap-2 ${connected ? "border-green-500/40" : "border-border"}`}>
                  <div className="text-sm font-medium text-text-primary">{p.label}</div>
                  {connected ? (
                    <button
                      onClick={() => disconnect(p.id)}
                      className="text-xs text-red-400 hover:text-red-300 self-start"
                    >
                      Disconnect
                    </button>
                  ) : p.authUrl ? (
                    <a href={oauthUrl(p)} target="_blank" rel="noreferrer" className="px-3 py-1.5 bg-accent text-black text-xs font-medium rounded-lg hover:bg-accent/90 text-center">
                      Connect
                    </a>
                  ) : (
                    <button
                      onClick={async () => {
                        await saveLlmKey(p.id, "buzz-joined");
                      }}
                      className="px-3 py-1.5 bg-accent text-black text-xs font-medium rounded-lg hover:bg-accent/90"
                    >
                      Join Buzz
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {!loaded && <p className="text-xs text-text-muted">Loading connections...</p>}
      </main>
    </div>
  );
}

function LlmGrid({ providers, connections, newKey, setNewKey, onSave }: {
  providers: string[];
  connections: Connections;
  newKey: Record<string, string>;
  setNewKey: (k: Record<string, string>) => void;
  onSave: (platform: string, key: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {providers.map((p) => {
        const connected = connections[p]?.connected;
        return (
          <div key={p} className={`bg-surface border rounded-xl p-4 flex flex-col gap-2 ${connected ? "border-green-500/40" : "border-border"}`}>
            <div className="text-sm font-medium text-text-primary">{p}</div>
            {connected ? (
              <span className="text-xs text-green-500">Connected</span>
            ) : (
              <div className="flex gap-2">
                <input
                  type="password"
                  value={newKey[p] || ""}
                  placeholder="API key"
                  className="flex-1 bg-background border border-border rounded-lg px-2 py-1.5 text-xs text-text-primary font-mono focus:outline-none focus:border-accent/50"
                  onChange={(e) => setNewKey({ ...newKey, [p]: e.target.value })}
                />
                <button
                  onClick={() => newKey[p] && onSave(p, newKey[p])}
                  className="px-3 py-1.5 bg-accent text-black text-xs font-medium rounded-lg hover:bg-accent/90"
                >
                  Save
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}