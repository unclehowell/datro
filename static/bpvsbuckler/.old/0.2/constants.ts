import { TimelineEvent, NewspaperArticle, LegalArgument, CoreAllegation } from './types';

export const CORE_ALLEGATIONS: CoreAllegation[] = [
  {
    title: "Historical Land Theft",
    description: "The systematic dispossession of an ancestral farm occupied for over 400 years through legal mechanisms that favored corporate interests over occupiers' rights."
  },
  {
    title: "Procedural Unfairness",
    description: "Courts allegedly favored ground rent interests over the family's historic tenancy context and hardship circumstances."
  },
  {
    title: "Abuse of Process",
    description: "Civil mechanisms used coercively without adequate criminal basis, including the use of detention to clear land and denial of basic water supply."
  },
  {
    title: "Historical Erasure",
    description: "The suppression of the family's connection to significant historical events, specifically Guglielmo Marconi's radio experiments at the farm."
  }
];

export const TIMELINE_DATA: TimelineEvent[] = [
  {
    year: "2nd Century",
    title: "Roman Settlement",
    description: "A substantial Roman villa is constructed on the site, featuring a hypocaust system and bath complex.",
    category: "historical"
  },
  {
    year: "11th Century",
    title: "Monastic Grange",
    description: "Llandough granted to Tewkesbury Abbey. A grange is established, remaining in abbey ownership until the Dissolution.",
    category: "historical"
  },
  {
    year: "1600s",
    title: "Family Occupation Begins",
    description: "The Williams family (ancestors of the Bucklers) begin their occupation of Great House Farm.",
    category: "historical"
  },
  {
    year: "1897",
    title: "The Marconi Connection",
    description: "Guglielmo Marconi stays at Great House Farm while conducting historic wireless telegraphy experiments. The family transports his equipment by horse and cart.",
    category: "marconi"
  },
  {
    year: "1915",
    title: "First Legal Victory",
    description: "Bute Estates attempts to evict. The family proves equitable title based on an agreement with Daniel Thomas (quarryman). The case is dropped.",
    category: "legal"
  },
  {
    year: "1955",
    title: "Possession Order Stalled",
    description: "Western Ground Rents obtains a possession order but fails to execute it when Mary Williams produces the deed of transfer.",
    category: "legal"
  },
  {
    year: "1974",
    title: "BP Era & The License Offer",
    description: "BP Pension Trust Ltd sues for possession. BP Properties Ltd offers a 'license' to occupy. Mary Williams responds: 'It's my land. It's not your permission to give.'",
    category: "legal"
  },
  {
    year: "1987",
    title: "BP Properties Ltd v Buckler",
    description: "Court of Appeal ruling. Dillon LJ rules that while possessory title wasn't made for the whole farm, the farmhouse was exclusively possessed. However, the unilateral license stopped adverse possession.",
    category: "legal"
  },
  {
    year: "1988",
    title: "The Demolition",
    description: "Great House Farm is demolished. Newspapers describe the scene as a 'warzone'. The family is barred from returning.",
    category: "demolition"
  },
  {
    year: "1994",
    title: "Archaeological Excavation",
    description: "Excavation sponsored by Ideal Homes reveals 1,026 burials (largest early Christian cemetery in Wales) and a Roman Villa.",
    category: "archaeology"
  },
  {
    year: "2024",
    title: "Cardiff Bay Sculpture",
    description: "A new sculpture celebrates radio history but deliberately omits Marconi due to political reasons, erasing the farm's connection.",
    category: "marconi"
  }
];

export const LEGAL_ARGUMENTS: LegalArgument[] = [
  {
    title: "The Two-Company Problem",
    summary: "Contradictory Corporate Identity",
    detail: "The judge ruled Mrs. Buckler's reply to BP Pension Trust didn't count because she needed to reply to BP Properties. Yet, when the family argued BP Pension Trust should have been the claimant, the judge dismissed it saying both companies were 'effectively the same.' Heads they win, tails we lose."
  },
  {
    title: "Unaccepted License",
    summary: "Forced Permission",
    detail: "The court established a precedent that a unilateral license, offered but never accepted (and actively rejected by 'It's my land'), stops the clock on adverse possession. This allowed the owner to impose permission on a squatter against their will."
  },
  {
    title: "Disproportionality",
    summary: "Extreme Enforcement",
    detail: "The use of detention, physical removal from a hospital bed, and the destruction of an 800-year-old home were grossly disproportionate measures for a civil dispute involving a family with 400 years of tenure."
  }
];

export const NEWSPAPER_ARTICLES: NewspaperArticle[] = [
  {
    id: "1",
    title: "Open Day to Save Ancient Welsh House",
    source: "South Wales Echo",
    date: "1974",
    content: "HUNDREDS of people yesterday flocked to see an 800-year-old house... Mrs Williams, a widow whose family first occupied Ty Mawr (Great House) in about 1657, lives there... 'This is my home. It is part of the nation's heritage.'",
    highlight: true
  },
  {
    id: "2",
    title: "Chainsaw Farmer Vows to Fight On",
    source: "South Wales Echo",
    date: "1988",
    content: "A FARMER who beat-off bailiffs with a chainsaw last night vowed to continue his defiant fight... 'I am here to stay and I will fight this to the death,' said Mr Bill Buckler... The scenes were the latest episode in a battle between the Buckler family and BP Properties.",
    highlight: true
  },
  {
    id: "3",
    title: "Tears Flow as 800 Year-Old Farm House is Razed at Last",
    source: "Unknown Newspaper",
    date: "December 1988",
    content: "THE FINAL chapter in the 35-year battle... ended early yesterday when a team moved in to demolish the 800-year-old farmhouse... 'Now we are left with no home, no plans, no income and no Christmas.'"
  },
  {
    id: "4",
    title: "Billy's Unhappy Family",
    source: "South Wales Echo",
    date: "Dec 3, 1988",
    content: "When the bailiffs refused to let South Wales farmer Billy Buckler back into his family home they found eight other people sharing the rambling old farmhouse... Most of the nine people who were evicted had been living a semi-communal life."
  }
];