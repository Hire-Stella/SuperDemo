"""
Browser-based voice mode: no Gemini audio calls, no ElevenLabs subscription.

The page uses the browser's built-in Web Speech API -- SpeechRecognition for
STT and SpeechSynthesis for TTS, both running client-side in Chrome/Edge for
free. The transcript is sent here as plain text, run through the existing
LangGraph RAG agent, and the reply text is sent back for the browser to speak.
"""

from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from pydantic import BaseModel

from rpcagent import text_handler

app = FastAPI()

PAGE = """
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>FIT Institute Voice Assistant</title>
  <style>
    :root {
      --brand: oklch(0.53 0.204 26);
      --brand-foreground: oklch(0.98 0.005 25);
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
        --brand: oklch(0.7 0.185 26);
        --brand-foreground: oklch(0.15 0.01 25);
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
      font-size: 15px;
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
      box-shadow: 0 0 0 0 color-mix(in oklch, var(--danger) 55%, transparent);
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
    #voice-select {
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
      <div class="logo">FIT</div>
      <div>
        <h1>FIT Institute Voice Assistant</h1>
        <p>Ask about courses, fees, or admissions -- by voice or text</p>
      </div>
    </header>

    <div id="log">
      <div id="empty-hint">
        Tap the microphone and ask something like<br>
        "How much does the ABA certification cost?"
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

    // ---- Voice picker (browser/OS voices, via speechSynthesis) ----
    let availableVoices = [];
    function populateVoices() {
      availableVoices = speechSynthesis.getVoices();
      if (!availableVoices.length) return;
      const saved = localStorage.getItem("fit-voice-name");
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
      }
    }
    if ("speechSynthesis" in window) {
      populateVoices();
      speechSynthesis.onvoiceschanged = populateVoices;
    }
    voiceSelect.addEventListener("change", () => {
      localStorage.setItem("fit-voice-name", voiceSelect.value);
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
          body: JSON.stringify({ text }),
        });
        if (!resp.ok) throw new Error("Server error (" + resp.status + ")");
        const data = await resp.json();
        typingRow.remove();
        addBubble("bot", data.reply);

        if (speakToggle.checked && "speechSynthesis" in window) {
          statusText.textContent = "Speaking...";
          const utterance = new SpeechSynthesisUtterance(data.reply);
          const chosenVoice = availableVoices.find((v) => v.name === voiceSelect.value);
          if (chosenVoice) utterance.voice = chosenVoice;
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
      recognition.lang = "en-US";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
    }

    let listening = false;

    micBtn.addEventListener("click", () => {
      if (!recognition || listening) return;
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


class ChatResponse(BaseModel):
    reply: str
    tone: str = "friendly"


@app.get("/", response_class=HTMLResponse)
def index():
    return PAGE


@app.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest):
    result = text_handler(req.text)
    print(f"\nUser: {req.text}\nBot [{result['tone']}]: {result['text']}\n")
    return ChatResponse(reply=result["text"], tone=result["tone"])


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=7861)
