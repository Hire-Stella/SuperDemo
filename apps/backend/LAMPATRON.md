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
- **Reply generation** (`lampatron/rpcagent.py`) — a Gemini chat model
  (`gemini-3.5-flash`) grounded in retrieved context, with a conversational
  persona ("Stella") instructed to ask follow-up questions, build on earlier
  turns, and handle small talk naturally rather than reading back facts. Each
  reply is returned as structured JSON (`{"reply": ..., "tone": ...}`,
  schema-validated via pydantic) so the frontend can vary speech delivery
  instead of sounding flat on every line.
- **Browser UI** (`lampatron/voice_browser.py`) — a FastAPI page (port 7862)
  with a chat-bubble interface, a mic button (browser `SpeechRecognition` for
  STT), a text input fallback, a voice picker (browser `speechSynthesis`
  voices, defaulting to a female-sounding voice via a name-based heuristic --
  the Web Speech API has no real gender field), and tone-to-pitch/rate mapping
  for less monotonous playback. All STT/TTS runs client-side in the browser --
  no Gemini audio calls, no per-request cost for voice.
  - **Languages**: Stella replies in English, Arabic, or Tagalog, auto-detected
    per message (each reply is tagged with the language it's written in); the
    frontend switches `SpeechRecognition`/`speechSynthesis` to match
    automatically. A dropdown lets you override manually.
  - **Barge-in**: clicking the mic while Stella is still talking immediately
    cancels the current speech and starts listening, instead of talking over
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
```

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
- `/chat` and `/whatsapp-webhook` have no authentication or rate limiting --
  every message is a billed Gemini API call.
- Browser TTS/STT quality depends entirely on the visitor's own browser/OS
  (Chrome/Edge recommended; Web Speech API isn't supported in Firefox/Safari).
  The "default female voice" is a name-based guess, not a guarantee -- it
  only works if the OS/browser has a voice matching one of the known names.
- The free ngrok tier shows a one-time "click to visit" interstitial to new
  browser visitors, and the public URL changes every time the tunnel restarts
  (unless a reserved domain is configured).
- WhatsApp requires a Twilio account upgrade (adding a payment method) to set
  a custom incoming-message webhook -- on a pure trial account, the Sandbox
  Settings page needed for this is fully gated behind an upgrade prompt.
