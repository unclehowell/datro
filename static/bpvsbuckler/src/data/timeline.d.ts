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
