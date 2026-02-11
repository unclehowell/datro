import { TimelineEntry } from './types';

// Helper for default empty attachments
const emptyAttachments = {
  gallery: [],
  legal: [],
  news: [],
  notes: [],
  report: []
};

export const TIMELINE: TimelineEntry[] = [
  {
    year: "1100",
    location: "Llandough, Glamorgan",
    locationType: "farm",
    description: "Norman Conquest",
    narration: "Robert Fitzhamon grants the lordship of Llandough to the Walsche family, establishing feudal control of the area that includes the future Great House Farm.",
    scenes: [
      { character: "Robert Fitzhamon", icon: "noble", side: "right", color: "#c0392b", text: "I grant Walsche the Llandough lordship to manage, tax and defend.", position: { x: 0, y: 0 } },
      { character: "Lord Walsche", icon: "noble", side: "right", color: "#8e44ad", text: "We now hold Llandough and its revenues under Fitzhamon's grant.", position: { x: 0, y: 0 } }
    ],
    sources: [],
    attachments: emptyAttachments
  },
  {
    year: "1215",
    location: "Llandough Church",
    locationType: "other",
    description: "Great House Built",
    narration: "A substantial stone residence, Tŷ Mawr ('Great House'), is constructed beside St Dochdwy's church at Llandough as a manorial house, later known as Great House Farm.",
    scenes: [
      { character: "Master Mason", icon: "builder", side: "right", color: "#e67e22", text: "We're building a new stone manorial house beside St Dochdwy's.", position: { x: 0, y: 0 } },
      { character: "Local Farmer", icon: "farmer", side: "left", color: "#27ae60", text: "Local lord's new stone house next to the parish church. Right ho!", position: { x: 0, y: 0 } }
    ],
    sources: [],
    attachments: emptyAttachments
  },
  {
    year: "1215",
    location: "Monastic Estate",
    locationType: "other",
    description: "Monastic Control",
    narration: "Tewkesbury Abbey and the Prior of Cardiff hold Great House and its lands, taking tithes and agricultural income from Llandough for over three centuries.",
    scenes: [
      { character: "Abbot's Steward", icon: "noble", side: "right", color: "#7f8c8d", text: "Llandough's produce and tithes are entered as revenue for the abbey.", position: { x: 0, y: 0 } },
      { character: "Village Woman", icon: "farmer", side: "left", color: "#27ae60", text: "Our harvest and church payments go into the abbey's accounts.", position: { x: 0, y: 0 } }
    ],
    sources: [],
    attachments: emptyAttachments
  },
  {
    year: "1444",
    location: "Raglan",
    locationType: "court",
    description: "Herbert Acquisition",
    narration: "Sir William Thomas Herbert of Raglan purchases the manor and lordship of Llandough and St Mary Church, bringing them into the Herbert family's territorial network.",
    scenes: [
      { character: "Sir William Thomas", icon: "noble", side: "right", color: "#8e44ad", text: "We have bought Llandough manor and added it to the Herbert estates.", position: { x: 0, y: 0 } },
      { character: "Local Priest", icon: "cleric", side: "left", color: "#34495e", text: "Llandough's manorial control passes to the Herbert family of Raglan.", position: { x: 0, y: 0 } }
    ],
    sources: [],
    attachments: emptyAttachments
  },
  {
    year: "1536",
    location: "Legal Chambers",
    locationType: "court",
    description: "Carne Purchase",
    narration: "Sir Edward Carne, a lawyer and diplomat, purchases the Llandough lordship from the 2nd Earl of Worcester, continuing high‑status lay ownership of the manor.",
    scenes: [
      { character: "Sir Edward Carne", icon: "noble", side: "right", color: "#2c3e50", text: "I have acquired the Llandough lordship from the Earl of Worcester.", position: { x: 0, y: 0 } },
      { character: "Llandough Tenant", icon: "farmer", side: "left", color: "#27ae60", text: "The legal lord of Llandough changes from Worcester's line to Carne.", position: { x: 0, y: 0 } }
    ],
    sources: [],
    attachments: emptyAttachments
  },
  {
    year: "1539",
    location: "Great House",
    locationType: "farm",
    description: "Dissolution",
    narration: "Henry VIII's Dissolution of the Monasteries transfers Tewkesbury's ecclesiastical holdings, including Llandough lands, to the Crown as secular property.",
    scenes: [
      { character: "Royal Commissioner", icon: "judge", side: "right", color: "#c0392b", text: "These former Tewkesbury lands now vest in the Crown by statute.", position: { x: 0, y: 0 } },
      { character: "Older Villager", icon: "worker", side: "left", color: "#7f8c8d", text: "Control of local church lands moves from abbey to Crown authority.", position: { x: 0, y: 0 } }
    ],
    sources: [],
    attachments: emptyAttachments
  },
  {
    year: "1543",
    location: "Estate Office",
    locationType: "court",
    description: "Estate Consolidation",
    narration: "Post‑Dissolution grants move Llandough through lay owners and into the wider Herbert–Pembroke orbit, later feeding into what becomes the Bute estate.",
    scenes: [
      { character: "Herbert Estate Lawyer", icon: "lawyer", side: "right", color: "#34495e", text: "Llandough is one of several manors consolidated into our estate.", position: { x: 0, y: 0 } },
      { character: "Smallholder", icon: "farmer", side: "left", color: "#27ae60", text: "The superior owner changes again on paper; our tenure is recorded under them.", position: { x: 0, y: 0 } }
    ],
    sources: [],
    attachments: emptyAttachments
  },
  {
    year: "1552",
    location: "Manorial Court",
    locationType: "court",
    description: "Bute Tenants",
    narration: "The Bute–Pembroke estate treats itself as manorial lord, issuing leases for Llandough Farm (about 166 acres) and recording long‑standing occupiers as tenants.",
    scenes: [
      { character: "Manor Steward", icon: "judge", side: "right", color: "#8e44ad", text: "We register Llandough occupiers as tenants in the Bute–Pembroke books.", position: { x: 0, y: 0 } },
      { character: "Tenant Farmer", icon: "farmer", side: "left", color: "#27ae60", text: "Our occupation is recorded as a tenancy under the Bute–Pembroke estate.", position: { x: 0, y: 0 } }
    ],
    sources: [],
    attachments: emptyAttachments
  },
  {
    year: "1667",
    location: "Great House Farm",
    locationType: "farm",
    description: "Williams Entry",
    narration: "A Williams ancestor is admitted to Great House via the manorial court, paying a substantial entry fine remembered in family tradition as a purchase, while estate records treat it as leasehold.",
    scenes: [
      { character: "Williams Ancestor", icon: "noble", side: "left", color: "#16a085", text: "I paid a large court fine to enter Great House as our family's holding.", position: { x: 0, y: 0 } },
      { character: "Herbert Steward", icon: "judge", side: "right", color: "#8e44ad", text: "Our roll shows the Williams entry as a manorial lease, not freehold.", position: { x: 0, y: 0 } },
      { character: "Williams Ancestor", icon: "noble", side: "left", color: "#16a085", text: "But this is our home now, purchased with honest coin for our heirs.", position: { x: 0, y: 0 } },
      { character: "Herbert Steward", icon: "judge", side: "right", color: "#8e44ad", text: "The Court Baron record will show this as leasehold under our lordship.", position: { x: 0, y: 0 } },
      { character: "Williams Ancestor", icon: "noble", side: "left", color: "#16a085", text: "We have the receipt. Our children will know we bought this land.", position: { x: 0, y: 0 } }
    ],
    sources: [],
    attachments: emptyAttachments
  },
  {
    year: "1677",
    location: "Estate Records",
    locationType: "court",
    description: "Talbot Marriage",
    narration: "Through marriage, the Llandough lordship passes into the Talbot estate at Penrice and Margam, while the Williams family continues in occupation at Great House.",
    scenes: [
      { character: "Talbot Heir", icon: "noble", side: "right", color: "#8e44ad", text: "By marriage we acquire Llandough among our Glamorgan holdings.", position: { x: 0, y: 0 } },
      { character: "Williams Family Member", icon: "farmer", side: "left", color: "#16a085", text: "The superior lord's name changes; our occupation at Great House continues.", position: { x: 0, y: 0 } }
    ],
    sources: [],
    attachments: emptyAttachments
  },
  {
    year: "1770",
    location: "Estate Transfer",
    locationType: "other",
    description: "Morris Era",
    narration: "Great House passes through elite owners, including Valentine Morris and Sir Mark Wood, before later consolidation into the Bute estate.",
    scenes: [
      { character: "Valentine Morris", icon: "noble", side: "right", color: "#2c3e50", text: "I treat Great House as one of several Glamorgan assets for income.", position: { x: 0, y: 0 } },
      { character: "Local Labourer", icon: "worker", side: "left", color: "#7f8c8d", text: "Estate owners change; our local work under their control continues.", position: { x: 0, y: 0 } }
    ],
    sources: [],
    attachments: emptyAttachments
  },
  {
    year: "1794",
    location: "Title Office",
    locationType: "court",
    description: "Wood Portfolio",
    narration: "Sir Mark Wood acquires title and treats Great House as a revenue asset within his wider property portfolio, before it is surveyed and later taken into Bute hands.",
    scenes: [
      { character: "Sir Mark Wood", icon: "noble", side: "right", color: "#2c3e50", text: "I hold Great House as an income‑producing property in my portfolio.", position: { x: 0, y: 0 } },
      { character: "Williams Farmer", icon: "farmer", side: "left", color: "#16a085", text: "Our long‑term home appears in someone else's accounts as an asset.", position: { x: 0, y: 0 } }
    ],
    sources: [],
    attachments: emptyAttachments
  },
  {
    year: "1811",
    location: "Estate Records",
    locationType: "court",
    description: "Lambert Williams",
    narration: "Lambert Williams, a notable Cardiff figure, enters formal agreements with the Bute estate, demonstrating recognised Williams status in local property dealings.",
    scenes: [
      { character: "Lambert Williams", icon: "noble", side: "left", color: "#16a085", text: "These written agreements show I deal with the Bute estate directly.", position: { x: 0, y: 0 } },
      { character: "Bute Estate Agent", icon: "judge", side: "right", color: "#8e44ad", text: "We sign standard contracts with Lambert Williams over parish premises.", position: { x: 0, y: 0 } },
      { character: "Lambert Williams", icon: "noble", side: "left", color: "#16a085", text: "These documents record our position for future generations to cite.", position: { x: 0, y: 0 } }
    ],
    sources: [],
    attachments: emptyAttachments
  },
  {
    year: "1818",
    location: "Estate Accounts",
    locationType: "court",
    description: "Chief Rents",
    narration: "Chief rents of Llandough are transferred into the manorial rental accounts, simplifying estate bookkeeping and packaging obligations for future buyers.",
    scenes: [
      { character: "Estate Accountant", icon: "lawyer", side: "right", color: "#34495e", text: "We combine Llandough chief rents into the manorial rental column.", position: { x: 0, y: 0 } },
      { character: "Cottager", icon: "farmer", side: "left", color: "#27ae60", text: "Our payments are re‑labelled on paper, but the amounts still fall on us.", position: { x: 0, y: 0 } }
    ],
    sources: [],
    attachments: emptyAttachments
  },
  {
    year: "1820",
    location: "Estate Offices",
    locationType: "court",
    description: "Land Exchange",
    narration: "A land exchange between the Marquess of Bute and Lord Plymouth in Llandough consolidates Great House within Bute's controlled block of estates.",
    scenes: [
      { character: "Bute Representative", icon: "noble", side: "right", color: "#8e44ad", text: "This exchange secures Llandough parcels firmly within the Bute estate.", position: { x: 0, y: 0 } },
      { character: "Local Observer", icon: "news", side: "left", color: "#7f8c8d", text: "New memoranda and surveys mark Bute as main landowner here.", position: { x: 0, y: 0 } }
    ],
    sources: [],
    attachments: emptyAttachments
  },
  {
    year: "1821",
    location: "Rent Collection",
    locationType: "other",
    description: "Master Rental",
    narration: "Llandough and Cogan appear in Bute rentals from 1821 onward, consolidating manorial rents under a single administrative ledger controlled by the estate.",
    scenes: [
      { character: "Rent Collector", icon: "judge", side: "right", color: "#34495e", text: "The Bute estate now logs Llandough and Cogan in the master rental.", position: { x: 0, y: 0 } },
      { character: "Williams Farmer", icon: "farmer", side: "left", color: "#16a085", text: "We pay to them, though this land has been ours for generations past.", position: { x: 0, y: 0 } }
    ],
    sources: [],
    attachments: emptyAttachments
  },
  {
    year: "1824",
    location: "Survey Office",
    locationType: "court",
    description: "Cedfin Alias",
    narration: "Following Sir Mark Wood's property auction, surveyor David Stewart records Great House Farm under the alias 'Cedfin' in the Bute estate survey of Glamorgan holdings.",
    scenes: [
      { character: "Surveyor Stewart", icon: "builder", side: "right", color: "#e67e22", text: "I record this property as Great House Farm, alias Cedfin, in Bute accounts.", position: { x: 0, y: 0 } },
      { character: "Williams Occupant", icon: "farmer", side: "left", color: "#16a085", text: "The name on their maps matters little; we know who lives and works here.", position: { x: 0, y: 0 } },
      { character: "Surveyor Stewart", icon: "builder", side: "right", color: "#e67e22", text: "Tithes of Llandough purchased in 1824 are now under Bute ownership.", position: { x: 0, y: 0 } }
    ],
    sources: [],
    attachments: emptyAttachments
  },
  {
    year: "1840",
    location: "Estate Registry",
    locationType: "court",
    description: "Name Downgrade",
    narration: "Census and tithe records shift terminology from 'Great House' to 'Great House Farm,' downgrading the property from a seat of governance to a commercial agricultural unit.",
    scenes: [
      { character: "Census Clerk", icon: "judge", side: "right", color: "#34495e", text: "I enter this as Great House Farm, removing the designation of Court House.", position: { x: 0, y: 0 } },
      { character: "Williams Elder", icon: "farmer", side: "left", color: "#16a085", text: "They rename our ancestral seat to erase our status and heritage claim.", position: { x: 0, y: 0 } },
      { character: "Estate Lawyer", icon: "lawyer", side: "right", color: "#2c3e50", text: "A farm designation supports our treatment of occupants as tenant farmers.", position: { x: 0, y: 0 } },
      { character: "Williams Elder", icon: "farmer", side: "left", color: "#16a085", text: "This administrative sleight-of-hand obscures three centuries of our standing.", position: { x: 0, y: 0 } }
    ],
    sources: [],
    attachments: emptyAttachments
  },
  {
    year: "1870",
    location: "Great House Living Room",
    locationType: "farm",
    description: "Roman Discovery",
    narration: "The Williams family discovers a Roman soldier in full armor beneath the living room floor while replacing flagstones. This critical archaeological evidence is not formally recorded or disclosed.",
    scenes: [
      { character: "Williams Family Head", icon: "farmer", side: "left", color: "#16a085", text: "We've found a Roman soldier in a stone-lined grave under our floor!", position: { x: 0, y: 0 } },
      { character: "Family Member", icon: "farmer", side: "left", color: "#16a085", text: "This proves the site is ancient and of great historical importance.", position: { x: 0, y: 0 } },
      { character: "Williams Family Head", icon: "farmer", side: "left", color: "#16a085", text: "We must tell someone—this could protect our home under the law.", position: { x: 0, y: 0 } },
      { character: "Local Antiquarian", icon: "builder", side: "right", color: "#95a5a6", text: "Fascinating find, but I doubt authorities will act on family testimony.", position: { x: 0, y: 0 } },
      { character: "Williams Family Head", icon: "farmer", side: "left", color: "#16a085", text: "One day this discovery will prove the true significance of this place.", position: { x: 0, y: 0 } }
    ],
    sources: [],
    attachments: emptyAttachments
  },
  {
    year: "1876",
    location: "Estate Offices",
    locationType: "court",
    description: "Limeworks Seizure",
    narration: "The Bute Estate carves out 33 acres from Great House Farm for Llandough Limeworks, treating the land as their own property to lease to industry, ignoring the Williams claim.",
    scenes: [
      { character: "Bute Agent", icon: "judge", side: "right", color: "#8e44ad", text: "We sever this land for the Limeworks. It's ours to lease commercially.", position: { x: 0, y: 0 } },
      { character: "Williams Farmer", icon: "farmer", side: "left", color: "#16a085", text: "But we live here! You cannot carve up land we've held for two centuries.", position: { x: 0, y: 0 } },
      { character: "Bute Agent", icon: "judge", side: "right", color: "#8e44ad", text: "Estate records show no Williams ownership—only occupation under our lease.", position: { x: 0, y: 0 } },
      { character: "Williams Farmer", icon: "farmer", side: "left", color: "#16a085", text: "Our 1667 receipt and occupation prove our right to this property.", position: { x: 0, y: 0 } },
      { character: "Bute Agent", icon: "judge", side: "right", color: "#8e44ad", text: "Manorial records prevail. You are tenants, not owners, under our title.", position: { x: 0, y: 0 } }
    ],
    sources: [],
    attachments: emptyAttachments
  },
  {
    year: "1880",
    location: "Estate Records",
    locationType: "court",
    description: "Linguistic Erasure",
    narration: "The property is systematically rebranded from 'Court House' to 'Grange' to 'Farm' in successive records, demoting occupants from gentry with tenure to mere tenant farmers.",
    scenes: [
      { character: "Estate Clerk", icon: "lawyer", side: "right", color: "#34495e", text: "We now list it simply as a farm, eliminating all reference to Court House.", position: { x: 0, y: 0 } },
      { character: "Williams Descendant", icon: "farmer", side: "left", color: "#16a085", text: "This linguistic erasure strips our family of its historic manorial standing.", position: { x: 0, y: 0 } }
    ],
    sources: [],
    attachments: emptyAttachments
  },
  {
    year: "1900",
    location: "Great House Farm",
    locationType: "farm",
    description: "Mary Born",
    narration: "Mary Williams is born into the family at Great House Farm, inheriting the Williams claim and continuing three centuries of unbroken occupation and assertion of ownership.",
    scenes: [
      { character: "Midwife", icon: "cleric", side: "right", color: "#27ae60", text: "A healthy daughter! The Williams line at Great House continues.", position: { x: 0, y: 0 } },
      { character: "Williams Matriarch", icon: "farmer", side: "left", color: "#16a085", text: "She will know her heritage and defend this land when her time comes.", position: { x: 0, y: 0 } }
    ],
    sources: [],
    attachments: emptyAttachments
  },
  {
    year: "1920",
    location: "Great House Farm",
    locationType: "farm",
    description: "Mary Weds",
    narration: "Mary Williams marries Frederick Buckler but retains her maiden name, consistent with local custom and the family's understanding that the Williams lineage embodies the historic basis of title.",
    scenes: [
      { character: "Mary Williams", icon: "farmer", side: "left", color: "#16a085", text: "I marry Frederick Buckler but keep the Williams name for our claim.", position: { x: 0, y: 0 } },
      { character: "Frederick Buckler", icon: "farmer", side: "left", color: "#27ae60", text: "The land belongs to your family line; the Williams name must continue.", position: { x: 0, y: 0 } },
      { character: "Local Priest", icon: "cleric", side: "right", color: "#34495e", text: "Mary Williams of Great House Farm weds Frederick Buckler this day.", position: { x: 0, y: 0 } },
      { character: "Mary Williams", icon: "farmer", side: "left", color: "#16a085", text: "Our children will know they are Williams heirs to this ancestral home.", position: { x: 0, y: 0 } }
    ],
    sources: [],
    attachments: emptyAttachments
  },
  {
    year: "1926",
    location: "Estate Sale",
    locationType: "court",
    description: "Bute Sale",
    narration: "The Marquess of Bute sells Great House Farm. Sale documents list it under Bute ownership, with no mention of the Williams family's three-century occupation or claim.",
    scenes: [
      { character: "Bute Estate Agent", icon: "judge", side: "right", color: "#8e44ad", text: "Great House Farm sells as Bute property. Occupants are sitting tenants.", position: { x: 0, y: 0 } },
      { character: "Mary Williams", icon: "farmer", side: "left", color: "#16a085", text: "They sell our home as if we don't exist! Our family has been here since 1667.", position: { x: 0, y: 0 } },
      { character: "Auctioneer", icon: "judge", side: "right", color: "#34495e", text: "Estate records show clear Bute title. Occupancy doesn't equal ownership.", position: { x: 0, y: 0 } },
      { character: "Mary Williams", icon: "farmer", side: "left", color: "#16a085", text: "Where is our 1667 deed? Our family has the receipt of purchase!", position: { x: 0, y: 0 } },
      { character: "Bute Estate Agent", icon: "judge", side: "right", color: "#8e44ad", text: "Manorial court records supersede any claimed private family documents.", position: { x: 0, y: 0 } }
    ],
    sources: [],
    attachments: emptyAttachments
  },
  {
    year: "1926",
    location: "Purchase Agreement",
    locationType: "court",
    description: "Penarth Purchase",
    narration: "The Penarth Estate Company purchases Great House Farm at auction, acquiring whatever title the Bute estate held, subject to the unresolved Williams possession and claim.",
    scenes: [
      { character: "Penarth Company Director", icon: "noble", side: "right", color: "#2c3e50", text: "We purchase Great House Farm as an investment from the Bute auction.", position: { x: 0, y: 0 } },
      { character: "Mary Williams", icon: "farmer", side: "left", color: "#16a085", text: "But you cannot buy what the Bute estate does not own! We hold this land.", position: { x: 0, y: 0 } },
      { character: "Penarth Company Lawyer", icon: "lawyer", side: "right", color: "#2c3e50", text: "Our purchase includes registered title. Your occupation will be addressed.", position: { x: 0, y: 0 } },
      { character: "Mary Williams", icon: "farmer", side: "left", color: "#16a085", text: "Three hundred years of Williams possession is not mere occupation!", position: { x: 0, y: 0 } }
    ],
    sources: [],
    attachments: emptyAttachments
  },
  {
    year: "1930",
    location: "Great House Farm",
    locationType: "farm",
    description: "Defiant Possession",
    narration: "Despite the 1926 sale, the Williams-Buckler family remains in continuous occupation, maintaining the property and asserting their ownership against external claims.",
    scenes: [
      { character: "Mary Williams", icon: "farmer", side: "left", color: "#16a085", text: "We stay on our land. No sale can extinguish our family's rightful claim.", position: { x: 0, y: 0 } },
      { character: "Frederick Buckler", icon: "farmer", side: "left", color: "#27ae60", text: "Our children work this farm and will inherit it as Williams heirs.", position: { x: 0, y: 0 } }
    ],
    sources: [],
    attachments: emptyAttachments
  },
  {
    year: "1950",
    location: "Great House Farm",
    locationType: "farm",
    description: "Post-War",
    narration: "The Williams-Buckler family continues occupation and maintenance, farming the land and preserving Great House through the post-war years, paying no rent to any claimed landlord.",
    scenes: [
      { character: "Billy Buckler (Young)", icon: "farmer", side: "left", color: "#16a085", text: "This has been our family's home for as long as anyone can remember.", position: { x: 0, y: 0 } },
      { character: "Mary Williams", icon: "farmer", side: "left", color: "#16a085", text: "Your grandfather paid for this land in 1667. We owe rent to no one.", position: { x: 0, y: 0 } }
    ],
    sources: [],
    attachments: emptyAttachments
  },
  {
    year: "1955",
    location: "Title Office",
    locationType: "court",
    description: "Registration Failed",
    narration: "Under new land registration laws, previous claims begin to be formalized on paper, but the Williams-Buckler claim is not registered despite continuous possession since 1667.",
    scenes: [
      { character: "Registrar", icon: "judge", side: "right", color: "#34495e", text: "We invite owners to register their titles under the new system.", position: { x: 0, y: 0 } },
      { character: "Mary Williams", icon: "farmer", side: "left", color: "#16a085", text: "I come to register our family's ownership based on centuries of possession.", position: { x: 0, y: 0 } },
      { character: "Registrar", icon: "judge", side: "right", color: "#34495e", text: "Do you have documentary title? A deed? Estate conveyance papers?", position: { x: 0, y: 0 } },
      { character: "Mary Williams", icon: "farmer", side: "left", color: "#16a085", text: "We have our family history, occupation since 1667, and the receipt of purchase.", position: { x: 0, y: 0 } },
      { character: "Registrar", icon: "judge", side: "right", color: "#34495e", text: "Without formal documentation, we cannot register your claimed ownership.", position: { x: 0, y: 0 } }
    ],
    sources: [],
    attachments: emptyAttachments
  },
  {
    year: "1960",
    location: "Marconi Site Planning",
    locationType: "other",
    description: "Marconi Encroachment",
    narration: "Marconi constructs a telecommunications facility adjacent to Great House Farm. Site surveys and planning proceed without investigating or disclosing the Williams family's claim or archaeological significance.",
    scenes: [
      { character: "Marconi Surveyor", icon: "builder", side: "right", color: "#e67e22", text: "This site is perfect for our telecommunications base next to the farm.", position: { x: 0, y: 0 } },
      { character: "Mary Williams", icon: "farmer", side: "left", color: "#16a085", text: "Will you investigate the Roman remains we found? This is protected land.", position: { x: 0, y: 0 } },
      { character: "Marconi Official", icon: "judge", side: "right", color: "#34495e", text: "Our planning approval is in order. Family stories are not our concern.", position: { x: 0, y: 0 } },
      { character: "Mary Williams", icon: "farmer", side: "left", color: "#16a085", text: "The soldier we found proves this site has archaeological importance!", position: { x: 0, y: 0 } },
      { character: "Marconi Surveyor", icon: "builder", side: "right", color: "#e67e22", text: "We see no official heritage listing. Development proceeds as permitted.", position: { x: 0, y: 0 } }
    ],
    sources: [],
    attachments: emptyAttachments
  },
  {
    year: "1965",
    location: "Property Records Office",
    locationType: "court",
    description: "Conflicting Claims",
    narration: "Ownership records show multiple competing claims: Penarth Estate Company purchase, unregistered Williams possession, and missing chain-of-title documentation from 1667 forward.",
    scenes: [
      { character: "Records Clerk", icon: "judge", side: "right", color: "#34495e", text: "These files show Penarth purchased from Bute, but Williams claim conflicts.", position: { x: 0, y: 0 } },
      { character: "Penarth Company Lawyer", icon: "lawyer", side: "right", color: "#2c3e50", text: "Our registered purchase trumps any unregistered occupant's assertion.", position: { x: 0, y: 0 } },
      { character: "Mary Williams", icon: "farmer", side: "left", color: "#16a085", text: "Adverse possession for three centuries establishes ownership by law!", position: { x: 0, y: 0 } },
      { character: "Penarth Company Lawyer", icon: "lawyer", side: "right", color: "#2c3e50", text: "You would need to prove exclusive possession without permission or rent.", position: { x: 0, y: 0 } },
      { character: "Mary Williams", icon: "farmer", side: "left", color: "#16a085", text: "We have paid nothing! Our occupation has been open and as of right!", position: { x: 0, y: 0 } }
    ],
    sources: [],
    attachments: emptyAttachments
  },
  {
    year: "1970",
    location: "Legal Office",
    locationType: "court",
    description: "Adverse Possession",
    narration: "Mary Williams consults solicitors about formally asserting ownership. Legal advice is that adverse possession for over 300 years creates a strong claim, but requires court determination.",
    scenes: [
      { character: "Solicitor", icon: "lawyer", side: "right", color: "#34495e", text: "Your family's continuous possession since 1667 supports adverse possession.", position: { x: 0, y: 0 } },
      { character: "Mary Williams", icon: "farmer", side: "left", color: "#16a085", text: "Then we can prove ownership and settle this once and for all?", position: { x: 0, y: 0 } },
      { character: "Solicitor", icon: "lawyer", side: "right", color: "#34495e", text: "Yes, but it requires court proceedings to obtain a declaratory judgment.", position: { x: 0, y: 0 } },
      { character: "Mary Williams", icon: "farmer", side: "left", color: "#16a085", text: "What if they refuse to rule on ownership and only address possession?", position: { x: 0, y: 0 } },
      { character: "Solicitor", icon: "lawyer", side: "right", color: "#34495e", text: "Ownership is the only issue that can conclusively resolve this dispute.", position: { x: 0, y: 0 } }
    ],
    sources: [],
    attachments: emptyAttachments
  },
  {
    year: "1974",
    location: "Court",
    locationType: "court",
    description: "Case Adjourned",
    narration: "Mary Williams initiates proceedings to assert ownership and possession of Great House Farm. The proceedings are adjourned sine die and effectively quashed without any determination of ownership.",
    scenes: [
      { character: "Mary Williams", icon: "farmer", side: "left", color: "#16a085", text: "I ask the court to determine that my family owns Great House Farm.", position: { x: 0, y: 0 } },
      { character: "Court Clerk", icon: "judge", side: "right", color: "#34495e", text: "The matter is adjourned indefinitely pending further information.", position: { x: 0, y: 0 } },
      { character: "Mary Williams' Solicitor", icon: "lawyer", side: "left", color: "#2c3e50", text: "But ownership is the central issue! Without that ruling, nothing is resolved.", position: { x: 0, y: 0 } },
      { character: "Judge", icon: "judge", side: "right", color: "#8e44ad", text: "We adjourn. The question of ownership is not determined at this time.", position: { x: 0, y: 0 } },
      { character: "Mary Williams", icon: "farmer", side: "left", color: "#16a085", text: "If ownership is never ruled upon, how can possession ever be lawfully settled?", position: { x: 0, y: 0 } }
    ],
    sources: [],
    attachments: emptyAttachments
  },
  {
    year: "1975",
    location: "Estate Agent's Office",
    locationType: "court",
    description: "Sale Disputed",
    narration: "Penarth Estate Company sells Great House Farm to new buyers. The sale proceeds as if ownership is settled, despite Mary Williams' unresolved legal proceedings and claim.",
    scenes: [
      { character: "Estate Agent", icon: "judge", side: "right", color: "#34495e", text: "Great House Farm transfers to new ownership following Penarth's sale.", position: { x: 0, y: 0 } },
      { character: "Mary Williams", icon: "farmer", side: "left", color: "#16a085", text: "You cannot sell what you do not own! My court case is still pending!", position: { x: 0, y: 0 } },
      { character: "Estate Agent", icon: "judge", side: "right", color: "#34495e", text: "The court adjourned your case. Our registered title permits this sale.", position: { x: 0, y: 0 } },
      { character: "Mary Williams", icon: "farmer", side: "left", color: "#16a085", text: "Adjourned means unresolved—not dismissed! Ownership was never determined!", position: { x: 0, y: 0 } }
    ],
    sources: [],
    attachments: emptyAttachments
  },
  {
    year: "1976",
    location: "Great House Farm",
    locationType: "farm",
    description: "Rent Demand",
    narration: "New claimed owners demand rent. The Williams-Buckler family refuses, asserting they own the property and owe nothing. The standoff intensifies as both sides prepare for litigation.",
    scenes: [
      { character: "New Owner's Agent", icon: "judge", side: "right", color: "#34495e", text: "You must pay rent or vacate. We hold title to this property.", position: { x: 0, y: 0 } },
      { character: "Billy Buckler", icon: "farmer", side: "left", color: "#16a085", text: "We own this farm! Our family has been here for over three centuries!", position: { x: 0, y: 0 } },
      { character: "New Owner's Agent", icon: "judge", side: "right", color: "#34495e", text: "Registered title is conclusive. Your occupation is without legal right.", position: { x: 0, y: 0 } },
      { character: "Billy Buckler", icon: "farmer", side: "left", color: "#16a085", text: "Our continuous possession creates title! You've never proven you own it!", position: { x: 0, y: 0 } },
      { character: "Mary Williams", icon: "farmer", side: "left", color: "#16a085", text: "The court has not ruled. Until ownership is determined, we stay.", position: { x: 0, y: 0 } }
    ],
    sources: [],
    attachments: emptyAttachments
  },
  {
    year: "1978",
    location: "Court",
    locationType: "court",
    description: "Possession vs Ownership",
    narration: "Legal proceedings commence to determine possession, but again ownership is not adjudicated. The court focuses on narrow possession questions without resolving the fundamental ownership dispute.",
    scenes: [
      { character: "Opposing Counsel", icon: "lawyer", side: "right", color: "#c0392b", text: "We seek possession based on our client's registered title to the property.", position: { x: 0, y: 0 } },
      { character: "Family Solicitor", icon: "lawyer", side: "left", color: "#34495e", text: "Respectfully, ownership must be determined first before possession can be ruled.", position: { x: 0, y: 0 } },
      { character: "Judge", icon: "judge", side: "right", color: "#8e44ad", text: "This court will determine possession. Ownership is a separate matter.", position: { x: 0, y: 0 } },
      { character: "Family Solicitor", icon: "lawyer", side: "left", color: "#34495e", text: "But possession flows from ownership! How can you rule on one without the other?", position: { x: 0, y: 0 } },
      { character: "Judge", icon: "judge", side: "right", color: "#8e44ad", text: "We proceed on the possession claim. The ownership issue is not before us.", position: { x: 0, y: 0 } }
    ],
    sources: [],
    attachments: emptyAttachments
  },
  {
    year: "1978",
    location: "Archaeological Rescue Dig",
    locationType: "ruins",
    description: "Rescue Dig",
    narration: "A small rescue excavation near Great House uncovers Roman remains, confirming archaeological significance, but the full extent is not disclosed and development pressures continue.",
    scenes: [
      { character: "Archaeologist", icon: "builder", side: "right", color: "#e67e22", text: "We've found Roman artifacts confirming the Williams family's 1870 discovery.", position: { x: 0, y: 0 } },
      { character: "Planning Officer", icon: "judge", side: "right", color: "#34495e", text: "This is a limited dig. We've no basis for full site protection at this time.", position: { x: 0, y: 0 } },
      { character: "Billy Buckler", icon: "farmer", side: "left", color: "#16a085", text: "This proves our home sits on a major historical site! It must be protected!", position: { x: 0, y: 0 } },
      { character: "Planning Officer", icon: "judge", side: "right", color: "#34495e", text: "Unless Cadw formally lists it, development can proceed subject to conditions.", position: { x: 0, y: 0 } },
      { character: "Archaeologist", icon: "builder", side: "right", color: "#e67e22", text: "The full extent of remains likely won't be known until after demolition.", position: { x: 0, y: 0 } }
    ],
    sources: [],
    attachments: emptyAttachments
  },
  {
    year: "1980",
    location: "Court",
    locationType: "court",
    description: "Possession Drags On",
    narration: "Possession proceedings drag on. The family argues that without determining ownership, any possession order is premature and procedurally unsafe, but their objection is not addressed.",
    scenes: [
      { character: "Family Solicitor", icon: "lawyer", side: "left", color: "#34495e", text: "You cannot lawfully determine possession without first establishing ownership!", position: { x: 0, y: 0 } },
      { character: "Judge", icon: "judge", side: "right", color: "#8e44ad", text: "The claim before us is for possession, not a declaration of ownership.", position: { x: 0, y: 0 } },
      { character: "Billy Buckler", icon: "farmer", side: "left", color: "#16a085", text: "But if they don't own it, they can't claim possession from us!", position: { x: 0, y: 0 } },
      { character: "Opposing Counsel", icon: "lawyer", side: "right", color: "#c0392b", text: "Our client has registered title. That is sufficient for this possession claim.", position: { x: 0, y: 0 } },
      { character: "Family Solicitor", icon: "lawyer", side: "left", color: "#34495e", text: "Registered title is not proof of ownership if obtained through defective process!", position: { x: 0, y: 0 } }
    ],
    sources: [],
    attachments: emptyAttachments
  },
  {
    year: "1982",
    location: "Property Transfer",
    locationType: "court",
    description: "BP Acquires",
    narration: "Great House Farm is sold again to BP Properties. The transfer proceeds despite ongoing litigation and unresolved ownership, with BP acquiring whatever rights the previous owner held.",
    scenes: [
      { character: "BP Properties Lawyer", icon: "lawyer", side: "right", color: "#c0392b", text: "We purchase Great House Farm with clear registered title from the vendor.", position: { x: 0, y: 0 } },
      { character: "Mary Williams", icon: "farmer", side: "left", color: "#16a085", text: "Another sale! They keep selling our home while ownership remains unproven!", position: { x: 0, y: 0 } },
      { character: "BP Properties Lawyer", icon: "lawyer", side: "right", color: "#c0392b", text: "Your litigation addresses possession, not our title. We are bona fide purchasers.", position: { x: 0, y: 0 } },
      { character: "Billy Buckler", icon: "farmer", side: "left", color: "#16a085", text: "How can you be bona fide when our claim and occupation are obvious?", position: { x: 0, y: 0 } },
      { character: "BP Properties Lawyer", icon: "lawyer", side: "right", color: "#c0392b", text: "Our reliance on registered title protects us. Your claim is against the vendor.", position: { x: 0, y: 0 } }
    ],
    sources: [],
    attachments: emptyAttachments
  },
  {
    year: "1983",
    location: "Legal Office",
    locationType: "court",
    description: "Missing Deeds",
    narration: "The family alleges that crucial documentation, including the 1667 deed and later conveyances, has been removed, lost, or destroyed, preventing them from producing documentary proof of title.",
    scenes: [
      { character: "Family Solicitor", icon: "lawyer", side: "left", color: "#34495e", text: "The 1667 deed and manorial records that would prove your claim are missing.", position: { x: 0, y: 0 } },
      { character: "Mary Williams", icon: "farmer", side: "left", color: "#16a085", text: "They were in our family's keeping! Where have these vital documents gone?", position: { x: 0, y: 0 } },
      { character: "Archive Clerk", icon: "judge", side: "right", color: "#34495e", text: "We have no record of any Williams conveyance in the Bute estate archives.", position: { x: 0, y: 0 } },
      { character: "Billy Buckler", icon: "farmer", side: "left", color: "#16a085", text: "Convenient that every document proving our ownership has vanished!", position: { x: 0, y: 0 } },
      { character: "Family Solicitor", icon: "lawyer", side: "left", color: "#34495e", text: "Missing deeds raise serious questions about document suppression and fraud.", position: { x: 0, y: 0 } }
    ],
    sources: [],
    attachments: emptyAttachments
  },
  {
    year: "1984",
    location: "BP Properties Offices",
    locationType: "court",
    description: "Licence Claim",
    narration: "BP Properties asserts title to Great House Farm, relying on registered ownership, but does not obtain a judicial determination of ownership. Instead, a licence arrangement is introduced.",
    scenes: [
      { character: "BP Properties Agent", icon: "judge", side: "right", color: "#34495e", text: "We hold registered title. The family's continued occupation is by our licence.", position: { x: 0, y: 0 } },
      { character: "Family Solicitor", icon: "lawyer", side: "left", color: "#34495e", text: "When was this licence granted? We never agreed to any licence arrangement!", position: { x: 0, y: 0 } },
      { character: "BP Properties Agent", icon: "judge", side: "right", color: "#34495e", text: "The licence is recorded in our files, issued to Mrs Buckler in prior years.", position: { x: 0, y: 0 } },
      { character: "Billy Buckler", icon: "farmer", side: "left", color: "#16a085", text: "My mother is Mary Williams, not Mrs Buckler! Show us this document!", position: { x: 0, y: 0 } },
      { character: "BP Properties Agent", icon: "judge", side: "right", color: "#34495e", text: "Our records refer to Mrs Buckler as the occupant under our licence.", position: { x: 0, y: 0 } }
    ],
    sources: [],
    attachments: emptyAttachments
  },
  {
    year: "1985",
    location: "Court",
    locationType: "court",
    description: "Identity Substitution",
    narration: "In court, BP's lawyers produce a licence document substituting 'Mrs Buckler' for Mary Williams. The factual and legal basis for this identity substitution is never tested or explained.",
    scenes: [
      { character: "Opposing Counsel", icon: "lawyer", side: "right", color: "#c0392b", text: "Our client's records show a licence granted to Mrs Buckler for occupation.", position: { x: 0, y: 0 } },
      { character: "Family Solicitor", icon: "lawyer", side: "left", color: "#34495e", text: "Mrs Williams has always used her maiden name! This substitution is suspicious!", position: { x: 0, y: 0 } },
      { character: "Judge", icon: "judge", side: "right", color: "#8e44ad", text: "The licence document refers to Mrs Buckler. Is that not the same person?", position: { x: 0, y: 0 } },
      { character: "Mary Williams", icon: "farmer", side: "left", color: "#16a085", text: "I am Mary Williams! I have never accepted the name Buckler on legal documents!", position: { x: 0, y: 0 } },
      { character: "Opposing Counsel", icon: "lawyer", side: "right", color: "#c0392b", text: "Mary Williams married Frederick Buckler. Mrs Buckler is her legal identity.", position: { x: 0, y: 0 } }
    ],
    sources: [],
    attachments: emptyAttachments
  },
  {
    year: "1985",
    location: "Heritage Investigation",
    locationType: "ruins",
    description: "Cadw Denies",
    narration: "The family raises the 1870 Roman soldier discovery and requests Cadw investigate before any demolition, but officials say they need formal application and supporting evidence to list.",
    scenes: [
      { character: "Billy Buckler", icon: "farmer", side: "left", color: "#16a085", text: "We found a Roman soldier here in 1870! This site must be protected!", position: { x: 0, y: 0 } },
      { character: "Cadw Officer", icon: "judge", side: "right", color: "#34495e", text: "Do you have archaeological reports or documentation of the discovery?", position: { x: 0, y: 0 } },
      { character: "Mary Williams", icon: "farmer", side: "left", color: "#16a085", text: "It was our family's discovery! This proves the site's national importance!", position: { x: 0, y: 0 } },
      { character: "Cadw Officer", icon: "judge", side: "right", color: "#34495e", text: "Without documented evidence, we cannot proceed with emergency listing.", position: { x: 0, y: 0 } },
      { character: "Billy Buckler", icon: "farmer", side: "left", color: "#16a085", text: "So family testimony of archaeological finds is ignored until it's too late?", position: { x: 0, y: 0 } }
    ],
    sources: [],
    attachments: emptyAttachments
  },
  {
    year: "1986",
    location: "Court",
    locationType: "court",
    description: "Fraud Alleged",
    narration: "Proceedings intensify. The family argues fraud, suppressed evidence, and lack of ownership determination. These allegations are noted but no investigation is ordered or conducted.",
    scenes: [
      { character: "Family Solicitor", icon: "lawyer", side: "left", color: "#34495e", text: "We allege fraud in the procurement of title and deliberate document suppression.", position: { x: 0, y: 0 } },
      { character: "Opposing Counsel", icon: "lawyer", side: "right", color: "#c0392b", text: "These are serious allegations without proof. Our client's title is registered.", position: { x: 0, y: 0 } },
      { character: "Family Solicitor", icon: "lawyer", side: "left", color: "#34495e", text: "The missing 1667 deed and identity substitution demand investigation!", position: { x: 0, y: 0 } },
      { character: "Judge", icon: "judge", side: "right", color: "#8e44ad", text: "Your fraud allegations are noted, but this court's focus is the possession claim.", position: { x: 0, y: 0 } },
      { character: "Family Solicitor", icon: "lawyer", side: "left", color: "#34495e", text: "Under Takhar v Gracefield, fraud unravels all—but only if investigated!", position: { x: 0, y: 0 } }
    ],
    sources: [],
    attachments: emptyAttachments
  },
  {
    year: "1986",
    location: "Planning Department",
    locationType: "court",
    description: "Demolition Plan",
    narration: "BP Properties applies for planning permission to demolish Great House Farm. The application proceeds without disclosure of the Roman burial or the ongoing ownership dispute.",
    scenes: [
      { character: "Planning Officer", icon: "judge", side: "right", color: "#34495e", text: "BP Properties seeks permission to demolish and redevelop Great House Farm.", position: { x: 0, y: 0 } },
      { character: "Local Councillor", icon: "judge", side: "left", color: "#7f8c8d", text: "What about the family's claim? And the archaeological significance?", position: { x: 0, y: 0 } },
      { character: "Planning Officer", icon: "judge", side: "right", color: "#34495e", text: "The ownership dispute is civil law. We assess the planning merits only.", position: { x: 0, y: 0 } },
      { character: "Billy Buckler", icon: "farmer", side: "left", color: "#16a085", text: "You can't permit demolition when ownership is contested and Roman remains exist!", position: { x: 0, y: 0 } },
      { character: "Planning Officer", icon: "judge", side: "right", color: "#34495e", text: "Without official heritage listing, we cannot refuse based on archaeology.", position: { x: 0, y: 0 } }
    ],
    sources: [],
    attachments: emptyAttachments
  },
  {
    year: "1987",
    location: "High Court",
    locationType: "court",
    description: "House of Lords",
    narration: "In BP Properties Ltd v Buckler (1987), the House of Lords determines possession without adjudicating ownership. The judgment permits eviction while ownership remains unresolved.",
    scenes: [
      { character: "Law Lord", icon: "judge", side: "right", color: "#8e44ad", text: "We rule on the possession claim. Ownership is not the question before this court.", position: { x: 0, y: 0 } },
      { character: "Family Barrister", icon: "lawyer", side: "left", color: "#34495e", text: "My Lords, without determining ownership, this ruling is procedurally defective!", position: { x: 0, y: 0 } },
      { character: "Law Lord", icon: "judge", side: "right", color: "#8e44ad", text: "The appellant's possession claim succeeds based on registered title and licence.", position: { x: 0, y: 0 } },
      { character: "Family Barrister", icon: "lawyer", side: "left", color: "#34495e", text: "But the licence document is suspect! Identity substitution was never explained!", position: { x: 0, y: 0 } },
      { character: "Law Lord", icon: "judge", side: "right", color: "#8e44ad", text: "The appeal is dismissed. BP Properties is entitled to possession.", position: { x: 0, y: 0 } }
    ],
    sources: [],
    attachments: emptyAttachments
  },
  {
    year: "1987",
    location: "Family Meeting",
    locationType: "farm",
    description: "Family Rift",
    narration: "After the House of Lords ruling, the family discovers Frederick Buckler may have secretly settled or sold interests before proceedings, causing internal confusion and a family rift.",
    scenes: [
      { character: "David Buckler", icon: "farmer", side: "left", color: "#16a085", text: "Dad said Grandad Frederick 'sorted it legally' before he died in secret.", position: { x: 0, y: 0 } },
      { character: "Billy Buckler", icon: "farmer", side: "left", color: "#16a085", text: "What did he sort? He never told us what he signed or agreed to!", position: { x: 0, y: 0 } },
      { character: "Mary Williams", icon: "farmer", side: "left", color: "#16a085", text: "I never authorized any settlement! I am the Williams heir, not him!", position: { x: 0, y: 0 } },
      { character: "David Buckler", icon: "farmer", side: "left", color: "#16a085", text: "That secrecy caused a rift and left us unsure what rights were signed away.", position: { x: 0, y: 0 } },
      { character: "Billy Buckler", icon: "farmer", side: "left", color: "#16a085", text: "If Grandad secretly dealt away our inheritance, that's another fraud!", position: { x: 0, y: 0 } }
    ],
    sources: [],
    attachments: emptyAttachments
  },
  {
    year: "1987",
    location: "European Court Inquiry",
    locationType: "court",
    description: "ECHR Blocked",
    narration: "The family prepares to appeal to the European Court of Human Rights, arguing procedural unfairness and property rights violations, but access to supranational remedies is obstructed.",
    scenes: [
      { character: "European Rights Lawyer", icon: "lawyer", side: "left", color: "#34495e", text: "You have grounds for an Article 1 Protocol 1 claim on property deprivation.", position: { x: 0, y: 0 } },
      { character: "Billy Buckler", icon: "farmer", side: "left", color: "#16a085", text: "Finally, a court that might examine what UK courts refused to address!", position: { x: 0, y: 0 } },
      { character: "Government Solicitor", icon: "lawyer", side: "right", color: "#c0392b", text: "Domestic remedies have not been exhausted. The application is premature.", position: { x: 0, y: 0 } },
      { character: "European Rights Lawyer", icon: "lawyer", side: "left", color: "#34495e", text: "Every UK court refused to determine ownership! What remedy remains?", position: { x: 0, y: 0 } },
      { character: "Government Solicitor", icon: "lawyer", side: "right", color: "#c0392b", text: "Procedural rules bar this application. Domestic courts have ruled conclusively.", position: { x: 0, y: 0 } }
    ],
    sources: [],
    attachments: emptyAttachments
  },
  {
    year: "1988",
    location: "Great House Farm",
    locationType: "farm",
    description: "Eviction Threat",
    narration: "BP Properties presses for immediate possession. The family refuses to vacate, asserting ownership was never proven and warning that demolition will destroy irreplaceable heritage and evidence.",
    scenes: [
      { character: "BP Properties Agent", icon: "judge", side: "right", color: "#34495e", text: "You must vacate immediately. The court has granted us possession.", position: { x: 0, y: 0 } },
      { character: "Billy Buckler", icon: "farmer", side: "left", color: "#16a085", text: "Possession was granted, but ownership was never proven in any court!", position: { x: 0, y: 0 } },
      { character: "BP Properties Agent", icon: "judge", side: "right", color: "#34495e", text: "The House of Lords has ruled. Further resistance is contempt of court.", position: { x: 0, y: 0 } },
      { character: "Mary Williams", icon: "farmer", side: "left", color: "#16a085", text: "This house is over 800 years old! Demolition destroys our heritage forever!", position: { x: 0, y: 0 } },
      { character: "Billy Buckler", icon: "farmer", side: "left", color: "#16a085", text: "And it destroys the Roman site underneath! This is deliberate evidence destruction!", position: { x: 0, y: 0 } }
    ],
    sources: [],
    attachments: emptyAttachments
  },
  {
    year: "1988",
    location: "Enforcement Attempt",
    locationType: "farm",
    description: "Bailiffs Arrive",
    narration: "Bailiffs arrive to enforce possession, but the family resists, barricading themselves inside Great House Farm and refusing to leave without a ruling on ownership and heritage protection.",
    scenes: [
      { character: "Bailiff", icon: "guard", side: "right", color: "#34495e", text: "We are here to enforce the court order for possession. Open the door.", position: { x: 0, y: 0 } },
      { character: "Billy Buckler", icon: "farmer", side: "left", color: "#16a085", text: "Not until ownership is proven and this site's archaeology is protected!", position: { x: 0, y: 0 } },
      { character: "Bailiff", icon: "guard", side: "right", color: "#34495e", text: "You are in contempt of court. Police assistance will be requested.", position: { x: 0, y: 0 } },
      { character: "Mary Williams", icon: "farmer", side: "left", color: "#16a085", text: "We are the rightful owners! This eviction is based on fraud and deceit!", position: { x: 0, y: 0 } },
      { character: "Billy Buckler", icon: "farmer", side: "left", color: "#16a085", text: "Demolish this house and you destroy evidence of national importance!", position: { x: 0, y: 0 } }
    ],
    sources: [],
    attachments: emptyAttachments
  },
  {
    year: "1988",
    location: "Standoff at Great House",
    locationType: "farm",
    description: "The Standoff",
    narration: "A tense standoff ensues. Bailiffs, police, and media surround Great House Farm. Inside, the Williams-Buckler family vows to resist until ownership is judicially determined and heritage protected.",
    scenes: [
      { character: "Police Commander", icon: "guard", side: "right", color: "#2c3e50", text: "This situation must be resolved peacefully. Will you exit voluntarily?", position: { x: 0, y: 0 } },
      { character: "Billy Buckler", icon: "farmer", side: "left", color: "#16a085", text: "Only if the court determines ownership and Cadw protects this site!", position: { x: 0, y: 0 } },
      { character: "Media Reporter", icon: "news", side: "left", color: "#7f8c8d", text: "Why has ownership never been ruled on in over a decade of litigation?", position: { x: 0, y: 0 } },
      { character: "Police Commander", icon: "guard", side: "right", color: "#2c3e50", text: "Our role is enforcement, not adjudication. The courts have ruled.", position: { x: 0, y: 0 } },
      { character: "Billy Buckler", icon: "farmer", side: "left", color: "#16a085", text: "The courts ruled on possession, not ownership! That's the entire point!", position: { x: 0, y: 0 } }
    ],
    sources: [],
    attachments: emptyAttachments
  },
  {
    year: "1988",
    location: "Violent Eviction",
    locationType: "farm",
    description: "Forced Eviction",
    narration: "Police storm Great House Farm. Billy Buckler is injured and hospitalized during the forcible eviction. The family, including pregnant Branwen and young children, are removed by force.",
    scenes: [
      { character: "Billy Buckler", icon: "farmer", side: "left", color: "#16a085", text: "You have no right! This is our home! Ownership was never proven!", position: { x: 0, y: 0 } },
      { character: "Police Officer", icon: "guard", side: "right", color: "#2c3e50", text: "We are enforcing a court order. Resisting will result in arrest.", position: { x: 0, y: 0 } },
      { character: "Branwen Buckler", icon: "farmer", side: "left", color: "#16a085", text: "Please! I am pregnant and we have small children! Where will we go?", position: { x: 0, y: 0 } },
      { character: "Police Officer", icon: "guard", side: "right", color: "#2c3e50", text: "Social services will assist. You must vacate immediately.", position: { x: 0, y: 0 } },
      { character: "Billy Buckler", icon: "farmer", side: "left", color: "#16a085", text: "This is state-sanctioned theft! Our family has been here for 321 years!", position: { x: 0, y: 0 } }
    ],
    sources: [],
    attachments: emptyAttachments
  },
  {
    year: "1988",
    location: "Hospital",
    locationType: "other",
    description: "Hospitalized",
    narration: "Billy Buckler is hospitalized with injuries sustained during the eviction. The family is homeless, separated, and traumatized. Their possessions remain inside the sealed property.",
    scenes: [
      { character: "Nurse", icon: "cleric", side: "right", color: "#3498db", text: "You have significant injuries from the eviction. You need to rest here.", position: { x: 0, y: 0 } },
      { character: "Billy Buckler", icon: "farmer", side: "left", color: "#16a085", text: "I need to get back to protect my home and my family's possessions!", position: { x: 0, y: 0 } },
      { character: "Mary Williams", icon: "farmer", side: "left", color: "#16a085", text: "They've locked us out of our own home! Everything we own is still inside!", position: { x: 0, y: 0 } },
      { character: "Doctor", icon: "cleric", side: "right", color: "#3498db", text: "You're in no condition to leave. The police have barred you from the site.", position: { x: 0, y: 0 } },
      { character: "Billy Buckler", icon: "farmer", side: "left", color: "#16a085", text: "What about my pregnant wife and children? Where are they sleeping tonight?", position: { x: 0, y: 0 } }
    ],
    sources: [],
    attachments: emptyAttachments
  },
  {
    year: "1988",
    location: "Emergency Accommodation",
    locationType: "other",
    description: "Homeless",
    narration: "Branwen and the children stay with relatives. The family's belongings, farm equipment, and Mary Williams' journal documenting visitors and events are sealed inside Great House.",
    scenes: [
      { character: "Branwen Buckler", icon: "farmer", side: "left", color: "#16a085", text: "We're sleeping in my sister's front room with three children and one on the way.", position: { x: 0, y: 0 } },
      { character: "Relative", icon: "farmer", side: "right", color: "#7f8c8d", text: "You can stay as long as needed, but what will happen to your things?", position: { x: 0, y: 0 } },
      { character: "Branwen Buckler", icon: "farmer", side: "left", color: "#16a085", text: "Everything is locked inside—furniture, clothes, equipment, Nan's journal.", position: { x: 0, y: 0 } },
      { character: "Mary Williams", icon: "farmer", side: "left", color: "#16a085", text: "My journal had names, dates, visitors—evidence of everything that happened!", position: { x: 0, y: 0 } },
      { character: "Branwen Buckler", icon: "farmer", side: "left", color: "#16a085", text: "They've taken our home and trapped our proof inside with it.", position: { x: 0, y: 0 } }
    ],
    sources: [],
    attachments: emptyAttachments
  },
  {
    year: "1988",
    location: "Legal Office",
    locationType: "court",
    description: "Injunction Sought",
    narration: "The family's lawyers seek an emergency injunction to halt demolition pending heritage review and investigation of fraud allegations, but face procedural obstacles and time pressure.",
    scenes: [
      { character: "Family Solicitor", icon: "lawyer", side: "left", color: "#34495e", text: "We need an emergency injunction to stop demolition until Cadw investigates.", position: { x: 0, y: 0 } },
      { character: "Court Clerk", icon: "judge", side: "right", color: "#34495e", text: "You must demonstrate irreparable harm and good grounds for the injunction.", position: { x: 0, y: 0 } },
      { character: "Family Solicitor", icon: "lawyer", side: "left", color: "#34495e", text: "Demolition destroys an 800-year-old building and a Roman archaeological site!", position: { x: 0, y: 0 } },
      { character: "Court Clerk", icon: "judge", side: "right", color: "#34495e", text: "Is the building listed? Has Cadw granted statutory protection?", position: { x: 0, y: 0 } },
      { character: "Family Solicitor", icon: "lawyer", side: "left", color: "#34495e", text: "Not yet, but we've applied! Demolition before listing would be irreversible!", position: { x: 0, y: 0 } }
    ],
    sources: [],
    attachments: emptyAttachments
  },
  {
    year: "1988",
    location: "Court",
    locationType: "court",
    description: "Temporary Halt",
    narration: "A temporary injunction is granted, halting demolition for a brief period while Cadw considers emergency listing and the family's appeal attempts proceed through legal channels.",
    scenes: [
      { character: "Judge", icon: "judge", side: "right", color: "#8e44ad", text: "I grant a temporary injunction against demolition pending further hearing.", position: { x: 0, y: 0 } },
      { character: "BP Properties Lawyer", icon: "lawyer", side: "right", color: "#c0392b", text: "This injunction frustrates our lawful rights following the House of Lords ruling!", position: { x: 0, y: 0 } },
      { character: "Family Solicitor", icon: "lawyer", side: "left", color: "#34495e", text: "Heritage protection and fraud allegations must be examined before demolition!", position: { x: 0, y: 0 } },
      { character: "Judge", icon: "judge", side: "right", color: "#8e44ad", text: "The injunction is limited in time. Cadw must decide on listing promptly.", position: { x: 0, y: 0 } },
      { character: "BP Properties Lawyer", icon: "lawyer", side: "right", color: "#c0392b", text: "Every delay costs our client money and undermines the finality of judgments.", position: { x: 0, y: 0 } }
    ],
    sources: [],
    attachments: emptyAttachments
  },
  {
    year: "1988",
    location: "Cadw Offices",
    locationType: "court",
    description: "Listing Denied",
    narration: "Cadw conducts a rushed assessment of Great House Farm for emergency listing, but pressure from BP Properties and lack of accessible documentation impede the evaluation process.",
    scenes: [
      { character: "Cadw Inspector", icon: "judge", side: "right", color: "#34495e", text: "We need detailed architectural and historical evidence for listing.", position: { x: 0, y: 0 } },
      { character: "Billy Buckler", icon: "farmer", side: "left", color: "#16a085", text: "The house is 800 years old and sits on a Roman burial site!", position: { x: 0, y: 0 } },
      { character: "Cadw Inspector", icon: "judge", side: "right", color: "#34495e", text: "Can you provide structural surveys, historical documentation, archaeological reports?", position: { x: 0, y: 0 } },
      { character: "Billy Buckler", icon: "farmer", side: "left", color: "#16a085", text: "All our family records were sealed inside when they evicted us!", position: { x: 0, y: 0 } },
      { character: "Cadw Inspector", icon: "judge", side: "right", color: "#34495e", text: "Without supporting documentation, emergency listing is difficult to justify.", position: { x: 0, y: 0 } }
    ],
    sources: [],
    attachments: emptyAttachments
  },
  {
    year: "1988",
    location: "Press Conference",
    locationType: "news",
    description: "Public Appeal",
    narration: "The family appeals to the media and public, explaining that ownership was never determined, archaeological evidence was suppressed, and heritage protection has been denied.",
    scenes: [
      { character: "Billy Buckler", icon: "farmer", side: "left", color: "#16a085", text: "In over a decade of court cases, no judge has ever ruled who owns this property!", position: { x: 0, y: 0 } },
      { character: "Journalist", icon: "news", side: "right", color: "#7f8c8d", text: "Why not? Isn't ownership the fundamental question in a possession case?", position: { x: 0, y: 0 } },
      { character: "Billy Buckler", icon: "farmer", side: "left", color: "#16a085", text: "Exactly! They avoided that because our 321 years of possession proves ownership!", position: { x: 0, y: 0 } },
      { character: "Journalist", icon: "news", side: "right", color: "#7f8c8d", text: "What about the archaeological finds your family discovered?", position: { x: 0, y: 0 } },
      { character: "Billy Buckler", icon: "farmer", side: "left", color: "#16a085", text: "Ignored until it's convenient to dig up what's left after they destroy the house!", position: { x: 0, y: 0 } }
    ],
    sources: [],
    attachments: emptyAttachments
  },
  {
    year: "1988",
    location: "Community Meeting",
    locationType: "other",
    description: "Community Outrage",
    narration: "Local residents and councillors express outrage at the eviction and planned demolition, condemning BP Properties for destroying heritage and the authorities for enabling it.",
    scenes: [
      { character: "Local Councillor", icon: "judge", side: "left", color: "#7f8c8d", text: "This eviction and demolition plan is a travesty of justice!", position: { x: 0, y: 0 } },
      { character: "Community Member", icon: "farmer", side: "right", color: "#7f8c8d", text: "How can they demolish an 800-year-old building on a Roman burial ground?", position: { x: 0, y: 0 } },
      { character: "Local Councillor", icon: "judge", side: "left", color: "#7f8c8d", text: "We've demanded BP halt demolition and the council refuse planning permission!", position: { x: 0, y: 0 } },
      { character: "Planning Officer", icon: "judge", side: "right", color: "#34495e", text: "The council has limited powers once court possession orders are granted.", position: { x: 0, y: 0 } },
      { character: "Community Member", icon: "farmer", side: "right", color: "#7f8c8d", text: "So corporate interests override heritage, history, and a family's 321-year claim?", position: { x: 0, y: 0 } }
    ],
    sources: [],
    attachments: emptyAttachments
  },
  {
    year: "1988",
    location: "MP's Office",
    locationType: "court",
    description: "Political Intervention",
    narration: "Cardiff MP Alun Michael asks the Lord Chancellor to review the case, highlighting the failure to determine ownership and the procedural anomalies throughout the litigation.",
    scenes: [
      { character: "Alun Michael MP", icon: "judge", side: "left", color: "#34495e", text: "Lord Chancellor, this case shows serious procedural failures and injustice.", position: { x: 0, y: 0 } },
      { character: "Lord Chancellor's Aide", icon: "judge", side: "right", color: "#8e44ad", text: "The courts have ruled at the highest level. What grounds justify review?", position: { x: 0, y: 0 } },
      { character: "Alun Michael MP", icon: "judge", side: "left", color: "#34495e", text: "Ownership was never determined! That's a fundamental defect in every ruling!", position: { x: 0, y: 0 } },
      { character: "Lord Chancellor's Aide", icon: "judge", side: "right", color: "#8e44ad", text: "The House of Lords addressed the possession claim comprehensively.", position: { x: 0, y: 0 } },
      { character: "Alun Michael MP", icon: "judge", side: "left", color: "#34495e", text: "But possession without ownership determination is procedurally unsafe and unjust!", position: { x: 0, y: 0 } }
    ],
    sources: [],
    attachments: emptyAttachments
  },
  {
    year: "1988",
    location: "Heritage Waiting Period",
    locationType: "ruins",
    description: "Clock Ticks",
    narration: "As days pass, the temporary injunction approaches expiry. Cadw has not granted emergency listing. BP Properties presses for the injunction to be lifted and demolition to proceed.",
    scenes: [
      { character: "Cadw Spokesperson", icon: "judge", side: "right", color: "#34495e", text: "We are considering, but have not granted, emergency listing for Great House.", position: { x: 0, y: 0 } },
      { character: "Janet Harris (Buckler)", icon: "farmer", side: "left", color: "#16a085", text: "This very old house still has no legal protection against demolition.", position: { x: 0, y: 0 } },
      { character: "BP Properties Lawyer", icon: "lawyer", side: "right", color: "#c0392b", text: "The injunction must be lifted. Our client has been unlawfully delayed.", position: { x: 0, y: 0 } },
      { character: "Family Solicitor", icon: "lawyer", side: "left", color: "#34495e", text: "If demolition proceeds before listing, heritage is lost forever!", position: { x: 0, y: 0 } },
      { character: "BP Properties Lawyer", icon: "lawyer", side: "right", color: "#c0392b", text: "Speculation about heritage cannot indefinitely frustrate lawful property rights.", position: { x: 0, y: 0 } }
    ],
    sources: [],
    attachments: emptyAttachments
  },
  {
    year: "1988",
    location: "High Court Cardiff",
    locationType: "court",
    description: "Injunction Lifted",
    narration: "A judge refuses to extend the injunction. Cadw declines emergency listing. Demolition is cleared to proceed with registered title upheld and no investigation of fraud or missing deeds.",
    scenes: [
      { character: "Judge", icon: "judge", side: "right", color: "#8e44ad", text: "There is no sufficient legal basis to continue the demolition injunction.", position: { x: 0, y: 0 } },
      { character: "Family Solicitor", icon: "lawyer", side: "left", color: "#34495e", text: "But the archaeology and fraud allegations remain uninvestigated!", position: { x: 0, y: 0 } },
      { character: "Judge", icon: "judge", side: "right", color: "#8e44ad", text: "Those matters do not support further delay of lawful possession and use.", position: { x: 0, y: 0 } },
      { character: "Family Solicitor", icon: "lawyer", side: "left", color: "#34495e", text: "Once the house is demolished, European Court review cannot restore it!", position: { x: 0, y: 0 } },
      { character: "Janet Harris (Buckler)", icon: "farmer", side: "left", color: "#16a085", text: "Without listing, they're now free to demolish the building immediately.", position: { x: 0, y: 0 } }
    ],
    sources: [],
    attachments: emptyAttachments
  },
  {
    year: "1988",
    location: "Great House Farm",
    locationType: "ruins",
    description: "Demolition",
    narration: "On 6 December 1988, Great House Farm is demolished overnight, hours after the final court decision, ending over three centuries of Williams-Buckler occupation and destroying the structure.",
    scenes: [
      { character: "Billy Buckler", icon: "farmer", side: "left", color: "#16a085", text: "The farmhouse has been demolished overnight after the court ruling.", position: { x: 0, y: 0 } },
      { character: "Branwen Buckler", icon: "farmer", side: "left", color: "#16a085", text: "We watched from the caravan as the house was taken down to rubble.", position: { x: 0, y: 0 } },
      { character: "Demolition Foreman", icon: "worker", side: "right", color: "#e67e22", text: "We carried out demolition as instructed once legal clearance was given.", position: { x: 0, y: 0 } },
      { character: "Local Observer", icon: "news", side: "left", color: "#7f8c8d", text: "They demolished it immediately—no delay for appeals or heritage review.", position: { x: 0, y: 0 } },
      { character: "Billy Buckler", icon: "farmer", side: "left", color: "#16a085", text: "They destroyed our home and all the evidence inside before anyone could act!", position: { x: 0, y: 0 } }
    ],
    sources: [],
    attachments: emptyAttachments
  },
  {
    year: "1988",
    location: "Hospital / Court",
    locationType: "court",
    description: "Arrested",
    narration: "Shortly after demolition and eviction, police take Billy from his hospital bed to face charges of assaulting two bailiffs during the enforcement action at Great House Farm.",
    scenes: [
      { character: "Police Officer", icon: "guard", side: "right", color: "#2c3e50", text: "You are under arrest for assaults alleged during the eviction process.", position: { x: 0, y: 0 } },
      { character: "Billy Buckler", icon: "farmer", side: "left", color: "#16a085", text: "I am being brought from hospital to answer charges tied to the eviction.", position: { x: 0, y: 0 } },
      { character: "Billy Buckler", icon: "farmer", side: "left", color: "#16a085", text: "I was defending my family's home from an unlawful eviction!", position: { x: 0, y: 0 } },
      { character: "Police Officer", icon: "guard", side: "right", color: "#2c3e50", text: "The eviction was court-ordered. Resistance constitutes assault and contempt.", position: { x: 0, y: 0 } },
      { character: "Billy Buckler", icon: "farmer", side: "left", color: "#16a085", text: "How can it be lawful when ownership was never proven in any court?", position: { x: 0, y: 0 } }
    ],
    sources: [],
    attachments: emptyAttachments
  },
  {
    year: "1988",
    location: "Demolished Site",
    locationType: "ruins",
    description: "Battleground",
    narration: "Officials report that the cleared farm site resembles a battleground. The local authority begins legal steps to require BP Properties to remove debris and restore basic order.",
    scenes: [
      { character: "Planning Chief", icon: "judge", side: "right", color: "#34495e", text: "The condition of the site is unacceptable; we will seek enforcement.", position: { x: 0, y: 0 } },
      { character: "Local Councillor", icon: "judge", side: "left", color: "#7f8c8d", text: "We intend to require BP to clear rubble and restore basic order.", position: { x: 0, y: 0 } },
      { character: "Vale Councillor", icon: "judge", side: "left", color: "#7f8c8d", text: "We regard BP's complete flattening of the site as wholly unjustified.", position: { x: 0, y: 0 } },
      { character: "BP Properties Agent", icon: "judge", side: "right", color: "#34495e", text: "We demolished our own property lawfully. Cleanup is underway.", position: { x: 0, y: 0 } },
      { character: "Local Councillor", icon: "judge", side: "left", color: "#7f8c8d", text: "This destruction of heritage and a family's home is a disgrace!", position: { x: 0, y: 0 } }
    ],
    sources: [],
    attachments: emptyAttachments
  },
  {
    year: "1988",
    location: "Temporary Accommodation",
    locationType: "other",
    description: "Losses",
    narration: "After losing the farmhouse and contents, the family live in temporary and borrowed accommodation. Billy estimates their lost belongings and livelihood at roughly thirty thousand pounds.",
    scenes: [
      { character: "Billy Buckler", icon: "farmer", side: "left", color: "#16a085", text: "After eviction I have no house, stock, or equipment left to rely on.", position: { x: 0, y: 0 } },
      { character: "Branwen Buckler", icon: "farmer", side: "left", color: "#16a085", text: "We are staying with family members while we have three children and one due.", position: { x: 0, y: 0 } },
      { character: "Billy Buckler", icon: "farmer", side: "left", color: "#16a085", text: "I estimate our lost property and livelihood at about thirty thousand pounds.", position: { x: 0, y: 0 } },
      { character: "Mary Williams", icon: "farmer", side: "left", color: "#16a085", text: "Our entire lives, our heritage, our proof—all locked inside and then destroyed.", position: { x: 0, y: 0 } },
      { character: "Branwen Buckler", icon: "farmer", side: "left", color: "#16a085", text: "They've taken everything—our home, our history, our future.", position: { x: 0, y: 0 } }
    ],
    sources: [],
    attachments: emptyAttachments
  },
  {
    year: "1989",
    location: "Court",
    locationType: "court",
    description: "Charges Dropped",
    narration: "A threatening-behaviour charge against Billy is withdrawn as out of time. Assault and driving allegations from the eviction events continue, and exclusion conditions remain in place.",
    scenes: [
      { character: "Prosecutor Clarke", icon: "lawyer", side: "right", color: "#c0392b", text: "We withdraw the threatening-behaviour count as the summons is late.", position: { x: 0, y: 0 } },
      { character: "Billy Buckler", icon: "farmer", side: "left", color: "#16a085", text: "Even so, I am still barred from going near the former farm site.", position: { x: 0, y: 0 } },
      { character: "Billy Buckler", icon: "farmer", side: "left", color: "#16a085", text: "They evict us by force, then prosecute me for resisting their violence!", position: { x: 0, y: 0 } },
      { character: "Prosecutor Clarke", icon: "lawyer", side: "right", color: "#c0392b", text: "The court order was lawful. Your resistance constituted criminal conduct.", position: { x: 0, y: 0 } },
      { character: "Billy Buckler", icon: "farmer", side: "left", color: "#16a085", text: "Nothing about this was lawful! Ownership was never proven!", position: { x: 0, y: 0 } }
    ],
    sources: [],
    attachments: emptyAttachments
  },
  {
    year: "1989",
    location: "Court",
    locationType: "court",
    description: "Guilty Plea",
    narration: "Billy pleads guilty to remaining charges and is freed, stating that he will continue to contest the loss of the family home and land despite the completed demolition.",
    scenes: [
      { character: "Billy Buckler", icon: "farmer", side: "left", color: "#16a085", text: "I will go on challenging how our home and the land were taken from us.", position: { x: 0, y: 0 } },
      { character: "Judge", icon: "judge", side: "right", color: "#8e44ad", text: "The matter is concluded. The property has been demolished.", position: { x: 0, y: 0 } },
      { character: "Billy Buckler", icon: "farmer", side: "left", color: "#16a085", text: "Demolished, yes—but the fraud, the missing deeds, the suppressed archaeology remain!", position: { x: 0, y: 0 } },
      { character: "Judge", icon: "judge", side: "right", color: "#8e44ad", text: "Those are civil matters beyond this court's criminal jurisdiction.", position: { x: 0, y: 0 } },
      { character: "Billy Buckler", icon: "farmer", side: "left", color: "#16a085", text: "Justice demands investigation! Someone must examine what happened here!", position: { x: 0, y: 0 } }
    ],
    sources: [],
    attachments: emptyAttachments
  },
  {
    year: "1989",
    location: "Demolition Site",
    locationType: "ruins",
    description: "Rubble Cleared",
    narration: "Site clearance in March removes remaining physical traces. Lorries export rubble over several days, leaving little to show future residents the contested history beneath.",
    scenes: [
      { character: "Site Manager", icon: "worker", side: "right", color: "#e67e22", text: "Our job is simple: remove all remnants so the site is ready for housing.", position: { x: 0, y: 0 } },
      { character: "Local Historian", icon: "builder", side: "left", color: "#95a5a6", text: "They're erasing the last physical evidence of what happened here.", position: { x: 0, y: 0 } },
      { character: "Site Manager", icon: "worker", side: "right", color: "#e67e22", text: "We follow orders. The site must be cleared for redevelopment.", position: { x: 0, y: 0 } },
      { character: "Local Historian", icon: "builder", side: "left", color: "#95a5a6", text: "Rubble removal completes the destruction—house, history, heritage, gone.", position: { x: 0, y: 0 } }
    ],
    sources: [],
    attachments: emptyAttachments
  },
  {
    year: "1989",
    location: "Community Meeting",
    locationType: "other",
    description: "Helplessness",
    narration: "At a village meeting, residents condemn the demolition and seek ways to stop BP Properties profiting from redevelopment, but are told legal avenues to reverse or claw back are minimal.",
    scenes: [
      { character: "Local Activist", icon: "farmer", side: "left", color: "#7f8c8d", text: "They used planning and courts to clear obstacles; now profit is the goal.", position: { x: 0, y: 0 } },
      { character: "Councillor", icon: "judge", side: "right", color: "#7f8c8d", text: "Without title or listing on your side, leverage over BP is almost gone.", position: { x: 0, y: 0 } },
      { character: "Local Activist", icon: "farmer", side: "left", color: "#7f8c8d", text: "Is there no mechanism to challenge a demolition achieved through suspected fraud?", position: { x: 0, y: 0 } },
      { character: "Councillor", icon: "judge", side: "right", color: "#7f8c8d", text: "Fraud allegations require proof and investigation—neither has occurred.", position: { x: 0, y: 0 } },
      { character: "Local Activist", icon: "farmer", side: "left", color: "#7f8c8d", text: "So BP demolishes under disputed title and profits while the family suffers?", position: { x: 0, y: 0 } }
    ],
    sources: [],
    attachments: emptyAttachments
  },
  {
    year: "1990",
    location: "Press Room",
    locationType: "news",
    description: "Media Moves On",
    narration: "Press coverage moves on, presenting the case as finished: family out, house gone, site in BP's hands. Unresolved questions about missing deeds, licences, and adverse possession fade from public view.",
    scenes: [
      { character: "Newspaper Editor", icon: "news", side: "right", color: "#34495e", text: "With no new hearings, we treat this as a closed eviction and demolition story.", position: { x: 0, y: 0 } },
      { character: "Local Historian", icon: "builder", side: "left", color: "#95a5a6", text: "Key gaps—lost deeds, licence letters, estate records—remain unexplored.", position: { x: 0, y: 0 } },
      { character: "Newspaper Editor", icon: "news", side: "right", color: "#34495e", text: "Without new evidence or proceedings, there's no story to sustain coverage.", position: { x: 0, y: 0 } },
      { character: "Local Historian", icon: "builder", side: "left", color: "#95a5a6", text: "The story is the unanswered questions! Ownership never determined, fraud uninvestigated!", position: { x: 0, y: 0 } },
      { character: "Newspaper Editor", icon: "news", side: "right", color: "#34495e", text: "Public interest has moved on. The site is being redeveloped.", position: { x: 0, y: 0 } }
    ],
    sources: [],
    attachments: emptyAttachments
  },
  {
    year: "1994",
    location: "Major Excavation Site",
    locationType: "ruins",
    description: "Major Discovery",
    narration: "Major excavation at the former farm site uncovers a Roman villa and over eight hundred burials, confirming the land's national archaeological importance after the house is demolished.",
    scenes: [
      { character: "Lead Archaeologist", icon: "builder", side: "right", color: "#e67e22", text: "These burials and villa remains show this was a site of national importance.", position: { x: 0, y: 0 } },
      { character: "Williams Descendant", icon: "farmer", side: "left", color: "#16a085", text: "Our family's 1870 Roman-soldier account is confirmed only after demolition.", position: { x: 0, y: 0 } },
      { character: "Archaeologist", icon: "builder", side: "right", color: "#e67e22", text: "Earlier recognition of this evidence could have triggered protection laws.", position: { x: 0, y: 0 } },
      { character: "Williams Descendant", icon: "farmer", side: "left", color: "#16a085", text: "They ignored our testimony, demolished the house, then 'discovered' what we told them!", position: { x: 0, y: 0 } },
      { character: "Lead Archaeologist", icon: "builder", side: "right", color: "#e67e22", text: "This is one of the largest burial grounds ever excavated in Wales.", position: { x: 0, y: 0 } }
    ],
    sources: [],
    attachments: emptyAttachments
  },
  {
    year: "2005",
    location: "Heritage Website",
    locationType: "archive",
    description: "Sanitized History",
    narration: "Heritage publications celebrate the Llandough archaeology but omit the eviction and demolition story. Modern residents live over the site unaware of the recent dispossession.",
    scenes: [
      { character: "Heritage Editor", icon: "builder", side: "right", color: "#34495e", text: "We present the villa and burials as a heritage success, not an eviction site.", position: { x: 0, y: 0 } },
      { character: "Modern Resident", icon: "worker", side: "left", color: "#7f8c8d", text: "I learned of Roman remains here, not of a family being removed.", position: { x: 0, y: 0 } },
      { character: "Heritage Editor", icon: "builder", side: "right", color: "#34495e", text: "The archaeology is the story we tell—the human cost is not our focus.", position: { x: 0, y: 0 } },
      { character: "Modern Resident", icon: "worker", side: "left", color: "#7f8c8d", text: "So the history is sanitized? The Bucklers erased from the site's narrative?", position: { x: 0, y: 0 } },
      { character: "Heritage Editor", icon: "builder", side: "right", color: "#34495e", text: "Our remit is archaeological heritage, not contemporary property disputes.", position: { x: 0, y: 0 } }
    ],
    sources: [],
    attachments: emptyAttachments
  },
  {
    year: "2024",
    location: "Family Communication",
    locationType: "farm",
    description: "Family Trauma",
    narration: "Family accounts suggest Frederick Buckler may have secretly settled or sold interests before 1987, contributing to internal rupture and confusion over what was legally agreed.",
    scenes: [
      { character: "David Buckler", icon: "farmer", side: "left", color: "#16a085", text: "Dad said Grandad 'sorted it legally' when he sold, but never explained how.", position: { x: 0, y: 0 } },
      { character: "David Buckler", icon: "farmer", side: "left", color: "#16a085", text: "That secrecy caused a rift and left us unsure what rights were signed away.", position: { x: 0, y: 0 } },
      { character: "David Buckler", icon: "farmer", side: "left", color: "#16a085", text: "Nan's journal, naming visitors and dates, was lost with the farmhouse.", position: { x: 0, y: 0 } },
      { character: "Family Member", icon: "farmer", side: "right", color: "#16a085", text: "If Grandad settled secretly, did that undermine Nan's ownership claim?", position: { x: 0, y: 0 } },
      { character: "David Buckler", icon: "farmer", side: "left", color: "#16a085", text: "We don't know! The documents and Nan's journal were destroyed with the house!", position: { x: 0, y: 0 } }
    ],
    sources: [],
    attachments: emptyAttachments
  },
  {
    year: "2025",
    location: "Legal Research",
    locationType: "court",
    description: "New Research",
    narration: "Relatives assert Rhys Buckler's position as heir to manorial rights through the Williams-Buckler line. His disability raises questions about equal treatment of vulnerable heirs in the legal process.",
    scenes: [
      { character: "Family Advocate", icon: "farmer", side: "left", color: "#16a085", text: "Rhys's claim should be assessed on law, not quietly sidelined by disability.", position: { x: 0, y: 0 } },
      { character: "Contemporary Lawyer", icon: "lawyer", side: "right", color: "#2c3e50", text: "Courts favour written, registered rights; oral and equitable claims struggle.", position: { x: 0, y: 0 } },
      { character: "Family Advocate", icon: "farmer", side: "left", color: "#16a085", text: "But three centuries of continuous possession by the Williams-Buckler line created rights!", position: { x: 0, y: 0 } },
      { character: "Contemporary Lawyer", icon: "lawyer", side: "right", color: "#2c3e50", text: "Adverse possession claims require court determination—which never occurred.", position: { x: 0, y: 0 } },
      { character: "Family Advocate", icon: "farmer", side: "left", color: "#16a085", text: "Exactly—ownership was never adjudicated! The case remains unresolved!", position: { x: 0, y: 0 } }
    ],
    sources: [],
    attachments: emptyAttachments
  },
  {
    year: "Present Day",
    location: "Church View Close",
    locationType: "other",
    description: "Silence",
    narration: "Church View Close now covers the site of Great House Farm, the Marconi base, and one of Wales's largest recorded burial excavations, yet no plaque or record notes the clearance or dispute.",
    scenes: [
      { character: "Resident's Child", icon: "worker", side: "left", color: "#f1c40f", text: "Dad, I want to build a radio and plant a tree and own this house we live in.", position: { x: 0, y: 0 } },
      { character: "Father", icon: "worker", side: "right", color: "#7f8c8d", text: "Don't think that way or say that out loud, son. It brings us big trouble here.", position: { x: 0, y: 0 } },
      { character: "Resident's Child", icon: "worker", side: "left", color: "#f1c40f", text: "But why?", position: { x: 0, y: 0 } },
      { character: "Father", icon: "worker", side: "right", color: "#7f8c8d", text: "The last family to speak like that are traumatised into silence, three decades later.", position: { x: 0, y: 0 } },
      { character: "Resident's Child", icon: "worker", side: "left", color: "#f1c40f", text: "Well, I will speak up. And for them too.", position: { x: 0, y: 0 } }
    ],
    sources: [],
    attachments: emptyAttachments
  },
  {
    year: "Present Day",
    location: "Legal Archive",
    locationType: "archive",
    description: "The Pattern",
    narration: "Modern researchers examining the case identify a pattern: ownership never adjudicated, documents missing, archaeology suppressed until demolition, identity substituted, fraud allegations uninvestigated.",
    scenes: [
      { character: "Legal Researcher", icon: "lawyer", side: "left", color: "#34495e", text: "Every court avoided the ownership question—the only issue that mattered.", position: { x: 0, y: 0 } },
      { character: "Historian", icon: "builder", side: "right", color: "#95a5a6", text: "The 1667 deed, manorial records, Mary Williams' journal—all missing or destroyed.", position: { x: 0, y: 0 } },
      { character: "Legal Researcher", icon: "lawyer", side: "left", color: "#34495e", text: "The Roman burial was reported in 1870 but ignored until post-demolition excavation.", position: { x: 0, y: 0 } },
      { character: "Historian", icon: "builder", side: "right", color: "#95a5a6", text: "Mary Williams became Mrs Buckler in legal documents without explanation or consent.", position: { x: 0, y: 0 } },
      { character: "Legal Researcher", icon: "lawyer", side: "left", color: "#34495e", text: "Under Takhar v Gracefield, fraud unravels all—but only if investigated.", position: { x: 0, y: 0 } }
    ],
    sources: [],
    attachments: emptyAttachments
  },
  {
    year: "Present Day",
    location: "Academic Conference",
    locationType: "court",
    description: "Justice Denied",
    narration: "Legal scholars note the case exemplifies how procedural avoidance, missing documentation, and rushed demolition can circumvent substantive justice and heritage protection.",
    scenes: [
      { character: "Law Professor", icon: "lawyer", side: "right", color: "#2c3e50", text: "This case shows how possession can be determined without addressing ownership.", position: { x: 0, y: 0 } },
      { character: "Heritage Expert", icon: "builder", side: "left", color: "#e67e22", text: "Demolition before listing creates irreversible loss of heritage and evidence.", position: { x: 0, y: 0 } },
      { character: "Law Professor", icon: "lawyer", side: "right", color: "#2c3e50", text: "The Williams-Buckler family asserted ownership for 321 years without force or secrecy.", position: { x: 0, y: 0 } },
      { character: "Heritage Expert", icon: "builder", side: "left", color: "#e67e22", text: "While corporate claimants operated through licence, substitution, and stealth.", position: { x: 0, y: 0 } },
      { character: "Law Professor", icon: "lawyer", side: "right", color: "#2c3e50", text: "Justice requires investigation: who owned it? Where are the deeds? Why the rush?", position: { x: 0, y: 0 } }
    ],
    sources: [],
    attachments: emptyAttachments
  },
  {
    year: "Present Day",
    location: "Public Inquiry Call",
    locationType: "court",
    description: "Inquiry Called",
    narration: "Advocates call for a public inquiry to examine the combined effect of procedural avoidance, identity substitution, heritage omission, and irreversible consequence in the Great House Farm case.",
    scenes: [
      { character: "Advocate", icon: "lawyer", side: "left", color: "#16a085", text: "No public inquiry has examined how this dispossession was achieved.", position: { x: 0, y: 0 } },
      { character: "Parliamentarian", icon: "judge", side: "right", color: "#8e44ad", text: "What remedy exists when courts avoid ownership and demolition destroys evidence?", position: { x: 0, y: 0 } },
      { character: "Advocate", icon: "lawyer", side: "left", color: "#16a085", text: "Declaratory justice: determine who owned it, correct the record, recognise the Williams-Buckler claim.", position: { x: 0, y: 0 } },
      { character: "Parliamentarian", icon: "judge", side: "right", color: "#8e44ad", text: "And if fraud is established, what compensation is owed?", position: { x: 0, y: 0 } },
      { character: "Advocate", icon: "lawyer", side: "left", color: "#16a085", text: "Preliminarily quantified at approximately £101.2 million, but truth comes first.", position: { x: 0, y: 0 } }
    ],
    sources: [],
    attachments: emptyAttachments
  }
];