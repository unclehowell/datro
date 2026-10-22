import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  attributedDisclosureLabel,
  classifyRegime,
  deadlineLabel,
  evidenceMeta,
  phaseRequirement,
  regimeById,
  regimes,
  roadmapStepRequirement,
  sources,
} from "../data/legal-routes.ts";

describe("legal-route categorisation", () => {
  it("keeps the eight access regimes apart", () => {
    const cases: [string, string][] = [
      ["FOI request 2026-024 under the Freedom of Information Act", "foia"],
      ["EIR request 26/04323 environmental information", "eir"],
      ["Subject access request under Article 15", "uk-gdpr-sar"],
      ["Access request under DPA 2018 Part 3 (law enforcement)", "dpa-part3"],
      ["Access to Health Records Act application: deceased patient records", "ahra-deceased"],
      ["OC2 copy of a filed transfer", "hmlr-records"],
      ["ICR/090/26 Independent Complaints Reviewer", "hmlr-complaint"],
      ["Discovery catalogue search, BD 28/177", "archives"],
      ["CPR 5.4C non-party access to the court file", "court-records"],
      ["Letter to the MS and council scrutiny", "accountability"],
    ];
    for (const [text, want] of cases) assert.equal(classifyRegime(text), want, text);
    assert.equal(classifyRegime("Thanks for your email"), null);
  });

  it("does not label every data request 'DPA section 45'", () => {
    assert.equal(classifyRegime("SAR to the council"), "uk-gdpr-sar");
    assert.notEqual(regimeById["uk-gdpr-sar"].name, regimeById["dpa-part3"].name);
  });

  it("makes the FOIA review good practice and the EIR review statutory", () => {
    const foia = regimeById.foia.steps.find((s) => s.id === "review")!;
    const eir = regimeById.eir.steps.find((s) => s.id === "review")!;
    assert.equal(foia.requirement, "expected");
    assert.equal(eir.requirement, "statutory");
    assert.match(eir.deadline!.text, /40 working days/);
    assert.equal(phaseRequirement("review", "Internal review").requirement, "expected");
    assert.equal(phaseRequirement("review", "EIR reconsideration of 27589").requirement, "statutory");
  });

  it("never makes an accountability route a prerequisite", () => {
    for (const s of regimeById.accountability.steps) assert.equal(s.requirement, "parallel");
    for (const ph of ["democratic", "psow", "phso", "petition"]) assert.equal(phaseRequirement(ph).requirement, "parallel");
    assert.equal(roadmapStepRequirement("complaint", "FOIA").requirement, "parallel");
  });

  it("keeps the ICR to service complaints", () => {
    const icr = regimeById["hmlr-complaint"].steps.find((s) => s.id === "icr")!;
    assert.match(icr.note, /no power to review or overturn registration decisions/i);
    assert.notEqual(regimeById["hmlr-records"].id, regimeById["hmlr-complaint"].id);
  });

  it("treats a deceased patient's records apart from subject access", () => {
    assert.match(regimeById["ahra-deceased"].notThis, /Not a UK GDPR subject-access request/);
  });
});

describe("deadline labels", () => {
  it("names what kind of limit each deadline is", () => {
    const foiaResp = regimeById.foia.steps.find((s) => s.id === "response")!;
    assert.match(deadlineLabel(foiaResp)!, /statutory time limit/);
    const foiaReview = regimeById.foia.steps.find((s) => s.id === "review")!;
    assert.match(deadlineLabel(foiaReview)!, /not statutory/);
    const ico = regimeById.foia.steps.find((s) => s.id === "regulator")!;
    assert.match(deadlineLabel(ico)!, /guidance, not statutory/);
    const stage1 = regimeById["hmlr-complaint"].steps.find((s) => s.id === "stage1")!;
    assert.match(deadlineLabel(stage1)!, /service standard, not statutory/);
    assert.equal(deadlineLabel(regimeById.archives.steps[0]), null);
  });

  it("never presents a non-statutory target as statutory", () => {
    for (const r of regimes)
      for (const s of r.steps)
        if (s.deadline && s.deadline.basis !== "statute") assert.doesNotMatch(deadlineLabel(s)!, /statutory time limit/);
    assert.match(roadmapStepRequirement("review_deadline", "FOIA").text, /not a statutory deadline/);
    assert.match(roadmapStepRequirement("review_deadline", "EIR").text, /reg\. 11\(4\)/);
    assert.match(roadmapStepRequirement("chaser", "EIR").text, /changes no statutory deadline/);
  });

  it("cites only sources on the register", () => {
    const ids = new Set(sources.map((s) => s.id));
    for (const r of regimes) for (const s of r.steps) for (const id of s.sources) assert.ok(ids.has(id), id);
    for (const s of sources) assert.match(s.url, /^https:\/\/(www\.legislation\.gov\.uk|ico\.org\.uk|www\.gov\.uk)\//);
  });
});

describe("evidence statuses", () => {
  it("keeps not held, not located, withheld and destroyed apart, and has no 'never existed'", () => {
    const labels = ["not-held-asserted", "not-located", "refused", "destruction-asserted", "destruction-evidenced"].map(
      (k) => evidenceMeta[k as keyof typeof evidenceMeta].label,
    );
    assert.equal(new Set(labels).size, labels.length);
    assert.ok(!Object.keys(evidenceMeta).some((k) => /^(never|closed|nothing)/.test(k)));
    assert.match(evidenceMeta["not-located"].meaning, /Not proof of destruction or non-existence/);
    assert.match(evidenceMeta["destruction-asserted"].meaning, /Attributed to the institution/);
    assert.match(evidenceMeta.acknowledged.meaning, /completes nothing/);
  });

  it("keeps the date of disclosure apart from the family's reading", () => {
    assert.equal(attributedDisclosureLabel("12 Oct 2026", false), "Disclosed 12 Oct 2026");
    assert.equal(
      attributedDisclosureLabel("12 Oct 2026", true),
      "Disclosed 12 Oct 2026: the family contends it was previously concealed",
    );
  });
});
