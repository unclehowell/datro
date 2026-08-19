#!/usr/bin/env python3
"""
Local Whisper STT server + edge-tts TTS endpoint.
Port: 3101

Routes:
  POST /v1/audio/transcriptions  - OpenAI-compatible STT (multipart file)
  POST /tts                       - TTS to mp3 (form: text, voice, save_path)
  GET  /health                    - Health check
"""

import asyncio
import logging
import os
import shutil
import tempfile
import time
from pathlib import Path

from flask import Flask, request, jsonify, send_file
from faster_whisper import WhisperModel

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s whisper-stt %(levelname)s %(message)s",
)
log = logging.getLogger("whisper-stt")

PORT = int(os.environ.get("WHISPER_PORT", 3101))
MODEL_SIZE = os.environ.get("WHISPER_MODEL", "tiny")
MODELS_DIR = Path.home() / ".local" / "whisper-stt" / "models"
MODELS_DIR.mkdir(parents=True, exist_ok=True)

log.info(f"Loading whisper model '{MODEL_SIZE}' (CPU int8)...")
model = WhisperModel(
    MODEL_SIZE,
    device="cpu",
    compute_type="int8",
    download_root=str(MODELS_DIR),
    cpu_threads=2,
    num_workers=1,
)
log.info(f"Model '{MODEL_SIZE}' loaded.")

app = Flask(__name__)


def transcribe_blob(audio_bytes: bytes, filename: str, language: str | None) -> dict:
    suffix = Path(filename).suffix or ".webm"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as f:
        f.write(audio_bytes)
        tmp_path = f.name
    try:
        t0 = time.monotonic()
        segments, info = model.transcribe(
            tmp_path,
            language=language or None,
            beam_size=1,
            best_of=1,
            temperature=0.0,
            vad_filter=True,
        )
        text = " ".join(s.text.strip() for s in segments).strip()
        elapsed = time.monotonic() - t0
        log.info(f"Transcribed {elapsed:.2f}s lang={info.language} {text[:80]!r}")
        return {
            "text": text,
            "language": info.language,
            "duration": info.duration,
            "provider": "local-whisper",
        }
    finally:
        os.unlink(tmp_path)


@app.route("/v1/audio/transcriptions", methods=["POST"])
def transcribe():
    audio_file = request.files.get("file") or request.files.get("audio")
    if audio_file is None:
        return jsonify({"error": {"message": "No audio file", "type": "invalid_request_error"}}), 400
    audio_bytes = audio_file.read()
    language = (request.form.get("language") or "en").strip() or "en"
    result = transcribe_blob(audio_bytes, audio_file.filename or "audio.webm", language)
    return jsonify(result)


@app.route("/tts", methods=["POST"])
def tts():
    """
    Generate speech mp3 from text using edge-tts.
    Form / JSON: text, voice (optional), save_path (optional)
    Returns mp3 bytes, or {saved: path} if save_path provided.
    """
    try:
        import edge_tts
    except ImportError:
        return jsonify({"error": "edge_tts not installed"}), 500

    if request.form:
        text = (request.form.get("text") or "").strip()
        voice = request.form.get("voice") or "en-GB-SoniaNeural"
        save_path = request.form.get("save_path") or None
    else:
        body = request.get_json(silent=True) or {}
        text = (body.get("text") or "").strip()
        voice = body.get("voice") or "en-GB-SoniaNeural"
        save_path = body.get("save_path") or None

    if not text:
        return jsonify({"error": "No text provided"}), 400

    with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as f:
        tmp_path = f.name

    try:
        async def _synth():
            communicate = edge_tts.Communicate(text, voice)
            await communicate.save(tmp_path)

        asyncio.run(_synth())
        log.info(f"TTS {'-> ' + save_path if save_path else 'streaming'}: {text[:60]!r}")

        if save_path:
            os.makedirs(os.path.dirname(os.path.abspath(save_path)), exist_ok=True)
            shutil.copy(tmp_path, save_path)
            os.unlink(tmp_path)
            return jsonify({"saved": save_path, "bytes": os.path.getsize(save_path)})

        return send_file(tmp_path, mimetype="audio/mpeg", as_attachment=False,
                         download_name="tts.mp3")
    except Exception as e:
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)
        log.error(f"TTS error: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "model": MODEL_SIZE})


if __name__ == "__main__":
    log.info(f"Starting whisper-stt server on port {PORT}")
    app.run(host="127.0.0.1", port=PORT, debug=False)
