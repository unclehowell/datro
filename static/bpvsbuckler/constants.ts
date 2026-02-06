import { Database } from "./types";

// --- COMMON CONTENT BLOCKS ---
const STORY_CONTENT = [
      {
        "type": "Hero",
        "props": {
          "title": "The Untold Story",
          "subtitle": "A timeline of possession, betrayal, and erasure.",
          "backgroundImage": "./farm-house.jpg",
          "align": "left"
        }
      },
      {
        "type": "FeatureBlock",
        "props": {
          "title": "1215 – 1539: Medieval Origins",
          "summary": "From Monastic Grange to Crown Property.",
          "details": "1215 – Great House ('Ty Mawr') Farm House was built next to St St Dochdwy's Church, Llandough.\n\n1215-1539 - Owned by Tewkesbury Abbey / Prior of Cardiff (Ecclesiastical Title).\n\n1539-43 - The Crown (Henry VIII) confiscated the property during the Dissolution.",
          "inverted": false
        }
      },
      {
        "type": "FeatureBlock",
        "props": {
          "title": "1667: The Williams Era Begins",
          "summary": "Three centuries of indigenous occupation and de facto ownership.",
          "details": "1667 – Documented Williams Family Occupation\nWhile the 'Paper Title' (the aristocratic deed) sat gathering dust in the hands of the Earls of Pembroke, the Williamses were the 'Living Title'—they paid the taxes, built the walls, and held the land in honor.\n\nThe Williams family occupied Great House Farm continuously from at least 1667. A 1987 newspaper article quotes Mrs Williams saying it was 'acquired' by the Williams then, suggesting purchase not tenancy. There's no formal land registration at this time; occupation equals de facto possession.",
          "inverted": true
        }
      },
      {
        "type": "FeatureBlock",
        "props": {
          "title": "1888: The Roman Discovery",
          "summary": "A Roman soldier found under the floorboards—evidence of ancient history.",
          "details": "1888 – Williams Family Discover Roman Soldier\nThe Roman soldier in full armor was discovered under the living room floor of Tŷ Mawr (Great House Farm) in 1888. This discovery occurred while the Williams family was replacing the old stone flagstones with a timber floor. This private find happened exactly one hundred years before the house was demolished in 1988.",
          "inverted": false
        }
      },
      {
        "type": "FeatureBlock",
        "props": {
          "title": "1949-1965: Identity Erasure",
          "summary": "The invention of 'Mrs. Buckler' to strip family rights.",
          "details": "\"Identity Erasure\" (The Mrs. Buckler Label)\nHereinafter the court and Western Ground Rents consistently referred to Mary Williams as 'Mrs. Buckler.'\n\nThe Tactic: By addressing her by her husband's name, they stripped her of her connection to the Williams lineage—the very lineage that held the 'grandfather rights' and the Bute/Thomas agreement.",
          "inverted": true
        }
      },
      {
        "type": "FeatureBlock",
        "props": {
          "title": "1988: Demolition",
          "summary": "The final act of erasure.",
          "details": "6 December 1988 – Demolition\nGreat House Farm is demolished, ending centuries of occupation and local heritage presence.\n\nDestruction of Evidence: The farmhouse was demolished in 1988. Proceeding with demolition while a land title dispute was active or without disclosing the 1888 archaeological find could be viewed as an intentional act to 'bury' the legal and historical evidence of the Williams family's rights.",
          "inverted": true
        }
      }
];

// --- ENGLISH DATABASE ---
export const DB_EN: Database = {
  "/": {
      "content": [
          {
              "type": "Hero",
              "props": {
                  "title": "Great House Farm Campaign",
                  "subtitle": "Fighting for truth, justice, and the recognition of centuries of history.",
                  "backgroundImage": "./farm-gate.jpg",
                  "align": "left"
              }
          },
          {
              "type": "HeadingBlock",
              "props": {
                  "title": "Our Mission",
                  "level": "h2",
                  "align": "center"
              }
          },
          {
              "type": "FeatureBlock",
              "props": {
                  "title": "A Legacy Erased",
                  "summary": "For over 300 years, the Williams family held Great House Farm. In 1988, it was demolished.",
                  "details": "We are dedicated to uncovering the truth about the Great House Farm case. For centuries, the Williams family held the land in honor, only to face erasure through legal maneuvering and corporate power. This website serves as a repository of evidence, personal stories, and the ongoing fight for acknowledgment.",
                  "inverted": true
              }
          },
          {
              "type": "Quote",
              "props": {
                  "text": "Justice delayed is justice denied. We remember Great House Farm.",
                  "author": "Campaign Team"
              }
          }
      ],
      "root": { "props": { "title": "Home" } }
  },
  "/about": {
      "content": [
          {
              "type": "Hero",
              "props": {
                  "title": "About Us",
                  "subtitle": "A community united by heritage and the pursuit of truth.",
                  "align": "left"
              }
          },
          {
              "type": "FeatureBlock",
              "props": {
                  "title": "Who We Are",
                  "summary": "A collective of family members, historians, and activists.",
                  "details": "The Great House Farm Campaign is a collective of family members, historians, and community activists dedicated to preserving the memory of Tŷ Mawr and correcting the historical record regarding the Williams family's ownership and the subsequent actions of BP Pension Trust.",
                  "inverted": false
              }
          }
      ],
      "root": { "props": { "title": "About Us" } }
  },
  "/story": {
    "content": STORY_CONTENT,
    "root": {
      "props": {
        "title": "Our Story"
      }
    }
  },
  "/family-history": {
      "content": [
          {
              "type": "Hero",
              "props": {
                  "title": "Williams & Buckler History",
                  "subtitle": "The lineage that held the land for centuries.",
                  "align": "left"
              }
          },
          {
              "type": "FeatureBlock",
              "props": {
                  "title": "The Williams Line",
                  "summary": "Indigenous occupation since 1667.",
                  "details": "Tracing the family tree back through parish records and estate surveys reveals an unbroken line of occupation. This page details the lives of the key figures who shaped Great House Farm.",
                  "inverted": false
              }
          },
          {
              "type": "FeatureBlock",
              "props": {
                  "title": "The Buckler Connection",
                  "summary": "Joining forces in the 20th Century.",
                  "details": "How Frederick Buckler married into the Williams family and the subsequent legal complications that arose from the tenancy transfer.",
                  "inverted": true
              }
          }
      ],
      "root": { "props": { "title": "Family History" } }
  },
  "/marconi": {
      "content": [
          {
              "type": "Hero",
              "props": {
                  "title": "The Marconi Connection",
                  "subtitle": "Radio history on the farm.",
                  "align": "left"
              }
          },
          {
              "type": "FeatureBlock",
              "props": {
                  "title": "Experimental Transmissions",
                  "summary": "Great House Farm's role in early radio.",
                  "details": "Historical evidence suggests that the high ground of the farm was used for early radio experiments linked to Marconi's work in South Wales. We are collating evidence to substantiate these claims.",
                  "inverted": false
              }
          }
      ],
      "root": { "props": { "title": "Marconi Connection" } }
  },
  "/issues": {
      "content": [
          {
              "type": "Hero",
              "props": {
                  "title": "Key Issues",
                  "subtitle": "Systemic failures, legal manipulation, and cultural erasure.",
                  "align": "left"
              }
          },
          {
              "type": "FeatureBlock",
              "props": {
                  "title": "Legal Manipulations",
                  "summary": "The strategic use of naming and lower courts to bypass justice.",
                  "details": "The use of the 'Mrs. Buckler' label to erase Mary Williams' identity and the strategic use of lower courts to avoid full title hearings.",
                  "inverted": true
              }
          }
      ],
      "root": { "props": { "title": "Issues" } }
  },
  "/timeline": {
      "content": [
          {
              "type": "Hero",
              "props": {
                  "title": "Timeline",
                  "subtitle": "800 Years of History vs 40 Years of Erasure",
                  "align": "center"
              }
          },
          {
              "type": "FeatureBlock",
              "props": {
                  "title": "Key Dates",
                  "summary": "From 1215 to the present day.",
                  "details": "**1215** - Construction of Tŷ Mawr\n\n**1667** - Williams Family Occupation Begins\n\n**1988** - Demolition of Great House Farm",
                  "inverted": true
              }
          }
      ],
      "root": { "props": { "title": "Timeline" } }
  },
  "/evidence": {
      "content": [
           {
              "type": "Hero",
              "props": {
                  "title": "Evidence Archive",
                  "subtitle": "Documents, Maps, and Testimonies that prove our claim.",
                  "align": "left"
              }
          },
          {
              "type": "FeatureBlock",
              "props": {
                  "title": "Legal Documents",
                  "summary": "Court orders, letters, and the missing deeds.",
                  "details": "Digitized copies of relevant legal documents.",
                  "inverted": false
              }
          }
      ],
      "root": { "props": { "title": "Evidence" } }
  },
  "/contact": {
      "content": [
          {
              "type": "Hero",
              "props": {
                  "title": "Get in Touch",
                  "subtitle": "Join the campaign or share information.",
                  "align": "center"
              }
          },
          {
              "type": "FeatureBlock",
              "props": {
                  "title": "Contact Us",
                  "summary": "Reach out to the team.",
                  "details": "Email: contact@greathousefarm.org",
                  "inverted": true
              }
          }
      ],
      "root": { "props": { "title": "Get in Touch" } }
  },
  "/latest": {
      "content": [
          {
              "type": "Hero",
              "props": {
                  "title": "Latest News",
                  "subtitle": "Recent developments in the campaign.",
                  "align": "left"
              }
          },
          {
              "type": "FeatureBlock",
              "props": {
                  "title": "New Witness Testimony",
                  "summary": "Breaking developments regarding the 1974 petition.",
                  "details": "We have received new written testimony regarding the 1974 petition, confirming the public support for the family at the time.",
                  "inverted": false
              }
          }
      ],
      "root": { "props": { "title": "Latest" } }
  },
  "/writings/newsletter": {
      "content": [
          {
              "type": "Hero",
              "props": {
                  "title": "Newsletter",
                  "subtitle": "Updates on our campaign and community action.",
                  "align": "center"
              }
          },
          {
              "type": "FeatureBlock",
              "props": {
                  "title": "March 2024 Update",
                  "summary": "The Search for Deeds.",
                  "details": "We have launched a new initiative to locate the missing Bute Estate deeds from the Cardiff Library archives.",
                  "inverted": true
              }
          }
      ],
      "root": { "props": { "title": "Newsletter" } }
  },
  "/writings/sion": {
      "content": [
          {
              "type": "Hero",
              "props": {
                  "title": "Sion's Story",
                  "subtitle": "Reflections on a lost heritage.",
                  "align": "left"
              }
          },
          {
              "type": "FeatureBlock",
              "props": {
                  "title": "Living History",
                  "summary": "Growing up with the ghosts of the past.",
                  "details": "Growing up, the stories of the farm were not just history—they were our identity.",
                  "inverted": false
              }
          }
      ],
      "root": { "props": { "title": "Sion's Story" } }
  },
  "/writings/david": {
      "content": [
          {
              "type": "Hero",
              "props": {
                  "title": "David's Story",
                  "subtitle": "The legal betrayal and the fight for answers.",
                  "align": "left"
              }
          },
          {
              "type": "FeatureBlock",
              "props": {
                  "title": "A Father's Silence",
                  "summary": "The burden of the legal battle.",
                  "details": "My father always believed that the legal matters had been settled.",
                  "inverted": true
              }
          }
      ],
      "root": { "props": { "title": "David's Story" } }
  },
  "/gallery": {
      "content": [
          {
              "type": "Hero",
              "props": {
                  "title": "Visual Archive",
                  "subtitle": "Documenting the physical history of Great House Farm.",
                  "align": "center"
              }
          },
          {
              "type": "ImageGrid",
              "props": {
                  "title": "Featured Images",
                  "items": [
                      { "caption": "The Farmhouse c. 1950", "alt": "Old black and white photo", "src": "./farm-house.jpg" },
                      { "caption": "Mary Williams in the Garden", "alt": "Woman in garden" },
                      { "caption": "The 1988 Demolition", "alt": "Bulldozers on site" }
                  ]
              }
          }
      ],
      "root": { "props": { "title": "Gallery" } }
  },
  "/gallery/historical": {
      "content": [
          {
              "type": "Hero",
              "props": {
                  "title": "Historical Gallery",
                  "subtitle": "Life at the farm through the centuries.",
                  "align": "left"
              }
          },
          {
              "type": "ImageGrid",
              "props": {
                  "title": "19th & 20th Century",
                  "items": [
                      { "caption": "The Great Hall", "alt": "Interior shot" },
                      { "caption": "Harvest 1920", "alt": "Workers in field" }
                  ]
              }
          }
      ],
      "root": { "props": { "title": "Historical Gallery" } }
  },
  "/gallery/excavations": {
      "content": [
          {
              "type": "Hero",
              "props": {
                  "title": "Excavations",
                  "subtitle": "The 1978 and 1994 digs that proved us right.",
                  "align": "left"
              }
          },
          {
              "type": "FeatureBlock",
              "props": {
                  "title": "The 1994 Report",
                  "summary": "Evidence of over 800 burials.",
                  "details": "The Cotswold Archaeological Trust conducts excavations revealing a monastic cemetery with 800+ burials prior to development.",
                  "inverted": false
              }
          }
      ],
      "root": { "props": { "title": "Excavations Gallery" } }
  },
  "/gallery/family": {
      "content": [
          {
              "type": "Hero",
              "props": {
                  "title": "Family Archive",
                  "subtitle": "The people behind the possession.",
                  "align": "left"
              }
          },
          {
              "type": "FeatureBlock",
              "props": {
                  "title": "The Williams Lineage",
                  "summary": "Portraits and candid photos.",
                  "details": "Photos of Mary Williams, Frederick Buckler, and the children who grew up within the walls of Tŷ Mawr.",
                  "inverted": true
              }
          }
      ],
      "root": { "props": { "title": "Family Gallery" } }
  },
  "/ghf-2-0": {
      "content": [
          {
              "type": "Hero",
              "props": {
                  "title": "Great House Farm 2.0",
                  "subtitle": "Rebuilding heritage in the Welsh Settlement, Patagonia.",
                  "align": "center"
              }
          },
          {
              "type": "FeatureBlock",
              "props": {
                  "title": "A Replica in Patagonia",
                  "summary": "Sion Buckler's visionary project.",
                  "details": "Great House Farm 2.0 is a full-scale replica of the original Tŷ Mawr, currently being developed at the Welsh Settlement in Patagonia, Argentina.",
                  "inverted": false
              }
          },
          {
              "type": "FeatureBlock",
              "props": {
                  "title": "Guided Tours",
                  "summary": "Experience the story firsthand.",
                  "details": "Once completed, Great House Farm 2.0 will be open to the public. Guided tours will walk visitors through the entire story.",
                  "inverted": true
              }
          }
      ],
      "root": { "props": { "title": "GHF 2.0" } }
  },
  "/support": {
      "content": [
          {
              "type": "Hero",
              "props": {
                  "title": "Support Our Cause",
                  "subtitle": "Help us fund the legal fight and the rebuilding project.",
                  "align": "center"
              }
          },
          {
              "type": "FeatureBlock",
              "props": {
                  "title": "Why We Need You",
                  "summary": "Fighting corporate power requires resources.",
                  "details": "Your support funds the ongoing legal research.",
                  "inverted": false
              }
          },
          {
              "type": "FeatureBlock",
              "props": {
                  "title": "Ways to Give",
                  "summary": "Donate, Share, Volunteer.",
                  "details": "We are accepting donations.",
                  "inverted": true
              }
          }
      ],
      "root": { "props": { "title": "Support" } }
  },
  "/brand": {
      "content": [
          {
              "type": "Hero",
              "props": {
                  "title": "Brand Guidelines",
                  "subtitle": "Using the Great House Farm Identity.",
                  "align": "left"
              }
          },
          {
              "type": "FeatureBlock",
              "props": {
                  "title": "Colors & Logos",
                  "summary": "Grenfell Green (#009A49) and the Welsh Dragon.",
                  "details": "Our visual identity represents our Welsh heritage and our fight for the land. Please use our official assets when linking to our campaign.",
                  "inverted": false
              }
          }
      ],
      "root": { "props": { "title": "Brand Guidelines" } }
  },
  "/press": {
      "content": [
          {
              "type": "Hero",
              "props": {
                  "title": "Press Resources",
                  "subtitle": "Media kits and contact info for journalists.",
                  "align": "left"
              }
          },
          {
              "type": "FeatureBlock",
              "props": {
                  "title": "Press Contact",
                  "summary": "For inquiries and interviews.",
                  "details": "Email press@greathousefarm.org for statements and high-resolution images.",
                  "inverted": false
              }
          }
      ],
      "root": { "props": { "title": "Press" } }
  },
  "/act": {
      "content": [
          {
              "type": "Hero",
              "props": {
                  "title": "Take Action",
                  "subtitle": "Demand a Public Inquiry.",
                  "align": "center"
              }
          },
          {
              "type": "FeatureBlock",
              "props": {
                  "title": "Write to the Senedd",
                  "summary": "Use our template to email your representative.",
                  "details": "To: Correspondence.Senedd@gov.wales\n\nSubject: Public Inquiry into Great House Farm Demolition\n\nDear Member of the Senedd,\n\nI am writing to urge you to support a public inquiry into the demolition of Great House Farm (Tŷ Mawr) in 1988 and the treatment of the Williams/Buckler family. The historical and archaeological significance of this site was ignored, and justice has yet to be served.\n\nSincerely,\n[Your Name]",
                  "inverted": true
              }
          }
      ],
      "root": { "props": { "title": "Take Action" } }
  },
  "/shop": {
      "content": [
          {
              "type": "Hero",
              "props": {
                  "title": "Campaign Shop",
                  "subtitle": "Merchandise that supports the cause.",
                  "align": "center"
              }
          },
          {
              "type": "ProductGrid",
              "props": {
                  "title": "Official Merchandise",
                  "items": [
                      { "name": "Justice Mug", "price": "£12.00", "description": "Ceramic mug with GHF Logo.", "buyLink": "#" },
                      { "name": "T-Shirt (S-XL)", "price": "£25.00", "description": "100% Cotton. Black with Green Print.", "buyLink": "#" },
                      { "name": "Patagonia Tote", "price": "£15.00", "description": "Supporting the rebuild project.", "buyLink": "#" }
                  ]
              }
          }
      ],
      "root": { "props": { "title": "Shop" } }
  }
};

// --- WELSH DATABASE (DEFAULT) ---
// Note: In a real scenario, full translation would be applied. 
// Here we translate Titles and Summaries to demonstrate the feature.
export const DB_CY: Database = {
  ...DB_EN,
  "/": {
      "content": [
          {
              "type": "Hero",
              "props": {
                  "title": "Ymgyrch Fferm y Tŷ Mawr",
                  "subtitle": "Yn ymladd dros y gwir, cyfiawnder, a chydnabyddiaeth o ganrifoedd o hanes.",
                  "backgroundImage": "./farm-gate.jpg",
                  "align": "left"
              }
          },
          {
              "type": "HeadingBlock",
              "props": {
                  "title": "Ein Cenhadaeth",
                  "level": "h2",
                  "align": "center"
              }
          },
          {
              "type": "FeatureBlock",
              "props": {
                  "title": "Treftadaeth a Ddilëwyd",
                  "summary": "Am dros 300 mlynedd, roedd teulu Williams yn dal Fferm y Tŷ Mawr. Ym 1988, cafodd ei dymchwel.",
                  "details": "Rydym wedi ymrwymo i ddatgelu'r gwir am achos Fferm y Tŷ Mawr. Am ganrifoedd, daliodd teulu Williams y tir mewn anrhydedd, dim ond i wynebu dileu trwy driciau cyfreithiol a phŵer corfforaethol. Mae'r wefan hon yn gweithredu fel storfa o dystiolaeth, straeon personol, a'r frwydr barhaus am gydnabyddiaeth.",
                  "inverted": true
              }
          },
          {
              "type": "Quote",
              "props": {
                  "text": "Mae cyfiawnder a oediwyd yn gyfiawnder a wadwyd. Rydym yn cofio Fferm y Tŷ Mawr.",
                  "author": "Tîm yr Ymgyrch"
              }
          }
      ],
      "root": { "props": { "title": "Hafan" } }
  },
  "/about": {
      "content": [
          {
              "type": "Hero",
              "props": {
                  "title": "Amdanom Ni",
                  "subtitle": "Cymuned wedi'i huno gan dreftadaeth a cheisio'r gwir.",
                  "align": "left"
              }
          },
          {
              "type": "FeatureBlock",
              "props": {
                  "title": "Pwy Ydym Ni",
                  "summary": "Casgliad o aelodau'r teulu, haneswyr, ac ymgyrchwyr.",
                  "details": "Mae Ymgyrch Fferm y Tŷ Mawr yn gasgliad o aelodau'r teulu, haneswyr, ac ymgyrchwyr cymunedol sy'n ymroddedig i warchod cof Tŷ Mawr a chywiro'r cofnod hanesyddol ynghylch perchnogaeth teulu Williams a gweithredoedd dilynol Ymddiriedolaeth Pensiwn BP.",
                  "inverted": false
              }
          }
      ],
      "root": { "props": { "title": "Amdanom Ni" } }
  },
  "/act": {
      "content": [
          {
              "type": "Hero",
              "props": {
                  "title": "Gweithredwch",
                  "subtitle": "Mynnwch Ymchwiliad Cyhoeddus.",
                  "align": "center"
              }
          },
          {
              "type": "FeatureBlock",
              "props": {
                  "title": "Ysgrifennwch at y Senedd",
                  "summary": "Defnyddiwch ein templed i e-bostio eich cynrychiolydd.",
                  "details": "At: Correspondence.Senedd@gov.wales\n\nPwnc: Ymchwiliad Cyhoeddus i Ddymchwel Fferm y Tŷ Mawr\n\nAnnwyl Aelod o'r Senedd,\n\nYsgrifennaf i'ch annog i gefnogi ymchwiliad cyhoeddus i ddymchwel Fferm y Tŷ Mawr ym 1988 a thriniaeth teulu Williams/Buckler. Anwybyddwyd arwyddocâd hanesyddol ac archeolegol y safle hwn, ac nid yw cyfiawnder wedi'i wasanaethu eto.\n\nYn gywir,\n[Eich Enw]",
                  "inverted": true
              }
          }
      ],
      "root": { "props": { "title": "Gweithredwch" } }
  },
  "/shop": {
      "content": [
          {
              "type": "Hero",
              "props": {
                  "title": "Siop yr Ymgyrch",
                  "subtitle": "Nwyddau sy'n cefnogi'r achos.",
                  "align": "center"
              }
          },
          {
              "type": "ProductGrid",
              "props": {
                  "title": "Nwyddau Swyddogol",
                  "items": [
                      { "name": "Mwgn Cyfiawnder", "price": "£12.00", "description": "Mwgn ceramig gyda Logo GHF.", "buyLink": "#" },
                      { "name": "Crys-T (S-XL)", "price": "£25.00", "description": "Cotwm 100%. Du gyda Phrint Gwyrdd.", "buyLink": "#" },
                      { "name": "Bag Patagonia", "price": "£15.00", "description": "Cefnogi'r prosiect ailadeiladu.", "buyLink": "#" }
                  ]
              }
          }
      ],
      "root": { "props": { "title": "Siop" } }
  }
};

export const INITIAL_DATA = DB_CY;