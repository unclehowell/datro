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
import { responseAssessments, rfsDimensions, rfsScale, rfsMethodNote, unscoredResponses } from "@/data/response-assessments";

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

      <p className="text-sm text-muted">Message-level response assessments are now included. <a href="#response-tactics-audit" className="text-brass underline decoration-brass underline-offset-4">Jump to Response Friction Scores (RFS)</a>.</p>

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

      <section id="response-tactics-audit" className="mt-8 scroll-mt-6 border-t border-line pt-6" aria-labelledby="rfs-heading">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs tracking-[0.18em] text-brass uppercase">Three-hat review · source-checked sample</p>
            <h2 id="rfs-heading" className="mt-1 font-serif text-2xl leading-tight text-fg md:text-3xl">
              Response Tactics &amp; Response Friction Score
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              RFS is the auditable label; “arsehole score” is the informal shorthand. Scores apply to individual messages, not an entire institution or a person’s character. Higher means more observable friction—not proof of motive, concealment or illegality.
            </p>
          </div>
          <div className="rounded-xl border border-line bg-surface px-3 py-2 text-xs text-muted">
            <p><strong className="text-fg">7</strong> source-reviewed messages</p>
            <p><strong className="text-fg">7</strong> currently scored</p>
            <p>Unreviewed replies remain unscored</p>
          </div>
        </div>

        <div className="mb-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {rfsDimensions.map((dimension) => (
            <article key={dimension.name} className="rounded-xl border border-line bg-surface p-3">
              <h3 className="text-sm font-semibold text-fg">{dimension.name}</h3>
              <p className="mt-1 text-xs leading-relaxed text-muted">{dimension.description}</p>
              <p className="mt-2 text-[11px] text-faint">Score each: 0–2</p>
            </article>
          ))}
        </div>

        <div className="mb-5 flex flex-wrap gap-2">
          {rfsScale.map((item) => (
            <span key={item.range} className="rounded-full border border-line bg-surface px-3 py-1.5 text-xs text-muted">
              <strong className="text-fg">{item.range}</strong> {item.label}
            </span>
          ))}
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          {responseAssessments.map((assessment) => (
            <article key={assessment.id} className="rounded-2xl border border-line bg-surface p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs tracking-wide text-faint uppercase">{assessment.recipient} · {assessment.date}</p>
                  <h3 className="mt-1 font-serif text-xl leading-tight text-fg">{assessment.subject}</h3>
                  <p className="mt-1 text-xs text-muted">Confidence: <span className="font-semibold text-fg">{assessment.confidence}</span> · {assessment.sourceStatus}</p>
                </div>
                <div className="shrink-0 rounded-xl border border-line bg-surface-2 px-3 py-2 text-center">
                  <p className="text-[10px] tracking-wide text-muted uppercase">RFS</p>
                  <p className="text-2xl font-semibold tabular-nums text-fg">{assessment.score}<span className="text-sm text-muted">/10</span></p>
                </div>
              </div>

              <p className="mt-3 text-sm leading-relaxed text-fg">{assessment.basis}</p>

              <div className="mt-3">
                <p className="text-xs font-semibold tracking-wide text-muted uppercase">Signals observed</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {assessment.tags.map((tag) => (
                    <span key={tag} className="rounded-md border border-line px-2 py-1 text-xs text-muted">{tag}</span>
                  ))}
                </div>
              </div>

              <div className="mt-3">
                <p className="text-xs font-semibold tracking-wide text-muted uppercase">Force · Secrecy · Licence lens</p>
                <p className="mt-1 text-sm text-muted">{assessment.powerLenses.length ? assessment.powerLenses.join(" · ") : "No power-lens tag supported by this message."}</p>
              </div>

              <details className="mt-4 border-t border-line pt-3">
                <summary className="cursor-pointer text-sm font-semibold text-fg">Why this score? See component scores and caveats</summary>
                <ul className="mt-3 space-y-2">
                  {assessment.dimensions.map((dimension) => (
                    <li key={dimension.name} className="text-sm">
                      <p className="font-semibold text-fg">{dimension.name}: {dimension.score}/2</p>
                      <p className="mt-0.5 text-xs leading-relaxed text-muted">{dimension.basis}</p>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 border-t border-line pt-3">
                  <p className="text-xs font-semibold text-fg">Mitigating features</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted">{assessment.mitigatingEvidence}</p>
                  <p className="mt-3 text-xs font-semibold text-fg">Source limits</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted">{assessment.limits}</p>
                </div>
              </details>

              <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-t border-line pt-3 text-sm">
                {assessment.threadUrl && (
                  <a href={assessment.threadUrl} target="_blank" rel="noreferrer" className="text-brass underline decoration-brass underline-offset-4">Open email thread <ExternalLink className="inline size-3" aria-hidden /></a>
                )}
                <a href={assessment.sourceUrl} target="_blank" rel="noreferrer" className="text-brass underline decoration-brass underline-offset-4">Read source text <ExternalLink className="inline size-3" aria-hidden /></a>
              </div>
            </article>
          ))}
        </div>

        <section className="mt-6 rounded-2xl border border-line bg-surface p-4" aria-labelledby="rfs-unscored">
          <h3 id="rfs-unscored" className="font-serif text-xl text-fg">Unscored pending source review</h3>
          <p className="mt-1 text-sm leading-relaxed text-muted">The three-hat predictions are hypotheses to test against replies, not automatic labels. These items are deliberately left unscored until the actual response or attachment is read, or the relevant deadline is verified.</p>
          <ul className="mt-3 divide-y divide-line">
            {unscoredResponses.map((item) => (
              <li key={item.id} className="py-3 first:pt-0 last:pb-0">
                <p className="text-sm font-semibold text-fg">{item.recipient}</p>
                <p className="mt-0.5 text-xs font-semibold text-muted">{item.status}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted">{item.reason}</p>
              </li>
            ))}
          </ul>
        </section>

        <div className="mt-4 flex flex-col gap-2 rounded-xl border border-line bg-surface px-4 py-3">
          <p className="text-xs font-semibold tracking-wide text-muted uppercase">Scoring rule</p>
          <p className="text-sm leading-relaxed text-muted">{rfsMethodNote}</p>
          <p className="text-xs text-faint">Official reference: <a href="https://ico.org.uk/for-organisations/foi/freedom-of-information-and-environmental-information-regulations/section-12-requests-where-the-cost-of-compliance-exceeds-the-appropriate-limit/" target="_blank" rel="noreferrer" className="text-brass underline decoration-brass underline-offset-4">ICO section 12 guidance</a> · <a href="https://ico.org.uk/for-organisations/foi/freedom-of-information-and-environmental-information-regulations/section-16-advice-and-assistance/" target="_blank" rel="noreferrer" className="text-brass underline decoration-brass underline-offset-4">section 16 advice and assistance</a> · <a href="https://ico.org.uk/for-organisations/foi/freedom-of-information-and-environmental-information-regulations/section-17-refusing-a-request-writing-a-refusal-notice/" target="_blank" rel="noreferrer" className="text-brass underline decoration-brass underline-offset-4">section 17 refusal notices</a>.</p>
          <p className="text-xs text-faint">Coverage note: the first pass scores seven source-reviewed messages from the indexed archive; it is not a rating of all 585 Wayback objects, and the archive classification does not mean every indexed object is an independently verified email.</p>
        </div>
      </section>
    </main>
  );
}
