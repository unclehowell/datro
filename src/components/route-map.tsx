import { useEffect, useMemo, useState } from "react";
import { DetailModal } from "@/components/detail-modal";
import liteJson from "@/data/ladders-lite.json";

/**
 * Route map (v0.4.0): one Donkey Kong ladder per recipient, bottom rung first. Every route the law and the body's own
 * published policies allow, in the order a slow, complete, worst-case process takes them, insisted on whatever the body
 * tells us our options are. Markers: 🌰 old chestnut, 📜 pointed to its own policy, 😮 disclosure, 🛢 obstacle.
 * Server-rendered from /data/ladders-lite.json (works with no JavaScript); details load from /data/ladders.json.
 * WebMCP: dartboard_route(recipient), dartboard_recipients(). — Sion's Tab agent, 2 Nov 2026
 */

type LiteRung = [number, string, string, string, string, string, number, number, number, number, number];
type LiteRec = {
  id: string; name: string; stand: string;
  counts: { chestnut: number; policy: number; disclosure: number; barrels: number };
  next: { t: string; due: string } | null; rungs: LiteRung[];
};
type Lite = { as_of: string; rights: string; recipients: LiteRec[] };
const lite = liteJson as unknown as Lite;

type Rung = {
  n: number; k: string; ph: string; t: string; s: string; st: string; why?: string; law?: string; url?: string; note?: string;
  pol?: string; polurl?: string; date?: string; due?: string; gap?: number; day?: number; cost?: string; late?: number;
  skip?: number; add?: number; cond?: number; said?: number; clock?: string;
};
type Marker = { d: string; k: "chestnut" | "policy" | "disclosure"; n: number; h: string; q?: string; c?: string[]; toc?: string; u?: string };
type Barrel = { d: string | null; n: number; t: string };
type Full = {
  id: string; name: string; short: string; kind: string; regimes: string[]; source: string; stand: string;
  counts: Record<string, number>; first: string | null; last: string | null;
  current: { n: number; t: string; due: string | null; overdue: boolean }[];
  next: { n: number; t: string; law: string; due: string; clock: string; fill?: boolean } | null;
  up: { n: number; t: string; law: string; due: string; clock: string } | null;
  unmentioned: string[]; mentioned: string[]; policies: { t: string; url: string; checked: string }[]; toc: string[];
  rungs: Rung[]; markers: Marker[]; barrels: Barrel[];
};
type Phase = { name: string; clock?: string; kind?: string; trig?: string; who?: string; cite?: string; makes?: string };
type Index = {
  about: string; rights: string; method: string; phases: Record<string, Phase>; keys: Record<string, Partial<Phase>>;
  recipients: { id: string; name: string; short: string; part: number; stand: string; next: Full["next"]; up: Full["up"]; unmentioned: string[] }[];
  parts: string[];
};

const ST: Record<string, { label: string; colour: string }> = {
  done: { label: "Used", colour: "#2e9e57" },
  current: { label: "Waiting on them", colour: "#f0a020" },
  next: { label: "Next rung", colour: "#c4a574" },
  remaining: { label: "Still to climb", colour: "#5a7bd8" },
  na: { label: "Not available here", colour: "#4a505b" },
};
const LATE = "#e5484d";
const CHESTNUT_APP = "https://bucklerfamily.estate/that-old-chestnut/";
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const fmt = (s?: string | null) => (s ? `${+s.slice(8, 10)} ${MON[+s.slice(5, 7) - 1]} ${s.slice(0, 4)}` : "");

/* ---------- data loading (browser only), shared with the WebMCP tools ---------- */
let indexP: Promise<Index> | null = null;
const partP: Record<string, Promise<{ recipients: Full[] }>> = {};
// Same-origin first; the site copy at bucklerfamily.estate/dartboard/ may not carry /data/, so fall back to the Worker itself (CORS open in _headers).
const ORIGINS = ["", "https://dartboard.righteous.workers.dev"];
function getJson<T>(path: string): Promise<T> {
  const q = `${path}?v=0.4.0&d=${lite.as_of}`;
  const one = (o: string) =>
    fetch(`${o}${q}`).then((r) => {
      const ct = r.headers.get("content-type") || "";
      if (!r.ok || !ct.includes("json")) throw new Error(`${o}${path}: ${r.status}`);
      return r.json() as Promise<T>;
    });
  return one(ORIGINS[0]).catch(() => one(ORIGINS[1]));
}
function loadIndex() {
  if (!indexP) indexP = getJson<Index>("/data/ladders.json").catch((e) => { indexP = null; throw e; });
  return indexP;
}
async function loadFull(id: string): Promise<{ idx: Index; rec: Full | null }> {
  const idx = await loadIndex();
  const row = idx.recipients.find((r) => r.id === id);
  if (!row) return { idx, rec: null };
  const path = idx.parts[row.part - 1];
  if (!partP[path]) partP[path] = getJson<{ recipients: Full[] }>(path).catch((e) => { delete partP[path]; throw e; });
  const part = await partP[path];
  return { idx, rec: part.recipients.find((r) => r.id === id) ?? null };
}
function findRecipient(q: string): LiteRec | undefined {
  const s = q.trim().toLowerCase();
  return (
    lite.recipients.find((r) => r.id === s) ??
    lite.recipients.find((r) => r.name.toLowerCase() === s) ??
    lite.recipients.find((r) => r.name.toLowerCase().includes(s) || r.id.includes(s))
  );
}

/* ---------- the ladder drawing (server-rendered from the lite data) ---------- */
const W = 360;
const H = 34;
const TOPPAD = 64;
function LadderSvg({ rec, onPick }: { rec: LiteRec; onPick: (n: number) => void }) {
  const rungs = rec.rungs;
  const N = rungs.length;
  const height = TOPPAD + N * H + 26;
  const y = (n: number) => TOPPAD + (N - n) * H + 18;
  const climber = [...rungs].reverse().find((r) => r[2] === "current") ?? [...rungs].reverse().find((r) => r[2] === "done");
  return (
    <svg viewBox={`0 0 ${W} ${height}`} width="100%" role="img" aria-label={`${rec.name}: ${N} rungs from the first step to full disclosure`} className="block">
      <text x={W / 2} y={20} textAnchor="middle" fontSize="14" fill="#c4a574" fontWeight="600">🏆 Full disclosure</text>
      <text x={14} y={44} fontSize="20" aria-hidden="true">🦍</text>
      <text x={40} y={44} fontSize="10" fill="#a39888">their obstacles roll down: 🛢</text>
      <line x1={8} y1={52} x2={W - 8} y2={52} stroke="#c4a574" strokeWidth="3" />
      {rungs.map((r, i) => {
        const [n, t, st, , due, , ch, po, di, ba, fl] = r;
        const yy = y(n);
        const left = i % 2 === 0;
        const late = (fl & 2) === 2;
        const col = late ? LATE : (ST[st] ?? ST.remaining).colour;
        const y1 = left ? yy - 3 : yy + 3;
        const y2 = left ? yy + 3 : yy - 3;
        const lx = left ? W - 26 : 26;
        const label = `${n}. ${t}`;
        const marks = `${ch ? `🌰${ch > 1 ? ch : ""}` : ""}${po ? ` 📜${po > 1 ? po : ""}` : ""}${di ? ` 😮${di > 1 ? di : ""}` : ""}${ba ? ` 🛢${ba > 1 ? ba : ""}` : ""}`;
        return (
          <a
            key={n}
            href={`#rm-${rec.id}-${n}`}
            onClick={(e) => {
              e.preventDefault();
              onPick(n);
            }}
            aria-label={`Rung ${n}: ${t}. ${(ST[st] ?? ST.remaining).label}${late ? ", overdue" : ""}${due ? `, due ${fmt(due)}` : ""}`}
          >
            {i < N - 1 && (
              <g stroke="#7d6a4c" strokeWidth="2">
                <line x1={lx - 6} y1={yy - H + 4} x2={lx - 6} y2={yy - 2} />
                <line x1={lx + 6} y1={yy - H + 4} x2={lx + 6} y2={yy - 2} />
                <line x1={lx - 6} y1={yy - H / 2} x2={lx + 6} y2={yy - H / 2} />
              </g>
            )}
            <line x1={8} y1={y1} x2={W - 8} y2={y2} stroke={col} strokeWidth={st === "next" ? 7 : 5} strokeLinecap="round" opacity={st === "na" ? 0.45 : 1}>
              {st === "next" && <animate attributeName="opacity" values="1;0.45;1" dur="1.6s" repeatCount="indefinite" />}
            </line>
            <rect x={8} y={yy - H + 8} width={W - 16} height={H - 10} fill="transparent" />
            <text x={14} y={yy - 7} fontSize="11" fill={st === "na" ? "#6f6558" : "#f4efe6"} style={{ textDecoration: st === "na" ? "line-through" : undefined }}>
              {label.length > 40 ? `${label.slice(0, 39)}…` : label}
            </text>
            {(marks || due) && (
              <text x={W - 14} y={yy - 7} fontSize="11" textAnchor="end" fill={late ? LATE : "#c4a574"}>
                {marks}
                {due && st !== "done" ? ` ${due.slice(8, 10)}/${due.slice(5, 7)}` : ""}
              </text>
            )}
            {climber && climber[0] === n && (
              <text x={left ? W / 2 + 40 : W / 2 - 60} y={yy - 6} fontSize="16" aria-hidden="true">🧗</text>
            )}
          </a>
        );
      })}
    </svg>
  );
}

function Chips({ c }: { c: LiteRec["counts"] }) {
  return (
    <p className="flex flex-wrap gap-2 text-xs">
      <span className="rounded-full border border-line px-2 py-0.5">🌰 {c.chestnut} old chestnut{c.chestnut === 1 ? "" : "s"}</span>
      <span className="rounded-full border border-line px-2 py-0.5">📜 {c.policy} policy pointer{c.policy === 1 ? "" : "s"}</span>
      <span className="rounded-full border border-line px-2 py-0.5">😮 {c.disclosure} disclosure{c.disclosure === 1 ? "" : "s"}</span>
      <span className="rounded-full border border-line px-2 py-0.5">🛢 {c.barrels} obstacle{c.barrels === 1 ? "" : "s"}</span>
    </p>
  );
}

function RungList({ rec, full, idx, openN }: { rec: LiteRec; full: Full | null; idx: Index | null; openN?: number }) {
  return (
    <ol className="flex flex-col gap-1 text-sm">
      {rec.rungs.map((r) => {
        const [n, t, st, date, due, law, , , , , fl] = r;
        const fr = full?.rungs.find((x) => x.n === n);
        return (
          <li key={n} id={`rm-${rec.id}-${n}`} value={n}>
            <details open={openN === n} className="rounded-lg border border-line bg-surface px-3 py-2">
              <summary className="cursor-pointer">
                <span className="mr-1 inline-block size-2.5 rounded-full align-middle" style={{ background: (fl & 2) === 2 ? LATE : (ST[st] ?? ST.remaining).colour }} />
                <b>{n}.</b> {t} <span className="text-muted">· {(ST[st] ?? ST.remaining).label}{(fl & 2) === 2 ? ", overdue" : ""}{date ? ` · ${fmt(date)}` : ""}{due && st !== "done" ? ` · due ${fmt(due)}` : ""}{(fl & 1) === 1 ? " · skipped below the climb" : ""}</span>
              </summary>
              <RungDetail rec={rec} n={n} law={law} fr={fr} full={full} idx={idx} />
            </details>
          </li>
        );
      })}
    </ol>
  );
}

function RungDetail({ rec, n, law, fr, full, idx }: { rec: LiteRec; n: number; law: string; fr?: Rung; full: Full | null; idx: Index | null }) {
  const ph = fr && idx ? { ...(idx.phases[fr.ph] ?? {}), ...(idx.keys[fr.k] ?? {}) } : null;
  const marks = full?.markers.filter((m) => m.n === n) ?? [];
  const barrels = full?.barrels.filter((b) => b.n === n) ?? [];
  return (
    <div className="mt-2 flex flex-col gap-1.5 text-sm leading-relaxed">
      {fr?.why && <p><b>Why this rung exists.</b> {fr.why}</p>}
      <p>
        <b>Law:</b> {fr?.url ? <a className="text-brass underline" href={fr.url} target="_blank" rel="noreferrer">{fr.law || law}</a> : fr?.law || law || "—"}
      </p>
      {ph && (
        <>
          {(fr?.clock || ph.clock) && <p><b>Clock:</b> {fr?.clock || ph.clock}</p>}
          {ph.who && <p><b>Who decides:</b> {ph.who}</p>}
          {ph.trig && <p><b>Climb on when:</b> {ph.trig}</p>}
          {ph.cite && <p><b>Cite:</b> {ph.cite}</p>}
          {ph.makes && <p><b>Evidence it leaves:</b> {ph.makes}</p>}
        </>
      )}
      {fr?.polurl && (
        <p><b>Their policy:</b> <a className="text-brass underline" href={fr.polurl} target="_blank" rel="noreferrer">{fr.pol || "published policy"}</a></p>
      )}
      {fr?.said === 0 && <p className="text-xs text-muted">Their replies have never mentioned this route.</p>}
      {fr?.cond === 1 && <p className="text-xs text-muted">Used only on evidence that a requested record was altered or hidden after the request.</p>}
      {fr?.day !== undefined && <p className="text-xs text-muted">Day {fr.day} of this body's ladder{fr.gap !== undefined ? `, ${fr.gap} days after the step before it` : ""}.</p>}
      {fr?.note && <p className="text-xs text-muted">{fr.note}</p>}
      {marks.map((m, i) => (
        <p key={i} className="rounded-md bg-surface-2 px-2 py-1">
          {m.k === "chestnut" ? "🌰" : m.k === "policy" ? "📜" : "😮"} <span className="text-muted">{fmt(m.d)}{m.c ? ` · ${m.c.join(", ")}` : ""}</span>
          {m.q ? <> “{m.q}”</> : <> {m.h}</>}
          {m.toc && <> <a className="text-brass underline" href={`${CHESTNUT_APP}#cn-${m.toc}`}>details</a></>}
          {m.u && <> · <a className="text-brass underline" href={m.u} target="_blank" rel="noreferrer">email</a></>}
        </p>
      ))}
      {barrels.map((b, i) => (
        <p key={`b${i}`} className="text-xs">🛢 {b.d ? `${fmt(b.d)} · ` : ""}{b.t}</p>
      ))}
      {!full && <p className="text-xs text-faint">Full detail: /data/ladders.json · recipient “{rec.id}”.</p>}
    </div>
  );
}

/* ---------- WebMCP ---------- */
type ToolCtx = { registerTool: (t: unknown) => unknown };
function registerTools() {
  if (typeof window === "undefined") return;
  const w = window as unknown as { __dartboardMCP?: unknown };
  if (w.__dartboardMCP) return;
  const route = async (args: { recipient?: string }) => {
    const hit = findRecipient(String(args?.recipient ?? ""));
    if (!hit) return { error: "Unknown recipient", recipients: lite.recipients.map((r) => ({ id: r.id, name: r.name })) };
    const { idx, rec } = await loadFull(hit.id);
    return { rights: idx.rights, about: idx.about, phases: idx.phases, keys: idx.keys, recipient: rec };
  };
  const list = async () => ({
    as_of: lite.as_of,
    rights: lite.rights,
    recipients: lite.recipients.map((r) => ({ id: r.id, name: r.name, stand: r.stand, counts: r.counts, next: r.next })),
  });
  const tools = [
    {
      name: "dartboard_route",
      description: "The Disclosure Dartboard route map for one recipient: every disclosure route in worst-case order (bottom rung first), each rung's status, dates, statutory clock, legal basis and the body's own policy, plus old-chestnut, policy-pointer and disclosure markers from the correspondence.",
      inputSchema: { type: "object", properties: { recipient: { type: "string", description: "Recipient id (e.g. hmlr, vale, swp, cadw, museum, moj) or part of its name" } }, required: ["recipient"] },
      annotations: { readOnlyHint: true },
      execute: route,
    },
    {
      name: "dartboard_recipients",
      description: "List every recipient on the Disclosure Dartboard with where it stands and its next rung.",
      inputSchema: { type: "object", properties: {} },
      annotations: { readOnlyHint: true },
      execute: list,
    },
  ];
  const d = document as unknown as { modelContext?: ToolCtx };
  const n = navigator as unknown as { modelContext?: ToolCtx };
  const ctx = d.modelContext?.registerTool ? d.modelContext : n.modelContext?.registerTool ? n.modelContext : null;
  const registered: string[] = [];
  if (ctx) for (const t of tools) { try { ctx.registerTool(t); registered.push(t.name); } catch { /* already registered */ } }
  w.__dartboardMCP = { available: !!ctx, registered, tools: tools.map((t) => t.name), run: (name: string, args: { recipient?: string }) => (name === "dartboard_route" ? route(args) : list()), data: "/data/ladders.json" };
}

/* ---------- the panel ---------- */
export function RouteMap({ instId, onInstChange }: { instId: string; onInstChange?: (id: string) => void }) {
  const [id, setId] = useState(() => (lite.recipients.some((r) => r.id === instId) ? instId : lite.recipients[0].id));
  const [full, setFull] = useState<Full | null>(null);
  const [idx, setIdx] = useState<Index | null>(null);
  const [pick, setPick] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (lite.recipients.some((r) => r.id === instId)) setId(instId);
  }, [instId]);
  useEffect(() => {
    registerTools();
  }, []);
  useEffect(() => {
    let live = true;
    setFull(null);
    loadFull(id)
      .then(({ idx: i, rec }) => {
        if (!live) return;
        setIdx(i);
        setFull(rec);
        setFailed(false);
      })
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, [id]);
  const rec = useMemo(() => lite.recipients.find((r) => r.id === id) ?? lite.recipients[0], [id]);
  const pr = pick !== null ? rec.rungs.find((r) => r[0] === pick) : undefined;
  const fr = pick !== null ? full?.rungs.find((r) => r.n === pick) : undefined;

  return (
    <section aria-label="Route map per recipient" className="flex flex-col gap-3">
      <div className="rounded-xl border border-brass/60 bg-surface px-3 py-2 text-xs leading-relaxed">
        <b className="text-brass">Rights reserved.</b> {lite.rights}
      </div>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-muted">Recipient ({lite.recipients.length})</span>
        <select
          value={id}
          onChange={(e) => {
            setId(e.target.value);
            setPick(null);
            onInstChange?.(e.target.value);
          }}
          className="h-11 rounded-xl border border-line bg-surface px-3 text-base text-fg"
        >
          {lite.recipients.map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
      </label>
      <div className="flex flex-col gap-2">
        <h2 className="font-serif text-xl leading-tight">{rec.name}</h2>
        <p className="text-sm text-muted">{rec.stand}</p>
        <Chips c={rec.counts} />
        {full?.next && (
          <p className="text-sm">
            <b>Next rung:</b> {full.next.t}{full.next.fill ? " (skipped lower down; can be done now)" : ""} · {full.next.law}{full.next.due ? ` · by ${fmt(full.next.due)}` : ""}
          </p>
        )}
        {full?.up && full.up.n !== full.next?.n && (
          <p className="text-sm"><b>Next step up:</b> {full.up.t} · {full.up.law}{full.up.due ? ` · from ${fmt(full.up.due)}` : ""}</p>
        )}
        {full && full.unmentioned.length > 0 && (
          <p className="text-sm"><b>Routes their replies never mention:</b> {full.unmentioned.join("; ")}.</p>
        )}
        {full && full.policies.length > 0 && (
          <ul className="list-disc pl-5 text-xs text-muted">
            {full.policies.map((p) => (
              <li key={p.url}><a className="text-brass underline" href={p.url} target="_blank" rel="noreferrer">{p.t}</a> (read {fmt(p.checked)})</li>
            ))}
          </ul>
        )}
        {full && full.toc.length > 0 && (
          <p className="text-xs"><a className="text-brass underline" href={CHESTNUT_APP}>🌰 This body's old chestnuts in That Old Chestnut</a> ({full.toc.join(", ")})</p>
        )}
      </div>
      <div className="rounded-2xl border border-line bg-[#14110e] p-1">
        <LadderSvg rec={rec} onPick={(n) => setPick(n)} />
      </div>
      <p className="text-xs text-muted">
        Bottom rung first. Colours: <span style={{ color: ST.done.colour }}>used</span>, <span style={{ color: ST.current.colour }}>waiting on them</span>, <span style={{ color: LATE }}>overdue</span>, <span style={{ color: ST.next.colour }}>next</span>, <span style={{ color: ST.remaining.colour }}>still to climb</span>. 🌰 old chestnut · 📜 pointed to its own policy · 😮 disclosure · 🛢 obstacle (exemption, fee, delay) · 🧗 where the climb stands. Tap a rung.
      </p>
      {failed && <p className="text-xs text-muted">The detail file did not load; the list below still shows every rung. Data: /data/ladders.json</p>}
      <RungList rec={rec} full={full} idx={idx} />
      <noscript>
        <div className="flex flex-col gap-3 text-sm">
          <p>Every recipient, bottom rung first (status · date · law):</p>
          {lite.recipients.map((r) => (
            <section key={r.id} aria-label={r.name}>
              <h3 className="font-semibold">{r.name}</h3>
              <p className="text-muted">{r.stand}</p>
              <ol>
                {r.rungs.map((g) => (
                  <li key={g[0]} value={g[0]}>{g[1]} · {(ST[g[2]] ?? ST.remaining).label}{g[3] ? ` · ${g[3]}` : ""}{g[4] && g[2] !== "done" ? ` · due ${g[4]}` : ""}{g[5] ? ` · ${g[5]}` : ""}</li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      </noscript>
      <DetailModal open={pick !== null} onClose={() => setPick(null)} accent={pr ? ((pr[10] & 2) === 2 ? LATE : (ST[pr[2]] ?? ST.remaining).colour) : undefined}>
        {pr && (
          <div className="flex flex-col gap-2">
            <p className="text-xs tracking-wide text-muted uppercase">{rec.name} · rung {pr[0]} of {rec.rungs.length} · {(ST[pr[2]] ?? ST.remaining).label}</p>
            <h2 className="font-serif text-2xl leading-tight">{pr[1]}</h2>
            <p className="text-sm text-muted">{pr[3] ? `Used ${fmt(pr[3])}` : ""}{pr[4] && pr[2] !== "done" ? ` · due ${fmt(pr[4])}` : ""}</p>
            <RungDetail rec={rec} n={pr[0]} law={pr[5]} fr={fr} full={full} idx={idx} />
          </div>
        )}
      </DetailModal>
    </section>
  );
}
