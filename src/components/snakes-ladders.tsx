import { useEffect, useMemo, useState } from "react";
import { DetailModal } from "@/components/detail-modal";
import bundled from "@/data/snakes-ladders.json";

/**
 * Snakes & Ladders: the disclosure path as a game board, under the dartboard. 36 squares follow the real
 * escalation route (request → deadline → internal review → ICO → tribunal; SAR → ICO; complaint → ombudsman;
 * pre-action letter → CPR 31.16 / 31.17 disclosure → court; then the trigger-event SOP to the reopening).
 * Ladders are procedural shortcuts and snakes procedural setbacks, each named by the law. One counter per
 * institution on its current square; gold ladders were earned and red snakes were hit, from the record.
 * Data: /data/snakes-ladders.json (work/roadmap/build_snakes_ladders.py). — Sion's Tab agent, 22 Oct 2026
 */

type Square = { n: number; label: string; short: string; law: string; url: string | null; tier: string };
type Hit = { lane: string | null; name: string | null; date: string | null; ref: string; what: string | null; url: string | null; ev?: string | null };
type Jump = { id: string; from: number; to: number; label: string; law: string; effect: string; hits: Hit[]; lanes: string[]; earned?: boolean; hit?: boolean };
type Token = {
  lane: string; name: string; short: string; square: number; why: string; kind: string; regime: string | null;
  ref: string; title: string; url: string | null; next: { date: string | null; what: string; url: string | null } | null;
  missed: number; route: string | null;
};
type Board = {
  as_of: string; cols: number; squares: Square[]; ladders: Jump[]; snakes: Jump[]; tokens: Token[];
  tiers: { id: string; label: string; from: number; to: number }[];
  totals: { squares: number; ladders: number; snakes: number; tokens: number; on_start: number; ladders_earned: number; snakes_hit: number };
};

const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const fmt = (s: string | null | undefined) => (s ? `${+s.slice(8, 10)} ${MON[+s.slice(5, 7) - 1]} ${s.slice(0, 4)}` : "—");
const CELL = 60;
const COLS = 6;
const ROWS = 6;
const W = CELL * COLS;
const GOLD = "#ffd34d";
const RED = "#e5484d";
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

function LadderShape({ j, onPick }: { j: Jump; onPick: () => void }) {
  const a = centre(j.from);
  const b = centre(j.to);
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy);
  const nx = (-dy / len) * 5;
  const ny = (dx / len) * 5;
  const col = j.earned ? GOLD : "#9a8b74";
  const op = j.earned ? 1 : 0.5;
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

function SnakeShape({ j, onPick }: { j: Jump; onPick: () => void }) {
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
  const col = j.hit ? RED : "#7d8f6a";
  const op = j.hit ? 1 : 0.55;
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

export function SnakesLadders() {
  const [data, setData] = useState<Board>(bundled as unknown as Board);
  const [sheet, setSheet] = useState<Sheet | null>(null);
  useEffect(() => {
    let live = true;
    fetch(`/data/snakes-ladders.json?d=${new Date().toISOString().slice(0, 10)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (live && j && j.schema === "ghf-snakes-ladders/1") setData(j as Board);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);

  const byLane = useMemo(() => new Map(data.tokens.map((t) => [t.lane, t])), [data]);
  const bySquare = useMemo(() => {
    const m = new Map<number, Token[]>();
    for (const t of data.tokens) m.set(t.square, [...(m.get(t.square) ?? []), t]);
    return m;
  }, [data]);
  const start = bySquare.get(0) ?? [];
  const startRows = Math.ceil(start.length / 8) || 1;
  const START_H = 22 + startRows * 15;
  const H = CELL * ROWS + START_H;
  const T = data.totals;

  return (
    <section id="snakes-ladders" aria-label="Snakes and ladders" className="rounded-[var(--radius-card)] border border-line bg-surface p-2">
      <div className="flex items-baseline justify-between px-1 pt-1">
        <h2 className="font-serif text-xl leading-tight text-fg">Snakes &amp; Ladders</h2>
        <button type="button" onClick={() => setSheet({ kind: "square", n: -1 })} className="text-xs text-brass underline underline-offset-2">
          How to read
        </button>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-2 block w-full touch-manipulation select-none" role="img" aria-label="Snakes and ladders board of the disclosure path">
        {data.squares.map((s) => {
          const p = pos(s.n);
          const row = Math.floor((s.n - 1) / COLS);
          const dark = (row + ((s.n - 1) % COLS)) % 2 === 0;
          const fin = s.n === data.squares.length;
          return (
            <g key={s.n} onClick={() => setSheet({ kind: "square", n: s.n })} style={{ cursor: "pointer" }}>
              <rect x={p.x + 0.5} y={p.y + 0.5} width={CELL - 1} height={CELL - 1} rx="3" fill={fin ? "#3a2f1c" : dark ? "#2b241d" : "#3b3127"} stroke={fin ? GOLD : "none"} strokeWidth={fin ? 1.2 : 0} />
              <rect x={p.x + 0.5} y={p.y + 0.5} width={CELL - 1} height="2.4" rx="1" fill={TIER[s.tier] ?? "#c4a574"} opacity="0.75" />
            </g>
          );
        })}
        {data.ladders.map((j) => (
          <LadderShape key={j.id} j={j} onPick={() => setSheet({ kind: "jump", id: j.id, snake: false })} />
        ))}
        {data.snakes.map((j) => (
          <SnakeShape key={j.id} j={j} onPick={() => setSheet({ kind: "jump", id: j.id, snake: true })} />
        ))}
        {data.squares.map((s) => {
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
        {data.squares.map((s) => {
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
        <g onClick={() => setSheet({ kind: "square", n: 0 })} style={{ cursor: "pointer" }}>
          <rect x="0.5" y={CELL * ROWS + 4} width={W - 1} height={START_H - 4.5} rx="4" fill="#1b1612" stroke="#3a3228" />
          <text x="6" y={CELL * ROWS + 15} fontFamily="Outfit, system-ui, sans-serif" fontSize="8" fontWeight="700" fill="#c4a574" letterSpacing="0.8">
            START · NO CLOCK YET · {start.length}
          </text>
        </g>
        {start.map((t, i) => {
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
      <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 px-1 text-[11px] text-muted">
        <span className="flex items-center gap-1">
          <span className="inline-block h-[3px] w-4 rounded" style={{ background: GOLD }} /> ladder earned {T.ladders_earned}/{T.ladders}
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-[3px] w-4 rounded" style={{ background: RED }} /> snake hit {T.snakes_hit}/{T.snakes}
        </span>
        <span>{T.tokens} counters · as of {fmt(data.as_of)}</span>
      </p>

      <DetailModal open={sheet !== null} onClose={() => setSheet(null)} accent={sheet?.kind === "jump" ? (sheet.snake ? RED : GOLD) : undefined}>
        {sheet?.kind === "square" && sheet.n === -1 && <HowTo data={data} />}
        {sheet?.kind === "square" && sheet.n >= 0 && (
          <SquareSheet data={data} n={sheet.n} tokens={bySquare.get(sheet.n) ?? []} onToken={(lane) => setSheet({ kind: "token", lane })} onJump={(id, snake) => setSheet({ kind: "jump", id, snake })} />
        )}
        {sheet?.kind === "token" && byLane.get(sheet.lane) && (
          <TokenSheet data={data} t={byLane.get(sheet.lane)!} onJump={(id, snake) => setSheet({ kind: "jump", id, snake })} />
        )}
        {sheet?.kind === "jump" && (
          <JumpSheet data={data} j={(sheet.snake ? data.snakes : data.ladders).find((x) => x.id === sheet.id)!} snake={sheet.snake} onToken={(lane) => setSheet({ kind: "token", lane })} />
        )}
      </DetailModal>
    </section>
  );
}

const sqName = (data: Board, n: number) => (n === 0 ? "Start" : `${n} · ${data.squares.find((s) => s.n === n)?.label ?? ""}`);

function HowTo({ data }: { data: Board }) {
  return (
    <div>
      <h2 className="font-serif text-2xl">Snakes &amp; Ladders</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        The path to disclosure, square by square from a first request (bottom left) to the case reopened (top). Each
        counter is one institution, standing on the square it has reached. Ladders are lawful shortcuts; snakes are
        procedural setbacks. Gold: a ladder already earned. Red: a snake already hit. Tap any square, counter, ladder or snake.
      </p>
      <div className="mt-3 flex flex-col gap-1.5 text-sm">
        {data.tiers.map((t) => (
          <p key={t.id} className="flex items-center gap-2 text-muted">
            <span className="inline-block h-1.5 w-5 rounded" style={{ background: TIER[t.id] }} />
            {t.from}–{t.to} · {t.label}
          </p>
        ))}
      </div>
      <p className="mt-3 text-xs text-faint">
        Built daily from the case mailbox and the roadmap. Data: <a className="text-brass underline" href="/data/snakes-ladders.json">snakes-ladders.json</a>
      </p>
    </div>
  );
}

function SquareSheet({ data, n, tokens, onToken, onJump }: { data: Board; n: number; tokens: Token[]; onToken: (lane: string) => void; onJump: (id: string, snake: boolean) => void }) {
  const s = data.squares.find((x) => x.n === n);
  const out = [...data.ladders.filter((j) => j.from === n).map((j) => ({ j, snake: false })), ...data.snakes.filter((j) => j.from === n).map((j) => ({ j, snake: true }))];
  return (
    <div>
      <p className="text-xs tracking-[0.16em] text-brass uppercase">{n === 0 ? "Start" : `Square ${n} of ${data.squares.length}`}</p>
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
        <button key={j.id} type="button" onClick={() => onJump(j.id, snake)} className="mt-2 block text-left text-sm" style={{ color: snake ? RED : GOLD }}>
          {snake ? "Snake" : "Ladder"} to {j.to}: {j.label}
        </button>
      ))}
      <div className="mt-3 flex flex-wrap gap-2">
        {tokens.map((t) => (
          <button key={t.lane} type="button" onClick={() => onToken(t.lane)} className="rounded-full border border-line bg-surface-2 px-3 py-1.5 text-sm text-fg">
            {t.name}
          </button>
        ))}
        {!tokens.length && <p className="text-sm text-faint">No counter here today.</p>}
      </div>
    </div>
  );
}

function TokenSheet({ data, t, onJump }: { data: Board; t: Token; onJump: (id: string, snake: boolean) => void }) {
  const mine = [
    ...data.ladders.filter((j) => j.lanes.includes(t.lane)).map((j) => ({ j, snake: false })),
    ...data.snakes.filter((j) => j.lanes.includes(t.lane)).map((j) => ({ j, snake: true })),
  ];
  return (
    <div>
      <p className="text-xs tracking-[0.16em] text-brass uppercase">{sqName(data, t.square)}</p>
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
              {t.next.date && t.next.date < data.as_of ? " (overdue)" : ""} · {t.next.what}
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
      {mine.map(({ j, snake }) => (
        <button key={j.id} type="button" onClick={() => onJump(j.id, snake)} className="mt-2 block text-left text-sm" style={{ color: snake ? RED : GOLD }}>
          {snake ? "Snake hit" : "Ladder earned"}: {j.label} ({j.law.split(";")[0]})
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

function JumpSheet({ data, j, snake, onToken }: { data: Board; j: Jump; snake: boolean; onToken: (lane: string) => void }) {
  if (!j) return null;
  const on = snake ? j.hit : j.earned;
  return (
    <div>
      <p className="text-xs tracking-[0.16em] uppercase" style={{ color: snake ? RED : GOLD }}>
        {snake ? "Snake" : "Ladder"} · {j.from} → {j.to}
      </p>
      <h2 className="mt-1 font-serif text-2xl leading-tight">{j.label}</h2>
      <p className="mt-2 text-sm text-fg">{j.law}</p>
      <p className="mt-2 text-sm text-muted">
        {sqName(data, j.from)} → {sqName(data, j.to)}. {j.effect}
      </p>
      <p className="mt-3 text-xs tracking-[0.16em] text-brass uppercase">{on ? (snake ? `Hit ${j.hits.length}×` : `Earned ${j.hits.length}×`) : snake ? "Not hit yet" : "Not earned yet"}</p>
      <ul className="mt-1 flex flex-col gap-2">
        {j.hits.slice(0, 40).map((h, i) => (
          <li key={i} className="text-sm leading-snug">
            {h.lane ? (
              <button type="button" onClick={() => onToken(h.lane!)} className="text-fg underline underline-offset-2">
                {h.name}
              </button>
            ) : (
              <span className="text-fg">{h.name}</span>
            )}
            <span className="text-faint">
              {" "}
              · {fmt(h.date)}
              {h.ref ? ` · ${h.ref}` : ""}
            </span>
            {h.what && <span className="block text-muted">{h.what}</span>}
            {h.url && (
              <a href={h.url} target="_blank" rel="noreferrer" className="text-xs text-brass underline underline-offset-2">
                Source
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
