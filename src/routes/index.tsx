import { useCallback, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { resolveCell, rings, sampledThrough, statusMeta, type Party, type Ring } from "@/data/disclosure";
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
  statusInfo,
  type AvInstitution,
  type AvLevel,
} from "@/data/avenues";
import { DartWheel } from "@/components/dart-wheel";
import { sliceFees, type WheelSlice } from "@/data/wheel";
import { AvenueGame, type GameHit, type SlidePick } from "@/components/avenue-game";
import { Chip, DetailModal, Row, fmtDate } from "@/components/detail-modal";

export const Route = createFileRoute("/")({ component: Home });

type Sheet =
  | { kind: "cell"; party: Party; ring: Ring; slice: WheelSlice }
  | { kind: "game"; hit: GameHit; inst: AvInstitution; slide?: Omit<SlidePick, "index" | "level"> }
  | { kind: "key" };

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
            <a href={emailUrl(i).url} target="_blank" rel="noreferrer" className="text-brass underline underline-offset-4">
              Open email
            </a>
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

function Home() {
  const [instId, setInstId] = useState("hmlr");
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const inst = useMemo(() => institutions.find((i) => i.id === instId) ?? institutions[0], [instId]);
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
      </section>

      <button
        type="button"
        onClick={() => setSheet({ kind: "key" })}
        aria-label="Colour key and sources"
        className="mx-auto flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-2"
      >
        {(["done", "progress", "overdue", "available", "na"] as const).map((s) => (
          <span key={s} className="size-3 rounded-full" style={{ background: statusInfo[s].colour }} />
        ))}
      </button>

      <DetailModal
        open={sheet !== null}
        onClose={close}
        accent={sheetAccent(sheet)}
        dock={sheet?.kind === "game" && sheet.slide ? sheet.slide.dock : undefined}
      >
        {sheet?.kind === "cell" && <CellSheet party={sheet.party} ring={sheet.ring} slice={sheet.slice} />}
        {sheet?.kind === "game" && <GameSheet hit={sheet.hit} inst={sheet.inst} slide={sheet.slide} />}
        {sheet?.kind === "key" && <KeySheet />}
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
        <Row k="Fee" v={cell.feeMarker ? "$ A fee, cost estimate or chargeable route is recorded" : undefined} />
      </div>
      <FeeList list={fees} />
      {url && (
        <a href={url} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm text-brass underline underline-offset-4">
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
    const state = late ? "overdue, no answer found" : waiting ? "no answer found in this thread yet" : "answered or moved on";
    return `Sion wrote to ${inst.short} on the ${ph} avenue${ref}; ${state}.`;
  }
  const fee = isFee(index) ? " It sought or mentioned a fee." : "";
  return `${inst.short} replied on the ${ph} avenue${ref}: ${outcomeInfo[e.o].label.toLowerCase()}.${fee}`;
}

function GameSheet({ hit, inst, slide }: { hit: GameHit; inst: AvInstitution; slide?: { pos: number; total: number } }) {
  if (hit.kind === "email") {
    const e = avenueEmails[hit.index];
    const ph = phases[hit.level.phase];
    const others = e.i.filter((id) => id !== inst.id).map((id) => institutions.find((x) => x.id === id)?.short ?? id);
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
          {e.out ? "Sent by Sion" : `From ${inst.short}`} · {ph.name}
        </p>
        <h2 className="mt-1 text-lg leading-snug font-medium">{e.s || "(no subject)"}</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {e.out ? (
            <Chip colour={late ? statusInfo.overdue.colour : waiting ? statusInfo.progress.colour : statusInfo.done.colour}>
              {late ? "Overdue (hand-checked)" : waiting ? "No answer found in this thread yet" : "Answered or moved on"}
            </Chip>
          ) : (
            <Chip colour={outcomeInfo[e.o].colour}>{outcomeInfo[e.o].label}</Chip>
          )}
          {isFee(hit.index) && <Chip colour="#ffd34d">$ Fee sought or mentioned</Chip>}
        </div>
        {isFee(hit.index) && <p className="mt-3 text-sm leading-snug text-[#ffd34d]">$ {feeNotes[hit.index]}</p>}
        <div className="mt-3">
          <Row k="Date" v={fmtDate(e.d)} />
          <Row k="Direction" v={e.out ? "Sent" : "Received"} />
          <Row k="Summary" v={emailSummary(inst, hit.level, hit.index)} />
          <Row k="Reference" v={e.r.join(", ")} />
          <Row k="Avenue" v={ph.name} />
          <Row k="Also counts for" v={others.join(", ")} />
        </div>
        <p className="mt-3 text-xs text-faint">
          {e.out ? "" : "Outcome is read automatically from the reply and may be wrong. "}
          {waiting && !late ? "A reply may sit in another thread. " : ""}
        </p>
        <a href={link.url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm text-brass underline underline-offset-4">
          {link.exact ? "Open email" : "Find this email in the archive"}
        </a>
      </div>
    );
  }
  if (hit.kind === "level") return <LevelSheet inst={inst} level={hit.level} index={hit.levelIndex} />;
  return <RoadmapSheet inst={inst} />;
}

function LevelSheet({ inst, level, index }: { inst: AvInstitution; level: AvLevel; index: number }) {
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
        <Row k="First / last" v={dates.length ? `${fmtDate(dates[0])} – ${fmtDate(dates[dates.length - 1])}` : undefined} />
        <Row k="Deadline" v={level.deadline && level.status !== "done" ? `about ${fmtDate(level.deadline)}` : undefined} />
        <Row k="Still open" v={level.open.length || level.late.length ? `${level.open.length + level.late.length} thread(s)` : undefined} />
        <Row k="Next avenue" v={next ? phases[next.phase].name : undefined} />
      </div>
      <FeeList list={fees} />
    </div>
  );
}

function RoadmapSheet({ inst }: { inst: AvInstitution }) {
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
            <span className="mt-1 size-3 shrink-0 rounded-sm" style={{ background: statusInfo[l.status].colour }} />
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
        Top: the dartboard. Each slice is an institution, each ring a step inward from first enquiry to tribunal. Below: pick an
        institution. The ape is that institution and its barrels are its replies; the climber is Sion. Each girder is one avenue,
        first at the bottom, court-ordered disclosure at the top. Crates are emails Sion sent, small barrels are replies. Tap
        anything for details. The number on each outer slice matches the number in the dropdown. A yellow $ marks where the
        institution sought or mentioned a fee: a cost-limit refusal, a fees notice, or a copy or search charge.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {(Object.keys(outcomeInfo) as (keyof typeof outcomeInfo)[]).map((o) => (
          <Chip key={o} colour={outcomeInfo[o].colour}>
            {outcomeInfo[o].label}
          </Chip>
        ))}
      </div>
      <p className="mt-4 text-xs leading-relaxed text-faint">
        From Sion Buckler’s mailbox, read through {sampledThrough}; roadmap statuses as of {fmtDate(avenuesAsOf)}. Outcomes are read
        automatically and can be wrong; only levels marked hand-checked are verified. No contact details; officials by role. Contested
        history is attributed to the named person who gave it, and nothing here is a finding of fact or wrongdoing.{" "}
        <a className="text-brass underline" href="/data/foi-tracker.csv">
          Tracker (CSV)
        </a>
      </p>
    </div>
  );
}
