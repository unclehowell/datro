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
    "lede": ("That is the Council's own mission statement. On 22 October it considers Tŷ Mawr, "
             "the Great House of Llandough: a home our family account traces back to 1667, "
             "demolished at about 4am on 6 December 1988. Its wider heritage and the family's "
             "unresolved title questions are still largely absent from the Council's published story."),
    "photo_caption": ("Tŷ Mawr, 29 July 1988. Cadw photograph, released to the family in May 2026. "
                      "The house was demolished 130 days later."),
}

BREATH = [
    ("320 years at home.", "Family account, 1667–1988"),
    ("Gone before breakfast.", "Demolished from about 4am, 6 December 1988"),
    ("38 years out of the story.", "Great House remains absent from the Council's published village history"),
]

# The asks: (headline, one line, draft resolution, why)
ASKS = [
    ("Put it on the record",
     "Receive the family's statement and this pack, and minute them.",
     "That the Council receives the statement and meeting pack of the Williams–Buckler family, "
     "records them in the minutes, and publishes them with the papers for this meeting.",
     "The Council's published village-history page omits Great House. Receiving this statement would place the family's account in the record of this meeting."),
    ("Make it a standing item",
     "Name a councillor. Bring it back every meeting until it is resolved.",
     "That “Great House Farm / Tŷ Mawr” is placed on the agenda of each ordinary meeting until "
     "the Council resolves otherwise, and that Councillor ______ acts as the Council's liaison with the family.",
     "This is the first meeting, not the last. Detail belongs to later meetings, in public, with papers in advance."),
    ("Correct the Council's own history",
     "The village history page says 800 burials and nothing about Great House.",
     "That the Council's published village history is revised, with heritage advice and the family's input, "
     "to record Great House, the manorial courts held there, its demolition in 1988, "
     "and the 1,026 inhumation burials reported in the published excavation study.",
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
     "Amgueddfa Cymru and the National Library of Wales, and to the Ministry of Justice about its outstanding reply to "
     "Stephen Doughty MP, copied to Mr Doughty and the area's Members of the Senedd, supporting full and prompt disclosure "
     "to the family and the preservation of all records meanwhile; and that the Council notes the family's call for an "
     "independent public inquiry.",
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
     "A historic farmhouse, a recorded manorial role, a nearby early-medieval cemetery, and an unresolved title dispute.",
     ["Heneb records that the manorial courts of Llandough and Leckwith were held at Great House.",
      "A published study reports 1,026 inhumation burials at Llandough; the precise location of St Dochdwy's monastery remains unestablished.",
      "The family account traces its occupation of the house to 1667; the house was demolished on 6 December 1988.",
      "The family's primary title case distinguishes the full Parcel A from the eastern Parcel B; legal extent still needs testing against original deeds, plans and register files.",
      "More than twenty bodies have been asked for records since November 2025."]),
    ("Politics", "Who keeps the public record?",
     "Preserve records, correct local-history omissions, and enable scrutiny without asking councillors to decide title.",
     ["The family disputes the legal and historical account used in the possession litigation. Its current work is testing the title documents and their scope.",
      "The Council need not find for either side to preserve records, record the family account accurately, correct local-history omissions and facilitate scrutiny.",
      "Fraud, deliberate concealment and improper government involvement are not established; the family is seeking records to test those possibilities.",
      "The Council's own commitments are openness, accountability, responsiveness, and community participation."]),
    ("Culture", "Llandough's story, not only ours.",
     "An early-Christian centre, a manor, the 1897 wireless trials on this coast, and a Welsh boxing champion.",
     ["Heneb says the exact location of St Dochdwy's monastic centre has not been established; the farmhouse site should not be described as a proven monastery footprint.",
      "Amgueddfa Cymru documents Marconi's 1897 wireless trials at Lavernock. The family's connection between Great House and the work remains family tradition awaiting corroboration.",
      "Published sources associate Peerless Jim Driscoll's first fight with the Great House Farm barn.",
      "These cultural and archaeological subjects can be interpreted with clear source labels without pre-judging the private title dispute."]),
]

# Tiles: (big, headline, one line, detail, label)
TILES = [
    ("Monastery", "The monastery's exact site is unlocated.",
     "Llandough was an important early-Christian centre; Heneb says the monastery's exact location has not been established.",
     "The Council's own page says Llandough was “almost certainly” its site. Heneb does not locate it precisely. Medieval pottery was found on the slope beside the house in 1962–63. These facts support interpretation and further research, not a claim that the monastery stood beneath Tŷ Mawr.",
     "rec"),
    ("1,026", "A cemetery, not just a number.",
     "A published excavation study reports 1,026 inhumation burials at Llandough.",
     "The Cotswold Archaeological Trust excavated the cemetery in 1994. The published count is attributed to the study; the cemetery record and the monastery's unlocated footprint remain distinct questions. Nothing on the ground currently explains this history to visitors.",
     "rec"),
    ("The manor", "The courts sat here.",
     "The manorial courts of Llandough and Leckwith were held at Great House.",
     "Recorded in the official Historic Environment Record (GGAT02038s), which also notes building details suggesting an older core, a 1974 survey limited by the ownership dispute, and demolition on 6 December 1988 amid local controversy.",
     "rec"),
    ("1897", "Marconi.",
     "The first wireless message over open sea crossed from Lavernock to Flat Holm.",
     "The trials of May 1897 are documented by Amgueddfa Cymru. Family tradition records that Thomas Williams of Great House carted the equipment, and that the house lodged visitors connected with the work. That family part is still to be corroborated, which is a reason to research it, not to leave it out.",
     "fam"),
    ("Peerless Jim", "First fight, in the barn.",
     "Jim Driscoll, Cardiff's featherweight legend, is recorded as first fighting at Great House Farm.",
     "Published sources cite the National Monuments Record for Wales for Driscoll's first fight in a barn at Great House Farm, Llandough, and Stead and Williams, Wales and its Boxers (2008). The barn was demolished with the house.",
     "rec"),
    ("04:00", "Demolished in the dark.",
     "The morning after listing was refused, with Strasbourg still pending.",
     "On 5 December 1988 the court refused to continue the injunction pending the European Commission of Human Rights, and Cadw said the house was not of sufficient merit to list. Demolition began at about 4am the next day. An MP had asked the Lord Chancellor to review the case. The house was never fully recorded.",
     "rec"),
    ("Our page", "Says 800. Says nothing.",
     "The Council's village history omits Great House altogether.",
     "The Council's About Llandough page mentions the villa, “over 800 burials”, the church and the cross, but not Great House, the manorial courts, the family or the demolition. The Roman villa was excavated in 1978–80 south of the church; it is a separate site and must not be conflated with Great House Farm.",
     "rec"),
    ("18 months", "Open questions, not a proven cover-up.",
     "More than twenty organisations asked; some records are missing or unproduced, others have been disclosed.",
     "The Wiki tracks requests, replies, reviews and missing records. A missing record can matter; it does not by itself prove concealment or wrongdoing. The immediate request to this Council is preservation, clear records of decisions, and support for lawful disclosure.",
     "open"),
]

# ---- From the Great House Farm Wiki (registers as at 10-12 October 2026) ----
WIKI = "https://greathousefarmwiki.wordpress.com"
COUNTS = [
    ("86", "open lines of enquiry", "Anomalies Register: 71 issues plus 15 planning anomalies"),
    ("54", "records missing or withheld", "Missing Records Register, M-001 to M-054"),
    ("20+", "bodies asked since November 2025", "Records Access Chronology"),
]

THRESHOLD = ("Research has only started. The family does not claim that fraud, deliberate concealment or improper government "
              "involvement has been established or that the legal threshold to reopen the case has been met. Some records "
              "have been disclosed; others are missing, reported destroyed, not yet produced or still under review. The "
              "public record establishes important facts but leaves specific title and procedural questions unresolved.")

# Already on the record: (headline, one line, detail, label, wiki ref)
KNOWN = [
    ("The 1939 plan depicts Parcel B only.",
     "The WGR–John Williams agreement/plan now held by the family shows the eastern fields, Parcel B, only.",
     "The document is a key comparison point when testing later “whole farm” descriptions. It supports keeping parcel geometry separate in the working analysis but does not, on its own, prove the legal title to Parcel A or control every later deed.",
     "rec", "1939 revised tenancy; The Two Parcels"),
    ("A 1924 agreement is identified, but not interpreted.",
     "HMLR's 2026 disclosure points to an agreement dated 15 May 1924 on the WA231076 file.",
     "The text and legal effect have not yet been verified. It may be important to reconstructing the title chain; do not treat the catalogue reference as confirmation of the family title case until the instrument is read.",
     "open", "Land Registry Titles; A-008"),
    ("The 1969 conveyance is absent from the disclosed schedule.",
     "HMLR's 43-item schedule does not list the instrument recited as the root of BP's title.",
     "The schedule disclosed on 30 July 2026 lists 43 documents on the 1982–83 first-registration files. The 31 December 1969 conveyance and a 1971 abstract are not among them. The Wiki has not verified the original 1969 text. This is an unresolved documentary gap; it does not by itself prove a title mistake, an invalid title or deliberate concealment.",
     "open", "Missing Records M-007, M-035–M-041"),
    ("Two titles appear in the register chronology.",
     "WA240304 (farmhouse and garden) was amalgamated into WA231076 on 2 February 1987.",
     "The application for WA240304 is dated 23 February 1983. The amalgamation application appears in the chronology on 2 February 1987, before the Court of Appeal hearing in July 1987. Its effect cannot be inferred from dates alone: the original application, title plans, notices and correspondence are needed to establish what extent was claimed and how the Registry processed it.",
     "rec", "Anomalies A-025, A-026; 1987 HMLR Amalgamation"),
    ("Registered while Mary Williams was living at the house.",
     "The family's account is that notice of registration reached them only after Mary's death; the original service record is still being sought.",
     "Linklaters & Paines applied to register BP on 30 November 1982. On 23 February 1983 BP's solicitors applied for the farmhouse title, certifying they knew of no question or doubt affecting it. Mary had asserted ownership in 1974. The original notice and service record are needed to establish what enquiries were made, to whom notice was sent, and when it was received.",
     "fam", "Anomalies A-011, A-012; M-038"),
    ("No 1988 assessment file has been produced.",
     "Two photographs survive; no assessment notes or record explaining the file's disposition has been produced.",
     "Cadw photographed the house on 29 July 1988 and coded it “YYY”, which it has explained in two different ways. It refused to list on 5 December 1988. Cadw described the missing file as “quite likely”, then “most likely”, destroyed, but no destruction record has been produced. The Wales Office searched its digital records and said paper files “would have been” transferred.",
     "rec", "Anomalies A-037–A-041; M-018–M-020, M-052"),
    ("The planning record has missing appendices.",
     "The officer's report says Appendices B–E included relevant comments and representations; those appendices have not been found in the disclosed file.",
     "The report says further GGAT comments, two public representations and BP's agents' response were attached. The family is seeking the missing documents through the Vale's disclosure and review processes.",
     "rec", "Anomalies A-048, A-049; PL-003–PL-005"),
    ("Warned in 1982; burials found in 1994.",
     "The assessment history and later cemetery excavation raise a public-heritage question.",
     "In October 1982 GGAT sought investigation before development. Its 1990 assessment zoned some eastern ground low potential; the 1994 excavation subsequently found burials there. GGAT disclosed its dual role; the issue is the assessment and independence, not an inference of secrecy.",
     "rec", "Anomalies A-042–A-047; PL-008"),
    ("The house was only partly recorded.",
     "RCAHMW records lost correspondence and a plan addition six days after demolition.",
     "RCAHMW records correspondence with Mrs Buckler as lost since 1986–87, holds no record of being told of the demolition, and added to its plan on 12 December 1988.",
     "rec", "Anomalies A-035, A-036; M-021"),
    ("House of Lords judicial papers identified in September 2026.",
     "The National Archives identified bundle YHL/PO/JO/10/11/2536 on 23 September; it has not yet been produced.",
     "The relevant Main Papers series was added to the Discovery catalogue in May 2026. After earlier keyword searches failed to locate the material, the National Archives identified the bundle on 23 September. The next step is to obtain and analyse the bundle rather than infer what it contains from its catalogue reference. The Wiki records the Strasbourg case file as destroyed in 2000.",
     "open", "Anomalies A-006, A-007; M-005, M-051"),
    ("Contemporary reports describe two confrontations in 1988.",
     "Press accounts report a large bailiff/police presence in April and a later removal before the demolition.",
     "The Wiki keeps newspaper image, transcript, provenance and interpretation on individual evidence pages. Reports establish what was published; details of police and bailiff conduct should be attributed to the particular report rather than treated as judicial findings.",
     "rec", "GHF-E090-N07; 1988: Possession and Demolition"),
    ("The “synthetic Parcel A” is a working hypothesis.",
     "It tests whether registration and later amalgamation made the disputed farmhouse parcel appear to follow the eastern-fields chain.",
     "The Wiki uses this label for an analytical reconstruction based on the 1982–83 registration chronology, the 1987 amalgamation and gaps in the disclosed schedule. It is not an established finding that the register was fraudulent or wrong. The original applications, plans, deeds and notices must be examined before conclusions are drawn.",
     "open", "Master Scrutiny Issue Register; Land Registry Titles"),
]

# Still being withheld: (body, position, label)
WITHHELD = [
    ("Ministry of Justice", "The family records that a reply to Stephen Doughty MP remains outstanding; the probate request is on hold.", "rec"),
    ("Ministry of Defence", "A separate request received a neither-confirm-nor-deny response under FOIA s.23(5). That response alone does not establish a link to the land dispute.", "rec"),
    ("This Council", "The 11 October section 12 refusal is under internal review; the separate EIR and subject access requests were sent on 12 October.", "rec"),
    ("HM Land Registry", "The disclosed 43-item schedule does not list the 1969 conveyance or 1971 abstract; preservation and access to the full first-registration files remain live issues.", "rec"),
    ("Cadw", "Cadw says the 1988 assessment file was likely destroyed; no destruction record has been produced.", "rec"),
    ("Vale of Glamorgan", "Planning Appendices B–E have not been produced; an internal review remains outstanding.", "rec"),
    ("Amgueddfa Cymru", "Two earlier “not held” refusals were upheld on review. A response to FOI 2026-036 on 5 October disclosed Church Farm records (accession 63.24). The Wiki treats “Llandough Church Farm” as source-specific wording, not an established synonym for Great House Farm.", "open"),
    ("The National Archives", "The House of Lords bundle YHL/PO/JO/10/11/2536 was identified on 23 September; it still needs to be obtained and examined.", "open"),
]

WITHHELD_NOTE = ("No complaint has yet gone to the Information Commissioner or the Public Services Ombudsman for Wales. "
                 "Those are the next steps if disclosure does not come.")

# Risks if nothing is done: (headline, one line)
RISKS = [
    ("Records keep disappearing.",
     "Preservation of the Land Registry files has not been confirmed. Every year without a hold is another chance of loss."),
    ("Witnesses are dying.",
     "Mary died in 1983, William in 1992. People who remember the 1950s to the 1980s will not be here for long."),
    ("The dead stay unmarked.",
     "1,026 people from St Dochdwy's monastic cemetery, with nothing on the ground to say so."),
    ("The wrong story becomes the official one.",
     "The heritage record classes the site as “Post Medieval – Farm”. The Council's own history omits it."),
    ("The green has a history too.",
     "The family's case is that village green VG41 was part of their farm until 1955. The Council's records on it are among those requested."),
]

SWAPS = [
    ("Squatters.", "The family's account is that the Williams–Bucklers were a long-established household asserting a separate title.", "fam"),
    ("An eviction.", "A possession enforcement followed by demolition at about 4am on 6 December 1988.", "rec"),
    ("A farmer's feud.", "A long-running land and possession dispute involving a property company owned by the BP pension fund.", "rec"),
    ("An old farmhouse.", "A building whose manorial role is recorded in the official Historic Environment Record.", "rec"),
    ("Nobody cared.", "Contemporary reports recorded petitions and protests; the extent of public support should be tied to the particular source.", "rec"),
    ("The courts settled it.", "The possession litigation went against the family; the present title research tests parcel descriptions and instruments without asking the Council to re-decide the case.", "fam"),
]

# The courts: the family's grounds (each anchored to a record)
COURT_POINTS = [
    "The High Court (1986) and Court of Appeal (1987) decided BP's possession claim and addressed limitation and the effect of the 1974 licence letters. The exact scope of the issues pleaded and decided should be checked against the judgments and pleadings; do not state categorically that every ownership question was or was not decided.",
    "The family's primary title case is that the 1877 arrangement took effect in 1928 and passed the full Parcel A to the Williams family: farmhouse/buildings, barn, stable and west-side yard, garden, northern woodland and the ground later registered as village green VG41. Parcel B is the separate eastern agricultural fields. This is the family's case, not a judicial finding.",
    "The 1939 WGR–John Williams agreement/plan now held by the family depicts Parcel B only. The Wiki uses it as a key title-chain comparison; it does not by itself determine the legal title to Parcel A or the effect of every later instrument.",
    "The Wiki records the first known “whole farm” wording in the 1916 tenancy and further use in later instruments. That wording is relevant counter-evidence; the family argues it does not by itself resolve the extent of each parcel. The original 1877 instrument, 1924 record and later filed plans still need to be read together.",
    "A 15 May 1924 agreement is identified in HMLR's WA231076 file, but its text and legal effect have not yet been verified. It is a material new lead, not proof of the family's title until read and interpreted.",
    "The HMLR schedule disclosed in 2026 lists 43 first-registration documents but does not list the 31 December 1969 conveyance recited as root of BP's title, or a 1971 abstract. The gap needs explaining; its absence from this schedule does not alone prove title invalidity or concealment.",
    "HMLR's chronology shows a separate farmhouse/garden title application (WA240304) dated 23 February 1983 and amalgamation into WA231076 on 2 February 1987, before the Court of Appeal hearing in July. The original application, plans, notices and correspondence are needed to test extent, service and effect.",
    "Mary Williams's c.1974 statement and the family's account say title papers were reported missing in 1950–52; the appeal judgment says certain documents were not produced. Non-production does not establish who removed documents or why.",
    "The Wiki labels the later registration and merger sequence a working “synthetic Parcel A” hypothesis. It is an analytical model to test against original applications, deeds, plans and notices—not an established finding that the register was fraudulent or wrong.",
]
COURT_NOTE = ("The High Court gave judgment in 1986 and the Court of Appeal ruled against the family on 31 July 1987. The House of Lords refused leave to appeal on 3 March 1988; that was a refusal of leave, not a full merits judgment. The European Commission of Human Rights declared the application inadmissible on 14 April 1989. Those outcomes are important legal context. Any reopening or register-alteration route faces demanding legal tests and requires specialist advice. This Council is not asked to decide title, declare wrongdoing or overturn a judgment.")

# The wall: (body, rings opened (1..8), current status)
RINGS = ["Enquiry", "Reply", "Chase", "Review", "Complaint", "Regulator", "Democratic", "Tribunal"]
WALL = [
    ("Llandough Community Council", [1, 2, 3, 4, 5, 7], "Cost refusal; review, EIR and subject access requests pending; this meeting"),
    ("Cadw and Welsh Government", [1, 2, 3, 4, 5], "1988 listing file “quite likely” destroyed, no destruction record"),
    ("HM Land Registry", [1, 2, 3, 5, 6], "“No evidence of a mistake”; referred to the Independent Complaints Reviewer"),
    ("Amgueddfa Cymru", [1, 2, 3, 4], "FOI 2026-036 answered 5 October with Church Farm records (accession 63.24); source identity and relevance require checking"),
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
    "Chair, councillors, thank you. Our family account is that the Williams–Bucklers lived at Great House Farm / Tŷ Mawr "
    "from 1667 until demolition at about 4am on 6 December 1988. The Court of Appeal ruled against us in the possession "
    "litigation; I am not asking this Council to overturn it. Our title research tests whether the full Parcel A—house, "
    "buildings, barn, yard, garden, northern woodland and ground later registered as VG41—was distinct from the eastern "
    "fields, Parcel B. The Wiki records a 1939 plan depicting Parcel B only, a 1924 agreement identified in HMLR's file but "
    "not yet interpreted, and a 1969 conveyance absent from the 43-item schedule disclosed in 2026. Those gaps do not prove "
    "fraud or a title mistake; they justify preservation, disclosure and scrutiny. Great House's manorial history, Llandough's "
    "published record of 1,026 inhumation burials, and local heritage deserve a place in the village story. Please record our "
    "statement, appoint a councillor liaison, and support preservation and disclosure of relevant records. Thank you."
)


STATEMENT = [
    "Chair, councillors, thank you.",
    "My grandmother was Mary Williams of Great House Farm, Tŷ Mawr, beside St Dochdwy's Church. Our family account is that we lived in the house from 1667 until it was demolished at about four in the morning on 6 December 1988.",
    "Thank you for placing the matter on the agenda. Item 10 presently describes a plaque and a mailing list. I want to explain why the subject is wider, and what we are asking the Council to do.",
    "Heneb's Historic Environment Record says the manorial courts of Llandough and Leckwith were held at Great House. The precise location of St Dochdwy's monastery has not been established; a published study reports 1,026 inhumation burials at Llandough. Amgueddfa Cymru documents Marconi's 1897 wireless trials at Lavernock. Our family's connection between Great House and that work remains family tradition awaiting corroboration. Published sources associate Peerless Jim Driscoll's first fight with the farm barn.",
    "The Council's published village history does not mention Great House. The history should record the farmhouse, manorial role and demolition, while distinguishing the unlocated monastery from the documented cemetery and the nearby Roman villa, which is a separate archaeological site.",
    "The High Court and Court of Appeal ruled against the family in the possession litigation. The House of Lords refused leave to appeal in March 1988; the European Commission of Human Rights declared the Strasbourg application inadmissible in April 1989. Those outcomes matter, and we do not ask this Council to overturn them. We ask for a careful, source-led account of the history and for help preserving and obtaining records that may test the family's separate title case.",
    "Our primary title case is that the 1877 arrangement took effect in 1928 and transferred the full Parcel A to the Williams family, separate from eastern Parcel B. Parcel A, as defined in our case, includes the farmhouse and associated buildings, barn, stable and western yard, garden, northern woodland, and the ground later registered as village green VG41. This is our claim, not a judicial finding.",
    "The documentary picture has moved. The 1939 WGR–John Williams agreement/plan now in hand depicts Parcel B only. HM Land Registry's 2026 disclosure identifies a 15 May 1924 agreement in the WA231076 file, but its contents and legal effect remain unverified. The 43-item first-registration schedule does not list the 31 December 1969 conveyance recited as the root of BP's title. The National Archives identified a House of Lords judicial bundle on 23 September 2026, which has not yet been produced. These are leads and gaps, not proof by themselves that a title was wrong or anyone concealed evidence.",
    "The title chronology also records a separate farmhouse/garden application for WA240304 in February 1983 and its amalgamation into WA231076 on 2 February 1987, before the Court of Appeal hearing that July. The original application, title plans, service notices and correspondence are needed to assess the claimed extent and legal effect.",
    "More than twenty organisations have been asked for records since November 2025. Some have disclosed material; others have reported records missing, likely destroyed, not held or still outstanding. A missing record is not proof of concealment. We ask the Council to keep its own records, decisions and correspondence safe, respond under the correct access regime, and support lawful disclosure from the relevant bodies.",
    "On 5 December 1988 Cadw refused to spot-list the house and the court refused to continue the injunction; demolition began at about 4am on 6 December while the Strasbourg application was pending. The Local Plan said the buildings should be retained, and the house was never fully recorded.",
    "I ask for three practical outcomes: put this statement and pack on the public record; make Great House Farm / Tŷ Mawr a standing item with a named councillor liaison; and write to the bodies holding the relevant records in support of preservation and lawful disclosure. Scope the heritage interpretation board with heritage advice and clear evidence labels. The Council need not decide title or blame to do these things.",
    "Your mission is “Serving our community, preserving our identity”. Tŷ Mawr is part of Llandough's story. Please help it be recorded accurately, with the evidence and its limits in public."
]


MIC_RULES = [
    ("Name the source.", "Say where a fact comes from: the court, the heritage record, the newspaper, the archive."),
    ("Say whose account it is.", "“Our family account is…” is accurate, and accuracy is hard to dismiss."),
    ("Ask for a decision and a date.", "Every ask ends with who does it and when it comes back."),
]

ITEM10_ADDENDUM = {
    "heading": ("10. Great House Farm / Tŷ Mawr, Llandough (demolished 6 December 1988): heritage, public record, "
                "community history, and the issues, risks and concerns raised by the family's research and records requests. "
                "To receive a statement and meeting pack from the Williams–Buckler family and to consider:"),
    "items": [
        "a) receiving the family's statement and pack into the record of this meeting;",
        "b) placing Great House Farm / Tŷ Mawr on future agendas as a standing item and appointing a councillor as liaison;",
        "c) revising the Council's published village history to record Great House, its manorial role, the 1988 demolition and the 1,026 published burials;",
        "d) forwarding the family's invitation to former members, former clerks and long-standing residents of the 1950s–1990s (as previously listed);",
        "e) a working group to scope an interpretation board or memorial near the green (monastery, burials, manor, the 1897 wireless trials, Peerless Jim Driscoll), and the family's offer of a talk (as previously listed);",
        "f) arrangements for the internal review, environmental-information request and subject access request received on 12 October 2026, and preservation of related records;",
        "g) writing to Cadw, the Vale of Glamorgan Council, HM Land Registry, Amgueddfa Cymru, the National Library of Wales and the Ministry of Justice in support of disclosure to the family and preservation of records, and noting the family's call for an independent inquiry;",
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
    ("Great House Farm Wiki — public documentary archive", "https://greathousefarmwiki.wordpress.com/"),
    ("Wiki: The Two Parcels — full Parcel A / separate eastern Parcel B", "https://greathousefarmwiki.wordpress.com/the-two-parcels/"),
    ("Wiki: 1939 revised tenancy agreement and plan", "https://greathousefarmwiki.wordpress.com/1939-revised-tenancy/"),
    ("Wiki: BP v Buckler — scope, decided and undecided", "https://greathousefarmwiki.wordpress.com/scrutiny-and-accountability/court-judicial-issues/bp-v-buckler-scope-decided-undecided/"),
    ("Wiki: 1982–83 registration and opportunity to object", "https://greathousefarmwiki.wordpress.com/scrutiny-and-accountability/procedural-fairness-notice/1982-83-registration-opportunity-to-object/"),
    ("Wiki: 1987 HMLR amalgamation during appeal", "https://greathousefarmwiki.wordpress.com/scrutiny-and-accountability/procedural-fairness-notice/1987-hmlr-amalgamation-during-appeal/"),
    ("Wiki: 1877 Bute–Thomas agreement — original not yet obtained", "https://greathousefarmwiki.wordpress.com/evidence-library/ghf-e115-1877-bute-thomas-agreement/"),
    ("Wiki: Land Registry titles and newly identified 1924 agreement", "https://greathousefarmwiki.wordpress.com/land-registry-titles/"),
    ("Wiki: Anomalies Register (lines of enquiry)", "https://greathousefarmwiki.wordpress.com/anomalies-register/"),
    ("Wiki: Missing Records Register", "https://greathousefarmwiki.wordpress.com/missing-records-register/"),
    ("Wiki: Master Scrutiny Issue Register", "https://greathousefarmwiki.wordpress.com/scrutiny-and-accountability/master-scrutiny-issue-register/"),
    ("Wiki: Records Access Chronology", "https://greathousefarmwiki.wordpress.com/records-access-chronology/"),
    ("Wiki: Anticipated Objections and the Family's Answers", "https://greathousefarmwiki.wordpress.com/constructive-criticism-counterarguments/"),
    ("Wiki: 1988, Possession and Demolition (press transcripts)", "https://greathousefarmwiki.wordpress.com/demolition-1988/"),
    ("Great House Farm Wiki (archived 10 October 2026)", "https://web.archive.org/web/20261010064556/https://greathousefarmwiki.wordpress.com/"),
]
