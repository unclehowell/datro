import data from "@/data/paywalls.json";

/**
 * Pay walls: fees and paid-copy offers made by bodies in reply to requests, each with its source. None paid.
 * Same shape as the archaeology timeline (a collapsed list). — Sion's Tab agent, 10 Nov 2026
 */
type Item = { id: string; date: string; body: string; note: string; source: string; url: string | null; free_first?: string; free_basis?: string };
const FREE: Record<string, [string, string]> = { yes: ["✅", "bg-[#e3f6e6] text-[#17692b]"], no: ["❌", "bg-[#fde6e4] text-[#a1251b]"], "n/a": ["n/a", "bg-[#ececec] text-[#555]"], "not checked": ["?", "bg-[#ececec] text-[#555]"] };
const D = data as unknown as { generated: string; title: string; note: string; items: Item[] };

export function PayWalls() {
  return (
    <section aria-label="Pay walls" className="mx-auto w-full max-w-3xl px-3">
      <details className="rounded-xl border border-line bg-surface">
        <summary className="cursor-pointer select-none px-4 py-3 text-base font-semibold">
          <span aria-hidden className="mr-2 inline-flex size-4 items-center justify-center rounded-full bg-[#ffd34d] text-[9px] font-extrabold text-[#0d0b09]">£</span>
          Pay walls
          <span className="ml-2 text-xs font-normal opacity-70">{D.items.length} fee offers, none paid</span>
        </summary>
        <ol className="space-y-3 px-4 pb-4">
          {D.items.map((it) => (
            <li key={it.id} className="border-l-2 border-line pl-3">
              <div className="text-xs font-semibold uppercase tracking-wide opacity-70">{it.date}</div>
              <div className="text-sm leading-snug">{it.note}</div>
              {it.free_first ? (
                <div className="mt-1 text-xs" title={it.free_basis}>
                  <span className={`rounded-full px-2 py-0.5 font-semibold ${(FREE[it.free_first] || FREE["not checked"])[1]}`}>
                    {(FREE[it.free_first] || FREE["not checked"])[0]} free allowance given first: {it.free_first}
                  </span>
                </div>
              ) : null}
              {it.url ? (
                <a href={it.url} className="text-xs underline opacity-80">
                  {it.source}
                </a>
              ) : (
                <span className="text-xs opacity-80">{it.source}</span>
              )}
            </li>
          ))}
        </ol>
        <p className="px-4 pb-4 text-xs opacity-80">{D.note}</p>
      </details>
    </section>
  );
}
