import { useMemo, useState } from "react";
import data from "@/data/disclosure-record.json";

/**
 * Disclosure record: every request we sent to an institution by email (and through WhatDoTheyKnow),
 * what came back, and whether the statutory clock was met. Built from the case-mail archive
 * (gmail-manifest.json, Part A) and the WhatDoTheyKnow manifest (Part B).
 * — Sion's Tab agent, 21 Oct 2026
 */
type Conv = {
  ev: string; u: string; t: string; reg: string; ref: string; rd: string; dl: string; met: string; fr: string;
  d: number | null; c: string; ex: string[]; ns: number | null; nr: number | null; na: number | null;
  att: [string, string][]; m: string; via: string;
};
type Inst = { name: string; n: number; cnt: Record<string, number>; convs: Conv[] };
const D = data as unknown as {
  generated: string; asOf: string; classes: string[]; hub: string;
  totals: { institutions: number; requests: number; sent: number; received: number; attachments: number; met: number; missed: number; pending: number; clocked: number };
  byClass: Record<string, number>; months: { m: string; c: Record<string, number> }[]; institutions: Inst[];
};

export const CLASS: Record<string, { label: string; colour: string; hollow?: boolean }> = {
  "substantive disclosure": { label: "Disclosed", colour: "#2e9e57" },
  partial: { label: "Partly disclosed", colour: "#d4a017" },
  "not held": { label: "“Not held”", colour: "#8b5cf6" },
  refusal: { label: "Refused", colour: "#dc2626" },
  "redirected elsewhere": { label: "Sent elsewhere", colour: "#3b82f6" },
  "fee or clarification demand": { label: "Fee or clarification asked", colour: "#0d9488" },
  "complaint outcome": { label: "Complaint outcome", colour: "#db2777" },
  "correspondence (no disclosure)": { label: "Reply, nothing disclosed", colour: "#8a817a" },
  "acknowledgement only": { label: "Acknowledged only", colour: "#b8b0a8" },
  "no reply by deadline": { label: "No reply by deadline", colour: "#ea580c" },
  "no reply": { label: "No reply", colour: "#9ca3af", hollow: true },
};
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const fmt = (s: string) => {
  if (!s) return "—";
  const [y, m, d] = s.split("-").map(Number);
  return `${d} ${MON[m - 1]} ${y}`;
};
const monLabel = (s: string) => `${MON[Number(s.slice(5, 7)) - 1]} ${s.slice(2, 4)}`;
const missed = (c: Conv) => c.met.startsWith("missed");

function Tile({ c, on, dim, onTap }: { c: Conv; on: boolean; dim: boolean; onTap: () => void }) {
  const k = CLASS[c.c] ?? CLASS["no reply"];
  return (
    <button
      type="button"
      onClick={onTap}
      aria-pressed={on}
      aria-label={`${c.ev}: ${c.t}. ${k.label}. ${c.met}`}
      title={`${c.ev} · ${k.label}`}
      className="relative size-7 rounded-md transition-opacity"
      style={{
        background: k.hollow ? "transparent" : k.colour,
        border: k.hollow ? `2px dashed ${k.colour}` : "none",
        opacity: dim ? 0.18 : 1,
        outline: on ? "3px solid var(--color-fg)" : missed(c) ? "2px solid #ef4444" : "none",
        outlineOffset: on ? 2 : 1,
      }}
    >
      {c.via !== "Email" && <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white">W</span>}
    </button>
  );
}

function Detail({ c }: { c: Conv }) {
  const k = CLASS[c.c] ?? CLASS["no reply"];
  const rows: [string, string | undefined][] = [
    ["Route", c.via === "Email" ? `Email · ${c.reg}` : c.reg],
    ["Their reference", c.ref || "none given"],
    ["Asked", fmt(c.rd)],
    ["Statutory deadline", c.dl ? fmt(c.dl) : "none applies"],
    ["Clock", c.met],
    ["First real reply", c.fr ? fmt(c.fr) : c.via === "Email" ? "none" : undefined],
    ["Days waited", c.d == null ? undefined : String(c.d)],
    ["Exemptions cited", c.ex.length ? c.ex.join(", ") : undefined],
    ["Messages", c.ns == null ? undefined : `${c.ns} sent · ${c.nr} received (${c.na} acknowledgements)`],
  ];
  return (
    <div className="mt-2 rounded-xl border border-line bg-surface p-3 text-sm" style={{ borderLeft: `4px solid ${k.colour}` }}>
      <p className="text-xs tracking-[0.14em] text-brass uppercase">{c.ev} · {k.label}</p>
      <p className="mt-1 font-serif text-lg leading-snug text-fg">{c.t}</p>
      <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
        {rows.filter((r) => r[1]).map(([a, b]) => (
          <div key={a} className="contents">
            <dt className="text-muted">{a}</dt>
            <dd className="text-fg">{b}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
        <a href={c.u} target="_blank" rel="noreferrer" className="text-brass underline underline-offset-4">Evidence page {c.ev}</a>
        <a href={c.m} target="_blank" rel="noreferrer" className="text-brass underline underline-offset-4">{c.via === "Email" ? "Open the emails" : "Open the thread"}</a>
      </div>
      {c.att.length > 0 && (
        <ul className="mt-2 space-y-1">
          {c.att.map(([n, u]) => (
            <li key={u}>
              <a href={u} target="_blank" rel="noreferrer" className="break-all text-brass underline underline-offset-2">📎 {n}</a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function DisclosureRecord() {
  const [sel, setSel] = useState<string | null>(null);
  const [cls, setCls] = useState<string | null>(null);
  const [mon, setMon] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const T = D.totals;
  const max = useMemo(() => Math.max(...D.months.map((m) => Object.values(m.c).reduce((a, b) => a + b, 0))), []);
  const shown = open ? D.institutions : D.institutions.slice(0, 12);
  const match = (c: Conv) => (!cls || c.c === cls) && (!mon || c.rd.startsWith(mon));
  const nMatch = D.institutions.reduce((a, i) => a + i.convs.filter(match).length, 0);

  return (
    <section id="disclosure-record" aria-label="Disclosure record" className="rounded-[var(--radius-card)] border border-line bg-surface p-3">
      <h2 className="font-serif text-2xl leading-tight text-fg">Disclosure record</h2>
      <p className="mt-1 text-sm text-muted">Every request sent to an institution, and what came back.</p>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        {[
          [T.requests, "requests"],
          [T.institutions, "institutions"],
          [T.attachments, "documents sent to us"],
          [T.met, "clocks met"],
          [T.missed, "clocks missed"],
          [T.pending, "not yet due"],
        ].map(([n, l]) => (
          <div key={String(l)} className="rounded-lg border border-line px-1 py-2">
            <div className="font-serif text-xl text-fg">{n}</div>
            <div className="text-[11px] leading-tight text-muted">{l}</div>
          </div>
        ))}
      </div>

      <p className="mt-4 text-xs text-muted">Outcome of every request (tap a colour to filter)</p>
      <div className="mt-1 flex h-4 w-full overflow-hidden rounded-full border border-line" role="img" aria-label="Share of requests by outcome">
        {D.classes.filter((k) => D.byClass[k]).map((k) => (
          <div key={k} style={{ width: `${(100 * D.byClass[k]) / T.requests}%`, background: CLASS[k].hollow ? "transparent" : CLASS[k].colour }} />
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {D.classes.filter((k) => D.byClass[k]).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setCls(cls === k ? null : k)}
            aria-pressed={cls === k}
            className="flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] text-fg"
            style={{ borderColor: cls === k ? "var(--color-fg)" : "var(--color-line)" }}
          >
            <span className="inline-block size-2.5 rounded-sm" style={{ background: CLASS[k].hollow ? "transparent" : CLASS[k].colour, border: CLASS[k].hollow ? `1.5px dashed ${CLASS[k].colour}` : "none" }} />
            {CLASS[k].label} {D.byClass[k]}
          </button>
        ))}
      </div>

      <p className="mt-4 text-xs text-muted">Requests sent per month (tap a month to filter)</p>
      <div className="mt-1 flex h-28 items-end gap-[3px]" role="group" aria-label="Requests per month">
        {D.months.map((m) => {
          const n = Object.values(m.c).reduce((a, b) => a + b, 0);
          return (
            <button
              key={m.m}
              type="button"
              onClick={() => setMon(mon === m.m ? null : m.m)}
              aria-pressed={mon === m.m}
              aria-label={`${monLabel(m.m)}: ${n} requests`}
              className="flex h-full min-w-0 flex-1 flex-col justify-end"
              style={{ opacity: mon && mon !== m.m ? 0.3 : 1 }}
            >
              <span className="mb-0.5 text-center text-[9px] text-muted">{n}</span>
              <span className="flex w-full flex-col-reverse overflow-hidden rounded-t" style={{ height: `${(100 * n) / max}%`, minHeight: 3 }}>
                {D.classes.filter((k) => m.c[k]).map((k) => (
                  <span key={k} style={{ flexGrow: m.c[k], background: CLASS[k].hollow ? "#9ca3af55" : CLASS[k].colour }} />
                ))}
              </span>
            </button>
          );
        })}
      </div>
      <div className="mt-1 flex gap-[3px]">
        {D.months.map((m) => (
          <span key={m.m} className="min-w-0 flex-1 truncate text-center text-[8px] text-faint">{monLabel(m.m)}</span>
        ))}
      </div>
      {(cls || mon) && (
        <button type="button" onClick={() => { setCls(null); setMon(null); }} className="mt-2 text-xs text-brass underline underline-offset-4">
          Showing {nMatch} · clear filter
        </button>
      )}

      <p className="mt-4 text-xs text-muted">One lane per institution, one square per request, oldest first. Red ring: statutory clock missed. W: WhatDoTheyKnow. Tap a square.</p>
      <ul className="mt-2 space-y-3">
        {shown.map((i) => {
          const s = i.convs.find((c) => c.ev === sel);
          return (
            <li key={i.name}>
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm text-fg">{i.name}</span>
                <span className="shrink-0 text-xs text-muted">{i.n}</span>
              </div>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {i.convs.map((c) => (
                  <Tile key={c.ev} c={c} on={sel === c.ev} dim={!match(c)} onTap={() => setSel(sel === c.ev ? null : c.ev)} />
                ))}
              </div>
              {s && <Detail c={s} />}
            </li>
          );
        })}
      </ul>
      {D.institutions.length > 12 && (
        <button type="button" onClick={() => setOpen(!open)} className="mt-3 w-full rounded-full border border-line py-2 text-sm text-fg">
          {open ? "Show fewer institutions" : `Show all ${D.institutions.length} institutions`}
        </button>
      )}
      <p className="mt-3 text-xs leading-relaxed text-muted">
        Clocks: FOI and EIR 20 working days; EIR internal review 40; subject access one calendar month. Days waited run from our request to the first reply that was more than an acknowledgement. As of {D.asOf}.{" "}
        <a href={D.hub} target="_blank" rel="noreferrer" className="text-brass underline underline-offset-2">Every request on the wiki</a>
      </p>
    </section>
  );
}
