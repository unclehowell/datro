import data from "@/data/archaeology-timeline.json";

/**
 * Archaeology at Great House Farm (Tŷ Mawr), c.1880 to 2014: the 1990 GGAT evaluation, the planning
 * permissions, the 1994 excavation and the 2005 publication. Each line links to its source.
 * — Sion's Tab agent, 21 Oct 2026
 */
type Item = { date: string; event: string; source: string; url: string };
const D = data as unknown as { generated: string; wiki: string; report: string; chronology?: string; media?: string; items: Item[] };

export function ArchaeologyTimeline() {
  return (
    <section aria-label="Archaeology timeline" className="mx-auto w-full max-w-3xl px-3">
      <details className="rounded-xl border border-line bg-surface">
        <summary className="cursor-pointer select-none px-4 py-3 text-base font-semibold">
          Archaeology: 1990 evaluation to 1994 excavation
          <span className="ml-2 text-xs font-normal opacity-70">{D.items.length} dated records</span>
        </summary>
        <ol className="space-y-3 px-4 pb-4">
          {D.items.map((it, i) => (
            <li key={i} className="border-l-2 border-line pl-3">
              <div className="text-xs font-semibold uppercase tracking-wide opacity-70">{it.date}</div>
              <div className="text-sm leading-snug">{it.event}</div>
              <a href={it.url} target="_blank" rel="noopener" className="text-xs underline opacity-80">
                {it.source}
              </a>
            </li>
          ))}
        </ol>
        <p className="px-4 pb-4 text-xs opacity-80">
          The 1990 report: <a className="underline" href={D.report}>EV-0126</a> · full timeline with record numbers:{" "}
          <a className="underline" href={D.wiki}>EV-0900</a>
          {D.chronology ? (
            <>
              {" "}· every event of the case:{" "}
              <a className="underline" href={D.chronology}>central chronology</a>
            </>
          ) : null}
          {D.media ? (
            <>
              {" "}· press and video:{" "}
              <a className="underline" href={D.media}>media coverage</a>
            </>
          ) : null}
        </p>
      </details>
    </section>
  );
}
