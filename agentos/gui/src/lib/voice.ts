const VOICE_SERVICE_URL = process.env.VOICE_SERVICE_URL || "http://localhost:3101";
const LOCAL_STT_URL = `${VOICE_SERVICE_URL}/v1/audio/transcriptions`;

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
  const form = new FormData();
  form.append("text", req.text);
  form.append("voice", req.voice || "aria");

  const res = await fetch(`${VOICE_SERVICE_URL}/tts`, {
    method: "POST",
    body: form,
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) throw new Error(`TTS failed: ${res.status}`);
  return await res.arrayBuffer();
}

export async function speechToText(audioBlob: Blob): Promise<STTResult> {
  // Local Whisper STT only — no cloud fallback.
  const form = new FormData();
  form.append("file", audioBlob, "audio.webm");
  form.append("model", "whisper-tiny");
  form.append("language", "en");

  const res = await fetch(LOCAL_STT_URL, {
    method: "POST",
    body: form,
    signal: AbortSignal.timeout(60000),
  });
  if (!res.ok) throw new Error(`STT failed (${res.status}) — is whisper-stt service running?`);
  const data = await res.json();
  return {
    text: data.text,
    language: data.language || "en",
    duration: data.duration || 0,
    provider: data.provider || "local-whisper",
  };
}

export function createAudioContext(): AudioContext {
  return new AudioContext();
}

// ─── Shared audio context ─────────────────────────────────
// All tones + answer/hold cues reuse ONE AudioContext, created and
// resumed on first use. This keeps them audible even when they fire
// long after the Call click (e.g. the answer chime after a minutes-long
// warm-up) instead of spinning up a fresh — and possibly auto-suspended —
// context each time.
let sharedCtx: AudioContext | null = null;

function getSharedCtx(): AudioContext | null {
  if (sharedCtx && sharedCtx.state !== "closed") {
    if (sharedCtx.state === "suspended") void sharedCtx.resume().catch(() => {});
    return sharedCtx;
  }
  try {
    sharedCtx = new AudioContext();
    if (sharedCtx.state === "suspended") void sharedCtx.resume().catch(() => {});
    return sharedCtx;
  } catch {
    return null;
  }
}

// ─── Return dial tone (synthesized ringback, no asset needed) ──
// A UK-style ringback: 400Hz + 450Hz, cadence 0.4s ring / 0.2s gap
// / 0.4s ring / 2.0s pause — the sound of waiting for the far end
// to pick up while the local LLM stack + voice engines come up.
let toneCtx: AudioContext | null = null;
let toneNodes: { osc1: OscillatorNode; osc2: OscillatorNode; gain: GainNode } | null = null;
let toneTimer: ReturnType<typeof setTimeout> | null = null;

export async function startDialTone(): Promise<void> {
  try {
    stopDialTone();
    const ctx = getSharedCtx();
    if (!ctx) return;
    toneCtx = ctx;
    await ctx.resume();
    const gain = ctx.createGain();
    gain.gain.value = 0;
    const osc1 = ctx.createOscillator();
    osc1.type = "sine";
    osc1.frequency.value = 400;
    const osc2 = ctx.createOscillator();
    osc2.type = "sine";
    osc2.frequency.value = 450;
    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);
    osc1.start();
    osc2.start();
    toneNodes = { osc1, osc2, gain };

    const scheduleCycle = () => {
      if (!toneCtx || !toneNodes) return;
      const g = toneNodes.gain.gain;
      const t0 = toneCtx.currentTime + 0.05;
      g.cancelScheduledValues(t0);
      // ring 1: 0.4s
      g.setValueAtTime(0.05, t0);
      g.setValueAtTime(0.05, t0 + 0.4);
      g.linearRampToValueAtTime(0.0001, t0 + 0.42);
      // gap: 0.2s
      g.setValueAtTime(0.0001, t0 + 0.6);
      // ring 2: 0.4s
      g.linearRampToValueAtTime(0.05, t0 + 0.62);
      g.setValueAtTime(0.05, t0 + 1.0);
      g.linearRampToValueAtTime(0.0001, t0 + 1.02);
      // pause: ~2s before the next double-ring
      toneTimer = setTimeout(scheduleCycle, 3000);
    };
    scheduleCycle();
  } catch {
    toneNodes = null;
    toneCtx = null;
  }
}

export function stopDialTone(): void {
  if (toneTimer) { clearTimeout(toneTimer); toneTimer = null; }
  try {
    if (toneNodes) {
      toneNodes.osc1.stop();
      toneNodes.osc2.stop();
      toneNodes.osc1.disconnect();
      toneNodes.osc2.disconnect();
      toneNodes.gain.disconnect();
    }
  } catch {}
  toneNodes = null;
  toneCtx = null;
}

export async function playAnswerChime(): Promise<void> {
  try {
    const ctx = getSharedCtx();
    if (!ctx) return;
    await ctx.resume();
    const gain = ctx.createGain();
    gain.gain.value = 0.06;
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.7);
    gain.connect(ctx.destination);
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = 880;
    osc.connect(gain);
    osc.start();
    osc.stop(ctx.currentTime + 0.7);
    osc.onended = () => { osc.disconnect(); gain.disconnect(); };
  } catch {}
}

// ─── In-call acknowledgement ("connecting") tone ─────────────
// A soft two-note cue the caller hears the moment their voice prompt
// is accepted, so the call feels connected even while the LLM thinks.
export function playPromptTone(): void {
  try {
    const ctx = getSharedCtx();
    if (!ctx) return;
    const t0 = ctx.currentTime;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.05, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.45);
    gain.connect(ctx.destination);
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(660, t0);
    osc.frequency.setValueAtTime(880, t0 + 0.12);
    osc.connect(gain);
    osc.start(t0);
    osc.stop(t0 + 0.45);
    osc.onended = () => { osc.disconnect(); gain.disconnect(); };
  } catch {}
}

// ─── Hold tone ───────────────────────────────────────────────
// A gentle periodic beep (like being kept on hold) played while a
// reply is being generated, so silence never feels like the call
// dropped. Starts immediately, repeats every 8s until stopped.
let holdCtx: AudioContext | null = null;
let holdTimer: ReturnType<typeof setTimeout> | null = null;

export function startHoldTone(): void {
  try {
    stopHoldTone();
    const ctx = getSharedCtx();
    if (!ctx) return;
    holdCtx = ctx;
    const beep = () => {
      if (!holdCtx) return;
      const osc = holdCtx.createOscillator();
      const gain = holdCtx.createGain();
      const t0 = holdCtx.currentTime;
      osc.type = "sine";
      osc.frequency.value = 523.25;
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.linearRampToValueAtTime(0.03, t0 + 0.03);
      gain.gain.setValueAtTime(0.03, t0 + 0.4);
      gain.gain.linearRampToValueAtTime(0.0001, t0 + 0.5);
      osc.connect(gain);
      gain.connect(holdCtx.destination);
      osc.start(t0);
      osc.stop(t0 + 0.5);
      osc.onended = () => { osc.disconnect(); gain.disconnect(); };
    };
    beep();
    holdTimer = setTimeout(function tick() {
      beep();
      holdTimer = setTimeout(tick, 8000);
    }, 8000);
  } catch {}
}

export function stopHoldTone(): void {
  if (holdTimer) { clearTimeout(holdTimer); holdTimer = null; }
  holdCtx = null;
}

// ─── Hang-up click ───────────────────────────────────────────
// A short descending click like a handset going down — the aural
// end-of-call so hanging up feels deliberate and final.
export function playHangUpTone(): void {
  try {
    const ctx = getSharedCtx();
    if (!ctx) return;
    const t0 = ctx.currentTime;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.06, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.12);
    gain.connect(ctx.destination);
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(440, t0);
    osc.frequency.linearRampToValueAtTime(300, t0 + 0.12);
    osc.connect(gain);
    osc.start(t0);
    osc.stop(t0 + 0.12);
    osc.onended = () => { osc.disconnect(); gain.disconnect(); };
  } catch {}
}

// ─── Voicemail beep ──────────────────────────────────────
// Double-beep like a phone carrier voicemail prompt — loud and clear
// so the caller unmistakably knows it's time to speak.
export function playBeep(): void {
  try {
    const ctx = getSharedCtx();
    if (!ctx) return;
    ctx.resume();
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.connect(ctx.destination);

    // Beep 1: 1kHz, 0.3s
    const osc1 = ctx.createOscillator();
    osc1.type = "sine";
    osc1.frequency.value = 1000;
    osc1.connect(gain);
    const t0 = ctx.currentTime;
    gain.gain.setValueAtTime(0.25, t0);
    gain.gain.setValueAtTime(0.25, t0 + 0.3);
    gain.gain.linearRampToValueAtTime(0, t0 + 0.32);
    osc1.start(t0);
    osc1.stop(t0 + 0.35);

    // Beep 2: 1kHz, 0.3s (after 0.1s gap)
    const osc2 = ctx.createOscillator();
    osc2.type = "sine";
    osc2.frequency.value = 1000;
    osc2.connect(gain);
    const t1 = t0 + 0.45;
    gain.gain.setValueAtTime(0.25, t1);
    gain.gain.setValueAtTime(0.25, t1 + 0.3);
    gain.gain.linearRampToValueAtTime(0, t1 + 0.32);
    osc2.start(t1);
    osc2.stop(t1 + 0.35);

    const cleanup = () => { gain.disconnect(); };
    osc1.onended = cleanup;
    osc2.onended = cleanup;
  } catch {}
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
