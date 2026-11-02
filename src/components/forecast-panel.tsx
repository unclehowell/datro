import { useEffect, useMemo, useState } from "react";

/**
 * Forecast of the "exhaust every option" game for one institution (data: /data/forecast.json, built by
 * work/forecast/build_forecast.py from forecast/institutions.json — each body's own ladder, cited rung by rung).
 * ForecastScatter: x = date, y = ladder rung; our emails and their replies; solid = actual, hollow = forecast,
 * a today line, red house / red fish for missed deadlines. ForecastBoard: the completed board (every rung played to
 * exhaustion, dated), drawn over the Donkey Kong board. — Sion's Tab agent
 */
export type FRung = { n: number; k: string; l: string; t: string; c: string; law: string; src: string; inf: number; note?: string | null };
export type FInst = {
  id: string; name: string; late_wd: number; late_n: number; exhaust: string;
  rungs: FRung[];
  pts: [string, number, number, number, string][];
  fc: [string, number, number, number, string, (string | null)?][];
  marks: [string, number, "house" | "fish", string][];
  board: { n: number; us: string | null; them: string | null; done: boolean; played?: boolean; missed?: string }[];
  threads: { track: string; rung: number | null; state: string; date: string; ref: string }[];
};
export type FDoc = { generated: string; today: string; assumptions: string[]; institutions: FInst[] };

let cache: Promise<FDoc | null> | null = null;
export function useForecast(want: boolean) {
  const [doc, setDoc] = useState<FDoc | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!want || doc) return;
    if (!cache) {
      const d = new Date().toISOString().slice(0, 10);
      cache = fetch(`/data/forecast.json?d=${d}`).then((r) => (r.ok ? (r.json() as Promise<FDoc>) : null)).catch(() => null);
    }
    let live = true;
    cache.then((x) => {
      if (!live) return;
      if (x) setDoc(x);
      else { setFailed(true); cache = null; }
    });
    return () => { live = false; };
  }, [want, doc]);
  return { doc, failed };
}

const OURS = "var(--ghf-accent, #EE4EF4)";
const THEIRS = "color-mix(in srgb, var(--ghf-p, #671B6A) 30%, #f4efe6)";
const RED = "#ef4444";
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const t = (s: string) => Date.parse(`${s}T12:00:00Z`);
export const fdate = (s?: string | null) => {
  if (!s) return "";
  const d = new Date(`${s}T12:00:00Z`);
  return `${d.getUTCDate()} ${MON[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
};

export function GraphIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M4 4v16h16" />
      <circle cx="9" cy="14" r="1.6" fill="currentColor" />
      <circle cx="13" cy="10" r="1.6" fill="currentColor" />
      <circle cx="17" cy="7" r="1.6" />
      <circle cx="16" cy="13" r="1.6" />
    </svg>
  );
}
export function BoardIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M3 19l18-3M3 13l18 3M3 10l18-3M3 4l18 3" />
      <path d="M7 18.3V12.3M17 16.7v-6" strokeDasharray="2 2" />
    </svg>
  );
}
function House({ x, y, s = 7 }: { x: number; y: number; s?: number }) {
  return <path d={`M${x - s} ${y + s * 0.8}V${y - s * 0.1}L${x} ${y - s}L${x + s} ${y - s * 0.1}V${y + s * 0.8}Z`} fill={RED} stroke="#120000" strokeWidth="0.8" />;
}
function Fish({ x, y, s = 7 }: { x: number; y: number; s?: number }) {
  return <path d={`M${x - s} ${y}Q${x - s * 0.2} ${y - s * 0.8} ${x + s * 0.5} ${y}Q${x - s * 0.2} ${y + s * 0.8} ${x - s} ${y}ZM${x + s * 0.4} ${y}L${x + s} ${y - s * 0.6}V${y + s * 0.6}Z`} fill={RED} stroke="#120000" strokeWidth="0.8" />;
}

type Pick = { d: string; who: string; rung: string; kind: string; extra?: string } | null;

export function ForecastScatter({ inst, today }: { inst: FInst; today: string }) {
  const [sel, setSel] = useState<Pick>(null);
  const [span, setSpan] = useState<"all" | "ahead">("all");
  useEffect(() => setSel(null), [inst.id]);
  const R = inst.rungs.length;
  const W = 360, PADL = 26, PADR = 8, PADT = 8, ROW = R > 12 ? 15 : 18, PADB = 24;
  const H = PADT + R * ROW + PADB;
  const all = useMemo(() => [...inst.pts.map((p) => p[0]), ...inst.fc.map((p) => p[0]), ...inst.marks.map((m) => m[0]), today], [inst, today]);
  const t0 = span === "ahead" ? t(today) - 30 * 864e5 : Math.min(...all.map(t));
  const t1 = Math.max(...all.map(t), t(inst.exhaust)) + 15 * 864e5;
  const X = (s: string) => PADL + ((t(s) - t0) / (t1 - t0)) * (W - PADL - PADR);
  const Y = (n: number) => PADT + (R - n + 0.5) * ROW;
  const ticks = useMemo(() => {
    const out: { x: number; lab: string }[] = [];
    const a = new Date(t0), b = new Date(t1);
    const months = (b.getUTCFullYear() - a.getUTCFullYear()) * 12 + b.getUTCMonth() - a.getUTCMonth();
    const step = months > 30 ? 12 : months > 14 ? 6 : months > 6 ? 3 : 1;
    const d = new Date(Date.UTC(a.getUTCFullYear(), a.getUTCMonth() + 1, 1));
    while (d.getTime() < t1) {
      if (d.getUTCMonth() % step === 0) out.push({ x: X(d.toISOString().slice(0, 10)), lab: step >= 12 ? `${d.getUTCFullYear()}` : `${MON[d.getUTCMonth()]}${d.getUTCMonth() === 0 || out.length === 0 ? ` ${String(d.getUTCFullYear()).slice(2)}` : ""}` });
      d.setUTCMonth(d.getUTCMonth() + 1);
    }
    return out;
  }, [t0, t1]); // eslint-disable-line react-hooks/exhaustive-deps
  const vis = (s: string) => t(s) >= t0;
  const lab = (n: number) => inst.rungs[n - 1]?.l ?? `rung ${n}`;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2 text-xs text-muted">
        <span>
          forecast · last option exhausted <span className="text-fg">{fdate(inst.exhaust)}</span>
        </span>
        <span className="flex overflow-hidden rounded-lg border border-line">
          {(["all", "ahead"] as const).map((k) => (
            <button key={k} type="button" onClick={() => setSpan(k)} aria-pressed={span === k}
              className={`px-2 py-1 ${span === k ? "bg-surface-2 text-fg" : "text-muted"}`}>{k === "all" ? "all" : "ahead"}</button>
          ))}
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" role="img"
        aria-label={`Forecast scatter for ${inst.name}: ${inst.pts.length} emails so far, ${inst.fc.length} forecast emails and replies, last option exhausted ${fdate(inst.exhaust)}`}>
        {inst.rungs.map((r) => (
          <g key={r.n}>
            <line x1={PADL} x2={W - PADR} y1={Y(r.n)} y2={Y(r.n)} stroke="var(--color-line, #3a3228)" strokeWidth="0.6" />
            <text x={PADL - 4} y={Y(r.n) + 3} textAnchor="end" fontSize="9" fill="var(--color-muted, #a39888)">{r.n}{r.inf ? "*" : ""}</text>
          </g>
        ))}
        {ticks.map((k, i) => (
          <g key={i}>
            <line x1={k.x} x2={k.x} y1={PADT} y2={H - PADB + 3} stroke="var(--color-line, #3a3228)" strokeWidth="0.4" strokeDasharray="1 2" />
            <text x={k.x} y={H - PADB + 12} textAnchor="middle" fontSize="8.5" fill="var(--color-muted, #a39888)">{k.lab}</text>
          </g>
        ))}
        <line x1={X(today)} x2={X(today)} y1={PADT - 2} y2={H - PADB + 3} stroke="var(--color-fg, #f4efe6)" strokeWidth="1" />
        <text x={X(today) + 2} y={H - 3} fontSize="8.5" fill="var(--color-fg, #f4efe6)">today</text>
        {inst.fc.filter((p) => p[1] === 1 && p[5] && vis(p[0])).map((p, i) => (
          <line key={`b${i}`} x1={X(p[0])} x2={X(p[5] as string)} y1={Y(p[2])} y2={Y(p[2])} stroke={THEIRS} strokeWidth="3" strokeOpacity="0.35" strokeLinecap="round" />
        ))}
        {inst.pts.filter((p) => vis(p[0])).map((p, i) => {
          const x = X(p[0]), y = Y(p[2]) + (p[1] === 0 ? -2.5 : 2.5);
          const on = () => setSel({ d: p[0], who: p[1] === 0 ? "our email" : "their reply", rung: lab(p[2]), kind: "actual", extra: p[4] });
          return p[1] === 0
            ? <circle key={`a${i}`} cx={x} cy={y} r="2.6" fill={OURS} onClick={on} style={{ cursor: "pointer" }} />
            : <rect key={`a${i}`} x={x - 2.4} y={y - 2.4} width="4.8" height="4.8" fill={THEIRS} onClick={on} style={{ cursor: "pointer" }} />;
        })}
        {inst.fc.filter((p) => vis(p[0])).map((p, i) => {
          const x = X(p[0]), y = Y(p[2]) + (p[1] === 0 ? -2.5 : 2.5);
          const on = () => setSel({ d: p[0], who: p[1] === 0 ? "our email" : "their reply", rung: lab(p[2]), kind: "forecast", extra: `${p[4]}${p[5] ? ` · band to ${fdate(p[5])}` : ""}` });
          return p[1] === 0
            ? <circle key={`f${i}`} cx={x} cy={y} r="2.8" fill="none" stroke={OURS} strokeWidth="1.2" onClick={on} style={{ cursor: "pointer" }} />
            : <rect key={`f${i}`} x={x - 2.6} y={y - 2.6} width="5.2" height="5.2" fill="none" stroke={THEIRS} strokeWidth="1.2" onClick={on} style={{ cursor: "pointer" }} />;
        })}
        {inst.marks.filter((m) => vis(m[0])).map((m, i) => {
          const on = () => setSel({ d: m[0], who: m[2] === "house" ? "red house" : "red fish", rung: lab(m[1]), kind: "missed deadline", extra: m[3] });
          return <g key={`m${i}`} onClick={on} style={{ cursor: "pointer" }}>{m[2] === "house" ? <House x={X(m[0])} y={Y(m[1]) - 6} s={4.5} /> : <Fish x={X(m[0])} y={Y(m[1]) - 6} s={4.5} />}</g>;
        })}
      </svg>
      <ul className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted" aria-label="Key">
        <li className="flex items-center gap-1"><svg width="10" height="10" aria-hidden="true"><circle cx="5" cy="5" r="3.5" fill={OURS} /></svg>our emails</li>
        <li className="flex items-center gap-1"><svg width="10" height="10" aria-hidden="true"><rect x="1.5" y="1.5" width="7" height="7" fill={THEIRS} /></svg>their replies</li>
        <li className="flex items-center gap-1"><svg width="10" height="10" aria-hidden="true"><circle cx="5" cy="5" r="3.5" fill="none" stroke="currentColor" /></svg>hollow = forecast</li>
        <li className="flex items-center gap-1"><svg width="12" height="10" aria-hidden="true"><House x={6} y={5} s={4} /></svg><svg width="12" height="10" aria-hidden="true"><Fish x={6} y={5} s={4} /></svg>missed</li>
      </ul>
      <p className="mt-1 min-h-[2.5em] text-xs leading-snug text-fg" aria-live="polite">
        {sel ? <>{fdate(sel.d)} · {sel.who} ({sel.kind}) · {sel.rung}{sel.extra ? <span className="text-muted"> · {sel.extra}</span> : null}</> : <span className="text-muted">Tap a dot for its date and rung.</span>}
      </p>
      <details className="mt-1 text-xs text-muted">
        <summary className="cursor-pointer select-none text-fg">{R} rungs on this ladder{inst.rungs.some((r) => r.inf) ? " (* = our reading)" : ""}</summary>
        <ol className="mt-1 space-y-1">
          {inst.rungs.map((r) => (
            <li key={r.n} className="leading-snug">
              <span className="text-fg">{r.n}{r.inf ? "*" : ""} {r.l}</span> · {r.c} · <a href={r.src} target="_blank" rel="noopener noreferrer" className="underline decoration-dotted">{r.law}</a>
              {r.inf && r.note ? <span className="block text-faint">{r.note}</span> : null}
            </li>
          ))}
        </ol>
      </details>
    </div>
  );
}

export function ForecastAssumptions({ doc, inst }: { doc: FDoc; inst: FInst }) {
  return (
    <details className="mt-1 text-xs text-muted">
      <summary className="cursor-pointer select-none text-fg">How the forecast is made</summary>
      <ul className="mt-1 list-disc space-y-0.5 pl-4">
        {doc.assumptions.map((a, i) => <li key={i}>{a}</li>)}
        <li>{inst.late_n ? `This body's median lateness on record: ${inst.late_wd} working days (${inst.late_n} late replies).` : "No late replies on record for this body, so no band."}</li>
        <li>Built {doc.generated.slice(0, 10)}; re-run when new mail arrives.</li>
      </ul>
    </details>
  );
}

/** The completed board: every rung of this body's own ladder played to exhaustion, dated, drawn over the board. */
export function ForecastBoard({ inst, vw, vh }: { inst: FInst; vw: number; vh: number }) {
  const R = inst.rungs.length;
  const top = 50, bot = 10;
  const row = (vh - top - bot) / R;
  const left = 16, right = vw - 16;
  const tilt = Math.min(10, row * 0.28);
  const y = (n: number, x: number) => {
    const base = vh - bot - (n - 0.5) * row;
    const up = n % 2 === 1;
    const f = (x - left) / (right - left);
    return base + (up ? tilt / 2 - tilt * f : -tilt / 2 + tilt * f);
  };
  const fs = Math.max(9, Math.min(13, row * 0.34));
  const b = new Map(inst.board.map((x) => [x.n, x]));
  return (
    <svg viewBox={`0 0 ${vw} ${vh}`} className="absolute inset-0 h-full w-full" role="img" data-ghf-keep
      aria-label={`Forecast completed board for ${inst.name}: ${inst.rungs.map((r) => `${r.n} ${r.l}, ${fdate(b.get(r.n)?.us)} to ${fdate(b.get(r.n)?.them)}`).join("; ")}; last option exhausted ${fdate(inst.exhaust)}`}>
      <rect x="0" y="0" width={vw} height={vh} fill="#0d0b09" fillOpacity="0.72" />
      <text x={12} y={21} fontSize={Math.min(fs + 1, 14)} fontWeight="700" fill="#f4efe6">forecast · exhausted {fdate(inst.exhaust)}</text>
      <g fontSize={Math.min(fs, 11)} fill="#e9e2d4">
        <line x1={vw - 250} x2={vw - 232} y1={top - 12} y2={top - 12} stroke="#EE4EF4" strokeWidth="4" /><text x={vw - 228} y={top - 8}>played</text>
        <line x1={vw - 178} x2={vw - 160} y1={top - 12} y2={top - 12} stroke="#c4a574" strokeWidth="4" strokeDasharray="6 4" /><text x={vw - 156} y={top - 8}>forecast</text>
        <line x1={vw - 96} x2={vw - 78} y1={top - 12} y2={top - 12} stroke={RED} strokeWidth="4" /><text x={vw - 74} y={top - 8}>missed</text>
      </g>
      {inst.rungs.map((r) => {
        const st = b.get(r.n);
        const done = !!(st?.done || st?.played), missed = !!st?.missed, unused = !st?.us && !st?.them && !missed;
        const col = missed ? RED : done ? "#EE4EF4" : "#c4a574";
        const x1 = left, x2 = right;
        const lx = r.n % 2 === 1 ? left + 6 : left + 6;
        return (
          <g key={r.n}>
            <line x1={x1} y1={y(r.n, x1)} x2={x2} y2={y(r.n, x2)} stroke={col} strokeWidth={Math.max(3, row * 0.12)} strokeOpacity={unused ? 0.3 : done ? 0.95 : 0.75} strokeDasharray={done ? undefined : "10 6"} />
            {r.n < R && (
              <g stroke="#c4a574" strokeOpacity="0.55" strokeWidth="1.6">
                {(() => { const lxp = r.n % 2 === 1 ? right - 40 : left + 40; const ya = y(r.n, lxp), yb = y(r.n + 1, lxp); return (<>
                  <line x1={lxp - 6} x2={lxp - 6} y1={ya} y2={yb} /><line x1={lxp + 6} x2={lxp + 6} y1={ya} y2={yb} />
                  {Array.from({ length: Math.max(2, Math.floor((ya - yb) / 8)) }, (_, i) => { const yy = ya - ((i + 1) * (ya - yb)) / (Math.max(2, Math.floor((ya - yb) / 8)) + 1); return <line key={i} x1={lxp - 6} x2={lxp + 6} y1={yy} y2={yy} />; })}
                </>); })()}
              </g>
            )}
            <text x={lx} y={y(r.n, lx) - row * 0.22} fontSize={fs} fill="#f4efe6">
              {r.n}{r.inf ? "*" : ""} {r.l.length > 34 ? `${r.l.slice(0, 33)}…` : r.l}
            </text>
            <text x={right - 4} y={y(r.n, right - 4) + fs + 1} textAnchor="end" fontSize={fs * 0.9} fill={missed ? RED : "#e9e2d4"}>
              {unused ? "not on the forecast route" : <>{st?.us ? fdate(st.us) : "—"} → {st?.them ? fdate(st.them) : missed ? `no reply (${fdate(st?.missed)})` : "—"}</>}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
