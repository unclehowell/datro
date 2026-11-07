import marksJson from "./ramp-marks.json";
import corrJson from "./correspondence.json";
import { extraIndex } from "./avenues";

/**
 * Ramp marks (0.7.1, 7 Nov 2026): the £ symbol and the 🌰 That Old Chestnut links for single replies on the
 * Avenues climb and the Roadmap to court. Data and match rules: ramp-marks.json ("about").
 */
export type RampChestnut = { id: string; url: string; label: string; kind: "disclosure" | "chestnut" | "silence" | "tactic" };
const marks = marksJson as unknown as { fee: string[]; chestnut: Record<string, RampChestnut[]> };
const feeGm = new Set(marks.fee);

/** Case-mail archive id (gm-…) of each exchange on the climb, from correspondence.json. */
const gmByIndex = new Map<number, string>();
const corr = corrJson as unknown as { emails: Record<string, { gm?: string }>; extra: { id: string; gm?: string }[] };
for (const [k, v] of Object.entries(corr.emails)) if (v.gm) gmByIndex.set(Number(k), v.gm);
for (const x of corr.extra) {
  const i = extraIndex[x.id];
  if (i !== undefined && x.gm) gmByIndex.set(i, x.gm);
}

export const gmFee = (gm: string | null | undefined) => !!gm && feeGm.has(gm);
export const gmChestnuts = (gm: string | null | undefined): RampChestnut[] => (gm ? marks.chestnut[gm] ?? [] : []);
/** £ on this climb exchange (a fee quote or pay-first reply the hand-kept fee list does not carry). */
export const rampFee = (index: number) => gmFee(gmByIndex.get(index));
/** That Old Chestnut entries for this climb exchange, strongest first. */
export const rampChestnuts = (index: number) => gmChestnuts(gmByIndex.get(index));
