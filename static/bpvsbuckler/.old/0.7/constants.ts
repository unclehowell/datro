
import { TimelineEntry } from './types';

// Helper to generate default attachments structure
const defaultAttachments = {
  gallery: [],
  legal: [],
  news: [],
  notes: [],
  report: []
};

export const TIMELINE: TimelineEntry[] = [
  {
    "year": "1215",
    "location": "St Dochdwy's Church, Llandough",
    "locationType": "farm",
    "description": "Great House Farm ('Ty Mawr') was built next to St Dochdwy’s Church. It stood on the remains of a significant Celtic monastery, establishing the farm as a cornerstone of the community, physically and spiritually linked to the ancient ecclesiastical center.",
    "narration": "In 1215, Ty Mawr is built next to the ancient church, standing on sacred ground that had seen centuries of prayer.",
    "scenes": [
      {
        "character": "The Builder",
        "icon": "builder",
        "side": "left",
        "color": "#e67e22",
        "text": "This farmhouse will stand the test of time next to the sacred church.",
        "position": { "x": 20, "y": 40 }
      }
    ],
    "sources": [],
    "attachments": { ...defaultAttachments, gallery: ["ruins.jpg", "church_view.jpg"] }
  },
  {
    "year": "1215-1539",
    "location": "Great House Farm",
    "locationType": "farm",
    "description": "For over three centuries, the farm was held under the lordship of Tewkesbury Abbey and the Prior of Cardiff. As a significant ecclesiastical asset, it served the monastery's agricultural needs.",
    "narration": "Owned by Tewkesbury Abbey, the farm serves the monastery's needs for over three hundred years.",
    "scenes": [
      {
        "character": "The Abbey Prior",
        "icon": "cleric",
        "side": "right",
        "color": "#9b59b6",
        "text": "These lands are held in trust for the church's eternal mission.",
        "position": { "x": 75, "y": 40 }
      }
    ],
    "sources": [],
    "attachments": { ...defaultAttachments, legal: ["abbey_charter.pdf"], notes: ["monastic_records.txt"] }
  },
  {
    "year": "1539-1543",
    "location": "Great House Farm",
    "locationType": "farm",
    "description": "The Dissolution of the Monasteries. King Henry VIII's agents assessed and then seized the property. The spiritual protection the farm once enjoyed was stripped away as it was cataloged for seizure by the Crown.",
    "narration": "Henry VIII seizes the property during the Dissolution, transforming it from a sacred holding into a Crown asset.",
    "scenes": [
      {
        "character": "Royal Assessor",
        "icon": "noble",
        "side": "left",
        "color": "#c0392b",
        "text": "Itemize everything. The King demands a full accounting.",
        "position": { "x": 30, "y": 40 }
      }
    ],
    "sources": [],
    "attachments": { ...defaultAttachments, report: ["crown_survey_1543.pdf"] }
  },
  {
    "year": "1543-1770",
    "location": "Great House Farm",
    "locationType": "farm",
    "description": "The title passed through the Crown to local gentry, including heirs of Sir Matthew Cradock and the Herbert family (Earls of Pembroke). While aristocrats held the 'Paper Title' in distant archives, local families began to hold the 'Living Title' through occupation.",
    "narration": "The title passes to local gentry and the Herbert family, but the 'Living Title' begins to shift to the occupiers.",
    "scenes": [
      {
        "character": "Herbert Family Heir",
        "icon": "noble",
        "side": "left",
        "color": "#e74c3c",
        "text": "The Herbert lineage will oversee this estate from afar.",
        "position": { "x": 20, "y": 45 }
      }
    ],
    "sources": [],
    "attachments": defaultAttachments
  },
  {
    "year": "1667",
    "location": "Great House Farm",
    "locationType": "farm",
    "description": "The Williams family began their documented occupation. A later 1987 newspaper article quoted Mrs. Williams stating the farm was 'acquired' then, implying purchase rather than mere tenancy. They paid taxes, built walls, and held the land in honor.",
    "narration": "The Williams family arrives. They don't just rent; they 'acquire' the land, starting a 300-year legacy.",
    "scenes": [
      {
        "character": "Williams Ancestor",
        "icon": "farmer",
        "side": "right",
        "color": "#27ae60",
        "text": "We have acquired this land. It is ours to work and to keep.",
        "position": { "x": 75, "y": 40 }
      }
    ],
    "sources": [],
    "attachments": { ...defaultAttachments, notes: ["williams_family_tree.txt"], legal: ["tax_record_1667.jpg"] }
  },
  {
    "year": "1770-1824",
    "location": "Great House Farm",
    "locationType": "farm",
    "description": "Ownership passed through Valentine Morris (1770), George Smith (1785), and Sir Mark Wood (1794). The farm was traded as a line item in aristocratic portfolios, while the Williams family remained the constant presence on the ground.",
    "narration": "Paper title trades hands between aristocrats like Valentine Morris and Sir Mark Wood, but the Williams family remains.",
    "scenes": [
      {
        "character": "Sir Mark Wood",
        "icon": "noble",
        "side": "left",
        "color": "#f39c12",
        "text": "Another estate for the portfolio.",
        "position": { "x": 25, "y": 40 }
      }
    ],
    "sources": [],
    "attachments": { ...defaultAttachments, notes: ["estate_ledger.txt"] }
  },
  {
    "year": "1824",
    "location": "Great House Farm",
    "locationType": "farm",
    "description": "The Marquess of Bute acquired the land. A survey by David Stewart for the Bute estate recorded the farm under its Welsh alias 'Cedfin'. The Bute estate became a massive industrial power, fueled by coal, overshadowing the farm.",
    "narration": "The Marquess of Bute acquires the land. A survey records the farm as 'Cedfin'.",
    "scenes": [
      {
        "character": "David Stewart",
        "icon": "lawyer",
        "side": "left",
        "color": "#3498db",
        "text": "Surveying 'Cedfin' for the Marquess.",
        "position": { "x": 20, "y": 40 }
      }
    ],
    "sources": [],
    "attachments": { ...defaultAttachments, legal: ["bute_survey_1824.pdf"] }
  },
  {
    "year": "1888",
    "location": "Great House Farm - Living Room",
    "locationType": "farm",
    "description": "While replacing flagstones with timber, the Williams family discovered a Roman soldier in full armor buried beneath the living room floor. This private find happened exactly 100 years before demolition. It proved the family knew the site's history long before 'official' excavations.",
    "narration": "Beneath the floorboards, a Roman soldier is found. The family keeps this secret safe, 100 years before the bulldozers.",
    "scenes": [
      {
        "character": "The Roman Soldier",
        "icon": "ghost",
        "side": "left",
        "color": "#9b59b6",
        "text": "My grave reveals the ancient history of this land.",
        "position": { "x": 25, "y": 45 }
      },
      {
        "character": "Williams Family",
        "icon": "farmer",
        "side": "right",
        "color": "#27ae60",
        "text": "A soldier in bronze armor! We must respect him.",
        "position": { "x": 75, "y": 40 }
      }
    ],
    "sources": [],
    "attachments": { ...defaultAttachments, gallery: ["roman_remains.jpg"], notes: ["family_diary_entry.txt"] }
  },
  {
    "year": "1895-1905",
    "location": "Great House Farm",
    "locationType": "farm",
    "description": "The Williams family struck a deal with Daniel Thomas, a quarry operator for the Marquess of Bute. They granted permission to quarry in exchange for the title. A ceremonial tree planting marked this agreement, cementing their belief in their ownership.",
    "narration": "A deal is struck with Daniel Thomas: quarrying rights in exchange for the land title. A tree is planted to seal it.",
    "scenes": [
      {
        "character": "Daniel Thomas",
        "icon": "builder",
        "side": "right",
        "color": "#e67e22",
        "text": "Your consent allows our work; ownership is your reward.",
        "position": { "x": 75, "y": 40 }
      }
    ],
    "sources": [],
    "attachments": { ...defaultAttachments, gallery: ["tree_planting.jpg"], legal: ["quarry_agreement_draft.pdf"] }
  },
  {
    "year": "1897",
    "location": "Great House Farm",
    "locationType": "farm",
    "description": "Guglielmo Marconi was a house guest at the farm while conducting wireless experiments. A Williams family member reportedly assisted him, though this contribution was suppressed or attributed to others in official records.",
    "narration": "Marconi stays at the farm. The family assists his wireless experiments, but their role is erased from history.",
    "scenes": [
      {
        "character": "Guglielmo Marconi",
        "icon": "noble",
        "side": "left",
        "color": "#f39c12",
        "text": "Your hospitality aids my revolutionary work.",
        "position": { "x": 20, "y": 40 }
      },
      {
        "character": "Williams Family",
        "icon": "farmer",
        "side": "right",
        "color": "#27ae60",
        "text": "We help build the future, even if no one knows.",
        "position": { "x": 70, "y": 45 }
      }
    ],
    "sources": [],
    "attachments": { ...defaultAttachments, news: ["marconi_visit.jpg"] }
  },
  {
    "year": "1915",
    "location": "Wales",
    "locationType": "other",
    "description": "Two men named Daniel Thomas died in Wales this year. The death of the quarry operator likely marked the end of the direct personal agreement regarding the quarry, leaving the family with a moral claim but no guarantor.",
    "narration": "Daniel Thomas dies. The personal agreement for the title loses its guarantor.",
    "scenes": [
      {
        "character": "Narrator",
        "icon": "narrator",
        "side": "left",
        "color": "#1abc9c",
        "text": "The promise of title now rests on memory alone.",
        "position": { "x": 25, "y": 40 }
      }
    ],
    "sources": [],
    "attachments": { ...defaultAttachments, news: ["obituary_daniel_thomas.jpg"] }
  },
  {
    "year": "February 1916",
    "location": "Great House Farm",
    "locationType": "farm",
    "description": "The Marquess of Bute formally granted a yearly agricultural tenancy to John Williams (Mrs. Williams' maternal grandfather). This created a paper trail of tenancy that would later contradict the family's claim of ownership 'acquired' in 1667.",
    "narration": "John Williams signs a tenancy agreement to keep the peace, creating a dangerous paper trail.",
    "scenes": [
      {
        "character": "Estate Agent",
        "icon": "lawyer",
        "side": "left",
        "color": "#3498db",
        "text": "Sign here for the tenancy, Mr. Williams.",
        "position": { "x": 25, "y": 40 }
      },
      {
        "character": "John Williams",
        "icon": "farmer",
        "side": "right",
        "color": "#27ae60",
        "text": "I sign, but this land is ours by right.",
        "position": { "x": 75, "y": 45 }
      }
    ],
    "sources": [],
    "attachments": { ...defaultAttachments, legal: ["tenancy_agreement_1916.pdf"] }
  },
  {
    "year": "1926",
    "location": "Great House Farm",
    "locationType": "farm",
    "description": "Intermediate title transferred to Mountjoy Ltd, a private company managing the Bute family's assets. Land management became a faceless administrative process.",
    "narration": "Mountjoy Ltd takes the title. The landlord becomes a faceless company.",
    "scenes": [
      {
        "character": "Mountjoy Rep",
        "icon": "noble",
        "side": "left",
        "color": "#2c3e50",
        "text": "We manage the assets now.",
        "position": { "x": 25, "y": 40 }
      }
    ],
    "sources": [],
    "attachments": { ...defaultAttachments, legal: ["title_transfer_mountjoy.pdf"] }
  },
  {
    "year": "1938",
    "location": "Cardiff",
    "locationType": "other",
    "description": "Western Ground Rents Ltd bought the urban leaseholds of the Bute Glamorgan Estate from Mountjoy Ltd for £5 million. The farm was part of this massive bulk transaction.",
    "narration": "Western Ground Rents buys the Bute estate for 5 million pounds. The farm is just one item on a long list.",
    "scenes": [
      {
        "character": "Corporate Buyer",
        "icon": "noble",
        "side": "left",
        "color": "#2c3e50",
        "text": "£5 million for the lot. A good investment.",
        "position": { "x": 25, "y": 40 }
      }
    ],
    "sources": [],
    "attachments": { ...defaultAttachments, news: ["bute_sale_1938.jpg"] }
  },
  {
    "year": "16 November 1938",
    "location": "Cardiff Auction House",
    "locationType": "court",
    "description": "Great House Farm was advertised as 'sold' at auction by Herbert R. Thomas. The Williams family remained in occupation, unaware their landlord had changed to a company known for aggressive rent enforcement.",
    "narration": "The farm is advertised as 'sold' at auction. The family stays put, unaware of the aggressive new owner.",
    "scenes": [
      {
        "character": "Auctioneer",
        "icon": "lawyer",
        "side": "left",
        "color": "#3498db",
        "text": "Sold to Western Ground Rents!",
        "position": { "x": 25, "y": 40 }
      }
    ],
    "sources": [],
    "attachments": { ...defaultAttachments, news: ["auction_notice_1938.jpg"] }
  },
  {
    "year": "2 February 1949",
    "location": "Great House Farm",
    "locationType": "farm",
    "description": "A new tenancy was ostensibly granted to Frederick Buckler (Mrs. Williams' husband), but no written agreement was executed. Mrs. Williams retained her maiden name, asserting her lineage.",
    "narration": "Frederick Buckler takes a tenancy without a written agreement. Mary retains her maiden name, Williams.",
    "scenes": [
      {
        "character": "Frederick Buckler",
        "icon": "farmer",
        "side": "right",
        "color": "#95a5a6",
        "text": "We are tenants in name, but owners in spirit.",
        "position": { "x": 75, "y": 40 }
      }
    ],
    "sources": [],
    "attachments": defaultAttachments
  },
  {
    "year": "10 October 1952",
    "location": "Great House Farm",
    "locationType": "farm",
    "description": "Agents wrote to the family solicitor stating they did not propose to proceed with letting the farm to Frederick Buckler, severing the formal relationship.",
    "narration": "The agents refuse to proceed with the letting, cutting the legal tie.",
    "scenes": [
      {
        "character": "Agent",
        "icon": "lawyer",
        "side": "left",
        "color": "#e74c3c",
        "text": "We will not grant the lease.",
        "position": { "x": 25, "y": 40 }
      }
    ],
    "sources": [],
    "attachments": { ...defaultAttachments, legal: ["solicitor_letter_1952.pdf"] }
  },
  {
    "year": "1953",
    "location": "Great House Farm",
    "locationType": "farm",
    "description": "Last rent payment made by Frederick Buckler. A notice to quit was issued, expiring Feb 2, 1955. This marked the start of the adverse possession claim.",
    "narration": "The last rent is paid. A notice to quit is served. The clock for adverse possession begins.",
    "scenes": [
      {
        "character": "Frederick Buckler",
        "icon": "farmer",
        "side": "right",
        "color": "#95a5a6",
        "text": "No more rent. We stand our ground.",
        "position": { "x": 75, "y": 40 }
      }
    ],
    "sources": [],
    "attachments": { ...defaultAttachments, legal: ["notice_to_quit_1953.jpg"] }
  },
  {
    "year": "4 July 1955",
    "location": "High Court",
    "locationType": "court",
    "description": "Possession proceedings. The order was enforced for the farm land but NOT the farmhouse or garden. Mary Williams, having recently had a leg amputated and threatening suicide, refused to leave. Bailiffs retreated.",
    "narration": "Bailiffs take the fields but flee the house. Mary Williams, an amputee, refuses to move.",
    "scenes": [
      {
        "character": "Court Bailiff",
        "icon": "guard",
        "side": "left",
        "color": "#7f8c8d",
        "text": "We cannot move her. She is too ill and too defiant.",
        "position": { "x": 25, "y": 40 }
      },
      {
        "character": "Mary Williams",
        "icon": "farmer",
        "side": "right",
        "color": "#27ae60",
        "text": "I will die before I leave this house!",
        "position": { "x": 75, "y": 45 }
      }
    ],
    "sources": [],
    "attachments": { ...defaultAttachments, legal: ["possession_order_1955.pdf"], news: ["bailiff_standoff_1955.jpg"] }
  },
  {
    "year": "11 December 1962",
    "location": "Cardiff County Court",
    "locationType": "court",
    "description": "Western Ground Rents v Buckler/Williams. A new possession order was granted but remained unexecuted. The court hesitated to evict the family given the history.",
    "narration": "Another possession order is granted, but again, it goes unexecuted.",
    "scenes": [
      {
        "character": "Judge Temple Morris",
        "icon": "judge",
        "side": "center",
        "color": "#f1c40f",
        "text": "Order granted, but history stays my hand.",
        "position": { "x": 50, "y": 35 }
      }
    ],
    "sources": [],
    "attachments": { ...defaultAttachments, legal: ["court_order_1962.pdf"] }
  },
  {
    "year": "December 1965",
    "location": "Great House Farm",
    "locationType": "farm",
    "description": "Frederick Buckler died. Mary Williams remained in possession, refusing to pay rent or sign new agreements, solidifying the adverse possession claim.",
    "narration": "Frederick Buckler dies. Mary stands alone against the corporations.",
    "scenes": [
      {
        "character": "Mary Williams",
        "icon": "farmer",
        "side": "center",
        "color": "#27ae60",
        "text": "I am the last guardian of this land.",
        "position": { "x": 50, "y": 40 }
      }
    ],
    "sources": [],
    "attachments": { ...defaultAttachments, news: ["local_obituary_buckler.jpg"] }
  },
  {
    "year": "December 1969",
    "location": "Corporate Office",
    "locationType": "other",
    "description": "Western Ground Rents sold to BP Pension Trust Ltd. The farm was now owned by a massive pension fund.",
    "narration": "Western Ground Rents sells to BP Pension Trust. A global giant now claims the farm.",
    "scenes": [
      {
        "character": "BP Exec",
        "icon": "noble",
        "side": "left",
        "color": "#2c3e50",
        "text": "Acquire the asset.",
        "position": { "x": 25, "y": 40 }
      }
    ],
    "sources": [],
    "attachments": { ...defaultAttachments, report: ["bp_acquisition_memo.pdf"] }
  },
  {
    "year": "1970",
    "location": "Llandough",
    "locationType": "farm",
    "description": "Llandough Primary School opened. Developers viewed the farm as an obstacle to progress, describing it as a 'dilapidated utility building' to bypass heritage protections.",
    "narration": "The school opens. Developers label the medieval farm a 'ruined barn' to clear the way.",
    "scenes": [
      {
        "character": "Developer",
        "icon": "noble",
        "side": "left",
        "color": "#e74c3c",
        "text": "It's just a ruin. Bulldoze it.",
        "position": { "x": 25, "y": 40 }
      }
    ],
    "sources": [],
    "attachments": { ...defaultAttachments, news: ["school_opening.jpg"], report: ["planning_assessment_1970.pdf"] }
  },
  {
    "year": "June 1974",
    "location": "Great House Farm",
    "locationType": "farm",
    "description": "Important copies of title deeds and evidence reportedly went missing around this time, severely handicapping the family's ability to prove ownership.",
    "narration": "Crucial title deeds vanish. The evidence is disappearing.",
    "scenes": [
      {
        "character": "Mary Williams",
        "icon": "farmer",
        "side": "right",
        "color": "#27ae60",
        "text": "The proofs are gone! Stolen!",
        "position": { "x": 75, "y": 40 }
      }
    ],
    "sources": [],
    "attachments": { ...defaultAttachments, notes: ["police_report_missing_deeds.txt"] }
  },
  {
    "year": "3 July 1974",
    "location": "Cardiff County Court",
    "locationType": "court",
    "description": "Court hearing adjourned without a ruling on title. Mary pleaded her claim of ownership based on generations of adverse possession.",
    "narration": "The court adjourns without ruling on the title. Mary pleads her case.",
    "scenes": [
      {
        "character": "Judge",
        "icon": "judge",
        "side": "center",
        "color": "#f1c40f",
        "text": "Adjourned. No decision.",
        "position": { "x": 50, "y": 45 }
      }
    ],
    "sources": [],
    "attachments": { ...defaultAttachments, legal: ["court_transcript_july_1974.pdf"] }
  },
  {
    "year": "19 September 1974",
    "location": "Cardiff County Court",
    "locationType": "court",
    "description": "Judge Watkin Powell gave leave to execute the possession order but suspended it until Oct 31, 1974.",
    "narration": "Judge Watkin Powell sets a deadline: October 31st. Eviction looms.",
    "scenes": [
      {
        "character": "Judge",
        "icon": "judge",
        "side": "center",
        "color": "#f1c40f",
        "text": "You must leave by Halloween.",
        "position": { "x": 50, "y": 40 }
      }
    ],
    "sources": [],
    "attachments": { ...defaultAttachments, legal: ["eviction_order_sept_1974.pdf"] }
  },
  {
    "year": "30-31 October 1974",
    "location": "Great House Farm",
    "locationType": "farm",
    "description": "Appeal application issued Oct 30. Warrant withdrawn Oct 31. BP claimed benevolence due to press outcry, but it was a strategic retreat.",
    "narration": "Eleventh hour appeal. BP withdraws the warrant, claiming benevolence, but it's a trap.",
    "scenes": [
      {
        "character": "BP Lawyer",
        "icon": "lawyer",
        "side": "left",
        "color": "#2c3e50",
        "text": "Withdraw the warrant. We try a different way.",
        "position": { "x": 25, "y": 40 }
      }
    ],
    "sources": [],
    "attachments": { ...defaultAttachments, news: ["press_outcry_1974.jpg"] }
  },
  {
    "year": "4 November 1974",
    "location": "Great House Farm",
    "locationType": "farm",
    "description": "Licence letters received from BP (allegedly sent Oct 31) offering a unilateral licence to 'Mrs Buckler'. Mary's failure to respond (silence) was later used to claim she accepted it.",
    "narration": "Mary receives licence letters addressed to 'Mrs Buckler'. She stays silent, and the trap snaps shut.",
    "scenes": [
      {
        "character": "Postman",
        "icon": "worker",
        "side": "left",
        "color": "#e67e22",
        "text": "Letters for Mrs Buckler.",
        "position": { "x": 25, "y": 40 }
      },
      {
        "character": "Mary Williams",
        "icon": "farmer",
        "side": "right",
        "color": "#27ae60",
        "text": "I am Mary Williams! I will not answer to Buckler.",
        "position": { "x": 75, "y": 45 }
      }
    ],
    "sources": [],
    "attachments": { ...defaultAttachments, legal: ["license_letter_1974.pdf"] }
  },
  {
    "year": "1978-1980",
    "location": "Great House Farm",
    "locationType": "farm",
    "description": "GGAT 'rescue' excavations conducted. The site was already being cleared, acknowledging historical value only as it was being destroyed.",
    "narration": "Rescue excavations begin. They dig while the site is dying.",
    "scenes": [
      {
        "character": "Archaeologist",
        "icon": "worker",
        "side": "left",
        "color": "#f39c12",
        "text": "We must save what records we can.",
        "position": { "x": 25, "y": 40 }
      }
    ],
    "sources": [],
    "attachments": { ...defaultAttachments, report: ["ggat_excavation_summary.pdf"], gallery: ["excavation_photo_1978.jpg"] }
  },
  {
    "year": "22 May 1980",
    "location": "House of Commons",
    "locationType": "court",
    "description": "MP Ted Rowlands publicly criticized BP Pension Trust's bullying conduct in Parliament.",
    "narration": "MP Ted Rowlands denounces BP in Parliament. 'Bullying,' he calls it.",
    "scenes": [
      {
        "character": "MP Ted Rowlands",
        "icon": "noble",
        "side": "right",
        "color": "#3498db",
        "text": "BP's conduct is shameful!",
        "position": { "x": 75, "y": 40 }
      }
    ],
    "sources": [],
    "attachments": { ...defaultAttachments, news: ["hansard_record.pdf"] }
  },
  {
    "year": "1982",
    "location": "Land Registry",
    "locationType": "other",
    "description": "First land registration in Wales. Farm registered under BP's title without mention of the dispute.",
    "narration": "Land registration arrives. BP registers the title, erasing the dispute from the record.",
    "scenes": [
      {
        "character": "Registrar",
        "icon": "lawyer",
        "side": "center",
        "color": "#7f8c8d",
        "text": "Registered to BP.",
        "position": { "x": 50, "y": 40 }
      }
    ],
    "sources": [],
    "attachments": { ...defaultAttachments, legal: ["land_registry_1982.jpg"] }
  },
  {
    "year": "1983",
    "location": "Great House Farm",
    "locationType": "farm",
    "description": "Mary Williams dies at the farmhouse. Her son William Buckler Jr. takes up the fight.",
    "narration": "Mary Williams dies at home. Her son Billy takes up the burden.",
    "scenes": [
      {
        "character": "Billy Buckler",
        "icon": "farmer",
        "side": "center",
        "color": "#95a5a6",
        "text": "I will fight for you, Mum.",
        "position": { "x": 50, "y": 40 }
      }
    ],
    "sources": [],
    "attachments": { ...defaultAttachments, news: ["mary_williams_memorial.jpg"] }
  },
  {
    "year": "1984",
    "location": "Cardiff Library",
    "locationType": "other",
    "description": "Copies of the Bute Estate to Daniel Thomas deed and index card are reported missing from Cardiff Library.",
    "narration": "More evidence vanishes. The Daniel Thomas deed is gone from the library.",
    "scenes": [
      {
        "character": "Librarian",
        "icon": "worker",
        "side": "left",
        "color": "#e74c3c",
        "text": "It's missing. I can't find the file.",
        "position": { "x": 25, "y": 40 }
      }
    ],
    "sources": [],
    "attachments": defaultAttachments
  },
  {
    "year": "31 July 1987",
    "location": "Court of Appeal",
    "locationType": "court",
    "description": "BP Properties Ltd v Buckler. Court rules the 1974 unilateral licence letters stopped adverse possession. Mary's silence was deemed acceptance.",
    "narration": "The Court of Appeal rules against the family. Mary's silence was acceptance. Title to BP.",
    "scenes": [
      {
        "character": "Lord Justice",
        "icon": "judge",
        "side": "center",
        "color": "#f1c40f",
        "text": "Silence implies consent. The claim fails.",
        "position": { "x": 50, "y": 35 }
      },
      {
        "character": "Billy Buckler",
        "icon": "farmer",
        "side": "right",
        "color": "#95a5a6",
        "text": "This is a trap, not justice!",
        "position": { "x": 70, "y": 40 }
      }
    ],
    "sources": [
      {
        "type": "court",
        "label": "BP Properties Ltd v Buckler [1987]",
        "url": "https://www.bailii.org/"
      }
    ],
    "attachments": { ...defaultAttachments, legal: ["appeal_ruling_1987.pdf"] }
  },
  {
    "year": "1988",
    "location": "Great House Farm",
    "locationType": "farm",
    "description": "Billy Buckler refuses to leave. A chainsaw standoff ensues. He fears leaving for medical checkups lest bailiffs return.",
    "narration": "Billy refuses to leave. Chainsaws and standoffs. He holds the line.",
    "scenes": [
      {
        "character": "Billy Buckler",
        "icon": "farmer",
        "side": "center",
        "color": "#95a5a6",
        "text": "I'm here to stay!",
        "position": { "x": 50, "y": 40 }
      }
    ],
    "sources": [],
    "attachments": { ...defaultAttachments, news: ["chainsaw_standoff.jpg"] }
  },
  {
    "year": "6 December 1988",
    "location": "Great House Farm",
    "locationType": "farm",
    "description": "Demolition. Bulldozers move in overnight amid protests. The 13th-century structure is erased. The family is evicted.",
    "narration": "The bulldozers come at night. Centuries of history are crushed in hours.",
    "scenes": [
      {
        "character": "Demolition Foreman",
        "icon": "builder",
        "side": "left",
        "color": "#e67e22",
        "text": "Tear it down.",
        "position": { "x": 25, "y": 40 }
      },
      {
        "character": "Local Resident",
        "icon": "narrator",
        "side": "right",
        "color": "#1abc9c",
        "text": "It is gone. Ty Mawr is no more.",
        "position": { "x": 75, "y": 45 }
      }
    ],
    "sources": [],
    "attachments": { ...defaultAttachments, gallery: ["demolition.jpg"], news: ["demolition_report_1988.pdf"] }
  },
  {
    "year": "1989",
    "location": "A Bus",
    "locationType": "other",
    "description": "The family lives in a bus after eviction. Billy Buckler is charged but vows to fight on.",
    "narration": "From a farmhouse to a bus. Billy vows to fight on to the death.",
    "scenes": [
      {
        "character": "Billy Buckler",
        "icon": "farmer",
        "side": "center",
        "color": "#95a5a6",
        "text": "They took the house, but not the truth.",
        "position": { "x": 50, "y": 40 }
      }
    ],
    "sources": [],
    "attachments": { ...defaultAttachments, gallery: ["bus_home.jpg"] }
  },
  {
    "year": "1994",
    "location": "Former Farm Site",
    "locationType": "farm",
    "description": "Cotswold Archaeological Trust excavation. 'Burial 631' found—a young man with iron straps—confirming the high-status site the family knew of in 1888.",
    "narration": "Excavations confirm what the family knew. Burial 631 proves the site's ancient power.",
    "scenes": [
      {
        "character": "Archaeologist",
        "icon": "worker",
        "side": "left",
        "color": "#3498db",
        "text": "Incredible. A monastic cemetery. Iron-strapped burials.",
        "position": { "x": 25, "y": 40 }
      },
      {
        "character": "Williams Descendant",
        "icon": "farmer",
        "side": "right",
        "color": "#27ae60",
        "text": "We told you. We always told you.",
        "position": { "x": 75, "y": 45 }
      }
    ],
    "sources": [],
    "attachments": { ...defaultAttachments, report: ["cotswold_report_1994.pdf"] }
  },
  {
    "year": "2024",
    "location": "Church View Close",
    "locationType": "farm",
    "description": "David Buckler testifies about the family betrayal and the secret sale. Modern homes now stand on the historic ground.",
    "narration": "David Buckler speaks of the betrayal. Modern homes cover the site, but the story refuses to die.",
    "scenes": [
      {
        "character": "David Buckler",
        "icon": "farmer",
        "side": "right",
        "color": "#27ae60",
        "text": "It was a betrayal. It tore us apart.",
        "position": { "x": 70, "y": 45 }
      },
      {
        "character": "Modern Resident",
        "icon": "noble",
        "side": "left",
        "color": "#7f8c8d",
        "text": "I live here now. I never knew.",
        "position": { "x": 25, "y": 40 }
      }
    ],
    "sources": [],
    "attachments": { ...defaultAttachments, news: ["testimony_2024.pdf"] }
  }
];
