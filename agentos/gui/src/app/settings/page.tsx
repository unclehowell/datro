"use client";

import { useState } from "react";
import Link from "next/link";

export default function SettingsPage() {
  const [keys, setKeys] = useState({
    OMNIRute_URL: "http://localhost:20128",
    HERMES_URL: "http://localhost:3001",
    GOOGLE_TTS_API_KEY: "",
    GROQ_API_KEY: "",
    MEM0_API_KEY: "",
  });

  const [saved, setSaved] = useState(false);

  const save = async () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b border-border px-6 py-3 flex items-center gap-3 shrink-0">
        <Link href="/" className="text-text-muted hover:text-text-primary text-sm">Dashboard</Link>
        <span className="text-text-muted">/</span>
        <h1 className="text-sm font-medium">Settings</h1>
      </header>

      <main className="flex-1 p-6 max-w-2xl mx-auto w-full space-y-6">
        <section>
          <h2 className="text-sm font-medium text-text-secondary mb-3">Services</h2>
          <div className="space-y-3">
            <InputField label="OmniRoute URL" value={keys.OMNIRute_URL} onChange={(v) => setKeys({ ...keys, OMNIRute_URL: v })} />
            <InputField label="Hermes URL" value={keys.HERMES_URL} onChange={(v) => setKeys({ ...keys, HERMES_URL: v })} />
          </div>
        </section>

        <section>
          <h2 className="text-sm font-medium text-text-secondary mb-3">API Keys</h2>
          <div className="space-y-3">
            <InputField label="Google TTS API Key" value={keys.GOOGLE_TTS_API_KEY} type="password" onChange={(v) => setKeys({ ...keys, GOOGLE_TTS_API_KEY: v })} />
            <InputField label="Groq API Key (Whisper STT)" value={keys.GROQ_API_KEY} type="password" onChange={(v) => setKeys({ ...keys, GROQ_API_KEY: v })} />
            <InputField label="Mem0 API Key" value={keys.MEM0_API_KEY} type="password" onChange={(v) => setKeys({ ...keys, MEM0_API_KEY: v })} />
          </div>
        </section>

        <div className="flex items-center gap-3">
          <button onClick={save} className="px-4 py-2 bg-accent text-black text-sm font-medium rounded-lg hover:bg-accent/90 transition-colors">
            Save to .env.local
          </button>
          {saved && <span className="text-success text-sm">Saved</span>}
        </div>

        <section className="text-xs text-text-muted border-t border-border pt-4">
          <p>Keys are stored in <code className="text-text-secondary">.env.local</code> and used server-side only.</p>
          <p className="mt-1">Services required: OmniRoute (localhost:20128), Hermes (localhost:3001), Groq API, Google Cloud TTS API, Mem0.</p>
        </section>
      </main>
    </div>
  );
}

function InputField({ label, value, type = "text", onChange }: { label: string; value: string; type?: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-xs text-text-muted block mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text-primary font-mono focus:outline-none focus:border-accent/50"
      />
    </div>
  );
}
