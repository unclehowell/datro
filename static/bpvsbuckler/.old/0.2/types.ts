export interface TimelineEvent {
  year: string;
  title: string;
  description: string;
  category: 'historical' | 'legal' | 'demolition' | 'archaeology' | 'marconi';
}

export interface NewspaperArticle {
  id: string;
  title: string;
  source: string;
  date: string;
  content: string;
  imageAlt?: string;
  highlight?: boolean;
}

export interface LegalArgument {
  title: string;
  summary: string;
  detail: string;
}

export interface CoreAllegation {
  title: string;
  description: string;
}