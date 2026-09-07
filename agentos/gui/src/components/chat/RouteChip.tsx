import { memo } from "react";

// WS-03 (v1.11.35): honest route chip. The chip reports ONLY what the server
// actually measured and returned — the classified route, the dependency that
// handled it, and the provider. It deliberately does NOT invent confidence or
// timing fields. If the route is still classifying (empty `routed`), it renders
// nothing rather than a fabricated label; the streaming breadcrumb above the
// message is the real-time progress source. Deliberately kept a pure,
// byte-for-byte equivalent of the old inline header chips so the extraction is
// behaviour-neutral.

const ROUTE_ICONS: Record<string, string> = {
  chat: "\uD83D\uDCAC",
  exec: "\u2699\uFE0F",
  math: "\uD83E\uDDEE",
  video: "\uD83C\uDFAC",
  tool: "\uD83D\uDD27",
  mcp: "\uD83D\uDD17",
  idle: "\u23FA",
};

// Exact colour tokens from the original inline chips (STATUS_COLORS.green in
// chat/page.tsx) — kept identical so the extraction is behaviour-neutral.
const GREEN = {
  text: "#22c55e",
  bg: "rgba(34,197,94,0.1)",
  border: "rgba(34,197,94,0.3)",
};

interface RouteChipProps {
  routed?: string;
  dependency?: string;
  provider?: string;
  className?: string;
}

function RouteChipBase({ routed, dependency, provider, className = "" }: RouteChipProps) {
  return (
    <div className={`flex items-center gap-1.5 flex-wrap ${className}`}>
      {routed && (
        <span
          className="text-[10px] px-1.5 py-0.5 rounded font-mono"
          style={{
            color: GREEN.text,
            backgroundColor: GREEN.bg,
            border: `1px solid ${GREEN.border}`,
          }}
        >
          {ROUTE_ICONS[routed] || "\uD83D\uDD27"} {routed.toUpperCase()}
        </span>
      )}
      {dependency && (
        <span
          className="text-[10px] px-1.5 py-0.5 rounded font-mono"
          style={{
            color: GREEN.text,
            backgroundColor: GREEN.bg,
            border: `1px solid ${GREEN.border}`,
          }}
        >
          {dependency}
        </span>
      )}
      {provider && (
        <span className="text-[10px] px-1 py-0.5 rounded bg-zinc-800/50 text-zinc-400 border border-zinc-700">
          via {provider}
        </span>
      )}
    </div>
  );
}

const RouteChip = memo(RouteChipBase);
export default RouteChip;