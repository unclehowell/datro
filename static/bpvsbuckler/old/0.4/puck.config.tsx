import React from "react";
import { Config, DropZone } from "@measured/puck";
import { Scale, AlertTriangle, ArrowRight, BookOpen, Search, ShieldAlert, Clapperboard, Gavel, Newspaper } from "lucide-react";
import { Link } from "react-router-dom";
import { CORE_ALLEGATIONS, LEGAL_CONFLICTS } from "./constants";

export type Props = {
  Hero: { title: string; subtitle: string; imageUrl: string; badge: string };
  Section: { title: string; subtitle: string; background: "white" | "slate" | "dark" };
  RichText: { content: string };
  ConflictResolver: {};
  AllegationsGrid: {};
  EvidenceShowcase: { title: string; summary: string };
  Button: { label: string; href: string; variant: "primary" | "outline" };
  InvestigationBoard: { title: string };
  AnnouncementBanner: { title: string; type: "book" | "legal" };
  PressGrid: { 
    articles: { 
      title: string; 
      source: string; 
      date: string; 
      summary: string;
      imageUrl?: string;
    }[] 
  };
};

export const config: Config<Props> = {
  categories: {
    layout: { components: ["Section"] },
    content: { components: ["Hero", "RichText", "ConflictResolver", "AllegationsGrid", "EvidenceShowcase", "Button", "InvestigationBoard", "AnnouncementBanner", "PressGrid"] },
  },
  components: {
    Hero: {
      fields: {
        title: { type: "text" },
        subtitle: { type: "text" },
        imageUrl: { type: "text" },
        badge: { type: "text" },
      },
      defaultProps: {
        title: "Great House Farm",
        subtitle: "The accurate account of how an 800-year-old historic site was seized and destroyed.",
        badge: "OPEN INVESTIGATION",
        imageUrl: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=2000",
      },
      render: ({ title, subtitle, imageUrl, badge }) => (
        <div className="relative bg-slate-900 text-white min-h-[80vh] flex items-center">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-900/40 z-10"></div>
            <img 
              src={imageUrl} 
              alt="Background" 
              className="w-full h-full object-cover grayscale opacity-40"
            />
          </div>
          <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 w-full pt-20">
            <span className="inline-block px-3 py-1 border border-red-500 text-red-400 text-xs font-bold tracking-widest mb-6">
              {badge}
            </span>
            <h1 className="text-5xl md:text-7xl font-serif font-bold mb-6 tracking-tight leading-none max-w-4xl">
              {title}
            </h1>
            <p className="text-xl md:text-2xl text-slate-300 max-w-2xl font-light leading-relaxed mb-10 border-l-4 border-justice-red pl-6">
              {subtitle}
            </p>
            <div className="flex flex-wrap gap-4">
               <Link to="/timeline" className="bg-justice-red hover:bg-red-800 text-white px-8 py-3 rounded text-sm font-bold uppercase tracking-wider transition-all">
                 View Timeline
               </Link>
               <Link to="/lawsuit" className="border border-slate-500 hover:border-white text-slate-300 hover:text-white px-8 py-3 rounded text-sm font-bold uppercase tracking-wider transition-all">
                 The Lawsuit
               </Link>
            </div>
          </div>
        </div>
      ),
    },
    Section: {
      fields: {
        title: { type: "text" },
        subtitle: { type: "text" },
        background: { 
            type: "select", 
            options: [
                { label: "White", value: "white" },
                { label: "Slate", value: "slate" },
                { label: "Dark", value: "dark" }
            ] 
        }
      },
      defaultProps: {
        title: "Section Title",
        subtitle: "",
        background: "white"
      },
      render: ({ title, subtitle, background }) => {
        const bgClass = {
            white: "bg-white text-slate-900",
            slate: "bg-slate-50 text-slate-800",
            dark: "bg-slate-900 text-white"
        }[background];

        return (
            <section className={`py-16 md:py-24 ${bgClass}`}>
              <div className="max-w-5xl mx-auto px-4 sm:px-6">
                {(title || subtitle) && (
                  <div className="mb-16">
                    {title && <h2 className="text-3xl md:text-5xl font-serif font-bold mb-4">{title}</h2>}
                    <div className="h-1 w-20 bg-justice-red mb-6"></div>
                    {subtitle && <p className="text-lg opacity-80 max-w-3xl leading-relaxed font-serif">{subtitle}</p>}
                  </div>
                )}
                <DropZone zone="content" />
              </div>
            </section>
        );
      },
    },
    AnnouncementBanner: {
      fields: {
        title: { type: "text" },
        type: {
             type: "radio", 
             options: [{ label: "Book/Movie", value: "book" }, { label: "Legal", value: "legal" }] 
        }
      },
      defaultProps: {
        title: "Documentary & Book In Progress",
        type: "book"
      },
      render: ({ title, type }) => (
        <div className={`p-6 rounded-lg mb-8 flex items-center gap-6 border-l-4 ${type === 'legal' ? 'bg-slate-800 text-white border-justice-red' : 'bg-amber-50 text-amber-900 border-amber-500'}`}>
            <div className={`p-3 rounded-full ${type === 'legal' ? 'bg-justice-red' : 'bg-amber-200 text-amber-800'}`}>
                {type === 'legal' ? <Gavel size={24} /> : <Clapperboard size={24} />}
            </div>
            <div>
                <h4 className="font-bold text-xs uppercase tracking-widest opacity-70 mb-1">
                    {type === 'legal' ? 'Legal Update' : 'Media Announcement'}
                </h4>
                <h3 className="text-xl font-bold font-serif">{title}</h3>
            </div>
        </div>
      )
    },
    InvestigationBoard: {
        fields: {
            title: { type: "text" }
        },
        defaultProps: {
            title: "Institutional Failures"
        },
        render: ({ title }) => (
            <div className="bg-slate-100 p-8 rounded-xl border border-slate-200">
                <h3 className="text-2xl font-serif font-bold mb-6 text-slate-900 flex items-center gap-2">
                    <AlertTriangle className="text-justice-red" /> {title}
                </h3>
                <div className="grid md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded shadow-sm">
                        <h4 className="font-bold text-slate-900 mb-2 border-b pb-2">CADW (Heritage)</h4>
                        <p className="text-sm text-slate-600">Failed to list Great House Farm despite its 800-year history and known archaeological potential. A Grade II listing would have prevented immediate demolition.</p>
                    </div>
                    <div className="bg-white p-6 rounded shadow-sm">
                        <h4 className="font-bold text-slate-900 mb-2 border-b pb-2">UK Government</h4>
                        <p className="text-sm text-slate-600">Courts dismissed the "Two Company" fraud as a technicality and failed to protect the family under emerging Human Rights principles.</p>
                    </div>
                    <div className="bg-white p-6 rounded shadow-sm">
                        <h4 className="font-bold text-slate-900 mb-2 border-b pb-2">The Press (1970s)</h4>
                        <p className="text-sm text-slate-600">Contemporary reports were suppressed or nonexistent during the critical 1974 period, despite the judgment later claiming a "press campaign".</p>
                    </div>
                </div>
            </div>
        )
    },
    PressGrid: {
        fields: {
            articles: {
                type: "array",
                getItemSummary: (item) => item.title || "New Article",
                arrayFields: {
                    title: { type: "text" },
                    source: { type: "text" },
                    date: { type: "text" },
                    summary: { type: "textarea" },
                    imageUrl: { type: "text" }
                }
            }
        },
        defaultProps: {
            articles: [
                {
                    title: "Chainsaw Farmer Vows to Fight On",
                    source: "South Wales Echo",
                    date: "Dec 1988",
                    summary: "A farmer who beat-off bailiffs with a chainsaw last night vowed to continue his defiant fight.",
                    imageUrl: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&q=80&w=400"
                }
            ]
        },
        render: ({ articles }) => (
            <div className="grid md:grid-cols-2 gap-8">
                {articles.map((article, i) => (
                    <div key={i} className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                        {article.imageUrl && (
                            <div className="h-48 overflow-hidden bg-slate-100 relative">
                                <img src={article.imageUrl} alt={article.title} className="w-full h-full object-cover" />
                                <div className="absolute top-0 right-0 bg-justice-red text-white text-xs font-bold px-3 py-1">
                                    {article.source}
                                </div>
                            </div>
                        )}
                        <div className="p-6">
                            <span className="text-xs font-bold text-slate-400 uppercase">{article.date}</span>
                            <h3 className="text-xl font-serif font-bold text-slate-900 mt-2 mb-3">{article.title}</h3>
                            <p className="text-slate-600 text-sm leading-relaxed">{article.summary}</p>
                        </div>
                    </div>
                ))}
            </div>
        )
    },
    RichText: {
      fields: {
        content: { type: "textarea" },
      },
      defaultProps: {
        content: "Enter text here...",
      },
      render: ({ content }) => (
        <div className="prose prose-lg max-w-none text-slate-700 font-sans leading-loose mb-8">
          {content.split('\n').map((paragraph, i) => (
             <p key={i} className="mb-4">{paragraph}</p>
          ))}
        </div>
      ),
    },
    ConflictResolver: {
        render: () => (
            <div className="space-y-12 mt-8">
                {LEGAL_CONFLICTS.map((conflict, index) => (
                    <div key={index} className="grid md:grid-cols-12 gap-0 shadow-lg border border-slate-200 rounded-lg overflow-hidden">
                        <div className="md:col-span-4 bg-slate-100 p-8 border-r border-slate-200">
                            <h4 className="text-xs font-bold uppercase text-slate-400 tracking-widest mb-2">The Issue</h4>
                            <h3 className="text-2xl font-serif font-bold text-slate-900 mb-4">{conflict.title}</h3>
                            <div className="space-y-4">
                                <div>
                                    <span className="text-xs font-bold text-red-700 bg-red-100 px-2 py-1 rounded inline-block mb-1">OFFICIAL NARRATIVE</span>
                                    <p className="text-sm text-slate-600 leading-relaxed">{conflict.officialNarrative}</p>
                                </div>
                                <div>
                                    <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2 py-1 rounded inline-block mb-1">FAMILY REALITY</span>
                                    <p className="text-sm text-slate-600 leading-relaxed">{conflict.familyReality}</p>
                                </div>
                            </div>
                        </div>
                        <div className="md:col-span-8 bg-white p-8 flex flex-col justify-center relative">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <Scale size={100} />
                            </div>
                            <h4 className="text-xs font-bold uppercase text-justice-red tracking-widest mb-4 flex items-center gap-2">
                                <Search size={14} /> Deterministic Summary
                            </h4>
                            <p className="text-lg font-serif text-slate-800 leading-relaxed border-l-2 border-justice-red pl-6">
                                {conflict.verdict}
                            </p>
                            <div className="mt-6 flex items-center gap-2 text-sm font-medium text-slate-400">
                                Status: <span className="uppercase text-slate-900">{conflict.status}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )
    },
    AllegationsGrid: {
        render: () => (
            <div className="grid md:grid-cols-2 gap-6 mt-8">
                {CORE_ALLEGATIONS.map((allegation, index) => (
                    <div key={index} className="bg-white p-8 rounded border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
                        <div className="flex items-start gap-4">
                            <div className="bg-red-50 text-justice-red p-3 rounded group-hover:bg-justice-red group-hover:text-white transition-colors">
                                <ShieldAlert size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-slate-900 mb-2">{allegation.title}</h3>
                                <p className="text-slate-600 leading-relaxed">{allegation.description}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )
    },
    EvidenceShowcase: {
        fields: {
            title: { type: "text" },
            summary: { type: "textarea" }
        },
        defaultProps: {
            title: "Archaeological Theft",
            summary: "1994 excavations revealed Celtic burials and treasures."
        },
        render: ({ title, summary }) => (
            <div className="bg-slate-900 text-slate-300 p-8 md:p-12 rounded-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-justice-red opacity-10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center">
                    <div className="flex-1">
                        <h3 className="text-2xl font-serif text-white font-bold mb-4">{title}</h3>
                        <p className="text-lg leading-relaxed mb-6">{summary}</p>
                        <Link to="/press" className="text-white border-b border-justice-red pb-1 hover:text-red-400 transition-colors inline-flex items-center gap-2">
                            View Press Coverage <ArrowRight size={16} />
                        </Link>
                    </div>
                    <div className="flex-1 bg-slate-800 p-6 rounded border border-slate-700">
                         <div className="flex items-center gap-2 text-sm text-slate-400 mb-4 uppercase tracking-widest">
                            <BookOpen size={14} /> Source: Annex D
                         </div>
                         <p className="font-serif italic text-white text-lg">
                            "Beneath dining room floor the remains of soldier in armour, his horse, lance and shield."
                         </p>
                    </div>
                </div>
            </div>
        )
    },
    Button: {
        fields: {
            label: { type: "text" },
            href: { type: "text" },
            variant: { 
                type: "radio", 
                options: [{ label: "Primary", value: "primary" }, { label: "Outline", value: "outline" }] 
            }
        },
        defaultProps: {
            label: "Read More",
            href: "#",
            variant: "primary"
        },
        render: ({ label, href, variant }) => {
            const styles = variant === 'primary' 
                ? "bg-justice-red hover:bg-red-900 text-white border border-transparent" 
                : "border border-slate-300 hover:border-slate-900 text-slate-600 hover:text-slate-900";
            
            return (
                <Link to={href} className={`${styles} px-8 py-3 rounded text-sm font-bold uppercase tracking-wider transition-all inline-block mt-4`}>
                    {label}
                </Link>
            );
        }
    }
  },
};

export default config;