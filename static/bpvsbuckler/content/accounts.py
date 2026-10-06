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
'ghf-06500101-1': dict(
    received="A village church with a farm next to it.",
    words=[],
    known="One of the oldest Christian sites in Wales, and the ground beside it the site of the largest early medieval cemetery yet found in Wales. The house next to it was the manor's house, not an ordinary farmhouse."),
'ghf-12000101-1': dict(
    received="An old farmhouse of no special note.",
    words=[('"sub-medieval"', 'A technical dating term, later read as "not old enough to matter".')],
    known="A house of the 17th century or earlier, on a site occupied since the Middle Ages, possibly with a medieval core."),
'ghf-15520101-1': dict(
    received="A farm let on ordinary leases.",
    words=[],
    known="The land had a continuous written record for nearly three centuries. Its title has a documented root."),
'ghf-15600101-1': dict(
    received="A gentry family's farm, later sold on.",
    words=[],
    known="The freehold chain of the land: traced in the Western Mail letter from Tewkesbury Abbey to the Crown and the Herberts, then the Vaughans, then Bute. Parcel A's title descends from this chain."),
'ghf-16670101-1': dict(
    received="Tenant farmers who lived on someone else's land.",
    words=[('"tenants"', 'The estate\'s description of the family, repeated in every later account.')],
    known="Three centuries of continuous occupation by one family. Mary's account is that her ancestors bought it; the estate's records call them tenants. Their status changes in 1877 and 1928, not here."),
'ghf-18000101-1': dict(
    received="Bute owned the farm, and everything after descends from Bute.",
    words=[],
    known="Bute owned the whole farm only until 1877. The house was the manor's court house."),
'ghf-18400101-1': dict(
    received="It was always just a farm.",
    words=[('"Great House Farm"', 'A name that reduced the manor\'s court house to a farmhouse.')],
    known="The first change in how the place was described. Later descriptions, especially \"the whole farm\", decide the case."),
# ---------------------------------------------------------------- ACT I
'ghf-18580101-1': dict(
    received="A chance find, of no consequence.",
    words=[],
    known="The first record that the ground beside the church held burials. The 1994 excavation found more than a thousand."),
'ghf-18700101-1': dict(
    received="Family folklore.",
    words=[('"reported"', 'The word the records use, which keeps it at a distance.')],
    known="An account on public record since 1974, never investigated before the house was demolished."),
'ghf-18760101-1': dict(
    received="Part of the farm let for quarrying.",
    words=[],
    known="The quarrying is the reason for the 1877 division, and its end in 1928 is the date the house passes to the family."),
'ghf-18770101-1': dict(
    received="Nothing changed: Bute went on owning the farm, and the Williamses went on renting it.",
    words=[],
    known="From 1877 there are two parcels with two owners: Parcel A (the house) owned by Thomas, Parcel B (the fields) owned by Bute. Anything Bute sells after 1877 can only be Parcel B. The agreement provided that the freehold of Parcel A would pass to the Williamses when quarrying ended."),
'ghf-18911111-1': dict(
    received="A minor court report.",
    words=[],
    known="Contemporary proof that John Williams lived at the house in 1891."),
'ghf-18970501-1': dict(
    received="An unproven family story.",
    words=[],
    known="The trials are documented; the family's part is their own account."),
'ghf-19080101-1': dict(
    received="John Williams became the tenant of the farm.",
    words=[('"the tenant"', 'Singular, as if there were one tenancy of one farm.')],
    known="Two tenancies from two landlords: Parcel A from the Thomases, Parcel B from Bute."),
'ghf-19130810-1': dict(
    received="A tenant's daughter.",
    words=[],
    known="The owner of Parcel A from 1928 by her family's title. She lived in the house until her death in 1983."),
# ---------------------------------------------------------------- ACT II
'ghf-19160201-1': dict(
    received="The Williamses were yearly tenants of the whole farm from 1916, and every later right flows from that tenancy.",
    words=[('"the whole farm"', 'Quoted by the Court of Appeal in 1987 as the start of the history.'), ('"since 1916"', 'The European Commission\'s date for the family\'s occupation.')],
    known="In 1916 Bute owned only Parcel B. It could not let the house, which Thomas owned. \"The whole farm\" is a landlord's description of land it did not own: the birth of a single, synthetic farm that existed only on paper. Every later case was fought over that synthetic farm."),
'ghf-19280101-1': dict(
    received="Nothing happened in 1928. The tenancy of the whole farm carried on.",
    words=[],
    known="The 1877 agreement took effect: quarrying ended and the freehold of Parcel A passed to the Williamses. From 1928 no rent was paid on Parcel A to anyone. Parcel A's chain is complete: Vaughan, Bute, Daniel Thomas, Williams."),
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
    known="Title by possession to Parcel A was complete by 1940, in addition to the 1877–1928 title. From 1940 there was no basis, with or without papers, for treating the family's occupation of the house as permissive."),
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
    known="The family's paper title to Parcel A left the house in 1950–52, a year after Mary relied on it and within three years of the landlord's first proceedings. Mary believed the two were connected. The title was not extinguished; its proof was removed."),
'ghf-19521010-1': dict(
    received="The tenant stopped paying rent on the farm.",
    words=[],
    known="Rent stopped on the fields, Parcel B. No rent had been paid on Parcel A since 1928."),
'ghf-19550202-1': dict(
    received="The landlord recovered the farm in 1955; the family stayed on in the house only through the landlord's forbearance, and from 1955 their occupation was adverse to the landlord.",
    words=[('"the whole of the farm"', 'The order\'s description, quoted in 1987.'), ('adverse possession "from 1955"', 'The clock the courts later counted on the house.')],
    known="An order against a tenant of the fields can only return what was let and owned: Parcel B. It was enforced on the fields. On the family's account the woodland on the north of Parcel A was taken too, passing to a couple in Llandough and later to the Forest of Cardiff. Mary was not a party and was never heard. Any clock that started in 1955 was a clock on Parcel B. That the order reached the house was an insinuation, later read as fact: the second attempt to make Mary's occupation look permissive."),
'ghf-19590101-1': dict(
    received="The landlord offered the occupier a tenancy, and she refused it.",
    words=[('"the farmhouse and garden"', 'The landlord\'s description of what it offered to let.')],
    known="\"The farmhouse and garden\" is " + HG + ". The landlord named the house parcel on its own, which shows it knew it was separate. An owner does not need its occupier to accept a tenancy. Third attempt to make her occupation look permissive."),
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
    known="The land south of the farmhouse, part of Parcel A, was taken by the council and later laid out as a green. Permission was granted over a house whose ownership was disputed."),
'ghf-19740101-1': dict(
    received="A routine, incomplete survey.",
    words=[],
    known="A public body recorded in 1974 that the ownership of the house was disputed."),
'ghf-19740415-1': dict(
    received="A campaign to save an old building.",
    words=[('"valid claim"', 'Reported as a claim, not a title.')],
    known="A public statement of ownership of Parcel A, in a national newspaper, ten years before BP's writ."),
'ghf-19740703-1': dict(
    received="An action that went nowhere.",
    words=[('"part-heard"', 'Treated afterwards as if nothing had been decided because nothing needed deciding.')],
    known="The only time Mary's title to Parcel A was put before a court. It was never decided, and so never extinguished. Her statement set out the two parcels; no lawyer of hers ever built a case on it."),
'ghf-19741031-1': dict(
    received="BP kindly let an elderly, ill woman live in the house rent-free for the rest of her life.",
    words=[('"licence"', 'BP\'s letters, as the courts later described them.'), ('"because of her ill health"', 'BP\'s explanation to the press in 1988.')],
    known="Permission offered to an owner who never asked for it, and never accepted it, at the moment her plea of ownership was before the court. Sixth attempt to make her occupation look permissive, and the one the courts relied on."),
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
    known="She died the owner of Parcel A, never having accepted a tenancy or licence, her claim never decided."),
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
    known="Two titles cannot be merged unless there are two. BP and the Land Registry held the house and the fields separately from 1983 while the case was argued as one farm. The merger folded the synthetic Parcel A into Parcel B during the appeal."),
'ghf-19870731-1': dict(
    received="The courts finally settled that BP owned Great House Farm.",
    words=[('"the paper title to the farm"', 'The court\'s description of BP\'s position.'), ('"No such documents were, however, ever produced."', 'On Mary\'s title documents.'), ('"since November 1982 they have been the registered proprietors"', 'The court\'s recital.')],
    known="The court decided possession, not ownership. It counted the clock from 1955, from an order about Parcel B; counted from 1928, it ran out in 1940. BP's paper title was to Parcel B; for Parcel A it had only the 1975 BP-to-BP conveyance, which the court itself called the conveyance of the farmhouse and garden. Mary's documents were not produced because they were taken in 1950–52."),
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
    known="A man defending his home, with his children behind the door, on land his family owned."),
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
    known="BP took possession of Parcel A, which it had never been shown to own."),
'ghf-19881201-1': dict(
    received="",
    words=[],
    known="The family's remaining papers were lost with the house."),
'ghf-19881202-1': dict(
    received="",
    words=[],
    known="The injunction lasted three days."),
'ghf-19881209-1': dict(
    received="The violent squatter was charged.",
    words=[],
    known="The owner's son was prosecuted for resisting the enforcement of a possession order."),
'ghf-19881203-1': dict(
    received="Cadw gave the house fair consideration.",
    words=[],
    known="Cadw had already coded the house just below the bar in July."),
'ghf-19881205-1': dict(
    received="The house was not worth listing, and the courts had ruled.",
    words=[('"not of sufficient architectural merit"', 'Cadw, 5 December 1988.')],
    known="Both protections ended on the same day."),
'ghf-19881206-1': dict(
    received="An old farmhouse of no special merit was cleared for housing.",
    words=[('"Bulldozed before breakfast"', 'The headline.'), ('"suddenly and completely demolished"', 'The heritage record, 1991.')],
    known="The house was destroyed the morning after the listing refusal, before it was fully recorded and while the European Commission application was pending. The title to Parcel A was not destroyed with it."),
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
    known=""),
'ghf-19890414-1': dict(
    received="Strasbourg confirmed the eviction was lawful and the property was BP's.",
    words=[('"the property belonged to another"', 'The Commission\'s reading of the domestic judgments.')],
    known="The Commission relied on the domestic courts, which had decided possession, not ownership. It did not see the title documents."),
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
'ghf-19920515-1': dict(
    received="",
    words=[],
    known="Mary's claim to Parcel A passed, undecided, to his heirs."),
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
    known="On the family's account the woodland, part of Parcel A, had been taken in 1955. The charity has not used it."),
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
