import type { TimelineEntry } from './types'

// Generated migration timeline from data_corrected.json (partial)
// Note: This module provides the TIMELINE constant that the app consumes.
// The full dataset can be migrated in a subsequent pass by expanding this file
// or by enhancing the transformer to emit the entire timeline.

export const TIMELINE: TimelineEntry[] = [
  {
    year: "1100",
    location: "Llandough, Glamorgan",
    locationType: "farm" as const,
    description: "Norman Conquest",
    narration:
      "Robert Fitzhamon grants the lordship of Llandough to the Walsche family, establishing feudal control of the area that includes the future Great House Farm.",
    scenes: [
      {
        character: "ROBERT FITZHAMON",
        icon: "noble",
        side: "right" as const,
        color: "#c0392b",
        text: "I grant Walsche the Llandough lordship to manage, tax and defend.",
        position: { x: 0, y: 0 }
      },
      {
        character: "LORD WALSCHE",
        icon: "noble",
        side: "left" as const,
        color: "#8e44ad",
        text: "We now hold Llandough and its revenues under Fitzhamon's grant.",
        position: { x: 0, y: 0 }
      }
    ],
    sources: []
  },
  {
    year: "1215",
    location: "Llandough Church",
    locationType: "other" as const,
    description: "Great House Built",
    narration:
      "A substantial stone residence, Tŷ Mawr ('Great House'), is constructed beside St Dochdwy's church at Llandough as a manorial house, later known as Great House Farm.",
    scenes: [
      {
        character: "MASTER MASON",
        icon: "builder",
        side: "right" as const,
        color: "#e67e22",
        text: "We're building a new stone manorial house beside St Dochdwy's.",
        position: { x: 0, y: 0 }
      },
      {
        character: "LOCAL FARMER",
        icon: "farmer",
        side: "left" as const,
        color: "#27ae60",
        text: "Local lord's new stone house next to the parish church. Right ho!",
        position: { x: 0, y: 0 }
      }
    ],
    sources: []
  }
]
