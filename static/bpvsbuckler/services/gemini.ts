
// This service now uses the native Web Speech API (SpeechSynthesis)
// It replaces the previous Gemini API implementation to avoid quotas and keys.

export interface VoiceConfig {
  volume: number;
  pitch: number;
  rate: number;
  gender?: 'male' | 'female';
  onBoundary?: (event: SpeechSynthesisEvent) => void;
}

export async function speakText(text: string, config: VoiceConfig): Promise<() => void> {
  // Guard against server-side rendering or unsupported browsers
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    console.warn("Speech Synthesis not supported in this environment");
    return () => {};
  }

  const synth = window.speechSynthesis;

  // If no text, just return empty cancel
  if (!text) return () => {};

  // Helper to ensure voices are loaded (Chrome loads them asynchronously)
  const getVoices = (): Promise<SpeechSynthesisVoice[]> => {
    return new Promise((resolve) => {
      let voices = synth.getVoices();
      if (voices.length > 0) {
        resolve(voices);
      } else {
        const onVoicesChanged = () => {
          voices = synth.getVoices();
          resolve(voices);
          synth.removeEventListener('voiceschanged', onVoicesChanged);
        };
        
        synth.addEventListener('voiceschanged', onVoicesChanged);
        setTimeout(() => { resolve(synth.getVoices()); }, 1000);
      }
    });
  };

  try {
    const voices = await getVoices();
    const utterance = new SpeechSynthesisUtterance(text);

    // Voice Selection Logic
    let selectedVoice: SpeechSynthesisVoice | undefined;
    const englishVoices = voices.filter(v => v.lang.startsWith('en'));
    const pool = englishVoices.length > 0 ? englishVoices : voices;

    if (config.gender === 'female') {
      selectedVoice = 
        pool.find(v => v.name.includes("Female") || v.name.includes("Samantha") || v.name.includes("Victoria") || v.name.includes("Google US English")) ||
        pool.find(v => v.name.includes("Zira"));
    } else {
      // Default / Male preference
      selectedVoice = 
        pool.find(v => v.name.includes("Google UK English Male") || v.name.includes("Daniel") || v.name.includes("Microsoft David")) ||
        pool.find(v => !v.name.includes("Female") && !v.name.includes("Samantha"));
    }

    if (!selectedVoice) selectedVoice = pool[0];
    if (selectedVoice) utterance.voice = selectedVoice;

    // Apply Config
    utterance.rate = config.rate;
    utterance.pitch = config.pitch;
    utterance.volume = config.volume;

    // Attach Boundary Listener (for highlighting)
    if (config.onBoundary) {
      utterance.onboundary = config.onBoundary;
    }

    // Speak
    synth.speak(utterance);

    // Return a promise that resolves when THIS utterance finishes
    return new Promise((resolve) => {
      utterance.onend = () => {
        resolve(() => synth.cancel());
      };
      utterance.onerror = () => {
        resolve(() => synth.cancel());
      };
    });

  } catch (e) {
    console.error("Speech Synthesis failed:", e);
    return () => synth.cancel();
  }
}

// Helper to cancel all speech immediately
export function stopSpeech() {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

// Helper to pause speech
export function pauseSpeech() {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.pause();
  }
}

// Helper to resume speech
export function resumeSpeech() {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.resume();
  }
}
