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

/** Outside first. Each step inward is the next route that has to be used up. */
export const rings: Ring[] = [
  {
    id: "open",
    name: "Opening enquiry",
    short: "Enquiry",
    blurb: "The first FOI, EIR, subject-access or archive request.",
  },
  {
    id: "reply",
    name: "Substantive reply",
    short: "Reply",
    blurb: "What they actually sent back: a record, a refusal, or a holding note.",
  },
  {
    id: "chase",
    name: "Clarification and chase",
    short: "Chase",
    blurb: "Missing schedules, scope fights, and refinements.",
  },
  {
    id: "review",
    name: "Internal review",
    short: "Review",
    blurb: "The authority reconsidering its own response.",
  },
  {
    id: "complaint",
    name: "Formal complaint",
    short: "Complaint",
    blurb: "Their complaints procedure, a stage-two decision, or a chief inspector.",
  },
  {
    id: "regulator",
    name: "Independent regulator",
    short: "Regulator",
    blurb: "The ICO, or the Independent Complaints Reviewer for Land Registry.",
  },
  {
    id: "democratic",
    name: "Democratic pressure",
    short: "Democratic",
    blurb: "MP, scrutiny, the council chamber, or the Public Services Ombudsman for Wales.",
  },
  {
    id: "forum",
    name: "Tribunal or court",
    short: "Tribunal",
    blurb: "First-tier Tribunal, Upper Tribunal, or a court order for the record.",
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
    label: "Nothing further",
    hint: "They say there is no more they can do",
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
        url: g("1a12af23f85ed2de"),
        detail:
          "The clerk said the “other matters” in the 21 September email would be considered at the October meeting, and that he would send the Council’s views afterwards. You asked to attend in the proper way and to see the papers. Putting the substantive questions onto a later meeting, rather than answering whether records are held, sits with the same officer whose refusal is under review. Since then: the Clerk’s agenda of 13 October 2026 said the 22 October meeting would be in the Council Chamber, with attendance in person or remotely. On 16 October he wrote that it will now be held remotely only. You objected the same day and asked for a reply by 17:00 on 20 October. No reply is in the mailbox as of 18 October 2026.",
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
        title: "Request logged as 00211557",
        date: "28 Sep 2026",
        correspondent: "Information Governance, FOI Unit",
        ref: "00211557, and 00210772, 00211463, 00211483, 00211484",
        url: g("1a0f2d7e013f1d97"),
        detail:
          "The FOI unit acknowledged on 30 September that a request received on 28 September, reference 00211557, is being considered under FOIA and the EIR. Subject stated on the acknowledgement: Great House Farm / Church View Close — section 52 and land charges, the planning register, environmental-assessment screening, the condition 16–18 chain, and 92/00671/RES. Your later chase also names earlier open requests 00210772, 00211463, 00211483 and 00211484.",
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
        title: "Appendices C, D and E still missing",
        date: "10 Oct 2026",
        correspondent: "To the Vale FOI Unit",
        ref: "Formal chase of 00211557 and earlier requests",
        url: g("1a123ef64335cb7c"),
        detail:
          "Your 10 October email is a formal chase of three missing planning appendices, C, D and E. The file is open and incomplete: disclosures on one side, three appendices still not supplied on the other.",
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
        status: "closed",
        title: "Unable to consider the request",
        date: "11 Oct 2026",
        correspondent: "Democratic Services",
        ref: "Democratic Services refusal",
        url: g("1a1149d647cb33dc"),
        detail:
          "Democratic Services replied the next day that Scrutiny will be unable to consider it. His reasons: Task and Finish is for strategic, county-wide policy, not one historical site; Scrutiny should not review evidence of individual historical decisions, particularly planning; and because concerns are already with Welsh Government, Cadw, MSs and MPs, another layer of stakeholders would not be appropriate.",
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
        status: "dormant",
        title: "Internal review 1188/26 opened",
        date: "29 Sep 2026",
        correspondent: "FOI review team",
        ref: "1188/26 of FOI 719/26",
        detail:
          "On 29 September the force confirmed that your email of 27 September, asking for an internal review of FOI 719/26, had been passed to the FOI review team as 1188/26. No outcome is in the mailbox sample.",
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
        title: "FOI/2026/09 and a LibAnswers enquiry",
        date: "10 Oct 2026",
        correspondent: "NLW enquiries",
        ref: "FOI/2026/09",
        url: g("1a11eaa0af2e3861"),
        detail:
          "A LibAnswers submission was acknowledged on 10 October. The FOI file is FOI/2026/09, already through internal review by the time of that note.",
      },
      reply: {
        status: "evidence",
        title: "Bute Estate series searched",
        date: "Before 10 Oct 2026",
        correspondent: "NLW FOI",
        ref: "D153 and D205",
        url: g("1a11eaa0af2e3861"),
        detail:
          "You thanked them for searches of the Bute Estate series, including D153 and D205. Those searches are evidence in, whether or not a further box turns up.",
      },
      chase: {
        status: "dormant",
        title: "One remaining point",
        date: "10 Oct 2026",
        correspondent: "To NLW enquiries",
        ref: "Further Bute or related material",
        url: g("1a11eaa0af2e3861"),
        detail:
          "On 10 October you asked them to confirm whether any further Bute Estate or related material remains. No answer to that single point is in the sample.",
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
        title: "Scans ordered, not yet in",
        date: "10 Oct 2026",
        correspondent: "To NMR enquiries",
        ref: "Archives 6048945, 6048943, 6048941",
        url: g("1a11f562b7880f36"),
        detail:
          "On 10 October you ordered scans of Archives 6048945, 6048943 and 6048941. That order is outstanding in this sample. It is a new step, not a reopening of the four answers they say are finished.",
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
        status: "closed",
        title: "ATISN 26-0010 and 27589 both answered on 19 Oct",
        date: "10 Oct 2026 (asked) · 19 Oct 2026 (answered)",
        correspondent: "Welsh Government FOI",
        ref: "ATISN 26-0010, ATISN 27589 (and ATISN 27021)",
        url: g("1a11ea981f52fcb9"),
        detail:
          "On 10 October you asked the Welsh Government FOI team for retention and destruction schedules for pre-1997 file series on agricultural tenancy, land and rural policy (logged as ATISN 26-0010). You tied that to ATISN 27021 and ATISN 27589 (Cadw listing material) and to the Wales Office file 26FOI 103 / IR/26/16. Both 26-0010 and 27589 were answered on 19 October 2026; see the next ring for the two letters. ATISN 26-0009 (the records behind the disposal finding) is still open.",
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
        status: "nuisance",
        title: "Internal review IR/26/16",
        date: "2026",
        correspondent: "Wales Office",
        ref: "IR/26/16",
        url: g("1a11ea981f52fcb9"),
        detail:
          "Internal review IR/26/16 is cited alongside 26FOI 103. The review has been taken. The outcome is not quoted in the mail this chart was drawn from.",
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
        title: "Subject access still inside its deadline",
        date: "1 Oct 2026",
        correspondent: "Data Protection, Land Registry",
        ref: "SAR — WA231076 / WA240304 — due 28 Oct 2026",
        url: g("1a0e3f997bc1bf94"),
        detail:
          "You sent a subject access request on 28 September for titles WA231076 and WA240304, Williams / Buckler, Great House Farm. On 1 October Data Protection said it would be handled under UK GDPR, with a statutory deadline of 28 October 2026. A preservation notice was also acknowledged automatically.",
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
        title: "FOI and a subject access request",
        date: "5 Aug 2026 onward",
        correspondent: "MOD FOI and DBS",
        ref: "FOI2026/09019 · DPR2026/46503",
        url: g("1a11eb8cc384c312"),
        detail:
          "Two tracks. FOI2026/09019 asks about possible UK Armed Forces involvement in the 1988 events at Tŷ Mawr. Subject access request DPR2026/46503 was received by Defence Business Services on 5 August 2026. WhatDoTheyKnow also carries “1988 Dispossession of Great House Farm, Llandough from the Williams/Buckler Family”, which notified a new response on 10 October.",
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
        title: "Submission on reopening the 1987 case",
        date: "3 Sep 2026",
        correspondent: "To the CPS",
        ref: "Re-opening of BP vs Buckler 1987",
        url: g("1a0693988a9de5f0"),
        detail:
          "On 3 September 2026 you sent the CPS a submission asking it to consider the Buckler case’s concerns about suspected historic misconduct connected with BP Properties Ltd v Buckler. An automatic reply and an acknowledgement followed.",
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
];

export const sampledThrough = "18 October 2026";

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
