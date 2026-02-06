import { TimelineEvent, NewspaperArticle, LegalConflict, CoreAllegation } from './types';

export const CORE_ALLEGATIONS: CoreAllegation[] = [
  {
    title: "Fraudulent Conveyance",
    description: "In 1974, BP Properties Ltd offered a license for land they did not yet own. The actual owner was BP Pension Trust Ltd. This 'Two Company' maneuver was used to confuse the legal status."
  },
  {
    title: "Violent Displacement",
    description: "The 1988 eviction involved bailiffs using chainsaws to cut through barricades while the family was inside. The 800-year-old farmhouse was bulldozed the same night to prevent return."
  },
  {
    title: "Heritage Theft",
    description: "1994 excavations revealed Celtic burials and a potential monastery site. Artifacts were removed without family consent, violating their rights as long-term custodians."
  },
  {
    title: "Procedural Denial",
    description: "The adverse possession defense raised in July 1974 was never fully adjudicated. The courts allowed a 12-year-old possession order (1962) to be enforced instead."
  }
];

export const TIMELINE_DATA: TimelineEvent[] = [
  {
    year: "1916",
    title: "Tenancy Begins",
    description: "Marquis of Bute grants tenancy to John Williams (grandfather of Billy Buckler). Family occupies Great House Farm, Llanharan.",
    category: "historical",
    verified: true
  },
  {
    year: "1949",
    title: "Transfer to Bucklers",
    description: "Tenancy passes to Frederick Buckler. Last rent payment is made in 1953.",
    category: "historical",
    verified: true
  },
  {
    year: "1955",
    title: "Adverse Possession Starts",
    description: "Tenancy expires. Family remains without permission. Under Limitation Act 1939, 12 years of possession would extinguish landlord title.",
    category: "legal",
    verified: true
  },
  {
    year: "1962",
    title: "Possession Order",
    description: "Cardiff County Court grants possession order for farmhouse but it is NOT enforced due to Mary Buckler's health.",
    category: "legal",
    verified: true
  },
  {
    year: "1974",
    title: "The 'Two Company' Letter",
    description: "BP Pension Trust (Owner) and BP Properties (Not Owner) send letters. BP Properties offers a license. This creates the legal technicality that defeats the family.",
    category: "legal",
    verified: true
  },
  {
    year: "1987",
    title: "Appeal Dismissed",
    description: "Court of Appeal (BP Properties Ltd v Buckler) rules that the unaccepted license stopped adverse possession. Dillon LJ calls the company ownership issue 'rather technical'.",
    category: "legal",
    verified: true
  },
  {
    year: "1988",
    title: "The Chainsaw Eviction",
    description: "Dec 6: Bailiffs use chainsaws to breach the home. Billy Buckler defends with a chainsaw. The family is removed, and the house is demolished immediately.",
    category: "eviction",
    verified: true
  },
  {
    year: "1994",
    title: "Archaeological Discovery",
    description: "Excavations reveal 1,026 burials and early Christian artifacts. Confirms the site's massive historical significance, now lost to the family.",
    category: "archaeology",
    verified: true
  }
];

export const LEGAL_CONFLICTS: LegalConflict[] = [
  {
    title: "The 'License' Trap",
    officialNarrative: "The Court of Appeal ruled that because BP offered a license in 1974, Mrs. Buckler was no longer an adverse possessor, even if she didn't sign it.",
    familyReality: "Mrs. Buckler repeatedly told them 'It's my land' and rejected their permission. You cannot force a license on someone claiming ownership.",
    verdict: "Legal Precedent Set. While morally questionable to force a license on an unwilling recipient, *BP v Buckler* became the binding authority that a unilateral license stops the clock on adverse possession.",
    status: "resolved"
  },
  {
    title: "The Two Companies",
    officialNarrative: "The distinction between BP Pension Trust (owner) and BP Properties (license giver) was a 'technical point' that did not invalidate the proceedings.",
    familyReality: "It was fraud. BP Properties had no right to grant a license for land they didn't own until 1975. They used the wrong letterhead to trick the legal process.",
    verdict: "Procedural Irregularity. The facts confirm BP Properties did not own the land when the letter was sent. However, the courts chose to ignore this corporate distinction to facilitate the eviction.",
    status: "suppressed"
  },
  {
    title: "Human Rights (Article 8)",
    officialNarrative: "The eviction was a lawful execution of a court order for possession.",
    familyReality: "Violent displacement using chainsaws against a family with children, followed by immediate demolition to prevent return, violated the Right to Respect for Home.",
    verdict: "Violation Likely. The immediacy of the demolition (preventing re-entry) and the scale of force used would likely contravene modern interpretations of ECHR Article 8, though the HRA was not yet domestic law in 1988.",
    status: "unresolved"
  }
];

export const NEWSPAPER_ARTICLES: NewspaperArticle[] = [
  {
    id: "1",
    title: "Chainsaw Farmer Vows to Fight On",
    source: "South Wales Echo",
    date: "Dec 1988",
    content: "A farmer who beat-off bailiffs with a chainsaw last night vowed to continue his defiant fight... 'I am here to stay and I will fight this to the death,' said Mr Bill Buckler.",
    context: "Confirmed: The use of chainsaws by both bailiffs and the defender highlights the violent nature of the displacement."
  },
  {
    id: "2",
    title: "Farmer Fails in Final Eviction Hearing",
    source: "Western Mail",
    date: "6 Dec 1988",
    content: "Documents final court hearing, subsequent demolition. Notes European Court did not intervene, farmhouse would be demolished.",
    context: "The demolition occurred immediately after eviction, a tactic to ensure the 'possession' was irreversible."
  },
  {
    id: "3",
    title: "Open Day to Save Ancient Welsh House",
    source: "Archive (Pre-1988)",
    date: "Pre-Demolition",
    content: "Describes Great House Farm as potentially 'one of most important missioning centers in early Christianity in Morgannwg'.",
    context: "This proves the historical value was known BEFORE the demolition, supporting the claim of willful heritage destruction."
  }
];