# -*- coding: utf-8 -*-
"""Single source of content for the 22 October 2026 meeting toolkit.

Edit the words here, then run:  python3 build.py
That regenerates index.html (the website), pack.html and meeting-pack.pdf
(the document for the Clerk), and meeting-script.txt (read-aloud text).

Evidence labels used throughout:
  rec  = on public record (court, heritage record, archive, newspaper, Hansard)
  fam  = the family's account or case
  open = being sought / not yet established
"""

MEETING = {
    "body": "Llandough Community Council",
    "date": "Thursday 22 October 2026",
    "time": "7.00pm",
    "place": "Council Chamber, rear of Llandough War Memorial Hall, and on Zoom",
    "clerk": "Paul R. Egan, Clerk to the Council",
    "clerk_email": "clerk@llandough-cc.co.uk",
    "updated": "14 October 2026",
}

MISSION = "Serving our community, preserving our identity"
COMMITMENTS = [
    "Be open and accessible in all our decision making",
    "Be accountable in all our council activities",
    "Be responsive to the needs of the community",
    "Encourage community participation",
]

HERO = {
    "title": "Preserving our identity.",
    "lede": ("That is the Council's own mission statement. On 22 October it meets Tŷ Mawr, "
             "the Great House of Llandough: home to one Welsh family for 320 years, "
             "demolished at four in the morning on 6 December 1988, and missing from the "
             "public record ever since."),
    "photo_caption": ("Tŷ Mawr, 29 July 1988. Cadw photograph, released to the family in May 2026. "
                      "The house was demolished 130 days later."),
}

BREATH = [
    ("320 years at home.", "Family account, 1667–1988"),
    ("Gone before breakfast.", "Demolished from about 4am, 6 December 1988"),
    ("38 years without a voice.", "No inquiry, no apology, no public record"),
]

# The asks: (headline, one line, draft resolution, why)
ASKS = [
    ("Put it on the record",
     "Receive the family's statement and this pack, and minute them.",
     "That the Council receives the statement and meeting pack of the Williams–Buckler family, "
     "records them in the minutes, and publishes them with the papers for this meeting.",
     "Nothing about Great House is on the Council's record. This is the first step and costs nothing."),
    ("Make it a standing item",
     "Name a councillor. Bring it back every meeting until it is resolved.",
     "That “Great House Farm / Tŷ Mawr” is placed on the agenda of each ordinary meeting until "
     "the Council resolves otherwise, and that Councillor ______ acts as the Council's liaison with the family.",
     "This is the first meeting, not the last. Detail belongs to later meetings, in public, with papers in advance."),
    ("Correct the Council's own history",
     "The village history page says 800 burials and nothing about Great House.",
     "That the Council's published village history is revised, with heritage advice and the family's input, "
     "to record Great House, the manorial courts held there, its demolition in 1988, "
     "and the 1,026 burials published in the excavation report.",
     "The page gives “over 800 burials” (the published report counts 1,026), dates the Roman villa to the 1990s "
     "(it was excavated in 1978–79), and does not mention Great House, the Williams family or the demolition."),
    ("Mark it on the ground",
     "A board or memorial near the green: monastery, the 1,026 dead, the manor, Marconi, Peerless Jim.",
     "That a working group is set up to scope an interpretation board or memorial near the green, covering "
     "St Dochdwy's monastery, the 1,026 early medieval burials, Great House and the manor, the 1897 wireless "
     "trials and Peerless Jim Driscoll, with wording checked against sources and agreed with the family; "
     "and to explore a Llandough companion to the Marconi artwork on the Cardiff Barrage.",
     "There is nothing on the ground that records any of it. The family has offered a free talk to the Council or residents."),
    ("Find the witnesses",
     "Invite people who remember the village from the 1950s to the 1990s to come forward.",
     "That the Council forwards the family's invitation to former members, former clerks and long-standing "
     "residents, leaving it to them whether to make contact; no personal details to be disclosed without consent.",
     "This is the request already listed as Item 10(a). Forwarding an invitation discloses nobody's data."),
    ("Open the Council's own records",
     "An independent review, separate answers, and a hold on the files.",
     "That the internal review of the 11 October refusal is conducted by a person other than the officer who made it; "
     "that the environmental-information request and the subject access request of 12 October are each answered "
     "under their own law and time limit; and that all Council records concerning Great House, Church View Close "
     "and village green VG41 are preserved.",
     "The refusal priced the request at 224 sets of minutes and gave figures that do not reconcile. "
     "Land and heritage records can fall under the Environmental Information Regulations, which have no automatic cost cap."),
    ("Speak up for disclosure",
     "Write to the bodies holding the records, and note the call for an inquiry.",
     "That the Clerk writes on the Council's behalf to Cadw, the Vale of Glamorgan Council, HM Land Registry, "
     "Amgueddfa Cymru and the National Library of Wales, copied to Stephen Doughty MP and the area's Members of the Senedd, "
     "supporting full and prompt disclosure of records to the family; and that the Council notes the family's call "
     "for an independent public inquiry.",
     "A letter from the community's own council carries weight no family letter can. It asks for openness, not a verdict."),
    ("Carry it into tonight's other business",
     "Items 12 and 14 are about identity and culture. Tŷ Mawr belongs in both.",
     "That Tŷ Mawr's heritage, including Peerless Jim Driscoll and the 1897 wireless trials, is considered in the "
     "Council's response to the Welsh Government call for evidence on culture and sport (Item 14, closing "
     "18 December 2026) and in the heritage and identity of the proposed Llandough and Cwrtyrala Community Council (Item 12).",
     "The agenda already asks the Council to think about Welsh culture, sport and local identity. Here is Llandough's strongest example."),
]

# Running order: (when, title, one line, detail list)
ORDER = [
    ("By Friday 16 October", "Send the pack to the Clerk",
     "Ask for a properly worded Item 10, circulation to members, and time to speak.",
     ["Email this PDF to clerk@llandough-cc.co.uk with the covering letter on page 1.",
      "Ask for a supplementary agenda replacing the Item 10 heading with the wording in the pack. "
      "The agenda must be published at least three clear days before the meeting, so ask for it to go out by Saturday 17 October.",
      "Ask a community councillor to give written notice of a motion in the same terms, so the Council can decide something on the night.",
      "Ask the Chair for up to ten minutes under Item 10, as well as the public session.",
      "Ask the Clerk to list the family's letters of 12 October under Item 16."]),
    ("Item 1", "Declarations of interest",
     "Listen. Members connected to the site or the parties should declare.",
     ["Anyone living on or next to Church View Close, or with links to the developer, landowner or the 1980s parties, "
      "should say so before the item is discussed."]),
    ("Item 4", "Public participation",
     "The three-minute statement. Scope, not detail. End with the three asks.",
     ["Use the statement in “At the microphone”.",
      "Ask the Chair, before you sit down, whether the family may speak again when Item 10 is reached."]),
    ("Item 5", "Councillor George Carroll",
     "The Vale ward member for Llandough. Ask him to take three things to the Vale.",
     ["The missing Appendices C, D and E from the Vale's FOI disclosure (request 00211557).",
      "The Vale Scrutiny Committee's reply that it was unable to consider the family's request.",
      "The history of village green VG41, registered 16 June 1970 beside the farm."]),
    ("Item 10", "Great House Farm / Tŷ Mawr",
     "The main event. Walk the eight asks. Push for a decision on the first, second and fifth.",
     ["If the Council cannot decide everything tonight, ask for a working group and a date.",
      "Ask that every action is minuted with a name and a deadline."]),
    ("Item 12", "Llandough and Cwrtyrala Community Council",
     "A new council needs a heritage. Ask that Tŷ Mawr is part of it.", []),
    ("Item 14", "Welsh Government: culture and sport",
     "Peerless Jim and Marconi make Llandough a case study. Offer to help draft.", []),
    ("Item 16", "Correspondence",
     "Check the family's 12 October letters are listed. No decisions can be taken here.", []),
    ("Within a week", "Follow up",
     "Ask for the draft minutes, the named liaison councillor, and the date the item returns.", []),
]

PILLARS = [
    ("Scope", "Bigger than a plaque.",
     "A sacred site, a manorial seat, a Welsh family, and a public record that left all three out.",
     ["St Dochdwy's monastery, one of the great early Christian centres of Wales, whose site has never been formally located.",
      "1,026 early medieval burials, the largest such population yet recovered in Wales, now in museum storage.",
      "Great House, where the manorial courts of Llandough and Leckwith sat.",
      "A family's 320 years, ended by demolition and recorded only as an eviction.",
      "Eighteen months of records requests to twenty organisations, including this Council."]),
    ("Politics", "Who writes the record?",
     "A family and a village, or closed files and corporate lawyers.",
     ["The family puts it plainly: force, stealth and licence on one side; peace, transparency and freedom on the other. "
      "A Welsh home and a Welsh Christian site were decided by distant institutions and a pension fund's property company, "
      "and the Welsh family was left without a voice.",
      "The ask of this Council is not partisan. It is the Council's own four commitments: open, accountable, responsive, participatory.",
      "Fraud, concealment and government involvement are not established. The family is seeking the records that would test them. "
      "Openness is how that question gets answered, whichever way it falls."]),
    ("Culture", "Llandough's story, not only ours.",
     "Saints, a manor, the first wireless message over open sea, and a world boxing champion.",
     ["The monastery and its dead belong to every Christian and every Welsh person, not to a housing estate.",
      "Marconi's 1897 trials at Lavernock made this coast part of world history. Family tradition puts Great House in that story.",
      "Peerless Jim Driscoll's first fight is recorded in a barn at Great House Farm.",
      "None of this is marked anywhere in Llandough."]),
]

# Tiles: (big, headline, one line, detail, label)
TILES = [
    ("Monastery", "Never formally found.",
     "St Dochdwy's monastery is attested from the 7th century. Its site has never been located.",
     "Heneb's record says the exact location of the monastic centre has not been established. The Council's own page says "
     "Llandough was “almost certainly” its site. The ground beside the church where Great House stood was demolished in 1988 "
     "before its fabric could be fully examined; medieval pottery had been found on the slope beside the house in 1962–63.",
     "rec"),
    ("1,026", "The dead are in storage.",
     "The largest early medieval burial population recovered in Wales, excavated in 1994.",
     "Excavated March–July 1994 by the Cotswold Archaeological Trust ahead of the houses. In 1990 the area had been marked "
     "“low potential”. The Home Office licence lapsed for part of the dig. On 28 July 1994 the developer, as landowner, gave "
     "the remains and finds to the National Museum of Wales. Nothing on the ground marks them.",
     "rec"),
    ("The manor", "The courts sat here.",
     "The manorial courts of Llandough and Leckwith were held at Great House.",
     "Recorded in the official Historic Environment Record (GGAT02038s), which also notes building details suggesting an older "
     "core, a 1974 survey limited by the ownership dispute, and demolition on 6 December 1988 amid considerable local controversy.",
     "rec"),
    ("1897", "Marconi.",
     "The first wireless message over open sea crossed from Lavernock to Flat Holm.",
     "The trials of May 1897 are documented by Amgueddfa Cymru. Family tradition records that Thomas Williams of Great House "
     "carted the equipment, and that the house lodged visitors connected with the work. That family part is still to be "
     "corroborated, which is a reason to research it, not to leave it out.",
     "fam"),
    ("Peerless Jim", "First fight, in the barn.",
     "Jim Driscoll, Cardiff's featherweight legend, is recorded as first fighting at Great House Farm.",
     "Published sources cite the National Monuments Record for Wales for Driscoll's first fight in a barn at Great House Farm, "
     "Llandough, and Stead and Williams, Wales and its Boxers (2008). The barn was demolished with the house.",
     "rec"),
    ("04:00", "Demolished in the dark.",
     "The morning after listing was refused, with Strasbourg still pending.",
     "On 5 December 1988 the court refused to continue the injunction pending the European Commission of Human Rights, and "
     "Cadw said the house was not of sufficient merit to list. Demolition began at about 4am the next day. An MP had asked the "
     "Lord Chancellor to review the case. The house was never fully recorded.",
     "rec"),
    ("Our page", "Says 800. Says nothing.",
     "The Council's village history omits Great House altogether.",
     "The Council's About Llandough page mentions the villa, “over 800 burials”, the church and the cross. It does not "
     "mention Great House, the manorial courts, the family or the demolition.",
     "rec"),
    ("18 months", "Closed doors.",
     "Twenty organisations asked. Files destroyed without record, deeds not on file, refusals on cost.",
     "See “The wall” below.",
     "rec"),
]

# Story they told vs the record: (they said, the record, label)
SWAPS = [
    ("Squatters.", "Born, married and died in the house for 320 years.", "fam"),
    ("An eviction.", "A demolition at 4am, the morning after the last protection fell.", "rec"),
    ("A farmer's feud.", "Against a landlord the Commons heard called “the most rapacious” in South Wales, by then owned by the BP pension fund.", "rec"),
    ("An old farmhouse.", "The house where the manorial courts sat.", "rec"),
    ("Nobody cared.", "About a thousand signed in 1974. The village protested in 1988.", "rec"),
    ("The courts settled it.", "They settled who could stay. No court ever ruled on who owned the house.", "fam"),
]

# The courts: the family's grounds (each anchored to a record)
COURT_POINTS = [
    "The courts decided possession. BP never asked a court to declare it owned the house, and the 1974 action in which Mary Williams pleaded ownership was adjourned and never relisted.",
    "The possession clock was started in 1955, from an order about the fields. The family's case is that the house was a separate parcel and theirs from 1928.",
    "Mary Williams's statement records the family papers being taken from the house in 1950–52. They were never produced in court.",
    "BP registered the farmhouse as a separate title in 1983, then merged it into the fields title in February 1987, while the appeal was pending.",
    "No deed conveying the house to Western Ground Rents or BP, earlier than a 1975 conveyance between two BP companies, has been produced.",
    "HM Land Registry's schedule of 43 first-registration documents does not include the 1969 conveyance on which the title rests.",
]
COURT_NOTE = ("The High Court (1986), Court of Appeal (1987), House of Lords (1988) and European Commission of Human Rights (1989) "
              "all ruled against the family. These are the family's grounds for saying the outcome was unfair and wrong. "
              "Testing them is for the courts, the Land Registry and regulators. This Council is not asked to decide them.")

# The wall: (body, rings opened (1..8), current status)
RINGS = ["Enquiry", "Reply", "Chase", "Review", "Complaint", "Regulator", "Democratic", "Tribunal"]
WALL = [
    ("Llandough Community Council", [1, 2, 3, 4, 5, 7], "Cost refusal; review, EIR and subject access requests pending; this meeting"),
    ("Cadw and Welsh Government", [1, 2, 3, 4, 5], "1988 listing file “quite likely” destroyed, no destruction record"),
    ("HM Land Registry", [1, 2, 3, 5, 6], "“No evidence of a mistake”; referred to the Independent Complaints Reviewer"),
    ("Amgueddfa Cymru", [1, 2, 3, 4], "“Not held”, while other Great House finds withheld as “not in scope”"),
    ("National Library of Wales", [1, 2, 3, 4], "Bute Estate series searched; one point outstanding"),
    ("Ministry of Defence", [1, 2, 3, 4], "Neither confirm nor deny; subject access found nothing in scope"),
    ("Vale of Glamorgan Council", [1, 2, 3], "Planning Appendices C, D and E still missing"),
    ("South Wales Police", [1, 2, 4], "Request 1264/26 live; review 1188/26 opened"),
    ("Wales Office", [1, 2, 4], "Internal review IR/26/16"),
    ("RCAHMW (Royal Commission)", [1, 2, 3], "Scans ordered, not yet received"),
    ("The National Archives", [1, 2, 3], "One request past its deadline"),
    ("Cardiff Register Office", [1, 2, 3], "Entry not held; asked to pass on"),
    ("Ministry of Justice", [1, 4], "Internal review acknowledged"),
    ("Vale of Glamorgan Scrutiny", [1, 2], "“Unable to consider”"),
    ("Counter Terrorism Security Office", [1, 2], "Several responses"),
    ("Stephen Doughty MP", [1, 2], "Automatic reply only"),
    ("Cotswold Archaeology", [1, 2], "Pointed to the published report"),
    ("ITV Archive", [1, 2], "Automated dead end"),
    ("Glamorgan Archives", [1], "Location enquiry"),
    ("Linklaters (BP's solicitors, 1982–88)", [1], "Preservation and access request, no reply"),
]
WALL_NOTE = ("From the family's own correspondence log, to 12 October 2026. A ring counts as opened when the family "
             "has taken that step with that body; it is not a finding about how any body behaved.")

COUNCIL_CASE = [
    ("21 September 2026", "Request to the Council for records of Great House, the green and the 1982 transfer."),
    ("11 October 2026", "Refused on cost: reading and assessing 224 sets of minutes, 2002–2016. "
                        "The letter gives 20 + 10 minutes a set (6,720 minutes) but totals “over 2,240 minutes”."),
    ("12 October 2026", "Internal review requested, plus a separate environmental-information request, a subject access "
                        "request and a request to preserve records. Review asked of the same Clerk."),
    ("9 November 2026", "Twenty working days: environmental-information reply due."),
    ("12 November 2026", "One month: subject access reply due."),
]

REGIMES = [
    ("FOI", "Freedom of Information Act 2000",
     "General recorded information. Twenty working days. A council may refuse if compliance would cost more than £450 "
     "(18 hours at £25), but must estimate reasonably and offer advice to narrow the request."),
    ("EIR", "Environmental Information Regulations 2004",
     "Information on land, development and the historic environment. Twenty working days. No automatic cost cap: refusal "
     "only if “manifestly unreasonable”, and then only if the public interest favours it."),
    ("SAR", "UK GDPR, Article 15",
     "Information about the person asking. One month, free. Covers what the Council holds about the living family members; "
     "it does not cover records about people who have died."),
]

STATEMENT_60 = (
    "Chair, councillors, thank you. My family, the Williams–Bucklers, lived at Great House Farm, Tŷ Mawr, beside "
    "St Dochdwy's Church, for 320 years until it was demolished at four in the morning on 6 December 1988. The courts "
    "decided who could live there; none ever decided who owned it. Under that ground lie the likely site of St Dochdwy's "
    "monastery and 1,026 early medieval burials. The manorial courts sat in that house. Peerless Jim Driscoll's first fight "
    "is recorded in its barn. Your own village history mentions none of it. For eighteen months we have asked twenty bodies, "
    "including this Council, for the records. Tonight we ask three things: put our statement on the record, make Tŷ Mawr a "
    "standing item with a named councillor, and write in support of full disclosure. Your mission is preserving our identity. "
    "Tŷ Mawr is part of it. Thank you."
)

STATEMENT = [
    "Chair, councillors, thank you.",
    "My grandmother was Mary Williams of Great House Farm, Tŷ Mawr, beside St Dochdwy's Church. Our family account is that we "
    "lived in that house for 320 consecutive years, from 1667 until it was demolished at about four in the morning on "
    "6 December 1988.",
    "I am grateful this is on the agenda. But Item 10 describes it as a plaque and a mailing list, and I want you to see the size "
    "of what sits under Church View Close.",
    "It is the likely ground of St Dochdwy's monastery, one of the great early Christian centres of Wales, whose site has never "
    "been formally located. It is where 1,026 people were buried in the early medieval period, the largest such population yet "
    "recovered in Wales; their remains are in museum storage. It is the house where, according to the official Historic "
    "Environment Record, the manorial courts of Llandough and Leckwith were held. Our family tradition ties it to Marconi's 1897 "
    "wireless trials at Lavernock, and published sources record Peerless Jim Driscoll's first fight in its barn.",
    "None of that is on the Council's own history page. Great House is not mentioned at all.",
    "In 1988 the story was told as the eviction of squatters. We were not squatters. The courts decided who could live in the "
    "house. No court has ever decided who owned it. The house came down the morning after Cadw declined to list it, while our "
    "application to the European Commission of Human Rights was still pending.",
    "For eighteen months my family has asked twenty organisations for the records. Cadw says its 1988 file was probably destroyed "
    "but holds no record of destroying it. The Land Registry's own schedule of 43 documents does not include the deed its title "
    "rests on. This Council refused our request on cost, with figures that do not add up. Freedom of information, environmental "
    "information and our own personal data are three separate rights, and each should be answered on its own terms.",
    "I am not asking this Council to try the case. I am asking you to do three things. Put our statement and pack on the public "
    "record. Make Great House Farm a standing item, with a named councillor. And write to the bodies holding the records, "
    "asking them to disclose them fully. The detail can follow, meeting by meeting, in the open.",
    "Your mission is “Serving our community, preserving our identity”. Tŷ Mawr is part of that identity. For thirty-eight years "
    "it has had no voice. Tonight, please give it one.",
    "Thank you.",
]

MIC_RULES = [
    ("Name the source.", "Say where a fact comes from: the court, the heritage record, the newspaper, the archive."),
    ("Say whose account it is.", "“Our family account is…” is accurate, and accuracy is hard to dismiss."),
    ("Ask for a decision and a date.", "Every ask ends with who does it and when it comes back."),
]

ITEM10_ADDENDUM = {
    "heading": ("10. Great House Farm / Tŷ Mawr, Llandough (demolished 6 December 1988): heritage, public record and "
                "community history. To receive a statement and meeting pack from the Williams–Buckler family and to consider:"),
    "items": [
        "a) receiving the family's statement and pack into the record of this meeting;",
        "b) placing Great House Farm / Tŷ Mawr on future agendas as a standing item and appointing a councillor as liaison;",
        "c) revising the Council's published village history to record Great House, its manorial role, the 1988 demolition and the 1,026 published burials;",
        "d) forwarding the family's invitation to former members, former clerks and long-standing residents of the 1950s–1990s (as previously listed);",
        "e) a working group to scope an interpretation board or memorial near the green (monastery, burials, manor, the 1897 wireless trials, Peerless Jim Driscoll), and the family's offer of a talk (as previously listed);",
        "f) arrangements for the internal review, environmental-information request and subject access request received on 12 October 2026, and preservation of related records;",
        "g) writing to Cadw, the Vale of Glamorgan Council, HM Land Registry, Amgueddfa Cymru and the National Library of Wales in support of disclosure to the family, and noting the family's call for an independent inquiry;",
        "h) reflecting Tŷ Mawr's heritage in the Council's work under Items 12 and 14.",
    ],
}

LETTER = {
    "to": "Mr Paul R. Egan, Clerk to Llandough Community Council",
    "by": "By email: clerk@llandough-cc.co.uk",
    "subject": "Council meeting, 22 October 2026 — Item 10: Great House Farm / Tŷ Mawr",
    "body": [
        "Dear Mr Egan,",
        "Thank you for your email, for listing our request as Item 10 and for the Zoom details. As published, Item 10 records two "
        "practical requests. It does not yet tell councillors or the public what the matter is. This pack sets it out, and we ask:",
    ],
    "requests": [
        "That a supplementary agenda is issued replacing the heading of Item 10 with the wording on page 2, within the notice "
        "period your standing orders require (three clear days, so by Saturday 17 October).",
        "That this pack is circulated to all members with the meeting papers and retained with the record of the meeting.",
        "That the Chair allows the family up to ten minutes when Item 10 is reached, in addition to the public session.",
        "That our letters of 12 October (internal review, environmental-information request, subject access request and "
        "preservation request) are listed under Item 16, and that the internal review is conducted by someone other than the "
        "officer who made the original decision.",
        "If the agenda cannot be amended in time, that a full item in the terms on page 2 is placed on the agenda for the next "
        "ordinary meeting, and that this is minuted on 22 October.",
    ],
    "close": [
        "We are not asking the Council to decide title, fraud, or whether any court judgment was right. We are asking it to put "
        "the matter properly on the public record and decide what it can do within its own powers.",
        "Yours sincerely,",
    ],
    "sign": "Hywel Buckler and Sion Buckler, grandsons of Mary Williams of Great House Farm",
}

LABELS = {
    "rec": ("On record", "Court, heritage record, archive, Hansard or contemporary newspaper"),
    "fam": ("Family account", "The family's account or legal case, being tested"),
    "open": ("Being sought", "Not yet established; records requested"),
}

SOURCES = [
    ("Agenda, Council meeting 22 October 2026 (issued 13 October 2026)", None),
    ("Heneb Historic Environment Record GGAT02038s, Great House, Llandough", "https://archwilio.org.uk/her/chi3/report/page.php?watprn=GGAT02038s"),
    ("Holbrook and Thomas, The Early Medieval Monastic Cemetery at Llandough, Medieval Archaeology 49 (2005)", "https://www.tandfonline.com/doi/abs/10.1179/007660905x54044"),
    ("Archaeology Data Service: Llandough cemetery archive", "https://archaeologydataservice.ac.uk/archives/view/llandough_cadw_2004"),
    ("Coflein NPRN 400051, Roman villa site, Llandough", "https://coflein.gov.uk/en/site/400051/"),
    ("Llandough Community Council, About Llandough", "https://www.llandough-cc.co.uk/About_Us_20117.aspx"),
    ("Amgueddfa Cymru, GPO trials of Marconi in 1897", "https://museum.wales/collections/online/object/5f7f51a9-7b6b-3956-84c9-31b5f96214aa/GPO-trials-of-Marconi-in-1897-booklet/"),
    ("Jim Driscoll (citing the National Monuments Record for Wales)", "https://en.wikipedia.org/wiki/Jim_Driscoll"),
    ("Stead and Williams (eds), Wales and its Boxers: The Fighting Tradition (University of Wales Press, 2008)", "https://books.google.com/books?id=emMNAQAAMAAJ"),
    ("BP Properties Ltd v Buckler [1987] EWCA Civ 2", "https://vlex.co.uk/vid/b-p-properties-ltd-793844841"),
    ("Hansard, House of Commons, 22 May 1980 (Ted Rowlands MP on Western Ground Rents)", None),
    ("Buckler v United Kingdom, European Commission of Human Rights, inadmissible 14 April 1989", None),
    ("ICO: requests spanning FOI, EIR and data protection", "https://ico.org.uk/for-organisations/foi/freedom-of-information-and-environmental-information-regulations/calculating-costs-where-a-request-spans-different-access-regimes/"),
    ("Welsh Government: A vision for culture and sport in Wales, call for evidence", "https://www.gov.wales/vision-culture-and-sport-wales-call-evidence"),
    ("Vale of Glamorgan Council: Cllr George Carroll, Llandough ward", "https://www.valeofglamorgan.gov.uk/en/our_council/Council-Structure/councillors/Carroll-George.aspx"),
    ("The full story: bpvsbuckler.bucklerfamily.estate", "https://bpvsbuckler.bucklerfamily.estate/"),
    ("Records-access tracker: dartboard.bucklerfamily.estate", "https://dartboard.bucklerfamily.estate/"),
    ("The Council's FOI replies compared: clerk.bucklerfamily.estate", "https://clerk.bucklerfamily.estate/"),
    ("Great House Farm Wiki (archived 10 October 2026)", "https://web.archive.org/web/20261010064556/https://greathousefarmwiki.wordpress.com/"),
]
