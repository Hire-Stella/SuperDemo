import json
import os
import time

from dotenv import load_dotenv
from google import genai
from openai import OpenAI

from knowledge_data import COMPANY, PRICING_NOTE
from rag import ensure_ingested, retrieve

load_dotenv()

# Browser TTS (SpeechSynthesisUtterance) has no real emotional delivery --
# just rate/pitch/volume knobs. Having the model tag each reply with one of
# these lets the frontend nudge those knobs so the voice isn't flat for
# every single reply. See voice_browser.py's TONE_PRESETS for the mapping.
TONES = ["friendly", "excited", "apologetic", "calm_informative"]

# BCP-47 tags the frontend maps straight onto SpeechRecognition.lang, so voice
# input can auto-switch to whichever language the model just detected/replied
# in -- no manual language picker needed for it to keep working turn to turn.
LANGUAGES = {"en": "en-US", "ar": "ar-AE", "tl": "fil-PH"}

# Qwen3.6 (via DeepInfra's OpenAI-compatible endpoint) handles all reply
# generation/reasoning -- Gemini is intentionally scoped to embeddings only
# right now (see embedding_client below) and is being phased out entirely.
# A plain dict rather than a pydantic-generated schema because DeepInfra's
# strict JSON schema mode requires "additionalProperties": false, which
# pydantic's auto-generated schema doesn't set by default -- verified
# against the live endpoint before wiring this in.
QWEN_MODEL = "Qwen/Qwen3.6-35B-A3B"
AGENT_REPLY_SCHEMA = {
    "type": "json_schema",
    "json_schema": {
        "name": "AgentReply",
        "schema": {
            "type": "object",
            "properties": {
                "reply": {"type": "string"},
                "tone": {"type": "string", "enum": TONES},
                "language": {"type": "string", "enum": list(LANGUAGES)},
            },
            "required": ["reply", "tone", "language"],
            "additionalProperties": False,
        },
        "strict": True,
    },
}

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
    response = generate_chat_completion_with_retries(
        retries=1,
        model=QWEN_MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.8,
        response_format=AGENT_REPLY_SCHEMA,
        # Qwen3.6 runs a hidden reasoning pass by default -- 300-450+ extra
        # completion tokens and 20-30s per reply, confirmed via direct timing
        # against this exact endpoint. This turns that off: verified this
        # specific nesting (not a flat "enable_thinking" kwarg) is what
        # actually works here.
        #
        # service_tier="priority": DeepInfra's shared pool for this model
        # was seen returning "Model busy (engine_overloaded)" 429s and, even
        # when it did respond, 100+ second replies -- confirmed this wasn't
        # our account's own rate limit (DeepInfra's default is 200 concurrent
        # requests per model; nowhere close) but genuine contention across
        # all of DeepInfra's customers for this model. Priority requests get
        # front-of-queue scheduling and stay served even while standard-tier
        # traffic is 429ing under load. Billed at 1.5x, only when priority is
        # actually delivered -- verified this model supports it (the
        # response echoes service_tier="priority" back, confirmed directly
        # before wiring this in) rather than silently falling back to
        # "default" the way unsupported models do.
        extra_body={
            "chat_template_kwargs": {"enable_thinking": False},
            "service_tier": "priority",
        },
    )
    content = response.choices[0].message.content
    try:
        data = json.loads(content or "{}")
        reply_text = data.get("reply", "") or ""
        tone = data.get("tone") if data.get("tone") in TONES else "friendly"
        language = data.get("language") if data.get("language") in LANGUAGES else "en"
    except json.JSONDecodeError:
        reply_text = content or ""
        tone = "friendly"
        language = "en"
    return {"text": reply_text, "tone": tone, "language": language}

# Conversation memory (simple in-memory for demo)
conversation_history = []

# ============================================================
# 2. Model clients -- Gemini (embeddings only, being phased out entirely)
#    and DeepInfra/Qwen (reply generation, see generate_reply() above)
# ============================================================

embedding_client = genai.Client()

# Populate the local Qdrant knowledge base on first run; no-op afterwards.
ensure_ingested(embedding_client)

# No Gemini fallback for reply generation anymore (Gemini is embeddings-only
# for now, see embedding_client above). DeepInfra's shared inference for this
# model showed real tail latency in testing (occasional 100+ second replies
# on top of the ~20-30s "thinking mode" tax already handled below) --
# reproduced live: a /chat request hung for 30+ seconds with zero response,
# which is what "stuck at loading" in the UI actually was. Without a
# fallback, a 20s timeout can't make Qwen faster, but it turns an unbounded
# hang into a request that fails predictably -- the frontend at least shows
# an error instead of spinning forever. WhatsApp/phone can still hit
# Twilio's ~15s webhook timeout before this 20s cutoff even fires.
deepinfra_client = OpenAI(
    api_key=os.environ["DEEPINFRA_API_KEY"],
    base_url="https://api.deepinfra.com/v1/openai",
    timeout=20.0,
    # The openai SDK retries timeouts internally by default (max_retries=2),
    # underneath our own retry wrapper below -- confirmed by direct timing:
    # with that default, a single "timed out" call actually took ~51s (three
    # attempts x ~20s), not the 20s the timeout value implied. This disables
    # that so our own retries=1 in generate_reply() is the only retry layer,
    # and the 20s timeout means what it says.
    max_retries=0,
)

def generate_chat_completion_with_retries(retries: int = 3, **kwargs):
    for attempt in range(retries):
        try:
            return deepinfra_client.chat.completions.create(**kwargs)
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
