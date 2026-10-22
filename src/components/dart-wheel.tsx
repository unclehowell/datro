import { rings, statusMeta, type Party, type Ring } from "@/data/disclosure";
import { sliceCell, sliceHasFee, wheelSlices, type WheelSlice } from "@/data/wheel";

/**
 * The dartboard: one numbered slice per institution (same number as the game's dropdown), one
 * ring per escalation step (outside = first enquiry, bull = tribunal or court). Visual only; a
 * tap opens the details. "$" marks a cell where the institution sought or mentioned fees.
 */
const C = 200;
const BULL = 22;
const INNER = 34;
const OUTER = 164;
const RIM = 194;

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

export type WheelPick = { party: Party; ring: Ring; slice: WheelSlice };

export function DartWheel({
  highlight,
  onPick,
}: {
  /** Institution id to outline (the one selected in the game). */
  highlight: string;
  onPick: (pick: WheelPick) => void;
}) {
  const n = wheelSlices.length;
  const slice = (Math.PI * 2) / n;
  const band = (OUTER - INNER) / rings.length;
  const start = -Math.PI / 2 - slice / 2;
  const fees: { x: number; y: number; size: number; key: string }[] = [];

  return (
    <svg viewBox="0 0 400 400" className="mx-auto block w-full max-w-[440px] touch-manipulation select-none" role="img" aria-label="Dartboard of institutions and escalation rings">
      <defs>
        <radialGradient id="dw-rim" cx="50%" cy="50%" r="50%">
          <stop offset="85%" stopColor="#1b1612" />
          <stop offset="100%" stopColor="#0b0907" />
        </radialGradient>
      </defs>
      <circle cx={C} cy={C} r={RIM + 5} fill="url(#dw-rim)" />
      <circle cx={C} cy={C} r={RIM} fill="#0f0d0b" stroke="#4a3f33" strokeWidth="1.5" />
      {/* Number ring: one numbered tab per institution. */}
      {wheelSlices.map((s, i) => {
        const a0 = start + i * slice;
        const on = s.inst?.id === highlight;
        const [tx, ty] = polar((OUTER + RIM) / 2 + 1, a0 + slice / 2);
        const pick = () => {
          const { party } = sliceCell(s, rings[0]);
          onPick({ party, ring: rings[0], slice: s });
        };
        return (
          <g key={`tab-${s.label}`} onClick={pick} style={{ cursor: "pointer" }}>
            <path d={arc(OUTER + 2, RIM - 1.5, a0 + 0.006, a0 + slice - 0.006)} fill={on ? "#c4a574" : i % 2 ? "#2b241d" : "#3b3127"} />
            <text
              x={tx}
              y={ty}
              textAnchor="middle"
              dominantBaseline="central"
              fontFamily="Outfit, system-ui, sans-serif"
              fontSize={s.label.length > 1 ? 12.5 : 14}
              fontWeight="700"
              fill={on ? "#14110e" : "#f4efe6"}
              pointerEvents="none"
            >
              {s.label}
            </text>
          </g>
        );
      })}
      {wheelSlices.map((s, i) => {
        const a0 = start + i * slice;
        const on = s.inst?.id === highlight;
        return rings.map((ring, j) => {
          const { party, cell, taken } = sliceCell(s, ring);
          const r1 = OUTER - j * band;
          const r0 = r1 - band;
          if (sliceHasFee(s, ring)) {
            const [fx, fy] = polar((r0 + r1) / 2, a0 + slice / 2);
            const width = ((r0 + r1) / 2) * slice;
            fees.push({ x: fx, y: fy, size: Math.max(8, Math.min(14, width * 0.95, band * 0.95)), key: `${s.label}-${ring.id}` });
          }
          return (
            <path
              key={`${s.label}-${ring.id}`}
              d={arc(r0 + 0.5, r1 - 0.5, a0 + 0.006, a0 + slice - 0.006)}
              fill={statusMeta[cell.status].swatch}
              fillOpacity={taken || cell.status !== "dormant" ? 1 : i % 2 ? 0.16 : 0.24}
              stroke={on ? "#c4a574" : "none"}
              strokeWidth={on ? 1.4 : 0}
              onClick={() => onPick({ party, ring, slice: s })}
              style={{ cursor: "pointer" }}
            />
          );
        });
      })}
      {/* Wire spokes */}
      {wheelSlices.map((s, i) => {
        const a = start + i * slice;
        const [x0, y0] = polar(INNER, a);
        const [x1, y1] = polar(RIM - 1.5, a);
        return <line key={`w-${s.label}`} x1={x0} y1={y0} x2={x1} y2={y1} stroke="#9a8b74" strokeOpacity="0.35" strokeWidth="0.6" pointerEvents="none" />;
      })}
      {rings.map((ring, j) => (
        <circle key={`c-${ring.id}`} cx={C} cy={C} r={OUTER - j * band} fill="none" stroke="#9a8b74" strokeOpacity="0.3" strokeWidth="0.6" pointerEvents="none" />
      ))}
      {fees.map((f) => (
        <text
          key={`fee-${f.key}`}
          x={f.x}
          y={f.y}
          textAnchor="middle"
          dominantBaseline="central"
          fontFamily="Outfit, system-ui, sans-serif"
          fontSize={f.size}
          fontWeight="800"
          fill="#ffd34d"
          stroke="#14110e"
          strokeWidth="2.4"
          paintOrder="stroke"
          strokeLinejoin="round"
          pointerEvents="none"
          aria-hidden="true"
        >
          $
        </text>
      ))}
      <circle cx={C} cy={C} r={INNER} fill="#1d5a37" stroke="#9a8b74" strokeOpacity="0.5" />
      <circle cx={C} cy={C} r={BULL} fill="#a8322b" stroke="#9a8b74" strokeOpacity="0.5" />
      <circle cx={C} cy={C} r={6} fill="#f4efe6" />
    </svg>
  );
}
