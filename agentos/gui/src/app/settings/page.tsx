"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { APPS, AppInfo, AppLogo } from "@/lib/app-catalog";

type KeyMap = Record<string, string>;

const CATEGORIES: { id: "all" | "llm" | "service" | "system"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "llm", label: "LLM" },
  { id: "service", label: "Services" },
  { id: "system", label: "System" },
];

export default function AppsPage() {
  const [keys, setKeys] = useState<KeyMap>({});
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<any>(null);
  const [oauth, setOauth] = useState<{ google: boolean; huggingface: boolean }>({ google: false, huggingface: false });
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [modalApp, setModalApp] = useState<AppInfo | null>(null);
  const [keyValue, setKeyValue] = useState("");
  const [confirming, setConfirming] = useState<string | null>(null);
  const [confirmSeconds, setConfirmSeconds] = useState(3);
  const [category, setCategory] = useState<"all" | "llm" | "service" | "system">("all");
  const [query, setQuery] = useState("");
  const [ota, setOta] = useState<{ checking: boolean; message: string }>({ checking: false, message: "" });
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        setKeys(d.keys || {});
        setOauth(d.oauth || {});
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
    fetch("/api/status")
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (modalApp) setTimeout(() => inputRef.current?.focus(), 50);
  }, [modalApp]);

  const isInstalled = (app: AppInfo) => app.alwaysInstalled || Boolean(keys[app.key]);

  const oauthReady = (app: AppInfo) => {
    if (app.oauthPlatform === "huggingface") return oauth.huggingface;
    if (app.oauthPlatform === "google-gemini" || app.oauthPlatform === "google-tts") return oauth.google;
    return false;
  };

  const toggleReveal = (id: string) =>
    setRevealed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const openInstall = (app: AppInfo) => {
    setError("");
    setKeyValue("");
    setModalApp(app);
  };

  const closeModal = () => {
    setModalApp(null);
    setError("");
  };

  const install = async (app: AppInfo) => {
    const value = keyValue.trim();
    if (!value) return;
    setSaving(true);
    setError("");
    try {
      const r = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [app.key]: value }),
      });
      if (r.ok) {
        setKeys((prev) => ({ ...prev, [app.key]: value }));
        closeModal();
        setSavedFlash(true);
        setTimeout(() => setSavedFlash(false), 2000);
      } else {
        const d = await r.json().catch(() => ({}));
        setError(d?.error || "Save failed");
      }
    } catch {
      setError("Network error — is the local server running?");
    } finally {
      setSaving(false);
    }
  };

  const uninstall = async (app: AppInfo) => {
    setSaving(true);
    try {
      const r = await fetch("/api/settings", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: app.key }),
      });
      if (r.ok) {
        setKeys((prev) => {
          const next = { ...prev };
          delete next[app.key];
          return next;
        });
      }
    } catch {}
    setConfirming(null);
    setSaving(false);
  };

  // Visible countdown while an uninstall confirmation is pending — without
  // it users think the first tap didn't register and tap again, cancelling.
  useEffect(() => {
    if (!confirming) return;
    setConfirmSeconds(3);
    const iv = setInterval(() => setConfirmSeconds((s) => s - 1), 1000);
    const t = setTimeout(() => setConfirming(null), 3000);
    return () => { clearInterval(iv); clearTimeout(t); };
  }, [confirming]);

  const onActionClick = (e: React.MouseEvent, app: AppInfo) => {
    e.stopPropagation();
    if (app.alwaysInstalled) return;
    if (isInstalled(app)) {
      if (confirming === app.id) uninstall(app);
      else setConfirming(app.id);
    } else {
      openInstall(app);
    }
  };

  const onTileTap = (app: AppInfo) => {
    // Mobile: first tap reveals the install/uninstall button; second tap on
    // the button acts. Desktop hover reveals it without any tap.
    if (app.alwaysInstalled) {
      openInstall(app);
      return;
    }
    toggleReveal(app.id);
  };

  const visibleApps = useMemo(() => {
    const q = query.trim().toLowerCase();
    return APPS.filter((a) => {
      if (category !== "all" && a.category !== category) return false;
      if (!q) return true;
      return (
        a.name.toLowerCase().includes(q) ||
        a.vendor.toLowerCase().includes(q) ||
        a.desc.toLowerCase().includes(q)
      );
    });
  }, [category, query]);

  const installedCount = APPS.filter(isInstalled).length;
  const apps = visibleApps.filter((a) => a.category !== "system");
  const systems = visibleApps.filter((a) => a.category === "system");

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
        <h1 className="text-sm font-medium">Apps</h1>
        <span className="text-xs text-text-muted font-mono ml-1">~/.llm_keys</span>
        <span className="ml-auto flex items-center gap-2">
          {savedFlash && <span className="text-xs text-success">installed ✓</span>}
          <span className="text-xs text-text-muted font-mono">{installedCount}/{APPS.length} installed</span>
        </span>
      </header>

      <main className="flex-1 p-6 max-w-5xl mx-auto w-full space-y-6">
        {status && (
          <section className="grid grid-cols-3 gap-3">
            <Stat label="Machine" value={status.machine_name || status.machine_id || "—"} />
            <Stat label="Proxy" value={status.version || "—"} />
            <Stat label="Brain" value={status.llm ? "local + cloud" : "local"} />
          </section>
        )}

        {/* Search + category filter */}
        <section className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search apps…"
              className="w-56 bg-surface border border-border rounded-lg pl-8 pr-3 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent/50"
            />
            <svg viewBox="0 0 24 24" className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-border bg-surface p-1">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                onClick={() => setCategory(c.id)}
                className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                  category === c.id ? "bg-accent text-black font-medium" : "text-text-muted hover:text-text-primary"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
          {!loaded && <span className="text-xs text-text-muted ml-auto">loading…</span>}
        </section>

        {/* Installable apps */}
        <section>
          <div className="flex items-end justify-between mb-4">
            <div>
              <h2 className="text-sm font-medium text-text-secondary">
                {category === "system" ? "System apps" : category === "service" ? "Services" : category === "llm" ? "LLM providers" : "App store"}
              </h2>
              <p className="text-xs text-text-muted mt-0.5">
                Hover an icon (or tap it on mobile) to install. Keys unlock the service for the child proxy and stay on this machine.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-4">
            {apps.map((app) => (
              <AppTile
                key={app.id}
                app={app}
                installed={isInstalled(app)}
                revealed={revealed.has(app.id)}
                confirming={confirming === app.id}
                confirmSeconds={confirmSeconds}
                onTileTap={() => onTileTap(app)}
                onAction={(e) => onActionClick(e, app)}
              />
            ))}
            {apps.length === 0 && <p className="text-xs text-text-muted py-6">No apps match.</p>}
          </div>
        </section>

        {/* System (local) apps */}
        {systems.length > 0 && (
          <section className="pt-2 border-t border-border">
            <h2 className="text-sm font-medium text-text-secondary mb-1">Local infrastructure</h2>
            <p className="text-xs text-text-muted mb-4">These ship with the machine — they run the agent itself and can&apos;t be uninstalled.</p>
            <div className="flex flex-wrap gap-4">
              {systems.map((app) => (
                <AppTile
                  key={app.id}
                  app={app}
                  installed
                  revealed={revealed.has(app.id)}
                  confirming={false}
                  confirmSeconds={0}
                  onTileTap={() => onTileTap(app)}
                  onAction={() => {}}
                />
              ))}
            </div>
          </section>
        )}

        {/* Machine maintenance */}
        <section className="border-t border-border pt-4 text-xs text-text-muted space-y-3">
          <div className="flex items-center gap-3">
            <button
              onClick={triggerOta}
              disabled={ota.checking}
              className="px-3 py-1.5 border border-border text-sm font-medium rounded-lg hover:border-accent/50 transition-colors disabled:opacity-50"
            >
              {ota.checking ? "Checking…" : "Check for updates"}
            </button>
            {ota.message && <span>{ota.message}</span>}
          </div>
          <p>
            Keys are stored in <code className="text-text-secondary">~/.llm_keys</code> (0600, server-side only) and read live by the cloud
            router and agent.py provider pool. OAuth access tokens are stored under <code className="text-text-secondary">~/.fcukproxy/oauth</code> and
            dropped into the same key store so the agent can use them immediately.
          </p>
        </section>
      </main>

      {/* Install modal */}
      {modalApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative w-full max-w-sm rounded-2xl border border-border bg-surface p-6 shadow-2xl shadow-black/40 animate-slide-up">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg shadow-black/30 shrink-0" style={{ backgroundColor: modalApp.bg }}>
                <AppLogo app={modalApp} className="w-9 h-9" />
              </div>
              <div className="min-w-0">
                <div className="text-base font-semibold text-text-primary truncate">{modalApp.name}</div>
                <div className="text-xs text-text-muted truncate">{modalApp.vendor}</div>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 border border-border text-text-muted uppercase tracking-wide">{modalApp.category}</span>
                  {isInstalled(modalApp) && <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/10 border border-green-500/30 text-green-400">installed</span>}
                </div>
              </div>
            </div>

            <p className="text-xs text-text-muted mt-4 leading-relaxed">{modalApp.desc}</p>

            {modalApp.alwaysInstalled && (
              <p className="text-xs text-text-muted mt-4 border border-border rounded-lg px-3 py-2 bg-background/40">
                Built into the machine. No setup required.
              </p>
            )}

            {!modalApp.alwaysInstalled && modalApp.auth === "oauth" && oauthReady(modalApp) && (
              <a
                href={`/api/settings/oauth?platform=${modalApp.oauthPlatform}`}
                target="_blank"
                rel="noreferrer"
                className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-border text-sm font-medium text-text-primary hover:border-accent/60 hover:bg-zinc-800/40 transition-colors"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/><path d="M21 12h-6M9 12H3M12 3v6M12 15v6"/></svg>
                Connect with {modalApp.vendor}
              </a>
            )}

            {!modalApp.alwaysInstalled && modalApp.auth !== "none" && (
              <>
                <label className="block text-xs text-text-muted mt-4 mb-1">
                  API key{modalApp.auth === "oauth" && !oauthReady(modalApp) ? " (OAuth client not configured — use a key)" : ""}
                </label>
                <input
                  ref={inputRef}
                  type="password"
                  value={keyValue}
                  placeholder={modalApp.placeholder || `Paste ${modalApp.name} key`}
                  onChange={(e) => setKeyValue(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && keyValue.trim() && !saving) install(modalApp); }}
                  autoComplete="off"
                  spellCheck={false}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-text-primary font-mono placeholder-text-muted focus:outline-none focus:border-accent/50"
                />
                {modalApp.auth === "oauth" && (
                  <p className="text-[11px] text-text-muted mt-1.5">
                    This app can also connect via OAuth instead of a key. Configure{" "}
                    <code className="text-text-secondary">{modalApp.oauthClientEnv}</code> in the server env to enable the button above.
                  </p>
                )}
                {error && <p className="text-xs text-error mt-2">{error}</p>}
                <div className="flex items-center gap-2 mt-4">
                  <button
                    onClick={() => install(modalApp)}
                    disabled={saving || !keyValue.trim()}
                    className="flex-1 px-4 py-2.5 bg-accent text-black text-sm font-medium rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {saving ? "Installing…" : "Install"}
                  </button>
                  <button
                    onClick={closeModal}
                    className="px-4 py-2.5 border border-border text-sm font-medium rounded-lg text-text-muted hover:text-text-primary hover:border-zinc-600 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
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

function AppTile({ app, installed, revealed, confirming, confirmSeconds, onTileTap, onAction }: {
  app: AppInfo;
  installed: boolean;
  revealed: boolean;
  confirming: boolean;
  confirmSeconds: number;
  onTileTap: () => void;
  onAction: (e: React.MouseEvent) => void;
}) {
  return (
    <div className="w-28 flex flex-col items-center">
      <div
        className={`relative group/app w-28 h-28 rounded-2xl shadow-lg shadow-black/30 flex items-center justify-center cursor-pointer select-none overflow-hidden transition-transform duration-150 active:scale-95 ${
          installed ? "" : "opacity-90"
        }`}
        style={{ backgroundColor: app.bg }}
        onClick={onTileTap}
        role="button"
        aria-label={`${app.name}: ${installed ? "installed" : "not installed"}`}
      >
        <AppLogo app={app} className="w-12 h-12" />

        {installed && !app.alwaysInstalled && (
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-green-400 ring-2 ring-black/40" />
        )}
        {app.alwaysInstalled && (
          <span className="absolute top-1.5 right-1.5 text-[9px] font-mono text-black/50">sys</span>
        )}

        {/* Lower-half install/uninstall overlay */}
        {!app.alwaysInstalled && (
          <div
            className={`absolute inset-x-0 bottom-0 h-[52%] flex items-end justify-center pb-2 bg-gradient-to-t from-black/80 via-black/50 to-transparent transition-opacity duration-150 ${
              revealed ? "opacity-100" : "opacity-0 group-hover/app:opacity-100"
            }`}
          >
            <button
              onClick={onAction}
              className={`pointer-events-auto w-[calc(100%-12px)] py-1 rounded-md text-[11px] font-medium transition-colors ${
                installed
                  ? confirming
                    ? "bg-red-600 text-white animate-pulse"
                    : "bg-red-500/15 border border-red-500/50 text-red-300 hover:bg-red-500/30"
                  : "bg-accent text-black hover:bg-accent/90"
              }`}
            >
              {installed ? (confirming ? `Tap again (${confirmSeconds})` : "Uninstall") : "Install"}
            </button>
          </div>
        )}
      </div>
      <div className="text-center mt-2 w-full">
        <div className="text-xs font-medium text-text-primary truncate">{app.name}</div>
        <div className="text-[10px] text-text-muted truncate">{app.vendor}</div>
      </div>
    </div>
  );
}
