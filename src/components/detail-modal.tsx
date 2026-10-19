import { useEffect, type ReactNode } from "react";

/** Bottom sheet on phones, centred card on wider screens. The only place text appears. */
export function DetailModal({
  open,
  onClose,
  accent,
  children,
}: {
  open: boolean;
  onClose: () => void;
  accent?: string;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        className="label-in max-h-[80dvh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-line bg-surface p-5 pb-8 text-fg shadow-2xl sm:rounded-3xl sm:pb-5"
        style={{ borderTop: `4px solid ${accent ?? "var(--color-brass)"}` }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-3 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex size-9 items-center justify-center rounded-full border border-line text-lg text-muted"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Row({ k, v }: { k: string; v?: ReactNode }) {
  if (v === undefined || v === null || v === "") return null;
  return (
    <div className="flex gap-3 border-t border-line py-2 text-sm">
      <span className="w-24 shrink-0 text-faint">{k}</span>
      <span className="min-w-0 flex-1 break-words text-fg">{v}</span>
    </div>
  );
}

export function Chip({ colour, children }: { colour: string; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-line px-2.5 py-1 text-xs text-fg">
      <span className="size-2.5 rounded-full" style={{ background: colour }} aria-hidden />
      {children}
    </span>
  );
}

export function fmtDate(iso?: string) {
  if (!iso) return "";
  const d = new Date(`${iso}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}
