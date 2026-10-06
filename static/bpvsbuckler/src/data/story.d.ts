export interface Evidence { type: string; title: string; url: string; image?: string }
export interface Act { id: string; label: string; title: string; span: string; logline: string }
export interface CastMember { id: string; name: string; years: string; role: string; match: string[] }
export interface Scene {
  id: string; act: string; no: number; ref: string; date: string; when: string; title: string; place: string;
  parcel: string; basis: string; narration: string; case: string | null; evidence: Evidence[];
  image: string | null; aliases: string[]; cast: string[];
  ledger: [string, string][]; moved: string[]; received: string | null; received_words: [string, string][]; known: string | null;
}
export interface Story { title: string; acts: Act[]; cast: CastMember[]; lanes: Record<string, string>; aliases: Record<string, string>; scenes: Scene[] }
