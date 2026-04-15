import { Config } from "@measured/puck";
import React from "react";

type Props = {
  Hero: {
    title: string;
    subtitle: string;
    ctaText: string;
    ctaLink: string;
  };
  Heading: {
    text: string;
    level: "h1" | "h2" | "h3";
    align: "left" | "center" | "right";
  };
  Text: {
    content: string;
    size: "sm" | "md" | "lg";
  };
  Section: {
    children: React.ReactNode;
    backgroundColor: string;
  };
  Button: {
    text: string;
    link: string;
    variant: "primary" | "secondary";
  };
  Image: {
    src: string;
    alt: string;
    caption?: string;
  };
};

export const config: Config<Props> = {
  components: {
    Hero: {
      fields: {
        title: { type: "text" },
        subtitle: { type: "textarea" },
        ctaText: { type: "text" },
        ctaLink: { type: "text" },
      },
      defaultProps: {
        title: "Were You Mis-Sold Car Finance?",
        subtitle: "Join thousands reclaiming what they’re owed. Bold, fast, and effective.",
        ctaText: "Check Eligibility",
        ctaLink: "/claim",
      },
      render: ({ title, subtitle, ctaText, ctaLink }) => (
        <section className="bg-slate-900 text-white py-24 px-4 border-b border-slate-800">
          <div className="max-w-7xl mx-auto space-y-8">
            <h1 className="text-6xl md:text-8xl font-display font-black leading-none tracking-tight uppercase">
              {title}
            </h1>
            <p className="text-2xl text-brand-accent font-medium max-w-2xl">
              {subtitle}
            </p>
            <div className="pt-8">
              <a href={ctaLink} className="brutal-btn inline-block">
                {ctaText}
              </a>
            </div>
          </div>
        </section>
      ),
    },
    Heading: {
      fields: {
        text: { type: "text" },
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
            { label: "Center", value: "center" },
            { label: "Right", value: "right" },
          ],
        },
      },
      defaultProps: {
        text: "Section Heading",
        level: "h2",
        align: "left",
      },
      render: ({ text, level, align }) => {
        const Tag = level;
        const alignment = {
          left: "text-left",
          center: "text-center",
          right: "text-right",
        }[align];
        
        const sizes = {
          h1: "text-6xl md:text-8xl",
          h2: "text-4xl md:text-6xl",
          h3: "text-2xl md:text-4xl",
        }[level];

        return <Tag className={`${alignment} ${sizes} font-display mb-8 uppercase tracking-tight`}>{text}</Tag>;
      },
    },
    Text: {
      fields: {
        content: { type: "textarea" },
        size: {
          type: "select",
          options: [
            { label: "Small", value: "sm" },
            { label: "Medium", value: "md" },
            { label: "Large", value: "lg" },
          ],
        },
      },
      defaultProps: {
        content: "Enter your text here...",
        size: "md",
      },
      render: ({ content, size }) => {
        const sizes = {
          sm: "text-sm",
          md: "text-lg",
          lg: "text-2xl",
        }[size];
        return <p className={`${sizes} leading-relaxed mb-6`}>{content}</p>;
      },
    },
    Button: {
      fields: {
        text: { type: "text" },
        link: { type: "text" },
        variant: {
          type: "radio",
          options: [
            { label: "Primary (Green)", value: "primary" },
            { label: "Secondary (Orange)", value: "secondary" },
          ],
        },
      },
      defaultProps: {
        text: "Click Me",
        link: "#",
        variant: "primary",
      },
      render: ({ text, link, variant }) => (
        <a href={link} className={variant === "primary" ? "brutal-btn" : "brutal-btn-secondary"}>
          {text}
        </a>
      ),
    },
    Image: {
      fields: {
        src: { type: "text" },
        alt: { type: "text" },
        caption: { type: "text" },
      },
      defaultProps: {
        src: "https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&q=80&w=800",
        alt: "Happy Family",
      },
      render: ({ src, alt, caption }) => (
        <div className="space-y-4">
          <div className="rounded-3xl overflow-hidden bg-slate-100 border border-slate-200 shadow-lg">
            <img src={src} alt={alt} className="w-full h-auto transition-all duration-500" referrerPolicy="no-referrer" />
          </div>
          {caption && <p className="text-sm font-medium uppercase tracking-widest text-slate-400">{caption}</p>}
        </div>
      ),
    },
    Section: {
      render: ({ children, backgroundColor }) => (
        <section className="py-20 px-4" style={{ backgroundColor }}>
          <div className="max-w-7xl mx-auto">{children}</div>
        </section>
      ),
    },
  },
};
