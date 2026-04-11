---
name: elevenlabs
description: Generate text-to-speech (TTS) audio using the ElevenLabs API.
version: 1.0.0
author: unclehowell
license: MIT
metadata:
  hermes:
    tags: [Audio, TTS, ElevenLabs]
    requires_tools: [terminal, execute_code]
required_environment_variables:
  - name: ELEVENLABS_API_KEY
    prompt: "Enter your ElevenLabs API key"
    help: "Get your key at https://elevenlabs.io"
    required_for: "Text-to-speech (TTS) generation"
---

# ElevenLabs Skill

This skill allows the agent to interact with the ElevenLabs API for high-quality text-to-speech (TTS) generation.

## When to Use
- Converting text into spoken audio files.
- Creating voice responses for messages or stories.
- Testing different voices or audio qualities.

## Quick Reference
| Task | Command |
|------|---------|
| Simple TTS | `python scripts/tts.py "Hello world"` |
| Select Voice | `python scripts/tts.py "Hello" --voice "Adam"` |
| Save to File | `python scripts/tts.py "Hello" --output "hello.mp3"` |

## Procedure
1.  **Authentication:** Ensure `ELEVENLABS_API_KEY` is set in the environment.
2.  **Voice Identification:** Select a voice name or ID.
3.  **Generation:** Call the ElevenLabs API via a helper script or `curl`.
4.  **Verification:** Check for the existence and size of the output audio file.

## Pitfalls
- **Credit Limits:** TTS generation consumes ElevenLabs characters/credits.
- **Latency:** API calls may take a few seconds to process.
- **Invalid Voice ID:** Using a non-existent voice ID will cause an error.

## Verification
- For audio output: `ls -lh <output_file>`
- For API response: `echo $?` (ensure exit code 0)
