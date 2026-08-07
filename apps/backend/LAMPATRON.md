# Lampatron Voice/Chat Agent

A RAG-grounded chat assistant for [Lampatron](https://www.lampatron.ae/) (a UAE
designer lighting retailer), served as a browser page with voice and text
input, and optionally exposed to the internet via ngrok.

## What's implemented

- **Knowledge base** (`lampatron/knowledge_data.py`) — real data scraped from
  lampatron.ae: company info, 22 products with real AED prices, catalog
  categories, and FAQs (shipping, returns, warranty, order process).
- **Retrieval** (`lampatron/rag.py`) — the knowledge base is chunked (including
  per-category summary chunks, e.g. "all chandeliers") and embedded with
  Gemini's embedding model into a local, embedded Qdrant vector store
  (`lampatron/qdrant_data/`, gitignored, rebuilt automatically on first run).
  A similarity `score_threshold` skips injecting irrelevant chunks for casual
  messages like "hi".
- **Reply generation** (`lampatron/rpcagent.py`) — `Qwen/Qwen3.6-35B-A3B` via
  [DeepInfra](https://deepinfra.com/)'s OpenAI-compatible endpoint, grounded
  in retrieved context, with a conversational persona ("Stella") instructed
  to ask follow-up questions, build on earlier turns, and handle small talk
  naturally rather than reading back facts. Each reply is returned as
  structured JSON (`{"reply": ..., "tone": ...}`, via OpenAI's strict
  `response_format` JSON schema mode) so the frontend can vary speech
  delivery instead of sounding flat on every line. Chosen over
  `gemini-3.5-flash` primarily to cut cost (DeepInfra is meaningfully
  cheaper per reply). Gemini is being phased out of Lampatron entirely and
  for now is scoped to embeddings/retrieval only (`embedding_client` in
  `rpcagent.py`) -- reply generation and the phone channel's audio
  transcription (now Whisper, see below) no longer touch it at all.
  - **No fallback if Qwen is slow/fails**: there used to be a short-timeout,
    fall-back-to-Gemini safety net here, but it was deliberately removed to
    keep Gemini embeddings-only per the current direction -- a slow or
    failed Qwen call now just fails the request instead of degrading to
    Gemini. DeepInfra's shared inference for this model showed real tail
    latency in testing (occasional 100+ second replies, not just the fixed
    ~20-30s "thinking mode" tax below), so this is a real known risk for
    WhatsApp/phone (Twilio's webhook has roughly a 15s timeout) until
    something else covers it.
  - **Critical config**: Qwen3.6 runs a hidden reasoning pass by default --
    300-450+ extra completion tokens and 20-30+ seconds per reply, confirmed
    by direct timing against this exact endpoint before this was found. That
    latency would silently break WhatsApp (Twilio's webhook has roughly a
    15s timeout) and phone calls (20-30s of dead air per turn). Fixed via
    `extra_body={"chat_template_kwargs": {"enable_thinking": False}}` on the
    completion call -- note the nesting: a flat `enable_thinking` kwarg (the
    parameter name most Qwen3 docs mention) did *not* work on this
    deployment, only the `chat_template_kwargs`-nested form did. With it,
    replies run 0.5-6s, in line with the old Gemini latency.
- **Browser UI** (`lampatron/voice_browser.py`) — a FastAPI page (port 7862)
  with a chat-bubble interface, a mic button, a text input fallback, and
  tone-to-pitch/rate mapping for less monotonous playback. Both voice
  directions now run server-side, locally, with no API cost (see below).
  - **Voice input** (`lampatron/whisper_stt.py`, `/stt-stream` WebSocket) —
    the mic button records audio via `MediaRecorder` and streams it live over
    a WebSocket for transcription by
    [faster-whisper](https://github.com/SYSTRAN/faster-whisper) (the `base`
    model, CPU/int8), instead of the browser's own `SpeechRecognition`.
    Genuinely multilingual (English/Arabic/Tagalog, auto-detected from the
    audio itself, no language hint needed) and works in any browser that can
    record audio -- not just Chrome/Edge. The model (~145MB) auto-downloads
    from Hugging Face Hub on first run, then stays cached.
    - **Live captions**: Whisper has no true incremental decode, so "live"
      means periodically re-transcribing the whole buffer received so far
      (roughly every 1 second of audio) and streaming that back as a growing
      caption bubble, finalized into the actual message once you stop.
      Transcription runs via `asyncio.to_thread` so it doesn't block the
      WebSocket from receiving new chunks while a partial is computing --
      without that, partials and the final result would arrive in a bunched
      burst instead of visibly spaced out. Auto-stops after ~1.2s of silence
      (a simple volume check, not a real VAD model) -- clicking the mic
      again also stops it early.
  - **English voice output** (`lampatron/kokoro_tts.py`, `/tts` route) —
    synthesized server-side by [Kokoro](https://github.com/hexgrad/kokoro), an
    82M-parameter open-source TTS model that runs locally. Voice is fixed to
    `af_heart` (a higher, more consistent quality than most OS/browser
    voices). The model (~340MB) auto-downloads from Hugging Face Hub on first
    run, then stays cached. If synthesis fails for any reason, the frontend
    falls back to browser `speechSynthesis` automatically.
  - **Arabic/Tagalog voice output** — still the browser's own
    `speechSynthesis` voices, since Kokoro has no voices for those languages.
    Defaults to a female-sounding voice via a name-based heuristic (the Web
    Speech API has no real gender field), quality depends entirely on what
    the visitor's OS/browser has installed.
  - **Languages**: Stella replies in English, Arabic, or Tagalog, auto-detected
    per message (each reply is tagged with the language it's written in); the
    frontend switches the TTS engine to match automatically. The language
    dropdown is now display-only (shows what was detected) since Whisper no
    longer needs a manual hint for voice input.
  - **Barge-in**: clicking the mic while Stella is still talking immediately
    stops whichever voice is currently playing (Kokoro's `<audio>` element or
    browser `speechSynthesis`) and starts recording, instead of talking over
    you.
- **Public tunnel** (`lampatron/ngrok_tunnel.py`) — a standalone script that
  exposes the already-running server on port 7862 via ngrok, independent of
  the app process so the public URL survives app restarts.
- **WhatsApp** (`/whatsapp-webhook` route inside `lampatron/voice_browser.py`)
  — a Twilio WhatsApp webhook in the same process/port as the browser page
  (the local Qdrant store is file-locked to one process, so this couldn't be
  a separate server).
- **Conversation memory**: each conversation is isolated and in-memory only,
  reset when the app process restarts.
  - Browser: a random session ID is generated client-side on first load and
    persisted in `localStorage`, so reloading the page continues the same
    conversation but a different browser/device always starts a fresh one.
  - WhatsApp: keyed by the sender's phone number instead.
  - There's no persistence across restarts and no auth on `/chat` -- fine for
    a demo, not for production.

FIT Institute has a separate, parallel agent under `apps/backend/fit/` on
port 7861, sharing the same `.venv` and `.env` but otherwise fully independent
(own knowledge base, own Qdrant collection).

## Prerequisites

`apps/backend/.env` must have:
```
GOOGLE_API_KEY=...
NGROK_TOKEN=...
DEEPINFRA_API_KEY=...
```

`pip install -r requirements.txt` now also pulls in Kokoro's dependencies
(`torch`, `transformers`, `misaki` for English text-to-phoneme conversion)
and faster-whisper's (`ctranslate2`, `av`) -- a noticeably heavier install
than the rest of the stack, though the two share most of their dependencies
already. The first time `voice_browser.py` starts afterward, it downloads
Kokoro's ~340MB model file and Whisper's ~145MB `base` model from Hugging
Face Hub; subsequent starts use the cached copies and are fast.

## Running it

Two separate terminals -- the app server and the tunnel are independent
processes on purpose, so restarting one never affects the other.

**Terminal 1 -- start the app server:**
```powershell
cd C:\Users\hisha\FIT\FIT-AI\apps\backend\lampatron
..\.venv\Scripts\python.exe voice_browser.py
```
Leave this running. It serves the chat page locally at `http://127.0.0.1:7862`.

**Terminal 2 -- start the public tunnel:**
```powershell
cd C:\Users\hisha\FIT\FIT-AI\apps\backend\lampatron
..\.venv\Scripts\python.exe ngrok_tunnel.py
```
It prints a public HTTPS URL (e.g. `https://<random>.ngrok-free.dev`) that
forwards to port 7862. Share that URL to let anyone with the link use the
agent from outside your machine.

## WhatsApp (Twilio Sandbox)

The webhook route lives on the same port as the browser page, so the tunnel
from "Running it" above already covers it -- no separate server or tunnel.

1. In the [Twilio Console](https://console.twilio.com), go to
   **Messaging → Try it out → Send a WhatsApp message** to open the Sandbox.
   It shows a sandbox number and a `join <code>` message.
2. From your own WhatsApp, send `join <code>` to that sandbox number.
3. Make sure `voice_browser.py` and `ngrok_tunnel.py` are both running (see
   "Running it").
4. Set the webhook: go to **Messaging → Settings → WhatsApp sandbox settings**
   (a separate page from "Try it out") and set **"When a message comes in"**
   to `https://<your-ngrok-url>/whatsapp-webhook`, method `POST`. Save.
   - **On a pure trial account, this page is fully gated behind an "upgrade
     your account" prompt** -- the Sandbox's custom-webhook feature isn't
     available until you add a payment method to Twilio (still pay-as-you-go
     afterward; trial credit still applies). There's no workaround for this
     from our side -- until upgraded, the sandbox only sends its own default
     auto-reply, no matter how the app/tunnel are configured.
5. Message the sandbox number from WhatsApp -- it replies using the same RAG
   pipeline as the browser chat.

Sandbox limitations: shared across everyone testing with Twilio, and a
joined number expires after ~72 hours of inactivity (just re-send `join`).
A real WhatsApp Business number for actual customers needs Meta Business
verification and template-message approval, which can take days.

## Stopping / restarting

**To clear conversation history** (in-memory, resets only on process restart)
**without changing the public ngrok URL** -- only restart the app server,
never the tunnel:
```powershell
# Find and stop the app server (leave the tunnel process alone)
Get-NetTCPConnection -LocalPort 7862 | Select-Object -ExpandProperty OwningProcess | ForEach-Object { Stop-Process -Id $_ -Force }

# Restart it
cd C:\Users\hisha\FIT\FIT-AI\apps\backend\lampatron
..\.venv\Scripts\python.exe voice_browser.py
```
The tunnel keeps forwarding to port 7862 throughout, so the same public URL
picks up the fresh process automatically once it's listening again.

**To stop the tunnel:** `Ctrl+C` in its terminal (Terminal 2). Note the free
ngrok URL is random per run -- stopping and restarting `ngrok_tunnel.py`
itself (not the app server) will give you a *different* public URL, unless
you've configured a reserved domain in your ngrok dashboard.

## Known limitations (by design, for a demo)

- Conversation history is per-session/per-sender but in-memory only -- it's
  lost on every app restart, and there's no way to look up past conversations.
- `/chat`, `/tts`, `/stt-stream`, and `/whatsapp-webhook` have no
  authentication or rate limiting -- every message is a billed DeepInfra
  call (reply generation) plus a billed Gemini call (embeddings), and every
  voice turn also costs local CPU time twice (transcribe via Whisper,
  synthesize via Kokoro for English replies).
- Reply generation now depends on DeepInfra's uptime/pricing in addition to
  Gemini's and Twilio's -- a third external vendor in the critical path for
  every single message, not just voice/WhatsApp.
- `/tts` and `/stt-stream` run on the same machine serving `/chat`, one
  request at a time (no GPU, no queue) -- fine for a single demo user, but
  concurrent visitors would start queuing behind each other's
  transcription/synthesis. Live captions make this worse, not better: since
  Whisper re-transcribes the whole growing buffer every ~2 seconds instead
  of once per utterance, a single voice turn now costs several Whisper
  calls, not one.
- Voice *input* now works in any browser that supports `MediaRecorder`
  (Chrome, Edge, Firefox, and Safari), not just Chrome/Edge like the old
  browser `SpeechRecognition` did. For Arabic/Tagalog voice *output*
  specifically, the "default female voice" is a name-based guess against
  browser voices, not a guarantee -- it only works if the OS/browser has a
  voice matching one of the known names.
- `whisper_stt.py` always writes the uploaded recording to a `.webm`-suffixed
  temp file regardless of what the browser actually recorded -- PyAV
  generally detects the real container from its contents rather than the
  extension, but an unusual browser/codec combination could still fail to
  decode.
- The free ngrok tier shows a one-time "click to visit" interstitial to new
  browser visitors, and the public URL changes every time the tunnel restarts
  (unless a reserved domain is configured).
- WhatsApp requires a Twilio account upgrade (adding a payment method) to set
  a custom incoming-message webhook -- on a pure trial account, the Sandbox
  Settings page needed for this is fully gated behind an upgrade prompt.
