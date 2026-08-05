import time

from dotenv import load_dotenv
from google import genai

from knowledge_data import PRICING_NOTE
from rag import ensure_ingested, retrieve

load_dotenv()

# ============================================================
# 1. RAG reply generation
# ============================================================

def generate_reply(history: list[dict]) -> str:
    """
    Retrieves FIT Institute course/FAQ context from the local Qdrant
    knowledge base and grounds the reply in it.

    Deliberately avoids langchain_core.messages (HumanMessage/AIMessage) and
    LangGraph entirely: constructing those objects anywhere in the process --
    even via langchain_google_genai's ChatGoogleGenerativeAI, even via a
    single-node LangGraph StateGraph never combined with a chat call directly
    -- reliably corrupts a LATER, unrelated genai.Client().models.generate_content()
    call made for audio output (TTS), breaking it with "Request has empty
    input". Confirmed by extensive isolated repro; plain strings/dicts for
    conversation history removes the corruption entirely. `history` here is a
    plain list of {"role": "user"|"assistant", "text": str} dicts.
    """
    latest_user_text = next(
        (turn["text"] for turn in reversed(history) if turn["role"] == "user"),
        "",
    )
    context_chunks = retrieve(embedding_client, latest_user_text) if latest_user_text else []
    context_block = "\n\n".join(context_chunks) if context_chunks else "(no matching knowledge base entry)"

    transcript = "\n".join(
        f"{'Caller' if turn['role'] == 'user' else 'Assistant'}: {turn['text']}"
        for turn in history
    )

    prompt = f"""
    You are a helpful voice assistant for FIT Institute, a KHDA-approved training provider in Dubai.
    Answer using ONLY the knowledge base context below. If the answer isn't in the context,
    say an advisor will confirm it rather than guessing.
    {PRICING_NOTE}
    Keep answers short and natural for a phone conversation (1-3 sentences max).

    Knowledge base context:
    {context_block}

    Conversation so far:
    {transcript}

    Respond as Assistant with only your reply text, no prefix.
    """
    response = generate_content_with_retries(model="gemini-3.5-flash", contents=prompt)
    return response.text or ""

# Conversation memory (simple in-memory for demo)
conversation_history = []

# ============================================================
# 2. Gemini clients
# ============================================================

# Two separate clients: embed_content() followed by generate_content() with
# audio output on the SAME client instance reliably breaks the generate_content
# call ("Request has empty input"), so embeddings get a dedicated client.
genai_client = genai.Client()
embedding_client = genai.Client()

# Populate the local Qdrant knowledge base on first run; no-op afterwards.
ensure_ingested(embedding_client)

def generate_content_with_retries(retries: int = 3, **kwargs):
    # Gemini calls occasionally come back with a spurious error (empty-input,
    # 503 high demand); retrying the same request has reliably succeeded.
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

def text_handler(user_text: str) -> str:
    """
    Runs one turn of the RAG pipeline on plain text and returns the reply as
    plain text. Shared by the browser voice pipeline, the Twilio pipeline
    (voiceagent.py), and text-only mode.
    """
    conversation_history.append({"role": "user", "text": user_text})
    reply_text = generate_reply(conversation_history)
    conversation_history.append({"role": "assistant", "text": reply_text})
    return reply_text

def run_text_chat():
    """Interactive text in, text out -- no audio pipeline involved."""
    print("Text chat with the FIT Institute assistant. Type 'quit' to exit.\n")
    while True:
        user_text = input("You: ").strip()
        if user_text.lower() in ("quit", "exit"):
            break
        if not user_text:
            continue
        print(f"Bot: {text_handler(user_text)}\n")

if __name__ == "__main__":
    run_text_chat()
