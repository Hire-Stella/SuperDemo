import asyncio
import audioop
import base64
import json
import wave
from io import BytesIO

from dotenv import load_dotenv
from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect
from fastapi.responses import Response
from google.genai import types as genai_types
from twilio.twiml.voice_response import Connect, VoiceResponse

from rpcagent import generate_content_with_retries, generate_reply

load_dotenv()

app = FastAPI()

# ============================================================
# 1. Twilio Incoming Call Webhook
# ============================================================

@app.api_route("/incoming-call", methods=["GET", "POST"])
async def incoming_call(request: Request):
    """Twilio hits this when a call comes in."""
    response = VoiceResponse()

    # Optional greeting
    response.say("Hello! Connecting you to the AI assistant.", voice="Polly.Joanna")

    # Connect to our WebSocket Media Stream
    host = request.url.hostname
    connect = Connect()
    connect.stream(url=f"wss://{host}/media-stream")
    response.append(connect)

    return Response(content=str(response), media_type="application/xml")

# ============================================================
# 2. Media Stream WebSocket (core of the pipeline)
# ============================================================

@app.websocket("/media-stream")
async def media_stream(websocket: WebSocket):
    await websocket.accept()
    print("Twilio Media Stream connected")

    stream_sid = None
    audio_buffer = bytearray()
    call_history = []  # per-call conversation, isolated from other calls

    try:
        async for message in websocket.iter_text():
            data = json.loads(message)
            event = data.get("event")

            if event == "start":
                stream_sid = data["start"]["streamSid"]
                print(f"Stream started: {stream_sid}")

            elif event == "media":
                # Incoming audio from caller (mulaw 8kHz)
                payload = data["media"]["payload"]
                chunk = base64.b64decode(payload)
                audio_buffer.extend(chunk)

                # Simple VAD-ish trigger: process every ~2 seconds of audio
                # (In production use proper silence detection or streaming STT)
                if len(audio_buffer) > 16000:  # ~2 seconds
                    await process_audio_turn(
                        websocket, stream_sid, bytes(audio_buffer), call_history
                    )
                    audio_buffer.clear()

            elif event == "stop":
                print("Stream stopped")
                break

    except WebSocketDisconnect:
        print("WebSocket disconnected")


async def process_audio_turn(websocket: WebSocket, stream_sid: str,
                              audio_mulaw: bytes, history: list):
    """STT -> RAG -> TTS pipeline for one turn"""

    # ---------- 1. Speech-to-Text (Gemini audio understanding) ----------
    # Convert mulaw 8kHz -> linear PCM 16kHz
    pcm_8k = audioop.ulaw2lin(audio_mulaw, 2)
    pcm_16k, _ = audioop.ratecv(pcm_8k, 2, 1, 8000, 16000, None)

    wav_buffer = BytesIO()
    with wave.open(wav_buffer, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(16000)
        wf.writeframes(pcm_16k)
    wav_bytes = wav_buffer.getvalue()

    print("Transcribing with Gemini...")
    transcript = generate_content_with_retries(
        model="gemini-3.5-flash",
        contents=[
            "Transcribe this audio verbatim. Reply with only the transcript, no commentary.",
            genai_types.Part.from_bytes(data=wav_bytes, mime_type="audio/wav"),
        ],
    )
    user_text = (transcript.text or "").strip()
    print(f"User said: {user_text}")

    if not user_text or len(user_text) < 3:
        return

    # ---------- 2. RAG ----------
    history.append({"role": "user", "text": user_text})
    result = generate_reply(history)
    reply_text = result["text"]
    history.append({"role": "assistant", "text": reply_text})

    print(f"Agent reply: {reply_text}")

    if not reply_text.strip():
        return

    # ---------- 3. Text-to-Speech (Gemini native TTS) ----------
    print("Generating speech...")
    tts_response = generate_content_with_retries(
        model="gemini-3.1-flash-tts-preview",
        contents=reply_text,
        config=genai_types.GenerateContentConfig(
            response_modalities=["AUDIO"],
            speech_config=genai_types.SpeechConfig(
                voice_config=genai_types.VoiceConfig(
                    prebuilt_voice_config=genai_types.PrebuiltVoiceConfig(voice_name="Kore")
                )
            ),
        ),
    )
    pcm_24k = tts_response.candidates[0].content.parts[0].inline_data.data

    # Convert 24kHz PCM -> 8kHz mulaw for Twilio
    pcm_8k, _ = audioop.ratecv(pcm_24k, 2, 1, 24000, 8000, None)
    mulaw_audio = audioop.lin2ulaw(pcm_8k, 2)

    # ---------- 4. Send audio back to Twilio ----------
    # Send in 20ms chunks (160 bytes of mulaw)
    chunk_size = 160
    for i in range(0, len(mulaw_audio), chunk_size):
        chunk = mulaw_audio[i:i + chunk_size]
        media_message = {
            "event": "media",
            "streamSid": stream_sid,
            "media": {
                "payload": base64.b64encode(chunk).decode("utf-8")
            }
        }
        await websocket.send_json(media_message)
        await asyncio.sleep(0.02)  # real-time pacing

    print("Audio sent back to caller")

# ============================================================
# Run the server
# ============================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
