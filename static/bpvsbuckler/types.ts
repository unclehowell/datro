export interface Position {
  x: number;
  y: number;
}

export type IconType = 'farmer' | 'noble' | 'judge' | 'guard' | 'builder' | 'ghost' | 'lawyer' | 'worker' | 'ruins' | 'narrator' | 'cleric' | 'news';

export type SourceType = 'court' | 'deed' | 'news' | 'report' | 'archive';

export type LocationCategory = 'farm' | 'court' | 'other' | 'ruins' | 'archive' | 'news';

export interface Source {
  type: SourceType;
  label: string;
  url: string;
}

export interface CharacterScene {
  character: string;
  icon: IconType;
  side: 'left' | 'right' | 'center';
  color: string;
  text: string; // Brief speech bubble text
  position: Position;
}

export interface Attachments {
  gallery?: string[]; // Array of filenames in attachments/gallery/{year}/
  legal?: string[];   // Array of filenames in attachments/legal/{year}/
  news?: string[];    // Array of filenames in attachments/news/{year}/
  notes?: string[];   // Array of filenames in attachments/notes/{year}/
  report?: string[];  // Array of filenames in attachments/report/{year}/
}

export interface TimelineEntry {
  year: string;
  location: string;
  locationType: LocationCategory;
  description: string; // Background text
  narration: string; // The text spoken by the narrator
  scenes: CharacterScene[];
  sources: Source[];
  attachments?: Attachments;
}