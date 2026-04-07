export interface TimelineEvent {
  year: string;
  title: string;
  description: string;
  category: 'historical' | 'legal' | 'eviction' | 'archaeology';
  verified?: boolean;
}

export interface NewspaperArticle {
  id: string;
  title: string;
  source: string;
  date: string;
  content: string;
  context?: string;
}

export interface LegalConflict {
  title: string;
  officialNarrative: string;
  familyReality: string;
  verdict: string; // The deterministic summary
  status: 'resolved' | 'unresolved' | 'suppressed';
}

export interface CoreAllegation {
  title: string;
  description: string;
  icon?: string;
}