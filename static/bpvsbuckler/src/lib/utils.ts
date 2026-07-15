export function getCharacterIcon(icon: string): string {
  const icons: Record<string, string> = {
    'narrator': '\uD83C\uDFDB\uFE0F',
    'farmer': '\uD83E\uDDD1\u200D\uD83C\uDF3E',
    'worker': '\u26CF\uFE0F',
    'cleric': '\uD83D\uDC69\u200D\u2696\uFE0F',
    'lord': '\uD83D\uDC51',
    'lawyer': '\uD83D\uDC68\u200D\u2696\uFE0F',
    'soldier': '\uD83D\uDC82',
    'miner': '\u26CF\uFE0F',
    'judge': '\u2696\uFE0F',
    'police': '\uD83D\uDC6E',
    'journalist': '\uD83D\uDCF0',
    'doctor': '\uD83E\uDE7A',
    'mayor': '\uD83C\uDFDB\uFE0F',
    'bp': '\uD83D\uDEE2\uFE0F',
    'protester': '\u270B',
    'historian': '\uD83D\uDCD6',
    'surveyor': '\uD83D\uDCFF',
    'auctioneer': '\uD83C\uDFDB\uFE0F',
    'secretary': '\uD83D\uDCDD',
    'coal': '\u2B1B',
    'estate': '\uD83C\uDFE1',
    'farm': '\uD83C\uDF3E',
    'church': '\u26EA',
    'other': '\uD83D\uDCCB'
  };
  return icons[icon] || icons['other'];
}

export function isWelsh(name: string): boolean {
  const welsh = ['Williams', 'Buckler', 'Morgan', 'Evans', 'Davies', 'Jones', 'Thomas', 'Rees', 'Roberts', 'Price', 'Lloyd', 'Powell', 'Jenkins', 'Owen', 'Hughes', 'Edwards', 'Lewis', 'Morris', 'Carter', 'Howell'];
  return welsh.some(w => name.includes(w));
}

export function getVoiceParams(name: string, isNarrator: boolean): { pitch: number; rate: number } {
  if (isNarrator) return { pitch: 0.8, rate: 0.9 };
  if (isWelsh(name)) return { pitch: 1.1, rate: 1.0 };
  if (name.includes('BP') || name.includes('Judge') || name.includes('Court')) return { pitch: 0.7, rate: 0.85 };
  return { pitch: 1.0, rate: 1.0 };
}

export function playClickSound(type: 'click' | 'beep'): void {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.value = 0.1;
    osc.frequency.value = type === 'click' ? 800 : 400;
    osc.type = 'sine';
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    osc.stop(ctx.currentTime + 0.1);
  } catch (_e) { /* audio not available */ }
}

export function formatNarration(text: string, year: string): string {
  return text.replace(/\{year\}/g, year);
}

export function getWordCountUpTo(text: string, charIndex: number): number {
  return text.substring(0, charIndex).split(/\s+/).filter(Boolean).length;
}

export function getCharIndexAtWord(text: string, wordIdx: number): number {
  const words = text.split(/\s+/);
  let pos = 0;
  for (let i = 0; i < Math.min(wordIdx, words.length); i++) {
    pos += words[i].length + 1;
  }
  return pos;
}
