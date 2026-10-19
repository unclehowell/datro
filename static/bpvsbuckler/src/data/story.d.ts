export interface Evidence { type: string; title: string; url: string; image?: string }
export interface Act { id: string; label: string; title: string; span: string; logline: string }
export interface CastMember { id: string; name: string; years: string; role: string; match: string[] }
export type Grade = 'documented' | 'single-source' | 'testimony-only' | 'contested' | 'argument';
export type QStatus = 'documented' | 'corroborated' | 'testimony-only' | 'contested' | 'open' | 'not-held';
export interface SceneQuestion { id: string; question: string; status: QStatus; answer: string; next: string[] }
export interface SceneQA {
  id: string; party_name: string; asked: string; answered: string; kind: string; pairing: string;
  url: string; ref: string; question: string; answer: string;
}
export interface CaseQuestion {
  id: string; question: string; status: QStatus; answer: string; for: string[]; against: string[];
  next: string[]; scenes: string[]; qa_count: number;
}
export interface Scene {
  id: string; act: string; no: number; ref: string; date: string; when: string; title: string; place: string;
  parcel: string; basis: string; narration: string; case: string | null; evidence: Evidence[];
  image: string | null; aliases: string[]; cast: string[];
  ledger: [string, string][]; moved: string[]; received: string | null; received_words: [string, string][]; known: string | null;
  grade: Grade; grade_text: string; questions: SceneQuestion[]; qa: SceneQA[];
}
export interface Story {
  title: string; acts: Act[]; cast: CastMember[]; lanes: Record<string, string>; aliases: Record<string, string>; scenes: Scene[];
  case_questions: CaseQuestion[];
  graph: { messages: number; parties: number; scenes: number; case_questions: number; documents: number; qa: number; answered: number };
}
