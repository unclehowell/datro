export type Status = "dormant" | "evidence" | "nuisance" | "closed" | "suspicious";

export type RingId =
  | "open"
  | "reply"
  | "chase"
  | "review"
  | "complaint"
  | "regulator"
  | "democratic"
  | "forum";

export type Kind = "authority" | "private" | "political" | "family";

export type Cell = {
  status: Status;
  title: string;
  detail: string;
  date?: string;
  ref?: string;
  correspondent?: string;
  url?: string;
  /** A fee, cost estimate, paid-copy amount, or chargeable disclosure route is recorded for this block. */
  feeMarker?: boolean;
  /** Letters attached to the reply (public copies, personal contact details redacted). */
  docs?: { label: string; url: string; wayback?: string }[];
};

export type Ring = {
  id: RingId;
  name: string;
  short: string;
  blurb: string;
};

export type Party = {
  id: string;
  name: string;
  short: string;
  kind: Kind;
  remit: string;
  cells: Partial<Record<RingId, Cell>>;
};

/**
 * Each ring groups one kind of step. The rings are not a compulsory sequence: each matter follows
 * the route of its own regime (see legal-routes.ts), some steps are optional or run in parallel,
 * and accountability routes are never a prerequisite to a statutory complaint or appeal.
 */
export const rings: Ring[] = [
  {
    id: "open",
    name: "Request",
    short: "Request",
    blurb: "The request under its own regime: FOIA, EIR, subject access, law-enforcement access, a Land Registry form, an archive enquiry or a court-record request.",
  },
  {
    id: "reply",
    name: "Response",
    short: "Response",
    blurb: "Disclosure (full, partial or redacted), a refusal with its legal basis, 'not held', 'not located', or a holding note. Each is recorded as itself.",
  },
  {
    id: "chase",
    name: "Clarification and chase",
    short: "Chase",
    blurb: "Clarification changes a clock only where the regime provides and the evidence shows it. A chase is optional and changes no statutory deadline.",
  },
  {
    id: "review",
    name: "Internal review",
    short: "Review",
    blurb: "EIR: statutory (reg. 11). FOIA: good practice under the s.45 Code, normally expected before an ICO complaint. Other regimes have their own routes, or none.",
  },
  {
    id: "complaint",
    name: "Service complaint",
    short: "Complaint",
    blurb: "The body's own complaints procedure. Separate from information-rights reviews; it pauses no deadline.",
  },
  {
    id: "regulator",
    name: "Regulator or reviewer",
    short: "Regulator",
    blurb: "The Information Commission (ICO) for FOIA, EIR and data access. The Land Registry's Independent Complaints Reviewer for service failures only, never registration decisions or points of law.",
  },
  {
    id: "democratic",
    name: "Accountability (parallel)",
    short: "Accountability",
    blurb: "MPs, MSs, councillors, scrutiny, standards and the ombudsmen. Parallel and optional: never a prerequisite to a statutory complaint or appeal.",
  },
  {
    id: "forum",
    name: "Tribunal or court",
    short: "Tribunal",
    blurb: "First-tier Tribunal (28 days from an ICO decision) or a court route. Time limits run on their own: never held back to use up other routes.",
  },
];

export const statusMeta: Record<
  Status,
  { label: string; hint: string; swatch: string }
> = {
  dormant: {
    label: "Dormant",
    hint: "Waiting, or this step has not been taken",
    swatch: "var(--color-dormant)",
  },
  evidence: {
    label: "Evidence in",
    hint: "A record or a locate-result came back",
    swatch: "var(--color-evidence)",
  },
  nuisance: {
    label: "Complicated",
    hint: "Circular, obstructive, or hard to get straight",
    swatch: "var(--color-nuisance)",
  },
  closed: {
    label: "Institution's final position",
    hint: "Their stated position (for example 'not held' or 'search complete'). Not proof a record never existed or was destroyed",
    swatch: "var(--color-closed)",
  },
  suspicious: {
    label: "Questionable",
    hint: "The handling itself does not bear looking at",
    swatch: "var(--color-suspicious)",
  },
};

const g = (thread: string) => `https://email.bucklerfamily.estate/reference/${thread}`;

export const parties: Party[] = [
  {
    id: "llandough",
    name: "Llandough Community Council",
    short: "Llandough",
    kind: "authority",
    remit: "The Clerk. Local minutes, the green, and the 1982 deposit.",
    cells: {
      open: {
        status: "closed",
        title: "Chair: nothing more to add",
        date: "20 Sep 2026",
        correspondent: "Chair, Llandough Community Council",
        ref: "Email to the Chair, then restated 21 Sep",
        url: g("1a0c1e36871ebfd1"),
        detail:
          "On 20 September 2026 the Chair wrote that the Clerk had already directed you to all the information the Council holds, and that “We have nothing more to add.” Your 21 September email answered that this is not a refusal notice. It asked only whether anything is held after the 2002 deposit to Glamorgan Archives: post-2002 minutes and files on Great House Farm (Tŷ Mawr) / Church View Close, village green VG 41, and the verge; any photographs; and what, if anything, came across from Penarth Town Council in 1982. You recorded an earlier clerk’s answer of 14 June 2026 that the minute books from 1982 were deposited with Glamorgan Archives in 2002.",
      },
      reply: {
        status: "suspicious",
        title: "Section 12 refusal by the clerk",
        date: "11 Oct 2026",
        correspondent: "Clerk, Llandough Community Council",
        ref: "FOIA s.12 — reply to the 21 Sep request",
        url: g("1a0c1e36871ebfd1"),
        feeMarker: true,
        detail:
          "The Clerk refused under section 12. He priced staff time at £25 an hour, so £450 is 18 hours, then estimated 224 sets of minutes from 2002–2016. The letter gives both “about 20 minutes to read each set” and “about 10 minutes to assess each set”, and reaches “over 2240 minutes” (about 37 hours). The request had not asked for a reading of fourteen years of minutes. It asked the Council to say whether post-2002 records are held. He offered a narrower window, for example 2002–2006, and said the other matters would wait for the October meeting.",
      },
      chase: {
        status: "dormant",
        title: "Separate EIR, still unanswered",
        date: "11–12 Oct 2026",
        correspondent: "To the clerk",
        ref: "VG 41 / St Dochdwy’s / 89/01396/OUT",
        url: g("1a12aef8151e6cf9"),
        detail:
          "On 11 October you sent a new EIR request, to be registered on its own clock: works to village green VG 41 and the verge at St Dochdwy’s, 1970–1995, and the green provided under planning permission 89/01396/OUT. The same day and on 12 October you wrote again on preservation, the chronology, and the October meeting. No fresh reply from the clerk is in the mailbox after the section 12 letter.",
      },
      review: {
        status: "suspicious",
        title: "Review asked of the same clerk",
        date: "11 Oct 2026",
        correspondent: "The Clerk",
        ref: "Internal review of the 11 Oct s.12 refusal",
        url: g("1a12af4820f4acb5"),
        detail:
          "You asked for an internal review of the section 12 refusal on 11 October 2026, and repeated it that evening and on 12 October. The refusal notice tells you to “contact us” for that review. No other reviewer is named. No review outcome is in the mailbox. The questionable point is structural: the clerk who built the 37-hour estimate is the officer the request for review went back to.",
      },
      complaint: {
        status: "dormant",
        title: "Subject access, no answer yet",
        date: "11 Oct 2026",
        correspondent: "To the clerk",
        ref: "SAR inside the 11 Oct bundle",
        url: g("1a12ce4cc0f2e15c"),
        detail:
          "The 11 October bundle to the clerk includes a subject access request alongside the internal review and a fresh records request. No SAR response is in the mailbox. A standards complaint, separate from the FOI review, has not been sent.",
      },
      democratic: {
        status: "suspicious",
        title: "Parked to the October meeting",
        date: "11 Oct 2026",
        correspondent: "The Clerk",
        ref: "October meeting — attendance and papers",
        url: g("1a17c63fbd8e6731"),
        detail:
          "The clerk said the “other matters” in the 21 September email would be considered at the October meeting, and that he would send the Council’s views afterwards. You asked to attend in the proper way and to see the papers. Putting the substantive questions onto a later meeting, rather than answering whether records are held, sits with the same officer whose refusal is under review. Since then: the Clerk’s agenda of 13 October 2026 said the 22 October meeting would be in the Council Chamber, with attendance in person or remotely. On 16 October he wrote that it will now be held remotely only. You objected the same day and asked for a reply by 17:00 on 20 October. On 27 October the Clerk acknowledged your proposed amendments to the 22 October draft minutes but said the Council must decide their accuracy at its next meeting and that the Clerk and Councillor Carroll are not listed as attendees because they are not Council members. The minutes remain a matter for Council confirmation; the email is not agreement to your proposed changes.",
      },
    },
  },
  {
    id: "vale-foi",
    name: "Vale of Glamorgan Council — FOI",
    short: "Vale FOI",
    kind: "authority",
    remit: "Planning register, land charges, conditions, Church View Close.",
    cells: {
      open: {
        status: "dormant",
        title: "Open planning and historic-record requests",
        date: "17 Sep–29 Oct 2026",
        correspondent: "Information Governance, FOI Unit",
        ref: "00211557 · 00211463 · 00211483 · 00211484 · 00211721 · 00211722",
        url: g("1a186fef75ae76ee"),
        detail:
          "The FOI unit acknowledged request 00211557 on 30 September: Great House Farm / Church View Close, section 52 and land charges, planning register, environmental-assessment screening, condition 16–18 chain and 92/00671/RES. On 29 October the Council confirmed that 00211557 is under the EIR, searches have started and a response is due by 19 November. Request 00211463 concerns the Barry Preservation Society / Civic Trust representations and appendices to planning application 89/01396/OUT; on 29 October the internal review acknowledged a delay and set 20 November for the substantive response. Requests 00211483 and 00211484 are also under the EIR, with searches started and responses expected by 20 November. The Council separately logged the 18 October supplements as 00211721 (the former South Glamorgan County Treasures inventory; due 14 December) and 00211722 (village green VG41, the 1958 planning committee record and council works; due 14 December). These are live search tracks, not disclosures or findings about title.",
      },
      reply: {
        status: "evidence",
        title: "Partial disclosures already in hand",
        date: "Before 10 Oct 2026",
        correspondent: "FOI Unit",
        ref: "Great House / Tŷ Mawr / Church View Close",
        url: g("1a123ef64335cb7c"),
        detail:
          "On 10 October you wrote that partial disclosures have already been made on Great House Farm / Tŷ Mawr / Church View Close. That is evidence in from the FOI track. The acknowledgement itself promised an answer within 20 working days of 28 September unless the information is not held or is withheld.",
      },
      chase: {
        status: "nuisance",
        title: "Late handling acknowledged; responses rescheduled",
        date: "22–29 Oct 2026",
        correspondent: "Vale of Glamorgan Council — Information Governance",
        ref: "00211463 · 00211483 · 00211484 · 00211557",
        url: g("1a0c1c87a6f1717d"),
        detail:
          "On 29 October the Council's internal review of 00211463 accepted that the substantive response had not been issued within the expected time and that it should have notified an EIR regulation 7 extension. The Council says searches are continuing and expects to answer by 20 November. Separate letters that day say 00211483 and 00211484 are under EIR, searches have started and answers are due 20 November; 00211557 is due 19 November. The Council's letters acknowledge late or retrospective extension handling on some requests. None of these letters supplies the missing planning appendices or any other substantive record.",
      },
      review: {
        status: "nuisance",
        title: "00210772 review past the EIR limit",
        date: "7 Jul – 18 Oct 2026",
        correspondent: "Vale FOI Unit / Information Governance",
        ref: "00210772 — internal review requested 7 Jul 2026",
        url: g("1a141cc190751565"),
        detail:
          "You asked for an internal review of 00210772 on 7 July 2026. Under regulation 11(4) of the EIR a review is due within 40 working days, which on the mailbox dates is about 2 September 2026. On 11 September the Council wrote that service areas had found further historical documentation that was still being sifted, and that it would update you with a clearer timeframe; no such update is in the mailbox. You chased on 30 September and on 7, 15 and 18 October 2026, the last asking for an outcome or a firm date by 30 October and saying you may otherwise ask the Information Commissioner to consider the delay. No review outcome is in the mailbox as of 18 October 2026.",
      },
    },
  },
  {
    id: "vale-scrutiny",
    name: "Vale of Glamorgan — Scrutiny",
    short: "Scrutiny",
    kind: "authority",
    remit: "Task and Finish on the Council-held record.",
    cells: {
      open: {
        status: "dormant",
        title: "Task and Finish suggestion",
        date: "10 Oct 2026",
        correspondent: "Democratic Services",
        ref: "Scrutiny topic — not a new FOI",
        url: g("1a1149d647cb33dc"),
        detail:
          "You asked Democratic Services for a Scrutiny topic suggestion and a Task and Finish review of the Council-held planning, heritage and public-authority record for Great House Farm / Tŷ Mawr / Church View Close. The FOI unit was copied for information only. You pointed them at greathousefarmwiki.wordpress.com.",
      },
      reply: {
        status: "evidence",
        title: "Place Scrutiny recommended; no decision to schedule",
        date: "26 Oct 2026",
        correspondent: "James Langridge-Thomas, Vale of Glamorgan Council",
        ref: "County-wide historic planning and records-management topic",
        url: g("1a1149d647cb33dc"),
        detail:
          "On 26 October Democratic Services acknowledged the revised county-wide proposal about management of, and public access to, historic planning, land-charges and heritage records. The officer recommended Place Scrutiny Committee as the likely fit because of its built-environment remit, but expressly said there was no decision yet to add the topic to a future work programme or choose the form of scrutiny. This followed the 11 October response declining the original single-site Task and Finish proposal. The 26 October county-wide suggestion still needs to go through the published Topic Suggestion Form and normal work-programming process. This is a routing recommendation, not committee approval.",
      },
    },
  },
  {
    id: "swp",
    name: "South Wales Police",
    short: "SW Police",
    kind: "authority",
    remit: "Operational records, November–December 1988.",
    cells: {
      open: {
        status: "dormant",
        title: "FOI 1264/26 on the clock",
        date: "10 Oct 2026",
        correspondent: "Information Rights, South Wales Police",
        ref: "1264/26 — deadline 9 Nov 2026",
        url: g("1a12fa8ff526287b"),
        detail:
          "You asked for non-personal operational records on Great House Farm / Tŷ Mawr, Llandough, for November–December 1988, excluding personal data. On 12 October Information Rights confirmed FOI 1264/26 and a 20-working-day deadline of 9 November 2026. Until that date this request is dormant, not refused.",
      },
      reply: {
        status: "nuisance",
        title: "FOI 1040/26 answered by attachment",
        date: "29 Sep 2026",
        correspondent: "Freedom of Information",
        ref: "1040/26",
        detail:
          "On 29 September the force wrote that FOI 1040/26 had been considered and that the response was attached. The attachment is not extracted in this chart, so the slice is marked complicated rather than evidence. An earlier request, 719/26, is in internal review rather than closed.",
      },
      review: {
        status: "evidence",
        title: "Internal-review decision received as PDF; not transcribed",
        date: "26 Oct 2026",
        correspondent: "Samantha Jones, South Wales Police",
        ref: "1188/26 — review of FOI 719/26",
        url: g("1a178545741638a9"),
        detail:
          "On 26 October South Wales Police supplied a redacted PDF response to internal review 1188/26, together with its complaints procedure. The email confirms that the review has been considered and identifies the route for requesting a further re-examination and then approaching the Information Commissioner. The PDF's actual reasoning and outcome have not been transcribed into this chart, so no conclusion is drawn about whether the review upheld or changed the original decision.",
      },
    },
  },
  {
    id: "glamorgan",
    name: "Glamorgan Archives",
    short: "Glamorgan",
    kind: "authority",
    remit: "Parish, vestry, tithe, and the 2002 minute deposit.",
    cells: {
      open: {
        status: "dormant",
        title: "Location request, not a viewing",
        date: "10 Oct 2026",
        correspondent: "Glamorgan Archives",
        ref: "Llandough-juxta-Penarth, not Cowbridge",
        url: g("1a1158080de15320"),
        detail:
          "You asked only for a location: parish, vestry and tithe records for Great House / Tŷ Mawr, Llandough-juxta-Penarth, and you said you were not booking a screen room. The clerk’s 14 June position, as you recorded it on 21 September, was that the community minute books from 1982 were deposited here in 2002. No reply to that separate location-only request is in the sample.",
      },
      reply: {
        status: "evidence",
        title: "Copying and research fees quoted",
        date: "7 & 24 Sep 2026",
        correspondent: "Glamorgan Archives",
        ref: "2026–3941 / 2026/4097",
        feeMarker: true,
        detail:
          "Glamorgan Archives quoted £60 for 53 images from ledger ACA/8/2 (106 pages), with a tariff of £15.60 for the first image, £4.80 for each subsequent image, or £60 per hour for multiple images from multiple documents. On 24 September, it also quoted £50 for a rate-book search, £50 for a planning-minutes search, £17 for two Stewart survey/terrier images, £20 for five plan images, and £50 for a D696 Western Ground Rents search. These are fee offers, not proof the searches were commissioned or paid. Recorded in the wiki’s Paywalls to Disclosure register. Found free in the online DBDT catalogue on 19 Oct 2026: DBDT129/3 (Aug 1940, a Western Ground Rents tenancy of Llandough Farm, the Rees/Thomas farm, not Great House; wiki EV-0233) and DBDT123/7 (May 1939, land at Llandough to John Williams; wiki EV-0023). The 1878 Thomas Williams agreement is for Ynysawdre near Bridgend and is excluded as not our farm (wiki EV-0234).",
      },
    },
  },
  {
    id: "cardiff-reg",
    name: "Cardiff Register Office",
    short: "Registrars",
    kind: "authority",
    remit: "Death registration of Mary Doreen (Nancy) Williams, formerly Buckler.",
    cells: {
      open: {
        status: "dormant",
        title: "Passed across from the Vale",
        date: "10 Oct 2026",
        correspondent: "Registrars",
        ref: "Mary Doreen Williams",
        url: g("1a11a41ac938b1a5"),
        detail:
          "The Vale of Glamorgan Registration Service told you on 30 September 2026 they could not find a death record for Mary Doreen Williams in the Vale, and the search was passed to Cardiff. You wrote to the Registrars on 10 October.",
      },
      reply: {
        status: "closed",
        title: "Cardiff does not hold the entry",
        date: "12 Oct 2026",
        correspondent: "Cardiff Register Office",
        ref: "FreeBMD indexes searched",
        url: g("1a11a41ac938b1a5"),
        detail:
          "On 12 October the Register Office wrote that Cardiff Register Office does not hold the registration of death for Mary Doreen Williams, and that the indexes searched included FreeBMD. You replied the same day: “Yes, please pass on.”",
      },
      chase: {
        status: "dormant",
        title: "Asked to pass it on",
        date: "12 Oct 2026",
        correspondent: "You to the Register Office",
        url: g("1a11a41ac938b1a5"),
        detail:
          "You agreed that the search should be passed onward. Where it goes next is not yet in the mailbox.",
      },
    },
  },
  {
    id: "museum",
    name: "Amgueddfa Cymru — Museum Wales",
    short: "Museum",
    kind: "authority",
    remit: "Archaeological records. FOI 2026-024, 032 and 036.",
    cells: {
      open: {
        status: "dormant",
        title: "Three requests on the farm",
        date: "2026",
        correspondent: "FOI Team",
        ref: "FOI 2026-024, 2026-032, 2026-036",
        url: g("1a1149cc3b8ce394"),
        detail:
          "The museum has been answering a run of requests on Great House Farm / Tŷ Mawr / Llandough Farm and Church Farm. The live references in the October mail are FOI 2026-024, 2026-032 and 2026-036.",
      },
      reply: {
        status: "evidence",
        title: "Records disclosed, including MS 3360/3",
        date: "22 Sep and 5 Oct 2026",
        correspondent: "FOI Team",
        ref: "2026-032 and 2026-036",
        url: g("1a10c2ac609d288e"),
        detail:
          "You hold disclosures under FOI 2026-032 (22 September) and 2026-036 (5 October). The 5 October letter added records, including Ref 13.2 (a waterwheel) and a page of MS 3360/3. On 12 October the museum wrote that the Church Farm records referred to in the August searches have since been provided, and that “No records remain withheld.”",
      },
      chase: {
        status: "closed",
        title: "No separate note of what was excluded",
        date: "12 Oct 2026",
        correspondent: "FOI Team",
        ref: "Item 7 — recorded basis for “not in scope”",
        url: g("1a1309dc33154ec9"),
        detail:
          "On 25 August the museum said searches had found records of other archaeological discoveries at Great House Farm and Church Farm, treated as not in scope. You asked for the recorded basis (item 7). On 7, 8 and 12 October they repeated that Amgueddfa Cymru does not hold a separate search log, file note or other document of that assessment. Their replies record that staff decided those records were not the reported discovery of a soldier, horse remains and armour, and that nothing remains withheld. That is their “no more” on the schedule itself.",
      },
      review: {
        status: "nuisance",
        title: "Review of 2026-024 did not produce the basis",
        date: "10 Oct 2026",
        correspondent: "FOI Team",
        ref: "Internal review of 2026-024",
        url: g("1a1309dc33154ec9"),
        detail:
          "Your 10 October email asks that the missing recorded basis be treated as information that should have come out under the internal review of FOI 2026-024. The review is already part of the history, and it did not produce a written rationale. The fight is now about a document they say was never created.",
      },
    },
  },
  {
    id: "nlw",
    name: "National Library of Wales",
    short: "NLW",
    kind: "authority",
    remit: "Bute Estate series and the enquiries desk.",
    cells: {
      open: {
        status: "dormant",
        title: "Bute search closed; two new archive requests acknowledged",
        date: "10–29 Oct 2026",
        correspondent: "National Library of Wales — Enquiries / FOI",
        ref: "FOI/2026/09 · FOI/2026/16 · FOI/2026/17",
        url: g("1a141fc4254e01d4"),
        detail:
          "FOI/2026/09 and its internal review concern Bute Estate material, including D153 and D205. On 29 October Dr Owain Rhys Roberts confirmed that no further classmarks had been identified since the July searches for Great House Farm / Tŷ Mawr / Llandough, the 1877 agreement, the 1916 tenancy or the 1938–39 sale. Two separate requests are now registered: FOI/2026/16, received 16 October and due 13 November, asks about the 1610 Herbert survey S7, Bute X.6(12) microfilm and possible long lease / Vaughan-to-Bute conveyance; FOI/2026/17, received 28 October and due 25 November, asks whether the Library holds the underlying ITV/HTV Report Wales recordings of the 11 April and 1 November 1974 Llandough protests. The latter reference was corrected from FOI/2026/15 for administrative sequencing.",
      },
      reply: {
        status: "closed",
        title: "No further Bute classmarks identified since July searches",
        date: "29 Oct 2026",
        correspondent: "Dr Owain Rhys Roberts, National Library of Wales",
        ref: "FOI/2026/09 follow-up · Bute Estate",
        url: g("1a11eaa0af2e3861"),
        detail:
          "Following verification, the Library confirmed that no further classmarks had been identified since its July 2026 searches relating to Great House Farm / Tŷ Mawr / Llandough, the 1877 agreement, the 1916 tenancy or the 1938–39 sale. The earlier search history includes the Bute Estate series D153 and D205. This closes that narrow follow-up only. It does not establish that no such record ever existed and does not answer the separate 1610 Herbert / Bute X.6(12) request or the 1974 television-archive request.",
      },
      chase: {
        status: "closed",
        title: "Further Bute classmark check answered",
        date: "10–29 Oct 2026",
        correspondent: "To and from NLW Enquiries",
        ref: "FOI/2026/09 follow-up",
        url: g("1a11eaa0af2e3861"),
        detail:
          "The 10 October follow-up asked whether any further Bute Estate or related classmarks had been identified since July. On 29 October the Library answered no. The two later FOI requests, FOI/2026/16 and FOI/2026/17, remain separate open matters.",
      },
      review: {
        status: "evidence",
        title: "Internal review already given",
        date: "Before 10 Oct 2026",
        correspondent: "NLW FOI",
        ref: "Internal review of FOI/2026/09",
        url: g("1a11eaa0af2e3861"),
        detail:
          "Your 10 October email thanks them for the internal-review outcome. The review is what sits behind the Bute searches. It is not an open fight in this sample.",
      },
    },
  },
  {
    id: "rcahmw",
    name: "RCAHMW — National Monuments Record",
    short: "RCAHMW",
    kind: "authority",
    remit: "NMRW archive scans. RC26-0375.",
    cells: {
      open: {
        status: "dormant",
        title: "September enquiries under RC26-0375",
        date: "8–20 Sep 2026",
        correspondent: "NMR enquiries",
        ref: "RC26-0375",
        url: g("1a11f562b7880f36"),
        detail:
          "Requests dated 8, 15, 17 and 20 September sit under RCAHMW reference RC26-0375.",
      },
      reply: {
        status: "closed",
        title: "Requests closed; further searches chargeable",
        date: "29 Sep–6 Oct 2026",
        correspondent: "NMR enquiries",
        ref: "RC26-0375 · LES16 fee list",
        url: g("1a11f562b7880f36"),
        feeMarker: true,
        detail:
          "On 6 October 2026, RCAHMW said the requests of 8, 15, 17 and 20 September were fully answered. The 29 September reply also said aerial-photograph searches would be chargeable and further public enquiries may be charged; a 2026 price list and order form were attached. No paid search is recorded as placed by 12 October.",
      },
      chase: {
        status: "dormant",
        title: "Nomenclature follow-up acknowledged; priority searches suspended",
        date: "29 Oct 2026",
        correspondent: "NMR Enquiries, RCAHMW",
        ref: "RC26-0375 and follow-up searches",
        url: g("1a11178b91ab138c"),
        detail:
          "On 29 October RCAHMW acknowledged the follow-up using the additional historical names, including Llandough Home Farm. It says it will endeavour to respond within 15 working days, but its Priority Enquiry Service is suspended because of staff shortages. It recommends an archive search-room appointment, where material can be viewed and photographed without charge; remote scans may be slower and more expensive. The earlier order for scans of Archives 6048945, 6048943 and 6048941 remains a separate outstanding step. A message sent to the alternate address nmrwales@rcahmw.gov.uk bounced; the acknowledgement came through the nmr.wales@rcahmw.gov.uk channel.",
      },
    },
  },
  {
    id: "cadw",
    name: "Cadw and Welsh Government",
    short: "Cadw",
    kind: "authority",
    remit: "1988 listing file, ATISN 27021, 27589, 26-0009 and 26-0010.",
    cells: {
      open: {
        status: "dormant",
        title: "ATISN 26-0010 review and new ATISN 26-0075 search track",
        date: "10–30 Oct 2026",
        correspondent: "Welsh Government FOI / Departmental Records Officer",
        ref: "ATISN 26-0010 · ATISN 26-0075 · ATISN 27589 · ATISN 26-0009",
        url: g("1a18dbc3359e6488"),
        detail:
          "ATISN 26-0010 and ATISN 27589 were answered on 19 October; ATISN 26-0009 remains a separate records question. On 30 October the Welsh Government confirmed that the internal review of ATISN 26-0010 is being conducted separately by the Departmental Records Officer. The same correspondence is registered as ATISN 26-0075: it seeks clarification of the section 14(2) refusal of ATISN 27589 and opens new searches for registered-file index records and disposal/transfer history, Welsh Office property/deeds interests 1950–1997, wartime farm records 1936–1955, and compulsory-purchase / stopping-up / diversion orders 1950–1995. A preservation request covers the registered-file index and files, any remnant of the 1988 listing file, the original 29 July 1988 inspection photographs, disposal logs and transfer lists. Parts B–D are due by 16 November 2026.",
      },
      reply: {
        status: "nuisance",
        title: "19 Oct: “no files found” and a repeat-request refusal",
        date: "19 Oct 2026",
        correspondent: "Departmental Records Officer, Welsh Government (ATISN 26-0010) · Head of Historic Environment Inspectorate, Cadw (ATISN 27589, ref qA2496208)",
        ref: "ATISN 26-0010 · ATISN 27589 (qA2496208)",
        url: "https://email.bucklerfamily.estate/thread/gt-1a1537b442f27f72-welsh-government-response-to-request-for-information-atisn-26-0010-retention-destruction-schedules",
        docs: [
          {
            label: "ATISN 26-0010 disclosure response, 19 Oct 2026 (PDF)",
            url: "/docs/2026-10-19_welsh-government_atisn-26-0010_disclosure-response.pdf",
            wayback: "https://wayback.bucklerfamily.estate/pdf/foi/2026-10-19_welsh-government_atisn-26-0010_disclosure-response.pdf",
          },
          {
            label: "ATISN 27589 response (s.14(2) refusal), 19 Oct 2026 (PDF)",
            url: "/docs/2026-10-19_cadw_atisn-27589_response-s14-2.pdf",
            wayback: "https://wayback.bucklerfamily.estate/pdf/foi/2026-10-19_cadw_atisn-27589_response-s14-2.pdf",
          },
        ],
        detail:
          "ATISN 26-0010: the Welsh Government's reply records that searches for the farm name, Western Ground Rents Ltd and BP Properties Ltd found no files, and that “any routine records would have been destroyed in line with the corporate retention schedule applied at the time”, or may never have reached it (“disposition would have been carried out by a predecessor body”). Its property, deeds and lease records are “not classed as ‘public records’” and are kept until the property is sold or the lease ends. An internal review can be asked for within 40 working days (by 14 Dec 2026, computed). ATISN 27589: Cadw refused the July–December 1988 request under FOIA section 14(2) as “substantially similar” to ATISN 27021, saying “no new information has been generated or become available”; the letter names the ICO and does not mention an internal review. Earlier on this ring: your 10 October letter refers to a finding that the 1988 listing file was disposed of, the “nothing further is held” position on the file itself.",
      },
      chase: {
        status: "dormant",
        title: "Asking what proves the disposal",
        date: "10 Oct 2026",
        correspondent: "Cadw / Welsh Government Complaints Manager",
        ref: "ATISN 27021",
        url: g("1a11eb8afe818123"),
        detail:
          "The 10 October letter asks for the existing records behind the disposal finding: the schedule entry, the destruction certificate, or whatever was used to say the 1988 listing file is gone. No answer to that letter is in the sample.",
      },
      review: {
        status: "nuisance",
        title: "Three internal reviews already issued",
        date: "2, 10 and 29 Jul 2026",
        correspondent: "Welsh Government",
        ref: "Reviews of the listing-file requests",
        url: g("1a11eb8afe818123"),
        detail:
          "You refer to internal-review outcomes dated 2, 10 and 29 July 2026. Three reviews and still no underlying destruction record is a complicated file, not a dormant one.",
      },
      complaint: {
        status: "nuisance",
        title: "Chief Inspector already written to",
        date: "27 Aug and 4 Sep 2026",
        correspondent: "Chief Inspector",
        ref: "Letters after the July reviews",
        url: g("1a11eb8afe818123"),
        detail:
          "You refer to the Chief Inspector’s letters of 27 August and 4 September 2026. The complaint stage has been used. The 10 October letter is you going back over what those letters did not produce.",
      },
    },
  },
  {
    id: "wales-office",
    name: "Wales Office",
    short: "Wales Office",
    kind: "authority",
    remit: "Pre-devolution file. 26FOI 103.",
    cells: {
      open: {
        status: "dormant",
        title: "Request 26FOI 103",
        date: "2026",
        correspondent: "Wales Office",
        ref: "26FOI 103",
        url: g("1a11ea981f52fcb9"),
        detail:
          "The Welsh Government chase of 10 October treats a Wales Office response under 26FOI 103 as already in the history of the case. The opening request itself is not restated in the October mail.",
      },
      reply: {
        status: "nuisance",
        title: "A response is on the file",
        date: "2026",
        correspondent: "Wales Office",
        ref: "26FOI 103",
        url: g("1a11ea981f52fcb9"),
        detail:
          "A substantive Wales Office response exists under 26FOI 103. Its text is not in the October sample used for this chart, so the slice is marked complicated: cited, not re-read here.",
      },
      review: {
        status: "evidence",
        title: "IR/26/16 decision PDF received; reviewer identity queried",
        date: "26–29 Oct 2026",
        correspondent: "Wales Office FOI Team",
        ref: "26FOI 103 · IR/26/16",
        url: g("1a1793ba43e8d95b"),
        detail:
          "The Wales Office sent the internal-review decision for IR/26/16 as an attached PDF on 26 October. The attachment's reasoning has not been transcribed here, so no finding is attributed to the reviewer. On 29 October you asked for the full name, official title and role of the person who conducted the review and the person who authorised the decision. In the same reply you raised a separate, focused records enquiry about the reported 1926 Cardiff Corporation conveyance, 1926 Mountjoy company records and 1938 Bute/Mountjoy conveyance to Western Ground Rents, asking for custodians, search methods and preservation status.",
      },
    },
  },
  {
    id: "tna",
    name: "The National Archives",
    short: "TNA",
    kind: "authority",
    remit: "1910 Valuation Office map, and a delayed WDTK request.",
    cells: {
      open: {
        status: "dormant",
        title: "Location-only request for the 1910 map",
        date: "10 Oct 2026",
        correspondent: "FOI Requests, The National Archives",
        ref: "OS Glamorgan XLVII.6",
        url: g("1a1060d79ae529a6"),
        detail:
          "You made a Freedom of Information request that was a location request only: the Valuation Office Survey 1910 sheet for OS Glamorgan XLVII.6, covering Llandough / Great House Farm. You were not asking for a copy or a screen-room appointment. A separate WhatDoTheyKnow request, “Great House Farm, Llandough, Cardiff (BP vs Buckler 1987)”, was already late by 1 October.",
      },
      reply: {
        status: "evidence",
        title: "Map identified; staff search is chargeable",
        date: "12 Oct 2026",
        correspondent: "FOI Requests, The National Archives",
        ref: "IR 131/4/96 · OS Glamorgan XLVII.6",
        url: g("1a1060d79ae529a6"),
        feeMarker: true,
        detail:
          "On 12 October The National Archives said it believed it had identified the Valuation Office map covering the property and supplied a Discovery link. It also described access options: visit Kew, request a paid staff search, or hire an independent researcher, citing the FOIA section 9 fee route. No paid search is recorded as commissioned. Found since (19 Oct 2026), catalogue entries only, no file seen: the verbatim record of the 1958–59 Ministry inquiry into objections to the Glamorgan (Area No. 2) Development Plan, BD 28/177 (19 Nov – 11 Dec 1958, starting the day of Mrs M. D. Buckler’s “Crichel Down” complaint; wiki EV-0239); the inspector’s report on the Penarth town map, BD 28/133, with HLG 119/3181 and 3187–3189, BD 28/198, MAF 112/1108 and MT 39/909 (wiki EV-0240); and the 1941–43 National Farm Survey bundle for Penarth parish, MAF 32/1220/39 (wiki EV-0241; that the farm’s form is in it is an inference). The date match with her complaint is a lead, not proof she appeared at the inquiry.",
      },
      chase: {
        status: "nuisance",
        title: "The other request is past its deadline",
        date: "1 Oct 2026",
        correspondent: "WhatDoTheyKnow notice",
        ref: "BP vs Buckler 1987 — TNA delay",
        url: g("1a0f5e0903321107"),
        detail:
          "WhatDoTheyKnow recorded on 1 October 2026 that The National Archives had not replied promptly to “Great House Farm, Llandough, Cardiff (BP vs Buckler 1987)”. That request is a separate, late file sitting next to the map request they did answer.",
      },
    },
  },
  {
    id: "hmlr",
    name: "HM Land Registry",
    short: "Land Reg.",
    kind: "authority",
    remit: "Title WA231076, application N610CGV, first registration.",
    cells: {
      open: {
        status: "dormant",
        title: "Title enquiries and official-copy fees",
        date: "18 Sep–10 Oct 2026",
        correspondent: "HM Land Registry",
        ref: "N610CGV · WA231076 · WA240304",
        url: g("1a124b25060d556f"),
        feeMarker: true,
        detail:
          "Enquiry references in the mailbox include 260917-6718215 (application N610CGV, title WA231076), 260928-6762800, 260928-6762801, 260929-6766714 and 261007-6799563. Separate official-copy purchases on 18–19 September cost £14.00 per title-register and title-plan copy; GOV.UK Pay receipts are recorded in the wiki’s Paywalls to Disclosure register. These copies were paid for; the price is not a fee quote from the 10 October reply. One automated reply said an email address is no longer supported. Another mailbox is not monitored.",
      },
      reply: {
        status: "nuisance",
        title: "“Already been raised”",
        date: "10 Oct 2026",
        correspondent: "Central, Land Registry",
        ref: "260917-6718215",
        url: g("1a124b25060d556f"),
        detail:
          "On 10 October, Central wrote on 260917-6718215 that the matter you contacted them about has already been raised. Combined with unmonitored mailboxes, the first-line channel is circular: new enquiry numbers pointing back at an existing file.",
      },
      chase: {
        status: "dormant",
        title: "SAR D260928 awaiting identity and address verification",
        date: "27 Oct 2026",
        correspondent: "S. Henderson, Disclosure Officer, HM Land Registry",
        ref: "D260928 · titles WA231076 / WA240304",
        url: g("1a17d3ce2927a81d"),
        detail:
          "On 27 October Land Registry said it needs photographic identity evidence (for example a passport or driving licence) and a recent utility bill before it can proceed with subject access request D260928. It says copies will not be retained, but a file note will be made. The SAR is therefore awaiting the requested verification; this is not a decision on the underlying title or registration questions.",
      },
      complaint: {
        status: "evidence",
        title: "Stage one, stage two, and a 43-document schedule",
        date: "19 Apr and 25 May 2026",
        correspondent: "HM Land Registry complaints",
        ref: "Stage-one and stage-two decisions",
        url: g("1a123ef587a83fad"),
        detail:
          "On 10 October you told the Independent Complaints Reviewer that you hold the stage-one decision of 19 April 2026, the stage-two decision of 25 May 2026, and a schedule of 43 documents on the first-registration file. The schedule is evidence in. The conclusions of the two decisions are not restated in that email.",
      },
      regulator: {
        status: "nuisance",
        title: "ICR/090/26 — a letter that had not arrived",
        date: "12 Oct 2026",
        correspondent: "Independent Complaints Reviewer",
        ref: "ICR/090/26",
        url: g("1a123ef587a83fad"),
        detail:
          "ICR/090/26 is the independent review of the Land Registry complaint. The office acknowledged further emails on 29 September. On 12 October they wrote that you appeared not to have received their letter of 9 October, and they attached it again. The reviewer is engaged. The correspondence itself is unreliable.",
      },
    },
  },
  {
    id: "mod",
    name: "Ministry of Defence",
    short: "MOD",
    kind: "authority",
    remit: "1988 eviction, FOI2026/09019, SAR DPR2026/46503.",
    cells: {
      open: {
        status: "dormant",
        title: "1988 records request and supplementary search relogged",
        date: "5 Aug–30 Oct 2026",
        correspondent: "MOD FOI and Defence Business Services",
        ref: "FOI2026/09019 · DPR2026/46503 · FOI2026/25726",
        url: g("1a18893b1774cbb8"),
        detail:
          "Two original tracks remain: FOI2026/09019 asks about possible UK Armed Forces involvement in the 1988 events at Tŷ Mawr; subject access request DPR2026/46503 was received by Defence Business Services on 5 August 2026. On 30 October the MOD confirmed that the 10 October request, with the additional nomenclature and location search terms, has been relogged as FOI2026/25726, with a target date of 26 November 2026. This is an acknowledgement and new reference, not a disclosure or confirmation that any record is held.",
      },
      reply: {
        status: "suspicious",
        title: "Section 23(5), and a SAR with nothing in scope",
        date: "9 Oct 2026",
        correspondent: "MOD FOI and DBS Disclosures",
        ref: "FOI2026/09019 · DPR2026/46503",
        url: g("1a123ef732996ab6"),
        detail:
          "On the FOI, the Ministry relied on section 23(5) for the Special Forces part: a neither-confirm-nor-deny exemption. On the SAR, DBS wrote on 9 October 2026, late, that no information in scope was held. A blank SAR on an eviction in which armed forces have been asked about, paired with a section 23 exemption, is marked questionable. The “nothing in scope” sentence, taken alone, would have been orange.",
      },
      chase: {
        status: "dormant",
        title: "The non-Special-Forces remainder",
        date: "10 Oct 2026",
        correspondent: "To MOD FOI",
        ref: "FOI2026/09019 clarification",
        url: g("1a11eb8cc384c312"),
        detail:
          "On 10 October you asked the FOI team to clarify the non-Special-Forces remainder and the existing retention and search records. No answer to that clarification is in the sample. WhatDoTheyKnow’s 10 October notification of a new response on the 1988 dispossession request is noted, but the response text is not in the Gmail notice.",
      },
      review: {
        status: "dormant",
        title: "Internal review of the SAR handling",
        date: "10 Oct 2026",
        correspondent: "To MOD FOI internal review",
        ref: "DPR2026/46503",
        url: g("1a123ef40f2cf0cd"),
        detail:
          "On 10 October you requested an internal review of the handling and classification of the request about possible UK Armed Forces involvement in the 1988 eviction, reference DPR2026/46503. No review outcome is in the mailbox.",
      },
    },
  },
  {
    id: "nactso",
    name: "National Counter Terrorism Security Office",
    short: "NaCTSO",
    kind: "authority",
    remit: "WhatDoTheyKnow request “BP vs Buckler 1987”.",
    cells: {
      open: {
        status: "dormant",
        title: "WDTK request BP vs Buckler 1987",
        date: "2026",
        correspondent: "NaCTSO via WhatDoTheyKnow",
        ref: "BP vs Buckler 1987",
        url: g("1a120c63de6587c0"),
        detail:
          "A WhatDoTheyKnow request titled “BP vs Buckler 1987” is with the National Counter Terrorism Security Office. The Gmail record is the notification stream, not the request text.",
      },
      reply: {
        status: "nuisance",
        title: "Several responses, text not in Gmail",
        date: "29 Sep, 1 Oct, 9 Oct 2026",
        correspondent: "NaCTSO via WhatDoTheyKnow",
        ref: "New-response notices",
        url: g("1a120c63de6587c0"),
        detail:
          "WhatDoTheyKnow notified new responses on 29 September, 1 October (twice) and 9 October 2026. The notices do not include the response text, so this slice is marked complicated: something was sent, and it is not yet read into the chart.",
      },
    },
  },
  {
    id: "moj",
    name: "Ministry of Justice",
    short: "Justice",
    kind: "authority",
    remit: "FOI 260813002, under internal review.",
    cells: {
      open: {
        status: "dormant",
        title: "FOI 260813002",
        date: "Before 13 Aug 2026",
        correspondent: "Ministry of Justice",
        ref: "FOI 260813002",
        detail:
          "An FOI to the Ministry of Justice, reference 260813002, is in the mailbox only through the internal-review acknowledgement. The original request text is not in this sample.",
      },
      review: {
        status: "dormant",
        title: "Internal review acknowledged",
        date: "9 Oct 2026",
        correspondent: "NSUKilo, Ministry of Justice",
        ref: "Review of FOI 260813002, requested 13 Aug 2026",
        detail:
          "On 9 October 2026 NSUKilo at justice.gov.uk acknowledged the internal review you requested on 13 August 2026 of FOI 260813002. Acknowledgement is not an outcome. The review is dormant until the decision arrives.",
      },
    },
  },
  {
    id: "mp",
    name: "Stephen Doughty MP",
    short: "Doughty",
    kind: "political",
    remit: "Constituency casework on N610CGV.",
    cells: {
      open: {
        status: "evidence",
        title: "Office forwarded the Land Registry letter",
        date: "18 Sep 2026",
        correspondent: "Office of Stephen Doughty MP",
        ref: "HMLR N610CGV",
        url: g("1a11a41c4126f155"),
        detail:
          "On 18 September the MP’s office forwarded a letter from HM Land Registry’s Chief. That letter is evidence in the casework file. You followed up on 10 October about N610CGV and the casework log.",
      },
      reply: {
        status: "dormant",
        title: "Automatic reply only",
        date: "28 Sep 2026",
        correspondent: "Office of Stephen Doughty MP",
        ref: "Auto-reply on the 719/26 note",
        detail:
          "An automatic reply on 28 September confirmed a related email (subject access, crime-recording, and a search note on police FOI 719/26) had been received, and that the office is behind on mail. No substantive reply to the 10 October follow-up is in the sample.",
      },
    },
  },
  {
    id: "cotswold",
    name: "Cotswold Archaeology",
    short: "Cotswold",
    kind: "private",
    remit: "1994 early-medieval cemetery archive.",
    cells: {
      open: {
        status: "dormant",
        title: "Preservation notice, then a copy request",
        date: "10 Oct 2026",
        correspondent: "Cotswold Archaeology",
        ref: "1994 Llandough cemetery archive",
        url: g("1a11eaa835381426"),
        detail:
          "A preservation notice had already been served. On 10 October you asked whether they hold any retained copy of the 1994 early-medieval cemetery excavation archive or report for Llandough / Great House Farm.",
      },
      reply: {
        status: "evidence",
        title: "The report is on their website",
        date: "12 Oct 2026",
        correspondent: "Cotswold Archaeology",
        ref: "reports.cotswoldarchaeology.co.uk",
        url: g("1a11eaa835381426"),
        detail:
          "On 12 October Cotswold Archaeology wrote that the report is online at reports.cotswoldarchaeology.co.uk, searchable by keyword. That is evidence in from a private holder. Cotswold Archaeology is not a public authority, so the inner FOI rings are not a legal path against them.",
      },
    },
  },
  {
    id: "linklaters",
    name: "Linklaters — archives",
    short: "Linklaters",
    kind: "private",
    remit: "BP Properties and BP Pension Trust files, 1982–1988.",
    cells: {
      open: {
        status: "dormant",
        title: "Preservation and access request",
        date: "10 Oct 2026",
        correspondent: "Linklaters archives",
        ref: "BP files 1982–1988",
        url: g("1a11eaa7a327d405"),
        detail:
          "You referred to a preservation notice already served and asked the records team to confirm whether any client files, pleadings, instructions, disclosure schedules or title papers survive for BP Properties / BP Pension Trust and Great House Farm / Llandough, 1982–1988. No reply is in the sample. Linklaters is not a public authority.",
      },
    },
  },
  {
    id: "itv",
    name: "ITV Archive",
    short: "ITV Archive",
    kind: "private",
    remit: "December 1988 footage of the demolition.",
    cells: {
      open: {
        status: "dormant",
        title: "Archive search for December 1988",
        date: "10 Oct 2026",
        correspondent: "ITV",
        ref: "Tŷ Mawr demolition, about ST 168 733",
        url: g("1a1273c8e61a8b71"),
        detail:
          "You asked ITV to search for footage of Great House Farm / Tŷ Mawr, Llandough-juxta-Penarth, adjoining St Dochdwy’s, around the December 1988 demolition.",
      },
      reply: {
        status: "closed",
        title: "Automated dead end",
        date: "10 Oct 2026",
        correspondent: "ITV clipsales, then viewers.requests",
        ref: "Wrong inbox, then a canned refusal",
        url: g("1a1273c8e61a8b71"),
        detail:
          "ITV clip sales replied automatically that the inbox is only for licensing footage, and pointed personal research at viewers.requests. That address then sent a canned reply: the service is only for viewers wanting copies of programmes. Neither message searched an archive. For a research request, that is them saying there is nothing further this channel will do.",
      },
    },
  },
  {
    id: "dwr-cymru",
    name: "Dŵr Cymru Welsh Water",
    short: "Welsh Water",
    kind: "authority",
    remit: "Water undertaker. Within the EIR for environmental information. The 1988 supply and any disconnection at the farm.",
    cells: {
      open: {
        status: "dormant",
        title: "EIR on the 1988 water supply",
        date: "7 Jun – 11 Aug 2026",
        correspondent: "To Welsh Water",
        ref: "Historic water-supply records, Great House Farm",
        url: g("19ea1459e1ca52e1"),
        detail:
          "On 7 June 2026 you asked under the EIR for historic water-supply records for Great House Farm, Llandough, including any disconnection in 1988. You followed up on 20 June, 1 August and 11 August. Twenty working days from 7 June is about 3 July 2026. No reply to those emails is in the mailbox before 12 August.",
      },
      reply: {
        status: "closed",
        title: "“No records” on the property",
        date: "13 Aug – 29 Sep 2026",
        correspondent: "Data Subject Rights team, then Customer Care",
        ref: "DP/2961/2026; mail refs 92994223/01, 93027237/01, 93047764/01",
        url: g("1a0afe15770e3994"),
        detail:
          "The first answer came from the data-subject-rights team on 13 August 2026: no records held about you or the property. On 3 September Customer Care reviewed it as an enquiry about the 1988 supply rather than a subject-access request and kept the same position. On 17 and 29 September it repeated that searches found no records about you or Great House Farm (Tŷ Mawr), and said it cannot give disposal or audit records for documents it does not hold. The reply came after the 20-working-day point on the June request. Found since (19 Oct 2026): the Western Mail of 20 November 1958 (snippet only, wiki EV-0037) reports Mrs Buckler’s claim that the water was cut off “for nearly 10 years by order of Western Ground Rents”. That would date the cut-off to about 1948–58, before Welsh Water existed; the c.1988 date is recorded as a conflict (wiki SC-48). The same report (snippet only) adds, under “Herd loss”: “This, she added, resulted in loss of a complete herd of Friesian cattle.” Linking the herd loss to the water cut-off is an inference.",
      },
    },
  },
  {
    id: "heneb",
    name: "Heneb (formerly GGAT) — Historic Environment Record",
    short: "Heneb",
    kind: "private",
    remit: "Regional archaeology trust that keeps the Historic Environment Record. It disputes that it falls within the EIR.",
    cells: {
      open: {
        status: "dormant",
        title: "HER source file and records schedule",
        date: "8 and 19 Sep 2026",
        correspondent: "To the HER team",
        ref: "GGAT02038s",
        url: g("1a07efa0b6b10900"),
        detail:
          "On 8 September 2026 you asked for the HER source file for Great House Farm, Llandough, framed under the EIR, and on 19 September you sent a schedule of further records.",
      },
      reply: {
        status: "evidence",
        title: "Source file digitised on Archwilio",
        date: "6, 14 and 16 Oct 2026",
        correspondent: "HER team",
        ref: "Archwilio record 02038s",
        url: g("1a07efa0b6b10900"),
        detail:
          "On 6 October Heneb replied that whether it falls within the EIR is a matter of legal dispute, and pointed to Archwilio record 02038s. On 14 October it wrote that the HER source file had been digitised and uploaded to that record as PDFs, including its copy of Suggett (1988). On 16 October it answered the 19 September schedule point by point, mostly by reference to the public Archwilio record.",
      },
      chase: {
        status: "closed",
        title: "Follow-up searches return no further records; fire enquiry not held",
        date: "29 Oct 2026",
        correspondent: "Heneb Historic Environment Record Team",
        ref: "GHF/HENEB/2026-09-20 · 1983 GGAT warehouse-fire enquiry",
        url: g("1a0bbdf18c9ea3b9"),
        detail:
          "On 29 October Heneb said it had made all reasonable efforts to search its planning and project archives and administrative files and had recovered no information pertaining to the outstanding requests. It said the HER does not record the requested information, identified the Suggett 1988 source online, supplied a redacted example of its change log but declined to provide further entries, gave 1 April 2024 as the transfer date requested, said certain requested documents do not exist, and stated it has no intention of deleting files or changing records. In a separate response to the 24 September enquiry about the March 1983 GGAT warehouse fire and possible loss of Llandough material, Heneb said it holds no records pertaining to that request. These are Heneb's stated positions on the searches made; they do not prove that records never existed or that records held elsewhere are absent.",
      },
      complaint: {
        status: "dormant",
        title: "Formal complaint acknowledged",
        date: "27–30 Sep 2026",
        correspondent: "Heneb",
        ref: "HER identifiers",
        url: g("1a0ceb50ec8ec412"),
        detail:
          "You sent a formal complaint to GGAT / Heneb on 27 September 2026 about the HER identifiers. It was acknowledged. No complaint outcome is in the mailbox as of 18 October 2026.",
      },
    },
  },
  {
    id: "bp",
    name: "BP — Archive and group legal",
    short: "BP",
    kind: "private",
    remit: "The claimant’s group in BP Properties Ltd v Buckler [1987] EWCA Civ 2. Not a public authority: no FOI route.",
    cells: {
      open: {
        status: "dormant",
        title: "Letters to group legal",
        date: "28 Jan – 7 Jun 2026",
        correspondent: "To BP group legal",
        ref: "BP Properties Ltd v Buckler [1987] EWCA Civ 2",
        url: g("19c033a551662faa"),
        detail:
          "You wrote to BP’s group legal function on 28 January, 9 May and 7 June 2026 asking for records and a litigation hold. No reply to those letters is in the mailbox.",
      },
      reply: {
        status: "closed",
        title: "Archive: nothing before 1955",
        date: "25 Aug 2026",
        correspondent: "BP Archive",
        ref: "Reading Room request",
        url: g("1a0073ad95b3bb32"),
        detail:
          "The BP Archive replied on 25 August 2026 that it holds material up to the end of 1954, that post-1954 material is not open to external access, and that it found no documents about the property before 1955, explaining that BP did not acquire the property until the 1960s. That last point is BP’s account. It is recorded here as written and has not been tested against the title records.",
      },
      chase: {
        status: "dormant",
        title: "Preservation notices, no reply",
        date: "28 Sep and 16 Oct 2026",
        correspondent: "To BP",
        ref: "Titles WA231076, WA240304",
        url: g("1a1439902c7e1dc4"),
        detail:
          "Preservation notices went to BP on 28 September and 16 October 2026, asking that records about the farm, the 1982–83 registrations and the 1987 case are not destroyed. No reply is in the mailbox as of 18 October 2026.",
      },
    },
  },
  {
    id: "cps",
    name: "Crown Prosecution Service",
    short: "CPS",
    kind: "authority",
    remit: "Prosecuting authority. Asked to consider the Buckler case’s concerns about suspected historic misconduct.",
    cells: {
      open: {
        status: "dormant",
        title: "FOI request 14786 — historical CPS records",
        date: "21–26 Oct 2026",
        correspondent: "To and from CPS Corporate Knowledge & Information Team",
        ref: "CPS FOI 14786",
        url: g("1a1790f028e2355a"),
        detail:
          "On 21 October you asked whether the CPS holds any records from 1 October 1986 to 31 December 1990 referring to Great House Farm / Tŷ Mawr, BP Properties Ltd or the reported summons arising from events at the farm on 29 April 1988; you also asked for any applicable retention or disposal records and a description of the searches. The CPS acknowledged receipt on 26 October and set a response deadline of 18 November 2026. This is a records request, not a submission of evidence to the CPS. Separately, the 3 September submission asking the CPS to consider the concerns about the 1987 proceedings remains an earlier track; the October mail reviewed here contains no CPS decision on that submission.",
      },
      reply: {
        status: "dormant",
        title: "FOI acknowledged; substantive response awaited",
        date: "26 Oct 2026",
        correspondent: "CPS Corporate Knowledge & Information Team",
        ref: "14786 · due 18 Nov 2026",
        url: g("1a1790f028e2355a"),
        detail:
          "The CPS confirmed that it is processing the 21 October request under FOIA, that the disclosure regime is public, and that the response is due by 18 November 2026. This is an acknowledgement only; it does not confirm whether any case file exists or whether searches have returned information.",
      },
      chase: {
        status: "dormant",
        title: "Chased, then acknowledged",
        date: "27 Sep – 8 Oct 2026",
        correspondent: "To the CPS",
        url: g("1a0ee493c00fb442"),
        detail:
          "You chased on 27 September and sent further information on 30 September 2026. A holding acknowledgement is in the mailbox, dated 8 October. No substantive decision is in the mailbox as of 18 October 2026.",
      },
    },
  },
  {
    id: "family",
    name: "The family — testimony",
    short: "Family",
    kind: "family",
    remit:
      "Relatives of Mary (Nancy) Williams and William Buckler. Their own memory of 1987–1988 and after. Gathered slowly, with consent, at their pace.",
    cells: {
      open: {
        status: "evidence",
        title: "Testimony invited",
        date: "2026",
        correspondent: "Relatives (not named here)",
        ref: "Testimony, not an official record",
        detail:
          "Relatives have been asked, privately and one at a time, what they remember of the farm, the eviction, the demolition and the years after. Nobody is named on this chart. What any relative recalls is labelled as that named person’s testimony until a record supports it, and is only published with that person’s agreement.",
      },
      reply: {
        status: "evidence",
        title: "Some accounts in, partly",
        date: "Sep–Oct 2026",
        correspondent: "Relatives (not named here)",
        ref: "Partial, not yet signed",
        detail:
          "Some testimony has come back, to some extent. It is not yet written down as signed statements, and it has not been tested against the records. Where it matches a record already held, that match is noted on the evidence pages, not here. On 19 October 2026 one relative’s voice testimony was added to the wiki’s testimony pages and checked point by point: a Western Mail report of 20 November 1958 (wiki EV-0037, snippet only) supports a water cut-off, but puts it at about 1948–58, not c.1988 (wiki SC-48); “Cardiff UDC” is not supported (Llandough was in Penarth UDC), and no Hansard record of the water matter has been found so far. Hansard does record the 1958–59 inquiry into the Glamorgan development plan and its delayed approval in 1960–62, without naming Llandough or the farm (wiki EV-0239); whether that is the Parliamentary discussion remembered is a hypothesis only. Also found on 19 October: the Barry Dock News of 23 October 1908 reports a vote of sympathy at the Llandough court leet “with the family of the late Mr. John Williams, Great House, Llandough, for many years a juror of the court” (wiki EV-0243). That fits Mary (Nancy) Williams’s statement that her grandfather died in 1908; against it, a 1904 report describes the Williams occupation as a tenancy from 1855.",
      },
      chase: {
        status: "nuisance",
        title: "Hard to give, hard to ask",
        date: "Ongoing",
        correspondent: "Relatives (not named here)",
        ref: "Trauma, not obstruction",
        detail:
          "Relatives are traumatised by what happened, and talking about it is difficult. That can make the family as slow to answer as the authorities, but for the opposite reason: this is harm, not handling. So the rule is no deadlines, no pressure, and the right to stop or withdraw. The ask for trauma-informed counselling is part of making testimony possible, not a condition of it.",
      },
      review: {
        status: "dormant",
        title: "Consent check before 22 Oct",
        date: "By 16 Oct 2026",
        correspondent: "Each relative",
        ref: "WP-LCC-09",
        detail:
          "Before anything family-sourced is said at the Llandough Community Council meeting on 22 October 2026, each relative whose memory is used is asked to agree to how it is put. Anything not agreed is left out.",
      },
      democratic: {
        status: "dormant",
        title: "Ask: acknowledge the harm",
        date: "22 Oct 2026",
        correspondent: "Llandough Community Council",
        ref: "Item 10 — ask 4",
        detail:
          "The Council is asked to acknowledge the harm to the family and to support a request to Cardiff and Vale University Health Board for trauma-informed counselling. A Senedd inquiry, if one is recommended, would be the place for formal, supported witness evidence.",
      },
    },
  },

  {
    id: "defra",
    name: "Department for Environment, Food & Rural Affairs",
    short: "Defra",
    kind: "authority",
    remit: "Successor to MAF. Wartime and post-war farm records, 1936–1955.",
    cells: {
      open: {
        status: "closed",
        title: "FOI2026/23886 — MAF farm records request",
        date: "20–29 Oct 2026",
        correspondent: "Defra Information Rights Team",
        ref: "FOI2026/23886",
        url: g("1a156bfe07db1662"),
        detail:
          "The request sought National Farm Survey / MAF farm records, Glamorgan War Agricultural Executive Committee records, possession or requisition decisions, Agricultural Holdings Act consent, compensation claims and correspondence with Western Ground Rents or the Bute Estate for 1936–1955. After you supplied additional historical names and location forms on 29 October, Defra said the added terms did not change its 21 October response and that the Department does not hold the requested information. Defra pointed to the Welsh Government as a possible holder.",
      },
      reply: {
        status: "closed",
        title: "Defra maintains its not-held position",
        date: "29 Oct 2026",
        correspondent: "Defra Information Rights Team",
        ref: "FOI2026/23886",
        url: g("1a156bfe07db1662"),
        detail:
          "Defra confirmed that it had considered the supplementary historical names and locality descriptions but maintained its position that the information requested under FOI2026/23886 is not held by the Department. A separate 29 October response to the nomenclature supplement says further searches, including within the Records Management Team, found no information within that supplement's scope. Keep those two request scopes distinct. A not-held response records Defra's search result; it does not establish that the records never existed or were not transferred elsewhere.",
      },
    },
  },
  {
    id: "historic-england",
    name: "Historic England",
    short: "Historic England",
    kind: "authority",
    remit: "Archive custody and the 2018 transfer of Welsh archaeological-report microfiche to RCAHMW.",
    cells: {
      open: {
        status: "dormant",
        title: "EIR 26/04323 — archive transfer and retention enquiry",
        date: "20–22 Oct 2026",
        correspondent: "Historic England Access to Information",
        ref: "26/04323",
        url: g("1a15e2cfd24eaf4d"),
        detail:
          "The enquiry asked for the custody, transfer and retention history of the Welsh section of Historic England's archaeological reports microfiche collection, including any transfer records and any retained copy or index.",
      },
      reply: {
        status: "evidence",
        title: "Deaccession decision and transfer letter identified",
        date: "27 Oct 2026",
        correspondent: "Mark Wilkins, Historic England",
        ref: "26/04323 · deaccession 25 Jul 2017 · transfer 12 Jan 2018",
        url: g("1a15e2cfd24eaf4d"),
        detail:
          "Historic England said it holds a letter transferring the Welsh section to RCAHMW dated 12 January 2018 and a deaccession statement recording the decision on 25 July 2017 by the former Head of Archive. It said there was no itemised list of the microfiche and that Historic England neither destroyed nor retained the microfiche after transfer. The email identifies attachments containing the letter and statement; those attachment contents have not yet been transcribed here. The reply also records redaction of minor third-party personal information.",
      },
    },
  },
  {
    id: "ordnance-survey",
    name: "Ordnance Survey",
    short: "OS",
    kind: "authority",
    remit: "Historic map revision, naming and source records for the Penarth-area Llandough.",
    cells: {
      open: {
        status: "dormant",
        title: "FOI-26-46 clarified; new response deadline",
        date: "20–29 Oct 2026",
        correspondent: "Ordnance Survey FOI Team",
        ref: "FOI-26-46",
        url: g("1a18825f3d9394d6"),
        detail:
          "OS initially confused the target site with Great House Farm at Llandough near Cowbridge (CF71 7LR), and identified another Ty Mawr without the Great House name. You clarified that the subject is Llandough-juxta-Penarth, near Penarth and Cardiff, around ST 168 733, not the Cowbridge parish. On 29 October OS acknowledged receipt of the clarification and set a revised response deadline of 26 November 2026. The 20-working-day clock restarted after clarification. The substantive map-revision and name-source search remains pending.",
      },
      reply: {
        status: "evidence",
        title: "Location ambiguity identified and corrected",
        date: "26–29 Oct 2026",
        correspondent: "Nikki Osborne, OS FOI Team",
        ref: "FOI-26-46",
        url: g("1a177a359d80b6be"),
        detail:
          "The 26 October clarification request shows that OS's initial search had found the Cowbridge Llandough rather than the Penarth-area site. Your 29 October clarification supplied the parish, map-sheet and grid-reference distinction, and OS acknowledged it the same day. This is a resolved location clarification, not a substantive answer about revision notes or historical naming records.",
      },
    },
  },
  {
    id: "nrw",
    name: "Natural Resources Wales",
    short: "NRW",
    kind: "authority",
    remit: "Cwm Cydfin SSSI, ownership/occupier notifications and woodland records.",
    cells: {
      open: {
        status: "dormant",
        title: "EIR acknowledged — Cwm Cydfin and Leckwith woodland",
        date: "20–27 Oct 2026",
        correspondent: "Owen Hopkins, NRW Access to Information Team",
        ref: "CAS-322825-L6S1",
        url: g("1a17d40e7e544e07"),
        detail:
          "NRW acknowledged EIR request CAS-322825-L6S1 on 27 October. It concerns the 1972 and 1985 Cwm Cydfin SSSI notifications, owners and occupiers served, objections and management records, and woodland grant, felling, management and title records for the Leckwith Road woodland including WA735527. NRW says it will respond as soon as possible and no later than 20 working days after receipt. This is an acknowledgement, not a disclosure.",
      },
    },
  },
  {
    id: "companies-house",
    name: "Companies House",
    short: "Companies House",
    kind: "authority",
    remit: "Corporate filings and company-history records for Western Ground Rents Limited.",
    cells: {
      open: {
        status: "dormant",
        title: "Company records enquiry",
        date: "10–30 Oct 2026",
        correspondent: "Companies House Enquiries Team",
        ref: "COH2382411X · Western Ground Rents Limited 09760885",
        url: g("1a1273a8a3ded5fd"),
        detail:
          "The enquiry concerns the corporate record of Western Ground Rents Limited and connected company records relevant to the historical title chain. Companies House supplied 09760885 as the company number for a company currently named Western Ground Rents Limited. The original 1938 conveyance enquiry refers to Western Ground Rents Ltd, company number 00342092. The relationship or legal continuity between these numbers is not established by this reply and must be checked against the incorporation and name-history records before treating them as the same entity.",
      },
      reply: {
        status: "evidence",
        title: "Filing access and archive-copy prices supplied",
        date: "30 Oct 2026",
        correspondent: "Companies House Contact Centre",
        ref: "09760885 · COH2382411X",
        url: g("1a1273a8a3ded5fd"),
        feeMarker: true,
        detail:
          "Companies House says digital data and images are free online. It quoted £3 per document, £3 for a past/current director list or mortgage/charge/debenture list, £9 for accounts or annual returns filed before 1973, and £20 for an Archive DVD containing documents from incorporation to 31 December 2002, excluding pre-1973 accounts and annual returns. No archive document has been ordered or supplied by this email; this is a retrieval route and fee schedule, not evidence of the 1926 or 1938 conveyances. In particular, the answer does not establish that company 09760885 is the same legal person as the earlier company number 00342092.",
      },
    },
  },
  {
    id: "forest-of-cardiff",
    name: "Forest of Cardiff",
    short: "Forest of Cardiff",
    kind: "private",
    remit: "Woodland owner; informal enquiry about historic acquisition and title documents for WA735527.",
    cells: {
      open: {
        status: "dormant",
        title: "Request to check woodland acquisition records",
        date: "18 Sep–29 Oct 2026",
        correspondent: "To Forest of Cardiff",
        ref: "WA735527 · reported 1926 / 1938 instruments",
        url: g("1a0b6419bb421780"),
        detail:
          "You asked whether Forest of Cardiff holds or has held the reported 1926 conveyance to Cardiff Corporation, 1926 Mountjoy formation records, and 1938 Bute/Mountjoy conveyance to Western Ground Rents, including plans, abstracts or references in its 1994 acquisition file or with its advisers.",
      },
      reply: {
        status: "evidence",
        title: "Correspondent says requested records are not held",
        date: "29 Oct 2026",
        correspondent: "Julian Wilkes",
        ref: "WA735527 · reported 1926 / 1938 instruments",
        url: g("1a0b6419bb421780"),
        detail:
          "Julian Wilkes replied: “I'm afraid we don't have any of those records you referred to.” The email does not establish his role, the scope of any search, or whether the response is the charity's formal position. Record it as a correspondent's statement only, not as a verified institutional nil return or proof that the instruments do not exist.",
      },
    },
  },
];

export const sampledThrough = "30 October 2026";

export function dormantDetail(party: Party, ring: Ring): string {
  if (party.kind === "private" && (ring.id === "regulator" || ring.id === "democratic" || ring.id === "forum")) {
    return `${party.name} is not a public authority. The ICO, the Ombudsman and the Information Rights Tribunal are not a path against them. What is left, if a record is still missing, is a further preservation request or an order in the underlying case. Nothing in the mailbox shows that step.`;
  }
  if (party.kind === "family") {
    return "The family is not a body to be reviewed, complained about or taken to a regulator. This ring stays empty on purpose. Testimony is given, not extracted.";
  }
  if (party.kind === "political" && ring.id !== "open" && ring.id !== "reply" && ring.id !== "chase") {
    return "An MP’s office is casework, not a body you take to the ICO. The next step is a chase to the office, or asking them to press the authority that actually holds the file. That chase is not in the mailbox beyond what the other slices show.";
  }
  const next: Record<RingId, string> = {
    open: `No opening request to ${party.name} is in the mailbox sample used for this chart.`,
    reply: `No substantive reply from ${party.name} is in the mailbox yet.`,
    chase: `No clarification or chase to ${party.name} is recorded here.`,
    review: `No internal review has been asked of ${party.name}.`,
    complaint: `No formal complaint to ${party.name} under their own complaints procedure is recorded.`,
    regulator: `Not yet taken to the independent reviewer. For most of these bodies that is the Information Commissioner, after the internal review. For Land Registry it is the Independent Complaints Reviewer.`,
    democratic: `Not yet taken to the MP, the council chamber, scrutiny, or the Public Services Ombudsman for Wales as a complaint about ${party.name}.`,
    forum: `Not yet appealed to the First-tier Tribunal (Information Rights), and not raised as a judicial review.`,
  };
  return next[ring.id];
}

export function resolveCell(party: Party, ring: Ring): Cell {
  return (
    party.cells[ring.id] ?? {
      status: "dormant",
      title: "Not opened",
      detail: dormantDetail(party, ring),
    }
  );
}
