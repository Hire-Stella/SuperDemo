"""
Standalone test for Qwen3.6 via DeepInfra's OpenAI-compatible endpoint --
not wired into the fit/ or lampatron/ agents, just a quick way to check the
model responds. Needs DEEPINFRA_API_KEY set in apps/backend/.env.
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

client = OpenAI(
    api_key=os.environ["DEEPINFRA_API_KEY"],
    base_url="https://api.deepinfra.com/v1/openai",
)

chat_completion = client.chat.completions.create(
    model="Qwen/Qwen3.6-35B-A3B",
    messages=[{"role": "user", "content": "Hello"}],
)

print(chat_completion.choices[0].message.content)
print(chat_completion.usage.prompt_tokens, chat_completion.usage.completion_tokens)
