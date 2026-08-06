"""
Browser-based chat for Lampatron, mirroring ../fit/voice_browser.py's page
but pointed at the Lampatron knowledge base (./rpcagent.py). Runs on its own
port so both can be up at the same time.
"""

import sys

from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, Response
from pydantic import BaseModel
from twilio.twiml.messaging_response import MessagingResponse

from rpcagent import generate_reply

# Windows' default console codepage (cp1252) can't encode Arabic/Tagalog
# text -- without this, print()-ing a non-Latin-1 reply crashes with
# UnicodeEncodeError, which takes the whole /chat request down with it (the
# Gemini call itself succeeds; only the debug print statement was failing).
sys.stdout.reconfigure(encoding="utf-8", errors="replace")

app = FastAPI()

PAGE = """
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Lampatron Assistant</title>
  <style>
    :root {
      --brand: oklch(0.62 0.14 55);
      --brand-foreground: oklch(0.15 0.02 55);
      --bg: oklch(0.995 0.002 20);
      --fg: oklch(0.19 0.012 25);
      --muted: oklch(0.968 0.005 25);
      --muted-foreground: oklch(0.19 0.012 25 / 70%);
      --border: oklch(0.912 0.008 25);
      --card: oklch(1 0 0);
      --danger: oklch(0.47 0.17 20);
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --brand: oklch(0.72 0.135 55);
        --brand-foreground: oklch(0.15 0.02 55);
        --bg: oklch(0.165 0.008 25);
        --fg: oklch(0.965 0.004 25);
        --muted: oklch(0.262 0.011 25);
        --muted-foreground: oklch(0.965 0.004 25 / 70%);
        --border: oklch(1 0 0 / 12%);
        --card: oklch(0.2 0.008 25);
        --danger: oklch(0.62 0.19 22);
      }
    }
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, system-ui, "Segoe UI", Roboto, sans-serif;
      margin: 0;
      background: var(--bg);
      color: var(--fg);
      height: 100vh;
      display: flex;
      justify-content: center;
    }
    .app {
      width: 100%;
      max-width: 640px;
      height: 100vh;
      display: flex;
      flex-direction: column;
    }
    header {
      padding: 16px 20px;
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .logo {
      width: 38px;
      height: 38px;
      border-radius: 10px;
      background: var(--brand);
      color: var(--brand-foreground);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 20px;
      flex-shrink: 0;
    }
    header h1 {
      font-size: 15px;
      margin: 0;
      line-height: 1.3;
    }
    header p {
      font-size: 12px;
      margin: 0;
      color: var(--muted-foreground);
    }
    #log {
      flex: 1;
      overflow-y: auto;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .row { display: flex; }
    .row.user { justify-content: flex-end; }
    .row.bot { justify-content: flex-start; }
    .bubble {
      max-width: 78%;
      padding: 10px 14px;
      border-radius: 16px;
      font-size: 14.5px;
      line-height: 1.45;
      white-space: pre-wrap;
    }
    .row.user .bubble {
      background: var(--brand);
      color: var(--brand-foreground);
      border-bottom-right-radius: 4px;
    }
    .row.bot .bubble {
      background: var(--card);
      border: 1px solid var(--border);
      border-bottom-left-radius: 4px;
    }
    .row.system .bubble {
      background: transparent;
      color: var(--danger);
      border: 1px dashed var(--danger);
      font-size: 13px;
    }
    .typing {
      display: inline-flex;
      gap: 4px;
      align-items: center;
      padding: 4px 2px;
    }
    .typing span {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--muted-foreground);
      animation: bounce 1.2s infinite ease-in-out;
    }
    .typing span:nth-child(2) { animation-delay: 0.15s; }
    .typing span:nth-child(3) { animation-delay: 0.3s; }
    @keyframes bounce {
      0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
      40% { transform: scale(1); opacity: 1; }
    }
    #empty-hint {
      margin: auto;
      text-align: center;
      color: var(--muted-foreground);
      font-size: 13.5px;
      padding: 0 30px;
    }
    footer {
      padding: 14px 16px;
      border-top: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .input-bar {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    #text-input {
      flex: 1;
      border: 1px solid var(--border);
      background: var(--card);
      color: var(--fg);
      border-radius: 20px;
      padding: 10px 16px;
      font-size: 14.5px;
      outline: none;
    }
    #text-input:focus { border-color: var(--brand); }
    button.icon-btn {
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: background 0.15s, transform 0.1s;
    }
    #send-btn {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: var(--brand);
      color: var(--brand-foreground);
      font-size: 16px;
    }
    #send-btn:disabled { opacity: 0.4; cursor: default; }
    #mic-btn {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: var(--muted);
      color: var(--fg);
      font-size: 17px;
      position: relative;
    }
    #mic-btn.listening {
      background: var(--danger);
      color: white;
      animation: pulse-ring 1.4s infinite;
    }
    @keyframes pulse-ring {
      0%   { box-shadow: 0 0 0 0 color-mix(in oklch, var(--danger) 45%, transparent); }
      70%  { box-shadow: 0 0 0 12px color-mix(in oklch, var(--danger) 0%, transparent); }
      100% { box-shadow: 0 0 0 0 color-mix(in oklch, var(--danger) 0%, transparent); }
    }
    #mic-btn:disabled { opacity: 0.35; cursor: not-allowed; }
    .footer-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12px;
      color: var(--muted-foreground);
      padding: 0 4px;
    }
    .toggle {
      display: flex;
      align-items: center;
      gap: 6px;
      cursor: pointer;
      user-select: none;
    }
    #status-text { min-height: 16px; }
    #voice-select, #lang-select {
      font-size: 12px;
      max-width: 180px;
      border: 1px solid var(--border);
      background: var(--card);
      color: var(--fg);
      border-radius: 8px;
      padding: 3px 6px;
    }
  </style>
</head>
<body>
  <div class="app">
    <header>
      <div class="logo">&#128161;</div>
      <div>
        <h1>Lampatron Assistant</h1>
        <p>Ask about products, prices, shipping, or returns -- by voice or text</p>
      </div>
    </header>

    <div id="log">
      <div id="empty-hint">
        Tap the microphone and ask something like<br>
        "How much does the RADIANT chandelier cost?"
      </div>
    </div>

    <footer>
      <div class="footer-meta">
        <span id="status-text"></span>
        <label class="toggle">
          <input type="checkbox" id="speak-toggle" checked>
          Speak replies
        </label>
      </div>
      <div class="footer-meta">
        <select id="lang-select" title="Speech recognition language">
          <option value="en-US">English</option>
          <option value="ar-AE">&#1575;&#1604;&#1593;&#1585;&#1576;&#1610;&#1577; (Arabic)</option>
          <option value="fil-PH">Tagalog</option>
        </select>
        <select id="voice-select" title="Choose a voice"></select>
      </div>
      <div class="input-bar">
        <button id="mic-btn" class="icon-btn" title="Speak">&#127908;</button>
        <input id="text-input" type="text" placeholder="Type your question..." autocomplete="off">
        <button id="send-btn" class="icon-btn" title="Send">&#10148;</button>
      </div>
    </footer>
  </div>

  <script>
    const log = document.getElementById("log");
    const emptyHint = document.getElementById("empty-hint");
    const statusText = document.getElementById("status-text");
    const micBtn = document.getElementById("mic-btn");
    const sendBtn = document.getElementById("send-btn");
    const textInput = document.getElementById("text-input");
    const speakToggle = document.getElementById("speak-toggle");
    const voiceSelect = document.getElementById("voice-select");
    const langSelect = document.getElementById("lang-select");

    const savedLang = localStorage.getItem("lampatron-lang");
    if (savedLang) langSelect.value = savedLang;

    // Each browser/device gets its own conversation, isolated from every
    // other visitor (and from WhatsApp) -- generated once and persisted so
    // reloading the page continues the same conversation instead of losing
    // it, while a different browser/phone always gets a fresh random ID.
    let sessionId = localStorage.getItem("lampatron-session-id");
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      localStorage.setItem("lampatron-session-id", sessionId);
    }

    // ---- Voice picker (browser/OS voices, via speechSynthesis) ----
    // The Web Speech API has no real gender field, so "female" is a
    // name-based heuristic covering common voices across Windows/Chrome/macOS
    // -- good enough to default Stella to a female-sounding voice without
    // forcing you into one if you pick a different voice yourself.
    const FEMALE_VOICE_HINTS = [
      "female", "zira", "hazel", "susan", "samantha", "victoria", "karen",
      "moira", "tessa", "fiona", "linda", "heera", "salli", "joanna",
      "kimberly", "amy", "emma", "ivy", "aria", "jenny", "michelle", "ana",
      "sara", "nanami", "libby", "olivia",
    ];
    function isLikelyFemaleVoice(voice) {
      const name = voice.name.toLowerCase();
      return FEMALE_VOICE_HINTS.some((hint) => name.includes(hint));
    }

    let availableVoices = [];
    function populateVoices() {
      availableVoices = speechSynthesis.getVoices();
      if (!availableVoices.length) return;
      const saved = localStorage.getItem("lampatron-voice-name");
      voiceSelect.innerHTML = "";
      availableVoices
        .slice()
        .sort((a, b) => Number(b.lang.startsWith("en")) - Number(a.lang.startsWith("en")))
        .forEach((v) => {
          const opt = document.createElement("option");
          opt.value = v.name;
          opt.textContent = v.name + " (" + v.lang + ")";
          voiceSelect.appendChild(opt);
        });
      if (saved && availableVoices.some((v) => v.name === saved)) {
        voiceSelect.value = saved;
      } else {
        // No preference saved yet -- default to a female-sounding English
        // voice instead of whatever the browser happens to list first.
        const defaultFemale = availableVoices.find(
          (v) => v.lang.startsWith("en") && isLikelyFemaleVoice(v)
        );
        if (defaultFemale) voiceSelect.value = defaultFemale.name;
      }
    }
    if ("speechSynthesis" in window) {
      populateVoices();
      speechSynthesis.onvoiceschanged = populateVoices;
    }
    voiceSelect.addEventListener("change", () => {
      localStorage.setItem("lampatron-voice-name", voiceSelect.value);
    });

    // Browser TTS has no real emotion, just rate/pitch/volume -- these presets
    // (matched to the "tone" tag the backend returns with each reply) at least
    // keep it from sounding identically flat on every single line.
    const TONE_PRESETS = {
      friendly: { rate: 1.0, pitch: 1.0 },
      excited: { rate: 1.08, pitch: 1.15 },
      apologetic: { rate: 0.92, pitch: 0.9 },
      calm_informative: { rate: 0.96, pitch: 1.0 },
    };

    // Matches rpcagent.py's LANGUAGES dict -- the backend detects the
    // customer's language every turn, so voice input/output can follow
    // automatically instead of needing a manual language picker.
    const LANG_TO_BCP47 = { en: "en-US", ar: "ar-AE", tl: "fil-PH" };

    function scrollToBottom() {
      log.scrollTop = log.scrollHeight;
    }

    function addBubble(role, text) {
      emptyHint.remove();
      const row = document.createElement("div");
      row.className = "row " + role;
      const bubble = document.createElement("div");
      bubble.className = "bubble";
      bubble.textContent = text;
      row.appendChild(bubble);
      log.appendChild(row);
      scrollToBottom();
      return row;
    }

    function addTyping() {
      const row = addBubble("bot", "");
      row.querySelector(".bubble").innerHTML = "<div class='typing'><span></span><span></span><span></span></div>";
      return row;
    }

    async function sendToBot(text) {
      const typingRow = addTyping();
      statusText.textContent = "Thinking...";
      try {
        const resp = await fetch("/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, session_id: sessionId }),
        });
        if (!resp.ok) throw new Error("Server error (" + resp.status + ")");
        const data = await resp.json();
        typingRow.remove();
        addBubble("bot", data.reply);

        // Auto-switch voice input/output to whichever language the backend
        // just detected -- the dropdown still lets you override manually,
        // but nothing needs to be picked by hand for this to keep working.
        const bcp47 = LANG_TO_BCP47[data.language] || "en-US";
        langSelect.value = bcp47;
        if (recognition) recognition.lang = bcp47;

        if (speakToggle.checked && "speechSynthesis" in window) {
          statusText.textContent = "Speaking...";
          const utterance = new SpeechSynthesisUtterance(data.reply);
          utterance.lang = bcp47;
          // A voice saved for a different language (e.g. an English voice
          // picked earlier) won't speak this reply -- most browsers just stay
          // silent instead of erroring, which is why non-English replies can
          // go mute after picking a voice once. Only honor the saved pick
          // when it actually matches this reply's language; otherwise fall
          // back to any installed voice for that language.
          const langPrefix = bcp47.split("-")[0];
          const manualVoice = availableVoices.find((v) => v.name === voiceSelect.value);
          const langVoices = availableVoices.filter((v) => v.lang.startsWith(langPrefix));
          // Prefer a female-sounding voice among this language's options so
          // switching to Arabic/Tagalog doesn't fall back to a male voice.
          const fallbackVoice = langVoices.find(isLikelyFemaleVoice) || langVoices[0];
          const chosenVoice = manualVoice && manualVoice.lang.startsWith(langPrefix)
            ? manualVoice
            : fallbackVoice;
          if (chosenVoice) {
            utterance.voice = chosenVoice;
          } else {
            console.warn("No installed voice for language:", bcp47);
          }
          const preset = TONE_PRESETS[data.tone] || TONE_PRESETS.friendly;
          utterance.rate = preset.rate;
          utterance.pitch = preset.pitch;
          utterance.onend = () => { statusText.textContent = ""; };
          utterance.onerror = () => { statusText.textContent = ""; };
          speechSynthesis.speak(utterance);
        } else {
          statusText.textContent = "";
        }
      } catch (err) {
        typingRow.remove();
        addBubble("system", "Couldn't reach the assistant: " + err.message);
        statusText.textContent = "";
      }
    }

    // ---- Text input path (always available) ----
    function submitText() {
      const text = textInput.value.trim();
      if (!text) return;
      addBubble("user", text);
      textInput.value = "";
      sendToBot(text);
    }
    sendBtn.addEventListener("click", submitText);
    textInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") submitText();
    });

    // ---- Voice input path ----
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = SpeechRecognition ? new SpeechRecognition() : null;

    if (!recognition) {
      micBtn.disabled = true;
      micBtn.title = "Speech recognition isn't supported in this browser -- try Chrome or Edge";
    } else {
      recognition.lang = langSelect.value;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
    }

    // Manual override -- auto-switching (in sendToBot) covers most turns, but
    // this lets you jump straight to a language before saying anything, or
    // correct a wrong auto-detection.
    langSelect.addEventListener("change", () => {
      localStorage.setItem("lampatron-lang", langSelect.value);
      if (recognition) recognition.lang = langSelect.value;
    });

    let listening = false;

    micBtn.addEventListener("click", () => {
      if (!recognition || listening) return;
      // Barge-in: if the assistant is still talking, cut it off immediately
      // instead of letting it keep playing over your next question.
      // speechSynthesis.cancel() doesn't reliably fire onend across browsers,
      // so clear the status text here rather than relying on that callback.
      if ("speechSynthesis" in window && speechSynthesis.speaking) {
        speechSynthesis.cancel();
      }
      listening = true;
      micBtn.classList.add("listening");
      statusText.textContent = "Listening...";
      recognition.start();
    });

    if (recognition) {
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        addBubble("user", transcript);
        sendToBot(transcript);
      };

      recognition.onerror = (event) => {
        statusText.textContent = "";
        if (event.error !== "aborted" && event.error !== "no-speech") {
          addBubble("system", "Microphone error: " + event.error);
        }
      };

      recognition.onend = () => {
        listening = false;
        micBtn.classList.remove("listening");
      };
    }
  </script>
</body>
</html>
"""


class ChatRequest(BaseModel):
    text: str
    session_id: str = "default"


class ChatResponse(BaseModel):
    reply: str
    tone: str = "friendly"
    language: str = "en"


@app.get("/", response_class=HTMLResponse)
def index():
    return PAGE


# Each browser session gets its own history, keyed by the client-generated
# session_id (see the frontend's "lampatron-session-id" in localStorage) --
# otherwise every visitor would share one global conversation.
browser_conversations: dict[str, list[dict]] = {}


@app.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest):
    history = browser_conversations.setdefault(req.session_id, [])
    history.append({"role": "user", "text": req.text})
    result = generate_reply(history)
    history.append({"role": "assistant", "text": result["text"]})
    print(f"\n[{req.session_id}] User: {req.text}\nBot [{result['tone']}/{result['language']}]: {result['text']}\n")
    return ChatResponse(reply=result["text"], tone=result["tone"], language=result["language"])


# ============================================================
# WhatsApp (Twilio) webhook
# ============================================================
# Lives in this same process/port rather than a separate server: the local
# Qdrant store rag.py opens is file-locked to a single process, and this one
# already holds it. Same per-conversation isolation as the browser chat
# above, just keyed by the sender's WhatsApp number instead of a session_id.
whatsapp_conversations: dict[str, list[dict]] = {}


@app.get("/whatsapp-webhook")
def whatsapp_webhook_check():
    """Some webhook UIs ping the URL with a GET before saving it -- without
    this, that preflight got a 405 (POST-only route), which may be why the
    saved webhook wasn't taking effect."""
    return Response(content="OK", media_type="text/plain")


@app.post("/whatsapp-webhook")
async def whatsapp_webhook(request: Request):
    form = await request.form()
    sender = form.get("From", "unknown")
    user_text = (form.get("Body") or "").strip()

    twiml = MessagingResponse()
    if not user_text:
        return Response(content=str(twiml), media_type="application/xml")

    history = whatsapp_conversations.setdefault(sender, [])
    history.append({"role": "user", "text": user_text})
    result = generate_reply(history)
    history.append({"role": "assistant", "text": result["text"]})

    print(f"\n{sender}: {user_text}\nBot [{result['tone']}/{result['language']}]: {result['text']}\n")

    twiml.message(result["text"])
    return Response(content=str(twiml), media_type="application/xml")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=7862)
