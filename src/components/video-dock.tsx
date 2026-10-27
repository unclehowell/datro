import { useEffect, useRef, useState } from "react";

/**
 * The long dartboard video as a small floating thumbnail. It starts on page load, muted and inline
 * (browsers only autoplay muted video); the buttons unmute, go full screen, or tuck it into a pill.
 */
export function VideoDock({ src, poster, title }: { src: string; poster?: string; title?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const [mini, setMini] = useState(false);

  useEffect(() => {
    const v = ref.current;
    if (!v || mini) return;
    v.muted = muted;
    const p = v.play();
    if (p && typeof p.catch === "function") p.catch(() => {});
  }, [mini, muted]);

  const full = () => {
    const v = ref.current as
      | (HTMLVideoElement & { webkitEnterFullscreen?: () => void; webkitRequestFullscreen?: () => void })
      | null;
    if (!v) return;
    v.muted = false;
    setMuted(false);
    void v.play().catch(() => {});
    if (v.requestFullscreen) void v.requestFullscreen().catch(() => v.webkitEnterFullscreen?.());
    else if (v.webkitRequestFullscreen) v.webkitRequestFullscreen();
    else v.webkitEnterFullscreen?.();
  };

  if (mini)
    return (
      <button
        type="button"
        onClick={() => setMini(false)}
        aria-label="Show video"
        data-video-dock="mini"
        className="fixed right-3 bottom-3 z-40 flex size-11 items-center justify-center rounded-full border border-line bg-surface/95 text-brass shadow-lg"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
          <path d="M4 2.5v11l9-5.5z" fill="currentColor" />
        </svg>
      </button>
    );

  return (
    <div
      data-video-dock="open"
      className="fixed right-3 bottom-3 z-40 w-[132px] overflow-hidden rounded-xl border border-line bg-black shadow-[0_6px_24px_rgba(0,0,0,0.55)]"
    >
      <video
        ref={ref}
        src={src}
        poster={poster}
        autoPlay
        muted
        playsInline
        loop
        preload="auto"
        aria-label={title}
        onDoubleClick={full}
        className="block aspect-video w-full bg-black object-cover"
      />
      <div className="flex items-center justify-between bg-black/85 px-1 py-0.5">
        <button
          type="button"
          onClick={() => setMuted((m) => !m)}
          aria-label={muted ? "Unmute" : "Mute"}
          aria-pressed={!muted}
          className="flex size-8 items-center justify-center text-white/90"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
            <path d="M2 6h3l4-3v10L5 10H2z" fill="currentColor" />
            {muted ? (
              <path d="M11 6l4 4M15 6l-4 4" stroke="currentColor" strokeWidth="1.5" />
            ) : (
              <path d="M11 5.5a3.5 3.5 0 0 1 0 5M12.5 3.5a6 6 0 0 1 0 9" stroke="currentColor" strokeWidth="1.3" fill="none" />
            )}
          </svg>
        </button>
        <button
          type="button"
          onClick={full}
          aria-label="Full screen"
          className="flex size-8 items-center justify-center text-white/90"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
            <path d="M2 6V2h4M10 2h4v4M14 10v4h-4M6 14H2v-4" stroke="currentColor" strokeWidth="1.6" fill="none" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => setMini(true)}
          aria-label="Minimise video"
          className="flex size-8 items-center justify-center text-white/90"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
            <path d="M3 12h10" stroke="currentColor" strokeWidth="1.8" />
          </svg>
        </button>
      </div>
    </div>
  );
}
