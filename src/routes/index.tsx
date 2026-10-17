import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ExternalLink } from "lucide-react";
import {
  parties,
  resolveCell,
  rings,
  sampledThrough,
  statusMeta,
  type Status,
} from "@/data/disclosure";
import { RingWheel, type Selection } from "@/components/ring-wheel";

export const Route = createFileRoute("/")({ component: Home });

function publicArchiveUrl(cell: { url?: string; title: string; date?: string; ref?: string; correspondent?: string }) {
  if (!cell.url) return undefined;
  try {
    const target = new URL(cell.url);
    if (target.hostname === "email.bucklerfamily.estate" && /^\/reference\/[a-f0-9]{16}$/i.test(target.pathname)) {
      target.searchParams.set("title", cell.title);
      if (cell.date) target.searchParams.set("date", cell.date);
      if (cell.correspondent) target.searchParams.set("correspondent", cell.correspondent);
      if (cell.ref) target.searchParams.set("caseRef", cell.ref);
      target.searchParams.set("query", cell.ref || cell.title);
    }
    return target.toString();
  } catch {
    return cell.url;
  }
}

function Home() {
  const [selection, setSelection] = useState<Selection | null>({
    partyId: "llandough",
    ringId: "reply",
  });
  const [filter, setFilter] = useState<Status | null>(null);

  const selected = useMemo(() => {
    if (!selection) return null;
    const party = parties.find((item) => item.id === selection.partyId);
    const ring = rings.find((item) => item.id === selection.ringId);
    if (!party || !ring) return null;
    const ringIndex = rings.findIndex((item) => item.id === ring.id);
    return { party, ring, ringIndex, cell: resolveCell(party, ring) };
  }, [selection]);

  const counts = useMemo(() => {
    const tally: Record<Status, number> = {
      dormant: 0,
      evidence: 0,
      nuisance: 0,
      closed: 0,
      suspicious: 0,
    };
    for (const party of parties) {
      for (const ring of rings) tally[resolveCell(party, ring).status] += 1;
    }
    return tally;
  }, []);

  return (
    <main className="mx-auto flex min-h-dvh max-w-7xl flex-col gap-4 px-4 py-4 md:px-6 md:py-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <p className="text-xs tracking-[0.18em] text-brass uppercase">
            Great House Farm · Tŷ Mawr · Llandough
          </p>
          <h1 className="mt-1 font-serif text-3xl leading-tight text-fg md:text-4xl">
            Disclosure rings
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
            Outside is the first enquiry. Each ring inward is the next step that has to be
            used up before anyone can say the record was properly sought. Drawn from your
            FOI mail, sampled through {sampledThrough}.
          </p>
        </div>
        <ol className="flex flex-wrap gap-1.5 text-xs text-muted md:max-w-sm md:justify-end">
          {rings.map((ring, index) => (
            <li
              key={ring.id}
              className="rounded-full border border-line bg-surface px-2 py-1"
            >
              <span className="text-faint">{index + 1}</span> {ring.short}
            </li>
          ))}
        </ol>
      </header>

      <div className="flex flex-wrap gap-2" role="toolbar" aria-label="Colour key">
        {(Object.keys(statusMeta) as Status[]).map((status) => {
          const meta = statusMeta[status];
          const on = filter === status;
          return (
            <button
              key={status}
              type="button"
              aria-pressed={on}
              onClick={() => setFilter(on ? null : status)}
              className={`flex items-center gap-2 rounded-full border px-3 py-2 text-sm ${
                on
                  ? "border-brass bg-surface-2 text-fg"
                  : "border-line bg-surface text-muted hover:text-fg"
              }`}
            >
              <span
                className="size-3 rounded-full"
                style={{ background: meta.swatch }}
                aria-hidden
              />
              {meta.label}
              <span className="text-faint tabular-nums">{counts[status]}</span>
            </button>
          );
        })}
      </div>

      <p className="text-xs text-muted">£ Cost, fee, or paid-search route recorded; the marker does not mean the amount was paid.</p>

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-stretch">
        <section className="aspect-square w-full" aria-label="Ring chart">
          <RingWheel selection={selection} onSelect={setSelection} filter={filter} />
        </section>

        <aside className="flex min-h-0 flex-col gap-3">
          {selected ? (
            <article
              key={`${selected.party.id}-${selected.ring.id}`}
              className="label-in rounded-2xl border border-line bg-paper p-4 text-dormant-ink"
            >
              <div className="flex items-center gap-2 text-xs tracking-wide uppercase">
                <span
                  className="size-2.5 rounded-full"
                  style={{ background: statusMeta[selected.cell.status].swatch }}
                  aria-hidden
                />
                <span>{statusMeta[selected.cell.status].label}</span>
                <span className="text-faint">·</span>
                <span>
                  Ring {selected.ringIndex + 1} of {rings.length}
                </span>
              </div>
              <h2 className="mt-2 font-serif text-2xl leading-tight">{selected.cell.title}</h2>
              <p className="mt-1 text-sm">
                {selected.party.name}
                <span className="text-faint"> · {selected.ring.name}</span>
              </p>
              <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
                {selected.cell.date && (
                  <>
                    <dt className="text-faint">Date</dt>
                    <dd>{selected.cell.date}</dd>
                  </>
                )}
                {selected.cell.ref && (
                  <>
                    <dt className="text-faint">Ref</dt>
                    <dd>{selected.cell.ref}</dd>
                  </>
                )}
                {selected.cell.correspondent && (
                  <>
                    <dt className="text-faint">Who</dt>
                    <dd>{selected.cell.correspondent}</dd>
                  </>
                )}
              </dl>
              <p className="mt-3 text-sm leading-relaxed">{selected.cell.detail}</p>
              {selected.cell.url && (
                <a
                  href={publicArchiveUrl(selected.cell)}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 text-sm text-brass-ink underline decoration-brass underline-offset-4"
                >
                  Open in public email archive
                  <ExternalLink className="size-3.5" aria-hidden />
                </a>
              )}
            </article>
          ) : (
            <p className="rounded-2xl border border-line bg-surface p-4 text-sm text-muted">
              Select a slice. The label for that step will open here.
            </p>
          )}

          <div className="overflow-auto rounded-2xl border border-line bg-surface lg:max-h-dvh">
            <p className="sticky top-0 border-b border-line bg-surface px-3 py-2 text-xs tracking-wide text-faint uppercase">
              Each body, outside to inside
            </p>
            <ul>
              {parties.map((party) => (
                <li key={party.id} className="border-b border-line last:border-b-0">
                  <div className="px-3 pt-2.5">
                    <p className="text-sm text-fg">{party.name}</p>
                    <p className="text-xs text-faint">{party.remit}</p>
                  </div>
                  <div className="flex gap-1 px-3 pt-2 pb-3">
                    {rings.map((ring) => {
                      const cell = resolveCell(party, ring);
                      const on =
                        selection?.partyId === party.id && selection.ringId === ring.id;
                      return (
                        <button
                          key={ring.id}
                          type="button"
                          title={`${ring.name}: ${cell.title}`}
                          aria-label={`${party.short}, ${ring.name}, ${cell.title}${cell.feeMarker ? ". Cost or fee indicator (£)" : ""}`}
                          aria-pressed={on}
                          onClick={() => setSelection({ partyId: party.id, ringId: ring.id })}
                          className={`relative h-8 min-w-0 flex-1 rounded-md ${
                            on ? "ring-2 ring-brass ring-offset-1 ring-offset-surface" : ""
                          }`}
                          style={{ background: statusMeta[cell.status].swatch }}
                        >
                          {cell.feeMarker && (
                            <span
                              className="absolute right-0.5 top-0.5 rounded-sm bg-bg/90 px-0.5 text-[10px] font-bold leading-tight text-brass"
                              aria-hidden="true"
                            >
                              £
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </main>
  );
}
