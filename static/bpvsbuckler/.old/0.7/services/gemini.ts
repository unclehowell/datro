
// This service now uses the native Web Speech API (SpeechSynthesis)
// It replaces the previous Gemini API implementation to avoid quotas and keys.

export async function speakText(text: string, character: string): Promise<() => void> {
  // Guard against server-side rendering or unsupported browsers
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    console.warn("Speech Synthesis not supported in this environment");
    return () => {};
  }

  const synth = window.speechSynthesis;

  // Cancel any currently playing audio immediately to prevent overlap
  synth.cancel();

  // If no text, just return empty cancel
  if (!text) return () => {};

  // Helper to ensure voices are loaded (Chrome loads them asynchronously)
  const getVoices = (): Promise<SpeechSynthesisVoice[]> => {
    return new Promise((resolve) => {
      let voices = synth.getVoices();
      if (voices.length > 0) {
        resolve(voices);
      } else {
        // Wait for voices to load
        const onVoicesChanged = () => {
          voices = synth.getVoices();
          resolve(voices);
          // Cleanup listener
          synth.removeEventListener('voiceschanged', onVoicesChanged);
        };
        
        synth.addEventListener('voiceschanged', onVoicesChanged);
        
        // Timeout fallback in case event doesn't fire
        setTimeout(() => {
            resolve(synth.getVoices());
        }, 1000);
      }
    });
  };

  try {
    const voices = await getVoices();
    const utterance = new SpeechSynthesisUtterance(text);

    // Voice selection logic
    // We try to find a consistent "Narrator" voice.
    // Preference: English (GB/US), Male/Deep if possible to match "Narrator" vibe.
    
    let selectedVoice = 
        voices.find(v => v.name === "Google UK English Male") ||
        voices.find(v => v.name === "Daniel") || // macOS
        voices.find(v => v.name === "Microsoft David Desktop") || // Windows
        voices.find(v => v.lang === "en-GB" && v.name.includes("Male")) ||
        voices.find(v => v.lang === "en-GB") ||
        voices.find(v => v.lang === "en-US") ||
        voices[0];

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    // Narration styling
    utterance.rate = 0.9;  // Slowed down by ~20% from previous 1.2
    utterance.pitch = 1.0; // Normal pitch
    utterance.volume = 1.0;

    // Speak
    synth.speak(utterance);

  } catch (e) {
    console.error("Speech Synthesis failed:", e);
  }

  // Return a function that cancels the speech
  return () => {
    if (synth.speaking || synth.pending) {
      synth.cancel();
    }
  };
}
