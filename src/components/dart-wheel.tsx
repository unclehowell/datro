import { parties, resolveCell, rings, statusMeta, type Party, type Ring } from "@/data/disclosure";

/**
 * The dartboard: one slice per institution, one ring per escalation step (outside = first
 * enquiry, bull = tribunal or court). Visual only; a tap opens the details.
 */
const C = 200;
const BULL = 22;
const INNER = 34;
const OUTER = 176;
const RIM = 192;

function polar(r: number, a: number) {
  return [C + r * Math.cos(a), C + r * Math.sin(a)] as const;
}

function arc(r0: number, r1: number, a0: number, a1: number) {
  const large = a1 - a0 > Math.PI ? 1 : 0;
  const [x0, y0] = polar(r1, a0);
  const [x1, y1] = polar(r1, a1);
  const [x2, y2] = polar(r0, a1);
  const [x3, y3] = polar(r0, a0);
  return `M${x0.toFixed(2)} ${y0.toFixed(2)}A${r1} ${r1} 0 ${large} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}L${x2.toFixed(2)} ${y2.toFixed(2)}A${r0} ${r0} 0 ${large} 0 ${x3.toFixed(2)} ${y3.toFixed(2)}Z`;
}

export type WheelPick = { party: Party; ring: Ring };

export function DartWheel({
  highlight,
  onPick,
}: {
  /** Party ids to outline (the institution selected in the game). */
  highlight: string[];
  onPick: (pick: WheelPick) => void;
}) {
  const slice = (Math.PI * 2) / parties.length;
  const band = (OUTER - INNER) / rings.length;
  const start = -Math.PI / 2 - slice / 2;

  return (
    <svg viewBox="0 0 400 400" className="mx-auto block w-full max-w-[420px] touch-manipulation select-none" role="img" aria-label="Dartboard of institutions and escalation rings">
      <defs>
        <radialGradient id="dw-rim" cx="50%" cy="50%" r="50%">
          <stop offset="85%" stopColor="#1b1612" />
          <stop offset="100%" stopColor="#0b0907" />
        </radialGradient>
      </defs>
      <circle cx={C} cy={C} r={RIM + 6} fill="url(#dw-rim)" />
      <circle cx={C} cy={C} r={RIM} fill="#0f0d0b" stroke="#4a3f33" strokeWidth="1.5" />
      {/* Number-ring stand-ins: alternating dark / light tabs, one per institution. */}
      {parties.map((party, i) => {
        const a0 = start + i * slice;
        const on = highlight.includes(party.id);
        return (
          <path
            key={`tab-${party.id}`}
            d={arc(OUTER + 3, RIM - 2, a0 + 0.01, a0 + slice - 0.01)}
            fill={on ? "#c4a574" : i % 2 ? "#2b241d" : "#3b3127"}
            onClick={() => onPick({ party, ring: rings[0] })}
          />
        );
      })}
      {parties.map((party, i) => {
        const a0 = start + i * slice;
        return rings.map((ring, j) => {
          const cell = resolveCell(party, ring);
          const r1 = OUTER - j * band;
          const r0 = r1 - band;
          const taken = cell.status !== "dormant" || Boolean(party.cells[ring.id]);
          return (
            <path
              key={`${party.id}-${ring.id}`}
              d={arc(r0 + 0.6, r1 - 0.6, a0 + 0.008, a0 + slice - 0.008)}
              fill={statusMeta[cell.status].swatch}
              fillOpacity={taken ? 1 : i % 2 ? 0.16 : 0.24}
              stroke={highlight.includes(party.id) ? "#c4a574" : "none"}
              strokeWidth={highlight.includes(party.id) ? 1.4 : 0}
              onClick={() => onPick({ party, ring })}
              style={{ cursor: "pointer" }}
            />
          );
        });
      })}
      {/* Wire spokes */}
      {parties.map((party, i) => {
        const a = start + i * slice;
        const [x0, y0] = polar(INNER, a);
        const [x1, y1] = polar(RIM - 2, a);
        return <line key={`w-${party.id}`} x1={x0} y1={y0} x2={x1} y2={y1} stroke="#9a8b74" strokeOpacity="0.35" strokeWidth="0.6" pointerEvents="none" />;
      })}
      {rings.map((ring, j) => (
        <circle key={`c-${ring.id}`} cx={C} cy={C} r={OUTER - j * band} fill="none" stroke="#9a8b74" strokeOpacity="0.3" strokeWidth="0.6" pointerEvents="none" />
      ))}
      <circle cx={C} cy={C} r={INNER} fill="#1d5a37" stroke="#9a8b74" strokeOpacity="0.5" />
      <circle cx={C} cy={C} r={BULL} fill="#a8322b" stroke="#9a8b74" strokeOpacity="0.5" />
      <circle cx={C} cy={C} r={6} fill="#f4efe6" />
    </svg>
  );
}
