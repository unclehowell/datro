"""Voice Service — edge-tts only (TTS)
STT handled by Groq Whisper (cloud, free) via the GUI client.
Runs on port 3101. Lightweight — no local ML models loaded."""

import asyncio
import io
from fastapi import FastAPI, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
import uvicorn
import edge_tts

app = FastAPI(title="Voice Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

VOICES = {
    "aria": "en-US-AriaNeural",
    "davis": "en-US-DavisNeural",
    "guy": "en-US-GuyNeural",
    "jenny": "en-US-JennyNeural",
    "tony": "en-US-TonyNeural",
    "nancy": "en-US-NancyNeural",
    "andrew": "en-US-AndrewNeural",
    "ava": "en-US-AvaNeural",
    "christopher": "en-US-ChristopherNeural",
    "sara": "en-US-SaraNeural",
}

DEFAULT_VOICE = "en-US-AriaNeural"


@app.get("/health")
async def health():
    return {"status": "ok", "tts": "edge-tts", "stt": "groq-cloud"}


@app.get("/voices")
async def list_voices():
    return {"voices": list(VOICES.keys()), "default": "aria"}


@app.post("/tts")
async def text_to_speech(
    text: str = Form(...),
    voice: str = Form("aria"),
):
    voice_name = VOICES.get(voice.lower(), DEFAULT_VOICE)
    if not voice_name.startswith("en-"):
        voice_name = DEFAULT_VOICE

    communicate = edge_tts.Communicate(text, voice_name)
    audio_buffer = io.BytesIO()

    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            audio_buffer.write(chunk["data"])

    audio_buffer.seek(0)
    return Response(
        content=audio_buffer.read(),
        media_type="audio/mpeg",
        headers={"Cache-Control": "no-cache"},
    )


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=3101)
