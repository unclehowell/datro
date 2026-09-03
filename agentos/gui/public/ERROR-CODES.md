# Error code lookup

Short, machine-recognisable error codes surfaced in the chat and voicemail
UIs as a clickable badge. Click the badge to open this document. v1.11.27.

If you see a code not listed here, please file an issue with the full
text from the chat/voicemail card and the device the request was made
on (laptop vs phone).

---

## Chat route (`POST /api/chat`)

Surfaced in the assistant message bubble as a red `⚠ CODE` chip next to
the route/dependency tags.

| Code            | Meaning                                                                                                          | What to try                                                                                                                |
| --------------- | ---------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `CHAT_FAIL`     | Generic catch-all. Something in the chat pipeline threw an unrecognised error.                                   | Re-send the message. If it repeats, capture the full bubble text and the timestamp and file an issue.                       |
| `CHAT_TIMEOUT`  | The chat route exceeded its hard limit (300 s for the OpenAI call, 5 s for `ensureLLMStack`, 3 s for `switchToProfile`, 3 s for `queryGraphRAG`). | If the model is cold-loaded, retry. If the timeout is on `ensureLLMStack` and your node is thin, start ollama manually first. |
| `OLLOMA_DOWN`   | The chat route could not reach ollama (`ECONNREFUSED` / `fetch failed`). The local-first path returned null and the cloud fallback was also empty. | Start ollama: `ollama serve`. On Termux the model auto-loads on first call — allow up to 60 s.                               |
| `UPSTREAM_5XX`  | An upstream provider (ollama or cloud) returned a 5xx status.                                                     | Wait 30 s and retry. If the cloud route is the source, check provider keys.                                                |

## Voicemail route (`POST /api/voicemail`)

Surfaced in the voicemail processing card as a red stage chip
(`stt CODE`, `think CODE`, `tts CODE`). The processing card stays
visible the entire time a request is being worked on — v1.11.27.

| Code              | Stage      | Meaning                                                                                                  | What to try                                                                                                |
| ----------------- | ---------- | -------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `STT_FAIL`        | `stt`      | The whisper-stt service returned a non-2xx or the audio fetch itself failed.                             | Confirm whisper is up: `curl http://localhost:3101/health`. If absent, install with `MODE=full`.           |
| `STT_EMPTY`       | `stt`      | Whisper returned no transcript (silence or unintelligible audio).                                        | Re-record; speak closer to the mic.                                                                        |
| `OLLOMA_DOWN`     | `think`    | LLM stack refused to come up (ECONNREFUSED on `http://localhost:11434` or omniroute `:20128`).           | Start ollama: `ollama serve`. If omniroute is missing, run the installer's omniroute step.                  |
| `LLM_TIMEOUT`     | `think`    | The local LLM hit the new 180 s × 2 budget (v1.11.26).                                                    | Cold model load is slow. Retry after the model is warm. If persistent, raise `LLM_TIMEOUT_S` env.          |
| `E_NO_PROVIDER`   | `think`    | Both the local LLM and every configured cloud provider returned empty.                                    | Check `LLM_LOCAL_ONLY` setting in `cloud-router.ts`. With local-only and no ollama, the route is terminal. |
| `TTS_FAIL`        | `tts`      | The voice-service TTS endpoint returned a non-2xx.                                                        | Confirm voice-service is up: `curl http://localhost:3101/health`. The voicemail is still saved as text.    |

## Status mapping (visual)

The voicemail processing card maps a code's prefix to the stage chip
that goes red:

- `STT_*`           → the `stt` chip lights red
- `LLM_*`, `OLLAMA_*`, `E_NO_PROVIDER` → the `think` chip lights red
- `TTS_*`, `VOICE_*` → the `tts` chip lights red

Stages that completed cleanly before the failure stay green; stages
that hadn't started yet stay faded.

## API surface for polling clients

`GET /api/voicemail?action=status&id=<vmId>` returns:

```json
{
  "id": "vm-...",
  "status": "error",
  "error": "STT failed: ...",
  "errorCode": "STT_FAIL",
  "startedAt": 1735920000000,
  "stageStartedAt": 1735920003000,
  "elapsedMs": 3000,
  "stageElapsedMs": 3000
}
```

`elapsedMs` is the total wall-clock time since the voicemail was queued;
`stageElapsedMs` is the time spent in the current stage. Use both to
display "still generating" indicators without polling the LLM.

## Changelog

- **v1.11.27** — Initial version. Surfaced error codes on the chat and
  voicemail UIs, created this document, added stage timing fields to
  `/api/voicemail?action=status`.
