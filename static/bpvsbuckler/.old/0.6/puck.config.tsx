import React, { useState } from 'react';
import type { Config } from "@measured/puck";
import { HeadingBlockProps, TextBlockProps, HeroProps, QuoteProps, FeatureBlockProps, ImageGridProps, ProductGridProps } from './types';
import { generatePuckContent } from './services/geminiService';

// Grenfell Green: #009A49

// Helper component for the FeatureBlock to handle state
const FeatureBlockRender = ({ title, summary, details, inverted }: FeatureBlockProps) => {
    const [expanded, setExpanded] = useState(false);
    
    const bgColor = inverted ? 'bg-white' : 'bg-stone-900';
    const textColor = inverted ? 'text-stone-900' : 'text-white';
    const titleColor = inverted ? 'text-[#009A49]' : 'text-[#009A49]';
    const summaryColor = inverted ? 'text-stone-600' : 'text-stone-300';
    const detailsBg = inverted ? 'bg-stone-50' : 'bg-stone-800';
    const detailsText = inverted ? 'text-stone-800' : 'text-stone-200';

    return (
        <section className={`py-12 px-6 sm:px-12 border-b border-stone-800 ${bgColor} transition-colors duration-500`}>
            <div className="max-w-6xl mx-auto">
                <h2 className={`text-4xl sm:text-6xl font-black mb-6 tracking-tighter uppercase leading-none ${titleColor}`}>
                    {title}
                </h2>
                <p className={`text-xl sm:text-3xl font-bold mb-8 leading-tight max-w-4xl ${textColor}`}>
                    {summary}
                </p>
                
                {!expanded ? (
                    <button 
                        onClick={() => setExpanded(true)}
                        className="group flex items-center gap-3 text-lg font-bold uppercase tracking-widest text-[#009A49] hover:text-[#00C960] transition-colors"
                    >
                        <span>Read More</span>
                        <div className="bg-[#009A49] h-0.5 w-12 group-hover:w-20 transition-all duration-300"></div>
                    </button>
                ) : (
                     <div className={`mt-8 p-8 rounded-none border-l-4 border-[#009A49] animate-fade-in ${detailsBg}`}>
                        <div className={`prose prose-xl max-w-none ${detailsText} prose-headings:font-bold prose-headings:text-[#009A49] prose-p:leading-relaxed`}>
                             {/* Simple markdown-like rendering for line breaks */}
                             {details.split('\n').map((line, i) => (
                                 <p key={i} className="mb-4">{line}</p>
                             ))}
                        </div>
                        <button 
                            onClick={() => setExpanded(false)}
                            className="mt-8 text-sm font-bold uppercase tracking-widest text-[#009A49] hover:underline"
                        >
                            Close Details
                        </button>
                    </div>
                )}
            </div>
        </section>
    );
};

export const config: Config<{
  Hero: HeroProps;
  HeadingBlock: HeadingBlockProps;
  TextBlock: TextBlockProps;
  Quote: QuoteProps;
  FeatureBlock: FeatureBlockProps;
  ImageGrid: ImageGridProps;
  ProductGrid: ProductGridProps;
}> = {
  components: {
    Hero: {
      fields: {
        title: { type: "text" },
        subtitle: { type: "textarea" },
        backgroundImage: { type: "text" },
        align: {
          type: "radio",
          options: [
            { label: "Left", value: "left" },
            { label: "Center", value: "center" },
          ],
        },
      },
      defaultProps: {
        title: "Justice for Great House Farm",
        subtitle: "Uncovering the truth behind the history.",
        align: "left",
      },
      render: ({ title, subtitle, backgroundImage, align }) => (
        <section 
            className={`relative bg-black text-white py-32 px-6 sm:px-12 border-b-8 border-[#009A49] ${align === 'center' ? 'text-center' : 'text-left'}`}
            style={backgroundImage ? { 
                backgroundImage: `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url(${backgroundImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
            } : {}}
        >
           <div className="max-w-7xl mx-auto">
              <h1 className="text-6xl sm:text-8xl font-black tracking-tighter mb-8 leading-none uppercase drop-shadow-lg">
                {title}
              </h1>
              {subtitle && (
                <p className="text-2xl sm:text-4xl text-[#009A49] font-bold max-w-5xl leading-tight drop-shadow-md">
                  {subtitle}
                </p>
              )}
           </div>
        </section>
      ),
    },
    FeatureBlock: {
        fields: {
            title: { type: "text" },
            summary: { type: "textarea" },
            details: { type: "textarea" },
            inverted: { type: "radio", options: [{ label: "No (Dark)", value: false }, { label: "Yes (Light)", value: true }] }
        },
        defaultProps: {
            title: "Headline",
            summary: "A short, punchy summary of the section.",
            details: "Full details go here...",
            inverted: false
        },
        render: (props) => <FeatureBlockRender {...props} />
    },
    ImageGrid: {
        fields: {
            title: { type: "text" },
            items: { 
                type: "array",
                getItemSummary: (item) => item.caption || "Image",
                arrayFields: {
                    src: { type: "text" },
                    caption: { type: "text" },
                    alt: { type: "text" }
                }
            }
        },
        defaultProps: {
            title: "Gallery",
            items: [
                { caption: "Great House Farm c. 1900", alt: "Historic photo", src: "./farm-house.jpg" },
                { caption: "The Excavation Site 1994", alt: "Dig site" },
                { caption: "Family Portrait", alt: "The Williams Family" }
            ]
        },
        render: ({ title, items }) => (
            <div className="py-12 px-6 bg-stone-900 border-b border-stone-800">
                <div className="max-w-6xl mx-auto">
                    <h3 className="text-3xl font-black text-white mb-8 uppercase tracking-tight">{title}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {items.map((item, i) => (
                            <div key={i} className="group relative aspect-video bg-stone-800 border border-stone-700 hover:border-[#009A49] transition-all cursor-pointer overflow-hidden">
                                {item.src ? (
                                    <img src={item.src} alt={item.alt} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" />
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center opacity-20 group-hover:opacity-10 transition-opacity">
                                        <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                    </div>
                                )}
                                <div className="absolute inset-0 flex flex-col justify-end p-4 bg-gradient-to-t from-black via-transparent to-transparent">
                                    <span className="text-white font-bold uppercase tracking-wider text-sm">{item.caption}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )
    },
    ProductGrid: {
        fields: {
            title: { type: "text" },
            items: {
                type: "array",
                getItemSummary: (item) => item.name || "Product",
                arrayFields: {
                    name: { type: "text" },
                    price: { type: "text" },
                    description: { type: "textarea" },
                    image: { type: "text" },
                    buyLink: { type: "text" }
                }
            }
        },
        defaultProps: {
            title: "Merchandise",
            items: [
                { name: "Support Mug", price: "£12.00", description: "Start your day with justice.", image: "" },
                { name: "Campaign T-Shirt", price: "£25.00", description: "Wear the cause.", image: "" }
            ]
        },
        render: ({ title, items }) => (
            <div className="py-16 px-6 bg-stone-100">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-4xl font-black text-stone-900 mb-12 uppercase tracking-tight text-center">{title}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {items.map((item, i) => (
                            <div key={i} className="flex flex-col bg-white border-2 border-stone-200 hover:border-[#009A49] transition-all shadow-lg">
                                <div className="aspect-square bg-stone-200 flex items-center justify-center overflow-hidden">
                                     {item.image ? (
                                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                     ) : (
                                        <span className="text-stone-400 font-bold text-4xl">PRODUCT</span>
                                     )}
                                </div>
                                <div className="p-6 flex flex-col flex-grow">
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className="text-xl font-black uppercase text-stone-900 leading-tight">{item.name}</h3>
                                        <span className="text-[#009A49] font-bold text-xl">{item.price}</span>
                                    </div>
                                    <p className="text-stone-600 mb-6 flex-grow">{item.description}</p>
                                    <a href={item.buyLink || "#"} className="block w-full text-center py-3 bg-stone-900 text-white font-bold uppercase tracking-widest hover:bg-[#009A49] transition-colors">
                                        Buy Now
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )
    },
    HeadingBlock: {
      fields: {
        title: { type: "text" },
        level: {
          type: "select",
          options: [
            { label: "H1", value: "h1" },
            { label: "H2", value: "h2" },
            { label: "H3", value: "h3" },
          ],
        },
        align: {
            type: "radio",
            options: [
                { label: "Left", value: "left" },
                { label: "Center", value: "center" }
            ]
        }
      },
      defaultProps: {
        title: "New Heading",
        level: "h2",
        align: "left"
      },
      render: ({ title, level, align }) => {
        const Tag = level || "h2";
        // Massive typography overrides
        return (
          <div className={`py-12 px-6 bg-stone-900 text-white ${align === "center" ? "text-center" : "text-left"}`}>
             <div className="max-w-6xl mx-auto">
                <Tag className="text-4xl sm:text-5xl font-black uppercase tracking-tight text-[#009A49]">
                {title}
                </Tag>
            </div>
          </div>
        );
      },
    },
    TextBlock: {
      fields: {
        content: { type: "textarea" },
      },
      defaultProps: {
        content: "Write your content here...",
      },
      render: ({ content }) => (
        <div className="py-12 px-6 bg-stone-900 text-stone-300">
           <div className="max-w-6xl mx-auto">
              <div className="prose prose-xl prose-invert max-w-none leading-relaxed font-medium">
                {content}
              </div>
          </div>
        </div>
      ),
    },
    Quote: {
        fields: {
            text: { type: "textarea" },
            author: { type: "text" }
        },
        defaultProps: {
            text: "Truth is not just a concept, it's a necessity.",
            author: "Anonymous"
        },
        render: ({ text, author }) => (
            <div className="py-24 bg-[#009A49] text-white">
                <div className="max-w-5xl mx-auto px-6 text-center">
                    <blockquote className="text-3xl sm:text-5xl font-black leading-tight mb-8 uppercase tracking-tight">
                        "{text}"
                    </blockquote>
                    {author && <cite className="text-xl font-bold not-italic tracking-widest border-b-2 border-white pb-1">{author}</cite>}
                </div>
            </div>
        )
    }
  },
  
  root: {
    render: ({ children }) => (
        <div className="puck-root min-h-screen bg-stone-900">
             {children}
        </div>
    )
  },

  ai: {
    resolve: async ({ query, data }) => {
       const newData = await generatePuckContent(query, data);
       return newData;
    }
  }
};