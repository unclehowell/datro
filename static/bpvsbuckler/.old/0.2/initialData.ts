import { Data } from "@measured/puck";
import { Props } from "./puck.config";

export const initialData: Data<Props> = {
  content: [
    {
      type: "Hero",
      props: {
        title: "The Buckler Family Case",
        subtitle: "\"It's my land. It's not your permission to give.\"",
        description: "A documentation of historical land injustice, the erasure of 400 years of heritage, and a continuing quest for justice.",
        imageUrl: "https://picsum.photos/id/1036/1600/900",
        id: "hero-1"
      }
    },
    {
      type: "Section",
      props: {
        title: "Executive Summary",
        subtitle: "BP Properties Ltd v Buckler (1987)",
        backgroundColor: "bg-parchment",
        id: "section-1"
      }
    },
    {
      type: "Section",
      props: {
        title: "",
        subtitle: "",
        backgroundColor: "bg-stone-200",
        id: "section-2"
      }
    }
  ],
  root: {},
  zones: {
    "section-1:content": [
        {
            type: "RichText",
            props: {
                content: "Great House Farm in Llandough was occupied by the Buckler family (previously Williams) since the 1600s. Despite over 400 years of continuous occupation, the family was physically removed following a 1987 legal case, and the 800-year-old farm was subsequently demolished to make way for corporate development.",
                id: "text-1"
            }
        },
        {
            type: "AllegationsGrid",
            props: { id: "allegations-1" }
        }
    ],
    "section-2:content": [
        {
            type: "MarconiFeature",
            props: {
                title: "The Suppressed History",
                description: "In May 1897, Guglielmo Marconi stayed at Great House Farm. The Buckler family ancestors transported his equipment by horse and cart to Lavernock Point for the first transmission over open sea. Today, this connection is largely erased from official records.",
                id: "marconi-1"
            }
        }
    ]
  }
};