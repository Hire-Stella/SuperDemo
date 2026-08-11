"""
Standalone test for a Gemma model served via a Modal-hosted OpenAI-compatible
endpoint -- not wired into the fit/ or lampatron/ agents, just a quick way to
check the model responds. This workspace has Modal's proxy auth enabled, so
it needs a token (MODAL_GEMMA_TOKEN in .env) despite the app itself not
requiring one -- see the "Authorization: Bearer wk-...ws-..." combined-token
form Modal's token-creation dialog calls out for OpenAI-compatible clients.
"""

import os
import sys

from dotenv import load_dotenv
from openai import OpenAI

# Windows' default console codepage (cp1252) can't encode emoji/non-Latin-1
# text -- without this, print()-ing a reply containing either crashes with
# UnicodeEncodeError even though the API call itself succeeded.
sys.stdout.reconfigure(encoding="utf-8", errors="replace")

load_dotenv()

BASE_URL = "https://zohairmah123--ep-gemma-4-31b-it-server.eu-west.modal.direct/v1"

client = OpenAI(api_key=os.environ["MODAL_GEMMA_TOKEN"], base_url=BASE_URL)

MODEL = "google/gemma-4-31B-it"

chat_completion = client.chat.completions.create(
    model=MODEL,
    messages=[{"role": "user", "content": "Hello"}],
)

print("Model used:", MODEL)
print(chat_completion.choices[0].message.content)
print(chat_completion.usage.prompt_tokens, chat_completion.usage.completion_tokens)
