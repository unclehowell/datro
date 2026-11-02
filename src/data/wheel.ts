import { parties, resolveCell, rings, type Cell, type Kind, type Party, type Ring, type RingId, type Status } from "@/data/disclosure";
import { avenueEmails, emailUrl, feeNotes, institutions, isFee, outcomeInfo, type AvInstitution, type Outcome, type PhaseKey } from "@/data/avenues";

/**
 * The wheel has one slice per institution, in the same order and with the same number as the
 * game's dropdown, plus the family-testimony slice (marked F). Institutions that have a
 * hand-written slice in disclosure.ts use it; the rest are built from their avenues and emails.
 */

/** Which wheel ring each avenue counts towards (outside = first contact, bull = court). */
export const phaseRing: Record<PhaseKey, RingId> = {
  enquiry: "open",
  foi: "open",
  eir: "open",
  sar: "open",
  review: "review",
  complaint: "complaint",
  ico: "regulator",
  icr: "regulator",
  psow: "regulator",
  phso: "regulator",
  iopc: "regulator",
  iac: "regulator",
  ccw: "regulator",
  charity: "regulator",
  regulator: "regulator",
  democratic: "democratic",
  petition: "democratic",
  register: "forum",
  courtrec: "forum",
  tribunal: "forum",
  preaction: "forum",
  disclosure: "forum",
};

/** Replies on first-contact avenues land in the "reply" ring; everything else in its own ring. */
function ringFor(phase: PhaseKey, out: boolean): RingId {
  const r = phaseRing[phase];
  return r === "open" && !out ? "reply" : r;
}

const outcomeStatus: Record<Outcome, Status> = {
  sent: "dormant",
  auto: "dormant",
  ack: "dormant",
  reply: "evidence",
  answered: "evidence",
  notheld: "closed",
  refused: "nuisance",
};

const kindOf = (inst: AvInstitution): Kind =>
  inst.kind === "private" || inst.kind === "law-firm" ? "private" : inst.kind === "members" ? "political" : "authority";

const fmt = (d: string) => {
  const t = new Date(`${d}T12:00:00Z`);
  return Number.isNaN(t.getTime()) ? d : t.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
};

/** Emails of this institution, grouped by the wheel ring they count towards. */
export function ringEmails(inst: AvInstitution): Record<RingId, number[]> {
  const out = { open: [], reply: [], chase: [], review: [], complaint: [], regulator: [], democratic: [], forum: [] } as Record<RingId, number[]>;
  for (const level of inst.levels) {
    for (const i of level.items) {
      const r = ringFor(level.phase, avenueEmails[i].out);
      if (!out[r].includes(i)) out[r].push(i);
    }
  }
  for (const k of Object.keys(out) as RingId[]) out[k].sort((a, b) => avenueEmails[a].d.localeCompare(avenueEmails[b].d) || a - b);
  return out;
}

function synthParty(inst: AvInstitution): Party {
  const groups = ringEmails(inst);
  const cells: Partial<Record<RingId, Cell>> = {};
  for (const ring of rings) {
    const list = groups[ring.id];
    if (!list.length) continue;
    const sent = list.filter((i) => avenueEmails[i].out).length;
    const got = list.length - sent;
    const replies = list.filter((i) => !avenueEmails[i].out);
    const lastReply = replies[replies.length - 1];
    const last = list[list.length - 1];
    const e = avenueEmails[lastReply ?? last];
    cells[ring.id] = {
      status: lastReply !== undefined ? outcomeStatus[avenueEmails[lastReply].o] : "dormant",
      title: `${sent} sent · ${got} received`,
      date: fmt(e.d),
      ref: e.r.join(", ") || undefined,
      url: emailUrl(lastReply ?? last).url,
      detail: `Latest: ${fmt(e.d)}, “${e.s}” (${outcomeInfo[e.o].label.toLowerCase()}). Built from the mailbox.`,
    };
  }
  return { id: inst.id, name: inst.name, short: inst.short, kind: kindOf(inst), remit: "", cells };
}

export type WheelSlice = {
  /** 1..N, the same number as the dropdown; null for the family slice. */
  num: number | null;
  label: string;
  inst: AvInstitution | null;
  /** The parties whose hand-written cells feed this slice (empty = built from emails). */
  sources: Party[];
  synth: Party | null;
};

export const wheelSlices: WheelSlice[] = [
  ...institutions.map((inst, k) => {
    const sources = inst.wheel.map((id) => parties.find((p) => p.id === id)).filter((p): p is Party => Boolean(p));
    return { num: k + 1, label: String(k + 1), inst, sources, synth: sources.length ? null : synthParty(inst) };
  }),
  ...parties
    .filter((p) => p.kind === "family")
    .map((p) => ({ num: null, label: "F", inst: null, sources: [p], synth: null })),
];

/** The party and cell shown for one slice and ring: the first hand-written cell that exists. */
export function sliceCell(slice: WheelSlice, ring: Ring): { party: Party; cell: Cell; taken: boolean } {
  if (slice.synth) {
    const cell = resolveCell(slice.synth, ring);
    return { party: slice.synth, cell, taken: Boolean(slice.synth.cells[ring.id]) };
  }
  const withCell = slice.sources.find((p) => p.cells[ring.id]);
  const party = withCell ?? slice.sources[0];
  return { party, cell: resolveCell(party, ring), taken: Boolean(withCell) };
}

/** Fee-flagged replies of this slice's institution that count towards this ring. */
export function sliceFees(slice: WheelSlice, ring: Ring): number[] {
  if (!slice.inst) return [];
  return ringEmails(slice.inst)[ring.id].filter(isFee);
}

export function sliceHasFee(slice: WheelSlice, ring: Ring): boolean {
  if (sliceFees(slice, ring).length) return true;
  return slice.sources.some((p) => p.cells[ring.id]?.feeMarker);
}

export { feeNotes };
