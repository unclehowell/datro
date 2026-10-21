import { useCallback, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  resolveCell,
  rings,
  sampledThrough,
  statusMeta,
  type Party,
  type Ring,
} from "@/data/disclosure";
import {
  avenueEmails,
  emailUrl,
  feeNotes,
  instNumber,
  isFee,
  avenuesAsOf,
  institutions,
  outcomeInfo,
  phases,
  isPaid,
  rampStateInfo,
  ramps,
  statusInfo,
  type Rung,
  type AvDoc,
  type AvInstitution,
  type AvLevel,
} from "@/data/avenues";
import { DartWheel } from "@/components/dart-wheel";
import { sliceFees, type WheelSlice } from "@/data/wheel";
import {
  AvenueGame,
  FIRE_A,
  HEART,
  PAL,
  type GameHit,
  type SlidePick,
} from "@/components/avenue-game";
import { cloudNumber, corr } from "@/data/correspondence";
import { Chip, DetailModal, Row, fmtDate } from "@/components/detail-modal";
import { ArtifactsSheet, CorrSheet, CourtTiles, OptionsSheet, courtInstitutions } from "@/components/court-ready";

export const Route = createFileRoute("/")({ component: Home });

type Sheet =
  | { kind: "cell"; party: Party; ring: Ring; slice: WheelSlice }
  | { kind: "game"; hit: GameHit; inst: AvInstitution; slide?: Omit<SlidePick, "index" | "level"> }
  | { kind: "key" }
  | { kind: "corr"; inst: string }
  | { kind: "art" }
  | { kind: "opt"; inst: string };

/**
 * Cells written before 19 Oct link to /reference/<Gmail thread id> with nothing to search for.
 * Send them to the email we matched in the archive, or give the archive's lookup the details.
 */
function recordUrl(url: string | undefined, title: string, date?: string, ref?: string) {
  if (!url) return undefined;
  const m = url.match(/^https:\/\/email\.bucklerfamily\.estate\/reference\/([a-f0-9]{16})\/?$/i);
  if (!m) return url;
  const thread = m[1];
  const inThread = avenueEmails.map((e, i) => (e.t === thread ? i : -1)).filter((i) => i >= 0);
  const exact = inThread.map((i) => emailUrl(i)).find((u) => u.exact);
  if (exact) return exact.url;
  if (inThread.length) return emailUrl(inThread[0]).url;
  const p = new URLSearchParams();
  p.set("title", title);
  if (date) p.set("date", date);
  if (ref) p.set("caseRef", ref);
  return `${url}?${p.toString()}`;
}

function FeeList({ list }: { list: number[] }) {
  if (!list.length) return null;
  return (
    <div className="mt-3 rounded-xl border border-[#ffd34d]/40 bg-[#ffd34d]/5 p-3">
      <p className="text-sm font-semibold text-[#ffd34d]">$ Fees sought or mentioned</p>
      <ul className="mt-1.5 flex flex-col gap-2">
        {list.map((i) => (
          <li key={i} className="text-sm leading-snug text-muted">
            <span className="text-fg">{fmtDate(avenueEmails[i].d)}</span> · {feeNotes[i]}{" "}
            <a
              href={emailUrl(i).url}
              target="_blank"
              rel="noreferrer"
              className="text-brass underline underline-offset-4"
            >
              Open email
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** The letter attached to an email (public copy), with its Wayback mirror. */
function DocList({ docs }: { docs?: AvDoc[] }) {
  if (!docs || !docs.length) return null;
  return (
    <div className="mt-3 rounded-xl border border-brass/40 bg-brass/5 p-3">
      <p className="text-sm font-semibold text-brass">Attached letter</p>
      <ul className="mt-1.5 flex flex-col gap-2">
        {docs.map((d) => (
          <li key={d.url} className="text-sm leading-snug">
            <a
              href={d.url}
              target="_blank"
              rel="noreferrer"
              className="text-fg underline underline-offset-4"
            >
              {d.label}
            </a>
            {d.wayback && (
              <>
                {" · "}
                <a
                  href={d.wayback}
                  target="_blank"
                  rel="noreferrer"
                  className="text-brass underline underline-offset-4"
                >
                  Wayback copy
                </a>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function nextAvenue(inst: AvInstitution, from: number) {
  for (let i = from + 1; i < inst.levels.length; i++) {
    const l = inst.levels[i];
    if (l.applicable && l.status === "available") return l;
  }
  return undefined;
}

/** Legal basis line for one rung: the statute or guidance, and the body's own policy where we have it. */
function LegalBasis({ rung }: { rung: Rung }) {
  return (
    <p className="mt-3 text-xs leading-relaxed text-faint">
      <span className="text-muted">Legal basis:</span>{" "}
      <a
        href={rung.url}
        target="_blank"
        rel="noreferrer"
        className="text-brass underline underline-offset-4"
      >
        {rung.law}
      </a>
      {rung.pol && rung.polurl && (
        <>
          {" · "}
          <span className="text-muted">Policy:</span>{" "}
          <a
            href={rung.polurl}
            target="_blank"
            rel="noreferrer"
            className="text-brass underline underline-offset-4"
          >
            {rung.pol}
          </a>
        </>
      )}
      {rung.ev && rung.ev.length > 0 && (
        <>
          <br />
          <span className="text-muted">Evidence:</span>{" "}
          {rung.ev.map((e, i) => (
            <span key={e.id}>
              {i > 0 && ", "}
              <a
                href={e.url}
                target="_blank"
                rel="noreferrer"
                className="text-brass underline underline-offset-4"
              >
                {e.id}
              </a>
            </span>
          ))}
        </>
      )}
    </p>
  );
}

function CostChip({ rung }: { rung: Rung }) {
  return isPaid(rung) ? (
    <Chip colour="#ffd34d">PAID: not used</Chip>
  ) : (
    <Chip colour="var(--color-brass)">Free</Chip>
  );
}

function RungSheet({ inst, level, index }: { inst: AvInstitution; level: AvLevel; index: number }) {
  const rung = level.rung as Rung;
  const sent = level.items.filter((i) => avenueEmails[i].out).length;
  const got = level.items.length - sent;
  const dates = level.items.map((i) => avenueEmails[i].d);
  const fees = level.items.filter(isFee);
  const next = inst.levels.slice(index + 1).find((l) => l.rung && l.rung.st === "open");
  return (
    <div>
      <p className="text-xs tracking-[0.16em] text-brass uppercase">
        {instNumber(inst.id)} · {inst.short} · rung {index + 1} of {inst.levels.length}
      </p>
      <h2 className="mt-1 font-serif text-2xl leading-tight">{rung.t}</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        <Chip colour={statusInfo[level.status].colour}>{rampStateInfo[rung.st].label}</Chip>
        <CostChip rung={rung} />
      </div>
      <p className="mt-3 text-sm leading-relaxed text-muted">{rung.w}</p>
      {rung.did && (
        <p className="mt-2 text-sm leading-relaxed text-fg">
          <span className="text-brass">So far: </span>
          {rung.did}
        </p>
      )}
      {rung.next && <p className="mt-2 text-sm leading-relaxed text-fg">Next: {rung.next}</p>}
      <div className="mt-3">
        <Row k="Time limit" v={rung.time && rung.time !== "—" ? rung.time : undefined} />
        <Row k="Cost" v={rung.cost && rung.cost !== "—" ? rung.cost : undefined} />
        <Row k="Emails" v={level.items.length ? `${sent} sent · ${got} received` : undefined} />
        <Row
          k="First / last"
          v={
            dates.length ? `${fmtDate(dates[0])} – ${fmtDate(dates[dates.length - 1])}` : undefined
          }
        />
        <Row
          k="Still open"
          v={
            level.open.length || level.late.length
              ? `${level.open.length + level.late.length} thread(s)`
              : undefined
          }
        />
        <Row k="Next open rung" v={next?.rung?.t} />
      </div>
      <LegalBasis rung={rung} />
      <FeeList list={fees} />
    </div>
  );
}

function RampRoadmap({ inst }: { inst: AvInstitution }) {
  const ramp = inst.ramp!;
  const n = (st: string) => ramp.rungs.filter((r) => r.st === st).length;
  return (
    <div>
      <p className="text-xs tracking-[0.16em] text-brass uppercase">
        Ramp · {ramp.rungs.length} rungs
      </p>
      <h2 className="mt-1 font-serif text-2xl leading-tight">
        {instNumber(inst.id)} · {inst.name}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">{ramp.kind}</p>
      <p className="mt-2 text-sm leading-relaxed text-fg">{ramp.note}</p>
      <p className="mt-2 text-sm text-muted">
        {n("done")} done · {n("pending") + n("overdue")} pending
        {n("overdue") ? ` (${n("overdue")} overdue)` : ""}
        {n("queued") ? ` · ${n("queued")} queued` : ""} · {n("open")} open · {n("na")} not used
      </p>
      <ol className="mt-3 flex flex-col-reverse gap-2">
        {inst.levels.map((l, i) => {
          const r = l.rung as Rung;
          return (
            <li key={r.k} className="flex items-start gap-2 text-sm">
              <span
                className="mt-1 size-3 shrink-0 rounded-sm"
                style={{ background: statusInfo[l.status].colour }}
              />
              <span className="min-w-0">
                <span className={r.st === "na" ? "text-faint line-through" : "text-fg"}>
                  {i + 1}. {r.t}
                </span>
                {isPaid(r) && <span className="text-[#ffd34d]"> · PAID</span>}
                {l.items.length ? <span className="text-faint"> · {l.items.length}</span> : null}
                <br />
                <a
                  href={r.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-brass underline underline-offset-2"
                >
                  {r.law}
                </a>
              </span>
            </li>
          );
        })}
      </ol>
      <p className="mt-4 text-xs leading-relaxed text-faint">{ramps.note}</p>
    </div>
  );
}

function Home() {
  const [instId, setInstId] = useState("llandough");
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const inst = useMemo(
    () => institutions.find((i) => i.id === instId) ?? institutions[0],
    [instId],
  );
  const close = useCallback(() => setSheet(null), []);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col gap-4 px-3 pt-3 pb-10">
      <section aria-label="Dartboard">
        <DartWheel
          highlight={inst.id}
          onPick={({ party, ring, slice }) => {
            if (slice.inst) setInstId(slice.inst.id);
            setSheet({ kind: "cell", party, ring, slice });
          }}
        />
      </section>

      <section aria-label="Avenues game">
        <AvenueGame
          instId={inst.id}
          onInstChange={(id) => {
            setInstId(id);
            setSheet((s) => (s?.kind === "game" && s.slide ? null : s));
          }}
          onHit={(hit, i) => setSheet({ kind: "game", hit, inst: i })}
          onSlide={(pick, i) =>
            setSheet((s) => {
              if (!pick) return s?.kind === "game" && s.slide ? null : s;
              const { index, level, ...slide } = pick;
              return { kind: "game", hit: { kind: "email", index, level }, inst: i, slide };
            })
          }
        />
        <ExchangeLegend onMore={() => setSheet({ kind: "key" })} />
      </section>

      <button
        type="button"
        onClick={() => setSheet({ kind: "key" })}
        aria-label="Colour key and sources"
        className="mx-auto flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-2"
      >
        {(["done", "progress", "overdue", "available", "na"] as const).map((s) => (
          <span
            key={s}
            className="size-3 rounded-full"
            style={{ background: statusInfo[s].colour }}
          />
        ))}
      </button>

      <CourtTiles
        onOpen={(k) => {
          const cid = courtInstitutions.some((c) => c.id === inst.id) ? inst.id : courtInstitutions[0].id;
          setSheet(k === "art" ? { kind: "art" } : { kind: k, inst: cid });
        }}
      />

      <DetailModal
        open={sheet !== null}
        onClose={close}
        accent={sheetAccent(sheet)}
        dock={sheet?.kind === "game" && sheet.slide ? sheet.slide.dock : undefined}
      >
        {sheet?.kind === "cell" && (
          <CellSheet party={sheet.party} ring={sheet.ring} slice={sheet.slice} />
        )}
        {sheet?.kind === "game" && (
          <GameSheet
            hit={sheet.hit}
            inst={sheet.inst}
            slide={sheet.slide}
            open={(h) => setSheet({ kind: "game", hit: h, inst: sheet.inst })}
          />
        )}
        {sheet?.kind === "key" && <KeySheet />}
        {sheet?.kind === "corr" && (
          <CorrSheet instId={sheet.inst} onInst={(id) => setSheet({ kind: "corr", inst: id })} />
        )}
        {sheet?.kind === "art" && <ArtifactsSheet onInst={(id) => setSheet({ kind: "corr", inst: id })} />}
        {sheet?.kind === "opt" && (
          <OptionsSheet instId={sheet.inst} onInst={(id) => setSheet({ kind: "opt", inst: id })} />
        )}
      </DetailModal>
    </main>
  );
}

function sheetAccent(sheet: Sheet | null) {
  if (!sheet) return undefined;
  if (sheet.kind === "cell") return statusMeta[resolveCell(sheet.party, sheet.ring).status].swatch;
  if (sheet.kind === "game") {
    const h = sheet.hit;
    if (h.kind === "email") return outcomeInfo[avenueEmails[h.index].o].colour;
    if (h.kind === "level") return statusInfo[h.level.status].colour;
  }
  return undefined;
}

function CellSheet({ party, ring, slice }: { party: Party; ring: Ring; slice: WheelSlice }) {
  const cell = resolveCell(party, ring);
  const step = rings.findIndex((r) => r.id === ring.id) + 1;
  const fees = sliceFees(slice, ring);
  const url = recordUrl(cell.url, cell.title, cell.date, cell.ref);
  const heading = slice.inst ? `${slice.num} · ${slice.inst.name}` : party.name;
  const sub = slice.inst && party.name !== slice.inst.name ? party.name : null;
  return (
    <div>
      <p className="text-xs tracking-[0.16em] text-brass uppercase">{heading}</p>
      {sub && <p className="text-xs text-faint">{sub}</p>}
      <h2 className="mt-1 font-serif text-2xl leading-tight">{cell.title}</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        <Chip colour={statusMeta[cell.status].swatch}>{statusMeta[cell.status].label}</Chip>
        <Chip colour="var(--color-brass)">
          Ring {step}: {ring.name}
        </Chip>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-muted">{cell.detail}</p>
      <div className="mt-3">
        <Row k="Date" v={cell.date} />
        <Row k="Reference" v={cell.ref} />
        <Row k="From" v={cell.correspondent} />
        <Row
          k="Fee"
          v={cell.feeMarker ? "$ A fee, cost estimate or chargeable route is recorded" : undefined}
        />
      </div>
      <FeeList list={fees} />
      <DocList docs={cell.docs} />
      {url && (
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-block text-sm text-brass underline underline-offset-4"
        >
          Open email
        </a>
      )}
    </div>
  );
}

function emailSummary(inst: AvInstitution, level: AvLevel, index: number) {
  const e = avenueEmails[index];
  const ph = phases[level.phase].name;
  const ref = e.r.length ? ` (ref ${e.r[0]})` : "";
  if (e.out) {
    const late = level.late.includes(e.t);
    const waiting = level.open.includes(e.t);
    const state = late
      ? "overdue, no answer found"
      : waiting
        ? "no answer found in this thread yet"
        : "answered or moved on";
    return `We wrote to ${inst.short} on the ${ph} avenue${ref}; ${state}.`;
  }
  const fee = isFee(index) ? " It sought or mentioned a fee." : "";
  return `${inst.short} replied on the ${ph} avenue${ref}: ${outcomeInfo[e.o].label.toLowerCase()}.${fee}`;
}

function GameSheet({
  hit,
  inst,
  slide,
  open,
}: {
  hit: GameHit;
  inst: AvInstitution;
  slide?: { pos: number; total: number };
  open?: (hit: GameHit) => void;
}) {
  if (hit.kind === "diamond") return <DiamondSheet index={hit.index} inst={inst} />;
  if (hit.kind === "email") {
    const e = avenueEmails[hit.index];
    const ph = phases[hit.level.phase];
    const others = e.i
      .filter((id) => id !== inst.id)
      .map((id) => institutions.find((x) => x.id === id)?.short ?? id);
    const waiting = hit.level.open.includes(e.t);
    const late = hit.level.late.includes(e.t);
    const link = emailUrl(hit.index);
    return (
      <div>
        {slide && (
          <p className="mb-1 text-[11px] text-faint">
            Email {slide.pos} of {slide.total} on this climb · drag him on, or use the arrow keys
          </p>
        )}
        <p className="text-xs tracking-[0.16em] text-brass uppercase">
          {e.out ? "Our email" : `From ${inst.short}`} · {ph.name}
        </p>
        <h2 className="mt-1 text-lg leading-snug font-medium">{e.s || "(no subject)"}</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {e.out ? (
            <Chip
              colour={
                late
                  ? statusInfo.overdue.colour
                  : waiting
                    ? statusInfo.progress.colour
                    : statusInfo.done.colour
              }
            >
              {late
                ? "Overdue (hand-checked)"
                : waiting
                  ? "No answer found in this thread yet"
                  : "Answered or moved on"}
            </Chip>
          ) : (
            <Chip colour={outcomeInfo[e.o].colour}>{outcomeInfo[e.o].label}</Chip>
          )}
          {isFee(hit.index) && <Chip colour="#ffd34d">$ Fee sought or mentioned</Chip>}
        </div>
        {isFee(hit.index) && (
          <p className="mt-3 text-sm leading-snug text-[#ffd34d]">$ {feeNotes[hit.index]}</p>
        )}
        <DrawnAs
          index={hit.index}
          inst={inst}
          onDiamond={
            open ? () => open({ kind: "diamond", index: hit.index, level: hit.level }) : undefined
          }
        />
        <div className="mt-3">
          <Row k="Date" v={fmtDate(e.d)} />
          <Row k="Direction" v={e.out ? "Sent" : "Received"} />
          <Row k="From" v={e.from} />
          <Row k="Summary" v={e.sum ?? emailSummary(inst, hit.level, hit.index)} />
          <Row k="Reference" v={e.r.join(", ")} />
          <Row k="Avenue" v={ph.name} />
          <Row k="Also counts for" v={others.join(", ")} />
        </div>
        <DocList docs={e.pdf} />
        {e.q && e.q.length > 0 && (
          <div className="mt-3">
            <p className="text-xs tracking-[0.16em] text-brass uppercase">
              Key passages (verbatim)
            </p>
            <ul className="mt-1.5 flex flex-col gap-2">
              {e.q.map((q, n) => (
                <li
                  key={n}
                  className="border-l-2 border-brass/50 pl-2 text-sm leading-snug text-muted"
                >
                  “{q}”
                </li>
              ))}
            </ul>
          </div>
        )}
        <p className="mt-3 text-xs text-faint">
          {e.out || e.sum ? "" : "Outcome is read automatically from the reply and may be wrong. "}
          {waiting && !late ? "A reply may sit in another thread. " : ""}
        </p>
        <a
          href={link.url}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-block text-sm text-brass underline underline-offset-4"
        >
          {link.exact ? "Open email" : "Find this email in the archive"}
        </a>
      </div>
    );
  }
  if (hit.kind === "level")
    return <LevelSheet inst={inst} level={hit.level} index={hit.levelIndex} />;
  return <RoadmapSheet inst={inst} />;
}

function LevelSheet({
  inst,
  level,
  index,
}: {
  inst: AvInstitution;
  level: AvLevel;
  index: number;
}) {
  if (level.rung) return <RungSheet inst={inst} level={level} index={index} />;
  const ph = phases[level.phase];
  const sent = level.items.filter((i) => avenueEmails[i].out).length;
  const got = level.items.length - sent;
  const next = nextAvenue(inst, index);
  const dates = level.items.map((i) => avenueEmails[i].d);
  const fees = level.items.filter(isFee);
  return (
    <div>
      <p className="text-xs tracking-[0.16em] text-brass uppercase">
        {instNumber(inst.id)} · {inst.name} · level {index + 1} of {inst.levels.length}
      </p>
      <h2 className="mt-1 font-serif text-2xl leading-tight">{ph.name}</h2>
      <div className="mt-3">
        <Chip colour={statusInfo[level.status].colour}>{statusInfo[level.status].label}</Chip>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-muted">{level.note || ph.what}</p>
      {level.hand && <p className="mt-2 text-sm leading-relaxed text-fg">{level.hand}</p>}
      <div className="mt-3">
        <Row k="Law" v={ph.law !== "—" ? ph.law : undefined} />
        <Row k="Emails" v={level.items.length ? `${sent} sent · ${got} received` : undefined} />
        <Row
          k="First / last"
          v={
            dates.length ? `${fmtDate(dates[0])} – ${fmtDate(dates[dates.length - 1])}` : undefined
          }
        />
        <Row
          k="Deadline"
          v={
            level.deadline && level.status !== "done"
              ? `about ${fmtDate(level.deadline)}`
              : undefined
          }
        />
        <Row
          k="Still open"
          v={
            level.open.length || level.late.length
              ? `${level.open.length + level.late.length} thread(s)`
              : undefined
          }
        />
        <Row k="Next avenue" v={next ? phases[next.phase].name : undefined} />
      </div>
      <FeeList list={fees} />
    </div>
  );
}

function RoadmapSheet({ inst }: { inst: AvInstitution }) {
  if (inst.ramp) return <RampRoadmap inst={inst} />;
  const used = inst.levels.filter((l) => l.status === "done").length;
  const open = inst.levels.filter((l) => l.status === "progress" || l.status === "overdue").length;
  const left = inst.levels.filter((l) => l.status === "available").length;
  return (
    <div>
      <p className="text-xs tracking-[0.16em] text-brass uppercase">Roadmap</p>
      <h2 className="mt-1 font-serif text-2xl leading-tight">
        {instNumber(inst.id)} · {inst.name}
      </h2>
      <p className="mt-2 text-sm text-muted">
        {used} used up · {open} open · {left} not used yet
      </p>
      <ol className="mt-3 flex flex-col-reverse gap-1.5">
        {inst.levels.map((l, i) => (
          <li key={l.phase} className="flex items-start gap-2 text-sm">
            <span
              className="mt-1 size-3 shrink-0 rounded-sm"
              style={{ background: statusInfo[l.status].colour }}
            />
            <span className={l.status === "na" ? "text-faint line-through" : "text-fg"}>
              {i + 1}. {phases[l.phase].name}
              {l.items.length ? <span className="text-faint"> · {l.items.length}</span> : null}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** Small inline-SVG versions of the climb's own sprites, for the legend and sheets. */
function GridSvg({
  grid,
  pal,
  size = 16,
}: {
  grid: string[];
  pal: Record<string, string>;
  size?: number;
}) {
  const rows = grid.length;
  const cols = grid[0].length;
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${Math.max(rows, cols)} ${Math.max(rows, cols)}`}
      aria-hidden="true"
      shapeRendering="crispEdges"
    >
      {grid.flatMap((row, r) =>
        [...row].map((ch, c) =>
          ch === "." ? null : (
            <rect
              key={`${r}-${c}`}
              x={c + (Math.max(rows, cols) - cols) / 2}
              y={r + (Math.max(rows, cols) - rows) / 2}
              width={1.05}
              height={1.05}
              fill={pal[ch] ?? ch}
            />
          ),
        ),
      )}
    </svg>
  );
}
function FireIcon({ size = 16 }: { size?: number }) {
  return <GridSvg grid={FIRE_A} pal={PAL} size={size} />;
}
function HeartIcon({ size = 16, phone = false }: { size?: number; phone?: boolean }) {
  return (
    <span className="relative inline-flex" style={{ width: size, height: size }}>
      <GridSvg grid={HEART} pal={{ r: PAL.h }} size={size} />
      <svg
        className="absolute inset-0"
        width={size}
        height={size}
        viewBox="0 0 16 16"
        aria-hidden="true"
      >
        {phone ? (
          <path
            d="M5.2 5.2c.5-.5 1.1-.4 1.4.1l.6 1c.2.4.1.8-.2 1.1l-.4.3c.4.8 1 1.4 1.8 1.8l.3-.4c.3-.3.7-.4 1.1-.2l1 .6c.5.3.6.9.1 1.4-.9.9-2.3.9-3.8-.3-1.3-1-2.3-2.4-2.4-3.5 0-.7.2-1.4.5-1.9z"
            fill="#fff6d6"
          />
        ) : (
          <g>
            <rect x="4.6" y="4.6" width="6.8" height="4.6" fill="#fff6d6" />
            <path d="M4.6 4.6 8 7.4 11.4 4.6" stroke={PAL.h} strokeWidth="0.9" fill="none" />
          </g>
        )}
      </svg>
    </span>
  );
}
function PhoneIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M3.6 2.8c.8-.8 1.8-.6 2.3.2l1 1.6c.3.6.2 1.3-.3 1.8l-.6.5c.7 1.3 1.6 2.2 2.9 2.9l.5-.6c.5-.5 1.2-.6 1.8-.3l1.6 1c.8.5 1 1.5.2 2.3-1.5 1.5-3.8 1.4-6.2-.5C4.6 10 3 7.7 2.8 5.9c-.1-1.2.2-2.3.8-3.1z"
        fill="#e0301e"
      />
    </svg>
  );
}
function CloudIcon({ n, size = 18 }: { n: number; size?: number }) {
  return (
    <svg width={size} height={size * 0.8} viewBox="0 0 20 16" aria-hidden="true">
      <path d="M5 14h10.5a3.5 3.5 0 0 0 .4-7 5 5 0 0 0-9.6-.9A3.9 3.9 0 0 0 5 14z" fill="#eef3ff" />
      <text x="10.4" y="12" textAnchor="middle" fontSize="7.5" fontWeight="800" fill="#1b2440">
        {n}
      </text>
    </svg>
  );
}
function DiamondIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" aria-hidden="true">
      <path d="M6 1 10.5 6 6 11 1.5 6z" fill="#5ee6ff" />
      <rect x="5" y="3" width="1.5" height="1.5" fill="#e9fdff" />
    </svg>
  );
}

/** The one-line legend under the climb; tapping it opens the full key. */
function ExchangeLegend({ onMore }: { onMore: () => void }) {
  return (
    <button
      type="button"
      onClick={onMore}
      aria-label="What the icons mean"
      className="mt-2 flex w-full flex-wrap items-center justify-center gap-x-3 gap-y-1 rounded-xl border border-line bg-surface px-3 py-2 text-[11px] text-muted"
    >
      <span className="inline-flex items-center gap-1">
        <CloudIcon n={1} /> our email
      </span>
      <span className="inline-flex items-center gap-1">
        <FireIcon /> their reply
      </span>
      <span className="inline-flex items-center gap-1">
        <HeartIcon /> satisfactory
      </span>
      <span className="inline-flex items-center gap-1">
        <PhoneIcon /> call
      </span>
      <span className="inline-flex items-center gap-1">
        <DiamondIcon /> attachment
      </span>
      <span className="inline-flex items-center gap-1 opacity-40">
        <FireIcon /> generic
      </span>
    </button>
  );
}

/** How one exchange is drawn on the climb, and why (from correspondence.json). */
function DrawnAs({
  index,
  inst,
  onDiamond,
}: {
  index: number;
  inst: AvInstitution;
  onDiamond?: () => void;
}) {
  const c = corr(index);
  const icon =
    c.kind === "his" ? (
      <CloudIcon n={cloudNumber(inst, index)} />
    ) : c.kind === "phone" ? (
      c.heart ? (
        <HeartIcon phone />
      ) : (
        <PhoneIcon />
      )
    ) : c.heart ? (
      <HeartIcon />
    ) : (
      <FireIcon />
    );
  const what =
    c.kind === "his"
      ? `Our email no. ${cloudNumber(inst, index)} to ${inst.short}`
      : c.kind === "phone"
        ? c.heart
          ? "A phone call, and a good one"
          : "A phone call"
        : c.heart
          ? "Reply judged fully satisfactory"
          : "Their reply";
  return (
    <div className="mt-3 rounded-xl border border-line bg-surface/60 p-3">
      <p className="flex items-center gap-2 text-sm text-fg">
        <span className={c.generic ? "opacity-40" : ""}>{icon}</span>
        {what}
        {c.generic ? " · generic (faded)" : ""}
      </p>
      {c.why && <p className="mt-1.5 text-xs leading-snug text-muted">{c.why}</p>}
      {c.doubt && (
        <p className="mt-1.5 text-xs leading-snug text-faint">Classification note: {c.doubt}</p>
      )}
      {c.diamonds.length > 0 && onDiamond && (
        <button
          type="button"
          onClick={onDiamond}
          className="mt-2 inline-flex items-center gap-1.5 text-sm text-[#5ee6ff] underline underline-offset-4"
        >
          <DiamondIcon />{" "}
          {c.diamonds.length === 1
            ? "See the attachment"
            : `See the ${c.diamonds.length} attachments`}
        </button>
      )}
    </div>
  );
}

/** Tapping a diamond: the attachment's page in the Wayback archive, with a plain description and our reading. */
function DiamondSheet({ index, inst }: { index: number; inst: AvInstitution }) {
  const e = avenueEmails[index];
  const list = corr(index).diamonds;
  const [pick, setPick] = useState(0);
  const d = list[Math.min(pick, list.length - 1)];
  if (!d) return null;
  return (
    <div>
      <p className="flex items-center gap-1.5 text-xs tracking-[0.16em] text-[#5ee6ff] uppercase">
        <DiamondIcon /> Attachment · {inst.short} · {fmtDate(e.d)}
      </p>
      <h2 className="mt-1 text-lg leading-snug font-medium">{d.label}</h2>
      {list.length > 1 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {list.map((x, k) => (
            <button
              key={x.wayback + k}
              type="button"
              onClick={() => setPick(k)}
              className={`rounded-full border px-2.5 py-1 text-xs ${k === pick ? "border-[#5ee6ff] text-fg" : "border-line text-muted"}`}
            >
              {k + 1}
            </button>
          ))}
        </div>
      )}
      <div className="mt-3 overflow-hidden rounded-xl border border-line bg-white">
        {/\.pdf$/i.test(d.wayback) ? (
          // PDF: shown inline where the phone can; otherwise the covering email's page in the archive
          <object
            key={d.wayback}
            data={d.wayback}
            type="application/pdf"
            aria-label={d.label}
            className="block h-[55vh] max-h-[460px] min-h-[260px] w-full"
          >
            <iframe
              src={d.page}
              title={d.label}
              loading="lazy"
              className="block h-[55vh] max-h-[460px] min-h-[260px] w-full"
            />
          </object>
        ) : (
          <iframe
            key={d.wayback}
            src={d.wayback}
            title={d.label}
            loading="lazy"
            className="block h-[55vh] max-h-[460px] min-h-[260px] w-full"
          />
        )}
      </div>
      <p className="mt-2 text-xs">
        <a
          href={d.wayback}
          target="_blank"
          rel="noreferrer"
          className="text-brass underline underline-offset-4"
        >
          Open the attachment
        </a>
        {d.page !== d.wayback && (
          <>
            {" · "}
            <a
              href={d.page}
              target="_blank"
              rel="noreferrer"
              className="text-brass underline underline-offset-4"
            >
              Covering email
            </a>
          </>
        )}
        {" · "}
        <a
          href={d.wiki}
          target="_blank"
          rel="noreferrer"
          className="text-brass underline underline-offset-4"
        >
          More info
        </a>
        <span className="text-faint"> (Legal Wiki)</span>
      </p>
      <div className="mt-3">
        <p className="text-xs tracking-[0.16em] text-brass uppercase">What it is</p>
        <p className="mt-1 text-sm leading-relaxed text-fg">{d.desc}</p>
      </div>
      <div className="mt-3 rounded-xl border border-brass/30 bg-brass/5 p-3">
        <p className="text-xs tracking-[0.16em] text-brass uppercase">Our reading (prospective)</p>
        <p className="mt-1 text-sm leading-relaxed text-muted">{d.reading}</p>
      </div>
      <p className="mt-4 text-[11px] leading-snug text-faint">
        Our case, prospective. Not a finding of any court.
      </p>
    </div>
  );
}

function KeySheet() {
  return (
    <div>
      <h2 className="font-serif text-2xl">Key</h2>
      <div className="mt-3 flex flex-col gap-2">
        {(["done", "progress", "overdue", "available", "na"] as const).map((s) => (
          <Chip key={s} colour={statusInfo[s].colour}>
            {statusInfo[s].label}
          </Chip>
        ))}
      </div>
      <p className="mt-4 text-sm leading-relaxed text-muted">
        Top: the dartboard. Each slice is an institution, each ring a step inward from first enquiry
        to tribunal. Below: pick an institution. The ape is that institution and its fireballs are
        its replies; the climber is the requester. Each girder is one rung of that institution's own
        ladder, built from UK law and the body's own policies: first step at the bottom, court
        routes at the top. Tap a girder for its time limit, cost and legal basis; PAID marks a route
        that costs money. Tap anything for details. The number on each outer slice matches the
        number in the dropdown. A yellow $ marks where the institution sought or mentioned a fee: a
        cost-limit refusal, a fees notice, or a copy or search charge.
      </p>
      <div className="mt-4 flex flex-col gap-2 text-sm text-muted">
        <p className="flex items-center gap-2">
          <CloudIcon n={1} /> Our email to that body, numbered in order: 1 is the first, 2 the
          second, and so on.
        </p>
        <p className="flex items-center gap-2">
          <FireIcon /> Their reply.
        </p>
        <p className="flex items-center gap-2">
          <HeartIcon /> A reply that was fully satisfactory: every question answered and nothing
          more they could have done. When in doubt it stays a fire.
        </p>
        <p className="flex items-center gap-2">
          <PhoneIcon /> A phone call. <HeartIcon phone /> A good call.
        </p>
        <p className="flex items-center gap-2">
          <DiamondIcon /> On the girder under a reply: they attached something. Tap the diamond to
          see it.
        </p>
        <p className="flex items-center gap-2">
          <span className="opacity-40">
            <FireIcon />
          </span>{" "}
          Faded: a generic note (thanks, an acknowledgement, an automatic reply).
        </p>
        <p className="text-xs text-faint">
          The classification is kept in one file (src/data/correspondence.json) and corrected by
          hand.
        </p>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {(Object.keys(outcomeInfo) as (keyof typeof outcomeInfo)[]).map((o) => (
          <Chip key={o} colour={outcomeInfo[o].colour}>
            {outcomeInfo[o].label}
          </Chip>
        ))}
      </div>
      <p className="mt-4 text-xs leading-relaxed text-faint">
        From the family mailbox, read through {sampledThrough}; roadmap statuses as of{" "}
        {fmtDate(avenuesAsOf)}. Outcomes are read automatically and can be wrong; only levels marked
        hand-checked are verified. No contact details; officials by role. Contested history is
        attributed to the named person who gave it, and nothing here is a finding of fact or
        wrongdoing.{" "}
        <a className="text-brass underline" href="/data/foi-tracker.csv">
          Tracker (CSV)
        </a>
      </p>
    </div>
  );
}
