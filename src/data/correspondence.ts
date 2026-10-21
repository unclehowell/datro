import corrJson from "./correspondence.json";
import { avenueEmails, emailLinks, extraIndex, type AvInstitution } from "./avenues";

/**
 * Visual correspondence (21 Oct 2026). How each exchange is drawn on the climb:
 * our emails are numbered clouds, their replies are fires (hearts when fully satisfactory),
 * calls are phones, generic notes are faded to 40%, and a diamond under a reply marks a real attachment.
 * The classification lives in correspondence.json so it can be corrected by hand.
 */
export type CorrKind = "his" | "theirs" | "phone";
/** wayback = the attachment in the Wayback archive; page = the covering email's page there; wiki = its Legal Wiki page. */
export type CorrDiamond = {
  label: string;
  wayback: string;
  page: string;
  wiki: string;
  desc: string;
  reading: string;
};
type CorrItem = {
  k: CorrKind;
  g?: number;
  h?: number;
  a?: number;
  why?: string;
  doubt?: string;
  gm?: string;
};
type CorrFile = {
  emails: Record<string, CorrItem>;
  extra: (CorrItem & { id: string; link?: string })[];
  diamonds: Record<string, CorrDiamond[]>;
};
const file = corrJson as unknown as CorrFile;

const byIndex = new Map<number, CorrItem & { key: string }>();
for (const [k, v] of Object.entries(file.emails)) byIndex.set(Number(k), { ...v, key: k });
for (const x of file.extra) {
  const i = extraIndex[x.id];
  if (i === undefined) continue;
  byIndex.set(i, { ...x, key: x.id });
  if (x.link && !emailLinks[i]) emailLinks[i] = x.link;
}

export type Corr = {
  kind: CorrKind;
  generic: boolean;
  heart: boolean;
  diamonds: CorrDiamond[];
  why?: string;
  doubt?: string;
};

export function corr(index: number): Corr {
  const c = byIndex.get(index);
  const e = avenueEmails[index];
  if (!c)
    return {
      kind: e.out ? "his" : "theirs",
      generic: !e.out && (e.o === "auto" || e.o === "ack"),
      heart: false,
      diamonds: [],
    };
  return {
    kind: c.k,
    generic: !!c.g,
    heart: !!c.h && c.k !== "his",
    diamonds: file.diamonds[c.key] ?? [],
    why: c.why,
    doubt: c.doubt,
  };
}

/** Our emails to one body, numbered 1, 2, 3 … in date order across all its avenues. */
const numbers = new Map<string, Map<number, number>>();
export function cloudNumber(inst: AvInstitution, index: number): number {
  let m = numbers.get(inst.id);
  if (!m) {
    const seen = new Set<number>();
    for (const l of inst.levels) for (const i of l.items) if (corr(i).kind === "his") seen.add(i);
    const list = [...seen].sort(
      (a, b) => avenueEmails[a].d.localeCompare(avenueEmails[b].d) || a - b,
    );
    m = new Map(list.map((i, k) => [i, k + 1]));
    numbers.set(inst.id, m);
  }
  return m.get(index) ?? 0;
}

export const corrAbout = "Our case, prospective. Not a finding of any court.";
