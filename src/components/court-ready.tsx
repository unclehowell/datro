import { useMemo } from "react";
import data from "@/data/court-ready.json";
import { Chip, Row, fmtDate } from "@/components/detail-modal";

/**
 * Before court: the whole correspondence per institution, what is still to obtain, and which options
 * are used up. Built from the Wayback case-mail archive and the request tracker (facts only).
 * — Sion's Tab agent, 21 Oct 2026
 */
type Mail = [string, "s" | "r", string, string];
type Req = {
  type: string; subject: string; refs: string[]; sent: string; due: string; rule: string; status: string;
  late: boolean; outcome: string; firstReply: string; note: string; route: string; url: string;
  why?: string[]; whyEvidence?: { code: string; mail: string; date: string; quote: string }[];
};
type Checked = { ref: string; item: string; due: string; rule: string; next: string; status: string };
type Check = { k: string; state: "done" | "open" | "na" | "info"; v: string };
type Inst = {
  id: string; name: string; sent: number; received: number; first: string; last: string; mails: Mail[];
  requests: Req[]; checked: Checked[]; statusCounts: Record<string, number>; open: number; checklist: Check[];
};
type Artifact = { t: string; held: string; status: string; detail: string; next: string; inst: string };
const D = data as unknown as {
  generated: string; asOf: string; mailGenerated: string; mailCount: number; trackerThrough: string; method: string;
  institutions: Inst[]; artifacts: Artifact[]; reasonLegend?: { code: string; icon: string; label: string }[];
};

export const REQ_STATUS: Record<string, { label: string; colour: string }> = {
  answered: { label: "Answered", colour: "#3fb950" },
  partial: { label: "Partially", colour: "#d29922" },
  refused: { label: "Refused", colour: "#f85149" },
  overdue: { label: "Overdue", colour: "#ff7b39" },
  ignored: { label: "Ignored (no reply)", colour: "#9e9e9e" },
  pending: { label: "Not yet due", colour: "#58a6ff" },
  check: { label: "Reply may be elsewhere", colour: "#a371f7" },
  noreply: { label: "No reply (no statutory clock)", colour: "#6f6558" },
  info: { label: "Information", colour: "#6f6558" },
};
const ART_STATUS: Record<string, { label: string; colour: string }> = {
  requested: { label: "Requested, pending", colour: "#58a6ff" },
  "not-asked": { label: "Not yet asked", colour: "#c4a574" },
  "source-pending": { label: "Source pending", colour: "#a371f7" },
  located: { label: "Located, not yet read", colour: "#3fb950" },
  refused: { label: "Refused / not held", colour: "#f85149" },
  partial: { label: "Partly answered", colour: "#d29922" },
  overdue: { label: "Overdue", colour: "#ff7b39" },
  stalled: { label: "Stalled", colour: "#9e9e9e" },
  pending: { label: "Not yet due", colour: "#58a6ff" },
};
const MAILBASE = "https://wayback.bucklerfamily.estate/mail/";
export const REASONS: Record<string, { icon: string; label: string }> = Object.fromEntries(
  (D.reasonLegend || []).map((r) => [r.code, { icon: r.icon, label: r.label }]),
);
const icons = (r: Req) => (r.why || []).map((c) => REASONS[c]?.icon || "").join("");

/** The symbol key, behind a tap (mobile-first). */
export function ReasonLegend({ inst }: { inst?: Inst }) {
  const counts: Record<string, number> = {};
  (inst ? inst.requests : D.institutions.flatMap((x) => x.requests)).forEach((r) =>
    (r.why || []).forEach((c) => (counts[c] = (counts[c] || 0) + 1)),
  );
  const used = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return (
    <details className="mt-3 rounded-xl border border-line bg-surface/60 p-3 text-sm">
      <summary className="cursor-pointer list-none text-fg">
        <span className="font-semibold">Why no answer?</span>{" "}
        <span className="whitespace-nowrap">
          {used.length ? used.map(([c, n]) => `${REASONS[c]?.icon || c} ${n}`).join("  ") : "no reasons recorded"}
        </span>
        <span className="ml-1 text-xs text-brass underline underline-offset-4">key</span>
      </summary>
      <ul className="mt-2 flex flex-col gap-1">
        {(D.reasonLegend || []).map((r) => (
          <li key={r.code} className="flex gap-2">
            <span className="w-14 shrink-0 text-center">{r.icon}</span>
            <span className="text-muted">
              {r.label}
              {counts[r.code] ? ` · ${counts[r.code]}` : ""}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-faint">
        Each symbol comes from the reply's own words (quoted under the request) or from the statutory clock. It records what a reply
        said, not a finding about why.
      </p>
    </details>
  );
}

export const courtInstitutions = D.institutions;
export function courtInst(id: string) {
  return D.institutions.find((i) => i.id === id) || D.institutions[0];
}

/** Landing: three tiles only; everything else opens in the sheet. */
function topReasons() {
  const c: Record<string, number> = {};
  D.institutions.forEach((i) => i.requests.forEach((r) => (r.why || []).forEach((k) => k !== "full" && (c[k] = (c[k] || 0) + 1))));
  return Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k, n]) => `${REASONS[k]?.icon || ""}${n}`).join(" ");
}

export function CourtTiles({ onOpen }: { onOpen: (k: "corr" | "art" | "opt") => void }) {
  const open = D.institutions.reduce((n, i) => n + i.open, 0);
  const newest = D.institutions.reduce((m, i) => (i.last > m ? i.last : m), "");
  const artOpen = D.artifacts.filter((a) => a.status !== "located").length;
  const tile =
    "flex min-w-0 flex-1 flex-col items-start gap-1 rounded-xl border border-line bg-surface px-3 py-3 text-left";
  return (
    <section aria-label="Before court" className="flex flex-col gap-2">
      <p className="px-1 text-xs tracking-[0.16em] text-brass uppercase">Before court</p>
      <div className="flex gap-2">
        <button type="button" className={tile} onClick={() => onOpen("corr")}>
          <span className="text-sm font-medium text-fg">Correspondence</span>
          <span className="text-[11px] leading-snug text-muted">
            {D.mailCount} emails · newest {fmtDate(newest)}
          </span>
          <span className="text-[11px] leading-snug whitespace-nowrap">{topReasons()}</span>
        </button>
        <button type="button" className={tile} onClick={() => onOpen("art")}>
          <span className="text-sm font-medium text-fg">Still to obtain</span>
          <span className="text-[11px] leading-snug text-muted">{artOpen} records</span>
        </button>
        <button type="button" className={tile} onClick={() => onOpen("opt")}>
          <span className="text-sm font-medium text-fg">Options used</span>
          <span className="text-[11px] leading-snug text-muted">{open} items open</span>
        </button>
      </div>
    </section>
  );
}

function InstPicker({ instId, onChange }: { instId: string; onChange: (id: string) => void }) {
  return (
    <select
      value={instId}
      onChange={(e) => onChange(e.target.value)}
      aria-label="Institution"
      className="mt-2 w-full rounded-lg border border-line bg-surface px-2 py-2 text-sm text-fg"
    >
      {D.institutions.map((i) => (
        <option key={i.id} value={i.id}>
          {i.name} · {i.sent + i.received}
        </option>
      ))}
    </select>
  );
}

/** Sent above the line, replies below, request clocks as coloured ticks. */
function Timeline({ inst }: { inst: Inst }) {
  const W = 340, H = 120, P = 10, MID = 60;
  const pts = inst.mails.filter((m) => /^\d{4}-\d{2}-\d{2}$/.test(m[0]));
  const reqs = inst.requests.filter((r) => /^\d{4}-\d{2}-\d{2}/.test(r.sent));
  const dates = [...pts.map((m) => m[0]), ...reqs.map((r) => r.sent.slice(0, 10)), D.asOf].sort();
  if (!dates.length) return null;
  const t0 = Date.parse(dates[0]), t1 = Math.max(Date.parse(dates[dates.length - 1]), t0 + 864e5 * 30);
  const x = (d: string) => P + ((Date.parse(d) - t0) / (t1 - t0)) * (W - 2 * P);
  const stack: Record<string, number> = {};
  const y = (m: Mail) => {
    const k = m[1] + Math.round(x(m[0]) / 5);
    stack[k] = (stack[k] || 0) + 1;
    const n = Math.min(stack[k], 8);
    return m[1] === "s" ? MID - 8 - n * 5 : MID + 8 + n * 5;
  };
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mt-3 w-full rounded-lg border border-line bg-surface/60" role="img"
      aria-label={`${inst.sent} emails sent and ${inst.received} received, ${fmtDate(inst.first)} to ${fmtDate(inst.last)}`}>
      <line x1={P} x2={W - P} y1={MID} y2={MID} stroke="var(--color-line)" />
      {reqs.map((r, i) => (
        <g key={"r" + i}>
          <line x1={x(r.sent.slice(0, 10))} x2={x(r.sent.slice(0, 10))} y1={MID - 4} y2={MID + 4}
            stroke={REQ_STATUS[r.status]?.colour || "#888"} strokeWidth={2} />
          {icons(r) && (
            <text x={x(r.sent.slice(0, 10))} y={MID + 3} fontSize={7} textAnchor="middle">
              <title>{`${fmtDate(r.sent)} · ${r.subject} · ${(r.why || []).map((c) => REASONS[c]?.label).join("; ")}`}</title>
              {(r.why || []).map((c) => REASONS[c]?.icon || "")[0]}
            </text>
          )}
          {r.due && r.due <= D.asOf && ["overdue", "ignored"].includes(r.status) && (
            <line x1={x(r.sent.slice(0, 10))} x2={x(r.due)} y1={MID} y2={MID} stroke={REQ_STATUS[r.status].colour} strokeWidth={2} />
          )}
        </g>
      ))}
      {pts.map((m, i) => (
        <a key={i} href={MAILBASE + m[3] + ".txt"} target="_blank" rel="noreferrer">
          <title>{`${fmtDate(m[0])} · ${m[1] === "s" ? "sent" : "received"} · ${m[2]}`}</title>
          <circle cx={x(m[0])} cy={y(m)} r={2.4} fill={m[1] === "s" ? "var(--color-brass)" : "#58a6ff"} />
        </a>
      ))}
      <line x1={x(D.asOf)} x2={x(D.asOf)} y1={8} y2={H - 8} stroke="var(--color-faint)" strokeDasharray="2 3" />
      <text x={P} y={11} fontSize={8} fill="var(--color-muted)">sent ▲</text>
      <text x={P} y={H - 4} fontSize={8} fill="var(--color-muted)">replies ▼</text>
      <text x={W - P} y={11} fontSize={8} fill="var(--color-muted)" textAnchor="end">{fmtDate(dates[0])} → today</text>
    </svg>
  );
}

export function CorrSheet({ instId, onInst }: { instId: string; onInst: (id: string) => void }) {
  const inst = courtInst(instId);
  const counts = Object.entries(inst.statusCounts).sort((a, b) => b[1] - a[1]);
  const recent = useMemo(() => [...inst.mails].reverse().slice(0, 12), [inst]);
  return (
    <div>
      <p className="text-xs tracking-[0.16em] text-brass uppercase">Correspondence</p>
      <h2 className="mt-1 font-serif text-2xl leading-tight">{inst.name}</h2>
      <InstPicker instId={inst.id} onChange={onInst} />
      <p className="mt-2 text-sm text-muted">
        {inst.sent} sent · {inst.received} received · {fmtDate(inst.first)} – {fmtDate(inst.last)}
      </p>
      <Timeline inst={inst} />
      <ReasonLegend inst={inst} />
      <div className="mt-3 flex flex-wrap gap-2">
        {counts.map(([k, n]) => (
          <Chip key={k} colour={REQ_STATUS[k]?.colour || "#888"}>
            {REQ_STATUS[k]?.label || k}: {n}
          </Chip>
        ))}
      </div>
      {inst.checked.length > 0 && (
        <div className="mt-4">
          <p className="text-sm font-semibold text-fg">Checked by hand ({fmtDate(D.asOf)})</p>
          {inst.checked.map((c, i) => (
            <div key={i} className="mt-2 rounded-xl border border-line bg-surface/60 p-3 text-sm">
              <p className="text-fg">{c.ref}</p>
              <p className="text-xs text-muted">{c.item}</p>
              <Row k="Due" v={c.due} />
              <Row k="Rule" v={c.rule} />
              <Row k="Status" v={c.status} />
              <Row k="Next route" v={c.next} />
            </div>
          ))}
        </div>
      )}
      <details className="mt-4">
        <summary className="cursor-pointer text-sm font-semibold text-fg">
          Requests and status ({inst.requests.length})
        </summary>
        <ul className="mt-2 flex flex-col gap-2">
          {inst.requests.map((r, i) => (
            <li key={i} className="rounded-xl border border-line bg-surface/60 p-3 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <Chip colour={REQ_STATUS[r.status]?.colour || "#888"}>
                  {REQ_STATUS[r.status]?.label || r.status}
                  {r.late ? " (late)" : ""}
                </Chip>
                {icons(r) && (
                  <span className="text-base leading-none" title={(r.why || []).map((c) => REASONS[c]?.label).join("; ")}>
                    {icons(r)}
                  </span>
                )}
                <span className="text-xs text-faint">{r.type}</span>
              </div>
              <p className="mt-1.5 leading-snug text-fg">{r.subject}</p>
              <Row k="Sent" v={fmtDate(r.sent)} />
              <Row k="Due" v={r.due ? `${fmtDate(r.due)}${r.rule ? ` (${r.rule})` : ""}` : undefined} />
              <Row k="First reply" v={r.firstReply ? fmtDate(r.firstReply) : undefined} />
              <Row k="Outcome" v={r.outcome || undefined} />
              <Row k="Refs" v={r.refs.join(", ") || undefined} />
              {(r.whyEvidence || []).map((e, k) => (
                <a key={k} href={MAILBASE + e.mail + ".txt"} target="_blank" rel="noreferrer"
                  className="mt-1 block text-xs leading-snug text-muted">
                  {REASONS[e.code]?.icon} {fmtDate(e.date)}: “{e.quote}”
                </a>
              ))}
              {r.note && <p className="mt-1 text-xs text-[#a371f7]">{r.note}</p>}
              {r.url && (
                <a href={r.url} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs text-brass underline underline-offset-4">
                  Open in the mail archive
                </a>
              )}
            </li>
          ))}
        </ul>
      </details>
      <details className="mt-3">
        <summary className="cursor-pointer text-sm font-semibold text-fg">Latest emails</summary>
        <ul className="mt-2 flex flex-col">
          {recent.map((m) => (
            <li key={m[3]} className="border-t border-line py-2 text-sm">
              <a href={MAILBASE + m[3] + ".txt"} target="_blank" rel="noreferrer" className="text-fg">
                <span className={m[1] === "s" ? "text-brass" : "text-[#58a6ff]"}>{m[1] === "s" ? "▲ sent" : "▼ reply"}</span>{" "}
                <span className="text-faint">{fmtDate(m[0])}</span> · {m[2]}
              </a>
            </li>
          ))}
        </ul>
      </details>
      <p className="mt-4 text-[11px] leading-snug text-faint">{D.method}</p>
    </div>
  );
}

export function ArtifactsSheet({ onInst }: { onInst: (id: string) => void }) {
  return (
    <div>
      <p className="text-xs tracking-[0.16em] text-brass uppercase">Still to obtain</p>
      <h2 className="mt-1 font-serif text-2xl leading-tight">Records not yet in hand</h2>
      <p className="mt-2 text-sm text-muted">Where each record is held and the next free route. Paid routes are the family's decision.</p>
      <ul className="mt-3 flex flex-col gap-2">
        {D.artifacts.map((a, i) => (
          <li key={i} className="rounded-xl border border-line bg-surface/60 p-3 text-sm">
            <Chip colour={ART_STATUS[a.status]?.colour || "#888"}>{ART_STATUS[a.status]?.label || a.status}</Chip>
            <p className="mt-1.5 leading-snug text-fg">{a.t}</p>
            <Row k="Held by" v={a.held} />
            <Row k="Where it stands" v={a.detail} />
            <Row k="Next route" v={a.next} />
            {D.institutions.some((x) => x.id === a.inst) && (
              <button type="button" onClick={() => onInst(a.inst)} className="mt-1 text-xs text-brass underline underline-offset-4">
                See the correspondence
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

const MARK: Record<Check["state"], { m: string; c: string; l: string }> = {
  done: { m: "✓", c: "#3fb950", l: "done" },
  open: { m: "○", c: "#ff7b39", l: "open" },
  na: { m: "–", c: "#6f6558", l: "not needed so far" },
  info: { m: "i", c: "#58a6ff", l: "note" },
};
export function OptionsSheet({ instId, onInst }: { instId: string; onInst: (id: string) => void }) {
  const inst = courtInst(instId);
  const openReqs = inst.requests.filter((r) => ["overdue", "ignored", "refused", "partial", "pending", "check"].includes(r.status));
  return (
    <div>
      <p className="text-xs tracking-[0.16em] text-brass uppercase">Options used before court</p>
      <h2 className="mt-1 font-serif text-2xl leading-tight">{inst.name}</h2>
      <InstPicker instId={inst.id} onChange={onInst} />
      <ul className="mt-3 flex flex-col">
        {inst.checklist.map((c) => (
          <li key={c.k} className="flex gap-3 border-t border-line py-2 text-sm">
            <span aria-label={MARK[c.state].l} className="w-5 shrink-0 text-center font-semibold" style={{ color: MARK[c.state].c }}>
              {MARK[c.state].m}
            </span>
            <span className="min-w-0 flex-1">
              <span className="text-fg">{c.k}</span>
              <span className="block text-xs leading-snug text-muted">{c.v}</span>
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-sm text-fg">Still open with {inst.name}: {openReqs.length}</p>
      <ul className="mt-1 flex flex-col">
        {openReqs.slice(0, 20).map((r, i) => (
          <li key={i} className="border-t border-line py-2 text-xs text-muted">
            <span style={{ color: REQ_STATUS[r.status]?.colour }}>{REQ_STATUS[r.status]?.label}</span> · {r.type} ·{" "}
            {fmtDate(r.sent)}
            {r.due ? ` · due ${fmtDate(r.due)}` : ""} · <span className="text-fg">{r.subject}</span>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-[11px] leading-snug text-faint">
        A checklist of steps on the record, not legal advice. Nothing here is a finding of fact or of wrongdoing.
      </p>
    </div>
  );
}
