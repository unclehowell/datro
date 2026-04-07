import { Database } from "./types";

// EN data (runtime EN)
export const DB_EN: Database = {
  "/": {
    content: [
      {
        type: "Hero",
        props: {
          title: "Great House Farm",
          subtitle:
            "Fighting for truth, justice, and the recognition of centuries of history.",
          backgroundImage: "./farm-gate.jpg",
          align: "left",
        },
      },
      {
        type: "HeadingBlock",
        props: { title: "Our Mission", level: "h2", align: "center" },
      },
      {
        type: "FeatureBlock",
        props: {
          title: "A Legacy Erased",
          summary:
            "For over 300 years, the Williams family held Great House Farm. In 1988, it was demolished.",
          details:
            "We are dedicated to uncovering the truth about the Great House Farm case. For centuries, the Williams family held the land in honor, only to face erasure through legal maneuvering and corporate power.",
          inverted: true,
        },
      },
      {
        type: "Quote",
        props: {
          text:
            "Justice delayed is justice denied. We remember Great House Farm.",
          author: "Campaign Team",
        },
      },
    ],
    root: { props: { title: "Home" } },
  },

  "/cms": {
    content: [
      {
        type: "Hero",
        props: {
          title: "CMS",
          subtitle: "Content Management System",
          align: "center",
        },
      },
    ],
    root: { props: { title: "CMS" } },
  },

  "/about": {
    content: [
      {
        type: "Hero",
        props: {
          title: "About Us",
          subtitle:
            "A community united by heritage and the pursuit of truth.",
          align: "left",
        },
      },
      {
        type: "FeatureBlock",
        props: {
          title: "Who We Are",
          summary: "A collective of family members, historians, and activists.",
          details:
            "The Great House Farm is a collective dedicated to preserving memory and correcting the historical record.",
          inverted: false,
        },
      },
    ],
    root: { props: { title: "About Us" } },
  },

  "/story": {
    content: [
      {
        type: "Hero",
        props: {
          title: "Our Story",
          subtitle: "A story of resistance and memory.",
          align: "left",
        },
      },
      {
        type: "FeatureBlock",
        props: {
          title: "A Legacy Remembered",
          summary: "The story continues.",
          details: "Further narrative and evidence.",
          inverted: false,
        },
      },
    ],
    root: { props: { title: "Our Story" } },
  },

  "/writings": {
    content: [
      {
        type: "Hero",
        props: {
          title: "Writings",
          subtitle: "Updates and testimonies.",
          align: "center",
        },
      },
      {
        type: "FeatureBlock",
        props: {
          title: "March 2024 Update",
          summary: "The Search for Deeds.",
          details: "Initiatives to locate missing deeds.",
          inverted: true,
        },
      },
    ],
    root: { props: { title: "Writings" } },
  },

  "/writings/newsletter": {
    content: [
      {
        type: "Hero",
        props: {
          title: "Newsletter",
          subtitle: "Campaign updates and community action.",
          align: "center",
        },
      },
      {
        type: "FeatureBlock",
        props: {
          title: "March Update",
          summary: "News and notices.",
          details: "Details forthcoming.",
          inverted: true,
        },
      },
    ],
    root: { props: { title: "Newsletter" } },
  },

  "/writings/sion": {
    content: [
      {
        type: "Hero",
        props: {
          title: "Sion's Story",
          subtitle: "Reflections on a lost heritage.",
          align: "left",
        },
      },
      {
        type: "FeatureBlock",
        props: {
          title: "Living History",
          summary: "Growing up with the ghosts of the past.",
          details: "Stories and memories.",
          inverted: false,
        },
      },
    ],
    root: { props: { title: "Sion's Story" } },
  },

  "/writings/david": {
    content: [
      {
        type: "Hero",
        props: {
          title: "David's Story",
          subtitle: "The legal betrayal and the fight for answers.",
          align: "left",
        },
      },
      {
        type: "FeatureBlock",
        props: {
          title: "A Father's Silence",
          summary: "The burden of the legal battle.",
          details: "My father believed the legal matters had been settled.",
          inverted: true,
        },
      },
    ],
    root: { props: { title: "David's Story" } },
  },

  "/gallery": {
    content: [
      {
        type: "Hero",
        props: {
          title: "Visual Archive",
          subtitle:
            "Documenting the physical history of Great House Farm.",
          align: "center",
        },
      },
      {
        type: "ImageGrid",
        props: {
          title: "Featured Images",
          items: [
            {
              caption: "The Farmhouse c. 1950",
              alt: "Old black and white photo",
              src: "./farm-house.jpg",
            },
            {
              caption: "Mary Williams in the Garden",
              alt: "Woman in garden",
            },
            {
              caption: "The 1988 Demolition",
              alt: "Bulldozers on site",
            },
          ],
        },
      },
    ],
    root: { props: { title: "Gallery" } },
  },

  "/gallery/historical": {
    content: [
      {
        type: "Hero",
        props: {
          title: "Historical Gallery",
          subtitle: "Life at the farm through the centuries.",
          align: "left",
        },
      },
      {
        type: "ImageGrid",
        props: {
          title: "19th & 20th Century",
          items: [
            { caption: "The Great Hall", alt: "Interior shot" },
            { caption: "Harvest 1920", alt: "Workers in field" },
          ],
        },
      },
    ],
    root: { props: { title: "Historical Gallery" } },
  },

  "/gallery/excavations": {
    content: [
      {
        type: "Hero",
        props: {
          title: "Excavations",
          subtitle: "The 1978 and 1994 digs that proved us right.",
          align: "left",
        },
      },
      {
        type: "FeatureBlock",
        props: {
          title: "The 1994 Report",
          summary: "Evidence of over 800 burials.",
          details:
            "Archaeological trust excavations showing a monastic cemetery.",
          inverted: false,
        },
      },
    ],
    root: { props: { title: "Excavations Gallery" } },
  },

  "/gallery/family": {
    content: [
      {
        type: "Hero",
        props: {
          title: "Family Archive",
          subtitle: "The people behind the possession.",
          align: "left",
        },
      },
      {
        type: "FeatureBlock",
        props: {
          title: "The Williams Lineage",
          summary: "Portraits and candid photos.",
          details:
            "Photos of Mary Williams, Frederick Buckler, and the children who grew up within the walls of Ty Mawr.",
          inverted: true,
        },
      },
    ],
    root: { props: { title: "Family Gallery" } },
  },

  "/ghf-2-0": {
    content: [
      {
        type: "Hero",
        props: {
          title: "Gran Casa Farm 2.0",
          subtitle: "Reconstruyendo el patrimonio en Patagonia.",
          align: "center",
        },
      },
      {
        type: "FeatureBlock",
        props: {
          title: "Una Réplica en Patagonia",
          summary: "Proyecto visionario de Sion Buckler.",
          details:
            "Gran Casa Farm 2.0 es una réplica a escala de la casa original, actualmente en desarrollo en Patagonia, Argentina.",
          inverted: false,
        },
      },
      {
        type: "FeatureBlock",
        props: {
          title: "Visitas Guiadas",
          summary: "Experimenta la historia de primera mano.",
          details:
            "Una vez finalizada, Gran Casa Farm 2.0 estará abierto al público. Las visitas guiadas recorrerán toda la historia.",
          inverted: true,
        },
      },
    ],
    root: { props: { title: "Gran Casa Farm II" } },
  },
};

// Minimal ES data (can expand later)
export const DB_ES: Database = {
  "/": {
    content: [],
    root: { props: { title: "Finca Gran Casa" } },
  },
};

// Minimal CY data (can expand later)
export const DB_CY: Database = {
  "/": {
    content: [],
    root: { props: { title: "Hafan" } },
  },
};

// INITIAL DATA defaults to EN
export const INITIAL_DATA = DB_EN;
