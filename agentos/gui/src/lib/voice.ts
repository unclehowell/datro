const VOICE_SERVICE_URL = process.env.VOICE_SERVICE_URL || "http://localhost:3101";
const GROQ_WHISPER_URL = "https://api.groq.com/openai/v1/audio/transcriptions";

export interface TTSRequest {
  text: string;
  voice?: string;
}

export interface STTResult {
  text: string;
  language: string;
  duration: number;
  provider: string;
}

export async function textToSpeech(req: TTSRequest): Promise<ArrayBuffer> {
  try {
    const form = new FormData();
    form.append("text", req.text);
    form.append("voice", req.voice || "aria");

    const res = await fetch(`${VOICE_SERVICE_URL}/tts`, {
      method: "POST",
      body: form,
      signal: AbortSignal.timeout(15000),
    });

    if (res.ok) {
      return await res.arrayBuffer();
    }
  } catch (e) {
    console.error("edge-tts failed, falling back to browser TTS:", e);
  }

  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      reject(new Error("No TTS provider available"));
      return;
    }
    const utter = new SpeechSynthesisUtterance(req.text);
    utter.rate = 1.0;
    utter.pitch = 1.0;
    window.speechSynthesis.speak(utter);
    utter.onend = () => resolve(new ArrayBuffer(0));
    utter.onerror = () => reject(new Error("Browser TTS failed"));
  });
}

export async function speechToText(audioBlob: Blob): Promise<STTResult> {
  const apiKey = process.env.GROQ_API_KEY || "";
  if (!apiKey) throw new Error("No GROQ_API_KEY — STT unavailable");

  const form = new FormData();
  form.append("file", audioBlob, "audio.webm");
  form.append("model", "whisper-large-v3-turbo");
  form.append("language", "en");

  const res = await fetch(GROQ_WHISPER_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Groq STT error: ${res.status}`);
  const data = await res.json();
  return { text: data.text, language: data.language || "en", duration: data.duration || 0, provider: "groq" };
}

export function createAudioContext(): AudioContext {
  return new AudioContext();
}

export async function startRecording(
  onChunk: (blob: Blob) => void,
): Promise<() => void> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm;codecs=opus" });
  const chunks: Blob[] = [];

  mediaRecorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  mediaRecorder.onstop = () => {
    const blob = new Blob(chunks, { type: "audio/webm" });
    chunks.length = 0;
    onChunk(blob);
  };

  mediaRecorder.start(1000);

  return () => {
    mediaRecorder.stop();
    stream.getTracks().forEach((t) => t.stop());
  };
}
