"""
Expose the Lampatron chat server publicly via ngrok.

Run this ALONGSIDE voice_browser.py, in a separate terminal -- it does not
start the server itself, only tunnels to whatever is already listening on
port 7862. FIT's server (port 7861) is untouched; this is Lampatron-only.

The WhatsApp webhook (see voice_browser.py's /whatsapp-webhook route) lives
in this same process/port, so this one tunnel covers both the browser page
and WhatsApp -- no separate port or tunnel needed for WhatsApp.

Run: ../.venv/Scripts/python.exe ngrok_tunnel.py
Needs NGROK_TOKEN set in apps/backend/.env.
"""

import os
import time

from dotenv import load_dotenv
from pyngrok import ngrok

load_dotenv()

PORT = 7862


def main():
    token = os.environ["NGROK_TOKEN"]
    ngrok.set_auth_token(token)

    tunnel = ngrok.connect(PORT, "http")
    print(f"Lampatron is now public at: {tunnel.public_url}")
    print(f"(forwarding to http://127.0.0.1:{PORT} -- make sure voice_browser.py is running there)")
    print("Press Ctrl+C to stop the tunnel.")

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nStopping tunnel...")
        ngrok.disconnect(tunnel.public_url)
        ngrok.kill()


if __name__ == "__main__":
    main()
