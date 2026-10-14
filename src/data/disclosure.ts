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

const g = (thread: string) => `https://mail.google.com/mail/u/0/#all/${thread}`;

export const parties: Party[] = [
  {
    id: "llandough",
    name: "Llandough Community Council",
    short: "Llandough",
    kind: "authority",
    remit: "Clerk Paul Egan. Local minutes, the green, and the 1982 deposit.",
    cells: {
      open: {
        status: "closed",
        title: "Chair: nothing more to add",
        date: "20 Sep 2026",
        correspondent: "Dr Mo Misra, Chair",
        ref: "Email to the Chair, then restated 21 Sep",
        url: g("1a0c1e36871ebfd1"),
        detail:
          "On 20 September 2026 the Chair wrote that clerk Paul Egan had already directed you to all the information the Council holds, and that “We have nothing more to add.” Your 21 September email answered that this is not a refusal notice. It asked only whether anything is held after the 2002 deposit to Glamorgan Archives: post-2002 minutes and files on Great House Farm (Tŷ Mawr) / Church View Close, village green VG 41, and the verge; any photographs; and what, if anything, came across from Penarth Town Council in 1982. You recorded an earlier clerk’s answer of 14 June 2026 that the minute books from 1982 were deposited with Glamorgan Archives in 2002.",
      },
      reply: {
        status: "suspicious",
        title: "Section 12 refusal by the clerk",
        date: "11 Oct 2026",
        correspondent: "Paul R. Egan, Clerk",
        ref: "FOIA s.12 — reply to the 21 Sep request",
        url: g("1a0c1e36871ebfd1"),
        detail:
          "Paul Egan (clerk@llandough-cc.co.uk) refused under section 12. He priced staff time at £25 an hour, so £450 is 18 hours, then estimated 224 sets of minutes from 2002–2016. The letter says both “about 20 minutes to read each set” and “about 10 minutes to assess each set”, and reaches “over 2240 minutes” (about 37 hours). The request had not asked for a reading of fourteen years of minutes. It asked the Council to say whether post-2002 records are held. He offered a narrower window, for example 2002–2006, and said the other matters would wait for the October meeting.",
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
        correspondent: "Paul Egan",
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
        correspondent: "Paul Egan",
        ref: "October meeting — attendance and papers",
        url: g("1a12af23f85ed2de"),
        detail:
          "The clerk said the “other matters” in the 21 September email would be considered at the October meeting, and that he would send the Council’s views afterwards. You asked to attend in the proper way and to see the papers. Putting the substantive questions onto a later meeting, rather than answering whether records are held, sits with the same officer whose refusal is under review.",
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
        correspondent: "To FoiUnit@valeofglamorgan.gov.uk",
        ref: "Formal chase of 00211557 and earlier requests",
        url: g("1a123ef64335cb7c"),
        detail:
          "Your 10 October email is a formal chase of three missing planning appendices, C, D and E. The file is open and incomplete: disclosures on one side, three appendices still not supplied on the other.",
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
        correspondent: "James Langridge-Thomas",
        ref: "Democratic Services refusal",
        url: g("1a1149d647cb33dc"),
        detail:
          "James Langridge-Thomas replied the next day that Scrutiny will be unable to consider it. His reasons: Task and Finish is for strategic, county-wide policy, not one historical site; Scrutiny should not review evidence of individual historical decisions, particularly planning; and because concerns are already with Welsh Government, Cadw, MSs and MPs, another layer of stakeholders would not be appropriate.",
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
        correspondent: "Owen, Information Rights",
        ref: "1264/26 — deadline 9 Nov 2026",
        url: g("1a12fa8ff526287b"),
        detail:
          "You asked for non-personal operational records on Great House Farm / Tŷ Mawr, Llandough, for November–December 1988, excluding personal data. On 12 October Owen confirmed FOI 1264/26 and a 20-working-day deadline of 9 November 2026. Until that date this request is dormant, not refused.",
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
        correspondent: "glamro@cardiff.gov.uk",
        ref: "Llandough-juxta-Penarth, not Cowbridge",
        url: g("1a1158080de15320"),
        detail:
          "You asked only for a location: parish, vestry and tithe records for Great House / Tŷ Mawr, Llandough-juxta-Penarth, and you said you were not booking a screen room. The clerk’s 14 June position, as you recorded it on 21 September, was that the community minute books from 1982 were deposited here in 2002. No reply from the archives is in the sample.",
      },
    },
  },
  {
    id: "cardiff-reg",
    name: "Cardiff Register Office",
    short: "Registrars",
    kind: "authority",
    remit: "Death registration of Mary Doreen Williams.",
    cells: {
      open: {
        status: "dormant",
        title: "Passed across from the Vale",
        date: "10 Oct 2026",
        correspondent: "Karen Denham, Registrars",
        ref: "Mary Doreen Williams",
        url: g("1a11a41ac938b1a5"),
        detail:
          "The Vale of Glamorgan Registration Service told you on 30 September 2026 they could not find a death record for Mary Doreen Williams in the Vale, and the search was passed to Cardiff. You wrote to Karen Denham on 10 October.",
      },
      reply: {
        status: "closed",
        title: "Cardiff does not hold the entry",
        date: "12 Oct 2026",
        correspondent: "Karen Denham",
        ref: "FreeBMD indexes searched",
        url: g("1a11a41ac938b1a5"),
        detail:
          "On 12 October Karen Denham wrote that Cardiff Register Office does not hold the registration of death for Mary Doreen Williams, and that the indexes searched included FreeBMD. You replied the same day: “Yes, please pass on.”",
      },
      chase: {
        status: "dormant",
        title: "Asked to pass it on",
        date: "12 Oct 2026",
        correspondent: "You to Karen Denham",
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
          "On 25 August the museum said searches had found records of other archaeological discoveries at Great House Farm and Church Farm, treated as not in scope. You asked for the recorded basis (item 7). On 7, 8 and 12 October they repeated that Amgueddfa Cymru does not hold a separate search log, file note or other document of that assessment. Staff, they say, decided those records were not the alleged discovery of a soldier, horse remains and armour. They say nothing remains withheld. That is their “no more” on the schedule itself.",
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
        correspondent: "To enquiry@library.wales",
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
        correspondent: "Adam, NMR enquiries",
        ref: "RC26-0375",
        url: g("1a11f562b7880f36"),
        detail:
          "Requests dated 8, 15, 17 and 20 September sit under RCAHMW reference RC26-0375.",
      },
      reply: {
        status: "closed",
        title: "They treat the September asks as finished",
        date: "6 Oct 2026",
        correspondent: "NMR enquiries",
        ref: "RC26-0375",
        url: g("1a11f562b7880f36"),
        detail:
          "Their further response of 6 October 2026 takes the position that the requests of 8, 15, 17 and 20 September are fully answered. That is a “no more” on those four asks.",
      },
      chase: {
        status: "dormant",
        title: "Scans ordered, not yet in",
        date: "10 Oct 2026",
        correspondent: "To nmr.wales@rcahmw.gov.uk",
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
    remit: "1988 listing file, ATISN 27021 and 27589.",
    cells: {
      open: {
        status: "dormant",
        title: "ATISN requests still live",
        date: "10 Oct 2026",
        correspondent: "Welsh Government FOI",
        ref: "ATISN 27021 and ATISN 27589",
        url: g("1a11ea981f52fcb9"),
        detail:
          "On 10 October you asked the Welsh Government FOI team for retention and destruction schedules for pre-1997 file series on agricultural tenancy, land and rural policy. You tied that to live requests ATISN 27021 and ATISN 27589 (Cadw listing material) and to the Wales Office file 26FOI 103 / IR/26/16.",
      },
      reply: {
        status: "closed",
        title: "1988 listing file recorded as destroyed",
        date: "Jul 2026",
        correspondent: "Cadw / Welsh Government",
        ref: "Disposal finding on the 1988 listing file",
        url: g("1a11eb8afe818123"),
        detail:
          "Your 10 October letter to the Complaints Manager and Chief Inspector refers to a finding that the 1988 listing file was disposed of. That is the “nothing further is held” position on the file itself. You have asked for the existing records that sit behind the finding, which is the chase, not a new concession that the file exists.",
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
        correspondent: "FOIRequests@nationalarchives.gov.uk",
        ref: "OS Glamorgan XLVII.6",
        url: g("1a1060d79ae529a6"),
        detail:
          "You made a Freedom of Information request that was a location request only: the Valuation Office Survey 1910 sheet for OS Glamorgan XLVII.6, covering Llandough / Great House Farm. You were not asking for a copy or a screen-room appointment. A separate WhatDoTheyKnow request, “Great House Farm, Llandough, Cardiff (BP vs Buckler 1987)”, was already late by 1 October.",
      },
      reply: {
        status: "evidence",
        title: "They named the Valuation Office map",
        date: "12 Oct 2026",
        correspondent: "FOI Requests, The National Archives",
        ref: "Discovery link for the 1910 sheet",
        url: g("1a1060d79ae529a6"),
        detail:
          "On 12 October The National Archives wrote that, on the information you gave, they believe they have identified the Valuation Office map covering the property, and they sent a Discovery link. That is evidence in from the location request.",
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
        title: "A run of enquiry numbers",
        date: "Sep–Oct 2026",
        correspondent: "HM Land Registry",
        ref: "N610CGV · WA231076 · WA240304",
        url: g("1a124b25060d556f"),
        detail:
          "Enquiry references in the mailbox include 260917-6718215 (application N610CGV, title WA231076), 260928-6762800, 260928-6762801, 260929-6766714 and 261007-6799563. One automated reply said an email address is no longer supported. Another mailbox is not monitored.",
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
        correspondent: "To cio-foi@mod.gov.uk",
        ref: "FOI2026/09019 clarification",
        url: g("1a11eb8cc384c312"),
        detail:
          "On 10 October you asked the FOI team to clarify the non-Special-Forces remainder and the existing retention and search records. No answer to that clarification is in the sample. WhatDoTheyKnow’s 10 October notification of a new response on the 1988 dispossession request is noted, but the response text is not in the Gmail notice.",
      },
      review: {
        status: "dormant",
        title: "Internal review of the SAR handling",
        date: "10 Oct 2026",
        correspondent: "To CIO-FOI-IR@mod.gov.uk",
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
        correspondent: "stephen.doughty.mp@parliament.uk",
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
        correspondent: "Paolo Guarino",
        ref: "reports.cotswoldarchaeology.co.uk",
        url: g("1a11eaa835381426"),
        detail:
          "On 12 October Paolo Guarino wrote that the report is online at reports.cotswoldarchaeology.co.uk, searchable by keyword. That is evidence in from a private holder. Cotswold Archaeology is not a public authority, so the inner FOI rings are not a legal path against them.",
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
        correspondent: "archives@linklaters.com",
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
          "clipsales@itv.com replied automatically that the inbox is only for licensing footage, and pointed personal research at viewers.requests. That address then sent a canned reply: the service is only for viewers wanting copies of programmes. Neither message searched an archive. For a research request, that is them saying there is nothing further this channel will do.",
      },
    },
  },
  {
    id: "family",
    name: "The family — testimony",
    short: "Family",
    kind: "family",
    remit:
      "Relatives of Mary Williams and William Buckler. Their own memory of 1987–1988 and after. Gathered slowly, with consent, at their pace.",
    cells: {
      open: {
        status: "evidence",
        title: "Testimony invited",
        date: "2026",
        correspondent: "Relatives (not named here)",
        ref: "Family account, not an official record",
        detail:
          "Relatives have been asked, privately and one at a time, what they remember of the farm, the eviction, the demolition and the years after. Nobody is named on this chart. What any relative says is labelled a family account until a record supports it, and is only published with that person’s agreement.",
      },
      reply: {
        status: "evidence",
        title: "Some accounts in, partly",
        date: "Sep–Oct 2026",
        correspondent: "Relatives (not named here)",
        ref: "Partial, not yet signed",
        detail:
          "Some testimony has come back, to some extent. It is not yet written down as signed statements, and it has not been tested against the records. Where it matches a record already held, that match is noted on the evidence pages, not here.",
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

export const sampledThrough = "12 October 2026";

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
