// Interpretation layer for research.bucklerfamily.estate evidence pages (25 Oct 2026).
// Working hypotheses (inference and theory), shown in its own section AFTER the record text, which is never altered.
// Each entry: kind (Inference | Theory | Counter-reading | Discarded), the reading, what it rests on, what would confirm or refute it, status.
// Sources: research log (results E01-E135, grounds R1-R10), "why 1983" note, research cycles and findings. — Sion's Tab agent
export const INTERP_UPDATED = "25 Oct 2026 (v2: ingredients wording)";
export const INTERP_THEMES = ["The 1962 → 1974 → 1983 sequence", "Why 1983", "Three versions of Parcel A", "The 1924 drain agreement lead", "The Intercontinental sale motive", "The 1974 licence letters", "Title chain and registration", "Demolition, archaeology and the green"];
export const INTERP_THEORIES = {
"I-01": {
"theme": "The 1962 → 1974 → 1983 sequence",
"kind": "Theory",
"text": "Working hypothesis on the sequence, set out as dated steps for the reader to test. 11 Dec 1962: possession order in Cardiff County Court (EV-0041); the 12-year period from that order ran to 11 Dec 1974. In the 1974 County Court action she pleaded that the claim was barred (EV-0049). 17–19 Sep 1974: BP Pension Trust sought and obtained leave to enforce the 1962 order (EV-0080). 31 Oct 1974: letters permitting her to stay rent-free for life (EV-0050); the Court of Appeal later held that from then on her possession was by licence and no longer adverse (EV-0080). 30 Nov 1982 and 23 Feb 1983: first-registration applications for the fields and for the farmhouse (EV-0059, EV-0065). The hypothesis is that these steps were connected, each taking occupation the family treated as ownership closer to a registered title. No document read so far shows them planned together; W-04 and the discarded entries below set out readings that cut against it.",
"rests": [
"EV-0041",
"EV-0049",
"EV-0050",
"EV-0080",
"EV-0059",
"EV-0065"
],
"confirm": "The 1974 County Court file and leave application (HMCTS reply due 2 Nov 2026) and the 1983 application papers (HM Land Registry subject access request, due 28 Oct 2026) showing the steps were planned as one course of action.",
"refute": "Records showing each step was a separate routine act with its own cause (for example, the 1982 internal BP conveyance arising from a group restructuring unrelated to the farm).",
"status": "Open"
},
"I-02": {
"theme": "The 1962 → 1974 → 1983 sequence",
"kind": "Inference",
"text": "The Court of Appeal records that BP Pension Trust's 1974 County Court action, in which she pleaded that BP's claim was barred, \"has never been finally heard\" (record). Working hypothesis: BP held no fresh order from 1974, so after 31 Oct 1974 its position rested on the licence letters alone; the 1982–83 registrations were the next route open to it.",
"rests": [
"EV-0080",
"EV-0049",
"research log E134(b)"
],
"confirm": "The 1974 plaint and court book showing the action left undetermined (HMCTS request on the 1974 records).",
"refute": "A later order, judgment or discontinuance in the 1974 action.",
"status": "Open; the \"never finally heard\" words are confirmed in the judgment"
},
"I-03": {
"theme": "The 1962 → 1974 → 1983 sequence",
"kind": "Theory",
"text": "On 17–19 Sep 1974 BP Pension Trust obtained leave to enforce the 1962 order \"as successors in title to Western Ground Rents\", on two days' notice, while its own action against her was part-heard. The WGR → BP Pension Trust conveyance is not on either HM Land Registry first-registration file. Working hypothesis: succession to the 1962 order was asserted in court without the conveyance being produced.",
"rests": [
"EV-0041",
"EV-0043",
"EV-0080",
"EV-0161",
"ground R4"
],
"confirm": "The 1974 leave application and its supporting affidavit showing what proof of succession was put to the court.",
"refute": "The 31 Dec 1969 conveyance, or a certified copy, on the 1974 court file or the 1982–83 registration files (HM Land Registry relied on recitals and a 1971 abstract, E21).",
"status": "Open (ground R4, scores a1 b3 c1 d1)"
},
"I-04": {
"theme": "The 1962 → 1974 → 1983 sequence",
"kind": "Inference",
"text": "On the Ordnance Survey 1:2500 sheet revised 1969 (published 1971) the name appears as \"Ty Mawr Farm\", placed west of where the c.1900 and 1941 editions printed \"Ty-mawr\" (just east of the eastern farm range). This came a year before the 25 Jul 1972 outline permission and three years before the 1974 attempt to revive the 1962 order. The map change is record (E108); that it helped merge the house parcel and the fields in planning, enforcement and registration is the family's reading, not shown by any document.",
"rests": [
"EV-0252",
"EV-0046",
"research log E101, E108"
],
"confirm": "Ordnance Survey revision papers or name-book entries showing who asked for the change and why.",
"refute": "Evidence the change was an ordinary OS revision with no outside request. Note: OS names do not define legal extent, and \"Great House farm\" appears in directories from 1887.",
"status": "Open (family hypothesis; map record found)"
},
"W-01": {
"theme": "Why 1983",
"kind": "Inference",
"text": "Two records bear on the timing of the 1984 action. BP's letter of 31 Oct 1974 promised that \"no proceedings will be commenced until you personally no longer live there\" (EV-0050). A BP spokesman quoted in the 1988 press cutting \"Chainsaw farmer vows to fight on\" (EV-0089; our working note places it in the South Wales Echo of 29 Apr 1988; the catalogue records the newspaper as not yet identified) gave her ill health as the reason she lived there rent-free, and added: \"When Mrs Buckler died in 1983 it became clear her son was not going to leave … in May 1984 we started court proceedings.\" Working hypothesis: her death, rather than any new fact about title, set the time of the 1984 action. W-02 sets out the reading that the same timing simply kept the 1974 promise.",
"rests": [
"EV-0089",
"EV-0050",
"EV-0080",
"EV-0073"
],
"confirm": "BP's internal file for 1983–84 (BP Archive request, reply due by 16 Nov 2026) recording a decision to wait for her death; identification of the newspaper and full page for the cutting.",
"refute": "Evidence that BP planned or began proceedings against her during her lifetime, or that the 1984 writ had a different documented trigger.",
"status": "Open (the main working hypothesis on \"why 1983\")"
},
"W-02": {
"theme": "Why 1983",
"kind": "Counter-reading",
"text": "Cuts against the case: the same timing is fully consistent with BP simply keeping its 1974 promise not to evict her in her lifetime. Waiting for her death is, on this reading, the conduct the letters promised, not concealment. The Court of Appeal itself described the device: a unilateral licence lets an owner who is \"not prepared to incur the obloquy of bringing proceedings\" keep \"his title alive for very many years until it suits him to evict\" — a criticism of the device, not a finding of bad faith.",
"rests": [
"EV-0050",
"EV-0080",
"research log E132"
],
"confirm": "BP correspondence showing the delay was kept for a reason beyond the promise (for example, to let a registration settle before anyone could contest it).",
"refute": "BP correspondence showing the delay was only the promise being kept.",
"status": "Open (cuts against)"
},
"W-03": {
"theme": "Why 1983",
"kind": "Inference",
"text": "The farmhouse title was applied for on 23 Feb 1983, while she was alive and in occupation, and examined after her death (26 Mar 1983 in family records; \"March 1983\" in the judgment). HM Land Registry's 30 Jul 2026 schedule lists a D23 \"inside exam\" form with a Linklaters letter of 8 Apr 1983, correspondence of 12 Apr 1983, and Linklaters/Registry letters of 12 May 1983. The register edition carries the application date, 23 Feb 1983 (record). Working hypothesis: whatever the Registry asked about occupation was answered after the occupier had died, while the finished title speaks from a date when she was alive. The content of the three letters is not yet read.",
"rests": [
"EV-0063",
"EV-0066",
"EV-0069",
"EV-0070",
"EV-0071",
"EV-0161",
"research log E133"
],
"confirm": "The 8 Apr, 12 Apr and 12 May 1983 letters (HM Land Registry subject access request, due 28 Oct 2026). If they described the house as vacant, or omitted her son in occupation, this reading is strengthened.",
"refute": "The same letters disclosing the occupation and BP's unresolved 1974 action to the Registry.",
"status": "Open; decisive input due 28 Oct 2026"
},
"W-04": {
"theme": "Why 1983",
"kind": "Inference",
"text": "The 30 Nov 1982 first-registration application for the fields was required by law, not chosen: the Vale had been an area of compulsory first registration since 1 Dec 1975, and LRA 1925 s.123 gave two months from the 19 Nov 1982 BP Pension Trust → BP Properties conveyance (record). Working hypothesis: the only voluntary step in 1982–83 was the farmhouse application of 23 Feb 1983 on Form 1C (Co.). This cuts against any reading that 30 Nov 1982 was itself a chosen moment.",
"rests": [
"EV-0059",
"EV-0265",
"EV-0147",
"EV-0158",
"research log E55, E97"
],
"confirm": "Form 1E and the 19 Nov 1982 conveyance on the WA231076 file (subject access request).",
"refute": "A document showing the 30 Nov 1982 application did not rest on the 19 Nov 1982 conveyance.",
"status": "Record-backed; supersedes the earlier \"stealth timing\" reading"
},
"W-05": {
"theme": "Why 1983",
"kind": "Discarded",
"text": "DISCARDED: the theory that a 12-year deadline in Oct 1986 forced BP to register and act by then. Reason: the 12-year period that mattered ran from the possession order of 11 Dec 1962 and ended on 11 Dec 1974; BP admitted in the Court of Appeal that she was in adverse possession from 1965–67 until 31 Oct 1974; no record carries an Oct 1986 deadline. After her death the only live period was her son's own.",
"rests": [
"EV-0080",
"EV-0041",
"research log E134(c)"
],
"confirm": "Would be revived only by a BP or solicitors' document referring to an Oct 1986 limitation date.",
"refute": "Already refuted on the judgment's own dates.",
"status": "Dropped (25 Oct 2026)"
},
"W-06": {
"theme": "Why 1983",
"kind": "Discarded",
"text": "DISCARDED: the theory that the eight-year gap between the 31 Oct 1974 letters and the 30 Nov 1982 application was a chosen \"stealth\" moment. Reason: the 1982 application was compelled within two months of the 19 Nov 1982 internal conveyance, so its timing was set by statute.",
"rests": [
"EV-0059",
"research log E97"
],
"confirm": "Would be revived by evidence that the 19 Nov 1982 conveyance was itself arranged to time the registration.",
"refute": "Refuted by the statutory two-month rule.",
"status": "Discarded"
},
"W-07": {
"theme": "Why 1983",
"kind": "Counter-reading",
"text": "Cuts against the case: no record yet found shows BP knew of a final illness between Nov 1982 and Feb 1983. She was long disabled (the 1974 press described an elderly widow confined to a wheelchair) and was 69. Timing the filings to an expected death is therefore not supported by anything read so far.",
"rests": [
"EV-0067",
"EV-0048",
"research log E132"
],
"confirm": "BP or solicitors' correspondence of 1982–83 referring to her health.",
"refute": "A complete BP file for 1982–83 with no mention of her health.",
"status": "Open (cuts against)"
},
"W-08": {
"theme": "Why 1983",
"kind": "Discarded",
"text": "DISCARDED: the theory that the 23 Feb 1983 registration opened a short legal window to challenge it, which closed with her death. Reason: no such window existed in law — LRA 1925 s.70(1)(f) and (g) protected rights being acquired by possession and every person in actual occupation, and s.82 allowed rectification with no time limit.",
"rests": [
"EV-0060",
"research log E49"
],
"confirm": "Would be revived only by a Registry notice setting a time limit that was relied on.",
"refute": "Refuted by the statute text.",
"status": "Discarded"
},
"P-01": {
"theme": "Three versions of Parcel A",
"kind": "Theory",
"text": "Working hypothesis (the family's frame): three versions of Parcel A, the house parcel, which the family calls \"synthetic\", were created without the occupier as a party — A1, the Forest of Cardiff woodland title WA735527 (1994); A2, BP Properties' farmhouse title WA240304 (1983); A3, the village green VG41 registered by Glamorgan County Council (1970). Each turned land the family regarded as theirs into a registered or statutory parcel held by someone else.",
"rests": [
"EV-0136",
"EV-0166",
"EV-0169",
"EV-0065",
"EV-0066",
"EV-0044",
"EV-0023"
],
"confirm": "Side-by-side plans showing each parcel overlapping the house parcel on the 1939 tenancy plan, and application papers silent about the person in occupation (LRA 1925 s.70(1)(g)).",
"refute": "Plans showing no overlap with the house parcel.",
"status": "Open (family hypothesis)"
},
"P-02": {
"theme": "Three versions of Parcel A",
"kind": "Counter-reading",
"text": "Cuts against A3: on the certified VG41 map the green is a small roadside wedge in front of the church, and objection No 314 was in the land section (whether the land is a green), not the ownership section. The \"1970 synthetic Parcel A\" reading is weak on the map read so far.",
"rests": [
"EV-0044",
"EV-0263",
"research log E88; research cycle 28"
],
"confirm": "A VG41 plan or Commons Commissioner file showing the green extended over the house parcel.",
"refute": "The certified map as read (a roadside wedge only).",
"status": "Weakened"
},
"P-03": {
"theme": "Three versions of Parcel A",
"kind": "Counter-reading",
"text": "Cuts against A1 as a separate act: the woodland title came through BP's own chain (the 23 May 1975 conveyance passed the farmhouse plot and other land, including woodland north-east of Leckwith Road; BP's retained land in 1989; Forest of Cardiff from 25 Nov 1994). On this record A1 is a continuation of A2, not an independent creation.",
"rests": [
"EV-0052",
"EV-0136",
"EV-0166",
"EV-0169",
"research log E35, E99"
],
"confirm": "A 1994 transfer plan taking in house-parcel land that was never in the 1975 conveyance.",
"refute": "The 1975 and 1994 plans matching (already indicated on the register views).",
"status": "Open (cuts against)"
},
"D-01": {
"theme": "The 1924 drain agreement lead",
"kind": "Inference",
"text": "The 15 May 1924 Bute–J. P. S. Corbett drain agreement is entered on the woodland title WA735527 as the only charge not limited to a plan colour, so it is registered against the whole title, including land that came through the 1975 conveyance; it no longer appears on the residual farm title WA231076 (record, register views). Glamorgan Archives DSA/12/4232 records a sale \"Lord Bute to Miss O.S. Corbett\" of a plot opposite O.S. 60, with correspondence of 6–22 Mar 1924, two months earlier. Working hypothesis: Bute was still dealing with this land as owner in 1924. That the May drain serves the March plot is an inference, not shown; O.S. 60 is a field on the south-east edge of the village, not the farmhouse plot (O.S. 36).",
"rests": [
"EV-0015",
"EV-0169",
"EV-0170",
"research log E119, E128; research cycle 35 (DSA/12/4232)"
],
"confirm": "The 1924 agreement and its plan (HM Land Registry WA231076 item 2; Glamorgan Archives DSA/12/4232) showing the drain's route across or beside the house parcel.",
"refute": "A plan placing the drain wholly away from the house parcel, or a Registry note that the entry was carried over without a plan for clerical reasons.",
"status": "Open lead"
},
"D-02": {
"theme": "The 1924 drain agreement lead",
"kind": "Discarded",
"text": "DISCARDED: the theory that the 1924 drain agreement burdens only land outside the 1975 farmhouse strand and so tells us nothing about Bute's title. Reason: on WA735527 the entry is unlimited by tint and so registered against the whole woodland title, including 1975 land.",
"rests": [
"EV-0015",
"EV-0169",
"research log E128"
],
"confirm": "Would be revived by a filed plan limiting the entry.",
"refute": "Refuted by the register view as read.",
"status": "Discarded"
},
"S-01": {
"theme": "The Intercontinental sale motive",
"kind": "Inference",
"text": "Records on the land's later use, set side by side. The 23 May 1975 conveyance reserved 80-year rights to build roads and sewers across the farmhouse plot \"to serve any development of the Retained Land\" (EV-0052). In Dec 1986 BP Properties granted a charge to Intercontinental Land & Development Co Ltd (EV-0251); S-02 records it as a commercial relationship, not a dealing with Llandough. In Oct 1988 the BP Pension Fund sold about 1,300 acres in South Wales to Intercontinental Land & Development (Cardiff) Ltd for £29,375,400 after a tender (EV-0093, EV-0270, record, press and company filings). Working hypothesis: a registered title made the land easier to sell for development. Nothing read so far ties the 1982–83 filings to that sale, and S-02 sets out why a pre-arranged sale was discarded.",
"rests": [
"EV-0052",
"EV-0093",
"EV-0269",
"EV-0270",
"EV-0251",
"research log E94, E127"
],
"confirm": "The Land Authority for Wales board papers (TNA WA 9/49) or the 1988 sale schedule showing Great House Farm in the package and reliance on the 1983 title.",
"refute": "A sale schedule excluding the farm, or evidence that the sale was conceived only after the 31 Jul 1987 judgment.",
"status": "Open (inference only)"
},
"S-02": {
"theme": "The Intercontinental sale motive",
"kind": "Discarded",
"text": "DISCARDED (cuts against): the theory that the 1988 sale was pre-arranged before the 1987 judgment. Reason: the Cardiff buyer had its own bank finance from 13 Apr 1987 for something before the BP tender; its BP purchase rests on a contract of 23 Sep 1988 with loans of 28 Oct 1988, after an open tender of about 800 parties. The Dec 1986 charge by BP Properties to the Intercontinental group shows a commercial relationship, not a dealing with Llandough (logged as context).",
"rests": [
"EV-0270",
"EV-0251",
"research log E127, E129"
],
"confirm": "Would be revived by any 1986–87 document naming BP land in the buyer's financing.",
"refute": "Refuted on the company filings read.",
"status": "Discarded"
},
"L-01": {
"theme": "The 1974 licence letters",
"kind": "Theory",
"text": "Ground R1: the Court of Appeal answered the \"wrong company\" argument only from the letters' own words that BP Properties Ltd \"had agreed to buy\". Completion came on 23 May 1975, and HM Land Registry's schedule lists a plan to the sale dated 23 Feb 1975, almost four months after the letters. Working hypothesis: if no binding agreement existed on 31 Oct 1974, BP Properties had nothing to licence.",
"rests": [
"EV-0050",
"EV-0052",
"EV-0080",
"EV-0161",
"ground R1"
],
"confirm": "BP Archive or Registry papers showing no agreement before Feb–May 1975.",
"refute": "A dated contract or board minute before 31 Oct 1974. Cuts against: an unwritten agreement is not void (E28); a press snippet suggests the two companies shared an officer in 1972, so a group decision recorded only internally is plausible (E124, not yet confirmed); the 23 Feb 1975 date may be a clerical carry-over in the Registry's letter (E81).",
"status": "Open (ground R1, scores a1 b3 c2 d1)"
},
"L-02": {
"theme": "The 1974 licence letters",
"kind": "Theory",
"text": "Ground R2: the decisive finding was that she never repudiated the letters (\"she did not, however, do that\"). The family's account, as read here, is that she rejected the permission offered. A letter from her or her solicitors to BP after 31 Oct 1974 rejecting the licence would meet the exact point the court said might have changed the result.",
"rests": [
"EV-0050",
"EV-0049",
"EV-0051",
"EV-0080",
"EV-0073",
"ground R2"
],
"confirm": "Such a letter in the family solicitors' 1984–87 file, BP's list of documents, or a reply to the Western Mail letter of 19 Nov 1974.",
"refute": "A complete solicitors' file with no rejection. The 1974 defence alone does not help: the court recited it and still found no repudiation (E130).",
"status": "Open (ground R2, scores a1 b5 c1 d1)"
},
"L-03": {
"theme": "The 1974 licence letters",
"kind": "Theory",
"text": "Ground R10: the letters gave the sale to BP Properties as \"the only way\" to \"safeguard your future occupation of Great House Farm\", yet the 23 May 1975 conveyance kept the rest of the farm as the Trust's \"Retained Land\" until 19 Nov 1982 and reserved 80-year road and sewer rights across the farmhouse plot for its development. Working hypothesis: a gap between the stated purpose and the deed.",
"rests": [
"EV-0050",
"EV-0052",
"EV-0169",
"ground R10; research log E94, E99"
],
"confirm": "BP papers showing the 1975 deed was drafted for development of the retained land.",
"refute": "BP papers showing the reservations were standard form with no development plan.",
"status": "Open (ground R10, scores a2 b1 c1 d1)"
},
"L-04": {
"theme": "The 1974 licence letters",
"kind": "Discarded",
"text": "DISCARDED: the theory that the letters misnamed the companies (that \"BP Properties Ltd\" or the Trust name did not exist in Oct 1974). Reason: BP Properties Limited was incorporated on 27 Jul 1961 with no previous names; \"BP Pension Trust Ltd\" is a short form of The British Petroleum Pension Trust Limited. Also discarded: that the letters' address to \"Mrs Buckler\" was hidden from the court — the court recorded that she was \"also from time to time referred to as Mrs Williams\".",
"rests": [
"EV-0050",
"EV-0251",
"research log E15, E20; ground R6"
],
"confirm": "Would be revived by a document showing the court was misled about the addressee.",
"refute": "Refuted by the company register and the judgment text.",
"status": "Discarded"
},
"L-05": {
"theme": "The 1974 licence letters",
"kind": "Discarded",
"text": "DISCARDED: the theory that the 31 Oct 1974 letter misstated enforcement by telling her the bailiff instructions \"have been withdrawn\" while the warrant stayed live. Reason: withdrawing instructions to the bailiff and withdrawing the warrant are different steps and both statements can be true; the court had both facts.",
"rests": [
"EV-0050",
"research log E109"
],
"confirm": "Would be revived by the 1974 warrant file showing the instructions were not withdrawn.",
"refute": "Refuted on the judgment text.",
"status": "Discarded"
},
"R-01": {
"theme": "Title chain and registration",
"kind": "Theory",
"text": "Ground R5: the court's starting point — a Feb 1916 tenancy of \"the whole of the farm\" and BP's \"paper title to the farm\" — would fail for the farmhouse if the 1938 Bute → Western Ground Rents conveyance did not include it. The 1905 Bute conveyance and the 1924 drain agreement show Bute dealing with land here, so either the house came back to the main estate by a deed not yet seen, or the 1916 recital is loose.",
"rests": [
"EV-0013",
"EV-0014",
"EV-0015",
"EV-0019",
"EV-0022",
"EV-0023",
"EV-0216",
"EV-0045",
"ground R5"
],
"confirm": "The 1938 conveyance plan showing the house parcel excluded.",
"refute": "The 1938 plan including it. Cuts against: paper title was not in issue in 1987 (E26), and the NLW 33-acre limeworks bundle (1876–1912) fits a letting that ended in 1912 rather than a sale (E43).",
"status": "Open (ground R5, scores a1 b3 c2 d1)"
},
"R-02": {
"theme": "Title chain and registration",
"kind": "Theory",
"text": "Ground R3: the farmhouse was registered separately (WA240304, Form 1C by Linklaters & Paines, edition 23 Feb 1983) while BP's own 1974 action \"has never been finally heard\"; the court was told the whole farm had been registered in November 1982. Working hypothesis: the farmhouse application, made with eight-plus years of admitted adverse possession behind her, is the point where the occupation and the unresolved action would have had to be declared.",
"rests": [
"EV-0063",
"EV-0065",
"EV-0066",
"EV-0080",
"EV-0078",
"ground R3; research log E91, E98"
],
"confirm": "A Form 1C (Co.) statutory declaration silent about her occupation or claim (subject access request item 11).",
"refute": "A declaration that disclosed both. Cuts against: the court's words match the register as merged on 2 Feb 1987, and paper title was never in issue.",
"status": "Open (ground R3, scores a2 b1 c3 d2)"
},
"R-03": {
"theme": "Title chain and registration",
"kind": "Inference",
"text": "The 2 Feb 1987 amalgamation of WA240304 into WA231076 sets a dilemma on the 1983 class of title: either absolute in Feb 1983 (a London Gazette advertisement was required by the rules as printed, and none has been found), or possessory and later converted. Working hypothesis: the class of title in 1983 is a test of how the application was handled. Not yet confirmed for 1987 practice.",
"rests": [
"EV-0078",
"EV-0066",
"EV-0231",
"research log E114, E116, E118, E120, E125"
],
"confirm": "Subject access request item 10 (the 1983 register edition) showing the class of title.",
"refute": "Evidence that the Registry had stopped Gazette advertisement for all land after about May 1975 (the absence found is practice-wide, E116).",
"status": "Open; turns on item 10 (due 28 Oct 2026)"
},
"R-04": {
"theme": "Title chain and registration",
"kind": "Discarded",
"text": "DISCARDED: the theory that a pending land action from the 1974 proceedings was registered and still in force at the Feb 1983 application. Reason: a pending action registration lapses after five years unless renewed, and is entered against the estate owner; any 1974 entry would have lapsed by late 1979.",
"rests": [
"EV-0029",
"research log E56"
],
"confirm": "Would be revived by a renewal entry at the Land Charges Department.",
"refute": "Refuted by the statute text unless a renewal is found.",
"status": "Discarded"
},
"R-05": {
"theme": "Title chain and registration",
"kind": "Discarded",
"text": "DISCARDED: the theory that the 1971 abstract of title shows an undisclosed 1971 dealing kept from the 1987 court. Reason: the Registry's letter names no maker, purpose or transaction; an abstract carried forward is ordinary conveyancing, and paper title was not in issue in 1987.",
"rests": [
"EV-0045",
"research log E21, E45"
],
"confirm": "Would be revived by the abstract itself showing a 1971 dealing.",
"refute": "Refuted unless the abstract's contents show otherwise.",
"status": "Discarded"
},
"R-06": {
"theme": "Title chain and registration",
"kind": "Discarded",
"text": "DISCARDED: the theory that the 23 May 1975 conveyance was void for late registration under LRA 1925 s.123. Reason: compulsory registration began in this part of the Vale on 1 Dec 1975, after the conveyance, so the 1983 application on Form 1C was voluntary and fits the form used.",
"rests": [
"EV-0052",
"EV-0265",
"research log E55"
],
"confirm": "Would be revived by an earlier compulsory-area order covering Llandough.",
"refute": "Refuted by the published compulsory-registration dates.",
"status": "Discarded"
},
"H-01": {
"theme": "Demolition, archaeology and the green",
"kind": "Theory",
"text": "Ground R9: whether knowledge of buried remains under the farm (1,026 burials recorded in 1994) was held before the 1986–87 trial and kept from the court. The 1979–80 villa letters, the 1982 warning letter and the 1983 fire are on record. Working hypothesis: such knowledge would bear on motive and on what the court was told, not on title itself.",
"rests": [
"EV-0054",
"EV-0056",
"EV-0058",
"EV-0068",
"EV-0126",
"EV-0134",
"ground R9"
],
"confirm": "A pre-July-1987 document linking BP to archaeology at the farmhouse site.",
"refute": "Archaeological trust files with no such link before 1987.",
"status": "Open (ground R9, scores a0 b0 c1 d0)"
},
"H-02": {
"theme": "Demolition, archaeology and the green",
"kind": "Theory",
"text": "Ground R7: the 1988 demolition, the missing 1988 Cadw file and the official answers that files \"would have been destroyed\". Working hypothesis: these raise questions about how the listing request was handled. Cuts against as a reopening ground: the events came after the 31 Jul 1987 judgment, so they cannot have caused it.",
"rests": [
"EV-0081",
"EV-0094",
"EV-0095",
"EV-0096",
"EV-0106",
"EV-0118",
"ground R7; research log E122"
],
"confirm": "The Welsh Office / Cadw 1988 file or its destruction record.",
"refute": "A documented routine destruction schedule covering the file.",
"status": "Open (ground R7, scores a1 b0 c2 d0)"
},
"H-03": {
"theme": "Demolition, archaeology and the green",
"kind": "Theory",
"text": "Ground R8: VG41 was registered in 1970 by Glamorgan County Council as registration authority; the same council's planning committee had heard her, reported as Mrs M. D. Buckler, on 19 Nov 1958 describe her family's land as \"wrongfully appropriated\". Working hypothesis: a separate route on the green, not a ground to reopen the 1987 judgment.",
"rests": [
"EV-0044",
"EV-0263",
"EV-0232",
"EV-0035",
"EV-0036",
"ground R8"
],
"confirm": "The Commons Commissioner or county council file on VG41.",
"refute": "A file showing the 1958 hearing and the green were handled by unconnected officers with no notice of the dispute.",
"status": "Open (ground R8, scores a1 b0 c2 d1)"
},
"H-04": {
"theme": "Demolition, archaeology and the green",
"kind": "Discarded",
"text": "DISCARDED: the theory that the 22 May 1980 Commons debate put the farm dispute before Parliament before the 1983 registration. Reason: the debate concerns leasehold valuations and Western Ground Rents' sale to the BP pension fund; Llandough, the farm and Mrs Buckler are not mentioned.",
"rests": [
"EV-0057",
"research log E05, E48"
],
"confirm": "Would be revived by another Hansard entry naming the farm.",
"refute": "Refuted on the debate text.",
"status": "Discarded"
},
"H-05": {
"theme": "Demolition, archaeology and the green",
"kind": "Discarded",
"text": "DISCARDED: the theory that the \"1978 article\" was an ownership assertion made after the licence letters. Reason: it is the Daily Telegraph of 16 Apr 1974, before the letters; the companion letter is the Western Mail of 19 Nov 1974.",
"rests": [
"EV-0048",
"EV-0051",
"research log E04"
],
"confirm": "Would be revived by a dated 1978 item.",
"refute": "Refuted by the handwritten date and archive stamp.",
"status": "Discarded"
},
"H-06": {
"theme": "Demolition, archaeology and the green",
"kind": "Discarded",
"text": "DISCARDED: the theory that the March 1965 offer to Mrs Buckler was of the eastern fields her husband had held, not the farmhouse. Reason: the only offer to her the judgment describes is \"of the farmhouse and garden\"; logged as the family's hypothesis with the record point.",
"rests": [
"EV-0039",
"EV-0080",
"research log E104"
],
"confirm": "Would be revived by the agents' 1965 file naming the fields.",
"refute": "Refuted on the judgment's summary unless the file shows otherwise.",
"status": "Discarded"
}
};
export const INTERP_PAGES = {
"/evidence-library/d696-western-ground-rents-rental-books-plan-book-litigation-evidence-lead/": [
"R-01"
],
"/evidence-library/dbdt123-7-1939-wgr-john-williams-tenancy-agreement-plan/": [
"P-01",
"R-01"
],
"/evidence-library/fc-001-wa231076-item-17-form-a13/": [
"I-01",
"W-04",
"W-06",
"W-07"
],
"/evidence-library/fc-002-wa240304-first-registration-file/": [
"I-01",
"W-03",
"P-01",
"R-02",
"R-04"
],
"/evidence-library/fc-003-wa231076-1983-84-registration-activity/": [
"W-03",
"W-04"
],
"/evidence-library/fc-004-2-february-1987-amalgamation-application/": [
"R-02",
"R-03"
],
"/evidence-library/fc-005-family-solicitors-1984-87-litigation-file/": [
"W-01",
"L-02"
],
"/evidence-library/ghf-e029-01-1990-ggat-archaeological-assessment-great-house-farm-llandough/": [
"H-01"
],
"/evidence-library/ghf-e090-n06-burnt-relics-represented-years-of-digs-1983/": [
"H-01"
],
"/evidence-library/ghf-e090-n07-chainsaw-farmer-vows-to-fight-on/": [
"W-01",
"W-02"
],
"/evidence-library/ghf-e090-n11-tears-flow-as-farm-house-razed-1988/": [
"H-02"
],
"/evidence-library/ghf-e106-r27-a1-hmlr-n610cgv-letter-wa231076-13-july-2026/": [
"W-03",
"W-04",
"R-02"
],
"/evidence-library/ghf-e106-r37-a2-cadw-farmhouse-survey-photo-29-july-1988/": [
"H-02"
],
"/evidence-library/ghf-e106-r37-a3-cadw-barn-survey-photo-29-july-1988/": [
"H-02"
],
"/evidence-library/ghf-e108-mary-doreen-williams-death-index-march-1983/": [
"W-01",
"W-03",
"W-07"
],
"/evidence-library/ghf-e118-february-1916-bute-tenancy-john-williams-and-plan/": [
"R-01"
],
"/evidence-library/ghf-e119-15-may-1924-bute-corbett-drain-agreement-and-plan/": [
"D-01",
"D-02"
],
"/evidence-library/ghf-e121-1938-bute-wgr-conveyance-and-plan/": [
"R-01"
],
"/evidence-library/ghf-e128-1959-and-1965-wgr-tenancy-offers-to-the-house-and-garden/": [
"H-06"
],
"/evidence-library/ghf-e130-11-december-1962-cardiff-county-court-possession-order/": [
"I-01",
"I-02",
"I-03",
"W-05"
],
"/evidence-library/ghf-e131-31-december-1969-wgr-bp-pension-trust-conveyance/": [
"I-01",
"I-03"
],
"/evidence-library/ghf-e132-1971-abstract-of-title/": [
"I-03",
"W-04",
"R-01",
"R-05"
],
"/evidence-library/ghf-e133-16-june-1970-vg41-village-green-registration-and-ownership-file/": [
"P-01",
"P-02",
"H-03"
],
"/evidence-library/ghf-e134-1972-planning-permission-3-8996-3337-and-ownership-certificate/": [
"I-04"
],
"/evidence-library/ghf-e135-3-july-1974-mary-williams-plea-of-ownership-and-pleadings/": [
"I-01",
"I-02",
"L-02"
],
"/evidence-library/ghf-e136-31-october-1974-licence-letters-bp-pension-trust-and-bp-properties/": [
"I-01",
"W-01",
"W-02",
"W-05",
"L-01",
"L-02",
"L-03",
"L-04",
"L-05"
],
"/evidence-library/ghf-e138-23-may-1975-bp-pension-trust-to-bp-properties-conveyance/": [
"I-01",
"P-03",
"S-01",
"L-01",
"L-03",
"R-06"
],
"/evidence-library/ghf-e139-1-october-1982-ggat-warning-letter/": [
"H-01"
],
"/evidence-library/ghf-e141-31-july-1987-court-of-appeal-judgment-bp-properties-v-buckler/": [
"I-01",
"I-02",
"W-01",
"W-02",
"W-05",
"L-01",
"L-02",
"R-02"
],
"/evidence-library/ghf-e144-1988-cadw-inspection-photographs-and-5-december-listing-decision/": [
"H-02"
],
"/evidence-library/ghf-e148-1994-cotswold-archaeology-report-condition-18-discharge-and-counsels-opinion/": [
"H-01"
],
"/evidence-library/ghf-e149-10-november-1994-transfer-to-forest-of-cardiff-wa735527/": [
"P-01",
"P-03"
],
"/evidence-library/ghf-e150-2005-forest-of-cardiff-to-goldsworthy-homes-transfer-and-excision/": [
"P-01",
"P-03"
],
"/evidence-library/ghf-e152-cadw-letter-to-minister-1988-spot-listing/": [
"H-02"
],
"/evidence-library/ghf-e156-hmlr-registration-history-ty-mawr-farm-letter-23-march-2026/": [
"W-03",
"W-04"
],
"/evidence-library/ghf-e158-hmlr-schedule-first-registration-documents-wa231076-wa240304-30-july-2026/": [
"W-03",
"L-01"
],
"/evidence-library/ghf-e161-wa231076-title-register-september-2026/": [
"P-01",
"D-01"
],
"/evidence-library/ghf-e162-wa231076-title-plan-september-2026/": [
"P-01"
],
"/evidence-library/ghf-e163-wa735527-title-register-september-2026/": [
"P-01",
"P-03",
"D-01",
"D-02"
],
"/evidence-library/ghf-e164-wa735527-title-plan-september-2026/": [
"P-01",
"P-03"
],
"/evidence-library/ghf-e165-historical-map-labelled-1841-map/": [
"I-04"
],
"/evidence-library/ghf-e166-ty-mawr-map-1824/": [
"I-04"
],
"/evidence-library/ghf-e167-ggat-wales-west-ha-letters-llandough-roman-villa-finds-april-1980/": [
"H-01"
],
"/evidence-library/ghf-e180-reported-hmlr-notification-after-mary-williams-death/": [
"W-03",
"W-08"
],
"/evidence-library/ghf-e182-1954-frederick-buckler-tenancy-attempt/": [
"H-06"
],
"/evidence-library/ghf-e186-heneb-1983-warehouse-fire-records-enquiry/": [
"H-01"
],
"/evidence-library/press-archive-transcripts/n03-1974-open-day-to-save-ancient-welsh-house/": [
"H-05"
],
"/evidence-library/press-archive-transcripts/n04-grievous-loss-letter-western-mail/": [
"L-02",
"H-05"
],
"/evidence-library/press-archive-transcripts/n05-1980-historical-society-had-notable-year/": [
"H-01"
],
"/evidence-library/press-archive-transcripts/n15-01-south-wales-echo-friday-29-april-1988/": [
"W-01"
],
"/evidence-library/press-archive-transcripts/n16-1980-hansard-ted-rowlands-western-ground-rents-bp-pension-fund/": [
"H-04"
],
"/evidence/ev-0004-ty-mawr-map-1824/": [
"I-04"
],
"/evidence/ev-0005-historical-map-labelled-1841/": [
"I-04"
],
"/evidence/ev-0013-bute-conveyance-1905/": [
"D-01",
"R-01"
],
"/evidence/ev-0014-bute-tenancy-john-williams-1916/": [
"R-01"
],
"/evidence/ev-0015-bute-corbett-drain-agreement-1924/": [
"D-01",
"D-02"
],
"/evidence/ev-0019-bute-wgr-conveyance-plan-1938/": [
"R-01"
],
"/evidence/ev-0020-western-ground-rents-rental-books/": [
"R-01"
],
"/evidence/ev-0022-press-1938-bute-wgr-sale-completion/": [
"R-01"
],
"/evidence/ev-0023-1939-wgr-john-williams-tenancy-plan/": [
"P-01",
"R-01"
],
"/evidence/ev-0024-bute-mountjoy-estate-maps-d1777/": [
"R-01"
],
"/evidence/ev-0029-local-land-charges-dcvg-c-7/": [
"R-04"
],
"/evidence/ev-0031-1954-buckler-tenancy-attempt/": [
"H-06"
],
"/evidence/ev-0035-western-mail-1958-leckwith-common-hearing/": [
"H-03"
],
"/evidence/ev-0036-western-mail-1958-gcc-acquisition-notice/": [
"H-03"
],
"/evidence/ev-0039-wgr-tenancy-offers-1959-1965/": [
"H-06"
],
"/evidence/ev-0041-cardiff-county-court-possession-order-1962/": [
"I-01",
"I-02",
"I-03",
"W-05"
],
"/evidence/ev-0043-wgr-bp-pension-trust-conveyance/": [
"I-01",
"I-03"
],
"/evidence/ev-0044-vg41-village-green-registration-1970/": [
"P-01",
"P-02",
"H-03"
],
"/evidence/ev-0045-1971-abstract-title-bp-pension/": [
"I-03",
"W-04",
"R-01",
"R-05"
],
"/evidence/ev-0046-1972-outline-planning-permission-ownership-certificate/": [
"I-04"
],
"/evidence/ev-0048-telegraph-open-day-ancient-house/": [
"H-05"
],
"/evidence/ev-0049-mary-williams-plea-ownership-pleadings/": [
"I-01",
"I-02",
"L-02"
],
"/evidence/ev-0050-1974-bp-licence-letters/": [
"I-01",
"W-01",
"W-02",
"W-05",
"L-01",
"L-02",
"L-03",
"L-04",
"L-05"
],
"/evidence/ev-0051-grievous-loss-letter-western-mail/": [
"L-02",
"H-05"
],
"/evidence/ev-0052-bp-pension-trust-bp-properties-conveyance/": [
"I-01",
"P-03",
"S-01",
"L-01",
"L-03",
"R-06"
],
"/evidence/ev-0054-ggat-wales-west-roman-villa-letters/": [
"H-01"
],
"/evidence/ev-0055-neath-guardian-historical-society-1980/": [
"H-01"
],
"/evidence/ev-0056-neath-guardian-17-april-1980-roman-villa-remains-a/": [
"H-01"
],
"/evidence/ev-0057-hansard-rowlands-western-ground-rents-bp/": [
"H-04"
],
"/evidence/ev-0058-ggat-warning-letter-1982/": [
"H-01"
],
"/evidence/ev-0059-wa231076-form-a13-first-registration/": [
"I-01",
"W-04",
"W-06",
"W-07"
],
"/evidence/ev-0060-hmlr-notification-after-mary-williams-death/": [
"W-03",
"W-08"
],
"/evidence/ev-0063-hmlr-wa240304-item-11-form-1c/": [
"W-03",
"W-07",
"R-02"
],
"/evidence/ev-0064-hmlr-wa240304-item-5-letters/": [
"W-03"
],
"/evidence/ev-0065-wa240304-farmhouse-first-registration-file/": [
"I-01",
"W-03",
"P-01",
"R-02",
"R-04"
],
"/evidence/ev-0066-hmlr-wa240304-item-10-register-1983/": [
"W-03",
"W-08",
"P-01",
"R-02",
"R-03"
],
"/evidence/ev-0067-mary-doreen-williams-death-index/": [
"W-01",
"W-03",
"W-07"
],
"/evidence/ev-0068-burnt-relics-years-of-digs/": [
"H-01"
],
"/evidence/ev-0069-hmlr-wa240304-item-7-d23-1983/": [
"W-03"
],
"/evidence/ev-0070-hmlr-wa240304-item-4-correspondence-1983/": [
"W-03"
],
"/evidence/ev-0071-wa231076-1983-84-registration-activity/": [
"W-03",
"W-04"
],
"/evidence/ev-0073-family-solicitors-litigation-file-1984-87/": [
"W-01",
"L-02"
],
"/evidence/ev-0078-1987-title-amalgamation-application-plan/": [
"R-02",
"R-03"
],
"/evidence/ev-0080-bp-properties-v-buckler-judgment/": [
"I-01",
"I-02",
"W-01",
"W-02",
"W-05",
"L-01",
"L-02",
"R-02"
],
"/evidence/ev-0081-cadw-letter-minister-spot-listing/": [
"H-02"
],
"/evidence/ev-0088-south-wales-echo-buckler-dispute-1988/": [
"W-01"
],
"/evidence/ev-0089-chainsaw-farmer-vows-fight-on/": [
"W-01",
"W-02"
],
"/evidence/ev-0093-estates-gazette-1988-bp-welsh-sales/": [
"S-01",
"S-02"
],
"/evidence/ev-0094-cadw-barn-survey-photo-1988/": [
"H-02"
],
"/evidence/ev-0095-cadw-farmhouse-survey-photo-1988/": [
"H-02"
],
"/evidence/ev-0096-cadw-1988-inspection-photographs-listing/": [
"H-02"
],
"/evidence/ev-0106-tears-flow-farmhouse-razed-1988/": [
"H-02"
],
"/evidence/ev-0113-glamorgan-gwent-archaeological-trust-comments-and/": [
"H-01"
],
"/evidence/ev-0118-smr-record-card-1989-building-destroyed/": [
"H-02"
],
"/evidence/ev-0123-outline-planning-application-form-d-bp-properties/": [
"S-01"
],
"/evidence/ev-0124-outline-planning-permission-89-01396-out-residenti/": [
"S-01"
],
"/evidence/ev-0126-ggat-archaeological-assessment-great-house-1990/": [
"H-01"
],
"/evidence/ev-0131-glamorgan-gwent-archaeological-trust-letters-on-ar/": [
"H-01"
],
"/evidence/ev-0132-cotswold-archaeology-condition-18-discharge/": [
"H-01"
],
"/evidence/ev-0134-cotswold-archaeological-trust-letter-to-national-m/": [
"H-01"
],
"/evidence/ev-0136-forest-of-cardiff-woodland-transfer-1994/": [
"P-01",
"P-03"
],
"/evidence/ev-0139-forest-cardiff-goldsworthy-transfer-excision/": [
"P-01",
"P-03"
],
"/evidence/ev-0147-hmlr-letter-ty-mawr-registration-history/": [
"W-03",
"W-04"
],
"/evidence/ev-0158-hmlr-n610cgv-letter-wa231076/": [
"W-03",
"W-04",
"R-02"
],
"/evidence/ev-0161-hmlr-schedule-first-registration-documents/": [
"W-03",
"L-01"
],
"/evidence/ev-0166-wa735527-title-plan-september-2026/": [
"P-01",
"P-03"
],
"/evidence/ev-0167-wa231076-title-plan-2026/": [
"P-01"
],
"/evidence/ev-0169-wa735527-title-register-september-2026/": [
"P-01",
"P-03",
"D-01",
"D-02"
],
"/evidence/ev-0170-wa231076-title-register-september-2026/": [
"P-01",
"D-01"
],
"/evidence/ev-0179-heneb-1983-warehouse-fire-enquiry/": [
"H-01"
],
"/evidence/ev-0216-1965-contract-condition-f-conveyance-25-december-1938/": [
"R-01"
],
"/evidence/ev-0231-london-gazette-land-registry-notices-llandough-1960-1972/": [
"R-03"
],
"/evidence/ev-0232-commons-registration-glamorgan-act-1983/": [
"P-02",
"H-03"
],
"/evidence/ev-0236-water-undertakings-return-1914-bute-spring-llandough/": [
"D-01"
],
"/evidence/ev-0251-companies-house-bp-properties-limited-00699446/": [
"S-01",
"S-02",
"L-04"
],
"/evidence/ev-0252-tna-os-35-2503-object-name-book-glamorgan-47-nw/": [
"I-04"
],
"/evidence/ev-0263-commons-registration-1965-publicity-glamorgan-notices-vg41/": [
"P-01",
"P-02",
"H-03"
],
"/evidence/ev-0265-hmlr-registration-background-compulsory-1975-r29-certificate/": [
"W-04",
"W-06",
"R-06"
],
"/evidence/ev-0268-cadw-13428-lower-farmhouse-rhoose-listed-12-oct-1988/": [
"H-02"
],
"/evidence/ev-0269-tna-wa-9-49-land-authority-for-wales-board-1988/": [
"S-01",
"S-02"
],
"/evidence/ev-0270-bp-pension-fund-1988-sale-intercontinental-law-llandough-press/": [
"S-01",
"S-02"
],
"/evidence/ev-0271-tna-bd-34-114-historic-buildings-council-wales-1988-1989/": [
"H-02"
],
"/evidence/ev-0273-south-wales-echo-23-feb-1990-great-house-farm-homes-bid-village-green/": [
"S-01"
],
"/evidence/ev-0278-nlw-bute-estate-records-llandough-manor-rentals-1808-1881-r-6-27-45-and-presentmen/": [
"R-01"
],
"/evidence/ev-0289-snippets-only-bp-pension-trust-in-south-wales-1981-83-sale-of-its-residential-grou/": [
"S-01"
],
"/evidence/ev-0291-nlw-bute-catalogue-d153-llandough-33-acres-great-house-farm-limeworks-and-pwllypant-d242-d247-d258/": [
"R-01"
]
};
export const INTERP_EV_PATHS = {
"EV-0013": "/evidence/ev-0013-bute-conveyance-1905/",
"EV-0014": "/evidence/ev-0014-bute-tenancy-john-williams-1916/",
"EV-0015": "/evidence/ev-0015-bute-corbett-drain-agreement-1924/",
"EV-0019": "/evidence/ev-0019-bute-wgr-conveyance-plan-1938/",
"EV-0022": "/evidence/ev-0022-press-1938-bute-wgr-sale-completion/",
"EV-0023": "/evidence/ev-0023-1939-wgr-john-williams-tenancy-plan/",
"EV-0029": "/evidence/ev-0029-local-land-charges-dcvg-c-7/",
"EV-0035": "/evidence/ev-0035-western-mail-1958-leckwith-common-hearing/",
"EV-0036": "/evidence/ev-0036-western-mail-1958-gcc-acquisition-notice/",
"EV-0039": "/evidence/ev-0039-wgr-tenancy-offers-1959-1965/",
"EV-0041": "/evidence/ev-0041-cardiff-county-court-possession-order-1962/",
"EV-0043": "/evidence/ev-0043-wgr-bp-pension-trust-conveyance/",
"EV-0044": "/evidence/ev-0044-vg41-village-green-registration-1970/",
"EV-0045": "/evidence/ev-0045-1971-abstract-title-bp-pension/",
"EV-0046": "/evidence/ev-0046-1972-outline-planning-permission-ownership-certificate/",
"EV-0048": "/evidence/ev-0048-telegraph-open-day-ancient-house/",
"EV-0049": "/evidence/ev-0049-mary-williams-plea-ownership-pleadings/",
"EV-0050": "/evidence/ev-0050-1974-bp-licence-letters/",
"EV-0051": "/evidence/ev-0051-grievous-loss-letter-western-mail/",
"EV-0052": "/evidence/ev-0052-bp-pension-trust-bp-properties-conveyance/",
"EV-0054": "/evidence/ev-0054-ggat-wales-west-roman-villa-letters/",
"EV-0056": "/evidence/ev-0056-neath-guardian-17-april-1980-roman-villa-remains-a/",
"EV-0057": "/evidence/ev-0057-hansard-rowlands-western-ground-rents-bp/",
"EV-0058": "/evidence/ev-0058-ggat-warning-letter-1982/",
"EV-0059": "/evidence/ev-0059-wa231076-form-a13-first-registration/",
"EV-0060": "/evidence/ev-0060-hmlr-notification-after-mary-williams-death/",
"EV-0063": "/evidence/ev-0063-hmlr-wa240304-item-11-form-1c/",
"EV-0065": "/evidence/ev-0065-wa240304-farmhouse-first-registration-file/",
"EV-0066": "/evidence/ev-0066-hmlr-wa240304-item-10-register-1983/",
"EV-0067": "/evidence/ev-0067-mary-doreen-williams-death-index/",
"EV-0068": "/evidence/ev-0068-burnt-relics-years-of-digs/",
"EV-0069": "/evidence/ev-0069-hmlr-wa240304-item-7-d23-1983/",
"EV-0070": "/evidence/ev-0070-hmlr-wa240304-item-4-correspondence-1983/",
"EV-0071": "/evidence/ev-0071-wa231076-1983-84-registration-activity/",
"EV-0073": "/evidence/ev-0073-family-solicitors-litigation-file-1984-87/",
"EV-0078": "/evidence/ev-0078-1987-title-amalgamation-application-plan/",
"EV-0080": "/evidence/ev-0080-bp-properties-v-buckler-judgment/",
"EV-0081": "/evidence/ev-0081-cadw-letter-minister-spot-listing/",
"EV-0089": "/evidence/ev-0089-chainsaw-farmer-vows-fight-on/",
"EV-0093": "/evidence/ev-0093-estates-gazette-1988-bp-welsh-sales/",
"EV-0094": "/evidence/ev-0094-cadw-barn-survey-photo-1988/",
"EV-0095": "/evidence/ev-0095-cadw-farmhouse-survey-photo-1988/",
"EV-0096": "/evidence/ev-0096-cadw-1988-inspection-photographs-listing/",
"EV-0106": "/evidence/ev-0106-tears-flow-farmhouse-razed-1988/",
"EV-0118": "/evidence/ev-0118-smr-record-card-1989-building-destroyed/",
"EV-0126": "/evidence/ev-0126-ggat-archaeological-assessment-great-house-1990/",
"EV-0134": "/evidence/ev-0134-cotswold-archaeological-trust-letter-to-national-m/",
"EV-0136": "/evidence/ev-0136-forest-of-cardiff-woodland-transfer-1994/",
"EV-0147": "/evidence/ev-0147-hmlr-letter-ty-mawr-registration-history/",
"EV-0158": "/evidence/ev-0158-hmlr-n610cgv-letter-wa231076/",
"EV-0161": "/evidence/ev-0161-hmlr-schedule-first-registration-documents/",
"EV-0166": "/evidence/ev-0166-wa735527-title-plan-september-2026/",
"EV-0169": "/evidence/ev-0169-wa735527-title-register-september-2026/",
"EV-0170": "/evidence/ev-0170-wa231076-title-register-september-2026/",
"EV-0216": "/evidence/ev-0216-1965-contract-condition-f-conveyance-25-december-1938/",
"EV-0231": "/evidence/ev-0231-london-gazette-land-registry-notices-llandough-1960-1972/",
"EV-0232": "/evidence/ev-0232-commons-registration-glamorgan-act-1983/",
"EV-0251": "/evidence/ev-0251-companies-house-bp-properties-limited-00699446/",
"EV-0252": "/evidence/ev-0252-tna-os-35-2503-object-name-book-glamorgan-47-nw/",
"EV-0263": "/evidence/ev-0263-commons-registration-1965-publicity-glamorgan-notices-vg41/",
"EV-0265": "/evidence/ev-0265-hmlr-registration-background-compulsory-1975-r29-certificate/",
"EV-0269": "/evidence/ev-0269-tna-wa-9-49-land-authority-for-wales-board-1988/",
"EV-0270": "/evidence/ev-0270-bp-pension-fund-1988-sale-intercontinental-law-llandough-press/"
};
function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
const KIND_STYLE = {
  "Inference": ["INFERENCE", "#FFF4E0", "#7A4B00", "#A56E17"],
  "Theory": ["THEORY", "#E8F0FB", "#0B3D7A", "#0B57A4"],
  "Counter-reading": ["CUTS AGAINST THE CASE", "#FBE9EC", "#7A0B1E", "#C8102E"],
  "Discarded": ["DISCARDED THEORY", "#EEEEEE", "#444444", "#777777"]
};
function restsHtml(list, path) {
  return list.map(function(r) {
    const p = INTERP_EV_PATHS[r];
    if (!p) return esc(r);
    if (p === path) return esc(r) + " (this page)";
    return '<a href="' + esc(p) + '" style="color:#0B57A4;text-decoration:underline">' + esc(r) + '</a>';
  }).join(" · ");
}
export function interpretationHtml(path) {
  const ids = INTERP_PAGES[path];
  if (!ids || !ids.length) return "";
  let out = '<section class="ghf-interpretation" id="interpretation" aria-labelledby="interpretation-h" style="margin:1.8rem 0 .4rem;padding:.9rem .95rem;border:1px solid #CFCAE0;border-left:5px solid #5B566D;background:#F7F6FB;border-radius:6px;overflow-wrap:anywhere">' +
    '<h2 id="interpretation-h" style="margin:0 0 .35rem;font-size:1.15rem">Interpretation: working hypotheses</h2>' +
    '<p style="margin:0 0 .7rem;font-size:.9rem;color:#3a3a3a">Working hypotheses, kept apart from the record above. The record text on this page is unchanged. None of these is a finding: each line is labelled as inference, theory, a reading that cuts against the case, or a discarded theory, and names the evidence it rests on and what would confirm or refute it, so the reader can test it. Updated ' + INTERP_UPDATED + '.</p>';
  let theme = null;
  ids.forEach(function(id) {
    const t = INTERP_THEORIES[id]; if (!t) return;
    if (t.theme !== theme) { theme = t.theme; out += '<h3 style="margin:.9rem 0 .3rem;font-size:1rem">' + esc(theme) + '</h3>'; }
    const k = KIND_STYLE[t.kind] || KIND_STYLE["Inference"];
    out += '<div class="ghf-interp-item" data-interp-id="' + esc(id) + '" data-interp-kind="' + esc(t.kind.toLowerCase()) + '" style="margin:.5rem 0;padding:.55rem .7rem;background:#fff;border:1px solid #E3E0EC;border-left:4px solid ' + k[3] + ';border-radius:5px;font-size:.93rem;line-height:1.5">' +
      '<p style="margin:0 0 .35rem"><span style="display:inline-block;font:700 11px/1.5 Arial,sans-serif;letter-spacing:.03em;padding:1px 7px;border-radius:4px;background:' + k[1] + ';color:' + k[2] + ';margin-right:.35rem">' + k[0] + ' · ' + esc(id) + '</span>' + esc(t.text) + '</p>' +
      '<p style="margin:0 0 .2rem"><strong>Rests on:</strong> ' + restsHtml(t.rests, path) + '</p>' +
      '<p style="margin:0 0 .2rem"><strong>Would be confirmed by:</strong> ' + esc(t.confirm) + '</p>' +
      '<p style="margin:0 0 .2rem"><strong>Would be refuted by:</strong> ' + esc(t.refute) + '</p>' +
      '<p style="margin:0"><strong>Status:</strong> ' + esc(t.status) + '</p></div>';
  });
  return out + '</section>';
}
