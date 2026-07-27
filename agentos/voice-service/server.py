"""Voice Service — Kokoro-82M TTS (local, CPU)
STT handled by Groq Whisper (cloud, free) via the GUI client.
Runs on port 3101. Uses kokoro-onnx for high-quality local TTS."""

import io
import os
import base64
from fastapi import FastAPI, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
import uvicorn

app = FastAPI(title="Voice Service", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_DIR = os.environ.get("KOKORO_MODEL_DIR", os.path.expanduser("~/.fcukproxy/models"))
KOKORO_MODEL = os.path.join(MODEL_DIR, "kokoro-v1.0.int8.onnx")
KOKORO_VOICES = os.path.join(MODEL_DIR, "voices-v1.0.bin")

_kokoro = None

def get_kokoro():
    global _kokoro
    if _kokoro is None:
        from kokoro_onnx import Kokoro
        _kokoro = Kokoro(KOKORO_MODEL, KOKORO_VOICES)
    return _kokoro

VOICES = {
    "michael": "am_michael",
    "fenrir": "am_fenrir",
    "puck": "am_puck",
    "adam": "am_adam",
    "echo": "am_echo",
    "eric": "am_eric",
    "liam": "am_liam",
    "onyx": "am_onyx",
    "santa": "am_santa",
    "george": "bm_george",
    "fable": "bm_fable",
    "daniel": "bm_daniel",
    "lewis": "bm_lewis",
    "aria": "af_heart",
    "bella": "af_bella",
    "nova": "af_nova",
    "sarah": "af_sarah",
}

DEFAULT_VOICE = "am_michael"


@app.get("/health")
async def health():
    return {"status": "ok", "tts": "kokoro-onnx", "stt": "groq-cloud"}


@app.get("/voices")
async def list_voices():
    return {"voices": list(VOICES.keys()), "default": "michael"}


@app.post("/tts")
async def text_to_speech(
    text: str = Form(...),
    voice: str = Form("michael"),
    speed: float = Form(1.0),
    as_base64: bool = Form(False),
):
    voice_id = VOICES.get(voice.lower(), DEFAULT_VOICE)
    kokoro = get_kokoro()
    samples, sample_rate = kokoro.create(text, voice=voice_id, speed=speed, lang="en-us")

    import soundfile as sf
    buf = io.BytesIO()
    sf.write(buf, samples, sample_rate, format="WAV")
    buf.seek(0)
    audio_bytes = buf.read()

    if as_base64:
        b64 = base64.b64encode(audio_bytes).decode("utf-8")
        return {"audio": f"data:audio/wav;base64,{b64}", "format": "wav"}

    return Response(
        content=audio_bytes,
        media_type="audio/wav",
        headers={"Cache-Control": "no-cache"},
    )


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=3101)
