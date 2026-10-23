import inventory from "../../sources.json";

const METHODS = [
  { id: "socratic", name: "Socratic method", description: "Test assumptions through disciplined questions; distinguish claims, sources, evidence, inference and unknowns; seek counterevidence and rival explanations." },
  { id: "prince2", name: "PRINCE2 Project Management (Version 7)", description: "Evaluate governance, continued justification, roles, plans, quality, risks, issues, change control, dependencies, tolerances and stage gates." },
  { id: "roberts", name: "Robert's Rules of Order", description: "Assess motions, debate, voting, agendas and minutes only where the rules are applicable and adopted; check legislation and standing orders first." },
  { id: "evidence", name: "Evidence and archival integrity", description: "Improve provenance, stable identifiers, chronology, versioning, source reconciliation and explicit treatment of uncertainty." },
  { id: "engineering", name: "Software engineering and release control", description: "Evaluate architecture, branch integrity, tests, API contracts, security, accessibility, docs and release verification." }
];

export async function onRequestGet() {
  return Response.json({
    ok: true,
    product: "Tumbler",
    version: "0.1.0",
    methods: METHODS,
    inventory,
    capabilities: {
      liveBranchHeads: true,
      researchMirrorRetrieval: true,
      qaGraphRetrieval: true,
      exhaustiveWholeEstateIndex: false
    },
    coverageWarning: "This first release does not yet contain a verified full-text index of every file on every branch and every registered host. The dated inventory is a discovery seed; each source needs indexing and coverage reporting before an exhaustive assessment can be claimed."
  }, { headers: { "cache-control": "no-store", "x-content-type-options": "nosniff" } });
}
