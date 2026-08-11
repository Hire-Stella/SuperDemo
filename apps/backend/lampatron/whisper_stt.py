"""
Speech-to-text via faster-whisper (https://github.com/SYSTRAN/faster-whisper),
run locally -- no API key, no per-request cost. Unlike Kokoro's TTS, Whisper
is genuinely multilingual, so this covers English, Arabic, and Tagalog
without needing a separate fallback path. Used for both the browser's voice
input (see voice_browser.py's /stt-stream) and phone calls (process_call_turn).
"""

import os
import sys
import tempfile

if os.name == "nt":
    # CTranslate2 (faster-whisper's backend) needs cuBLAS resolvable to run
    # on GPU. The nvidia-cublas-cu12 pip package installs the DLL into
    # site-packages but doesn't add that location anywhere Windows looks by
    # default. os.add_dll_directory() alone did NOT fix this -- CTranslate2
    # apparently resolves it via a plain LoadLibrary call, which only
    # honors PATH, not the newer AddDllDirectory-based search Python's API
    # uses. Prepending PATH directly is what actually works.
    #
    # cuDNN deliberately NOT added here even though nvidia-cudnn-cu12 is
    # installed: this process also imports Kokoro (torch), and torch ships
    # its own bundled cuDNN -- prepending the standalone nvidia-cudnn-cu12
    # DLL onto PATH made Kokoro pick up a mismatched cuDNN version instead
    # of torch's own, breaking it with CUDNN_STATUS_SUBLIBRARY_VERSION_MISMATCH.
    # CTranslate2's actual error was only ever about cublas, never cudnn, so
    # this isn't needed for Whisper either.
    _site_packages = os.path.join(sys.prefix, "Lib", "site-packages")
    _dll_dir = os.path.join(_site_packages, "nvidia", "cublas", "bin")
    if os.path.isdir(_dll_dir):
        os.add_dll_directory(_dll_dir)
        os.environ["PATH"] = _dll_dir + os.pathsep + os.environ["PATH"]

from faster_whisper import WhisperModel

# large-v3 (1550M params, ~10GB VRAM in float16) instead of "base" -- the
# accuracy gap between Whisper sizes widens disproportionately for
# lower-resource languages, so this helps Arabic/Tagalog more than it helps
# English. Only viable now that this runs on the RTX 5080's 16GB instead of
# CPU; distil-large-v3 was ruled out despite being much faster since the
# official distilled checkpoints are English-only, dropping Arabic/Tagalog
# entirely. Runs on GPU (verified: torch reinstalled as a CUDA build,
# ctranslate2's prebuilt wheel already ships CUDA support, both confirmed
# against this machine before this was set). float16 is CTranslate2's
# standard fast compute type for GPU. Loading this triggers a one-time
# ~3GB model download from Hugging Face Hub on first run, cached afterward.
_model = WhisperModel("large-v3", device="cuda", compute_type="float16")


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
        #
        # threshold=0.6 (Silero VAD's speech-probability cutoff, default 0.5)
        # raised because steady ambient noise -- fan/AC hum, distant chatter --
        # was passing the default threshold as "speech" and getting
        # transcribed into garbage text. This is an environment-dependent
        # knob: raise further if quiet-but-real noise still leaks through,
        # lower it if actual quiet speech starts getting cut instead.
        segments, _info = _model.transcribe(
            temp_path,
            vad_filter=True,
            vad_parameters={"threshold": 0.6},
            condition_on_previous_text=False,
        )
        return "".join(segment.text for segment in segments).strip()
    finally:
        os.unlink(temp_path)
