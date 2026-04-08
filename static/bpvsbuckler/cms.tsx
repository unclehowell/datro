import React from 'react';
import { Config, Data } from '@measured/puck';
import { TIMELINE } from './constants';

// --- Component Types ---

export type Props = {
  HeadingBlock: { title: string; level: 'h1' | 'h2' | 'h3' };
  TextBlock: { content: string };
  ScriptBlock: { title: string }; // Placeholder prop, renders the Timeline
  ClaimBlock: { content: string };
  SplashBlock: { title: string; subtitle?: string; items: { text: string }[] };
};

// --- Configuration ---

export const config: Config<Props> = {
  components: {
    HeadingBlock: {
      fields: {
        title: { type: 'text' },
        level: { 
            type: 'select', 
            options: [
                { label: 'H1', value: 'h1' },
                { label: 'H2', value: 'h2' },
                { label: 'H3', value: 'h3' }
            ] 
        },
      },
      render: ({ title, level }) => {
        const Tag = level || 'h1';
        const styles = {
            h1: 'text-3xl md:text-4xl text-amber-500 font-bold mb-6 text-center font-special uppercase tracking-widest',
            h2: 'text-2xl text-amber-500 font-bold mb-4 font-special',
            h3: 'text-xl text-slate-300 font-bold mb-2',
        };
        return <Tag className={styles[level]}>{title}</Tag>;
      },
    },
    TextBlock: {
      fields: {
        content: { type: 'textarea' },
      },
      render: ({ content }) => (
        <p className="whitespace-pre-wrap leading-relaxed text-slate-300 mb-6 font-[family-name:var(--font-courier)] text-sm md:text-base">
          {content}
        </p>
      ),
    },
    SplashBlock: {
        fields: {
            title: { type: 'text' },
            subtitle: { type: 'text' },
            items: { 
                type: 'array', 
                arrayFields: { text: { type: 'text' } }
            }
        },
        render: ({ title, subtitle, items }) => (
            <div className="flex flex-col items-center text-center">
                 <h1 className="text-2xl md:text-4xl font-special text-amber-500 mb-2 uppercase tracking-widest drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] shrink-0">
                    {title}
                </h1>
                {subtitle && (
                    <h2 className="text-lg md:text-xl font-special text-slate-300 mb-6 tracking-wide border-b border-amber-500/30 pb-2">
                        {subtitle}
                    </h2>
                )}
                <div className="text-left w-full max-w-2xl">
                    <ul className="text-sm md:text-base text-slate-300 leading-relaxed font-light space-y-4 list-none">
                        {items?.map((item, i) => (
                             <li key={i}><span className="text-amber-500">•</span> {item.text}</li>
                        ))}
                    </ul>
                </div>
            </div>
        )
    },
    ClaimBlock: {
        fields: {
            content: { type: 'textarea' }
        },
        render: ({ content }) => (
             <div className="whitespace-pre-wrap text-slate-300 text-base leading-relaxed p-6 bg-slate-900/50 rounded-lg border border-slate-800 shadow-inner font-mono" style={{ fontFamily: "'Courier Prime', monospace" }}>
                 {content}
             </div>
        )
    },
    ScriptBlock: {
        fields: {
            title: { type: 'text' }
        },
        render: ({ title }) => (
            <div className="w-full" style={{ fontFamily: "'Courier Prime', monospace" }}>
                 <div className="text-amber-500 font-bold mb-8 text-center border-b border-slate-800 pb-8">{title}</div>
                 {TIMELINE.map((entry, i) => (
                     <div key={i} className="mb-12">
                         <div className="font-bold text-slate-500 mb-2 border-b border-slate-800 pb-1">SCENE {i+1}: {entry.year} - {entry.location.toUpperCase()}</div>
                         <div className="mb-6 pl-4 border-l-2 border-amber-900/50 italic text-slate-400">
                             <span className="font-bold text-amber-600 not-italic">NARRATOR: </span>
                             {entry.narration}
                         </div>
                         <div className="space-y-4 pl-4">
                             {entry.scenes.map((scene, j) => (
                                 <div key={j} className="group">
                                     <div className="text-amber-500 font-bold mb-1">{scene.character.toUpperCase()}</div>
                                     <div className="pl-4">{scene.text}</div>
                                 </div>
                             ))}
                         </div>
                     </div>
                 ))}
                 <div className="text-center text-slate-600 mt-20 pb-10">--- END OF SCRIPT ---</div>
            </div>
        )
    }
  },
};

// --- Initial Data ---

const CLAIM_TEXT = `Forensic Evaluation and Restitutionary Brief
Ty Mawr (Great House Farm), Llandough
Semantic Version 0.6
This brief is submitted to invite judicial, parliamentary, and public scrutiny of the historical
dispossession of Ty Mawr (Great House Farm), Llandough, and to set out grounds upon
which the matter should be reopened, investigated, and remedied. It does not seek to
pre-empt findings of fact, but to identify material anomalies, procedural omissions, and
unresolved questions which, taken together, render the historic outcome unsafe.
Ty Mawr was occupied continuously by the Williams family from 1667 following
post-medieval settlement under former Herbert overlordship. Occupation was open,
exclusive, and continuous for more than three centuries. In the early twentieth century,
Mary Williams, the last Williams heir, married Frederick Buckler. The family remained in
occupation, and Mary Williams retained her maiden name, consistent with local custom
and with the family’s understanding that the Williams lineage embodied the historic basis of
title and possession.
In 1870, the Williams family reported the discovery of a Roman soldier beneath the
farmhouse. This demonstrated that the site was of archaeological significance. The record
is silent as to whether this fact was ever formally assessed or disclosed during later
proceedings, despite its relevance to ownership, statutory protection, and development.
In 1974, Mary Williams initiated proceedings to assert ownership and possession of Ty
Mawr. These proceedings were adjourned and later effectively quashed without any
determination of ownership. Ownership was the only issue capable of conclusively
resolving possession, succession, and heritage status. The avoidance of that
determination requires explanation.
During subsequent proceedings, BP asserted title but did not obtain a judicial
determination of ownership. Instead, a licence arrangement was relied upon, issued
retrospectively and attached to a substituted legal description referring to “Mrs Buckler”
rather than Mary Williams. The factual and legal basis for this substitution was never
tested.
In BP Properties Ltd v Buckler (1987), possession was determined without adjudicating
ownership. Following this, the 800-year-old farmhouse was demolished. Only after
demolition was the site excavated and recorded as the largest burial ground uncovered in
Wales. The sequence of events raises serious questions as to whether material facts were
excluded from consideration.
Appeals were dismissed, access to supranational remedies was obstructed, and no public
inquiry has examined the combined effect of procedural avoidance, substituted identity,
heritage omission, and irreversible consequence.
The principle affirmed in Takhar v Gracefield Developments Ltd recognises that fraud, if
established, unravels all. This brief does not assert findings of fraud, but identifies prima
facie grounds requiring investigation.
The relief sought prioritises declaratory and narrative justice: determination of ownership,
correction of the historic record, and recognition of the Williams–Buckler family as
successors in title and possession. Only thereafter can compensation, preliminarily
quantified at approximately £101.2 million, be properly assessed.
If ownership was never adjudicated, and ownership was essential to lawfully determine
possession, development, and heritage status, the basis upon which Ty Mawr was
extinguished must now be examined.`;

export const initialData: {
    splash: Data;
    claim: Data;
    script: Data;
} = {
    splash: {
        content: [
            {
                type: 'SplashBlock',
                props: {
                    title: "Great House Farm Story",
                    subtitle: "The 2026: £100 Million Reparation Case, Wales",
                    items: [
                         { text: "1667: Family ‘Buys’ Farm, Estate Secretly Logs Them as Tenants" },
                         { text: "1840s–80s: Ancient Manor Rebranded ‘Farm’ to Erase Family’s Status" },
                         { text: "1870: Roman Soldier Found Under Floor, Authorities Bury the Evidence" },
                         { text: "1895–1905: Quarry Cashes In, Promised Deeds to Williams Vanish Without Trace" },
                         { text: "1938: Family Home Sold Over Their Heads in Paper‑Only Auction" },
                         { text: "1955: Disabled Mother Left Clinging to House as Court Strips Her Land" },
                         { text: "1959–65: Widow’s Ancestral Title Laughed Off, She’s Recast as Squatter" },
                         { text: "1974: BP Fakes ‘Mrs Buckler’ Licence to Kill Williams’ Land Rights" },
                         { text: "1987–88: Court Endorses Paper Trick; BP Smashes 800‑Year Home, Son Silenced" },
                         { text: "1994–2026: Wales’ Largest Cemetery Built Over; No Inquiry" },
                         { text: "Feb 2026 reparations stands at £101.2M and counting 🏴 Yma o Hyd" }
                    ]
                }
            }
        ],
        root: { props: { title: 'Splash Page' } }
    },
    claim: {
        content: [
             {
                 type: 'ClaimBlock',
                 props: { content: CLAIM_TEXT }
             }
        ],
        root: { props: { title: 'Reparations' } }
    },
    script: {
        content: [
            {
                type: 'HeadingBlock',
                props: { title: "GREAT HOUSE FARM: A CHRONICLE OF DISPOSSESSION", level: "h1" }
            },
            {
                type: 'ScriptBlock',
                props: { title: "THE SCRIPT" }
            }
        ],
        root: { props: { title: 'Script Page' } }
    }
};