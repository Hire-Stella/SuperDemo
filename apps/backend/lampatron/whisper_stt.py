"""
Speech-to-text via faster-whisper (https://github.com/SYSTRAN/faster-whisper),
run locally -- no API key, no per-request cost. Unlike Kokoro's TTS, Whisper
is genuinely multilingual, so this covers English, Arabic, and Tagalog
without needing a separate fallback path. Used for both the browser's voice
input (see voice_browser.py's /stt-stream) and phone calls (process_call_turn).
"""

import os
import tempfile

from faster_whisper import WhisperModel

# "base" balances speed and accuracy on CPU (no GPU here) -- "tiny" is
# faster but noticeably less accurate, "small" and up gets slow without a
# GPU. int8 quantization keeps CPU inference fast. device="cpu" is explicit
# because "auto" tries CUDA first and crashes here with a missing
# cublas64_12.dll rather than falling back cleanly. Loading this triggers a
# one-time model download from Hugging Face Hub on first run, cached
# afterward.
_model = WhisperModel("base", device="cpu", compute_type="int8")


def transcribe(audio_bytes: bytes) -> str:
    """Returns the transcript for the given audio (whatever container the
    browser's MediaRecorder produced -- typically webm/opus). Language is
    auto-detected from the audio itself, no hint needed."""
    with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as f:
        f.write(audio_bytes)
        temp_path = f.name
    try:
        # vad_filter=True strips non-speech audio (silence, background noise)
        # before transcribing, instead of feeding it to Whisper -- without
        # this, Whisper can "hallucinate" text on silent/near-silent clips
        # (a known behavior: it wasn't trained to reliably output nothing).
        # That's especially likely here since live captions re-transcribe
        # the growing buffer repeatedly, including moments with little or no
        # actual speech yet. condition_on_previous_text=False stops each
        # segment from being biased by the previous one, which otherwise can
        # compound a single hallucination across a longer buffer.
        segments, _info = _model.transcribe(
            temp_path,
            vad_filter=True,
            condition_on_previous_text=False,
        )
        return "".join(segment.text for segment in segments).strip()
    finally:
        os.unlink(temp_path)
