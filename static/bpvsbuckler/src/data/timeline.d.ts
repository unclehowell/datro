export interface Character {
  character: string;
  icon: string;
  side: 'left' | 'right';
  color: string;
  text: string;
  position: { x: number; y: number };
}

export interface Attachments {
  gallery: any[];
  legal: any[];
  news: any[];
  notes: any[];
  report: any[];
}

export interface Scene {
  /** Stable identifier, e.g. ghf-19881206-1. Used for deep links (?event=). */
  id: string;
  /** ISO 8601 sort date (YYYY-MM-DD); 9999-… for present-day summaries. */
  date: string;
  year: string;
  location: string;
  locationType: string;
  description: string;
  narration: string;
  scenes: Character[];
  sources: any[];
  attachments: Attachments;
  challenge?: string;
}
