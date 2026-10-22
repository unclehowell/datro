import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { DetailModal } from "@/components/detail-modal";
import playBundled from "@/data/snl-play.json";
import {
  avenueEmails,
  corrExtras,
  emailUrl,
  extraIndex,
  institutions,
  type AvInstitution,
} from "@/data/avenues";
import corrJson from "@/data/correspondence.json";

/**
 * The game view, v3 (owner's rules, 22 Oct 2026): ONE CUSTOM BOARD PER CORRESPONDENT, never everyone at once.
 * Choose a correspondent (the dropdown lists the dartboard's institutions by wheel number, or tap a wheel slice) and
 * its board is drawn from its own record: one square per email to or from it, in date order.
 *  - Ladder: its base is an email that released the records in full (manifest class "substantive disclosure" or
 *    "subject-access response"). A partial answer gives no ladder; it is just another square.
 *  - Snake: a definitive no-result (refused, "not held", a review or complaint that ends with nothing).
 *  - Laps: the stages of exhausting every option, in this order: request (FOI / EIR / enquiry) → clarification /
 *    internal review → SAR / GDPR → formal complaint (ICR, corporate complaint) → ICO / ombudsman → MP / Senedd →
 *    pre-action / tribunal / court. Each board numbers only the laps on that body's own route (its ramp rungs plus
 *    the stages its emails reached), so HMLR's laps differ from the police's. Every square carries its lap number and
 *    colour; the legend under the board is the index.
 *  - 1D / 2D toggle: 1D = the snakes and ladders path; 2D = the Donkey Kong climb of the same emails (girders = laps,
 *    ladders = disclosure, barrels = no-results). The choice is remembered.
 *  - Picking or toggling never moves the page: scrollY is kept across the re-render and ?r= uses replaceState.
 * Data: /data/snl-mail.json (ghf-snl-mail/1, built by work/roadmap/build_snakes_ladders.py) + the dartboard's own
 * email ledger (avenues.ts). — Sion's Tab agent, 22 Oct 2026
 */

type Token = { lane: string; name: string; short: string; square: number; dart?: string[] };
type Play = { schema: string; tokens: Token[] };
type MailRow = {
  id: string;
  d: string;
  out: boolean;
  s: string;
  u: string | null;
  c?: string;
  m?: string;
  a?: number;
  g?: string;
};
type Mail = { schema: string; lanes: Record<string, MailRow[]> };

type StageKey = "request" | "review" | "sar" | "complaint" | "watchdog" | "mp" | "court";
type Kind = "ladder" | "snake" | "square";
type Sq = MailRow & {
  n: number;
  stage: StageKey;
  lap: number;
  kind: Kind;
  partial: boolean;
  lane: string | null;
};
type Lap = { n: number; stage: StageKey; label: string; colour: string; count: number };
type Jump = { from: number; to: number };
type Game = { squares: Sq[]; laps: Lap[]; ladders: Jump[]; snakes: Jump[]; goal: number };

const STAGES: Record<StageKey, { label: string; short: string; colour: string }> = {
  request: { label: "Request · FOI / EIR / enquiry", short: "Request", colour: "#c4a574" },
  review: { label: "Clarification / internal review", short: "Review", colour: "#e07a2f" },
  sar: { label: "SAR / GDPR", short: "SAR", colour: "#2bb5a0" },
  complaint: { label: "Formal complaint", short: "Complaint", colour: "#d65fa0" },
  watchdog: { label: "ICO / ombudsman", short: "Watchdog", colour: "#5a7bd8" },
  mp: { label: "MP / Senedd", short: "MP", colour: "#8bc34a" },
  court: { label: "Pre-action / tribunal / court", short: "Court", colour: "#c23b32" },
};
const ORDER: StageKey[] = ["request", "review", "sar", "complaint", "watchdog", "mp", "court"];
const PHASE_STAGE: Record<string, StageKey> = {
  enquiry: "request",
  foi: "request",
  eir: "request",
  register: "request",
  courtrec: "request",
  review: "review",
  sar: "sar",
  complaint: "complaint",
  icr: "complaint",
  ico: "watchdog",
  phso: "watchdog",
  psow: "watchdog",
  iopc: "watchdog",
  iac: "watchdog",
  ccw: "watchdog",
  charity: "watchdog",
  regulator: "watchdog",
  democratic: "mp",
  petition: "mp",
  tribunal: "court",
  preaction: "court",
  disclosure: "court",
};
const WATCHDOG_NAME: Record<string, string> = {
  ico: "ICO",
  phso: "PHSO",
  psow: "PSOW",
  iopc: "IOPC",
  iac: "IAC",
  ccw: "CCW",
  charity: "Charity Commission",
  regulator: "Regulator",
};
/** Lanes that are themselves a stage of someone's route (the ICR, a watchdog, an MP). */
function laneStage(lane: string | null): StageKey | null {
  if (!lane) return null;
  if (/independent-complaints-reviewer|scrutiny/.test(lane)) return "complaint";
  if (/information-commissioner|ombudsman|legal-regulators|serious-fraud/.test(lane))
    return "watchdog";
  if (/member-of-parliament|senedd|public-administration|department-for-culture/.test(lane))
    return "mp";
  return null;
}
const FULL = new Set(["substantive disclosure", "subject-access response"]);

const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const fmt = (s: string | null | undefined) =>
  s ? `${+s.slice(8, 10)} ${MON[+s.slice(5, 7) - 1]} ${s.slice(0, 4)}` : "—";
const fmtS = (s: string) => `${+s.slice(8, 10)} ${MON[+s.slice(5, 7) - 1]} ${s.slice(2, 4)}`;
const DIR_TO = "#c4a574";
const DIR_FROM = "#7fb3d5";
const GOLD = "#ffd34d";
const LADDER = "#e8d9a8";
const SNAKE = "#6f9a5a";
const FONT = "Outfit, system-ui, sans-serif";

/** Gmail message id of each dartboard email (index into avenueEmails), so the two lists merge without repeats. */
const gmOf: Record<number, string> = (() => {
  const m: Record<number, string> = {};
  for (const [k, v] of Object.entries(
    (corrJson as unknown as { emails: Record<string, { gm?: string }> }).emails,
  ))
    if (v.gm) m[+k] = v.gm;
  for (const x of corrExtras) if (x.gm) m[extraIndex[x.id]] = x.gm;
  return m;
})();
const avId = (i: number) => gmOf[i] ?? `gm-${avenueEmails[i].t}`;

/** Which lap an email sits on: the dartboard's own phase for it when it has one, else its class, regime and subject. */
function stageOf(r: MailRow, phase: string | undefined, lane: string | null): StageKey {
  const ls = laneStage(lane);
  if (ls) return ls;
  const s = r.s ?? "";
  const c = r.c ?? "";
  const m = r.m ?? "";
  const reviewSignal =
    c === "internal review request" ||
    c === "clarification given" ||
    /internal review|clarif/i.test(s) ||
    (c === "complaint outcome" && /internal review/i.test(m));
  if (phase && PHASE_STAGE[phase]) {
    const st = PHASE_STAGE[phase];
    return st === "request" && reviewSignal ? "review" : st;
  }
  if (
    c === "preservation notice" ||
    r.g === "preservation notice" ||
    /pre-action|letter before claim|tribunal|^((re|fw|fwd):\s*)*preservation notice/i.test(s)
  )
    return "court";
  if (
    c.startsWith("escalation") ||
    /\bICO\b|Information Commissioner|Ombudsman|\bPSOW\b|\bPHSO\b|\bIOPC\b/i.test(s)
  )
    return "watchdog";
  if (reviewSignal) return "review";
  if (
    c === "complaint" ||
    c === "complaint outcome" ||
    r.g === "complaint" ||
    /\bcomplaint\b/i.test(s)
  )
    return "complaint";
  if (
    c === "subject-access response" ||
    r.g === "SAR" ||
    /subject access|\bSAR\b|\bDSAR\b|GDPR/i.test(s)
  )
    return "sar";
  return "request";
}
function kindOf(r: MailRow & { o?: string }): { kind: Kind; partial: boolean } {
  if (r.out) return { kind: "square", partial: false };
  const c = r.c ?? "";
  if (FULL.has(c) || (!c && r.o === "answered")) return { kind: "ladder", partial: false };
  if (c === "not held" || c === "refusal") return { kind: "snake", partial: false };
  if (
    c === "complaint outcome" &&
    /uphold|upheld|is final|declin|no evidence|not to investigate|outside the|no further/i.test(
      r.m ?? "",
    )
  )
    return { kind: "snake", partial: false };
  if (!c && (r.o === "notheld" || r.o === "refused")) return { kind: "snake", partial: false };
  return { kind: "square", partial: c === "partial" };
}

const COLS = 6;
const CELL = 60;
const W = CELL * COLS;
function pos(n: number, rows: number) {
  const row = Math.floor((n - 1) / COLS);
  const k = (n - 1) % COLS;
  const col = row % 2 === 0 ? k : COLS - 1 - k;
  return { x: col * CELL, y: (rows - 1 - row) * CELL };
}
/** The square straight above / below n on a boustrophedon board. */
const above = (n: number) => n + 2 * (COLS - ((n - 1) % COLS)) - 1;
const below = (n: number) => n - (2 * ((n - 1) % COLS) + 1);

/** Build one correspondent's board from its own record. `lanes` are its counters' mail lanes; `inst` adds the
 *  dartboard's own email ledger and route (ramp rungs) when the board is a whole institution. */
function buildGame(inst: AvInstitution | null, lanes: string[], mail: Mail | null): Game {
  const rows = new Map<string, MailRow & { o?: string; phase?: string; lane: string | null }>();
  const phaseOf = new Map<string, string>();
  const routePhases = new Set<string>();
  if (inst) {
    for (const l of inst.levels) {
      if (l.applicable) routePhases.add(l.phase);
      for (const i of l.items) if (!phaseOf.has(avId(i))) phaseOf.set(avId(i), l.phase);
    }
    const idx = new Set<number>();
    avenueEmails.forEach((e, i) => {
      if (e.i.includes(inst.id)) idx.add(i);
    });
    for (const l of inst.levels) for (const i of l.items) idx.add(i);
    for (const i of idx) {
      const e = avenueEmails[i];
      const id = avId(i);
      if (rows.has(id)) continue;
      rows.set(id, {
        id,
        d: e.d,
        out: e.out,
        s: e.s,
        u: emailUrl(i).url,
        o: e.o,
        phase: phaseOf.get(id),
        lane: null,
      });
    }
  }
  for (const lane of lanes)
    for (const r of mail?.lanes[lane] ?? []) {
      const had = rows.get(r.id);
      rows.set(r.id, {
        ...r,
        u: had?.u ?? r.u,
        o: had?.o,
        phase: had?.phase ?? phaseOf.get(r.id),
        lane,
      });
    }
  const list = [...rows.values()].sort(
    (a, b) => a.d.localeCompare(b.d) || (a.out === b.out ? 0 : a.out ? -1 : 1),
  );
  const staged = list.map((r) => ({ r, stage: stageOf(r, r.phase, r.lane) }));
  const route = new Set<StageKey>(staged.map((x) => x.stage));
  for (const p of routePhases) if (PHASE_STAGE[p]) route.add(PHASE_STAGE[p]);
  for (const l of lanes) {
    const ls = laneStage(l);
    if (ls) route.add(ls);
  }
  const WD_ORDER = ["ico", "iopc", "psow", "phso", "iac", "ccw", "charity", "regulator"];
  const wd = WD_ORDER.filter((p) => routePhases.has(p)).map((p) => WATCHDOG_NAME[p]);
  const laps: Lap[] = ORDER.filter((k) => route.has(k)).map((k, i) => ({
    n: i + 1,
    stage: k,
    label:
      k === "watchdog" && wd.length
        ? wd.join(" / ")
        : k === "complaint" &&
            (routePhases.has("icr") || lanes.some((l) => /independent-complaints-reviewer/.test(l)))
          ? "Formal complaint · ICR"
          : STAGES[k].label,
    colour: STAGES[k].colour,
    count: 0,
  }));
  const lapOf = new Map(laps.map((l) => [l.stage, l]));
  const squares: Sq[] = staged.map(({ r, stage }, i) => {
    const lap = lapOf.get(stage)!;
    lap.count += 1;
    const k = kindOf(r);
    return {
      id: r.id,
      d: r.d,
      out: r.out,
      s: r.s,
      u: r.u,
      c: r.c,
      m: r.m,
      a: r.a,
      g: r.g,
      n: i + 1,
      stage,
      lap: lap.n,
      kind: k.kind,
      partial: k.partial,
      lane: r.lane,
    };
  });
  const goal = squares.length + 1;
  const ladders = squares
    .filter((q) => q.kind === "ladder")
    .map((q) => ({ from: q.n, to: Math.min(goal, above(q.n)) }));
  const snakes = squares
    .filter((q) => q.kind === "snake")
    .map((q) => ({ from: q.n, to: Math.max(1, below(q.n)) }));
  return { squares, laps, ladders, snakes, goal };
}

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
function usePlay() {
  const [v, setV] = useState<Play>(playBundled as unknown as Play);
  useEffect(() => {
    let live = true;
    fetch(`/data/snl-play.json?d=${new Date().toISOString().slice(0, 10)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (live && j && j.schema === "ghf-snl-play/1") setV(j as Play);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);
  return v;
}

/** Keep the page exactly where it is across a re-render (a pick or a toggle never moves the page). */
function useKeepScroll(deps: unknown[]) {
  const y = useRef<number | null>(null);
  useLayoutEffect(() => {
    const top = y.current;
    if (top === null) return;
    y.current = null;
    const put = () => {
      if (Math.abs(window.scrollY - top) > 1)
        window.scrollTo({ top, left: window.scrollX, behavior: "instant" as ScrollBehavior });
    };
    put();
    const r1 = requestAnimationFrame(() => {
      put();
      requestAnimationFrame(put);
    });
    const t1 = window.setTimeout(put, 80);
    const t2 = window.setTimeout(put, 250);
    return () => {
      cancelAnimationFrame(r1);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return () => {
    y.current = window.scrollY;
  };
}

type View = "1d" | "2d";
type Sheet = { kind: "sq"; n: number } | { kind: "how" } | { kind: "goal" };

export function SnakesLadders({ pick, onPick }: { pick: string; onPick: (id: string) => void }) {
  const play = usePlay();
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [view, setView] = useState<View>("1d");
  const [sub, setSub] = useState("");
  useEffect(() => {
    const v = window.localStorage.getItem("snl-view");
    if (v === "1d" || v === "2d") setView(v);
  }, []);
  const inst = useMemo(() => institutions.find((i) => i.id === pick) ?? null, [pick]);
  const num = inst ? institutions.indexOf(inst) + 1 : 0;
  const tokens = useMemo(
    () => (pick ? play.tokens.filter((t) => (t.dart ?? []).includes(pick)) : []),
    [play, pick],
  );
  /** A shared slice (32: MPs, Senedd & watchdogs) holds several correspondents: each keeps its own board. */
  const grouped = tokens.length > 2;
  const subTok = grouped ? (tokens.find((t) => t.lane === sub) ?? tokens[0]) : null;
  const mail = useMail(!!pick);
  const laneKey = (subTok ? [subTok.lane] : tokens.map((t) => t.lane)).join("|");
  const game = useMemo(
    () => (pick ? buildGame(subTok ? null : inst, laneKey ? laneKey.split("|") : [], mail) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pick, inst, laneKey, mail],
  );
  const keep = useKeepScroll([pick, view, sub]);

  useEffect(() => {
    const r = Number(new URLSearchParams(window.location.search).get("r"));
    if (Number.isInteger(r) && r >= 1 && r <= institutions.length) onPick(institutions[r - 1].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    const u = new URL(window.location.href);
    if (num) u.searchParams.set("r", String(num));
    else if (!pick) u.searchParams.delete("r");
    if (u.href !== window.location.href)
      window.history.replaceState(window.history.state, "", u.href);
  }, [num, pick]);

  const title = subTok ? subTok.name : (inst?.name ?? "");
  const sq = sheet?.kind === "sq" && game ? game.squares[sheet.n - 1] : null;

  return (
    <section
      id="snakes-ladders"
      aria-label="Game view"
      className="rounded-[var(--radius-card)] border border-line bg-surface p-2"
      style={{ overflowAnchor: "none" }}
    >
      <div className="flex items-baseline justify-between px-1 pt-1">
        <h2 className="font-serif text-xl leading-tight text-fg">Game view</h2>
        <button
          type="button"
          onClick={() => setSheet({ kind: "how" })}
          className="text-xs text-brass underline underline-offset-2"
        >
          How to read
        </button>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <label className="sr-only" htmlFor="snl-pick">
          Correspondent
        </label>
        <select
          id="snl-pick"
          value={pick}
          onChange={(event) => {
            keep();
            setSub("");
            onPick(event.target.value);
          }}
          className="h-11 w-full min-w-0 flex-1 rounded-xl border border-line bg-surface-2 px-3 text-base text-fg"
        >
          <option value="">Choose a correspondent</option>
          {institutions.map((i, k) => (
            <option key={i.id} value={i.id}>
              {`${k + 1} · ${i.name}`}
            </option>
          ))}
        </select>
        <div
          role="group"
          aria-label="Visualisation"
          className="flex h-11 shrink-0 overflow-hidden rounded-xl border border-line text-sm font-semibold"
        >
          {(["1d", "2d"] as const).map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={view === v}
              title={v === "1d" ? "Snakes and ladders" : "Donkey Kong"}
              onClick={() => {
                keep();
                setView(v);
                window.localStorage.setItem("snl-view", v);
              }}
              className={`px-3 ${view === v ? "bg-brass text-[#14110e]" : "bg-surface-2 text-muted"}`}
            >
              {v.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
      <p className="mt-1 px-1 text-[11px] text-faint">
        {view === "1d" ? "1D · Snakes & ladders" : "2D · Donkey Kong"}
      </p>

      {!pick && (
        <p className="px-1 py-6 text-center text-sm text-muted">
          Choose a correspondent to see their board
        </p>
      )}

      {pick && grouped && (
        <div
          className="mt-2 flex flex-wrap gap-1.5 px-1"
          role="group"
          aria-label={`Correspondents on slice ${num}`}
        >
          {tokens.map((t) => (
            <button
              key={t.lane}
              type="button"
              aria-pressed={subTok?.lane === t.lane}
              onClick={() => {
                keep();
                setSub(t.lane);
              }}
              className={`rounded-full border px-2.5 py-1 text-xs ${subTok?.lane === t.lane ? "border-brass bg-brass text-[#14110e]" : "border-line bg-surface-2 text-muted"}`}
            >
              {t.name}
            </button>
          ))}
        </div>
      )}

      {pick && game && (
        <div data-snl-pick={num} data-snl-view={view}>
          <h3 className="mt-2 px-1 font-serif text-lg leading-tight text-fg">
            {num} · {title}
          </h3>
          {!mail && !game.squares.length ? (
            <p className="px-1 py-6 text-center text-sm text-muted">Loading the board…</p>
          ) : !game.squares.length ? (
            <p className="px-1 py-6 text-center text-sm text-muted">
              No emails on the record yet, so the board has no squares.
            </p>
          ) : view === "1d" ? (
            <Board1D
              game={game}
              onSq={(n) => setSheet({ kind: "sq", n })}
              onGoal={() => setSheet({ kind: "goal" })}
            />
          ) : (
            <Board2D
              game={game}
              onSq={(n) => setSheet({ kind: "sq", n })}
              onGoal={() => setSheet({ kind: "goal" })}
            />
          )}
          {game.squares.length > 0 && <Legend game={game} />}
          {game.squares.length > 0 && (
            <EmailList game={game} onSq={(n) => setSheet({ kind: "sq", n })} />
          )}
        </div>
      )}

      <DetailModal
        open={sheet !== null}
        onClose={() => setSheet(null)}
        accent={sq ? STAGES[sq.stage].colour : undefined}
      >
        {sheet?.kind === "how" && <HowTo />}
        {sheet?.kind === "goal" && (
          <div>
            <h2 className="font-serif text-2xl">Disclosure and remedy</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              The last square: every option with this correspondent used up, the records out and the
              remedy reached.
            </p>
          </div>
        )}
        {sq && game && <SquareSheet sq={sq} lap={game.laps[sq.lap - 1]} />}
      </DetailModal>
    </section>
  );
}

function SquareSheet({ sq, lap }: { sq: Sq; lap: Lap }) {
  const what =
    sq.kind === "ladder"
      ? "Ladder · records released in full"
      : sq.kind === "snake"
        ? "Snake · no result"
        : sq.partial
          ? "Partial answer · no ladder"
          : sq.out
            ? "Sent by the family"
            : "Reply";
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: lap.colour }}>
        Square {sq.n} · Lap {lap.n} · {lap.label}
      </p>
      <h2 className="mt-1 font-serif text-xl leading-snug">{sq.s || "(no subject)"}</h2>
      <p className="mt-2 text-sm text-muted">
        {fmt(sq.d)} ·{" "}
        <span style={{ color: sq.out ? DIR_TO : DIR_FROM }} className="font-semibold">
          {sq.out ? "→ To them" : "← From them"}
        </span>
      </p>
      <p className="mt-1 text-sm text-fg">
        {sq.kind === "ladder" ? "🪜 " : sq.kind === "snake" ? "🐍 " : ""}
        {what}
        {sq.a ? ` · ${sq.a} attachment${sq.a > 1 ? "s" : ""}` : ""}
      </p>
      {sq.m && <p className="mt-2 text-sm leading-relaxed text-muted">{sq.m}</p>}
      {sq.u && (
        <a
          href={sq.u}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-block rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm text-brass underline underline-offset-2"
        >
          Open the email
        </a>
      )}
    </div>
  );
}

function Legend({ game }: { game: Game }) {
  return (
    <div className="mt-2 px-1" aria-label="Lap index">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-faint">
        Laps of this board
      </p>
      <ul className="mt-1 grid grid-cols-1 gap-1 text-xs min-[360px]:grid-cols-2">
        {game.laps.map((l) => (
          <li
            key={l.n}
            className={`flex items-center gap-1.5 ${l.count ? "text-fg" : "text-faint"}`}
          >
            <span
              className="inline-flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-[#14110e]"
              style={{ background: l.colour, opacity: l.count ? 1 : 0.45 }}
            >
              {l.n}
            </span>
            <span className="min-w-0">
              Lap {l.n} · {l.label}{" "}
              <span className="text-faint">· {l.count ? l.count : "not yet"}</span>
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted">
        <span>{game.squares.length} squares</span>
        <span>
          🪜 {game.ladders.length} {game.ladders.length === 1 ? "ladder" : "ladders"}
        </span>
        <span>
          🐍 {game.snakes.length} {game.snakes.length === 1 ? "snake" : "snakes"}
        </span>
        <span style={{ color: DIR_TO }}>→ to them</span>
        <span style={{ color: DIR_FROM }}>← from them</span>
      </p>
    </div>
  );
}

function EmailList({ game, onSq }: { game: Game; onSq: (n: number) => void }) {
  const [all, setAll] = useState(false);
  const rows = [...game.squares].reverse();
  const shown = all ? rows : rows.slice(0, 10);
  return (
    <details className="mt-2 rounded-lg border border-line bg-surface-2 px-2.5 py-1.5">
      <summary className="cursor-pointer text-sm text-fg">
        Emails, newest first · {rows.length}
      </summary>
      <ul className="mt-1 flex flex-col divide-y divide-line pb-1">
        {shown.map((q) => (
          <li key={q.id}>
            <button
              type="button"
              onClick={() => onSq(q.n)}
              className="w-full py-1.5 text-left text-sm leading-snug"
            >
              <span className="text-xs text-faint">
                #{q.n} · {fmt(q.d)}{" "}
              </span>
              <span
                className="text-xs font-semibold"
                style={{ color: game.laps[q.lap - 1].colour }}
              >
                Lap {q.lap}
              </span>
              <span
                className="ml-1.5 text-xs font-semibold"
                style={{ color: q.out ? DIR_TO : DIR_FROM }}
              >
                {q.out ? "→" : "←"}
              </span>
              {q.kind === "ladder" ? " 🪜" : q.kind === "snake" ? " 🐍" : ""}
              <span className="block text-fg">{q.s || "(no subject)"}</span>
            </button>
          </li>
        ))}
      </ul>
      {rows.length > shown.length && (
        <button
          type="button"
          onClick={() => setAll(true)}
          className="mb-1 text-sm text-brass underline underline-offset-2"
        >
          Show all {rows.length}
        </button>
      )}
    </details>
  );
}

/* ---------- 1D: snakes and ladders ---------- */
function LadderShape({
  a,
  b,
  onPick,
}: {
  a: { x: number; y: number };
  b: { x: number; y: number };
  onPick: () => void;
}) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = (-dy / len) * 5;
  const ny = (dx / len) * 5;
  const rungs = Math.max(2, Math.floor(len / 10));
  return (
    <g onClick={onPick} style={{ cursor: "pointer" }}>
      <line
        x1={a.x + nx}
        y1={a.y + ny}
        x2={b.x + nx}
        y2={b.y + ny}
        stroke="#14110e"
        strokeWidth="3.6"
        strokeLinecap="round"
        opacity="0.6"
      />
      <line
        x1={a.x - nx}
        y1={a.y - ny}
        x2={b.x - nx}
        y2={b.y - ny}
        stroke="#14110e"
        strokeWidth="3.6"
        strokeLinecap="round"
        opacity="0.6"
      />
      {Array.from({ length: rungs - 1 }, (_, i) => {
        const t = (i + 1) / rungs;
        const x = a.x + dx * t;
        const y = a.y + dy * t;
        return (
          <line
            key={i}
            x1={x + nx}
            y1={y + ny}
            x2={x - nx}
            y2={y - ny}
            stroke={LADDER}
            strokeWidth="1.4"
          />
        );
      })}
      <line
        x1={a.x + nx}
        y1={a.y + ny}
        x2={b.x + nx}
        y2={b.y + ny}
        stroke={LADDER}
        strokeWidth="1.9"
        strokeLinecap="round"
      />
      <line
        x1={a.x - nx}
        y1={a.y - ny}
        x2={b.x - nx}
        y2={b.y - ny}
        stroke={LADDER}
        strokeWidth="1.9"
        strokeLinecap="round"
      />
      <line
        x1={a.x}
        y1={a.y}
        x2={b.x}
        y2={b.y}
        stroke="transparent"
        strokeWidth="16"
        pointerEvents="stroke"
      />
    </g>
  );
}
function SnakeShape({
  h,
  t,
  onPick,
}: {
  h: { x: number; y: number };
  t: { x: number; y: number };
  onPick: () => void;
}) {
  const dx = t.x - h.x;
  const dy = t.y - h.y;
  const len = Math.hypot(dx, dy);
  if (len < 1) {
    return (
      <g onClick={onPick} style={{ cursor: "pointer" }}>
        <path
          d={`M${h.x - 12} ${h.y + 8} q 6 -10 12 0 t 12 0`}
          fill="none"
          stroke={SNAKE}
          strokeWidth="3.4"
          strokeLinecap="round"
        />
        <circle
          cx={h.x + 12}
          cy={h.y + 8}
          r="3.4"
          fill={SNAKE}
          stroke="#14110e"
          strokeWidth="0.8"
        />
      </g>
    );
  }
  const nx = -dy / len;
  const ny = dx / len;
  const amp = Math.min(10, 5 + len / 18);
  const seg = 4;
  let d = `M${h.x.toFixed(1)} ${h.y.toFixed(1)}`;
  for (let i = 0; i < seg; i++) {
    const t0 = (i + 0.5) / seg;
    const t1 = (i + 1) / seg;
    const s = i % 2 === 0 ? 1 : -1;
    d += ` Q${(h.x + dx * t0 + nx * amp * s).toFixed(1)} ${(h.y + dy * t0 + ny * amp * s).toFixed(1)} ${(h.x + dx * t1).toFixed(1)} ${(h.y + dy * t1).toFixed(1)}`;
  }
  return (
    <g onClick={onPick} style={{ cursor: "pointer" }}>
      <path
        d={d}
        fill="none"
        stroke="#14110e"
        strokeWidth="6"
        strokeLinecap="round"
        opacity="0.55"
      />
      <path d={d} fill="none" stroke={SNAKE} strokeWidth="3.6" strokeLinecap="round" />
      <circle cx={h.x} cy={h.y} r="4.6" fill={SNAKE} stroke="#14110e" strokeWidth="0.9" />
      <circle cx={h.x - 1.4} cy={h.y - 1} r="0.8" fill="#14110e" />
      <circle cx={h.x + 1.4} cy={h.y - 1} r="0.8" fill="#14110e" />
      <path d={d} fill="none" stroke="transparent" strokeWidth="14" pointerEvents="stroke" />
    </g>
  );
}

function Board1D({
  game,
  onSq,
  onGoal,
}: {
  game: Game;
  onSq: (n: number) => void;
  onGoal: () => void;
}) {
  const total = game.goal;
  const rows = Math.ceil(total / COLS);
  const H = rows * CELL;
  const c = (n: number) => {
    const p = pos(n, rows);
    return { x: p.x + CELL / 2, y: p.y + CELL / 2 + 2 };
  };
  const last = game.squares[game.squares.length - 1];
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="mt-2 block w-full touch-manipulation select-none"
      role="img"
      aria-label={`Snakes and ladders board: ${game.squares.length} emails in ${game.laps.length} laps`}
    >
      {game.squares.map((q) => {
        const p = pos(q.n, rows);
        const row = Math.floor((q.n - 1) / COLS);
        const dark = (row + ((q.n - 1) % COLS)) % 2 === 0;
        const col = STAGES[q.stage].colour;
        return (
          <g
            key={q.id}
            onClick={() => onSq(q.n)}
            style={{ cursor: "pointer" }}
            data-sq={q.n}
            data-lap={q.lap}
          >
            <rect
              x={p.x + 0.5}
              y={p.y + 0.5}
              width={CELL - 1}
              height={CELL - 1}
              rx="3"
              fill={dark ? "#2b241d" : "#3b3127"}
            />
            <rect
              x={p.x + 0.5}
              y={p.y + 0.5}
              width={CELL - 1}
              height={CELL - 1}
              rx="3"
              fill={col}
              opacity="0.2"
            />
            <rect x={p.x + 0.5} y={p.y + 0.5} width={CELL - 1} height="3.2" rx="1" fill={col} />
            {q.partial && (
              <rect
                x={p.x + 2}
                y={p.y + 2}
                width={CELL - 4}
                height={CELL - 4}
                rx="3"
                fill="none"
                stroke={GOLD}
                strokeWidth="0.9"
                strokeDasharray="2 2"
                opacity="0.7"
              />
            )}
          </g>
        );
      })}
      {(() => {
        const p = pos(total, rows);
        return (
          <g onClick={onGoal} style={{ cursor: "pointer" }}>
            <rect
              x={p.x + 0.5}
              y={p.y + 0.5}
              width={CELL - 1}
              height={CELL - 1}
              rx="3"
              fill="#3a2f1c"
              stroke={GOLD}
              strokeWidth="1.4"
            />
            <text
              x={p.x + CELL / 2}
              y={p.y + 27}
              textAnchor="middle"
              fontFamily={FONT}
              fontSize="8"
              fontWeight="800"
              fill={GOLD}
            >
              DISCLOSURE
            </text>
            <text
              x={p.x + CELL / 2}
              y={p.y + 38}
              textAnchor="middle"
              fontFamily={FONT}
              fontSize="8"
              fontWeight="800"
              fill={GOLD}
            >
              &amp; REMEDY
            </text>
          </g>
        );
      })()}
      {game.ladders.map((j) => (
        <LadderShape key={`L${j.from}`} a={c(j.from)} b={c(j.to)} onPick={() => onSq(j.from)} />
      ))}
      {game.snakes.map((j) => (
        <SnakeShape key={`S${j.from}`} h={c(j.from)} t={c(j.to)} onPick={() => onSq(j.from)} />
      ))}
      {game.squares.map((q) => {
        const p = pos(q.n, rows);
        const col = STAGES[q.stage].colour;
        return (
          <g key={`l-${q.id}`} pointerEvents="none" fontFamily={FONT}>
            <g stroke="#1b1612" strokeWidth="2.2" paintOrder="stroke" strokeLinejoin="round">
              <text x={p.x + 4} y={p.y + 14} fontSize="9.5" fontWeight="700" fill="#f4efe6">
                {q.n}
              </text>
              <text x={p.x + 4} y={p.y + CELL - 6} fontSize="7" fill="#b3a898">
                {fmtS(q.d)}
              </text>
              <text
                x={p.x + CELL - 6}
                y={p.y + CELL - 6}
                textAnchor="end"
                fontSize="11"
                fontWeight="800"
                fill={q.out ? DIR_TO : DIR_FROM}
              >
                {q.out ? "→" : "←"}
              </text>
            </g>
            <circle
              cx={p.x + CELL - 10}
              cy={p.y + 12}
              r="7"
              fill={col}
              stroke="#14110e"
              strokeWidth="0.8"
            />
            <text
              x={p.x + CELL - 10}
              y={p.y + 12.4}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="7.4"
              fontWeight="800"
              fill="#14110e"
            >
              {q.lap}
            </text>
          </g>
        );
      })}
      {last &&
        (() => {
          const p = c(last.n);
          return (
            <g pointerEvents="none">
              <circle
                cx={p.x}
                cy={p.y - 2}
                r="7.5"
                fill="#f4efe6"
                stroke="#2fa36b"
                strokeWidth="2.4"
              />
              <text
                x={p.x}
                y={p.y - 1.6}
                textAnchor="middle"
                dominantBaseline="central"
                fontFamily={FONT}
                fontSize="5.4"
                fontWeight="800"
                fill="#14110e"
              >
                NOW
              </text>
            </g>
          );
        })()}
    </svg>
  );
}

/* ---------- 2D: the Donkey Kong climb ---------- */
const DW = 360;
const DTOP = 70;
const DLH = 78;
const DX0 = 8;
const DX1 = DW - 8;
const DGAP = 24;
const DTILT = 8;
function dGirder(level: number, levels: number) {
  const yBase = DTOP + (levels - 1 - level) * DLH + 40;
  const highRight = level % 2 === 0;
  const left = highRight ? DX0 + DGAP : DX0;
  const right = highRight ? DX1 : DX1 - DGAP;
  const yL = highRight ? yBase + DTILT / 2 : yBase - DTILT / 2;
  const yR = highRight ? yBase - DTILT / 2 : yBase + DTILT / 2;
  return {
    left,
    right,
    yL,
    yR,
    yAt: (x: number) => yL + ((x - left) / (right - left)) * (yR - yL),
  };
}
function GirderShape({ level, levels, dim }: { level: number; levels: number; dim: boolean }) {
  const g = dGirder(level, levels);
  const th = 7;
  const n = Math.floor((g.right - g.left) / 12);
  const step = (g.right - g.left) / n;
  let truss = "";
  for (let i = 0; i < n; i++) {
    const x0 = g.left + i * step;
    const x1 = x0 + step;
    truss += `M${x0.toFixed(1)} ${g.yAt(x0).toFixed(1)} L${(x0 + step / 2).toFixed(1)} ${(g.yAt(x0 + step / 2) + th).toFixed(1)} L${x1.toFixed(1)} ${g.yAt(x1).toFixed(1)} `;
  }
  return (
    <g opacity={dim ? 0.35 : 1}>
      <polygon
        points={`${g.left},${g.yL} ${g.right},${g.yR} ${g.right},${g.yR + th} ${g.left},${g.yL + th}`}
        fill="#c8324a"
      />
      <path d={truss} fill="none" stroke="#ff9db0" strokeWidth="1" />
      <line x1={g.left} y1={g.yL} x2={g.right} y2={g.yR} stroke="#ffb3c1" strokeWidth="1" />
      <line
        x1={g.left}
        y1={g.yL + th}
        x2={g.right}
        y2={g.yR + th}
        stroke="#7d1426"
        strokeWidth="1"
      />
    </g>
  );
}
function DkLadder({
  x,
  y0,
  y1,
  onPick,
}: {
  x: number;
  y0: number;
  y1: number;
  onPick: () => void;
}) {
  const rungs = Math.max(2, Math.floor((y0 - y1) / 6));
  return (
    <g onClick={onPick} style={{ cursor: "pointer" }}>
      <line x1={x - 4} y1={y0} x2={x - 4} y2={y1} stroke="#4fd1e8" strokeWidth="1.6" />
      <line x1={x + 4} y1={y0} x2={x + 4} y2={y1} stroke="#4fd1e8" strokeWidth="1.6" />
      {Array.from({ length: rungs }, (_, i) => {
        const y = y0 - ((i + 0.5) * (y0 - y1)) / rungs;
        return (
          <line key={i} x1={x - 4} y1={y} x2={x + 4} y2={y} stroke="#4fd1e8" strokeWidth="1.2" />
        );
      })}
      <rect x={x - 7} y={y1} width="14" height={y0 - y1} fill="transparent" />
    </g>
  );
}
function Barrel({ x, y, onPick }: { x: number; y: number; onPick: () => void }) {
  return (
    <g onClick={onPick} style={{ cursor: "pointer" }}>
      <ellipse
        cx={x}
        cy={y - 5.5}
        rx="6.2"
        ry="5.5"
        fill="#9a5a2a"
        stroke="#3e2210"
        strokeWidth="0.9"
      />
      <line x1={x - 5.6} y1={y - 7.8} x2={x + 5.6} y2={y - 7.8} stroke="#f2c27a" strokeWidth="1" />
      <line x1={x - 5.6} y1={y - 3.2} x2={x + 5.6} y2={y - 3.2} stroke="#f2c27a" strokeWidth="1" />
      <line x1={x} y1={y - 10.6} x2={x} y2={y - 0.4} stroke="#3e2210" strokeWidth="0.8" />
      <rect x={x - 8} y={y - 13} width="16" height="14" fill="transparent" />
    </g>
  );
}
function Envelope({
  x,
  y,
  fill,
  partial,
  onPick,
}: {
  x: number;
  y: number;
  fill: string;
  partial: boolean;
  onPick: () => void;
}) {
  const w = 10;
  const h = 7.5;
  return (
    <g onClick={onPick} style={{ cursor: "pointer" }}>
      <rect
        x={x - w / 2}
        y={y - h - 1}
        width={w}
        height={h}
        fill={fill}
        stroke={partial ? GOLD : "rgba(0,0,0,0.55)"}
        strokeWidth={partial ? 1.2 : 0.8}
      />
      <path
        d={`M${x - w / 2} ${y - h - 1} L${x} ${y - h / 2 - 0.5} L${x + w / 2} ${y - h - 1}`}
        fill="none"
        stroke="rgba(0,0,0,0.55)"
        strokeWidth="0.8"
      />
      <rect x={x - 7} y={y - 12} width="14" height="13" fill="transparent" />
    </g>
  );
}
/** The ape and the man in green overalls, from the Donkey Kong climb of Oct 2026 (pixel sprites). */
function Ape({ x, y }: { x: number; y: number }) {
  const p = 2.6;
  const fur = "#6b4a2f";
  const R: [number, number, number, number, string][] = [
    [-5, -10, 10, 9, fur],
    [-4, -15, 8, 6, fur],
    [-3, -13, 6, 4, "#d8b48a"],
    [-2, -13, 1, 1, "#111"],
    [1, -13, 1, 1, "#111"],
    [-2, -11, 4, 1, "#3e2a1a"],
    [-3, -6, 6, 4, "#8a6545"],
    [-8, -17, 3, 8, fur],
    [5, -17, 3, 8, fur],
    [-5, -1, 4, 2, "#3e2a1a"],
    [1, -1, 4, 2, "#3e2a1a"],
  ];
  return (
    <g pointerEvents="none">
      {R.map(([cx, cy, w, h, c], i) => (
        <rect key={i} x={x + cx * p} y={y + cy * p} width={w * p} height={h * p} fill={c} />
      ))}
    </g>
  );
}
function Man({ x, y }: { x: number; y: number }) {
  const p = 1.8;
  const R: [number, number, number, number, string][] = [
    [-2, -14, 5, 2, "#f4efe6"],
    [-3, -13, 7, 1, "#f4efe6"],
    [-2, -12, 4, 3, "#c98d5e"],
    [1, -11, 1, 1, "#111"],
    [-3, -9, 6, 5, "#2fa36b"],
    [-1, -8, 2, 2, "#ffd34d"],
    [3, -12, 1, 4, "#c98d5e"],
    [-4, -8, 1, 3, "#c98d5e"],
    [-2, -4, 2, 4, "#1f3b2c"],
    [0, -4, 2, 4, "#1f3b2c"],
  ];
  return (
    <g pointerEvents="none">
      <ellipse
        cx={x}
        cy={y + 1}
        rx="8"
        ry="2.4"
        fill="none"
        stroke="rgba(255,211,77,0.85)"
        strokeWidth="1.2"
      />
      {R.map(([cx, cy, w, h, c], i) => (
        <rect key={i} x={x + cx * p} y={y + cy * p} width={w * p} height={h * p} fill={c} />
      ))}
    </g>
  );
}

function Board2D({
  game,
  onSq,
  onGoal,
}: {
  game: Game;
  onSq: (n: number) => void;
  onGoal: () => void;
}) {
  const levels = game.laps.length;
  const H = DTOP + levels * DLH + 22;
  const platY = DTOP - 6;
  /** Each email at its place on its lap's girder, in date order. */
  const placed = useMemo(() => {
    const out = new Map<number, { x: number; y: number; level: number }>();
    game.laps.forEach((lap, li) => {
      const g = dGirder(li, levels);
      const items = game.squares.filter((q) => q.lap === lap.n);
      const a = g.left + 34;
      const b = g.right - 10;
      items.forEach((q, j) => {
        const x = items.length === 1 ? (a + b) / 2 : a + ((b - a) * j) / (items.length - 1);
        const lift = items.length > 24 && j % 2 === 1 ? 9 : 0;
        out.set(q.n, { x, y: g.yAt(x) - lift, level: li });
      });
    });
    return out;
  }, [game, levels]);
  const last = game.squares[game.squares.length - 1];
  const lastAt = last ? placed.get(last.n) : null;
  return (
    <svg
      viewBox={`0 0 ${DW} ${H}`}
      className="mt-2 block w-full touch-manipulation select-none rounded-lg bg-[#0b0a12]"
      role="img"
      aria-label={`Donkey Kong climb: ${game.squares.length} emails on ${levels} girders`}
    >
      <g onClick={onGoal} style={{ cursor: "pointer" }}>
        <rect x={DW / 2 - 90} y={platY} width="180" height="6" fill="#c8324a" />
        <text
          x={DW / 2 + 40}
          y={platY - 14}
          textAnchor="middle"
          fontFamily={FONT}
          fontSize="9"
          fontWeight="800"
          fill={GOLD}
        >
          DISCLOSURE &amp; REMEDY
        </text>
      </g>
      <Ape x={DW / 2 - 52} y={platY} />
      {game.laps.map((lap, li) => (
        <GirderShape key={lap.n} level={li} levels={levels} dim={!lap.count} />
      ))}
      {game.squares
        .filter((q) => q.kind === "ladder")
        .map((q) => {
          const at = placed.get(q.n)!;
          const yTop =
            at.level === levels - 1 ? platY + 6 : dGirder(at.level + 1, levels).yAt(at.x) + 7;
          return <DkLadder key={`d${q.n}`} x={at.x} y0={at.y} y1={yTop} onPick={() => onSq(q.n)} />;
        })}
      {game.squares.map((q) => {
        const at = placed.get(q.n)!;
        if (q.kind === "snake")
          return <Barrel key={q.id} x={at.x} y={at.y} onPick={() => onSq(q.n)} />;
        return (
          <Envelope
            key={q.id}
            x={at.x}
            y={at.y}
            fill={q.kind === "ladder" ? GOLD : q.out ? "#e8e2d0" : "#c8742c"}
            partial={q.partial}
            onPick={() => onSq(q.n)}
          />
        );
      })}
      {game.laps.map((lap, li) => {
        const g = dGirder(li, levels);
        const lx = g.left + 2;
        return (
          <g key={`lab${lap.n}`}>
            <g pointerEvents="none" fontFamily={FONT}>
              <circle
                cx={lx + 7}
                cy={Math.min(g.yL, g.yR) - 33}
                r="7"
                fill={lap.colour}
                opacity={lap.count ? 1 : 0.45}
              />
              <text
                x={lx + 7}
                y={Math.min(g.yL, g.yR) - 32.6}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize="7.4"
                fontWeight="800"
                fill="#14110e"
              >
                {lap.n}
              </text>
              <text
                stroke="#0b0a12"
                strokeWidth="3"
                paintOrder="stroke"
                strokeLinejoin="round"
                x={lx + 17}
                y={Math.min(g.yL, g.yR) - 30}
                fontSize="8.5"
                fontWeight="700"
                fill={lap.count ? lap.colour : "#6b6474"}
              >
                {`Lap ${lap.n} · ${lap.label}${lap.count ? ` · ${lap.count}` : " · not yet"}`}
              </text>
            </g>
          </g>
        );
      })}
      {lastAt && <Man x={lastAt.x} y={lastAt.y - 12} />}
    </svg>
  );
}

function HowTo() {
  return (
    <div>
      <h2 className="font-serif text-2xl">The game view</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        Every correspondent has its own board, because every body has its own route to disclosure
        and remedy. Choose one above (the number is its slice on the dartboard). Each square is one
        email to or from it, in date order, from the bottom left to the gold square: disclosure and
        remedy.
      </p>
      <ul className="mt-2 flex flex-col gap-1.5 text-sm leading-relaxed text-muted">
        <li>
          🪜 A ladder rises from an email that released the records in full, one row up. A partial
          answer is just another square.
        </li>
        <li>
          🐍 A snake starts on a definitive no-result (refused, not held, a review or complaint that
          ended with nothing) and drops one row.
        </li>
        <li>
          The number in the coloured circle is the email&apos;s lap: the stage of using up every
          option with that body. The index under the board lists the laps of that board; a lap
          marked &quot;not yet&quot; is on the body&apos;s route but unused.
        </li>
        <li>
          1D shows the path as snakes and ladders; 2D shows the same emails as the Donkey Kong
          climb: one girder per lap, ladders for disclosure, barrels for no-results, the man in
          green on the latest email.
        </li>
      </ul>
      <div className="mt-3 flex flex-col gap-1.5 text-sm">
        {ORDER.map((k, i) => (
          <p key={k} className="flex items-center gap-2 text-muted">
            <span
              className="inline-block h-1.5 w-5 rounded"
              style={{ background: STAGES[k].colour }}
            />
            {i + 1}. {STAGES[k].label}
          </p>
        ))}
      </div>
      <p className="mt-2 text-xs text-faint">
        The full order of the route; each board numbers only the laps on its own route.
      </p>
    </div>
  );
}
