import { Data } from "@measured/puck";

// Props for the Heading Block
export interface HeadingBlockProps {
  title: string;
  level?: "h1" | "h2" | "h3";
  align?: "left" | "center";
  padding?: string;
}

// Props for the Text Block
export interface TextBlockProps {
  content: string;
}

// Props for the Hero Block
export interface HeroProps {
  title: string;
  subtitle?: string;
  backgroundImage?: string;
  height?: string;
  align?: "left" | "center";
}

// Props for the Quote Block
export interface QuoteProps {
  text: string;
  author?: string;
}

// Props for the Feature Block (Bold Headline + Read More)
export interface FeatureBlockProps {
    title: string;
    summary: string;
    details: string; // Markdown supported
    inverted?: boolean;
}

// Props for Image Grid
export interface ImageGridProps {
    title: string;
    items: { src?: string; alt: string; caption: string }[];
}

// Props for Product Grid (Shop)
export interface ProductGridProps {
    title: string;
    items: { 
        name: string; 
        price: string; 
        image?: string; 
        description: string;
        buyLink?: string;
    }[];
}

// Global Page Data Structure extending Puck's default Data
export interface PageData extends Data {
  content: {
    type: string;
    props: { [key: string]: any };
  }[];
  root: {
    props: {
      title?: string;
    };
  };
}

// Defines the structure of the JSON database provided
export interface Database {
  [key: string]: PageData;
}