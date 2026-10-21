# -*- coding: utf-8 -*-
"""Per-scene analysis for the storyboard. Each scene's title and event (what
happened, in as few neutral words as possible; the narrator reads it) live in
story_source.py; this file holds the two layers shown beneath it.

For every scene id:
  received  the received account: what the unquestioned narrative would have
            people believe occurred and remember
  words     the wordings of the time that reinforce the received account
  known     what we now know the event to be and mean, and what the
            wording truly meant

Parcel A: the farmhouse, buildings, garden and about 10 acres, sold by Bute to
Daniel Thomas in 1877, the Williams family's from 1928. Parcel B: the ~9 acres
of fields Bute kept in 1877, sold to Western Ground Rents in 1938.
story_source.py reads this file; it must hold an entry for every scene.
"""

HG = 'Parcel A (farmhouse, buildings, yard and garden), less the woodland to the north and the land to the south already taken'

ACCOUNTS = {
# ---------------------------------------------------------------- PROLOGUE
'ghf-02000101-1': dict(
    received="",
    words=[],
    known="Heneb's record for the separate Llandough Roman Villa site describes an Iron Age farmstead and a possible round hut, represented by a curvilinear feature and postholes. The pottery indicates a pre-Conquest tradition, but the record does not establish an exact date of c. 200 BC or show that the hut stood on Great House Farm itself."),
'ghf-12000101-1': dict(
    received="An old farmhouse of no special note.",
    words=[('"sub-medieval"', 'A technical dating term, later read as "not old enough to matter".')],
    known="A house of the 17th century or earlier, on a site occupied since the Middle Ages, possibly with a medieval core."),
'ghf-15450101-1': dict(
    received="The lord of the manor owned the farm.",
    words=[('"since 1667"', 'The 1974 newspaper records the Williams family’s occupation of the manorial home; occupation is a separate matter from the lordship and the freehold.')],
    known="Lordship of a manor and ownership of the farmhouse parcel are separate interests. The 1974 newspaper records the Williams family’s occupation of the manorial home since 1667. The family’s title case is not occupation alone: it is that the 1877 bargain entitled the Williamses to Parcel A’s freehold when quarrying ended, identified by Mary as 1928, when the final rent was paid. On that account, the Williamses were virtual freeholders while the quarrying arrangement ran and became freeholders in 1928. The 1877 deed and final receipt have not been located, so the 1928 transfer remains the family’s asserted title history rather than a fact determined by the 1974 newspaper or a court. The manorial sources also differ over 1767–1793; the Herbert estate papers have not yet been checked."),
'ghf-15470620-1': dict(
    received="The Bute estate is the beginning of the land's title.",
    words=[],
    known="The 1547 NLW catalogue entry names a Cydwin farm in the manor of Llandough and a 1,000-year lease from Sir George Herbert to Edmond Vaughan. That is a specific pre-Bute interest and an archival route to follow. It does not yet identify every field with the later Great House boundaries; the lease and its named fields must be compared with D 219 and historic plans."),
'ghf-15520101-1': dict(
    received="A farm let on ordinary leases.",
    words=[],
    known="The farm is on written record from 1552. The 1829 end date belongs to the bundle as a whole, not to the farm, and no event in 1829 is recorded. The individual deeds have not yet been inspected; they should show who granted the leases and on what terms."),
'ghf-15600101-1': dict(
    received="One chain of owners: the Herberts, then the Vaughans, then Bute.",
    words=[],
    known="Two separate lines. The lordship of the manor: Tewkesbury Abbey, the Crown, the Herberts from 1545, Bute from 1793. The ownership of the farm: a freehold within the manor, held by the Vaughans until the late 18th century and by Bute from the early 19th. How the farm passed from the Vaughans to Bute is not yet documented. Parcel A's title descends from the farm freehold, not from the lordship."),
'ghf-16670101-1': dict(
    received="Tenant farmers who lived on someone else's land.",
    words=[('"tenants"', 'The estate\'s description of the family, repeated in every later account.')],
    known="Mary's statement and the 1974 press report support the Buckler case for a connection with Great House from 1667 and treat it as a lineage claim, not a passing tenancy. The affirmative reconstruction now connects that claim to the older Cydwin/Cydfin/Ty Mawr lease records and asks whether later labels of tenancy concealed a longer-standing family interest. The surviving items do not themselves constitute a 1667 conveyance; the deed chain must be reconstructed from the leases, estate accounts, plans and the 1877/1928 evidence."),
'ghf-17400213-1': dict(
    received="The Vaughan lease chain has no relevance once later estate papers call the land Ty Mawr.",
    words=[],
    known="The L 11 catalogue records Edmond Vaughan's 1739/40 assignment of the 1,000-year Cydwin lease to Thomas Mathews for £1,066 13s. 4d. The assignment offers a concrete transfer point for reconstructing the older interest. Follow its named fields and later assignments into the Cydfin/Ty Mawr records and the eventual Bute estate acquisition."),
'ghf-18000101-1': dict(
    received="Bute owned the farm, and everything after descends from Bute.",
    words=[],
    known="The historical account places the manorial lordship in Bute's hands from 1793 and the Great House farm freehold in the early 19th century. The deed that moved the farm freehold from the Vaughan line is the key missing control point. The L 11 lease assignment and D 219 farm records provide older property and tenure references against which Bute's acquisition, rentals and subsequent 1877 division must be tested. The house was also a centre for the Llandough and Leckwith manorial courts; that administrative role must not be confused with ownership of each parcel."),
'ghf-18400101-1': dict(
    received="It was always just a farm.",
    words=[('"Great House Farm"', 'A name that reduced the manor\'s court house to a farmhouse.')],
    known="The first change in how the place was described. Later descriptions, especially \"the whole farm\", decide the case."),
'ghf-18550101-1': dict(
    received="",
    words=[],
    known="One newspaper line, written 49 years later, gives 1855 as the start of John Williams's tenancy and says he took it over from his father; the 1841 tithe already has a John Williams holding about 120 acres at Tŷ Mawr. Against it: the 1904 report calls him \"of Llandough Farm\", the name of the Rees family's separate farm, so reading it as Great House rests on the directories, which put him at \"Great House\" in 1891 and 1901 (an inference, not proof). The Bute rent audits that would confirm 1855 have not been seen."),
# ---------------------------------------------------------------- ACT I
'ghf-18680101-1': dict(
    received="",
    words=[],
    known="Six directories over 33 years put the same John Williams at Great House and the Rees family at Llandough Farm, so the two farms, and the two families, were distinct. Against it: directories copy from one edition to the next and record what the compiler was told; none uses the name \"Home Farm\"; and the press of 1895 and 1904 sometimes calls a Williams \"of Llandough Farm\", so that name in a source does not always mean the Rees farm."),
'ghf-18700101-1': dict(
    received="Family folklore.",
    words=[('"reported"', 'The word the records use, which keeps it at a distance.')],
    known="An account on public record since 1974, never investigated before the house was demolished."),
'ghf-18700101-2': dict(
    received="William Evans Williams left his fortune to Bute, so the land history is settled.",
    words=[],
    known="The catalogued 1870 will is a lead to the estate's disposition, not a parcel schedule for Great House Farm. Test whether land or rights connected with Llandough's 33-acre limeworks block appear in William Evans Williams's title papers, rentals or correspondence. The reported Clock Tower dispute should be linked to its exact contemporary newspaper source before it is used to characterise the relationship."),
'ghf-18760101-1': dict(
    received="Part of the farm let for quarrying.",
    words=[],
    known="The archive lead identifies a 33-acre quarrying block in Bute records from 1876 to about 1912, but its exact parcel and chain of authority need to be established from D153/4–8, the 1877 plan and the estate schedules. The key affirmative question is who held the underlying freehold and who merely let or administered the quarrying rights."),
'ghf-18770101-1': dict(
    received="Nothing changed: Bute went on owning the farm, and the Williamses went on renting it.",
    words=[],
    known="On Mary's statement, from 1877 there are two parcels with two owners: Parcel A, the house, owned by Thomas; Parcel B, the fields, kept by Bute. Anything Bute sells after 1877 can only be Parcel B. Her statement says the freehold of the house was to pass to the Williamses when quarrying ended. The deed is missing; the wiki notes that whether the 1877 deal was a sale or a quarry lease is still to be tested against the Bute papers."),
'ghf-18810403-1': dict(
    received="",
    words=[('"Llandough Home Farm"', 'The enumerator\'s label. No other source found uses it: no newspaper (Welsh Newspapers Online, 1804–1919), directory or Ordnance Survey map.')],
    known="The household is the John Williams whom the directories place at Great House before and after 1881. The Rees family were at Llandough Farm. On identity the record supports Sion Buckler's reading. Against it: \"Home Farm\" appears nowhere else, so it cannot be offered as a second name for the farm; and the acreage is hard to read: 170 would fit Llandough Farm (166 acres in 1824–32) better than Great House (about 120 acres in the 1841 tithe), while 120 fits Great House. Folio and enumeration district: source pending. EV-0223 records a different, dictated reading of the farm name that this page does not show."),
'ghf-18890811-1': dict(
    received="A minor court report.",
    words=[('"the property of John Williams"', 'The apples were his; the report is silent on who owned the land.')],
    known="VERIFIED (Barry Dock News, 16 August 1889, read on Welsh Newspapers Online; EV-0279). Contemporary record that John Williams held Great House Farm in 1889, with his grown son John Williams junior working it, and that the orchard lay against a railway hedge."),
'ghf-18911111-1': dict(
    received="A minor court report.",
    words=[],
    known="Contemporary proof that John Williams lived at the house in 1891."),
'ghf-19080101-1': dict(
    received="John Williams became the tenant of the farm.",
    words=[('"the tenant"', 'Singular, as if there were one tenancy of one farm.')],
    known="Two tenancies from two landlords: Parcel A from the Thomases, Parcel B from Bute."),
'ghf-19130810-1': dict(
    received="A tenant's daughter.",
    words=[],
    known="The owner of Parcel A from 1928 by her family's title. She lived in the house until her death in 1983."),
'ghf-18641223-1': dict(
    received='',
    words=[('"relict of the late Mr. John Williams, Great House farm"', 'The notice\'s own words: the elder John Williams was dead by December 1864, and was remembered as "of Great House farm".')],
    known='VERIFIED (two contemporary death notices, read on Welsh Newspapers Online). They fit the 1904 report that the younger John Williams "succeeded his father in the tenancy of the farm in 1855". Not yet found: the elder John Williams\'s own death or burial entry, and Amy\'s maiden name.'),
'ghf-18920101-1': dict(
    received='',
    words=[],
    known="VERIFIED that the 1892 messages were reported in 1897 in Preece's own words (South Wales Daily Post, 5 June 1897). The details (wire lengths, 3.3 miles, the failed attempt to Steep Holm) are SECONDARY, from Fahie's history of 1899/1901. This is the Lavernock background to Marconi."),
'ghf-18940731-1': dict(
    received='',
    words=[],
    known='VERIFIED (two newspapers, 3 August 1894). Most likely the John Williams whom the directories place at Great House Farm, Llandough (1868–1901). Against it: there is another Great House at Llandough near Cowbridge, and the report pairs Llandough with Rhoose, so the parish is not certain. The herd of 22–23 pigs shows a working farm.'),
'ghf-18970501-1': dict(
    received="Marconi's Welsh trials were a Post Office affair.",
    words=[('"Mr. Williams (of the engineering department, Cardiff)"', 'The only Williams in any 1897 report read. He is a Post Office engineer in Cardiff. No initial or address is given.')],
    known='VERIFIED: the trials, the date (Evening Express, 15 May 1897, p.4) and "Mr. Williams (of the engineering department, Cardiff)". The wiki\'s undated cutting EV-0011 is that Evening Express report; the same text is in the Western Mail of the same day. Sion Buckler\'s position (request to The National Archives, 16 July 2026) is that this Mr Williams was his forebear Mr Williams of Great House Farm, that Marconi stayed with the family at the farm in 1897, and that Thomas Williams of Great House carted Marconi\'s equipment. Link to Great House: evidence being added. The photograph that the wiki\'s Media Gallery captioned "Marconi wireless telegraph at Great House Farm" (caption corrected 19 October 2026) is the Flat Holm photograph of 13 May 1897 (see 13 May). Next records: Post Office establishment books (BT Archives, POST 59) for a Williams in the Cardiff engineering district in 1897; the 1901 census.'),
'ghf-18970510-1': dict(
    received='',
    words=[],
    known="SECONDARY (Fahie, 1899/1901, from Preece's account). No 1897 newspaper read here mentions 10 May."),
'ghf-18970511-1': dict(
    received='',
    words=[],
    known='VERIFIED that Tuesday 11 May went badly (Evening Express, 15 May 1897). Fahie says 11 and 12 May both failed, but the Evening Express calls Wednesday and Thursday "most satisfactory". The 1947 plaque gives 11 May as the day messages were first exchanged with Flat Holm. The sources conflict on 11–13 May.'),
'ghf-18970513-1': dict(
    received='Marconi sent the first radio message over open sea, from Lavernock to Flat Holm, on 13 May 1897.',
    words=[('"Are you ready?"', 'A later account of the first words. Another later account gives "CAN YOU HEAR ME" and "YES LOUD AND CLEAR". No 1897 source read here records the words.')],
    known='VERIFIED: success by midweek (Evening Express: Wednesday 12 and Thursday 13 May "most satisfactory"); Preece, Gavey and Fardo present. SECONDARY: the date 13 May, the 20 extra yards of wire, and Slaby\'s presence (Fahie). Direction: in Preece\'s account (via Fahie) Flat Holm sent and Lavernock received; some modern accounts reverse it. The photograph is captioned by its source as Flat Holm, 13 May 1897. Its date and place rest on that caption. Link to Great House: evidence being added.'),
'ghf-18970514-1': dict(
    received='',
    words=[],
    known='VERIFIED (Evening Express, 15 May 1897; Carnarvon and Denbigh Herald, 21 May 1897). The guests are not named.'),
'ghf-18970518-1': dict(
    received='',
    words=[],
    known="VERIFIED: the 18 May date, the kite at 220 ft and Marconi's signature are all on the framed tape, as transcribed by the South Wales Echo on 27 May 1897. The Echo of 20 May has messages going from Brean Down to Lavernock that week; the tape reads Lavernock to Brean Down. Fahie dates the Brean Down link to the day after the Flat Holm success. Brean Down is in Somerset and is included only as the far end of the Welsh link."),
'ghf-18970527-1': dict(
    received='',
    words=[],
    known="VERIFIED. Not found: the day Marconi left South Wales. The last Welsh press notice of the work found is the South Wales Echo of 20 May 1897. In 1897 Marconi's next move was to London, and then Italy (Spezia trials, 10–18 July 1897, per Fahie)."),
'ghf-19070401-1': dict(
    received='',
    words=[],
    known='VERIFIED (two notices). The reports do not name the farmer.'),
'ghf-19080106-1': dict(
    received='',
    words=[],
    known="VERIFIED (Evening Express, 10 January 1908). The keepers are not said to be the farm's own. John Williams of Great House died later in 1908 (EV-0243)."),
'ghf-19470101-1': dict(
    received='',
    words=[],
    known="SECONDARY: the plaque's wording is from a published transcription, and the BBC gives the unveiling as 1948. It names George Kemp."),
# ---------------------------------------------------------------- ACT II
'ghf-19160201-1': dict(
    received="The Williamses were yearly tenants of the whole farm from 1916, and every later right flows from that tenancy.",
    words=[('"the whole farm"', 'Quoted by the Court of Appeal in 1987 as the start of the history.'), ('"since 1916"', 'The European Commission\'s date for the family\'s occupation.')],
    known="In 1916 Bute owned only Parcel B. It could not let the house, which Thomas owned. \"The whole farm\" is a landlord's description of land it did not own: the birth of a single, synthetic farm that existed only on paper. Every later case was fought over that synthetic farm."),
'ghf-19280101-1': dict(
    received="Nothing happened in 1928. The tenancy of the whole farm carried on.",
    words=[],
    known="On Mary's statement, the bargain of 1877 came due: the quarrying ended and the freehold of the house passed to the Williamses, and they never paid rent on it again. The wiki treats 1928 as the strongest evidence-based date for the Williams freehold. The freehold line of the house: the Vaughans, then Bute (by the early 19th century), then Daniel Thomas (1877), then the Williamses (1928)."),
'ghf-19360101-1': dict(
    received="Frederick joined the tenant family on the farm.",
    words=[],
    known="Frederick married into the house, which was Mary's family's. His later tenancy was of the fields only."),
'ghf-19380101-1': dict(
    received="Western Ground Rents bought the farm, and became the Williamses' landlord for all of it.",
    words=[('"the reversion"', 'Read later as the reversion on the whole farm.')],
    known="Bute could only convey what it owned: Parcel B and its landlord's interest in the fields. Western Ground Rents acquired no deed to Parcel A, then or ever."),
'ghf-19390501-1': dict(
    received="A renewal of the farm tenancy.",
    words=[],
    known="The plan shows the fields east of the house only: Parcel B. The landlord's own document leaves the house out. It is the last written tenancy."),
'ghf-19400101-1': dict(
    received="Not an event. The family were tenants throughout.",
    words=[],
    known="Twelve years' rent-free possession from 1928 gives the family title to Parcel A by possession by 1940, in addition to the 1877–1928 title. The wiki notes this depends on what title the Thomases held. On either footing, from 1940 there was no basis for treating the family's occupation of the house as permission from Western Ground Rents, which never owned it."),
'ghf-19440101-1': dict(
    received="The tenant farm was failing.",
    words=[],
    known="Frederick managed the fields, Parcel B."),
'ghf-19480101-1': dict(
    received="",
    words=[],
    known="Mary's son and heir, who defended the house in court and was evicted in 1988."),
# ---------------------------------------------------------------- ACT III
'ghf-19490202-1': dict(
    received="Frederick became the tenant of the farm, and the family lived in the farmhouse under his tenancy.",
    words=[('"the farm"', 'Used for Frederick\'s tenancy in every later account.')],
    known="An unwritten tenancy of the fields, Parcel B. Mary was not a party and rejected any suggestion that the house was in it; she then held the paper title to Parcel A. Describing it as a tenancy of \"the farm\" was the first attempt to make her occupation of her own house look permissive."),
'ghf-19500601-1': dict(
    received="If the family ever had documents, they could not produce them.",
    words=[('"No such documents were, however, ever produced."', 'Court of Appeal, 1987.')],
    known="The papers that proved the family's title, kept in a blanket box, were carried out of the house by a lodger an estate agent had placed under their roof, and handed to that agent. It happened a year after Mary refused a tenancy of the farmhouse and asserted ownership, and within three years of the landlord's first court case; Mary believed the two were connected. For the rest of her life she was told to produce documents that had been taken from her. The title was never extinguished. Only its proof was taken."),
'ghf-19521010-1': dict(
    received="The tenant stopped paying rent on the farm.",
    words=[],
    known="Rent stopped on the fields, Parcel B. No rent had been paid on Parcel A since 1928."),
'ghf-19550202-1': dict(
    received="The landlord recovered the farm in 1955; the family stayed on in the house only through the landlord's forbearance, and from 1955 their occupation was adverse to the landlord.",
    words=[('"the whole of the farm"', 'The order\'s description, quoted in 1987.'), ('adverse possession from 1955', 'The clock the courts later counted on the house.')],
    known="An order against a tenant of the fields can only give back the fields, and that is what was taken. Mary was not a party and was never heard. She had just come home from hospital and stood her ground for her house. Any clock that started in 1955 was a clock on the fields. That the order reached the house was an insinuation, later read as fact. Per the Buckler case, the woodland of Parcel A was taken in 1955 too, passing to a couple in Llandough and later to the Forest of Cardiff. (SOURCE PENDING: not yet recorded on the wiki.)"),
'ghf-19580506-1': dict(
    received="She did not oppose Cardiff's plan.",
    words=[('"did not oppose"', 'Cut short, it reads as consent. The full sentence is conditional: "so long as it applied only to playing fields".')],
    known="VERIFIED (Western Mail OCR, EV-0035; London Gazette, EV-0287). Her statement was conditional on recreational use, the order was made under the playing-fields statute, and it concerned Leckwith Common, not Parcel A."),
'ghf-19581119-1': dict(
    received="",
    words=[],
    known="The only record of the time so far that the water was cut off: Mrs Buckler's own claim in 1958, as the Western Mail reported it. It names the landlord, Western Ground Rents, not a council. Crichel Down (1954) was the national scandal over farmland the state kept after requisition; a minister resigned over it. \"Nearly 10 years\" would put the start around 1948–49 (an inference). Per Branwen Buckler (voice testimony, relayed by Sion Buckler, 19 October 2026), the council cut the water over bills it said were unpaid, which Mary (Nancy) Williams insisted had been paid; dairy cattle drowned in the River Ely trying to reach water, a baby daughter had to live elsewhere, and the matter was raised in Parliament. What cuts against that version: the 1958 report names Western Ground Rents, not a council or a water bill; no report of cattle drowning has been found; no Commons or Lords debate or written answer has been found for 1946–92 (committee proceedings and MPs' letters are not searchable this way); and Dŵr Cymru's 2026 replies speak of a disconnection in the 1980s, so there may have been two cut-offs. The article has been read only as search snippets; the full page is still to be obtained."),
'ghf-19590101-1': dict(
    received="The landlord offered the occupier a tenancy, and she refused it.",
    words=[('"the farmhouse and garden"', 'The landlord\'s description of what it offered to let.')],
    known="\"The farmhouse and garden\" is " + HG + ". The landlord named the house parcel on its own, which shows it knew it was separate. An owner does not need its occupier to accept a tenancy. Third attempt to make her occupation look permissive."),
'ghf-19610329-2': dict(
    received="A deed of 1961 is part of how the woodland left the farm.",
    words=[('"deed"', 'Known only from a recital on the woodland register. The deed itself has not been seen.')],
    known="PENDING (EV-0040). Parties: Western Ground Rents, South Western Brick & Tile Co Ltd, Cardiff City Corporation. Land and effect unknown until the deed and plan are read."),
'ghf-19621211-1': dict(
    received="The court confirmed the landlord's right to the house in 1962, and that order kept the landlord's title alive.",
    words=[('"the farmhouse and garden"', 'Again named on its own.'), ('"mesne profits since 1955"', 'Money for occupation, as if the house had been the landlord\'s since 1955.')],
    known="A possession order, not a decision on title. It treated Mary as holding over from a tenancy she was never in. No deed to the house was proved, because Western Ground Rents had none. It was left unenforced, and in 1987 it was used to stop the clock. Fourth attempt."),
'ghf-19630601-1': dict(
    received="A tenant in arrears was pursued for the money.",
    words=[],
    known="The money was enforced; possession of the house was not."),
'ghf-19650301-1': dict(
    received="Another offer refused by an occupier with no title.",
    words=[('"Mrs Williams"', 'Offered as to a tenant.')],
    known="The same offer as 1959. The estate's own records treat her occupation as adverse from this date. Fifth attempt. An owner holding a deed would sue on it; Western Ground Rents never did."),
'ghf-19640101-1': dict(
    received="",
    words=[],
    known="What was sold, if anything, is unknown."),
'ghf-19670101-1': dict(
    received="The tenant died; his widow stayed on.",
    words=[('"widow"', 'As though her right in the house came through him.')],
    known="The only tenant there had ever been, of the fields, died. Mary remained the owner in occupation of Parcel A."),
# ---------------------------------------------------------------- ACT IV
'ghf-19691231-1': dict(
    received="BP bought Great House Farm. This deed is the root of BP's title.",
    words=[('"Great House Farm"', 'One estate, in one phrase.'), ('"root of title"', 'How BP\'s later deeds recite it.')],
    known="By deed, Parcel B passed (Bute, Western Ground Rents, BP). For Parcel A there was no deed to pass; what passed was the 1962 order and the case against Mary. The root deed is now missing."),
'ghf-19720725-1': dict(
    received="Ordinary planning of an under-used farm.",
    words=[('"the site"', 'Both parcels treated as one development site.')],
    known="Permission was granted over a house whose ownership was disputed, while its owner lived in it. In 1990 a condition of the outline permission provided for a 0.25-acre village green beside the site. Per the Buckler case, the land south of the farmhouse, part of Parcel A, was taken by the council and laid out as a green in the 1980s. (SOURCE PENDING: not yet recorded on the wiki.)"),
'ghf-19740101-1': dict(
    received="A routine, incomplete survey.",
    words=[],
    known="A public body recorded in 1974 that the ownership of the house was disputed."),
'ghf-19740415-1': dict(
    received="A campaign to save an old building.",
    words=[('"valid claim"', 'Reported as a claim, not a title.')],
    known="A woman of sixty, who had lost a leg, opened her home to the nation. Hundreds came. A thousand signed. She told a national newspaper the house was hers. The public stood with Mary. It changed nothing."),
'ghf-19740703-1': dict(
    received="An action that went nowhere.",
    words=[('"part-heard"', 'Treated afterwards as if nothing had been decided because nothing needed deciding.')],
    known="The only time Mary's title to Parcel A was put before a court. It was never decided, and so never extinguished. Her statement set out the two parcels; no lawyer of hers ever built a case on it."),
'ghf-19741031-1': dict(
    received="BP kindly let an elderly, ill woman stay in the house rent free.",
    words=[('"licence"', 'BP\'s letters, as the courts later described them.'), ('"because of her ill health"', 'BP\'s explanation to the press in 1988.')],
    known="A woman in a wheelchair, who had lost a leg, was told by an oil company's pension fund that she could stay in her own house under licence. She never asked for it. She never accepted it. It arrived while her claim to own the house stood undecided before the county court. Thirteen years later the Court of Appeal relied on it to give BP possession."),
'ghf-19741119-1': dict(
    received="A local antiquarian's objection.",
    words=[],
    known="The chain of title and the site's importance were in print before the demolition."),
'ghf-19750523-1': dict(
    received="An internal transfer within the BP group.",
    words=[('"the actual conveyance of the farmhouse and garden"', 'Court of Appeal, 1987.')],
    known="A conveyance of Parcel A between two BP companies, while Mary lived in it and claimed it, with no earlier deed to Parcel A behind it. It shows BP treated the house as a separate parcel. From here the synthetic Parcel A has a deed."),
'ghf-19800522-1': dict(
    received="",
    words=[],
    known="Western Ground Rents, which brought the 1955 and 1962 actions, and BP, which relied on them, were by 1980 the same group."),
'ghf-19821001-1': dict(
    received="Routine archaeological advice.",
    words=[],
    known="The warning that came true in 1994."),
'ghf-19821119-1': dict(
    received="BP registered the land it owned.",
    words=[('"registered proprietor"', 'The status the courts later relied on.')],
    known="Nothing on the file shows the occupier being asked what she claimed."),
'ghf-19830223-1': dict(
    received="A routine second registration.",
    words=[('"no question or doubt"', 'The solicitors\' certificate.')],
    known="The synthetic Parcel A became a registered title. The certificate was given while the owner who had pleaded ownership in 1974 lived in the house. The Land Registry now held the fields and the house as two titles: it knew they were two."),
'ghf-19830326-1': dict(
    received="The licensee died and the licence ended.",
    words=[('"licensee"', 'How BP would describe her.')],
    known="She died in the house she was born in, aged sixty-nine, still saying it was hers. She never signed a tenancy, never accepted a licence, and was never once heard on whether the house was her own."),
'ghf-19830408-1': dict(
    received="Routine registration correspondence.",
    words=[],
    known="What the Registry asked about the occupiers, and what it was told, is in these letters. The family have asked for them."),
# ---------------------------------------------------------------- ACT V
'ghf-19840522-1': dict(
    received="BP, the owner, sued to recover its land from a squatter.",
    words=[('"Great House Farm and adjoining land"', 'The writ\'s description.'), ('"adverse possession"', 'The only defence argued.')],
    known="The house was wrapped back into \"the farm\" a year after BP registered it separately. BP asked for possession, not a declaration of ownership. The defence fought on BP's map: adverse possession of a synthetic farm whose real owner's title was to Parcel B only, with the clock counted from 1955, when the family's title to Parcel A dated from 1928 and by possession from 1940. In the same year the library copy of the 1877 deed was reported missing."),
'ghf-19860710-1': dict(
    received="The court found that BP owned the house and the family were there by BP's permission.",
    words=[('"licence"', 'The finding.')],
    known="The court decided possession. The question of who owned Parcel A was not put to it, and the 1877, 1928 and 1939 documents were not before it."),
'ghf-19860711-1': dict(
    received="",
    words=[],
    known="A record of Mary's own account to a public body was lost while the case was live."),
'ghf-19870202-1': dict(
    received="An administrative tidying of the register.",
    words=[('"amalgamation"', 'The register\'s term.')],
    known="The registration history shows two separately registered titles before the 1987 amalgamation: a larger field title and a later house title. The affirmative synthetic-estate thesis is that a corporate register view was assembled from separate strands while the older Cydwin/Cydfin and Williams/Thomas provenance remained untraced. The decisive exercise is to compare the first-registration files and the operative 1877, 1938 and 1969 instruments against the plans and schedules. The label 'synthetic' describes this unresolved reconstruction, not a statutory finding."),
'ghf-19870731-1': dict(
    received="The courts finally settled that BP owned Great House Farm.",
    words=[('"the paper title to the farm"', 'The court\'s description of BP\'s position.'), ('"No such documents were, however, ever produced."', 'On Mary\'s title documents.'), ('"since November 1982 they have been the registered proprietors"', 'The court\'s recital.')],
    known="The court decided possession, not ownership. It counted the clock from 1955, from an order about the fields; counted from 1928, it had run out in 1940. BP's paper title was to the fields; for the house it had only a deed between two BP companies, which the court itself called the conveyance of the farmhouse and garden. Mary's documents were not produced because they had been taken from her. The family lost in the High Court, lost on appeal, and were refused by the Lords. Every defeat was on who may live in the house. Nobody ever asked who owned it."),
'ghf-19880303-1': dict(
    received="The end of the legal road.",
    words=[],
    known="The end of the possession case. Ownership of Parcel A had still never been decided."),
# ---------------------------------------------------------------- ACT VI
'ghf-19880429-1': dict(
    received="An occupier resisting a lawful order.",
    words=[],
    known="Possession was being enforced over a house whose ownership no court had decided."),
'ghf-19880429-2': dict(
    received="The \"chainsaw farmer\": a violent squatter.",
    words=[('"chainsaw farmer"', 'The headline.'), ('"because of her ill health"', 'BP\'s account of 1974.')],
    known="Billy was a father with his three small children behind a door an axe had just come through. The papers called him the chainsaw farmer. Nobody called the men with the axes anything at all. He was defending his home, on land his family had owned since 1928 and lived on since 1667."),
'ghf-19880512-1': dict(
    received="",
    words=[],
    known="Both were pending when the house was demolished."),
'ghf-19880729-1': dict(
    received="Cadw looked at the house and found it not good enough to list.",
    words=[],
    known="Two photographs survive. There is no file, no notes and no record of who decided."),
'ghf-19881130-1': dict(
    received="The lawful owner recovered possession.",
    words=[('"possession"', 'What BP was given.')],
    known="Billy was hurt and taken to hospital. Eight people lost their homes with the family that day. A family that had lived in the house for three hundred and twenty-one years was put out in an afternoon, by an order that never said whose house it was."),
'ghf-19881201-1': dict(
    received="",
    words=[],
    known="Mary's photographs, the family heirlooms, the papers, everything left of three centuries, in the house or in the road. Whatever remained of the family's own records went with it."),
'ghf-19881202-1': dict(
    received="",
    words=[],
    known="The injunction lasted three days."),
'ghf-19881209-1': dict(
    received="The violent squatter was charged.",
    words=[],
    known="He was taken from his hospital bed and charged. With Billy in hospital, then in the dock, then bailed away from the site, there was no one left standing between BP and the house. Within three days it was gone."),
'ghf-19881203-1': dict(
    received="Cadw gave the house fair consideration.",
    words=[],
    known="Cadw had already coded the house just below the bar in July."),
'ghf-19550318-1': dict(
    received="The forest taken in 1955 was the farm's own woodland.",
    words=[('"bought … for a nominal sum in 1942"', "How the Western Mail describes Cardiff's acquisition of Leckwith Woods.")],
    known="The 1955 lease concerns Cardiff's Leckwith Woods, which measures wholly outside Llandough; the woods near the farm are Coed Creigiaidd and Reservoir Wood."),
'ghf-19751201-1': dict(
    received='Every transfer of the farm had to be registered at once.',
    words=[],
    known='Registration became compulsory in the Vale only on 1 December 1975, so the earlier conveyances were not void for want of registration. The Gazette notice series ended about May 1975, so the absence of a 1982–83 notice is not evidence of concealment.'),
'ghf-19881007-1': dict(
    received='The land around the farm was quietly handed to the state.',
    words=[('"from Lavernock [to] Leckwith including plots at Llandough"', 'South Wales Echo, 1 November 1988, on the Land Authority for Wales purchase.')],
    known="The buyer was a private joint venture chosen by open tender; LAW then bought plots. The farm site itself stayed with BP Properties Ltd. LAW's Board minutes for the period are open at Kew (not yet seen)."),
'ghf-19890406-1': dict(
    received='The 1988 survey had already been decided and published before the demolition.',
    words=[('"assessed and rejected for listing in the 1988 community survey of Llandough"', 'Cadw, 21 May 2026.')],
    known="The survey's list bears dates in April 1989, after the demolition. That timing is our reading of the dates, not Cadw's statement. The survey itself looks routine: the whole village, three buildings listed."),
'ghf-19900223-1': dict(
    received='Nobody locally questioned the development.',
    words=[('"No objection has been made by Llandough Community Council"', 'South Wales Echo, 23 February 1990 (snippet).')],
    known="The council did not object to the housing but wanted a village green. Snippet only; the full page and the council's minutes (free at Glamorgan Archives) are still to be read."),
'ghf-19970516-1': dict(
    received='Western Ground Rents simply faded away.',
    words=[('"how … the property of the Companies have been disposed of"', "The liquidator's s.94 notice, London Gazette, 18 April 1997.")],
    known="A solvent group winding-up. The liquidator's account (in the TNA BT 31 files) would show what WGR still held and where it went."),
'ghf-19881204-1': dict(
    received="Cadw judged the house from the outside and found nothing worth listing.",
    words=[('"the roof beams being high"', 'What the Cadw officers remarked inside the house, as Branwen recalls (statement of 19 October 2026).')],
    known="Cadw officers came inside the house and looked at its fabric, roof beams included (witness statement of Branwen, 19 October 2026). Cadw confirms the house was visited and assessed by its inspectors, but holds only two photographs of 29 July 1988: no survey, no notes, no report and no record of the officers. The date of the visit Branwen describes is source pending; our case is that it fell in the days before the 5 December 1988 refusal."),
'ghf-19881205-1': dict(
    received="The house was not worth listing, and the courts had ruled.",
    words=[('"not of sufficient architectural merit"', 'Cadw, 5 December 1988.')],
    known="On the same day, both doors closed: the court refused to wait for Strasbourg, and Cadw refused to list. Nothing now protected the house, and everyone knew it."),
'ghf-19881206-1': dict(
    received="An old farmhouse of no special merit was cleared for housing.",
    words=[('"Bulldozed before breakfast"', 'The headline.'), ('"suddenly and completely destroyed"', 'The Royal Commission\'s archive record (NMR 6048945).')],
    known="At four in the morning, in the dark, before anyone could stop it. Branwen and her three small children watched their home come down. A thousand people had signed to save it. An MP had asked for the case to be looked at again. Strasbourg had not yet heard it. None of it mattered by breakfast. The house was destroyed before it was ever fully recorded. The title to Parcel A was not destroyed with it."),
'ghf-19881208-1': dict(
    received="",
    words=[],
    known="He was barred from the land his family had owned."),
'ghf-19881212-1': dict(
    received="A minor record of a lost farmhouse.",
    words=[],
    known="Evidence of a house of quality, recorded only after it was destroyed."),
# ---------------------------------------------------------------- ACT VII
'ghf-19890320-1': dict(
    received="",
    words=[],
    known=""),
'ghf-19890323-1': dict(
    received="",
    words=[],
    known=""),
'ghf-19890325-1': dict(
    received="",
    words=[],
    known="The family who had lived in the Great House for three centuries were now planning to live in a bus."),
'ghf-19890414-1': dict(
    received="Strasbourg confirmed the eviction was lawful and the property was BP's.",
    words=[('"the property belonged to another"', 'The Commission\'s reading of the domestic judgments.')],
    known="Strasbourg relied on the British courts, which had decided possession, not ownership. It never saw a title deed. Another loss, on a question nobody had ever asked."),
'ghf-19891107-1': dict(
    received="Routine planning with archaeological advice.",
    words=[],
    known="The adviser to the council became the developer's contractor on the same site."),
'ghf-19900313-1': dict(
    received="",
    words=[('"unfortunately demolished"', 'The officer\'s report.')],
    known="The Local Plan had required the buildings to be kept. No preservation notice had been served."),
'ghf-19900801-1': dict(
    received="",
    words=[('"low potential"', 'GGAT\'s zoning.')],
    known="The 1994 excavation found burials in the area marked low potential."),
'ghf-19910821-1': dict(
    received="",
    words=[],
    known=""),
'ghf-19920514-1': dict(
    received="",
    words=[],
    known="BP had not yet transferred the land to Ideal Homes."),
'ghf-19900529-1': dict(
    received="",
    words=[],
    known="He was in his forties. He died in the village where he was born, without his home, without ever having had the one question that mattered answered. Mary's claim to the house passed, undecided, to his children."),
'ghf-19920727-1': dict(
    received="",
    words=[],
    known=""),
'ghf-19920903-1': dict(
    received="",
    words=[],
    known=""),
'ghf-19931203-1': dict(
    received="BP sold its land to a developer.",
    words=[('"a difference of opinion"', 'The council to the MP.')],
    known="The merged title, including the synthetic Parcel A, passed to a buyer as though it were one parcel."),
'ghf-19940504-1': dict(
    received="A successful rescue excavation.",
    words=[('"preservation by record"', 'The agreed basis of the excavation.')],
    known="The largest early medieval burial population then recovered in Wales, from ground marked low potential in 1990."),
'ghf-19940728-1': dict(
    received="The landowner donated the finds.",
    words=[('"as landowner"', 'The basis of the gift.')],
    known="Ownership of finds follows ownership of land. The finds from Parcel A were given away on the strength of the merged title."),
'ghf-19941110-1': dict(
    received="",
    words=[],
    known="The Forest of Cardiff says it bought the woodland in 1994. Per the Buckler case, this woodland, part of Parcel A, had been taken in 1955, and the charity has not used it. (SOURCE PENDING: not yet recorded on the wiki.)"),
'ghf-20051202-1': dict(
    received="The woodland charity sold a piece of land at Leckwith Road.",
    words=[('"Sale of Land"', 'The charity\'s own accounts. The land was not on its balance sheet.')],
    known="HELD (EV-0217, Companies House). £20,000 received in the year to 30 June 2006. Which land, and how the charity came to hold it in 1994, are open questions."),
'ghf-20050101-1': dict(
    received="",
    words=[],
    known="The publication does not mention the family or the house's demolition."),
'ghf-20190320-1': dict(
    received="",
    words=[],
    known="Twenty-nine years after it was written."),
# ---------------------------------------------------------------- ACT VIII
'ghf-20251117-1': dict(
    received="",
    words=[],
    known=""),
'ghf-20260323-1': dict(
    received="The register is right.",
    words=[('"no evidence of a mistake in the register"', 'HMLR, 23 March 2026.')],
    known="The reply treats the farm as one holding, as the 1916 wording did, and does not explain how Parcel A entered BP's title."),
'ghf-20260419-1': dict(
    received="The matter has been examined and closed.",
    words=[('"registered correctly"', 'HMLR, 25 May 2026.')],
    known="The decisions rely on the 1987 judgment, which decided possession, to answer a question of ownership."),
'ghf-20260521-1': dict(
    received="The house was assessed and narrowly failed.",
    words=[('"marginally below the bar"', 'Cadw\'s reading of YYY.')],
    known="There is no record of the file's destruction."),
'ghf-20260730-1': dict(
    received="",
    words=[],
    known="The deed recited as the root of BP's title is not on file. No document on file conveys Parcel A to Western Ground Rents or BP."),
'ghf-20260825-1': dict(
    received="",
    words=[('"not held"', 'Museum Wales.')],
    known=""),
'ghf-20260908-1': dict(
    received="",
    words=[],
    known="A payment by Daniel Thomas recorded in that book would document the 1877 sale of Parcel A."),
'ghf-20260917-1': dict(
    received="",
    words=[],
    known="The statement contradicts the Registry's own history."),
'ghf-20260923-1': dict(
    received="",
    words=[],
    known=""),
'ghf-20260925-1': dict(
    received="",
    words=[],
    known="The woodland is part of Parcel A."),
'ghf-20260927-1': dict(
    received="",
    words=[],
    known=""),
'ghf-20260929-1': dict(
    received="",
    words=[],
    known="Both were on record before the demolition."),
'ghf-20261006-1': dict(
    received="",
    words=[],
    known="No deed has been produced by which Parcel A passed from the Williamses, or from anyone, to BP."),
'ghf-20261019-1': dict(
    received="",
    words=[],
    known="The Welsh Government found no file for the 1988 purchase under the names searched and points to a retention schedule without dating any destruction; Cadw declined to search again. Neither reply says whether a file existed, when it ended, or who decided. SOURCE PENDING for the Land Authority for Wales file itself (EIR request held for verification)."),
# ---------------------------------------------------------------- STATING THE OBVIOUS
'ghf-obvious-01': dict(
    received="A squatter was evicted after losing in court.",
    words=[["\"squatter\"", "How the case was understood in the press and in the street."]],
    known="A squatter moves into a place that is not theirs. The Williamses were born in this house, married in it and died in it for three hundred and twenty-one years. On Mary's statement they owned it from 1928, and on the family's case by possession from 1940. Nobody who lives somewhere for three centuries is a squatter."),
'ghf-obvious-02': dict(
    received="She lived there by the landlord's permission.",
    words=[["\"licence\"", "1974; relied on in 1986 and 1987."]],
    known="You cannot be given permission you refuse. Every offer of a tenancy, and the licence, was an attempt to turn an owner into a guest in her own house. She said no every time."),
'ghf-obvious-03': dict(
    received="BP owned the farm.",
    words=[["\"the paper title to the farm\"", "Court of Appeal, 1987."]],
    known="If Western Ground Rents or BP had a deed to the house, they would have produced it at the first hearing and the case would have been over in a day. They used tenancy offers, orders, a licence and their own conveyance instead. People with deeds don't need tricks."),
'ghf-obvious-04': dict(
    received="It was always one farm.",
    words=[["\"the whole farm\"", "1916 onwards."]],
    known="You cannot merge two titles unless there are two. BP knew. The Land Registry knew. The court read a separate conveyance of the farmhouse and garden. The only people never told what that meant were the family."),
'ghf-obvious-05': dict(
    received="They lost every case, so they must have been wrong.",
    words=[["\"lost\"", "Every headline."]],
    known="They lost every round of an argument about who could live in the house. Nobody ever asked who owned it. You can lose a hundred times on the wrong question and still be right about the real one."),
'ghf-obvious-06': dict(
    received="A violent man was arrested and charged.",
    words=[["\"chainsaw farmer\"", "The headline."]],
    known="He physically stood in their way, so he was removed: to hospital, to the dock, then barred from the site by his bail. With him out of the way there was nobody left between BP and the house. It came down within the week."),
'ghf-obvious-07': dict(
    received="An old building was cleared for housing.",
    words=[["\"suddenly and completely destroyed\"", "The Royal Commission's archive record (NMR 6048945)."]],
    known="You don't start bulldozers at four in the morning by accident. It was done in the dark, the morning after the last protection fell and before Strasbourg could be heard, so that it could not be stopped and could never be undone."),
'ghf-obvious-08': dict(
    received="Nobody much cared about an old farmhouse.",
    words=[],
    known="The public stood with the family. A thousand signatures, an MP, a furious village. It made no difference. Where the public could not be persuaded, force and stealth were used instead."),
'ghf-obvious-09': dict(
    received="If they ever had papers, they couldn't produce them.",
    words=[["\"never produced\"", "Court of Appeal, 1987."]],
    known="Title deeds don't walk out of a blanket box. They were taken, by a man an estate agent put in the house, and handed to that agent. Thirty-five years later a court noted that they had never been produced."),
'ghf-obvious-10': dict(
    received="Cadw assessed the house properly and it fell just short.",
    words=[["\"marginally below the bar\"", "Cadw, 2026."]],
    known="A public body decided the fate of a three-hundred-year-old house and kept no file, no notes and no name. A decision nobody can examine is a decision nobody can challenge."),
'ghf-obvious-11': dict(
    received="The courts settled who owned Great House Farm.",
    words=[],
    known="In 1974 the question of ownership was in front of a judge, and BP walked away from it. In 1984 it asked only for possession. If you were sure you owned the house, you would ask a court to say so. They never did."),
# ---------------------------------------------------------------- EPILOGUE
'ghf-99990101-1': dict(
    received="A landlord and its successors recovered their farm from tenants who stayed on without paying, and the courts confirmed it.",
    words=[('"the whole farm"', '1916.'), ('"the whole of the farm"', '1955.'), ('"licence"', '1974.'), ('"the paper title to the farm"', '1987.'), ('"registered correctly"', '2026.')],
    known="Parcel A was the family's from 1928, and by possession from 1940. It was never shown to belong to Western Ground Rents or BP. A synthetic single farm was described in 1916; six attempts (1949, 1955, 1959, 1962, 1965, 1974) treated Mary's occupation as permissive; the woodland and the land to the south were taken; the 1975 conveyance and 1983 registration gave the synthetic Parcel A a deed and a title; the 1987 amalgamation folded it into Parcel B. The courts decided possession and never decided ownership. Possession can be awarded without ownership being tried, and land can be registered without a rival claim being decided. Neither decides the older title."),
'ghf-99990101-4': dict(
    received="It was always one farm, and nobody suggested otherwise.",
    words=[('"the whole farm"', 'One farm.'), ('"the farmhouse and garden"', 'One part, named on its own.')],
    known="Mary's 1974 statement describes the 1877 split; no lawyer of hers built a case on it. Western Ground Rents offered tenancies of, and sued for, the farmhouse and garden alone. BP conveyed it alone in 1975, registered it alone in 1983, and merged it in 1987. The Land Registry held two titles and joined them. The Court of Appeal read a conveyance of the farmhouse and garden. Those who knew the parcels were separate treated them as one where that helped and as two where that helped. The family's case is that this was a conspiracy against them."),
'ghf-99990101-2': dict(
    received="A modern estate on a former farm.",
    words=[],
    known="The title to Parcel A has never been decided and never extinguished."),
'ghf-99990101-3': dict(
    received="",
    words=[],
    known="There has been no public inquiry, apology or reparation."),
'ghf-99990102-1': dict(
    received="",
    words=[],
    known="Every body involved is being given the opportunity to put it right before the family return to court."),
}



