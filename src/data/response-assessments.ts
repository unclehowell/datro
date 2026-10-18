export type RfsConfidence = "high" | "medium" | "low";
export type RfsPowerLens = "Force" | "Secrecy" | "Licence";

export type RfsDimension = {
  name: string;
  score: 0 | 1 | 2;
  basis: string;
};

export type ResponseAssessment = {
  id: string;
  recipient: string;
  date: string;
  subject: string;
  score: number;
  confidence: RfsConfidence;
  sourceStatus: string;
  threadUrl?: string;
  sourceUrl: string;
  dimensions: RfsDimension[];
  tags: string[];
  powerLenses: RfsPowerLens[];
  basis: string;
  mitigatingEvidence: string;
  limits: string;
};

export const rfsDimensions = [
  {
    name: "Answer completeness",
    description: "Direct answer versus partial answer, substitution or closure without resolving the material point.",
  },
  {
    name: "Scope discipline",
    description: "Whether the reply tracks the actual request or substantially reframes it.",
  },
  {
    name: "Search / estimate transparency",
    description: "Whether the stated search, cost estimate or record method can be understood and tested.",
  },
  {
    name: "Withholding / legal-basis clarity",
    description: "Whether the reply distinguishes not-held, no record created, and held-but-withheld, and explains the basis.",
  },
  {
    name: "Practical help / next steps",
    description: "Whether it gives useful clarification, refinement, correction or review routes.",
  },
] as const;

export const rfsScale = [
  { range: "0–2", label: "Low friction" },
  { range: "3–4", label: "Limited friction" },
  { range: "5–6", label: "Material friction" },
  { range: "7–8", label: "High friction" },
  { range: "9–10", label: "Very high friction" },
] as const;

export const responseAssessments: ResponseAssessment[] = [
  {
    id: "llandough-2026-09-20-quoted",
    recipient: "Llandough Community Council",
    date: "20 September 2026 (quoted in later correspondence)",
    subject: "“We have nothing more to add”",
    score: 7,
    confidence: "low",
    sourceStatus: "Quotation only; original 20 September email not separately recovered.",
    threadUrl: "https://email.bucklerfamily.estate/reference/1a0c1e36871ebfd1",
    sourceUrl: "https://wayback.bucklerfamily.estate/text/2026-09-20%20-%20Llandough%20Community%20Council%20reply%20quoted%20-%20source%20status%20-%20EN%20-%20V1.0.0.00.txt",
    dimensions: [
      { name: "Answer completeness", score: 2, basis: "The quoted wording closes the exchange rather than answering the later itemised questions." },
      { name: "Scope discipline", score: 2, basis: "The quote points back to a previous response without showing how it addresses the later questions." },
      { name: "Search / estimate transparency", score: 1, basis: "The quoted wording provides no new search or record-by-record explanation." },
      { name: "Withholding / legal-basis clarity", score: 1, basis: "No new position is explained in the quotation." },
      { name: "Practical help / next steps", score: 1, basis: "It gives no next step in the quoted wording." },
    ],
    tags: ["closure without a fresh answer", "reliance on a prior response", "quote-only source"],
    powerLenses: ["Secrecy"],
    basis: "The quoted statement says the Clerk had already directed the requester to all information held and that there was nothing more to add. On its face, it does not answer the later narrow questions about post-2002 records, photographs and the 1982 transfer.",
    mitigatingEvidence: "This is a source-status quotation embedded in later correspondence, not a recovered original email. Context or text outside the quotation could change the assessment.",
    limits: "The score applies only to the preserved quotation, not the sender's character or the institution as a whole. No inference of deliberate concealment is made.",
  },
  {
    id: "llandough-2026-09-28-chair",
    recipient: "Llandough Community Council",
    date: "28 September 2026",
    subject: "Email passed to Clerk for consideration",
    score: 1,
    confidence: "medium",
    sourceStatus: "Public transcription; original .eml and headers not recovered.",
    threadUrl: "https://email.bucklerfamily.estate/reference/1a0c1e36871ebfd1",
    sourceUrl: "https://wayback.bucklerfamily.estate/text/2026-09-28%20-%20Llandough%20Community%20Council%20reply%20-%20public%20transcription%20-%20EN%20-%20V1.0.0.00.txt",
    dimensions: [
      { name: "Answer completeness", score: 0, basis: "It functions as a routing/holding reply, not a substantive answer or refusal." },
      { name: "Scope discipline", score: 0, basis: "It does not appear to reframe the request." },
      { name: "Search / estimate transparency", score: 0, basis: "No search or estimate is represented as complete in this holding message." },
      { name: "Withholding / legal-basis clarity", score: 0, basis: "It makes no withholding claim." },
      { name: "Practical help / next steps", score: 1, basis: "It identifies the Clerk as the person to consider the email, but gives no substantive timing or answer." },
    ],
    tags: ["routing / holding reply", "not a substantive refusal"],
    powerLenses: [],
    basis: "The Chair’s transcription says the requester’s email was passed to the Clerk for consideration.",
    mitigatingEvidence: "This is a normal routing response on its face; it should not be treated as evasive in isolation.",
    limits: "No delay flag is assigned from this message alone. The original message and headers are not present in the published transcription.",
  },
  {
    id: "llandough-2026-10-11-s12",
    recipient: "Llandough Community Council",
    date: "11 October 2026",
    subject: "Section 12 cost-limit refusal",
    score: 6,
    confidence: "medium",
    sourceStatus: "Main-body public transcription; original .eml not separately recovered.",
    threadUrl: "https://email.bucklerfamily.estate/reference/1a0c1e36871ebfd1",
    sourceUrl: "https://wayback.bucklerfamily.estate/text/2026-10-11%20-%20Llandough%20Community%20Council%20Section%2012%20refusal%20-%20public%20transcription%20-%20EN%20-%20V1.0.0.00.txt",
    dimensions: [
      { name: "Answer completeness", score: 1, basis: "It refuses the request but does not resolve every narrow confirm/deny point individually." },
      { name: "Scope discipline", score: 1, basis: "The estimate is based on reading 224 sets of minutes, while the request as transcribed asked a series of targeted questions about whether specific records were held." },
      { name: "Search / estimate transparency", score: 2, basis: "The letter says 20 minutes to read and 10 minutes to assess each set, but its 2,240-minute total appears to use 10 minutes per set; it does not explain whether those timings are alternatives or cumulative." },
      { name: "Withholding / legal-basis clarity", score: 1, basis: "Section 12 and the £450/18-hour limit are identified, but the link between the stated tasks and the specific request remains to be tested." },
      { name: "Practical help / next steps", score: 1, basis: "It suggests narrowing to 2002–2006 and gives internal review / ICO routes, which mitigate friction." },
    ],
    tags: ["statutory cost threshold", "estimate method needs clarification", "scope-fit question"],
    powerLenses: ["Licence"],
    basis: "The refusal cites FOIA section 12, £450 at £25 per hour, 224 sets of minutes, and a total exceeding 18 hours. The stated 20-minute and 10-minute activities do not clearly reconcile with the total calculation.",
    mitigatingEvidence: "The letter names its legal basis and cost limit, offers a narrower time window, and points to internal review and the ICO. ICO guidance recognises that a precise calculation is not always required, but estimates should be sensible and realistic and advice/assistance should be considered.",
    limits: "This is a testable question about the stated calculation and scope, not a finding that section 12 was unlawful or that the estimate was deliberately inflated.",
  },
  {
    id: "heneb-2026-10-16-her",
    recipient: "Heneb HER Team",
    date: "16 October 2026",
    subject: "Reply to 48-point HER schedule",
    score: 6,
    confidence: "high",
    sourceStatus: "Full email text in the public text archive; signature/contact details omitted there.",
    sourceUrl: "https://wayback.bucklerfamily.estate/text/2026-10-16%20-%20Heneb%20HER%20schedule%20response%20-%20EN%20-%20V0.0.0.00.txt",
    dimensions: [
      { name: "Answer completeness", score: 1, basis: "The reply addresses all numbered ranges but several grouped replies need further distinction." },
      { name: "Scope discipline", score: 1, basis: "Most answers are item-linked, although several ranges are answered together or redirected to Archwilio." },
      { name: "Search / estimate transparency", score: 1, basis: "It explains the change-log limitation and says predecessor paper records are at Baglan, but does not detail item-by-item searches for every not-held answer." },
      { name: "Withholding / legal-basis clarity", score: 2, basis: "For items 3–5, it combines a no-snapshot explanation with an inability-to-release statement based on personal data, without clearly distinguishing absent snapshots from held-but-withheld material." },
      { name: "Practical help / next steps", score: 1, basis: "It points to Archwilio and the County Treasures page, and identifies where predecessor paper records are kept." },
    ],
    tags: ["held-versus-withheld ambiguity", "data-protection explanation needs particulars", "public pointer not direct copy", "grouped not-held answers"],
    powerLenses: ["Secrecy", "Licence"],
    basis: "The message says the HER change log records edits but does not store snapshots, and says items 3–5 cannot be released because personal data is protected by UK GDPR. The precise relationship between those two explanations is unclear from the reply.",
    mitigatingEvidence: "The response itemises 48 points, explains an important system limitation, provides a County Treasures link and identifies the location of former GGAT paper records.",
    limits: "The score does not assume the GDPR position is invalid. The useful follow-up is to distinguish not-held/no-snapshot from held-but-withheld and request the precise legal basis or a redacted non-personal version.",
  },
  {
    id: "museum-wales-2026-10-07",
    recipient: "Amgueddfa Cymru — Museum Wales",
    date: "7 October 2026",
    subject: "FOI 2026-036 — filtered schedule / source locations",
    score: 1,
    confidence: "high",
    sourceStatus: "Full email transcription with date, sender, recipient and subject.",
    threadUrl: "https://email.bucklerfamily.estate/reference/1a1149cc3b8ce394",
    sourceUrl: "https://wayback.bucklerfamily.estate/text/2026-10-07%20-%20Museum%20Wales%20FOI-2026-036%20-%20EN%20-%20V0.0.0.00.txt",
    dimensions: [
      { name: "Answer completeness", score: 0, basis: "It directly answers the audit-schedule question and responds to MS 3360/3 and Ref 13.2." },
      { name: "Scope discipline", score: 0, basis: "It separates the Great House reference from Llandough Farm opposite the hospital." },
      { name: "Search / estimate transparency", score: 0, basis: "It explains staff reviewed results for location relevance and that the outcome was reflected in the 5 October reply." },
      { name: "Withholding / legal-basis clarity", score: 0, basis: "It says no separate audit schedule is held; no withholding basis is asserted in this reply." },
      { name: "Practical help / next steps", score: 1, basis: "It clarifies the records and location distinction, though no further audit document can be supplied." },
    ],
    tags: ["no separate contemporaneous audit schedule", "record gap acknowledged"],
    powerLenses: [],
    basis: "The Museum says it does not hold a separate schedule of excluded results, explains the staff review, and describes the information already identified in MS 3360/3 and the separate waterwheel record.",
    mitigatingEvidence: "It expressly acknowledges the missing schedule and explains what staff did. It also corrects a potential conflation between two Llandough farm sites.",
    limits: "The absence of an audit schedule may matter for reconstructing the search, but the candour of the response means it is not treated as a high-friction or concealment signal.",
  },
  {
    id: "museum-wales-2026-10-08",
    recipient: "Amgueddfa Cymru — Museum Wales",
    date: "8 October 2026",
    subject: "FOI 2026-036 — no further recorded information in MS 3360/3",
    score: 1,
    confidence: "high",
    sourceStatus: "Full email transcription with date, sender, recipient and subject.",
    threadUrl: "https://email.bucklerfamily.estate/reference/1a1149cc3b8ce394",
    sourceUrl: "https://wayback.bucklerfamily.estate/text/2026-10-08%20-%20Museum%20Wales%20FOI-2026-036%20-%20EN%20-%20V0.0.0.00.txt",
    dimensions: [
      { name: "Answer completeness", score: 0, basis: "It states why one page was supplied and whether further recorded information was found." },
      { name: "Scope discipline", score: 0, basis: "It addresses the specific MS 3360/3 item." },
      { name: "Search / estimate transparency", score: 0, basis: "It states there is no catalogue record naming Great House Farm and that staff did additional research." },
      { name: "Withholding / legal-basis clarity", score: 0, basis: "It does not suggest that additional information is being withheld." },
      { name: "Practical help / next steps", score: 1, basis: "It closes the point after giving the result; further next steps are naturally limited if no further record was identified." },
    ],
    tags: ["not-held / no further record identified", "direct explanation"],
    powerLenses: [],
    basis: "It says there is no catalogue record identifying Great House Farm in the document, that one relevant page was found and supplied after additional research, and no further recorded information was identified.",
    mitigatingEvidence: "The phrase “nothing further to add” is paired with a substantive explanation. It is not treated like a stand-alone closure.",
    limits: "The score concerns communication friction only; it does not independently verify the completeness of the Museum’s collection search.",
  },
  {
    id: "museum-wales-2026-10-12",
    recipient: "Amgueddfa Cymru — Museum Wales",
    date: "12 October 2026",
    subject: "FOI 2026-024 / 032 / 036 — basis for scope assessment",
    score: 1,
    confidence: "high",
    sourceStatus: "Full email text in public archive.",
    threadUrl: "https://email.bucklerfamily.estate/reference/1a1309dc33154ec9",
    sourceUrl: "https://wayback.bucklerfamily.estate/text/2026-10-12%20-%20Museum%20Wales%20FOI%202026-024%20036%20-%20EN%20-%20V0.0.0.00.txt",
    dimensions: [
      { name: "Answer completeness", score: 0, basis: "It directly answers whether a separate recorded rationale exists and provides the retrospective reasoning." },
      { name: "Scope discipline", score: 0, basis: "It explains why other archaeological records were treated as outside the narrowly described discovery." },
      { name: "Search / estimate transparency", score: 0, basis: "It identifies the searches’ outcome and states plainly that no separate assessment record was created." },
      { name: "Withholding / legal-basis clarity", score: 0, basis: "It confirms that no records remain withheld." },
      { name: "Practical help / next steps", score: 1, basis: "The missing contemporaneous note cannot now be produced, but Church Farm records were subsequently provided." },
    ],
    tags: ["no contemporaneous decision record", "retrospective explanation", "record gap acknowledged"],
    powerLenses: [],
    basis: "The Museum admits no separate search log, file note or internal note setting out the scope rationale was created; it describes the logic applied and confirms that Church Farm records were later supplied and none remain withheld.",
    mitigatingEvidence: "The absence is directly acknowledged and the rationale is described. This is more transparent than a vague “no information held” response.",
    limits: "The missing contemporaneous rationale remains a record gap. It does not by itself show that the scope decision was improper or deliberately concealed.",
  },
];

export const unscoredResponses = [
  {
    id: "swp-1040-26",
    recipient: "South Wales Police — FOI 1040/26",
    status: "Source/attachment needed",
    reason: "Dartboard notes the response was attached, but the attachment has not been reviewed in the source set used for this scoring pass. Score the actual response, not the fact of an attachment.",
  },
  {
    id: "mod-section-23",
    recipient: "Ministry of Defence — section 23(5) / SAR",
    status: "Source body needed",
    reason: "The current chart summary refers to NCND treatment for Special Forces and a “no information in scope” SAR result, but the source body was not re-reviewed here. NCND is opaque by design and is not, by itself, evidence of misconduct.",
  },
  {
    id: "hmlr-raised",
    recipient: "HM Land Registry — “already been raised”",
    status: "Original message needed",
    reason: "This appears in a chart summary. Retrieve and inspect the original email before determining whether it is circular, properly routed or a response limited by an existing case.",
  },
  {
    id: "vale-scrutiny",
    recipient: "Vale of Glamorgan Scrutiny",
    status: "Original message needed",
    reason: "The refusal is currently summarised in the disclosure chart. Review the email and the cited remit/policy before scoring it.",
  },
  {
    id: "nactso-notices",
    recipient: "National Counter Terrorism Security Office",
    status: "Response body needed",
    reason: "The available items are “new response” notifications rather than the text of the responses.",
  },
  {
    id: "nlw-ack",
    recipient: "National Library of Wales — acknowledgement",
    status: "Acknowledgement only; not overdue on current evidence",
    reason: "The 15/16 October acknowledgement is transparent about demand and possible delay. No substantive response is included yet; do not score a delay before the applicable deadline or promised update is verified.",
  },
  {
    id: "llandough-review",
    recipient: "Llandough Community Council — internal review / new EIR",
    status: "Deadline check needed",
    reason: "The review and separate EIR were sent on 11–12 October. As at 18 October, lack of an outcome in the mailbox sample is not sufficient to label them delayed; verify the due date and any acknowledgement first.",
  },
] as const;

export const rfsMethodNote =
  "RFS is an editorial aid for message-level friction, not a legal finding, a character judgement or a probability of misconduct. Tags for Force, Secrecy and Licence describe observable effects or use of power, not motive. A score can be revised when an original, attachment or later correction is recovered.";
