import { Database } from "./types";

// EN data (full for runtime in EN)
export const DB_EN: Database = {
  "/": {
    content: [
      { type: "Hero", props: { title: "Great House Farm", subtitle: "Fighting for truth, justice, and the recognition of centuries of history.", backgroundImage: "./farm-gate.jpg", align: "left" } },
      { type: "HeadingBlock", props: { title: "Our Mission", level: "h2", align: "center" } },
      { type: "FeatureBlock", props: {
        title: "A Legacy Erased",
        summary: "For over 300 years, the Williams family held Great House Farm. In 1988, it was demolished.",
        details: "We are dedicated to uncovering the truth about the Great House Farm case. For centuries, the Williams family held the land in honor, only to face erasure through legal maneuvering and corporate power.",
        inverted: true
      }},
      { type: "Quote", props: { text: "Justice delayed is justice denied. We remember Great House Farm.", author: "Campaign Team" } }
    ],
    root: { props: { title: "Home" } }
  },
  "/cms": {
    content: [ { type: "Hero", props: { title: "CMS", subtitle: "Content Management System", align: "center" } } ],
    root: { props: { title: "CMS" } }
  },
  "/about": {
    content: [
      { type: "Hero", props: { title: "About Us", subtitle: "A community united by heritage and the pursuit of truth.", align: "left" } },
      { type: "FeatureBlock", props: { title: "Who We Are", summary: "A collective of family members, historians, and activists.", details: "The Great House Farm is a collective dedicated to preserving memory and correcting the historical record.", inverted: false } }
    ],
    root: { props: { title: "About Us" } }
  },
  "/story": {
    content: [
      { type: "Hero", props: { title: "Our Story", subtitle: "A story of resistance and memory.", align: "left" } },
      { type: "FeatureBlock", props: { title: "A Legacy Remembered", summary: "The story continues.", details: "Further narrative and evidence.", inverted: false } }
    ],
    root: { props: { title: "Our Story" } }
  },
  "/writings": {
    content: [
      { type: "Hero", props: { title: "Writings", subtitle: "Updates and testimonies.", align: "center" } },
      { type: "FeatureBlock", props: { title: "March 2024 Update", summary: "The Search for Deeds.", details: "Initiatives to locate missing deeds.", inverted: true } }
    ],
    root: { props: { title: "Writings" } }
  },
  "/writings/newsletter": {
    content: [
      { type: "Hero", props: { title: "Newsletter", subtitle: "Campaign updates and community action.", align: "center" } },
      { type: "FeatureBlock", props: { title: "March Update", summary: "News and notices.", details: "Details forthcoming.", inverted: true } }
    ],
    root: { props: { title: "Newsletter" } }
  },
  "/writings/sion": {
    content: [
      { type: "Hero", props: { title: "Sion\'s Story", subtitle: "Reflections on a lost heritage.", align: "left" } },
      { type: "FeatureBlock", props: { title: "Living History", summary: "Growing up with the ghosts of the past.", details: "Stories and memories.", inverted: false } }
    ],
    root: { props: { title: "Sion\'s Story" } }
  },
  "/writings/david": {
    content: [
      { type: "Hero", props: { title: "David\'s Story", subtitle: "The legal betrayal and the fight for answers.", align: "left" } },
      { type: "FeatureBlock", props: { title: "A Father\'s Silence", summary: "The burden of the legal battle.", details: "My father believed the legal matters had been settled.", inverted: true } }
    ],
    root: { props: { title: "David\'s Story" } }
  },
  "/gallery": {
    content: [
      { type: "Hero", props: { title: "Visual Archive", subtitle: "Documenting the physical history of Great House Farm.", align: "center" } },
      { type: "ImageGrid", props: { title: "Featured Images", items: [
        { caption: "The Farmhouse c. 1950", alt: "Old black and white photo", src: "./farm-house.jpg" },
        { caption: "Mary Williams in the Garden", alt: "Woman in garden" },
        { caption: "The 1988 Demolition", alt: "Bulldozers on site" }
      ] } }
    ],
    root: { props: { title: "Gallery" } }
  },
  "/gallery/historical": {
    content: [
      { type: "Hero", props: { title: "Historical Gallery", subtitle: "Life at the farm through the centuries.", align: "left" } },
      { type: "ImageGrid", props: { title: "19th & 20th Century", items: [
        { caption: "The Great Hall", alt: "Interior shot" },
        { caption: "Harvest 1920", alt: "Workers in field" }
      ] } }
    ],
    root: { props: { title: "Historical Gallery" } }
  },
  "/gallery/excavations": {
    content: [
      { type: "Hero", props: { title: "Excavations", subtitle: "The 1978 and 1994 digs that proved us right.", align: "left" } },
      { type: "FeatureBlock", props: { title: "The 1994 Report", summary: "Evidence of over 800 burials.", details: "Archaeological evidence confirming a monastic cemetery prior to development.", inverted: false } }
    ],
    root: { props: { title: "Excavations Gallery" } }
  },
  "/gallery/family": {
    content: [
      { type: "Hero", props: { title: "Family Archive", subtitle: "The people behind the possession.", align: "left" } },
      { type: "FeatureBlock", props: { title: "The Williams Lineage", summary: "Portraits and candid photos.", details: "Photos of Mary Williams, Frederick Buckler, and the children who grew up within the walls of Ty Mawr.", inverted: true } }
    ],
    root: { props: { title: "Family Gallery" } }
  },
  "/ghf-2-0": {
    content: [
      { type: "Hero", props: { title: "Gran Casa Farm 2.0", subtitle: "Reconstruyendo el patrimonio en Patagonia.", align: "center" } },
      { type: "FeatureBlock", props: { title: "Una Réplica en Patagonia", summary: "Proyecto visionario de Sion Buckler.", details: "Gran Casa Farm 2.0 es una réplica a escala de la casa original, actualmente en desarrollo en Patagonia, Argentina.", inverted: false } },
      { type: "FeatureBlock", props: { title: "Visitas Guiadas", summary: "Experimenta la historia de primera mano.", details: "Una vez finalizada, Gran Casa Farm 2.0 estará abierto al público. Las visitas guiadas recorrerán toda la historia.", inverted: true } }
    ],
    root: { props: { title: "Gran Casa Farm II" } }
  },
  "/compensation-assessment": {
    content: [
      { type: "Hero", props: { title: "Compensation Assessment", subtitle: "Forensic Evaluation and Assessment of Restitutionary Claims", align: "center" } },
      { type: "HeadingBlock", props: { title: "1. Executive Summary", level: "h2", align: "left" } },
      { type: "TextBlock", props: { content: "This report provides a forensic evaluation of the 321-year dispossession of the Williams family from Great House Farm (Ty Mawr), Llandough. Based on a comprehensive review of historical archives, contemporaneous news reports (1988–1989), and recent archaeological findings, this assessment establishes a legally defensible restitution demand of £37.0 million. This figure accounts for the total loss of the 70-acre estate's development potential, the destruction of a 13th-century monastic grange, and the profound personal injury and multi-generational trauma resulting from systematic corporate fraud and \"identity erasure.\"" } },
      { type: "HeadingBlock", props: { title: "2. The \"Mrs. Buckler\" Fiction: Fraud and Narrative Injustice", level: "h2", align: "left" } },
      { type: "TextBlock", props: { content: "A critical component of the legal and narrative injustice in this case is the persistent misidentification of the family matriarch. In the landmark case of *BP Properties Ltd v Buckler*, the Court of Appeal consistently referred to the occupant as Mrs. Williams' husband's name, \"Mrs. Buckler.\"\n\nForensic Findings on Identity Erasure:\n• The Williams Title: The family's tenure is rooted in the Williams lineage, with documented continuous occupation since 1667.\n• The Buckler Fiction: No \"Mrs. Buckler\" ever existed as a claimant to the land. Mary Williams never adopted her husband's surname for legal or personal use.\n• Strategic Misnaming: The 1974 \"Unilateral License\" issued by BP Pension Trust Ltd was addressed to \"Mrs. Buckler.\" This was not a clerical error but a strategic attempt to bind the Williams ancestral claim to the failed 1965 negotiations of the late Mr. Frederick Buckler—a man with no ancestral ties to the 300-year Williams \"Living Title\".\n• Silence as Consent: By addressing correspondence to a non-existent legal persona (\"Mrs. Buckler\"), corporate actors ensured that Mrs. Williams would not (and could not) respond under that name. This allowed the court to fraudulently interpret her \"silence\" as acceptance of a license, effectively stopping the limitation clock for adverse possession." } },
      { type: "HeadingBlock", props: { title: "3. Custodial Heritage and Archaeological Suppression", level: "h2", align: "left" } },
      { type: "TextBlock", props: { content: "The Williams family served as the custodians of nationally significant archaeology for three centuries. This role was systematically undermined to facilitate the 1988 demolition.\n\n• Actual Notice (1888): The discovery of a Roman soldier in full armor beneath the living room floor by the Williams family provided the community and future owners with \"actual notice\" of the site's historical depth.\n• Fraudulent Classification (1987): Planning documents preceding the demolition described Ty Mawr—a 13th-century monastic grange—as a \"dilapidated utility building\" or \"ruined barn\". This misrepresentation allowed BP to bypass heritage protections that would have likely resulted in a preservation order under the Ancient Monuments and Archaeological Areas Act 1979.\n• Verification (1994): The subsequent excavation of 1,026 burials confirmed the family's 100-year-old assertions, yet the archaeology was framed as a \"new discovery\" to protect the actors involved in the destruction of the site." } },
      { type: "HeadingBlock", props: { title: "4. Legal Assessment of UK Law and Precedent", level: "h2", align: "left" } },
      { type: "TextBlock", props: { content: "The path to restitution relies on the principle that \"fraud unravels everything.\"\n\n• Setting Aside Judgments: Under *Takhar v Gracefield Developments Ltd*, a judgment obtained by fraud (including the \"identity erasure\" of Mrs. Williams) can be set aside regardless of whether the fraud could have been discovered at the time of the original trial.\n• Disgorgement of Profits: The \"Rukhadze\" principle (as clarified in Rukhadze v Recovery Partners) mandates that a wrongdoer must surrender profits earned through a breach of duty or fraudulent concealment. BP's development of \"Church View Close\" represents a direct financial gain derived from the suppression of the Williams family's possessory rights.\n• Restitutio in Integrum: The aim of civil damages is to restore the family to the position they would have held had the fraud not occurred—including the loss of the 70-acre estate's \"hope value\"." } },
      { type: "HeadingBlock", props: { title: "5. Quantification of Losses (£37.0 Million)", level: "h2", align: "left" } },
      { type: "TextBlock", props: { content: "This section quantifies the losses suffered:\n\n*   **Estate & Opportunity:** 70 acres at a \"suburban consented\" rate of £400k/acre, with news reports valuing the land as a \"fortune\" overlooking Cardiff Bay. Estimated Award: £28,000,000.\n*   **Historical Asset Destruction:** Replacement value of the 13th-century grange (Ty Mawr) and the primary 1-acre plot, reflecting its status as a site of international importance. Estimated Award: £2,500,000.\n*   **Injury & Intergenerational Trauma:** Mrs. Williams' amputation (1955 medical crisis), the 1988 \"chainsaw standoff\" trauma, and 35 years of \"bus living\" homelessness. Estimated Award: £4,500,000.\n*   **Aggravated & Exemplary Damages:** Sanction for the \"Naming Fraud\" used to erase the Williams identity and the \"Library Theft\" of deeds reported in 1984. Estimated Award: £2,000,000.\n\n**Total Restitution Demand: £37,000,000**" } },
      { type: "HeadingBlock", props: { title: "6. Conclusion", level: "h2", align: "left" } },
      { type: "TextBlock", props: { content: "The Williams family has been the victim of a coordinated campaign of narrative exclusion and legal fraud. The use of the \"Mrs. Buckler\" pseudonym was the primary tool used by the courts to sever the family's 300-year ancestral claim. This revised demand of £37 million is accurate, realistic, and justified by market data and news records of the time. It moves the claim from a standard trespass dispute into a sophisticated restitution case grounded in the disgorgement of profits and the unravelling of a fraudulent judgment." } },
      { type: "HeadingBlock", props: { title: "Strategic Appendix: Key Source References", level: "h2", align: "left" } },
      { type: "TextBlock", props: { content: "• BP Properties Ltd v Buckler EWCA Civ 2 (Termination of adverse possession via unilateral license).\n• Takhar v Gracefield Developments Ltd UKSC 13 (Test for setting aside judgments for fraud).\n• South Wales Echo Archive (Dec 3, 1988): \"History Fight to Save Farm\" (Confirming 10-acre site/70-acre estate).\n• Cotswold Archaeology (1994 Report): \"Llandough Monastic Cemetery\" (Confirming site significance)." } }
    ],
    root: { props: { title: "Compensation Assessment" } }
  }
};

// ES data (you can extend later; keeps “Finca Gran Casa” root)
export const DB_ES: Database = {
  "/": {
    content: [],
    root: { props: { title: "Finca Gran Casa" } }
  },
  "/compensation-assessment": {
    content: [
      { type: "Hero", props: { title: "Evaluación de Compensación", subtitle: "Evaluación Forense y Tasación de Reclamaciones de Restitución", align: "center" } }
      // Content needs translation
    ],
    root: { props: { title: "Evaluación de Compensación" } }
  }
};

// Welsh default (CY)
export const DB_CY: Database = {
  "/": {
    content: [
      { type: "Hero", props: { title: "Ty Mawr Fferm", subtitle: "Hanes a chefnogaeth", backgroundImage: "./farm-gate.jpg", align: "left" } }
    ],
    root: { props: { title: "Hafan" } }
  },
  "/cms": {
    content: [
      { type: "Hero", props: { title: "CMS", subtitle: "Content management", align: "center" } }
    ],
    root: { props: { title: "CMS" } }
  },
  "/cms/newsletter": { content: [], root: { props: { title: "Newsletter" } } },
  "/compensation-assessment": {
    content: [
      { type: "Hero", props: { title: "Asesment Tâl-dâl", subtitle: "Evaluation Ffrensig ac Asesment o Hawliadau Adfer", align: "center" } }
      // Content needs translation
    ],
    root: { props: { title: "Asesment Tâl-dâl" } }
  }
} as unknown as Database;

// Ensure INITIAL_DATA exists for default state
export const INITIAL_DATA = DB_EN;
