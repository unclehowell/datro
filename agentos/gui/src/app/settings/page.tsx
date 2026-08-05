"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const LLM_PROVIDERS: { key: string; label: string; placeholder?: string }[] = [
  { key: "GOOGLE_API_KEY", label: "Google Gemini (free)", placeholder: "AIza..." },
  { key: "GROQ_API_KEY", label: "Groq (free)", placeholder: "gsk_..." },
  { key: "OPENROUTER_API_KEY", label: "OpenRouter (:free)", placeholder: "sk-or-..." },
  { key: "NVIDIA_API_KEY", label: "NVIDIA build.nvidia.com", placeholder: "nvapi-..." },
  { key: "OLLAMA_CLOUD_API_KEY", label: "Ollama Cloud", placeholder: "ollama-..." },
  { key: "CEREBRAS_API_KEY", label: "Cerebras (free)", placeholder: "" },
  { key: "MISTRAL_API_KEY", label: "Mistral (free tier)", placeholder: "" },
  { key: "DEEPINFRA_API_KEY", label: "DeepInfra", placeholder: "" },
  { key: "FIREWORKS_API_KEY", label: "Fireworks", placeholder: "" },
  { key: "COHERE_API_KEY", label: "Cohere", placeholder: "" },
  { key: "HF_TOKEN", label: "HuggingFace Router", placeholder: "hf_..." },
];

const SERVICES: { key: string; label: string; def: string }[] = [
  { key: "OMNIRute_URL", label: "OmniRoute URL", def: "http://localhost:20128" },
  { key: "HERMES_URL", label: "Hermes URL", def: "http://localhost:3001" },
  { key: "GOOGLE_TTS_API_KEY", label: "Google TTS API Key", def: "" },
  { key: "MEM0_API_KEY", label: "Mem0 API Key", def: "" },
];

export default function SettingsPage() {
  const [keys, setKeys] = useState<Record<string, string>>({});
  const [loaded, setLoaded] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [ota, setOta] = useState<{ checking: boolean; message: string }>({ checking: false, message: "" });
  const [status, setStatus] = useState<any>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        const all: Record<string, string> = {};
        for (const p of LLM_PROVIDERS) all[p.key] = "";
        for (const s of SERVICES) all[s.key] = s.def;
        Object.assign(all, d.keys || {});
        setKeys(all);
        setLoaded(true);
      })
      .catch(() => {
        const all: Record<string, string> = {};
        for (const p of LLM_PROVIDERS) all[p.key] = "";
        for (const s of SERVICES) all[s.key] = s.def;
        setKeys(all);
        setLoaded(true);
      });
    fetch("/api/status")
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => {});
  }, []);

  const set = (k: string, v: string) => setKeys((prev) => ({ ...prev, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      const resp = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(keys),
      });
      if (resp.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }
    } finally {
      setSaving(false);
    }
  };

  const triggerOta = async () => {
    setOta({ checking: true, message: "Checking for updates from financecheque branch..." });
    try {
      const resp = await fetch("/api/ota", { method: "POST" });
      const d = await resp.json();
      setOta({ checking: false, message: d.message || (resp.ok ? "Update check triggered" : "Failed") });
    } catch {
      setOta({ checking: false, message: "Failed to reach local OTA endpoint" });
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b border-border px-6 py-3 flex items-center gap-3 shrink-0">
        <Link href="/" className="text-text-muted hover:text-text-primary text-sm">Dashboard</Link>
        <span className="text-text-muted">/</span>
        <h1 className="text-sm font-medium">Settings</h1>
      </header>

      <main className="flex-1 p-6 max-w-2xl mx-auto w-full space-y-6">
        {status && (
          <section className="grid grid-cols-3 gap-3">
            <Stat label="Machine" value={status.machine_name || status.machine_id || "—"} />
            <Stat label="Proxy" value={status.version || "—"} />
            <Stat label="Model" value={status.llm ? "local + cloud" : "local"} />
          </section>
        )}

        <section>
          <h2 className="text-sm font-medium text-text-secondary mb-3">Free-tier LLM Providers</h2>
          <p className="text-xs text-text-muted mb-3">Paste keys for as many as you like. The child proxy auto-routes and fails over across all configured providers.</p>
          <div className="space-y-3">
            {LLM_PROVIDERS.map((p) => (
              <InputField key={p.key} label={p.label} placeholder={p.placeholder} value={loaded ? keys[p.key] || "" : ""} type="password" onChange={(v) => set(p.key, v)} />
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-sm font-medium text-text-secondary mb-3">Services</h2>
          <div className="space-y-3">
            {SERVICES.map((s) => (
              <InputField key={s.key} label={s.label} value={loaded ? keys[s.key] || "" : ""} type={s.key.endsWith("_KEY") ? "password" : "text"} onChange={(v) => set(s.key, v)} />
            ))}
          </div>
        </section>

        <div className="flex items-center gap-3">
          <button
            onClick={save}
            disabled={saving}
            className="px-4 py-2 bg-accent text-black text-sm font-medium rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save to ~/.llm_keys"}
          </button>
          {saved && <span className="text-success text-sm">Saved</span>}
        </div>

        <section className="text-xs text-text-muted border-t border-border pt-4">
          <p>Keys are stored in <code className="text-text-secondary">~/.llm_keys</code> (0600, server-side only) and read by the local cloud router and agent.py provider pool.</p>
        </section>

        <section className="border-t border-border pt-4">
          <h2 className="text-sm font-medium text-text-secondary mb-3">OTA Update</h2>
          <div className="flex items-center gap-3">
            <button
              onClick={triggerOta}
              disabled={ota.checking}
              className="px-4 py-2 border border-border text-sm font-medium rounded-lg hover:border-accent/50 transition-colors disabled:opacity-50"
            >
              {ota.checking ? "Checking..." : "Check for updates"}
            </button>
            {ota.message && <span className="text-xs text-text-muted">{ota.message}</span>}
          </div>
          <p className="text-xs text-text-muted mt-2">Pulls <code className="text-text-secondary">ota-manifest.json</code> from the financecheque branch and self-updates child-proxy, agent.py, and agent-exec.</p>
        </section>
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface border border-border rounded-lg px-3 py-2">
      <div className="text-[10px] uppercase tracking-widest text-text-muted">{label}</div>
      <div className="text-sm font-mono text-text-primary truncate mt-1">{value}</div>
    </div>
  );
}

function InputField({ label, value, type = "text", placeholder, onChange }: { label: string; value: string; type?: string; placeholder?: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-xs text-text-muted block mb-1">{label}</label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text-primary font-mono focus:outline-none focus:border-accent/50"
      />
    </div>
  );
}
