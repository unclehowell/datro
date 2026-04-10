# Voice Input for OpenCode

## Quick Usage

```bash
voice
```

This will:
1. Record 5 seconds of audio
2. Transcribe using faster-whisper (local, no API needed)
3. Send transcript to OpenCode

## Files

- `/home/unclehowell/bin/voice-oc` - Main voice script
- `/home/unclehowell/bin/voice-to-opencode.sh` - Interactive version (asks before running)
- `/home/unclehowell/bin/voice-opencode` - Spacebar hold version (experimental)

## Requirements

- `arecord` - Audio recording (ALSA)
- `faster-whisper` - Local transcription (Python package)
- `opencode` - The coding agent

## Hotkey Setup

In GNOME/G Ubuntu:
1. Settings → Keyboard → Shortcuts
2. Add Custom Shortcut
3. Command: `/home/unclehowell/bin/voice-oc`
4. Set to: Super+V

## How It Works

1. Records audio via ALSA (arecord)
2. Transcribes with faster-whisper (local, no internet needed)
3. Pipes result to OpenCode

## Alternative: Use Hermes Voice

You can also send voice messages to Hermes on Telegram - Hermes will transcribe and run OpenCode if needed.
