import { Data } from "@measured/puck";
import { Props } from "./puck.config";

export const initialData: Data<Props> = {
  content: [
    {
      type: "Hero",
      props: {
        title: "Great House Farm",
        subtitle: "A deterministic investigation into the seizure, demolition, and historical erasure of an 800-year-old site.",
        badge: "OPEN INVESTIGATION",
        imageUrl: "https://images.unsplash.com/photo-1516937941344-00b4ec277ec3?auto=format&fit=crop&q=80&w=2000",
        id: "hero-main"
      }
    },
    {
      type: "Section",
      props: {
        title: "The Official Narrative vs Reality",
        subtitle: "We are aggregating all known records to establish the single truth.",
        background: "white",
        id: "section-conflicts"
      }
    },
    {
        type: "Section",
        props: {
            title: "Systemic Failures",
            subtitle: "The institutions that should have protected Great House Farm.",
            background: "slate",
            id: "section-failures"
        }
    },
    {
        type: "Section",
        props: {
            title: "Announcements",
            subtitle: "Ongoing efforts to publicize the case.",
            background: "white",
            id: "section-news"
        }
    }
  ],
  root: {},
  zones: {
    "section-conflicts:content": [
        {
            type: "RichText",
            props: {
                content: "The story of Great House Farm is one of conflicting narratives. The official court records paint a picture of lawful possession. The family's testimony, supported by unearthed evidence and the brutal nature of the eviction, reveals a different story: one of fraud, procedural abuse, and violence.",
                id: "conflict-intro"
            }
        },
        {
            type: "ConflictResolver",
            props: { id: "conflict-resolver" }
        }
    ],
    "section-failures:content": [
        {
            type: "InvestigationBoard",
            props: {
                title: "Parties Responsible",
                id: "investigation-board"
            }
        },
        {
            type: "RichText",
            props: {
                content: "This website serves as an open-source archive. We invite researchers, historians, and legal experts to contribute to the growing body of evidence proving that this injustice should never have happened.",
                id: "os-invite"
            }
        }
    ],
    "section-news:content": [
        {
            type: "AnnouncementBanner",
            props: {
                title: "Feature Film & TV Documentary In Development",
                type: "book",
                id: "banner-book"
            }
        },
        {
            type: "AnnouncementBanner",
            props: {
                title: "Lawsuit Underway: Buckler vs BP & UK Govt",
                type: "legal",
                id: "banner-lawsuit"
            }
        }
    ]
  }
};

export const initialDataPress: Data<Props> = {
    content: [
        {
            type: "Hero",
            props: {
                title: "Press Archive",
                subtitle: "Contemporary reporting and subsequent investigations into the Great House Farm eviction.",
                badge: "MEDIA RECORDS",
                imageUrl: "https://images.unsplash.com/photo-1586339949916-3e9457bef6d3?auto=format&fit=crop&q=80&w=2000",
                id: "hero-press"
            }
        },
        {
            type: "Section",
            props: {
                title: "1988 Eviction Coverage",
                subtitle: "Articles from the time of the displacement.",
                background: "white",
                id: "section-press-1988"
            }
        },
        {
            type: "Section",
            props: {
                title: "Historical & Post-Eviction",
                subtitle: "Coverage of the archaeological findings and the aftermath.",
                background: "slate",
                id: "section-press-later"
            }
        }
    ],
    root: {},
    zones: {
        "section-press-1988:content": [
            {
                type: "PressGrid",
                props: {
                    articles: [
                        {
                            title: "Chainsaw Farmer Vows to Fight On",
                            source: "South Wales Echo",
                            date: "Dec 1988",
                            summary: "Reports on Billy Buckler defending his home against bailiffs using chainsaws. 'I am here to stay and I will fight this to the death.'",
                            imageUrl: "https://images.unsplash.com/photo-1589828990386-750d0370428f?auto=format&fit=crop&q=80&w=400"
                        },
                        {
                            title: "Farmer Fails in Final Eviction Hearing",
                            source: "Western Mail",
                            date: "6 Dec 1988",
                            summary: "Documents the final court hearing and the immediate subsequent demolition of the farmhouse that night.",
                            imageUrl: ""
                        },
                        {
                            title: "History fight to save farm",
                            source: "South Wales Echo",
                            date: "3 Dec 1988",
                            summary: "Documents last-minute efforts by historic buildings inspectors and Cadw to save the farmhouse, noting the 33-year legal battle.",
                            imageUrl: ""
                        }
                    ],
                    id: "press-grid-1"
                }
            }
        ],
        "section-press-later:content": [
            {
                type: "PressGrid",
                props: {
                    articles: [
                        {
                            title: "Open day to save ancient Welsh house",
                            source: "Archive (Pre-Demolition)",
                            date: "1980s",
                            summary: "Describes Great House Farm as potentially 'one of most important missioning centers in early Christianity'. Written before the demolition.",
                            imageUrl: ""
                        },
                        {
                            title: "Tears flow as 800 year-old farm house is razed at last",
                            source: "Press Archive",
                            date: "Dec 1988",
                            summary: "Captures the emotional impact of the demolition and the displacement of the family living in a bus.",
                            imageUrl: ""
                        }
                    ],
                    id: "press-grid-2"
                }
            }
        ]
    }
}