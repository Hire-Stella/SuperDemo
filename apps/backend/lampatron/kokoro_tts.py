"""
English text-to-speech via Kokoro (https://github.com/hexgrad/kokoro), run
locally -- no API key, no per-request cost, unlike Gemini's TTS. Scoped to
English only: Kokoro has no Arabic or Tagalog voices, so those replies still
go through the browser's own speechSynthesis (see voice_browser.py) instead
of this.
"""

import io

import numpy as np
import soundfile as sf
from kokoro import KPipeline

# "a" = American English. Runs on GPU (verified: torch reinstalled as a CUDA
# build for this machine's RTX 5080). Constructing this triggers a one-time
# ~340MB model download from Hugging Face Hub on first run (cached under
# ~/.cache/huggingface afterward) -- the first /tts request (or server
# startup, since this runs at import time) will be slow purely from that
# download, not from synthesis itself.
_pipeline = KPipeline(lang_code="a", device="cuda")

# One of Kokoro's higher-quality American English voices, picked to match the
# "default female voice" preference already applied to browser TTS elsewhere.
DEFAULT_VOICE = "af_heart"
SAMPLE_RATE = 24000


def _to_numpy(audio):
    # Kokoro yields torch.Tensor chunks, not numpy arrays -- np.concatenate
    # happens to convert them, but only when there's more than one chunk, so
    # short text (a single chunk) would otherwise leak a raw Tensor with no
    # .astype()/WAV-writable interface. Now that the pipeline runs on CUDA,
    # those tensors live on the GPU too -- numpy can't convert a CUDA tensor
    # directly, so it has to move to CPU first.
    if hasattr(audio, "detach"):
        return audio.detach().cpu().numpy()
    return np.asarray(audio)


def _synthesize_array(text: str, speed: float, voice: str) -> np.ndarray:
    chunks = [_to_numpy(audio) for _, _, audio in _pipeline(text, voice=voice, speed=speed)]
    return np.concatenate(chunks) if len(chunks) > 1 else chunks[0]


def synthesize(text: str, speed: float = 1.0, voice: str = DEFAULT_VOICE) -> bytes:
    """Returns mono 24kHz WAV bytes for the given English text -- for the
    browser's <audio> playback (see voice_browser.py's /tts route)."""
    audio = _synthesize_array(text, speed, voice)
    buffer = io.BytesIO()
    sf.write(buffer, audio, SAMPLE_RATE, format="WAV")
    return buffer.getvalue()


def synthesize_pcm16(text: str, speed: float = 1.0, voice: str = DEFAULT_VOICE) -> bytes:
    """Returns raw 16-bit PCM bytes at 24kHz, no WAV header -- for pipelines
    that resample/reencode themselves (e.g. Twilio phone audio, which needs
    8kHz mulaw; see voice_browser.py's /media-stream)."""
    audio = np.clip(_synthesize_array(text, speed, voice), -1.0, 1.0)
    return (audio * 32767).astype(np.int16).tobytes()
