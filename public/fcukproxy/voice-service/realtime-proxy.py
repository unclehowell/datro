#!/usr/bin/env python3
"""
Local OpenAI Realtime-compatible WebSocket proxy for OpenClaw voice.

Implements a minimal subset of the OpenAI Realtime WebSocket protocol:
- Accepts connections on ws://localhost:3102/openai/realtime
  and ws://localhost:3102/v1/realtime  (both paths work)
- Also serves an HTTP endpoint:
  POST /v1/realtime/sessions -> returns ephemeral client_secret (dummy)
  GET  /health

Audio flow:
  client -> input_audio_buffer.append (PCM16, 24kHz) -> accumulate
  client -> input_audio_buffer.commit -> run whisper STT
  server -> conversation.item.created (with transcript)
  server -> response.audio_transcript.done (so OpenClaw finalizes the turn)

This is NOT a full realtime LLM — it's STT-only. The gateway relay
forwards the transcript to the agent for response, which comes back as TTS.
"""

import asyncio
import json
import logging
import os
import struct
import tempfile
import time
import wave
from http import HTTPStatus

import websockets
from websockets.server import serve
from faster_whisper import WhisperModel

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s realtime-proxy %(levelname)s %(message)s",
)
log = logging.getLogger("realtime-proxy")

PORT = int(os.environ.get("REALTIME_PORT", 3102))
MODEL_SIZE = os.environ.get("WHISPER_MODEL", "tiny")
MODELS_DIR = os.path.expanduser("~/.local/whisper-stt/models")
SAMPLE_RATE = 24000  # OpenAI realtime PCM16 24kHz

log.info(f"Loading whisper model '{MODEL_SIZE}' ...")
_model = WhisperModel(
    MODEL_SIZE,
    device="cpu",
    compute_type="int8",
    download_root=MODELS_DIR,
    cpu_threads=2,
    num_workers=1,
)
log.info(f"Model '{MODEL_SIZE}' loaded.")


def pcm16_to_wav(pcm_bytes: bytes, sample_rate: int = SAMPLE_RATE) -> bytes:
    """Wrap raw PCM16 mono bytes in a WAV container."""
    import io
    buf = io.BytesIO()
    with wave.open(buf, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)  # 16-bit
        w.setframerate(sample_rate)
        w.writeframes(pcm_bytes)
    return buf.getvalue()


def transcribe(pcm_bytes: bytes) -> str:
    if len(pcm_bytes) < 3200:  # <100ms at 24kHz — skip silence
        return ""
    wav_bytes = pcm16_to_wav(pcm_bytes)
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
        f.write(wav_bytes)
        path = f.name
    try:
        segments, info = _model.transcribe(
            path,
            language="en",
            beam_size=1,
            best_of=1,
            temperature=0.0,
            vad_filter=True,
        )
        text = " ".join(s.text.strip() for s in segments).strip()
        log.info(f"Transcribed {len(pcm_bytes)//2} samples -> {text!r}")
        return text
    finally:
        os.unlink(path)


def send(ws, event: dict):
    """Synchronous helper to queue a send from sync context — not used, see async version."""
    pass


class RealtimeSession:
    def __init__(self, websocket):
        self.ws = websocket
        self.session_id = f"sess_{int(time.time()*1000)}"
        self.audio_buf = bytearray()
        self.item_counter = 0

    async def send(self, event: dict):
        await self.ws.send(json.dumps(event))

    async def handle_message(self, raw: str):
        try:
            msg = json.loads(raw)
        except json.JSONDecodeError:
            return
        msg_type = msg.get("type", "")
        log.debug(f"<< {msg_type}")

        if msg_type == "session.update":
            await self.send({"type": "session.updated", "session": msg.get("session", {})})

        elif msg_type == "input_audio_buffer.append":
            b64 = msg.get("audio", "")
            if b64:
                import base64
                self.audio_buf.extend(base64.b64decode(b64))

        elif msg_type == "input_audio_buffer.commit":
            # Transcribe the accumulated audio
            await self.finalize_audio()

        elif msg_type == "input_audio_buffer.clear":
            self.audio_buf.clear()

        elif msg_type == "response.create":
            # Client wants a response — we already sent the transcript as item.created
            # Emit a minimal response.done so the client state machine completes
            response_id = f"resp_{int(time.time()*1000)}"
            await self.send({
                "type": "response.created",
                "response": {"id": response_id, "status": "in_progress", "output": []}
            })
            await self.send({
                "type": "response.done",
                "response": {"id": response_id, "status": "completed", "output": []}
            })

    async def finalize_audio(self):
        if not self.audio_buf:
            return
        pcm = bytes(self.audio_buf)
        self.audio_buf.clear()

        # Run transcription in a thread pool (blocking call)
        loop = asyncio.get_event_loop()
        text = await loop.run_in_executor(None, transcribe, pcm)

        if not text:
            return

        self.item_counter += 1
        item_id = f"item_{self.item_counter}"

        # Emit transcript as a user message item
        await self.send({
            "type": "conversation.item.created",
            "item": {
                "id": item_id,
                "type": "message",
                "role": "user",
                "content": [{"type": "input_text", "text": text}],
            }
        })
        # Also emit audio transcript events that some providers use
        await self.send({
            "type": "response.audio_transcript.delta",
            "delta": text,
            "item_id": item_id,
        })
        await self.send({
            "type": "response.audio_transcript.done",
            "transcript": text,
            "item_id": item_id,
        })
        # Mark input audio as done
        await self.send({
            "type": "input_audio_buffer.speech_stopped",
            "audio_end_ms": len(pcm) // (SAMPLE_RATE * 2 // 1000),
            "item_id": item_id,
        })
        await self.send({
            "type": "input_audio_buffer.committed",
            "previous_item_id": None,
            "item_id": item_id,
        })


async def handle_websocket(websocket, path=""):
    path = getattr(websocket, "path", path) or "/"
    log.info(f"WebSocket connection: {path}")
    session = RealtimeSession(websocket)

    # Send session.created immediately
    await session.send({
        "type": "session.created",
        "session": {
            "id": session.session_id,
            "object": "realtime.session",
            "model": f"local-whisper-{MODEL_SIZE}",
            "modalities": ["text", "audio"],
            "instructions": "",
            "voice": "alloy",
            "input_audio_format": "pcm16",
            "output_audio_format": "pcm16",
            "input_audio_transcription": {"model": f"whisper-{MODEL_SIZE}"},
            "turn_detection": {"type": "server_vad"},
            "tools": [],
            "tool_choice": "auto",
            "temperature": 0.8,
        }
    })

    try:
        async for message in websocket:
            await session.handle_message(message)
    except websockets.exceptions.ConnectionClosed:
        log.info("WebSocket closed")
    except Exception as e:
        log.error(f"WebSocket error: {e}")


async def http_handler(path, request_headers):
    """Handle HTTP upgrade check and REST endpoints."""
    # Allow WebSocket upgrades for realtime paths
    if path in ("/openai/realtime", "/v1/realtime", "/realtime"):
        return None  # Let websockets handle it

    # HTTP health endpoint
    if path == "/health":
        body = json.dumps({"status": "ok", "model": MODEL_SIZE}).encode()
        return HTTPStatus.OK, [("Content-Type", "application/json")], body

    # Ephemeral session endpoint (POST /v1/realtime/sessions)
    # Returns a dummy client_secret since gateway-relay mode doesn't need a real one
    if path == "/v1/realtime/sessions":
        body = json.dumps({
            "id": f"sess_{int(time.time()*1000)}",
            "object": "realtime.session",
            "model": f"local-whisper-{MODEL_SIZE}",
            "client_secret": {
                "value": "local-dummy-key",
                "expires_at": int(time.time()) + 3600,
            }
        }).encode()
        return HTTPStatus.OK, [("Content-Type", "application/json")], body

    return HTTPStatus.NOT_FOUND, [], b"Not found"


async def main():
    log.info(f"Starting OpenAI Realtime proxy on ws://localhost:{PORT}")
    async with serve(
        handle_websocket,
        "127.0.0.1",
        PORT,
        process_request=http_handler,
    ):
        log.info(f"Listening on port {PORT}")
        await asyncio.Future()  # run forever


if __name__ == "__main__":
    asyncio.run(main())
