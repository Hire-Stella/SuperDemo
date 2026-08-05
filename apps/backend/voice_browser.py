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
<html>
<head>
  <meta charset="utf-8">
  <title>FIT Institute Voice Assistant</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 640px; margin: 40px auto; padding: 0 16px; }
    #log { border: 1px solid #ccc; border-radius: 8px; padding: 12px; min-height: 200px; margin-bottom: 12px; white-space: pre-wrap; }
    button { font-size: 16px; padding: 10px 20px; cursor: pointer; }
    #status { color: #666; margin-left: 8px; }
  </style>
</head>
<body>
  <h2>FIT Institute Voice Assistant (browser STT/TTS)</h2>
  <div id="log"></div>
  <button id="talk">Hold to Talk</button>
  <span id="status"></span>

  <script>
    const log = document.getElementById("log");
    const status = document.getElementById("status");
    const talkBtn = document.getElementById("talk");

    function append(who, text) {
      log.textContent += who + ": " + text + "\\n\\n";
      log.scrollTop = log.scrollHeight;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      status.textContent = "SpeechRecognition not supported in this browser. Use Chrome or Edge.";
    }

    const recognition = SpeechRecognition ? new SpeechRecognition() : null;
    if (recognition) {
      recognition.lang = "en-US";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
    }

    let listening = false;

    talkBtn.addEventListener("click", () => {
      if (!recognition) return;
      if (listening) return;
      listening = true;
      status.textContent = "Listening...";
      recognition.start();
    });

    if (recognition) {
      recognition.onresult = async (event) => {
        const transcript = event.results[0][0].transcript;
        append("You", transcript);
        status.textContent = "Thinking...";

        const resp = await fetch("/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: transcript }),
        });
        const data = await resp.json();
        append("Bot", data.reply);
        status.textContent = "Speaking...";

        const utterance = new SpeechSynthesisUtterance(data.reply);
        utterance.onend = () => { status.textContent = ""; };
        speechSynthesis.speak(utterance);
      };

      recognition.onerror = (event) => {
        status.textContent = "Error: " + event.error;
        listening = false;
      };

      recognition.onend = () => {
        listening = false;
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


@app.get("/", response_class=HTMLResponse)
def index():
    return PAGE


@app.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest):
    reply = text_handler(req.text)
    print(f"\nUser: {req.text}\nBot : {reply}\n")
    return ChatResponse(reply=reply)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=7861)
