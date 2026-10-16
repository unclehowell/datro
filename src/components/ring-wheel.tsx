import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { Minus, Plus, Scan } from "lucide-react";
import {
  parties,
  resolveCell,
  rings,
  statusMeta,
  type Party,
  type Ring,
  type Status,
} from "@/data/disclosure";

const CX = 500;
const CY = 500;
const INNER = 86;
const OUTER = 318;
const GAP = 0.012;

export type Selection = { partyId: string; ringId: Ring["id"] };

type Props = {
  selection: Selection | null;
  onSelect: (next: Selection) => void;
  filter: Status | null;
};

function polar(r: number, a: number) {
  return [CX + r * Math.cos(a), CY + r * Math.sin(a)] as const;
}

function arcPath(r0: number, r1: number, a0: number, a1: number) {
  const large = a1 - a0 > Math.PI ? 1 : 0;
  const [x0, y0] = polar(r1, a0);
  const [x1, y1] = polar(r1, a1);
  const [x2, y2] = polar(r0, a1);
  const [x3, y3] = polar(r0, a0);
  return `M ${x0} ${y0} A ${r1} ${r1} 0 ${large} 1 ${x1} ${y1} L ${x2} ${y2} A ${r0} ${r0} 0 ${large} 0 ${x3} ${y3} Z`;
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function RingWheel({ selection, onSelect, filter }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(640);
  const [view, setView] = useState({ x: 0, y: 0, k: 1 });
  const drag = useRef<{ x: number; y: number; vx: number; vy: number } | null>(null);
  const suppressClick = useRef(false);
  const titleId = useId();
  const thickness = (OUTER - INNER) / rings.length;
  const slice = (Math.PI * 2) / parties.length;

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => setWidth(el.clientWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const rect = el.getBoundingClientRect();
      const ox = event.clientX - rect.left;
      const oy = event.clientY - rect.top;
      const factor = event.deltaY < 0 ? 1.12 : 1 / 1.12;
      setView((current) => {
        const k = clamp(current.k * factor, 0.85, 5);
        const ratio = k / current.k;
        return {
          k,
          x: ox - ratio * (ox - current.x),
          y: oy - ratio * (oy - current.y),
        };
      });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const showLabels = width >= 720 || view.k >= 1.65;

  const zoomAt = (factor: number) => {
    const el = wrapRef.current;
    if (!el) return;
    const ox = el.clientWidth / 2;
    const oy = el.clientHeight / 2;
    setView((current) => {
      const k = clamp(current.k * factor, 0.85, 5);
      const ratio = k / current.k;
      return { k, x: ox - ratio * (ox - current.x), y: oy - ratio * (oy - current.y) };
    });
  };

  const cells = useMemo(
    () =>
      parties.flatMap((party, partyIndex) =>
        rings.map((ring, ringIndex) => {
          const a0 = -Math.PI / 2 + partyIndex * slice + GAP / 2;
          const a1 = -Math.PI / 2 + (partyIndex + 1) * slice - GAP / 2;
          const r1 = OUTER - ringIndex * thickness;
          const r0 = r1 - thickness + 2.2;
          const cell = resolveCell(party, ring);
          return { party, ring, ringIndex, a0, a1, r0, r1, cell };
        }),
      ),
    [slice, thickness],
  );

  return (
    <div className="relative h-full min-h-0">
      <div
        ref={wrapRef}
        className="relative h-full min-h-80 overflow-hidden rounded-2xl border border-line bg-surface touch-none"
        onPointerDown={(event) => {
          if (event.button !== 0) return;
          const target = event.target as Element | null;
          if (target?.closest?.("[data-slice]")) return;
          wrapRef.current?.setPointerCapture(event.pointerId);
          suppressClick.current = false;
          drag.current = { x: event.clientX, y: event.clientY, vx: view.x, vy: view.y };
        }}
        onPointerMove={(event) => {
          const current = drag.current;
          if (!current) return;
          const dx = event.clientX - current.x;
          const dy = event.clientY - current.y;
          if (Math.hypot(dx, dy) > 4) suppressClick.current = true;
          setView((value) => ({ ...value, x: current.vx + dx, y: current.vy + dy }));
        }}
        onPointerUp={() => {
          drag.current = null;
        }}
        onPointerCancel={() => {
          drag.current = null;
        }}
      >
        <svg
          viewBox="0 0 1000 1000"
          role="img"
          aria-labelledby={titleId}
          className="h-full w-full"
          style={{
            transform: `translate(${view.x}px, ${view.y}px) scale(${view.k})`,
            transformOrigin: "0 0",
          }}
        >
          <title id={titleId}>
            Disclosure rings for Great House Farm. Outside ring is the first enquiry.
          </title>
          <circle cx={CX} cy={CY} r={OUTER + 8} fill="none" stroke="var(--color-line)" strokeWidth="1" />
          {cells.map(({ party, ring, a0, a1, r0, r1, cell }) => {
            const selected =
              selection?.partyId === party.id && selection.ringId === ring.id;
            const dim = filter !== null && cell.status !== filter;
            const [feeX, feeY] = polar((r0 + r1) / 2, (a0 + a1) / 2);
            return (
              <g key={`${party.id}-${ring.id}`}>
              <path
                d={arcPath(r0, r1, a0, a1)}
                fill={statusMeta[cell.status].swatch}
                opacity={dim ? 0.16 : selected ? 1 : 0.94}
                stroke={selected ? "var(--color-brass)" : "var(--color-bg)"}
                strokeWidth={selected ? 3 : 0.6}
                data-slice=""
                className="cursor-pointer outline-none transition-opacity duration-150"
                tabIndex={0}
                role="button"
                aria-pressed={selected}
                aria-label={`${party.name}, ${ring.name}. ${statusMeta[cell.status].label}. ${cell.title}${cell.feeMarker ? ". Cost or fee indicator (£)" : ""}`}
                onClick={(event) => {
                  event.stopPropagation();
                  if (suppressClick.current) {
                    suppressClick.current = false;
                    return;
                  }
                  onSelect({ partyId: party.id, ringId: ring.id });
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onSelect({ partyId: party.id, ringId: ring.id });
                  }
                }}
              >
                <title>{`${party.short} · ${ring.short} · ${cell.title}${cell.feeMarker ? " · £ cost/fee recorded" : ""}`}</title>
              </path>
              {cell.feeMarker && (
                <text
                  x={feeX}
                  y={feeY}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontFamily="var(--font-sans)"
                  fontSize="20"
                  fontWeight="700"
                  fill="var(--color-brass)"
                  stroke="var(--color-bg)"
                  strokeWidth="2.5"
                  paintOrder="stroke"
                  strokeLinejoin="round"
                  pointerEvents="none"
                  aria-hidden="true"
                >
                  £
                </text>
              )}
              </g>
            );
          })}
          {showLabels &&
            parties.map((party, index) => {
              const mid = -Math.PI / 2 + (index + 0.5) * slice;
              const deg = (mid * 180) / Math.PI;
              const norm = ((deg % 360) + 360) % 360;
              const flip = norm > 90 && norm < 270;
              const active = selection?.partyId === party.id;
              return (
                <text
                  key={party.id}
                  fill={active ? "var(--color-brass)" : "var(--color-muted)"}
                  fontSize="15"
                  fontFamily="var(--font-sans)"
                  textAnchor={flip ? "end" : "start"}
                  dominantBaseline="middle"
                  transform={`rotate(${deg} ${CX} ${CY}) translate(${OUTER + 14} 0)${flip ? " rotate(180)" : ""}`}
                  className="pointer-events-none select-none"
                >
                  {party.short}
                </text>
              );
            })}
          <circle cx={CX} cy={CY} r={INNER - 6} fill="var(--color-bg)" stroke="var(--color-line)" />
          <text
            x={CX}
            y={CY - 16}
            textAnchor="middle"
            fill="var(--color-brass)"
            fontFamily="var(--font-serif)"
            fontSize="22"
          >
            Tŷ Mawr
          </text>
          <text
            x={CX}
            y={CY + 10}
            textAnchor="middle"
            fill="var(--color-fg)"
            fontFamily="var(--font-sans)"
            fontSize="13"
          >
            Great House Farm
          </text>
          <text
            x={CX}
            y={CY + 30}
            textAnchor="middle"
            fill="var(--color-faint)"
            fontFamily="var(--font-sans)"
            fontSize="11"
          >
            outside is the first ask
          </text>
        </svg>
      </div>

      <div className="absolute bottom-3 right-3 flex items-center gap-2">
        <span className="rounded-full bg-bg/80 px-2.5 py-1 text-xs text-muted tabular-nums">
          {Math.round(view.k * 100)}%
        </span>
        <div className="flex overflow-hidden rounded-full border border-line bg-bg/90">
          <ZoomButton label="Zoom out" onClick={() => zoomAt(1 / 1.25)}>
            <Minus aria-hidden />
          </ZoomButton>
          <ZoomButton label="Zoom in" onClick={() => zoomAt(1.25)}>
            <Plus aria-hidden />
          </ZoomButton>
          <ZoomButton
            label="Fit the rings"
            onClick={() => setView({ x: 0, y: 0, k: 1 })}
          >
            <Scan aria-hidden />
          </ZoomButton>
        </div>
      </div>
    </div>
  );
}

function ZoomButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="grid h-11 w-11 place-items-center text-fg transition-colors hover:bg-surface-2 hover:text-brass [&_svg]:size-4"
    >
      {children}
    </button>
  );
}

export function partyById(id: string): Party | undefined {
  return parties.find((party) => party.id === id);
}

export function ringById(id: string): Ring | undefined {
  return rings.find((ring) => ring.id === id);
}
