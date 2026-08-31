import { NextRequest, NextResponse } from "next/server";
import { textToSpeech, speechToText } from "@/lib/voice";
import { ensureWhisperSTT } from "@/lib/whisper-gate";

export async function POST(req: NextRequest) {
  const action = req.nextUrl.searchParams.get("action");

  if (action === "tts") {
    const { text, voice } = await req.json();
    try {
      // Whisper server doubles as the edge-tts TTS endpoint; boot it on
      // demand for this reply (auto-shuts down when idle).
      const gate = await ensureWhisperSTT();
      if (!gate.ok) return NextResponse.json({ error: "Voice service unavailable" }, { status: 503 });
      const audioBuffer = await textToSpeech({ text, voice });
      return new NextResponse(audioBuffer, {
        headers: {
          "Content-Type": "audio/mpeg",
          "Cache-Control": "no-cache",
        },
      });
    } catch (err) {
      return NextResponse.json({ error: String(err) }, { status: 500 });
    }
  }

  if (action === "stt") {
    try {
      // Local Whisper STT only — the service is DISABLED by default;
      // cold-start it on demand for this recording, idle auto-shutdown.
      const gate = await ensureWhisperSTT();
      if (!gate.ok) return NextResponse.json({ error: "STT service unavailable" }, { status: 503 });
      const formData = await req.formData();
      const audioFile = formData.get("audio") as Blob;
      if (!audioFile) return NextResponse.json({ error: "No audio provided" }, { status: 400 });
      const result = await speechToText(audioFile);
      return NextResponse.json(result);
    } catch (err) {
      return NextResponse.json({ error: String(err) }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "action=tts|stt required" }, { status: 400 });
}
