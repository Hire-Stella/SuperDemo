import json
import time
from typing import Literal

from dotenv import load_dotenv
from google import genai
from google.genai import types as genai_types
from pydantic import BaseModel

from knowledge_data import COMPANY, PRICING_NOTE
from rag import ensure_ingested, retrieve

load_dotenv()

# Browser TTS (SpeechSynthesisUtterance) has no real emotional delivery --
# just rate/pitch/volume knobs. Having Gemini tag each reply with one of
# these lets the frontend nudge those knobs so the voice isn't flat for
# every single reply. See voice_browser.py's TONE_PRESETS for the mapping.
TONES = ["friendly", "excited", "apologetic", "calm_informative"]

# BCP-47 tags the frontend maps straight onto SpeechRecognition.lang, so voice
# input can auto-switch to whichever language the model just detected/replied
# in -- no manual language picker needed for it to keep working turn to turn.
LANGUAGES = {"en": "en-US", "ar": "ar-AE", "tl": "fil-PH"}

class AgentReply(BaseModel):
    reply: str
    tone: Literal["friendly", "excited", "apologetic", "calm_informative"]
    language: Literal["en", "ar", "tl"]

# ============================================================
# 1. RAG reply generation
# ============================================================

def generate_reply(history: list[dict]) -> dict:
    """
    Retrieves Lampatron product/FAQ context from the local Qdrant knowledge
    base and grounds the reply in it. `history` is a plain list of
    {"role": "user"|"assistant", "text": str} dicts -- see rpcagent.py's
    generate_reply() for why langchain_core.messages/LangGraph objects are
    deliberately avoided here too.

    Returns {"text": reply, "tone": one of TONES, "language": one of LANGUAGES} --
    the model tags its own emotional tone (so the frontend can vary browser TTS
    pitch/rate instead of speaking every line in the same flat delivery) and the
    language it detected/replied in (so the frontend can auto-switch
    SpeechRecognition.lang for the next voice turn without a manual picker).
    """
    latest_user_text = next(
        (turn["text"] for turn in reversed(history) if turn["role"] == "user"),
        "",
    )
    context_chunks = retrieve(embedding_client, latest_user_text) if latest_user_text else []
    context_block = (
        "\n\n".join(context_chunks) if context_chunks
        else "(nothing closely matches this message -- if it's a greeting, small talk, or "
             "thanks, that's fine, just respond naturally without needing a fact from here)"
    )

    transcript = "\n".join(
        f"{'Customer' if turn['role'] == 'user' else 'Assistant'}: {turn['text']}"
        for turn in history
    )

    prompt = f"""
    You are Stella, the warm and knowledgeable sales assistant for {COMPANY['name']}, a
    {COMPANY['business_type']} based in the UAE (website: {COMPANY['website']}).

    Talk like a real person working the floor of a lighting showroom, not a database readout:
    - Be warm, natural, and a little enthusiastic about the products -- contractions are fine,
      vary your sentence length and phrasing turn to turn, don't repeat the same structure every reply.
    - Ask a short follow-up question when it would genuinely help (their style, room size, ceiling
      height, budget) instead of just dumping a list of facts.
    - Build on what the customer already said earlier in this conversation -- refer back to it
      naturally rather than treating every message as a fresh start.
    - Handle greetings, small talk, and thanks like a person would -- you don't need a knowledge
      base fact to say "hi" back or acknowledge a compliment.
    - It's fine to gently offer an opinion or steer the conversation ("a lot of customers pick the
      RADIANT for that kind of space") as long as you don't invent hard facts.
    - You're fluent in English, Arabic, and Tagalog. Detect which one the customer is writing or
      speaking in and reply in that same language, keeping the same warm, natural tone -- then
      keep replying in that language for the rest of the conversation unless they switch first.
      The knowledge base context below is in English; translate facts naturally, don't just
      quote English text back at a non-English speaker.

    Ground every factual claim -- prices, product names, policies -- ONLY in the knowledge base
    context below. If a specific fact isn't in the context, say a team member will confirm it
    rather than guessing.
    {PRICING_NOTE}

    Keep replies conversational in length -- usually 1-4 sentences, longer only if you're genuinely
    walking through a few options.

    Knowledge base context:
    {context_block}

    Conversation so far:
    {transcript}

    Respond with a JSON object with exactly three fields:
    "reply": your reply as Stella, text only, no prefix, in the customer's detected language.
    "tone": one of {TONES} -- whichever best matches how this specific reply should sound out loud.
    "language": one of {list(LANGUAGES)} -- "en" for English, "ar" for Arabic, "tl" for Tagalog --
    whichever language your "reply" above is actually written in.
    """
    response = generate_content_with_retries(
        model="gemini-3.5-flash",
        contents=prompt,
        config=genai_types.GenerateContentConfig(
            temperature=0.8,
            response_mime_type="application/json",
            response_schema=AgentReply,
        ),
    )
    try:
        data = json.loads(response.text or "{}")
        reply_text = data.get("reply", "") or ""
        tone = data.get("tone") if data.get("tone") in TONES else "friendly"
        language = data.get("language") if data.get("language") in LANGUAGES else "en"
    except json.JSONDecodeError:
        reply_text = response.text or ""
        tone = "friendly"
        language = "en"
    return {"text": reply_text, "tone": tone, "language": language}

# Conversation memory (simple in-memory for demo)
conversation_history = []

# ============================================================
# 2. Gemini clients
# ============================================================

# Two separate clients: embed_content() followed by generate_content() with
# audio output on the SAME client instance reliably breaks the generate_content
# call ("Request has empty input") -- see rpcagent.py. Not exercised here since
# this module never makes an audio-output call, but kept consistent regardless.
genai_client = genai.Client()
embedding_client = genai.Client()

# Populate the local Qdrant knowledge base on first run; no-op afterwards.
ensure_ingested(embedding_client)

def generate_content_with_retries(retries: int = 3, **kwargs):
    for attempt in range(retries):
        try:
            return genai_client.models.generate_content(**kwargs)
        except Exception:
            if attempt == retries - 1:
                raise
            time.sleep(0.5)

# ============================================================
# 3. Text Handler (RAG in, RAG out)
# ============================================================

def text_handler(user_text: str) -> dict:
    """Runs one turn of the RAG pipeline on plain text, returns {"text": ..., "tone": ...}."""
    conversation_history.append({"role": "user", "text": user_text})
    result = generate_reply(conversation_history)
    conversation_history.append({"role": "assistant", "text": result["text"]})
    return result

def run_text_chat():
    """Interactive text in, text out -- no audio pipeline involved."""
    print(f"Text chat with the {COMPANY['name']} assistant. Type 'quit' to exit.\n")
    while True:
        user_text = input("You: ").strip()
        if user_text.lower() in ("quit", "exit"):
            break
        if not user_text:
            continue
        result = text_handler(user_text)
        print(f"Bot [{result['tone']}]: {result['text']}\n")

if __name__ == "__main__":
    run_text_chat()
