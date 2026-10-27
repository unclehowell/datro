import db from "./section-db.json";
import { avenueEmails, institutions, type AvInstitution, type AvLevel, type Outcome } from "./avenues";

/**
 * WhatDoTheyKnow requests, read from the dartboard section database (public/_db/section.sqlite,
 * exported to section-db.json by db/export.py). Each message becomes one more exchange on the climb,
 * appended to avenueEmails like the correspondence extras, and marked with its request id (w).
 * Only dates, direction and status are held: no message text.
 */
export type WdtkRequest = {
  id: string; inst: string; authority: string; title: string; status: string;
  first: string; last: string; sent: number; received: number;
};
type WdtkMessage = { id: string; request: string; inst: string; title: string; n: number; dir: "out" | "in"; date: string; type: string; o: string };
type Rec = { kind: string; id: string; seq: number } & Record<string, unknown>;

const records = (db as unknown as { records: Rec[] }).records;
export const wdtkRequests = records.filter((r) => r.kind === "wdtk_request") as unknown as WdtkRequest[];
const messages = records.filter((r) => r.kind === "wdtk_message") as unknown as WdtkMessage[];
export const dartboardVideo = records.find((r) => r.kind === "media" && r.id === "dartboard-long-video") as
  | ({ src: string; poster?: string; mime?: string; title?: string } & Rec)
  | undefined;

/** WDTK tint: teal, so its clouds and fires read apart from the email ones. */
export const WDTK_TINT = "#33d1b2";

const byInst = new Map<string, number[]>();
const msgOf = new Map<number, WdtkMessage>();
for (const m of messages) {
  const index = avenueEmails.length;
  avenueEmails.push({
    d: m.date,
    out: m.dir === "out",
    o: (m.o as Outcome) ?? (m.dir === "out" ? "sent" : "reply"),
    s: m.title,
    r: [],
    t: `wdtk-${m.request}`,
    i: [m.inst],
    w: m.request,
  });
  msgOf.set(index, m);
  const list = byInst.get(m.inst) ?? [];
  list.push(index);
  byInst.set(m.inst, list);
}

export const isWdtk = (index: number) => msgOf.has(index);
export const wdtkMessage = (index: number) => msgOf.get(index);
export const wdtkRequestOf = (index: number) => {
  const m = msgOf.get(index);
  return m ? wdtkRequests.find((r) => r.id === m.request) : undefined;
};
export const hasWdtk = (instId: string) => (byInst.get(instId)?.length ?? 0) > 0;
export const wdtkFor = (instId: string) => wdtkRequests.filter((r) => r.inst === instId);

/** Our WDTK messages to one body, numbered 1, 2, 3 … in date order (their own count, apart from emails). */
export function wdtkNumber(instId: string, index: number) {
  const outs = (byInst.get(instId) ?? []).filter((i) => avenueEmails[i].out);
  outs.sort((a, b) => avenueEmails[a].d.localeCompare(avenueEmails[b].d) || a - b);
  return outs.indexOf(index) + 1;
}

/** The institution's climb with its WDTK exchanges on the FOI girder, in their own lane above the emails. */
const merged = new Map<string, AvInstitution>();
export function withWdtk(inst: AvInstitution): AvInstitution {
  const list = byInst.get(inst.id);
  if (!list || !list.length) return inst;
  const hit = merged.get(inst.id);
  if (hit) return hit;
  let li = inst.levels.findIndex((l) => l.phase === "foi");
  if (li < 0) li = Math.min(1, inst.levels.length - 1);
  const sorted = [...list].sort((a, b) => avenueEmails[a].d.localeCompare(avenueEmails[b].d) || a - b);
  const levels: AvLevel[] = inst.levels.map((l, k) =>
    k === li ? { ...l, items: [...l.items, ...sorted], status: l.status === "available" ? "progress" : l.status } : l,
  );
  const out = { ...inst, levels };
  merged.set(inst.id, out);
  return out;
}

export const wdtkInstitutionCount = institutions.filter((i) => hasWdtk(i.id)).length;
