import { useEffect, useMemo, useState } from "react";
import { DetailModal } from "@/components/detail-modal";
import boardBundled from "@/data/snl-board.json";
import playBundled from "@/data/snl-play.json";
import { avenueEmails, corrExtras, emailUrl, extraIndex, institutions, type AvInstitution } from "@/data/avenues";
import corrJson from "@/data/correspondence.json";

/**
 * Snakes & Ladders: the disclosure path as a game board, under the dartboard. 36 squares follow the real
 * escalation route (request → deadline → internal review → ICO → tribunal; SAR → ICO; complaint → ombudsman;
 * pre-action letter → CPR 31.16 / 31.17 disclosure → court; then the trigger-event SOP to the reopening).
 * Ladders are procedural shortcuts and snakes procedural setbacks, each named by the law.
 *
 * THE BOARD IS FIXED: rules only, identical before anyone plays (/data/snl-board.json, ghf-snl-board/1). Every
 * ladder looks alike, every snake looks alike, and tapping one shows only its rule.
 * GAMEPLAY IS A SEPARATE LAYER, one correspondent at a time: the dropdown above the board lists the dartboard's
 * institutions by their wheel number ("3 · Llandough Community Council"). Nothing is chosen by default (fixed board
 * only). A choice puts that institution's counter(s) on the board and lists its ladders climbed, snakes hit and its
 * emails to and from the family under the board (/data/snl-play.json, ghf-snl-play/1; token.dart = wheel slice ids).
 * Never everyone at once (owner rule, 22 Oct 2026). Shareable as ?r=<wheel number>.
 * Both built by work/roadmap/build_snakes_ladders.py. — Sion's Tab agent, 22 Oct 2026
 */

type Square = { n: number; label: string; short: string; law: string; url: string | null; tier: string };
type Rule = { id: string; from: number; to: number; label: string; law: string; effect: string };
type Token = {
  lane: string; name: string; short: string; square: number; why: string; kind: string; regime: string | null;
  ref: string; title: string; url: string | null; next: { date: string | null; what: string; url: string | null } | null;
  missed: number; route: string | null; dart?: string[];
};
type Move = { kind: "ladder" | "snake"; id: string; lane: string | null; name: string | null; date: string | null; ref: string; what: string | null; url: string | null; ev?: string | null };
type Board = {
  schema: string; cols: number; squares: Square[]; ladders: Rule[]; snakes: Rule[];
  tiers: { id: string; label: string; from: number; to: number }[];
  totals: { squares: number; ladders: number; snakes: number };
};
type Play = {
  schema: string; as_of: string; tokens: Token[]; history: Move[];
  totals: { tokens: number; on_start: number; ladders_climbed: number; snakes_hit: number; moves: number };
};

const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const fmt = (s: string | null | undefined) => (s ? `${+s.slice(8, 10)} ${MON[+s.slice(5, 7) - 1]} ${s.slice(0, 4)}` : "—");
const CELL = 60;
const COLS = 6;
const ROWS = 6;
const W = CELL * COLS;
const GOLD = "#ffd34d"; // the final square only
/** Every ladder looks alike and every snake looks alike: the board is fixed, before anyone plays. */
const LADDER = "#c9a86a";
const SNAKE = "#6f9a5a";
const TIER: Record<string, string> = {
  request: "#c4a574", review: "#e07a2f", regulator: "#5a7bd8", tribunal: "#9b6bd8", court: "#c23b32", reopen: "#2e9e57",
};

/** Square n (1..36) → top-left corner; row 0 is the bottom row, rows snake left→right then right→left. */
function pos(n: number) {
  const row = Math.floor((n - 1) / COLS);
  const k = (n - 1) % COLS;
  const col = row % 2 === 0 ? k : COLS - 1 - k;
  return { x: col * CELL, y: (ROWS - 1 - row) * CELL };
}
const centre = (n: number) => {
  const p = pos(n);
  return { x: p.x + CELL / 2, y: p.y + CELL / 2 + 3 };
};

function wrap(s: string, max = 13) {
  const words = s.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().length > max && cur) {
      lines.push(cur);
      cur = w;
    } else cur = (cur + " " + w).trim();
  }
  if (cur) lines.push(cur);
  return lines.slice(0, 2);
}

function LadderShape({ j, onPick }: { j: Rule; onPick: () => void }) {
  const a = centre(j.from);
  const b = centre(j.to);
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy);
  const nx = (-dy / len) * 5;
  const ny = (dx / len) * 5;
  const col = LADDER;
  const op = 0.92;
  const rungs = Math.max(2, Math.floor(len / 10));
  return (
    <g onClick={onPick} style={{ cursor: "pointer" }} opacity={op}>
      <line x1={a.x + nx} y1={a.y + ny} x2={b.x + nx} y2={b.y + ny} stroke="#14110e" strokeWidth="3.6" strokeLinecap="round" opacity="0.6" />
      <line x1={a.x - nx} y1={a.y - ny} x2={b.x - nx} y2={b.y - ny} stroke="#14110e" strokeWidth="3.6" strokeLinecap="round" opacity="0.6" />
      {Array.from({ length: rungs - 1 }, (_, i) => {
        const t = (i + 1) / rungs;
        const x = a.x + dx * t;
        const y = a.y + dy * t;
        return <line key={i} x1={x + nx} y1={y + ny} x2={x - nx} y2={y - ny} stroke={col} strokeWidth="1.3" />;
      })}
      <line x1={a.x + nx} y1={a.y + ny} x2={b.x + nx} y2={b.y + ny} stroke={col} strokeWidth="1.8" strokeLinecap="round" />
      <line x1={a.x - nx} y1={a.y - ny} x2={b.x - nx} y2={b.y - ny} stroke={col} strokeWidth="1.8" strokeLinecap="round" />
      <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="transparent" strokeWidth="16" pointerEvents="stroke" />
    </g>
  );
}

function SnakeShape({ j, onPick }: { j: Rule; onPick: () => void }) {
  const h = centre(j.from);
  const t = centre(j.to);
  const dx = t.x - h.x;
  const dy = t.y - h.y;
  const len = Math.hypot(dx, dy);
  const nx = -dy / len;
  const ny = dx / len;
  const amp = Math.min(14, 6 + len / 18);
  const waves = Math.max(1, Math.round(len / 55));
  let d = `M${h.x.toFixed(1)} ${h.y.toFixed(1)}`;
  const seg = 2 * waves;
  for (let i = 0; i < seg; i++) {
    const t0 = i / seg;
    const t1 = (i + 1) / seg;
    const s = i % 2 ? -1 : 1;
    const c1x = h.x + dx * (t0 + 0.33 / seg) + nx * amp * s;
    const c1y = h.y + dy * (t0 + 0.33 / seg) + ny * amp * s;
    const c2x = h.x + dx * (t1 - 0.33 / seg) + nx * amp * s;
    const c2y = h.y + dy * (t1 - 0.33 / seg) + ny * amp * s;
    d += ` C${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${(h.x + dx * t1).toFixed(1)} ${(h.y + dy * t1).toFixed(1)}`;
  }
  const col = SNAKE;
  const op = 0.92;
  const ux = dx / len;
  const uy = dy / len;
  return (
    <g onClick={onPick} style={{ cursor: "pointer" }} opacity={op}>
      <path d={d} fill="none" stroke="#14110e" strokeWidth="7" strokeLinecap="round" opacity="0.55" />
      <path d={d} fill="none" stroke={col} strokeWidth="4.2" strokeLinecap="round" />
      <path d={d} fill="none" stroke="#14110e" strokeWidth="1" strokeDasharray="1.5 4" strokeLinecap="round" opacity="0.5" />
      <ellipse cx={h.x} cy={h.y} rx="5.4" ry="4.4" fill={col} stroke="#14110e" strokeWidth="1" transform={`rotate(${(Math.atan2(uy, ux) * 180) / Math.PI} ${h.x} ${h.y})`} />
      <circle cx={h.x - ux * 2 + nx * 1.8} cy={h.y - uy * 2 + ny * 1.8} r="0.9" fill="#14110e" />
      <circle cx={h.x - ux * 2 - nx * 1.8} cy={h.y - uy * 2 - ny * 1.8} r="0.9" fill="#14110e" />
      <path d={d} fill="none" stroke="transparent" strokeWidth="16" pointerEvents="stroke" />
    </g>
  );
}

type Sheet =
  | { kind: "square"; n: number }
  | { kind: "token"; lane: string }
  | { kind: "jump"; id: string; snake: boolean };

function useJson<T>(url: string, schema: string, initial: T) {
  const [v, setV] = useState<T>(initial);
  useEffect(() => {
    let live = true;
    fetch(`${url}?d=${new Date().toISOString().slice(0, 10)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (live && j && j.schema === schema) setV(j as T);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [url, schema]);
  return v;
}

export function SnakesLadders({ pick, onPick }: { pick: string; onPick: (id: string) => void }) {
  const board = useJson<Board>("/data/snl-board.json", "ghf-snl-board/1", boardBundled as unknown as Board);
  const play = useJson<Play>("/data/snl-play.json", "ghf-snl-play/1", playBundled as unknown as Play);
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const inst = useMemo(() => institutions.find((i) => i.id === pick) ?? null, [pick]);
  const num = inst ? institutions.indexOf(inst) + 1 : 0;
  /** Only the chosen correspondent's counters; none until one is chosen. */
  const sel = useMemo(() => (pick ? play.tokens.filter((t) => (t.dart ?? []).includes(pick)) : []), [play, pick]);
  const playOn = sel.length > 0;

  useEffect(() => {
    const r = Number(new URLSearchParams(window.location.search).get("r"));
    if (Number.isInteger(r) && r >= 1 && r <= institutions.length) onPick(institutions[r - 1].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    const u = new URL(window.location.href);
    if (num) u.searchParams.set("r", String(num));
    else if (!pick) u.searchParams.delete("r");
    if (u.href !== window.location.href) window.history.replaceState(window.history.state, "", u.href);
  }, [num, pick]);

  const byLane = useMemo(() => new Map(play.tokens.map((t) => [t.lane, t])), [play]);
  const bySquare = useMemo(() => {
    const m = new Map<number, Token[]>();
    for (const t of sel) m.set(t.square, [...(m.get(t.square) ?? []), t]);
    return m;
  }, [sel]);
  const ruleOf = useMemo(() => new Map([...board.ladders, ...board.snakes].map((r) => [r.id, r])), [board]);
  const start = bySquare.get(0) ?? [];
  const startRows = Math.ceil(start.length / 8) || 1;
  const START_H = start.length ? 22 + startRows * 15 : 0;
  const H = CELL * ROWS + START_H;

  return (
    <section id="snakes-ladders" aria-label="Snakes and ladders" className="rounded-[var(--radius-card)] border border-line bg-surface p-2">
      <div className="flex items-baseline justify-between px-1 pt-1">
        <h2 className="font-serif text-xl leading-tight text-fg">Snakes &amp; Ladders</h2>
        <button type="button" onClick={() => setSheet({ kind: "square", n: -1 })} className="text-xs text-brass underline underline-offset-2">
          How to read
        </button>
      </div>
      <label className="sr-only" htmlFor="snl-pick">
        Correspondent
      </label>
      <select
        id="snl-pick"
        value={pick}
        onChange={(event) => onPick(event.target.value)}
        className="mt-2 h-11 w-full min-w-0 rounded-xl border border-line bg-surface-2 px-3 text-base text-fg"
      >
        <option value="">Choose a correspondent</option>
        {institutions.map((i, k) => (
          <option key={i.id} value={i.id}>
            {`${k + 1} · ${i.name}`}
          </option>
        ))}
      </select>
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-2 block w-full touch-manipulation select-none" role="img" aria-label={playOn ? `Snakes and ladders board with the counter of ${inst?.name ?? ""}` : "Snakes and ladders board of the disclosure path"}>
        {board.squares.map((s) => {
          const p = pos(s.n);
          const row = Math.floor((s.n - 1) / COLS);
          const dark = (row + ((s.n - 1) % COLS)) % 2 === 0;
          const fin = s.n === board.squares.length;
          return (
            <g key={s.n} onClick={() => setSheet({ kind: "square", n: s.n })} style={{ cursor: "pointer" }}>
              <rect x={p.x + 0.5} y={p.y + 0.5} width={CELL - 1} height={CELL - 1} rx="3" fill={fin ? "#3a2f1c" : dark ? "#2b241d" : "#3b3127"} stroke={fin ? GOLD : "none"} strokeWidth={fin ? 1.2 : 0} />
              <rect x={p.x + 0.5} y={p.y + 0.5} width={CELL - 1} height="2.4" rx="1" fill={TIER[s.tier] ?? "#c4a574"} opacity="0.75" />
            </g>
          );
        })}
        {board.ladders.map((j) => (
          <LadderShape key={j.id} j={j} onPick={() => setSheet({ kind: "jump", id: j.id, snake: false })} />
        ))}
        {board.snakes.map((j) => (
          <SnakeShape key={j.id} j={j} onPick={() => setSheet({ kind: "jump", id: j.id, snake: true })} />
        ))}
        {board.squares.map((s) => {
          const p = pos(s.n);
          const lines = wrap(s.short);
          return (
            <g key={`l-${s.n}`} pointerEvents="none" fontFamily="Outfit, system-ui, sans-serif" stroke="#1b1612" strokeWidth="2.2" paintOrder="stroke" strokeLinejoin="round">
              <text x={p.x + 4} y={p.y + 12} fontSize="9.5" fontWeight="700" fill="#f4efe6">
                {s.n}
              </text>
              {lines.map((l, i) => (
                <text key={i} x={p.x + CELL / 2} y={p.y + CELL - 5 - (lines.length - 1 - i) * 8} textAnchor="middle" fontSize="7" fill="#b3a898">
                  {l}
                </text>
              ))}
            </g>
          );
        })}
        {playOn &&
          board.squares.map((s) => {
            const list = bySquare.get(s.n);
            if (!list?.length) return null;
            const p = pos(s.n);
            const shown = list.length > 4 ? list.slice(0, 3) : list;
            const more = list.length - shown.length;
            const items: { key: string; label: string; onClick: () => void; more?: boolean }[] = shown.map((t) => ({
              key: t.lane,
              label: t.short,
              onClick: () => setSheet({ kind: "token", lane: t.lane }),
            }));
            if (more > 0) items.push({ key: "more", label: `+${more}`, more: true, onClick: () => setSheet({ kind: "square", n: s.n }) });
            return (
              <g key={`t-${s.n}`}>
                {items.map((it, i) => {
                  const x = p.x + 3 + (i % 2) * 27.5;
                  const y = p.y + 16 + Math.floor(i / 2) * 13;
                  return (
                    <g
                      key={it.key}
                      onClick={(e) => {
                        e.stopPropagation();
                        it.onClick();
                      }}
                      style={{ cursor: "pointer" }}
                    >
                      <rect x={x} y={y} width="26" height="11" rx="5.5" fill={it.more ? "#14110e" : "#f4efe6"} stroke={it.more ? "#c4a574" : "#14110e"} strokeWidth="0.8" />
                      <text x={x + 13} y={y + 5.9} textAnchor="middle" dominantBaseline="central" fontFamily="Outfit, system-ui, sans-serif" fontSize={it.label.length > 6 ? 4.6 : it.label.length > 5 ? 5.1 : it.label.length > 4 ? 5.9 : 6.6} fontWeight="700" fill={it.more ? "#c4a574" : "#14110e"}>
                        {it.label}
                      </text>
                    </g>
                  );
                })}
              </g>
            );
          })}
        {start.length > 0 && (
          <g onClick={() => setSheet({ kind: "square", n: 0 })} style={{ cursor: "pointer" }}>
            <rect x="0.5" y={CELL * ROWS + 4} width={W - 1} height={START_H - 4.5} rx="4" fill="#1b1612" stroke="#3a3228" />
            <text x="6" y={CELL * ROWS + 15} fontFamily="Outfit, system-ui, sans-serif" fontSize="8" fontWeight="700" fill="#c4a574" letterSpacing="0.8">
              START · NO CLOCK YET
            </text>
          </g>
        )}
        {start.length > 0 &&
          start.map((t, i) => {
            const x = 4 + (i % 8) * 44;
            const y = CELL * ROWS + 20 + Math.floor(i / 8) * 15;
            return (
              <g key={t.lane} onClick={() => setSheet({ kind: "token", lane: t.lane })} style={{ cursor: "pointer" }}>
                <rect x={x} y={y} width="41" height="12" rx="6" fill="#f4efe6" opacity="0.85" />
                <text x={x + 20.5} y={y + 6.4} textAnchor="middle" dominantBaseline="central" fontFamily="Outfit, system-ui, sans-serif" fontSize="6.6" fontWeight="700" fill="#14110e">
                  {t.short}
                </text>
              </g>
            );
          })}
      </svg>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 px-1">
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted">
          <span className="flex items-center gap-1">
            <span className="inline-block h-[3px] w-4 rounded" style={{ background: LADDER }} /> {board.totals.ladders} ladders
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-[3px] w-4 rounded" style={{ background: SNAKE }} /> {board.totals.snakes} snakes
          </span>
          <span>{board.totals.squares} squares</span>
        </p>
      </div>
      {inst && <PickPanel key={inst.id} board={board} play={play} inst={inst} num={num} tokens={sel} ruleOf={ruleOf} onToken={(lane) => setSheet({ kind: "token", lane })} />}

      <DetailModal open={sheet !== null} onClose={() => setSheet(null)} accent={sheet?.kind === "jump" ? (sheet.snake ? SNAKE : LADDER) : undefined}>
        {sheet?.kind === "square" && sheet.n === -1 && <HowTo board={board} />}
        {sheet?.kind === "square" && sheet.n >= 0 && (
          <SquareSheet board={board} n={sheet.n} tokens={playOn ? bySquare.get(sheet.n) ?? [] : null} onToken={(lane) => setSheet({ kind: "token", lane })} onJump={(id, snake) => setSheet({ kind: "jump", id, snake })} />
        )}
        {sheet?.kind === "token" && byLane.get(sheet.lane) && (
          <TokenSheet board={board} play={play} t={byLane.get(sheet.lane)!} ruleOf={ruleOf} onJump={(id, snake) => setSheet({ kind: "jump", id, snake })} />
        )}
        {sheet?.kind === "jump" && ruleOf.get(sheet.id) && <JumpSheet board={board} j={ruleOf.get(sheet.id)!} snake={sheet.snake} />}
      </DetailModal>
    </section>
  );
}

const sqName = (board: Board, n: number) => (n === 0 ? "Start" : `${n} · ${board.squares.find((s) => s.n === n)?.label ?? ""}`);

function MoveLine({ m, r, showName, onToken }: { m: Move; r: Rule | undefined; showName?: boolean; onToken?: (lane: string) => void }) {
  const snake = m.kind === "snake";
  return (
    <li className="text-sm leading-snug">
      <span style={{ color: snake ? SNAKE : LADDER }}>{snake ? "🐍 Snake hit" : "🪜 Ladder climbed"}</span>
      <span className="text-fg">: {r?.label ?? m.id}</span>
      {r && (
        <span className="text-faint">
          {" "}
          ({r.from} → {r.to})
        </span>
      )}
      {showName && m.name && (
        <span className="block">
          {m.lane && onToken ? (
            <button type="button" onClick={() => onToken(m.lane!)} className="text-fg underline underline-offset-2">
              {m.name}
            </button>
          ) : (
            <span className="text-fg">{m.name}</span>
          )}
        </span>
      )}
      <span className="block text-faint">
        {fmt(m.date)}
        {m.ref ? ` · ref ${m.ref}` : ""}
        {m.ev ? ` · ${m.ev}` : ""}
      </span>
      {m.what && <span className="block text-muted">{m.what}</span>}
      {m.url && (
        <a href={m.url} target="_blank" rel="noreferrer" className="text-xs text-brass underline underline-offset-2">
          Source
        </a>
      )}
    </li>
  );
}

type MailRow = { id: string; d: string; out: boolean; s: string; u: string | null };
type Mail = { schema: string; lanes: Record<string, MailRow[]> };

/** Gmail message id of each dartboard email (index into avenueEmails), so the two lists merge without repeats. */
const gmOf: Record<number, string> = (() => {
  const m: Record<number, string> = {};
  for (const [k, v] of Object.entries((corrJson as unknown as { emails: Record<string, { gm?: string }> }).emails)) if (v.gm) m[+k] = v.gm;
  for (const x of corrExtras) if (x.gm) m[extraIndex[x.id]] = x.gm;
  return m;
})();

/** The per-lane mail list, fetched only once a correspondent is chosen. */
function useMail(on: boolean) {
  const [mail, setMail] = useState<Mail | null>(null);
  useEffect(() => {
    if (!on || mail) return;
    let live = true;
    fetch(`/data/snl-mail.json?d=${new Date().toISOString().slice(0, 10)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (live && j && j.schema === "ghf-snl-mail/1") setMail(j as Mail);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [on, mail]);
  return mail;
}

const DIR_TO = "#c4a574";
const DIR_FROM = "#7fb3d5";

/** Emails of one dartboard institution, newest first: every dartboard email tagged with it or on its ramp, plus the
 *  Gmail manifest's messages for its counters' lanes (the same message is listed once). */
function instEmails(inst: AvInstitution, lanes: string[], mail: Mail | null): MailRow[] {
  const idx = new Set<number>();
  avenueEmails.forEach((e, i) => {
    if (e.i.includes(inst.id)) idx.add(i);
  });
  for (const l of inst.levels) for (const i of l.items) idx.add(i);
  const rows: MailRow[] = [];
  const seen = new Set<string>();
  for (const i of idx) {
    const id = gmOf[i] ?? `a${i}`;
    if (seen.has(id)) continue;
    seen.add(id);
    rows.push({ id, d: avenueEmails[i].d, out: avenueEmails[i].out, s: avenueEmails[i].s, u: emailUrl(i).url });
  }
  for (const lane of lanes) for (const r of mail?.lanes[lane] ?? []) if (!seen.has(r.id)) { seen.add(r.id); rows.push(r); }
  return rows.sort((a, b) => b.d.localeCompare(a.d) || (a.out === b.out ? 0 : a.out ? 1 : -1));
}

/** One correspondent: its counter(s), its ladders and snakes, and its emails to and from the family. */
function PickPanel({ board, play, inst, num, tokens, ruleOf, onToken }: { board: Board; play: Play; inst: AvInstitution; num: number; tokens: Token[]; ruleOf: Map<string, Rule>; onToken: (lane: string) => void }) {
  const lanes = new Set(tokens.map((t) => t.lane));
  const moves = play.history.filter((h) => h.lane && lanes.has(h.lane));
  const mail = useMail(true);
  const laneKey = tokens.map((t) => t.lane).join("|");
  const emails = useMemo(() => instEmails(inst, laneKey ? laneKey.split("|") : [], mail), [inst, laneKey, mail]);
  const sent = emails.filter((e) => e.out).length;
  const [all, setAll] = useState(false);
  const shown = all ? emails : emails.slice(0, 10);
  return (
    <div className="mt-3 border-t border-line px-1 pt-3" data-snl-pick={num}>
      <h3 className="font-serif text-lg leading-tight text-fg">
        {num} · {inst.name}
      </h3>
      <ul className="mt-2 flex flex-col gap-1.5">
        {tokens.map((t) => (
          <li key={t.lane}>
            <button type="button" onClick={() => onToken(t.lane)} className="w-full rounded-lg border border-line bg-surface-2 px-2.5 py-1.5 text-left text-sm">
              <span className="text-fg">{tokens.length > 1 ? `${t.name}: ` : "Counter: "}</span>
              <span className="text-brass">{sqName(board, t.square)}</span>
              <span className="block text-xs text-muted first-letter:uppercase">{t.why}</span>
            </button>
          </li>
        ))}
        {!tokens.length && <li className="text-sm text-faint">No counter on the board yet.</li>}
      </ul>
      {moves.length > 0 && (
        <details open className="mt-2 rounded-lg border border-line bg-surface-2 px-2.5 py-1.5">
          <summary className="cursor-pointer text-sm text-fg">
            Moves · {moves.filter((m) => m.kind === "ladder").length ? `🪜 ${moves.filter((m) => m.kind === "ladder").length} ` : ""}
            {moves.filter((m) => m.kind === "snake").length ? `🐍 ${moves.filter((m) => m.kind === "snake").length}` : ""}
          </summary>
          <ul className="mt-2 flex flex-col gap-2 pb-1">
            {moves.map((m, i) => (
              <MoveLine key={i} m={m} r={ruleOf.get(m.id)} showName={tokens.length > 1} />
            ))}
          </ul>
        </details>
      )}
      <details open className="mt-2 rounded-lg border border-line bg-surface-2 px-2.5 py-1.5">
        <summary className="cursor-pointer text-sm text-fg">
          Emails to and from the family · {emails.length}
          <span className="text-faint">
            {" "}
            ({sent} sent · {emails.length - sent} received)
          </span>
        </summary>
        <ul className="mt-2 flex flex-col divide-y divide-line pb-1">
          {shown.map((e) => {
            const link = e.u ?? undefined;
            return (
              <li key={e.id} className="py-1.5 text-sm leading-snug">
                <span className="text-xs text-faint">{fmt(e.d)}</span>
                <span className="ml-2 text-xs font-semibold" style={{ color: e.out ? DIR_TO : DIR_FROM }}>
                  {e.out ? "→ To them" : "← From them"}
                </span>
                <a href={link} target="_blank" rel="noreferrer" className="block text-fg underline decoration-line underline-offset-2">
                  {e.s || "(no subject)"}
                </a>
              </li>
            );
          })}
          {!emails.length && <li className="py-1.5 text-sm text-faint">No emails on the record yet.</li>}
        </ul>
        {emails.length > shown.length && (
          <button type="button" onClick={() => setAll(true)} className="mb-1 text-sm text-brass underline underline-offset-2">
            Show all {emails.length}
          </button>
        )}
      </details>
    </div>
  );
}

function HowTo({ board }: { board: Board }) {
  return (
    <div>
      <h2 className="font-serif text-2xl">Snakes &amp; Ladders</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        The path to disclosure, square by square from a first request (bottom left) to the case reopened (top). The board
        is fixed: the same squares, ladders and snakes before anyone plays. Ladders are lawful shortcuts; snakes are
        procedural setbacks. Tap any square, ladder or snake for its rule. Choose a correspondent above the board (the number is
        its slice on the dartboard) to see its counter on the square it has reached, its ladders climbed and snakes hit,
        and its emails to and from the family. One correspondent at a time.
      </p>
      <div className="mt-3 flex flex-col gap-1.5 text-sm">
        {board.tiers.map((t) => (
          <p key={t.id} className="flex items-center gap-2 text-muted">
            <span className="inline-block h-1.5 w-5 rounded" style={{ background: TIER[t.id] }} />
            {t.from}–{t.to} · {t.label}
          </p>
        ))}
      </div>
      <p className="mt-3 text-xs text-faint">
        Rules: <a className="text-brass underline" href="/data/snl-board.json">snl-board.json</a> · game: <a className="text-brass underline" href="/data/snl-play.json">snl-play.json</a>
      </p>
    </div>
  );
}

function SquareSheet({ board, n, tokens, onToken, onJump }: { board: Board; n: number; tokens: Token[] | null; onToken: (lane: string) => void; onJump: (id: string, snake: boolean) => void }) {
  const s = board.squares.find((x) => x.n === n);
  const out = [...board.ladders.filter((j) => j.from === n).map((j) => ({ j, snake: false })), ...board.snakes.filter((j) => j.from === n).map((j) => ({ j, snake: true }))];
  return (
    <div>
      <p className="text-xs tracking-[0.16em] text-brass uppercase">{n === 0 ? "Start" : `Square ${n} of ${board.squares.length}`}</p>
      <h2 className="mt-1 font-serif text-2xl leading-tight">{n === 0 ? "No statutory clock yet" : s?.label}</h2>
      {s && (
        <p className="mt-2 text-sm text-muted">
          {s.url ? (
            <a href={s.url} target="_blank" rel="noreferrer" className="text-brass underline underline-offset-2">
              {s.law}
            </a>
          ) : (
            s.law
          )}
        </p>
      )}
      {n === 0 && <p className="mt-2 text-sm text-muted">Institutions written to where no FOI, EIR or SAR clock has started.</p>}
      {out.map(({ j, snake }) => (
        <button key={j.id} type="button" onClick={() => onJump(j.id, snake)} className="mt-2 block text-left text-sm" style={{ color: snake ? SNAKE : LADDER }}>
          {snake ? "Snake" : "Ladder"} to {j.to}: {j.label}
        </button>
      ))}
      {tokens && (
        <div className="mt-3 flex flex-wrap gap-2">
          {tokens.map((t) => (
            <button key={t.lane} type="button" onClick={() => onToken(t.lane)} className="rounded-full border border-line bg-surface-2 px-3 py-1.5 text-sm text-fg">
              {t.name}
            </button>
          ))}
          {!tokens.length && <p className="text-sm text-faint">No counter here today.</p>}
        </div>
      )}
    </div>
  );
}

function TokenSheet({ board, play, t, ruleOf, onJump }: { board: Board; play: Play; t: Token; ruleOf: Map<string, Rule>; onJump: (id: string, snake: boolean) => void }) {
  const mine = play.history.filter((h) => h.lane === t.lane);
  return (
    <div>
      <p className="text-xs tracking-[0.16em] text-brass uppercase">{sqName(board, t.square)}</p>
      <h2 className="mt-1 font-serif text-2xl leading-tight">{t.name}</h2>
      <p className="mt-2 text-sm text-muted first-letter:uppercase">{t.why}</p>
      <dl className="mt-3 grid grid-cols-[6.5rem_1fr] gap-x-2 gap-y-1.5 text-sm">
        {t.ref && (
          <>
            <dt className="text-faint">Ref</dt>
            <dd className="text-fg">{t.ref}</dd>
          </>
        )}
        {t.regime && (
          <>
            <dt className="text-faint">Route</dt>
            <dd className="text-fg">{t.regime}</dd>
          </>
        )}
        {t.next && (
          <>
            <dt className="text-faint">Next deadline</dt>
            <dd className="text-fg">
              {fmt(t.next.date)}
              {t.next.date && t.next.date < play.as_of ? " (overdue)" : ""} · {t.next.what}
            </dd>
          </>
        )}
        {t.missed > 0 && (
          <>
            <dt className="text-faint">Clocks missed</dt>
            <dd className="text-fg">{t.missed}</dd>
          </>
        )}
        {t.route && (
          <>
            <dt className="text-faint">Ombudsman</dt>
            <dd className="text-fg">{t.route}</dd>
          </>
        )}
      </dl>
      {t.title && <p className="mt-3 text-sm leading-snug text-fg">{t.title}</p>}
      {mine.length > 0 && (
        <ul className="mt-3 flex flex-col gap-2">
          {mine.map((m, i) => (
            <MoveLine key={i} m={m} r={ruleOf.get(m.id)} />
          ))}
        </ul>
      )}
      {[...new Set(mine.map((m) => m.id))].map((id) => (
        <button key={id} type="button" onClick={() => onJump(id, ruleOf.get(id) ? board.snakes.some((s) => s.id === id) : false)} className="mt-2 block text-left text-xs text-brass underline underline-offset-2">
          The rule: {ruleOf.get(id)?.label ?? id}
        </button>
      ))}
      <p className="mt-3 flex flex-wrap gap-3 text-sm">
        {t.url && (
          <a href={t.url} target="_blank" rel="noreferrer" className="text-brass underline underline-offset-4">
            Open the request
          </a>
        )}
        {t.next?.url && t.next.url !== t.url && (
          <a href={t.next.url} target="_blank" rel="noreferrer" className="text-brass underline underline-offset-4">
            Next step
          </a>
        )}
      </p>
    </div>
  );
}

/** A ladder or snake shows only its rule: the law or procedure, and the squares from → to. */
function JumpSheet({ board, j, snake }: { board: Board; j: Rule; snake: boolean }) {
  return (
    <div>
      <p className="text-xs tracking-[0.16em] uppercase" style={{ color: snake ? SNAKE : LADDER }}>
        {snake ? "Snake" : "Ladder"} · {j.from} → {j.to}
      </p>
      <h2 className="mt-1 font-serif text-2xl leading-tight">{j.label}</h2>
      <p className="mt-2 text-sm text-fg">{j.law}</p>
      <p className="mt-2 text-sm text-muted">
        {sqName(board, j.from)} → {sqName(board, j.to)}. {j.effect}
      </p>
    </div>
  );
}
