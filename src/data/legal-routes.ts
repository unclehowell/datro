/**
 * Legal routes by regime, and the evidence-status model used across the dartboard.
 *
 * Why this file exists (22 Oct 2026): the rings used to read as one compulsory ladder
 * (request → reply → chase → review → complaint → regulator → democratic → tribunal).
 * That is not the law. Each matter follows the route of its own regime; some steps are
 * statutory, some are regulator good practice, some are optional, and accountability
 * routes (MPs, MSs, councillors, ombudsmen) run in parallel and are never a prerequisite
 * to a statutory complaint or appeal. Time-limited remedies (tribunal, court) are never
 * held back to "use up" other routes.
 *
 * Dartboard is a visualisation. The live deadline register is the work-control system;
 * the published research archive is the wiki; the email master is the Wayback archive.
 * Every source below was opened and read on VERIFIED_ON. See LEGAL_SOURCES.md.
 */

export const VERIFIED_ON = "2026-10-22";

export type Requirement = "statutory" | "expected" | "optional" | "parallel";
export type DeadlineBasis =
  | "statute"
  | "code-of-practice"
  | "regulator-guidance"
  | "service-standard"
  | "tribunal-guidance"
  | "legal-advice";

export const requirementMeta: Record<Requirement, { label: string; hint: string }> = {
  statutory: { label: "Statutory", hint: "Set by legislation for this regime." },
  expected: {
    label: "Expected",
    hint: "Good practice or the regulator's normal expectation; not a statutory precondition.",
  },
  optional: { label: "Optional", hint: "Available if useful; nothing is lost by not using it." },
  parallel: {
    label: "Parallel",
    hint: "Runs alongside the information-rights route; never a prerequisite and never a reason to wait.",
  },
};

export const basisMeta: Record<DeadlineBasis, string> = {
  statute: "statutory time limit",
  "code-of-practice": "code-of-practice target, not statutory",
  "regulator-guidance": "regulator's published guidance, not statutory",
  "service-standard": "the body's own service standard, not statutory",
  "tribunal-guidance": "tribunal time limit (late appeals need permission)",
  "legal-advice": "court time limit: needs independent legal advice",
};

export type Source = { id: string; title: string; url: string; provision: string; confirms: string };

export const sources: Source[] = [
  { id: "foia-s10", title: "FOIA 2000 s.10", url: "https://www.legislation.gov.uk/ukpga/2000/36/section/10", provision: "s.10(1), s.10(3)", confirms: "Comply promptly and not later than the twentieth working day following receipt; a public-interest extension must be reasonable." },
  { id: "foia-s50", title: "FOIA 2000 s.50", url: "https://www.legislation.gov.uk/ukpga/2000/36/section/50", provision: "s.50(1), s.50(2)(a)–(b)", confirms: "Any person may apply for a decision; the regulator need not decide where the complainant has not exhausted the authority's complaints procedure, or after undue delay. The text now reads 'Commission' (Data (Use and Access) Act 2025)." },
  { id: "ico-s17", title: "ICO: section 17 refusal notices", url: "https://ico.org.uk/for-organisations/foi/freedom-of-information-and-environmental-information-regulations/section-17-refusing-a-request-writing-a-refusal-notice/", provision: "Internal review and appeals section; s.12 and s.16", confirms: "No statutory requirement to offer an internal review under FOIA; authorities should have one to conform to the s.45 Code. A s.12 refusal should break down the cost estimate and offer advice and assistance (s.16)." },
  { id: "eir-r5", title: "EIR 2004 reg. 5", url: "https://www.legislation.gov.uk/uksi/2004/3391/regulation/5", provision: "reg. 5(2)", confirms: "Information made available as soon as possible and no later than 20 working days after receipt." },
  { id: "eir-r7", title: "EIR 2004 reg. 7", url: "https://www.legislation.gov.uk/uksi/2004/3391/regulation/7", provision: "reg. 7(1)", confirms: "Extension from 20 to 40 working days where complexity and volume make the earlier period impracticable." },
  { id: "eir-r11", title: "EIR 2004 reg. 11 (as in force 30 Sep 2026)", url: "https://www.legislation.gov.uk/uksi/2004/3391/2026-09-30", provision: "reg. 11(2), 11(4)", confirms: "Representations in writing no later than 40 working days after the date the applicant believes the authority failed to comply; decision no later than 40 working days after receipt of the representations." },
  { id: "ico-eir-ir", title: "ICO: internal reviews under the EIR", url: "https://ico.org.uk/for-organisations/foi/freedom-of-information-and-environmental-information-regulations/internal-reviews-under-the-environmental-information-regulations-eir/", provision: "Whole page", confirms: "Unlike FOIA, the EIR requires an internal review to be offered (reg. 11; details under reg. 14(5))." },
  { id: "ico-complaints", title: "ICO: what to expect from an FOI or EIR complaint", url: "https://ico.org.uk/make-a-complaint/foi-and-eir-complaints/what-to-expect-from-the-ico-when-making-an-foi-or-eir-complaint/", provision: "Before you complain; timing", confirms: "Complain to the authority first (internal review); complain to the ICO within six weeks of the final response or last substantive contact; where no initial response was given, show the attempt to resolve it directly." },
  { id: "ico-sar", title: "ICO: a guide to subject access (updated 16 Jul 2026)", url: "https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/subject-access-requests/a-guide-to-subject-access", provision: "Time limits, clarification, search", confirms: "One month; extendable by up to two further months if complex or several requests; clarification stops the clock; a reasonable and proportionate search. Reflects the Data (Use and Access) Act 2025." },
  { id: "dpa-s45", title: "DPA 2018 s.45 (Part 3)", url: "https://www.legislation.gov.uk/ukpga/2018/12/section/45", provision: "s.45(1), (3), (4)", confirms: "Right of access to personal data processed for law-enforcement purposes by a competent authority; restrictions under s.45(4)." },
  { id: "dpa-s54", title: "DPA 2018 s.54", url: "https://www.legislation.gov.uk/ukpga/2018/12/section/54", provision: "s.54(2), (3A)", confirms: "Applicable time period one month from the relevant time; may be extended by two further months on notice." },
  { id: "ahra-s3", title: "Access to Health Records Act 1990 s.3", url: "https://www.legislation.gov.uk/ukpga/1990/23/section/3", provision: "s.3(1)(f)–(g), s.3(5)", confirms: "Where the patient has died: the personal representative and any person who may have a claim arising out of the death may apply; access within 40 days (21 days where all entries are recent)." },
  { id: "hmlr-access", title: "HM Land Registry: finding information it holds", url: "https://www.gov.uk/guidance/finding-information-held-by-hm-land-registry", provision: "OC1, OC2, HC1", confirms: "OC1 for official copies of the register or title plan; OC2 for deeds and documents marked 'copy filed'; HC1 for historical copies of the register or title plan." },
  { id: "hmlr-complaints", title: "HM Land Registry: complaints procedure", url: "https://www.gov.uk/government/organisations/land-registry/about/complaints-procedure", provision: "Stages 1 and 2; ICR; court action", confirms: "Two internal stages (aim of 20 working days at stage 1); then the Independent Complaints Reviewer for service failures, with no power to review or overturn registration decisions or comment on points of law; MP referral to the Ombudsman after that; judicial review is served on the Chief Land Registrar." },
  { id: "cpr-5-4c", title: "Civil Procedure Rules r.5.4C", url: "https://www.legislation.gov.uk/uksi/1998/3132/rule/5.4C", provision: "r.5.4C(1)", confirms: "A non-party may obtain from the court records a statement of case and a judgment or order given or made in public; other documents need the court's permission." },
  { id: "grc-appeal", title: "GOV.UK: appeal against the Commissioner's decision", url: "https://www.gov.uk/guidance/information-rights-appeal-against-the-commissioners-decision", provision: "Time limits", confirms: "28 days to appeal to the First-tier Tribunal (General Regulatory Chamber) after the decision is sent; late appeals need the tribunal's agreement." },
];

export type Step = {
  id: string;
  label: string;
  requirement: Requirement;
  /** Time limit text, when there is one, and what kind of limit it is. */
  deadline?: { text: string; basis: DeadlineBasis };
  note: string;
  sources: string[];
};

export type RegimeId =
  | "foia"
  | "eir"
  | "uk-gdpr-sar"
  | "dpa-part3"
  | "ahra-deceased"
  | "hmlr-records"
  | "hmlr-complaint"
  | "archives"
  | "court-records"
  | "accountability";

export type Regime = {
  id: RegimeId;
  name: string;
  short: string;
  appliesTo: string;
  steps: Step[];
  /** What this route does not do, or must not be merged with. */
  notThis: string;
  uncertain?: string;
};

export const regimes: Regime[] = [
  {
    id: "foia",
    name: "Freedom of Information Act 2000",
    short: "FOIA",
    appliesTo: "Recorded information held by a public authority, where the EIR or data-protection law does not apply instead.",
    steps: [
      { id: "request", label: "Request (record the receipt date)", requirement: "statutory", note: "Keep the request, the date it was received and any acknowledgement.", sources: ["foia-s10"] },
      { id: "response", label: "Response or refusal notice", requirement: "statutory", deadline: { text: "20 working days from receipt; a public-interest extension must be reasonable", basis: "statute" }, note: "A refusal names the exemption and, where it applies, the public-interest reasoning. A valid fees notice or a clarification request changes the clock only as the Act provides; record the evidence.", sources: ["foia-s10", "ico-s17"] },
      { id: "s12", label: "Cost-limit refusal (s.12): record the estimate and the help offered (s.16)", requirement: "statutory", note: "Ask for the breakdown and advice on narrowing the request.", sources: ["ico-s17"] },
      { id: "review", label: "Internal review", requirement: "expected", deadline: { text: "the authority's own procedure; the s.45 Code sets targets", basis: "code-of-practice" }, note: "Not a statutory requirement under FOIA. The ICO normally expects the authority to have been asked to look again before a complaint.", sources: ["ico-s17", "ico-complaints"] },
      { id: "regulator", label: "Complaint to the Information Commission (s.50)", requirement: "statutory", deadline: { text: "within six weeks of the final response or last substantive contact", basis: "regulator-guidance" }, note: "Where no response came at all, show the attempt to resolve it with the authority.", sources: ["foia-s50", "ico-complaints"] },
      { id: "tribunal", label: "Appeal to the First-tier Tribunal", requirement: "statutory", deadline: { text: "28 days after the decision notice is sent", basis: "tribunal-guidance" }, note: "Runs from the regulator's decision; never wait on other routes.", sources: ["grc-appeal"] },
    ],
    notThis: "Not for environmental information (EIR), the requester's own personal data (data-protection law), deceased patients' records (AHRA 1990) or court records held by a court (CPR Part 5).",
  },
  {
    id: "eir",
    name: "Environmental Information Regulations 2004",
    short: "EIR",
    appliesTo: "Environmental information, including land use, planning, conservation and the state of land and buildings affected by them.",
    steps: [
      { id: "request", label: "Request (record the receipt date)", requirement: "statutory", note: "A request need not name the EIR; the authority must apply the right regime.", sources: ["eir-r5"] },
      { id: "response", label: "Response or refusal under an exception", requirement: "statutory", deadline: { text: "20 working days from receipt; 40 if complexity and volume justify an extension", basis: "statute" }, note: "Refusals name the exception and the public-interest test.", sources: ["eir-r5", "eir-r7"] },
      { id: "review", label: "Regulation 11 representations (internal review)", requirement: "statutory", deadline: { text: "send within 40 working days of the failure; decision due within 40 working days of receipt", basis: "statute" }, note: "A statutory review, separate from any FOIA review the same authority runs.", sources: ["eir-r11", "ico-eir-ir"] },
      { id: "regulator", label: "Complaint to the Information Commission (reg. 18)", requirement: "statutory", deadline: { text: "within six weeks of the review outcome or last substantive contact", basis: "regulator-guidance" }, note: "The ICO expects the regulation 11 route to have been used first.", sources: ["ico-complaints"] },
      { id: "tribunal", label: "Appeal to the First-tier Tribunal", requirement: "statutory", deadline: { text: "28 days after the decision notice is sent", basis: "tribunal-guidance" }, note: "Time-limited.", sources: ["grc-appeal"] },
    ],
    notThis: "Do not merge the regulation 11 review with a FOIA internal review because the same team handles both.",
  },
  {
    id: "uk-gdpr-sar",
    name: "Subject access (UK GDPR Article 15)",
    short: "SAR",
    appliesTo: "A living requester's own personal data held by a controller, outside law-enforcement processing.",
    steps: [
      { id: "request", label: "Subject-access request", requirement: "statutory", note: "Record receipt and any identity check.", sources: ["ico-sar"] },
      { id: "response", label: "Response", requirement: "statutory", deadline: { text: "one month; up to two further months if complex or several requests", basis: "statute" }, note: "A clarification request stops the clock until the answer arrives; the controller must make a reasonable and proportionate search.", sources: ["ico-sar"] },
      { id: "complaint", label: "Complaint to the controller", requirement: "expected", note: "The refusal must explain the right to complain to the controller and to the ICO.", sources: ["ico-sar"] },
      { id: "regulator", label: "Complaint to the Information Commission", requirement: "statutory", note: "Separate from FOIA/EIR complaints.", sources: ["ico-sar"] },
      { id: "court", label: "Court enforcement", requirement: "optional", deadline: { text: "court time limits apply", basis: "legal-advice" }, note: "Independent legal advice first.", sources: ["ico-sar"] },
    ],
    notThis: "Not 'DPA section 45' unless the processing is law enforcement by a competent authority. Not for a deceased person's records.",
  },
  {
    id: "dpa-part3",
    name: "Law-enforcement access (DPA 2018 Part 3, s.45)",
    short: "DPA Pt 3",
    appliesTo: "Personal data processed for law-enforcement purposes by a competent authority (for example police or a prosecutor acting in that capacity).",
    steps: [
      { id: "request", label: "Access request under s.45", requirement: "statutory", note: "Say which processing is in issue; the authority confirms which regime applies.", sources: ["dpa-s45"] },
      { id: "response", label: "Response (may be restricted under s.45(4))", requirement: "statutory", deadline: { text: "one month from the relevant time; extendable by two further months on notice", basis: "statute" }, note: "A restriction must be explained unless that would itself undermine the purpose.", sources: ["dpa-s45", "dpa-s54"] },
      { id: "regulator", label: "Complaint to the Information Commission", requirement: "statutory", note: "Separate from any FOIA request to the same body.", sources: ["dpa-s45"] },
    ],
    notThis: "A FOIA request to the same force or prosecutor is a separate request under FOIA.",
  },
  {
    id: "ahra-deceased",
    name: "Deceased patients' records (Access to Health Records Act 1990 s.3)",
    short: "AHRA",
    appliesTo: "Health records of a person who has died.",
    steps: [
      { id: "eligibility", label: "Confirm eligibility", requirement: "statutory", note: "The personal representative, or a person who may have a claim arising out of the death.", sources: ["ahra-s3"] },
      { id: "request", label: "Application to the record holder", requirement: "statutory", deadline: { text: "40 days (21 days where every entry is from the last 40 days)", basis: "statute" }, note: "Record the date and evidence of eligibility.", sources: ["ahra-s3"] },
    ],
    notThis: "Not a UK GDPR subject-access request. Administrative or non-personal records of the health body go by FOIA or the EIR instead.",
  },
  {
    id: "hmlr-records",
    name: "HM Land Registry records access",
    short: "HMLR copies",
    appliesTo: "Registers, title plans and filed documents.",
    steps: [
      { id: "oc1", label: "OC1: official copy of the register or title plan", requirement: "optional", note: "Fee-based service; no statutory response clock.", sources: ["hmlr-access"] },
      { id: "oc2", label: "OC2: deeds and documents marked 'copy filed'", requirement: "optional", note: "Fee-based service.", sources: ["hmlr-access"] },
      { id: "hc1", label: "HC1: historical copies of the register or title plan", requirement: "optional", note: "Contact the registry first for very old material.", sources: ["hmlr-access"] },
    ],
    notThis: "A records-access route, not a complaint and not a challenge to a registration decision.",
  },
  {
    id: "hmlr-complaint",
    name: "HM Land Registry complaints and legal routes",
    short: "HMLR complaint",
    appliesTo: "Service failures by the registry; registration decisions go by legal routes.",
    steps: [
      { id: "stage1", label: "Complaint, stage 1", requirement: "expected", deadline: { text: "aim of 20 working days", basis: "service-standard" }, note: "The registry's own procedure.", sources: ["hmlr-complaints"] },
      { id: "stage2", label: "Complaint, stage 2 (senior review)", requirement: "expected", deadline: { text: "contact within 20 working days", basis: "service-standard" }, note: "", sources: ["hmlr-complaints"] },
      { id: "icr", label: "Independent Complaints Reviewer", requirement: "optional", note: "Service failures only. No power to review or overturn registration decisions or comment on points of law.", sources: ["hmlr-complaints"] },
      { id: "legal", label: "Rectification, indemnity or judicial review", requirement: "optional", deadline: { text: "court and limitation deadlines: flag for independent legal advice now", basis: "legal-advice" }, note: "Separate from the complaint route; never held back for it. Judicial review is served on the Chief Land Registrar.", sources: ["hmlr-complaints"] },
    ],
    notThis: "Information-rights requests to the registry (FOIA, EIR, SAR) are tracked under their own regimes.",
  },
  {
    id: "archives",
    name: "Archives and historical records",
    short: "Archives",
    appliesTo: "The National Archives, Glamorgan Archives, the National Library of Wales, heritage bodies, archaeological repositories and other record holders.",
    steps: [
      { id: "catalogue", label: "Catalogue search (series, reference, finding aids)", requirement: "optional", note: "Check whether the record is already open or catalogued before any FOI request.", sources: [] },
      { id: "transfer", label: "Transfer history and access restrictions", requirement: "optional", note: "Record who held it, when it moved and any closure.", sources: [] },
      { id: "copy", label: "Copy or search request", requirement: "optional", note: "Paid services have no statutory clock.", sources: [] },
      { id: "foi", label: "FOI or EIR, only for a closed or uncatalogued record held by a public authority", requirement: "optional", note: "Then the FOIA or EIR route applies.", sources: ["foia-s10"] },
    ],
    notThis: "A private company, former employer or private collection is not automatically subject to FOIA; identify the holder and use voluntary, contractual or legal routes.",
  },
  {
    id: "court-records",
    name: "Court records (CPR Part 5)",
    short: "CPR 5.4C",
    appliesTo: "Documents on a court file.",
    steps: [
      { id: "nonparty", label: "Request to court staff under r.5.4C(1)", requirement: "statutory", note: "Statements of case and judgments or orders made in public.", sources: ["cpr-5-4c"] },
      { id: "permission", label: "Application for the court's permission for other documents", requirement: "optional", deadline: { text: "court procedure: legal advice", basis: "legal-advice" }, note: "", sources: ["cpr-5-4c"] },
    ],
    notThis: "Not a FOI request, and not litigation disclosure between parties.",
  },
  {
    id: "accountability",
    name: "Complaints and democratic accountability",
    short: "Accountability",
    appliesTo: "Service complaints, monitoring officers and standards, regulators, MPs and MSs, council scrutiny and the ombudsmen.",
    steps: [
      { id: "service", label: "The body's own service complaint", requirement: "parallel", note: "Separate from information-rights reviews.", sources: [] },
      { id: "elected", label: "MP, MS or councillor", requirement: "parallel", note: "Never a prerequisite to a statutory complaint or appeal.", sources: [] },
      { id: "ombudsman", label: "Ombudsman (Wales or UK)", requirement: "parallel", note: "Check each body's remit and procedure before use.", sources: ["hmlr-complaints"] },
    ],
    notThis: "Accountability routes are not stages of an information-rights appeal and never pause its deadlines.",
    uncertain: "Each body's remit and current procedure is to be checked before use; not all were re-read on 22 Oct 2026.",
  },
];

export const regimeById = Object.fromEntries(regimes.map((r) => [r.id, r])) as Record<RegimeId, Regime>;

/** Guess the regime from a request's words. Returns null when the words do not settle it. */
export function classifyRegime(text: string): RegimeId | null {
  const t = ` ${String(text || "").toLowerCase()} `;
  if (/\bcpr\b|5\.4c|court (file|record)|non-party access/.test(t)) return "court-records";
  if (/access to health records|ahra|deceased.{0,40}(health|medical|patient)|(health|medical) records?.{0,40}(deceased|died|death)/.test(t)) return "ahra-deceased";
  if (/\bicr\b|independent complaints reviewer/.test(t)) return "hmlr-complaint";
  if (/\boc1\b|\boc2\b|\bhc1\b|official cop(y|ies)/.test(t)) return "hmlr-records";
  if (/part 3|law[- ]enforcement|s\.?\s?45 dpa|dpa 2018 s\.?\s?45/.test(t)) return "dpa-part3";
  if (/subject[- ]access|\bsar\b|article 15|art\.? 15/.test(t)) return "uk-gdpr-sar";
  if (/\beir\b|environmental information|reg(ulation)?\.? 11\b/.test(t)) return "eir";
  if (/\bfoi\b|\bfoia\b|freedom of information/.test(t)) return "foia";
  if (/catalogue|discovery|archives?\b|reading room|finding aid/.test(t)) return "archives";
  if (/\bmp\b|\bms\b|councillor|scrutiny|ombudsman|monitoring officer|standards/.test(t)) return "accountability";
  return null;
}

/** Plain label for a deadline, naming what kind of limit it is. */
export function deadlineLabel(step: Step): string | null {
  if (!step.deadline) return null;
  return `${step.deadline.text} (${basisMeta[step.deadline.basis]})`;
}

export type EvidenceStatus =
  | "drafted"
  | "sent"
  | "acknowledged"
  | "awaiting"
  | "clarification"
  | "disclosed"
  | "disclosed-partial"
  | "redacted"
  | "refused"
  | "not-held-asserted"
  | "not-located"
  | "destruction-asserted"
  | "destruction-evidenced"
  | "review-pending"
  | "complaint-pending"
  | "regulator-pending"
  | "tribunal-pending"
  | "court-pending"
  | "completed";

export const evidenceMeta: Record<EvidenceStatus, { label: string; meaning: string; ask?: string }> = {
  drafted: { label: "Request drafted", meaning: "Written, not sent." },
  sent: { label: "Request sent", meaning: "Sent; receipt not yet evidenced." },
  acknowledged: { label: "Acknowledged", meaning: "Receipt confirmed. An acknowledgement completes nothing." },
  awaiting: { label: "Awaiting response", meaning: "Within or past the response period, no substantive answer." },
  clarification: { label: "Clarification required", meaning: "The body asked for clarification; any clock effect is recorded with its evidence." },
  disclosed: { label: "Disclosed", meaning: "Records released in substance. The date of disclosure is kept separately from any reading of past availability." },
  "disclosed-partial": { label: "Partly disclosed", meaning: "Some records released, some not." },
  redacted: { label: "Disclosed with redactions", meaning: "Released with parts withheld; the basis is recorded." },
  refused: { label: "Refused or withheld", meaning: "Withheld under a stated legal basis, with the review or appeal route." },
  "not-held-asserted": { label: "'Not held' (institution's position)", meaning: "The institution states it holds no record. Not proof that none ever existed.", ask: "Ask what was searched: systems, series, terms, and the retention schedule." },
  "not-located": { label: "Not located after a described search", meaning: "A search is described and found nothing. Not proof of destruction or non-existence.", ask: "Ask for the search description and coverage, where it exists." },
  "destruction-asserted": { label: "Destruction stated by the institution", meaning: "Attributed to the institution until reliable evidence supports it.", ask: "Ask for the retention schedule and any disposal authority or record." },
  "destruction-evidenced": { label: "Destruction supported by evidence", meaning: "A disposal record or equivalent reliable evidence is on file." },
  "review-pending": { label: "Internal review pending", meaning: "Under the regime's own review route." },
  "complaint-pending": { label: "Complaint pending", meaning: "With the body's complaints procedure." },
  "regulator-pending": { label: "With the regulator", meaning: "ICO, ICR or another regulator." },
  "tribunal-pending": { label: "Tribunal pending", meaning: "An appeal is lodged." },
  "court-pending": { label: "Court route pending", meaning: "An application or claim is in train." },
  completed: { label: "Completed", meaning: "Finished, with the outcome and the supporting record linked." },
};

/**
 * Wording for a record released after the family had sought it: the factual status and date
 * stay separate from the family's reading of its earlier availability.
 */
export function attributedDisclosureLabel(date: string | null, familyContendsConcealed: boolean): string {
  const base = date ? `Disclosed ${date}` : "Disclosed";
  return familyContendsConcealed ? `${base}: the family contends it was previously concealed` : base;
}

/** Badge for a roadmap rung's phase: how this kind of step stands in law. */
export function phaseRequirement(phase: string, label = ""): { requirement: Requirement; text: string } {
  const eir = /\beir\b|environmental/i.test(label);
  switch (phase) {
    case "foi":
    case "eir":
    case "sar":
    case "courtrec":
      return { requirement: "statutory", text: "Statutory right" };
    case "review":
      return eir
        ? { requirement: "statutory", text: "Statutory review (EIR reg. 11)" }
        : { requirement: "expected", text: "Good practice (FOIA s.45 Code); statutory only under the EIR" };
    case "ico":
      return { requirement: "statutory", text: "Statutory complaint; the ICO expects the body's own route first" };
    case "icr":
      return { requirement: "optional", text: "Service complaints only; not registration decisions" };
    case "tribunal":
    case "preaction":
    case "disclosure":
      return { requirement: "statutory", text: "Time-limited: never wait on other routes" };
    case "democratic":
    case "psow":
    case "phso":
    case "petition":
    case "iopc":
    case "iac":
    case "ccw":
    case "charity":
    case "regulator":
      return { requirement: "parallel", text: "Parallel accountability route, never a prerequisite" };
    case "complaint":
      return { requirement: "parallel", text: "Service complaint, separate from information rights" };
    default:
      return { requirement: "optional", text: "Optional" };
  }
}

/** Badge for one of the roadmap's eleven step types, read with the lane's regime ("EIR", "FOIA", "SAR" ...). */
export function roadmapStepRequirement(key: string, regime = ""): { requirement: Requirement; text: string } {
  const eir = /\beir\b|environmental/i.test(regime);
  const info = /\bfoi|\beir\b|environmental/i.test(regime) || regime === "";
  switch (key) {
    case "request":
      return { requirement: "statutory", text: `Statutory right${regime ? ` (${regime})` : ""}` };
    case "deadline":
      return { requirement: "statutory", text: "Statutory clock for this regime" };
    case "chaser":
      return { requirement: "optional", text: "Optional: our own timetable; it changes no statutory deadline" };
    case "review":
      return eir
        ? { requirement: "statutory", text: "Statutory review (EIR reg. 11): ask within 40 working days" }
        : info
          ? { requirement: "expected", text: "Good practice (FOIA s.45 Code); the ICO normally expects it first" }
          : { requirement: "expected", text: "The body's own reconsideration route, where one exists" };
    case "review_deadline":
      return eir
        ? { requirement: "statutory", text: "Decision due within 40 working days of the representations (EIR reg. 11(4))" }
        : { requirement: "expected", text: "Code-of-practice target, not a statutory deadline" };
    case "regulator":
      return { requirement: "statutory", text: "Statutory complaint; ICO guidance asks for it within six weeks of the final response" };
    case "decision":
      return { requirement: "statutory", text: "The regulator's decision notice" };
    case "tribunal":
      return { requirement: "statutory", text: "28 days from the decision notice: time-limited, never wait on other routes" };
    case "complaint":
      return { requirement: "parallel", text: "Parallel accountability route; never a prerequisite to the steps above" };
    case "preaction":
    case "court":
      return { requirement: "statutory", text: "Court time limits run independently: independent legal advice now, not after other routes" };
    default:
      return { requirement: "optional", text: "Optional" };
  }
}
