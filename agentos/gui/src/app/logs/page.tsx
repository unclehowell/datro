"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

interface LogFile {
  name: string;
  size: number;
  modified: string;
  path: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

export default function LogsPage() {
  const [files, setFiles] = useState<LogFile[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [content, setContent] = useState<string>("");
  const [totalLines, setTotalLines] = useState(0);
  const [returnedLines, setReturnedLines] = useState(0);
  const [lines, setLines] = useState(200);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const loadFiles = useCallback(async () => {
    try {
      const res = await fetch("/api/logs?action=list");
      const data = await res.json();
      if (data.ok) setFiles(data.files);
    } catch (e: any) {
      setError(`Could not list logs: ${e.message}`);
    }
  }, []);

  const loadLog = useCallback(async (name: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/logs?action=read&file=${encodeURIComponent(name)}&lines=${lines}`);
      const data = await res.json();
      if (data.ok) {
        setContent(data.content);
        setTotalLines(data.totalLines);
        setReturnedLines(data.returnedLines);
        setSelected(name);
      } else {
        setError(data.error || "Could not read log");
      }
    } catch (e: any) {
      setError(`Could not read log: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }, [lines]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  useEffect(() => {
    if (!autoRefresh || !selected) return;
    const t = setInterval(() => loadLog(selected), 3000);
    return () => clearInterval(t);
  }, [autoRefresh, selected, loadLog]);

  return (
    <div className="flex flex-col h-full min-h-0">
      <header className="border-b border-border px-4 md:px-6 py-3 md:py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-text-muted hover:text-text-primary text-sm">← Back</Link>
          <h1 className="text-base md:text-lg font-semibold">📋 Logs</h1>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <label className="flex items-center gap-1.5 text-text-muted">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            Auto-refresh
          </label>
          {selected && (
            <button
              onClick={() => loadLog(selected)}
              className="px-3 py-1.5 rounded-lg border border-border text-text-secondary hover:text-accent hover:border-accent/50 transition-colors min-h-[36px]"
            >
              Refresh
            </button>
          )}
        </div>
      </header>

      <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
        {/* File list */}
        <aside className="md:w-64 border-b md:border-b-0 md:border-r border-border bg-surface/50 overflow-y-auto shrink-0">
          <div className="p-3">
            <h2 className="text-xs font-medium text-text-secondary mb-2">Available logs</h2>
            {files.length === 0 && (
              <p className="text-xs text-text-muted">No log files found.</p>
            )}
            <ul className="space-y-1">
              {files.map((f) => (
                <li key={f.name}>
                  <button
                    onClick={() => loadLog(f.name)}
                    className={`w-full text-left px-2 py-2 rounded text-xs transition-colors min-h-[44px] ${
                      selected === f.name
                        ? "bg-accent/15 text-accent border border-accent/20"
                        : "text-text-secondary hover:text-text-primary hover:bg-surface-hover border border-transparent"
                    }`}
                  >
                    <div className="font-mono truncate">{f.name}</div>
                    <div className="text-text-muted text-[10px] mt-0.5 flex items-center justify-between">
                      <span>{formatBytes(f.size)}</span>
                      <span>{new Date(f.modified).toLocaleTimeString()}</span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Log viewer */}
        <main className="flex-1 flex flex-col min-h-0 min-w-0">
          {error && (
            <div className="m-3 p-3 rounded-lg bg-error/10 border border-error/30 text-error text-sm">
              {error}
            </div>
          )}

          {!selected && !error && (
            <div className="flex-1 flex items-center justify-center text-text-muted text-sm p-6">
              Select a log file from the sidebar to view its contents.
            </div>
          )}

          {selected && (
            <>
              <div className="px-4 py-2 border-b border-border flex items-center justify-between text-xs text-text-muted shrink-0">
                <span className="font-mono truncate">{selected}</span>
                <span>
                  {returnedLines} of {totalLines} lines
                </span>
              </div>
              <div className="flex-1 overflow-auto bg-[#0a0a0f] p-3 min-w-0">
                {loading ? (
                  <div className="text-text-muted text-xs">Loading…</div>
                ) : (
                  <pre className="text-[11px] font-mono text-text-secondary whitespace-pre-wrap break-all leading-relaxed">
{content || "(empty)"}
                  </pre>
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
