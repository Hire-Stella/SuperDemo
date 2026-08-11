"""
Browser-based chat for Lampatron, mirroring ../fit/voice_browser.py's page
but pointed at the Lampatron knowledge base (./rpcagent.py). Runs on its own
port so both can be up at the same time.
"""

import asyncio
import audioop
import base64
import json
import sys
import wave
from io import BytesIO

from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse, Response
from pydantic import BaseModel
from twilio.twiml.messaging_response import MessagingResponse
from twilio.twiml.voice_response import Connect, VoiceResponse

from kokoro_tts import synthesize as synthesize_speech
from kokoro_tts import synthesize_pcm16
from rpcagent import generate_reply
from whisper_stt import transcribe as transcribe_speech

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
    .row.interim .bubble {
      opacity: 0.55;
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
        <select id="lang-select" title="Detected reply language">
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

    // Kokoro (server-side, English only) plays through a real <audio>
    // element -- unlike speechSynthesis, which has no object to hold onto
    // for barge-in, this one needs to be pausable from the mic handler below.
    const kokoroAudio = new Audio();

    function speakWithBrowserTTS(data, bcp47) {
      if (!("speechSynthesis" in window)) {
        statusText.textContent = "";
        return;
      }
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
    }

    // English replies get Kokoro's higher-quality voice (server-side, see
    // /tts); Arabic/Tagalog fall back to the browser's own speechSynthesis
    // since Kokoro has no voices for those languages.
    async function speakReply(data, bcp47) {
      if (data.language !== "en") {
        speakWithBrowserTTS(data, bcp47);
        return;
      }
      statusText.textContent = "Speaking...";
      try {
        const preset = TONE_PRESETS[data.tone] || TONE_PRESETS.friendly;
        const resp = await fetch("/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: data.reply, speed: preset.rate }),
        });
        if (!resp.ok) throw new Error("TTS error (" + resp.status + ")");
        const blob = await resp.blob();
        kokoroAudio.src = URL.createObjectURL(blob);
        kokoroAudio.onended = () => { statusText.textContent = ""; };
        kokoroAudio.onerror = () => { statusText.textContent = ""; };
        await kokoroAudio.play();
      } catch (err) {
        console.warn("Kokoro TTS failed, falling back to browser voice:", err);
        speakWithBrowserTTS(data, bcp47);
      }
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

        // Auto-switch voice output to whichever language the backend just
        // detected -- the dropdown is display-only now (Whisper auto-detects
        // input language itself, no manual hint needed).
        const bcp47 = LANG_TO_BCP47[data.language] || "en-US";
        langSelect.value = bcp47;

        if (speakToggle.checked) {
          speakReply(data, bcp47);
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
    // Streams audio to /stt-stream (faster-whisper, see whisper_stt.py) over
    // a WebSocket, showing a live growing caption while you're still
    // talking, instead of the browser's own SpeechRecognition or a single
    // upload-after-stop request. Works in any browser that can record audio
    // (not just Chrome/Edge), and Whisper auto-detects the spoken language
    // itself, so the language dropdown no longer needs to hint it (still
    // updated after each reply to show what Stella detected).
    const micSupported = !!(
      navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder
    );

    if (!micSupported) {
      micBtn.disabled = true;
      micBtn.title = "Voice recording isn't supported in this browser";
    }

    langSelect.addEventListener("change", () => {
      localStorage.setItem("lampatron-lang", langSelect.value);
    });

    let recording = false;
    let startingUp = false; // true from the first click until startRecording() finishes setup
    let mediaRecorder = null;
    let sttSocket = null;
    let captionRow = null; // the in-progress "user" bubble being live-updated

    let silenceCheckInterval = null;
    let vadAudioContext = null;

    // Unlike the old SpeechRecognition, MediaRecorder has no built-in
    // "stopped talking" detection -- without this, recording would only end
    // on a second manual click, which reads as the mic being stuck on.
    // These thresholds approximate the old auto-stop feel via a simple
    // volume check instead of a real VAD model.
    const SILENCE_THRESHOLD = 8;      // 0-255 amplitude scale; below this counts as quiet
    const SILENCE_DURATION_MS = 1200; // stop after this much continuous quiet
    const MIN_RECORD_MS = 400;        // ignore silence checks right after start
    const MAX_RECORD_MS = 20000;      // hard cap in case silence is never detected

    function updateCaption(text, isFinal) {
      if (!text) {
        if (isFinal && captionRow) {
          captionRow.remove();
          captionRow = null;
        }
        return;
      }
      if (!captionRow) {
        captionRow = addBubble("user", text);
        captionRow.classList.add("interim");
      } else {
        captionRow.querySelector(".bubble").textContent = text;
        // addBubble() scrolls on creation, but this branch updates an
        // existing bubble's text directly without going through it -- as
        // the caption grows across lines, the log wouldn't follow it,
        // which is what made it look like the text vanished mid-recording
        // (it hadn't; it had just scrolled out of view).
        scrollToBottom();
      }
      if (isFinal) {
        captionRow.classList.remove("interim");
        captionRow = null;
      }
    }

    function stopRecording() {
      if (!recording) return;
      recording = false;
      micBtn.classList.remove("listening");
      mediaRecorder.stop();
    }

    async function startRecording() {
      if (recording || startingUp) return;
      startingUp = true;

      // Barge-in: if the assistant is still talking, cut it off immediately
      // instead of letting it keep playing over your next question. Covers
      // both playback paths -- speechSynthesis (ar/tl) and Kokoro's <audio>
      // element (en) -- since either could be the one currently speaking.
      // speechSynthesis.cancel() doesn't reliably fire onend across browsers,
      // so clear the status text here rather than relying on that callback.
      if ("speechSynthesis" in window && speechSynthesis.speaking) {
        speechSynthesis.cancel();
      }
      if (!kokoroAudio.paused) {
        kokoroAudio.pause();
        kokoroAudio.currentTime = 0;
      }

      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (err) {
        startingUp = false;
        addBubble("system", "Microphone access failed: " + err.message);
        return;
      }

      const wsProtocol = location.protocol === "https:" ? "wss:" : "ws:";
      sttSocket = new WebSocket(wsProtocol + "//" + location.host + "/stt-stream");

      sttSocket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === "partial") {
          updateCaption(data.text, false);
        } else if (data.type === "final") {
          const finalText = (data.text || "").trim();
          updateCaption(finalText, true);
          if (finalText) {
            sendToBot(finalText);
          } else {
            statusText.textContent = "";
          }
          sttSocket.close();
          sttSocket = null;
        }
      };

      // First use is just to unblock the "wait for open" below without
      // hanging forever if the socket never connects; reassigned afterward
      // to handle errors during an actual in-progress recording.
      let opened = false;
      await new Promise((resolve) => {
        sttSocket.onopen = () => { opened = true; resolve(); };
        sttSocket.onerror = () => resolve();
      });
      if (!opened) {
        startingUp = false;
        stream.getTracks().forEach((track) => track.stop());
        addBubble("system", "Couldn't reach the transcription service.");
        return;
      }
      sttSocket.onerror = () => {
        statusText.textContent = "";
        addBubble("system", "Transcription connection lost.");
      };

      mediaRecorder = new MediaRecorder(stream);
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0 && sttSocket && sttSocket.readyState === WebSocket.OPEN) {
          sttSocket.send(e.data);
        }
      };
      mediaRecorder.onstop = () => {
        clearInterval(silenceCheckInterval);
        silenceCheckInterval = null;
        if (vadAudioContext) {
          vadAudioContext.close();
          vadAudioContext = null;
        }
        stream.getTracks().forEach((track) => track.stop());
        statusText.textContent = "Transcribing...";
        if (sttSocket && sttSocket.readyState === WebSocket.OPEN) {
          sttSocket.send(JSON.stringify({ event: "stop" }));
        }
      };
      // 500ms timeslice -- fires ondataavailable periodically while
      // recording instead of only once at the end, which is what lets the
      // caption grow live instead of only appearing after you stop. Short
      // enough that even a brief utterance (auto-stop needs >=1.6s: 400ms
      // MIN_RECORD_MS + 1200ms trailing silence) gets at least one visible
      // partial before the final result arrives.
      mediaRecorder.start(500);

      recording = true;
      startingUp = false;
      micBtn.classList.add("listening");
      statusText.textContent = "Listening... (click mic to stop early)";

      vadAudioContext = new (window.AudioContext || window.webkitAudioContext)();
      const source = vadAudioContext.createMediaStreamSource(stream);
      const analyser = vadAudioContext.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);
      const samples = new Uint8Array(analyser.frequencyBinCount);

      const startedAt = Date.now();
      let silenceStartedAt = null;

      silenceCheckInterval = setInterval(() => {
        const elapsed = Date.now() - startedAt;
        if (elapsed >= MAX_RECORD_MS) {
          stopRecording();
          return;
        }
        if (elapsed < MIN_RECORD_MS) return;

        analyser.getByteTimeDomainData(samples);
        let sumSquares = 0;
        for (let i = 0; i < samples.length; i++) {
          const deviation = samples[i] - 128;
          sumSquares += deviation * deviation;
        }
        const amplitude = Math.sqrt(sumSquares / samples.length);

        if (amplitude < SILENCE_THRESHOLD) {
          if (silenceStartedAt === null) silenceStartedAt = Date.now();
          else if (Date.now() - silenceStartedAt >= SILENCE_DURATION_MS) {
            stopRecording();
          }
        } else {
          silenceStartedAt = null;
        }
      }, 100);
    }

    micBtn.addEventListener("click", () => {
      if (!micSupported) return;
      if (recording) {
        stopRecording();
      } else if (!startingUp) {
        startRecording();
      }
      // else: a click landed while startup (mic permission / socket
      // connect) was still in flight -- ignored rather than firing a
      // second startRecording(), which used to race and corrupt the
      // shared mediaRecorder/sttSocket state (the bug behind STT
      // "randomly" not triggering).
    });
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


class TTSRequest(BaseModel):
    text: str
    speed: float = 1.0


@app.get("/", response_class=HTMLResponse)
def index():
    return PAGE


@app.post("/tts")
def tts(req: TTSRequest):
    """English-only voice synthesis via Kokoro (see kokoro_tts.py) -- Arabic
    and Tagalog replies are spoken by the browser's own speechSynthesis
    instead, since Kokoro doesn't have voices for those languages."""
    audio_bytes = synthesize_speech(req.text, speed=req.speed)
    return Response(content=audio_bytes, media_type="audio/wav")


@app.websocket("/stt-stream")
async def stt_stream(websocket: WebSocket):
    """Live-caption voice input via faster-whisper (see whisper_stt.py): the
    browser streams audio chunks as they're recorded (MediaRecorder with a
    timeslice) instead of uploading one blob after stopping. Whisper has no
    real incremental decode, so "live" here means periodically
    re-transcribing the whole buffer received so far -- more CPU than a
    single batch transcription, but it's what lets the caption grow while
    you're still talking instead of only appearing once you stop."""
    await websocket.accept()
    audio_buffer = bytearray()
    chunks_since_last_partial = 0

    try:
        while True:
            message = await websocket.receive()
            if message["type"] == "websocket.disconnect":
                break

            chunk = message.get("bytes")
            if chunk is not None:
                audio_buffer.extend(chunk)
                chunks_since_last_partial += 1
                # Re-transcribing on every single chunk would cost far more
                # CPU than it's worth -- every 2nd chunk (~1s of audio, given
                # the frontend's 500ms timeslice) balances "feels live"
                # against not pegging the CPU on repeated full-buffer
                # re-decodes. asyncio.to_thread matters here, not just for
                # throughput: transcribe_speech() is a blocking CPU call, and
                # running it directly would freeze this whole coroutine (and
                # therefore stop reading new chunks) until it returns --
                # chunks would then arrive in a delayed burst right on top of
                # the final result instead of steadily, which is why partial
                # captions were never visible before this.
                if chunks_since_last_partial >= 2:
                    chunks_since_last_partial = 0
                    text = await asyncio.to_thread(transcribe_speech, bytes(audio_buffer))
                    await websocket.send_json({"type": "partial", "text": text})
                continue

            control_message = message.get("text")
            if control_message is not None:
                control = json.loads(control_message)
                if control.get("event") == "stop":
                    final_text = (
                        await asyncio.to_thread(transcribe_speech, bytes(audio_buffer))
                        if audio_buffer else ""
                    )
                    await websocket.send_json({"type": "final", "text": final_text})
                    break

    except WebSocketDisconnect:
        pass


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


# ============================================================
# Phone calls (Twilio Voice + Media Streams)
# ============================================================
# Also in this same process/port -- same reason as WhatsApp above, plus it
# reuses genai_client/generate_reply from rpcagent.py. Voice output is
# English-only via Kokoro (see kokoro_tts.py): if a caller speaks Arabic or
# Tagalog, Stella's reply text would still be in that language (generate_reply
# still auto-detects), but Kokoro will mispronounce it -- there's no
# same-call fallback the way the browser has, so this channel is scoped to
# English callers for now.


@app.api_route("/incoming-call", methods=["GET", "POST"])
async def incoming_call(request: Request):
    """Twilio hits this when a call comes in."""
    response = VoiceResponse()
    response.say("Hello! Connecting you to Stella.", voice="Polly.Joanna")

    host = request.url.hostname
    connect = Connect()
    connect.stream(url=f"wss://{host}/media-stream")
    response.append(connect)

    return Response(content=str(response), media_type="application/xml")


@app.websocket("/media-stream")
async def media_stream(websocket: WebSocket):
    await websocket.accept()
    print("Twilio Media Stream connected")

    stream_sid = None
    audio_buffer = bytearray()
    call_history: list[dict] = []  # per-call, isolated from other calls

    try:
        async for message in websocket.iter_text():
            data = json.loads(message)
            event = data.get("event")

            if event == "start":
                stream_sid = data["start"]["streamSid"]
                print(f"Stream started: {stream_sid}")

            elif event == "media":
                chunk = base64.b64decode(data["media"]["payload"])
                audio_buffer.extend(chunk)

                # Simple ~2-second buffering instead of real silence detection
                # -- matches fit/voiceagent.py's approach.
                if len(audio_buffer) > 16000:
                    await process_call_turn(websocket, stream_sid, bytes(audio_buffer), call_history)
                    audio_buffer.clear()

            elif event == "stop":
                print("Stream stopped")
                break

    except WebSocketDisconnect:
        print("WebSocket disconnected")


async def process_call_turn(websocket: WebSocket, stream_sid: str,
                             audio_mulaw: bytes, history: list[dict]) -> None:
    """STT (Whisper) -> RAG (generate_reply) -> TTS (Kokoro) for one turn."""

    # Twilio phone audio is mulaw 8kHz -> convert to linear PCM 16kHz for
    # Whisper's transcription call.
    pcm_8k = audioop.ulaw2lin(audio_mulaw, 2)
    pcm_16k, _ = audioop.ratecv(pcm_8k, 2, 1, 8000, 16000, None)

    wav_buffer = BytesIO()
    with wave.open(wav_buffer, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(16000)
        wf.writeframes(pcm_16k)

    # asyncio.to_thread: transcribe_speech() is a blocking CPU call --
    # running it directly would freeze this coroutine (and the whole
    # WebSocket loop reading the next audio chunk) until it returns. Same
    # fix, same reason, as /stt-stream's live captions above.
    user_text = (await asyncio.to_thread(transcribe_speech, wav_buffer.getvalue())).strip()
    if not user_text or len(user_text) < 3:
        return

    history.append({"role": "user", "text": user_text})
    result = generate_reply(history)
    reply_text = result["text"]
    history.append({"role": "assistant", "text": reply_text})
    print(f"\n[call {stream_sid}] User: {user_text}\nStella: {reply_text}\n")

    if not reply_text.strip():
        return

    # Kokoro synthesizes at 24kHz PCM -> resample to 8kHz -> mulaw for Twilio.
    pcm_24k = synthesize_pcm16(reply_text)
    pcm_8k_out, _ = audioop.ratecv(pcm_24k, 2, 1, 24000, 8000, None)
    mulaw_audio = audioop.lin2ulaw(pcm_8k_out, 2)

    # Send back in 20ms chunks (160 bytes of mulaw) for real-time pacing.
    chunk_size = 160
    for i in range(0, len(mulaw_audio), chunk_size):
        chunk = mulaw_audio[i:i + chunk_size]
        await websocket.send_json({
            "event": "media",
            "streamSid": stream_sid,
            "media": {"payload": base64.b64encode(chunk).decode("utf-8")},
        })
        await asyncio.sleep(0.02)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=7862)
