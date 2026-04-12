import React from "react";
import { Config, DropZone } from "@measured/puck";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { CORE_ALLEGATIONS } from "./constants";

export type Props = {
  Hero: { title: string; subtitle: string; imageUrl: string; description: string };
  Section: { title: string; subtitle: string; backgroundColor: string };
  RichText: { content: string };
  AllegationsGrid: {};
  MarconiFeature: { title: string; description: string };
  Button: { label: string; href: string; variant: "primary" | "secondary" };
  ButtonGroup: {};
};

export const config: Config<Props> = {
  categories: {
    layout: { components: ["Section", "ButtonGroup"] },
    content: { components: ["Hero", "RichText", "MarconiFeature", "AllegationsGrid", "Button"] },
  },
  components: {
    Hero: {
      fields: {
        title: { type: "text" },
        subtitle: { type: "text" },
        description: { type: "textarea" },
        imageUrl: { type: "text" },
      },
      defaultProps: {
        title: "The Buckler Family Case",
        subtitle: "\"It's my land. It's not your permission to give.\"",
        description: "A documentation of historical land injustice, the erasure of 400 years of heritage, and a continuing quest for justice.",
        imageUrl: "https://picsum.photos/id/1036/1600/900",
      },
      render: ({ title, subtitle, imageUrl, description }) => (
        <div className="relative bg-ink text-parchment py-24 md:py-32">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute inset-0 bg-black/60 z-10"></div>
            <img 
              src={imageUrl} 
              alt="Historical landscape" 
              className="w-full h-full object-cover grayscale opacity-50"
            />
          </div>
          <div className="relative z-20 max-w-4xl mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-6xl font-serif font-bold mb-6 tracking-tight">
              {title}
            </h1>
            <p className="text-xl md:text-2xl font-light italic mb-8 text-stone-300">
              {subtitle}
            </p>
            <p className="text-lg mb-10 max-w-2xl mx-auto text-stone-400">
              {description}
            </p>
            <div className="flex justify-center gap-4">
               {/* Buttons are handled by DropZone or fixed in Hero if we want simple */}
               <Link to="/timeline" className="bg-justice-red hover:bg-red-800 text-white px-8 py-3 rounded-sm font-medium transition-colors">
                 Explore Timeline
               </Link>
               <Link to="/legal" className="border border-stone-500 hover:bg-stone-800 text-stone-300 px-8 py-3 rounded-sm font-medium transition-colors">
                 Legal Brief
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
        backgroundColor: { 
            type: "select", 
            options: [
                { label: "Parchment", value: "bg-parchment" },
                { label: "Dark Parchment", value: "bg-stone-200" },
                { label: "White", value: "bg-white" }
            ] 
        }
      },
      defaultProps: {
        title: "Section Title",
        subtitle: "",
        backgroundColor: "bg-parchment"
      },
      render: ({ title, subtitle, backgroundColor }) => (
        <section className={`py-12 md:py-20 ${backgroundColor}`}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            {(title || subtitle) && (
              <div className="mb-12 text-center">
                {title && <h2 className="text-3xl md:text-4xl font-serif font-bold text-justice-red mb-4">{title}</h2>}
                {subtitle && <p className="text-lg text-stone-600 italic max-w-2xl mx-auto">{subtitle}</p>}
                <div className="w-24 h-1 bg-justice-red mx-auto mt-6"></div>
              </div>
            )}
            <DropZone zone="content" />
          </div>
        </section>
      ),
    },
    RichText: {
      fields: {
        content: { type: "textarea" },
      },
      defaultProps: {
        content: "Enter text here...",
      },
      render: ({ content }) => (
        <div className="text-lg leading-relaxed text-stone-800 mb-6 whitespace-pre-wrap">
          {content}
        </div>
      ),
    },
    AllegationsGrid: {
        render: () => (
            <div className="grid md:grid-cols-2 gap-8 mt-8">
                {CORE_ALLEGATIONS.map((allegation, index) => (
                    <div key={index} className="bg-parchment-dark p-6 rounded-sm border border-stone-300">
                    <h3 className="font-serif font-bold text-xl mb-3 text-justice-red flex items-center gap-2">
                        <AlertTriangle size={20} />
                        {allegation.title}
                    </h3>
                    <p className="text-stone-700">{allegation.description}</p>
                    </div>
                ))}
            </div>
        )
    },
    MarconiFeature: {
        fields: {
            title: { type: "text" },
            description: { type: "textarea" }
        },
        defaultProps: {
            title: "The Suppressed History",
            description: "In May 1897, Guglielmo Marconi stayed at Great House Farm..."
        },
        render: ({ title, description }) => (
            <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="md:w-1/2">
               <div className="aspect-square bg-stone-800 relative overflow-hidden rounded-sm shadow-xl p-4">
                  <div className="h-full w-full border-2 border-stone-600 flex items-center justify-center">
                      <span className="text-stone-500 font-serif text-center italic p-4">
                          "Archive photo of radio equipment transport"
                          <br/>
                          (Placeholder)
                      </span>
                  </div>
               </div>
            </div>
            <div className="md:w-1/2">
              <h2 className="text-3xl font-serif font-bold mb-6 text-ink">{title}</h2>
              <p className="text-lg mb-6 leading-relaxed">
                {description}
              </p>
              <Link to="/timeline" className="inline-flex items-center text-justice-red font-bold hover:underline">
                Read the full history <ArrowRight size={16} className="ml-2"/>
              </Link>
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
                options: [{ label: "Primary", value: "primary" }, { label: "Secondary", value: "secondary" }] 
            }
        },
        defaultProps: {
            label: "Click me",
            href: "#",
            variant: "primary"
        },
        render: ({ label, href, variant }) => {
            const styles = variant === 'primary' 
                ? "bg-justice-red hover:bg-red-800 text-white" 
                : "border border-stone-500 hover:bg-stone-800 text-stone-500 hover:text-stone-300";
            
            return (
                <Link to={href} className={`${styles} px-8 py-3 rounded-sm font-medium transition-colors inline-block`}>
                    {label}
                </Link>
            );
        }
    },
    ButtonGroup: {
        render: () => (
            <div className="flex flex-wrap gap-4 mt-6">
                <DropZone zone="buttons" />
            </div>
        )
    }
  },
};

export default config;